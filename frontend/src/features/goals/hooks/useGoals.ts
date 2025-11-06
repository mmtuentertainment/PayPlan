/**
 * useGoals Hook for Goal Tracking Dashboard (Feature 064)
 * Main state management for goals CRUD operations
 * US2-US4: Create, Edit, Delete Goals
 */

import { useState, useEffect, useCallback } from 'react';
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalResult } from '../types/goal';
import {
  loadGoals,
  createGoal as createGoalService,
  updateGoal as updateGoalService,
  deleteGoal as deleteGoalService,
  archiveGoal as archiveGoalService,
  unarchiveGoal as unarchiveGoalService,
} from '../lib/GoalStorageService';
import { STORAGE_KEY } from '../lib/constants';

/**
 * Hook return type
 */
export interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  createGoal: (input: CreateGoalInput) => GoalResult<Goal>;
  updateGoal: (id: string, input: UpdateGoalInput) => GoalResult<Goal>;
  deleteGoal: (id: string) => GoalResult<void>;
  archiveGoal: (id: string) => GoalResult<Goal>;
  unarchiveGoal: (id: string) => GoalResult<Goal>;
  refreshGoals: () => void;
}

/**
 * Custom hook for goal CRUD operations with cross-tab sync
 *
 * Features:
 * - Loads goals from localStorage on mount
 * - Cross-tab sync via storage event listener
 * - Optimistic updates (UI updates immediately)
 * - Error handling with user-friendly messages
 *
 * @returns Goal state and CRUD operations
 *
 * @example
 * const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
 *
 * // Create goal
 * const result = createGoal({ name: 'Emergency Fund', targetAmount: 100000, ... });
 * if (result.success) {
 *   console.log('Goal created:', result.data);
 * }
 */
export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load goals from localStorage
   */
  const refreshGoals = useCallback(() => {
    try {
      const loaded = loadGoals();
      setGoals(loaded);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    }
  }, []);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    refreshGoals();
    setLoading(false);
  }, [refreshGoals]);

  /**
   * Cross-tab sync: Listen for storage changes from other tabs
   * Debounce to avoid excessive updates
   */
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to changes to our storage key
      if (e.key === STORAGE_KEY) {
        // Debounce: Wait 300ms before syncing
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          refreshGoals();
        }, 300);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(debounceTimer);
    };
  }, [refreshGoals]);

  /**
   * Create new goal
   */
  const createGoal = useCallback((input: CreateGoalInput): GoalResult<Goal> => {
    const result = createGoalService(input);

    if (result.success) {
      // Optimistic update: Add to state immediately
      setGoals((prev) => [...prev, result.data]);
      setError(null);
    } else {
      setError(result.error);
    }

    return result;
  }, []);

  /**
   * Update existing goal
   */
  const updateGoal = useCallback((id: string, input: UpdateGoalInput): GoalResult<Goal> => {
    const result = updateGoalService(id, input);

    if (result.success) {
      // Optimistic update: Update in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
    } else {
      setError(result.error);
    }

    return result;
  }, []);

  /**
   * Delete goal by ID
   */
  const deleteGoal = useCallback((id: string): GoalResult<void> => {
    const result = deleteGoalService(id);

    if (result.success) {
      // Optimistic update: Remove from state immediately
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setError(null);
    } else {
      setError(result.error);
    }

    return result;
  }, []);

  /**
   * Archive completed goal
   */
  const archiveGoal = useCallback((id: string): GoalResult<Goal> => {
    const result = archiveGoalService(id);

    if (result.success) {
      // Optimistic update: Update status in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
    } else {
      setError(result.error);
    }

    return result;
  }, []);

  /**
   * Unarchive archived goal
   */
  const unarchiveGoal = useCallback((id: string): GoalResult<Goal> => {
    const result = unarchiveGoalService(id);

    if (result.success) {
      // Optimistic update: Update status in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
    } else {
      setError(result.error);
    }

    return result;
  }, []);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    unarchiveGoal,
    refreshGoals,
  };
}
