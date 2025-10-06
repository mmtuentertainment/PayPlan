import { PROVIDER_PATTERNS, type Provider } from './patterns';

/**
 * Detects BNPL provider from email text.
 * Uses email domain and keyword signatures for detection.
 *
 * Guard logic for Zip/Sezzle: Prevents false positives (e.g., "zip this file")
 * by requiring either domain match OR (keyword + nearby installment phrase).
 *
 * @param emailText - Email content to analyze
 * @returns Provider name ('Klarna', 'Affirm', 'Afterpay', 'PayPalPayIn4', 'Zip', 'Sezzle', or 'Unknown')
 * @example
 * detectProvider('From: service@paypal.com\nYour Pay in 4 payment 1 of 4 is due...')
 * // Returns: 'PayPalPayIn4'
 * @example
 * detectProvider('From: noreply@zip.co\nYour Zip payment 1 of 4 is due on 10/15/2025')
 * // Returns: 'Zip'
 * @example
 * detectProvider('From: hello@sezzle.com\nSezzle installment 2 of 4 due soon')
 * // Returns: 'Sezzle'
 */
export function detectProvider(emailText: string): Provider {
  const matchesSignature = (text: string, sig: string | RegExp): boolean => {
    if (typeof sig === 'string') {
      return text.includes(sig);
    }
    return sig.test(text);
  };

  const lower = emailText.toLowerCase();

  if (PROVIDER_PATTERNS.klarna.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Klarna';
  }

  if (PROVIDER_PATTERNS.affirm.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Affirm';
  }

  if (PROVIDER_PATTERNS.afterpay.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Afterpay';
  }

  if (PROVIDER_PATTERNS.paypalpayin4.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'PayPalPayIn4';
  }

  // Helper function to check proximity between ALL occurrences of two regex patterns
  // Returns true if ANY pair of matches are within maxDistance characters
  const checkProximity = (text: string, pattern1: RegExp, pattern2: RegExp, maxDistance: number): boolean => {
    const collectIndices = (pattern: RegExp): number[] => {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      const globalPattern = new RegExp(pattern.source, flags);
      const indices: number[] = [];
      let match: RegExpExecArray | null;
      while ((match = globalPattern.exec(text)) !== null) {
        if (match.index !== undefined) {
          indices.push(match.index);
        }
        // Advance by at least one to avoid infinite loops on zero-length matches
        if (match[0].length === 0) {
          globalPattern.lastIndex += 1;
        }
      }
      return indices;
    };

    const indices1 = collectIndices(pattern1);
    const indices2 = collectIndices(pattern2);

    // Check if any pair of indices are within maxDistance
    return indices1.some(idx1 =>
      indices2.some(idx2 => Math.abs(idx1 - idx2) <= maxDistance)
    );
  };

  // Zip detection with guard against false positives ("zip this file", etc.)
  // Require domain match OR (keyword + nearby installment/pay-in-4 phrase within 80 chars)
  const hasZipDomain = lower.includes('@zip.co') || lower.includes('@quadpay.com');
  const zipKeywordPattern = /\b(?:Zip(?:\s+Pay)?|Quadpay)\b/i;
  const installmentPhrasePattern = /\b(?:pay\s+in\s+\d|installment|payment\s+\d\s+of\s+\d)\b/i;

  if (hasZipDomain) {
    return 'Zip';
  }

  if (zipKeywordPattern.test(emailText) && checkProximity(emailText, zipKeywordPattern, installmentPhrasePattern, 80)) {
    return 'Zip';
  }

  // Sezzle detection with guard (keyword requires nearby installment phrase)
  const hasSezzleDomain = lower.includes('@sezzle.com');
  const sezzleKeywordPattern = /\bSezzle\b/i;

  if (hasSezzleDomain) {
    return 'Sezzle';
  }

  if (sezzleKeywordPattern.test(emailText) && checkProximity(emailText, sezzleKeywordPattern, installmentPhrasePattern, 80)) {
    return 'Sezzle';
  }

  return 'Unknown';
}
