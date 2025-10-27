/**
 * Affirm BNPL Email Parser
 *
 * Parses Affirm purchase confirmation emails to extract payment schedules.
 *
 * Affirm Format:
 * - "Your Affirm purchase of $X.XX at [Merchant]"
 * - Monthly payments (3, 6, 12, 24 months)
 * - May include APR (0% or interest-bearing)
 *
 * Market Share: ~30% of BNPL users
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

export const affirmParser: BNPLParser = {
  provider: 'affirm',

  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();
    return (
      content.includes('affirm') ||
      content.includes('your affirm purchase') ||
      content.includes('affirm loan')
    );
  },

  parse(emailContent: string): BNPLParseResult {
    try {
      const content = stripHtmlTags(emailContent);

      const merchant = extractAffirmMerchant(content);
      if (!merchant) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find merchant name in Affirm email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email.',
          }).message,
          detectedProvider: 'affirm',
        };
      }

      const totalAmount = extractAffirmTotalAmount(content);
      if (!totalAmount) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find total purchase amount in Affirm email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email.',
          }).message,
          detectedProvider: 'affirm',
        };
      }

      const installmentInfo = extractAffirmInstallments(content, totalAmount);
      if (!installmentInfo || installmentInfo.installments.length === 0) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: 'Could not find payment schedule in Affirm email',
            suggestion:
              'Please make sure you pasted the full purchase confirmation email with payment dates.',
          }).message,
          detectedProvider: 'affirm',
        };
      }

      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: 'affirm',
        merchant,
        totalAmount,
        installmentCount: installmentInfo.installments.length,
        installments: installmentInfo.installments,
        apr: installmentInfo.apr,
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
          detectedProvider: 'affirm',
        };
      }

      return {
        success: true,
        schedule,
        detectedProvider: 'affirm',
      };
    } catch (error) {
      console.error('Affirm parser error:', error);
      return {
        success: false,
        error: createUserFriendlyError({
          type: BNPLErrorType.INVALID_FORMAT,
          message: 'Failed to parse Affirm email',
          suggestion:
            'Please make sure you pasted a purchase confirmation email.',
        }).message,
        detectedProvider: 'affirm',
      };
    }
  },
};

function extractAffirmMerchant(content: string): string | null {
  const patterns = [
    /(?:purchase|loan)\s+(?:of|from)\s+\$[\d,]+(?:\.\d{2})?\s+at\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+|\.|\n)/i,
    /(?:financed through|shopping at)\s+([A-Z][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+\$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extractAffirmTotalAmount(content: string): number | null {
  const patterns = [
    /(?:purchase|loan)\s+of\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /Total(?:\s+amount)?:\s*\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
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

function extractAffirmInstallments(
  content: string,
  _totalAmount: number
): { installments: BNPLInstallment[]; apr?: number } | null {
  // Extract APR if present
  let apr: number | undefined;
  const aprMatch = content.match(/APR:\s*(\d+(?:\.\d+)?)\s*%/i);
  if (aprMatch) {
    apr = parseFloat(aprMatch[1]);
  }

  // Extract monthly payment info: "6 monthly payments of $83.33"
  const monthlyMatch = content.match(
    /(\d+)\s+monthly\s+payments?\s+of\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
  );

  if (monthlyMatch) {
    const monthCount = parseInt(monthlyMatch[1], 10);
    const monthlyAmount = parseFloat(monthlyMatch[2].replace(/,/g, ''));

    // Extract first payment date
    const firstPaymentMatch = content.match(
      /(?:First|1st)\s+payment:\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i
    );
    const firstPaymentDate = firstPaymentMatch
      ? extractDate(firstPaymentMatch[1])
      : null;

    if (!firstPaymentDate) {
      return null; // Can't generate schedule without first date
    }

    // Generate monthly installments
    const installments: BNPLInstallment[] = [];
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

    return { installments, apr };
  }

  return null;
}
