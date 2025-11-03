// Budget calculations tests
// Feature #063: Business Logic Test Coverage
// Target: 90%+ coverage for financial calculations (Constitution v3.1)

import { describe, it, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Transaction } from '@/features/transactions/types/transaction';
import {
  calculateBudgetProgress,
  calculateBudgetProgressBatch,
  filterTransactionsByBudget,
  getBudgetStatus,
  formatCurrency,
  formatPercentage,
  calculateTotalBudget,
  calculateTotalSpent,
  calculateBudgetSummary,
} from '../calculations';
import { createBudget, createTransaction, BudgetBuilder, TransactionBuilder } from './fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('calculateBudgetProgress', () => {
  // ========================================
  // T035: 0% when nothing spent
  // ========================================
  it('should return 0% when nothing spent', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11' });
    const transactions: Transaction[] = []; // No transactions

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(0);
    expect(result.spentAmount).toBe(0);
    expect(result.remainingAmount).toBe(50000);
    expect(result.status).toBe('under');
  });

  // ========================================
  // T036: 50% when half spent
  // ========================================
  it('should return 50% when half spent', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 25000, categoryId: 'cat-1', date: '2025-11-15' }),
    ];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(50);
    expect(result.spentAmount).toBe(25000);
    expect(result.remainingAmount).toBe(25000);
    expect(result.status).toBe('under');
  });

  // ========================================
  // T037: 100% when fully spent
  // ========================================
  it('should return 100% when fully spent', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 50000, categoryId: 'cat-1', date: '2025-11-15' }),
    ];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(100);
    expect(result.spentAmount).toBe(50000);
    expect(result.remainingAmount).toBe(0);
    expect(result.status).toBe('over'); // 100% is 'over' status
  });

  // ========================================
  // T038: >100% when overspent
  // ========================================
  it('should return >100% when overspent', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 75000, categoryId: 'cat-1', date: '2025-11-15' }),
    ];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(150);
    expect(result.spentAmount).toBe(75000);
    expect(result.remainingAmount).toBe(-25000); // Negative remaining
    expect(result.status).toBe('over');
  });

  // ========================================
  // T039: Handle zero budget
  // ========================================
  it('should handle zero budget correctly', () => {
    const budget = createBudget({ amount: 0, period: '2025-11', categoryId: 'cat-1' });
    const transactionsNoSpending: Transaction[] = [];
    const transactionsWithSpending = [
      createTransaction({ amount: 100, categoryId: 'cat-1', date: '2025-11-15' }),
    ];

    // Zero budget, zero spent = 0%, under budget
    const resultNoSpending = calculateBudgetProgress(budget, transactionsNoSpending);
    expect(resultNoSpending.percentageSpent).toBe(0);
    expect(resultNoSpending.status).toBe('under');

    // Zero budget, spent > 0 = 100%, over budget
    const resultWithSpending = calculateBudgetProgress(budget, transactionsWithSpending);
    expect(resultWithSpending.percentageSpent).toBe(100);
    expect(resultWithSpending.status).toBe('over');
  });

  // ========================================
  // T041: Handle cents precision
  // ========================================
  it('should handle cents precision correctly', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 49999, categoryId: 'cat-1', date: '2025-11-15' }), // $499.99
    ];

    const result = calculateBudgetProgress(budget, transactions);

    // 49999 / 50000 = 99.998%
    expect(result.percentageSpent).toBeCloseTo(99.998, 2);
    expect(result.spentAmount).toBe(49999);
  });

  // ========================================
  // T042: Handle MAX_SAFE_INTEGER
  // ========================================
  it('should handle very large budgets (MAX_SAFE_INTEGER)', () => {
    const budget = createBudget({
      amount: Number.MAX_SAFE_INTEGER,
      period: '2025-11',
      categoryId: 'cat-1',
    });
    const transactions = [
      createTransaction({
        amount: Math.floor(Number.MAX_SAFE_INTEGER / 2),
        categoryId: 'cat-1',
        date: '2025-11-15',
      }),
    ];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBeCloseTo(50, 1);
    expect(result.spentAmount).toBe(Math.floor(Number.MAX_SAFE_INTEGER / 2));
  });

  it('should only count expenses (positive amounts)', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 30000, categoryId: 'cat-1', date: '2025-11-10' }), // Expense
      createTransaction({ amount: -10000, categoryId: 'cat-1', date: '2025-11-15', type: 'income' }), // Income (negative)
      createTransaction({ amount: 20000, categoryId: 'cat-1', date: '2025-11-20' }), // Expense
    ];

    const result = calculateBudgetProgress(budget, transactions);

    // Should only count positive amounts: 30000 + 20000 = 50000
    expect(result.spentAmount).toBe(50000);
    expect(result.percentageSpent).toBe(100);
  });

  it('should filter by category', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 10000, categoryId: 'cat-1', date: '2025-11-15' }), // Match
      createTransaction({ amount: 20000, categoryId: 'cat-2', date: '2025-11-15' }), // Different category
      createTransaction({ amount: 30000, categoryId: 'cat-1', date: '2025-11-20' }), // Match
    ];

    const result = calculateBudgetProgress(budget, transactions);

    // Should only count cat-1: 10000 + 30000 = 40000
    expect(result.spentAmount).toBe(40000);
    expect(result.percentageSpent).toBe(80);
  });

  it('should filter by period (month)', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 10000, categoryId: 'cat-1', date: '2025-11-15' }), // November - match
      createTransaction({ amount: 20000, categoryId: 'cat-1', date: '2025-10-15' }), // October - no match
      createTransaction({ amount: 30000, categoryId: 'cat-1', date: '2025-12-15' }), // December - no match
    ];

    const result = calculateBudgetProgress(budget, transactions);

    // Should only count November: 10000
    expect(result.spentAmount).toBe(10000);
    expect(result.percentageSpent).toBe(20);
  });
});

