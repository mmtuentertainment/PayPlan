/**
 * Archive-Specific Error Classes
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting) - Phase F: F5
 *
 * Custom error classes for archive operations.
 * Enables instanceof checking instead of string matching.
 */

/**
 * Base class for all archive-related errors
 */
export class ArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveError';
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when archive data cannot be parsed
 * Usually indicates corrupted JSON in localStorage
 */
export class ArchiveParseError extends ArchiveError {
  constructor(message: string = 'Failed to parse archive data') {
    super(message);
    this.name = 'ArchiveParseError';
  }
}

/**
 * Error thrown when archive data fails validation
 * Indicates data doesn't match expected schema
 */
export class ArchiveValidationError extends ArchiveError {
  constructor(message: string = 'Archive validation failed') {
    super(message);
    this.name = 'ArchiveValidationError';
  }
}

/**
 * Error thrown when archive operations encounter quota limits
 * (5MB storage limit or 50 archive limit)
 */
export class ArchiveQuotaError extends ArchiveError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message);
    this.name = 'ArchiveQuotaError';
  }
}

/**
 * Error thrown when requested archive is not found
 */
export class ArchiveNotFoundError extends ArchiveError {
  constructor(archiveId: string) {
    super(`Archive not found: ${archiveId}`);
    this.name = 'ArchiveNotFoundError';
  }
}

/**
 * Check if an error is a corrupted data error
 * (either parse error or validation error)
 *
 * @param error - Error to check
 * @returns true if error indicates corrupted archive data
 */
export function isCorruptedDataError(error: Error): boolean {
  return error instanceof ArchiveParseError || error instanceof ArchiveValidationError;
}
