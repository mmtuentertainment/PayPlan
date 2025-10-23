/**
 * Payment Context Definition
 * Extracted to separate file for React Fast Refresh compatibility
 *
 * Feature: 016-build-a-payment-archive
 */

import { createContext } from 'react';
import type { PaymentContextType } from './PaymentContext.types';

/**
 * Payment Context for sharing payment data
 * Using undefined default to enable proper hook validation
 */
export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);
