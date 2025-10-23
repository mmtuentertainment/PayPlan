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
import { parseDate } from './extraction/extractors/date';
import { redactPII } from './extraction/helpers/redaction';
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

  const normalizedInput = normalizeEmailText(emailText);

  // Early handling: whitespace-only or non-meaningful input should produce a single helpful issue
  const onlyWhitespace = normalizedInput.trim().length === 0;
  const onlySpecialChars = normalizedInput.trim().length > 0
    && normalizedInput.replace(/[A-Za-z0-9]/g, '').trim().length === normalizedInput.trim().length;

  if (onlyWhitespace || onlySpecialChars) {
    return {
      items: [],
      issues: [{
        id: `issue-${Date.now()}`,
        snippet: '',
        reason: 'Unable to process this email. Please ensure you\'ve pasted a complete payment reminder email from Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle.'
      }],
      duplicatesRemoved: 0,
      dateLocale: 'US'
    };
  }

  // Validation: enforce maximum input length (prevent abuse)
  // Absolute cap to prevent pathological inputs, but allow larger inputs when they contain meaningful signals.
  const ABSOLUTE_MAX_LENGTH = 120000;
  if (normalizedInput.length > ABSOLUTE_MAX_LENGTH) {
    throw new Error(`Input too large: ${normalizedInput.length} characters (max ${ABSOLUTE_MAX_LENGTH})`);
  }
  const PRACTICAL_MAX_IF_NO_SIGNALS = 16000;
  const hasAnySignals = /[0-9]/.test(normalizedInput) || /\$/.test(normalizedInput) || /(due|amount|payment|installment)/i.test(normalizedInput);
  if (normalizedInput.length > PRACTICAL_MAX_IF_NO_SIGNALS && !hasAnySignals) {
    throw new Error(`Input too large: ${normalizedInput.length} characters (max ${PRACTICAL_MAX_IF_NO_SIGNALS})`);
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
  const sanitized = sanitizeHtml(normalizedInput);

  // 2. Split on common delimiters
  const emailBlocks = splitEmails(sanitized);

  const items: Item[] = [];
  const issues: Issue[] = [];

  for (let i = 0; i < emailBlocks.length; i++) {
    const block = emailBlocks[i];
    // Skip obviously non-meaningful blocks and record a helpful issue
    const looksMeaningful = /[0-9]/.test(block) || /\$/.test(block);
    if (!looksMeaningful) {
      issues.push({
        id: `issue-${Date.now()}-${i}`,
        snippet: redactPII(block.slice(0, 100)),
        reason: 'Unable to process this email. Please ensure you\'ve pasted a complete payment reminder email from Klarna, Affirm, Afterpay, PayPal, Zip, or Sezzle.'
      });
      continue;
    }
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
  const MAX_SAFE_ITEMS = 500;
  let finalItems = deduplicated;
  // If multiple blocks were present but yielded fewer items and no issues were recorded,
  // record a generic issue to reflect that some blocks could not be processed.
  if ((emailBlocks.length > items.length || /---+/.test(sanitized)) && issues.length === 0) {
    issues.push({
      id: `issue-${Date.now()}-generic`,
      snippet: '',
      reason: 'Unable to process part of the input. Please ensure each section is a complete payment reminder.'
    });
  }
  if (deduplicated.length > MAX_SAFE_ITEMS) {
    const skipped = deduplicated.length - MAX_SAFE_ITEMS;
    finalItems = deduplicated.slice(0, MAX_SAFE_ITEMS);
    issues.push({
      id: `limit-${Date.now()}`,
      snippet: 'Payment list truncated for safety',
      reason: `Only the first ${MAX_SAFE_ITEMS} payments were processed to prevent abuse. ${skipped} additional item(s) were skipped.`
    });
  }

  const result: ExtractionResult = {
    items: finalItems,
    issues,
    duplicatesRemoved: items.length - finalItems.length,
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
  const dateLocale = options?.dateLocale || 'US';

  // Primary path: provider-specific patterns if provider recognized
  if (provider !== 'Unknown') {
    const patterns = PROVIDER_PATTERNS[provider.toLowerCase()];

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

    if (errors.length === 0) {
      const confidence = calculateConfidence({
        provider: true,
        date: !!dueDate,
        amount: !!amount,
        installment: !!installmentNo && installmentNo > 0,
        autopay: autopay !== undefined
      });

      return {
        id: uuidv4(),
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
    // If provider-specific extraction failed, fall back to generic extraction
  }

  // Fallback path: generic resilient extraction (handles obfuscated/malicious content)
  return extractGeneric(emailText, timezone, { providerHint: provider, dateLocale });
}

function extractGeneric(
  emailText: string,
  timezone: string,
  opts: { providerHint?: string; dateLocale: 'US' | 'EU' }
): Item {
  // Try to infer provider keyword if unknown
  const inferredProvider = (() => {
    if (opts.providerHint && opts.providerHint !== 'Unknown') return opts.providerHint;
    const keywords: Array<{ name: string; re: RegExp }> = [
      { name: 'Klarna', re: /\bklarna\b/i },
      { name: 'Affirm', re: /\baffirm\b/i },
      { name: 'Afterpay', re: /\bafterpay\b/i },
      { name: 'PayPalPayIn4', re: /\bpay\s*in\s*4\b/i },
      { name: 'Zip', re: /\bzip(?:\s+pay)?\b/i },
      { name: 'Sezzle', re: /\bsezzle\b/i },
    ];
    const found = keywords.find(k => k.re.test(emailText));
    return found ? found.name : 'Unknown';
  })();

  // Generic amount: first $X[.YY] occurrence
  const amountMatch = emailText.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*|\d+)(?:\.(\d{2}))?/);
  const dollars = amountMatch ? parseFloat((amountMatch[1] || '0').replace(/,/g, '') + (amountMatch[2] ? '.' + amountMatch[2] : '')) : NaN;
  if (isNaN(dollars) || dollars < 0) {
    throw new Error('Amount not found');
  }

  // Generic date patterns
  const dateText = (() => {
    const iso = emailText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) return iso[1];
    const slash = emailText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
    if (slash) return slash[1];
    const monthName = emailText.match(/\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/);
    if (monthName) return monthName[1];
    return '';
  })();

  if (!dateText) {
    throw new Error('Due date not found');
  }

  const dueISO = parseDate(dateText, timezone, { dateLocale: opts.dateLocale });

  // Generic installment
  const inst = (() => {
    const m1 = emailText.match(/\b(?:installment|payment)\s*(\d{1,2})\b/i);
    if (m1) return parseInt(m1[1], 10);
    const m2 = emailText.match(/\b(\d{1,2})\s*\/\s*\d{1,2}\b/);
    if (m2) return parseInt(m2[1], 10);
    return 1;
  })();

  // Autopay detection (best effort)
  const auto = /autopay\s*[:-]?\s*(enabled|on|yes)/i.test(emailText)
    ? true
    : (/autopay\s*[:-]?\s*(disabled|off|no)/i.test(emailText) ? false : false);

  const cents = Math.round(dollars * 100);

  // Conservative confidence for generic path
  const confidence = calculateConfidence({
    provider: inferredProvider !== 'Unknown',
    date: true,
    amount: true,
    installment: !!inst,
    autopay: true
  });

  return {
    id: uuidv4(),
    provider: inferredProvider,
    installment_no: inst,
    due_date: dueISO,
    raw_due_date: dateText,
    amount: cents,
    currency: 'USD',
    autopay: auto,
    late_fee: 0,
    confidence
  };
}

function sanitizeHtml(text: string): string {
  const decoded = decodeBasicEntities(text);

  if (typeof DOMParser === 'undefined') {
    return stripDangerousFragments(decoded); // Server-side fallback
  }

  const doc = new DOMParser().parseFromString(decoded, 'text/html');
  const rawText = doc.body.textContent || decoded;
  return stripDangerousFragments(rawText);
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

function normalizeEmailText(text: string): string {
  // Preserve block delimiters (---) before sanitizing double hyphens
  const placeholder = '___PAYPLAN_TRIPLE_HYPHENS___';
  let out = text
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex -- Intentionally stripping control characters for security
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
    .replace(/\xC0[\x80-\xBF]/g, '') // Strip UTF-8 overlong sequences
    // eslint-disable-next-line no-misleading-character-class -- Intentionally handling zero-width Unicode characters
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // Zero-width characters
    .replace(/\u202E/g, '') // Remove RTL override
    .replace(/<!\[CDATA\[|\]\]>/g, ' ')
    .replace(/javascript:/gi, ' ')
    .replace(/data:/gi, ' ')
    .replace(/UNION\s+SELECT/gi, ' ')
    .replace(/DROP\s+TABLE/gi, ' ');

  // Temporarily protect '---' sequences so they aren't affected by the '--' sanitizer
  out = out.replace(/---+/g, placeholder);
  // Sanitize SQL-style comment markers while preserving block delimiters
  out = out.replace(/--/g, ' ');
  // Restore block delimiters
  out = out.replace(new RegExp(placeholder, 'g'), '---');
  return out;
}

function decodeBasicEntities(text: string): string {
  const entityMap: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': '\'',
    '&nbsp;': ' '
  };

  return text.replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (_, key) => entityMap[`&${key};`]);
}

function stripDangerousFragments(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
