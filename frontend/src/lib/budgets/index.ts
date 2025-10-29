/**
 * Budgets Library - Public API
 *
 * Feature: 061-spending-categories-budgets
 * Exports all public types, services, and utilities for budget management.
 */

// Types
export type {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetStorage,
  BudgetProgress,
  BudgetResult,
} from '../../types/budget';

// Service
export { BudgetStorageService } from './BudgetStorageService';

// Constants
export {
  STORAGE_KEY,
  SCHEMA_VERSION,
  MAX_BUDGETS,
  MAX_STORAGE_SIZE,
  BUDGET_THRESHOLDS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  formatPeriod,
  getCurrentPeriod,
  parsePeriod,
} from './constants';

// Schemas
export {
  budgetSchema,
  createBudgetInputSchema,
  updateBudgetInputSchema,
  budgetStorageSchema,
  validateBudget,
  validateCreateBudgetInput,
  validateUpdateBudgetInput,
  validateBudgetStorage,
} from './schemas';

// Calculations
export {
  calculateBudgetProgress,
  calculateBudgetProgressBatch,
  filterTransactionsByBudget,
  getBudgetStatus,
  formatCurrency,
  formatPercentage,
  calculateTotalBudget,
  calculateTotalSpent,
  calculateBudgetSummary,
} from './calculations';
