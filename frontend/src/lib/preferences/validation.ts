/**
 * Zod validation schemas for User Preference Management System
 *
 * Feature: 012-user-preference-management
 * Sources:
 * - data-model.md (Validation Schemas section)
 * - research.md Section 2 (React 19 patterns)
 * - spec.md (functional requirements)
 *
 * All schemas provide runtime type validation with helpful error messages.
 */

import { z } from 'zod';
import { DateTime } from 'luxon';
import {
  PreferenceCategory,
  type PreferenceCategoryType,
  type PaydayPattern,
  type UserPreference,
  type PreferenceCollection,
} from './types';
import {
  STORAGE_LIMIT_BYTES,
  MAX_PREFERENCE_CATEGORIES,
  MAX_HOLIDAYS,
  MAX_SPECIFIC_DATES,
  MIN_DAY_OF_WEEK,
  MAX_DAY_OF_WEEK,
  MIN_DAY_OF_MONTH,
  MAX_DAY_OF_MONTH,
  SCHEMA_VERSION,
} from './constants';

// ============================================================================
// Timezone Validation
// ============================================================================

/**
 * Validates IANA timezone identifiers using luxon.
 *
 * @see data-model.md TimezoneValue
 * @see research.md Section 2 (luxon for timezone validation)
 *
 * @example
 * timezoneSchema.parse("America/New_York") // ✓
 * timezoneSchema.parse("Invalid/Zone")     // ✗ throws ZodError
 */
export const timezoneSchema = z
  .string()
  .min(1, 'Timezone cannot be empty')
  .refine(
    (tz) => {
      // Check for proper casing - IANA timezones use Title/Case format
      // Reject all-lowercase or all-uppercase (except UTC)
      if (tz !== 'UTC' && (tz === tz.toLowerCase() || tz === tz.toUpperCase())) {
        return false;
      }

      try {
        // luxon validates IANA timezone by attempting to create DateTime
        return DateTime.now().setZone(tz).isValid;
      } catch {
        return false;
      }
    },
    {
      message: 'Must be a valid IANA timezone identifier (e.g., "America/New_York", "UTC")',
    }
  );

// ============================================================================
// Payday Pattern Validation (Discriminated Union)
// ============================================================================

/**
 * Validates specific dates pattern (semi-monthly).
 * Example: 1st and 15th of each month.
 *
 * @see data-model.md SpecificDatesPattern
 * @see research.md Section 4 (18% of payrolls)
 */
export const specificDatesPatternSchema = z.object({
  type: z.literal('specific'),
  dates: z
    .array(z.number().int().min(MIN_DAY_OF_MONTH).max(MAX_DAY_OF_MONTH))
    .min(1, 'Must specify at least one payday date')
    .max(MAX_SPECIFIC_DATES, `Cannot exceed ${MAX_SPECIFIC_DATES} dates`)
    .refine((dates) => new Set(dates).size === dates.length, {
      message: 'Payday dates must be unique',
    }),
});

/**
 * Validates weekly pattern.
 * Example: Every Friday.
 *
 * @see data-model.md WeeklyPattern
 * @see research.md Section 4 (31.8% of payrolls)
 */
export const weeklyPatternSchema = z.object({
  type: z.literal('weekly'),
  dayOfWeek: z
    .number()
    .int()
    .min(MIN_DAY_OF_WEEK, 'Day of week must be 0-6 (0=Sunday, 6=Saturday)')
    .max(MAX_DAY_OF_WEEK, 'Day of week must be 0-6 (0=Sunday, 6=Saturday)'),
});

/**
 * Validates biweekly pattern (most common).
 * Example: Every other Friday starting 2025-01-03.
 *
 * @see data-model.md BiweeklyPattern
 * @see research.md Section 4 (45.7% of payrolls - most common)
 */
