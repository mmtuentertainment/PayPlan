/**
 * PaymentStatusService - Business logic for payment status tracking
 *
 * Feature: 015-build-a-payment
 * Phase: 2 (Foundational) - T009 (skeleton), Phase 3 (US1) - T028-T031 (implementation)
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusService.contract.md
 *
 * Provides business logic for payment status operations:
 * - Mark payments as paid/pending
 * - Toggle status (undo functionality)
 * - Bulk operations
 * - Integration with risk analysis and exports
 *
 * @see research.md Section 4 - React 19 State Management
 * @see contracts/PaymentStatusService.contract.md
 */

import type { StorageError, Result, PaymentStatusRecord, PaymentStatus } from './types';
import { PaymentStatusStorage } from './PaymentStatusStorage';
import { isValidPaymentId } from './validation';
import { getCurrentTimestamp } from './utils';
import { ERROR_MESSAGES, DEFAULT_STATUS } from './constants';

/**
 * Service layer for payment status business logic.
 * Orchestrates status changes and integrates with storage layer.
 *
 * Tasks: T028-T031 (Phase 3 - US1)
 */
export class PaymentStatusService {
  private storage: PaymentStatusStorage;

  constructor(storage: PaymentStatusStorage) {
    this.storage = storage;
  }

  /**
   * T028: Mark a payment as paid
   *
   * @param paymentId - Payment UUID
   * @returns Result<void, StorageError>
   */
  markAsPaid(paymentId: string): Result<void, StorageError> {
    // Validate payment ID first
    const validationResult = this.validatePaymentId(paymentId);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Create payment status record
    const record: PaymentStatusRecord = {
      paymentId,
      status: 'paid',
      timestamp: getCurrentTimestamp(),
    };

    // Save to storage
    const saveResult = this.storage.saveStatus(record);

    if (!saveResult.ok) {
      return saveResult as Result<void, StorageError>;
    }

    return { ok: true, value: undefined };
  }

  /**
   * T029: Mark a payment as pending (undo paid status)
   *
   * @param paymentId - Payment UUID
   * @returns Result<void, StorageError>
   */
  markAsPending(paymentId: string): Result<void, StorageError> {
    // Validate payment ID first
    const validationResult = this.validatePaymentId(paymentId);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Create payment status record
    const record: PaymentStatusRecord = {
      paymentId,
      status: 'pending',
      timestamp: getCurrentTimestamp(),
    };

    // Save to storage
    const saveResult = this.storage.saveStatus(record);

    if (!saveResult.ok) {
      return saveResult as Result<void, StorageError>;
    }

    return { ok: true, value: undefined };
  }

  /**
   * T030: Toggle payment status between paid and pending
   *
   * @param paymentId - Payment UUID
   * @returns Result<PaymentStatus, StorageError> - New status after toggle
   */
  toggleStatus(paymentId: string): Result<PaymentStatus, StorageError> {
    // Validate payment ID first
    const validationResult = this.validatePaymentId(paymentId);
    if (!validationResult.ok) {
      return validationResult as Result<PaymentStatus, StorageError>;
    }

    // Get current status
    const currentResult = this.getStatus(paymentId);
    if (!currentResult.ok) {
      return currentResult as Result<PaymentStatus, StorageError>;
    }

    const currentStatus = currentResult.value;
    const newStatus: PaymentStatus = currentStatus === 'paid' ? 'pending' : 'paid';

    // Create record with toggled status
    const record: PaymentStatusRecord = {
      paymentId,
      status: newStatus,
      timestamp: getCurrentTimestamp(),
    };

    // Save to storage
    const saveResult = this.storage.saveStatus(record);

    if (!saveResult.ok) {
      return saveResult as Result<PaymentStatus, StorageError>;
    }

    return { ok: true, value: newStatus };
  }

  /**
   * T031: Get current status of a payment
   *
   * @param paymentId - Payment UUID
   * @returns Result<PaymentStatus, StorageError> - Defaults to 'pending' if no record exists
   */
  getStatus(paymentId: string): Result<PaymentStatus, StorageError> {
    // Validate payment ID first
    const validationResult = this.validatePaymentId(paymentId);
    if (!validationResult.ok) {
      return validationResult as Result<PaymentStatus, StorageError>;
    }

    try {
      const result = this.storage.getStatus(paymentId);

      if (!result.ok) {
        return result as Result<PaymentStatus, StorageError>;
      }

      // Default to pending if no record exists
      const status = result.value?.status ?? DEFAULT_STATUS;

      return { ok: true, value: status };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: 'Serialization',
          message: ERROR_MESSAGES.UNKNOWN_ERROR,
          paymentId,
        },
      };
    }
  }

  /**
   * Get full status record including timestamp (part of T031)
   *
   * @param paymentId - Payment UUID
   * @returns Result<PaymentStatusRecord | null, StorageError>
   */
  getStatusWithTimestamp(
    paymentId: string
  ): Result<PaymentStatusRecord | null, StorageError> {
    // Validate payment ID first
    const validationResult = this.validatePaymentId(paymentId);
    if (!validationResult.ok) {
      return validationResult as Result<null, StorageError>;
    }

    return this.storage.getStatus(paymentId);
  }

  /**
   * Bulk mark multiple payments as paid (US3)
   * Implementation in T054
   */
  bulkMarkAsPaid(_paymentIds: string[]): Result<number, StorageError> {
    throw new Error('Not implemented - T054 (US3)');
  }

  /**
   * Bulk mark multiple payments as pending (US3)
   * Implementation in T055
   */
  bulkMarkAsPending(_paymentIds: string[]): Result<number, StorageError> {
    throw new Error('Not implemented - T055 (US3)');
  }

  /**
   * Clear all payment statuses (US5)
   * Implementation in T076
   */
  clearAll(): Result<number, StorageError> {
    throw new Error('Not implemented - T076 (US5)');
  }

  /**
   * Get set of payment IDs that are marked as paid (US2)
   * Implementation in T044
   */
  getPaidPayments(_paymentIds: string[]): Result<Set<string>, StorageError> {
    throw new Error('Not implemented - T044 (US2)');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate payment ID format
   *
   * @param id - Payment ID to validate
   * @returns Result<void, StorageError>
   */
  private validatePaymentId(id: string): Result<void, StorageError> {
    if (!isValidPaymentId(id)) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.INVALID_PAYMENT_ID,
          paymentId: id,
        },
      };
    }

    return { ok: true, value: undefined };
  }
}
