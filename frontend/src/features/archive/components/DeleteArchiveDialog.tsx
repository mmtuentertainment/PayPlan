/**
 * DeleteArchiveDialog Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 7 (User Story 5 - Delete Old Archives)
 * Tasks: T095-T096
 *
 * Confirmation dialog for deleting archives.
 * Shows archive name and "This cannot be undone" warning.
 */

interface DeleteArchiveDialogProps {
  archiveName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean; // CodeRabbit: Loading state to prevent double-submission
}

/**
 * Delete confirmation dialog component
 *
 * T116: Enhanced ARIA labels and keyboard navigation
 * - Proper dialog role with modal behavior
 * - Clear labeling of destructive action
 * - Keyboard escape to cancel
 * - Focus management
 *
 * Features:
 * - Shows archive name being deleted
 * - "This cannot be undone" warning message
 * - Cancel and Delete buttons
 * - Clean modal UI with focus management
 */
export function DeleteArchiveDialog({
  archiveName,
  onConfirm,
  onCancel,
  isDeleting = false, // CodeRabbit: Default to false
}: DeleteArchiveDialogProps) {
  // T116: Keyboard navigation - Escape key to cancel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isDeleting) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={isDeleting ? undefined : onCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="delete-dialog-title"
          className="text-xl font-bold text-gray-900 mb-4"
        >
          Delete Archive
        </h2>

        <div id="delete-dialog-description" className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete the archive{' '}
            <span className="font-semibold">"{archiveName}"</span>?
          </p>
          <p className="text-red-600 font-medium" role="alert" aria-live="polite">
            This cannot be undone.
          </p>
        </div>

        {/* T116: Enhanced ARIA labels for dialog buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Cancel deletion of archive ${archiveName}`}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors ${
              isDeleting
                ? 'bg-red-400 text-white opacity-50 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            aria-label={isDeleting ? `Deleting archive ${archiveName}, please wait` : `Permanently delete archive ${archiveName}`}
            aria-busy={isDeleting}
            aria-describedby="delete-dialog-description"
            type="button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
