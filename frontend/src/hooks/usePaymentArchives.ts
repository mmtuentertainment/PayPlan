/**
 * usePaymentArchives Hook
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Tasks: T039-T040
 *
 * React hook for managing payment archives with loading/error states.
 * Provides createArchive wrapper with state management.
 */

import { useState, useCallback } from 'react';
import type { Archive, ArchiveError } from '@/lib/archive/types';
import type { PaymentRecord } from '@/types/csvExport';
import { ArchiveService } from '@/lib/archive/ArchiveService';
import { ArchiveStorage } from '@/lib/archive/ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';

/**
 * Hook return type with archive operations and state
 */
interface UsePaymentArchivesReturn {
  createArchive: (name: string, payments: PaymentRecord[]) => Promise<Archive | null>;
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

  // Initialize services (could be refactored to use dependency injection)
  const archiveStorage = new ArchiveStorage();
  const paymentStatusStorage = new PaymentStatusStorage();
  const archiveService = new ArchiveService(archiveStorage, paymentStatusStorage);

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
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createArchive,
    isLoading,
    error,
    clearError,
  };
}
