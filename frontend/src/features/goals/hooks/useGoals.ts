/**
 * useGoals Hook for Goal Tracking Dashboard (Feature 064)
 * Main state management for goals CRUD operations
 * US2-US4: Create, Edit, Delete Goals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner'; // T102: Toast for corrupted data notification
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalResult } from '../types/goal';
import {
  loadGoals,
  createGoal as createGoalService,
  updateGoal as updateGoalService,
  deleteGoal as deleteGoalService,
  archiveGoal as archiveGoalService,
  unarchiveGoal as unarchiveGoalService,
  checkStorageQuota,
} from '../lib/GoalStorageService';
import type { StorageQuotaResult } from '../lib/GoalStorageService';
import { STORAGE_KEY } from '../lib/constants';

/**
 * Hook return type
 */
export interface UseGoalsResult {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  storageQuota: StorageQuotaResult | null;
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
  const [storageQuota, setStorageQuota] = useState<StorageQuotaResult | null>(null);

  // PR78-5: Track mounted state to prevent memory leaks from state updates after unmount
  const isMounted = useRef(true);

  /**
   * Check storage quota
   */
  const checkQuota = useCallback(() => {
    try {
      const quota = checkStorageQuota();
      setStorageQuota(quota);
    } catch (err) {
      console.error('[useGoals] Failed to check storage quota:', err);
    }
  }, []);

  /**
   * Load goals from localStorage (T102: with corruption detection)
   */
  const refreshGoals = useCallback(() => {
    try {
      const { goals: loaded, corrupted } = loadGoals(); // T102: Destructure result
      setGoals(loaded);
      setError(null);
      checkQuota(); // T101: Check quota after loading

      // T102: Show toast if data was corrupted and reset
      if (corrupted) {
        toast.error('Goal data was corrupted and has been reset', {
          description: 'Your goals could not be loaded due to corrupted data. Starting fresh.',
          duration: 5000,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    }
  }, [checkQuota]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    refreshGoals();
    // PR78-5: Guard against state update after unmount
    if (isMounted.current) {
      setLoading(false);
    }
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
   * Create new goal (T101: Check quota before creating)
   */
  const createGoal = useCallback((input: CreateGoalInput): GoalResult<Goal> => {
    // T101: Check storage quota before creating
    try {
      const quota = checkStorageQuota();
      setStorageQuota(quota); // PR85-3: Update quota state even when blocking creation

      if (quota.critical) {
        const errorMsg = 'Storage limit exceeded (>95% full). Cannot create new goals. Please delete or archive existing goals to free up space.';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (err) {
      console.error('[useGoals] Failed to check quota before create:', err);
      // Continue with creation if quota check fails (don't block user)
    }

    const result = createGoalService(input);

    if (result.success) {
      // Optimistic update: Add to state immediately
      setGoals((prev) => [...prev, result.data]);
      setError(null);
      checkQuota(); // T101: Update quota after successful creation
    } else {
      setError(result.error);
    }

    return result;
  }, [checkQuota]);

  /**
   * Update existing goal
   */
  const updateGoal = useCallback((id: string, input: UpdateGoalInput): GoalResult<Goal> => {
    const result = updateGoalService(id, input);

    if (result.success) {
      // Optimistic update: Update in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
      checkQuota(); // T101: Update quota after successful update
    } else {
      setError(result.error);
    }

    return result;
  }, [checkQuota]);

  /**
   * Delete goal by ID
   */
  const deleteGoal = useCallback((id: string): GoalResult<void> => {
    const result = deleteGoalService(id);

    if (result.success) {
      // Optimistic update: Remove from state immediately
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setError(null);
      checkQuota(); // T101: Update quota after successful deletion
    } else {
      setError(result.error);
    }

    return result;
  }, [checkQuota]);

  /**
   * Archive completed goal
   */
  const archiveGoal = useCallback((id: string): GoalResult<Goal> => {
    const result = archiveGoalService(id);

    if (result.success) {
      // Optimistic update: Update status in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
      checkQuota(); // T101: Update quota after successful archive
    } else {
      setError(result.error);
    }

    return result;
  }, [checkQuota]);

  /**
   * Unarchive archived goal
   */
  const unarchiveGoal = useCallback((id: string): GoalResult<Goal> => {
    const result = unarchiveGoalService(id);

    if (result.success) {
      // Optimistic update: Update status in state immediately
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      setError(null);
      checkQuota(); // T101: Update quota after successful unarchive
    } else {
      setError(result.error);
    }

    return result;
  }, [checkQuota]);

  // PR78-5: Cleanup on unmount - set isMounted to false
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    goals,
    loading,
    error,
    storageQuota, // T101: Expose storage quota state
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    unarchiveGoal,
    refreshGoals,
  };
}
