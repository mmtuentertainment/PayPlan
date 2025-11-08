/**
 * useContributions Hook for Goal Tracking Dashboard (Feature 064)
 * Handle quick-add contributions with undo functionality
 * US4: Quick-Add Contributions
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Goal, GoalResult } from '../types/goal';
import type { CreateContributionInput } from '../types/contribution';
import { loadGoals, updateGoal } from '../lib/GoalStorageService';
import { getGoalPercent } from '../lib/calculations';
import { formatCurrency } from '@/shared/lib/utils';

/**
 * Toast duration constants (bot review: extract magic numbers)
 * Industry standard: error toasts need 7-10s (users need more time to read critical info)
 */
const TOAST_DURATION_ERROR = 10000; // 10 seconds

/**
 * Undo snapshot for a specific contribution
 */
interface UndoSnapshot {
  contributionId: string;
  goalId: string;
  amountCents: number; // Amount of this contribution (to subtract on undo)
}

/**
 * Hook return type
 *
 * TODO (PR80-10): Add onContributionUndone callback
 * - Callback should trigger UI refresh after undo completes
 * - Similar to onGoalComplete callback pattern
 * - Defer to Phase 2 (not critical for Phase 1 MVP)
 */
export interface UseContributionsResult {
  addContribution: (goalId: string, amountCents: number, note?: string) => GoalResult<Goal>;
  undoContribution: () => void;
  canUndo: boolean;
}

/**
 * Custom hook for adding contributions with undo functionality
 *
 * Features:
 * - Add contribution with amount and optional note
 * - Optimistic UI updates
 * - 5-second undo window via Sonner toast
 * - Auto-complete detection (100% progress)
 * - Celebration callback on completion (optional)
 * - Race-condition-free undo (each toast undoes its own contribution)
 *
 * @param onGoalComplete - Optional callback when goal reaches 100%
 * @returns Contribution functions and undo state
 *
 * @example
 * const { addContribution, undoContribution, canUndo } = useContributions();
 *
 * // Add $10 contribution
 * const result = addContribution('goal-123', 1000);
 * if (result.success) {
 *   console.log('Contribution added:', result.data);
 * }
 */
