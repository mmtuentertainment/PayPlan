/**
 * PayPal Credit BNPL Email Parser
 *
 * PayPal Credit Format:
 * - Monthly payments (varies by plan)
 * - "Your PayPal Credit purchase"
 * - May include minimum payment amounts
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

export const paypalCreditParser: BNPLParser = {
  provider: 'paypal-credit',

  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();
    return (
      (content.includes('paypal') && content.includes('credit')) ||
      content.includes('paypal credit') ||
      content.includes('pay later')
    );
  },

  parse(emailContent: string): BNPLParseResult {
    try {
      const content = stripHtmlTags(emailContent);

      const merchant = extractMerchant(content);
      const totalAmount = extractTotalAmount(content);

      if (!merchant || !totalAmount) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not extract merchant or total amount from PayPal Credit email',
            suggestion: 'Please make sure you pasted the full confirmation email.',
          }).message,
          detectedProvider: 'paypal-credit',
        };
      }

      const installments = extractInstallments(content, totalAmount);

      if (!installments) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not extract payment details from PayPal Credit email',
            suggestion: 'Please make sure you pasted the full confirmation email.',
          }).message,
          detectedProvider: 'paypal-credit',
        };
      }

      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: 'paypal-credit',
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
          detectedProvider: 'paypal-credit',
        };
      }

      return { success: true, schedule, detectedProvider: 'paypal-credit' };
    } catch (error) {
      console.error('PayPal Credit parser error:', error);
      return {
        success: false,
        error: 'Failed to parse PayPal Credit email',
        detectedProvider: 'paypal-credit',
      };
    }
  },
};

function extractMerchant(content: string): string | null {
  const patterns = [
    /(?:purchase|payment)\s+(?:at|from)\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i,
    /Merchant:\s*([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+|\.|\n)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  return null;
}

function extractTotalAmount(content: string): number | null {
  const patterns = [
    /(?:Total|Amount):\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /purchase\s+of\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const amount = extractAmount(match[0]);
      if (amount) return amount;
    }
  }

  return extractAmount(content);
}

function extractInstallments(
  content: string,
  _totalAmount: number
): BNPLInstallment[] | null {
  const installments: BNPLInstallment[] = [];

  // Try to extract explicit payment schedule first
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

  // If no explicit schedule, try to extract monthly payment info
  if (installments.length === 0) {
    const monthlyMatch = content.match(
      /(\d+)\s+monthly\s+payments?\s+of\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
    );

    if (monthlyMatch) {
      const monthCount = parseInt(monthlyMatch[1], 10);
      const monthlyAmount = parseFloat(monthlyMatch[2].replace(/,/g, ''));

      const firstPaymentMatch = content.match(
        /(?:First|Due)\s+(?:payment|date):\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i
      );
      const firstPaymentDate = firstPaymentMatch
        ? extractDate(firstPaymentMatch[1])
        : null;

      if (firstPaymentDate) {
        const baseDate = new Date(firstPaymentDate);

        for (let i = 0; i < monthCount; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          installments.push({
            installmentNumber: i + 1,
            amount: monthlyAmount,
            dueDate: dueDate.toISOString().split('T')[0],
          });
        }
      }
    }
  }

  return installments.length > 0 ? installments : null;
}
