import { parseDate } from './date-parser';

export type Provider = 'Klarna' | 'Affirm' | 'Unknown';

export interface ProviderPatterns {
  signatures: string[];
  amountPatterns: RegExp[];
  datePatterns: RegExp[];
  installmentPatterns: RegExp[];
}

export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  klarna: {
    signatures: ['klarna.com', 'klarna', 'from klarna'],
    amountPatterns: [
      /payment[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+due/i,
      /amount[:\s]+\$?([\d,]+\.?\d{0,2})/i
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
    signatures: ['affirm.com', 'affirm', 'from affirm'],
    amountPatterns: [
      /installment[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+due/i,
      /amount[:\s]+\$?([\d,]+\.?\d{0,2})/i
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
  }
};

export function detectProvider(emailText: string): Provider {
  const lower = emailText.toLowerCase();

  if (PROVIDER_PATTERNS.klarna.signatures.some(sig => lower.includes(sig))) {
    return 'Klarna';
  }

  if (PROVIDER_PATTERNS.affirm.signatures.some(sig => lower.includes(sig))) {
    return 'Affirm';
  }

  return 'Unknown';
}

export function extractAmount(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  throw new Error('Amount not found or invalid');
}

export function extractCurrency(text: string): string {
  // Simple: if $ symbol present, assume USD
  if (text.includes('$') || text.toLowerCase().includes('usd')) {
    return 'USD';
  }
  return 'USD'; // default
}

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

export function detectAutopay(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'autopay is on',
    'autopay enabled',
    'auto-pay',
    'automatic payment',
    'automatically charged',
    'will be charged automatically'
  ];
  return keywords.some(kw => lower.includes(kw));
}

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
  throw new Error('Due date not found or invalid');
}
