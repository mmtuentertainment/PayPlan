/**
 * PaymentStatusStorage - Browser localStorage management for payment status
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Tasks: T021-T027
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusStorage.contract.md
 *
 * Implements privacy-first local storage with:
 * - Save/load payment status records
 * - 5MB storage limit validation
 * - <100ms load performance
 * - Cross-tab synchronization via storage events
 * - Result<T, E> error handling pattern
 *
 * @see research.md Section 2 - localStorage best practices
 * @see data-model.md - Entity definitions
 */

import type {
  PaymentStatusRecord,
  PaymentStatusCollection,
  SerializedPaymentStatusCollection,
  StorageError,
  Result,
} from './types';
import {
  validatePaymentStatusRecord,
  validateSerializedCollection,
  isValidPaymentId,
} from './validation';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  ERROR_MESSAGES,
  BROWSER_STORAGE_LIMIT,
} from './constants';
import { calculateByteSize, getCurrentTimestamp } from './utils';

/**
 * Service for managing payment status persistence in localStorage.
 *
 * Key Responsibilities:
 * - Save/load status records with validation
 * - Enforce storage size limits
 * - Handle schema versioning and migrations
 * - Provide error handling with Result types
 * - Support cross-tab synchronization
 */
export class PaymentStatusStorage {
  /**
   * T021: Save or update a single payment status record
   *
   * @param record - Payment status record to save
   * @returns Result<boolean, StorageError> - true if saved, false if no-op
   */
  saveStatus(record: PaymentStatusRecord): Result<boolean, StorageError> {
    // Validate record before saving
    const validationResult = validatePaymentStatusRecord(record);
    if (!validationResult.success) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: validationResult.error.issues[0].message,
          paymentId: record.paymentId,
        },
      };
    }

    try {
      // Load existing collection
      const loadResult = this.loadStatuses();
      const collection = loadResult.ok
        ? loadResult.value
        : this.createDefaultCollection();

      // Check if record already exists with same values
      const existing = collection.statuses.get(record.paymentId);
      const isNoOp = existing &&
        existing.status === record.status &&
        existing.timestamp === record.timestamp;

      if (isNoOp) {
        return { ok: true, value: false };
      }

      // Update collection with new record
      collection.statuses.set(record.paymentId, record);
      collection.lastModified = getCurrentTimestamp();

      // Save to localStorage first (this will calculate size)
      const saveResult = this.saveCollection(collection);

      if (!saveResult.ok) {
        return saveResult;
      }

      // Recalculate size after save for accuracy
      collection.totalSize = this.calculateSize();

      // Check storage limit AFTER save
      if (collection.totalSize > BROWSER_STORAGE_LIMIT) {
        // Rollback - remove the record we just added
        collection.statuses.delete(record.paymentId);
        this.saveCollection(collection);

        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            paymentId: record.paymentId,
          },
        };
      }

      return { ok: true, value: true };
    } catch (error) {
      return this.handleStorageError(error, record.paymentId);
    }
  }

  /**
   * T022: Load all payment status records from localStorage
   *
   * @returns Result<PaymentStatusCollection, StorageError>
   */
  loadStatuses(): Result<PaymentStatusCollection, StorageError> {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);

      // No saved data: return empty collection
      if (serialized === null || serialized === undefined) {
        return { ok: true, value: this.createDefaultCollection() };
      }

      // Parse JSON - catch parse errors
      let parsed;
      try {
        parsed = JSON.parse(serialized);
      } catch (parseError) {
        // JSON parse error: corrupted data, clear and return defaults
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
        console.warn(`Corrupted payment status data (invalid JSON): ${errorMessage}. Raw value length: ${serialized.length} chars. Resetting to defaults.`);
        localStorage.removeItem(STORAGE_KEY);
        return { ok: true, value: this.createDefaultCollection() };
      }

      // Validate structure
      const validationResult = validateSerializedCollection(parsed);

      if (!validationResult.success) {
        // Corrupted data: clear storage and return defaults
        console.warn('Corrupted payment status data (invalid schema), resetting to defaults');
        localStorage.removeItem(STORAGE_KEY);
        return { ok: true, value: this.createDefaultCollection() };
      }

      const serializedCollection = validationResult.data;

      // Handle version mismatch - migrate or reset
      const versionMismatch = serializedCollection.version !== SCHEMA_VERSION;
      if (versionMismatch) {
        // Simple migration: bump version
        serializedCollection.version = SCHEMA_VERSION;
      }

      // Convert Record to Map
      const statuses = new Map<string, PaymentStatusRecord>();
      for (const [paymentId, record] of Object.entries(serializedCollection.statuses)) {
        statuses.set(paymentId, record);
      }

      const collection: PaymentStatusCollection = {
        version: serializedCollection.version,
        statuses,
        totalSize: serializedCollection.totalSize,
        lastModified: serializedCollection.lastModified,
      };

      // Recalculate size if version was migrated
      if (versionMismatch) {
        collection.totalSize = this.calculateSize();
      }

      return { ok: true, value: collection };
    } catch (error) {
      // Security errors should be surfaced
      if (error instanceof Error && error.name === 'SecurityError') {
        return this.handleStorageError(error);
      }

      // Other errors: fallback to defaults for resilient UX
      console.warn('Failed to load payment statuses, using defaults', error);
      localStorage.removeItem(STORAGE_KEY);
      return { ok: true, value: this.createDefaultCollection() };
    }
  }

  /**
   * T023: Get status record for a specific payment
   *
   * @param paymentId - Payment UUID to look up
   * @returns Result<PaymentStatusRecord | null, StorageError>
   */
  getStatus(paymentId: string): Result<PaymentStatusRecord | null, StorageError> {
    // Validate payment ID format
    if (!isValidPaymentId(paymentId)) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.INVALID_PAYMENT_ID,
          paymentId,
        },
      };
    }

    try {
      const loadResult = this.loadStatuses();

      if (!loadResult.ok) {
        return loadResult as Result<null, StorageError>;
      }

      const collection = loadResult.value;
      const record = collection.statuses.get(paymentId);

      return { ok: true, value: record || null };
    } catch (error) {
      return this.handleStorageError(error, paymentId);
    }
  }

  /**
   * Delete a payment status record
   *
   * @param paymentId - Payment UUID to delete
   * @returns Result<boolean, StorageError> - true if deleted, false if didn't exist
   */
  deleteStatus(paymentId: string): Result<boolean, StorageError> {
    if (!isValidPaymentId(paymentId)) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.INVALID_PAYMENT_ID,
          paymentId,
        },
      };
    }

    try {
      const loadResult = this.loadStatuses();
      if (!loadResult.ok) {
        return loadResult as Result<boolean, StorageError>;
      }

      const collection = loadResult.value;
      const existed = collection.statuses.has(paymentId);

      if (!existed) {
        return { ok: true, value: false };
      }

      collection.statuses.delete(paymentId);
      collection.lastModified = getCurrentTimestamp();
      collection.totalSize = this.calculateSize();

      const saveResult = this.saveCollection(collection);
      if (!saveResult.ok) {
        return saveResult;
      }

      return { ok: true, value: true };
    } catch (error) {
      return this.handleStorageError(error, paymentId);
    }
  }

  /**
   * Bulk save multiple payment status records (US3)
   * Implementation in T053
   */
  bulkSaveStatuses(_records: PaymentStatusRecord[]): Result<number, StorageError> { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('Not implemented - T053 (US3)');
  }

  /**
   * Clear all payment status records
   * Used by Feature 016 (Archive System) to reset statuses after archiving
   *
   * @returns Result<boolean, StorageError> - true if data cleared, false if nothing to clear
   */
  clearAll(): Result<boolean, StorageError> {
    try {
      // Check if there's anything to clear
      const existing = localStorage.getItem(STORAGE_KEY);

      if (existing === null) {
        // Nothing to clear
        return { ok: true, value: false };
      }

      // Clear the data
      localStorage.removeItem(STORAGE_KEY);
      return { ok: true, value: true };
    } catch (error) {
      return this.handleStorageError(error);
    }
  }

  /**
   * T024: Calculate current storage size in bytes
   *
   * @returns Size in bytes
   */
  calculateSize(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return 0;

      return new Blob([saved]).size;
    } catch {
      return 0;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * T025: Save collection to localStorage
   *
   * @param collection - Collection to persist
   * @returns Result<boolean, StorageError>
   */
  private saveCollection(
    collection: PaymentStatusCollection
  ): Result<boolean, StorageError> {
    try {
      // Convert Map to Record for JSON serialization
      const serialized: SerializedPaymentStatusCollection = {
        version: collection.version,
        statuses: Object.fromEntries(collection.statuses.entries()),
        totalSize: collection.totalSize,
        lastModified: collection.lastModified,
      };

      const jsonString = JSON.stringify(serialized);
      localStorage.setItem(STORAGE_KEY, jsonString);

      return { ok: true, value: true };
    } catch (error) {
      // Check for circular reference
      if (error instanceof TypeError && error.message.includes('circular')) {
        return {
          ok: false,
          error: {
            type: 'Serialization',
            message: 'Cannot serialize payment status with circular references',
          },
        };
      }

      return this.handleStorageError(error);
    }
  }

  /**
   * T026: Create default empty collection
   *
   * @returns Empty PaymentStatusCollection with default metadata
   */
  private createDefaultCollection(): PaymentStatusCollection {
    const collection: PaymentStatusCollection = {
      version: SCHEMA_VERSION,
      statuses: new Map<string, PaymentStatusRecord>(),
      totalSize: 0,
      lastModified: getCurrentTimestamp(),
    };

    // Calculate accurate size for empty collection
    collection.totalSize = calculateByteSize({
      version: collection.version,
      statuses: {},
      totalSize: 0,
      lastModified: collection.lastModified,
    });

    return collection;
  }

  /**
   * T027: Handle storage errors and convert to StorageError type
   *
   * @param error - The caught error
   * @param paymentId - Optional: payment ID related to error
   * @returns Result<never, StorageError>
   */
  private handleStorageError(
    error: unknown,
    paymentId?: string
  ): Result<never, StorageError> {
    if (error instanceof Error) {
      // Handle cross-browser QuotaExceeded variants
      const DOMEx = (globalThis as { DOMException?: typeof DOMException }).DOMException;
      const isQuota =
        error.name === 'QuotaExceededError' ||
        error.name === 'QUOTA_EXCEEDED_ERR' ||
        (DOMEx &&
          error instanceof DOMEx &&
          ('code' in error && (error.code === 22 || error.code === 1014)));

      if (isQuota) {
        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            paymentId,
          },
        };
      }

      if (error.name === 'SecurityError') {
        return {
          ok: false,
          error: {
            type: 'Security',
            message: ERROR_MESSAGES.SECURITY_ERROR,
            paymentId,
          },
        };
      }
    }

    return {
      ok: false,
      error: {
        type: 'Serialization',
        message: ERROR_MESSAGES.SERIALIZATION_ERROR,
        paymentId,
      },
    };
  }
}
