/**
 * Calculation function tests for Goal Tracking Dashboard (Feature 064)
 * Target: 90%+ coverage (financial logic is CRITICAL)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getGoalPercent,
  getDaysRemaining,
  getRequiredMonthly,
  getGoalStatus,
} from '../calculations';

describe('getGoalPercent', () => {
  it('should return 0% when nothing saved', () => {
    const result = getGoalPercent(0, 100000);
    expect(result).toBe(0);
  });

  it('should return 50% when half saved', () => {
    const result = getGoalPercent(50000, 100000);
    expect(result).toBe(50);
  });

  it('should return 100% when fully saved', () => {
    const result = getGoalPercent(100000, 100000);
    expect(result).toBe(100);
  });

  it('should CLAMP at 100% when over-funded (not 120%)', () => {
    const result = getGoalPercent(120000, 100000);
    expect(result).toBe(100); // NOT 120
  });

  it('should return 0% when zero target and zero saved', () => {
    const result = getGoalPercent(0, 0);
    expect(result).toBe(0);
  });

  it('should return 100% when zero target but money saved', () => {
    const result = getGoalPercent(100, 0);
    expect(result).toBe(100);
  });

  it('should handle decimal percentages correctly', () => {
    const result = getGoalPercent(33333, 100000);
    expect(result).toBeCloseTo(33.333, 2); // Allow float precision
  });

  it('should handle very large amounts', () => {
    const result = getGoalPercent(1000000000, 2000000000); // $10M of $20M
    expect(result).toBe(50);
  });
});

describe('getDaysRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-05T12:00:00')); // Fixed date for deterministic tests
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when no target date', () => {
    const result = getDaysRemaining(null);
    expect(result).toBeNull();
  });

  it('should return positive days for future date', () => {
    const result = getDaysRemaining('2026-06-30');
    expect(result).toBe(237); // From 2025-11-05 to 2026-06-30
  });

  it('should return negative days for past date', () => {
    const result = getDaysRemaining('2024-01-01');
    expect(result).toBeLessThan(0); // Past date = negative days
    expect(result).toBe(-674); // From 2025-11-05 to 2024-01-01
  });

  it('should return 0 for today', () => {
    const result = getDaysRemaining('2025-11-05');
    expect(result).toBe(0);
  });

  it('should return 1 for tomorrow', () => {
    const result = getDaysRemaining('2025-11-06');
    expect(result).toBe(1);
  });

  it('should handle leap year correctly', () => {
    const result = getDaysRemaining('2026-02-28'); // 2026 is NOT a leap year
    expect(result).toBe(115); // From 2025-11-05 to 2026-02-28
  });
});

describe('getRequiredMonthly', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-05T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when no target date', () => {
    const result = getRequiredMonthly(50000, 100000, null);
    expect(result).toBeNull();
  });

  it('should return 0 when already at goal', () => {
    const result = getRequiredMonthly(100000, 100000, '2026-06-30');
    expect(result).toBe(0);
  });

  it('should return 0 when over-funded', () => {
    const result = getRequiredMonthly(120000, 100000, '2026-06-30');
    expect(result).toBe(0);
  });

  it('should calculate linear monthly projection', () => {
    // $500 saved, $1000 target, 7 months remaining
    // Need $500 more = $71.43/month → rounds up to $72 (in cents: 7143)
    const result = getRequiredMonthly(50000, 100000, '2026-06-30');
    expect(result).toBeGreaterThanOrEqual(7140); // ~7142.86 cents rounds up
    expect(result).toBeLessThanOrEqual(7145);
  });

  it('should return remaining amount when <1 month left', () => {
    const result = getRequiredMonthly(50000, 100000, '2025-11-20'); // 15 days
    expect(result).toBe(50000); // Need all $500 remaining
  });

  it('should handle exact 1 month remaining', () => {
    const result = getRequiredMonthly(50000, 100000, '2025-12-05'); // Exactly 1 month
    expect(result).toBe(50000); // Need all $500 in 1 month
  });

  it('should round up fractional cents', () => {
    // $0 saved, $1000 target, 3 months = $333.33/month → $334 (ceil)
    const result = getRequiredMonthly(0, 100000, '2026-02-05');
    expect(result).toBeGreaterThanOrEqual(33333); // Should round up
  });
});

describe('getGoalStatus', () => {
  it('should return completed when 100% or more', () => {
    expect(getGoalStatus(100, 30)).toBe('completed');
    expect(getGoalStatus(120, 30)).toBe('completed');
  });

  it('should return past-due when date passed and <100%', () => {
    expect(getGoalStatus(50, -10)).toBe('past-due');
    expect(getGoalStatus(90, -1)).toBe('past-due');
  });

  it('should return at-risk when <75% progress and <30 days', () => {
    expect(getGoalStatus(50, 20)).toBe('at-risk');
    expect(getGoalStatus(74, 29)).toBe('at-risk');
  });

  it('should return on-track when 75%+ progress and <30 days', () => {
    expect(getGoalStatus(80, 20)).toBe('on-track');
    expect(getGoalStatus(90, 10)).toBe('on-track');
  });

  it('should return on-track when <75% but >30 days', () => {
    expect(getGoalStatus(50, 60)).toBe('on-track');
    expect(getGoalStatus(25, 90)).toBe('on-track');
  });

  it('should return on-track when no target date', () => {
    expect(getGoalStatus(50, null)).toBe('on-track');
    expect(getGoalStatus(10, null)).toBe('on-track');
  });

  it('should handle boundary: exactly 75% and exactly 30 days', () => {
    expect(getGoalStatus(75, 30)).toBe('on-track'); // 75% is NOT <75%
  });

  it('should handle boundary: 74% and 29 days (just under threshold)', () => {
    expect(getGoalStatus(74, 29)).toBe('at-risk');
  });

  it('should return at-risk on day 0 with <75% progress', () => {
    // Day 0 (today) with 50% progress and <30 days = at-risk
    expect(getGoalStatus(50, 0)).toBe('at-risk'); // 0 < 30 and 50 < 75
  });

  it('should return past-due on day -1 (target date yesterday)', () => {
    expect(getGoalStatus(50, -1)).toBe('past-due');
  });
});