export const biweeklyPatternSchema = z.object({
  type: z.literal('biweekly'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date format (YYYY-MM-DD)')
    .refine(
      (date) => {
        const dt = DateTime.fromISO(date);
        return dt.isValid;
      },
      {
        message: 'Must be a valid date',
      }
    ),
  dayOfWeek: z
    .number()
    .int()
    .min(MIN_DAY_OF_WEEK, 'Day of week must be 0-6 (0=Sunday, 6=Saturday)')
    .max(MAX_DAY_OF_WEEK, 'Day of week must be 0-6 (0=Sunday, 6=Saturday)'),
});

/**
 * Validates monthly pattern.
 * Example: 1st of every month.
 *
 * @see data-model.md MonthlyPattern
 * @see research.md Section 4 (4.4% of payrolls)
 */
export const monthlyPatternSchema = z.object({
  type: z.literal('monthly'),
  dayOfMonth: z
    .number()
    .int()
    .min(MIN_DAY_OF_MONTH, `Day of month must be ${MIN_DAY_OF_MONTH}-${MAX_DAY_OF_MONTH}`)
    .max(MAX_DAY_OF_MONTH, `Day of month must be ${MIN_DAY_OF_MONTH}-${MAX_DAY_OF_MONTH}`),
});

/**
 * Discriminated union of all payday pattern schemas.
 *
 * @see data-model.md PaydayPattern
 */
export const paydayPatternSchema: z.ZodType<PaydayPattern> = z.discriminatedUnion('type', [
  specificDatesPatternSchema,
  weeklyPatternSchema,
  biweeklyPatternSchema,
  monthlyPatternSchema,
]);

// ============================================================================
// Business Day Settings Validation
// ============================================================================

/**
 * Validates business day settings (working days + holidays).
 *
 * @see data-model.md BusinessDaySettingsValue
 *
 * @example
 * businessDaySettingsSchema.parse({
 *   workingDays: [1, 2, 3, 4, 5], // Monday-Friday
 *   holidays: ["2025-12-25", "2025-01-01"]
 * })
 */
export const businessDaySettingsSchema = z.object({
  workingDays: z
    .array(z.number())
    .min(1, 'Must specify at least one working day')
    .max(7, 'Cannot have more than 7 working days')
    .refine((days) => new Set(days).size === days.length, {
      message: 'Working days must be unique',
    })
    .refine(
      (days) =>
        days.every(
          (day) =>
            Number.isInteger(day) &&
            day >= MIN_DAY_OF_WEEK &&
            day <= MAX_DAY_OF_WEEK
        ),
      {
        message: 'Day of week must be 0-6 (0=Sunday, 6=Saturday)',
      }
    ),
  holidays: z
    .array(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Holiday must be ISO date format (YYYY-MM-DD)')
        .refine(
          (date) => {
            const dt = DateTime.fromISO(date);
            return dt.isValid;
          },
          {
            message: 'Holiday must be a valid date',
          }
        )
    )
    .max(MAX_HOLIDAYS, `Cannot exceed ${MAX_HOLIDAYS} holidays`),
});

// ============================================================================
// Currency Format Validation
// ============================================================================

/**
 * Validates currency display formatting.
 *
 * @see data-model.md CurrencyFormatValue
 *
 * @example
 * currencyFormatSchema.parse({
 *   currencyCode: "USD",
 *   decimalSeparator: ".",
 *   thousandsSeparator: ",",
 *   symbolPosition: "before"
 * })
 */
export const currencyFormatSchema = z.object({
  currencyCode: z
    .string()
    .length(3, 'Currency code must be 3 characters (ISO 4217)')
    .regex(/^[A-Z]{3}$/, 'Currency code must be uppercase letters (e.g., USD, EUR, GBP)'),
  decimalSeparator: z
    .string()
    .refine((val) => val === '.' || val === ',', {
      message: 'Decimal separator must be "." or ","',
    }),
  thousandsSeparator: z
    .string()
    .refine((val) => val === ',' || val === '.' || val === ' ' || val === '', {
      message: 'Thousands separator must be ",", ".", " ", or empty string',
    }),
  symbolPosition: z
    .string()
    .refine((val) => val === 'before' || val === 'after', {
      message: 'Symbol position must be "before" or "after"',
    }),
});

// ============================================================================
// Locale Validation
// ============================================================================

/**
 * Validates BCP 47 language tags using Intl.getCanonicalLocales.
 *
 * Supports full BCP 47 spec including:
 * - Language codes: en, es, zh
 * - Region subtags: en-US, es-MX, fr-FR
 * - Script subtags: zh-Hant, sr-Latn, uz-Cyrl
 * - Variants: en-GB-oed, de-DE-1996
 *
 * @see data-model.md LocaleValue
 *
 * @example
 * localeSchema.parse("en-US") // ✓
 * localeSchema.parse("zh-Hant") // ✓ Traditional Chinese
 * localeSchema.parse("sr-Latn-RS") // ✓ Serbian Latin (Serbia)
 * localeSchema.parse("invalid") // ✗ throws ZodError
 */
export const localeSchema = z
  .string()
  .min(2, 'Locale must be at least 2 characters')
  .refine(
    (locale) => {
      try {
        // Use Intl.getCanonicalLocales for standards-compliant BCP 47 validation
        const canonical = Intl.getCanonicalLocales(locale)[0];
        // Enforce that the input matches canonical form (proper casing)
        // BCP 47 requires: lowercase language, Titlecase script, UPPERCASE region
        return canonical === locale;
      } catch {
        return false;
      }
    },
    {
      message: 'Must be valid BCP 47 language tag with proper casing (e.g., "en-US", "es-MX", "zh-Hant")',
    }
  );

// ============================================================================
// Category Value Validation (Discriminated Union)
// ============================================================================

/**
 * Timezone category value schema.
 */
const timezoneValueSchema = z.object({
  category: z.literal(PreferenceCategory.Timezone),
  value: timezoneSchema,
});

/**
 * Payday dates category value schema.
 */
const paydayDatesValueSchema = z.object({
  category: z.literal(PreferenceCategory.PaydayDates),
  value: paydayPatternSchema,
});

/**
 * Business day settings category value schema.
 */
const businessDaySettingsValueSchema = z.object({
  category: z.literal(PreferenceCategory.BusinessDaySettings),
  value: businessDaySettingsSchema,
});

/**
 * Currency format category value schema.
 */
const currencyFormatValueSchema = z.object({
  category: z.literal(PreferenceCategory.CurrencyFormat),
  value: currencyFormatSchema,
});

/**
 * Locale category value schema.
 */
const localeValueSchema = z.object({
  category: z.literal(PreferenceCategory.Locale),
  value: localeSchema,
});

/**
 * Discriminated union of all category value schemas.
 *
 * @see data-model.md CategoryValue
 */
export const categoryValueSchema = z.discriminatedUnion('category', [
  timezoneValueSchema,
  paydayDatesValueSchema,
  businessDaySettingsValueSchema,
  currencyFormatValueSchema,
  localeValueSchema,
]);

// ============================================================================
// User Preference Validation
// ============================================================================

/**
 * Validates a single user preference with opt-in status and timestamp.
 *
 * @see data-model.md UserPreference
 *
 * @example
 * userPreferenceSchema.parse({
 *   category: PreferenceCategory.Timezone,
 *   value: "America/New_York",
 *   optInStatus: true,
 *   timestamp: "2025-10-13T10:00:00.000Z"
 * })
 */
export const userPreferenceSchema: z.ZodType<UserPreference> = z.object({
  category: z.string() as z.ZodType<PreferenceCategoryType>,
  value: z.unknown(), // Type depends on category, validated separately
  optInStatus: z.boolean(),
  timestamp: z
    .string()
    .refine(
      (ts) => {
        const dt = DateTime.fromISO(ts);
        return dt.isValid;
      },
      {
        message: 'Timestamp must be valid ISO 8601 datetime',
      }
    ),
});

// ============================================================================
// Preference Collection Validation
// ============================================================================

/**
 * Validates serialized preference collection from localStorage.
 * Map is converted to Record for JSON serialization.
 *
 * @see data-model.md SerializedPreferenceCollection
 */
export const serializedPreferenceCollectionSchema = z.object({
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, 'Version must be MAJOR.MINOR.PATCH format'),
    // Note: Version mismatch is handled by loadPreferences(), not rejected here
    preferences: z.record(z.string(), userPreferenceSchema).refine(
      (prefs) => {
        return Object.keys(prefs).length <= MAX_PREFERENCE_CATEGORIES;
      },
      {
        message: `Cannot exceed ${MAX_PREFERENCE_CATEGORIES} preference categories`,
      }
    ),
    totalSize: z
      .number()
      .int()
      .min(0, 'Total size cannot be negative')
      .max(STORAGE_LIMIT_BYTES, `Total size cannot exceed ${STORAGE_LIMIT_BYTES} bytes (5KB)`),
    lastModified: z.string().refine(
      (ts) => {
        const dt = DateTime.fromISO(ts);
        return dt.isValid;
      },
      {
        message: 'Last modified must be valid ISO 8601 datetime',
      }
    ),
  });

