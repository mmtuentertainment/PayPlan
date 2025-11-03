// TransactionStorageService Tests
// Feature #063: Business Logic Test Coverage - US2
// Target: 80%+ coverage for TransactionStorageService.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionStorageService } from '../TransactionStorageService';
import { createTransaction, TransactionBuilder, createTransactions } from './fixtures';
import type { Transaction, CreateTransactionInput } from '../../../types/transaction';

const STORAGE_KEY = 'payplan_transactions_v1';
const MAX_TRANSACTIONS = 10000;

const ERROR_MESSAGES = {
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  INVALID_TRANSACTION_DATA: 'Invalid transaction data',
  MAX_TRANSACTIONS_REACHED: `Maximum ${MAX_TRANSACTIONS} transactions allowed`,
  STORAGE_ACCESS_DENIED: 'localStorage access denied',
  SERIALIZATION_FAILED: 'Failed to serialize transactions',
  DESERIALIZATION_FAILED: 'Failed to load transactions',
} as const;

describe('TransactionStorageService', () => {
  let service: TransactionStorageService;

  beforeEach(() => {
    service = new TransactionStorageService();
    localStorage.clear();
  });

  describe('loadTransactions', () => {
    it('should return empty array on first load', () => {
      const result = service.loadTransactions();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return transactions from localStorage if they exist', () => {
      // Create a transaction
      const createResult = service.createTransaction({
        amount: 10000,
        description: 'Test transaction',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      });
      expect(createResult.success).toBe(true);

      // Load should return the transaction
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(1);
        expect(loadResult.data[0].description).toBe('Test transaction');
      }
    });

    it('should return error for corrupted localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const result = service.loadTransactions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(ERROR_MESSAGES.DESERIALIZATION_FAILED);
      }
    });

    it('should handle SecurityError when localStorage is denied', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function () {
        const error = new Error('localStorage access denied');
        error.name = 'SecurityError';
        throw error;
      };

      const result = service.loadTransactions();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.STORAGE_ACCESS_DENIED);
      }

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('createTransaction', () => {
    it('should create a new transaction', () => {
      const input: CreateTransactionInput = {
        amount: 10000, // $100.00
        description: 'Coffee purchase',
        date: '2025-11-15',
        categoryId: 'cat_dining',
      };

      const result = service.createTransaction(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toMatch(/^txn_/);
        expect(result.data.amount).toBe(input.amount);
        expect(result.data.description).toBe(input.description);
        expect(result.data.date).toBe(input.date);
        expect(result.data.categoryId).toBe(input.categoryId);
        expect(result.data.createdAt).toBeDefined();
      }
    });

    it('should persist transaction to localStorage', () => {
      const input: CreateTransactionInput = {
        amount: 10000,
        description: 'Test persistence',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      };

      service.createTransaction(input);

      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((t) => t.description === input.description);
        expect(found).toBeDefined();
      }
    });

    it('should create transaction without category (optional)', () => {
      const input: CreateTransactionInput = {
        amount: 10000,
        description: 'Uncategorized transaction',
        date: '2025-11-15',
        // categoryId intentionally omitted
      };

      const result = service.createTransaction(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoryId).toBeUndefined();
      }
    });

    it('should return error when max transactions limit is reached', () => {
      // Create MAX_TRANSACTIONS transactions (this will be slow, so use a smaller sample)
      // Note: For real test, we'd need to mock this or use a smaller limit
      // For now, just verify the logic exists by checking the error message
      const input: CreateTransactionInput = {
        amount: 10000,
        description: 'Test',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      };

      // Mock loadTransactions to return max transactions
      const originalLoad = service.loadTransactions.bind(service);
      service.loadTransactions = () => ({
        success: true,
        data: createTransactions(MAX_TRANSACTIONS),
      });

      const result = service.createTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.MAX_TRANSACTIONS_REACHED);
      }

      // Restore
      service.loadTransactions = originalLoad;
    });

  });

  describe('updateTransaction', () => {
    let existingTransaction: Transaction;

    beforeEach(() => {
      const createResult = service.createTransaction({
        amount: 10000,
        description: 'Original transaction',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      });
      if (createResult.success) {
        existingTransaction = createResult.data;
      }
    });

    it('should update transaction amount', () => {
      const result = service.updateTransaction(existingTransaction.id, {
        amount: 15000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(15000);
        expect(result.data.id).toBe(existingTransaction.id);
      }
    });

    it('should update transaction description and category', () => {
      const result = service.updateTransaction(existingTransaction.id, {
        description: 'Updated description',
        categoryId: 'cat_dining',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Updated description');
        expect(result.data.categoryId).toBe('cat_dining');
        expect(result.data.amount).toBe(existingTransaction.amount); // Unchanged
      }
    });

    it('should update transaction date', () => {
      const result = service.updateTransaction(existingTransaction.id, {
        date: '2025-12-01',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe('2025-12-01');
      }
    });

    it('should persist updates to localStorage', () => {
      service.updateTransaction(existingTransaction.id, {
        description: 'Persisted update',
      });

      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        const found = loadResult.data.find((t) => t.id === existingTransaction.id);
        expect(found?.description).toBe('Persisted update');
      }
    });

    it('should return error for non-existent transaction', () => {
      const result = service.updateTransaction('txn_nonexistent', {
        amount: 15000,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
      }
    });

    it('should allow removing category assignment (null)', () => {
      const result = service.updateTransaction(existingTransaction.id, {
        categoryId: null,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categoryId).toBeUndefined();
      }
    });
  });

  describe('deleteTransaction', () => {
    let transaction: Transaction;

    beforeEach(() => {
      const createResult = service.createTransaction({
        amount: 10000,
        description: 'Deletable transaction',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      });
      if (createResult.success) {
        transaction = createResult.data;
      }
    });

    it('should delete transaction', () => {
      const result = service.deleteTransaction(transaction.id);

      expect(result.success).toBe(true);

      // Verify transaction is removed
      const loadResult = service.loadTransactions();
      if (loadResult.success) {
        const found = loadResult.data.find((t) => t.id === transaction.id);
        expect(found).toBeUndefined();
      }
    });

    it('should persist deletion to localStorage', () => {
      service.deleteTransaction(transaction.id);

      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(0);
      }
    });

    it('should handle deleting non-existent transaction gracefully', () => {
      // TransactionStorageService deleteTransaction filters, so non-existent is not an error
      const result = service.deleteTransaction('txn_nonexistent');

      expect(result.success).toBe(true);
    });
  });

  describe('getTransactionsByCategory', () => {
    beforeEach(() => {
      service.createTransaction({
        amount: 10000,
        description: 'Groceries',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      });
      service.createTransaction({
        amount: 5000,
        description: 'Restaurant',
        date: '2025-11-15',
        categoryId: 'cat_dining',
      });
      service.createTransaction({
        amount: 15000,
        description: 'More groceries',
        date: '2025-11-16',
        categoryId: 'cat_groceries',
      });
    });

    it('should return transactions for specific category', () => {
      const result = service.getTransactionsByCategory('cat_groceries');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data.every((t) => t.categoryId === 'cat_groceries')).toBe(true);
      }
    });

    it('should return empty array for category with no transactions', () => {
      const result = service.getTransactionsByCategory('cat_nonexistent');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('clearAll', () => {
    it('should remove all transactions from localStorage', () => {
      service.createTransaction({
        amount: 10000,
        description: 'Test',
        date: '2025-11-15',
        categoryId: 'cat_groceries',
      });

      const clearResult = service.clearAll();
      expect(clearResult.success).toBe(true);

      const data = localStorage.getItem(STORAGE_KEY);
      expect(data).toBeNull();
    });
  });

  describe('Concurrent writes (last-write-wins)', () => {
    it('should handle rapid transaction creation', () => {
      const transactions: Transaction[] = [];

      // Create 10 transactions rapidly
      for (let i = 0; i < 10; i++) {
        const result = service.createTransaction({
          amount: 1000 * (i + 1),
          description: `Transaction ${i + 1}`,
          date: '2025-11-15',
          categoryId: 'cat_groceries',
        });
        if (result.success) {
          transactions.push(result.data);
        }
      }

      expect(transactions.length).toBe(10);

      // Verify all transactions are persisted
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(10);
      }
    });
  });

  describe('Large datasets', () => {
    it('should handle 100+ transactions efficiently', () => {
      // Create 100 transactions
      for (let i = 0; i < 100; i++) {
        const result = service.createTransaction({
          amount: 10000,
          description: `Transaction ${i + 1}`,
          date: '2025-11-15',
          categoryId: 'cat_groceries',
        });
        expect(result.success).toBe(true);
      }

      // Load and verify
      const loadResult = service.loadTransactions();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.length).toBe(100);
      }

      // Filter should still be fast
      const filterResult = service.getTransactionsByCategory('cat_groceries');
      expect(filterResult.success).toBe(true);
      if (filterResult.success) {
        expect(filterResult.data.length).toBe(100);
      }
    });
  });
});
