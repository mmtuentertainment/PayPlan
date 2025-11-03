/**
 * Dashboard Feature - Public API
 *
 * Visual dashboard with charts, widgets, and gamification.
 * Part of Tier 0 MVP (Constitutional requirement #3)
 */

// Re-export all business logic and utilities from lib
export * from './lib/storage';
export * from './lib/schemas';
export * from './lib/gamification';
export * from './lib/aggregation';

// Re-export types
export type * from './types/dashboard';
export type * from './types/chart-data';
export type * from './types/gamification';

// Re-export components (named exports)
export { EmptyState } from './components/EmptyState';
export { GamificationWidget } from './components/GamificationWidget';
export { GoalProgressWidget } from './components/GoalProgressWidget';
export { IncomeExpensesChart } from './components/IncomeExpensesChart';
export { IncomeExpensesChartWidget } from './components/IncomeExpensesChartWidget';
export { LoadingSkeleton } from './components/LoadingSkeleton';
export { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
export { SpendingChart } from './components/SpendingChart';
export { SpendingChartWidget } from './components/SpendingChartWidget';
export { UpcomingBillsWidget } from './components/UpcomingBillsWidget';

// Re-export hooks
export { useDashboardData } from './hooks/useDashboardData';
