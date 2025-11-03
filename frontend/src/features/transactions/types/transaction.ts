/**
 * Transaction Types
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Defines data structures for financial transactions.
 * All types follow strict TypeScript mode (no `any`).
 */

/**
 * Represents a financial transaction.
 *
 * @example
 * {
 *   id: "txn_1a2b3c4d",
 *   amount: 4599,  // $45.99 in cents
 *   description: "Whole Foods",
 *   date: "2025-10-29",
 *   categoryId: "cat_5e6f7g8h",
 *   createdAt: "2025-10-29T10:00:00Z"
 * }
 */
export interface Transaction {
  /** Unique identifier (UUID v4 format: txn_xxxxxxxx) */
  id: string;

  /** Transaction amount in cents (positive for expenses, negative for income) */
  amount: number;

  /** Transaction description/merchant name */
  description: string;

  /** Transaction date (ISO 8601 date: YYYY-MM-DD) */
  date: string;

  /** Optional category assignment (for budget tracking) */
  categoryId?: string;

  /** ISO 8601 datetime when transaction was created */
  createdAt: string;
}

/**
 * Input for creating a new transaction (excludes auto-generated fields).
 */
export interface CreateTransactionInput {
  /** Transaction amount in cents */
  amount: number;

  /** Transaction description/merchant name */
  description: string;

  /** Transaction date (ISO 8601 date: YYYY-MM-DD) */
  date: string;

  /** Optional category assignment */
  categoryId?: string;
}

/**
 * Input for updating an existing transaction (all fields optional).
 */
export interface UpdateTransactionInput {
  /** Transaction amount in cents */
  amount?: number;

  /** Transaction description/merchant name */
  description?: string;

  /** Transaction date (ISO 8601 date: YYYY-MM-DD) */
  date?: string;

  /** Category assignment (set to null to unassign; omit the field to leave unchanged) */
  categoryId?: string | null;
}

/**
 * Result type for transaction operations (type-safe error handling).
 */
export type TransactionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
