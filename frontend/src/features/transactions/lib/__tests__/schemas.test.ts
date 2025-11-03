// Transaction Schema Validation Tests
// Feature #063: Business Logic Test Coverage - US3
// Tests: T110-T118

import { describe, it, expect } from 'vitest';
import {
  transactionSchema,
  createTransactionInputSchema,
  updateTransactionInputSchema,
  validateTransaction,
  validateCreateTransactionInput,
  validateUpdateTransactionInput,
} from '../schemas';
import { expectZodSuccess, expectZodError } from '../../../../../tests/fixtures/assertion-utils';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

// Helper to create minimal transaction for schema testing
// Note: Uses inline definition to avoid coupling to full Transaction type
// Uses deterministic ID (can be overridden in test)
function createTestTransaction(overrides?: Partial<ReturnType<typeof createTestTransaction>>) {
  return {
    id: sharedFixtures.ids.transactionId1,
    amount: sharedFixtures.amounts.hundredDollars,
    description: 'Test transaction',
    date: '2025-11-15',
    categoryId: sharedFixtures.ids.categoryId1,
    createdAt: sharedFixtures.dates.jan1.toISOString(),
    ...overrides,
  };
}

describe('Transaction Schemas', () => {
  describe('transactionSchema', () => {
    it('should validate complete transaction with all required fields', () => {
      const transaction = createTestTransaction();
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      expect(result.data).toEqual(transaction);
    });

    it('should validate transaction without categoryId (optional)', () => {
      const transaction = createTestTransaction();
      delete (transaction as Partial<typeof transaction>).categoryId;
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      expect(result.data?.categoryId).toBeUndefined();
    });

    it('should reject transaction with invalid categoryId format', () => {
      const invalid = createTestTransaction({ categoryId: 'invalid-category-id' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cat_');
      }
    });

    it('should reject transaction with missing id', () => {
      const invalid = { ...createTestTransaction() };
      delete (invalid as Partial<typeof invalid>).id;
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject transaction with invalid id format', () => {
      const invalid = createTestTransaction({ id: 'invalid-id-format' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject transaction with missing amount', () => {
      const invalid = { ...createTestTransaction() };
      delete (invalid as Partial<typeof invalid>).amount;
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'amount');
    });

    it('should validate transaction with negative amount (refund)', () => {
      const transaction = createTestTransaction({ amount: -5000 });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      expect(result.data?.amount).toBe(-5000);
    });

    it('should validate transaction with zero amount', () => {
      const transaction = createTestTransaction({ amount: 0 });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      expect(result.data?.amount).toBe(0);
    });

    it('should reject transaction with decimal amount', () => {
      const invalid = { ...createTestTransaction(), amount: 123.45 };
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'amount');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('int');
      }
    });

    it('should validate transaction with MAX_SAFE_INTEGER amount', () => {
      const transaction = createTestTransaction({ amount: Number.MAX_SAFE_INTEGER });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
    });

    it('should validate transaction with MIN_SAFE_INTEGER amount', () => {
      const transaction = createTestTransaction({ amount: Number.MIN_SAFE_INTEGER });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
    });

    it('should reject transaction with missing description', () => {
      const invalid = { ...createTestTransaction() };
      delete (invalid as Partial<typeof invalid>).description;
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'description');
    });

    it('should reject transaction with empty description', () => {
      const invalid = createTestTransaction({ description: '' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'description');
    });

    it('should reject transaction with description exceeding 200 characters', () => {
      const invalid = createTestTransaction({ description: 'A'.repeat(201) });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'description');
    });

    it('should validate transaction with 200 character description', () => {
      const transaction = createTestTransaction({ description: 'A'.repeat(200) });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
    });

    it('should reject transaction with missing date', () => {
      const invalid = { ...createTestTransaction() };
      delete (invalid as Partial<typeof invalid>).date;
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'date');
    });

    it('should reject transaction with invalid date format (MM/DD/YYYY)', () => {
      const invalid = createTestTransaction({ date: '11/15/2025' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'date');
    });

    it('should reject transaction with invalid date format (datetime)', () => {
      const invalid = createTestTransaction({ date: '2025-11-15T10:00:00Z' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'date');
    });

    it('should validate transaction with YYYY-MM-DD date', () => {
      const transaction = createTestTransaction({ date: '2025-01-01' });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
    });

    it('should reject transaction with invalid createdAt format', () => {
      const invalid = createTestTransaction({ createdAt: '2025-11-03' }); // Date only
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'createdAt');
    });

    it('should validate transaction with Unicode description', () => {
      const transaction = createTestTransaction({ description: 'Test 测试 тест 🎉' });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
    });

    // Edge cases: ID validation
    it('should reject transaction ID with spaces', () => {
      const invalid = createTestTransaction({ id: 'txn_with spaces' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject transaction ID with special characters', () => {
      const invalid = createTestTransaction({ id: 'txn_with@special!' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject transaction ID with uppercase letters', () => {
      const invalid = createTestTransaction({ id: 'txn_WithUpperCase' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject categoryId with spaces', () => {
      const invalid = createTestTransaction({ categoryId: 'cat_with spaces' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });

    it('should reject categoryId with special characters', () => {
      const invalid = createTestTransaction({ categoryId: 'cat_with@special!' });
      const result = transactionSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });

    // Edge cases: Special characters in description (XSS prevention)
    it('should validate description with HTML-like content', () => {
      const transaction = createTestTransaction({ description: '<script>alert("test")</script>' });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      // Note: Zod doesn't sanitize, but React escapes by default
    });

    it('should validate description with SQL-like content', () => {
      const transaction = createTestTransaction({ description: "'; DROP TABLE transactions; --" });
      const result = transactionSchema.safeParse(transaction);

      expectZodSuccess(result);
      // Note: No SQL injection risk with localStorage
    });
  });

  describe('createTransactionInputSchema', () => {
    it('should validate create input with all required fields and categoryId', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: 'Test transaction',
        date: '2025-11-15',
        categoryId: sharedFixtures.ids.categoryId1,
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate create input without categoryId', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: 'Test transaction',
        date: '2025-11-15',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject create input with missing amount', () => {
      const input = {
        description: 'Test transaction',
        date: '2025-11-15',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });

    it('should reject create input with missing description', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        date: '2025-11-15',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'description');
    });

    it('should reject create input with missing date', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: 'Test transaction',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'date');
    });

    it('should reject create input with empty description', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: '',
        date: '2025-11-15',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'description');
    });

    it('should reject create input with invalid date format', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: 'Test transaction',
        date: '11/15/2025',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'date');
    });

    it('should reject create input with decimal amount', () => {
      const input = {
        amount: 100.50,
        description: 'Test transaction',
        date: '2025-11-15',
      };

      const result = createTransactionInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });
  });

  describe('updateTransactionInputSchema', () => {
    it('should validate update input with no fields (all optional)', () => {
      const input = {};

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only amount', () => {
      const input = {
        amount: sharedFixtures.amounts.fiftyDollars,
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only description', () => {
      const input = {
        description: 'Updated description',
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only date', () => {
      const input = {
        date: '2025-12-01',
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with categoryId set to null (uncategorized)', () => {
      const input = {
        categoryId: null,
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with categoryId set to string', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId2,
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with all fields', () => {
      const input = {
        amount: sharedFixtures.amounts.thousandDollars,
        description: 'Updated transaction',
        date: '2025-12-01',
        categoryId: sharedFixtures.ids.categoryId3,
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject update input with empty description', () => {
      const input = {
        description: '',
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodError(result, 'description');
    });

    it('should reject update input with description exceeding 200 characters', () => {
      const input = {
        description: 'A'.repeat(201),
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodError(result, 'description');
    });

    it('should reject update input with invalid date format', () => {
      const input = {
        date: '2025/11/15',
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodError(result, 'date');
    });

    it('should reject update input with decimal amount', () => {
      const input = {
        amount: 123.45,
      };

      const result = updateTransactionInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });
  });

  describe('validation functions', () => {
    it('validateTransaction should return success for valid transaction', () => {
      const transaction = createTestTransaction();
      const result = validateTransaction(transaction);

      expectZodSuccess(result);
    });

    it('validateTransaction should return error for invalid transaction', () => {
      const invalid = createTestTransaction({ description: '' });
      const result = validateTransaction(invalid);

      expectZodError(result);
    });

    it('validateCreateTransactionInput should return success for valid input', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: 'Test transaction',
        date: '2025-11-15',
      };
      const result = validateCreateTransactionInput(input);

      expectZodSuccess(result);
    });

    it('validateCreateTransactionInput should return error for invalid input', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        description: '',
        date: '2025-11-15',
      };
      const result = validateCreateTransactionInput(input);

      expectZodError(result);
    });

    it('validateUpdateTransactionInput should return success for valid input', () => {
      const input = {
        description: 'Updated description',
      };
      const result = validateUpdateTransactionInput(input);

      expectZodSuccess(result);
    });

    it('validateUpdateTransactionInput should return error for invalid input', () => {
      const input = {
        date: '11/15/2025',
      };
      const result = validateUpdateTransactionInput(input);

      expectZodError(result);
    });
  });
});