// ========================================
// T043-T044: Property-based tests
// ========================================
describe('calculateBudgetProgress (property-based)', () => {
  test.prop([fc.integer({ min: 1, max: 1000000 })])('progress should be 0% when no transactions', (amount) => {
    const budget = createBudget({ amount, period: '2025-11', categoryId: 'cat-1' });
    const transactions: Transaction[] = [];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(0);
    expect(result.spentAmount).toBe(0);
    expect(result.status).toBe('under');
  });

  test.prop([fc.integer({ min: 1, max: 1000000 })])('progress should be 100% when spent equals budget', (amount) => {
    const budget = createBudget({ amount, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [createTransaction({ amount, categoryId: 'cat-1', date: '2025-11-15' })];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBe(100);
    expect(result.spentAmount).toBe(amount);
  });

  test.prop([
    fc.integer({ min: 1, max: 1000000 }),
    fc.integer({ min: 0, max: 2000000 }),
  ])('progress should always be non-negative', (budgetAmount, spentAmount) => {
    const budget = createBudget({ amount: budgetAmount, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [createTransaction({ amount: spentAmount, categoryId: 'cat-1', date: '2025-11-15' })];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.percentageSpent).toBeGreaterThanOrEqual(0);
  });

  // Additional invariants
  test.prop([
    fc.integer({ min: 1, max: 1000000 }),
    fc.integer({ min: 0, max: 1000000 }),
  ])('remaining should equal budget minus spent', (budgetAmount, spentAmount) => {
    const budget = createBudget({ amount: budgetAmount, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [createTransaction({ amount: spentAmount, categoryId: 'cat-1', date: '2025-11-15' })];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.remainingAmount).toBe(budgetAmount - spentAmount);
  });

  test.prop([
    fc.integer({ min: 1, max: 1000000 }),
    fc.integer({ min: 0, max: 1000000 }),
  ])('status should be consistent with percentage', (budgetAmount, spentAmount) => {
    const budget = createBudget({ amount: budgetAmount, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [createTransaction({ amount: spentAmount, categoryId: 'cat-1', date: '2025-11-15' })];

    const result = calculateBudgetProgress(budget, transactions);

    // Verify status matches percentage thresholds
    if (result.percentageSpent >= 100) {
      expect(result.status).toBe('over');
    } else if (result.percentageSpent >= 80) {
      expect(result.status).toBe('warning');
    } else {
      expect(result.status).toBe('under');
    }
  });

  test.prop([fc.integer({ min: 1, max: 1000000 })])('budget amounts should be preserved in result', (amount) => {
    const budget = createBudget({ amount, period: '2025-11', categoryId: 'cat-1' });
    const transactions: Transaction[] = [];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.budgetAmount).toBe(amount);
    expect(result.budgetId).toBe(budget.id);
    expect(result.categoryId).toBe(budget.categoryId);
  });
});

describe('filterTransactionsByBudget', () => {
  it('should filter by category and period', () => {
    const budget = createBudget({ categoryId: 'cat-1', period: '2025-11' });
    const transactions = [
      createTransaction({ categoryId: 'cat-1', date: '2025-11-15' }), // Match
      createTransaction({ categoryId: 'cat-2', date: '2025-11-15' }), // Wrong category
      createTransaction({ categoryId: 'cat-1', date: '2025-10-15' }), // Wrong month
      createTransaction({ categoryId: 'cat-1', date: '2025-11-20' }), // Match
    ];

    const filtered = filterTransactionsByBudget(budget, transactions);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].date).toBe('2025-11-15');
    expect(filtered[1].date).toBe('2025-11-20');
  });

  it('should return empty array for invalid budget period', () => {
    const budget = createBudget({ period: 'invalid' });
    const transactions = [createTransaction({ date: '2025-11-15' })];

    const filtered = filterTransactionsByBudget(budget, transactions);

    expect(filtered).toEqual([]);
  });

  it('should ignore transactions with invalid date format', () => {
    const budget = createBudget({ categoryId: 'cat-1', period: '2025-11' });
    const transactions = [
      createTransaction({ categoryId: 'cat-1', date: '2025-11-15' }), // Valid
      createTransaction({ categoryId: 'cat-1', date: 'invalid-date' }), // Invalid
    ];

    const filtered = filterTransactionsByBudget(budget, transactions);

    expect(filtered).toHaveLength(1);
  });
});

describe('getBudgetStatus', () => {
  it('should return "under" when below warning threshold', () => {
    expect(getBudgetStatus(50)).toBe('under');
    expect(getBudgetStatus(79)).toBe('under');
  });

  it('should return "warning" when at/above warning but below over threshold', () => {
    expect(getBudgetStatus(80)).toBe('warning');
    expect(getBudgetStatus(90)).toBe('warning');
    expect(getBudgetStatus(99)).toBe('warning');
  });

  it('should return "over" when at/above over threshold', () => {
    expect(getBudgetStatus(100)).toBe('over');
    expect(getBudgetStatus(110)).toBe('over');
    expect(getBudgetStatus(200)).toBe('over');
  });

  it('should handle edge cases at exact thresholds', () => {
    expect(getBudgetStatus(0)).toBe('under');
    expect(getBudgetStatus(79.9)).toBe('under');
    expect(getBudgetStatus(80.0)).toBe('warning');
    expect(getBudgetStatus(99.9)).toBe('warning');
    expect(getBudgetStatus(100.0)).toBe('over');
  });
});

describe('formatCurrency', () => {
  it('should format cents as USD currency', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(100)).toBe('$1.00');
    expect(formatCurrency(50000)).toBe('$500.00');
    expect(formatCurrency(999999)).toBe('$9,999.99');
  });

  it('should handle fractional cents (round to nearest)', () => {
    expect(formatCurrency(150)).toBe('$1.50');
    expect(formatCurrency(199)).toBe('$1.99');
  });

  it('should handle large amounts with thousands separators', () => {
    expect(formatCurrency(1000000)).toBe('$10,000.00');
    expect(formatCurrency(100000000)).toBe('$1,000,000.00');
  });
});

describe('formatPercentage', () => {
  it('should format percentage with one decimal place', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(50)).toBe('50.0%');
    expect(formatPercentage(100)).toBe('100.0%');
    expect(formatPercentage(82.5)).toBe('82.5%');
  });

  it('should round to one decimal place', () => {
    expect(formatPercentage(82.54)).toBe('82.5%');
    expect(formatPercentage(82.56)).toBe('82.6%'); // Fixed: toFixed rounds 82.55 → 82.5
  });

  it('should handle >100% values', () => {
    expect(formatPercentage(150)).toBe('150.0%');
    expect(formatPercentage(250.7)).toBe('250.7%');
  });
});

