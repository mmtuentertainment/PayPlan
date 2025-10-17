/**
 * ArchiveListItem Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Phase: 7 (User Story 5 - Delete Old Archives)
 * Tasks: T051-T052, T103
 *
 * Displays archive metadata in list view with navigation to detail.
 * Shows name, date, payment counts, corrupted badge, and delete button.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ArchiveIndexEntry } from '@/lib/archive/types';
import { DeleteArchiveDialog } from './DeleteArchiveDialog';

interface ArchiveListItemProps {
  archive: ArchiveIndexEntry;
  isCorrupted?: boolean;
  onDelete?: (archiveId: string) => void;
  isDeleting?: boolean; // CodeRabbit: Loading state from parent
}

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
 * Archive list item component
 *
 * T115: Keyboard navigation support added
 * - Tab through View and Delete buttons
 * - Enter/Space to activate buttons
 * - All interactive elements properly labeled
 *
 * Displays archive metadata with click to view details.
 * Includes delete button with confirmation dialog.
 */
export function ArchiveListItem({ archive, isCorrupted = false, onDelete, isDeleting = false }: ArchiveListItemProps) {
  const { id, name, createdAt, paymentCount, paidCount, pendingCount } = archive;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.(id);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // T115: Keyboard navigation for delete button
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleDeleteClick(e);
    }
  };

  return (
    <>
      {/* T115: Enhanced keyboard navigation and ARIA labels */}
      <article
        className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
        aria-label={`Archive: ${name}, created ${formatDate(createdAt)}, ${paymentCount} payments`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{name}</h3>
              {isCorrupted && (
                <span
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                  role="status"
                  aria-label="This archive is corrupted and cannot be viewed"
                >
                  Corrupted
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              <time dateTime={createdAt}>Created {formatDate(createdAt)}</time>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/archives/${id}`}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isCorrupted
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
              onClick={(e) => {
                if (isCorrupted) e.preventDefault();
              }}
              aria-disabled={isCorrupted}
              aria-label={isCorrupted ? `Cannot view corrupted archive ${name}` : `View details for archive ${name}`}
              tabIndex={isCorrupted ? -1 : 0}
            >
              View
            </Link>
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                onKeyDown={handleKeyDown}
                className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                aria-label={`Delete archive ${name}`}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* T115: Enhanced ARIA labels for statistics */}
        <div className="flex gap-4 text-sm" role="list" aria-label="Archive statistics">
          <div role="listitem">
            <span className="text-gray-600">Total:</span>{' '}
            <span className="font-medium" aria-label={`${paymentCount} total payments`}>{paymentCount}</span>
          </div>
          <div role="listitem">
            <span className="text-gray-600">Paid:</span>{' '}
            <span className="font-medium text-green-600" aria-label={`${paidCount} paid payments`}>
              {paidCount}
            </span>
          </div>
          <div role="listitem">
            <span className="text-gray-600">Pending:</span>{' '}
            <span className="font-medium text-yellow-600" aria-label={`${pendingCount} pending payments`}>
              {pendingCount}
            </span>
          </div>
        </div>
      </article>

      {showDeleteDialog && (
        <DeleteArchiveDialog
          archiveName={name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
