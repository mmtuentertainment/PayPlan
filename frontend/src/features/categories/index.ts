/**
 * Categories Feature - Public API
 *
 * Spending categories with custom rules and templates.
 * Part of Tier 0 MVP (Constitutional requirement #1)
 */

// Re-export all business logic, types, and utilities from lib
export * from './lib';

// Re-export components (named exports)
export { CategoryCard } from './components/CategoryCard';
export { CategoryForm } from './components/CategoryForm';
export { CategoryList } from './components/CategoryList';
export { CategorySelector } from './components/CategorySelector';
export { DeleteCategoryDialog } from './components/DeleteCategoryDialog';

// Re-export hooks
export { useCategories } from './hooks/useCategories';