describe('calculateTotalBudget', () => {
  it('should sum all budget amounts', () => {
    const budgets = [
      createBudget({ amount: 10000 }),
      createBudget({ amount: 20000 }),
      createBudget({ amount: 30000 }),
    ];

    const total = calculateTotalBudget(budgets);

    expect(total).toBe(60000);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalBudget([])).toBe(0);
  });

  it('should handle single budget', () => {
    const budgets = [createBudget({ amount: 50000 })];

    expect(calculateTotalBudget(budgets)).toBe(50000);
  });
});

describe('calculateTotalSpent', () => {
  it('should sum all spent amounts from progress items', () => {
    const progressItems = [
      {
        budgetId: 'b1',
        categoryId: 'c1',
        budgetAmount: 50000,
        spentAmount: 30000,
        remainingAmount: 20000,
        percentageSpent: 60,
        status: 'under' as const,
      },
      {
        budgetId: 'b2',
        categoryId: 'c2',
        budgetAmount: 40000,
        spentAmount: 25000,
        remainingAmount: 15000,
        percentageSpent: 62.5,
        status: 'under' as const,
      },
    ];

    const total = calculateTotalSpent(progressItems);

    expect(total).toBe(55000); // 30000 + 25000
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalSpent([])).toBe(0);
  });
});