/**
 * Validates preference collection with Map structure (runtime).
 *
 * @see data-model.md PreferenceCollection
 */
export const preferenceCollectionSchema = z.object({
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be MAJOR.MINOR.PATCH format')
    .refine((v) => v === SCHEMA_VERSION, {
      message: `Schema version mismatch. Expected ${SCHEMA_VERSION}`,
    }),
  preferences: z.instanceof(Map).refine(
    (map) => {
      return map.size <= MAX_PREFERENCE_CATEGORIES;
    },
    {
      message: `Cannot exceed ${MAX_PREFERENCE_CATEGORIES} preference categories`,
    }
  ) as z.ZodType<Map<PreferenceCategoryType, UserPreference>>,
  totalSize: z
    .number()
    .int()
    .min(0, 'Total size cannot be negative')
    .max(STORAGE_LIMIT_BYTES, `Total size cannot exceed ${STORAGE_LIMIT_BYTES} bytes (5KB)`),
  lastModified: z.string().refine(
    (ts) => {
      const dt = DateTime.fromISO(ts);
      return dt.isValid;
    },
    {
      message: 'Last modified must be valid ISO 8601 datetime',
      }
    ),
}) as z.ZodType<PreferenceCollection>;

// ============================================================================
// Category-Specific Validation Helper
// ============================================================================

