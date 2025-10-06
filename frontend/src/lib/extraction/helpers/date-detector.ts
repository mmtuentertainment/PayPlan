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
export function isAmbiguousDate(dateText: string): boolean {
  // Only slash-separated dates are potentially ambiguous
  const slashPattern = /^(\d{1,2})\/(\d{1,2})\/\d{4}$/;
  const match = dateText.match(slashPattern);

  if (!match) return false;

  const first = parseInt(match[1], 10);
  const second = parseInt(match[2], 10);

  // Ambiguous only if both parts could be either month or day (1-12)
  return first <= 12 && second <= 12 && first > 0 && second > 0;
}
