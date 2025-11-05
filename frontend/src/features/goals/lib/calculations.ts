/**
 * Calculation functions for Goal Tracking Dashboard (Feature 064)
 * Target: 90%+ coverage (financial logic is CRITICAL)
 */

import { differenceInDays, differenceInMonths } from 'date-fns';

/**
 * Calculate goal completion percentage
 * @param currentAmount - Current saved amount (cents)
 * @param targetAmount - Target amount (cents)
 * @returns Percentage (0-100, CLAMPED at 100% even if over-funded)
 *
 * @example
 * getGoalPercent(50000, 100000) // 50.0
 * getGoalPercent(120000, 100000) // 100.0 (clamped, not 120)
 * getGoalPercent(0, 0) // 0 (no target = 0%)
 * getGoalPercent(100, 0) // 100 (no target but saved = 100%)
 */
export function getGoalPercent(currentAmount: number, targetAmount: number): number {
  // Edge case: No target amount
  if (targetAmount === 0) {
    return currentAmount > 0 ? 100 : 0;
  }

  const raw = (currentAmount / targetAmount) * 100;
  return Math.min(raw, 100); // CLAMP at 100% (never show >100%)
}

/**
 * Calculate days remaining until target date
 * @param targetDate - Target date (ISO 8601 string YYYY-MM-DD) or null
 * @returns Days remaining (positive=future, negative=past) or null if no target
 *
 * @example
 * getDaysRemaining('2026-06-30') // 574 (as of 2025-11-05)
 * getDaysRemaining('2024-01-01') // -309 (past due)
 * getDaysRemaining(null) // null
 */
export function getDaysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight for date-only comparison

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0); // Reset to midnight

  return differenceInDays(target, today);
}

/**
 * Calculate required monthly contribution to reach goal by target date
 * @param currentAmount - Current saved (cents)
 * @param targetAmount - Target amount (cents)
 * @param targetDate - Target date (ISO string) or null
 * @returns Required monthly (cents) or null if no target date
 *
 * Edge cases:
 * - Returns 0 if already at/over target
 * - Returns remaining amount if <1 month left
 * - Returns null if no target date
 *
 * @example
 * getRequiredMonthly(50000, 100000, '2026-06-30') // ~2778 cents ($27.78/month)
 * getRequiredMonthly(100000, 100000, '2026-06-30') // 0 (already at goal)
 * getRequiredMonthly(50000, 100000, null) // null (no deadline)
 */
export function getRequiredMonthly(
  currentAmount: number,
  targetAmount: number,
  targetDate: string | null
): number | null {
  if (!targetDate) return null;
  if (currentAmount >= targetAmount) return 0;

  const remaining = targetAmount - currentAmount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const monthsRemaining = differenceInMonths(target, today);

  // Handle <1 month case: need to save everything remaining
  if (monthsRemaining < 1) return remaining;

  // Linear projection: divide remaining by months
  return Math.ceil(remaining / monthsRemaining);
}

/**
 * Determine goal status based on progress and deadline
 * @param percentageComplete - Goal completion percentage (0-100+)
 * @param daysRemaining - Days until target date (null if no deadline)
 * @returns 'on-track' | 'at-risk' | 'completed' | 'past-due'
 *
 * Logic:
 * - completed: >=100%
 * - past-due: targetDate passed and <100%
 * - at-risk: <75% progress and <30 days remaining
 * - on-track: everything else
 *
 * @example
 * getGoalStatus(100, 30) // 'completed'
 * getGoalStatus(50, -10) // 'past-due'
 * getGoalStatus(50, 20) // 'at-risk'
 * getGoalStatus(80, 20) // 'on-track'
 * getGoalStatus(50, 60) // 'on-track'
 * getGoalStatus(50, null) // 'on-track'
 */
export function getGoalStatus(
  percentageComplete: number,
  daysRemaining: number | null
): 'on-track' | 'at-risk' | 'completed' | 'past-due' {
  if (percentageComplete >= 100) return 'completed';
  if (daysRemaining !== null && daysRemaining < 0) return 'past-due';
  if (daysRemaining !== null && daysRemaining < 30 && percentageComplete < 75) return 'at-risk';
  return 'on-track';
}
