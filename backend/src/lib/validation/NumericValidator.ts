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
 */
export const FiniteNumberSchema = z
  .number()
  .refine((val) => !isNaN(val), {
    message: 'Value must not be NaN',
  })
  .refine((val) => isFinite(val), {
    message: 'Value must be finite (not Infinity or -Infinity)',
  });

/**
 * Schema for validating payment amounts
 *
 * Requirements:
 * - Must be a finite number (no NaN or Infinity)
 * - Must not be zero (zero payments are invalid)
 * - Negative values are allowed (treated as refunds)
 *
 * Examples:
 * - Valid: 100.50, -50.25 (refund), 0.01
 * - Invalid: 0, NaN, Infinity, "100" (must be number type)
 */
export const PaymentAmountSchema = FiniteNumberSchema.refine(
  (val) => val !== 0,
  {
    message: 'Payment amount must not be zero',
  }
);

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
