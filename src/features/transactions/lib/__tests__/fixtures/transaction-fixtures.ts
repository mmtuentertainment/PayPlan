// Transaction test fixtures
// Feature #063: Business Logic Test Coverage - US3
// Extracted from inline definition for consistency with other features

import type { FixtureFactory } from '../../../../../../tests/fixtures/types';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';

/**
 * Minimal transaction type for schema testing
 * (Full Transaction type includes more fields from feature 061)
 */
interface TestTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  createdAt: string;
}

/**
 * Create transaction fixture for schema testing
 * @param overrides - Fields to override
 * @returns Transaction object
 */
export const createTestTransaction: FixtureFactory<TestTransaction> = (overrides) => ({
  id: `txn_${Math.random().toString(36).substring(2, 15)}`,
  amount: sharedFixtures.amounts.hundredDollars,
  description: 'Test transaction',
  date: '2025-11-15',
  categoryId: sharedFixtures.ids.categoryId1,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});
