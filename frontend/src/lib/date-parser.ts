import { DateTime } from 'luxon';

/**
 * Parse common date formats to ISO YYYY-MM-DD.
 * Handles DST transitions, leap years, and invalid dates automatically via Luxon.
 *
 * **IMPORTANT: Date Format Ambiguity**
 * This parser assumes US date format (M/d/yyyy) for slash-separated dates.
 * - "01/02/2025" will be parsed as January 2, 2025 (NOT February 1, 2025)
 * - "10/06/2025" will be parsed as October 6, 2025 (NOT June 10, 2025)
 *
 * For Phase A (Klarna & Affirm in US market), this is acceptable.
 * For Phase B with international providers, consider:
 * - Adding a locale/format preference parameter
 * - Detecting provider locale and using appropriate format
 * - Requiring ISO format (YYYY-MM-DD) for ambiguous cases
 *
 * @param dateStr - Date string in various formats (e.g., "10/6/2025", "October 6, 2025")
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @returns ISO date string (YYYY-MM-DD)
 * @throws Error if date cannot be parsed or is suspicious
 */
export function parseDate(dateStr: string, timezone: string): string {
  const formats = [
    'yyyy-MM-dd',           // 2025-10-06 (ISO, unambiguous)
    'M/d/yyyy',             // 10/6/2025 (US format: month/day/year)
    'MM/dd/yyyy',           // 10/06/2025 (US format: month/day/year)
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
