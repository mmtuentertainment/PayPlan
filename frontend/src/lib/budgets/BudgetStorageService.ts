/**
 * BudgetStorageService - Browser localStorage management for budgets
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 *
 * Implements privacy-first local storage with:
 * - CRUD operations for budgets
 * - 20KB storage limit validation
 * - One budget per category per period validation
 * - Type-safe error handling with Result types
 *
 * @see CategoryStorageService.ts - Similar pattern for consistency
 */

import type {
  Budget,
  BudgetStorage,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetResult,
} from '../../types/budget';
import {
  validateBudget,
  validateCreateBudgetInput,
  validateUpdateBudgetInput,
  validateBudgetStorage,
} from './schemas';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  MAX_STORAGE_SIZE,
  MAX_BUDGETS,
  ERROR_MESSAGES,
} from './constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing budget persistence in localStorage.
 *
 * Key Responsibilities:
 * - Save/load budgets with validation
 * - Enforce 20KB storage limit
 * - Prevent duplicate budgets (same category + period)
 * - Validate category exists before creating budget
 * - Provide error handling with Result types
 *
 * @example
 * const service = new BudgetStorageService();
 * const result = service.createBudget({
 *   categoryId: 'cat_groceries',
 *   amount: 50000,  // $500.00
 *   period: '2025-11'
 * });
 */
export class BudgetStorageService {
  /**
   * Load all budgets from localStorage.
   *
   * @returns Result with budgets array or error
   */
  loadBudgets(): BudgetResult<Budget[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      // First-time user: return empty array
      if (!data) {
        const emptyStorage: BudgetStorage = {
          version: SCHEMA_VERSION,
          budgets: [],
          totalSize: 0,
          lastModified: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStorage));
        return { success: true, data: [] };
      }

      // Parse and validate existing data
      const parsed = JSON.parse(data);
      const validation = validateBudgetStorage(parsed);

      if (!validation.success) {
        return {
          success: false,
          error: `${ERROR_MESSAGES.DESERIALIZATION_FAILED}: ${validation.error.message}`,
        };
      }

