import { z } from 'zod';
import { PaymentAmountSchema } from './NumericValidator';

/**
 * API Request Validation Schemas
 *
 * Implements FR-007: API validates all request data with Zod
 * Protects against malformed requests and ensures data integrity.
 *
 * @module PlanRequestSchema
 */

/**
 * Valid payment frequencies
 */
export const PaymentFrequencySchema = z.enum([
  'weekly',
  'biweekly',
  'monthly',
  'custom',
]);

/**
 * ISO 8601 date string validation with strict date checking
 *
 * Prevents auto-correction of invalid dates like "2025-02-30" → "2025-03-02"
 */
export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return false;
      }
      // Strict validation: Reject dates that auto-correct (e.g., 2025-02-30 → 2025-03-02)
      const [year, month, day] = date.split('-').map(Number);
      const reconstructed = new Date(year, month - 1, day);
      return (
        reconstructed.getFullYear() === year &&
        reconstructed.getMonth() + 1 === month &&
        reconstructed.getDate() === day
      );
    },
    {
      message: 'Date must be a valid ISO 8601 date (e.g., 2025-02-30 is invalid)',
    }
  );

/**
 * IANA timezone validation
 *
 * Note: This is a basic validation. For production, consider using a library
 * like `tz-lookup` or maintain a list of valid IANA timezones.
 */
export const IANATimezoneSchema = z
  .string()
  .regex(
    /^[A-Za-z]+\/[A-Za-z_]+$/,
    'Timezone must be a valid IANA timezone (e.g., America/New_York)'
  );

/**
 * Individual installment item schema with status/date consistency validation
 */
export const InstallmentItemSchema = z
  .object({
    amount: PaymentAmountSchema,
    dueDate: ISODateSchema,
    description: z.string().min(1, 'Description cannot be empty'),
    status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
    paidDate: ISODateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Validate status/date consistency
    if (data.paidDate && data.status !== 'paid') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'paidDate can only be set when status is "paid"',
        path: ['paidDate'],
      });
    }
    if (data.status === 'paid' && !data.paidDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'paidDate is required when status is "paid"',
        path: ['status'],
      });
    }
  });

/**
 * Plan request schema
 *
 * Validates incoming payment plan requests with the following constraints:
 * - Total amount must be a valid payment amount (finite, non-zero, 2 decimal places)
 * - Start date must be a valid ISO date (strict validation, no auto-correction)
 * - Frequency must be one of the allowed values
 * - Installment count must be between 1 and 100
 * - Timezone must be a valid IANA timezone (optional)
 * - Installments array must match the installment count
 * - Custom frequency requires customIntervalDays
 * - Installments must sum to totalAmount (financial integrity)
 */
export const PlanRequestSchema = z
  .object({
    totalAmount: PaymentAmountSchema,
    startDate: ISODateSchema,
    frequency: PaymentFrequencySchema,
    installmentCount: z
      .number()
      .int('Installment count must be an integer')
      .min(1, 'Must have at least 1 installment')
      .max(100, 'Cannot exceed 100 installments'),
    timezone: IANATimezoneSchema.optional(),
    installments: z.array(InstallmentItemSchema).optional(),
    customIntervalDays: z
      .number()
      .int('Custom interval must be an integer')
      .min(1, 'Custom interval must be at least 1 day')
      .max(365, 'Custom interval cannot exceed 365 days')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Validate custom frequency requires customIntervalDays
    if (data.frequency === 'custom' && !data.customIntervalDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'customIntervalDays is required when frequency is "custom"',
        path: ['customIntervalDays'],
      });
    }

    // Validate installments array length matches count
    if (data.installments && data.installments.length !== data.installmentCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Installments array length must match installmentCount',
        path: ['installments'],
      });
    }

    // Financial integrity: Installments must sum to totalAmount (allow 1¢ rounding)
    if (data.installments) {
      const sum = data.installments.reduce((acc, inst) => acc + inst.amount, 0);
      const roundedSum = Math.round(sum * 100) / 100;
      const roundedTotal = Math.round(data.totalAmount * 100) / 100;

      if (Math.abs(roundedSum - roundedTotal) >= 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Installments sum (${roundedSum}) must equal totalAmount (${roundedTotal})`,
          path: ['installments'],
        });
      }
    }
  });

/**
 * Type inference for plan requests
 */
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/**
 * Type inference for installment items
 */
export type InstallmentItem = z.infer<typeof InstallmentItemSchema>;

/**
 * Type inference for payment frequency
 */
export type PaymentFrequency = z.infer<typeof PaymentFrequencySchema>;

/**
 * Validates a plan request and returns a typed result
 *
 * @param request - The request data to validate
 * @returns Zod safe parse result
 *
 * @example
 * ```typescript
 * const result = validatePlanRequest({
 *   totalAmount: 1000,
 *   startDate: '2025-10-23',
 *   frequency: 'weekly',
 *   installmentCount: 4,
 *   timezone: 'America/New_York',
 * });
 *
 * if (result.success) {
 *   const plan: PlanRequest = result.data;
 *   // Process valid request
 * } else {
 *   // Handle validation errors
 *   console.error(result.error.issues);
 * }
 * ```
 */
export function validatePlanRequest(request: unknown) {
  return PlanRequestSchema.safeParse(request);
}
