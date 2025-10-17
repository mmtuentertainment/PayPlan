/**
 * Archive Type Definitions
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 1 (Setup & Dependencies)
 * Task: T003
 *
 * Type system for payment history archive with localStorage persistence.
 * All types follow the data model from:
 * specs/016-build-a-payment/data-model.md
 *
 * @see SOLUTIONS.md - PaymentArchiveRecord combines status + payment snapshot
 */

import type { PaymentStatus } from '@/lib/payment-status/types';

/**
 * T003: PaymentArchiveRecord
 *
 * Represents a single payment's status at the time of archiving.
 * SOLUTION: Combines PaymentStatusRecord (Feature 015) with full PaymentRecord snapshot.
 *
 * This solves the data integration issue: archives need both status tracking
 * AND full payment details (provider, amount, etc.) for read-only viewing.
 *
 * @property paymentId - Unique identifier for the payment (UUID v4)
 * @property status - Payment status at archive time (paid or pending)
 * @property timestamp - ISO 8601 date-time when status was last updated
 * @property provider - Provider name (e.g., "Klarna", "Electricity Bill")
 * @property amount - Payment amount (e.g., 45.00)
 * @property currency - ISO 4217 currency code (e.g., "USD", "EUR")
 * @property dueISO - Payment due date in ISO 8601 format (YYYY-MM-DD)
 * @property autopay - Autopay enabled/disabled
 * @property risk_type - Optional: Risk category (from risk analysis)
 * @property risk_severity - Optional: Risk severity level
 * @property risk_message - Optional: Risk description message
 *
 * @see data-model.md Section: PaymentArchiveRecord
 * @see SOLUTIONS.md Section 1: Payment Data Integration
 */
export interface PaymentArchiveRecord {
  // Status data (from Feature 015 PaymentStatusRecord)
  paymentId: string;
  status: PaymentStatus;
  timestamp: string;

  // Payment snapshot (from PaymentRecord - Feature 014)
  provider: string;
  amount: number;
  currency: string;
  dueISO: string;
  autopay: boolean;

  // Optional risk data (snapshot at archive time)
  risk_type?: string;
  risk_severity?: string;
  risk_message?: string;
}

/**
 * T003: DateRange
 *
 * Represents the span of payment dates within an archive.
 * Used for displaying "Date Range: Oct 1-31, 2025" in statistics.
 *
 * @property earliest - Earliest payment due date (YYYY-MM-DD)
 * @property latest - Latest payment due date (YYYY-MM-DD)
 *
 * @see data-model.md Section: DateRange
 */
export interface DateRange {
  earliest: string;
  latest: string;
}

/**
 * T003: ArchiveMetadata
 *
 * Lightweight summary data for an archive used in list views.
 * Enables fast archive list loading without reading full payment arrays.
 *
 * @property totalCount - Total number of payment records
 * @property paidCount - Count of payments marked as paid
 * @property pendingCount - Count of payments marked as pending
 * @property dateRange - Earliest and latest payment dates
 * @property storageSize - Archive size in bytes
 *
 * Business Rule: paidCount + pendingCount MUST equal totalCount
 *
 * @see data-model.md Section: ArchiveMetadata
 */
export interface ArchiveMetadata {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  dateRange: DateRange;
  storageSize: number;
}

/**
 * T003: Archive
 *
 * Represents a complete immutable snapshot of payment status history.
 * Archives are created when users want to preserve tracking data before
 * starting a new billing cycle.
 *
 * @property id - Unique archive identifier (UUID v4)
 * @property name - User-defined archive name (supports Unicode/emoji)
 * @property createdAt - ISO 8601 timestamp when archive was created
 * @property sourceVersion - Schema version for future migrations ("1.0.0")
 * @property payments - Array of archived payment records with statuses
 * @property metadata - Calculated statistics (counts, date range, size)
 *
 * Business Rules:
 * - Archives are immutable (no update operations)
 * - Duplicate names auto-append " (2)", " (3)", etc.
 * - Unicode/emoji names are supported
 *
 * @see data-model.md Section: Archive
 */
export interface Archive {
  id: string;
  name: string;
  createdAt: string;
  sourceVersion: string;
  payments: PaymentArchiveRecord[];
  metadata: ArchiveMetadata;
}

/**
 * T003: ArchiveIndexEntry
 *
 * Metadata entry stored in the archive index for fast list display.
 * Contains only essential data needed for archive list views.
 *
 * @property id - Archive UUID
 * @property name - Archive name
 * @property createdAt - Archive creation timestamp
 * @property paymentCount - Total number of payments
 * @property paidCount - Number of paid payments
 * @property pendingCount - Number of pending payments
 *
 * @see data-model.md Section: ArchiveIndex
 */
