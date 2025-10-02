import { DateTime } from 'luxon';

/**
 * Parse common date formats to ISO YYYY-MM-DD
 */
export function parseDate(dateStr: string, timezone: string): string {
  const formats = [
    'yyyy-MM-dd',           // 2025-10-06
    'M/d/yyyy',             // 10/6/2025
    'MM/dd/yyyy',           // 10/06/2025
    'MMMM d, yyyy',         // October 6, 2025
    'MMM d, yyyy',          // Oct 6, 2025
    'd MMMM yyyy',          // 6 October 2025
    'd MMM yyyy'            // 6 Oct 2025
  ];

  // Clean input: strip ordinal suffixes (st, nd, rd, th)
  const cleaned = dateStr.trim().replace(/(\d+)(st|nd|rd|th)/gi, '$1');

  for (const format of formats) {
    const dt = DateTime.fromFormat(cleaned, format, { zone: timezone });
    if (dt.isValid) {
      const isoDate = dt.toISODate();
      if (!isoDate) {
        continue;
      }

      // Check if suspicious
      if (isSuspiciousDate(isoDate)) {
        throw new Error(`Suspicious date: ${isoDate} (too far past/future)`);
      }
      return isoDate;
    }
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Flag dates >30 days in past or >2 years in future
 */
export function isSuspiciousDate(isoDate: string): boolean {
  const dt = DateTime.fromISO(isoDate);
  const now = DateTime.now();

  const daysDiff = dt.diff(now, 'days').days;

  return daysDiff < -30 || daysDiff > 730;
}
