/**
 * Goal Storage Service (Feature 064)
 * Manages localStorage persistence for Goal Tracking Dashboard
 * Target: 80%+ test coverage
 */

import { v4 as uuid } from 'uuid';
import type { Goal, GoalResult } from '../types/goal';
import type { Contribution } from '../types/contribution';
import {
  validateGoal,
  validateCreateGoalInput,
  validateUpdateGoalInput,
  validateGoalStorage,
} from './schemas';
import { STORAGE_KEY, ERROR_MESSAGES, MAX_CONTRIBUTIONS } from './constants';

/**
 * Storage schema for versioned persistence
 */
interface GoalStorage {
  version: string;
  goals: Goal[];
  lastModified: string;
}

/**
 * Load all goals from localStorage
 * @returns Array of goals (empty if none exist or parse error)
 */
export function loadGoals(): Goal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    const result = validateGoalStorage(parsed);

    if (!result.success) {
      console.error('[GoalStorageService] Invalid storage format:', result.error);
      return [];
    }

    return result.data.goals;
  } catch (error) {
    console.error('[GoalStorageService] Failed to load goals:', error);
    return [];
  }
}

/**
 * Save goals to localStorage
 * @param goals - Goals to save
 */
function saveGoals(goals: Goal[]): void {
  const storage: GoalStorage = {
    version: '1.0.0',
    goals,
    lastModified: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('[GoalStorageService] Failed to save goals:', error);
    throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
  }
}

/**
 * Get single goal by ID
 * @param id - Goal ID
 * @returns Goal or null if not found
 */
export function getGoal(id: string): Goal | null {
  const goals = loadGoals();
  return goals.find((g) => g.id === id) || null;
}

/**
 * Create new goal
 * @param input - Goal creation data
 * @returns Result with created goal or error
 */
export function createGoal(input: unknown): GoalResult<Goal> {
  // Validate input
  const validationResult = validateCreateGoalInput(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }

  const validated = validationResult.data;

  // Create goal with generated fields
  const now = new Date().toISOString();
  const newGoal: Goal = {
    id: `goal_${uuid().replace(/-/g, '')}`, // goal_xxxxxxxx format
    name: validated.name,
    targetAmount: validated.targetAmount,
    currentAmount: 0, // New goals start at $0
    targetDate: validated.targetDate,
    monthlyContribution: validated.monthlyContribution,
    status: 'active',
    contributions: [],
    createdAt: now,
    updatedAt: now,
  };

  // Validate created goal against schema
  const goalValidation = validateGoal(newGoal);
  if (!goalValidation.success) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }

  try {
    const goals = loadGoals();
    goals.push(newGoal);
    saveGoals(goals);

    return { success: true, data: newGoal };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Update existing goal
 * @param id - Goal ID
 * @param input - Update data (partial)
 * @returns Result with updated goal or error
 */
export function updateGoal(id: string, input: unknown): GoalResult<Goal> {
  // Validate input
  const validationResult = validateUpdateGoalInput(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_INPUT,
    };
  }

  const validated = validationResult.data;

  try {
    const goals = loadGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      return {
        success: false,
        error: ERROR_MESSAGES.GOAL_NOT_FOUND,
      };
    }

    // Apply updates
    const updatedGoal: Goal = {
      ...goals[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated goal
    const goalValidation = validateGoal(updatedGoal);
    if (!goalValidation.success) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_INPUT,
      };
    }

    goals[index] = updatedGoal;
    saveGoals(goals);

    return { success: true, data: updatedGoal };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Delete goal by ID
 * @param id - Goal ID
 * @returns Success result or error
 */
export function deleteGoal(id: string): GoalResult<void> {
  try {
    const goals = loadGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      return {
        success: false,
        error: ERROR_MESSAGES.GOAL_NOT_FOUND,
      };
    }

    goals.splice(index, 1);
    saveGoals(goals);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Add contribution to goal
 * @param goalId - Goal ID
 * @param contribution - Contribution data
 * @returns Result with updated goal or error
 */
export function addContribution(goalId: string, contribution: Contribution): GoalResult<Goal> {
  try {
    const goals = loadGoals();
    const index = goals.findIndex((g) => g.id === goalId);

    if (index === -1) {
      return {
        success: false,
        error: ERROR_MESSAGES.GOAL_NOT_FOUND,
      };
    }

    const goal = goals[index];

    // Check contribution limit
    if (goal.contributions.length >= MAX_CONTRIBUTIONS) {
      return {
        success: false,
        error: ERROR_MESSAGES.MAX_CONTRIBUTIONS,
      };
    }

    // Add contribution and update currentAmount
    const updatedGoal: Goal = {
      ...goal,
      currentAmount: goal.currentAmount + contribution.amount,
      contributions: [...goal.contributions, contribution],
      updatedAt: new Date().toISOString(),
    };

    // Auto-complete if target reached
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
      updatedGoal.status = 'completed';
    }

    // Validate updated goal
    const goalValidation = validateGoal(updatedGoal);
    if (!goalValidation.success) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_INPUT,
      };
    }

    goals[index] = updatedGoal;
    saveGoals(goals);

    return { success: true, data: updatedGoal };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Archive completed goal
 * @param id - Goal ID
 * @returns Result with archived goal or error
 */
export function archiveGoal(id: string): GoalResult<Goal> {
  try {
    const goals = loadGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      return {
        success: false,
        error: ERROR_MESSAGES.GOAL_NOT_FOUND,
      };
    }

    const goal = goals[index];

    // Can only archive completed goals
    if (goal.status !== 'completed') {
      return {
        success: false,
        error: ERROR_MESSAGES.CANNOT_ARCHIVE,
      };
    }

    const archivedGoal: Goal = {
      ...goal,
      status: 'archived',
      updatedAt: new Date().toISOString(),
    };

    goals[index] = archivedGoal;
    saveGoals(goals);

    return { success: true, data: archivedGoal };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Unarchive archived goal
 * @param id - Goal ID
 * @returns Result with unarchived goal or error
 */
export function unarchiveGoal(id: string): GoalResult<Goal> {
  try {
    const goals = loadGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      return {
        success: false,
        error: ERROR_MESSAGES.GOAL_NOT_FOUND,
      };
    }

    const goal = goals[index];

    // Can only unarchive archived goals
    if (goal.status !== 'archived') {
      return {
        success: false,
        error: 'Cannot unarchive non-archived goal',
      };
    }

    // Restore to completed status (since it was archived from completed)
    const unarchivedGoal: Goal = {
      ...goal,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };

    goals[index] = unarchivedGoal;
    saveGoals(goals);

    return { success: true, data: unarchivedGoal };
  } catch (error) {
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE_ERROR,
    };
  }
}

/**
 * Clear all goals (for testing/reset)
 * DANGEROUS: Only use for tests or explicit user reset
 */
export function clearGoals(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[GoalStorageService] Failed to clear goals:', error);
    throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
  }
}
