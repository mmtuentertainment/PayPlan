/**
 * useContributions Hook for Goal Tracking Dashboard (Feature 064)
 * Handle quick-add contributions with undo functionality
 * US4: Quick-Add Contributions
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';
import type { Goal, GoalResult } from '../types/goal';
import type { CreateContributionInput } from '../types/contribution';
import { loadGoals, updateGoal } from '../lib/GoalStorageService';
import { getGoalPercent } from '../lib/calculations';
import { formatCurrency } from '@/features/budgets/lib/calculations';

/**
 * Hook return type
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
  // Save previous state for undo (single-level undo)
  const [previousState, setPreviousState] = useState<Goal | null>(null);

  /**
   * Add contribution to goal
   */
  const addContribution = useCallback(
    (goalId: string, amountCents: number, note?: string): GoalResult<Goal> => {
      try {
        // Load current goals
        const goals = loadGoals();
        const goal = goals.find((g) => g.id === goalId);

        if (!goal) {
          return {
            success: false,
            error: `Goal not found: ${goalId}`,
          };
        }

        // Save previous state for undo
        setPreviousState({ ...goal });

        // Create contribution
        const contribution: CreateContributionInput = {
          goalId,
          amount: amountCents,
          note: note || null,
        };

        // Create contribution object with ID and timestamp
        const contributionWithId = {
          id: uuid(),
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
          return result;
        }

        // Show toast with undo
        toast(`Added ${formatCurrency(amountCents)} to ${goal.name}`, {
          description: wasCompleted ? '🎉 Goal completed!' : `New balance: ${formatCurrency(updatedGoal.currentAmount)}`,
          action: {
            label: 'Undo',
            onClick: () => undoContribution(),
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
    [onGoalComplete]
  );

  /**
   * Undo last contribution
   */
  const undoContribution = useCallback(() => {
    if (!previousState) {
      console.warn('No contribution to undo');
      return;
    }

    try {
      // Restore previous state
      const result = updateGoal(previousState.id, {
        currentAmount: previousState.currentAmount,
        contributions: previousState.contributions,
      });

      if (result.success) {
        // Clear previous state
        setPreviousState(null);

        // Show confirmation toast
        toast('Contribution undone', {
          description: `Reverted to ${formatCurrency(previousState.currentAmount)}`,
          duration: 3000,
        });
      } else {
        toast.error('Failed to undo contribution', {
          description: result.error,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to undo contribution';
      toast.error('Failed to undo contribution', {
        description: errorMessage,
      });
    }
  }, [previousState]);

  return {
    addContribution,
    undoContribution,
    canUndo: previousState !== null,
  };
}
