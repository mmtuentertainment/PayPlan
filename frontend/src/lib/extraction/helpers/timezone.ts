/**
 * Timezone utilities for BNPL payment date handling.
 *
 * **Why Timezone-Aware Dates Matter:**
 * Payment due dates like "2025-10-06" are ambiguous without timezone information.
 * - Is it October 6 at midnight UTC?
 * - Is it October 6 at midnight in New York (EDT)?
 * - Is it October 6 at midnight in Tokyo (JST)?
 *
 * This ambiguity can cause payment timing errors:
 * - User thinks payment is due "today" but system thinks it's "tomorrow"
 * - Autopay triggers at wrong time
 * - Late fees calculated incorrectly
 *
 * **Solution:**
 * Store dates as ISO 8601 with timezone offset:
 * - "2025-10-06T00:00:00.000-04:00" (October 6 midnight in EDT)
 * - "2025-10-06T00:00:00.000+09:00" (October 6 midnight in JST)
 *
 * This eliminates ALL timezone ambiguity.
 *
 * @module timezone
 */

import { DateTime } from 'luxon';

/**
 * Validates an IANA timezone string.
 *
 * Valid examples: "America/New_York", "Europe/London", "Asia/Tokyo", "UTC"
 * Invalid examples: "EST", "PST", "GMT+5" (use IANA names, not abbreviations)
 *
 * @param timezone - IANA timezone identifier
 * @returns The validated timezone string (same as input if valid)
 * @throws Error if timezone is invalid or not recognized
 *
 * @example
 * ```typescript
 * validateTimezone("America/New_York")  // "America/New_York" ✅
 * validateTimezone("EST")               // throws Error ❌
 * validateTimezone("Invalid/Zone")      // throws Error ❌
 * ```
 */
export function validateTimezone(timezone: string): string {
  if (!timezone || typeof timezone !== 'string') {
    throw new Error('Timezone must be a non-empty string');
  }

  // Reject common abbreviations (EST, PST, GMT+X, etc.)
  // These are ambiguous and don't handle DST correctly
  const abbreviationPattern = /^(EST|EDT|CST|CDT|MST|MDT|PST|PDT|GMT[+-]?\d*)$/i;
  if (abbreviationPattern.test(timezone)) {
    throw new Error(`Invalid timezone: "${timezone}". Use IANA names (e.g., "America/New_York") instead of abbreviations`);
  }

  // Validate with Luxon
  try {
    const dt = DateTime.local().setZone(timezone);
    if (!dt.isValid) {
      throw new Error(`Invalid timezone: "${timezone}". Must be valid IANA timezone (e.g., "America/New_York")`);
    }
    return timezone;
  } catch {
    throw new Error(`Invalid timezone: "${timezone}". Must be valid IANA timezone (e.g., "America/New_York")`);
  }
}

/**
 * Converts a date string to timezone-aware ISO 8601 format.
 *
 * **Input Formats Supported:**
 * - ISO: "2025-10-06" → "2025-10-06T00:00:00.000-04:00"
 * - US slash: "10/06/2025" → "2025-10-06T00:00:00.000-04:00"
 * - EU slash: "06/10/2025" → "2025-10-06T00:00:00.000-04:00"
 *
 * **Output Format:**
 * Always ISO 8601 with timezone offset: "2025-10-06T00:00:00.000-04:00"
 *
 * **Daylight Saving Time (DST) Handling:**
 * Luxon automatically handles DST transitions:
 * - March 2025: EDT is UTC-4
 * - November 2025: EST is UTC-5
 *
 * @param dateStr - Date string to convert
 * @param timezone - IANA timezone for the date
 * @param dateLocale - Locale for ambiguous date parsing ('US' or 'EU')
 * @returns ISO 8601 string with timezone offset
 * @throws Error if date cannot be parsed or timezone is invalid
 *
 * @example
 * ```typescript
 * // US locale: MM/DD/YYYY
 * toTimezoneAwareISO("10/06/2025", "America/New_York", "US")
 * // → "2025-10-06T00:00:00.000-04:00"
 *
 * // EU locale: DD/MM/YYYY
 * toTimezoneAwareISO("06/10/2025", "Europe/London", "EU")
 * // → "2025-10-06T00:00:00.000+01:00"
 *
 * // ISO format (locale-independent)
 * toTimezoneAwareISO("2025-10-06", "Asia/Tokyo")
 * // → "2025-10-06T00:00:00.000+09:00"
 * ```
 */
