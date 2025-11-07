/**
 * ExportGoalsButton Component (T103)
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * Button component for exporting goals to CSV or JSON with PII sanitization.
 * Uses dropdown menu for format selection.
 */

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import type { Goal } from '../types/goal';
import {
  exportGoalsToCSV,
  exportGoalsToJSON,
  generateExportFilename,
  downloadFile,
} from '../lib/export';

interface ExportGoalsButtonProps {
  goals: Goal[]; // Goals to export
  disabled?: boolean; // Disable button (e.g., no goals to export)
}

/**
 * Export goals button with format dropdown
 *
 * Features:
 * - Dropdown menu for CSV/JSON format selection
 * - PII sanitization before export (email, phone, SSN, credit cards, names, addresses)
 * - Loading state during export
 * - Error handling with user feedback
 *
 * @param goals - Goals to export
 * @param disabled - Optional flag to disable button
 */
export function ExportGoalsButton({ goals, disabled = false }: ExportGoalsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      setError(null);

      // Generate CSV content with PII sanitization
      const csvContent = exportGoalsToCSV(goals);

      // Generate filename with timestamp
      const filename = generateExportFilename('csv');

      // Trigger download
      downloadFile(csvContent, filename, 'text/csv');
    } catch (err) {
      console.error('[ExportGoalsButton] CSV export failed:', err);
      setError('Failed to export goals to CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle export to JSON
   */
  const handleExportJSON = () => {
    try {
      setIsExporting(true);
      setError(null);

      // Generate JSON content with PII sanitization
      const jsonContent = exportGoalsToJSON(goals);

      // Generate filename with timestamp
      const filename = generateExportFilename('json');

      // Trigger download
      downloadFile(jsonContent, filename, 'application/json');
    } catch (err) {
      console.error('[ExportGoalsButton] JSON export failed:', err);
      setError('Failed to export goals to JSON. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || isExporting || goals.length === 0}
            className="inline-flex items-center"
            aria-label="Export goals"
            aria-busy={isExporting}
          >
            {/* Download icon */}
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? 'Exporting...' : 'Export Goals'}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleExportCSV}
            disabled={isExporting}
            role="menuitem"
            aria-label="Export goals as CSV file"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export as CSV
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleExportJSON}
            disabled={isExporting}
            role="menuitem"
            aria-label="Export goals as JSON file"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <div className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
