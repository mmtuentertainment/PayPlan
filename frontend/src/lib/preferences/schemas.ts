/**
 * Zod validation schemas for User Preference Management System
 *
 * Feature: 012-user-preference-management
 *
 * Purpose: Runtime validation for preference data to ensure type safety and prevent
 * invalid data from being stored or processed.
 *
 * @see types.ts for TypeScript type definitions
 */

import { z } from 'zod';
import { PreferenceCategory } from './types';

// ============================================================================
// Payday Pattern Schemas
// ============================================================================

const specificDatesPatternSchema = z.object({
  type: z.literal('specific'),
  dates: z.array(z.number().int().min(1).max(31)).min(1).max(31),
});

const weeklyPatternSchema = z.object({
  type: z.literal('weekly'),
  dayOfWeek: z.number().int().min(0).max(6),
});

const biweeklyPatternSchema = z.object({
  type: z.literal('biweekly'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: z.number().int().min(0).max(6),
});

const monthlyPatternSchema = z.object({
  type: z.literal('monthly'),
  dayOfMonth: z.number().int().min(1).max(31),
});

const paydayPatternSchema = z.discriminatedUnion('type', [
  specificDatesPatternSchema,
  weeklyPatternSchema,
  biweeklyPatternSchema,
  monthlyPatternSchema,
]);

// ============================================================================
// Category-Specific Value Schemas
// ============================================================================

/**
 * Timezone value schema - IANA timezone identifier
 * Examples: "America/New_York", "Europe/London", "UTC"
 */
export const timezoneValueSchema = z.string().min(1);

/**
 * Payday dates value schema - Discriminated union of pattern types
 */
export const paydayDatesValueSchema = paydayPatternSchema;

/**
 * Business day settings value schema
 */
export const businessDaySettingsValueSchema = z.object({
  workingDays: z.array(z.number().int().min(0).max(6)).min(0).max(7),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(50),
});

/**
 * Currency format value schema
 */
export const currencyFormatValueSchema = z.object({
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  decimalSeparator: z.enum(['.', ',']),
  thousandsSeparator: z.enum([',', '.', ' ', '']),
  symbolPosition: z.enum(['before', 'after']),
});

/**
 * Locale value schema - BCP 47 language tag
 * Examples: "en-US", "en-GB", "es-MX", "fr-FR"
 */
export const localeValueSchema = z.string().regex(/^[a-z]{2}-[A-Z]{2}$/);

// ============================================================================
// User Preference Schema
// ============================================================================

/**
 * Generic user preference schema
 */
const userPreferenceBaseSchema = z.object({
  category: z.enum([
    PreferenceCategory.Timezone,
    PreferenceCategory.PaydayDates,
    PreferenceCategory.BusinessDaySettings,
    PreferenceCategory.CurrencyFormat,
    PreferenceCategory.Locale,
  ]),
  optInStatus: z.boolean(),
  timestamp: z.string().datetime(),
});

/**
 * Category-specific preference schemas
 */
export const timezonePreferenceSchema = userPreferenceBaseSchema.extend({
  category: z.literal(PreferenceCategory.Timezone),
  value: timezoneValueSchema,
});

export const paydayDatesPreferenceSchema = userPreferenceBaseSchema.extend({
  category: z.literal(PreferenceCategory.PaydayDates),
  value: paydayDatesValueSchema,
});

export const businessDaySettingsPreferenceSchema = userPreferenceBaseSchema.extend({
  category: z.literal(PreferenceCategory.BusinessDaySettings),
  value: businessDaySettingsValueSchema,
});

export const currencyFormatPreferenceSchema = userPreferenceBaseSchema.extend({
  category: z.literal(PreferenceCategory.CurrencyFormat),
  value: currencyFormatValueSchema,
});

export const localePreferenceSchema = userPreferenceBaseSchema.extend({
  category: z.literal(PreferenceCategory.Locale),
  value: localeValueSchema,
});

/**
 * Discriminated union of all preference schemas
 */
export const userPreferenceSchema = z.discriminatedUnion('category', [
  timezonePreferenceSchema,
  paydayDatesPreferenceSchema,
  businessDaySettingsPreferenceSchema,
  currencyFormatPreferenceSchema,
  localePreferenceSchema,
]);

// ============================================================================
// Preference Update Schema (for App.tsx onSave validation)
// ============================================================================

/**
 * Schema for validating preference updates from UI components.
 * This is used by App.tsx to validate onSave callback inputs.
 */
export const preferenceUpdateSchema = z.object({
  category: z.enum([
    PreferenceCategory.Timezone,
    PreferenceCategory.PaydayDates,
    PreferenceCategory.BusinessDaySettings,
    PreferenceCategory.CurrencyFormat,
    PreferenceCategory.Locale,
  ]),
  value: z.unknown(), // Will be validated by category-specific schemas
  optIn: z.boolean(),
});

/**
 * Validate a preference update and refine the value type based on category.
 *
 * @param input - Raw preference update input
 * @returns Validated preference update with typed value
 * @throws {z.ZodError} If validation fails
 */
export function validatePreferenceUpdate(input: unknown) {
  // First validate the base structure
  const baseValidation = preferenceUpdateSchema.parse(input);

  // Then validate the value based on category
  let validatedValue: unknown;

  switch (baseValidation.category) {
    case PreferenceCategory.Timezone:
      validatedValue = timezoneValueSchema.parse(baseValidation.value);
      break;
    case PreferenceCategory.PaydayDates:
      validatedValue = paydayDatesValueSchema.parse(baseValidation.value);
      break;
    case PreferenceCategory.BusinessDaySettings:
      validatedValue = businessDaySettingsValueSchema.parse(baseValidation.value);
      break;
    case PreferenceCategory.CurrencyFormat:
      validatedValue = currencyFormatValueSchema.parse(baseValidation.value);
      break;
    case PreferenceCategory.Locale:
      validatedValue = localeValueSchema.parse(baseValidation.value);
      break;
    default:
      throw new Error(`Unknown preference category: ${(baseValidation as { category: string }).category}`);
  }

  return {
    category: baseValidation.category,
    value: validatedValue,
    optIn: baseValidation.optIn,
  };
}
