/**
 * Archive Utility Functions
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 1 (Setup & Dependencies)
 * Task: T006
 *
 * Helper utilities for UUID generation, timestamp formatting, and calculations.
 * Follows patterns from Feature 015 (payment-status/utils.ts).
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID v4 for archive ID
 *
 * @returns UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * @example
 * ```typescript
 * const archiveId = generateArchiveId();
 * console.log(archiveId); // "550e8400-..."
 * ```
 */
export function generateArchiveId(): string {
  return uuidv4();
}

/**
 * Get current timestamp in ISO 8601 format
 *
 * @returns ISO 8601 timestamp string (e.g., "2025-10-17T14:30:00.000Z")
 *
 * @example
 * ```typescript
 * const now = getCurrentTimestamp();
 * console.log(now); // "2025-10-17T14:30:00.000Z"
 * ```
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate byte size of data for storage quota management
 *
 * CodeRabbit Fix: Return null on error to detect quota calculation failures
 * Uses Blob API for accurate byte size calculation (handles Unicode correctly).
 *
 * @param data - Data to calculate size for (will be JSON.stringify'd)
 * @returns Size in bytes, or null if calculation failed
 *
 * @example
 * ```typescript
 * const archive = { id: '...', name: 'October 2025', ... };
 * const size = calculateByteSize(archive);
 * if (size === null) {
 *   console.error('Failed to calculate size');
 * } else {
 *   console.log(`Archive size: ${size} bytes`);
 * }
 * ```
 */
export function calculateByteSize(data: unknown): number | null {
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.error('Failed to calculate byte size:', error);
    return null;
  }
}

/**
 * Format date range for display
 *
 * CodeRabbit Fix: Use UTC methods, validate dates, support locale parameter
 * Converts ISO date strings to human-readable format.
 * Used in archive statistics panel (User Story 3).
 *
 * @param earliest - ISO date string (YYYY-MM-DD) or null
 * @param latest - ISO date string (YYYY-MM-DD) or null
 * @param locale - Optional locale for formatting (defaults to browser locale)
 * @returns Formatted date range (e.g., "Oct 1-31, 2025")
 *
 * @example
 * ```typescript
 * const range = formatDateRange('2025-10-01', '2025-10-31');
 * console.log(range); // "Oct 1-31, 2025"
 * ```
 */
export function formatDateRange(earliest: string | null, latest: string | null, locale?: string): string {
  if (!earliest || !latest) {
    return 'No date range';
  }

  try {
    const startDate = new Date(earliest + 'T00:00:00Z');
    const endDate = new Date(latest + 'T00:00:00Z');

    // CodeRabbit Fix: Validate dates before using
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid date range';
    }

    // CodeRabbit Fix: Check earliest <= latest to prevent inverted ranges
    if (startDate.getTime() > endDate.getTime()) {
      return 'Invalid date range';
    }

    // Same day
    if (earliest === latest) {
      return startDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }

    // CodeRabbit Fix: Use UTC methods for consistent cross-timezone comparison
    const sameMonth = startDate.getUTCMonth() === endDate.getUTCMonth();
    const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();

    // Same month and year
    if (sameMonth && sameYear) {
      const month = startDate.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });
      const year = startDate.getUTCFullYear();
      return `${month} ${startDate.getUTCDate()}-${endDate.getUTCDate()}, ${year}`;
    }

    // Different months or years
    const start = startDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const end = endDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    return `${start} - ${end}`;
  } catch {
    return 'Invalid date range';
  }
}

/**
 * Slugify archive name for safe filename generation
 *
 * Converts archive name to filesystem-safe format for CSV export filenames.
 * Handles Unicode/emoji by removing special characters.
 *
 * Rules:
 * - Lowercase all characters
 * - Replace spaces with hyphens
 * - Remove Unicode/emoji characters
 * - Remove special characters except hyphens
 * - Collapse multiple hyphens to one
 * - Trim leading/trailing hyphens
 *
 * @param name - Archive name (may contain Unicode)
 * @returns Slugified name (e.g., "october-2025")
 *
 * @example
 * ```typescript
 * slugifyArchiveName('October 2025 💰');  // "october-2025"
 * slugifyArchiveName('Paiements Octobre'); // "paiements-octobre"
 * slugifyArchiveName('十月 2025');         // "2025" (non-ASCII removed)
 * ```
 */
export function slugifyArchiveName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special chars (keeps alphanumeric, underscores, spaces, hyphens)
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Generate archive CSV filename
 *
 * CodeRabbit Fix: Use UTC getters for consistent cross-timezone filenames
 * Creates safe filename from archive name and creation timestamp.
 * Format: payplan-archive-{slugified-name}-{YYYY-MM-DD-HHMMSS}.csv
 *
 * @param archiveName - Archive name (may contain Unicode)
 * @param createdAt - ISO 8601 timestamp
 * @returns Safe filename (e.g., "payplan-archive-october-2025-2025-10-17-143022.csv")
 *
 * @example
 * ```typescript
 * const filename = generateArchiveFilename('October 2025 💰', '2025-10-17T14:30:22.000Z');
 * console.log(filename); // "payplan-archive-october-2025-2025-10-17-143022.csv"
 * ```
 */
export function generateArchiveFilename(archiveName: string, createdAt: string): string {
  const slugified = slugifyArchiveName(archiveName) || 'archive'; // Fallback if all chars removed

  try {
    const date = new Date(createdAt);

    // CodeRabbit Fix: Use UTC getters for timezone-independent filenames
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
    return `payplan-archive-${slugified}-${timestamp}.csv`;
  } catch {
    // Fallback if timestamp invalid
    return `payplan-archive-${slugified}.csv`;
  }
}

/**
 * Calculate percentage with safe rounding
 *
 * Handles division by zero and rounds to 1 decimal place.
 * Validates inputs to ensure they are finite, non-negative, and part <= total.
 *
 * @param part - Part count
 * @param total - Total count
 * @returns Percentage (0-100) rounded to 1 decimal
 * @throws RangeError if inputs are invalid (non-finite, negative, or part > total)
 *
 * @example
 * ```typescript
 * calculatePercentage(15, 20); // 75.0
 * calculatePercentage(0, 0);   // 0.0 (safe division by zero)
 * ```
 */
export function calculatePercentage(part: number, total: number): number {
  // Validate inputs are finite and non-negative
  if (!Number.isFinite(part) || !Number.isFinite(total)) {
    throw new RangeError('Part and total must be finite numbers');
  }
  if (part < 0 || total < 0) {
    throw new RangeError('Part and total must be non-negative');
  }
  if (part > total) {
    throw new RangeError('Part cannot be greater than total');
  }

  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // Round to 1 decimal
}

/**
 * Sort archives by creation date (newest first)
 *
 * Used for archive list display ordering.
 * Handles NaN dates by replacing them with Number.NEGATIVE_INFINITY
 * to ensure deterministic ordering.
 *
 * @param archives - Array of archives or index entries
 * @returns Sorted array (newest first)
 */
export function sortByCreatedAtDesc<T extends { createdAt: string }>(archives: T[]): T[] {
  return [...archives].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();

    // Replace NaN with NEGATIVE_INFINITY to ensure deterministic ordering
    const safeTimeA = isNaN(timeA) ? Number.NEGATIVE_INFINITY : timeA;
    const safeTimeB = isNaN(timeB) ? Number.NEGATIVE_INFINITY : timeB;

    return safeTimeB - safeTimeA;
  });
}
