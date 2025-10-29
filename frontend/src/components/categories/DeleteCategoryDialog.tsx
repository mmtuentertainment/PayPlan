/**
 * DeleteCategoryDialog Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Manage Spending Categories
 *
 * Confirmation dialog for deleting categories.
 * Warns if category has associated transactions or budgets.
 *
 * Accessibility: WCAG 2.1 AA
 * - Focus trapped in dialog
 * - Keyboard navigation (Tab, Enter, Escape)
 * - ARIA roles and labels
 * - Clear warning messages
 */

import { type Category } from '@/types/category';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  category: Category | null;
  transactionCount?: number;
  budgetCount?: number;
}

/**
 * DeleteCategoryDialog shows a confirmation dialog before deleting a category.
 * Provides warnings if the category has associated data.
 *
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback when dialog state changes
 * @param onConfirm - Callback when user confirms deletion
 * @param category - Category to delete
 * @param transactionCount - Number of transactions in this category
 * @param budgetCount - Number of budgets for this category
 *
 * @example
 * <DeleteCategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onConfirm={handleDelete}
 *   category={categoryToDelete}
 *   transactionCount={5}
 *   budgetCount={1}
 * />
 */
export function DeleteCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
  category,
  transactionCount = 0,
  budgetCount = 0,
}: DeleteCategoryDialogProps) {
  if (!category) return null;

  const hasAssociatedData = transactionCount > 0 || budgetCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the category.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasAssociatedData && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <div className="ml-2">
              <p className="font-semibold">Warning: This category has associated data</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {transactionCount > 0 && (
                  <li>
                    {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}{' '}
                    will be unassigned
                  </li>
                )}
                {budgetCount > 0 && (
                  <li>
                    {budgetCount} {budgetCount === 1 ? 'budget' : 'budgets'} will be deleted
                  </li>
                )}
              </ul>
            </div>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Category
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
