/**
 * Extracts currency from email text.
 * Currently defaults to USD for Phase A.
 *
 * @param text - Email text to analyze
 * @returns Currency code (e.g., 'USD')
 */
export function extractCurrency(text: string): string {
  // Simple: if $ symbol present, assume USD
  if (text.includes('$') || text.toLowerCase().includes('usd')) {
    return 'USD';
  }
  return 'USD'; // default for Phase A
}
