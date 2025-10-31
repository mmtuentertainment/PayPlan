/**
 * useDashboardData Hook
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 * Updated: 2025-10-31 (Chunk 6: Added loading state)
 *
 * Custom hook that aggregates all dashboard widget data from localStorage.
 * Uses useMemo to prevent unnecessary recalculations on re-renders.
 */

import { useState, useEffect, useMemo } from "react";
import {
  readCategories,
  readTransactions,
  readGoals,
} from "@/lib/dashboard/storage";
import {
  aggregateSpendingByCategory,
  aggregateIncomeExpenses,
  getRecentTransactions,
  getUpcomingBills,
  getGoalProgress,
} from "@/lib/dashboard/aggregation";
import { getGamificationData } from "@/lib/dashboard/gamification";
import type {
  SpendingChartData,
  IncomeExpensesChartData,
} from "../types/chart-data";
import type { Transaction } from "../types/transaction";
import type { UpcomingBill } from "../types/bill";
import type { GoalProgress } from "../types/goal";
import type { GamificationData } from "../types/gamification";

/**
 * Goal data structure (from localStorage)
 * This is separate from GoalProgress which is the computed view
 */
interface GoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
}

/**
 * Type guard to safely narrow unknown[] to GoalData[]
 * @param obj - Unknown object from localStorage
 * @returns true if obj matches GoalData structure
 */
function isGoalData(obj: unknown): obj is GoalData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    "name" in obj &&
    typeof obj.name === "string" &&
    "targetAmount" in obj &&
    typeof obj.targetAmount === "number" &&
    "currentAmount" in obj &&
    typeof obj.currentAmount === "number" &&
    "targetDate" in obj &&
    (obj.targetDate === null || typeof obj.targetDate === "string") &&
    "createdAt" in obj &&
    typeof obj.createdAt === "string"
  );
}

/**
 * Dashboard data return type
 */
export interface DashboardData {
  /** Loading state (true while data aggregates) */
  isLoading: boolean;

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

  /** Gamification data (streak, insights, wins) */
  gamificationData: GamificationData | null;
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
  // Loading state (Phase 1: simple approach)
  // Show loading skeleton for minimum 100ms to avoid jarring flash
  const [isLoading, setIsLoading] = useState(true);

  // Read data once on mount using useState initializer (avoids useMemo dependency issues)
  // This pattern prevents reading localStorage inside dependency arrays (lesson from PR #62)
  const [categories] = useState(() => readCategories());
  const [transactions] = useState(() => readTransactions());
  const [rawGoals] = useState(() => readGoals());

  // Safely narrow goals type with type guard (filter out invalid entries)
  const goals: GoalData[] = rawGoals.filter(isGoalData);

  // Simulate loading delay to show skeletons (UX best practice)
  // Why 100ms: Minimum time to show skeleton without flash, prevents jarring instant render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Minimum 100ms (UX research: <100ms feels instant, 100-300ms feels responsive)
    return () => clearTimeout(timer);
  }, []);

  // Memoize aggregation results to prevent recalculation on every render
  const spendingChartData = useMemo<SpendingChartData[]>(
    () => aggregateSpendingByCategory(transactions, categories),
    [transactions, categories],
  );

  const incomeExpensesData = useMemo<IncomeExpensesChartData>(
    () => aggregateIncomeExpenses(transactions),
    [transactions],
  );

  const recentTransactions = useMemo<Transaction[]>(
    () => getRecentTransactions(transactions, 5),
    [transactions],
  );

  const upcomingBills = useMemo<UpcomingBill[]>(
    () => getUpcomingBills(transactions, categories),
    [transactions, categories],
  );

  const goalProgress = useMemo<GoalProgress[]>(
    () => getGoalProgress(goals),
    [goals],
  );

  // Get gamification data (streak, insights, wins)
  const [gamificationData] = useState<GamificationData | null>(() => {
    try {
      return getGamificationData();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load gamification data:', error instanceof Error ? error.message : 'Unknown error');
      }
      return null;
    }
  });

  return {
    isLoading, // NEW: Expose loading state for skeleton conditional rendering
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    upcomingBills,
    goalProgress,
    gamificationData, // Chunk 5: Added gamification data
  };
}
