import { createHash } from 'crypto';
import { getRedisClient } from './redis.js';
import { buildProblem, PROBLEM_TYPES } from './problem.js';
import type { ServerResponse } from 'http';

const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '60', 10);

export interface IdempotencyResult {
  type: 'miss' | 'hit' | 'conflict';
  cachedResponse?: any;
}

/**
 * Canonicalize JSON object for stable hashing (sorted keys)
 */
function canonicalizeJson(obj: any): string {
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
export function hashBody(body: any): string {
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

    const entry = typeof cached === 'string' ? JSON.parse(cached) : cached;

    // Check if body hash matches
    if (entry.bodyHash === bodyHash) {
      return {
        type: 'hit',
        cachedResponse: entry.response
      };
    } else {
      return { type: 'conflict' };
    }
  } catch (error) {
    console.error('[Idempotency] Check failed:', error);
    return { type: 'miss' }; // Fail open
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
  response: any
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getCacheKey(method, path, idempotencyKey);
    const entry = {
      bodyHash,
      response,
      timestamp: Date.now()
    };

    await redis.set(key, JSON.stringify(entry), { ex: TTL_SECONDS });
  } catch (error) {
    console.error('[Idempotency] Cache failed:', error);
    // Don't throw - caching failure shouldn't block response
  }
}

export function sendIdempotencyConflict(res: ServerResponse, host: string): void {
  const problem = buildProblem({
    type: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.type,
    title: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.title,
    status: PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT.status,
    detail: 'The Idempotency-Key has been used with a different request body. Use a new key or wait 60 seconds for the cache to expire.'
  });

  res.statusCode = 409;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}

/**
 * Get Idempotency-Key from request headers
 */
export function getIdempotencyKey(req: any): string | undefined {
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
): Promise<{ hit: 'miss' | 'replay' | 'conflict'; response?: any }> {
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
  response: any
): Promise<void> {
  return cacheResponse(method, path, idempotencyKey, bodyHash, response);
}