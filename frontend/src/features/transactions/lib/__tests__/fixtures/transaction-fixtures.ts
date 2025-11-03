// Transaction test fixtures
// Feature #063: Business Logic Test Coverage - US2
// Research Decision 4: Factory + Builder pattern for complex entities
//
// Fixture Naming Convention:
// - Base factory: createTransaction() - Minimal valid entity with defaults
// - Builder class: TransactionBuilder - Fluent API for complex scenarios requiring multiple modifications
// - Trait variations: createExpense(), createIncome(), createUnassignedTransaction() - Common use cases
// - Modifier functions: createTransactionForDate(), createTransactionForCategory() - Single property variations
// - Edge cases: createZeroTransaction(), createNegativeTransaction() - Validation testing
// - Bulk helpers: createTransactions(), createTransactionsForRange() - Performance/stress testing

import { v4 as uuid } from 'uuid';
import type { Transaction } from '../../../types/transaction';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type { FixtureFactory, FixtureBuilder } from '../../../../../../tests/fixtures/types';

/**
 * Create transaction fixture with defaults
 * @param overrides - Fields to override
 * @returns Transaction object
 */
export const createTransaction: FixtureFactory<Transaction> = (overrides) => ({
  id: `txn_${uuid().replace(/-/g, '')}`,
  amount: sharedFixtures.amounts.hundredDollars, // $100.00
  description: 'Test transaction',
  date: '2025-11-15', // Mid-November 2025
  categoryId: sharedFixtures.ids.categoryId1,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

/**
 * Transaction builder for complex test scenarios
 */
export class TransactionBuilder implements FixtureBuilder<Transaction> {
  private transaction: Transaction;

  constructor() {
    this.transaction = createTransaction();
  }

  withAmount(amount: number): this {
    this.transaction.amount = amount;
    return this;
  }

  withCategory(categoryId: string): this {
    this.transaction.categoryId = categoryId;
    return this;
  }

  withDate(date: string): this {
    this.transaction.date = date;
    return this;
  }

  withDescription(description: string): this {
    this.transaction.description = description;
    return this;
  }

  withId(id: string): this {
    this.transaction.id = id;
    return this;
  }

  /**
   * Remove category assignment (unassigned transaction)
   */
  withoutCategory(): this {
    this.transaction.categoryId = undefined;
    return this;
  }

  build(): Transaction {
    return { ...this.transaction }; // Return copy to avoid mutations
  }
}

// Trait variations for common scenarios

/**
 * Create expense transaction
 */
export const createExpense: FixtureFactory<Transaction> = (overrides) =>
  createTransaction({
    amount: sharedFixtures.amounts.hundredDollars, // Positive for expense
    description: 'Expense transaction',
    ...overrides,
  });

/**
 * Create income transaction
 */
export const createIncome: FixtureFactory<Transaction> = (overrides) =>
  createTransaction({
    amount: sharedFixtures.amounts.thousandDollars,
    description: 'Income transaction',
    ...overrides,
  });

/**
 * Create unassigned transaction (no category)
 */
export const createUnassignedTransaction: FixtureFactory<Transaction> = (overrides) =>
  createTransaction({
    categoryId: undefined,
    ...overrides,
  });

/**
 * Create transaction for specific date
 */
export const createTransactionForDate = (date: string): Transaction =>
  createTransaction({ date });

/**
 * Create transaction for specific category
 */
export const createTransactionForCategory = (categoryId: string): Transaction =>
  createTransaction({ categoryId });

// Edge case fixtures

/**
 * Transaction with zero amount (for validation testing)
 */
export const createZeroTransaction = (): Transaction =>
  createTransaction({
    amount: sharedFixtures.amounts.zero,
  });

/**
 * Transaction with negative amount (invalid for expense)
 */
export const createNegativeTransaction = (): Partial<Transaction> => ({
  id: `txn_${uuid().replace(/-/g, '')}`,
  amount: -10000, // -$100.00 (invalid)
  description: 'Negative amount transaction',
  date: '2025-11-15',
  categoryId: sharedFixtures.ids.categoryId1,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Transaction with empty description (for validation testing)
 */
export const createTransactionWithEmptyDescription = (): Partial<Transaction> => ({
  id: `txn_${uuid().replace(/-/g, '')}`,
  amount: sharedFixtures.amounts.hundredDollars,
  description: '', // Invalid: empty description
  date: '2025-11-15',
  categoryId: sharedFixtures.ids.categoryId1,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Transaction with invalid date format (for validation testing)
 */
export const createTransactionWithInvalidDate = (): Partial<Transaction> => ({
  id: `txn_${uuid().replace(/-/g, '')}`,
  amount: sharedFixtures.amounts.hundredDollars,
  description: 'Invalid date transaction',
  date: '2025-13-32', // Invalid date
  categoryId: sharedFixtures.ids.categoryId1,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
});

/**
 * Create multiple transactions for bulk testing
 */
export const createTransactions = (count: number): Transaction[] =>
  Array.from({ length: count }, (_, i) =>
    createTransaction({
      description: `Transaction ${i + 1}`,
      amount: sharedFixtures.amounts.hundredDollars,
    })
  );

/**
 * Create transactions for date range (for filtering tests)
 */
export const createTransactionsForRange = (
  startDate: string,
  endDate: string,
  count: number
): Transaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);

  return Array.from({ length: count }, (_, i) => {
    const dayOffset = Math.floor((daysDiff / count) * i);
    const date = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return createTransaction({
      date: date.toISOString().split('T')[0],
      description: `Transaction ${i + 1}`,
    });
  });
};
