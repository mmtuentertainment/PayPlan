/**
 * ArchiveService - Business logic layer for payment archive operations
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Tasks: T016, T018, T020, T022, T028, T030, T032, T034, T036
 * Contract: specs/016-build-a-payment/contracts/ArchiveService.contract.md
 *
 * Implements archive creation with:
 * - Payment data + status joining (PaymentArchiveRecord)
 * - Metadata calculation (counts, date range)
 * - Unique name generation (auto-append " (2)")
 * - Validation (empty name, no payments, limits)
 * - Status reset after successful archive
 * - Result<T, E> error handling pattern
 *
 * @see SOLUTIONS.md Section 1 - Payment Data Integration
 * @see data-model.md - Entity definitions
 */

import type {
  Archive,
  ArchiveMetadata,
  PaymentArchiveRecord,
  ArchiveError,
  Result,
  DateRange,
} from './types';
import type { PaymentRecord } from '@/types/csvExport';
import { ArchiveStorage } from './ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';
import { validateArchiveName } from './validation';
import {
  generateArchiveId,
  getCurrentTimestamp,
  calculateByteSize,
} from './utils';
import {
  MAX_ARCHIVES,
  MAX_STORAGE_SIZE,
  ERROR_MESSAGES,
  SCHEMA_VERSION,
  DEFAULT_DATE_RANGE,
} from './constants';

/**
 * Service for managing payment archive business logic.
 *
 * Key Responsibilities:
 * - Create archives from current payments + statuses
 * - Join payment data with status tracking
 * - Calculate archive metadata (counts, date range)
 * - Enforce naming rules (unique names, validation)
 * - Enforce storage limits (50 archives, 5MB total)
 * - Reset payment statuses after successful archive
 */
export class ArchiveService {
  constructor(
    private archiveStorage: ArchiveStorage,
    private paymentStatusStorage: PaymentStatusStorage
  ) {}

