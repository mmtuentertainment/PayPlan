/**
 * Zod Validation Schemas for Budgets
 *
 * Feature: 061-spending-categories-budgets
 * Provides runtime validation for budget data to ensure type safety
 * and prevent invalid data from being stored or processed.
 */

import { z } from 'zod';

/**
 * Budget period schema (YYYY-MM format).
 * Examples: "2025-11", "2026-01"
 * Validates month is 01-12.
 */
const budgetPeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in YYYY-MM format with month 01-12 (e.g., 2025-11)');

/**
 * Budget amount schema (positive integer in cents).
 */
const budgetAmountSchema = z
  .number()
  .int('Amount must be an integer')
  .positive('Amount must be positive');

/**
 * ISO 8601 datetime schema.
 */
const iso8601DatetimeSchema = z.string().datetime();

/**
 * Budget ID schema (format: budget_xxxxxxxx).
 */
const budgetIdSchema = z
  .string()
  .regex(/^budget_[a-z0-9_]+$/, 'Budget ID must start with "budget_"');

/**
 * Category ID schema (format: cat_xxxxxxxx).
 */
const categoryIdSchema = z
  .string()
  .regex(/^cat_[a-z0-9_]+$/, 'Category ID must start with "cat_"');

/**
 * Schema for a complete Budget object.
 */
export const budgetSchema = z.object({
  id: budgetIdSchema,
  categoryId: categoryIdSchema,
  amount: budgetAmountSchema,
  period: budgetPeriodSchema,
  createdAt: iso8601DatetimeSchema,
  updatedAt: iso8601DatetimeSchema,
});

/**
 * Schema for creating a new budget (excludes auto-generated fields).
 */
export const createBudgetInputSchema = z.object({
  categoryId: categoryIdSchema,
  amount: budgetAmountSchema,
  period: budgetPeriodSchema,
});

/**
 * Schema for updating an existing budget (all fields optional).
 */
export const updateBudgetInputSchema = z.object({
  amount: budgetAmountSchema.optional(),
  period: budgetPeriodSchema.optional(),
});

/**
 * Schema for BudgetStorage (localStorage format).
 */
export const budgetStorageSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format (e.g., 1.0.0)'),
  budgets: z.array(budgetSchema),
  totalSize: z.number().int().nonnegative(),
  lastModified: iso8601DatetimeSchema,
});

/**
 * Validate a budget object.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateBudget(data: unknown) {
  return budgetSchema.safeParse(data);
}

/**
 * Validate create budget input.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateCreateBudgetInput(data: unknown) {
  return createBudgetInputSchema.safeParse(data);
}

/**
 * Validate update budget input.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateUpdateBudgetInput(data: unknown) {
  return updateBudgetInputSchema.safeParse(data);
}

/**
 * Validate budget storage data.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateBudgetStorage(data: unknown) {
  return budgetStorageSchema.safeParse(data);
}