export function useContributions(
  onGoalComplete?: (goal: Goal) => void
): UseContributionsResult {
  // Store undo snapshots keyed by contribution ID (PR80-2: prevents race conditions)
  const undoSnapshots = useRef<Map<string, UndoSnapshot>>(new Map());
  // Track the most recent contribution ID for backward compatibility with canUndo
  const [lastContributionId, setLastContributionId] = useState<string | null>(null);

  /**
   * Add contribution to goal
   */
  const addContribution = useCallback(
    (goalId: string, amountCents: number, note?: string): GoalResult<Goal> => {
      // PR80-5: Validate contribution amount
      if (!Number.isInteger(amountCents)) {
        return {
          success: false,
          error: 'Contribution amount must be a whole number of cents',
        };
      }
      if (amountCents <= 0) {
        return {
          success: false,
          error: 'Contribution amount must be greater than zero',
        };
      }

      try {
        // Load current goals (T102: destructure LoadGoalsResult)
        const { goals } = loadGoals();
        const goal = goals.find((g) => g.id === goalId);

        if (!goal) {
          return {
            success: false,
            error: `Goal not found: ${goalId}`,
          };
        }

        // Create contribution ID first (needed for undo snapshot)
        const contributionId = uuid();

        // Save snapshot for this specific contribution (PR80-2: prevents race conditions)
        // Store only the contribution ID and amount, not entire goal state
        undoSnapshots.current.set(contributionId, {
          contributionId,
          goalId,
          amountCents,
        });
        setLastContributionId(contributionId);

        // Create contribution
        const contribution: CreateContributionInput = {
          goalId,
          amount: amountCents,
          note: note || null,
        };

        // Create contribution object with ID and timestamp
        const contributionWithId = {
          id: contributionId,
          ...contribution,
          createdAt: new Date().toISOString(),
        };

        // Update goal
        const updatedGoal: Goal = {
          ...goal,
          currentAmount: goal.currentAmount + amountCents,
          contributions: [...(goal.contributions || []), contributionWithId],
          updatedAt: new Date().toISOString(),
        };

        // Check for completion
        const percentage = getGoalPercent(updatedGoal.currentAmount, updatedGoal.targetAmount);
        const wasCompleted = percentage >= 100;

        // Save to storage
        const result = updateGoal(goalId, {
          currentAmount: updatedGoal.currentAmount,
          contributions: updatedGoal.contributions,
        });

        if (!result.success) {
          // Remove snapshot if storage fails
          undoSnapshots.current.delete(contributionId);
          setLastContributionId(null);
          return result;
        }

        // Show toast with undo (closure captures contributionId, not shared state)
        toast(`Added ${formatCurrency(amountCents)} to ${goal.name}`, {
          description: wasCompleted ? '🎉 Goal completed!' : `New balance: ${formatCurrency(updatedGoal.currentAmount)}`,
          action: {
            label: 'Undo',
            onClick: () => undoSpecificContribution(contributionId),
          },
          duration: 5000,
        });

        // Trigger celebration if goal completed
        if (wasCompleted && onGoalComplete) {
          onGoalComplete(result.data);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add contribution';
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    // PR80-3: undoSpecificContribution is NOT in dependencies because:
    // 1. The toast onClick closure captures contributionId (string value), not the function
    // 2. contributionId is unique per contribution and never changes
    // 3. undoSpecificContribution looks up the snapshot by contributionId, which is stable
    // 4. Adding it would create circular dependency (defined after addContribution)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onGoalComplete]
  );

  /**
   * Undo a specific contribution by ID (called from toast action)
   * PR80-2: Each toast button undoes its own contribution, preventing race conditions
   */
  const undoSpecificContribution = useCallback((contributionId: string) => {
    const snapshot = undoSnapshots.current.get(contributionId);

    if (!snapshot) {
      console.warn(`No undo snapshot found for contribution ${contributionId}`);
      return;
    }

    try {
      // Load current goal state
      const { goals } = loadGoals();
      const goal = goals.find((g) => g.id === snapshot.goalId);

      if (!goal) {
        toast.error('Failed to undo contribution', {
          description: 'Goal not found',
          duration: TOAST_DURATION_ERROR,
        });
        return;
      }

      // Remove this specific contribution from the contributions array
      const updatedContributions = (goal.contributions || []).filter(
        (c) => c.id !== contributionId
      );

      // Subtract this contribution's amount from currentAmount
      const updatedCurrentAmount = goal.currentAmount - snapshot.amountCents;

      // Update goal with contribution removed
      const result = updateGoal(snapshot.goalId, {
        currentAmount: updatedCurrentAmount,
        contributions: updatedContributions,
      });

      if (result.success) {
        // Show confirmation toast
        toast('Contribution undone', {
          description: `Reverted to ${formatCurrency(updatedCurrentAmount)}`,
          duration: 3000,
        });
      } else {
        toast.error('Failed to undo contribution', {
          description: result.error,
          duration: TOAST_DURATION_ERROR,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to undo contribution';
      toast.error('Failed to undo contribution', {
        description: errorMessage,
        duration: TOAST_DURATION_ERROR,
      });
    } finally {
      // PR85-5: Always clean up snapshot to prevent memory leak
      // Even if undo fails, we don't want stale snapshots accumulating
      undoSnapshots.current.delete(contributionId);

      // If this was the last contribution, clear lastContributionId
      if (lastContributionId === contributionId) {
        setLastContributionId(null);
      }
    }
  }, [lastContributionId]);

  /**
   * Undo last contribution (backward compatibility, for manual calls)
   */
  const undoContribution = useCallback(() => {
    if (!lastContributionId) {
      console.warn('No contribution to undo');
      return;
    }
    undoSpecificContribution(lastContributionId);
  }, [lastContributionId, undoSpecificContribution]);

  return {
    addContribution,
    undoContribution,
    canUndo: lastContributionId !== null,
  };
}