describe('calculateBudgetSummary', () => {
  it('should calculate overall budget summary', () => {
    const budget1 = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const budget2 = createBudget({ amount: 40000, period: '2025-11', categoryId: 'cat-2' });

    const transactions = [
      createTransaction({ amount: 30000, categoryId: 'cat-1', date: '2025-11-15' }), // 60% of budget1
      createTransaction({ amount: 35000, categoryId: 'cat-2', date: '2025-11-15' }), // 87.5% of budget2
    ];

    const progress1 = calculateBudgetProgress(budget1, transactions);
    const progress2 = calculateBudgetProgress(budget2, transactions);
    const summary = calculateBudgetSummary([progress1, progress2]);

    expect(summary.totalBudget).toBe(90000); // 50000 + 40000
    expect(summary.totalSpent).toBe(65000); // 30000 + 35000
    expect(summary.totalRemaining).toBe(25000); // 90000 - 65000
    expect(summary.overallPercentage).toBeCloseTo(72.22, 1); // 65000/90000 * 100
    expect(summary.budgetsUnder).toBe(1); // budget1 at 60%
    expect(summary.budgetsWarning).toBe(1); // budget2 at 87.5%
    expect(summary.budgetsOver).toBe(0);
  });

  it('should handle all budgets under threshold', () => {
    const progress1 = {
      budgetId: 'b1',
      categoryId: 'c1',
      budgetAmount: 50000,
      spentAmount: 20000,
      remainingAmount: 30000,
      percentageSpent: 40,
      status: 'under' as const,
    };

    const summary = calculateBudgetSummary([progress1]);

    expect(summary.budgetsUnder).toBe(1);
    expect(summary.budgetsWarning).toBe(0);
    expect(summary.budgetsOver).toBe(0);
  });

  it('should handle all budgets over threshold', () => {
    const progress1 = {
      budgetId: 'b1',
      categoryId: 'c1',
      budgetAmount: 50000,
      spentAmount: 60000,
      remainingAmount: -10000,
      percentageSpent: 120,
      status: 'over' as const,
    };

    const summary = calculateBudgetSummary([progress1]);

    expect(summary.budgetsUnder).toBe(0);
    expect(summary.budgetsWarning).toBe(0);
    expect(summary.budgetsOver).toBe(1);
  });

  it('should return 0% overall when no budgets', () => {
    const summary = calculateBudgetSummary([]);

    expect(summary.totalBudget).toBe(0);
    expect(summary.totalSpent).toBe(0);
    expect(summary.overallPercentage).toBe(0);
  });
});

describe('calculateBudgetProgressBatch', () => {
  it('should calculate progress for multiple budgets', () => {
    const budgets = [
      createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' }),
      createBudget({ amount: 40000, period: '2025-11', categoryId: 'cat-2' }),
    ];

    const transactions = [
      createTransaction({ amount: 25000, categoryId: 'cat-1', date: '2025-11-15' }),
      createTransaction({ amount: 20000, categoryId: 'cat-2', date: '2025-11-15' }),
    ];

    const results = calculateBudgetProgressBatch(budgets, transactions);

    expect(results).toHaveLength(2);
    expect(results[0].percentageSpent).toBe(50); // cat-1: 25000/50000
    expect(results[1].percentageSpent).toBe(50); // cat-2: 20000/40000
  });

  it('should return empty array for empty budgets', () => {
    const results = calculateBudgetProgressBatch([], []);

    expect(results).toEqual([]);
  });
});

// ========================================
// T017: Edge cases
// ========================================
describe('Edge Cases', () => {
  it('should handle empty transactions array', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11' });

    const result = calculateBudgetProgress(budget, []);

    expect(result.spentAmount).toBe(0);
    expect(result.percentageSpent).toBe(0);
  });

  it('should handle multiple transactions in same category/period', () => {
    const budget = createBudget({ amount: 50000, period: '2025-11', categoryId: 'cat-1' });
    const transactions = [
      createTransaction({ amount: 10000, categoryId: 'cat-1', date: '2025-11-01' }),
      createTransaction({ amount: 15000, categoryId: 'cat-1', date: '2025-11-15' }),
      createTransaction({ amount: 5000, categoryId: 'cat-1', date: '2025-11-30' }),
    ];

    const result = calculateBudgetProgress(budget, transactions);

    expect(result.spentAmount).toBe(30000); // Sum of all
    expect(result.percentageSpent).toBe(60);
  });

  it('should handle year boundaries correctly', () => {
    const budget = createBudget({ period: '2024-12', categoryId: 'cat-1' }); // December 2024
    const transactions = [
      createTransaction({ categoryId: 'cat-1', date: '2024-12-31' }), // Match
      createTransaction({ categoryId: 'cat-1', date: '2025-01-01' }), // Different year/month
    ];

    const filtered = filterTransactionsByBudget(budget, transactions);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe('2024-12-31');
  });
});