export function toTimezoneAwareISO(
  dateStr: string,
  timezone: string,
  dateLocale: 'US' | 'EU' = 'US'
): string {
  // Validate timezone first
  const validatedTz = validateTimezone(timezone);

  // Parse date based on format
  let dt: DateTime;

  // Check if ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    dt = DateTime.fromISO(dateStr, { zone: validatedTz });
  }
  // Check if slash-separated date (MM/DD/YYYY or DD/MM/YYYY)
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    if (dateLocale === 'US') {
      // US: MM/DD/YYYY
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      dt = DateTime.fromObject({ year, month, day }, { zone: validatedTz });
    } else {
      // EU: DD/MM/YYYY
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      dt = DateTime.fromObject({ year, month, day }, { zone: validatedTz });
    }
  } else {
    throw new Error(`Unsupported date format: "${dateStr}". Use ISO (YYYY-MM-DD) or slash-separated (MM/DD/YYYY or DD/MM/YYYY)`);
  }

  // Validate the parsed date
  if (!dt.isValid) {
    throw new Error(`Invalid date: "${dateStr}". ${dt.invalidReason || 'Check date values'}`);
  }

  // Return ISO 8601 with timezone offset
  return dt.toISO({ includeOffset: true }) || '';
}

/**
 * Checks if a date is valid (exists in the calendar).
 *
 * Examples of invalid dates:
 * - "2025-02-30" (February doesn't have 30 days)
 * - "2025-13-01" (Month 13 doesn't exist)
 * - "2025-04-31" (April only has 30 days)
 *
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @returns true if date is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidDate(2025, 2, 30)  // false (Feb 30 doesn't exist)
 * isValidDate(2025, 10, 6)  // true
 * isValidDate(2024, 2, 29)  // true (2024 is leap year)
 * isValidDate(2025, 2, 29)  // false (2025 is not leap year)
 * ```
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  const dt = DateTime.fromObject({ year, month, day });
  return dt.isValid;
}

/**
 * Gets the timezone offset for a specific date.
 *
 * Useful for debugging DST transitions and understanding why dates
 * have different offsets in the same timezone.
 *
 * @param dateStr - ISO date string
 * @param timezone - IANA timezone
 * @returns Offset string (e.g., "UTC-4", "UTC+9")
 *
 * @example
 * ```typescript
 * // March 2025: Daylight Saving Time (EDT)
 * getTimezoneOffset("2025-03-15", "America/New_York")  // "UTC-4"
 *
 * // November 2025: Standard Time (EST)
 * getTimezoneOffset("2025-11-15", "America/New_York")  // "UTC-5"
 * ```
 */
export function getTimezoneOffset(dateStr: string, timezone: string): string {
  const dt = DateTime.fromISO(dateStr, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid date: "${dateStr}"`);
  }
  const offset = dt.offset;
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${hours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`;
}

/**
 * Checks if a date falls within DST (Daylight Saving Time) period.
 *
 * @param dateStr - ISO date string
 * @param timezone - IANA timezone
 * @returns true if date is in DST period
 *
 * @example
 * ```typescript
 * isInDST("2025-07-01", "America/New_York")   // true (summer)
 * isInDST("2025-01-01", "America/New_York")   // false (winter)
 * isInDST("2025-07-01", "Asia/Tokyo")         // false (Japan doesn't use DST)
 * ```
 */
export function isInDST(dateStr: string, timezone: string): boolean {
  const dt = DateTime.fromISO(dateStr, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid date: "${dateStr}"`);
  }
  return dt.isInDST;
}
