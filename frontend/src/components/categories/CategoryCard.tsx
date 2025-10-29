/**
 * CategoryCard Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Manage Spending Categories
 *
 * Displays a single category with icon, name, color, and transaction count.
 * Provides edit/delete actions with keyboard accessibility.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation (Tab, Enter, Space)
 * - ARIA labels for actions
 * - Focus management
 * - 4.5:1 text contrast, 3:1 UI contrast
 */

import { type Category } from '@/types/category';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryCardProps {
  category: Category;
  transactionCount?: number;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  className?: string;
}

/**
 * CategoryCard displays a spending category with visual icon and metadata.
 *
 * @param category - Category to display
 * @param transactionCount - Number of transactions in this category (optional)
 * @param onEdit - Callback when edit button clicked
 * @param onDelete - Callback when delete button clicked
 * @param className - Additional CSS classes
 *
 * @example
 * <CategoryCard
 *   category={groceriesCategory}
 *   transactionCount={15}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export function CategoryCard({
  category,
  transactionCount = 0,
  onEdit,
  onDelete,
  className,
}: CategoryCardProps) {
  // Get the Lucide icon component dynamically
  // Convert kebab-case to PascalCase (e.g., shopping-cart -> ShoppingCart)
  const iconName = category.iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ className?: string; style?: React.CSSProperties; 'aria-hidden'?: string }>;

  return (
    <Card
      className={cn('transition-shadow hover:shadow-lg', className)}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: category.color,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Category Icon */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${category.color}20`, // 20% opacity
              }}
              aria-hidden="true"
            >
              {IconComponent ? (
                <IconComponent
                  className="h-6 w-6"
                  style={{ color: category.color }}
                  aria-hidden="true"
                />
              ) : (
                <Icons.HelpCircle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              )}
            </div>

            {/* Category Name */}
            <div>
              <h3 className="text-lg font-semibold leading-none">{category.name}</h3>
              {category.isDefault && (
                <span className="mt-1 inline-block text-xs text-muted-foreground">
                  Pre-defined
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!category.isDefault && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(category)}
                  aria-label={`Edit ${category.name} category`}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(category)}
                  aria-label={`Delete ${category.name} category`}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{transactionCount}</span>
          <span className="text-sm text-muted-foreground">
            {transactionCount === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full items-center gap-2 text-xs text-muted-foreground">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-label={`Color: ${category.color}`}
          />
          <span>{category.color}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
