/**
 * CreateArchiveDialog Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Tasks: T037-T038, T042
 *
 * Dialog for creating payment archives with warning about status reset.
 * Follows SOLUTIONS.md UX flow with two-step confirmation.
 */

import { useState } from 'react';
import type { PaymentRecord } from '@/types/csvExport';
import { usePaymentArchives } from '@/hooks/usePaymentArchives';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateArchiveDialogProps {
  payments: PaymentRecord[];
  onSuccess?: (archiveName: string) => void;
  onCancel?: () => void;
}

/**
 * Dialog for creating payment archive
 *
 * T038: Implements form with name input, validation, and reset warning
 * T042: Shows success message after archive creation
 *
 * Business Rules:
 * - Shows warning about status reset (FR-003)
 * - Displays current tracking summary (transparency)
 * - Single-step confirmation (no extra modal)
 *
 * @see SOLUTIONS.md Section 3 - Archive Creation UX Flow
 */
export function CreateArchiveDialog({
  payments,
  onSuccess,
  onCancel,
}: CreateArchiveDialogProps) {
  const [archiveName, setArchiveName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { createArchive, isLoading, error, clearError } = usePaymentArchives();

  // Calculate current tracking summary
  const totalPayments = payments.length;
  const paidCount = 0; // TODO: Get from payment status when integrated
  const pendingCount = totalPayments - paidCount;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!archiveName.trim()) {
      return;
    }

    const archive = await createArchive(archiveName, payments);

    if (archive) {
      setSuccessMessage(`Archive "${archive.name}" created successfully!`);
      setArchiveName('');

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.(archive.name);
        setSuccessMessage(null);
      }, 2000);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setArchiveName('');
    clearError();
    setSuccessMessage(null);
    onCancel?.();
  };

  // Show success state
  if (successMessage) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Success!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{successMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Payment Archive</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Archive name input */}
          <div>
            <label htmlFor="archive-name" className="block text-sm font-medium mb-2">
              Archive name:
            </label>
            <input
              id="archive-name"
              type="text"
              value={archiveName}
              onChange={(e) => setArchiveName(e.target.value)}
              placeholder="e.g., October 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              maxLength={100}
              required
            />
          </div>

          {/* Current tracking summary */}
          <div className="bg-blue-50 p-3 rounded-md text-sm">
            <p className="font-medium mb-2">Current tracking summary:</p>
            <ul className="space-y-1 text-gray-700">
              <li>• {totalPayments} total payments</li>
              <li>• {paidCount} marked as paid</li>
              <li>• {pendingCount} pending</li>
            </ul>
          </div>

          {/* Warning about reset */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p className="font-medium text-yellow-800 text-sm mb-1">⚠️ Warning:</p>
            <p className="text-sm text-yellow-700">
              Creating this archive will reset all current payment statuses to pending.
              This allows you to start fresh tracking for the next billing cycle.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              <p className="font-medium text-red-800 text-sm mb-1">Error:</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !archiveName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Archive'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
