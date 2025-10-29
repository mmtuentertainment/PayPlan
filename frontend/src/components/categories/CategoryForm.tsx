/**
 * CategoryForm Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Manage Spending Categories
 *
 * Form for creating/editing categories with validation.
 * Uses Radix UI Dialog + Zod validation.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation
 * - ARIA labels and error messages
 * - Focus management (focus on first input when dialog opens)
 * - Screen reader announcements for errors
 */

import { useState, useEffect, useRef } from 'react';
import { type Category, type CreateCategoryInput } from '@/types/category';
import { validateCreateCategoryInput } from '@/lib/categories/schemas';
import { DEFAULT_COLORS } from '@/lib/categories/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateCategoryInput) => Promise<void>;
  category?: Category | null;
  mode: 'create' | 'edit';
}

// Common Lucide icon names for spending categories
const ICON_OPTIONS = [
  { value: 'shopping-cart', label: 'Shopping Cart' },
  { value: 'utensils', label: 'Utensils' },
  { value: 'house', label: 'House' },
  { value: 'car', label: 'Car' },
  { value: 'plane', label: 'Plane' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'heart-pulse', label: 'Health' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'music', label: 'Music' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'gift', label: 'Gift' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'gamepad', label: 'Gaming' },
  { value: 'film', label: 'Entertainment' },
];

export function CategoryForm({ open, onOpenChange, onSubmit, category, mode }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('shopping-cart');
  const [color, setColor] = useState(DEFAULT_COLORS[0].value);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setName(category.name);
        setIconName(category.iconName);
        setColor(category.color);
      } else {
        setName('');
        setIconName('shopping-cart');
        setColor(DEFAULT_COLORS[0].value);
      }
      setError(null);

      // Focus on name input when dialog opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
    }
  }, [open, mode, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: CreateCategoryInput = {
      name: name.trim(),
      iconName,
      color,
    };

    // Validate with Zod
    const validation = validateCreateCategoryInput(input);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get icon component for preview
  const previewIconName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const PreviewIcon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
    previewIconName
  ] || Icons.HelpCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Category' : `Edit ${category?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new spending category to organize your transactions.'
              : 'Update the category name, icon, or color.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}

            {/* Name Input */}
            <div className="grid gap-2">
              <Label htmlFor="category-name">
                Name <span aria-label="required">*</span>
              </Label>
              <Input
                id="category-name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Groceries"
                maxLength={50}
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'category-error' : undefined}
              />
            </div>

            {/* Icon Select */}
            <div className="grid gap-2">
              <Label htmlFor="category-icon">Icon</Label>
              <Select value={iconName} onValueChange={setIconName}>
                <SelectTrigger id="category-icon" aria-label="Select category icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Select */}
            <div className="grid gap-2">
              <Label htmlFor="category-color">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="category-color" aria-label="Select category color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_COLORS.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: colorOption.value }}
                          aria-hidden="true"
                        />
                        <span>{colorOption.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="grid gap-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-3 rounded-md border p-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}20` }}
                  aria-hidden="true"
                >
                  <PreviewIcon className="h-6 w-6" style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold">{name || 'Category Name'}</div>
                  <div className="text-xs text-muted-foreground">{color}</div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
