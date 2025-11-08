/**
 * ExportGoalsButton Component (T103)
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * Button component for exporting goals to CSV or JSON with PII sanitization.
 * Uses dropdown menu for format selection.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import type { Goal } from '../types/goal';
import {
  exportGoalsToCSV,
  exportGoalsToJSON,
  generateExportFilename,
  downloadFile,
} from '../lib/export';

/**
 * Toast duration constants (bot review: extract magic numbers)
 * Industry standards: success 3-5s, error 7-10s
 */
const TOAST_DURATION_SUCCESS = 5000; // 5 seconds
const TOAST_DURATION_ERROR = 10000; // 10 seconds

interface ExportGoalsButtonProps {
  goals: Goal[]; // Goals to export
  disabled?: boolean; // Disable button (e.g., no goals to export)
}

/**
 * Export goals button with format dropdown
 *
 * Features:
 * - Dropdown menu for CSV/JSON format selection
 * - PII sanitization before export (email, phone, SSN, credit cards, addresses)
 * - Visual loading spinner during export (accessible with aria-busy)
 * - Toast notifications for success/error (survives navigation)
 * - Denormalized CSV format (one row per contribution)
 *
 * @param goals - Goals to export
 * @param disabled - Optional flag to disable button
 */
export function ExportGoalsButton({ goals, disabled = false }: ExportGoalsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    try {
      setIsExporting(true);

      // Generate CSV content with PII sanitization
      const csvContent = exportGoalsToCSV(goals);

      // Generate filename with timestamp
      const filename = generateExportFilename('csv');

      // Trigger download
      downloadFile(csvContent, filename, 'text/csv');

      // Success toast
      toast.success('Goals exported to CSV successfully', {
        duration: TOAST_DURATION_SUCCESS,
      });
    } catch (err) {
      console.error('[ExportGoalsButton] CSV export failed:', err);
      toast.error('Failed to export goals to CSV. Please try again.', {
        duration: TOAST_DURATION_ERROR,
        position: 'top-center',
      });
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

      // Generate JSON content with PII sanitization
      const jsonContent = exportGoalsToJSON(goals);

      // Generate filename with timestamp
      const filename = generateExportFilename('json');

      // Trigger download
      downloadFile(jsonContent, filename, 'application/json');

      // Success toast
      toast.success('Goals exported to JSON successfully', {
        duration: TOAST_DURATION_SUCCESS,
      });
    } catch (err) {
      console.error('[ExportGoalsButton] JSON export failed:', err);
      toast.error('Failed to export goals to JSON. Please try again.', {
        duration: TOAST_DURATION_ERROR,
        position: 'top-center',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Bot review: Accessibility - Visually hidden text explaining disabled state (WCAG 2.2 AA) */}
        {goals.length === 0 && (
          <span id="export-button-disabled-reason" className="sr-only">
            Export is disabled because there are no goals to export. Create a goal first to enable this
            feature.
          </span>
        )}

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || isExporting || goals.length === 0}
            className="inline-flex items-center"
            aria-label={isExporting ? 'Exporting goals' : 'Export goals'}
            aria-busy={isExporting}
            aria-describedby={goals.length === 0 ? 'export-button-disabled-reason' : undefined}
          >
            {/* Conditional icon: spinner when exporting, download otherwise */}
            {isExporting ? (
              <svg
                className="w-4 h-4 mr-2 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Spinner icon (rotating circle with gap) */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  transform="translate(0,4)"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Download icon */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            {isExporting ? 'Exporting...' : 'Export Goals'}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={handleExportCSV}
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
            onSelect={handleExportJSON}
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

      {/* Bot review M1: UTC Timestamp Clarity - Info icon with tooltip explaining UTC timestamps */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Information about export file timestamps"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            <strong>Export files use UTC time</strong>
          </p>
          <p className="text-xs mt-1">
            The 'Z' in filenames (e.g., <code className="bg-white/10 px-1 rounded">170000Z</code>) indicates
            UTC (Coordinated Universal Time). This ensures consistent timestamps across all timezones.
          </p>
          <p className="text-xs mt-1">
            Example: Exporting at 9 AM PST creates a file with "170000Z" (5 PM UTC).
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
    </TooltipProvider>
  );
}
