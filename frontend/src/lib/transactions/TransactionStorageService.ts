/**
 * TransactionStorageService - Browser localStorage management for transactions
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Implements privacy-first local storage with CRUD operations.
 */

import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionResult,
} from '@/types/transaction';
import {
  validateCreateTransactionInput,
  validateUpdateTransactionInput,
} from './schemas';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'payplan_transactions_v1';
const SCHEMA_VERSION = '1.0.0';
const MAX_TRANSACTIONS = 10000;

const ERROR_MESSAGES = {
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  INVALID_TRANSACTION_DATA: 'Invalid transaction data',
  MAX_TRANSACTIONS_REACHED: `Maximum ${MAX_TRANSACTIONS} transactions allowed`,
  STORAGE_ACCESS_DENIED: 'localStorage access denied',
  SERIALIZATION_FAILED: 'Failed to serialize transactions',
  DESERIALIZATION_FAILED: 'Failed to load transactions',
} as const;

interface TransactionStorage {
  version: string;
  transactions: Transaction[];
  lastModified: string;
}

export class TransactionStorageService {
  loadTransactions(): TransactionResult<Transaction[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        const emptyStorage: TransactionStorage = {
          version: SCHEMA_VERSION,
          transactions: [],
          lastModified: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyStorage));
        return { success: true, data: [] };
      }

      const parsed = JSON.parse(data);
      return { success: true, data: parsed.transactions || [] };
    } catch (error) {
      if (error instanceof Error && error.name === 'SecurityError') {
        return { success: false, error: ERROR_MESSAGES.STORAGE_ACCESS_DENIED };
      }
      return {
        success: false,
        error: `${ERROR_MESSAGES.DESERIALIZATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private saveTransactions(transactions: Transaction[]): TransactionResult<void> {
    try {
      const storage: TransactionStorage = {
        version: SCHEMA_VERSION,
        transactions,
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage quota exceeded' };
      }
      if (error instanceof Error && error.name === 'SecurityError') {
        return { success: false, error: ERROR_MESSAGES.STORAGE_ACCESS_DENIED };
      }
      return {
        success: false,
        error: `${ERROR_MESSAGES.SERIALIZATION_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  createTransaction(input: CreateTransactionInput): TransactionResult<Transaction> {
    const validation = validateCreateTransactionInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_TRANSACTION_DATA}: ${validation.error.message}`,
      };
    }

    const loadResult = this.loadTransactions();
    if (!loadResult.success) {
      return loadResult;
    }

    const transactions = loadResult.data;

    if (transactions.length >= MAX_TRANSACTIONS) {
      return { success: false, error: ERROR_MESSAGES.MAX_TRANSACTIONS_REACHED };
    }

    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      id: `txn_${uuidv4().replace(/-/g, '')}`,
      amount: input.amount,
      description: input.description,
      date: input.date,
      categoryId: input.categoryId,
      createdAt: now,
    };

    const saveResult = this.saveTransactions([...transactions, newTransaction]);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: newTransaction };
  }

  updateTransaction(id: string, input: UpdateTransactionInput): TransactionResult<Transaction> {
    const validation = validateUpdateTransactionInput(input);
    if (!validation.success) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_TRANSACTION_DATA}: ${validation.error.message}`,
      };
    }

    const loadResult = this.loadTransactions();
    if (!loadResult.success) {
      return loadResult;
    }

    const transactions = loadResult.data;
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      return { success: false, error: ERROR_MESSAGES.TRANSACTION_NOT_FOUND };
    }

    const updatedTransaction: Transaction = {
      ...transactions[index],
      ...input,
      // Handle null categoryId (unassignment)
      categoryId: input.categoryId === null ? undefined : (input.categoryId ?? transactions[index].categoryId),
    };

    const updatedTransactions = [...transactions];
    updatedTransactions[index] = updatedTransaction;

    const saveResult = this.saveTransactions(updatedTransactions);
    if (!saveResult.success) {
      return saveResult;
    }

    return { success: true, data: updatedTransaction };
  }

  deleteTransaction(id: string): TransactionResult<void> {
    const loadResult = this.loadTransactions();
    if (!loadResult.success) {
      return loadResult;
    }

    const transactions = loadResult.data.filter((t) => t.id !== id);
    return this.saveTransactions(transactions);
  }

  getTransactionsByCategory(categoryId: string): TransactionResult<Transaction[]> {
    const loadResult = this.loadTransactions();
    if (!loadResult.success) {
      return loadResult;
    }

    const filtered = loadResult.data.filter((t) => t.categoryId === categoryId);
    return { success: true, data: filtered };
  }

  clearAll(): TransactionResult<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
