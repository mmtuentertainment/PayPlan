import { z } from 'zod';

/**
 * Numeric Validation for Financial Calculations
 *
 * Prevents NaN and Infinity values from corrupting financial calculations.
 * Implements FR-008: Numeric validation before financial calculations.
 *
 * @module NumericValidator
 */

/**
 * Schema for validating finite numbers (no NaN or Infinity)
 *
 * Used for general numeric validation where zero is acceptable.
 * Note: Zod's .number() already rejects NaN and Infinity, so additional
 * refinement is not needed. This schema exists for semantic clarity.
 */
export const FiniteNumberSchema = z.number().finite({
  message: 'Value must be finite (not Infinity or -Infinity)',
});

/**
 * Business limits for payment amounts
 */
export const MAX_AMOUNT = 1000000; // $1M per payment (prevents overflow in financial calculations)
export const MIN_REFUND = -10000; // -$10K minimum refund (prevents abuse)

/**
 * Schema for validating payment amounts
 *
 * Requirements:
 * - Must be a finite number (no NaN or Infinity)
 * - Must not be zero (zero payments are invalid)
 * - Must have at most 2 decimal places (currency precision)
 * - Must be within business limits (MAX_AMOUNT, MIN_REFUND)
 * - Negative values are allowed (treated as refunds)
 *
 * Examples:
 * - Valid: 100.50, -50.25 (refund), 0.01
 * - Invalid: 0, NaN, Infinity, "100" (must be number type), 100.999 (>2 decimals)
 */
export const PaymentAmountSchema = FiniteNumberSchema
  .refine((val) => val !== 0, {
    message: 'Payment amount must not be zero',
  })
  .refine((val) => Math.round(val * 100) === val * 100, {
    message: 'Payment amount must have at most 2 decimal places',
  })
  .refine((val) => val >= MIN_REFUND, {
    message: `Payment amount cannot be less than ${MIN_REFUND} (minimum refund limit)`,
  })
  .refine((val) => val <= MAX_AMOUNT, {
    message: `Payment amount cannot exceed ${MAX_AMOUNT} (maximum payment limit)`,
  });

/**
 * Type inference for payment amounts
 */
export type PaymentAmount = z.infer<typeof PaymentAmountSchema>;

/**
 * Type inference for finite numbers
 */
export type FiniteNumber = z.infer<typeof FiniteNumberSchema>;

/**
 * Validates a payment amount and returns a typed result
 *
 * @param amount - The amount to validate
 * @returns Zod safe parse result
 *
 * @example
 * ```typescript
 * const result = validatePaymentAmount(100.50);
 * if (result.success) {
 *   const amount: PaymentAmount = result.data;
 *   // Safe to use in financial calculations
 * }
 * ```
 */
export function validatePaymentAmount(amount: unknown) {
  return PaymentAmountSchema.safeParse(amount);
}

/**
 * Validates a finite number and returns a typed result
 *
 * @param value - The value to validate
 * @returns Zod safe parse result
 */
export function validateFiniteNumber(value: unknown) {
  return FiniteNumberSchema.safeParse(value);
}
