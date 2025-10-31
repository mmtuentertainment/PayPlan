/**
 * Dashboard Data Aggregation Functions
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 *
 * This module provides read-only aggregation functions that transform
 * localStorage data into chart-ready formats for dashboard widgets.
 */

import type { Transaction } from "@/types/transaction";
import type { Category } from "@/types/category";
import type {
  SpendingChartData,
  IncomeExpensesChartData,
  MonthData,
} from "@/types/chart-data";
import type { UpcomingBill } from "@/types/bill";
import type { GoalProgress } from "@/types/goal";

/**
 * Time window constants for bill detection and forecasting
 */
const LOOKBACK_WINDOW_DAYS = 30; // Look back 30 days to detect recurring patterns
const FORECAST_WINDOW_DAYS = 7; // Forecast bills due within next 7 days
const DEFAULT_RECENT_TRANSACTIONS_LIMIT = 5; // Default number of recent transactions to show

/**
 * Default fallback category for uncategorized transactions
 */
const UNCATEGORIZED_CATEGORY = {
  id: "uncategorized",
  name: "Uncategorized",
  iconName: "help-circle",
  color: "#6b7280",
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as const;

/**
 * Goal interface (may not exist in all installations)
 */
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
}

/**
 * Aggregates spending by category for current month
 *
 * @param transactions - All transactions from localStorage
 * @param categories - All categories from localStorage
 * @returns Array of category spending data for pie chart
 *
 * @performance Completes in <500ms for 1,000 transactions
 * @privacy Read-only, no data written to storage
 */
