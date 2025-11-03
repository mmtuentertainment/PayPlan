// BudgetStorageService Tests
// Feature #063: Business Logic Test Coverage - US2
// Target: 80%+ coverage for BudgetStorageService.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetStorageService } from '../BudgetStorageService';
import { createBudget, BudgetBuilder } from './fixtures';
import type { Budget, CreateBudgetInput } from '../../types/budget';
import { ERROR_MESSAGES, MAX_BUDGETS, STORAGE_KEY } from '../constants';

describe('BudgetStorageService', () => {
  let service: BudgetStorageService;

  beforeEach(() => {
    service = new BudgetStorageService();
    localStorage.clear();
  });

  describe('loadBudgets', () => {
    it('should return empty array on first load', () => {
      const result = service.loadBudgets();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return budgets from localStorage if they exist', () => {
      // Create a budget
      const createResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      });
      expect(createResult.success).toBe(true);

      // Load should return the budget
      const loadResult = service.loadBudgets();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(1);
        expect(loadResult.data[0].categoryId).toBe('cat_groceries');
      }
    });

    it('should return error for corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const result = service.loadBudgets();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.DESERIALIZATION_FAILED);
      }
    });

    it('should handle SecurityError when localStorage is denied', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function () {
        const error = new Error('localStorage access denied');
        error.name = 'SecurityError';
        throw error;
      };

      const result = service.loadBudgets();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.STORAGE_ACCESS_DENIED);
      }

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('createBudget', () => {
    it('should create a new budget', () => {
      const input: CreateBudgetInput = {
        categoryId: 'cat_groceries',
        amount: 50000, // $500.00
        period: '2025-11',
      };

      const result = service.createBudget(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toMatch(/^budget_/);
        expect(result.data.categoryId).toBe(input.categoryId);
        expect(result.data.amount).toBe(input.amount);
        expect(result.data.period).toBe(input.period);
        expect(result.data.createdAt).toBeDefined();
        expect(result.data.updatedAt).toBeDefined();
      }
    });

    it('should persist budget to localStorage', () => {
      const input: CreateBudgetInput = {
        categoryId: 'cat_dining',
        amount: 30000,
        period: '2025-12',
      };

      service.createBudget(input);

      const loadResult = service.loadBudgets();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((b) => b.categoryId === input.categoryId);
        expect(found).toBeDefined();
      }
    });

    it('should return error for duplicate budget (same category + period)', () => {
      const input: CreateBudgetInput = {
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      };

      // First creation succeeds
      const firstResult = service.createBudget(input);
      expect(firstResult.success).toBe(true);

      // Second creation with same category + period fails
      const result = service.createBudget(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.DUPLICATE_BUDGET);
      }
    });

    it('should allow duplicate category in different periods', () => {
      // Create budget for November
      const novemberResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      });
      expect(novemberResult.success).toBe(true);

      // Create budget for December (same category, different period)
      const decemberResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 60000,
        period: '2025-12',
      });
      expect(decemberResult.success).toBe(true);
    });

    it('should return error when max budgets limit is reached', () => {
      // Create MAX_BUDGETS budgets
      for (let i = 0; i < MAX_BUDGETS; i++) {
        const result = service.createBudget({
          categoryId: `cat_${i}`,
          amount: 10000,
          period: '2025-11',
        });
        expect(result.success).toBe(true);
      }

      // Next creation should fail
      const result = service.createBudget({
        categoryId: 'cat_over_limit',
        amount: 10000,
        period: '2025-11',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.MAX_BUDGETS_REACHED);
      }
    });

    it('should return error for invalid input (negative amount)', () => {
      const input = {
        categoryId: 'cat_groceries',
        amount: -1000, // Invalid: negative
        period: '2025-11',
      };

      const result = service.createBudget(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.INVALID_BUDGET_DATA);
      }
    });

    it('should return error for invalid input (invalid period format)', () => {
      const input = {
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-13', // Invalid: month > 12
      };

      const result = service.createBudget(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.INVALID_BUDGET_DATA);
      }
    });
  });

  describe('updateBudget', () => {
    let existingBudget: Budget;

    beforeEach(() => {
      const createResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      });
      if (createResult.success) {
        existingBudget = createResult.data;
      }
    });

    it('should update budget amount', () => {
      const result = service.updateBudget(existingBudget.id, {
        amount: 60000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(60000);
        expect(result.data.id).toBe(existingBudget.id);
        expect(result.data.categoryId).toBe(existingBudget.categoryId);
        expect(new Date(result.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(existingBudget.createdAt).getTime()
        );
      }
    });

    it('should update budget period', () => {
      const result = service.updateBudget(existingBudget.id, {
        period: '2025-12',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe('2025-12');
        expect(result.data.amount).toBe(existingBudget.amount); // Unchanged
      }
    });

    it('should persist updates to localStorage', () => {
      service.updateBudget(existingBudget.id, {
        amount: 75000,
      });

      const loadResult = service.loadBudgets();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((b) => b.id === existingBudget.id);
        expect(found?.amount).toBe(75000);
      }
    });

    it('should return error for non-existent budget', () => {
      const result = service.updateBudget('budget_nonexistent', {
        amount: 60000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.BUDGET_NOT_FOUND);
      }
    });

    it('should return error when updating period creates duplicate', () => {
      // Create another budget for December
      service.createBudget({
        categoryId: 'cat_groceries',
        amount: 60000,
        period: '2025-12',
      });

      // Try to update November budget to December (creates duplicate)
      const result = service.updateBudget(existingBudget.id, {
        period: '2025-12',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.DUPLICATE_BUDGET);
      }
    });

    it('should allow updating to same period (no duplicate)', () => {
      const result = service.updateBudget(existingBudget.id, {
        period: existingBudget.period,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteBudget', () => {
    let budget: Budget;

    beforeEach(() => {
      const createResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      });
      if (createResult.success) {
        budget = createResult.data;
      }
    });

    it('should delete budget', () => {
      const result = service.deleteBudget(budget.id);

      expect(result.success).toBe(true);

      // Verify budget is removed
      const loadResult = service.loadBudgets();
      if (loadResult.success) {
        const found = loadResult.data.find((b) => b.id === budget.id);
        expect(found).toBeUndefined();
      }
    });

    it('should persist deletion to localStorage', () => {
      service.deleteBudget(budget.id);

      const loadResult = service.loadBudgets();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(0);
      }
    });

    it('should return error for non-existent budget', () => {
      const result = service.deleteBudget('budget_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.BUDGET_NOT_FOUND);
      }
    });
  });

  describe('getBudget', () => {
    let budget: Budget;

    beforeEach(() => {
      const createResult = service.createBudget({
        categoryId: 'cat_groceries',
        amount: 50000,
        period: '2025-11',
      });
      if (createResult.success) {
        budget = createResult.data;
      }
    });

    it('should retrieve budget by ID', () => {
      const result = service.getBudget(budget.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(budget.id);
        expect(result.data.categoryId).toBe(budget.categoryId);
      }
    });

    it('should return error for non-existent budget', () => {
      const result = service.getBudget('budget_nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.BUDGET_NOT_FOUND);
      }
    });
  });

  describe('getBudgetsByCategory', () => {
    beforeEach(() => {
      // Create budgets for different categories and periods
      service.createBudget({ categoryId: 'cat_groceries', amount: 50000, period: '2025-11' });
      service.createBudget({ categoryId: 'cat_groceries', amount: 60000, period: '2025-12' });
      service.createBudget({ categoryId: 'cat_dining', amount: 30000, period: '2025-11' });
    });

    it('should return budgets for specific category', () => {
      const result = service.getBudgetsByCategory('cat_groceries');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data.every((b) => b.categoryId === 'cat_groceries')).toBe(true);
      }
    });

    it('should return empty array for category with no budgets', () => {
      const result = service.getBudgetsByCategory('cat_nonexistent');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('getBudgetByCategoryAndPeriod', () => {
    beforeEach(() => {
      service.createBudget({ categoryId: 'cat_groceries', amount: 50000, period: '2025-11' });
      service.createBudget({ categoryId: 'cat_groceries', amount: 60000, period: '2025-12' });
    });

    it('should return budget for specific category and period', () => {
      const result = service.getBudgetByCategoryAndPeriod('cat_groceries', '2025-11');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        expect(result.data?.categoryId).toBe('cat_groceries');
        expect(result.data?.period).toBe('2025-11');
      }
    });

    it('should return null for non-existent budget', () => {
      const result = service.getBudgetByCategoryAndPeriod('cat_groceries', '2026-01');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getBudgetsByPeriod', () => {
    beforeEach(() => {
      service.createBudget({ categoryId: 'cat_groceries', amount: 50000, period: '2025-11' });
      service.createBudget({ categoryId: 'cat_dining', amount: 30000, period: '2025-11' });
      service.createBudget({ categoryId: 'cat_groceries', amount: 60000, period: '2025-12' });
    });

    it('should return budgets for specific period', () => {
      const result = service.getBudgetsByPeriod('2025-11');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data.every((b) => b.period === '2025-11')).toBe(true);
      }
    });

    it('should return empty array for period with no budgets', () => {
      const result = service.getBudgetsByPeriod('2026-01');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('clearAll', () => {
    it('should remove all budgets from localStorage', () => {
      service.createBudget({ categoryId: 'cat_groceries', amount: 50000, period: '2025-11' });

      const clearResult = service.clearAll();
      expect(clearResult.success).toBe(true);

      const data = localStorage.getItem(STORAGE_KEY);
      expect(data).toBeNull();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', () => {
      service.createBudget({ categoryId: 'cat_groceries', amount: 50000, period: '2025-11' });
      service.createBudget({ categoryId: 'cat_dining', amount: 30000, period: '2025-11' });

      const result = service.getStorageStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalBudgets).toBe(2);
        expect(result.data.storageSize).toBeGreaterThan(0);
        expect(result.data.storageSizePercentage).toBeGreaterThanOrEqual(0);
        expect(result.data.storageSizePercentage).toBeLessThanOrEqual(100);
      }
    });
  });
});
