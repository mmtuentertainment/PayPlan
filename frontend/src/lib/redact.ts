/**
 * PII Redaction Module
 *
 * Provides utilities for redacting personally identifiable information (PII)
 * and sensitive financial data from text snippets used in error messages and
 * issue reporting.
 */

/**
 * Redacts PII and sensitive financial data from text snippets.
 * Protects: emails, amounts, account numbers, names.
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
  const commonWords = /\b(Pay Later|Auto Pay|Buy Now|Pay In|Due Date|Late Fee|Payment Plan|Order Number|Item Total)\b/g;
  const matches = text.match(commonWords) || [];
  redacted = redacted.replace(/\b[A-Z][a-z]{2,} [A-Z][a-z]{2,}\b/g, '[NAME]');
  // Restore common false positives
  matches.forEach((match) => {
    redacted = redacted.replace('[NAME]', match);
  });

  return redacted;
}
