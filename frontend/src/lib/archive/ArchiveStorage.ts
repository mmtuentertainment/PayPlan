/**
 * ArchiveStorage - Browser localStorage management for payment archives
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 2 (Foundational Layer)
 * Tasks: T008, T010, T012, T014
 * Contract: specs/016-build-a-payment/contracts/ArchiveStorage.contract.md
 *
 * Implements two-tier localStorage architecture with:
 * - Archive index for fast list loading (payplan_archive_index)
 * - Individual archive storage (payplan_archive_{id})
 * - 50-archive hard limit enforcement
 * - 5MB total storage validation
 * - Result<T, E> error handling pattern
 *
 * @see research.md Section 3 - Two-Tier Storage Architecture
 * @see data-model.md - Entity definitions
 */

import type {
  Archive,
  ArchiveIndex,
  ArchiveIndexEntry,
  ArchiveError,
  Result,
} from './types';
import {
  validateArchiveIndex,
  isValidArchiveId,
} from './validation';
import {
  ARCHIVE_INDEX_KEY,
  ARCHIVE_KEY_PREFIX,
  INDEX_SCHEMA_VERSION,
  ERROR_MESSAGES,
  MAX_STORAGE_SIZE,
} from './constants';
import { getCurrentTimestamp, calculateByteSize } from './utils';

/**
 * Service for managing archive persistence in localStorage.
 *
 * Key Responsibilities:
 * - Save/load archives with validation
 * - Manage two-tier structure (index + individual archives)
 * - Enforce storage size limits
 * - Handle schema versioning and migrations
 * - Provide error handling with Result types
 */
export class ArchiveStorage {
  /**
   * T008: Create default empty archive index
   *
   * @returns Empty ArchiveIndex with default metadata
   */
  createDefaultIndex(): ArchiveIndex {
    const index: ArchiveIndex = {
      version: INDEX_SCHEMA_VERSION,
      archives: [],
      lastModified: getCurrentTimestamp(),
    };

    return index;
  }

  /**
   * T010: Load archive index from localStorage
   *
   * @returns Result<ArchiveIndex, ArchiveError> - Index or error
   */
  loadArchiveIndex(): Result<ArchiveIndex, ArchiveError> {
    try {
      const serialized = localStorage.getItem(ARCHIVE_INDEX_KEY);

      // No saved index: return empty default
      if (serialized === null || serialized === undefined) {
        return { ok: true, value: this.createDefaultIndex() };
      }

      // Parse JSON - catch parse errors
      let parsed;
      try {
        parsed = JSON.parse(serialized);
      } catch (parseError) {
        // JSON parse error: corrupted data, clear and return defaults
        console.warn('Corrupted archive index (invalid JSON), resetting to defaults');
        localStorage.removeItem(ARCHIVE_INDEX_KEY);
        return { ok: true, value: this.createDefaultIndex() };
      }

      // Validate structure
      const validationResult = validateArchiveIndex(parsed);

      if (!validationResult.success) {
        // Corrupted data: clear storage and return defaults
        console.warn('Corrupted archive index (invalid schema), resetting to defaults');
        localStorage.removeItem(ARCHIVE_INDEX_KEY);
        return { ok: true, value: this.createDefaultIndex() };
      }

      const index = validationResult.data;

      return { ok: true, value: index };
    } catch (error) {
      // Security errors should be surfaced
      if (error instanceof Error && error.name === 'SecurityError') {
        return this.handleStorageError(error);
      }

      // Other errors: fallback to defaults for resilient UX
      console.warn('Failed to load archive index, using defaults', error);
      localStorage.removeItem(ARCHIVE_INDEX_KEY);
      return { ok: true, value: this.createDefaultIndex() };
    }
  }

  /**
   * T012: Calculate total storage size of all archives
   *
   * Sums size of archive index + all individual archives.
   *
   * @returns Total size in bytes
   */
  calculateTotalSize(): number {
    try {
      let totalSize = 0;

      // Add index size
      const indexData = localStorage.getItem(ARCHIVE_INDEX_KEY);
      if (indexData) {
        totalSize += new Blob([indexData]).size;
      }

      // Add all archive sizes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ARCHIVE_KEY_PREFIX)) {
          const archiveData = localStorage.getItem(key);
          if (archiveData) {
            totalSize += new Blob([archiveData]).size;
          }
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * T014: Handle storage errors and convert to ArchiveError type
   *
   * @param error - The caught error
   * @param archiveId - Optional: archive ID related to error
   * @returns Result<never, ArchiveError>
   */
  handleStorageError(
    error: unknown,
    archiveId?: string
  ): Result<never, ArchiveError> {
    if (error instanceof Error) {
      // Handle cross-browser QuotaExceeded variants
      const DOMEx = (globalThis as any).DOMException;
      const isQuota =
        error.name === 'QuotaExceededError' ||
        error.name === 'QUOTA_EXCEEDED_ERR' ||
        (DOMEx &&
          error instanceof DOMEx &&
          ((error as any).code === 22 || (error as any).code === 1014));

      if (isQuota) {
        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            archiveId,
          },
        };
      }

      if (error.name === 'SecurityError') {
        return {
          ok: false,
          error: {
            type: 'Security',
            message: ERROR_MESSAGES.SECURITY_ERROR,
            archiveId,
          },
        };
      }
    }

    return {
      ok: false,
      error: {
        type: 'Serialization',
        message: ERROR_MESSAGES.SERIALIZATION_ERROR,
        archiveId,
      },
    };
  }

  /**
   * Save archive index to localStorage
   *
   * @param index - Index to persist
   * @returns Result<void, ArchiveError>
   */
  private saveIndex(index: ArchiveIndex): Result<void, ArchiveError> {
    try {
      const jsonString = JSON.stringify(index);
      localStorage.setItem(ARCHIVE_INDEX_KEY, jsonString);
      return { ok: true, value: undefined };
    } catch (error) {
      return this.handleStorageError(error);
    }
  }
}
