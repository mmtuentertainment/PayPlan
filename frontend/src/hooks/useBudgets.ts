/**
 * useBudgets Hook
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 *
 * Provides React state management and CRUD operations for budgets.
 * Automatically syncs with localStorage and provides optimistic UI updates.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Budget, CreateBudgetInput, UpdateBudgetInput } from '../types/budget';
import { BudgetStorageService, getCurrentPeriod } from '../lib/budgets';

/**
 * Hook return type.
 */
export interface UseBudgetsResult {
  /** All budgets */
  budgets: Budget[];
  /** Loading state */
  loading: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Create a new budget */
  createBudget: (input: CreateBudgetInput) => Promise<Budget | null>;
  /** Update an existing budget */
  updateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget | null>;
  /** Delete a budget */
  deleteBudget: (id: string) => Promise<boolean>;
  /** Get a single budget by ID */
  getBudget: (id: string) => Budget | undefined;
  /** Get budgets for a specific category */
  getBudgetsByCategory: (categoryId: string) => Budget[];
  /** Get budget for specific category and period */
  getBudgetByCategoryAndPeriod: (categoryId: string, period: string) => Budget | null;
  /** Get budgets for current period */
  getCurrentPeriodBudgets: () => Budget[];
  /** Reload budgets from storage */
  reload: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Custom hook for managing budgets.
 *
 * @returns Budgets state and CRUD operations
 *
 * @example
 * function BudgetsPage() {
 *   const { budgets, createBudget, loading, error } = useBudgets();
 *
 *   const handleCreate = async () => {
 *     const budget = await createBudget({
 *       categoryId: 'cat_groceries',
 *       amount: 50000,  // $500.00
 *       period: '2025-11'
 *     });
 *     if (budget) {
 *       console.log('Created:', budget);
 *     }
 *   };
 *
 *   if (loading) return <LoadingSpinner />;
 *   return <BudgetList budgets={budgets} />;
 * }
 */
export function useBudgets(): UseBudgetsResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize service (memoized)
  const [service] = useState(() => new BudgetStorageService());

  /**
   * Load budgets from localStorage.
   */
  const loadBudgets = useCallback(() => {
    setLoading(true);
    setError(null);

    const result = service.loadBudgets();
    if (result.success) {
      setBudgets(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [service]);

  /**
   * Create a new budget.
   */
  const createBudget = useCallback(
    async (input: CreateBudgetInput): Promise<Budget | null> => {
      setError(null);

      const result = service.createBudget(input);
      if (result.success) {
        // Optimistic update: add to local state immediately
        setBudgets((prev) => [...prev, result.data]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service]
  );

  /**
   * Update an existing budget.
   */
  const updateBudget = useCallback(
    async (id: string, input: UpdateBudgetInput): Promise<Budget | null> {
      setError(null);

      const result = service.updateBudget(id, input);
      if (result.success) {
        // Optimistic update: update local state immediately
        setBudgets((prev) =>
          prev.map((budget) => (budget.id === id ? result.data : budget))
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
   * Delete a budget.
   */
  const deleteBudget = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);

      const result = service.deleteBudget(id);
      if (result.success) {
        // Optimistic update: remove from local state immediately
        setBudgets((prev) => prev.filter((budget) => budget.id !== id));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    },
    [service]
  );

  /**
   * Get a single budget by ID.
   */
  const getBudget = useCallback(
    (id: string): Budget | undefined => {
      return budgets.find((budget) => budget.id === id);
    },
    [budgets]
  );

  /**
   * Get budgets for a specific category.
   */
  const getBudgetsByCategory = useCallback(
    (categoryId: string): Budget[] => {
      return budgets.filter((budget) => budget.categoryId === categoryId);
    },
    [budgets]
  );

  /**
   * Get budget for specific category and period.
   */
  const getBudgetByCategoryAndPeriod = useCallback(
    (categoryId: string, period: string): Budget | null => {
      return (
        budgets.find(
          (budget) => budget.categoryId === categoryId && budget.period === period
        ) || null
      );
    },
    [budgets]
  );

  /**
   * Get budgets for current period.
   */
  const getCurrentPeriodBudgets = useCallback((): Budget[] => {
    const currentPeriod = getCurrentPeriod();
    return budgets.filter((budget) => budget.period === currentPeriod);
  }, [budgets]);

  /**
   * Reload budgets from storage.
   */
  const reload = useCallback(() => {
    loadBudgets();
  }, [loadBudgets]);

  /**
   * Clear error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load budgets on mount
  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudget,
    getBudgetsByCategory,
    getBudgetByCategoryAndPeriod,
    getCurrentPeriodBudgets,
    reload,
    clearError,
  };
}
