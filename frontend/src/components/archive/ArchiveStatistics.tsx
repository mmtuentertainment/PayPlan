/**
 * ArchiveStatistics Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 5 (User Story 3 - View Archive Statistics)
 * Tasks: T065-T066, T072
 *
 * Displays comprehensive archive statistics including:
 * - Total payments count
 * - Paid count with percentage
 * - Pending count with percentage
 * - Date range (formatted)
 * - Average payment amount (if single currency)
 */

import { z } from 'zod';
import type { ArchiveSummary } from '@/lib/archive/types';
import { formatDateRange } from '@/lib/archive/utils';
import { dateRangeSchema } from '@/lib/archive/validation';

interface ArchiveStatisticsProps {
  summary: ArchiveSummary;
}

/**
 * Zod schema for validating ArchiveSummary at component boundary
 * Ensures data integrity before rendering
 */
const archiveSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  paidPercentage: z.number().min(0).max(100),
  pendingPercentage: z.number().min(0).max(100),
  dateRange: dateRangeSchema,
  averageAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
}).refine(
  data => data.paidCount + data.pendingCount === data.totalCount,
  { message: 'Paid and pending counts must sum to total count' }
);

/**
 * Statistics panel component for archive detail view
 *
 * Features:
 * - Validates summary data at component boundary (defense in depth)
 * - Displays counts and percentages for paid/pending
 * - Shows date range using formatDateRange()
 * - Shows average amount if available
 * - Handles "Multiple currencies" case
 * - Clean card layout with consistent styling
 */
export function ArchiveStatistics({ summary }: ArchiveStatisticsProps) {
  // Validate summary data at component boundary
  const validationResult = archiveSummarySchema.safeParse(summary);
  if (!validationResult.success) {
    console.error('Invalid archive summary data:', validationResult.error);
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Statistics Error</h2>
        <p className="text-sm text-red-700">
          Invalid statistics data. This archive may be corrupted.
        </p>
      </div>
    );
  }

  // Use validated data
  const {
    totalCount,
    paidCount,
    pendingCount,
    paidPercentage,
    pendingPercentage,
    dateRange,
    averageAmount,
    currency,
  } = validationResult.data;

  // CodeRabbit Fix: Validate numeric values before formatting
  const isValidNumber = (val: unknown): val is number => {
    return typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val);
  };

  // Safe percentage formatter
  const formatPercentage = (val: number): string => {
    if (!isValidNumber(val)) return '--';
    return val.toFixed(1);
  };

  // CodeRabbit Fix: Currency-aware amount formatter with validation
  const formatCurrency = (amount: number, currencyCode: string): string => {
    if (!isValidNumber(amount)) return '--';

    // Validate currency code is 3-letter ISO 4217 format before Intl.NumberFormat
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch {
      // Fallback if Intl.NumberFormat fails despite validation
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Payments */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-600 mb-1">Total Payments</span>
          <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
        </div>

        {/* Paid Count with Percentage */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-600 mb-1">Paid</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">{paidCount}</span>
            <span className="text-sm text-gray-500">
              ({formatPercentage(paidPercentage)}%)
            </span>
          </div>
        </div>

        {/* Pending Count with Percentage */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-600 mb-1">Pending</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-yellow-600">{pendingCount}</span>
            <span className="text-sm text-gray-500">
              ({formatPercentage(pendingPercentage)}%)
            </span>
          </div>
        </div>

        {/* Average Amount */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-600 mb-1">Average Amount</span>
          {averageAmount !== undefined && currency ? (
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(averageAmount, currency)}
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">Multiple currencies</span>
          )}
        </div>
      </div>

      {/* Date Range */}
      {(dateRange.earliest || dateRange.latest) && (
        <div className="mt-6 pt-6 border-t">
          <span className="text-sm text-gray-600">Date Range: </span>
          <span className="text-sm font-medium text-gray-900">
            {formatDateRange(dateRange.earliest, dateRange.latest)}
          </span>
        </div>
      )}
    </div>
  );
}
