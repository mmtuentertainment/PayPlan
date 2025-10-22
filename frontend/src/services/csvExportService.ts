import Papa from 'papaparse';
import type { PaymentRecord, CSVRow, ExportMetadata, CSVExportData } from '@/types/csvExport';
import { csvRowSchema, exportMetadataSchema } from '@/types/csvExport';

/**
 * CSV Export Service
 *
 * Provides client-side CSV export functionality for PayPlan payment schedules.
 * Follows RFC 4180 standard for CSV format compliance.
 *
 * @module csvExportService
 */

/**
 * Transforms a PaymentRecord to a CSV-compatible row.
 *
 * Converts types to strings for CSV compatibility:
 * - Numbers formatted to exactly 2 decimal places
 * - Booleans converted to "true"/"false" strings
 * - Undefined risk fields converted to empty strings
 *
 * @param payment - Source payment record
 * @returns CSV-compatible row with validated schema
 * @throws {Error} If validation fails
 */
export function transformPaymentToCSVRow(payment: PaymentRecord): CSVRow {
  // Use Math.round for consistent financial rounding (avoids toFixed floating-point issues)
  const roundedAmount = (Math.round(payment.amount * 100) / 100).toFixed(2);

  const row: CSVRow = {
    provider: payment.provider,
    amount: roundedAmount,
    currency: payment.currency,
    dueISO: payment.dueISO,
    autopay: payment.autopay.toString(), // Convert boolean to string
    risk_type: payment.risk_type || '',   // Empty string if undefined
    risk_severity: payment.risk_severity || '',
    risk_message: payment.risk_message || '',
    paid_status: payment.paid_status || '',  // Feature 015 - empty if not tracked
    paid_timestamp: payment.paid_timestamp || ''  // Feature 015 - empty if not tracked
  };

  // Validate output with Zod schema
  const validated = csvRowSchema.parse(row);
  return validated;
}

/**
 * Generates export metadata including filename and timestamp.
 *
 * Creates a unique filename using ISO 8601 timestamp format without colons
 * (cross-platform safe). Sets performance warning flag for exports >500 records.
 *
 * @param recordCount - Number of records being exported
 * @returns Export metadata with validated schema
 * @throws {Error} If validation fails
 */
export function generateExportMetadata(recordCount: number): ExportMetadata {
  const now = new Date();

  // Generate ISO 8601 basic format timestamp for filename (no colons, cross-platform safe)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const filenameTimestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
  const filename = `payplan-export-${filenameTimestamp}.csv`;

  const metadata: ExportMetadata = {
    filename,
    timestamp: now.toISOString(), // ISO 8601 with timezone
    recordCount,
    shouldWarn: recordCount > 500, // Performance warning threshold
    generatedAt: now
  };

  // Validate output with Zod schema
  const validated = exportMetadataSchema.parse(metadata);
  return validated;
}

/**
 * Generates RFC 4180-compliant CSV content from CSV rows.
 *
 * Uses PapaParse library to ensure proper:
 * - Special character escaping (commas, quotes, newlines)
 * - Unicode character preservation
 * - Header row generation
 *
 * @param rows - Array of CSV-compatible rows
 * @returns CSV string content
 */
export function generateCSV(rows: CSVRow[]): string {
  // Use PapaParse to generate RFC 4180-compliant CSV
  const csvContent = Papa.unparse(rows, {
    quotes: true,        // Force quotes around all fields (handles special chars)
    delimiter: ',',      // Standard comma delimiter
    newline: '\r\n',    // Windows-style line endings (widest compatibility)
    header: true         // Include header row
  });

  return csvContent;
}

/**
 * Triggers browser download of CSV file.
 *
 * Creates a Blob with UTF-8 encoding and triggers download using:
 * - Blob API for file creation
 * - URL.createObjectURL for download URL
 * - Programmatic anchor click for download trigger
 * - URL.revokeObjectURL for memory cleanup
 *
 * @param csvContent - CSV string content to download
 * @param filename - Filename for the downloaded file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create Blob with UTF-8 encoding
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  // Generate object URL for download
  const url = URL.createObjectURL(blob);

  // Create anchor element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  // Clean up object URL to prevent memory leak
  URL.revokeObjectURL(url);
}

/**
 * Complete CSV export workflow.
 *
 * Orchestrates the full export process:
 * 1. Transform payment records to CSV rows
 * 2. Generate export metadata
 * 3. Generate CSV content
 * 4. Trigger download
 *
 * @param payments - Array of payment records to export
 * @returns Export data including metadata and content
 */
export function exportPaymentsToCSV(payments: PaymentRecord[]): CSVExportData {
  const rows = payments.map(transformPaymentToCSVRow);
  const metadata = generateExportMetadata(payments.length);
  const csvContent = generateCSV(rows);

  return {
    rows,
    metadata,
    csvContent
  };
}
