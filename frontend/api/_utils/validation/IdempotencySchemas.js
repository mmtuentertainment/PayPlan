/**
 * Idempotency Cache Schemas
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Runtime validation for idempotency cache entries to prevent crashes
 * from malformed data (FR-003, FR-011).
 *
 * Per Research Decision 2: Use shallow Zod validation with .passthrough()
 * for <1ms performance overhead.
 */

const { z } = require('zod');

/**
 * Constants
 */
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 86400000ms = 24 hours (FR-005)
const SHA256_HEX_REGEX = /^[0-9a-fA-F]{64}$/; // 64-character hexadecimal pattern

/**
 * IdempotencyCacheKeySchema
 *
 * Validates cache key structure for idempotency operations.
 * CodeRabbit: Enforce hexadecimal validation for SHA-256 hashes.
 */
const IdempotencyCacheKeySchema = z.object({
  operation: z.string().min(1),
  resourceId: z.string().min(1),
  hash: z.string().regex(SHA256_HEX_REGEX, 'Hash must be a 64-character hexadecimal SHA-256 hash'),
});

/**
 * IdempotencyCacheEntrySchema
 *
 * Validates cache entry structure with:
 * - 64-character hexadecimal SHA-256 hash (CodeRabbit)
 * - Positive integer timestamp (milliseconds since epoch)
 * - Unknown result type (not deeply validated for performance)
 * - TTL defaulting to 86400000ms (24 hours) per FR-005
 * - .passthrough() to allow additional fields without validation
 *
 * Performance target: <1ms validation time
 */
const IdempotencyCacheEntrySchema = z.object({
  hash: z.string().regex(SHA256_HEX_REGEX, 'Hash must be a 64-character hexadecimal SHA-256 hash'), // CodeRabbit
  timestamp: z.number().positive().int(), // Unix timestamp in milliseconds
  result: z.unknown(), // Cached response (not deeply validated)
  ttl: z.number().positive().int().default(DEFAULT_TTL), // 24 hours in ms (FR-005)
}).passthrough(); // Allow additional fields without validation

/**
 * Helper Functions
 */

/**
 * Validates a cache entry and returns parsed result.
 * Throws error if validation fails (treat as cache miss).
 *
 * @param {unknown} entry - Cache entry to validate
 * @returns {Object} Validated cache entry
 * @throws {Error} If validation fails
 */
function validateCacheEntry(entry) {
  const result = IdempotencyCacheEntrySchema.safeParse(entry);

  if (!result.success) {
    // Preserve Zod validation details for debugging (CodeRabbit)
    const error = new Error('Invalid cache entry format');
    error.validationErrors = result.error.errors;
    throw error;
  }

  return result.data;
}

/**
 * Checks if cache entry has expired based on TTL.
 * Handles future timestamps (clock skew) and inclusive TTL comparison.
 *
 * @param {Object} entry - Validated cache entry
 * @returns {boolean} True if expired (CodeRabbit)
 */
function isExpired(entry) {
  const age = Date.now() - entry.timestamp;

  // Guard against clock skew: future timestamps are expired
  if (age < 0) {
    return true;
  }

  // Inclusive comparison: entry at exactly TTL is expired
  return age >= entry.ttl;
}

/**
 * Creates a new cache entry with defaults.
 *
 * @param {string} hash - SHA-256 hash
 * @param {unknown} result - Response to cache
 * @param {number} [ttl] - Custom TTL (defaults to 24 hours)
 * @returns {Object} Cache entry
 */
function createCacheEntry(hash, result, ttl = DEFAULT_TTL) {
  return {
    hash,
    timestamp: Date.now(),
    result,
    ttl,
  };
}

module.exports = {
  IdempotencyCacheKeySchema,
  IdempotencyCacheEntrySchema,
  DEFAULT_TTL,
  validateCacheEntry,
  isExpired,
  createCacheEntry,
};
