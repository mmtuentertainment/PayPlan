/**
 * StatusIndicator Component
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T035
 *
 * Visual indicator for payment status with WCAG 2.1 AA compliance.
 * Uses triple-mode indication: color + icon + text.
 *
 * @see research.md Section 3 - Visual Status Indicators (Accessibility)
 */

import { Check, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { PaymentStatus } from '../../lib/payment-status/types';

export interface StatusIndicatorProps {
  /**
   * Payment status to display
   */
  status: PaymentStatus;

  /**
   * Optional timestamp to show when payment was marked (for paid status)
   */
  timestamp?: string;

  /**
   * Show timestamp in human-readable format (e.g., "Paid on Oct 15, 2025 at 2:30 PM")
   */
  showTimestamp?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * StatusIndicator - Visual badge for payment status
 *
 * WCAG 2.1 AA Compliant:
 * - Color + Icon + Text (1.4.1 Use of Color)
 * - 4.5:1 contrast ratio (1.4.3 Contrast Minimum)
 * - Screen reader support (4.1.2 Name, Role, Value)
 *
 * Visual Design:
 * - Paid: Green badge + checkmark icon + "Paid" text
 * - Pending: Gray badge + clock icon + "Pending" text
 */
export function StatusIndicator({
  status,
  timestamp,
  showTimestamp = false,
  className = '',
}: StatusIndicatorProps) {
  const isPaid = status === 'paid';

  // Format timestamp for display (FR-017)
  const formattedTimestamp = timestamp && showTimestamp
    ? formatTimestampForDisplay(timestamp)
    : null;

  return (
    <output
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Badge
        variant={isPaid ? 'default' : 'secondary'}
        className={
          isPaid
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        aria-label={`Payment ${status}`}
      >
        <span className="flex items-center gap-1">
          {isPaid ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Clock className="h-3 w-3" aria-hidden="true" />
          )}
          <span className="text-xs font-medium">
            {isPaid ? 'Paid' : 'Pending'}
          </span>
        </span>
      </Badge>

      {formattedTimestamp && (
        <span className="text-xs text-gray-500">
          {formattedTimestamp}
        </span>
      )}

      {/* Screen reader only text for clarity */}
      <span className="sr-only">
        Payment status: {status}
        {formattedTimestamp && `. ${formattedTimestamp}`}
      </span>
    </output>
  );
}

/**
 * Format ISO 8601 timestamp for human-readable display
 *
 * @param isoTimestamp - ISO 8601 timestamp string
 * @returns Formatted string (e.g., "Paid on Oct 15, 2025 at 2:30 PM")
 */
function formatTimestampForDisplay(isoTimestamp: string): string {
  try {
    const date = new Date(isoTimestamp);

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `Paid on ${dateStr} at ${timeStr}`;
  } catch {
    return '';
  }
}
