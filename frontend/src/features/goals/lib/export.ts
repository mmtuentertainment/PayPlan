/**
 * Export Goals to CSV/JSON with PII Sanitization (T103)
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * Exports goals with PII sanitization to protect user privacy.
 * Supports both CSV and JSON formats.
 */

import Papa from 'papaparse';
import type { Goal } from '../types/goal';
import type { Contribution } from '../types/contribution';
import { sanitizePII } from '@/shared/lib/privacy';

/**
 * Format goal for export with PII sanitization
 *
 * @param goal - Goal to format
 * @returns Goal with sanitized fields
 */
function sanitizeGoal(goal: Goal): Goal {
  return {
    ...goal,
    name: sanitizePII(goal.name),
    contributions: goal.contributions.map(sanitizeContribution),
  };
}

/**
 * Format contribution for export with PII sanitization
 *
 * @param contribution - Contribution to format
 * @returns Contribution with sanitized fields
 */
function sanitizeContribution(contribution: Contribution): Contribution {
  return {
    ...contribution,
    note: contribution.note ? sanitizePII(contribution.note) : null,
  };
}

/**
 * CSV Row for goal export (denormalized structure - one row per contribution)
 *
 * This format repeats goal-level data for each contribution to preserve
 * all contribution details (amount, note, date) in the export.
 *
 * For goals with 0 contributions, a single row is exported with empty
 * contribution fields to ensure the goal is not lost.
 */
interface GoalCSVRow {
  // Goal-level fields (repeated for each contribution)
  goalId: string;
  goalName: string;
  goalTargetAmount: string; // Formatted as currency
  goalCurrentAmount: string; // Formatted as currency
  goalMonthlyContribution: string; // Formatted as currency
  goalTargetDate: string; // ISO date or empty
  goalStatus: string;
  goalCreatedAt: string; // ISO date
  goalUpdatedAt: string; // ISO date
  // Contribution-level fields (unique per row)
  contributionId: string;
  contributionAmount: string; // Formatted as currency
  contributionNote: string;
  contributionDate: string; // ISO date
  contributionCreatedAt: string; // ISO date
}

/**
 * Transform goal to denormalized CSV rows (one row per contribution)
 *
 * For goals with 0 contributions, returns a single row with empty contribution fields.
 * For goals with N contributions, returns N rows with repeated goal data.
 *
 * @param goal - Goal to transform
 * @returns Array of CSV row objects
 */
function transformGoalToCSVRows(goal: Goal): GoalCSVRow[] {
  // Format amounts as currency (dollars with 2 decimals)
  const formatCurrency = (cents: number | null) => {
    if (cents === null) return '0.00';
    return (cents / 100).toFixed(2);
  };

  // Base goal data (repeated for each contribution)
  const goalData = {
    goalId: goal.id,
    goalName: goal.name,
    goalTargetAmount: formatCurrency(goal.targetAmount),
    goalCurrentAmount: formatCurrency(goal.currentAmount),
    goalMonthlyContribution: formatCurrency(goal.monthlyContribution),
    goalTargetDate: goal.targetDate || '',
    goalStatus: goal.status,
    goalCreatedAt: goal.createdAt,
    goalUpdatedAt: goal.updatedAt,
  };

  // If no contributions, export one row with empty contribution fields
  // Bot review: Type safety - use `satisfies` to ensure all 14 fields are present (compile-time check)
  if (goal.contributions.length === 0) {
    return [
      {
        ...goalData,
        contributionId: '',
        contributionAmount: '',
        contributionNote: '',
        contributionDate: '',
        contributionCreatedAt: '',
      } satisfies GoalCSVRow,
    ];
  }

  // Otherwise, create one row per contribution
  // Bot review: Type safety - use `satisfies` to ensure all 14 fields are present (compile-time check)
  return goal.contributions.map(
    (contribution) =>
      ({
        ...goalData,
        contributionId: contribution.id,
        contributionAmount: formatCurrency(contribution.amount),
        contributionNote: contribution.note || '',
        contributionDate: contribution.createdAt.split('T')[0], // Extract date from ISO timestamp
        contributionCreatedAt: contribution.createdAt,
      }) satisfies GoalCSVRow
  );
}

/**
 * Export goals to CSV format with PII sanitization (denormalized)
 *
 * Returns one row per contribution. Goal data is repeated for each contribution.
 * Goals with 0 contributions export a single row with empty contribution fields.
 *
 * @param goals - Goals to export
 * @returns CSV content string
 * @throws {Error} When total rows exceed Excel's 1,048,576 row limit (bot review: @throws tag)
 */
