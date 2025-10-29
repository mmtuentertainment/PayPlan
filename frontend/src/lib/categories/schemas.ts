/**
 * Zod Validation Schemas for Categories
 *
 * Feature: 061-spending-categories-budgets
 * Provides runtime validation for category data to ensure type safety
 * and prevent invalid data from being stored or processed.
 */

import { z } from 'zod';
import { MAX_NAME_LENGTH } from './constants';

/**
 * Hex color code schema (e.g., "#10b981").
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #10b981)');

/**
 * Lucide icon name schema (kebab-case).
 * Examples: "shopping-cart", "utensils", "house"
 * Must start with a letter, allow letters/digits, hyphens only as separators.
 */
const iconNameSchema = z
  .string()
  .min(1, 'Icon name is required')
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'Icon name must be kebab-case starting with a letter (e.g., shopping-cart)');

/**
 * Category name schema (1-50 characters).
 */
const categoryNameSchema = z
  .string()
  .min(1, 'Category name is required')
  .max(MAX_NAME_LENGTH, `Category name must be ${MAX_NAME_LENGTH} characters or less`)
  .trim();

/**
 * ISO 8601 datetime schema.
 */
const iso8601DatetimeSchema = z.string().datetime();

/**
 * Category ID schema (format: cat_xxxxxxxx).
 */
const categoryIdSchema = z
  .string()
  .regex(/^cat_[a-z0-9_]+$/, 'Category ID must start with "cat_"');

/**
 * Schema for a complete Category object.
 */
export const categorySchema = z.object({
  id: categoryIdSchema,
  name: categoryNameSchema,
  iconName: iconNameSchema,
  color: hexColorSchema,
  isDefault: z.boolean(),
  createdAt: iso8601DatetimeSchema,
  updatedAt: iso8601DatetimeSchema,
});

/**
 * Schema for creating a new category (excludes auto-generated fields).
 */
export const createCategoryInputSchema = z.object({
  name: categoryNameSchema,
  iconName: iconNameSchema,
  color: hexColorSchema,
});

/**
 * Schema for updating an existing category (all fields optional).
 */
export const updateCategoryInputSchema = z.object({
  name: categoryNameSchema.optional(),
  iconName: iconNameSchema.optional(),
  color: hexColorSchema.optional(),
});

/**
 * Schema for CategoryStorage (localStorage format).
 */
export const categoryStorageSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format (e.g., 1.0.0)'),
  categories: z.array(categorySchema),
  totalSize: z.number().int().nonnegative(),
  lastModified: iso8601DatetimeSchema,
});

/**
 * Validate a category object.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateCategory(data: unknown) {
  return categorySchema.safeParse(data);
}

/**
 * Validate create category input.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateCreateCategoryInput(data: unknown) {
  return createCategoryInputSchema.safeParse(data);
}

/**
 * Validate update category input.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateUpdateCategoryInput(data: unknown) {
  return updateCategoryInputSchema.safeParse(data);
}

/**
 * Validate category storage data.
 *
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateCategoryStorage(data: unknown) {
  return categoryStorageSchema.safeParse(data);
}
