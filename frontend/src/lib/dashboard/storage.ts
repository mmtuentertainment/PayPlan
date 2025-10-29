/**
 * localStorage Utilities for Dashboard
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';
import type { Budget } from '@/types/budget';
import type { StreakData } from '@/types/gamification';

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
 */
export function readCategories(): Category[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) return [];

    const parsed: CategoryStorage = JSON.parse(data);
    return parsed.categories || [];
  } catch (error) {
    console.error('Error reading categories from localStorage:', error);
    return [];
  }
}

/**
 * Read transactions from localStorage
 */
export function readTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];

    const parsed: TransactionStorage = JSON.parse(data);
    return parsed.transactions || [];
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error);
    return [];
  }
}

/**
 * Read budgets from localStorage
 */
export function readBudgets(): Budget[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) return [];

    const parsed: BudgetStorage = JSON.parse(data);
    return parsed.budgets || [];
  } catch (error) {
    console.error('Error reading budgets from localStorage:', error);
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
 */
export function readStreakData(): StreakData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    if (!data) return null;

    const parsed: GamificationStorage = JSON.parse(data);
    return parsed.streak || null;
  } catch (error) {
    console.error('Error reading streak data from localStorage:', error);
    return null;
  }
}

/**
 * Write streak data to localStorage
 */
export function writeStreakData(streak: StreakData): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    let data: GamificationStorage;

    if (existing) {
      data = JSON.parse(existing);
      data.streak = streak;
    } else {
      data = {
        version: '1.0',
        streak,
        achievements: [],
      };
    }

    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing streak data to localStorage:', error);
  }
}

/**
 * Check if goals feature is available
 */
export function isGoalsFeatureAvailable(): boolean {
  return localStorage.getItem(STORAGE_KEYS.GOALS) !== null;
}