export function exportGoalsToCSV(goals: Goal[]): string {
  // Sanitize PII from goal names and contribution notes
  const sanitizedGoals = goals.map(sanitizeGoal);

  // Transform to denormalized CSV rows (flatten array of arrays)
  const csvRows = sanitizedGoals.flatMap(transformGoalToCSVRows);

  // Bot review M1: Validate Excel row limit (1,048,576 rows)
  // Excel 2007+ has a hard limit of 1,048,576 rows (including header row)
  const EXCEL_MAX_ROWS = 1048576;
  const totalRows = csvRows.length + 1; // +1 for header row

  if (totalRows > EXCEL_MAX_ROWS) {
    throw new Error(
      `CSV export too large: ${totalRows.toLocaleString()} rows exceeds Excel's limit of ${EXCEL_MAX_ROWS.toLocaleString()} rows.\n\n` +
        `Recommended solutions:\n` +
        `1. Export as JSON instead (no row limit) - select "Export as JSON" from the export menu\n` +
        `2. Export goals in smaller date ranges or batches\n` +
        `3. Archive old goals and export only active ones`
    );
  }

  // Generate CSV with PapaParse (RFC 4180 compliant)
  const csvContent = Papa.unparse(csvRows, {
    quotes: true, // Force quotes around all fields (handles special chars)
    delimiter: ',', // Standard comma delimiter
    newline: '\r\n', // Windows-style line endings (widest compatibility)
    header: true, // Include header row
  });

  return csvContent;
}

/**
 * Export goals to JSON format with PII sanitization
 *
 * @param goals - Goals to export
 * @returns JSON content string (pretty-printed with 2-space indent)
 */
export function exportGoalsToJSON(goals: Goal[]): string {
  // Sanitize PII from goal names and contribution notes
  const sanitizedGoals = goals.map(sanitizeGoal);

  // Pretty-print JSON with 2-space indent
  return JSON.stringify(sanitizedGoals, null, 2);
}

/**
 * Generate export filename with timestamp
 *
 * Format: payplan-goals-YYYY-MM-DD-HHmmssZ.{csv|json}
 * Example: payplan-goals-2025-11-08-170000Z.csv
 *
 * @param format - File format ('csv' or 'json')
 * @returns Filename with timestamp (UTC, indicated by 'Z' suffix)
 *
 * @remarks UTC Timezone Decision (Bot review: Timezone Clarity)
 * @remarks 'Z' Suffix Meaning (Bot review: UTC indicator may confuse users)
 *
 * The 'Z' at the end of the timestamp stands for "Zulu time" (military/aviation term for UTC).
 * It's a standard ISO 8601 notation meaning "zero hour offset" from UTC.
 *
 * **Why include 'Z'?**
 * - ISO 8601 compliance: Globally recognized standard for UTC timestamps
 * - Clarity: Prevents ambiguity about which timezone the timestamp represents
 * - Sortability: Files with 'Z' suffix can be easily identified as UTC timestamps
 * - Developer-friendly: Engineers and power users recognize ISO 8601 immediately
 *
 * **User-facing impact:**
 * - Less technical users: May not understand 'Z', but filename sorts correctly regardless
 * - Technical users: Immediately recognize ISO 8601 UTC format
 * - Alternative considered: Omit 'Z', but this loses timezone information (ambiguous)
 *
 * @remarks UTC Timezone Decision (Bot review: Timezone Clarity)
 *
 * This function uses UTC instead of local time for filename timestamps.
 *
 * **Rationale**:
 * 1. **Consistency**: UTC ensures identical filenames for the same export across timezones
 * 2. **Sortability**: ISO 8601 UTC timestamps sort chronologically (filename-based sorting)
 * 3. **Cross-platform**: UTC avoids timezone ambiguity when sharing exports across regions
 * 4. **No DST issues**: UTC has no daylight saving time transitions (no duplicate/missing hours)
 *
 * **Example**:
 * - User in PST (UTC-8) exports at 9:00 AM local → payplan-goals-2025-11-08-170000Z.csv
 * - User in EST (UTC-5) exports at 9:00 AM local → payplan-goals-2025-11-08-140000Z.csv
 * - Both files have globally unique, unambiguous timestamps
 *
 * **Trade-offs**:
 * - Con: Filename timestamp doesn't match user's local clock (9 AM export shows as 17:00)
 * - Pro: No timezone-related bugs (DST, ambiguous hours, cross-platform sharing)
 * - Pro: Globally consistent (two users in different timezones can compare export times)
 */
export function generateExportFilename(format: 'csv' | 'json'): string {
  const now = new Date();

  // Generate ISO 8601 basic format timestamp for filename (UTC, timezone-aware)
  // Use UTC to ensure consistent timestamps regardless of user's timezone
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  // Append 'Z' to indicate UTC timezone (cross-platform safe, no colons)
  const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}Z`;

  return `payplan-goals-${timestamp}.${format}`;
}

/**
 * Trigger browser download of file
 *
 * @param content - File content
 * @param filename - Filename for download
 * @param mimeType - MIME type (e.g., 'text/csv', 'application/json')
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  // Create Blob with UTF-8 encoding
  const blob = new Blob([content], {
    type: `${mimeType};charset=utf-8;`,
  });

  // Generate object URL for download
  const url = URL.createObjectURL(blob);

  try {
    // Create anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    // Clean up object URL to prevent memory leak
    // This runs even if click() throws an error
    URL.revokeObjectURL(url);
  }
}
