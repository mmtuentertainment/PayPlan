/**
 * useBudgetProgress Hook
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US3 - Track Budget Progress
 *
 * Calculates budget progress in real-time by combining budgets and transactions.
 * Updates automatically when transactions are categorized.
 */

import { useMemo } from 'react';
import type { Budget, BudgetProgress } from '../types/budget';
import type { Transaction } from '../types/transaction';
import {
  calculateBudgetProgress,
  calculateBudgetProgressBatch,
  calculateBudgetSummary,
} from '../lib/budgets';

/**
 * Hook return type.
 */
export interface UseBudgetProgressResult {
  /** Budget progress for all budgets */
  progressItems: BudgetProgress[];
  /** Budget progress for a specific budget */
  getProgressForBudget: (budgetId: string) => BudgetProgress | undefined;
  /** Budget progress for a specific category */
  getProgressForCategory: (categoryId: string) => BudgetProgress[];
  /** Overall budget summary */
  summary: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
    budgetsUnder: number;
    budgetsWarning: number;
    budgetsOver: number;
  };
}

/**
 * Custom hook for calculating budget progress.
 *
 * @param budgets - All budgets
 * @param transactions - All transactions
 * @returns Budget progress data
 *
 * @example
 * function BudgetDashboard() {
 *   const { categories } = useCategories();
 *   const { budgets } = useBudgets();
 *   const transactions = []; // Get from transaction hook (US4)
 *
 *   const { progressItems, summary } = useBudgetProgress(budgets, transactions);
 *
 *   return (
 *     <div>
 *       <h2>Overall: {summary.overallPercentage.toFixed(1)}% spent</h2>
 *       {progressItems.map((progress) => (
 *         <BudgetProgressBar key={progress.budgetId} progress={progress} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[]
): UseBudgetProgressResult {
  /**
   * Calculate progress for all budgets (memoized).
   * Only recalculates when budgets or transactions change.
   */
  const progressItems = useMemo(() => {
    return calculateBudgetProgressBatch(budgets, transactions);
  }, [budgets, transactions]);

  /**
   * Get progress for a specific budget.
   */
  const getProgressForBudget = useMemo(() => {
    return (budgetId: string): BudgetProgress | undefined => {
      return progressItems.find((item) => item.budgetId === budgetId);
    };
  }, [progressItems]);

  /**
   * Get progress for all budgets in a category.
   */
  const getProgressForCategory = useMemo(() => {
    return (categoryId: string): BudgetProgress[] => {
      return progressItems.filter((item) => item.categoryId === categoryId);
    };
  }, [progressItems]);

  /**
   * Calculate overall budget summary (memoized).
   */
  const summary = useMemo(() => {
    return calculateBudgetSummary(progressItems);
  }, [progressItems]);

  return {
    progressItems,
    getProgressForBudget,
    getProgressForCategory,
    summary,
  };
}

/**
 * Hook for getting progress for a single budget.
 * Computes budget progress via calculateBudgetProgress.
 *
 * @param budget - Single budget
 * @param transactions - All transactions
 * @returns Budget progress data
 *
 * @example
 * function BudgetCard({ budget }) {
 *   const transactions = []; // Get from transaction hook
 *   const progress = useSingleBudgetProgress(budget, transactions);
 *
 *   return <BudgetProgressBar progress={progress} />;
 * }
 */
export function useSingleBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  return useMemo(() => {
    return calculateBudgetProgress(budget, transactions);
  }, [budget, transactions]);
}
