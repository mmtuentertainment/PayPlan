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
   * 6. Reset payment statuses to pending
   *
   * @param name - User-provided archive name
   * @param payments - Current payment records from app state
   * @returns Result<Archive, ArchiveError> - Created archive or error
   */
  createArchive(
    name: string,
    payments: PaymentRecord[]
  ): Result<Archive, ArchiveError> {
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
      // Rollback: delete archive if index update fails
      // Note: We don't have deleteArchive yet, but this is the intent
      return updateIndexResult;
    }

    // Reset payment statuses (T028)
    const clearResult = this.paymentStatusStorage.clearAll();
    if (!clearResult.ok) {
      // Archive was saved but status reset failed
      // Log warning but return success (archive creation succeeded)
      console.warn('Archive created but failed to reset payment statuses:', clearResult.error);
    }

    return { ok: true, value: archive };
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
    // Load current statuses
    const statusResult = this.paymentStatusStorage.loadStatuses();
    const statuses = statusResult.ok ? statusResult.value.statuses : new Map();

    return payments.map((payment) => {
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

      // Track date range
      const dueDate = record.dueISO;
      if (dueDate) {
        if (earliest === null || dueDate < earliest) {
          earliest = dueDate;
        }
        if (latest === null || dueDate > latest) {
          latest = dueDate;
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
}
