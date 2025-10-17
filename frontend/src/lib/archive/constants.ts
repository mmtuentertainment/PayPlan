/**
 * Archive Constants
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 1 (Setup & Dependencies)
 * Task: T004
 *
 * Storage keys, limits, and configuration constants for archive system.
 *
 * SOLUTION (from SOLUTIONS.md Section 4):
 * Storage keys use UNDERSCORES (not colons) to match Feature 015 pattern:
 * - Feature 015: 'payplan_payment_status'
 * - Feature 016: 'payplan_archive_index', 'payplan_archive_{id}'
 */

import type { DateRange } from './types';

/**
 * localStorage Keys
 */

/** Archive index key - stores ArchiveIndex with metadata for all archives */
export const ARCHIVE_INDEX_KEY = 'payplan_archive_index';

/** Archive key prefix - individual archives stored as payplan_archive_{uuid} */
export const ARCHIVE_KEY_PREFIX = 'payplan_archive_';

/**
 * Helper to generate archive storage key from ID
 *
 * @param archiveId - Archive UUID
 * @returns Storage key (e.g., "payplan_archive_550e8400-...")
 * @throws Error if archiveId is not a valid UUID v4
 */
export function getArchiveKey(archiveId: string): string {
  // Validate UUID v4 format before concatenating
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(archiveId)) {
    // CodeRabbit Fix: Use ERROR_MESSAGES constant instead of hardcoded string
    throw new Error(ERROR_MESSAGES.INVALID_ARCHIVE_ID);
  }
  return `${ARCHIVE_KEY_PREFIX}${archiveId}`;
}

/**
 * Archive Limits
 */

/** Maximum number of archives allowed (FR-006) */
export const MAX_ARCHIVES = 50;

/** Total storage limit in bytes (5MB per FR-015) */
export const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

/** Storage warning threshold (80% of max, recommend cleanup) */
// CodeRabbit Fix: Use Math.floor for integer threshold (avoid floating-point precision)
export const STORAGE_WARNING_THRESHOLD = Math.floor(0.8 * MAX_STORAGE_SIZE); // 4MB

/**
 * Schema Versioning
 */

/** Current archive schema version (semantic versioning) */
export const SCHEMA_VERSION = '1.0.0';

/** Current archive index schema version */
export const INDEX_SCHEMA_VERSION = '1.0.0';

/**
 * Archive Name Constraints
 */

/** Minimum archive name length (after trimming) - CodeRabbit: Changed from 1 to 3 for financial records */
export const MIN_NAME_LENGTH = 3;

/** Maximum archive name length (supports long Unicode names) */
export const MAX_NAME_LENGTH = 100;

/**
 * Error Messages
 */

export const ERROR_MESSAGES = {
  // Validation errors
  INVALID_ARCHIVE_ID: 'Invalid archive ID',
  EMPTY_NAME: 'Archive name cannot be empty',
  NAME_TOO_LONG: `Archive name must be under ${MAX_NAME_LENGTH} characters`,
  NO_PAYMENTS: 'No payments to archive. Import or process payments first.',

  // Limit errors
  ARCHIVE_LIMIT_REACHED: `Archive limit reached (${MAX_ARCHIVES}/${MAX_ARCHIVES}). Delete old archives to create new ones.`,
  QUOTA_EXCEEDED: 'Storage limit exceeded (5MB). Delete old archives to free space.',

  // Storage errors
  SECURITY_ERROR: 'localStorage is disabled or blocked. Enable browser storage to use archives.',
  SERIALIZATION_ERROR: 'Failed to serialize archive data. Please try again.',
  CORRUPTED_ARCHIVE: 'This archive is corrupted and cannot be viewed',
  ARCHIVE_NOT_FOUND: 'Archive not found. It may have been deleted.',

  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Performance Targets (from Success Criteria)
 */

export const PERFORMANCE_TARGETS = {
  /** Archive list load time (SC-004) */
  LIST_LOAD_MS: 100,

  /** Archive detail load time (SC-003) */
  DETAIL_LOAD_MS: 100,

  /** Archive creation time (SC-001) */
  CREATE_ARCHIVE_MS: 5000,

  /** CSV export time (SC-006) */
  CSV_EXPORT_MS: 3000,

  /** Archive deletion time (SC-007) */
  DELETE_ARCHIVE_MS: 3000,
} as const;

/**
 * Default Values
 */

/** Default archive status when none specified */
export const DEFAULT_ARCHIVE_VERSION = '1.0.0';

/** Default empty date range (for archives with no payments - edge case) */
/** CodeRabbit Fix: Use null instead of empty strings to prevent date parsing errors */
export const DEFAULT_DATE_RANGE: DateRange = {
  earliest: null,
  latest: null,
};
