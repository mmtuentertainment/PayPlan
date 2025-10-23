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
 * ISO 8601 date string validation
 */
export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    {
      message: 'Date must be a valid ISO 8601 date',
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
 * Individual installment item schema
 */
export const InstallmentItemSchema = z.object({
  amount: PaymentAmountSchema,
  dueDate: ISODateSchema,
  description: z.string().min(1, 'Description cannot be empty'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  paidDate: ISODateSchema.optional(),
});

/**
 * Plan request schema
 *
 * Validates incoming payment plan requests with the following constraints:
 * - Total amount must be a valid payment amount (finite, non-zero)
 * - Start date must be a valid ISO date
 * - Frequency must be one of the allowed values
 * - Installment count must be between 1 and 100
 * - Timezone must be a valid IANA timezone (optional)
 * - Installments array must match the installment count
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
  })
  .refine(
    (data) => {
      // If installments array is provided, it must match the count
      if (data.installments) {
        return data.installments.length === data.installmentCount;
      }
      return true;
    },
    {
      message: 'Installments array length must match installmentCount',
      path: ['installments'],
    }
  );

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