      return { success: true, data: validation.data.budgets };
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
   * Save budgets to localStorage.
   *
   * @param budgets - Budgets to save
   * @returns Result with success boolean or error
   */
  private saveBudgets(budgets: Budget[]): BudgetResult<void> {
    try {
      // Build initial storage object with temporary totalSize
      const storage: BudgetStorage = {
        version: SCHEMA_VERSION,
        budgets,
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
   * Create a new budget.
   *
   * @param input - Budget creation input
   * @returns Result with created budget or error
   */
  createBudget(input: CreateBudgetInput): BudgetResult<Budget> {
    // Validate input
    const validation = validateCreateBudgetInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_BUDGET_DATA}: ${validation.error.message}`,
      };
    }

    // Load existing budgets
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data;

    // Check for duplicate (same category + period)
    const duplicate = budgets.find(
      (b) => b.categoryId === input.categoryId && b.period === input.period
    );
    if (duplicate) {
      return { success: false, error: ERROR_MESSAGES.DUPLICATE_BUDGET };
    }

    // Check max budgets limit
    if (budgets.length >= MAX_BUDGETS) {
      return { success: false, error: ERROR_MESSAGES.MAX_BUDGETS_REACHED };
    }

    // Create new budget
    const now = new Date().toISOString();
    const newBudget: Budget = {
      id: `budget_${uuidv4().replace(/-/g, '')}`,
      categoryId: input.categoryId,
      amount: input.amount,
      period: input.period,
      createdAt: now,
      updatedAt: now,
    };

    // Validate created budget
    const budgetValidation = validateBudget(newBudget);
    if (!budgetValidation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_BUDGET_DATA}: ${budgetValidation.error.message}`,
      };
    }

    // Save to storage
    const saveResult = this.saveBudgets([...budgets, newBudget]);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: newBudget };
  }

  /**
   * Update an existing budget.
   *
   * Note: categoryId cannot be changed. To move a budget to a different category,
   * delete the old budget and create a new one.
   *
   * @param id - Budget ID
   * @param input - Budget update input (amount and/or period)
   * @returns Result with updated budget or error
   */
  updateBudget(id: string, input: UpdateBudgetInput): BudgetResult<Budget> {
    // Validate input
    const validation = validateUpdateBudgetInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_BUDGET_DATA}: ${validation.error.message}`,
      };
    }

    // Load existing budgets
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data;

    // Find budget
    const budgetIndex = budgets.findIndex((b) => b.id === id);
    if (budgetIndex === -1) {
      return { success: false, error: ERROR_MESSAGES.BUDGET_NOT_FOUND };
    }

    const existingBudget = budgets[budgetIndex];

    // Check for duplicate if period is being changed
    if (input.period && input.period !== existingBudget.period) {
      const duplicate = budgets.find(
        (b) =>
          b.id !== id &&
          b.categoryId === existingBudget.categoryId &&
          b.period === input.period
      );
      if (duplicate) {
        return { success: false, error: ERROR_MESSAGES.DUPLICATE_BUDGET };
      }
    }

    // Update budget (excluding categoryId from spread to prevent override)
    const updatedBudget: Budget = {
      ...existingBudget,
      amount: input.amount !== undefined ? input.amount : existingBudget.amount,
      period: input.period !== undefined ? input.period : existingBudget.period,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated budget
    const budgetValidation = validateBudget(updatedBudget);
    if (!budgetValidation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_BUDGET_DATA}: ${budgetValidation.error.message}`,
      };
    }

    // Update in array
    const updatedBudgets = [...budgets];
    updatedBudgets[budgetIndex] = updatedBudget;

    // Save to storage
    const saveResult = this.saveBudgets(updatedBudgets);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: updatedBudget };
  }

  /**
   * Delete a budget.
   *
   * @param id - Budget ID
   * @returns Result with success boolean or error
   */
  deleteBudget(id: string): BudgetResult<void> {
    // Load existing budgets
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data;

    // Find budget
    const budgetIndex = budgets.findIndex((b) => b.id === id);
    if (budgetIndex === -1) {
      return { success: false, error: ERROR_MESSAGES.BUDGET_NOT_FOUND };
    }

    // Remove budget
    const updatedBudgets = budgets.filter((b) => b.id !== id);

    // Save to storage
    const saveResult = this.saveBudgets(updatedBudgets);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: undefined };
  }

  /**
   * Get a single budget by ID.
   *
   * @param id - Budget ID
   * @returns Result with budget or error
   */
  getBudget(id: string): BudgetResult<Budget> {
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budget = loadResult.data.find((b) => b.id === id);
    if (!budget) {
      return { success: false, error: ERROR_MESSAGES.BUDGET_NOT_FOUND };
    }

    return { success: true, data: budget };
  }

  /**
   * Get budgets for a specific category.
   *
   * @param categoryId - Category ID
   * @returns Result with budgets array or error
   */
  getBudgetsByCategory(categoryId: string): BudgetResult<Budget[]> {
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data.filter((b) => b.categoryId === categoryId);
    return { success: true, data: budgets };
  }

  /**
   * Get budget for a specific category and period.
   *
   * @param categoryId - Category ID
   * @param period - Period (YYYY-MM)
   * @returns Result with budget or error
   */
  getBudgetByCategoryAndPeriod(categoryId: string, period: string): BudgetResult<Budget | null> {
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budget = loadResult.data.find(
      (b) => b.categoryId === categoryId && b.period === period
    );
    return { success: true, data: budget || null };
  }

  /**
   * Get all budgets for a specific period.
   *
   * @param period - Period (YYYY-MM)
   * @returns Result with budgets array or error
   */
  getBudgetsByPeriod(period: string): BudgetResult<Budget[]> {
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data.filter((b) => b.period === period);
    return { success: true, data: budgets };
  }

  /**
   * Clear all budgets from storage (dangerous!).
   * Use for testing or data reset only.
   */
  clearAll(): BudgetResult<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear budgets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get storage statistics.
   *
   * @returns Result with storage stats or error
   */
  getStorageStats(): BudgetResult<{
    totalBudgets: number;
    storageSize: number;
    storageSizePercentage: number;
  }> {
    const loadResult = this.loadBudgets();
    if (!loadResult.success) {
      return loadResult;
    }

    const budgets = loadResult.data;
    const data = localStorage.getItem(STORAGE_KEY);
    const size = data ? new Blob([data]).size : 0;

    return {
      success: true,
      data: {
        totalBudgets: budgets.length,
        storageSize: size,
        storageSizePercentage: (size / MAX_STORAGE_SIZE) * 100,
      },
    };
  }
}
