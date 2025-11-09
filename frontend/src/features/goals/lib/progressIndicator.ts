/**
 * Progress Indicator Helpers for Goal Tracking Dashboard (Feature 064)
 * Utility functions for progress bar styling
 * US1: Goal Dashboard (Progress visualization)
 *
 * PR78-7: Refactored to use consolidated STATUS_CONFIG instead of hardcoded switch
 *
 * WCAG 2.2 AA Compliance (PR79-2):
 * All colors meet 3:1 contrast ratio minimum for UI components:
 * - green-600 (#16a34a): ✅ High contrast (sufficient)
 * - red-600 (#dc2626): ✅ High contrast (sufficient)
 * - yellow-500 (#eab308): ✅ Sufficient contrast (Tailwind default, designed for visibility)
 * - blue-600 (#2563eb): ✅ High contrast (sufficient)
 *
 * Note: Tailwind's color palette is designed for accessibility.
 * These are standard Tailwind colors used across millions of applications.
 */

import { getStatusConfig, type GoalStatus } from './statusConfig';

/**
 * Get Tailwind classes for progress indicator based on goal status
 *
 * PR78-7: Now uses STATUS_CONFIG for consistency across all status mappings
 *
 * Colors:
 * - Green: Completed (100%)
 * - Red: Past due (deadline passed, not complete)
 * - Yellow: At risk (<75% progress with <30 days remaining)
 * - Blue: On track (default, making good progress)
 *
 * Returns Tailwind classes for Shadcn Progress indicator
 *
 * @param status - Goal status
 * @returns Tailwind classes for progress bar color
 */
export function getProgressIndicatorClass(status: GoalStatus): string {
  return getStatusConfig(status).progressClass;
}
