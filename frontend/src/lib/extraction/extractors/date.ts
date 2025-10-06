import { parseDate } from '../../date-parser';
import type { DateLocale } from '../../date-parser';
import type { DateExtractionResult } from '../core/types';

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
