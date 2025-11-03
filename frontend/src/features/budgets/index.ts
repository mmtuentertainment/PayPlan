/**
 * Budgets Feature - Public API
 *
 * Budget creation and tracking with multiple methodologies.
 * Part of Tier 0 MVP (Constitutional requirement #2)
 */

// Re-export all business logic, types, and utilities from lib
export * from './lib';

// Re-export components (named exports)
export { BudgetCard } from './components/BudgetCard';
export { BudgetForm } from './components/BudgetForm';
export { BudgetList } from './components/BudgetList';

// Re-export hooks
export { useBudgets } from './hooks/useBudgets';
export { useBudgetProgress } from './hooks/useBudgetProgress';
