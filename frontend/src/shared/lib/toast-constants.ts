/**
 * Toast Duration Constants for PayPlan
 *
 * Industry standards (extracted from magic numbers per bot review L2):
 * - Success: 3-5 seconds (user can dismiss if too long)
 * - Error: 7-10 seconds (users need time to read error messages)
 * - Info/Warning: 5-7 seconds (moderate urgency)
 *
 * @see https://uxdesign.cc/how-long-should-a-toast-notification-last-90c9f1fa8f24
 *
 * Usage:
 * ```typescript
 * import { TOAST_DURATION } from '@/shared/lib/toast-constants';
 *
 * toast.success('Operation completed', {
 *   duration: TOAST_DURATION.SUCCESS,
 * });
 *
 * toast.error('Operation failed', {
 *   description: 'Please try again',
 *   duration: TOAST_DURATION.ERROR,
 * });
 * ```
 */
export const TOAST_DURATION = {
  /** Success toast duration (5 seconds) - Quick confirmation for successful operations */
  SUCCESS: 5000,

  /** Error toast duration (10 seconds) - Users need time to read error messages and recovery guidance */
  ERROR: 10000,

  /** Info toast duration (5 seconds) - General informational messages */
  INFO: 5000,

  /** Warning toast duration (7 seconds) - Moderate urgency messages that require attention */
  WARNING: 7000,
} as const;
