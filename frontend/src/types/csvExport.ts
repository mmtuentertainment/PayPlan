import { z } from 'zod';

// ============================================================================
// Source Data Types (Existing PayPlan Types)
// ============================================================================

/**
 * Represents a single payment in the PayPlan system.
 * This is the input data for CSV export.
 *
 * T007: Extended with payment status tracking fields (Feature 015)
 */
export interface PaymentRecord {
  id?: string;               // UUID v4 assigned at payment creation (Feature 015)
  provider: string;           // Provider name (e.g., "Klarna", "Affirm")
  amount: number;             // Payment amount (e.g., 45.00)
  currency: string;           // ISO 4217 currency code (e.g., "USD", "EUR")
  dueISO: string;            // Due date in ISO 8601 format (e.g., "2025-10-14")
  autopay: boolean;          // Autopay enabled/disabled
  risk_type?: string;        // Risk category (optional, may be undefined)
  risk_severity?: string;    // Risk severity level (optional, may be undefined)
  risk_message?: string;     // Risk description (optional, may be undefined)
  paid_status?: 'paid' | 'pending';  // Payment status (Feature 015 - runtime only for CSV export)
  paid_timestamp?: string;   // ISO 8601 timestamp when marked as paid (Feature 015 - runtime only)
}

// ============================================================================
// CSV Export Types
// ============================================================================

/**
 * Represents a single row in the exported CSV file.
 * Transforms PaymentRecord to ensure RFC 4180 compliance.
 *
 * T007: Extended with payment status fields (Feature 015)
 */
export interface CSVRow {
  provider: string;           // Provider name (escaped per RFC 4180)
  amount: string;             // Amount as string to preserve decimal precision
  currency: string;           // ISO 4217 currency code
  dueISO: string;            // ISO 8601 date string
  autopay: string;           // "true" or "false" (string for CSV compatibility)
  risk_type: string;         // Risk type or empty string ""
  risk_severity: string;     // Risk severity or empty string ""
  risk_message: string;      // Risk message or empty string ""
  paid_status: string;       // "paid", "pending", or "" if not tracked (Feature 015)
  paid_timestamp: string;    // ISO 8601 timestamp or "" (Feature 015)
}

/**
 * Metadata about the CSV export operation.
 * Includes filename generation and record tracking.
 */
export interface ExportMetadata {
  filename: string;          // Generated filename with timestamp
  timestamp: string;         // ISO 8601 timestamp with timezone (e.g., "2025-10-14T15:30:45Z")
  recordCount: number;       // Total number of records in export
  shouldWarn: boolean;       // True if recordCount > 500 (performance warning)
  generatedAt: Date;         // JavaScript Date object for timestamp
}

/**
 * Aggregates all data and metadata for a complete CSV export operation.
 */
export interface CSVExportData {
  rows: CSVRow[];            // Array of CSV rows
  metadata: ExportMetadata;  // Export metadata
  csvContent: string;        // Generated CSV string (RFC 4180 compliant)
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Validates a CSV row structure.
 * Ensures RFC 4180 compliance and proper data formatting.
 */
export const csvRowSchema = z.object({
  provider: z.string().min(1).max(255),
  amount: z.string().regex(/^-?\d+\.\d{2}$/, "Amount must have exactly 2 decimal places (negative allowed for refunds)"),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/, "Currency must be 3 uppercase letters"),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  autopay: z.enum(["true", "false"]),
  risk_type: z.string(),      // Empty string allowed
  risk_severity: z.string(),  // Empty string allowed
  risk_message: z.string()    // Empty string allowed
});

/**
 * Validates export metadata structure.
 * Ensures proper filename format and timestamp generation.
 */
export const exportMetadataSchema = z.object({
  filename: z.string().regex(/^payplan-export-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/,
    "Filename must match pattern: payplan-export-YYYY-MM-DD-HHMMSS.csv"),
  timestamp: z.string().datetime(),
  recordCount: z.number().int().nonnegative(),
  shouldWarn: z.boolean(),
  generatedAt: z.date()
});

/**
 * Validates the complete CSV export data structure.
 * Ensures all components are valid before export.
 */
export const csvExportDataSchema = z.object({
  rows: z.array(csvRowSchema).min(0).max(1000),
  metadata: exportMetadataSchema,
  csvContent: z.string().min(1)
});
