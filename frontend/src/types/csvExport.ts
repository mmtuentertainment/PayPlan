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

/**
 * Zod schema for PaymentRecord runtime validation.
 *
 * Validates payment data before passing to archive creation or CSV export.
 * Ensures data integrity and prevents invalid data from corrupting storage.
 *
 * Requirements:
 * - provider: Non-empty string, max 255 chars
 * - amount: Positive number with max 2 decimal places
 * - currency: ISO 4217 3-letter uppercase code
 * - dueISO: Valid ISO 8601 date (YYYY-MM-DD)
 * - autopay: Boolean
 * - id: Optional UUID v4 (validated if present)
 * - risk fields: Optional strings
 * - paid_status: Optional 'paid' or 'pending'
 * - paid_timestamp: Optional ISO 8601 datetime
 */
export const paymentRecordSchema = z.object({
  id: z.string().uuid().optional(),
  provider: z.string().min(1, "Provider is required").max(255, "Provider name too long"),
  amount: z.number()
    .min(-1000000, "Amount must be greater than -1,000,000")
    .max(1000000, "Amount must be less than 1,000,000")
    .refine(
      (val) => {
        // Check decimal places using cents calculation (robust to floating-point imprecision)
        // Multiply by 100 to convert to cents, then check if result is close to an integer
        const cents = val * 100;
        const roundedCents = Math.round(cents);
        return Math.abs(cents - roundedCents) < 1e-8;
      },
      "Amount cannot have more than 2 decimal places"
    ),
  currency: z.string()
    .length(3, "Currency must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency must be 3 uppercase letters (ISO 4217)"),
  dueISO: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (date) => !isNaN(Date.parse(date)),
      "Date must be a valid date"
    ),
  autopay: z.boolean(),
  risk_type: z.string().max(100, "Risk type must be 100 characters or less").optional(),
  risk_severity: z.string().max(64, "Risk severity must be 64 characters or less").optional(),
  risk_message: z.string().max(2000, "Risk message must be 2000 characters or less").optional(),
  paid_status: z.enum(['paid', 'pending']).optional(),
  paid_timestamp: z.string()
    .optional()
    .refine(
      (val) => !val || val.endsWith('Z') || val.includes('+00:00'),
      "paid_timestamp must be in UTC (must end with 'Z' or '+00:00')"
    )
});

/**
 * Zod schema for array of PaymentRecords.
 * Used to validate collections of payments before processing.
 */
export const paymentRecordsArraySchema = z.array(paymentRecordSchema)
  .min(1, "At least one payment is required")
  .max(1000, "Cannot process more than 1000 payments at once");

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
  risk_message: z.string(),   // Empty string allowed
  paid_status: z.string(),    // Feature 015 - "paid", "pending", or "" (empty string allowed)
  paid_timestamp: z.string()  // Feature 015 - ISO 8601 timestamp or "" (empty string allowed)
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
