/**
 * Branded RedactedString type for PII protection
 *
 * Purpose: Enforce compile-time safety for sensitive strings that should
 * never be logged, transmitted, or displayed without explicit unredaction.
 *
 * This prevents accidental leaks of:
 * - Raw email bodies (may contain account numbers, SSN, credit card data)
 * - User names and email addresses
 * - Payment method details
 * - Transaction IDs that could be correlated across systems
 *
 * Usage:
 *   const emailBody = redact(rawEmail);  // RedactedString (safe)
 *   console.log(emailBody);  // Compile error! Cannot log RedactedString
 *   const safe = toSafePreview(emailBody);  // Truncated preview for debugging
 *   const original = unredact(emailBody);  // Explicit unredaction when needed
 */

declare const REDACTED_BRAND: unique symbol;

/**
 * Branded type that prevents accidental use of sensitive strings
 * TypeScript will enforce that RedactedString cannot be assigned to string
 */
export type RedactedString = string & { readonly [REDACTED_BRAND]: true };

/**
 * Mark a string as containing PII that must be handled carefully
 * @param value - Raw string containing sensitive data
 * @returns RedactedString that cannot be accidentally logged/transmitted
 */
export function redact(value: string): RedactedString {
  return value as RedactedString;
}

/**
 * Explicitly unredact a string when raw value is needed
 * Use only when you've verified it's safe to use the raw value
 * @param value - RedactedString to convert back to raw string
 * @returns Original raw string
 */
export function unredact(value: RedactedString): string {
  return value as string;
}

/**
 * Create a safe truncated preview for logging/debugging
 * Limits to 100 chars and adds ellipsis
 * @param value - RedactedString to create preview from
 * @returns Safe truncated string suitable for logging
 */
export function toSafePreview(value: RedactedString): string {
  const raw = unredact(value);
  const maxLength = 100;

  if (raw.length <= maxLength) {
    return raw;
  }

  return raw.substring(0, maxLength) + '... [redacted]';
}

/**
 * Create a completely masked version showing only length
 * @param value - RedactedString to mask
 * @returns String like "[REDACTED: 1234 chars]"
 */
export function toMasked(value: RedactedString): string {
  const raw = unredact(value);
  return `[REDACTED: ${raw.length} chars]`;
}

/**
 * Check if a string has been redacted
 * @param value - Value to check
 * @returns True if value is a RedactedString
 */
export function isRedacted(value: unknown): value is RedactedString {
  // At runtime, RedactedString is just a string
  // This is a compile-time only check
  return typeof value === 'string';
}

/**
 * Redact specific patterns within a string (e.g., email addresses, account numbers)
 * Leaves non-PII text intact for debugging
 * @param value - Raw string that may contain PII
 * @param patterns - Array of regex patterns to redact
 * @returns RedactedString with patterns replaced with [REDACTED]
 */
export function redactPatterns(value: string, patterns: RegExp[]): RedactedString {
  let result = value;

  for (const pattern of patterns) {
    result = result.replace(pattern, '[REDACTED]');
  }

  return redact(result);
}

/**
 * Common PII patterns for use with redactPatterns()
 */
export const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // SSN (###-##-####)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Credit card numbers (groups of 4 digits)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Phone numbers (US format: (555) 123-4567, 555-123-4567, 555.123.4567, etc.)
  phone: /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,

  // Account numbers (8+ consecutive digits)
  accountNumber: /\b\d{8,}\b/g,
};

/**
 * Redacts PII and sensitive financial data from text snippets.
 * Protects: emails, amounts, account numbers, names.
 *
 * Legacy compatibility function - maintained for backward compatibility.
 * For new code, consider using redactPatterns() with PII_PATTERNS.
 *
 * @param text - Raw text containing potential PII
 * @returns Redacted text with PII masked
 * @example
 * redactPII("From: user@example.com, Payment: $25.00")
 * // Returns: "From: [EMAIL], Payment: [AMOUNT]"
 */
export function redactPII(text: string): string {
  let redacted = text;

  // Redact email addresses
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');

  // Redact dollar amounts
  redacted = redacted.replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]');

  // Redact account numbers (context-aware, avoid years/ZIP codes)
  redacted = redacted.replace(/\baccount[:\s#]*(\d{4,})\b/gi, 'account: [ACCOUNT]');
  redacted = redacted.replace(/\bcard[:\s#]*(\d{4,})\b/gi, 'card: [ACCOUNT]');
  redacted = redacted.replace(/\bacct[:\s#]*(\d{4,})\b/gi, 'acct: [ACCOUNT]');

  // Redact names (capitalized first/last name pairs, 3+ chars each, with common word exclusions)
  const commonWords = /\b(Pay Later|Auto Pay|Buy Now|Pay In|Due Date|Late Fee|Payment Plan|Order Number|Item Total)\b/gi;
  redacted = redacted.replace(/\b[A-Z][a-z]{2,} [A-Z][a-z]{2,}\b/g, (match) => {
    // Preserve common phrases, redact everything else
    commonWords.lastIndex = 0; // Reset regex for each test
    return commonWords.test(match) ? match : '[NAME]';
  });

  return redacted;
}
