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
 * Uses Blob API for accurate byte size calculation (handles Unicode correctly).
 *
 * @param data - Data to calculate size for (will be JSON.stringify'd)
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const archive = { id: '...', name: 'October 2025', ... };
 * const size = calculateByteSize(archive);
 * console.log(`Archive size: ${size} bytes`);
 * ```
 */
export function calculateByteSize(data: unknown): number {
  try {
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch {
    return 0;
  }
}

/**
 * Format date range for display
 *
 * Converts ISO date strings to human-readable format.
 * Used in archive statistics panel (User Story 3).
 *
 * @param earliest - ISO date string (YYYY-MM-DD)
 * @param latest - ISO date string (YYYY-MM-DD)
 * @returns Formatted date range (e.g., "Oct 1-31, 2025")
 *
 * @example
 * ```typescript
 * const range = formatDateRange('2025-10-01', '2025-10-31');
 * console.log(range); // "Oct 1-31, 2025"
 * ```
 */
export function formatDateRange(earliest: string, latest: string): string {
  if (!earliest || !latest) {
    return 'No date range';
  }

  try {
    const startDate = new Date(earliest);
    const endDate = new Date(latest);

    // Same day
    if (earliest === latest) {
      return startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Same month and year
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      const month = startDate.toLocaleDateString('en-US', { month: 'short' });
      const year = startDate.getFullYear();
      return `${month} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
    }

    // Different months or years
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    .replace(/[^\w\s-]/g, '')  // Remove special chars (keeps alphanumeric, spaces, hyphens)
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/-+/g, '-')        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Generate archive CSV filename
 *
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

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
 *
 * @param part - Part count
 * @param total - Total count
 * @returns Percentage (0-100) rounded to 1 decimal
 *
 * @example
 * ```typescript
 * calculatePercentage(15, 20); // 75.0
 * calculatePercentage(0, 0);   // 0.0 (safe division by zero)
 * ```
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // Round to 1 decimal
}

/**
 * Sort archives by creation date (newest first)
 *
 * Used for archive list display ordering.
 *
 * @param archives - Array of archives or index entries
 * @returns Sorted array (newest first)
 */
export function sortByCreatedAtDesc<T extends { createdAt: string }>(archives: T[]): T[] {
  return [...archives].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
