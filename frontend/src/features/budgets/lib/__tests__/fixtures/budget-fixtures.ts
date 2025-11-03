// Budget test fixtures
// Feature #063: Business Logic Test Coverage
// Research Decision 4: Factory functions + Builder pattern

import { v4 as uuid } from 'uuid';
import type { Budget } from '../../types/budget';
import type { Transaction } from '@/features/transactions/types/transaction';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type { FixtureFactory, FixtureBuilder } from '../../../../../../tests/fixtures/types';

/**
 * Create budget fixture with defaults
 * @param overrides - Fields to override
 * @returns Budget object
 */
export const createBudget: FixtureFactory<Budget> = (overrides) => ({
  id: `budget_${uuid().replace(/-/g, '')}`,
  categoryId: sharedFixtures.ids.categoryId1,
  amount: sharedFixtures.amounts.fiveHundredDollars, // $500.00
  period: '2025-11', // November 2025
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

/**
 * Budget builder for complex test scenarios
 */
export class BudgetBuilder implements FixtureBuilder<Budget> {
  private budget: Budget;

  constructor() {
    this.budget = createBudget();
  }

  withAmount(amount: number): this {
    this.budget.amount = amount;
    return this;
  }

  withCategory(categoryId: string): this {
    this.budget.categoryId = categoryId;
    return this;
  }

  withPeriod(period: string): this {
    this.budget.period = period;
    return this;
  }

  withId(id: string): this {
    this.budget.id = id;
    return this;
  }

  build(): Budget {
    return { ...this.budget }; // Return copy to avoid mutations
  }
}

// Trait variations for common scenarios
export const createOverspentBudget = (): Budget =>
  createBudget({
    amount: sharedFixtures.amounts.fiveHundredDollars,
    // Note: Spent amount comes from transactions, not budget object
  });

export const createUnderbudget = (): Budget =>
  createBudget({
    amount: sharedFixtures.amounts.thousandDollars,
  });

export const createZeroBudget = (): Budget =>
  createBudget({
    amount: sharedFixtures.amounts.zero,
  });

export const createMaxBudget = (): Budget =>
  createBudget({
    amount: sharedFixtures.amounts.maxSafeInteger,
  });

// Transaction fixtures for budget testing
export const createTransaction: FixtureFactory<Transaction> = (overrides) => ({
  id: `txn_${uuid()}`,
  categoryId: sharedFixtures.ids.categoryId1,
  amount: sharedFixtures.amounts.hundredDollars, // $100.00
  date: '2025-11-15', // Mid-November 2025
  description: 'Test transaction',
  type: 'expense',
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

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

  withType(type: 'expense' | 'income'): this {
    this.transaction.type = type;
    return this;
  }

  build(): Transaction {
    return { ...this.transaction };
  }
}
