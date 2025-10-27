/**
 * Afterpay BNPL Email Parser
 *
 * Afterpay Format:
 * - 4 bi-weekly payments (similar to Klarna but different email format)
 * - "Your Afterpay order at [Merchant] for $X.XX"
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

export const afterpayParser: BNPLParser = {
  provider: 'afterpay',

  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();
    return content.includes('afterpay') || content.includes('after pay');
  },

  parse(emailContent: string): BNPLParseResult {
    try {
      const content = stripHtmlTags(emailContent);

      const merchant = extractMerchant(content);
      const totalAmount = extractTotalAmount(content);
      const installments = extractInstallments(content);

      if (!merchant || !totalAmount || !installments) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not extract payment details from Afterpay email',
            suggestion: 'Please make sure you pasted the full confirmation email.',
          }).message,
          detectedProvider: 'afterpay',
        };
      }

      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: 'afterpay',
        merchant,
        totalAmount,
        installmentCount: installments.length,
        installments,
        createdAt: new Date().toISOString(),
        rawEmail: emailContent,
      };

      const validation = validatePaymentSchedule(schedule);
      if (!validation.valid) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.INVALID_FORMAT,
            message: 'Extracted data is invalid',
            suggestion: `Validation errors: ${validation.errors.join(', ')}`,
          }).message,
          detectedProvider: 'afterpay',
        };
      }

      return { success: true, schedule, detectedProvider: 'afterpay' };
    } catch (error) {
      console.error('Afterpay parser error:', error);
      return {
        success: false,
        error: 'Failed to parse Afterpay email',
        detectedProvider: 'afterpay',
      };
    }
  },
};

function extractMerchant(content: string): string | null {
  const match = content.match(
    /(?:order|purchase)\s+at\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i
  );
  return match ? match[1].trim() : null;
}

function extractTotalAmount(content: string): number | null {
  const match = content.match(/for\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  return match ? extractAmount(match[0]) : extractAmount(content);
}

function extractInstallments(content: string): BNPLInstallment[] | null {
  const installments: BNPLInstallment[] = [];
  const pattern = /Payment\s+(\d+):\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(?:on|due)\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/gi;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const installmentNumber = parseInt(match[1], 10);
    const amount = parseFloat(match[2].replace(/,/g, ''));
    const dueDate = extractDate(match[3]);

    if (amount && dueDate) {
      installments.push({ installmentNumber, amount, dueDate });
    }
  }

  return installments.length > 0 ? installments : null;
}
