/**
 * useCategories Hook
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Create and Manage Categories
 *
 * Provides React state management and CRUD operations for spending categories.
 * Automatically syncs with localStorage and provides optimistic UI updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/category';
import { CategoryStorageService } from '../lib/categories';

/**
 * Hook return type.
 */
export interface UseCategoriesResult {
  /** All categories (default + custom) */
  categories: Category[];
  /** Loading state */
  loading: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Create a new category */
  createCategory: (input: CreateCategoryInput) => Promise<Category | null>;
  /** Update an existing category */
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category | null>;
  /** Delete a category */
  deleteCategory: (id: string) => Promise<boolean>;
  /** Get a single category by ID */
  getCategory: (id: string) => Category | undefined;
  /** Reload categories from storage */
  reload: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Custom hook for managing spending categories.
 *
 * @returns Categories state and CRUD operations
 *
 * @example
 * function CategoriesPage() {
 *   const { categories, createCategory, loading, error } = useCategories();
 *
 *   const handleCreate = async () => {
 *     const category = await createCategory({
 *       name: 'Coffee Shops',
 *       iconName: 'coffee',
 *       color: '#8b5cf6'
 *     });
 *     if (category) {
 *       console.log('Created:', category);
 *     }
 *   };
 *
 *   if (loading) return <LoadingSpinner />;
 *   return <CategoryList categories={categories} />;
 * }
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service (memoized)
  const [service] = useState(() => new CategoryStorageService());

  /**
   * Load categories from localStorage.
   */
  const loadCategories = useCallback(() => {
    setLoading(true);
    setError(null);

    const result = service.loadCategories();
    if (result.success) {
      setCategories(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [service]);

  /**
   * Create a new category.
   */
  const createCategory = useCallback(
    async (input: CreateCategoryInput): Promise<Category | null> => {
      setError(null);

      const result = service.createCategory(input);
      if (result.success) {
        // Optimistic update: add to local state immediately
        setCategories((prev) => [...prev, result.data]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service]
  );

  /**
   * Update an existing category.
   */
  const updateCategory = useCallback(
    async (id: string, input: UpdateCategoryInput): Promise<Category | null> {
      setError(null);

      const result = service.updateCategory(id, input);
      if (result.success) {
        // Optimistic update: update local state immediately
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? result.data : cat))
        );
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service]
  );

  /**
   * Delete a category.
   */
  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      const result = service.deleteCategory(id);
      if (result.success) {
        // Optimistic update: remove from local state immediately
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    },
    [service]
  );

  /**
   * Get a single category by ID.
   */
  const getCategory = useCallback(
    (id: string): Category | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories]
  );

  /**
   * Reload categories from storage.
   */
  const reload = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  /**
   * Clear error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    reload,
    clearError,
  };
}
