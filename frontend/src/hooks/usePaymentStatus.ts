/**
 * usePaymentStatus Hook
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T032
 *
 * React hook for payment status tracking using useSyncExternalStore.
 * Provides localStorage-backed state with cross-tab synchronization.
 *
 * @see research.md Section 4 - React 19 State Management
 * @see contracts/PaymentStatusService.contract.md
 */

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { PaymentStatusService } from '../lib/payment-status/PaymentStatusService';
import { PaymentStatusStorage } from '../lib/payment-status/PaymentStatusStorage';
import { STORAGE_KEY } from '../lib/payment-status/constants';
import type {
  PaymentStatus,
  PaymentStatusRecord,
  PaymentStatusCollection,
  StorageError,
  Result,
} from '../lib/payment-status/types';

// Singleton instances
const storageService = new PaymentStatusStorage();
const paymentStatusService = new PaymentStatusService(storageService);

// ============================================================================
// External Store for useSyncExternalStore
// ============================================================================

/**
 * Store state for payment status management.
 */
interface PaymentStatusStore {
  statuses: PaymentStatusCollection;
  error: StorageError | null;
}

// Global store state
let storeState: PaymentStatusStore = (() => {
  // SSR-safe: only access storage if window is defined
  if (typeof window === 'undefined') {
    return {
      statuses: {
        version: '1.0.0',
        statuses: new Map(),
        totalSize: 0,
        lastModified: new Date().toISOString(),
      },
      error: null,
    };
  }

  // Initial load
  const initialLoad = storageService.loadStatuses();
  if (initialLoad.ok) {
    return {
      statuses: initialLoad.value,
      error: null,
    };
  }

  return {
    statuses: {
      version: '1.0.0',
      statuses: new Map(),
      totalSize: 0,
      lastModified: new Date().toISOString(),
    },
    error: initialLoad.error,
  };
})();

// Subscribers for store changes
const subscribers = new Set<() => void>();

/**
 * Subscribe to store changes
 */
function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Get current store snapshot
 */
function getSnapshot(): PaymentStatusStore {
  return storeState;
}

/**
 * Notify all subscribers
 */
function notifySubscribers(): void {
  subscribers.forEach((callback) => callback());
}

/**
 * Update store state and notify subscribers
 */
function updateStore(newState: Partial<PaymentStatusStore>): void {
  storeState = { ...storeState, ...newState };
  notifySubscribers();
}

// ============================================================================
// Hook Interface
// ============================================================================

/**
 * Hook return type
 */
export interface UsePaymentStatusReturn {
  /**
   * All payment statuses
   */
  statuses: Map<string, PaymentStatusRecord>;

  /**
   * Mark a payment as paid
   */
  markAsPaid: (paymentId: string) => Result<void, StorageError>;

  /**
   * Mark a payment as pending (undo)
   */
  markAsPending: (paymentId: string) => Result<void, StorageError>;

  /**
   * Toggle payment status
   */
  toggleStatus: (paymentId: string) => Result<PaymentStatus, StorageError>;

  /**
   * Get current status of a payment
   */
  getStatus: (paymentId: string) => Result<PaymentStatus, StorageError>;

  /**
   * Get status record with timestamp
   */
  getStatusWithTimestamp: (
    paymentId: string
  ) => Result<PaymentStatusRecord | null, StorageError>;

  /**
   * Get all payment statuses (for bulk operations)
   */
  getAllStatuses: () => Map<string, PaymentStatusRecord>;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Last error (if any)
   */
  error: StorageError | null;
}

/**
 * Payment status tracking hook with localStorage persistence
 *
 * Uses React 19's useSyncExternalStore for external store integration.
 * Automatically syncs across browser tabs via storage events.
 *
 * @returns Payment status operations and state
 *
 * @example
 * ```tsx
 * function PaymentRow({ payment }) {
 *   const { markAsPaid, getStatus } = usePaymentStatus();
 *
 *   const statusResult = getStatus(payment.id);
 *   const isPaid = statusResult.ok && statusResult.value === 'paid';
 *
 *   return (
 *     <div>
 *       <input
 *         type="checkbox"
 *         checked={isPaid}
 *         onChange={() => markAsPaid(payment.id)}
 *       />
 *       {payment.description}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaymentStatus(): UsePaymentStatusReturn {
  // Use React 19's useSyncExternalStore for external state
  const store = useSyncExternalStore(subscribe, getSnapshot);

  /**
   * Mark payment as paid and update store
   */
  const markAsPaid = useCallback((paymentId: string) => {
    const result = paymentStatusService.markAsPaid(paymentId);

    if (result.ok) {
      // Reload statuses after successful save
      const loadResult = storageService.loadStatuses();
      if (loadResult.ok) {
        updateStore({ statuses: loadResult.value, error: null });
      }
    } else {
      updateStore({ error: result.error });
    }

    return result;
  }, []);

  /**
   * Mark payment as pending and update store
   */
  const markAsPending = useCallback((paymentId: string) => {
    const result = paymentStatusService.markAsPending(paymentId);

    if (result.ok) {
      // Reload statuses after successful save
      const loadResult = storageService.loadStatuses();
      if (loadResult.ok) {
        updateStore({ statuses: loadResult.value, error: null });
      }
    } else {
      updateStore({ error: result.error });
    }

    return result;
  }, []);

  /**
   * Toggle payment status and update store
   */
  const toggleStatus = useCallback((paymentId: string) => {
    const result = paymentStatusService.toggleStatus(paymentId);

    if (result.ok) {
      // Reload statuses after successful save
      const loadResult = storageService.loadStatuses();
      if (loadResult.ok) {
        updateStore({ statuses: loadResult.value, error: null });
      }
    } else {
      updateStore({ error: result.error });
    }

    return result;
  }, []);

  /**
   * Get current status (read-only, from service)
   */
  const getStatus = useCallback(
    (paymentId: string) => paymentStatusService.getStatus(paymentId),
    []
  );

  /**
   * Get status with timestamp (read-only, from service)
   */
  const getStatusWithTimestamp = useCallback(
    (paymentId: string) => paymentStatusService.getStatusWithTimestamp(paymentId),
    []
  );

  /**
   * Get all statuses (from store)
   */
  const getAllStatuses = useCallback(
    () => store.statuses.statuses,
    [store.statuses.statuses]
  );

  // Cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.storageArea === localStorage) {
        const loadResult = storageService.loadStatuses();
        if (loadResult.ok) {
          updateStore({ statuses: loadResult.value });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    statuses: store.statuses.statuses,
    markAsPaid,
    markAsPending,
    toggleStatus,
    getStatus,
    getStatusWithTimestamp,
    getAllStatuses,
    isLoading: false,
    error: store.error,
  };
}
