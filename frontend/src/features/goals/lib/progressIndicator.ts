/**
 * Progress Indicator Helpers for Goal Tracking Dashboard (Feature 064)
 * Utility functions for progress bar styling
 * US1: Goal Dashboard (Progress visualization)
 */

/**
 * Get Tailwind classes for progress indicator based on goal status
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
export function getProgressIndicatorClass(
  status: 'completed' | 'past-due' | 'at-risk' | 'on-track'
): string {
  switch (status) {
    case 'completed':
      return '[&>div]:bg-green-600'; // Green - goal achieved
    case 'past-due':
      return '[&>div]:bg-red-600'; // Red - deadline passed, not complete
    case 'at-risk':
      return '[&>div]:bg-yellow-500'; // Yellow - <75% progress with <30 days
    case 'on-track':
      return '[&>div]:bg-blue-600'; // Blue - making good progress
    default:
      return '[&>div]:bg-blue-600';
  }
}
