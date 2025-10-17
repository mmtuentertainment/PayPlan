/**
 * ArchiveDetailView Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Tasks: T053-T054, T055-T056
 *
 * Archive detail page showing full payment history.
 * Read-only view with no edit controls.
 * Performance target: <100ms load time
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaymentArchives } from '@/hooks/usePaymentArchives';
import type { Archive } from '@/lib/archive/types';

/**
 * Format ISO date to readable format
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date (e.g., "Oct 17, 2025")
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp to readable format
 *
 * @param timestamp - ISO 8601 timestamp or empty string
 * @returns Formatted timestamp or "-"
 */
function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Archive detail view component
 *
 * Features:
 * - Loads full archive by ID from route params
 * - Displays all payment records (read-only)
 * - No edit controls (immutable)
 * - Shows payment status and timestamps
 * - Performance: <100ms load time
 */
export function ArchiveDetailView() {
  const { id } = useParams<{ id: string }>();
  const { getArchiveById, error } = usePaymentArchives();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Load archive by ID
    const startTime = performance.now();
    const loadedArchive = getArchiveById(id);
    const endTime = performance.now();

    // Log performance for debugging
    console.log(`Archive load time: ${(endTime - startTime).toFixed(2)}ms`);

    setArchive(loadedArchive);
    setIsLoading(false);
  }, [id, getArchiveById]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !archive) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Link
          to="/archives"
          className="inline-block mb-4 text-blue-500 hover:text-blue-600"
        >
          ← Back to Archives
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Archive
          </h2>
          <p className="text-red-700">
            {error?.message || 'Archive not found or corrupted'}
          </p>
        </div>
      </div>
    );
  }

  const { name, createdAt, payments, metadata } = archive;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <Link
        to="/archives"
        className="inline-block mb-4 text-blue-500 hover:text-blue-600"
      >
        ← Back to Archives
      </Link>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{name}</h1>
        <p className="text-gray-600 mb-4">
          Created {formatDate(createdAt)}
        </p>

        {/* Metadata Summary */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Total Payments:</span>{' '}
            <span className="font-medium">{metadata.totalCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Paid:</span>{' '}
            <span className="font-medium text-green-600">{metadata.paidCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Pending:</span>{' '}
            <span className="font-medium text-yellow-600">{metadata.pendingCount}</span>
          </div>
          {metadata.dateRange.earliest && metadata.dateRange.latest && (
            <div>
              <span className="text-gray-600">Date Range:</span>{' '}
              <span className="font-medium">
                {formatDate(metadata.dateRange.earliest)} - {formatDate(metadata.dateRange.latest)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          This archive is read-only. Payment statuses cannot be modified.
        </div>
      </div>

      {/* Payment Records Table - T055-T056: Read-only, no edit controls */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status Updated
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Autopay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.paymentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{payment.provider}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {payment.amount.toFixed(2)} {payment.currency}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(payment.dueISO)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatTimestamp(payment.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.autopay ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No payments in this archive
        </div>
      )}
    </div>
  );
}
