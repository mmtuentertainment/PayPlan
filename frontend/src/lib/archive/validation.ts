/**
 * Archive Validation Schemas
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 1 (Setup & Dependencies)
 * Task: T005
 *
 * Zod validation schemas for runtime validation of archive data.
 * Follows patterns from Feature 015 (payment-status/validation.ts).
 *
 * @see data-model.md - Entity validation rules
 */

import { z } from 'zod';
import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  INDEX_SCHEMA_VERSION,
  MAX_ARCHIVES,
} from './constants';

/**
 * CodeRabbit Fix: Result type moved to top for proper usage order
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * DateRange validation schema
 *
 * CodeRabbit Fix: Made fields nullable and added actual date validation
 * Validates ISO 8601 date strings (YYYY-MM-DD format).
 * Ensures earliest <= latest for chronological ordering.
 */
export const dateRangeSchema = z.object({
  earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').nullable(),
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').nullable(),
}).refine(
  (data) => {
    if (!data.earliest || !data.latest) return true; // Null/empty allowed
    // Validate actual dates exist (not 2024-02-31) - parse as local dates
    const earliestDate = new Date(data.earliest);
    const latestDate = new Date(data.latest);
    if (isNaN(earliestDate.getTime()) || isNaN(latestDate.getTime())) {
      return false; // Invalid dates
    }
    // Ensure chronological order - use getTime() for comparison
    return earliestDate.getTime() <= latestDate.getTime();
  },
  { message: 'earliest date must be before or equal to latest date and both must be valid dates' }
);

/**
 * ArchiveMetadata validation schema
 *
 * CodeRabbit Fix: Removed redundant refine checks (sum check covers <= checks)
 * Ensures metadata consistency: paidCount + pendingCount === totalCount.
 */
export const archiveMetadataSchema = z.object({
  totalCount: z.number().int().nonnegative('Total count must be non-negative'),
  paidCount: z.number().int().nonnegative('Paid count must be non-negative'),
  pendingCount: z.number().int().nonnegative('Pending count must be non-negative'),
  dateRange: dateRangeSchema,
  storageSize: z.number().int().nonnegative('Storage size must be non-negative'),
}).refine(
  (data) => data.paidCount + data.pendingCount === data.totalCount,
  { message: 'paidCount + pendingCount must equal totalCount' }
);

/**
 * PaymentArchiveRecord validation schema
 *
 * CodeRabbit Fixes: Added decimal precision, risk field constraints
 * Validates combined payment status + payment details snapshot.
 * Follows PaymentRecord structure from Feature 014.
 */
export const paymentArchiveRecordSchema = z.object({
  // Status fields (from Feature 015)
  paymentId: z.string().uuid('Payment ID must be UUID v4'),
  status: z.enum(['paid', 'pending']),
  timestamp: z.string().refine(
    (val) => val === '' || z.string().datetime().safeParse(val).success,
    { message: 'Timestamp must be ISO 8601 datetime or empty string' }
  ),

  // Payment fields (from Feature 014 PaymentRecord)
  provider: z.string().min(1, 'Provider name required').max(255),
  amount: z.number()
    .positive('Amount must be positive')
    .refine(
      (val) => Number.isInteger(val * 100),
      { message: 'Amount must have at most 2 decimal places' }
    ),
  currency: z.string().length(3, 'Currency must be 3-letter ISO 4217 code').regex(/^[A-Z]{3}$/),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  autopay: z.boolean(),

  // Optional risk fields - CodeRabbit: Added constraints for security
  risk_type: z.string()
    .max(200, 'Risk type must be under 200 characters')
    .regex(/^[^<>]*$/, 'Risk type cannot contain HTML tags')
    .optional(),
  risk_severity: z.enum(['low', 'medium', 'high', 'critical', ''])
    .optional(),
  risk_message: z.string()
    .max(500, 'Risk message must be under 500 characters')
    .regex(/^[^<>]*$/, 'Risk message cannot contain HTML tags')
    .optional(),
});

/**
 * Archive validation schema
 *
 * CodeRabbit Fix: Use preprocess for trim (before min/max checks)
 * Validates complete archive structure with immutable snapshot.
 */
