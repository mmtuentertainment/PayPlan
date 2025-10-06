import { dollarsToCents } from '../helpers/currency';

/**
 * Extracts payment amount from email text.
 *
 * **Returns integer cents for financial accuracy.**
 * Example: "$25.00" → 2500 cents
 *
 * @param text - Email text to search
 * @param patterns - Array of regex patterns to try
 * @returns Extracted amount in integer cents (e.g., 2500 = $25.00)
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
      const dollars = parseFloat(amountStr);
      if (!isNaN(dollars) && dollars >= 0) {
        // Convert to integer cents for financial accuracy
        return dollarsToCents(dollars);
      }
    }
  }
  throw new Error('Amount not found. Ensure email contains text like "Payment: $25.00" or "$25.00 due"');
}
