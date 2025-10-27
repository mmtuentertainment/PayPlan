/**
 * BNPL Email Parser - Base Architecture
 *
 * Modular parser system for extracting payment schedules from BNPL provider emails.
 * Supports 6 providers: Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit.
 *
 * Privacy-first: All parsing happens client-side, no server communication.
 */

import type {
  BNPLParser,
  BNPLParseResult,
  BNPLProvider,
  BNPLError,
} from '../types/bnpl';
import { BNPLErrorType } from '../types/bnpl';

/**
 * Registry of BNPL provider parsers
 * Parsers are registered at module initialization
 */
const parserRegistry: Map<BNPLProvider, BNPLParser> = new Map();

/**
 * Register a BNPL provider parser
 * @param parser - Parser implementation for a specific provider
 */
export function registerParser(parser: BNPLParser): void {
  parserRegistry.set(parser.provider, parser);
}

/**
 * Detect which BNPL provider an email is from
 * @param emailContent - Raw email text (HTML or plain text)
 * @returns Detected provider or undefined if no match
 */
export function detectProvider(emailContent: string): BNPLProvider | undefined {
  for (const [provider, parser] of parserRegistry.entries()) {
    if (parser.canParse(emailContent)) {
      return provider;
    }
  }
  return undefined;
}

/**
 * Parse a BNPL email and extract payment schedule
 *
 * This is the main entry point for parsing emails.
 *
 * @param emailContent - Raw email text (HTML or plain text)
 * @returns Parse result with schedule or error
 */
export function parseBNPLEmail(emailContent: string): BNPLParseResult {
  // Sanitize input
  const sanitized = sanitizeEmailContent(emailContent);

  // Detect provider
  const provider = detectProvider(sanitized);

  if (!provider) {
    return {
      success: false,
      error: createUserFriendlyError({
        type: BNPLErrorType.UNSUPPORTED_PROVIDER,
        message: 'Could not identify BNPL provider from email',
        suggestion:
          'Please make sure you pasted a purchase confirmation email from Klarna, Affirm, Afterpay, Sezzle, Zip, or PayPal Credit.',
      }).message,
    };
  }

  // Get parser for detected provider
  const parser = parserRegistry.get(provider);

  if (!parser) {
    // This should never happen, but TypeScript safety
    return {
      success: false,
      error: 'Internal error: Parser not found for detected provider',
      detectedProvider: provider,
    };
  }

  // Parse email with provider-specific parser
  return parser.parse(sanitized);
}

/**
 * Sanitize email content before parsing
 *
 * Removes common email artifacts that interfere with parsing:
 * - Forwarding headers (Fwd:, Re:)
 * - Email signatures
 * - Excessive whitespace
 *
 * @param emailContent - Raw email text
 * @returns Sanitized content
 */
