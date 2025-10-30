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

import { v4 as uuidv4 } from "uuid";
import type {
  BNPLParser,
  BNPLParseResult,
  BNPLPaymentSchedule,
  BNPLInstallment,
} from "../../types/bnpl";
import { BNPLErrorType } from "../../types/bnpl";
import {
  stripHtmlTags,
  extractAmount,
  extractDate,
  validatePaymentSchedule,
  createUserFriendlyError,
} from "../bnpl-parser";

export const affirmParser: BNPLParser = {
  provider: "affirm",

  canParse(emailContent: string): boolean {
    const content = stripHtmlTags(emailContent).toLowerCase();
    return (
      content.includes("affirm") ||
      content.includes("your affirm purchase") ||
      content.includes("affirm loan")
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
            message: "Could not find merchant name in Affirm email",
            suggestion:
              "Please make sure you pasted the full purchase confirmation email.",
          }).message,
          detectedProvider: "affirm",
        };
      }

      const totalAmount = extractAffirmTotalAmount(content);
      if (!totalAmount) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: "Could not find total purchase amount in Affirm email",
            suggestion:
              "Please make sure you pasted the full purchase confirmation email.",
          }).message,
          detectedProvider: "affirm",
        };
      }

      const installmentInfo = extractAffirmInstallments(content, totalAmount);
      if (!installmentInfo || installmentInfo.installments.length === 0) {
        return {
          success: false,
          error: createUserFriendlyError({
            type: BNPLErrorType.MISSING_DATA,
            message: "Could not find payment schedule in Affirm email",
            suggestion:
              "Please make sure you pasted the full purchase confirmation email with payment dates.",
          }).message,
          detectedProvider: "affirm",
        };
      }

      const schedule: BNPLPaymentSchedule = {
        id: uuidv4(),
        provider: "affirm",
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
            message: "Extracted data is invalid",
            suggestion: `Validation errors: ${validation.errors.join(", ")}`,
          }).message,
          detectedProvider: "affirm",
        };
      }

      return {
        success: true,
        schedule,
        detectedProvider: "affirm",
      };
    } catch (error) {
      console.error("Affirm parser error:", error);
      return {
        success: false,
        error: createUserFriendlyError({
          type: BNPLErrorType.INVALID_FORMAT,
          message: "Failed to parse Affirm email",
          suggestion:
            "Please make sure you pasted a purchase confirmation email.",
        }).message,
        detectedProvider: "affirm",
      };
    }
  },
};

/**
 * Extracts merchant name from Affirm email content
 *
 * @param content - Stripped email content (HTML tags removed)
 * @returns Merchant name or null if not found
 *
 * @example
 * extractAffirmMerchant("Your loan for $600.00 at Best Buy has been confirmed")
 * // Returns: "Best Buy"
 */
function extractAffirmMerchant(content: string): string | null {
  const patterns = [
    // Pattern 1: "Your loan for $600.00 at Best Buy has been confirmed"
    // Use greedy match with specific boundaries (has|for) to capture multi-word merchants
    /(?:purchase|loan)\s+(?:of|for)\s+\$[\d,]+(?:\.\d{2})?\s+(?:at|from|with)\s+([A-Za-z0-9][A-Za-z0-9\s&'.,-]+?)\s+(?:has|for|been)/i,
    // Pattern 2: "Your loan for $600.00 at Best Buy." (ending with period)
    /(?:purchase|loan)\s+(?:of|for)\s+\$[\d,]+(?:\.\d{2})?\s+(?:at|from|with)\s+([A-Za-z0-9][A-Za-z0-9\s&'.,-]+?)\./i,
    // Pattern 3: "financed through Best Buy" or "shopping at Best Buy"
    /(?:financed through|shopping at)\s+([A-Za-z0-9][A-Za-z0-9\s&'.,-]+?)(?:\s+for|\s+has|\.)/i,
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
 * Extracts total purchase amount from Affirm email content
 *
 * @param content - Stripped email content (HTML tags removed)
 * @returns Total amount as number or null if not found
 *
 * @example
 * extractAffirmTotalAmount("Your loan for $600.00 at Best Buy")
 * // Returns: 600.00
 */
function extractAffirmTotalAmount(content: string): number | null {
  const patterns = [
    // Pattern 1: "loan for $600.00" or "purchase of $X"
    /(?:purchase|loan)\s+(?:of|for)\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    // Pattern 2: "Total amount: $630.00"
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

/**
 * Extracts payment installments from Affirm email content
 *
 * @param content - Stripped email content (HTML tags removed)
 * @param _totalAmount - Total purchase amount (unused, kept for signature consistency)
 * @returns Object containing installments array and optional APR, or null if parsing fails
 *
 * @remarks
 * Tries two strategies:
 * 1. Extract individual payment lines (e.g., "Payment 1: $52.50 due December 1, 2025")
 * 2. Fallback: Extract monthly payment info (e.g., "6 monthly payments of $83.33")
 *
 * @example
 * extractAffirmInstallments("Payment 1: $52.50 due December 1, 2025\nPayment 2: $52.50 due January 1, 2026", 600)
 * // Returns: { installments: [{installmentNumber: 1, amount: 52.50, dueDate: "2025-12-01"}, ...], apr: undefined }
 */
function extractAffirmInstallments(
  content: string,
  _totalAmount: number,
): { installments: BNPLInstallment[]; apr?: number } | null {
  // Extract APR if present
  let apr: number | undefined;
  const aprMatch = content.match(/APR:\s*(\d+(?:\.\d+)?)\s*%/i);
  if (aprMatch) {
    apr = parseFloat(aprMatch[1]);
  }

  // Try to extract individual payment lines: "Payment 1: $52.50 due December 1, 2025"
  const paymentPattern =
    /Payment\s+(\d+):\s+\$\s*([\d,]+\.?\d*)\s+due\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/gi;
  const matches = Array.from(content.matchAll(paymentPattern));

  if (matches.length > 0) {
    const installments: BNPLInstallment[] = matches.map((match) => {
      const number = parseInt(match[1], 10);
      const amount = parseFloat(match[2].replace(/,/g, ""));
      const dateStr = match[3];
      const dueDate = extractDate(dateStr);

      return {
        installmentNumber: number,
        amount,
        dueDate: dueDate || new Date().toISOString().split("T")[0], // Fallback
      };
    });

    return { installments, apr };
  }

  // Fallback: Extract monthly payment info: "6 monthly payments of $83.33"
  const monthlyMatch = content.match(
    /(\d+)\s+monthly\s+payments?\s+of\s+\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  );

  if (monthlyMatch) {
    const monthCount = parseInt(monthlyMatch[1], 10);
    const monthlyAmount = parseFloat(monthlyMatch[2].replace(/,/g, ""));

    // Extract first payment date
    const firstPaymentMatch = content.match(
      /(?:First|1st)\s+payment:\s+([A-Za-z]+\s+\d{1,2}(?:,?\s+\d{4})?)/i,
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
        dueDate: dueDate.toISOString().split("T")[0],
      });
    }

    return { installments, apr };
  }

  return null;
}
