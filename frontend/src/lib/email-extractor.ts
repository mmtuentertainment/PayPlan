import { v4 as uuidv4 } from 'uuid';
import { detectProvider, PROVIDER_PATTERNS } from './extraction/providers';
import {
  extractDueDate,
  extractAmount,
  extractCurrency,
  extractInstallmentNumber,
  detectAutopay,
  extractLateFee
} from './extraction/extractors';
import { redactPII } from './redact';
import { getErrorMessage } from './extraction/helpers/error-messages';
import { extractionCache } from './extraction/helpers/cache';
import { safeExtract } from './extraction/helpers/field-extractor';

// Import types from new extraction module
export type {
  Item,
  Issue,
  ExtractionResult,
  ExtractOptions,
  DateExtractionResult,
  ExtractionContext
} from './extraction/core/types';
export { ExtractOptionsSchema } from './extraction/core/types';
import type { Item, Issue, ExtractionResult, ExtractOptions } from './extraction/core/types';
import { ExtractOptionsSchema } from './extraction/core/types';

/**
 * Calculates extraction confidence score using weighted signal sum.
 *
 * Formula: provider(0.35) + date(0.25) + amount(0.20) + installment(0.15) + autopay(0.05)
 *
 * NOTE: In practice, this function is only called for items where provider !== 'Unknown',
 * so the minimum confidence for returned Items is 0.35. The formula supports lower scores
 * for completeness and unit testing.
 *
 * @param signals - Object with boolean flags for each signal
 * @returns Confidence score between 0 and 1 (0.35-1.0 in practice)
 * @example
 * // Full confidence (all signals matched)
 * calculateConfidence({ provider: true, date: true, amount: true, installment: true, autopay: true })
 * // Returns: 1.0
 * @example
 * // PayPal Pay in 4 email with missing autopay signal
 * calculateConfidence({ provider: true, date: true, amount: true, installment: true, autopay: false })
 * // Returns: 0.95
 */
export function calculateConfidence(signals: {
  provider: boolean;
  date: boolean;
  amount: boolean;
  installment: boolean;
  autopay: boolean;
}): number {
  return (
    (signals.provider ? 0.35 : 0) +
    (signals.date ? 0.25 : 0) +
    (signals.amount ? 0.20 : 0) +
    (signals.installment ? 0.15 : 0) +
    (signals.autopay ? 0.05 : 0)
  );
}

/**
 * Main extraction entry point.
 * Extracts payment items from pasted BNPL reminder emails.
 *
 * **Financial Impact:**
 * The dateLocale option affects how ambiguous slash-separated dates are interpreted:
 * - US mode (default): "01/02/2026" → January 2, 2026
 * - EU mode: "01/02/2026" → February 1, 2026
 * Changing locale can resequence payment due dates and affect payment ordering.
 *
 * @param emailText - Raw text from pasted emails (HTML will be sanitized)
 * @param timezone - IANA timezone for date parsing (e.g., "America/New_York")
 * @param options - Optional extraction options
 * @param options.dateLocale - Date locale for ambiguous dates (default: 'US')
 * @returns Extraction result with items, issues, duplicate count, and confidence scores
 * @throws Error if input exceeds maximum length or options validation fails
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string,
  options?: ExtractOptions
): ExtractionResult {
  // Input validation: handle null/undefined/non-string inputs
  if (!emailText || typeof emailText !== 'string') {
    return {
      items: [],
      issues: [],
      duplicatesRemoved: 0,
      dateLocale: 'US',
    };
  }

  // Validation: enforce maximum input length (prevent abuse)
  const MAX_LENGTH = 16000;
  if (emailText.length > MAX_LENGTH) {
    throw new Error(`Input too large: ${emailText.length} characters (max ${MAX_LENGTH})`);
  }

  // Validate options with Zod; default to 'US' if invalid or undefined
  const validatedOptions = ExtractOptionsSchema.safeParse(options);
  const safeOptions: ExtractOptions = validatedOptions.success
    ? validatedOptions.data || {}
    : {};

  // Check cache before processing (unless bypass requested)
  if (!safeOptions.bypassCache) {
    const cached = extractionCache.get(emailText, timezone, safeOptions);
    if (cached) {
      return cached;
    }
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
      const item = extractSingleEmail(block, timezone, safeOptions);
      items.push(item);
    } catch (err) {
      const rawSnippet = block.slice(0, 100);
      issues.push({
        id: `issue-${Date.now()}-${i}`,
        snippet: redactPII(rawSnippet),
        reason: getErrorMessage(err)
      });
    }
  }

  // 3. Deduplicate
  const deduplicated = deduplicateItems(items);

  const result: ExtractionResult = {
    items: deduplicated,
    issues,
    duplicatesRemoved: items.length - deduplicated.length,
    dateLocale: safeOptions.dateLocale || 'US'
  };

  // Store in cache for future requests
  if (!safeOptions.bypassCache) {
    extractionCache.set(emailText, timezone, result, safeOptions);
  }

  return result;
}

function extractSingleEmail(emailText: string, timezone: string, options?: ExtractOptions): Item {
  const provider = detectProvider(emailText);

  if (provider === 'Unknown') {
    throw new Error('Provider not recognized');
  }

  const patterns = PROVIDER_PATTERNS[provider.toLowerCase()];
  const dateLocale = options?.dateLocale || 'US';

  // Collect all extraction errors instead of failing on first error
  const errors: string[] = [];

  const amount = safeExtract(() => extractAmount(emailText, patterns.amountPatterns), 'Amount', errors);
  const currency = safeExtract(() => extractCurrency(emailText), 'Currency', errors);

  const dateResult = safeExtract(() => extractDueDate(emailText, patterns.datePatterns, timezone, dateLocale), 'Due date', errors);
  const dueDate = dateResult?.isoDate;
  const rawDueDate = dateResult?.rawText;

  const installmentNo = safeExtract(() => extractInstallmentNumber(emailText, patterns.installmentPatterns), 'Installment', errors);
  const autopay = safeExtract(() => detectAutopay(emailText), 'Autopay', errors);
  const lateFee = safeExtract(() => extractLateFee(emailText), 'Late fee', errors, true) || 0; // Optional field

  // If critical fields failed, throw aggregated error with user-friendly messages
  if (errors.length > 0) {
    // Take the first error and make it user-friendly
    const firstError = errors[0];
    const friendlyError = getErrorMessage(new Error(firstError));
    throw new Error(friendlyError);
  }

  // Calculate confidence based on successful extractions
  // Note: provider is always non-Unknown here (already threw error if Unknown)
  const confidence = calculateConfidence({
    provider: true,
    date: !!dueDate,
    amount: !!amount,
    installment: !!installmentNo && installmentNo > 0,
    autopay: autopay !== undefined
  });

  return {
    id: uuidv4(),  // Generate stable UUID for React keys and undo/redo
    provider,
    installment_no: installmentNo!,
    due_date: dueDate!,
    raw_due_date: rawDueDate,
    amount: amount!,
    currency: currency!,
    autopay: autopay!,
    late_fee: lateFee!,
    confidence
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
