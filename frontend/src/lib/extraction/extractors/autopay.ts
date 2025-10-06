/**
 * Detects if autopay is enabled based on email keywords.
 * Looks for phrases like "AutoPay is ON", "automatically charged", etc.
 *
 * Security note: Explicitly checks for negative keywords ("off", "disabled")
 * to avoid false positives when autopay is explicitly disabled.
 *
 * @param text - Email text to analyze
 * @returns true if autopay is detected, false otherwise
 */
export function detectAutopay(text: string): boolean {
  if (!text) {
    return false; // Handle null, undefined, empty string
  }
  const lower = text.toLowerCase();

  // Check for explicit OFF/disabled signals first (higher priority)
  const negativeKeywords = [
    'autopay is off',
    'autopay disabled',
    'autopay: off',
    'autopay not enabled',
    'automatic payment is off',
    'automatic payment disabled'
  ];
  if (negativeKeywords.some(kw => lower.includes(kw))) {
    return false;
  }

  // Then check for positive signals
  const positiveKeywords = [
    'autopay is on',
    'autopay enabled',
    'autopay: on',
    'auto-pay',
    'automatic payment',
    'automatically charged',
    'will be charged automatically'
  ];
  return positiveKeywords.some(kw => lower.includes(kw));
}
