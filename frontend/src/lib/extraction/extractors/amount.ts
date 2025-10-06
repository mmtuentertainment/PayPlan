/**
 * Extracts payment amount from email text.
 *
 * @param text - Email text to search
 * @param patterns - Array of regex patterns to try
 * @returns Extracted amount as number
 * @throws Error if text is null/undefined or amount cannot be found
 */
export function extractAmount(text: string, patterns: RegExp[]): number {
  if (!text) {
    throw new Error('Cannot extract amount from null or undefined text');
  }

  if (!patterns || patterns.length === 0) {
    throw new Error('No amount patterns provided');
  }

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount >= 0) {
        return amount;
      }
    }
  }
  throw new Error('Amount not found. Ensure email contains text like "Payment: $25.00" or "$25.00 due"');
}
