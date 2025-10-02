import {
  detectProvider,
  extractAmount,
  extractCurrency,
  extractDueDate,
  extractInstallmentNumber,
  detectAutopay,
  extractLateFee,
  PROVIDER_PATTERNS
} from './provider-detectors';

export interface Item {
  provider: string;
  installment_no: number;
  due_date: string; // ISO YYYY-MM-DD
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
}

export interface Issue {
  snippet: string; // First 100 chars of problematic email
  reason: string;
}

export interface ExtractionResult {
  items: Item[];
  issues: Issue[];
  duplicatesRemoved: number;
}

/**
 * Main extraction entry point
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  // 1. Sanitize HTML if pasted
  const sanitized = sanitizeHtml(emailText);

  // 2. Split on common delimiters
  const emailBlocks = splitEmails(sanitized);

  const items: Item[] = [];
  const issues: Issue[] = [];

  for (const block of emailBlocks) {
    try {
      const item = extractSingleEmail(block, timezone);
      items.push(item);
    } catch (err) {
      issues.push({
        snippet: block.slice(0, 100),
        reason: err instanceof Error ? err.message : 'Extraction failed'
      });
    }
  }

  // 3. Deduplicate
  const deduplicated = deduplicateItems(items);

  return {
    items: deduplicated,
    issues,
    duplicatesRemoved: items.length - deduplicated.length
  };
}

function extractSingleEmail(emailText: string, timezone: string): Item {
  const provider = detectProvider(emailText);

  if (provider === 'Unknown') {
    throw new Error('Provider not recognized');
  }

  const patterns = PROVIDER_PATTERNS[provider.toLowerCase()];

  const amount = extractAmount(emailText, patterns.amountPatterns);
  const currency = extractCurrency(emailText);
  const dueDate = extractDueDate(emailText, patterns.datePatterns, timezone);
  const installmentNo = extractInstallmentNumber(emailText, patterns.installmentPatterns);
  const autopay = detectAutopay(emailText);
  const lateFee = extractLateFee(emailText);

  return {
    provider,
    installment_no: installmentNo,
    due_date: dueDate,
    amount,
    currency,
    autopay,
    late_fee: lateFee
  };
}

function sanitizeHtml(text: string): string {
  // Use DOMParser to strip HTML tags (no external deps)
  if (typeof DOMParser === 'undefined') {
    return text; // Server-side fallback
  }
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent || text;
}

function splitEmails(text: string): string[] {
  // Split on common delimiters
  const delimiters = /---+|From:|Subject:|_{3,}/gi;
  const blocks = text.split(delimiters)
    .map(b => b.trim())
    .filter(b => b.length > 20); // Ignore tiny fragments

  return blocks.length > 0 ? blocks : [text];
}

function deduplicateItems(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.provider}-${item.installment_no}-${item.due_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
