/**
 * TypeScript types for User Preference Management System
 *
 * Feature: 012-user-preference-management
 * Source: data-model.md
 *
 * This module defines all core types for the preference management system,
 * including preference categories, user preferences, storage collections,
 * and error types.
 */

// ============================================================================
// Preference Categories
// ============================================================================

/**
 * Enum of available preference categories that can be saved and restored.
 *
 * @see data-model.md Section "PreferenceCategory (Enum)"
 */
export const PreferenceCategory = {
  Timezone: 'timezone',
  PaydayDates: 'payday_dates',
  BusinessDaySettings: 'business_day_settings',
  CurrencyFormat: 'currency_format',
  Locale: 'locale',
} as const;

export type PreferenceCategoryType = typeof PreferenceCategory[keyof typeof PreferenceCategory];

// ============================================================================
// Payday Pattern Types (Discriminated Union)
// ============================================================================

/**
 * Semi-monthly pattern: Specific days of month (e.g., 1st and 15th).
 * Represents 18% of payrolls.
 *
 * @see research.md Section 4 (Payroll patterns)
 */
export interface SpecificDatesPattern {
  type: 'specific';
  dates: number[]; // Array of day-of-month (1-31)
}

/**
 * Weekly pattern: Every week on specific day.
 * Represents 31.8% of payrolls.
 */
export interface WeeklyPattern {
  type: 'weekly';
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

/**
 * Biweekly pattern: Every two weeks on specific day.
 * Represents 45.7% of payrolls (most common).
 */
export interface BiweeklyPattern {
  type: 'biweekly';
  startDate: string; // ISO date string for first payday
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

/**
 * Monthly pattern: Specific day of each month.
 * Represents 4.4% of payrolls.
 */
export interface MonthlyPattern {
  type: 'monthly';
  dayOfMonth: number; // 1-31
}

/**
 * Discriminated union of all payday pattern types.
 * Supports flexible income schedules for different payroll frequencies.
 */
export type PaydayPattern =
  | SpecificDatesPattern
  | WeeklyPattern
  | BiweeklyPattern
  | MonthlyPattern;

// ============================================================================
// Category Value Types
// ============================================================================

/**
 * Timezone value: IANA timezone identifier.
 */
export interface TimezoneValue {
  category: typeof PreferenceCategory.Timezone;
  value: string; // e.g., "America/New_York", "Europe/London", "UTC"
}

/**
 * Payday dates value: Flexible pattern supporting specific dates and recurring schedules.
 */
export interface PaydayDatesValue {
  category: typeof PreferenceCategory.PaydayDates;
  value: PaydayPattern;
}

/**
 * Business day settings value: Rules for working days vs. weekends/holidays.
 */
export interface BusinessDaySettingsValue {
  category: typeof PreferenceCategory.BusinessDaySettings;
  value: {
    workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
    holidays: string[]; // Array of ISO date strings (e.g., ["2025-12-25"])
  };
}

/**
 * Currency format value: Display formatting for monetary amounts.
 */
export interface CurrencyFormatValue {
  category: typeof PreferenceCategory.CurrencyFormat;
  value: {
    currencyCode: string; // ISO 4217 code (e.g., "USD", "EUR", "GBP")
    decimalSeparator: '.' | ',';
    thousandsSeparator: ',' | '.' | ' ' | '';
    symbolPosition: 'before' | 'after';
  };
}

/**
 * Locale value: Language/region setting (BCP 47 format).
 */
export interface LocaleValue {
  category: typeof PreferenceCategory.Locale;
  value: string; // BCP 47 language tag (e.g., "en-US", "en-GB", "es-MX")
}

/**
 * Discriminated union of all category value types.
 * Provides type-safe representation of values for each preference category.
 */
export type CategoryValue =
  | TimezoneValue
  | PaydayDatesValue
  | BusinessDaySettingsValue
  | CurrencyFormatValue
  | LocaleValue;

// ============================================================================
// User Preference
// ============================================================================

/**
 * Represents a single user's saved configuration choice for a specific preference category.
 *
 * @template T - Type of the preference value (varies by category)
 *
 * @see data-model.md Section "UserPreference<T>"
 */
export interface UserPreference<T = unknown> {
  /** Which preference category this belongs to */
  category: PreferenceCategoryType;

  /** The user's configured value (type varies by category) */
  value: T;

  /** Whether user consented to persist this preference */
  optInStatus: boolean;

  /** ISO 8601 datetime of last save */
  timestamp: string;
}

// ============================================================================
// Preference Collection
// ============================================================================

/**
 * Top-level container for all user preferences with metadata and size tracking.
 *
 * @see data-model.md Section "PreferenceCollection"
 */
export interface PreferenceCollection {
  /** Schema version for forward compatibility (e.g., "1.0.0") */
  version: string;

  /** All saved preferences keyed by category (max 5 entries) */
  preferences: Map<PreferenceCategoryType, UserPreference>;

  /** Total storage size in bytes (must be <5120 bytes / 5KB) */
  totalSize: number;

  /** ISO 8601 datetime when collection was last updated */
  lastModified: string;
}

/**
 * Serialized form of PreferenceCollection for localStorage storage.
 * Map is converted to plain object for JSON serialization.
 */
export interface SerializedPreferenceCollection {
  version: string;
  preferences: Record<string, UserPreference>;
  totalSize: number;
  lastModified: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Types of storage errors that can occur during localStorage operations.
 *
 * @see PreferenceStorageService.contract.md
 */
export type StorageErrorType =
  | 'QuotaExceeded' // Storage exceeds 5KB limit
  | 'Security' // localStorage access denied (cookies blocked, private browsing)
  | 'Serialization' // JSON.stringify failed (circular references, invalid data)
  | 'Deserialization' // JSON.parse failed (corrupted data)
  | 'Validation'; // Preference validation failed

/**
 * Storage error with type, message, and optional original error for debugging.
 */
export interface StorageError {
  type: StorageErrorType;
  message: string;
  category?: PreferenceCategoryType;
  originalError?: Error;
}

/**
 * Validation error for preference value validation failures.
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// Result Type (for error handling)
// ============================================================================

/**
 * Success result containing a value.
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Error result containing an error.
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * Result type for operations that can fail.
 * Provides type-safe error handling without throwing exceptions.
 *
 * @template T - Success value type
 * @template E - Error type
 */
export type Result<T, E> = Ok<T> | Err<E>;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract the value type for a specific preference category.
 */
export type PreferenceValueType<C extends PreferenceCategoryType> = C extends typeof PreferenceCategory.Timezone
  ? string
  : C extends typeof PreferenceCategory.PaydayDates
  ? PaydayPattern
  : C extends typeof PreferenceCategory.BusinessDaySettings
  ? BusinessDaySettingsValue['value']
  : C extends typeof PreferenceCategory.CurrencyFormat
  ? CurrencyFormatValue['value']
  : C extends typeof PreferenceCategory.Locale
  ? string
  : never;
