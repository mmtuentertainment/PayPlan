/**
 * Zod Validation Schemas for Transactions
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Provides runtime validation for transaction data.
 */

import { z } from 'zod';

/**
 * ISO 8601 date schema (YYYY-MM-DD).
 */
const iso8601DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * ISO 8601 datetime schema.
 */
const iso8601DatetimeSchema = z.string().datetime();

/**
 * Transaction ID schema (format: txn_xxxxxxxx).
 */
const transactionIdSchema = z
  .string()
  .regex(/^txn_[a-z0-9]+$/, 'Transaction ID must start with "txn_"');

/**
 * Schema for a complete Transaction object.
 */
export const transactionSchema = z.object({
  id: transactionIdSchema,
  amount: z.number().int(),
  description: z.string().min(1).max(200),
  date: iso8601DateSchema,
  categoryId: z.string().optional(),
  createdAt: iso8601DatetimeSchema,
});

/**
 * Schema for creating a new transaction.
 */
export const createTransactionInputSchema = z.object({
  amount: z.number().int(),
  description: z.string().min(1).max(200),
  date: iso8601DateSchema,
  categoryId: z.string().optional(),
});

/**
 * Schema for updating an existing transaction.
 */
export const updateTransactionInputSchema = z.object({
  amount: z.number().int().optional(),
  description: z.string().min(1).max(200).optional(),
  date: iso8601DateSchema.optional(),
  categoryId: z.union([z.string(), z.null()]).optional(),
});

/**
 * Validate a transaction object.
 */
export function validateTransaction(data: unknown) {
  return transactionSchema.safeParse(data);
}

/**
 * Validate create transaction input.
 */
export function validateCreateTransactionInput(data: unknown) {
  return createTransactionInputSchema.safeParse(data);
}

/**
 * Validate update transaction input.
 */
export function validateUpdateTransactionInput(data: unknown) {
  return updateTransactionInputSchema.safeParse(data);
}
