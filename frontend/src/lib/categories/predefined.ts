/**
 * Pre-defined Spending Categories
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US5 - Use Pre-defined Categories
 *
 * Provides 9 default categories that are seeded on first use.
 * These categories cannot be deleted (isDefault: true), only hidden.
 */

import type { Category } from '../../types/category';

/**
 * Stable creation timestamp for default categories.
 * Computed once at module load to maintain consistent createdAt values.
 */
const DEFAULT_CREATED_AT = new Date().toISOString();

/**
 * 9 pre-defined spending categories.
 * Icons verified against Lucide React v0.544.0 (https://lucide.dev/icons/).
 *
 * Note: Housing uses "house" (not "home") per Lucide naming convention.
 */
export const PREDEFINED_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'cat_default_groceries',
    name: 'Groceries',
    iconName: 'shopping-cart',
    color: '#10b981', // Tailwind green-500
    isDefault: true,
  },
  {
    id: 'cat_default_dining',
    name: 'Dining',
    iconName: 'utensils',
    color: '#f97316', // Tailwind orange-500
    isDefault: true,
  },
  {
    id: 'cat_default_transportation',
    name: 'Transportation',
    iconName: 'car',
    color: '#3b82f6', // Tailwind blue-500
    isDefault: true,
  },
  {
    id: 'cat_default_housing',
    name: 'Housing',
    iconName: 'house', // CORRECTED: Lucide uses "house", not "home"
    color: '#8b5cf6', // Tailwind violet-500
    isDefault: true,
  },
  {
    id: 'cat_default_utilities',
    name: 'Utilities',
    iconName: 'zap',
    color: '#eab308', // Tailwind yellow-500
    isDefault: true,
  },
  {
    id: 'cat_default_entertainment',
    name: 'Entertainment',
    iconName: 'film',
    color: '#ec4899', // Tailwind pink-500
    isDefault: true,
  },
  {
    id: 'cat_default_healthcare',
    name: 'Healthcare',
    iconName: 'heart',
    color: '#ef4444', // Tailwind red-500
    isDefault: true,
  },
  {
    id: 'cat_default_debt',
    name: 'Debt',
    iconName: 'credit-card',
    color: '#6366f1', // Tailwind indigo-500
    isDefault: true,
  },
  {
    id: 'cat_default_savings',
    name: 'Savings',
    iconName: 'piggy-bank',
    color: '#14b8a6', // Tailwind teal-500
    isDefault: true,
  },
];

/**
 * Check if a category ID is a pre-defined category.
 */
export function isDefaultCategory(categoryId: string): boolean {
  return categoryId.startsWith('cat_default_');
}

/**
 * Get a pre-defined category by ID.
 */
export function getDefaultCategory(categoryId: string): Category | undefined {
  const predefined = PREDEFINED_CATEGORIES.find((cat) => cat.id === categoryId);
  if (!predefined) return undefined;

  return {
    ...predefined,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get all pre-defined categories with timestamps.
 */
export function getAllDefaultCategories(): Category[] {
  const now = new Date().toISOString();
  return PREDEFINED_CATEGORIES.map((cat) => ({
    ...cat,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: now,
  }));
}
