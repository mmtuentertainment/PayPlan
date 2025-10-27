/**
 * BNPL Email Parser Types
 *
 * Defines data structures for BNPL payment schedules extracted from emails.
 * All types follow strict TypeScript mode (no `any`).
 */

/**
 * Supported BNPL providers
 */
export type BNPLProvider =
  | 'klarna'
  | 'affirm'
  | 'afterpay'
  | 'sezzle'
  | 'zip'
  | 'paypal-credit';

/**
 * Single installment payment
 */
export interface BNPLInstallment {
  /** Amount for this installment in dollars */
  amount: number;
  /** Due date in ISO 8601 format */
  dueDate: string;
  /** 1-indexed installment number (1 = first payment) */
  installmentNumber: number;
}

/**
 * Complete payment schedule extracted from a BNPL email
 */
export interface BNPLPaymentSchedule {
  /** Unique identifier for this schedule */
  id: string;
  /** BNPL provider name */
  provider: BNPLProvider;
  /** Merchant name (e.g., "Target", "Best Buy") */
  merchant: string;
  /** Total purchase amount in dollars */
  totalAmount: number;
  /** Number of installments */
  installmentCount: number;
  /** Array of individual installment payments */
  installments: BNPLInstallment[];
  /** APR (if applicable, e.g., Affirm with interest) */
  apr?: number;
  /** Timestamp when this schedule was created/parsed (ISO 8601) */
  createdAt: string;
  /** Raw email content (for debugging/support) */
  rawEmail?: string;
}

/**
 * Result of parsing a BNPL email
 */
export interface BNPLParseResult {
  /** True if parsing succeeded */
  success: boolean;
  /** Parsed payment schedule (if successful) */
  schedule?: BNPLPaymentSchedule;
  /** Error message (if failed) */
  error?: string;
  /** Detected provider (even if parsing failed) */
  detectedProvider?: BNPLProvider;
}

/**
 * Base interface for BNPL provider parsers
 */
export interface BNPLParser {
  /** Provider name */
  provider: BNPLProvider;
  /**
   * Detect if email content is from this provider
   * @param emailContent - Raw email text (HTML or plain text)
   * @returns true if this parser can handle the email
   */
  canParse(emailContent: string): boolean;
  /**
   * Parse email content into a payment schedule
   * @param emailContent - Raw email text (HTML or plain text)
   * @returns Parse result with schedule or error
   */
  parse(emailContent: string): BNPLParseResult;
}

/**
 * Error types for BNPL parsing
 */
export const BNPLErrorType = {
  /** Email doesn't match any supported provider */
  UNSUPPORTED_PROVIDER: 'UNSUPPORTED_PROVIDER',
  /** Email matches a provider but critical data is missing */
  MISSING_DATA: 'MISSING_DATA',
  /** Email appears to be promotional, not a purchase confirmation */
  NOT_PURCHASE_CONFIRMATION: 'NOT_PURCHASE_CONFIRMATION',
  /** Invalid email format or unparseable content */
  INVALID_FORMAT: 'INVALID_FORMAT',
  /** Storage error (localStorage full, quota exceeded) */
  STORAGE_ERROR: 'STORAGE_ERROR',
  /** Duplicate email detected */
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
} as const;

export type BNPLErrorType = typeof BNPLErrorType[keyof typeof BNPLErrorType];

/**
 * Structured error for BNPL parsing failures
 */
export interface BNPLError {
  /** Error type */
  type: BNPLErrorType;
  /** Human-readable error message */
  message: string;
  /** Suggested action for the user */
  suggestion: string;
  /** Additional context (optional) */
  context?: Record<string, unknown>;
}
