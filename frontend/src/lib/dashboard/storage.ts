/**
 * localStorage Utilities for Dashboard
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

import { z } from 'zod';
import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import type { Budget } from '@/types/budget';
import type { StreakData } from '@/types/gamification';

/**
 * Zod schemas for runtime validation of localStorage data
 */

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  iconName: z.string(),
  color: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  description: z.string(),
  date: z.string(),
  categoryId: z.string().optional(),
  createdAt: z.string(),
});

const BudgetSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  amount: z.number(),
  period: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const StreakDataSchema = z.object({
  currentStreak: z.number().nonnegative(),
  longestStreak: z.number().nonnegative(),
  lastActivityDate: z.string(),
});

/**
 * localStorage keys used by dashboard (read-only)
 */
export const STORAGE_KEYS = {
  CATEGORIES: 'payplan_categories_v1',
  BUDGETS: 'payplan_budgets_v1',
  TRANSACTIONS: 'payplan_transactions_v1',
  GOALS: 'payplan_goals_v1',
  GAMIFICATION: 'payplan_gamification_v1',
} as const;

/**
 * Storage wrapper interface for categories
 */
interface CategoryStorage {
  version: string;
  categories: Category[];
}

/**
 * Storage wrapper interface for transactions
 */
interface TransactionStorage {
  version: string;
  transactions: Transaction[];
}

/**
 * Storage wrapper interface for budgets
 */
interface BudgetStorage {
  version: string;
  budgets: Budget[];
}

/**
 * Storage wrapper interface for gamification
 */
interface GamificationStorage {
  version: string;
  streak: StreakData;
  achievements: unknown[]; // Defer to Phase 2
}

/**
 * Read categories from localStorage
 *
 * @returns Validated array of categories, or empty array if invalid/missing
 * @privacy Read-only operation, no data written
 * @validation Uses Zod to validate localStorage data integrity
 */
export function readCategories(): Category[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) return [];

    const parsed: CategoryStorage = JSON.parse(data);
    const categories = parsed.categories || [];

    // Validate each category with Zod
    const validatedCategories = categories.filter((cat) => {
      const result = CategorySchema.safeParse(cat);
      if (!result.success) {
        // Privacy-safe logging: Do not log ZodError (contains raw localStorage data)
        console.warn('Invalid category found in localStorage');
        return false;
      }
      return true;
    });

    return validatedCategories;
  } catch (error) {
    // Privacy-safe logging: Do not log error object (may contain PII from corrupted data)
    console.error('Error reading categories from localStorage');
    return [];
  }
}

/**
 * Read transactions from localStorage
 *
 * @returns Validated array of transactions, or empty array if invalid/missing
 * @privacy Read-only operation, no data written
 * @validation Uses Zod to validate localStorage data integrity
 */
export function readTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];

    const parsed: TransactionStorage = JSON.parse(data);
    const transactions = parsed.transactions || [];

    // Validate each transaction with Zod
    const validatedTransactions = transactions.filter((txn) => {
      const result = TransactionSchema.safeParse(txn);
      if (!result.success) {
        // Privacy-safe logging: Do not log ZodError (contains raw localStorage data)
        console.warn('Invalid transaction found in localStorage');
        return false;
      }
      return true;
    });

    return validatedTransactions;
  } catch (error) {
    // Privacy-safe logging: Do not log error object (may contain PII from corrupted data)
    console.error('Error reading transactions from localStorage');
    return [];
  }
}

/**
 * Read budgets from localStorage
 *
 * @returns Validated array of budgets, or empty array if invalid/missing
 * @privacy Read-only operation, no data written
 * @validation Uses Zod to validate localStorage data integrity
 */
export function readBudgets(): Budget[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return [];

    const parsed: BudgetStorage = JSON.parse(data);
    const budgets = parsed.budgets || [];

    // Validate each budget with Zod
    const validatedBudgets = budgets.filter((budget) => {
      const result = BudgetSchema.safeParse(budget);
      if (!result.success) {
        // Privacy-safe logging: Do not log ZodError (contains raw localStorage data)
        console.warn('Invalid budget found in localStorage');
        return false;
      }
      return true;
    });

    return validatedBudgets;
  } catch (error) {
    // Privacy-safe logging: Do not log error object (may contain PII from corrupted data)
    console.error('Error reading budgets from localStorage');
    return [];
  }
}

/**
 * Read goals from localStorage (conditional - may not exist)
 */
export function readGoals(): unknown[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed.goals || [];
  } catch (error) {
    // Goals feature may not be implemented yet
    return [];
  }
}

/**
 * Read streak data from localStorage
 *
 * @returns Validated StreakData object, or null if not found/invalid
 * @privacy Read-only operation, no data written
 * @validation Uses Zod to validate localStorage data integrity
 *
 * @remarks
 * Returns `null` instead of empty array `[]` because streak data is a single object,
 * not a collection. Returning `null` allows consumers to distinguish between:
 * - `null`: Gamification feature not initialized or data corrupted
 * - `StreakData`: Valid streak data exists (even if currentStreak = 0)
 *
 * This design follows the "Null Object Pattern" for optional singleton data,
 * whereas collections (categories, transactions) return empty arrays.
 */
export function readStreakData(): StreakData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    if (!data) return null;

    const parsed: GamificationStorage = JSON.parse(data);
    const streak = parsed.streak;

    if (!streak) return null;

    // Validate streak data with Zod
    const result = StreakDataSchema.safeParse(streak);
    if (!result.success) {
      // Privacy-safe logging: Do not log ZodError (contains raw localStorage data)
      console.warn('Invalid streak data found in localStorage');
      return null;
    }

    return result.data as StreakData;
  } catch (error) {
    // Privacy-safe logging: Do not log error object (may contain PII from corrupted data)
    console.error('Error reading streak data from localStorage');
    return null;
  }
}

/**
 * NOTE: writeStreakData() was removed from Chunk 1 per bot review feedback.
 *
 * Reason: Chunk 1 is the Foundation & Data Layer and should be READ-ONLY.
 * Write operations violate the stated design principle of "privacy-first,
 * read-only localStorage access" for the foundation layer.
 *
 * Write operations will be added in Chunk 5 (Gamification Widget) where
 * they are actually needed.
 *
 * See: https://github.com/mmtuentertainment/PayPlan/pull/43#issuecomment-3463866463
 */

/**
 * Check if goals feature is available
 */
export function isGoalsFeatureAvailable(): boolean {
  return localStorage.getItem(STORAGE_KEYS.GOALS) !== null;
}
