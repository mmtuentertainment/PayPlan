/**
 * Zip (formerly Quadpay) BNPL Email Parser
 *
 * Zip Format:
 * - 4 weekly or bi-weekly payments
 * - "Your Zip purchase at [Merchant]"
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

export const zipParser: BNPLParser = {
  provider: 'zip',

  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();
    return content.includes('zip') || content.includes('quadpay');
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
            message: 'Could not extract payment details from Zip email',
            suggestion: 'Please make sure you pasted the full confirmation email.',
          }).message,
          detectedProvider: 'zip',
        };
      }

      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: 'zip',
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
          detectedProvider: 'zip',
        };
      }

      return { success: true, schedule, detectedProvider: 'zip' };
    } catch (error) {
      console.error('Zip parser error:', error);
      return {
        success: false,
        error: 'Failed to parse Zip email',
        detectedProvider: 'zip',
      };
    }
  },
};

function extractMerchant(content: string): string | null {
  const patterns = [
    /(?:purchase|order)\s+at\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i,
    /Merchant:\s*([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+|\.|\n)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return null;
}

function extractTotalAmount(content: string): number | null {
  return extractAmount(content);
}

function extractInstallments(content: string): BNPLInstallment[] | null {
  const installments: BNPLInstallment[] = [];
  const pattern = /(?:Payment|Installment)\s+(\d+):\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(?:on|due)\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/gi;
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
