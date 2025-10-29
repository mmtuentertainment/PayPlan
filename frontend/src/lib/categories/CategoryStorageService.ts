/**
 * CategoryStorageService - Browser localStorage management for spending categories
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Create and Manage Categories
 *
 * Implements privacy-first local storage with:
 * - CRUD operations for categories
 * - 50KB storage limit validation
 * - Pre-defined category seeding on first use
 * - Type-safe error handling with Result types
 *
 * @see PreferenceStorageService.ts - Similar pattern for consistency
 */

import type {
  Category,
  CategoryStorage,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryResult,
} from '../../types/category';
import {
  validateCategory,
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  validateCategoryStorage,
} from './schemas';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  MAX_STORAGE_SIZE,
  MAX_CUSTOM_CATEGORIES,
  ERROR_MESSAGES,
} from './constants';
import { getAllDefaultCategories, isDefaultCategory } from './predefined';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing category persistence in localStorage.
 *
 * Key Responsibilities:
 * - Save/load categories with validation
 * - Enforce 50KB storage limit
 * - Seed pre-defined categories on first use
 * - Prevent deletion of default categories
 * - Provide error handling with Result types
 *
 * @example
 * const service = new CategoryStorageService();
 * const result = await service.createCategory({
 *   name: 'Coffee Shops',
 *   iconName: 'coffee',
 *   color: '#8b5cf6'
 * });
 * if (result.success) {
 *   console.log('Category created:', result.data);
 * }
 */