export function aggregateSpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
): SpendingChartData[] {
  // Validate inputs
  if (!Array.isArray(transactions) || !Array.isArray(categories)) {
    console.error(
      "aggregateSpendingByCategory: Invalid input - transactions and categories must be arrays",
    );
    return [];
  }

  try {
    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Filter to current month expenses (positive amounts per Transaction interface)
    const expensesThisMonth = transactions.filter(
      (t) => t.amount > 0 && t.date.startsWith(currentMonth),
    );

    // Calculate total spending
    const totalSpending = expensesThisMonth.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    // Handle empty state
    if (totalSpending === 0) {
      return [];
    }

    // Group by category
    const spendingByCategory = expensesThisMonth.reduce(
      (acc, t) => {
        const categoryId = t.categoryId || "uncategorized";
        acc[categoryId] = (acc[categoryId] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Map to chart data format
    return Object.entries(spendingByCategory).map(([categoryId, amount]) => {
      const category =
        categories.find((c) => c.id === categoryId) || UNCATEGORIZED_CATEGORY;

      return {
        categoryId,
        categoryName: category.name,
        categoryIcon: category.iconName,
        categoryColor: category.color,
        amount,
        percentage: (amount / totalSpending) * 100,
      };
    });
  } catch (error) {
    console.error(
      "Error in aggregateSpendingByCategory:",
      error instanceof Error ? error.message : 'Unknown error',
    );
    return [];
  }
}

/**
 * Aggregates income and expenses by month (last 6 months)
 *
 * @param transactions - All transactions from localStorage
 * @returns Monthly income vs expenses data for bar chart
 *
 * @performance Completes in <500ms for 1,000 transactions
 * @privacy Read-only, no data written to storage
 */
export function aggregateIncomeExpenses(
  transactions: Transaction[],
): IncomeExpensesChartData {
  // Validate inputs
  if (!Array.isArray(transactions)) {
    console.error(
      "aggregateIncomeExpenses: Invalid input - transactions must be an array",
    );
    return { months: [], maxValue: 0 };
  }

  try {
    const months: MonthData[] = [];
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      // Fix for month boundary bug: Set day to 1st before using setMonth()
      // Without this, Jan 31 - 1 month = Mar 2/3 (Jan 31 -> Feb 31 -> Mar 2/3)
      targetDate.setDate(1);
      targetDate.setMonth(targetDate.getMonth() - i);
      const targetMonth = targetDate.toISOString().slice(0, 7); // "2025-10"

      // Filter transactions for this month
      const monthTransactions = transactions.filter((t) =>
        t.date.startsWith(targetMonth),
      );

      // Sum income (negative amounts) and expenses (positive amounts)
      // Per Transaction interface: positive for expenses, negative for income
      const expenses = monthTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const income = monthTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      months.push({
        month: monthLabels[targetDate.getMonth()],
        income,
        expenses,
        net: income - expenses,
      });
    }

    // Calculate max value for Y-axis scaling
    const maxValue = Math.max(
      ...months.map((m) => Math.max(m.income, m.expenses)),
      0, // Default to 0 if no data
    );

    return { months, maxValue };
  } catch (error) {
    console.error("Error in aggregateIncomeExpenses:", sanitizeError(error));
    return { months: [], maxValue: 0 };
  }
}

/**
 * Gets the most recent transactions (up to limit)
 *
 * @param transactions - All transactions from localStorage
 * @param limit - Maximum number of transactions to return (default: 5)
 * @returns Array of recent transactions sorted by date descending
 *
 * @performance Completes in <100ms for 1,000 transactions
 * @privacy Read-only, no data written to storage
 */
export function getRecentTransactions(
  transactions: Transaction[],
  limit: number = DEFAULT_RECENT_TRANSACTIONS_LIMIT,
): Transaction[] {
  // Validate inputs
  if (!Array.isArray(transactions)) {
    console.error(
      "getRecentTransactions: Invalid input - transactions must be an array",
    );
    return [];
  }

  try {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error in getRecentTransactions:", sanitizeError(error));
    return [];
  }
}

/**
 * Detects recurring transactions and returns upcoming bills (includes overdue)
 *
 * @param transactions - All transactions from localStorage
 * @param categories - All categories from localStorage
 * @returns Array of upcoming bills due within next FORECAST_WINDOW_DAYS (7 days) or overdue
 *
 * @performance Completes in <500ms for 1,000 transactions
 * @privacy Read-only, no data written to storage
 *
 * @remarks
 * This function returns bills that are:
 * - Due within the next FORECAST_WINDOW_DAYS (7 days), OR
 * - Overdue (past due date, indicated by isOverdue: true)
 *
 * The function intentionally includes overdue bills so users can see missed payments.
 *
 * @algorithm
 * 1. Group transactions by description + amount (expenses only)
 * 2. Find patterns with 2+ occurrences in last LOOKBACK_WINDOW_DAYS (30 days)
 * 3. Calculate average interval between occurrences
 * 4. Predict next occurrence based on last transaction + avg interval
 * 5. Filter to next FORECAST_WINDOW_DAYS or overdue (no lower bound)
 */
export function getUpcomingBills(
  transactions: Transaction[],
  categories: Category[],
): UpcomingBill[] {
  // Validate inputs
  if (!Array.isArray(transactions) || !Array.isArray(categories)) {
    console.error(
      "getUpcomingBills: Invalid input - transactions and categories must be arrays",
    );
    return [];
  }

  try {
    // Group transactions by description + amount (expenses only)
    const transactionGroups = transactions.reduce(
      (acc, t) => {
        if (t.amount <= 0) return acc; // Only expenses (positive amounts)

        const key = `${t.description}|${t.amount}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );

    // Find recurring patterns (2+ occurrences in last LOOKBACK_WINDOW_DAYS)
    const today = new Date();
    const lookbackDate = new Date(
      today.getTime() - LOOKBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const forecastDate = new Date(
      today.getTime() + FORECAST_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const recurringBills: UpcomingBill[] = [];

    Object.values(transactionGroups).forEach((group) => {
      // Filter to last LOOKBACK_WINDOW_DAYS
      const recentOccurrences = group.filter(
        (t) => new Date(t.date) >= lookbackDate,
      );

      // Must have 2+ occurrences to be considered recurring
      if (recentOccurrences.length < 2) return;

      // Sort by date
      recentOccurrences.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculate average interval
      const intervals = [];
      for (let i = 1; i < recentOccurrences.length; i++) {
        const interval =
          new Date(recentOccurrences[i].date).getTime() -
          new Date(recentOccurrences[i - 1].date).getTime();
        intervals.push(interval);
      }
      const avgInterval =
        intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

      // Predict next occurrence
      const lastOccurrence = recentOccurrences[recentOccurrences.length - 1];
      const nextDueDate = new Date(
        new Date(lastOccurrence.date).getTime() + avgInterval,
      );

      // Include if due within next FORECAST_WINDOW_DAYS (or overdue)
      // Note: Removes lower bound to allow overdue bills (isOverdue flag can now be true)
      if (nextDueDate <= forecastDate) {
        const category =
          categories.find((c) => c.id === lastOccurrence.categoryId) ||
          UNCATEGORIZED_CATEGORY;
        const daysUntilDue = Math.floor(
          (nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        recurringBills.push({
          id: `bill-${lastOccurrence.id}`,
          name: lastOccurrence.description,
          amount: lastOccurrence.amount,
          dueDate: nextDueDate.toISOString(),
          categoryId: lastOccurrence.categoryId || null,
          categoryName: category.name,
          categoryIcon: category.iconName,
          isPaid: false,
          isOverdue: daysUntilDue < 0,
          daysUntilDue,
        });
      }
    });

    // Sort by due date (soonest first)
    return recurringBills.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  } catch (error) {
    console.error("Error in getUpcomingBills:", sanitizeError(error));
    return [];
  }
}

/**
 * Calculates progress for all active goals
 *
 * @param goals - All goals from localStorage (or empty if feature not implemented)
 * @returns Array of goal progress data with status indicators
 *
 * @performance Completes in <100ms for 100 goals
 * @privacy Read-only, no data written to storage
 *
 * @algorithm
 * 1. Calculate percentage = (currentAmount / targetAmount) * 100
 * 2. Determine status:
 *    - completed: >= 100%
 *    - on-track: current progress >= expected progress based on time
 *    - at-risk: current progress < expected progress based on time
 * 3. Calculate days remaining until target date
 */
export function getGoalProgress(goals: Goal[]): GoalProgress[] {
  // Validate inputs
  if (!Array.isArray(goals)) {
    return [];
  }

  try {
    return goals.map((goal) => {
      const percentage =
        goal.targetAmount > 0
          ? (goal.currentAmount / goal.targetAmount) * 100
          : 0;

      // Determine status
      let status: "on-track" | "at-risk" | "completed" = "on-track";

      if (percentage >= 100) {
        status = "completed";
      } else if (goal.targetDate) {
        // Calculate expected progress based on time elapsed
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const startDate = new Date(goal.createdAt);

        const totalDays =
          (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays =
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        const expectedPercentage =
          totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

        // On-track if current progress >= expected progress
        status = percentage >= expectedPercentage ? "on-track" : "at-risk";
      }

      // Calculate days remaining
      const daysRemaining = goal.targetDate
        ? Math.floor(
            (new Date(goal.targetDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        percentage: Math.min(percentage, 100), // Cap at 100%
        targetDate: goal.targetDate,
        daysRemaining,
        status,
      };
    });
  } catch (error) {
    console.error("Error in getGoalProgress:", sanitizeError(error));
    return [];
  }
}
