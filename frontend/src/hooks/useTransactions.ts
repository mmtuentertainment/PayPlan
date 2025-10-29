/**
 * useTransactions Hook
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * React hook for managing transactions with real-time localStorage synchronization.
 * Uses useSyncExternalStore for automatic cross-tab sync.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/types/transaction';
import { TransactionStorageService } from '@/lib/transactions/TransactionStorageService';
import { useLocalStorage } from './useLocalStorage';

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction | null>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  refreshTransactions: () => void;
}

interface TransactionStorage {
  version: string;
  transactions: Transaction[];
  lastModified: string;
}

const STORAGE_KEY = 'payplan_transactions_v1';
const INITIAL_STORAGE: TransactionStorage = {
  version: '1.0.0',
  transactions: [],
  lastModified: new Date().toISOString(),
};

export function useTransactions(): UseTransactionsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new TransactionStorageService());

  // Use useLocalStorage for automatic sync across tabs
  const { value: storageData, setValue: setStorageData } = useLocalStorage<TransactionStorage>(
    STORAGE_KEY,
    INITIAL_STORAGE
  );

  // Extract transactions from storage data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(storageData.transactions || []);
    setLoading(false);
  }, [storageData]);

  const createTransaction = useCallback(
    async (input: CreateTransactionInput): Promise<Transaction | null> => {
      const result = service.createTransaction(input);
      if (result.success) {
        // Trigger cross-tab sync by updating storage
        const updatedStorage: TransactionStorage = {
          version: storageData.version,
          transactions: [...storageData.transactions, result.data],
          lastModified: new Date().toISOString(),
        };
        setStorageData(updatedStorage);
        setError(null);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service, storageData, setStorageData]
  );

  const updateTransaction = useCallback(
    async (id: string, input: UpdateTransactionInput): Promise<Transaction | null> => {
      const result = service.updateTransaction(id, input);
      if (result.success) {
        // Trigger cross-tab sync by updating storage
        const updatedStorage: TransactionStorage = {
          version: storageData.version,
          transactions: storageData.transactions.map((txn) =>
            txn.id === id ? result.data : txn
          ),
          lastModified: new Date().toISOString(),
        };
        setStorageData(updatedStorage);
        setError(null);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    },
    [service, storageData, setStorageData]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const result = service.deleteTransaction(id);
      if (result.success) {
        // Trigger cross-tab sync by updating storage
        const updatedStorage: TransactionStorage = {
          version: storageData.version,
          transactions: storageData.transactions.filter((txn) => txn.id !== id),
          lastModified: new Date().toISOString(),
        };
        setStorageData(updatedStorage);
        setError(null);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    },
    [service, storageData, setStorageData]
  );

  const refreshTransactions = useCallback(() => {
    // With useLocalStorage, refreshing is automatic - just reset loading state
    setLoading(true);
    setTransactions(storageData.transactions || []);
    setLoading(false);
  }, [storageData]);

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
