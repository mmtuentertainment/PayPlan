/**
 * Constants and default values for User Preference Management System
 *
 * Feature: 012-user-preference-management
 * Sources:
 * - research.md Section 1 (localStorage best practices)
 * - research.md Section 5 (performance targets)
 * - spec.md Clarification 3 (100ms restoration)
 * - spec.md Clarification 5 (5KB storage limit)
 * - data-model.md (default preference values)
 */

import {
  PreferenceCategory,
  type PreferenceCategoryType,
  type UserPreference,
  type BiweeklyPattern,
} from './types';

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * localStorage key for preference collection.
 * Versioned to support future schema migrations.
 *
 * @see research.md Section 1 - localStorage best practices
 */
export const STORAGE_KEY = 'payplan_preferences_v1';

/**
 * Maximum storage size: 5KB (5120 bytes).
 * Prevents QuotaExceededError and ensures fast serialization.
 *
 * @see spec.md FR-014, Clarification 5
 */
export const STORAGE_LIMIT_BYTES = 5120;

/**
 * Schema version for preference collection.
 * Format: MAJOR.MINOR.PATCH
 */
export const SCHEMA_VERSION = '1.0.0';

// ============================================================================
// Performance Configuration
// ============================================================================

/**
 * Debounce delay for save operations: 300ms.
 * Prevents excessive localStorage writes during rapid preference changes.
 *
 * @see research.md Section 5 - Performance optimization
 */
export const DEBOUNCE_DELAY_MS = 300;

/**
 * Target time for preference restoration: 100ms.
 * Google RAIL model: <100ms = imperceptible delay.
 *
 * @see spec.md NFR-001, Clarification 3
 * @see research.md Section 5 - RAIL performance model
 */
export const RESTORATION_TARGET_MS = 100;

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Toast notification duration: 3 seconds.
 * WCAG 2.1 Success Criterion 2.2.1 (Timing Adjustable).
 *
 * @see spec.md Clarification 4 (toast + inline feedback)
 * @see research.md Section 3 - WCAG 2.1 AA accessibility
 */
export const TOAST_DURATION_MS = 3000;

/**
 * ARIA live region politeness level for preference feedback.
 * "polite" = announces after current speech, doesn't interrupt.
 *
 * @see research.md Section 3 - ARIA live regions
 */
export const ARIA_LIVE_POLITENESS = 'polite' as const;

/**
 * Debounce delay for accessibility announcements: 500ms.
 * Prevents screen reader announcement spam.
 */
export const ANNOUNCEMENT_DEBOUNCE_MS = 500;

// ============================================================================
// Default Preference Values
// ============================================================================

/**
 * Default timezone: UTC (universal default).
 *
 * @see data-model.md TimezoneValue
 */
export const DEFAULT_TIMEZONE = 'UTC';

/**
 * Default payday pattern: Biweekly on Friday.
 * Represents 45.7% of US payrolls (most common).
 *
 * Start date: First Friday of 2025 (2025-01-03).
 *
 * @see research.md Section 4 - Payroll patterns
 * @see data-model.md BiweeklyPattern
 */
export const DEFAULT_PAYDAY_PATTERN: BiweeklyPattern = {
  type: 'biweekly',
  startDate: '2025-01-03', // First Friday of 2025
  dayOfWeek: 5, // Friday (0=Sunday, 5=Friday)
};

/**
 * Default business day settings: Monday-Friday, no holidays.
 *
 * @see data-model.md BusinessDaySettingsValue
 */
export const DEFAULT_BUSINESS_DAY_SETTINGS = {
  workingDays: [1, 2, 3, 4, 5], // Monday-Friday
  holidays: [] as string[],
};

/**
 * Default currency format: USD with standard formatting.
 *
 * @see data-model.md CurrencyFormatValue
 */
export const DEFAULT_CURRENCY_FORMAT = {
  currencyCode: 'USD',
  decimalSeparator: '.' as const,
  thousandsSeparator: ',' as const,
  symbolPosition: 'before' as const,
};

/**
 * Default locale: en-US (US English).
 * BCP 47 language tag.
 *
 * @see data-model.md LocaleValue
 */
export const DEFAULT_LOCALE = 'en-US';

/**
 * Complete default preference collection.
 * All categories opt-out by default (privacy-first).
 *
 * @see spec.md FR-002 (explicit opt-in required)
 */
export const DEFAULT_PREFERENCES: Record<
  PreferenceCategoryType,
  UserPreference
> = {
  [PreferenceCategory.Timezone]: {
    category: PreferenceCategory.Timezone,
    value: DEFAULT_TIMEZONE,
    optInStatus: false,
    timestamp: new Date().toISOString(),
  },
  [PreferenceCategory.PaydayDates]: {
    category: PreferenceCategory.PaydayDates,
    value: DEFAULT_PAYDAY_PATTERN,
    optInStatus: false,
    timestamp: new Date().toISOString(),
  },
  [PreferenceCategory.BusinessDaySettings]: {
    category: PreferenceCategory.BusinessDaySettings,
    value: DEFAULT_BUSINESS_DAY_SETTINGS,
    optInStatus: false,
    timestamp: new Date().toISOString(),
  },
  [PreferenceCategory.CurrencyFormat]: {
    category: PreferenceCategory.CurrencyFormat,
    value: DEFAULT_CURRENCY_FORMAT,
    optInStatus: false,
    timestamp: new Date().toISOString(),
  },
  [PreferenceCategory.Locale]: {
    category: PreferenceCategory.Locale,
    value: DEFAULT_LOCALE,
    optInStatus: false,
    timestamp: new Date().toISOString(),
  },
};

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Maximum number of preference categories.
 * Guards against storage bloat.
 */
export const MAX_PREFERENCE_CATEGORIES = 5;

/**
 * Maximum number of custom holidays.
 * Prevents excessive storage usage.
 */
export const MAX_HOLIDAYS = 50;

/**
 * Maximum number of specific payday dates.
 * For semi-monthly patterns (e.g., 1st and 15th).
 */
export const MAX_SPECIFIC_DATES = 31;

/**
 * Valid day-of-week range: 0 (Sunday) to 6 (Saturday).
 */
export const MIN_DAY_OF_WEEK = 0;
export const MAX_DAY_OF_WEEK = 6;

/**
 * Valid day-of-month range: 1 to 31.
 */
export const MIN_DAY_OF_MONTH = 1;
export const MAX_DAY_OF_MONTH = 31;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Human-readable error messages for storage operations.
 *
 * @see PreferenceStorageService.contract.md
 */
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED:
    'Preference storage limit exceeded (5KB). Please reduce saved preferences.',
  SECURITY_ERROR:
    'Cannot access browser storage. Please enable cookies and disable private browsing.',
  SERIALIZATION_ERROR:
    'Failed to save preferences. Please check your data and try again.',
  DESERIALIZATION_ERROR:
    'Saved preferences are corrupted. Resetting to defaults.',
  VALIDATION_ERROR: 'Invalid preference value. Please check your input.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Success messages for user feedback.
 */
export const SUCCESS_MESSAGES = {
  SAVED: 'Preferences saved successfully',
  RESTORED: 'Preferences restored',
  RESET: 'Preferences reset to defaults',
  OPT_IN: 'Preference saving enabled',
  OPT_OUT: 'Preference saving disabled',
} as const;
