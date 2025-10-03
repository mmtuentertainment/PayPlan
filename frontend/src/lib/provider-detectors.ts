import { parseDate } from './date-parser';

export type Provider = 'Klarna' | 'Affirm' | 'Afterpay' | 'PayPalPayIn4' | 'Zip' | 'Sezzle' | 'Unknown';

export interface ProviderPatterns {
  signatures: (string | RegExp)[];
  amountPatterns: RegExp[];
  datePatterns: RegExp[];
  installmentPatterns: RegExp[];
}

/**
 * Provider-specific patterns for data extraction.
 * Uses word boundaries and specific signatures to avoid false matches.
 */
export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  klarna: {
    // More specific signatures with word boundaries and email domain
    signatures: ['@klarna.com', /\bklarna\b/i],
    amountPatterns: [
      // Require word boundaries and 2 decimal places for precision
      /\bpayment\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /\bamount\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      // Fallback: allow 0-2 decimals
      /\bpayment\b[:\s]+\$?([\d,]+\.?\d{0,2})\b/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+\bdue\b/i
    ],
    datePatterns: [
      /due\s+(?:date)?[:\s]*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/
    ]
  },

  affirm: {
    signatures: ['@affirm.com', /\baffirm\b/i],
    amountPatterns: [
      /\binstallment\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /\bamount\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      // Fallback: allow 0-2 decimals
      /\binstallment\b[:\s]+\$?([\d,]+\.?\d{0,2})\b/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+\bdue\b/i
    ],
    datePatterns: [
      /due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /installment\s+(\d+)\s+of\s+(\d+)/i,
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/
    ]
  },

  afterpay: {
    signatures: ['@afterpay.com', /\bafterpay\b/i],
    amountPatterns: [
      /\binstallment\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /\bamount\s+due\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      // Fallback: allow 0-2 decimals
      /\binstallment\b[:\s]+\$?([\d,]+\.?\d{0,2})\b/i
    ],
    datePatterns: [
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /due\s+date[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /installment\s+(\d+)\/(\d+)/i,
      /final\s+payment/i
    ]
  },

  paypalpayin4: {
    // Order signatures by specificity: keyword first (most specific), then domain
    signatures: [/\bpay\s*in\s*4\b/i, '@paypal.com'],
    amountPatterns: [
      // PayPal specific: "payment 1 of 4: $37.50" - tightened for financial accuracy
      // Only allows optional installment notation (X of Y) between keyword and amount
      /\b(?:payment|installment)(?:\s+\d{1,2}\s+of\s+\d{1,2})?[:\s]+\$([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/i,
      // Standard amount patterns - require exactly 2 decimal places
      /\bamount\s+due\b[:\s]*\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\b(?:due|owing)\b/i,
      // Fallback: any dollar amount with exactly 2 decimals
      /\$([0-9][0-9,]*\.[0-9]{2})\b/
    ],
    datePatterns: [
      // PayPal uses MM/DD/YYYY or M/D/YYYY
      /due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /\bby[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Also supports "Oct 6, 2025" or "October 6, 2025"
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /\bby[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      // Generic date patterns
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/
    ],
    installmentPatterns: [
      // PayPal: "payment 1 of 4" or "installment 2/4"
      /(?:payment|installment)\s*(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/i,
      // Final payment indicator
      /final\s*(?:payment|installment)/i,
      // Fallback: X of Y or X/Y
      /(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/
    ]
  },

  zip: {
    // Guard against false positives: "zip" is a common file verb
    // Require domain match OR (keyword + nearby installment phrase within 80 chars)
    signatures: ['@zip.co', '@quadpay.com', /\bZip(?:\s+Pay)?\b/i, /\bQuadpay\b/i],
    amountPatterns: [
      // Zip specific: "payment 1 of 4: $25.00" - tightened for financial accuracy
      /\b(?:payment|installment)(?:\s+\d{1,2}\s+of\s+\d{1,2})?[:\s]+\$([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/i,
      // Standard amount patterns - require exactly 2 decimal places
      /\bamount\s+due\b[:\s]*\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\b(?:due|owing)\b/i,
      // Fallback: any dollar amount with exactly 2 decimals
      /\$([0-9][0-9,]*\.[0-9]{2})\b/
    ],
    datePatterns: [
      // Zip uses MM/DD/YYYY or M/D/YYYY
      /due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /\bby[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Also supports "Oct 6, 2025" or "October 6, 2025"
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /\bby[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      // Generic date patterns
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/
    ],
    installmentPatterns: [
      // Zip: "payment 1 of 4" or "installment 2/4"
      /(?:payment|installment)\s*(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/i,
      // Final payment indicator
      /final\s*(?:payment|installment)/i,
      // Fallback: X of Y or X/Y
      /(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/
    ]
  },

  sezzle: {
    // Sezzle keyword requires nearby installment phrase to avoid false positives
    signatures: ['@sezzle.com', /\bSezzle\b/i],
    amountPatterns: [
      // Sezzle specific: "payment 1 of 4: $25.00" - tightened for financial accuracy
      /\b(?:payment|installment)(?:\s+\d{1,2}\s+of\s+\d{1,2})?[:\s]+\$([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/i,
      // Standard amount patterns - require exactly 2 decimal places
      /\bamount\s+due\b[:\s]*\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\b(?:due|owing)\b/i,
      // Fallback: any dollar amount with exactly 2 decimals
      /\$([0-9][0-9,]*\.[0-9]{2})\b/
    ],
    datePatterns: [
      // Sezzle uses MM/DD/YYYY or M/D/YYYY
      /due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /\bby[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // Also supports "Oct 6, 2025" or "October 6, 2025"
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /\bby[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      // Generic date patterns
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/
    ],
    installmentPatterns: [
      // Sezzle: "payment 1 of 4" or "installment 2/4"
      /(?:payment|installment)\s*(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/i,
      // Final payment indicator
      /final\s*(?:payment|installment)/i,
      // Fallback: X of Y or X/Y
      /(\d{1,2})\s*(?:of|\/)\s*(\d{1,2})/
    ]
  }
};

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

  // Helper function to check proximity between two regex matches
  const checkProximity = (text: string, pattern1: RegExp, pattern2: RegExp, maxDistance: number): boolean => {
    const match1 = text.match(pattern1);
    const match2 = text.match(pattern2);
    if (!match1 || !match2 || match1.index === undefined || match2.index === undefined) {
      return false;
    }
    const distance = Math.abs(match1.index - match2.index);
    return distance <= maxDistance;
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

/**
 * Extracts currency from email text.
 * Currently defaults to USD for Phase A (US market only).
 *
 * @param text - Email text to analyze
 * @returns Currency code (always 'USD' in Phase A)
 */
export function extractCurrency(text: string): string {
  // Simple: if $ symbol present, assume USD
  if (text.includes('$') || text.toLowerCase().includes('usd')) {
    return 'USD';
  }
  return 'USD'; // default for Phase A
}

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
  return 1; // default to first installment
}

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

/**
 * Extracts and parses due date from email text.
 * Uses timezone-aware parsing to ensure correct date interpretation.
 *
 * @param text - Email text to search
 * @param patterns - Array of regex patterns to try
 * @param timezone - IANA timezone for date parsing
 * @returns ISO date string (YYYY-MM-DD)
 * @throws Error if due date cannot be found or parsed
 */
export function extractDueDate(
  text: string,
  patterns: RegExp[],
  timezone: string
): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        return parseDate(match[1], timezone);
      } catch {
        continue;
      }
    }
  }
  throw new Error('Due date not found. Please ensure email contains text like "Due: 10/6/2025" or "Due date: October 6, 2025"');
}