/**
 * Validates a preference value for a specific category.
 * Provides type-safe validation based on category.
 *
 * @param category - Preference category
 * @param value - Value to validate
 * @returns Validation result with typed value or error
 *
 * @example
 * const result = validatePreferenceValue(
 *   PreferenceCategory.Timezone,
 *   "America/New_York"
 * );
 * if (result.success) {
 *   console.log(result.data); // Type: string
 * }
 */
export function validatePreferenceValue(
  category: PreferenceCategoryType,
  value: unknown
):
  | { success: true; data: unknown }
  | { success: false; error: z.ZodError<unknown> } {
  switch (category) {
    case PreferenceCategory.Timezone:
      return timezoneSchema.safeParse(value);
    case PreferenceCategory.PaydayDates:
      return paydayPatternSchema.safeParse(value);
    case PreferenceCategory.BusinessDaySettings:
      return businessDaySettingsSchema.safeParse(value);
    case PreferenceCategory.CurrencyFormat:
      return currencyFormatSchema.safeParse(value);
    case PreferenceCategory.Locale:
      return localeSchema.safeParse(value);
    default:
      return {
        success: false,
        error: new z.ZodError([
          {
            code: 'custom',
            path: ['category'],
            message: `Unknown preference category: ${category}`,
          },
        ]),
      };
  }
}
