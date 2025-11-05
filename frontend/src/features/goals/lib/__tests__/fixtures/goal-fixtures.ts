// Goal test fixtures
// Feature #064: Goal Tracking Dashboard
// Pattern: Factory functions + Builder + trait variations

import { v4 as uuid } from 'uuid';
import type { Goal } from '../../../types/goal';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type {
  FixtureFactory,
  FixtureBuilder,
} from '../../../../../../tests/fixtures/types';

/**
 * Create goal fixture with defaults
 * @param overrides - Fields to override
 * @returns Goal object
 */
export const createGoal: FixtureFactory<Goal> = (overrides) => ({
  id: `goal_${uuid().replace(/-/g, '')}`,
  name: 'Emergency Fund',
  targetAmount: sharedFixtures.amounts.thousandDollars, // $1000.00
  currentAmount: sharedFixtures.amounts.zero,
  targetDate: '2026-06-30', // 18 months from now (hardcoded for deterministic tests)
  monthlyContribution: sharedFixtures.amounts.fiftyDollars, // $50.00
  status: 'active',
  contributions: [],
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});

/**
 * Goal builder for complex test scenarios
 */
export class GoalBuilder implements FixtureBuilder<Goal> {
  private goal: Goal;

  constructor() {
    this.goal = createGoal();
  }

  withId(id: string): this {
    this.goal.id = id;
    return this;
  }

  withName(name: string): this {
    this.goal.name = name;
    return this;
  }

  withTargetAmount(amount: number): this {
    this.goal.targetAmount = amount;
    return this;
  }

  withCurrentAmount(amount: number): this {
    this.goal.currentAmount = amount;
    return this;
  }

  withTargetDate(date: string | null): this {
    this.goal.targetDate = date;
    return this;
  }

  withMonthlyContribution(amount: number | null): this {
    this.goal.monthlyContribution = amount;
    return this;
  }

  withStatus(status: Goal['status']): this {
    this.goal.status = status;
    return this;
  }

  build(): Goal {
    return { ...this.goal }; // Return copy to avoid mutations
  }
}

// Trait variations for common scenarios

/**
 * Goal that's been completed (100% progress)
 */
export const createCompletedGoal = (): Goal =>
  createGoal({
    currentAmount: sharedFixtures.amounts.thousandDollars,
    targetAmount: sharedFixtures.amounts.thousandDollars,
    status: 'completed',
  });

/**
 * Goal that's past target date (overdue)
 */
export const createOverdueGoal = (): Goal =>
  createGoal({
    targetDate: '2024-01-01', // Past date
    currentAmount: sharedFixtures.amounts.fiveHundredDollars, // 50% progress
    targetAmount: sharedFixtures.amounts.thousandDollars,
  });

/**
 * Goal that's behind schedule (< 75% progress, < 30 days remaining)
 */
export const createBehindScheduleGoal = (): Goal => {
  const thirtyDaysAway = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  return createGoal({
    targetAmount: sharedFixtures.amounts.thousandDollars,
    currentAmount: sharedFixtures.amounts.hundredDollars, // Only 10% saved
    targetDate: thirtyDaysAway,
  });
};

/**
 * Goal with no target date (indefinite timeline)
 */
export const createOpenEndedGoal = (): Goal =>
  createGoal({
    targetDate: null,
    monthlyContribution: null,
  });

/**
 * Goal that's almost complete (95-99%)
 */
export const createAlmostCompleteGoal = (): Goal =>
  createGoal({
    targetAmount: sharedFixtures.amounts.thousandDollars,
    currentAmount: 98000, // 98% complete
  });

/**
 * Goal that's just started (<25% progress)
 */
export const createJustStartedGoal = (): Goal =>
  createGoal({
    targetAmount: sharedFixtures.amounts.thousandDollars,
    currentAmount: sharedFixtures.amounts.hundredDollars, // 10% complete
  });

/**
 * Goal that's over-funded (>100%)
 */
export const createOverFundedGoal = (): Goal =>
  createGoal({
    targetAmount: sharedFixtures.amounts.thousandDollars,
    currentAmount: 120000, // 120% complete
    status: 'completed',
  });

/**
 * Archived goal
 */
export const createArchivedGoal = (): Goal =>
  createGoal({
    status: 'archived',
    currentAmount: sharedFixtures.amounts.thousandDollars,
    targetAmount: sharedFixtures.amounts.thousandDollars,
  });
