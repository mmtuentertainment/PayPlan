/**
 * Payment Status Utility Functions
 *
 * Feature: 015-build-a-payment
 * Phase: 2 (Foundational)
 * Tasks: T010, T011
 *
 * Helper utilities for payment status tracking.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * T010: Generate a new UUID v4
 *
 * Creates a unique identifier for a payment.
 * Used when assigning IDs to payments at creation time.
 *
 * @returns UUID v4 string (RFC 4122 format)
 *
 * @example
 * ```typescript
 * const paymentId = generatePaymentId();
 * // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 *
 * @see research.md Section 1: Unique Payment Identification Strategy
 */
export function generatePaymentId(): string {
  return uuidv4();
}

/**
 * T011: Get current timestamp in ISO 8601 format
 *
 * Returns the current date-time in ISO 8601 format with timezone.
 * Used for timestamp fields in PaymentStatusRecord.
 *
 * @returns ISO 8601 date-time string (e.g., "2025-10-15T14:30:00.000Z")
 *
 * @example
 * ```typescript
 * const timestamp = getCurrentTimestamp();
 * // "2025-10-15T14:30:00.123Z"
 * ```
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format timestamp for human-readable display
 *
 * Converts ISO 8601 timestamp to user-friendly format.
 * Used for UI display (FR-017: "Paid on Oct 15, 2025 at 2:30 PM").
 *
 * @param isoTimestamp - ISO 8601 timestamp string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted timestamp string
 *
 * @example
 * ```typescript
 * formatTimestamp("2025-10-15T14:30:00.000Z");
 * // "Paid on Oct 15, 2025 at 2:30 PM"
 * ```
 */
export function formatTimestamp(
  isoTimestamp: string,
  locale: string = 'en-US'
): string {
  const date = new Date(isoTimestamp);

  const dateStr = date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `Paid on ${dateStr} at ${timeStr}`;
}

/**
 * Calculate size of a JavaScript value in bytes
 *
 * Uses JSON.stringify + Blob to get accurate UTF-8 byte count.
 * Used for storage size calculations (FR-014: 5KB limit).
 *
 * @param value - Any JSON-serializable value
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const size = calculateByteSize({ foo: 'bar' });
 * // 13 bytes
 * ```
 */
export function calculateByteSize(value: unknown): number {
  try {
    const json = JSON.stringify(value);
    return new Blob([json]).size;
  } catch {
    return 0;
  }
}

/**
 * Check if browser localStorage is available
 *
 * Tests for localStorage availability and functionality.
 * Some browsers disable localStorage in private/incognito mode.
 *
 * @returns true if localStorage is available, false otherwise
 *
 * @example
 * ```typescript
 * if (!isLocalStorageAvailable()) {
 *   showError('localStorage is not available');
 * }
 * ```
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__payplan_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON with error handling
 *
 * @param json - JSON string to parse
 * @returns Parsed object or null if parsing fails
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Safely stringify value to JSON
 *
 * @param value - Value to stringify
 * @returns JSON string or null if serialization fails
 */
export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Deep clone a value using JSON serialization
 *
 * @param value - Value to clone
 * @returns Cloned value or null if cloning fails
 */
export function deepClone<T>(value: T): T | null {
  const json = safeJsonStringify(value);
  if (json === null) return null;
  return safeJsonParse<T>(json);
}
