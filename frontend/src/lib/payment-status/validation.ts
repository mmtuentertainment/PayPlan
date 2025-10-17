/**
 * Payment Status Validation Schemas
 *
 * Feature: 015-build-a-payment
 * Phase: 1 (Setup)
 * Task: T005
 *
 * Zod schemas for validating payment status data at runtime.
 * Ensures data integrity for localStorage persistence.
 *
 * @see data-model.md Section: Validation Summary
 */

import { z } from 'zod';
import type { PaymentStatus } from './types';

/**
 * Payment status enum schema
 */
export const paymentStatusSchema = z.enum(['paid', 'pending'], {
  errorMap: () => ({ message: 'Status must be "paid" or "pending"' }),
});

/**
 * PaymentStatusRecord validation schema
 *
 * Validates:
 * - paymentId: Must be valid UUID v4 format
 * - status: Must be 'paid' or 'pending'
 * - timestamp: Must be ISO 8601 date-time format
 *
 * @see data-model.md Section: PaymentStatusRecord
 */
export const paymentStatusRecordSchema = z.object({
  paymentId: z.string().uuid({
    message: 'Payment ID must be a valid UUID v4',
  }),
  status: paymentStatusSchema,
  timestamp: z.string().datetime({
    message: 'Timestamp must be ISO 8601 date-time format',
  }),
});

/**
 * Semantic version schema (e.g., "1.0.0")
 */
export const semanticVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be semantic versioning format (e.g., 1.0.0)',
  });

/**
 * SerializedPaymentStatusCollection validation schema
 *
 * Used for validating data loaded from localStorage.
 *
 * Validates:
 * - version: Semantic version string
 * - statuses: Record of paymentId → PaymentStatusRecord
 * - totalSize: Positive integer (bytes)
 * - lastModified: ISO 8601 date-time
 *
 * @see data-model.md Section: PaymentStatusCollection
 */
export const serializedPaymentStatusCollectionSchema = z.object({
  version: semanticVersionSchema,
  statuses: z.record(
    z.string().uuid({
      message: 'Payment ID key must be valid UUID',
    }),
    paymentStatusRecordSchema
  ),
  totalSize: z.number().int().positive({
    message: 'Total size must be positive integer',
  }),
  lastModified: z.string().datetime({
    message: 'Last modified must be ISO 8601 date-time',
  }),
});

/**
 * Validate a single payment status value
 *
 * @param value - Value to validate
 * @returns Validation result with parsed PaymentStatus or error
 *
 * @example
 * ```typescript
 * const result = validatePaymentStatus('paid');
 * if (result.success) {
 *   console.log('Valid status:', result.data);
 * } else {
 *   console.error('Invalid:', result.error.message);
 * }
 * ```
 */
export function validatePaymentStatus(value: unknown) {
  return paymentStatusSchema.safeParse(value);
}

/**
 * Validate a PaymentStatusRecord
 *
 * @param value - Value to validate
 * @returns Validation result with parsed record or error
 */
export function validatePaymentStatusRecord(value: unknown) {
  return paymentStatusRecordSchema.safeParse(value);
}

/**
 * Validate serialized collection from localStorage
 *
 * @param value - Value to validate
 * @returns Validation result with parsed collection or error
 */
export function validateSerializedCollection(value: unknown) {
  return serializedPaymentStatusCollectionSchema.safeParse(value);
}

/**
 * Validate payment ID format (UUID v4)
 *
 * @param id - Payment ID to validate
 * @returns true if valid UUID v4, false otherwise
 *
 * @example
 * ```typescript
 * if (isValidPaymentId(paymentId)) {
 *   // Proceed with operation
 * } else {
 *   // Show error
 * }
 * ```
 */
export function isValidPaymentId(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

/**
 * Validate ISO 8601 timestamp
 *
 * @param timestamp - Timestamp string to validate
 * @returns true if valid ISO 8601, false otherwise
 */
export function isValidTimestamp(timestamp: string): boolean {
  return z.string().datetime().safeParse(timestamp).success;
}

/**
 * Type exports for schema inference
 */
export type PaymentStatusRecord = z.infer<typeof paymentStatusRecordSchema>;
export type SerializedPaymentStatusCollection = z.infer<
  typeof serializedPaymentStatusCollectionSchema
>;
