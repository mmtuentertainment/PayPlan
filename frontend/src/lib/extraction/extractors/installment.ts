/**
 * Extracts installment number from payment email.
 * Looks for patterns like "Payment 2 of 4" or "2/4".
 *
 * @param text - Email text to search
 * @param patterns - Array of regex patterns to try
 * @returns Installment number (1-12), defaults to 1 if not found
 */
export function extractInstallmentNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 12) {
        return num;
      }
    }
  }

  const fallback = text.match(/\b(?:installment|payment)\b[^0-9]{0,6}(\d{1,2})/i);
  if (fallback && fallback[1]) {
    const num = parseInt(fallback[1], 10);
    if (!isNaN(num) && num > 0 && num <= 12) {
      return num;
    }
  }

  return 1; // default to first installment
}
