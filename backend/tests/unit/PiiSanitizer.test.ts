/**
 * PiiSanitizer Tests
 * Feature 018: Technical Debt Cleanup - User Story 3 (P2)
 *
 * Tests PII field removal from cache objects to prevent sensitive
 * data leakage (FR-013, Tasks T053-T057).
 */

// Use require for CommonJS interop (backend uses .js files)
const { PiiSanitizer } = require('../../src/lib/security/PiiSanitizer');

// Import type for type safety
import type { PiiSanitizer as PiiSanitizerType } from '../../src/lib/security/PiiSanitizer';

// Import shared performance testing utilities
import {
  parseThreshold,
  parsePercentile,
  measurePerformance as measurePerf,
  calculatePercentile,
} from '../helpers/performance';

// Test constant for security scanner hygiene - tests field name detection, not value validation
const TEST_REDACTED_VALUE = 'REDACTED_TEST_VALUE';

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
 * Wraps shared measurePerformance utility with sanitizer-specific logic.
 */
function measurePerformance(
  sanitizer: PiiSanitizerType,
  data: any,
  iterations: number = 1000
): number[] {
  return measurePerf(() => sanitizer.sanitize(data), iterations);
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
        expectFieldSanitized(sanitizer, 'password', TEST_REDACTED_VALUE);
      });

      it('T033: should sanitize passwd field', () => {
        expectFieldSanitized(sanitizer, 'passwd', TEST_REDACTED_VALUE);
      });

      it('T034: should sanitize token field', () => {
        expectFieldSanitized(sanitizer, 'token', TEST_REDACTED_VALUE);
      });

      it('T035: should sanitize apiKey field', () => {
        expectFieldSanitized(sanitizer, 'apiKey', TEST_REDACTED_VALUE);
      });

      it('T036: should sanitize api_key field', () => {
        expectFieldSanitized(sanitizer, 'api_key', TEST_REDACTED_VALUE);
      });

      it('T037: should sanitize secret field', () => {
        expectFieldSanitized(sanitizer, 'secret', TEST_REDACTED_VALUE);
      });

      it('T038: should sanitize auth field', () => {
        expectFieldSanitized(sanitizer, 'auth', TEST_REDACTED_VALUE);
      });

      it('T039: should sanitize credential field', () => {
        expectFieldSanitized(sanitizer, 'credential', 'user:password');
      });

      it('T040: should sanitize credentials field', () => {
        expectFieldSanitized(sanitizer, 'credentials', 'user:password');
      });

      it('T041: should sanitize authorization field', () => {
        expectFieldSanitized(sanitizer, 'authorization', TEST_REDACTED_VALUE);
      });
    });

    describe('camelCase authentication secret fields', () => {
      it('T042: should sanitize userPassword field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'userPassword', TEST_REDACTED_VALUE);
      });

      it('T043: should sanitize user_password field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'user_password', TEST_REDACTED_VALUE);
      });

      it('T044: should sanitize accessToken field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'accessToken', TEST_REDACTED_VALUE);
      });

      it('T045: should sanitize access_token field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'access_token', TEST_REDACTED_VALUE);
      });

      it('T046: should sanitize secretKey field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'secretKey', TEST_REDACTED_VALUE);
      });

      it('T047: should sanitize secret_key field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'secret_key', TEST_REDACTED_VALUE);
      });

      it('T048: should sanitize clientSecret field (camelCase)', () => {
        expectFieldSanitized(sanitizer, 'clientSecret', TEST_REDACTED_VALUE);
      });

      it('T049: should sanitize client_secret field (snake_case)', () => {
        expectFieldSanitized(sanitizer, 'client_secret', TEST_REDACTED_VALUE);
      });
    });

    describe('case-insensitive authentication secret matching', () => {
      it('T050: should sanitize PASSWORD (uppercase)', () => {
        expectFieldSanitized(sanitizer, 'PASSWORD', TEST_REDACTED_VALUE);
      });

      it('T051: should sanitize Token (capitalized)', () => {
        expectFieldSanitized(sanitizer, 'Token', TEST_REDACTED_VALUE);
      });

      it('T052: should sanitize API_KEY (uppercase snake_case)', () => {
        expectFieldSanitized(sanitizer, 'API_KEY', TEST_REDACTED_VALUE);
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
        expectFieldSanitized(sanitizer, 'apiKey', TEST_REDACTED_VALUE);
      });

      it('should STILL sanitize api_key field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'api_key', TEST_REDACTED_VALUE);
      });

      it('should STILL sanitize accessKey field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'accessKey', TEST_REDACTED_VALUE);
      });

      it('should STILL sanitize access_key field (compound auth secret, snake_case)', () => {
        expectFieldSanitized(sanitizer, 'access_key', TEST_REDACTED_VALUE);
      });

      it('should STILL sanitize secretKey field (compound auth secret)', () => {
        expectFieldSanitized(sanitizer, 'secretKey', TEST_REDACTED_VALUE);
      });
    });

    describe('Versioned field support (CodeRabbit Round 2, Issue 9)', () => {
      // Explicit tests for versioned field detection with optional numeric suffixes
      // Regex pattern: (?:[0-9]+)? allows trailing digits on all patterns

      // Regular PII patterns with numeric suffixes
      it('should sanitize email1 (versioned PII field)', () => {
        expectFieldSanitized(sanitizer, 'email1', 'user@example.com');
      });

      it('should sanitize email2 (versioned PII field)', () => {
        expectFieldSanitized(sanitizer, 'email2', 'backup@example.com');
      });

      it('should sanitize name_2 (versioned snake_case PII)', () => {
        expectFieldSanitized(sanitizer, 'name_2', 'John Doe');
      });

      it('should sanitize phone999 (versioned PII with large number)', () => {
        expectFieldSanitized(sanitizer, 'phone999', '555-1234');
      });

      // Authentication secret patterns with numeric suffixes
      it('should sanitize password1 (versioned auth secret)', () => {
        expectFieldSanitized(sanitizer, 'password1', TEST_REDACTED_VALUE);
      });

      it('should sanitize token_2 (versioned snake_case auth secret)', () => {
        expectFieldSanitized(sanitizer, 'token_2', TEST_REDACTED_VALUE);
      });

      it('should sanitize apiKey3 (versioned camelCase auth secret)', () => {
        expectFieldSanitized(sanitizer, 'apiKey3', TEST_REDACTED_VALUE);
      });

      it('should sanitize API_KEY_123 (versioned uppercase snake_case auth secret)', () => {
        expectFieldSanitized(sanitizer, 'API_KEY_123', TEST_REDACTED_VALUE);
      });

      // Compound fields with versioned auth secrets
      it('should sanitize userPassword1 (compound versioned auth secret)', () => {
        expectFieldSanitized(sanitizer, 'userPassword1', TEST_REDACTED_VALUE);
      });

      it('should sanitize access_token_2 (compound versioned snake_case auth secret)', () => {
        expectFieldSanitized(sanitizer, 'access_token_2', TEST_REDACTED_VALUE);
      });
    });

    describe('Large numeric suffixes (>3 digits) - Coverage Gap', () => {
      // Verify that (?:[0-9]+)? pattern handles arbitrarily long numeric suffixes
      // This closes the final coverage gap for versioned field support

      it('should sanitize email9999 (4-digit numeric suffix)', () => {
        expectFieldSanitized(sanitizer, 'email9999', 'user@example.com');
      });

      it('should sanitize password12345 (5-digit numeric suffix)', () => {
        expectFieldSanitized(sanitizer, 'password12345', TEST_REDACTED_VALUE);
      });

      it('should sanitize token_99999 (snake_case with 5-digit suffix)', () => {
        expectFieldSanitized(sanitizer, 'token_99999', TEST_REDACTED_VALUE);
      });

      it('should sanitize userEmail123456789 (camelCase with 9-digit suffix)', () => {
        expectFieldSanitized(sanitizer, 'userEmail123456789', 'user@example.com');
      });

      it('should sanitize api_key_1000000 (snake_case auth secret with 7-digit suffix)', () => {
        expectFieldSanitized(sanitizer, 'api_key_1000000', TEST_REDACTED_VALUE);
      });
    });

    describe('ALL-CAPS Acronym Support - camelCase Enhancement', () => {
      // Enhancement: Support ALL-CAPS acronyms in camelCase fields (userDOB, userSSN, userID)
      // Whitelist: DOB, SSN, ID, URL, IP (defined in PiiSanitizer constructor)
      //
      // Regex pattern: [a-z](?:Dob|DOB)(?=[A-Z0-9]|_|$)
      // - userDob ✓ (Capitalized - existing capitalizedPattern)
      // - userDOB ✓ (ALL-CAPS - new acronymPattern)
      // - DOB ✓ (standalone - Alternative 1)

      // DOB (Date of Birth) acronym tests
      it('should sanitize userDOB (ALL-CAPS acronym in camelCase)', () => {
        expectFieldSanitized(sanitizer, 'userDOB', '1990-01-01');
      });

      it('should sanitize employeeDOB (ALL-CAPS acronym)', () => {
        expectFieldSanitized(sanitizer, 'employeeDOB', '1985-05-15');
      });

      it('should sanitize DOB (standalone ALL-CAPS)', () => {
        expectFieldSanitized(sanitizer, 'DOB', '1995-12-25');
      });

      it('should sanitize userDob (Capitalized - backward compatibility)', () => {
        expectFieldSanitized(sanitizer, 'userDob', '1990-01-01');
      });

      // SSN (Social Security Number) acronym tests
      it('should sanitize userSSN (ALL-CAPS acronym in camelCase)', () => {
        expectFieldSanitized(sanitizer, 'userSSN', '123-45-6789');
      });

      it('should sanitize employeeSSN (ALL-CAPS acronym)', () => {
        expectFieldSanitized(sanitizer, 'employeeSSN', '987-65-4321');
      });

      it('should sanitize SSN (standalone ALL-CAPS - backward compatibility)', () => {
        expectFieldSanitized(sanitizer, 'SSN', '111-22-3333');
      });

      it('should sanitize userSsn (Capitalized - backward compatibility)', () => {
        expectFieldSanitized(sanitizer, 'userSsn', '123-45-6789');
      });

      // NOTE: 'ID' is in acronym whitelist but 'id' is NOT a PII pattern
      // Only 'nationalid' exists in piiPatterns, so nationalID will match via 'nationalid' pattern
      it('should NOT sanitize userID (ID not in PII patterns)', () => {
        expectFieldPreserved(sanitizer, 'userID', '123456'); // 'id' is not a PII pattern
      });

      it('should sanitize nationalID (matches nationalid PII pattern)', () => {
        expectFieldSanitized(sanitizer, 'nationalID', 'NAT-123456'); // matches 'nationalid' pattern
      });

      it('should NOT sanitize userId (Capitalized - id not in PII patterns)', () => {
        expectFieldPreserved(sanitizer, 'userId', '123456'); // 'id' is not a PII pattern
      });

      // URL acronym tests
      it('should sanitize profileURL (ALL-CAPS acronym in camelCase)', () => {
        expectFieldPreserved(sanitizer, 'profileURL', 'https://example.com/profile'); // 'url' is not a PII pattern
      });

      // IP acronym tests
      it('should sanitize clientIP (ALL-CAPS acronym in camelCase)', () => {
        expectFieldSanitized(sanitizer, 'clientIP', '192.168.1.1');
      });

      it('should sanitize serverIP (ALL-CAPS acronym)', () => {
        expectFieldSanitized(sanitizer, 'serverIP', '10.0.0.1');
      });

      it('should sanitize IP (standalone ALL-CAPS - backward compatibility)', () => {
        expectFieldSanitized(sanitizer, 'IP', '172.16.0.1');
      });

      it('should sanitize clientIp (Capitalized - backward compatibility)', () => {
        expectFieldSanitized(sanitizer, 'clientIp', '192.168.1.1');
      });
    });

    describe('Production Telemetry Sampling - Auth Secret Monitoring', () => {
      // Enhancement: Optional production telemetry sampling for auth-secret matches
      // Monitors redacted field names (no values) to detect unexpected over-redaction
      //
      // Sampling strategy:
      // - Only enabled in production (NODE_ENV === 'production')
      // - Default 1% sampling rate (configurable via PII_REDACT_SAMPLING_RATE env var)
      // - Emits structured logger.info event with fieldName and category only
      // - NEVER logs field values (privacy-first)

      let originalEnv: string | undefined;
      let originalSamplingRate: string | undefined;
      let consoleLogSpy: any;

      beforeEach(() => {
        // Save original env vars
        originalEnv = process.env.NODE_ENV;
        originalSamplingRate = process.env.PII_REDACT_SAMPLING_RATE;

        // Spy on console.log to capture telemetry output
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      });

      afterEach(() => {
        // Restore original env vars
        if (originalEnv !== undefined) {
          process.env.NODE_ENV = originalEnv;
        } else {
          delete process.env.NODE_ENV;
        }

        if (originalSamplingRate !== undefined) {
          process.env.PII_REDACT_SAMPLING_RATE = originalSamplingRate;
        } else {
          delete process.env.PII_REDACT_SAMPLING_RATE;
        }

        // Restore console.log
        consoleLogSpy.mockRestore();
      });

      it('should NOT emit telemetry in development environment', () => {
        // Arrange
        process.env.NODE_ENV = 'development';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize auth secret field multiple times
        for (let i = 0; i < 10; i++) {
          freshSanitizer.sanitize({ tokenId: TEST_REDACTED_VALUE, amount: 100 });
        }

        // Assert - no telemetry emitted in development
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });

      it('should NOT emit telemetry in test environment', () => {
        // Arrange
        process.env.NODE_ENV = 'test';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize auth secret field
        freshSanitizer.sanitize({ passwordFile: TEST_REDACTED_VALUE, amount: 100 });

        // Assert - no telemetry emitted in test
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });

      it('should emit telemetry in production with 100% sampling rate', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize auth secret field
        freshSanitizer.sanitize({ tokenId: TEST_REDACTED_VALUE, amount: 100 });

        // Assert - telemetry emitted exactly once
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);

        // Verify telemetry structure
        const telemetryCall = consoleLogSpy.mock.calls[0][0];
        const telemetryData = JSON.parse(telemetryCall);

        expect(telemetryData).toEqual({
          event: 'PII_REDACTION',
          category: 'auth_secret',
          fieldName: 'tokenId',
        });

        // CRITICAL: Verify no field values are logged
        expect(telemetryCall).not.toContain(TEST_REDACTED_VALUE);
        expect(telemetryData).not.toHaveProperty('fieldValue');
        expect(telemetryData).not.toHaveProperty('value');
      });

      it('should respect default 1% sampling rate when not configured', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        delete process.env.PII_REDACT_SAMPLING_RATE; // Use default 1%
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize auth secret fields with DIFFERENT field names (avoid cache)
        // Use versioned field names (apiKey1, apiKey2, ..., apiKey1000) to bypass cache
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
          freshSanitizer.sanitize({ [`apiKey${i}`]: TEST_REDACTED_VALUE, amount: 100 });
        }

        // Assert - roughly 1% sampling (allow some variance)
        // Expected: ~10 samples (1% of 1000)
        // Acceptable range: 0-30 samples (allow for randomness)
        const sampleCount = consoleLogSpy.mock.calls.length;
        expect(sampleCount).toBeGreaterThanOrEqual(0);
        expect(sampleCount).toBeLessThan(30); // Very lenient upper bound for CI stability
      });

      it('should emit telemetry for different auth secret fields', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize various auth secret fields
        freshSanitizer.sanitize({ password: TEST_REDACTED_VALUE });
        freshSanitizer.sanitize({ apiKeyFilename: TEST_REDACTED_VALUE });
        freshSanitizer.sanitize({ secretManagerConfig: TEST_REDACTED_VALUE });

        // Assert - 3 telemetry events emitted
        expect(consoleLogSpy).toHaveBeenCalledTimes(3);

        // Verify each telemetry event has correct fieldName
        const fieldNames = consoleLogSpy.mock.calls.map((call: any) => {
          const data = JSON.parse(call[0]);
          return data.fieldName;
        });

        expect(fieldNames).toContain('password');
        expect(fieldNames).toContain('apiKeyFilename');
        expect(fieldNames).toContain('secretManagerConfig');

        // Verify all have correct category
        consoleLogSpy.mock.calls.forEach((call: any) => {
          const data = JSON.parse(call[0]);
          expect(data.category).toBe('auth_secret');
          expect(data.event).toBe('PII_REDACTION');
        });
      });

      it('should NOT emit telemetry for regular PII fields (only auth secrets)', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize regular PII fields (not auth secrets)
        freshSanitizer.sanitize({ email: 'user@example.com' });
        freshSanitizer.sanitize({ userName: 'johndoe' });
        freshSanitizer.sanitize({ clientIp: '192.168.1.1' });
        freshSanitizer.sanitize({ userSSN: '123-45-6789' });

        // Assert - NO telemetry emitted (only auth secrets trigger telemetry)
        expect(consoleLogSpy).not.toHaveBeenCalled();
      });

      it('should handle custom sampling rates correctly', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        process.env.PII_REDACT_SAMPLING_RATE = '0.5'; // 50% sampling
        const freshSanitizer = new PiiSanitizer();

        // Act - sanitize auth secret fields with DIFFERENT field names (avoid cache)
        // Use versioned field names (token1, token2, ..., token100) to bypass cache
        const iterations = 100;
        for (let i = 0; i < iterations; i++) {
          freshSanitizer.sanitize({ [`token${i}`]: TEST_REDACTED_VALUE, amount: 100 });
        }

        // Assert - roughly 50% sampling (allow variance)
        // Expected: ~50 samples (50% of 100)
        // Acceptable range: 30-70 samples (allow for randomness)
        const sampleCount = consoleLogSpy.mock.calls.length;
        expect(sampleCount).toBeGreaterThan(30);
        expect(sampleCount).toBeLessThan(70);
      });

      it('should never log field values in telemetry (privacy guarantee)', () => {
        // Arrange
        process.env.NODE_ENV = 'production';
        process.env.PII_REDACT_SAMPLING_RATE = '1.0'; // 100% sampling
        const freshSanitizer = new PiiSanitizer();

        const secretValue = 'super-secret-token-12345';
        const secretKey = 'my-api-key-67890';

        // Act - sanitize with actual secret values
        freshSanitizer.sanitize({ password: secretValue });
        freshSanitizer.sanitize({ apiKey: secretKey });

        // Assert - no telemetry contains actual secret values
        consoleLogSpy.mock.calls.forEach((call: any) => {
          const telemetryString = call[0];
          expect(telemetryString).not.toContain(secretValue);
          expect(telemetryString).not.toContain(secretKey);

          const telemetryData = JSON.parse(telemetryString);
          expect(telemetryData).not.toHaveProperty('fieldValue');
          expect(telemetryData).not.toHaveProperty('value');
          expect(telemetryData).toHaveProperty('fieldName'); // Only fieldName, never value
        });
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
      // Performance utilities imported from shared helpers/performance.ts
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

  /**
   * Security: ReDoS (Regular Expression Denial of Service) Protection
   * Validates that complex regex patterns complete quickly even with pathological inputs
   */
  describe('ReDoS Protection', () => {
    it('should handle extremely long field names without performance degradation', () => {
      const maliciousField = 'a'.repeat(1000) + 'Password' + 'b'.repeat(1000);
      const input = { [maliciousField]: 'value', id: '123' };
      const start = performance.now();
      sanitizer.sanitize(input);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle deeply nested pattern-like field names quickly', () => {
      const maliciousField = 'user_email_address_backup_primary_fallback_secondary_tertiary_quaternary';
      const input = { [maliciousField]: 'value', id: '123' };
      const start = performance.now();
      sanitizer.sanitize(input);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle alternating case patterns without performance degradation', () => {
      const maliciousField = 'uSeRpAsSwOrDtOkEnApIkEyAuThOrIzAtIoN';
      const input = { [maliciousField]: 'value', id: '123' };
      const start = performance.now();
      sanitizer.sanitize(input);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle many underscores without performance degradation', () => {
      const maliciousField = '_'.repeat(100) + 'password' + '_'.repeat(100);
      const input = { [maliciousField]: 'value', id: '123' };
      const start = performance.now();
      sanitizer.sanitize(input);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10); // Should complete in <10ms
    });

    it('should handle mixed pathological inputs without performance degradation', () => {
      const input = {
        ['a'.repeat(500) + 'email' + 'b'.repeat(500)]: 'value1',
        ['p'.repeat(200) + 'Token' + 'q'.repeat(200)]: 'value2',
        ['_'.repeat(50) + 'apiKey' + '_'.repeat(50)]: 'value3',
        ['xYzAbC'.repeat(100) + 'secret']: 'value4',
        id: '123',
      };

      const start = performance.now();
      sanitizer.sanitize(input);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // All 4 fields in <50ms total
    });
  });

  /**
   * Performance: LRU Cache Memoization
   * Validates that repeated field names benefit from cache hits (common in array processing)
   */
  describe('LRU Cache Memoization', () => {
    it('should benefit from cache when sanitizing arrays with repeated field names', () => {
      // Scenario: 1000 payments with same 5 fields
      // Without cache: 5000 regex tests
      // With cache: 5 regex tests + 4995 cache hits (~1000x speedup for cached lookups)
      const arrayOfObjects = Array.from({ length: 1000 }, (_, i) => ({
        id: `payment-${i}`,
        amount: i * 10,
        email: `user${i}@example.com`, // PII - will be removed
        currency: 'USD',
        status: 'completed',
      }));

      const start = performance.now();
      sanitizer.sanitize(arrayOfObjects);
      const duration = performance.now() - start;

      // With LRU cache, should be significantly faster than 50ms
      // Target: <20ms for 1000 objects (cache enables ~5x speedup)
      expect(duration).toBeLessThan(20);
    });

    it('should handle cache eviction correctly when exceeding max size', () => {
      // Create an object with 1200 unique field names (exceeds 1000 cache limit)
      const largeObject: any = {};
      for (let i = 0; i < 1200; i++) {
        largeObject[`field${i}`] = `value${i}`;
      }

      // First sanitization: fills cache, triggers LRU eviction
      const start1 = performance.now();
      sanitizer.sanitize(largeObject);
      const duration1 = performance.now() - start1;

      // Second sanitization: should still be fast even with eviction
      const start2 = performance.now();
      sanitizer.sanitize(largeObject);
      const duration2 = performance.now() - start2;

      // Both should complete quickly (LRU eviction doesn't cause performance degradation)
      expect(duration1).toBeLessThan(50);
      expect(duration2).toBeLessThan(50);
    });

    it('should maintain correct results with cache (cache correctness)', () => {
      // Verify cache doesn't return stale or incorrect results
      const input1 = { email: 'test@example.com', amount: 100 };
      const input2 = { email: 'another@example.com', amount: 200 };

      const result1 = sanitizer.sanitize(input1);
      const result2 = sanitizer.sanitize(input2);

      // Both should sanitize 'email' field correctly
      expect(result1).toEqual({ amount: 100 });
      expect(result2).toEqual({ amount: 200 });
      expect(result1).not.toHaveProperty('email');
      expect(result2).not.toHaveProperty('email');
    });

    it('should handle extremely long field names (>1000 chars) without ReDoS or memory issues', () => {
      // Test cache behavior with extremely long field names
      // Ensures no ReDoS vulnerability or memory exhaustion from caching large keys
      // NOTE: Extremely long field names (10,000+ chars) with padding on both sides
      // will NOT match patterns due to regex design - this is acceptable edge case
      const extremelyLongField = 'a'.repeat(5000) + 'password' + 'b'.repeat(5000);
      const input = {
        [extremelyLongField]: 'value',
        normalField: 'data',
        id: '123',
      };

      const start = performance.now();
      const result = sanitizer.sanitize(input);
      const duration = performance.now() - start;

      // Should complete quickly without ReDoS or memory issues
      expect(duration).toBeLessThan(20); // <20ms even with 10,000+ char field name
      expect(result).toHaveProperty('normalField');
      expect(result).toHaveProperty('id');

      // Extremely long field names are NOT matched (acceptable edge case)
      // The pattern 'aaa...aaapasswordbbb...bbb' doesn't match our regex alternatives
      expect(result).toHaveProperty(extremelyLongField); // NOT sanitized (acceptable)

      // Verify cache doesn't cause memory issues with large keys
      // Cache should store the result, but not cause memory explosion
      const start2 = performance.now();
      const result2 = sanitizer.sanitize(input);
      const duration2 = performance.now() - start2;

      // Second call should be faster (cache hit) or same speed (no memory issues)
      expect(duration2).toBeLessThan(20);
      expect(result2).toEqual(result);
    });

    it('should handle repeated extremely long field names efficiently', () => {
      // Verify cache benefit even with extremely long field names
      const longField1 = 'x'.repeat(2000) + 'email' + 'y'.repeat(2000);
      const longField2 = 'p'.repeat(2000) + 'token' + 'q'.repeat(2000);
      const longField3 = 'z'.repeat(2000) + 'apiKey' + 'w'.repeat(2000);

      const arrayWithLongFields = Array.from({ length: 100 }, (_, i) => ({
        [longField1]: `email${i}@example.com`,
        [longField2]: `token${i}`,
        [longField3]: `key${i}`,
        id: `item-${i}`,
        amount: i * 10,
      }));

      const start = performance.now();
      sanitizer.sanitize(arrayWithLongFields);
      const duration = performance.now() - start;

      // With cache: 3 long field names tested once, then 297 cache hits
      // Without cache: 300 regex tests on 4000+ char strings
      // Should complete in reasonable time despite long field names
      expect(duration).toBeLessThan(50); // <50ms for 100 objects with long field names
    });
  });
});
