/**
 * Categories Library Constants
 *
 * Feature: 061-spending-categories-budgets
 * Defines constants for category management including storage keys,
 * schema versions, and default values.
 */

/**
 * localStorage key for categories collection.
 * Pattern: payplan_{feature}_{version}
 */
export const STORAGE_KEY = 'payplan_categories_v1';

/**
 * Schema version for forward compatibility.
 * Increment when making breaking changes to storage schema.
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Maximum number of custom categories allowed (free tier).
 * Pre-defined categories don't count toward this limit.
 */
export const MAX_CUSTOM_CATEGORIES = 50;

/**
 * Maximum category name length (characters).
 */
export const MAX_NAME_LENGTH = 50;

/**
 * Maximum localStorage storage size for categories (bytes).
 * Target: ~50KB for 50 categories + metadata.
 */
export const MAX_STORAGE_SIZE = 51200; // 50KB

/**
 * Default Tailwind color palette for categories.
 * Users can choose from these or enter custom hex codes.
 */
export const DEFAULT_COLORS = [
  { name: 'Green', value: '#22c55e' },      // Tailwind green-500
  { name: 'Blue', value: '#3b82f6' },       // Tailwind blue-500
  { name: 'Purple', value: '#a855f7' },     // Tailwind purple-500
  { name: 'Yellow', value: '#eab308' },     // Tailwind yellow-500
  { name: 'Red', value: '#ef4444' },        // Tailwind red-500
  { name: 'Pink', value: '#ec4899' },       // Tailwind pink-500
  { name: 'Indigo', value: '#6366f1' },     // Tailwind indigo-500
  { name: 'Orange', value: '#f97316' },     // Tailwind orange-500
  { name: 'Teal', value: '#14b8a6' },       // Tailwind teal-500
  { name: 'Cyan', value: '#06b6d4' },       // Tailwind cyan-500
  { name: 'Lime', value: '#84cc16' },       // Tailwind lime-500
  { name: 'Emerald', value: '#10b981' },    // Tailwind emerald-500
] as const;

/**
 * Error messages for category operations.
 */
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: 'Category storage limit exceeded. Please delete some categories.',
  STORAGE_ACCESS_DENIED: 'Unable to access localStorage. Please check your browser settings.',
  CATEGORY_NOT_FOUND: 'Category not found.',
  DUPLICATE_CATEGORY_NAME: 'A category with this name already exists.',
  INVALID_CATEGORY_DATA: 'Invalid category data. Please check your input.',
  CANNOT_DELETE_DEFAULT: 'Cannot delete pre-defined categories. You can hide them instead.',
  CANNOT_DELETE_IN_USE: 'Cannot delete category that has active budgets or transactions.',
  MAX_CATEGORIES_REACHED: `Maximum number of custom categories (${MAX_CUSTOM_CATEGORIES}) reached.`,
  SERIALIZATION_FAILED: 'Failed to save category data.',
  DESERIALIZATION_FAILED: 'Failed to load category data. Storage may be corrupted.',
} as const;

/**
 * Success messages for category operations.
 */
export const SUCCESS_MESSAGES = {
  CATEGORY_CREATED: 'Category created successfully.',
  CATEGORY_UPDATED: 'Category updated successfully.',
  CATEGORY_DELETED: 'Category deleted successfully.',
  CATEGORIES_LOADED: 'Categories loaded successfully.',
} as const;
