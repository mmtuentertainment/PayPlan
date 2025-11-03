/**
 * PaymentCheckbox Component
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T034
 *
 * Interactive checkbox for marking payments as paid/pending.
 * Provides visual feedback and keyboard accessibility.
 *
 * @see spec.md FR-001 - Mark payments via clickable checkbox
 * @see spec.md FR-005 - Toggle functionality (undo)
 */

import { useCallback } from 'react';
import type { PaymentStatus } from '../../lib/payment-status/types';

export interface PaymentCheckboxProps {
  /**
   * Payment ID (UUID v4)
   */
  paymentId: string;

  /**
   * Current payment status
   */
  status: PaymentStatus;

  /**
   * Callback when status changes
   */
  onToggle: (paymentId: string) => void;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PaymentCheckbox - Accessible checkbox for payment status
 *
 * Features:
 * - Keyboard navigation (Tab, Space)
 * - Screen reader support
 * - Visual feedback (<200ms per SC-003)
 * - Toggle functionality (paid ↔ pending)
 */
export function PaymentCheckbox({
  paymentId,
  status,
  onToggle,
  disabled = false,
  className = '',
}: PaymentCheckboxProps) {
  const isPaid = status === 'paid';

  const handleChange = useCallback(() => {
    onToggle(paymentId);
  }, [paymentId, onToggle]);

  return (
    <label
      htmlFor={`payment-checkbox-${paymentId}`}
      className={`inline-flex items-center gap-2 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <input
        id={`payment-checkbox-${paymentId}`}
        type="checkbox"
        checked={isPaid}
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label={`Mark payment as ${isPaid ? 'pending' : 'paid'}`}
        aria-checked={isPaid}
      />
      <span className="sr-only">
        {isPaid ? 'Payment is marked as paid' : 'Payment is pending'}
      </span>
    </label>
  );
}
