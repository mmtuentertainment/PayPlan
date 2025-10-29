/**
 * useTransactions Hook
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * React hook for managing transactions with localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/types/transaction';
import { TransactionStorageService } from '@/lib/transactions/TransactionStorageService';

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction | null>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  refreshTransactions: () => void;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new TransactionStorageService());

  const loadTransactions = useCallback(() => {
    const result = service.loadTransactions();
    if (result.success) {
      setTransactions(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [service]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const createTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction | null> => {
      const result = service.createTransaction(input);
      if (result.success) {
        setTransactions((prev) => [...prev, result.data]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service]
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput): Promise<Transaction | null> => {
      const result = service.updateTransaction(id, input);
      if (result.success) {
        setTransactions((prev) =>
          prev.map((txn) => (txn.id === id ? result.data : txn))
        );
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const result = service.deleteTransaction(id);
      if (result.success) {
        setTransactions((prev) => prev.filter((txn) => txn.id !== id));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    },
    [service]
  );

  const refreshTransactions = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
  };
}
