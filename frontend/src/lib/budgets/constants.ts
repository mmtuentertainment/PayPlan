/**
 * Budgets Library Constants
 *
 * Feature: 061-spending-categories-budgets
 * Defines constants for budget management including storage keys,
 * schema versions, and default values.
 */

/**
 * localStorage key for budgets collection.
 * Pattern: payplan_{feature}_{version}
 */
export const STORAGE_KEY = 'payplan_budgets_v1';

/**
 * Schema version for forward compatibility.
 * Increment when making breaking changes to storage schema.
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Maximum number of budgets allowed (free tier).
 * One budget per category per period.
 */
export const MAX_BUDGETS = 100;

/**
 * Maximum localStorage storage size for budgets (bytes).
 * Target: ~20KB for 100 budgets + metadata.
 */
export const MAX_STORAGE_SIZE = 20480; // 20KB

/**
 * Budget status thresholds.
 */
export const BUDGET_THRESHOLDS = {
  /** Warning threshold: 80% of budget spent */
  WARNING: 0.8,
  /** Over budget threshold: 100% of budget spent */
  OVER: 1.0,
} as const;

/**
 * Error messages for budget operations.
 */
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: 'Budget storage limit exceeded. Please delete some budgets.',
  STORAGE_ACCESS_DENIED: 'Unable to access localStorage. Please check your browser settings.',
  BUDGET_NOT_FOUND: 'Budget not found.',
  DUPLICATE_BUDGET: 'A budget for this category and period already exists.',
  INVALID_BUDGET_DATA: 'Invalid budget data. Please check your input.',
  INVALID_AMOUNT: 'Budget amount must be a positive number.',
  INVALID_PERIOD: 'Budget period must be in YYYY-MM format (e.g., 2025-11).',
  CATEGORY_NOT_FOUND: 'Category not found. Please create a category first.',
  MAX_BUDGETS_REACHED: `Maximum number of budgets (${MAX_BUDGETS}) reached.`,
  SERIALIZATION_FAILED: 'Failed to save budget data.',
  DESERIALIZATION_FAILED: 'Failed to load budget data. Storage may be corrupted.',
} as const;

/**
 * Success messages for budget operations.
 */
export const SUCCESS_MESSAGES = {
  BUDGET_CREATED: 'Budget created successfully.',
  BUDGET_UPDATED: 'Budget updated successfully.',
  BUDGET_DELETED: 'Budget deleted successfully.',
  BUDGETS_LOADED: 'Budgets loaded successfully.',
} as const;

/**
 * Format a period string (YYYY-MM) from a Date object.
 *
 * @param date - Date object
 * @returns Period string (e.g., "2025-11")
 */
export function formatPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the current period (YYYY-MM).
 *
 * @returns Current period string
 */
export function getCurrentPeriod(): string {
  return formatPeriod(new Date());
}

/**
 * Parse a period string into year and month.
 *
 * @param period - Period string (YYYY-MM)
 * @returns Object with year and month numbers, or null if invalid
 */
export function parsePeriod(period: string): { year: number; month: number } | null {
  const parts = period.split('-');

  // Validate exactly two parts
  if (parts.length !== 2) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);

  // Validate both are finite numbers
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  // Validate month is between 1 and 12
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  // Validate year is a finite integer in reasonable range (1900-2100)
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return null;
  }

  return { year, month };
}
