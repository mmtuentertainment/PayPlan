/**
 * TransactionForm Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Form for creating/editing transactions with category assignment.
 *
 * Accessibility: WCAG 2.1 AA
 */

import { useState, useEffect, useRef } from 'react';
import { type Transaction, type CreateTransactionInput } from '@/types/transaction';
import { type Category } from '@/types/category';
import { validateCreateTransactionInput } from '@/lib/transactions/schemas';
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

export interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
  transaction?: Transaction | null;
  mode: 'create' | 'edit';
  categories: Category[];
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  transaction,
  mode,
  categories,
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && transaction) {
        setDescription(transaction.description);
        setAmount((Math.abs(transaction.amount) / 100).toFixed(2));
        setDate(transaction.date);
        setCategoryId(transaction.categoryId || null);
      } else {
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setCategoryId(null);
      }
      setError(null);

      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 0);
    }
  }, [open, mode, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents === 0) {
      setError('Amount must be a non-zero number');
      return;
    }

    const input: CreateTransactionInput = {
      description: description.trim(),
      amount: amountInCents,
      date,
      categoryId: categoryId || undefined,
    };

    const validation = validateCreateTransactionInput(input);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Transaction' : 'Edit Transaction'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Record a new expense or income transaction.'
              : 'Update the transaction details or category.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="transaction-description">
                Description <span aria-label="required">*</span>
              </Label>
              <Input
                id="transaction-description"
                ref={descriptionInputRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Whole Foods"
                maxLength={200}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction-amount">
                Amount <span aria-label="required">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="45.99"
                  className="pl-7"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter positive for expenses, negative for income
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction-date">
                Date <span aria-label="required">*</span>
              </Label>
              <Input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transaction-category">Category</Label>
              <CategorySelector
                categories={categories}
                value={categoryId}
                onValueChange={(id) => setCategoryId(id)}
                placeholder="Select a category (optional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Transaction' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
