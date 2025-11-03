/**
 * Budget Types
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 *
 * Defines data structures for monthly budget limits and tracking.
 * All types follow strict TypeScript mode (no `any`).
 */

/**
 * Represents a monthly spending budget for a category.
 *
 * @example
 * {
 *   id: "budget_1a2b3c4d",
 *   categoryId: "cat_5e6f7g8h",
 *   amount: 50000,  // $500.00 in cents
 *   period: "2025-11",
 *   createdAt: "2025-10-29T10:00:00Z",
 *   updatedAt: "2025-10-29T10:00:00Z"
 * }
 */
export interface Budget {
  /** Unique identifier (UUID v4 format: budget_xxxxxxxx) */
  id: string;

  /** ID of the category this budget applies to */
  categoryId: string;

  /** Budget amount in cents (e.g., 50000 = $500.00) */
  amount: number;

  /** Budget period in YYYY-MM format (e.g., "2025-11") */
  period: string;

  /** ISO 8601 datetime when budget was created */
  createdAt: string;

  /** ISO 8601 datetime when budget was last modified */
  updatedAt: string;
}

/**
 * Input for creating a new budget (excludes auto-generated fields).
 */
export interface CreateBudgetInput {
  /** ID of the category this budget applies to */
  categoryId: string;

  /** Budget amount in cents (positive integer) */
  amount: number;

  /** Budget period in YYYY-MM format */
  period: string;
}

/**
 * Input for updating an existing budget (all fields optional).
 */
export interface UpdateBudgetInput {
  /** Budget amount in cents (positive integer) */
  amount?: number;

  /** Budget period in YYYY-MM format */
  period?: string;
}

/**
 * Storage schema for budgets collection in localStorage.
 * Key: payplan_budgets_v1
 */
export interface BudgetStorage {
  /** Schema version for forward compatibility */
  version: string;

  /** Array of all budgets */
  budgets: Budget[];

  /** Total storage size in bytes */
  totalSize: number;

  /** ISO 8601 datetime when collection was last modified */
  lastModified: string;
}

/**
 * Budget progress data for display (User Story 3).
 */
export interface BudgetProgress {
  /** Budget ID */
  budgetId: string;

  /** Category ID */
  categoryId: string;

  /** Budget amount in cents */
  budgetAmount: number;

  /** Amount spent in cents */
  spentAmount: number;

  /** Amount remaining in cents (can be negative if over budget) */
  remainingAmount: number;

  /** Percentage spent (0-100+) */
  percentageSpent: number;

  /** Budget status: under, warning (80%+), or over (100%+) */
  status: 'under' | 'warning' | 'over';
}

/**
 * Result type for budget operations (type-safe error handling).
 */
export type BudgetResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
