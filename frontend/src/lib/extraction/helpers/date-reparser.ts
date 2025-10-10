import { parseDate } from '../extractors/date';
import type { DateLocale } from '../extractors/date';

/**
 * Re-parses a raw date string using a different locale.
 * Used by DateQuickFix to re-interpret ambiguous dates (MM/DD vs DD/MM).
 *
 * @param rawText - Original date text from email (e.g., "01/02/2026")
 * @param timezone - IANA timezone for date parsing
 * @param targetLocale - Target locale to use ('US' or 'EU')
 * @returns New ISO date string parsed with target locale
 * @throws Error if rawText cannot be parsed
 * @example
 * reparseDate('01/02/2026', 'America/New_York', 'EU')
 * // US: "2026-01-02" (Jan 2) → EU: "2026-02-01" (Feb 1)
 */
export function reparseDate(
  rawText: string,
  timezone: string,
  targetLocale: DateLocale
): string {
  return parseDate(rawText, timezone, { dateLocale: targetLocale });
}
