// Budget Schema Validation Tests
// Feature #063: Business Logic Test Coverage - US3
// Tests: T102-T109

import { describe, it, expect } from 'vitest';
import {
  budgetSchema,
  createBudgetInputSchema,
  updateBudgetInputSchema,
  budgetStorageSchema,
  validateBudget,
  validateCreateBudgetInput,
  validateUpdateBudgetInput,
  validateBudgetStorage,
} from '../schemas';
import { createBudget } from './fixtures';
import { expectZodSuccess, expectZodError } from '../../../../../tests/fixtures/assertion-utils';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('Budget Schemas', () => {
  describe('budgetSchema', () => {
    it('should validate complete budget with all required fields', () => {
      const budget = createBudget();
      const result = budgetSchema.safeParse(budget);

      expectZodSuccess(result);
      expect(result.data).toEqual(budget);
    });

    it('should reject budget with missing id', () => {
      const invalid = { ...createBudget() };
      delete (invalid as Partial<typeof invalid>).id;
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject budget with invalid id format', () => {
      const invalid = createBudget({ id: 'invalid_id_format' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject budget with missing categoryId', () => {
      const invalid = { ...createBudget() };
      delete (invalid as Partial<typeof invalid>).categoryId;
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });

    it('should reject budget with invalid categoryId format', () => {
      const invalid = createBudget({ categoryId: 'invalid_category_id' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });

    it('should reject budget with missing amount', () => {
      const invalid = { ...createBudget() };
      delete (invalid as Partial<typeof invalid>).amount;
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'amount');
    });

    it('should reject budget with negative amount', () => {
      const invalid = createBudget({ amount: -1000 });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'amount');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject budget with zero amount', () => {
      const invalid = createBudget({ amount: 0 });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'amount');
    });

    it('should reject budget with decimal amount', () => {
      const invalid = { ...createBudget(), amount: 100.50 };
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'amount');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    it('should validate budget with MAX_SAFE_INTEGER amount', () => {
      const budget = createBudget({ amount: Number.MAX_SAFE_INTEGER });
      const result = budgetSchema.safeParse(budget);

      expectZodSuccess(result);
      expect(result.data?.amount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should reject budget with missing period', () => {
      const invalid = { ...createBudget() };
      delete (invalid as Partial<typeof invalid>).period;
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'period');
    });

    it('should reject budget with invalid period format (missing month)', () => {
      const invalid = createBudget({ period: '2025' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'period');
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('YYYY-MM');
      }
    });

    it('should reject budget with invalid period format (wrong separator)', () => {
      const invalid = createBudget({ period: '2025/11' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'period');
    });

    it('should reject budget with invalid month (00)', () => {
      const invalid = createBudget({ period: '2025-00' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'period');
    });

    it('should reject budget with invalid month (13)', () => {
      const invalid = createBudget({ period: '2025-13' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'period');
    });

    it('should validate budget with January (01)', () => {
      const budget = createBudget({ period: '2025-01' });
      const result = budgetSchema.safeParse(budget);

      expectZodSuccess(result);
    });

    it('should validate budget with December (12)', () => {
      const budget = createBudget({ period: '2025-12' });
      const result = budgetSchema.safeParse(budget);

      expectZodSuccess(result);
    });

    it('should reject budget with invalid timestamp format', () => {
      const invalid = createBudget({ createdAt: '2025-11-03' }); // Date only, not datetime
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'createdAt');
    });

    it('should reject budget with invalid updatedAt format', () => {
      const invalid = createBudget({ updatedAt: 'not-a-date' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'updatedAt');
    });

    // Edge cases: ID validation
    it('should reject budget ID with spaces', () => {
      const invalid = createBudget({ id: 'budget_with spaces' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject budget ID with special characters', () => {
      const invalid = createBudget({ id: 'budget_with@special!' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject budget ID with uppercase letters', () => {
      const invalid = createBudget({ id: 'budget_WithUpperCase' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject categoryId with spaces', () => {
      const invalid = createBudget({ categoryId: 'cat_with spaces' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });

    it('should reject categoryId with special characters', () => {
      const invalid = createBudget({ categoryId: 'cat_with@special!' });
      const result = budgetSchema.safeParse(invalid);

      expectZodError(result, 'categoryId');
    });
  });

  describe('createBudgetInputSchema', () => {
    it('should validate create input with all required fields', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: sharedFixtures.amounts.hundredDollars,
        period: '2025-11',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject create input with missing categoryId', () => {
      const input = {
        amount: sharedFixtures.amounts.hundredDollars,
        period: '2025-11',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'categoryId');
    });

    it('should reject create input with missing amount', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        period: '2025-11',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });

    it('should reject create input with missing period', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: sharedFixtures.amounts.hundredDollars,
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'period');
    });

    it('should reject create input with negative amount', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: -1000,
        period: '2025-11',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });

    it('should reject create input with invalid categoryId', () => {
      const input = {
        categoryId: 'not-a-category-id',
        amount: sharedFixtures.amounts.hundredDollars,
        period: '2025-11',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'categoryId');
    });

    it('should reject create input with invalid period', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: sharedFixtures.amounts.hundredDollars,
        period: '2025-13',
      };

      const result = createBudgetInputSchema.safeParse(input);
      expectZodError(result, 'period');
    });
  });

  describe('updateBudgetInputSchema', () => {
    it('should validate update input with no fields (all optional)', () => {
      const input = {};

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only amount', () => {
      const input = {
        amount: sharedFixtures.amounts.fiftyDollars,
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with only period', () => {
      const input = {
        period: '2025-12',
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should validate update input with both fields', () => {
      const input = {
        amount: sharedFixtures.amounts.thousandDollars,
        period: '2026-01',
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject update input with negative amount', () => {
      const input = {
        amount: -500,
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });

    it('should reject update input with zero amount', () => {
      const input = {
        amount: 0,
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });

    it('should reject update input with invalid period', () => {
      const input = {
        period: '2025/11',
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodError(result, 'period');
    });

    it('should reject update input with decimal amount', () => {
      const input = {
        amount: 123.45,
      };

      const result = updateBudgetInputSchema.safeParse(input);
      expectZodError(result, 'amount');
    });
  });

  describe('budgetStorageSchema', () => {
    it('should validate storage with budgets array', () => {
      const storage = {
        version: '1.0.0',
        budgets: [createBudget(), createBudget()],
        totalSize: 2,
        lastModified: new Date().toISOString(),
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodSuccess(result);
    });

    it('should validate storage with empty budgets array', () => {
      const storage = {
        version: '1.0.0',
        budgets: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodSuccess(result);
    });

    it('should reject storage with invalid version format', () => {
      const storage = {
        version: '1.0', // Not semver
        budgets: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodError(result, 'version');
    });

    it('should reject storage with negative totalSize', () => {
      const storage = {
        version: '1.0.0',
        budgets: [],
        totalSize: -1,
        lastModified: new Date().toISOString(),
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodError(result, 'totalSize');
    });

    it('should reject storage with non-integer totalSize', () => {
      const storage = {
        version: '1.0.0',
        budgets: [],
        totalSize: 2.5,
        lastModified: new Date().toISOString(),
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodError(result, 'totalSize');
    });

    it('should reject storage with invalid lastModified', () => {
      const storage = {
        version: '1.0.0',
        budgets: [],
        totalSize: 0,
        lastModified: '2025-11-03', // Date only
      };

      const result = budgetStorageSchema.safeParse(storage);
      expectZodError(result, 'lastModified');
    });
  });

  describe('validation functions', () => {
    it('validateBudget should return success for valid budget', () => {
      const budget = createBudget();
      const result = validateBudget(budget);

      expectZodSuccess(result);
    });

    it('validateBudget should return error for invalid budget', () => {
      const invalid = createBudget({ amount: -1000 });
      const result = validateBudget(invalid);

      expectZodError(result);
    });

    it('validateCreateBudgetInput should return success for valid input', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: sharedFixtures.amounts.hundredDollars,
        period: '2025-11',
      };
      const result = validateCreateBudgetInput(input);

      expectZodSuccess(result);
    });

    it('validateCreateBudgetInput should return error for invalid input', () => {
      const input = {
        categoryId: sharedFixtures.ids.categoryId1,
        amount: -1000,
        period: '2025-11',
      };
      const result = validateCreateBudgetInput(input);

      expectZodError(result);
    });

    it('validateUpdateBudgetInput should return success for valid input', () => {
      const input = {
        amount: sharedFixtures.amounts.fiftyDollars,
      };
      const result = validateUpdateBudgetInput(input);

      expectZodSuccess(result);
    });

    it('validateUpdateBudgetInput should return error for invalid input', () => {
      const input = {
        period: '2025-13',
      };
      const result = validateUpdateBudgetInput(input);

      expectZodError(result);
    });

    it('validateBudgetStorage should return success for valid storage', () => {
      const storage = {
        version: '1.0.0',
        budgets: [createBudget()],
        totalSize: 1,
        lastModified: new Date().toISOString(),
      };
      const result = validateBudgetStorage(storage);

      expectZodSuccess(result);
    });

    it('validateBudgetStorage should return error for invalid storage', () => {
      const storage = {
        version: 'invalid',
        budgets: [],
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };
      const result = validateBudgetStorage(storage);

      expectZodError(result);
    });
  });
});
