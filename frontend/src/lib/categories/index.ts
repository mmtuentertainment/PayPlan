/**
 * Categories Library - Public API
 *
 * Feature: 061-spending-categories-budgets
 * Exports all public types, services, and utilities for category management.
 */

// Types
export type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryStorage,
  CategoryResult,
} from '../../types/category';

// Service
export { CategoryStorageService } from './CategoryStorageService';

// Constants
export {
  STORAGE_KEY,
  SCHEMA_VERSION,
  MAX_CUSTOM_CATEGORIES,
  MAX_NAME_LENGTH,
  MAX_STORAGE_SIZE,
  DEFAULT_COLORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';

// Schemas
export {
  categorySchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  categoryStorageSchema,
  validateCategory,
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  validateCategoryStorage,
} from './schemas';

// Predefined categories
export {
  PREDEFINED_CATEGORIES,
  isDefaultCategory,
  getDefaultCategory,
  getAllDefaultCategories,
} from './predefined';
