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

  // Redact account numbers (4+ digits)
  redacted = redacted.replace(/\b\d{4,}\b/g, '[ACCOUNT]');

  // Redact names (capitalized first/last name pairs)
  redacted = redacted.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');

  return redacted;
}
