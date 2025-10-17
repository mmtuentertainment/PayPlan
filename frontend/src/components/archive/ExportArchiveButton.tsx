/**
 * ExportArchiveButton Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 6 (User Story 4 - Export Archived Data to CSV)
 * Tasks: T085-T086
 *
 * Button component for exporting archive to CSV file.
 * Downloads CSV with 12 columns (10 payment + 2 archive metadata).
 */

import { useState } from 'react';
import type { Archive } from '@/lib/archive/types';
import { ArchiveService } from '@/lib/archive/ArchiveService';
import { ArchiveStorage } from '@/lib/archive/ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';
import { generateArchiveFilename } from '@/lib/archive/utils';
import { downloadCSV } from '@/services/csvExportService';

interface ExportArchiveButtonProps {
  archive: Archive;
}

/**
 * Export archive to CSV button component
 *
 * Features:
 * - Exports archive with 12 CSV columns
 * - Downloads file with slugified filename
 * - Shows loading state during export
 * - Error handling with user feedback
 *
 * @param archive - Archive to export
 */
export function ExportArchiveButton({ archive }: ExportArchiveButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    try {
      setIsExporting(true);
      setError(null);

      // Initialize service
      const archiveStorage = new ArchiveStorage();
      const paymentStatusStorage = new PaymentStatusStorage();
      const archiveService = new ArchiveService(archiveStorage, paymentStatusStorage);

      // Generate CSV content
      const csvContent = archiveService.exportArchiveToCSV(archive);

      // Generate filename
      const filename = generateArchiveFilename(archive.name, archive.createdAt);

      // Trigger download
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('CSV export failed:', err);
      setError('Failed to export archive. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center px-4 py-2 rounded-lg
          text-sm font-medium transition-colors
          ${
            isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }
        `}
        aria-label="Export archive to CSV"
      >
        {/* Download icon */}
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'Exporting...' : 'Export to CSV'}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
