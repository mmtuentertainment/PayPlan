/**
 * Klarna BNPL Email Parser
 *
 * Parses Klarna purchase confirmation emails to extract payment schedules.
 *
 * Klarna Format:
 * - "Your purchase at [Merchant] for $X.XX in 4 payments"
 * - 4 bi-weekly payments (most common)
 * - Payment schedule with dates and amounts
 *
 * Market Share: ~40% of BNPL users
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  BNPLParser,
  BNPLParseResult,
  BNPLPaymentSchedule,
  BNPLInstallment,
} from '../../types/bnpl';
import { BNPLErrorType } from '../../types/bnpl';
import {
  stripHtmlTags,
  extractAmount,
  extractDate,
  validatePaymentSchedule,
  createUserFriendlyError,
} from '../bnpl-parser';

/**
 * Klarna email parser implementation
 */
export const klarnaParser: BNPLParser = {
  provider: 'klarna',

  /**
   * Detect if email is from Klarna
   */
  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();

    // Klarna detection patterns
    const klarnaPatterns = [
      /klarna/i,
      /pay\s+in\s+4/i, // "Pay in 4" is Klarna's signature phrase
      /4\s+interest-free\s+payments/i,
    ];

    return klarnaPatterns.some((pattern) => pattern.test(content));
  },

  /**
   * Parse Klarna email
   */
  parse(emailContent: string): BNPLParseResult {
    try {
      const content = stripHtmlTags(emailContent);

      // Extract merchant name
      const merchant = extractKlarnaMerchant(content);
      if (!merchant) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find merchant name in Klarna email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email.',
          }).message,
          detectedProvider: 'klarna',
        };
      }

      // Extract total amount
      const totalAmount = extractKlarnaTotalAmount(content);
      if (!totalAmount) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find total purchase amount in Klarna email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email.',
          }).message,
          detectedProvider: 'klarna',
        };
      }

      // Extract installments
      const installments = extractKlarnaInstallments(content);
      if (!installments || installments.length === 0) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find payment schedule in Klarna email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email with payment dates.',
          }).message,
          detectedProvider: 'klarna',
        };
      }

      // Create payment schedule
      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: 'klarna',
        merchant,
        totalAmount,
        installmentCount: installments.length,
        installments,
        createdAt: new Date().toISOString(),
        rawEmail: emailContent, // Store for debugging
      };

      // Validate schedule
      const validation = validatePaymentSchedule(schedule);
      if (!validation.valid) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.INVALID_FORMAT,
            message: 'Extracted data is invalid',
            suggestion: `Validation errors: ${validation.errors.join(', ')}`,
          }).message,
          detectedProvider: 'klarna',
        };
      }

      return {
        success: true,
        schedule,
        detectedProvider: 'klarna',
      };
    } catch (error) {
      console.error('Klarna parser error:', error);
      return {
        success: false,
        error: createUserFriendlyError({
          type: BNPLErrorType.INVALID_FORMAT,
          message: 'Failed to parse Klarna email',
          suggestion:
            'Please make sure you pasted a purchase confirmation email, not a promotional or shipping notification.',
        }).message,
        detectedProvider: 'klarna',
      };
    }
  },
};

/**
 * Extract merchant name from Klarna email
 *
 * Patterns:
 * - "Your purchase at [Merchant]"
 * - "Your order from [Merchant]"
 * - "You bought from [Merchant]"
 */
function extractKlarnaMerchant(content: string): string | null {
  const patterns = [
    /(?:purchase|order)\s+(?:at|from)\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i,
    /(?:bought from|shopping at)\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract total purchase amount from Klarna email
 *
 * Patterns:
 * - "for $X.XX in 4 payments"
 * - "Total: $X.XX"
 * - "Purchase amount: $X.XX"
 */
function extractKlarnaTotalAmount(content: string): number | null {
  // Pattern 1: "for $X.XX in 4 payments"
  const pattern1 = /for\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+in\s+\d+\s+payments/i;
  const match1 = content.match(pattern1);
  if (match1) {
    const amount = extractAmount(match1[0]);
    if (amount) return amount;
  }

  // Pattern 2: "Total: $X.XX" or "Total amount: $X.XX"
  const pattern2 = /Total(?:\s+amount)?:\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const match2 = content.match(pattern2);
  if (match2) {
    const amount = extractAmount(match2[0]);
    if (amount) return amount;
  }

  // Pattern 3: "Purchase amount: $X.XX"
  const pattern3 = /Purchase\s+amount:\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const match3 = content.match(pattern3);
  if (match3) {
    const amount = extractAmount(match3[0]);
    if (amount) return amount;
  }

  // Fallback: Find first dollar amount in email (less reliable)
  const amount = extractAmount(content);
  return amount;
}

/**
 * Extract installment schedule from Klarna email
 *
 * Patterns:
 * - "Payment 1: $50.00 due Nov 1, 2025"
 * - "1st payment: $50.00 on November 1"
 * - "$50.00 due Nov 1"
 */
function extractKlarnaInstallments(content: string): BNPLInstallment[] | null {
  const installments: BNPLInstallment[] = [];

  // Pattern 1: "Payment N: $X.XX due Date"
  const pattern1 = /Payment\s+(\d+):\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+due\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/gi;
  let match;

  while ((match = pattern1.exec(content)) !== null) {
    const installmentNumber = parseInt(match[1], 10);
    const amountStr = match[2].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    const dateStr = match[3];
    const dueDate = extractDate(dateStr);

    if (amount && dueDate) {
      installments.push({
        installmentNumber,
        amount,
        dueDate,
      });
    }
  }

  // Pattern 2: "1st payment: $X.XX on Date" (ordinal numbers)
  if (installments.length === 0) {
    const pattern2 = /(\d+)(?:st|nd|rd|th)\s+payment:\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(?:on|due)\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/gi;

    while ((match = pattern2.exec(content)) !== null) {
      const installmentNumber = parseInt(match[1], 10);
      const amountStr = match[2].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      const dateStr = match[3];
      const dueDate = extractDate(dateStr);

      if (amount && dueDate) {
        installments.push({
          installmentNumber,
          amount,
          dueDate,
        });
      }
    }
  }

  // Pattern 3: "$X.XX due Date" (without explicit payment number)
  if (installments.length === 0) {
    const pattern3 = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+due\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/gi;
    let installmentNumber = 1;

    while ((match = pattern3.exec(content)) !== null) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      const dateStr = match[2];
      const dueDate = extractDate(dateStr);

      if (amount && dueDate) {
        installments.push({
          installmentNumber: installmentNumber++,
          amount,
          dueDate,
        });
      }
    }
  }

  // Sort by installment number
  installments.sort((a, b) => a.installmentNumber - b.installmentNumber);

  return installments.length > 0 ? installments : null;
}
