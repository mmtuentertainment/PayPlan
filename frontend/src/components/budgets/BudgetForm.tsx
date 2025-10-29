/**
 * BudgetForm Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 *
 * Form for creating/editing budgets with validation.
 * Uses Radix UI Dialog + Zod validation.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation
 * - ARIA labels and error messages
 * - Focus management (focus on first input when dialog opens)
 * - Screen reader announcements for errors
 */

import { useState, useEffect, useRef } from 'react';
import { type Budget, type CreateBudgetInput } from '@/types/budget';
import { type Category } from '@/types/category';
import { validateCreateBudgetInput } from '@/lib/budgets/schemas';
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
import { CategorySelector } from '@/components/categories/CategorySelector';
import { Alert } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateBudgetInput) => Promise<void>;
  budget?: Budget | null;
  mode: 'create' | 'edit';
  categories: Category[];
}

/**
 * Get current period (YYYY-MM format)
 */
function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function BudgetForm({
  open,
  onOpenChange,
  onSubmit,
  budget,
  mode,
  categories,
}: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or budget changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && budget) {
        setCategoryId(budget.categoryId);
        setAmount((budget.amount / 100).toFixed(2)); // Convert cents to dollars
        setPeriod(budget.period);
      } else {
        setCategoryId(null);
        setAmount('');
        setPeriod(getCurrentPeriod());
      }
      setError(null);

      // Focus on amount input when dialog opens
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 0);
    }
  }, [open, mode, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    const input: CreateBudgetInput = {
      categoryId,
      amount: amountInCents,
      period,
    };

    // Validate with Zod
    const validation = validateCreateBudgetInput(input);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Budget' : 'Edit Budget'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Set a monthly spending limit for a category.'
              : 'Update the budget amount or period.'}
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

            {/* Category Selector */}
            <div className="grid gap-2">
              <Label htmlFor="budget-category">
                Category <span aria-label="required">*</span>
              </Label>
              <CategorySelector
                categories={categories}
                value={categoryId}
                onValueChange={(id) => setCategoryId(id)}
                placeholder="Select a category..."
                disabled={mode === 'edit'} // Can't change category in edit mode
              />
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  Category cannot be changed. Delete and create a new budget to change category.
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">
                Monthly Budget <span aria-label="required">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="budget-amount"
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500.00"
                  className="pl-7"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'budget-error' : undefined}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the maximum amount you want to spend this month.
              </p>
            </div>

            {/* Period Selector */}
            <div className="grid gap-2">
              <Label htmlFor="budget-period">
                Period <span aria-label="required">*</span>
              </Label>
              <Input
                id="budget-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                aria-required="true"
              />
              <p className="text-xs text-muted-foreground">
                Select the month and year for this budget.
              </p>
            </div>

            {/* Preview */}
            {selectedCategory && amount && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-sm font-medium text-muted-foreground">Preview</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedCategory.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{selectedCategory.name}</span>
                  </div>
                  <div className="text-lg font-bold">
                    ${parseFloat(amount || '0').toFixed(2)}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(period + '-01').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </div>
              </div>
            )}
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
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Budget' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
