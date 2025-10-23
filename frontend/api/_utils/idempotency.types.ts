/**
 * Type definitions for idempotency layer
 *
 * Provides type safety for idempotency caching operations.
 * Supports Redis-backed request deduplication with SHA-256 body hashing.
 *
 * @module idempotency.types
 */

import type { IncomingMessage } from 'http';

/**
 * Represents a JSON-serializable value
 * Used for request/response bodies that can be stored in cache
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Generic JSON object structure
 * Used for request bodies and response data
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Result of an idempotency cache check
 *
 * - 'miss': No cached entry found, proceed with request
 * - 'hit': Cached entry found with matching body hash, replay response
 * - 'conflict': Cached entry found but body hash mismatch, return 409
 */
export interface IdempotencyResult {
  type: 'miss' | 'hit' | 'conflict';
  cachedResponse?: JsonValue;
}

/**
 * Cached idempotency entry stored in Redis
 *
 * Contains the body hash, response, and timestamp for TTL management
 */
export interface IdempotencyCacheEntry {
  bodyHash: string;
  response: JsonValue;
  timestamp: number;
}

/**
 * HTTP request with optional headers
 * Used for type-safe header extraction
 */
export interface RequestWithHeaders extends IncomingMessage {
  headers: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Result of hasCachedSuccess check
 *
 * - 'miss': No cache entry
 * - 'replay': Cache hit, return cached response
 * - 'conflict': Cache conflict, return 409
 */
export interface CachedSuccessResult {
  hit: 'miss' | 'replay' | 'conflict';
  response?: JsonValue;
}
