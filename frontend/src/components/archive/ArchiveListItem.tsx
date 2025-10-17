/**
 * ArchiveListItem Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Tasks: T051-T052
 *
 * Displays archive metadata in list view with navigation to detail.
 * Shows name, date, payment counts, and corrupted badge if needed.
 */

import { Link } from 'react-router-dom';
import type { ArchiveIndexEntry } from '@/lib/archive/types';

interface ArchiveListItemProps {
  archive: ArchiveIndexEntry;
  isCorrupted?: boolean;
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
 * Displays archive metadata with click to view details.
 * Read-only interface (no edit buttons).
 */
export function ArchiveListItem({ archive, isCorrupted = false }: ArchiveListItemProps) {
  const { id, name, createdAt, paymentCount, paidCount, pendingCount } = archive;

  return (
    <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{name}</h3>
            {isCorrupted && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                Corrupted
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Created {formatDate(createdAt)}
          </p>
        </div>
        <Link
          to={`/archives/${id}`}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isCorrupted
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          onClick={(e) => {
            if (isCorrupted) e.preventDefault();
          }}
          aria-disabled={isCorrupted}
          tabIndex={isCorrupted ? -1 : undefined}
        >
          View
        </Link>
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total:</span>{' '}
          <span className="font-medium">{paymentCount}</span>
        </div>
        <div>
          <span className="text-gray-600">Paid:</span>{' '}
          <span className="font-medium text-green-600">{paidCount}</span>
        </div>
        <div>
          <span className="text-gray-600">Pending:</span>{' '}
          <span className="font-medium text-yellow-600">{pendingCount}</span>
        </div>
      </div>
    </div>
  );
}
