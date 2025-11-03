/**
 * Payment Status Type Definitions
 *
 * Feature: 015-build-a-payment
 * Phase: 1 (Setup)
 * Tasks: T002, T003, T004
 *
 * Type system for payment status tracking with localStorage persistence.
 * All types are technology-agnostic and follow the data model from:
 * specs/015-build-a-payment/data-model.md
 */

/**
 * Payment status enumeration.
 * - 'paid': Payment has been completed
 * - 'pending': Payment is not yet completed (default state)
 */
export type PaymentStatus = 'paid' | 'pending';

/**
 * T002: PaymentStatusRecord
 *
 * Represents the tracking state of a single payment.
 *
 * @property paymentId - Unique identifier for the payment (UUID v4)
 * @property status - Current status (paid or pending)
 * @property timestamp - ISO 8601 date-time when status was last updated
 *
 * @see data-model.md Section: PaymentStatusRecord
 */
export interface PaymentStatusRecord {
  paymentId: string;
  status: PaymentStatus;
  timestamp: string;
}

/**
 * T003: PaymentStatusCollection
 *
 * Represents the complete set of payment status records for the current session.
 * Stored in localStorage with metadata for versioning and size management.
 *
 * @property version - Schema version (semantic versioning, e.g., "1.0.0")
 * @property statuses - Map of paymentId → PaymentStatusRecord
 * @property totalSize - Total storage size in bytes
 * @property lastModified - ISO 8601 date-time when collection was last updated
 *
 * @see data-model.md Section: PaymentStatusCollection
 */
export interface PaymentStatusCollection {
  version: string;
  statuses: Map<string, PaymentStatusRecord>;
  totalSize: number;
  lastModified: string;
}

/**
 * Serialized version of PaymentStatusCollection for localStorage.
 * Maps are converted to Records for JSON serialization.
 */
export interface SerializedPaymentStatusCollection {
  version: string;
  statuses: Record<string, PaymentStatusRecord>;
  totalSize: number;
  lastModified: string;
}

/**
 * T004: StorageError types
 *
 * Error types for storage operations following the Result pattern.
 */

/**
 * Storage error types
 * - Validation: Invalid data format or schema violation
 * - QuotaExceeded: Browser storage limit reached
 * - Security: localStorage disabled or blocked
 * - Serialization: JSON.stringify/parse failed
 *
 * @see data-model.md Section: Error Handling
 */
export type StorageErrorType =
  | 'Validation'
  | 'QuotaExceeded'
  | 'Security'
  | 'Serialization';

/**
 * Storage error object
 *
 * @property type - Error type classification
 * @property message - Human-readable error message
 * @property paymentId - Optional: payment ID that caused the error
 */
export interface StorageError {
  type: StorageErrorType;
  message: string;
  paymentId?: string;
}

/**
 * T004: Result<T, E> type
 *
 * Rust-inspired Result type for explicit error handling.
 * Used throughout the payment status system to avoid throwing exceptions.
 *
 * @example
 * ```typescript
 * const result = storage.saveStatus(record);
 * if (result.ok) {
 *   console.log('Saved:', result.value);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export type Result<T, E = StorageError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Payment type extension (for CSV export integration)
 * These fields are added at runtime when exporting, not stored in Payment entity.
 *
 * @property id - UUID v4 assigned at payment creation (T007 extends existing Payment type)
 * @property paid_status - Runtime-only: 'paid' or 'pending'
 * @property paid_timestamp - Runtime-only: ISO 8601 date or empty string
 *
 * @see data-model.md Section: Payment (Extended)
 */
export interface PaymentStatusFields {
  id?: string;
  paid_status?: PaymentStatus;
  paid_timestamp?: string;
}

/**
 * Type guard: Check if value is a valid PaymentStatus
 */
export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return value === 'paid' || value === 'pending';
}

/**
 * Type guard: Check if value is a PaymentStatusRecord
 */
export function isPaymentStatusRecord(
  value: unknown
): value is PaymentStatusRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<PaymentStatusRecord>;
  return (
    typeof record.paymentId === 'string' &&
    isPaymentStatus(record.status) &&
    typeof record.timestamp === 'string'
  );
}
