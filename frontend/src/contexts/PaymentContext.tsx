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
 * CodeRabbit Fix: Added Zod validation for security
 *
 * @see SOLUTIONS.md Section 2 - Payment Schedule Source
 */

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { z } from 'zod';
import type { PaymentRecord } from '@/types/csvExport';

/**
 * PaymentRecord validation schema
 *
 * CodeRabbit Fix: Validates critical fields to prevent invalid data
 * from causing NaN or security issues in archive system.
 */
const paymentRecordSchema = z.object({
  id: z.string().uuid('Payment ID must be UUID v4').optional(),
  provider: z.string().min(1, 'Provider required').max(255),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be ISO 4217 code').regex(/^[A-Z]{3}$/),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  autopay: z.boolean(),
  risk_type: z.string().optional(),
  risk_severity: z.string().optional(),
  risk_message: z.string().optional(),
  paid_status: z.enum(['paid', 'pending']).optional(),
  paid_timestamp: z.string().optional(),
});

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
 * Payment Context for sharing payment data
 * CodeRabbit Fix: Removed unused defaultContext (dead code)
 * Using undefined default to enable proper hook validation
 */
export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

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

  // CodeRabbit Fix: Proper undefined check (not !context which never triggers with defaultContext)
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within PaymentContextProvider');
  }

  return context;
}

/**
 * Payment Context Provider component
 *
 * CodeRabbit Fix: Wraps to own internal state with validation.
 * Validates payment data before updating state to prevent NaN/security issues.
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
  // Internal state with validation
  const [internalPayments, setInternalPayments] = useState<PaymentRecord[]>(value.payments);

  // Validated setter that wraps the provided setter
  const validatedSetPayments = useMemo(() => {
    return (payments: PaymentRecord[]) => {
      // Validate each payment record
      const validationResults = payments.map((payment, index) => ({
        index,
        result: paymentRecordSchema.safeParse(payment),
      }));

      // Check for validation failures
      const failures = validationResults.filter(v => !v.result.success);

      if (failures.length > 0) {
        // Log all validation errors
        failures.forEach(({ index, result }) => {
          if (!result.success) {
            console.error(`Payment validation failed at index ${index}:`, result.error.format());
          }
        });

        // Throw error with detailed message
        throw new Error(
          `Payment validation failed for ${failures.length} record(s). ` +
          `Check console for details. First error: ${failures[0]?.result.success === false ? failures[0].result.error.issues[0]?.message : 'unknown'}`
        );
      }

      // All valid - update internal state and call original setter
      setInternalPayments(payments);
      value.setPayments(payments);
    };
  }, [value]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<PaymentContextType>(
    () => ({
      payments: internalPayments,
      setPayments: validatedSetPayments,
    }),
    [internalPayments, validatedSetPayments]
  );

  return (
    <PaymentContext.Provider value={contextValue}>
      {children}
    </PaymentContext.Provider>
  );
}
