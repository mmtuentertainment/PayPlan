/**
 * Budget Calculations Utilities
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US3 - Track Budget Progress
 *
 * Provides functions for calculating budget progress, status, and statistics.
 */

import type { Budget, BudgetProgress } from '../../types/budget';
import type { Transaction } from '../../types/transaction';
import { BUDGET_THRESHOLDS } from './constants';

/**
 * Calculate budget progress for a specific budget.
 *
 * @param budget - Budget to calculate progress for
 * @param transactions - All transactions (will be filtered by category and period)
 * @returns Budget progress data
 *
 * @example
 * const progress = calculateBudgetProgress(budget, transactions);
 * console.log(`${progress.percentageSpent}% spent, ${progress.status}`);
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  // Filter transactions for this budget's category and period
  const relevantTransactions = filterTransactionsByBudget(budget, transactions);

  // Calculate total spent (sum of positive amounts only, in cents)
  const spentAmount = relevantTransactions.reduce((sum, txn) => {
    // Only count expenses (positive amounts)
    return txn.amount > 0 ? sum + txn.amount : sum;
  }, 0);

  // Calculate remaining and percentage
  const remainingAmount = budget.amount - spentAmount;

  // Guard against division by zero
  let percentageSpent: number;
  let status: 'under' | 'warning' | 'over';

  if (budget.amount === 0) {
    // If budget is 0 and spent > 0, user is over budget
    // If budget is 0 and spent is 0, user is under budget
    percentageSpent = spentAmount > 0 ? 100 : 0;
    status = spentAmount > 0 ? 'over' : 'under';
  } else {
    percentageSpent = (spentAmount / budget.amount) * 100;
    status = getBudgetStatus(percentageSpent);
  }

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    budgetAmount: budget.amount,
    spentAmount,
    remainingAmount,
    percentageSpent,
    status,
  };
}

/**
 * Calculate budget progress for multiple budgets.
 *
 * @param budgets - Budgets to calculate progress for
 * @param transactions - All transactions
 * @returns Array of budget progress data
 */
export function calculateBudgetProgressBatch(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetProgress[] {
  return budgets.map((budget) => calculateBudgetProgress(budget, transactions));
}

/**
 * Filter transactions that apply to a specific budget.
 * Filters by categoryId and period (month/year).
 *
 * @param budget - Budget to filter for
 * @param transactions - All transactions
 * @returns Filtered transactions
 */
export function filterTransactionsByBudget(
  budget: Budget,
  transactions: Transaction[]
): Transaction[] {
  // Validate budget.period format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(budget.period)) {
    return [];
  }

  // Parse budget period (YYYY-MM)
  const [budgetYear, budgetMonth] = budget.period.split('-').map(Number);

  return transactions.filter((txn) => {
    // Check category match
    if (txn.categoryId !== budget.categoryId) {
      return false;
    }

    // Validate transaction date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txn.date)) {
      return false;
    }

    // Parse transaction date (YYYY-MM-DD)
    const [txnYear, txnMonth] = txn.date.split('-').map(Number);

    // Check period match
    return txnYear === budgetYear && txnMonth === budgetMonth;
  });
}

/**
 * Determine budget status based on percentage spent.
 *
 * @param percentageSpent - Percentage of budget spent (0-100+)
 * @returns Budget status
 */
export function getBudgetStatus(percentageSpent: number): 'under' | 'warning' | 'over' {
  if (percentageSpent >= BUDGET_THRESHOLDS.OVER * 100) {
    return 'over';
  }
  if (percentageSpent >= BUDGET_THRESHOLDS.WARNING * 100) {
    return 'warning';
  }
  return 'under';
}

/**
 * Format currency amount (cents to dollars).
 *
 * @param cents - Amount in cents
 * @returns Formatted currency string (e.g., "$500.00")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Format percentage with one decimal place.
 *
 * @param value - Percentage value
 * @returns Formatted percentage string (e.g., "82.5%")
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Calculate total budget amount across multiple budgets.
 *
 * @param budgets - Budgets to sum
 * @returns Total amount in cents
 */
export function calculateTotalBudget(budgets: Budget[]): number {
  return budgets.reduce((sum, budget) => sum + budget.amount, 0);
}

/**
 * Calculate total spent across multiple budget progress items.
 *
 * @param progressItems - Budget progress items to sum
 * @returns Total spent in cents
 */
export function calculateTotalSpent(progressItems: BudgetProgress[]): number {
  return progressItems.reduce((sum, item) => sum + item.spentAmount, 0);
}

/**
 * Calculate overall budget health summary.
 *
 * @param progressItems - Budget progress items
 * @returns Overall budget summary
 */
export function calculateBudgetSummary(progressItems: BudgetProgress[]): {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  budgetsUnder: number;
  budgetsWarning: number;
  budgetsOver: number;
} {
  const totalBudget = progressItems.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalSpent = calculateTotalSpent(progressItems);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const budgetsUnder = progressItems.filter((item) => item.status === 'under').length;
  const budgetsWarning = progressItems.filter((item) => item.status === 'warning').length;
  const budgetsOver = progressItems.filter((item) => item.status === 'over').length;

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
    budgetsUnder,
    budgetsWarning,
    budgetsOver,
  };
}
