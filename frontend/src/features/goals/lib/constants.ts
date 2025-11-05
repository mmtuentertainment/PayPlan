/**
 * Constants for Goal Tracking Dashboard (Feature 064)
 */

/**
 * localStorage key for goals storage
 * Pattern: payplan_{feature}_v1
 */
export const STORAGE_KEY = 'payplan_goals_v1';

/**
 * Storage schema version (Semver format)
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Maximum goal name length (characters)
 */
export const MAX_NAME_LENGTH = 50;

/**
 * Maximum contribution note length (characters)
 */
export const MAX_NOTE_LENGTH = 200;

/**
 * Maximum contributions per goal (to prevent localStorage bloat)
 */
export const MAX_CONTRIBUTIONS = 100;

/**
 * Quick-add contribution amounts (cents)
 * $5, $10, $25 buttons for friction-free contributions
 */
export const QUICK_ADD_AMOUNTS = [500, 1000, 2500] as const;

/**
 * Traffic light color system for goal statuses
 * Based on UX research: Green (positive), Yellow (caution), Blue (on-track), Red (critical), Gray (just-started)
 */
export const STATUS_COLORS = {
  completed: '#16a34a', // green-600 - Goal reached!
  'almost-there': '#eab308', // yellow-500 - 95-99% complete
  'on-track': '#2563eb', // blue-600 - Progressing well
  behind: '#dc2626', // red-600 - Behind schedule or past-due
  'just-started': '#9ca3af', // gray-400 - <25% progress
} as const;

/**
 * Error messages for user-friendly feedback
 */
export const ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED:
    'Goal storage limit exceeded. Consider archiving completed goals.',
  STORAGE_ACCESS_DENIED:
    'Unable to access localStorage. Please check your browser settings.',
  GOAL_NOT_FOUND: 'Goal not found.',
  INVALID_GOAL_DATA: 'Invalid goal data. Please check your input.',
  MAX_CONTRIBUTIONS_REACHED: `Maximum contributions (${MAX_CONTRIBUTIONS}) reached for this goal.`,
  DESERIALIZATION_FAILED: 'Failed to load goals from storage.',
  SERIALIZATION_FAILED: 'Failed to save goals to storage.',
} as const;
