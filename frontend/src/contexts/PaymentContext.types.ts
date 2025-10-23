/**
 * Payment Context Type Definitions
 * Extracted to separate file for React Fast Refresh compatibility
 *
 * Feature: 016-build-a-payment-archive
 */

import type { ReactNode } from 'react';
import type { PaymentRecord } from '@/types/csvExport';

/**
 * Payment Context interface
 *
 * Provides current payment schedule data to child components.
 * Used by archive creation to snapshot payment details alongside status tracking.
 */
export interface PaymentContextType {
  /** Current payment schedule with full details */
  payments: PaymentRecord[];

  /** Update payment schedule (used by Home.tsx when new data loaded) */
  setPayments: (payments: PaymentRecord[]) => void;
}

/**
 * Payment Context Provider Props
 */
export interface PaymentContextProviderProps {
  value: PaymentContextType;
  children: ReactNode;
}
