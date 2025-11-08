/**
 * Goal Celebration Statistics
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * Extracts business logic from GoalCelebration component for testability.
 * Calculates completion statistics (months to complete, average monthly contribution).
 *
 * PR81-1 Fix: Extract date arithmetic and currency calculations to lib/ for TDD.
 * Constitution v3.1 requires 90%+ coverage for financial calculations.
 */

import { differenceInMonths } from 'date-fns';
import type { Goal } from '../types/goal';

/**
 * Celebration statistics result
 */
export interface CelebrationStats {
  months: number; // Number of months to complete goal
  avgMonthly: number; // Average monthly contribution (cents)
}

/**
 * Result type for calculateCelebrationStats
 */
export type CelebrationStatsResult =
  | { success: true; stats: CelebrationStats }
  | { success: false; error: string };

/**
 * Calculate goal completion statistics
 *
 * Validates goal data and calculates:
 * - Time to completion (months)
 * - Average monthly contribution (avoiding division by zero)
 *
 * @param goal - Goal to calculate stats for
 * @returns Result with stats or error message
 *
 * @example
 * const result = calculateCelebrationStats(goal);
 * if (result.success) {
 *   console.log(`Completed in ${result.stats.months} months`);
 *   console.log(`Avg: ${formatCurrency(result.stats.avgMonthly)}`);
 * } else {
 *   console.error(result.error);
 * }
 */
export function calculateCelebrationStats(goal: Goal): CelebrationStatsResult {
  // Validate required fields to prevent NaN or Invalid Date
  if (!goal.createdAt || !goal.updatedAt || goal.currentAmount == null) {
    return {
      success: false,
      error: 'Missing required fields (createdAt, updatedAt, or currentAmount)',
    };
  }

  // Parse dates
  const createdDate = new Date(goal.createdAt);
  const updatedDate = new Date(goal.updatedAt);

  // Validate dates are valid (not NaN)
  if (isNaN(createdDate.getTime()) || isNaN(updatedDate.getTime())) {
    return {
      success: false,
      error: `Invalid dates (createdAt: ${goal.createdAt}, updatedAt: ${goal.updatedAt})`,
    };
  }

  // Calculate months difference (using date-fns for accuracy)
  const months = differenceInMonths(updatedDate, createdDate);

  // Calculate average monthly contribution
  // Use Math.max(months, 1) to avoid division by zero
  // If goal was completed in <1 month, treat as 1 month for average calculation
  const avgMonthly = goal.currentAmount / Math.max(months, 1);

  return {
    success: true,
    stats: {
      months,
      avgMonthly,
    },
  };
}
