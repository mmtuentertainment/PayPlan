/**
 * Spending Category Types
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Create and Manage Categories
 *
 * Defines data structures for spending categories used in budget tracking.
 * All types follow strict TypeScript mode (no `any`).
 */

/**
 * Represents a spending category for organizing transactions and budgets.
 *
 * @example
 * {
 *   id: "cat_1a2b3c4d",
 *   name: "Groceries",
 *   iconName: "shopping-cart",
 *   color: "#10b981",
 *   isDefault: true,
 *   createdAt: "2025-10-29T10:00:00Z",
 *   updatedAt: "2025-10-29T10:00:00Z"
 * }
 */
export interface Category {
  /** Unique identifier (UUID v4 format: cat_xxxxxxxx) */
  id: string;

  /** Display name (1-50 characters) */
  name: string;

  /** Lucide React icon name (kebab-case, e.g., "shopping-cart") */
  iconName: string;

  /** Hex color code for visual identification (e.g., "#10b981") */
  color: string;

  /** True if this is a pre-defined category (cannot be deleted) */
  isDefault: boolean;

  /** ISO 8601 datetime when category was created */
  createdAt: string;

  /** ISO 8601 datetime when category was last modified */
  updatedAt: string;
}

/**
 * Input for creating a new category (excludes auto-generated fields).
 */
export interface CreateCategoryInput {
  /** Display name (1-50 characters) */
  name: string;

  /** Lucide React icon name (kebab-case) */
  iconName: string;

  /** Hex color code (e.g., "#10b981") */
  color: string;
}

/**
 * Input for updating an existing category (all fields optional).
 */
export interface UpdateCategoryInput {
  /** Display name (1-50 characters) */
  name?: string;

  /** Lucide React icon name (kebab-case) */
  iconName?: string;

  /** Hex color code (e.g., "#10b981") */
  color?: string;
}

/**
 * Storage schema for categories collection in localStorage.
 * Key: payplan_categories_v1
 */
export interface CategoryStorage {
  /** Schema version for forward compatibility */
  version: string;

  /** Array of all categories */
  categories: Category[];

  /** Total storage size in bytes */
  totalSize: number;

  /** ISO 8601 datetime when collection was last modified */
  lastModified: string;
}

/**
 * Result type for category operations (type-safe error handling).
 */
export type CategoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
