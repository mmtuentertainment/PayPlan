/**
 * PiiSanitizer Tests
 * Feature 018: Technical Debt Cleanup - User Story 3 (P2)
 *
 * Tests PII field removal from cache objects to prevent sensitive
 * data leakage (FR-013, Tasks T053-T057).
 */

const { PiiSanitizer } = require('../../src/lib/security/PiiSanitizer');

describe('PiiSanitizer', () => {
  let sanitizer: any;

  beforeEach(() => {
    sanitizer = new PiiSanitizer();
  });

  describe('T054: removes common PII fields', () => {
    it('should remove email field', () => {
      const input = { email: 'user@example.com', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('email');
    });

    it('should remove name field', () => {
      const input = { name: 'John Doe', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('name');
    });

    it('should remove phone field', () => {
      const input = { phone: '555-1234', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('phone');
    });

    it('should remove address field', () => {
      const input = { address: '123 Main St', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('address');
    });

    it('should remove ssn field', () => {
      const input = { ssn: '123-45-6789', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('ssn');
    });

    it('should remove multiple PII fields at once', () => {
      const input = {
        email: 'user@example.com',
        name: 'John Doe',
        phone: '555-1234',
        amount: 100,
        timestamp: '2025-10-24',
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        amount: 100,
        timestamp: '2025-10-24',
      });
    });
  });

  describe('T055: handles nested PII fields', () => {
    it('should remove nested email (userEmail)', () => {
      const input = {
        user: {
          userEmail: 'user@example.com',
          userId: '123',
        },
        amount: 100,
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        user: {
          userId: '123',
        },
        amount: 100,
      });
      expect(result.user).not.toHaveProperty('userEmail');
    });

    it('should remove nested address (billingAddress)', () => {
      const input = {
        billing: {
          billingAddress: '123 Main St',
          billingId: 'B001',
        },
        amount: 100,
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        billing: {
          billingId: 'B001',
        },
        amount: 100,
      });
      expect(result.billing).not.toHaveProperty('billingAddress');
    });

    it('should handle deeply nested PII', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              email: 'deep@example.com',
              data: 'keep this',
            },
          },
        },
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              data: 'keep this',
            },
          },
        },
      });
    });

    it('should handle PII in arrays of objects', () => {
      const input = {
        users: [
          { id: 1, email: 'user1@example.com' },
          { id: 2, email: 'user2@example.com' },
        ],
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        users: [{ id: 1 }, { id: 2 }],
      });
    });
  });

  describe('T056: preserves non-PII fields', () => {
    it('should preserve all non-PII fields', () => {
      const input = {
        id: 'payment-123',
        amount: 100,
        currency: 'USD',
        timestamp: 1698172800000,
        status: 'completed',
        metadata: {
          source: 'web',
          version: '1.0',
        },
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual(input);
    });

    it('should preserve complex nested structures without PII', () => {
      const input = {
        transaction: {
          id: 'txn-456',
          details: {
            amount: 100,
            items: [
              { sku: 'ITEM-1', quantity: 2 },
              { sku: 'ITEM-2', quantity: 1 },
            ],
          },
        },
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual(input);
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({});
    });

    it('should handle null values', () => {
      const input = { data: null, amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ data: null, amount: 100 });
    });
  });

  describe('T057: uses structural sharing (no clone if no PII)', () => {
    it('should return same reference when no PII found', () => {
      const input = {
        id: 'payment-123',
        amount: 100,
      };
      const result = sanitizer.sanitize(input);
      expect(result).toBe(input); // Same reference
    });

    it('should return new reference when PII found', () => {
      const input = {
        id: 'payment-123',
        email: 'user@example.com',
        amount: 100,
      };
      const result = sanitizer.sanitize(input);
      expect(result).not.toBe(input); // Different reference
      expect(result).toEqual({
        id: 'payment-123',
        amount: 100,
      });
    });

    it('should return same reference for nested objects without PII', () => {
      const nested = { amount: 100 };
      const input = { transaction: nested };
      const result = sanitizer.sanitize(input);
      expect(result).toBe(input);
      expect(result.transaction).toBe(nested);
    });

    it('should preserve references for non-PII nested objects when sibling has PII', () => {
      const cleanNested = { amount: 100 };
      const input = {
        email: 'user@example.com', // PII at root
        transaction: cleanNested, // Clean nested object
      };
      const result = sanitizer.sanitize(input);
      expect(result).not.toBe(input);
      expect(result.transaction).toBe(cleanNested); // Nested reference preserved
    });
  });

  describe('edge cases', () => {
    it('should handle primitive values', () => {
      expect(sanitizer.sanitize('string')).toBe('string');
      expect(sanitizer.sanitize(123)).toBe(123);
      expect(sanitizer.sanitize(true)).toBe(true);
      expect(sanitizer.sanitize(null)).toBe(null);
      expect(sanitizer.sanitize(undefined)).toBe(undefined);
    });

    it('should handle arrays of primitives', () => {
      const input = [1, 2, 3];
      const result = sanitizer.sanitize(input);
      expect(result).toBe(input);
    });

    it('should handle mixed case PII field names', () => {
      const input = {
        Email: 'user@example.com', // Capital E
        PHONE: '555-1234', // All caps
        amount: 100,
      };
      const result = sanitizer.sanitize(input);
      // Should be case-insensitive
      expect(result).toEqual({ amount: 100 });
    });

    it('should document circular reference limitation', () => {
      const input: any = { id: 1, amount: 100 };
      input.self = input; // Circular reference

      // Limitation: Circular references will cause stack overflow
      // This is acceptable because cache data should be JSON-serializable
      // JSON-serializable data cannot contain circular references
      // Document this as a known limitation
      expect(() => sanitizer.sanitize(input)).toThrow(RangeError);
    });
  });
});