export interface ArchiveIndexEntry {
  id: string;
  name: string;
  createdAt: string;
  paymentCount: number;
  paidCount: number;
  pendingCount: number;
}

/**
 * T003: ArchiveIndex
 *
 * Central registry of all archives for the user.
 * Stored at localStorage key "payplan_archive_index".
 * Enables fast list loading without reading full archive data.
 *
 * @property version - Schema version (semantic versioning)
 * @property archives - Array of archive metadata entries
 * @property lastModified - ISO 8601 timestamp when index was last updated
 *
 * Business Rules:
 * - Maximum 50 archives (hard limit per FR-006)
 * - Sorted by createdAt descending (newest first)
 * - Updated atomically when archives created/deleted
 *
 * @see data-model.md Section: ArchiveIndex
 * @see research.md Section 3: Two-Tier Storage Architecture
 */
export interface ArchiveIndex {
  version: string;
  archives: ArchiveIndexEntry[];
  lastModified: string;
}

/**
 * Serialized version of ArchiveIndex for localStorage.
 * (Currently same as ArchiveIndex since no Maps used)
 */
export type SerializedArchiveIndex = ArchiveIndex;

/**
 * T003: ArchiveSummary
 *
 * Calculated statistics for an archive displayed in statistics panel.
 * Used by User Story 3 (View Archive Statistics).
 *
 * @property totalCount - Total number of payments
 * @property paidCount - Number of paid payments
 * @property pendingCount - Number of pending payments
 * @property paidPercentage - Paid percentage (0-100)
 * @property pendingPercentage - Pending percentage (0-100)
 * @property dateRange - Date span from earliest to latest payment
 * @property averageAmount - Average payment amount (optional, multi-currency may skip)
 * @property currency - Currency for average (if all payments same currency)
 *
 * Business Rules:
 * - Percentages sum to 100% (or close with rounding)
 * - averageAmount only calculated if all payments same currency
 * - Division by zero handled (0 payments → 0%)
 *
 * @see data-model.md Section: ArchiveSummary
 */
export interface ArchiveSummary {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  paidPercentage: number;
  pendingPercentage: number;
  dateRange: DateRange;
  averageAmount?: number;
  currency?: string;
}

/**
 * T003: ArchiveError types
 *
 * Error types for archive operations following the Result pattern.
 */

/**
 * Archive error types
 * - Validation: Invalid data format or schema violation
 * - QuotaExceeded: Browser storage limit reached (5MB)
 * - LimitReached: 50-archive hard limit reached
 * - NotFound: Archive doesn't exist
 * - Corrupted: Archive data is corrupted (invalid JSON)
 * - Security: localStorage disabled or blocked
 * - Serialization: JSON.stringify/parse failed
 *
 * @see contracts/ArchiveStorage.contract.md - Error Types
 */
export type ArchiveErrorType =
  | 'Validation'
  | 'QuotaExceeded'
  | 'LimitReached'
  | 'NotFound'
  | 'Corrupted'
  | 'Security'
  | 'Serialization';

/**
 * Archive error object
 *
 * @property type - Error type classification
 * @property message - Human-readable error message
 * @property archiveId - Optional: archive ID that caused the error
 */
export interface ArchiveError {
  type: ArchiveErrorType;
  message: string;
  archiveId?: string;
}

/**
 * T003: Result<T, E> type
 *
 * Rust-inspired Result type for explicit error handling.
 * Reuses pattern from Feature 015 (PaymentStatusStorage).
 *
 * @example
 * ```typescript
 * const result = archiveStorage.saveArchive(archive);
 * if (result.ok) {
 *   console.log('Saved:', result.value);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export type Result<T, E = ArchiveError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Type guard: Check if value is a valid ArchiveIndexEntry
 */
export function isArchiveIndexEntry(value: unknown): value is ArchiveIndexEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ArchiveIndexEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.createdAt === 'string' &&
    typeof entry.paymentCount === 'number' &&
    typeof entry.paidCount === 'number' &&
    typeof entry.pendingCount === 'number'
  );
}

/**
 * Type guard: Check if value is a valid Archive
 */
export function isArchive(value: unknown): value is Archive {
  if (!value || typeof value !== 'object') return false;
  const archive = value as Partial<Archive>;
  return (
    typeof archive.id === 'string' &&
    typeof archive.name === 'string' &&
    typeof archive.createdAt === 'string' &&
    typeof archive.sourceVersion === 'string' &&
    Array.isArray(archive.payments) &&
    archive.metadata !== undefined
  );
}
