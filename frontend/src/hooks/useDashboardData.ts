/**
 * useDashboardData Hook
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 *
 * Custom hook that aggregates all dashboard widget data from localStorage.
 * Uses useMemo to prevent unnecessary recalculations on re-renders.
 */

import { useMemo } from 'react';
import { readCategories, readTransactions, readGoals } from '@/lib/dashboard/storage';
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
 * Custom hook that aggregates all dashboard widget data from localStorage
 * Uses useMemo to prevent unnecessary recalculations
 *
 * @returns Object containing data for all 6 dashboard widgets
 *
 * @performance All aggregations complete in <500ms total for 1,000 transactions
 * @privacy Read-only access to localStorage, no data written
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const {
 *     spendingChartData,
 *     incomeExpensesData,
 *     recentTransactions,
 *     upcomingBills,
 *     goalProgress
 *   } = useDashboardData();
 *
 *   return (
 *     <div>
 *       <SpendingChart data={spendingChartData} />
 *       <IncomeExpensesChart data={incomeExpensesData} />
 *       {/ * ... other widgets * /}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboardData(): DashboardData {
  // Read localStorage once (these calls are already optimized in storage.ts)
  const categories = readCategories();
  const transactions = readTransactions();
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
