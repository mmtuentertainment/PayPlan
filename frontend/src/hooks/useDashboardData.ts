/**
 * useDashboardData Hook
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 *
 * Custom hook that aggregates all dashboard widget data from localStorage.
 * Uses useMemo to prevent unnecessary recalculations on re-renders.
 */

import { useMemo } from 'react';
import { readCategories, readTransactions, readBudgets, readGoals } from '@/lib/dashboard/storage';
import {
  aggregateSpendingByCategory,
  aggregateIncomeExpenses,
  getRecentTransactions,
  getUpcomingBills,
  getGoalProgress,
} from '@/lib/dashboard/aggregation';
import type { SpendingChartData, IncomeExpensesChartData } from '@/types/chart-data';
import type { Transaction } from '@/types/transaction';
import type { UpcomingBill } from '@/types/bill';
import type { GoalProgress } from '@/types/goal';

/**
 * Dashboard data return type
 */
export interface DashboardData {
  /** Spending breakdown by category (for pie chart) */
  spendingChartData: SpendingChartData[];

  /** Monthly income vs expenses (for bar chart) */
  incomeExpensesData: IncomeExpensesChartData;

  /** Recent transactions (last 5) */
  recentTransactions: Transaction[];

  /** Upcoming bills (next 7 days) */
  upcomingBills: UpcomingBill[];

  /** Goal progress data */
  goalProgress: GoalProgress[];
}

/**
 * Aggregate and memoize all data required by dashboard widgets from localStorage.
 *
 * Reads categories, transactions, budgets (reserved for future use), and goals, then returns precomputed values used by dashboard widgets.
 *
 * @returns An object containing:
 * - `spendingChartData` — spending breakdown by category for the spending pie chart.
 * - `incomeExpensesData` — monthly income vs. expenses data for the income/expenses bar chart.
 * - `recentTransactions` — the most recent five transactions.
 * - `upcomingBills` — upcoming bills within the next seven days.
 * - `goalProgress` — progress metrics for each savings/financial goal.
 */
export function useDashboardData(): DashboardData {
  // Read localStorage once (these calls are already optimized in storage.ts)
  const categories = readCategories();
  const transactions = readTransactions();
  // Note: budgets will be used in future chunks (e.g., budget progress widget)
  // @ts-expect-error - budgets reserved for future use in budget progress widget
  const budgets = readBudgets(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const goals = readGoals() as Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
    createdAt: string;
  }>;

  // Memoize aggregation results to prevent recalculation on every render
  const spendingChartData = useMemo<SpendingChartData[]>(
    () => aggregateSpendingByCategory(transactions, categories),
    [transactions, categories]
  );

  const incomeExpensesData = useMemo<IncomeExpensesChartData>(
    () => aggregateIncomeExpenses(transactions),
    [transactions]
  );

  const recentTransactions = useMemo<Transaction[]>(
    () => getRecentTransactions(transactions, 5),
    [transactions]
  );

  const upcomingBills = useMemo<UpcomingBill[]>(
    () => getUpcomingBills(transactions, categories),
    [transactions, categories]
  );

  const goalProgress = useMemo<GoalProgress[]>(
    () => getGoalProgress(goals),
    [goals]
  );

  return {
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    upcomingBills,
    goalProgress,
    // Note: Gamification data will be added in Chunk 5
  };
}