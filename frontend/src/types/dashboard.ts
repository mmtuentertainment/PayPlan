/**
 * Dashboard Widget Types
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

import type { SpendingChartData, IncomeExpensesChartData } from './chart-data';
import type { GamificationData } from './gamification';
import type { GoalProgress } from './goal';
import type { Transaction } from './transaction';
import type { UpcomingBill } from './bill';

/**
 * Base interface for all dashboard widgets
 */
export interface DashboardWidget {
  id: string;
  type: 'spending-chart' | 'income-expenses-chart' | 'recent-transactions' | 'upcoming-bills' | 'goal-progress' | 'gamification';
  priority: 'P0' | 'P1' | 'P2';
  visible: boolean;
  order: number;
}

/**
 * Spending breakdown widget (pie chart)
 */
export interface SpendingChartWidget extends DashboardWidget {
  type: 'spending-chart';
  data: SpendingChartData[];
  emptyState: boolean;
}

/**
 * Income vs. Expenses widget (bar chart)
 */
export interface IncomeExpensesChartWidget extends DashboardWidget {
  type: 'income-expenses-chart';
  data: IncomeExpensesChartData;
  emptyState: boolean;
}

/**
 * Recent transactions widget (list)
 */
export interface RecentTransactionsWidget extends DashboardWidget {
  type: 'recent-transactions';
  data: Transaction[];
  emptyState: boolean;
}

/**
 * Upcoming bills widget (list)
 */
export interface UpcomingBillsWidget extends DashboardWidget {
  type: 'upcoming-bills';
  data: UpcomingBill[];
  emptyState: boolean;
}

/**
 * Goal progress widget (progress bars)
 */
export interface GoalProgressWidget extends DashboardWidget {
  type: 'goal-progress';
  data: GoalProgress[];
  emptyState: boolean;
}

/**
 * Gamification widget (streaks, insights, wins)
 */
export interface GamificationWidget extends DashboardWidget {
  type: 'gamification';
  data: GamificationData;
  emptyState: boolean;
}

/**
 * Union type for all dashboard widgets
 */
export type AnyDashboardWidget =
  | SpendingChartWidget
  | IncomeExpensesChartWidget
  | RecentTransactionsWidget
  | UpcomingBillsWidget
  | GoalProgressWidget
  | GamificationWidget;
