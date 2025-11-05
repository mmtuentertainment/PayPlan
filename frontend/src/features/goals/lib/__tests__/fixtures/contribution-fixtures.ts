// Contribution test fixtures
// Feature #064: Goal Tracking Dashboard

import { v4 as uuid } from 'uuid';
import type { Contribution } from '../../../types/contribution';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type { FixtureFactory } from '../../../../../../tests/fixtures/types';

/**
 * Create contribution fixture with defaults
 * @param overrides - Fields to override
 * @returns Contribution object
 */
export const createContribution: FixtureFactory<Contribution> = (overrides) => ({
  id: uuid(),
  goalId: sharedFixtures.ids.goalId1,
  amount: sharedFixtures.amounts.fiftyDollars, // $50.00
  note: null,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

/**
 * Create contribution with a note
 */
export const createContributionWithNote = (note: string): Contribution =>
  createContribution({
    note,
  });

/**
 * Create a series of contributions for history
 * @param count - Number of contributions to create
 * @param goalId - Goal ID to associate with
 * @returns Array of contributions (oldest first, weekly intervals)
 */
export const createContributionHistory = (count: number, goalId: string): Contribution[] => {
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = (count - i - 1) * 7; // Weekly intervals, oldest first
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return createContribution({
      goalId,
      amount: sharedFixtures.amounts.tenDollars * (i + 1), // Vary amounts: $10, $20, $30, etc.
      note: i % 3 === 0 ? `Contribution ${i + 1}` : null, // Every 3rd has note
      createdAt: date.toISOString(),
    });
  });
};

/**
 * Create contribution with large amount (for testing >$100 contributions)
 */
export const createLargeContribution = (): Contribution =>
  createContribution({
    amount: sharedFixtures.amounts.fiveHundredDollars, // $500.00
  });

/**
 * Create contribution with small amount (for testing small increments)
 */
export const createSmallContribution = (): Contribution =>
  createContribution({
    amount: sharedFixtures.amounts.oneDollar, // $1.00
  });
