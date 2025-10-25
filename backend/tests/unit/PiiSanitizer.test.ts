/**
 * PiiSanitizer Tests
 * Feature 018: Technical Debt Cleanup - User Story 3 (P2)
 *
 * Tests PII field removal from cache objects to prevent sensitive
 * data leakage (FR-013, Tasks T053-T057).
 */

// Use require for CommonJS interop (backend uses .js files)
const { PiiSanitizer } = require('../../src/lib/security/PiiSanitizer');
const { performance } = require('perf_hooks'); // Node.js performance API for cross-platform compatibility

// Import type for type safety
import type { PiiSanitizer as PiiSanitizerType } from '../../src/lib/security/PiiSanitizer';

// Dummy value for security scanner hygiene - tests field name detection, not value validation
const DUMMY_SECRET = 'REDACTED_TEST_VALUE';

/**
 * Test Helper Functions
 * Feature 019: PII Pattern Refinement - Task T004
 */

/**
 * Helper to verify a field is NOT sanitized (preserved in output)
 */
function expectFieldPreserved(
  sanitizer: PiiSanitizerType,
  fieldName: string,
  fieldValue: any = 'test-value'
): void {
  const input = { [fieldName]: fieldValue, id: '123' };
  const result = sanitizer.sanitize(input);
  expect(result).toHaveProperty(fieldName);
  expect(result[fieldName]).toBe(fieldValue);
}

/**
 * Helper to verify a field IS sanitized (removed from output)
 */
function expectFieldSanitized(
  sanitizer: PiiSanitizerType,
  fieldName: string,
  fieldValue: any = 'test-value'
): void {
  const input = { [fieldName]: fieldValue, id: '123' };
  const result = sanitizer.sanitize(input);
  expect(result).not.toHaveProperty(fieldName);
  expect(result).toHaveProperty('id');
}

/**
 * Helper to measure sanitization performance and return sample timings.
 * CodeRabbit fix (Issue 2): Return individual samples for percentile-based checking.
 */
function measurePerformance(
  sanitizer: PiiSanitizerType,
  data: any,
  iterations: number = 1000
): number[] {
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    sanitizer.sanitize(data);
    const duration = performance.now() - start;
    samples.push(duration);
  }
  return samples;
}

/**
 * Calculate percentile from sorted array of samples.
 * CodeRabbit fix (Issue 2): Percentile-based performance checking.
 * CodeRabbit fix (Issue 3): Copy input array to avoid mutation.
 *
 * @param samples - Array of timing samples (will NOT be mutated)
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at the given percentile
 */
function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) {
    return 0;
  }

  // Copy array to avoid mutating caller's data
  const sorted = samples.slice().sort((a, b) => a - b);

  // Calculate index (linear interpolation between closest ranks)
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

