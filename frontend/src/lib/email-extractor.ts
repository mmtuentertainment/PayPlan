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
  id: string; // Unique identifier for React keys
  snippet: string; // First 100 chars of problematic email (redacted)
  reason: string;
}

export interface ExtractionResult {
  items: Item[];
  issues: Issue[];
  duplicatesRemoved: number;
}

/**
 * Main extraction entry point.
 * Extracts payment items from pasted BNPL reminder emails.
 *
 * @param emailText - Raw text from pasted emails (HTML will be sanitized)
 * @param timezone - IANA timezone for date parsing (e.g., "America/New_York")
 * @returns Extraction result with items, issues, and duplicate count
 * @throws Error if input exceeds maximum length
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  // Validation: enforce maximum input length (prevent abuse)
  const MAX_LENGTH = 16000;
  if (emailText.length > MAX_LENGTH) {
    throw new Error(`Input too large: ${emailText.length} characters (max ${MAX_LENGTH})`);
  }

  // 1. Sanitize HTML if pasted
  const sanitized = sanitizeHtml(emailText);

  // 2. Split on common delimiters
  const emailBlocks = splitEmails(sanitized);

  const items: Item[] = [];
  const issues: Issue[] = [];

  for (let i = 0; i < emailBlocks.length; i++) {
    const block = emailBlocks[i];
    try {
      const item = extractSingleEmail(block, timezone);
      items.push(item);
    } catch (err) {
      const rawSnippet = block.slice(0, 100);
      issues.push({
        id: `issue-${Date.now()}-${i}`,
        snippet: redactPII(rawSnippet),
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

  // Collect all extraction errors instead of failing on first error
  const errors: string[] = [];
  let amount: number | undefined;
  let currency: string | undefined;
  let dueDate: string | undefined;
  let installmentNo: number | undefined;
  let autopay: boolean | undefined;
  let lateFee: number | undefined;

  try {
    amount = extractAmount(emailText, patterns.amountPatterns);
  } catch (e) {
    errors.push(`Amount: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    currency = extractCurrency(emailText);
  } catch (e) {
    errors.push(`Currency: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    dueDate = extractDueDate(emailText, patterns.datePatterns, timezone);
  } catch (e) {
    errors.push(`Due date: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    installmentNo = extractInstallmentNumber(emailText, patterns.installmentPatterns);
  } catch (e) {
    errors.push(`Installment: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    autopay = detectAutopay(emailText);
  } catch (e) {
    errors.push(`Autopay: ${e instanceof Error ? e.message : 'detection failed'}`);
  }

  try {
    lateFee = extractLateFee(emailText);
  } catch (e) {
    errors.push(`Late fee: ${e instanceof Error ? e.message : 'not found'}`);
  }

  // If critical fields failed, throw aggregated error
  if (errors.length > 0) {
    throw new Error(`Failed to extract: ${errors.join(', ')}`);
  }

  return {
    provider,
    installment_no: installmentNo!,
    due_date: dueDate!,
    amount: amount!,
    currency: currency!,
    autopay: autopay!,
    late_fee: lateFee!
  };
}

function sanitizeHtml(text: string): string {
  // Use DOMParser to strip HTML tags safely. Even if <script> tags exist,
  // extracting textContent ensures no script execution. This is safe because:
  // 1. DOMParser parses but doesn't execute scripts
  // 2. textContent only extracts text nodes, ignoring all HTML/JS
  if (typeof DOMParser === 'undefined') {
    return text; // Server-side fallback (no HTML to strip in SSR)
  }
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent || text;
}

/**
 * Redacts PII and sensitive financial data from text snippets.
 * Protects: emails, amounts, account numbers, card numbers.
 */
function redactPII(text: string): string {
  let redacted = text;

  // Redact email addresses
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');

  // Redact dollar amounts
  redacted = redacted.replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]');

  // Redact account numbers (4+ digits)
  redacted = redacted.replace(/\b\d{4,}\b/g, '[ACCOUNT]');

  // Redact common PII patterns
  redacted = redacted.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');

  return redacted;
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
    // Include amount to avoid removing legitimate duplicate purchases
    // (e.g., two Klarna purchases with same installment & due date but different amounts)
    const key = `${item.provider}-${item.installment_no}-${item.due_date}-${item.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
