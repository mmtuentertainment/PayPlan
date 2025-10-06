import { DateTime } from 'luxon';

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