describe('PiiSanitizer', () => {
  let sanitizer: PiiSanitizerType;

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

    // Financial PII fields (CodeRabbit: critical for BNPL context)
    it('should remove cardNumber field', () => {
      const input = { cardNumber: '4111111111111111', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('cardNumber');
    });

    it('should remove card field', () => {
      const input = { card: '4111111111111111', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('card');
    });

    it('should remove cvv field', () => {
      const input = { cvv: '123', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('cvv');
    });

    it('should remove bankAccount field', () => {
      const input = { bankAccount: '123456789', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('bankAccount');
    });

    it('should remove routing field', () => {
      const input = { routing: '021000021', amount: 100 };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({ amount: 100 });
      expect(result).not.toHaveProperty('routing');
    });

    it('should remove multiple financial PII fields together', () => {
      const input = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiry: '12/25',
        bankAccount: '123456789',
        routing: '021000021',
        amount: 100,
        currency: 'USD',
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        amount: 100,
        currency: 'USD',
      });
      expect(result).not.toHaveProperty('cardNumber');
      expect(result).not.toHaveProperty('cvv');
      expect(result).not.toHaveProperty('expiry');
      expect(result).not.toHaveProperty('bankAccount');
      expect(result).not.toHaveProperty('routing');
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

  /**
   * Feature 019: User Story 1 - False Positive Prevention (P1)
   * Tasks T007-T026: Word boundary detection tests
   *
   * EXPECTED: These tests should FAIL initially (current implementation uses substring matching)
   * After implementing word boundary regex, these tests should PASS
   */
  describe('US1: False Positive Prevention - Word Boundary Detection', () => {
    describe('fields that should NOT be sanitized (false positives with old implementation)', () => {
      it('T007: should NOT sanitize filename field', () => {
        expectFieldPreserved(sanitizer, 'filename', 'report.csv');
      });

      it('T008: should NOT sanitize accountId field', () => {
        expectFieldPreserved(sanitizer, 'accountId', 'ACC_12345');
      });

      it('T009: should NOT sanitize accountType field', () => {
        expectFieldPreserved(sanitizer, 'accountType', 'savings');
      });

      it('T010: should NOT sanitize dashboardUrl field', () => {
        expectFieldPreserved(sanitizer, 'dashboardUrl', '/analytics/dashboard');
      });

      it('T011: should NOT sanitize dashboard field', () => {
        expectFieldPreserved(sanitizer, 'dashboard', 'admin-panel');
      });

      it('T012: should NOT sanitize discard field', () => {
        expectFieldPreserved(sanitizer, 'discard', 'false');
      });

      it('T013: should NOT sanitize zipCode field', () => {
        expectFieldPreserved(sanitizer, 'zipCode', '12345');
      });

      it('T014: should NOT sanitize zip field', () => {
        expectFieldPreserved(sanitizer, 'zip', '67890');
      });

      it('T015: should NOT sanitize hostname field', () => {
        expectFieldPreserved(sanitizer, 'hostname', 'server-01.example.com');
      });

      it('T016: should NOT sanitize username field (no boundary between user and name)', () => {
        expectFieldPreserved(sanitizer, 'username', 'johndoe');
      });
    });

    describe('fields that SHOULD be sanitized (word boundary matches)', () => {
      it('T017: should sanitize standalone name field', () => {
        expectFieldSanitized(sanitizer, 'name', 'John Doe');
      });

      it('T018: should sanitize userName field (camelCase boundary)', () => {
        expectFieldSanitized(sanitizer, 'userName', 'johndoe');
      });

      it('T019: should sanitize user_name field (snake_case boundary)', () => {
        expectFieldSanitized(sanitizer, 'user_name', 'johndoe');
      });

      it('T020: should sanitize firstName field (camelCase boundary)', () => {
        expectFieldSanitized(sanitizer, 'firstName', 'John');
      });

      it('T021: should sanitize first_name field (snake_case boundary)', () => {
        expectFieldSanitized(sanitizer, 'first_name', 'John');
      });

      it('T022: should sanitize standalone account field', () => {
        expectFieldSanitized(sanitizer, 'account', '123456789');
      });

      it('T023: should sanitize bankAccount field (camelCase boundary)', () => {
        expectFieldSanitized(sanitizer, 'bankAccount', '123456789');
      });

      it('T024: should sanitize bank_account field (snake_case boundary)', () => {
        expectFieldSanitized(sanitizer, 'bank_account', '123456789');
      });

      it('T025: should sanitize standalone card field', () => {
        expectFieldSanitized(sanitizer, 'card', '4111111111111111');
      });

      it('T026: should sanitize cardNumber field (camelCase boundary)', () => {
        expectFieldSanitized(sanitizer, 'cardNumber', '4111111111111111');
      });
    });
  });

  /**
   * Feature 019: User Story 2 - Authentication Secret Detection (P1)
   * Tasks T032-T056: Detect critical authentication secrets
   *
   * EXPECTED: These tests should FAIL initially (auth patterns not in current implementation)
   * After adding auth patterns, these tests should PASS
   */
  describe('US2: Authentication Secret Detection', () => {
    describe('standalone authentication secret fields', () => {
      it('T032: should sanitize password field', () => {
        expectFieldSanitized(sanitizer, 'password', DUMMY_SECRET);
      });

      it('T033: should sanitize passwd field', () => {
        expectFieldSanitized(sanitizer, 'passwd', DUMMY_SECRET);
      });

      it('T034: should sanitize token field', () => {
        expectFieldSanitized(sanitizer, 'token', DUMMY_SECRET);
      });

      it('T035: should sanitize apiKey field', () => {
        expectFieldSanitized(sanitizer, 'apiKey', DUMMY_SECRET);
      });

      it('T036: should sanitize api_key field', () => {
        expectFieldSanitized(sanitizer, 'api_key', DUMMY_SECRET);
      });

      it('T037: should sanitize secret field', () => {
        expectFieldSanitized(sanitizer, 'secret', DUMMY_SECRET);
      });

      it('T038: should sanitize auth field', () => {
        expectFieldSanitized(sanitizer, 'auth', DUMMY_SECRET);
      });

      it('T039: should sanitize credential field', () => {
        expectFieldSanitized(sanitizer, 'credential', 'user:password');
      });

      it('T040: should sanitize credentials field', () => {
        expectFieldSanitized(sanitizer, 'credentials', 'user:password');
      });

      it('T041: should sanitize authorization field', () => {
        expectFieldSanitized(sanitizer, 'authorization', DUMMY_SECRET);
      });
    });

    describe('camelCase authentication secret fields', () => {
      it('T042: should sanitize userPassword field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'userPassword', DUMMY_SECRET);
      });

      it('T043: should sanitize user_password field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'user_password', DUMMY_SECRET);
      });

      it('T044: should sanitize accessToken field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'accessToken', DUMMY_SECRET);
      });

      it('T045: should sanitize access_token field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'access_token', DUMMY_SECRET);
      });

      it('T046: should sanitize secretKey field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'secretKey', DUMMY_SECRET);
      });

      it('T047: should sanitize secret_key field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'secret_key', DUMMY_SECRET);
      });

      it('T048: should sanitize clientSecret field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'clientSecret', DUMMY_SECRET);
      });

      it('T049: should sanitize client_secret field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'client_secret', DUMMY_SECRET);
      });
    });

    describe('case-insensitive authentication secret matching', () => {
      it('T050: should sanitize PASSWORD (uppercase)', () => {
        expectFieldSanitized(sanitizer, 'PASSWORD', DUMMY_SECRET);
      });

      it('T051: should sanitize Token (capitalized)', () => {
        expectFieldSanitized(sanitizer, 'Token', DUMMY_SECRET);
      });

      it('T052: should sanitize API_KEY (uppercase snake_case)', () => {
        expectFieldSanitized(sanitizer, 'API_KEY', DUMMY_SECRET);
      });
    });

    describe('compound fields with authentication secrets (precedence)', () => {
      it('T053: should sanitize tokenId (auth secret precedence)', () => {
        expectFieldSanitized(sanitizer, 'tokenId', 'tok_1234567890');
      });

      it('T054: should sanitize apiKeyFilename (auth secret precedence)', () => {
        expectFieldSanitized(sanitizer, 'apiKeyFilename', 'api_key.txt');
      });

      it('T055: should sanitize secretManagerConfig (auth secret precedence)', () => {
        expectFieldSanitized(sanitizer, 'secretManagerConfig', '{ "project": "app" }');
      });

      it('T056: should sanitize passwordFile (auth secret precedence)', () => {
        // CodeRabbit fix: Use generic filename instead of system-specific /etc/passwd
        expectFieldSanitized(sanitizer, 'passwordFile', 'passwords.txt');
      });
    });

    describe('US2.5: False positives prevented by removing over-aggressive api/key patterns', () => {
      // CodeRabbit Round 3, Issue 1: Verify that standalone 'api' and 'key' patterns were removed
      // to prevent false positives while compound patterns like 'apikey', 'accesskey' still work

      it('should NOT sanitize apiVersion field (api prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'apiVersion', 'v2.1.0');
      });

      it('should NOT sanitize apiEndpoint field (api prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'apiEndpoint', '/api/v1/users');
      });

      it('should NOT sanitize apiUrl field (api prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'apiUrl', 'https://api.example.com');
      });

      it('should NOT sanitize apiResponse field (api prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'apiResponse', '{ "status": "ok" }');
      });

      it('should NOT sanitize keyboard field (key prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'keyboard', 'US-QWERTY');
      });

      it('should NOT sanitize keyCode field (key prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'keyCode', '13');
      });

      it('should NOT sanitize primaryKey field (key suffix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'primaryKey', 'id');
      });

      it('should NOT sanitize foreignKey field (key suffix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'foreignKey', 'user_id');
      });

      it('should NOT sanitize keyValue field (key prefix, but not auth secret)', () => {
        expectFieldPreserved(sanitizer, 'keyValue', 'pair-123');
      });

      // Verify compound patterns still work
      it('should STILL sanitize apiKey field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'apiKey', DUMMY_SECRET);
      });

      it('should STILL sanitize api_key field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'api_key', DUMMY_SECRET);
      });

      it('should STILL sanitize accessKey field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'accessKey', DUMMY_SECRET);
      });

      it('should STILL sanitize access_key field (compound auth secret, snake_case)', () => {
        expectFieldSanitized(sanitizer, 'access_key', DUMMY_SECRET);
      });

      it('should STILL sanitize secretKey field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'secretKey', DUMMY_SECRET);
      });
    });
  });

  /**
   * Feature 019: User Story 3 - Scoped IP Pattern (P2)
   * Tasks T062-T077: Scope 'ip' pattern to actual IP address fields only
   *
   * EXPECTED: These tests should FAIL initially (current word boundary matching would incorrectly sanitize 'zip', 'ship', etc.)
   * After implementing scoped IP pattern, these tests should PASS
   */
  describe('US3: Scoped IP Pattern - False Positive Prevention', () => {
    describe('fields with incidental "ip" substring that should NOT be sanitized', () => {
      it('T062: should NOT sanitize zip field', () => {
        expectFieldPreserved(sanitizer, 'zip', '12345');
      });

      it('T063: should NOT sanitize zipCode field (validation from US1)', () => {
        expectFieldPreserved(sanitizer, 'zipCode', '67890');
      });

      it('T064: should NOT sanitize ship field', () => {
        expectFieldPreserved(sanitizer, 'ship', 'UPS');
      });

      it('T065: should NOT sanitize shipmentId field', () => {
        expectFieldPreserved(sanitizer, 'shipmentId', 'SHIP_001');
      });

      it('T066: should NOT sanitize shipment field', () => {
        expectFieldPreserved(sanitizer, 'shipment', 'overnight');
      });

      it('T067: should NOT sanitize relationship field', () => {
        expectFieldPreserved(sanitizer, 'relationship', 'parent');
      });

      it('T068: should NOT sanitize tip field', () => {
        expectFieldPreserved(sanitizer, 'tip', '15.00');
      });

      it('T069: should NOT sanitize description field (has "ip" in middle)', () => {
        expectFieldPreserved(sanitizer, 'description', 'Shipping details');
      });
    });

    describe('actual IP address fields that SHOULD be sanitized', () => {
      it('T070: should sanitize ipAddress field', () => {
        expectFieldSanitized(sanitizer, 'ipAddress', '192.168.1.1');
      });

      it('T071: should sanitize ip_address field', () => {
        expectFieldSanitized(sanitizer, 'ip_address', '10.0.0.1');
      });

      it('T072: should sanitize remoteIp field', () => {
        expectFieldSanitized(sanitizer, 'remoteIp', '172.16.0.1');
      });

      it('T073: should sanitize remote_ip field', () => {
        expectFieldSanitized(sanitizer, 'remote_ip', '192.168.0.1');
      });

      it('T074: should sanitize clientIp field', () => {
        expectFieldSanitized(sanitizer, 'clientIp', '203.0.113.0');
      });

      it('T075: should sanitize client_ip field', () => {
        expectFieldSanitized(sanitizer, 'client_ip', '198.51.100.0');
      });

      it('T076: should sanitize serverIp field', () => {
        expectFieldSanitized(sanitizer, 'serverIp', '192.0.2.0');
      });

      it('T077: should sanitize sourceIp field', () => {
        expectFieldSanitized(sanitizer, 'sourceIp', '198.18.0.0');
      });
    });
  });

  /**
   * Feature 019: User Story 4 - Backward Compatibility Validation (P2)
   * Tasks T083-T097: Ensure all existing behavior is preserved
   */
  describe('US4: Backward Compatibility - Existing Pattern Validation', () => {
    describe('existing PII patterns still sanitize correctly', () => {
      it('T083: should sanitize email field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'email', 'user@example.com');
      });

      it('T084: should sanitize userEmail field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'userEmail', 'user@example.com');
      });

      it('T085: should sanitize user_email field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'user_email', 'user@example.com');
      });

      it('T086: should sanitize phone field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'phone', '555-1234');
      });

      it('T087: should sanitize ssn field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'ssn', '123-45-6789');
      });

      it('T088: should sanitize address field (existing pattern)', () => {
        expectFieldSanitized(sanitizer, 'address', '123 Main St');
      });
    });

    describe('structural sharing optimization (Contract 6, FR-014)', () => {
      it('T089: should return same reference when no PII detected', () => {
        const input = { id: 'payment-123', amount: 100 };
        const result = sanitizer.sanitize(input);
        expect(result).toBe(input); // Structural sharing
      });

      it('T090: should return new reference when PII detected', () => {
        const input = { id: 'payment-123', email: 'user@example.com', amount: 100 };
        const result = sanitizer.sanitize(input);
        expect(result).not.toBe(input); // New object
        expect(result).toEqual({ id: 'payment-123', amount: 100 });
      });
    });

    describe('nested and special object handling (Contracts 8-10)', () => {
      it('T091: should recursively sanitize nested objects (Contract 8, FR-005)', () => {
        const input = {
          user: {
            email: 'user@example.com',
            id: '123',
          },
          amount: 100,
        };
        const result = sanitizer.sanitize(input);
        expect(result).toEqual({
          user: {
            id: '123',
          },
          amount: 100,
        });
      });

      it('T092: should handle circular references with [Circular] placeholder (Contract 9, FR-005)', () => {
        const input: any = { id: 1, amount: 100 };
        input.self = input; // Circular reference
        const result = sanitizer.sanitize(input);
        expect(result.id).toBe(1);
        expect(result.amount).toBe(100);
        expect(result.self).toBe('[Circular]');
      });

      it('T093: should handle special object types correctly (Contract 10, FR-006)', () => {
        const date = new Date();
        const regex = /test/;
        const input = {
          createdAt: date,
          pattern: regex,
          amount: 100,
        };
        const result = sanitizer.sanitize(input);
        // Date objects are serialized to ISO strings during sanitization
        expect(result.createdAt).toBe(date.toISOString());
        // RegExp objects are converted to strings during sanitization
        expect(typeof result.pattern).toBe('string');
        expect(result.amount).toBe(100);
      });

      it('T094: should remove prototype pollution attack vectors (Contract 11, FR-005)', () => {
        const input = {
          __proto__: { polluted: 'value' },
          constructor: { polluted: 'value' },
          prototype: { polluted: 'value' },
          amount: 100,
        };
        const result = sanitizer.sanitize(input);
        // CodeRabbit fix (Issue 6): Use safe Object.prototype.hasOwnProperty.call() to prevent prototype pollution
        expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);
        expect(result).toHaveProperty('amount');
        expect(result.amount).toBe(100);
      });
    });

    describe('performance validation (Contract 12, FR-008, SC-004)', () => {
      // CodeRabbit fix (Issue 2): Configurable performance thresholds via environment variables
      // CodeRabbit fix (Issue 7): Validate parsed values with fallbacks for invalid inputs
      const parseThreshold = (envVar: string | undefined, defaultValue: number, min: number = 1): number => {
        if (!envVar) return defaultValue;
        const parsed = parseInt(envVar, 10);
        if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
          console.warn(`[PiiSanitizer] Invalid env threshold "${envVar}", using default ${defaultValue}ms`);
          return defaultValue;
        }
        return Math.max(parsed, min);
      };

      const parsePercentile = (envVar: string | undefined, defaultValue: number): number => {
        if (!envVar) return defaultValue;
        const parsed = parseInt(envVar, 10);
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100 || !Number.isInteger(parsed)) {
          console.warn(`[PiiSanitizer] Invalid percentile "${envVar}", using default P${defaultValue}`);
          return defaultValue;
        }
        return parsed;
      };

      const THRESHOLD_TYPICAL_MS = parseThreshold(process.env.PII_SANITIZER_THRESHOLD_TYPICAL_MS, 50);
      const THRESHOLD_LARGE_MS = parseThreshold(process.env.PII_SANITIZER_THRESHOLD_LARGE_MS, 100);
      const THRESHOLD_ARRAY_MS = parseThreshold(process.env.PII_SANITIZER_THRESHOLD_ARRAY_MS, 50);
      const PERCENTILE = parsePercentile(process.env.PII_SANITIZER_PERCENTILE, 95);

      it('T095: should sanitize typical object in <50ms (10-50 fields, 2-3 nesting)', () => {
        const typicalObject = {
          id: 'txn-123',
          amount: 100.50,
          currency: 'USD',
          status: 'completed',
          email: 'user@example.com', // PII
          user: {
            id: 'user-456',
            name: 'John Doe', // PII
            preferences: {
              locale: 'en-US',
              timezone: 'America/New_York',
            },
          },
          metadata: {
            source: 'web',
            version: '1.0',
            ip: '192.168.1.1', // PII
          },
        };

        // CodeRabbit fix: Use percentile-based checking (P95) instead of simple average
        // CodeRabbit Round 3 nitpick: Reduce iterations for CI stability (1000 → 300)
        const samples = measurePerformance(sanitizer, typicalObject, 300);
        const p95 = calculatePercentile(samples, PERCENTILE);
        expect(p95).toBeLessThan(THRESHOLD_TYPICAL_MS); // P95 < threshold
      });

      it('T096: should handle large objects with acceptable performance (100 fields, 5 nesting)', () => {
        const largeObject: any = { id: 'root' };

        // Create 100 fields at root level
        for (let i = 0; i < 50; i++) {
          largeObject[`field${i}`] = `value${i}`;
          largeObject[`pii${i}`] = `email${i}@example.com`; // Half are PII
        }

        // Create 5 levels of nesting
        let current = largeObject;
        for (let level = 1; level <= 5; level++) {
          current.nested = {
            level,
            email: `level${level}@example.com`, // PII at each level
            data: `data-${level}`,
          };
          current = current.nested;
        }

        // CodeRabbit fix: Use percentile-based checking (P95) instead of simple average
        // CodeRabbit Round 3 nitpick: Reduce iterations for CI stability (100 → 60)
        const samples = measurePerformance(sanitizer, largeObject, 60);
        const p95 = calculatePercentile(samples, PERCENTILE);
        expect(p95).toBeLessThan(THRESHOLD_LARGE_MS); // P95 < threshold
      });

      it('T097: should sanitize array of objects efficiently', () => {
        const arrayOfObjects = Array.from({ length: 20 }, (_, i) => ({
          id: `item-${i}`,
          email: `user${i}@example.com`, // PII
          amount: i * 10,
        }));

        // CodeRabbit fix: Use percentile-based checking (P95) instead of simple average
        // CodeRabbit Round 3 nitpick: Reduce iterations for CI stability (500 → 200)
        const samples = measurePerformance(sanitizer, arrayOfObjects, 200);
        const p95 = calculatePercentile(samples, PERCENTILE);
        expect(p95).toBeLessThan(THRESHOLD_ARRAY_MS); // P95 < threshold
      });
    });
  });

  /**
   * Feature 019: Phase 7 - Edge Cases & Cross-Story Integration
   * Tasks T102-T108: Cross-cutting behaviors spanning multiple user stories
   */
  describe('Phase 7: Edge Cases & Cross-Story Integration', () => {
    it('T102: should sanitize field with multiple PII patterns (userEmailAddress)', () => {
      // Contains both 'email' and 'address' patterns
      expectFieldSanitized(sanitizer, 'userEmailAddress', 'user@example.com');
    });

    it('T103: should handle mixed camelCase and snake_case in same object', () => {
      const input = {
        userName: 'johndoe',        // camelCase PII
        user_email: 'john@example.com', // snake_case PII
        first_name: 'John',         // snake_case PII
        lastName: 'Doe',            // camelCase PII
        accountId: 'ACC_123',       // Preserved (accountId not PII)
        user_id: 'USER_456',        // Preserved (user_id not PII)
      };
      const result = sanitizer.sanitize(input);
      expect(result).toEqual({
        accountId: 'ACC_123',
        user_id: 'USER_456',
      });
    });

    it('T104: should handle all-lowercase field names correctly', () => {
      expectFieldSanitized(sanitizer, 'email', 'user@example.com');
      expectFieldSanitized(sanitizer, 'password', 'secret123');
      expectFieldPreserved(sanitizer, 'filename', 'data.csv');
    });

    it('T105: should handle all-uppercase field names correctly', () => {
      expectFieldSanitized(sanitizer, 'EMAIL', 'user@example.com');
      expectFieldSanitized(sanitizer, 'PASSWORD', 'secret123');
      expectFieldPreserved(sanitizer, 'FILENAME', 'data.csv');
    });

    it('T106: should handle mixed case field names (PaSsWoRd)', () => {
      expectFieldSanitized(sanitizer, 'PaSsWoRd', 'secret123');
      expectFieldSanitized(sanitizer, 'EmAiL', 'user@example.com');
      expectFieldSanitized(sanitizer, 'ToKeN', 'jwt_token_here');
    });

    it('T107: should NOT sanitize obfuscated field names (by design, Out of Scope 9)', () => {
      // These are intentionally NOT detected - out of scope for this feature
      expectFieldPreserved(sanitizer, 'p_a_s_s_w_o_r_d', 'secret123');
      expectFieldPreserved(sanitizer, 'p4ssw0rd', 'secret123');
      expectFieldPreserved(sanitizer, 'pass word', 'secret123');
    });

    it('T108: should sanitize future compound tokens (extensibility)', () => {
      // These should be detected because they contain 'token' at word boundary
      expectFieldSanitized(sanitizer, 'bearerToken', 'Bearer xyz123');
      expectFieldSanitized(sanitizer, 'refreshToken', 'refresh_xyz456');
      expectFieldSanitized(sanitizer, 'jwtToken', 'eyJhbGci...');
      expectFieldSanitized(sanitizer, 'accessToken', 'access_token_789');
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

    it('should handle circular references gracefully', () => {
      const input: any = { id: 1, amount: 100 };
      input.self = input; // Circular reference

      // Feature 018 fix: Circular references return '[Circular]' to prevent crashes (CodeRabbit round 7)
      const result = sanitizer.sanitize(input);
      expect(result.id).toBe(1);
      expect(result.amount).toBe(100);
      expect(result.self).toBe('[Circular]');
    });
  });
});
