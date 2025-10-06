/**
 * Provider-specific patterns for data extraction.
 * Uses word boundaries and specific signatures to avoid false matches.
 */

export type Provider = 'Klarna' | 'Affirm' | 'Afterpay' | 'PayPalPayIn4' | 'Zip' | 'Sezzle' | 'Unknown';

export interface ProviderPatterns {
  signatures: (string | RegExp)[];
  amountPatterns: RegExp[];
  datePatterns: RegExp[];
  installmentPatterns: RegExp[];
}

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
