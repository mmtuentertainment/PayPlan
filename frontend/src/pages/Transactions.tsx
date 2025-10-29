/**
 * Transactions Page
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Main page for viewing and managing transactions with category assignments.
 *
 * Accessibility: WCAG 2.1 AA
 */

import { useState } from 'react';
import { type Transaction, type CreateTransactionInput, type UpdateTransactionInput } from '@/types/transaction';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionForm } from '@/components/transactions/TransactionForm';
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
import { Plus, AlertCircle } from 'lucide-react';

export function Transactions() {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { transactions, loading: transactionsLoading, error: transactionsError, createTransaction, updateTransaction, deleteTransaction } = useTransactions();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const handleCreateClick = () => {
    setFormMode('create');
    setSelectedTransaction(null);
    setFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setFormMode('edit');
    setSelectedTransaction(transaction);
    setFormOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (input: CreateTransactionInput) => {
    if (formMode === 'create') {
      await createTransaction(input);
    } else if (selectedTransaction) {
      const updateInput: UpdateTransactionInput = {
        description: input.description,
        amount: input.amount,
        date: input.date,
        categoryId: input.categoryId === undefined ? null : input.categoryId,
      };
      await updateTransaction(selectedTransaction.id, updateInput);
    }
    setFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const loading = categoriesLoading || transactionsLoading;
  const error = categoriesError || transactionsError;

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="text-lg text-muted-foreground">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-2 text-muted-foreground">
            Track your expenses and income, and assign them to categories.
          </p>
        </div>
        <Button onClick={handleCreateClick} size="lg" aria-label="Add new transaction">
          <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
          Add Transaction
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {/* Transaction List */}
      {sortedTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center" role="status">
          <p className="text-lg font-semibold text-muted-foreground">No transactions yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first transaction to start tracking your spending.
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Transactions">
          {sortedTransactions.map((transaction) => {
            const category = categories.find((c) => c.id === transaction.categoryId);
            return (
              <div key={transaction.id} role="listitem">
                <TransactionCard
                  transaction={transaction}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Form */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
        mode={formMode}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{transactionToDelete?.description}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Transactions;
