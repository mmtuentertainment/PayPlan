/**
 * ArchiveListPage Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Tasks: T049-T050, T059-T060
 *
 * Main archive list view page.
 * Displays all archives with metadata, handles empty state.
 * Performance target: <100ms load time
 */

import { usePaymentArchives } from '@/hooks/usePaymentArchives';
import { ArchiveListItem } from '@/components/archive/ArchiveListItem';
import { Link } from 'react-router-dom';

/**
 * Archive list page component
 *
 * Features:
 * - Loads archive list from index (two-tier architecture)
 * - Shows empty state when no archives exist
 * - Cross-tab sync via storage events
 * - Performance: <100ms load time
 */
export function ArchiveListPage() {
  const { archives, isLoading, error } = usePaymentArchives();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div
          className="animate-pulse"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">Loading...</span>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Archives
          </h2>
          <p className="text-red-700">Unable to load archives. Please try again later.</p>
        </div>
      </div>
    );
  }

  // T059-T060: Empty state when no archives exist
  if (archives.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Payment Archives</h1>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No archives yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first archive to preserve your payment history.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Payments
          </Link>
        </div>
      </div>
    );
  }

  // T050: Render archive list with metadata
  // CodeRabbit Fix: Use semantic HTML for better screen reader landmarks
  return (
    <main className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Archives</h1>
        <Link
          to="/"
          className="px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
          aria-label="Back to Payments"
        >
          Back to Payments
        </Link>
      </header>

      <p className="text-gray-600 mb-6">
        View your archived payment history. Archives are read-only snapshots of your payment status tracking.
      </p>

      <div className="space-y-4">
        {archives.map((archive) => (
          <ArchiveListItem key={archive.id} archive={archive} />
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        {archives.length} {archives.length === 1 ? 'archive' : 'archives'} saved
      </div>
    </main>
  );
}
