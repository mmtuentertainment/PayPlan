import { DateTime } from 'luxon';
import type { DateExtractionResult } from '../core/types';

/**
 * Date locale for parsing ambiguous slash-separated dates.
 * - US: M/d/yyyy format (01/02/2025 = January 2, 2025)
 * - EU: d/M/yyyy format (01/02/2025 = February 1, 2025)
 */
export type DateLocale = 'US' | 'EU';

/**
 * Parse common date formats to ISO YYYY-MM-DD with locale-aware handling.
 * Handles DST transitions, leap years, and invalid dates automatically via Luxon.
 *
 * **Date Locale Support (v0.1.5-a)**
 * Supports US and EU date format interpretation for ambiguous slash-separated dates:
 * - US mode (default): "01/02/2025" → 2025-01-02 (January 2, 2025)
 * - EU mode: "01/02/2025" → 2025-02-01 (February 1, 2025)
 *
 * @param dateStr - Date string in various formats (e.g., "10/6/2025", "October 6, 2025")
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @param options - Optional parsing options
 * @param options.dateLocale - Locale for ambiguous dates (default: 'US')
 * @returns ISO date string (YYYY-MM-DD)
 * @throws Error if date cannot be parsed or is suspicious
 *
 * @example
 * // US locale (default)
 * parseDate('01/02/2025', 'America/New_York') // => '2025-01-02' (Jan 2)
 * parseDate('01/02/2025', 'America/New_York', { dateLocale: 'US' }) // => '2025-01-02'
 *
 * @example
 * // EU locale
 * parseDate('01/02/2025', 'America/New_York', { dateLocale: 'EU' }) // => '2025-02-01' (Feb 1)
 * parseDate('31/12/2025', 'America/New_York', { dateLocale: 'EU' }) // => '2025-12-31'
 */
export function parseDate(
  dateStr: string,
  timezone: string,
  options?: { dateLocale?: DateLocale }
): string {
  const locale = options?.dateLocale || 'US';

  const formats = [
    'yyyy-MM-dd',           // 2025-10-06 (ISO, unambiguous)
    ...(locale === 'US' ? ['M/d/yyyy', 'MM/dd/yyyy'] : ['d/M/yyyy', 'dd/MM/yyyy']),
    'MMMM d, yyyy',         // October 6, 2025 (unambiguous)
    'MMM d, yyyy',          // Oct 6, 2025 (unambiguous)
    'd MMMM yyyy',          // 6 October 2025 (unambiguous)
    'd MMM yyyy'            // 6 Oct 2025 (unambiguous)
  ];

  // Clean input: strip ordinal suffixes (st, nd, rd, th)
  const cleaned = dateStr.trim().replace(/(\d+)(st|nd|rd|th)/gi, '$1');

  for (const format of formats) {
    const dt = DateTime.fromFormat(cleaned, format, { zone: timezone });
    if (dt.isValid) {
      const isoDate = dt.toISODate();
      if (!isoDate) {
        continue; // Invalid date (e.g., Feb 30)
      }

      // Check if suspicious
      if (isSuspiciousDate(isoDate, timezone)) {
        throw new Error(`Suspicious date: ${isoDate} (too far past/future)`);
      }
      return isoDate;
    }
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Flag dates >30 days in past or >2 years in future.
 * Uses consistent timezone to avoid false positives during DST transitions.
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @param timezone - IANA timezone for consistent comparison (optional)
 * @returns true if date is suspicious
 */
export function isSuspiciousDate(isoDate: string, timezone?: string): boolean {
  const dt = DateTime.fromISO(isoDate, { zone: timezone || 'local' });
  const now = DateTime.now().setZone(timezone || 'local');

  const daysDiff = dt.diff(now, 'days').days;

  return daysDiff < -30 || daysDiff > 730;
}

/**
 * Extracts payment due date from email text.
 * Returns both the parsed ISO date AND the original raw text for re-parsing.
 *
 * @param text - Email text to search
 * @param patterns - Array of regex patterns to try
 * @param timezone - IANA timezone for date parsing
 * @param dateLocale - Date locale ('US' or 'EU') for ambiguous dates
 * @returns DateExtractionResult with ISO date, raw text, and ambiguity flag
 * @throws Error if text is null/undefined or date cannot be found
 * @example
 * extractDueDate('Payment due: 10/04/2025', [...], 'America/New_York', 'US')
 * // Returns: { isoDate: '2025-10-04', rawText: '10/04/2025', isAmbiguous: true }
 */
export function extractDueDate(
  text: string,
  patterns: RegExp[],
  timezone: string,
  dateLocale: DateLocale = 'US'
): DateExtractionResult {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const rawText = match[1];
      try {
        const isoDate = parseDate(rawText, timezone, { dateLocale });

        // Check if date is ambiguous (MM/DD vs DD/MM)
        // A date is ambiguous if it's in slash format with day/month both <= 12
        const isAmbiguous = isAmbiguousDate(rawText);

        return { isoDate, rawText, isAmbiguous };
      } catch {
        continue;
      }
    }
  }
  throw new Error('Due date not found. Please ensure email contains text like "Due: 10/6/2025" or "Due date: October 6, 2025"');
}

/**
 * Detects if a date string is ambiguous (could be MM/DD or DD/MM).
 * Only slash-separated dates with both parts <= 12 are ambiguous.
 *
 * @param dateText - Raw date text to check
 * @returns true if date format is ambiguous
 * @example
 * isAmbiguousDate('01/02/2026') // true (could be Jan 2 or Feb 1)
 * isAmbiguousDate('13/02/2026') // false (must be DD/MM, 13 > 12)
 * isAmbiguousDate('October 6, 2025') // false (explicit month name)
 */
function isAmbiguousDate(dateText: string): boolean {
  // Only slash-separated dates are potentially ambiguous
  const slashPattern = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;
  const match = dateText.match(slashPattern);

  if (!match) return false;

  const first = parseInt(match[1], 10);
  const second = parseInt(match[2], 10);

  // Ambiguous only if both parts could be either month or day (1-12)
  return first <= 12 && second <= 12 && first > 0 && second > 0;
}
