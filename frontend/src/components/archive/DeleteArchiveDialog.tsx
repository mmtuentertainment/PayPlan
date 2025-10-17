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
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      role="dialog"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
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
          <p className="text-red-600 font-medium">
            This cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-md transition-colors ${
              isDeleting
                ? 'bg-red-400 text-white opacity-50 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            aria-label="Confirm deletion"
            aria-busy={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
