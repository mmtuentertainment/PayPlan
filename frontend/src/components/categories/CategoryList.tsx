/**
 * CategoryList Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Manage Spending Categories
 *
 * Displays a grid of CategoryCard components.
 * Responsive layout (1 column on mobile, 2 on tablet, 3 on desktop).
 *
 * Accessibility: WCAG 2.1 AA
 * - Semantic HTML (list markup)
 * - Keyboard navigation
 * - Empty state messaging
 */

import { type Category } from '@/types/category';
import { CategoryCard } from './CategoryCard';

export interface CategoryListProps {
  categories: Category[];
  transactionCounts?: Record<string, number>;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  className?: string;
}

/**
 * CategoryList displays a responsive grid of category cards.
 *
 * @param categories - Array of categories to display
 * @param transactionCounts - Map of category ID to transaction count
 * @param onEdit - Callback when edit button clicked
 * @param onDelete - Callback when delete button clicked
 * @param className - Additional CSS classes
 *
 * @example
 * <CategoryList
 *   categories={categories}
 *   transactionCounts={{ 'cat_groceries': 15, 'cat_housing': 3 }}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export function CategoryList({
  categories,
  transactionCounts = {},
  onEdit,
  onDelete,
  className,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-muted-foreground">No categories yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first category to start organizing your transactions.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className || ''}`}
      role="list"
      aria-label="Spending categories"
    >
      {categories.map((category) => (
        <div key={category.id} role="listitem">
          <CategoryCard
            category={category}
            transactionCount={transactionCounts[category.id] || 0}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
