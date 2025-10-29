/**
 * CategorySelector Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Categories to Transactions
 *
 * Radix UI Select dropdown for assigning categories to transactions.
 * Shows category icon, name, and color.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - ARIA labels
 * - Screen reader support
 */

import { type Category } from '@/types/category';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from 'lucide-react';

export interface CategorySelectorProps {
  categories: Category[];
  value?: string | null;
  onValueChange: (categoryId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * CategorySelector is a dropdown for selecting a spending category.
 *
 * @param categories - Available categories
 * @param value - Currently selected category ID (or null for none)
 * @param onValueChange - Callback when selection changes
 * @param placeholder - Placeholder text
 * @param disabled - Whether selector is disabled
 * @param className - Additional CSS classes
 *
 * @example
 * <CategorySelector
 *   categories={categories}
 *   value={transaction.categoryId}
 *   onValueChange={(id) => updateTransaction({ categoryId: id })}
 *   placeholder="Select category..."
 * />
 */
export function CategorySelector({
  categories,
  value,
  onValueChange,
  placeholder = 'Select category',
  disabled = false,
  className,
}: CategorySelectorProps) {
  // Split into default and custom categories
  const defaultCategories = categories.filter((cat) => cat.isDefault);
  const customCategories = categories.filter((cat) => !cat.isDefault);

  // Find selected category for display
  const selectedCategory = categories.find((cat) => cat.id === value);

  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => onValueChange(val === 'none' ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label="Select spending category">
        <SelectValue placeholder={placeholder}>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <CategoryIcon iconName={selectedCategory.iconName} color={selectedCategory.color} />
              <span>{selectedCategory.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* None option */}
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <Icons.X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">None</span>
          </div>
        </SelectItem>

        {/* Default categories */}
        {defaultCategories.length > 0 && (
          <SelectGroup>
            <SelectLabel>Pre-defined</SelectLabel>
            {defaultCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <CategoryIcon iconName={category.iconName} color={category.color} />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {/* Custom categories */}
        {customCategories.length > 0 && (
          <SelectGroup>
            <SelectLabel>Custom</SelectLabel>
            {customCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <CategoryIcon iconName={category.iconName} color={category.color} />
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

/**
 * Helper component to render category icon
 */
function CategoryIcon({ iconName, color }: { iconName: string; color: string }) {
  const pascalCaseName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const IconComponent = (Icons as any)[pascalCaseName] as React.ComponentType<{ className?: string; style?: React.CSSProperties; 'aria-hidden'?: string }> || Icons.HelpCircle;

  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}20` }}
      aria-hidden="true"
    >
      <IconComponent className="h-3 w-3" style={{ color }} aria-hidden="true" />
    </div>
  );
}