export const archiveSchema = z.object({
  id: z.string().uuid('Archive ID must be UUID v4'),
  name: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string()
      .min(MIN_NAME_LENGTH, `Archive name must be at least ${MIN_NAME_LENGTH} characters`)
      .max(MAX_NAME_LENGTH, `Archive name must be under ${MAX_NAME_LENGTH} characters`)
  ),
  createdAt: z.string().datetime('Created timestamp must be ISO 8601'),
  sourceVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version (e.g., "1.0.0")'),
  payments: z.array(paymentArchiveRecordSchema),
  metadata: archiveMetadataSchema,
}).refine(
  (data) => data.payments.length === data.metadata.totalCount,
  { message: 'payments array length must match metadata.totalCount' }
);

/**
 * ArchiveIndexEntry validation schema
 *
 * Validates metadata entry in archive index.
 */
export const archiveIndexEntrySchema = z.object({
  id: z.string().uuid('Archive ID must be UUID v4'),
  name: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1).max(MAX_NAME_LENGTH)
  ),
  createdAt: z.string().datetime('Created timestamp must be ISO 8601'),
  paymentCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
}).refine(
  (data) => data.paidCount + data.pendingCount === data.paymentCount,
  { message: 'paidCount + pendingCount must equal paymentCount' }
);

/**
 * ArchiveIndex validation schema
 *
 * CodeRabbit Fixes: Use MAX_ARCHIVES constant, validate version literal
 * Validates archive index structure stored in localStorage.
 */
export const archiveIndexSchema = z.object({
  version: z.string().refine(
    (v) => v === INDEX_SCHEMA_VERSION,
    { message: `Version must match INDEX_SCHEMA_VERSION (${INDEX_SCHEMA_VERSION})` }
  ),
  archives: z.array(archiveIndexEntrySchema),
  lastModified: z.string().datetime('Last modified must be ISO 8601'),
}).refine(
  (data) => data.archives.length <= MAX_ARCHIVES,
  { message: `Archive index cannot contain more than ${MAX_ARCHIVES} archives` }
);

/**
 * Archive name validation (standalone)
 *
 * Used by createArchive() to validate user input before processing.
 *
 * CodeRabbit Fix: Strip zero-width characters to prevent homograph attacks
 * Removes: U+200B (zero-width space), U+200C (zero-width non-joiner),
 *          U+FEFF (zero-width no-break space/BOM)
 *
 * @param name - User-provided archive name
 * @returns Validation result with stripped and trimmed name or error
 */
export function validateArchiveName(name: string): Result<string, { message: string }> {
  // Strip zero-width characters before trim and validation
  const stripped = name
    .replace(/\u200B/g, '') // Zero-width space
    .replace(/\u200C/g, '') // Zero-width non-joiner
    .replace(/\uFEFF/g, '') // Zero-width no-break space (BOM)
    .trim();

  if (stripped.length < MIN_NAME_LENGTH) {
    return {
      ok: false,
      error: { message: `Archive name must be at least ${MIN_NAME_LENGTH} characters` },
    };
  }

  if (stripped.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: { message: `Archive name must be under ${MAX_NAME_LENGTH} characters` },
    };
  }

  return { ok: true, value: stripped };
}

/**
 * UUID v4 validation helper
 *
 * CodeRabbit Fix: Use Zod for consistent validation
 *
 * @param id - String to validate
 * @returns true if valid UUID v4
 */
const uuidSchema = z.string().uuid();

export function isValidArchiveId(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/**
 * Validate and parse archive from unknown data
 *
 * CodeRabbit Fix: Proper Zod return type (not any)
 *
 * @param data - Data to validate
 * @returns Validated archive or error
 */
export function validateArchive(data: unknown) {
  return archiveSchema.safeParse(data);
}

/**
 * Validate and parse archive index from unknown data
 *
 * CodeRabbit Fix: Proper Zod return type (not any)
 *
 * @param data - Data to validate
 * @returns Validated index or error
 */
export function validateArchiveIndex(data: unknown) {
  return archiveIndexSchema.safeParse(data);
}
