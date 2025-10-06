import { dollarsToCents } from '../helpers/currency';

/**
 * Extracts late fee amount from email text.
 * Looks for patterns like "Late fee: $7.00" or "Late charge: $10.00".
 *
 * **Returns integer cents for financial accuracy.**
 * Example: "$7.00" → 700 cents
 *
 * @param text - Email text to search
 * @returns Late fee amount in integer cents (e.g., 700 = $7.00), defaults to 0 if not found
 */
export function extractLateFee(text: string): number {
  const patterns = [
    /late\s+(?:payment\s+)?fee[:\s]+\$?([\d,]+\.?\d{0,2})/i,
    /late\s+charge[:\s]+\$?([\d,]+\.?\d{0,2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const dollars = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(dollars) && dollars >= 0) {
        // Convert to integer cents for financial accuracy
        return dollarsToCents(dollars);
      }
    }
  }
  return 0; // default: no late fee (0 cents)
}
