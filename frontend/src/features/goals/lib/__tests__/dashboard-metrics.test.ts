/**
 * Dashboard Metrics tests for Goal Tracking Dashboard (Feature 064)
 * Target: 90%+ coverage (financial metrics are CRITICAL)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeDashboardMetrics } from '../dashboard-metrics';
import { createGoal } from './fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('computeDashboardMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-05T12:00:00')); // Fixed date for deterministic tests
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return zeros when no goals', () => {
    const result = computeDashboardMetrics([]);

    expect(result).toEqual({
      totalGoals: 0,
      totalSaved: 0,
      goalsOnTrack: 0,
      averageProgress: 0,
    });
  });

  it('should calculate metrics for single goal', () => {
    const goal = createGoal({
      currentAmount: 50000, // $500
      targetAmount: sharedFixtures.amounts.thousandDollars, // $1000
      targetDate: '2026-06-30', // 237 days away
    });

    const result = computeDashboardMetrics([goal]);

    expect(result.totalGoals).toBe(1);
    expect(result.totalSaved).toBe(50000); // $500
    expect(result.goalsOnTrack).toBe(1); // 50% progress, 237 days = on-track
    expect(result.averageProgress).toBe(50); // 50%
  });

  it('should calculate metrics for multiple goals', () => {
    const goal1 = createGoal({
      id: sharedFixtures.ids.goalId1,
      currentAmount: 50000, // $500 (50% of $1000)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2026-06-30',
    });
    const goal2 = createGoal({
      id: sharedFixtures.ids.goalId2,
      currentAmount: 75000, // $750 (75% of $1000)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2026-06-30',
    });

    const result = computeDashboardMetrics([goal1, goal2]);

    expect(result.totalGoals).toBe(2);
    expect(result.totalSaved).toBe(125000); // $500 + $750 = $1250
    expect(result.goalsOnTrack).toBe(2); // Both on-track
    expect(result.averageProgress).toBe(63); // (50 + 75) / 2 = 62.5 → rounds to 63
  });

  it('should count completed goals as on-track', () => {
    const completedGoal = createGoal({
      currentAmount: sharedFixtures.amounts.thousandDollars, // $1000 (100%)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      status: 'completed',
    });
    const activeGoal = createGoal({
      currentAmount: 50000, // $500 (50%)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2026-06-30',
    });

    const result = computeDashboardMetrics([completedGoal, activeGoal]);

    expect(result.totalGoals).toBe(2);
    expect(result.goalsOnTrack).toBe(2); // Both count as on-track
    expect(result.averageProgress).toBe(75); // (100 + 50) / 2
  });

  it('should exclude at-risk goals from goalsOnTrack', () => {
    const atRiskGoal = createGoal({
      currentAmount: 50000, // $500 (50% of $1000)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2025-11-15', // Only 10 days away, <75% progress = at-risk
    });
    const onTrackGoal = createGoal({
      currentAmount: 80000, // $800 (80%)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2025-11-15', // 10 days away, but >75% = on-track
    });

    const result = computeDashboardMetrics([atRiskGoal, onTrackGoal]);

    expect(result.totalGoals).toBe(2);
    expect(result.goalsOnTrack).toBe(1); // Only onTrackGoal counts
    expect(result.averageProgress).toBe(65); // (50 + 80) / 2
  });

  it('should exclude past-due goals from goalsOnTrack', () => {
    const pastDueGoal = createGoal({
      currentAmount: 50000, // $500 (50%)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2025-11-01', // 4 days ago = past-due
    });

    const result = computeDashboardMetrics([pastDueGoal]);

    expect(result.totalGoals).toBe(1);
    expect(result.goalsOnTrack).toBe(0); // Past-due doesn't count
    expect(result.averageProgress).toBe(50);
  });

  it('should handle goals with no target date (always on-track)', () => {
    const noDateGoal = createGoal({
      currentAmount: 25000, // $250 (25%)
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: null, // No deadline = always on-track
    });

    const result = computeDashboardMetrics([noDateGoal]);

    expect(result.totalGoals).toBe(1);
    expect(result.goalsOnTrack).toBe(1); // No deadline = on-track
    expect(result.averageProgress).toBe(25);
  });

  it('should handle mixed goal statuses', () => {
    const completedGoal = createGoal({
      currentAmount: sharedFixtures.amounts.thousandDollars, // 100%
      targetAmount: sharedFixtures.amounts.thousandDollars,
      status: 'completed',
    });
    const onTrackGoal = createGoal({
      currentAmount: 60000, // 60%
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2026-06-30', // Far away
    });
    const atRiskGoal = createGoal({
      currentAmount: 30000, // 30%
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2025-11-15', // <30 days, <75% progress
    });
    const pastDueGoal = createGoal({
      currentAmount: 40000, // 40%
      targetAmount: sharedFixtures.amounts.thousandDollars,
      targetDate: '2025-11-01', // Past
    });

    const result = computeDashboardMetrics([
      completedGoal,
      onTrackGoal,
      atRiskGoal,
      pastDueGoal,
    ]);

    expect(result.totalGoals).toBe(4);
    expect(result.totalSaved).toBe(230000); // $2300
    expect(result.goalsOnTrack).toBe(2); // Only completed + onTrack
    expect(result.averageProgress).toBe(58); // (100 + 60 + 30 + 40) / 4 = 57.5 → 58
  });

  it('should round average progress to nearest integer', () => {
    const goal1 = createGoal({
      currentAmount: 33333, // 33.333%
      targetAmount: 100000, // $1000
      targetDate: null,
    });
    const goal2 = createGoal({
      currentAmount: 66667, // 66.667%
      targetAmount: 100000, // $1000
      targetDate: null,
    });

    const result = computeDashboardMetrics([goal1, goal2]);

    // (33.333 + 66.667) / 2 = 50.0
    expect(result.averageProgress).toBe(50);
  });

  it('should handle very large amounts', () => {
    const goal1 = createGoal({
      currentAmount: 1000000000, // $10M
      targetAmount: 2000000000, // $20M
      targetDate: null,
    });
    const goal2 = createGoal({
      currentAmount: 500000000, // $5M
      targetAmount: 1000000000, // $10M
      targetDate: null,
    });

    const result = computeDashboardMetrics([goal1, goal2]);

    expect(result.totalGoals).toBe(2);
    expect(result.totalSaved).toBe(1500000000); // $15M
    expect(result.goalsOnTrack).toBe(2);
    expect(result.averageProgress).toBe(50); // (50 + 50) / 2
  });
});
