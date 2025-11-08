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
 * Storage quota check result
 */
export interface StorageQuotaResult {
  usedBytes: number;
  estimatedLimitBytes: number;
  usagePercent: number;
  warning: boolean; // True if >= 80%
  critical: boolean; // True if >= 95%
}

/**
 * Result type for loadGoalsWithCorruptionCheck (T102)
 */
export interface LoadGoalsResult {
  goals: Goal[];
  corrupted: boolean; // True if data was corrupted and reset
}

/**
 * Internal helper: Load goals with corruption detection
 * @returns Object with goals array and corruption flag
 * @private
 */
function loadGoalsWithCorruptionCheck(): LoadGoalsResult {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { goals: [], corrupted: false };

    const parsed = JSON.parse(data);
    const result = validateGoalStorage(parsed);

    if (!result.success) {
      console.error('[GoalStorageService] Invalid storage format, resetting:', result.error);
      // T102: Reset corrupted data to empty array
      localStorage.removeItem(STORAGE_KEY);
      return { goals: [], corrupted: true };
    }

    return { goals: result.data.goals, corrupted: false };
  } catch (error) {
    console.error('[GoalStorageService] Failed to load goals, resetting:', error);
    // T102: Reset corrupted data to empty array
    localStorage.removeItem(STORAGE_KEY);
    return { goals: [], corrupted: true };
  }
}

/**
 * Internal helper: Load goals array only (for internal CRUD operations)
 * @returns Array of goals (empty if none exist)
 * @private
 */
function loadGoalsArray(): Goal[] {
  return loadGoalsWithCorruptionCheck().goals;
}

/**
 * Load all goals from localStorage (T102: with corruption detection)
 * Public API for hooks/components
 * @returns Object with goals array and corruption flag
 */
export function loadGoals(): LoadGoalsResult {
  return loadGoalsWithCorruptionCheck(); // T102: Return full result for useGoals hook
}

/**
 * Check localStorage quota usage
 * @returns Storage quota information with warning/critical flags
 *
 * Bot review H1: Made synchronous to avoid async complexity in React hooks.
 * Phase 1 uses conservative 5MB estimate. Storage API support deferred to Phase 2.
 *
 * Browser localStorage limits (approximate):
 * - Chrome/Edge: 10MB per origin
 * - Firefox: 10MB per origin
 * - Safari: 5MB per origin
 * - Conservative estimate: 5MB (works across all browsers)
 */
export function checkStorageQuota(): StorageQuotaResult {
  // Calculate total localStorage usage (all keys)
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      // Multiply by 2 because JavaScript strings are UTF-16 (2 bytes per char)
      totalBytes += (key.length + value.length) * 2;
    }
  }

  // Phase 1: Use conservative 5MB estimate (lowest common denominator)
  // Ensures quota warnings trigger before Safari's 5MB limit is reached
  const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes

  const usagePercent = (totalBytes / estimatedLimit) * 100;
  const warning = usagePercent >= 80;
  const critical = usagePercent >= 95;

  return {
    usedBytes: totalBytes,
    estimatedLimitBytes: estimatedLimit,
    usagePercent: Math.round(usagePercent * 10) / 10, // Round to 1 decimal
    warning,
    critical,
  };
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
  const goals = loadGoalsArray(); // Use internal helper
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
    const goals = loadGoalsArray();  // T102: Use internal helper
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
    const goals = loadGoalsArray();  // T102: Use internal helper
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
    const goals = loadGoalsArray();  // T102: Use internal helper
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
    const goals = loadGoalsArray();  // T102: Use internal helper
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
 *
 * Note: Uses shallow copy (spread operator) which is safe because:
 * - Goal objects follow immutable pattern
 * - Contributions array is never mutated in place
 * - All mutations create new arrays: [...goal.contributions, newContribution]
 * - No nested objects are modified after spread
 *
 * @param id - Goal ID
 * @returns Result with archived goal or error
 */
export function archiveGoal(id: string): GoalResult<Goal> {
  try {
    const goals = loadGoalsArray();  // T102: Use internal helper
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
    const goals = loadGoalsArray();  // T102: Use internal helper
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
        error: ERROR_MESSAGES.CANNOT_UNARCHIVE,
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