export class CategoryStorageService {
  /**
   * Load all categories from localStorage.
   * Initializes with pre-defined categories if storage is empty.
   *
   * @returns Result with categories array or error
   */
  loadCategories(): CategoryResult<Category[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      // First-time user: seed with pre-defined categories
      if (!data) {
        const defaultCategories = getAllDefaultCategories();
        const initResult = this.saveCategories(defaultCategories);
        if (!initResult.success) {
          return initResult;
        }
        return { success: true, data: defaultCategories };
      }

      // Parse and validate existing data
      const parsed = JSON.parse(data);
      const validation = validateCategoryStorage(parsed);

      if (!validation.success) {
        return {
          success: false,
          error: `${ERROR_MESSAGES.DESERIALIZATION_FAILED}: ${validation.error.message}`,
        };
      }

      return { success: true, data: validation.data.categories };
    } catch (error) {
      if (error instanceof Error && error.name === 'SecurityError') {
        return { success: false, error: ERROR_MESSAGES.STORAGE_ACCESS_DENIED };
      }
      return {
        success: false,
        error: `${ERROR_MESSAGES.DESERIALIZATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Save categories to localStorage.
   *
   * @param categories - Categories to save
   * @returns Result with success boolean or error
   */
  private saveCategories(categories: Category[]): CategoryResult<void> {
    try {
      // Build initial storage object with temporary totalSize
      const storage: CategoryStorage = {
        version: SCHEMA_VERSION,
        categories,
        totalSize: 0,
        lastModified: new Date().toISOString(),
      };

      // Compute actual size of the final serialized object
      const tempSerialized = JSON.stringify(storage);
      const actualSize = new Blob([tempSerialized]).size;

      // Update totalSize to reflect actual size
      storage.totalSize = actualSize;

      // Serialize final object that will be stored
      const finalSerialized = JSON.stringify(storage);
      const finalSize = new Blob([finalSerialized]).size;

      // Check storage limit against the final serialized size
      if (finalSize > MAX_STORAGE_SIZE) {
        return { success: false, error: ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED };
      }

      // Persist the final serialized string
      localStorage.setItem(STORAGE_KEY, finalSerialized);

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return { success: false, error: ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED };
      }
      if (error instanceof Error && error.name === 'SecurityError') {
        return { success: false, error: ERROR_MESSAGES.STORAGE_ACCESS_DENIED };
      }
      return {
        success: false,
        error: `${ERROR_MESSAGES.SERIALIZATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a new category.
   *
   * @param input - Category creation input
   * @returns Result with created category or error
   */
  createCategory(input: CreateCategoryInput): CategoryResult<Category> {
    // Validate input
    const validation = validateCreateCategoryInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_CATEGORY_DATA}: ${validation.error.message}`,
      };
    }

    // Load existing categories
    const loadResult = this.loadCategories();
    if (!loadResult.success) {
      return loadResult;
    }

    const categories = loadResult.data;

    // Check for duplicate name
    if (categories.some((cat) => cat.name.toLowerCase() === input.name.toLowerCase())) {
      return { success: false, error: ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME };
    }

    // Check max custom categories limit
    const customCategoriesCount = categories.filter((cat) => !cat.isDefault).length;
    if (customCategoriesCount >= MAX_CUSTOM_CATEGORIES) {
      return { success: false, error: ERROR_MESSAGES.MAX_CATEGORIES_REACHED };
    }

    // Create new category
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: `cat_${uuidv4().replace(/-/g, '')}`,
      name: input.name,
      iconName: input.iconName,
      color: input.color,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    // Validate created category
    const categoryValidation = validateCategory(newCategory);
    if (!categoryValidation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_CATEGORY_DATA}: ${categoryValidation.error.message}`,
      };
    }

    // Save to storage
    const saveResult = this.saveCategories([...categories, newCategory]);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: newCategory };
  }

  /**
   * Update an existing category.
   *
   * @param id - Category ID
   * @param input - Category update input
   * @returns Result with updated category or error
   */
  updateCategory(id: string, input: UpdateCategoryInput): CategoryResult<Category> {
    // Validate input
    const validation = validateUpdateCategoryInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_CATEGORY_DATA}: ${validation.error.message}`,
      };
    }

    // Load existing categories
    const loadResult = this.loadCategories();
    if (!loadResult.success) {
      return loadResult;
    }

    const categories = loadResult.data;

    // Find category
    const categoryIndex = categories.findIndex((cat) => cat.id === id);
    if (categoryIndex === -1) {
      return { success: false, error: ERROR_MESSAGES.CATEGORY_NOT_FOUND };
    }

    const existingCategory = categories[categoryIndex];

    // Check for duplicate name (if name is being changed)
    if (input.name && input.name !== existingCategory.name) {
      const inputNameLower = input.name.toLowerCase();
      if (categories.some((cat) => cat.id !== id && cat.name.toLowerCase() === inputNameLower)) {
        return { success: false, error: ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME };
      }
    }

    // Update category
    const updatedCategory: Category = {
      ...existingCategory,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated category
    const categoryValidation = validateCategory(updatedCategory);
    if (!categoryValidation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_CATEGORY_DATA}: ${categoryValidation.error.message}`,
      };
    }

    // Update in array
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex] = updatedCategory;

    // Save to storage
    const saveResult = this.saveCategories(updatedCategories);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: updatedCategory };
  }

  /**
   * Delete a category.
   * Prevents deletion of default categories and categories with active budgets/transactions.
   *
   * @param id - Category ID
   * @param options - Deletion options
   * @returns Result with success boolean or error
   */
  deleteCategory(
    id: string,
    options?: {
      /** Skip check for active budgets/transactions (dangerous!) */
      force?: boolean;
    }
  ): CategoryResult<void> {
    // Prevent deletion of default categories
    if (isDefaultCategory(id)) {
      return { success: false, error: ERROR_MESSAGES.CANNOT_DELETE_DEFAULT };
    }

    // Load existing categories
    const loadResult = this.loadCategories();
    if (!loadResult.success) {
      return loadResult;
    }

    const categories = loadResult.data;

    // Find category
    const categoryIndex = categories.findIndex((cat) => cat.id === id);
    if (categoryIndex === -1) {
      return { success: false, error: ERROR_MESSAGES.CATEGORY_NOT_FOUND };
    }

    // TODO: Check for active budgets/transactions (US4 integration)
    // For now, we'll skip this check unless explicitly requested
    if (!options?.force) {
      // Future implementation: check budgets and transactions
    }

    // Remove category
    const updatedCategories = categories.filter((cat) => cat.id !== id);

    // Save to storage
    const saveResult = this.saveCategories(updatedCategories);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: undefined };
  }

  /**
   * Get a single category by ID.
   *
   * @param id - Category ID
   * @returns Result with category or error
   */
  getCategory(id: string): CategoryResult<Category> {
    const loadResult = this.loadCategories();
    if (!loadResult.success) {
      return loadResult;
    }

    const category = loadResult.data.find((cat) => cat.id === id);
    if (!category) {
      return { success: false, error: ERROR_MESSAGES.CATEGORY_NOT_FOUND };
    }

    return { success: true, data: category };
  }

  /**
   * Clear all categories from storage (dangerous!).
   * Use for testing or data reset only.
   */
  clearAll(): CategoryResult<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get storage statistics.
   *
   * @returns Result with storage stats or error
   */
  getStorageStats(): CategoryResult<{
    totalCategories: number;
    customCategories: number;
    defaultCategories: number;
    storageSize: number;
    storageSizePercentage: number;
  }> {
    const loadResult = this.loadCategories();
    if (!loadResult.success) {
      return loadResult;
    }

    const categories = loadResult.data;
    const data = localStorage.getItem(STORAGE_KEY);
    const size = data ? new Blob([data]).size : 0;

    return {
      success: true,
      data: {
        totalCategories: categories.length,
        customCategories: categories.filter((cat) => !cat.isDefault).length,
        defaultCategories: categories.filter((cat) => cat.isDefault).length,
        storageSize: size,
        storageSizePercentage: (size / MAX_STORAGE_SIZE) * 100,
      },
    };
  }
}