  /**
   * T016: Create new payment archive from current data
   *
   * SOLUTION (from SOLUTIONS.md):
   * 1. Load current payment statuses
   * 2. Join payments with statuses to create PaymentArchiveRecord[]
   * 3. Calculate metadata (counts, date range, size)
   * 4. Ensure unique name (auto-append " (2)" if needed)
   * 5. Save archive to storage
   * 6. Reset payment statuses to pending (with retry logic)
   *
   * @param name - User-provided archive name
   * @param payments - Current payment records from app state
   * @returns Promise<Result<Archive, ArchiveError>> - Created archive or error
   */
  async createArchive(
    name: string,
    payments: PaymentRecord[]
  ): Promise<Result<Archive, ArchiveError>> {
    // Validate name (T030)
    const nameValidation = validateArchiveName(name);
    if (!nameValidation.ok) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: nameValidation.error.message,
        },
      };
    }
    const trimmedName = nameValidation.value;

    // Validate payments array not empty (T032)
    if (payments.length === 0) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.NO_PAYMENTS,
        },
      };
    }

    // Check archive count limit (T034)
    const indexResult = this.archiveStorage.loadArchiveIndex();
    if (!indexResult.ok) {
      return indexResult as Result<never, ArchiveError>;
    }
    const index = indexResult.value;

    if (index.archives.length >= MAX_ARCHIVES) {
      return {
        ok: false,
        error: {
          type: 'LimitReached',
          message: ERROR_MESSAGES.ARCHIVE_LIMIT_REACHED,
        },
      };
    }

    // Check storage size limit BEFORE creating archive (T036)
    const currentSize = this.archiveStorage.calculateTotalSize();
    if (currentSize >= MAX_STORAGE_SIZE) {
      return {
        ok: false,
        error: {
          type: 'QuotaExceeded',
          message: ERROR_MESSAGES.QUOTA_EXCEEDED,
        },
      };
    }

    // Join payments with statuses (T018)
    const archiveRecords = this.joinPaymentsWithStatuses(payments);

    // Generate unique name (T022)
    const uniqueName = this.ensureUniqueName(trimmedName, index.archives.map(a => a.name));

    // Calculate metadata (T020)
    const metadata = this.calculateArchiveMetadata(archiveRecords);

    // Create archive entity
    const archive: Archive = {
      id: generateArchiveId(),
      name: uniqueName,
      createdAt: getCurrentTimestamp(),
      sourceVersion: SCHEMA_VERSION,
      payments: archiveRecords,
      metadata,
    };

    // Check estimated size
    const archiveSize = calculateByteSize(archive);
    if (archiveSize === null) {
      return {
        ok: false,
        error: {
          type: 'Serialization',
          message: ERROR_MESSAGES.SERIALIZATION_ERROR,
        },
      };
    }

    // Check if adding this archive would exceed storage limit
    if (currentSize + archiveSize > MAX_STORAGE_SIZE) {
      return {
        ok: false,
        error: {
          type: 'QuotaExceeded',
          message: ERROR_MESSAGES.QUOTA_EXCEEDED,
        },
      };
    }

    // Save archive to storage
    const saveResult = this.archiveStorage.saveArchive(archive);
    if (!saveResult.ok) {
      return saveResult;
    }

    // Update index
    const updateIndexResult = this.archiveStorage.updateIndex({
      id: archive.id,
      name: archive.name,
      createdAt: archive.createdAt,
      paymentCount: metadata.totalCount,
      paidCount: metadata.paidCount,
      pendingCount: metadata.pendingCount,
    });

    if (!updateIndexResult.ok) {
      // CRITICAL: Rollback - delete orphaned archive if index update fails
      console.warn(`Index update failed for archive ${archive.id}, performing rollback`);
      const deleteResult = this.archiveStorage.deleteArchive(archive.id);

      if (!deleteResult.ok) {
        console.error(`Rollback failed: Could not delete orphaned archive ${archive.id}`);
      } else {
        console.info(`Rollback successful: Deleted orphaned archive ${archive.id}`);
      }

      // Return the original index update error with rollback context
      return {
        ok: false,
        error: {
          ...updateIndexResult.error,
          message: `${updateIndexResult.error.message} (Archive was rolled back)`,
        },
      };
    }

    // Reset payment statuses (T028) with retry logic for better UX
    // Note: Archive was successfully created, so we always return success
    // even if status reset fails after retries
    await this.resetPaymentStatusesWithRetry();

    return { ok: true, value: archive };
  }

  /**
   * Reset payment statuses with retry logic
   *
   * Attempts to clear payment statuses up to 3 times with delays.
   * Always resolves (doesn't throw) since archive creation already succeeded.
   * Logs warning only if all retries fail.
   *
   * @private
   */
  private async resetPaymentStatusesWithRetry(): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 100;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const clearResult = this.paymentStatusStorage.clearAll();

      if (clearResult.ok) {
        if (attempt > 1) {
          console.info(`Payment statuses reset succeeded on attempt ${attempt}`);
        }
        return; // Success
      }

      // If not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    // All retries failed - log warning but don't throw (archive creation succeeded)
    console.warn(`Failed to reset payment statuses after ${MAX_RETRIES} attempts. Archive was created successfully.`);
  }

  /**
   * T018: Join payments with statuses to create PaymentArchiveRecord[]
   *
   * Combines PaymentRecord (from app state) with PaymentStatusRecord (from storage).
   * Creates complete snapshot with both payment data and status tracking.
   *
   * @param payments - Current payment records
   * @returns Array of PaymentArchiveRecord with joined data
   */
  joinPaymentsWithStatuses(payments: PaymentRecord[]): PaymentArchiveRecord[] {
    // Load current statuses with error checking
    const statusResult = this.paymentStatusStorage.loadStatuses();

    // If status loading fails, log warning but continue with defaults
    if (!statusResult.ok) {
      console.warn('Failed to load payment statuses:', statusResult.error);
    }

    const statuses = statusResult.ok ? statusResult.value.statuses : new Map();

    return payments.map((payment) => {
      // Validate payment.id exists before using
      if (!payment.id) {
        console.warn('Payment missing ID, cannot join with status:', payment);
      }

      const paymentId = payment.id || '';
      const statusRecord = statuses.get(paymentId);

      const record: PaymentArchiveRecord = {
        // Status data (from Feature 015)
        paymentId,
        status: statusRecord?.status || 'pending',
        timestamp: statusRecord?.timestamp || '',

        // Payment snapshot (from PaymentRecord - Feature 014)
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        dueISO: payment.dueISO,
        autopay: payment.autopay,

        // Optional risk data (snapshot at archive time)
        risk_type: payment.risk_type,
        risk_severity: payment.risk_severity,
        risk_message: payment.risk_message,
      };

      return record;
    });
  }

  /**
   * T020: Calculate archive metadata from payment records
   *
   * Calculates:
   * - Total count of payments
   * - Count of paid payments
   * - Count of pending payments
   * - Date range (earliest to latest due date)
   * - Storage size estimate
   *
   * @param records - Array of payment archive records
   * @returns ArchiveMetadata with calculated statistics
   */
  calculateArchiveMetadata(records: PaymentArchiveRecord[]): ArchiveMetadata {
    const totalCount = records.length;
    let paidCount = 0;
    let pendingCount = 0;
    let earliest: string | null = null;
    let latest: string | null = null;

    for (const record of records) {
      // Count statuses
      if (record.status === 'paid') {
        paidCount++;
      } else if (record.status === 'pending') {
        pendingCount++;
      }

      // Track date range with validation
      const dueDate = record.dueISO;
      if (dueDate) {
        // Validate date string before comparison
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
          console.warn('Invalid date format in dueISO:', dueDate);
          continue;
        }

        // Use Date objects for comparison
        if (earliest === null) {
          earliest = dueDate;
        } else {
          const earliestDate = new Date(earliest);
          if (dueDateObj < earliestDate) {
            earliest = dueDate;
          }
        }

        if (latest === null) {
          latest = dueDate;
        } else {
          const latestDate = new Date(latest);
          if (dueDateObj > latestDate) {
            latest = dueDate;
          }
        }
      }
    }

    const dateRange: DateRange = {
      earliest,
      latest,
    };

    // Calculate storage size (will be recalculated after full archive creation)
    const storageSize = calculateByteSize(records) || 0;

    return {
      totalCount,
      paidCount,
      pendingCount,
      dateRange,
      storageSize,
    };
  }

  /**
   * T022: Ensure archive name is unique by auto-appending " (2)", " (3)", etc.
   *
   * Business Rule: Duplicate names are not allowed.
   * Solution: Auto-append incrementing counter in parentheses.
   *
   * Examples:
   * - "October 2025" -> "October 2025" (if unique)
   * - "October 2025" -> "October 2025 (2)" (if "October 2025" exists)
   * - "October 2025 (2)" -> "October 2025 (3)" (if both exist)
   *
   * @param name - Desired archive name
   * @param existingNames - Array of existing archive names
   * @returns Unique name with counter suffix if needed
   */
  ensureUniqueName(name: string, existingNames: string[]): string {
    const nameSet = new Set(existingNames);

    // If name is unique, return as-is
    if (!nameSet.has(name)) {
      return name;
    }

    // Find next available counter
    let counter = 2;
    let candidateName = `${name} (${counter})`;

    while (nameSet.has(candidateName)) {
      counter++;
      candidateName = `${name} (${counter})`;
    }

    return candidateName;
  }

  /**
   * T050: List all archives from index
   *
   * Returns archive metadata for list view.
   * Uses two-tier architecture for fast loading.
   *
   * @returns Result<ArchiveIndexEntry[], ArchiveError> - Array of archive entries or error
   */
  listArchives(): Result<ArchiveIndexEntry[], ArchiveError> {
    const indexResult = this.archiveStorage.loadArchiveIndex();

    // CodeRabbit Fix: Proper error propagation without unsafe type assertion
    if (!indexResult.ok) {
      return { ok: false, error: indexResult.error };
    }

    return { ok: true, value: indexResult.value.archives };
  }

  /**
   * T054: Get archive by ID for detail view
   *
   * Business logic wrapper for loading full archive data.
   * Used by detail view to display complete archive.
   *
   * @param archiveId - Archive UUID to load
   * @returns Result<Archive, ArchiveError> - Full archive or error
   */
  getArchiveById(archiveId: string): Result<Archive, ArchiveError> {
    return this.archiveStorage.loadArchive(archiveId);
  }
}