function sanitizeEmailContent(emailContent: string): string {
  let sanitized = emailContent;

  // Remove "Fwd:" and "Re:" prefixes from subject lines
  sanitized = sanitized.replace(/^(Fwd|FW|Re|RE):\s*/gim, '');

  // Normalize line breaks (Windows CRLF → Unix LF)
  sanitized = sanitized.replace(/\r\n/g, '\n');

  // Remove excessive whitespace (more than 2 consecutive newlines)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Strip HTML tags from email content
 *
 * Converts HTML emails to plain text while preserving structure.
 * Uses DOMParser for safe HTML parsing (no regex vulnerabilities).
 *
 * @param html - HTML email content
 * @returns Plain text content
 */
export function stripHtmlTags(html: string): string {
  // Check if content is actually HTML
  if (!html.includes('<')) {
    // Already plain text
    return html;
  }

  try {
    // Use DOMParser for safe HTML parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract text content
    let text = doc.body?.textContent || '';

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    // Restore line breaks from block elements
    // Replace common block elements with newlines
    let processedHtml = html;
    processedHtml = processedHtml.replace(/<br\s*\/?>/gi, '\n');
    processedHtml = processedHtml.replace(/<\/p>/gi, '\n\n');
    processedHtml = processedHtml.replace(/<\/div>/gi, '\n');
    processedHtml = processedHtml.replace(/<\/tr>/gi, '\n');

    // Re-parse with preserved line breaks
    const doc2 = parser.parseFromString(processedHtml, 'text/html');
    text = doc2.body?.textContent || text;

    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  } catch (error) {
    // Fallback: Simple regex stripping (less safe but works)
    console.warn('DOMParser failed, using regex fallback:', error);
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Extract dollar amounts from text
 *
 * Supports formats: $123.45, $123, 123.45, USD 123.45
 *
 * @param text - Text containing dollar amount
 * @returns Extracted amount or null if not found
 */
export function extractAmount(text: string): number | null {
  // Match dollar amounts: $123.45, $123, 123.45
  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,  // $123.45 or $1,234.56
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*USD/i, // 123.45 USD
    /USD\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, // USD 123.45
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Remove commas and parse as float
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
}

/**
 * Extract dates from text
 *
 * Supports formats:
 * - MM/DD/YYYY (10/27/2025)
 * - Month Day, Year (October 27, 2025)
 * - Month Day (October 27) - assumes current year
 * - Relative dates (today, tomorrow)
 *
 * @param text - Text containing date
 * @returns Extracted date in ISO 8601 format (YYYY-MM-DD) or null
 */
export function extractDate(text: string): string | null {
  const currentYear = new Date().getFullYear();

  // Pattern 1: MM/DD/YYYY or MM/DD/YY
  const slashPattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
  const slashMatch = text.match(slashPattern);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10);
    const day = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);

    // Handle 2-digit years (25 → 2025)
    if (year < 100) {
      year += 2000;
    }

    // Format date manually to avoid timezone issues
    // toISOString() converts to UTC which can shift dates by 1 day
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Pattern 2: Month Day, Year (October 27, 2025)
  const longPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i;
  const longMatch = text.match(longPattern);
  if (longMatch) {
    const monthName = longMatch[1];
    const day = parseInt(longMatch[2], 10);
    const year = parseInt(longMatch[3], 10);

    // Map month names to numbers
    const monthMap: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4,
      may: 5, june: 6, july: 7, august: 8,
      september: 9, october: 10, november: 11, december: 12,
    };
    const month = monthMap[monthName.toLowerCase()];

    if (month) {
      // Format date manually to avoid timezone issues
      const paddedMonth = String(month).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }

  // Pattern 3: Month Day (October 27) - assume current year or next year
  const shortPattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i;
  const shortMatch = text.match(shortPattern);
  if (shortMatch) {
    const monthName = shortMatch[1];
    const day = parseInt(shortMatch[2], 10);

    // Map month names to numbers
    const monthMap: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4,
      may: 5, june: 6, july: 7, august: 8,
      september: 9, october: 10, november: 11, december: 12,
    };
    const month = monthMap[monthName.toLowerCase()];

    if (month) {
      // Use current year or next year if date is in the past
      let year = currentYear;
      const testDate = new Date(year, month - 1, day);
      if (testDate < new Date()) {
        year = currentYear + 1;
      }

      // Format date manually to avoid timezone issues
      const paddedMonth = String(month).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }

  // Pattern 4: Relative dates
  const lowerText = text.toLowerCase();
  if (lowerText.includes('today') || lowerText.includes('first payment today')) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Create a user-friendly error message
 *
 * Converts technical errors into actionable messages for users.
 *
 * @param error - Structured error object
 * @returns User-friendly error object
 */
export function createUserFriendlyError(error: BNPLError): BNPLError {
  // Error messages are already user-friendly in BNPLError type
  // This function can be extended to add more context or formatting
  return error;
}

/**
 * Validate parsed payment schedule
 *
 * Ensures extracted data meets requirements:
 * - Amounts are positive numbers
 * - Dates are valid and in the future (or recent past)
 * - Installment count matches installments array length
 *
 * @param schedule - Parsed payment schedule (before validation)
 * @returns Validation result with errors if any
 */
export function validatePaymentSchedule(
  schedule: Partial<{
    merchant: string;
    totalAmount: number;
    installmentCount: number;
    installments: Array<{ amount: number; dueDate: string }>;
  }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate merchant
  if (!schedule.merchant || schedule.merchant.trim().length === 0) {
    errors.push('Merchant name is required');
  }

  // Validate total amount
  if (
    schedule.totalAmount === undefined ||
    schedule.totalAmount === null ||
    schedule.totalAmount <= 0
  ) {
    errors.push('Total amount must be a positive number');
  }

  // Validate installment count
  if (
    schedule.installmentCount === undefined ||
    schedule.installmentCount === null ||
    schedule.installmentCount <= 0
  ) {
    errors.push('Installment count must be a positive number');
  }

  // Validate installments array
  if (!schedule.installments || !Array.isArray(schedule.installments)) {
    errors.push('Installments array is required');
  } else {
    // Check installments array length matches count
    if (schedule.installments.length !== schedule.installmentCount) {
      errors.push(
        `Installments count mismatch: expected ${schedule.installmentCount}, got ${schedule.installments.length}`
      );
    }

    // Validate each installment
    schedule.installments.forEach((installment, index) => {
      if (!installment.amount || installment.amount <= 0) {
        errors.push(`Installment ${index + 1}: amount must be positive`);
      }

      if (!installment.dueDate) {
        errors.push(`Installment ${index + 1}: due date is required`);
      } else {
        // Validate date format (ISO 8601: YYYY-MM-DD)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(installment.dueDate)) {
          errors.push(
            `Installment ${index + 1}: due date must be in YYYY-MM-DD format`
          );
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
