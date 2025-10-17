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
  SCHEMA_VERSION,
  INDEX_SCHEMA_VERSION,
} from './constants';

/**
 * DateRange validation schema
 *
 * Validates ISO 8601 date strings (YYYY-MM-DD format).
 * Ensures earliest <= latest for chronological ordering.
 */
export const dateRangeSchema = z.object({
  earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
}).refine(
  (data) => {
    if (!data.earliest || !data.latest) return true; // Empty allowed
    return data.earliest <= data.latest;
  },
  { message: 'earliest date must be before or equal to latest date' }
);

/**
 * ArchiveMetadata validation schema
 *
 * Ensures metadata consistency: paidCount + pendingCount === totalCount.
 */
export const archiveMetadataSchema = z.object({
  totalCount: z.number().int().nonnegative('Total count must be non-negative'),
  paidCount: z.number().int().nonnegative('Paid count must be non-negative'),
  pendingCount: z.number().int().nonnegative('Pending count must be non-negative'),
  dateRange: dateRangeSchema,
  storageSize: z.number().int().positive('Storage size must be positive'),
}).refine(
  (data) => data.paidCount + data.pendingCount === data.totalCount,
  { message: 'paidCount + pendingCount must equal totalCount' }
).refine(
  (data) => data.paidCount <= data.totalCount,
  { message: 'paidCount cannot exceed totalCount' }
).refine(
  (data) => data.pendingCount <= data.totalCount,
  { message: 'pendingCount cannot exceed totalCount' }
);

/**
 * PaymentArchiveRecord validation schema
 *
 * Validates combined payment status + payment details snapshot.
 * Follows PaymentRecord structure from Feature 014.
 */
export const paymentArchiveRecordSchema = z.object({
  // Status fields (from Feature 015)
  paymentId: z.string().uuid('Payment ID must be UUID v4'),
  status: z.enum(['paid', 'pending']),
  timestamp: z.string().datetime('Timestamp must be ISO 8601'),

  // Payment fields (from Feature 014 PaymentRecord)
  provider: z.string().min(1, 'Provider name required').max(255),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter ISO 4217 code').regex(/^[A-Z]{3}$/),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  autopay: z.boolean(),

  // Optional risk fields
  risk_type: z.string().optional(),
  risk_severity: z.string().optional(),
  risk_message: z.string().optional(),
});

/**
 * Archive validation schema
 *
 * Validates complete archive structure with immutable snapshot.
 */
export const archiveSchema = z.object({
  id: z.string().uuid('Archive ID must be UUID v4'),
  name: z.string()
    .min(MIN_NAME_LENGTH, `Archive name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Archive name must be under ${MAX_NAME_LENGTH} characters`)
    .transform((name) => name.trim()), // Auto-trim whitespace
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
  name: z.string().min(1).max(MAX_NAME_LENGTH),
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
 * Validates archive index structure stored in localStorage.
 */
export const archiveIndexSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  archives: z.array(archiveIndexEntrySchema),
  lastModified: z.string().datetime('Last modified must be ISO 8601'),
}).refine(
  (data) => data.archives.length <= 50, // MAX_ARCHIVES
  { message: 'Archive index cannot contain more than 50 archives' }
);

/**
 * Archive name validation (standalone)
 *
 * Used by createArchive() to validate user input before processing.
 *
 * @param name - User-provided archive name
 * @returns Validation result with trimmed name or error
 */
export function validateArchiveName(name: string): Result<string, { message: string }> {
  const trimmed = name.trim();

  if (trimmed.length < MIN_NAME_LENGTH) {
    return {
      ok: false,
      error: { message: 'Archive name cannot be empty' },
    };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: { message: `Archive name must be under ${MAX_NAME_LENGTH} characters` },
    };
  }

  return { ok: true, value: trimmed };
}

/**
 * UUID v4 validation helper
 *
 * @param id - String to validate
 * @returns true if valid UUID v4
 */
export function isValidArchiveId(id: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}

/**
 * Result type for validation
 */
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Validate and parse archive from unknown data
 *
 * @param data - Data to validate
 * @returns Validated archive or error
 */
export function validateArchive(data: unknown): { success: boolean; data?: any; error?: any } {
  return archiveSchema.safeParse(data);
}

/**
 * Validate and parse archive index from unknown data
 *
 * @param data - Data to validate
 * @returns Validated index or error
 */
export function validateArchiveIndex(data: unknown): { success: boolean; data?: any; error?: any } {
  return archiveIndexSchema.safeParse(data);
}
