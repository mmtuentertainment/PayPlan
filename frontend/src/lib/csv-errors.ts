/**
 * Typed error classes for CSV parsing (Issue #27)
 *
 * Replaces fragile string-based phase detection with type-safe error handling.
 * Each error class includes phase information for telemetry tracking.
 */

import type { DelimiterType } from './telemetry';

/**
 * Base class for all CSV parsing errors
 */
abstract class CsvError extends Error {
  abstract readonly phase: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * File size exceeds maximum limit (1MB)
 */
export class CsvSizeError extends CsvError {
  declare readonly phase: 'size';
  declare readonly fileSize: number;
  declare readonly maxSize: number;

  constructor(fileSize: number, maxSize: number) {
    super(`CSV too large (max ${Math.floor(maxSize / 1024 / 1024)}MB)`);
    this.phase = 'size';
    this.fileSize = fileSize;
    this.maxSize = maxSize;
  }
}

/**
 * Row count exceeds maximum limit (1000 rows)
 */
export class CsvRowCountError extends CsvError {
  declare readonly phase: 'rows';
  declare readonly rowCount: number;
  declare readonly maxRows: number;

  constructor(rowCount: number, maxRows: number) {
    super(`Too many rows (max ${maxRows})`);
    this.phase = 'rows';
    this.rowCount = rowCount;
    this.maxRows = maxRows;
  }
}

/**
 * Delimiter detection or mismatch error
 */
export class CsvDelimiterError extends CsvError {
  declare readonly phase: 'delimiter';
  declare readonly detectedDelimiter: DelimiterType;

  constructor(message: string, detectedDelimiter: DelimiterType = 'semicolon') {
    super(message);
    this.phase = 'delimiter';
    this.detectedDelimiter = detectedDelimiter;
  }
}

/**
 * Generic parsing error (structure, field count, etc.)
 */
export class CsvParseError extends CsvError {
  declare readonly phase: 'parse';
  declare readonly rowNumber?: number;

  constructor(message: string, rowNumber?: number) {
    super(message);
    this.phase = 'parse';
    this.rowNumber = rowNumber;
  }
}

/**
 * Date format validation error (YYYY-MM-DD pattern)
 */
export class CsvDateFormatError extends CsvError {
  declare readonly phase: 'date_format';
  declare readonly rowNumber: number;
  declare readonly invalidDate: string;

  constructor(rowNumber: number, invalidDate: string) {
    super(`Invalid date format in row ${rowNumber}. Expected YYYY-MM-DD`);
    this.phase = 'date_format';
    this.rowNumber = rowNumber;
    this.invalidDate = invalidDate;
  }
}

/**
 * Real calendar date validation error (e.g., Feb 30)
 */
export class CsvDateRealError extends CsvError {
  declare readonly phase: 'date_real';
  declare readonly rowNumber: number;
  declare readonly invalidDate: string;

  constructor(rowNumber: number, invalidDate: string) {
    super(`Invalid date in row ${rowNumber}: ${invalidDate}`);
    this.phase = 'date_real';
    this.rowNumber = rowNumber;
    this.invalidDate = invalidDate;
  }
}

/**
 * Currency code validation error (ISO 4217)
 */
export class CsvCurrencyError extends CsvError {
  declare readonly phase: 'currency';
  declare readonly rowNumber: number;
  declare readonly invalidCurrency: string;

  constructor(rowNumber: number, invalidCurrency: string) {
    super(
      `Invalid currency code in row ${rowNumber}: ${invalidCurrency} (expected 3-letter ISO 4217 code)`
    );
    this.phase = 'currency';
    this.rowNumber = rowNumber;
    this.invalidCurrency = invalidCurrency;
  }
}

/**
 * Type guard to check if an error is a CSV parsing error
 */
export function isCsvError(error: unknown): error is CsvError {
  return error instanceof CsvError;
}

/**
 * Extract phase from CSV error for telemetry
 */
export function getErrorPhase(error: unknown): string {
  if (isCsvError(error)) {
    return error.phase;
  }
  return 'parse'; // Default fallback for unknown errors
}
