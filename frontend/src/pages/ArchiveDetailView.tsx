/**
 * ArchiveDetailView Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Phase: 5 (User Story 3 - View Archive Statistics)
 * Phase: 7 (User Story 5 - Delete Old Archives)
 * Tasks: T053-T054, T055-T056, T071, T104
 *
 * Archive detail page showing full payment history and statistics.
 * Read-only view with no edit controls.
 * Performance target: <100ms load time
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePaymentArchives } from '@/hooks/usePaymentArchives';
import type { Archive, ArchiveSummary } from '@/lib/archive/types';
import { archiveSchema } from '@/lib/archive/validation';
import { ArchiveService } from '@/lib/archive/ArchiveService';
import { ArchiveStorage } from '@/lib/archive/ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';
import { ArchiveStatistics } from '@/components/archive/ArchiveStatistics';
import { ExportArchiveButton } from '@/components/archive/ExportArchiveButton';
import { DeleteArchiveDialog } from '@/components/archive/DeleteArchiveDialog';

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
 * Format currency amount with proper locale and currency-specific decimals
 *
 * CodeRabbit Fix: Use Intl.NumberFormat for currency-aware formatting
 * Matches ArchiveStatistics formatCurrency() for consistency
 *
 * @param amount - Payment amount
 * @param currency - ISO 4217 currency code
 * @returns Formatted currency string (e.g., "$75.00", "¥7,500", "BD 75.000")
 */
function formatCurrency(amount: number, currency: string): string {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return '--';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    // Fallback if currency code invalid
    return `${amount.toFixed(2)} ${currency}`;
  }
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
  const navigate = useNavigate();
  const { getArchiveById, deleteArchive, error } = usePaymentArchives();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Initialize ArchiveService for statistics calculation
  const archiveService = useMemo(() => {
    const archiveStorage = new ArchiveStorage();
    const paymentStatusStorage = new PaymentStatusStorage();
    return new ArchiveService(archiveStorage, paymentStatusStorage);
  }, []);

  useEffect(() => {
    if (!id) return;

    // Load archive by ID
    const startTime = performance.now();
    const loadedArchive = getArchiveById(id);
    const endTime = performance.now();

    // Log performance for debugging
    console.log(`Archive load time: ${(endTime - startTime).toFixed(2)}ms`);

    // Validate fetched archive
    if (loadedArchive) {
      const validationResult = archiveSchema.safeParse(loadedArchive);
      if (!validationResult.success) {
        console.error('Archive validation failed:', validationResult.error);
        setArchive(null);
        setIsLoading(false);
        return;
      }
      setArchive(validationResult.data);
    } else {
      setArchive(loadedArchive);
    }

    setIsLoading(false);
  }, [id, getArchiveById]);

  // T071: Calculate statistics from archive
  const archiveStatistics: ArchiveSummary | null = useMemo(() => {
    if (!archive) return null;
    return archiveService.calculateStatistics(archive);
  }, [archive, archiveService]);

  // T104: Delete handlers
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;

    setShowDeleteDialog(false);
    const success = await deleteArchive(id);

    if (success) {
      // Redirect to archive list after successful deletion
      navigate('/archives');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

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

  const { name, createdAt, payments } = archive;

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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{name}</h1>
            <p className="text-gray-600">
              Created {formatDate(createdAt)}
            </p>
          </div>

          {/* T087: Export Archive Button, T104: Delete Archive Button */}
          <div className="flex gap-2">
            <ExportArchiveButton archive={archive} />
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50 transition-colors"
              aria-label="Delete archive"
            >
              Delete Archive
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          This archive is read-only. Payment statuses cannot be modified.
        </div>
      </div>

      {/* T071: Archive Statistics Panel */}
      {archiveStatistics && (
        <ArchiveStatistics summary={archiveStatistics} />
      )}

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
                    {formatCurrency(payment.amount, payment.currency)}
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

      {/* T104: Delete confirmation dialog */}
      {showDeleteDialog && (
        <DeleteArchiveDialog
          archiveName={name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
