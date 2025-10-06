/**
 * Extracts late fee amount from email text.
 * Looks for patterns like "Late fee: $7.00" or "Late charge: $10.00".
 *
 * @param text - Email text to search
 * @returns Late fee amount, defaults to 0 if not found
 */
export function extractLateFee(text: string): number {
  const patterns = [
    /late\s+(?:payment\s+)?fee[:\s]+\$?([\d,]+\.?\d{0,2})/i,
    /late\s+charge[:\s]+\$?([\d,]+\.?\d{0,2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const fee = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(fee) && fee >= 0) {
        return fee;
      }
    }
  }
  return 0; // default: no late fee
}
