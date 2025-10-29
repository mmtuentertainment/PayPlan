/**
 * Budgets Page
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 * User Story: US3 - Track Budget Progress
 *
 * Main page for viewing and managing budgets.
 * Displays budget list with progress, allows create/edit/delete operations.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Screen reader support (ARIA roles, labels, live regions)
 * - Focus management
 * - Responsive design (mobile-first)
 */

import { useState } from 'react';
import { type Budget, type CreateBudgetInput } from '@/types/budget';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetProgress } from '@/hooks/useBudgetProgress';
import { BudgetList } from '@/components/budgets/BudgetList';
import { BudgetForm } from '@/components/budgets/BudgetForm';
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
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Plus, AlertCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/budgets/calculations';

/**
 * Budgets page component.
 * Manages budget CRUD operations with localStorage persistence.
 */
export function Budgets() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { budgets, loading: budgetsLoading, error: budgetsError, createBudget, updateBudget, deleteBudget } = useBudgets();

  // Calculate progress for all budgets
  // TODO: Replace empty transactions array with actual transactions when feature is implemented
  const transactions: any[] = [];
  const { progressItems, summary } = useBudgetProgress(budgets, transactions);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Handle create button click
  const handleCreateClick = () => {
    setFormMode('create');
    setSelectedBudget(null);
    setFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (budget: Budget) => {
    setFormMode('edit');
    setSelectedBudget(budget);
    setFormOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  // Handle form submit (create or edit)
  const handleFormSubmit = async (input: CreateBudgetInput) => {
    if (formMode === 'create') {
      await createBudget(input);
    } else if (selectedBudget) {
      await updateBudget(selectedBudget.id, {
        amount: input.amount,
        period: input.period,
      });
    }
    setFormOpen(false);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete.id);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  // Calculate summary stats
  // Summary already calculated in hook

  const loading = categoriesLoading || budgetsLoading;
  const error = categoriesError || budgetsError;

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading budgets"
      >
        <span className="text-lg text-muted-foreground">Loading budgets...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="mt-2 text-muted-foreground">
            Set spending limits and track your progress throughout the month.
          </p>
        </div>
        <Button onClick={handleCreateClick} size="lg" aria-label="Create new budget">
          <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
          New Budget
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {/* Summary Stats */}
      {budgets.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Budget */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Total Budget</div>
              <DollarSign className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(summary.totalBudget)}</div>
          </div>

          {/* Total Spent */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
              <TrendingDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-2 text-3xl font-bold">{formatCurrency(summary.totalSpent)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {summary.overallPercentage.toFixed(1)}% of budget
            </div>
          </div>

          {/* Remaining */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">Remaining</div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-2 text-3xl font-bold">
              {formatCurrency(summary.totalRemaining)}
            </div>
          </div>

          {/* Budget Status */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground">Status</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-600">On Track</span>
                <span className="font-semibold">{summary.budgetsUnder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-600">Warning</span>
                <span className="font-semibold">{summary.budgetsWarning}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-600">Over Budget</span>
                <span className="font-semibold">{summary.budgetsOver}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <BudgetList
        budgets={budgets}
        progressData={progressItems}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Budget Form Dialog */}
      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        budget={selectedBudget}
        mode={formMode}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the budget for{' '}
              {budgetToDelete &&
                categories.find((c) => c.id === budgetToDelete.categoryId)?.name}{' '}
              ({budgetToDelete?.period}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Budgets;
