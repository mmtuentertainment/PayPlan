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

/**
 * PII Sanitization Patterns (Constitution Requirement)
 *
 * Regex patterns with word boundaries to detect and sanitize:
 * - Email addresses
 * - Phone numbers (US format)
 * - Social Security Numbers (SSN)
 * - Credit card numbers (13-19 digits with optional spaces/dashes)
 * - Names (common patterns like "John Doe", "Jane Smith")
 * - Street addresses (numbers + street names)
 */
const PII_PATTERNS = {
  // Email: user@domain.com
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone: (123) 456-7890, 123-456-7890, 1234567890
  // Updated: Fixed to avoid capturing parentheses and plus sign
  phone: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,

  // SSN: 123-45-6789, 123456789
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Credit Card: 1234-5678-9012-3456 (13-19 digits, Amex 15 digits supported)
  // Updated: Fixed to also match 15-digit Amex cards (4-6-5 pattern)
  creditCard: /\b(?:\d{4}[-\s]?\d{6}[-\s]?\d{5}|\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{3,7})\b/g,

  // Names: "John Doe", "Jane Smith" (capitalized first/last name pattern)
  // Conservative pattern: Only match common first names followed by last names
  // This avoids false positives like "Emergency Fund" or "House Fund"
  // name pattern REMOVED (PR85-6): Unreliable detection, false positives on goal names like "John's Emergency Fund"

  // Street Address: "123 Main St", "456 Oak Avenue"
  // Updated: Fixed to match full address pattern, not just street name
  address: /\b\d{1,5}\s+(?:[A-Za-z0-9]+\s+)*(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi,
};

/**
 * Sanitize text by replacing PII with redacted placeholders
 *
 * @param text - Text to sanitize
 * @returns Sanitized text with PII replaced
 */
export function sanitizePII(text: string): string {
  let sanitized = text;

  // Replace each PII pattern with [REDACTED] placeholder
  // Note: Order matters! Process addresses before names to avoid false positives
  sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  sanitized = sanitized.replace(PII_PATTERNS.address, '[ADDRESS_REDACTED]');
  // name sanitization REMOVED (PR85-6) - see comment in PII_PATTERNS above

  return sanitized;
}

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
  if (goal.contributions.length === 0) {
    return [
      {
        ...goalData,
        contributionId: '',
        contributionAmount: '',
        contributionNote: '',
        contributionDate: '',
        contributionCreatedAt: '',
      },
    ];
  }

  // Otherwise, create one row per contribution
  return goal.contributions.map((contribution) => ({
    ...goalData,
    contributionId: contribution.id,
    contributionAmount: formatCurrency(contribution.amount),
    contributionNote: contribution.note || '',
    contributionDate: contribution.createdAt.split('T')[0], // Extract date from ISO timestamp
    contributionCreatedAt: contribution.createdAt,
  }));
}

/**
 * Export goals to CSV format with PII sanitization (denormalized)
 *
 * Returns one row per contribution. Goal data is repeated for each contribution.
 * Goals with 0 contributions export a single row with empty contribution fields.
 *
 * @param goals - Goals to export
 * @returns CSV content string
 */
export function exportGoalsToCSV(goals: Goal[]): string {
  // Sanitize PII from goal names and contribution notes
  const sanitizedGoals = goals.map(sanitizeGoal);

  // Transform to denormalized CSV rows (flatten array of arrays)
  const csvRows = sanitizedGoals.flatMap(transformGoalToCSVRows);

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
 * Format: payplan-goals-YYYY-MM-DD-HHmmss.{csv|json}
 *
 * @param format - File format ('csv' or 'json')
 * @returns Filename with timestamp
 */
export function generateExportFilename(format: 'csv' | 'json'): string {
  const now = new Date();

  // Generate ISO 8601 basic format timestamp for filename (no colons, cross-platform safe)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;

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
