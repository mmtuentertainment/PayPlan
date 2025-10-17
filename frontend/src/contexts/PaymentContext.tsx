/**
 * PaymentContext - React Context for sharing payment data across components
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 1 (Setup & Dependencies)
 * Task: T001
 *
 * Provides access to current payment schedule data for archive creation.
 * Solves the data integration issue identified in SOLUTIONS.md:
 * Archives need access to full PaymentRecord[] (provider, amount, etc.)
 * not just PaymentStatusRecord (paymentId, status, timestamp).
 *
 * @see SOLUTIONS.md Section 2 - Payment Schedule Source
 */

import { createContext, useContext, type ReactNode } from 'react';
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
 * Default context value (no payments)
 */
const defaultContext: PaymentContextType = {
  payments: [],
  setPayments: () => {
    console.warn('PaymentContext.setPayments called outside of provider');
  },
};

/**
 * Payment Context for sharing payment data
 */
export const PaymentContext = createContext<PaymentContextType>(defaultContext);

/**
 * Hook to access payment context
 *
 * @throws Error if used outside PaymentContextProvider
 * @returns PaymentContextType with current payments
 *
 * @example
 * ```typescript
 * function ArchiveButton() {
 *   const { payments } = usePaymentContext();
 *   console.log(`${payments.length} payments available for archiving`);
 * }
 * ```
 */
export function usePaymentContext(): PaymentContextType {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error('usePaymentContext must be used within PaymentContextProvider');
  }

  return context;
}

/**
 * Payment Context Provider component
 *
 * Wraps the application to provide payment data to all child components.
 * Typically used in Home.tsx to wrap the main app content.
 *
 * @example
 * ```typescript
 * function Home() {
 *   const [payments, setPayments] = useState<PaymentRecord[]>([]);
 *
 *   return (
 *     <PaymentContextProvider value={{ payments, setPayments }}>
 *       <App />
 *     </PaymentContextProvider>
 *   );
 * }
 * ```
 */
export interface PaymentContextProviderProps {
  value: PaymentContextType;
  children: ReactNode;
}

export function PaymentContextProvider({ value, children }: PaymentContextProviderProps) {
  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}
