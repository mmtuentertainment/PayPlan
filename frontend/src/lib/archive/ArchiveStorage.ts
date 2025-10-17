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
  validateArchive,
} from './validation';
import {
  ARCHIVE_INDEX_KEY,
  ARCHIVE_KEY_PREFIX,
  INDEX_SCHEMA_VERSION,
  ERROR_MESSAGES,
  MAX_STORAGE_SIZE,
  MAX_ARCHIVES,
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

      // CodeRabbit Fix: Remove redundant undefined check (localStorage.getItem returns string | null)
      if (serialized === null) {
        return { ok: true, value: this.createDefaultIndex() };
      }

      // Parse JSON - catch parse errors
      let parsed;
      try {
        parsed = JSON.parse(serialized);
      } catch (parseError) {
        // CodeRabbit Fix: Privacy-safe logging (no sensitive data)
        console.warn('Archive index reset due to corruption');
        localStorage.removeItem(ARCHIVE_INDEX_KEY);
        return { ok: true, value: this.createDefaultIndex() };
      }

      // Validate structure
      const validationResult = validateArchiveIndex(parsed);

      if (!validationResult.success) {
        // CodeRabbit Fix: Privacy-safe logging (no sensitive data)
        console.warn('Archive index reset due to invalid schema');
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

      // CodeRabbit Fix: Privacy-safe logging (no error details)
      console.warn('Archive index reset to defaults');
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
   * T024: Save archive to localStorage
   *
   * Persists archive with key: payplan_archive_{id}
   * Validates archive structure before saving.
   *
   * @param archive - Archive to persist
   * @returns Result<void, ArchiveError>
   */
  saveArchive(archive: Archive): Result<void, ArchiveError> {
    // Validate archive ID
    if (!isValidArchiveId(archive.id)) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.INVALID_ARCHIVE_ID,
          archiveId: archive.id,
        },
      };
    }

    try {
      const key = `${ARCHIVE_KEY_PREFIX}${archive.id}`;
      const jsonString = JSON.stringify(archive);

      // Check size before saving
      const size = new Blob([jsonString]).size;
      const currentSize = this.calculateTotalSize();

      if (currentSize + size > MAX_STORAGE_SIZE) {
        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            archiveId: archive.id,
          },
        };
      }

      localStorage.setItem(key, jsonString);
      return { ok: true, value: undefined };
    } catch (error) {
      return this.handleStorageError(error, archive.id);
    }
  }

  /**
   * T026: Update archive index with new entry
   *
   * Adds new archive entry to index and persists.
   * Maintains sorted order (newest first).
   *
   * @param entry - Archive metadata entry to add
   * @returns Result<void, ArchiveError>
   */
  updateIndex(entry: ArchiveIndexEntry): Result<void, ArchiveError> {
    try {
      // Load current index
      const indexResult = this.loadArchiveIndex();
      if (!indexResult.ok) {
        return indexResult as Result<never, ArchiveError>;
      }

      const index = indexResult.value;

      // Check archive limit
      if (index.archives.length >= MAX_ARCHIVES) {
        return {
          ok: false,
          error: {
            type: 'LimitReached',
            message: ERROR_MESSAGES.ARCHIVE_LIMIT_REACHED,
          },
        };
      }

      // Add new entry to beginning (newest first)
      index.archives.unshift(entry);
      index.lastModified = getCurrentTimestamp();

      // Save updated index
      return this.saveIndex(index);
    } catch (error) {
      return this.handleStorageError(error, entry.id);
    }
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

  /**
   * T044: Load archive from localStorage by ID
   *
   * Retrieves full archive data including all payment records.
   * Used by detail view to display complete archive.
   *
   * @param archiveId - Archive UUID to load
   * @returns Result<Archive, ArchiveError> - Archive or error
   */
  loadArchive(archiveId: string): Result<Archive, ArchiveError> {
    // Validate archive ID format
    if (!isValidArchiveId(archiveId)) {
      return {
        ok: false,
        error: {
          type: 'Validation',
          message: ERROR_MESSAGES.INVALID_ARCHIVE_ID,
          archiveId,
        },
      };
    }

    try {
      const key = `${ARCHIVE_KEY_PREFIX}${archiveId}`;
      const serialized = localStorage.getItem(key);

      // Check if archive exists
      if (serialized === null) {
        return {
          ok: false,
          error: {
            type: 'NotFound',
            message: ERROR_MESSAGES.ARCHIVE_NOT_FOUND,
            archiveId,
          },
        };
      }

      // Parse JSON - T047: catch corrupted JSON
      let parsed;
      try {
        parsed = JSON.parse(serialized);
      } catch (parseError) {
        console.warn('Archive corrupted:', archiveId);
        return {
          ok: false,
          error: {
            type: 'Corrupted',
            message: ERROR_MESSAGES.CORRUPTED_ARCHIVE,
            archiveId,
          },
        };
      }

      // T045: Validate archive schema with Zod
      const validationResult = validateArchive(parsed);

      if (!validationResult.success) {
        console.warn('Archive schema invalid:', archiveId);
        return {
          ok: false,
          error: {
            type: 'Corrupted',
            message: ERROR_MESSAGES.CORRUPTED_ARCHIVE,
            archiveId,
          },
        };
      }

      const archive = validationResult.data;
      return { ok: true, value: archive };
    } catch (error) {
      // Security errors should be surfaced
      if (error instanceof Error && error.name === 'SecurityError') {
        return this.handleStorageError(error, archiveId);
      }

      // Unexpected errors treated as corrupted
      console.warn('Failed to load archive:', archiveId);
      return {
        ok: false,
        error: {
          type: 'Corrupted',
          message: ERROR_MESSAGES.CORRUPTED_ARCHIVE,
          archiveId,
        },
      };
    }
  }
}
