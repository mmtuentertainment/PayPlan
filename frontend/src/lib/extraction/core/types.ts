import type { DateLocale } from '../../date-parser';
import { z } from 'zod';

/**
 * Zod schema for extraction options validation.
 * Ensures dateLocale is either 'US' or 'EU' if provided.
 */
export const ExtractOptionsSchema = z.object({
  dateLocale: z.enum(['US', 'EU']).optional(),
  bypassCache: z.boolean().optional()
}).optional();

export interface ExtractOptions {
  dateLocale?: DateLocale;
  bypassCache?: boolean; // If true, skip cache and force fresh extraction
}

/**
 * Represents a single BNPL payment item extracted from an email.
 */
export interface Item {
  id: string; // UUID v4 - stable identifier for React keys and undo/redo
  provider: string;
  installment_no: number;
  due_date: string; // ISO YYYY-MM-DD
  raw_due_date?: string; // Original ambiguous date text for re-parsing (e.g., "01/02/2026")
  amount: number; // Integer cents for financial accuracy (e.g., 2500 = $25.00)
  currency: string;
  autopay: boolean;
  late_fee: number; // Integer cents (e.g., 700 = $7.00)
  confidence: number; // 0-1 confidence score (v0.1.4-a)
}

/**
 * Represents an extraction issue/error for a failed email block.
 */
export interface Issue {
  id: string; // Unique identifier for React keys
  snippet: string; // First 100 chars of problematic email (redacted)
  reason: string;
}

/**
 * Result of extracting items from email text.
 */
export interface ExtractionResult {
  items: Item[];
  issues: Issue[];
  duplicatesRemoved: number;
  dateLocale: DateLocale; // Audit trail: which locale was used for parsing (always provided, defaults to 'US')
}

/**
 * Date extraction result containing both parsed ISO date and raw text.
 * Used to enable re-parsing with different locales.
 */
export interface DateExtractionResult {
  isoDate: string;        // Parsed ISO date (e.g., "2025-10-04")
  rawText: string;        // Original matched text (e.g., "10/04/2025")
  isAmbiguous: boolean;   // True if date format is ambiguous (MM/DD vs DD/MM)
}

/**
 * Context object passed through extraction pipeline stages.
 */
export interface ExtractionContext {
  emailText: string;
  timezone: string;
  dateLocale: DateLocale;
  item: Partial<Item>;
  patterns?: any; // Provider-specific patterns
}
