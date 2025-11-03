import { createHash } from 'crypto';
import { getRedisClient } from './redis.js';
import { buildProblem, PROBLEM_TYPES } from './problem.js';
import type { ServerResponse } from 'http';
import type {
  JsonValue,
  IdempotencyResult,
  IdempotencyCacheEntry,
  RequestWithHeaders,
  CachedSuccessResult
} from './idempotency.types.js';
import { validateCacheEntry } from './validation/IdempotencySchemas.js';

// FR-005: 24-hour TTL for duplicate prevention (86400 seconds)
const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10);

export type { IdempotencyResult, CachedSuccessResult } from './idempotency.types.js';

/**
 * Canonicalize JSON object for stable hashing (sorted keys)
 */
function canonicalizeJson(obj: JsonValue): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `"${k}":${canonicalizeJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Generate SHA-256 hash of request body
 */
export function hashBody(body: JsonValue): string {
  const canonical = canonicalizeJson(body);
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Generate idempotency cache key
 */
function getCacheKey(method: string, path: string, idempotencyKey: string): string {
  return `idem:${method}:${path}:${idempotencyKey}`;
}

/**
 * Check idempotency cache
 */
export async function checkIdempotency(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string
): Promise<IdempotencyResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { type: 'miss' };
  }

  try {
    const key = getCacheKey(method, path, idempotencyKey);
    const cached = await redis.get(key);

    if (!cached) {
      return { type: 'miss' };
    }

    // FR-003: Validate cache entry before use to prevent crashes from malformed data
    const parsedCache = typeof cached === 'string' ? JSON.parse(cached) as unknown : cached;

    // Validate with Zod schema (throws if invalid)
    const entry = validateCacheEntry({
      hash: parsedCache?.bodyHash,
      timestamp: parsedCache?.timestamp,
      result: parsedCache?.response,
      ttl: parsedCache?.ttl || TTL_SECONDS * 1000
    }) as IdempotencyCacheEntry & { hash: string; timestamp: number; result: unknown; ttl: number };

    // Check if body hash matches
    if (entry.hash === bodyHash) {
      return {
        type: 'hit',
        cachedResponse: entry.result
      };
    } else {
      return { type: 'conflict' };
    }
  } catch (error: unknown) {
    // FR-004: Fail-closed pattern - abort operation on validation failure
    console.error('[Idempotency] Check failed (validation error):', error);
    throw new Error('Idempotency check failed: cache validation error');
  }
}

/**
 * Store response in idempotency cache
 */
export async function cacheResponse(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string,
  response: JsonValue
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getCacheKey(method, path, idempotencyKey);
    const entry: IdempotencyCacheEntry = {
      bodyHash,
      response,
      timestamp: Date.now()
    };

    await redis.set(key, JSON.stringify(entry), { ex: TTL_SECONDS });
  } catch (error: unknown) {
    console.error('[Idempotency] Cache failed:', error);
    // Don't throw - caching failure shouldn't block response
  }
}

export function sendIdempotencyConflict(res: ServerResponse, _host: string): void { // eslint-disable-line @typescript-eslint/no-unused-vars
  const problem = buildProblem({
    type: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.type,
    title: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.title,
    status: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.status,
    detail: 'The Idempotency-Key has been used with a different request body. Use a new key or wait 24 hours for the cache to expire.'
  });

  res.statusCode = 409;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}

/**
 * Get Idempotency-Key from request headers
 */
export function getIdempotencyKey(req: RequestWithHeaders): string | undefined {
  const key = req.headers?.['idempotency-key'];
  if (!key) return undefined;
  return Array.isArray(key) ? key[0] : key;
}

/**
 * Compute SHA-256 hash of request body (wrapper for hashBody)
 */
export async function computeBodyHash(canonical: string): Promise<string> {
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Check if we have a cached success response
 */
export async function hasCachedSuccess(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string
): Promise<CachedSuccessResult> {
  const result = await checkIdempotency(method, path, idempotencyKey, bodyHash);

  if (result.type === 'hit') {
    return { hit: 'replay', response: result.cachedResponse };
  }
  if (result.type === 'conflict') {
    return { hit: 'conflict' };
  }
  return { hit: 'miss' };
}

/**
 * Wrapper for cacheResponse with cleaner signature
 */
export async function cacheSuccess(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string,
  response: JsonValue
): Promise<void> {
  return cacheResponse(method, path, idempotencyKey, bodyHash, response);
}