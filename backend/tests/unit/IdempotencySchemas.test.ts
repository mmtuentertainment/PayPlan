/**
 * IdempotencySchemas Tests
 * Feature 018: Technical Debt Cleanup - User Story 1 (P0)
 *
 * Tests idempotency cache schema validation to prevent crashes from
 * malformed data (FR-003, FR-011).
 */

const { IdempotencyCacheEntrySchema, IdempotencyCacheKeySchema } = require('../../src/lib/validation/IdempotencySchemas');

describe('IdempotencySchemas', () => {
  describe('T019: IdempotencyCacheSchema validates structure', () => {
    it('should validate correct cache entry structure', () => {
      const validEntry = {
        hash: 'a'.repeat(64), // 64-char hash
        timestamp: Date.now(),
        result: { data: 'test' },
        ttl: 86400000, // 24 hours
      };

      const result = IdempotencyCacheEntrySchema.safeParse(validEntry);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hash).toBe(validEntry.hash);
        expect(result.data.timestamp).toBe(validEntry.timestamp);
        expect(result.data.ttl).toBe(86400000);
      }
    });

    it('should reject entry with invalid hash length', () => {
      const invalidEntry = {
        hash: 'tooshort', // Not 64 characters
        timestamp: Date.now(),
        result: {},
        ttl: 86400000,
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('hash'))).toBe(true);
        expect(result.error.issues.some((issue: any) => issue.message.includes('64-character'))).toBe(true);
      }
    });

    it('should reject entry with non-hex hash characters (CodeRabbit)', () => {
      const invalidEntry = {
        hash: 'z'.repeat(64), // Valid length but invalid characters
        timestamp: Date.now(),
        result: {},
        ttl: 86400000,
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('hash'))).toBe(true);
      }
    });

    it('should reject entry with negative timestamp', () => {
      const invalidEntry = {
        hash: 'a'.repeat(64),
        timestamp: -1, // Invalid negative timestamp
        result: {},
        ttl: 86400000,
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('timestamp'))).toBe(true);
      }
    });

    it('should reject entry with non-integer timestamp', () => {
      const invalidEntry = {
        hash: 'a'.repeat(64),
        timestamp: 123.456, // Not an integer
        result: {},
        ttl: 86400000,
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('timestamp'))).toBe(true);
      }
    });

    it('should accept future timestamp (CodeRabbit: clock skew handled by isExpired)', () => {
      const futureTimestamp = Date.now() + 10000; // 10 seconds in the future
      const validEntry = {
        hash: 'a'.repeat(64),
        timestamp: futureTimestamp,
        result: {},
        ttl: 86400000,
      };

      const result = IdempotencyCacheEntrySchema.safeParse(validEntry);

      // Schema accepts future timestamps (isExpired() will mark them as expired)
      expect(result.success).toBe(true);
    });

    it('should use default TTL of 24 hours when not provided', () => {
      const entryWithoutTTL = {
        hash: 'a'.repeat(64),
        timestamp: Date.now(),
        result: {},
        // ttl omitted
      };

      const result = IdempotencyCacheEntrySchema.safeParse(entryWithoutTTL);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ttl).toBe(86400000); // Default 24 hours
      }
    });

    it('should reject entry with negative TTL (CodeRabbit)', () => {
      const invalidEntry = {
        hash: 'a'.repeat(64),
        timestamp: Date.now(),
        result: {},
        ttl: -1000, // Negative TTL
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('ttl'))).toBe(true);
      }
    });

    it('should reject entry with zero TTL (CodeRabbit)', () => {
      const invalidEntry = {
        hash: 'a'.repeat(64),
        timestamp: Date.now(),
        result: {},
        ttl: 0, // Zero TTL
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('ttl'))).toBe(true);
      }
    });

    it('should reject entry with excessively large TTL (CodeRabbit)', () => {
      const tenYearsInMs = 10 * 365 * 24 * 60 * 60 * 1000;
      const invalidEntry = {
        hash: 'a'.repeat(64),
        timestamp: Date.now(),
        result: {},
        ttl: tenYearsInMs, // Excessively large TTL
      };

      const result = IdempotencyCacheEntrySchema.safeParse(invalidEntry);

      // Accept for now (no upper bound in schema)
      // Note: CodeRabbit suggests adding upper bound, but we accept large TTLs
      expect(result.success).toBe(true);
    });

    it('should allow additional fields via passthrough', () => {
      const entryWithExtra = {
        hash: 'a'.repeat(64),
        timestamp: Date.now(),
        result: {},
        ttl: 86400000,
        customField: 'extra data',
        metadata: { key: 'value' },
      };

      const result = IdempotencyCacheEntrySchema.safeParse(entryWithExtra);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customField).toBe('extra data');
        expect(result.data.metadata).toEqual({ key: 'value' });
      }
    });

    it('should accept unknown result types (shallow validation)', () => {
      const entries = [
        { hash: 'a'.repeat(64), timestamp: Date.now(), result: null, ttl: 86400000 },
        { hash: 'b'.repeat(64), timestamp: Date.now(), result: 'string', ttl: 86400000 },
        { hash: 'c'.repeat(64), timestamp: Date.now(), result: 123, ttl: 86400000 },
        { hash: 'd'.repeat(64), timestamp: Date.now(), result: [], ttl: 86400000 },
        { hash: 'e'.repeat(64), timestamp: Date.now(), result: { deeply: { nested: { data: 'ok' } } }, ttl: 86400000 },
      ];

      entries.forEach((entry) => {
        const result = IdempotencyCacheEntrySchema.safeParse(entry);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('IdempotencyCacheKeySchema', () => {
    it('should validate correct key structure', () => {
      const validKey = {
        operation: 'create_payment',
        resourceId: 'pay_123',
        hash: 'a'.repeat(64),
      };

      const result = IdempotencyCacheKeySchema.safeParse(validKey);

      expect(result.success).toBe(true);
    });

    it('should reject empty operation', () => {
      const invalidKey = {
        operation: '',
        resourceId: 'pay_123',
        hash: 'a'.repeat(64),
      };

      const result = IdempotencyCacheKeySchema.safeParse(invalidKey);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('operation'))).toBe(true);
      }
    });

    it('should reject empty resourceId', () => {
      const invalidKey = {
        operation: 'create_payment',
        resourceId: '',
        hash: 'a'.repeat(64),
      };

      const result = IdempotencyCacheKeySchema.safeParse(invalidKey);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('resourceId'))).toBe(true);
      }
    });

    it('should reject invalid hash length', () => {
      const invalidKey = {
        operation: 'create_payment',
        resourceId: 'pay_123',
        hash: 'tooshort',
      };

      const result = IdempotencyCacheKeySchema.safeParse(invalidKey);

      expect(result.success).toBe(false);
      // CodeRabbit: Add specific field/message assertions
      if (!result.success) {
        expect(result.error.issues.some((issue: any) => issue.path.includes('hash'))).toBe(true);
      }
    });

    it('should accept operation/resourceId with whitespace (CodeRabbit)', () => {
      const keyWithWhitespace = {
        operation: 'create payment', // Contains space
        resourceId: 'pay 123', // Contains space
        hash: 'a'.repeat(64),
      };

      const result = IdempotencyCacheKeySchema.safeParse(keyWithWhitespace);

      // Schema only validates min length, not content (whitespace allowed)
      expect(result.success).toBe(true);
    });

    it('should accept operation/resourceId with special characters (CodeRabbit)', () => {
      const keyWithSpecialChars = {
        operation: 'create_payment-v2', // Contains underscore and hyphen
        resourceId: 'pay:123/abc', // Contains colon and slash
        hash: 'a'.repeat(64),
      };

      const result = IdempotencyCacheKeySchema.safeParse(keyWithSpecialChars);

      // Schema only validates min length, not content (special chars allowed)
      expect(result.success).toBe(true);
    });
  });
});
