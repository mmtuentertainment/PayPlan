/**
 * Payment Context Type Definitions
 * Extracted to separate file for React Fast Refresh compatibility
 *
 * Feature: 016-build-a-payment-archive
 */

import type { ReactNode } from 'react';
import type { PaymentRecord } from '@/types/csvExport';

/**
 * Updater function type for atomic state updates
 *
 * Feature 018: Phase 4 - Atomic updates to prevent race conditions
 */
export type PaymentUpdater = (prev: PaymentRecord[]) => PaymentRecord[];

/**
 * Payment Context interface
 *
 * Provides current payment schedule data to child components.
 * Used by archive creation to snapshot payment details alongside status tracking.
 *
 * Feature 018: Phase 4 - Added functional setState pattern for atomic updates (T068-T070)
 */
export interface PaymentContextType {
  /** Current payment schedule with full details */
  payments: PaymentRecord[];

  /**
   * Update payment schedule (used by Home.tsx when new data loaded)
   *
   * Supports both direct array updates and functional updates for atomicity:
   * - Direct: `setPayments([payment1, payment2])`
   * - Functional: `setPayments(prev => [...prev, newPayment])` (race-safe)
   */
  setPayments: (updater: PaymentRecord[] | PaymentUpdater) => void;
}

/**
 * Payment Context Provider Props
 */
export interface PaymentContextProviderProps {
  value: PaymentContextType;
  children: ReactNode;
}
