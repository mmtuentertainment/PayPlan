/**
 * usePaymentArchives Hook
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Tasks: T039-T040, T050, T054
 *
 * React hook for managing payment archives with loading/error states.
 * Provides createArchive, listArchives, and getArchiveById wrappers.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Archive, ArchiveIndexEntry, ArchiveError } from '@/lib/archive/types';
import type { PaymentRecord } from '@/types/csvExport';
import { ArchiveService } from '@/lib/archive/ArchiveService';
import { ArchiveStorage } from '@/lib/archive/ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';

/**
 * Hook return type with archive operations and state
 */
interface UsePaymentArchivesReturn {
  createArchive: (name: string, payments: PaymentRecord[]) => Promise<Archive | null>;
  listArchives: () => ArchiveIndexEntry[] | null;
  getArchiveById: (id: string) => Archive | null;
  archives: ArchiveIndexEntry[];
  isLoading: boolean;
  error: ArchiveError | null;
  clearError: () => void;
}

/**
 * React hook for payment archive operations
 *
 * Manages archive creation with loading/error states.
 * Uses ArchiveService for business logic.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { createArchive, isLoading, error } = usePaymentArchives();
 *
 *   const handleCreate = async () => {
 *     const archive = await createArchive('October 2025', payments);
 *     if (archive) {
 *       console.log('Archive created:', archive.id);
 *     }
 *   };
 *
 *   return <button onClick={handleCreate} disabled={isLoading}>Create</button>;
 * }
 * ```
 */
export function usePaymentArchives(): UsePaymentArchivesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ArchiveError | null>(null);
  const [archives, setArchives] = useState<ArchiveIndexEntry[]>([]);

  // Initialize services once with useMemo to avoid recreation on each render
  const archiveService = useMemo(() => {
    const archiveStorage = new ArchiveStorage();
    const paymentStatusStorage = new PaymentStatusStorage();
    return new ArchiveService(archiveStorage, paymentStatusStorage);
  }, []);

  /**
   * Load archives on mount and subscribe to storage events for cross-tab sync
   */
  useEffect(() => {
    // Load initial archives
    const result = archiveService.listArchives();
    if (result.ok) {
      setArchives(result.value);
    }

    // Subscribe to storage events for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      // Check if archive index was updated
      if (e.key === 'payplan_archive_index' || e.key === null) {
        const result = archiveService.listArchives();
        if (result.ok) {
          setArchives(result.value);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [archiveService]);

  /**
   * Create new payment archive
   *
   * @param name - Archive name
   * @param payments - Payment records to archive
   * @returns Created archive or null if error
   */
  const createArchive = useCallback(async (
    name: string,
    payments: PaymentRecord[]
  ): Promise<Archive | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = archiveService.createArchive(name, payments);

      if (result.ok) {
        // Update local archives state
        const listResult = archiveService.listArchives();
        if (listResult.ok) {
          setArchives(listResult.value);
        }
        return result.value;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      // Handle unexpected errors
      const unexpectedError: ArchiveError = {
        type: 'Serialization',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };
      setError(unexpectedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [archiveService]);

  /**
   * List all archives
   *
   * @returns Array of archive metadata entries or null if error
   */
  const listArchives = useCallback((): ArchiveIndexEntry[] | null => {
    const result = archiveService.listArchives();

    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  }, [archiveService]);

  /**
   * Get archive by ID for detail view
   *
   * @param id - Archive UUID
   * @returns Full archive or null if error
   */
  const getArchiveById = useCallback((id: string): Archive | null => {
    const result = archiveService.getArchiveById(id);

    if (result.ok) {
      return result.value;
    } else {
      setError(result.error);
      return null;
    }
  }, [archiveService]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createArchive,
    listArchives,
    getArchiveById,
    archives,
    isLoading,
    error,
    clearError,
  };
}
