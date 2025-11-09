/**
 * Goal Celebration Statistics Tests
 * Feature: Goal Tracking Dashboard (064-short-name-goal)
 * Phase: 11 (Polish & Cross-Cutting)
 *
 * PR81-1 Fix: Tests for extracted GoalCelebration business logic.
 * Constitution v3.1 requirement: 90%+ coverage for financial calculations.
 *
 * Test Coverage:
 * - ✅ Valid goal (happy path)
 * - ✅ Missing required fields (createdAt, updatedAt, currentAmount)
 * - ✅ Invalid dates (NaN)
 * - ✅ Division by zero protection (0 months)
 * - ✅ Edge cases (same month, negative months, large values)
 */

import { describe, it, expect } from 'vitest';
import { calculateCelebrationStats } from '../celebration-stats';
import type { Goal } from '../../types/goal';

describe('calculateCelebrationStats', () => {
  // Helper to create test goal
  const createTestGoal = (overrides: Partial<Goal> = {}): Goal => ({
    id: 'goal_test123',
    name: 'Test Goal',
    targetAmount: 100000, // $1,000
    currentAmount: 100000, // $1,000
    targetDate: null,
    monthlyContribution: null,
    status: 'completed',
    contributions: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z', // 5 months later
    ...overrides,
  });

  describe('Happy Path', () => {
    it('should calculate stats for valid goal completed in 5 months', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z',
        currentAmount: 50000, // $500
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(5);
        expect(result.stats.avgMonthly).toBe(10000); // $500 / 5 months = $100/month
      }
    });

    it('should calculate stats for goal completed in 1 month', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-02-01T00:00:00Z',
        currentAmount: 20000, // $200
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(1);
        expect(result.stats.avgMonthly).toBe(20000); // $200 / 1 month = $200/month
      }
    });

    it('should calculate stats for goal completed in 12 months', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        currentAmount: 120000, // $1,200
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(12);
        expect(result.stats.avgMonthly).toBe(10000); // $1200 / 12 months = $100/month
      }
    });
  });

  describe('Validation - Missing Required Fields', () => {
    it('should return error when createdAt is missing', () => {
      const goal = createTestGoal({
        createdAt: '', // Empty string
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing required fields');
        expect(result.error).toContain('createdAt');
      }
    });

    it('should return error when updatedAt is missing', () => {
      const goal = createTestGoal({
        updatedAt: '', // Empty string
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing required fields');
      }
    });

    it('should return error when currentAmount is null', () => {
      const goal = createTestGoal({
        currentAmount: null as any, // Force null
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing required fields');
      }
    });

    it('should return error when currentAmount is undefined', () => {
      const goal = createTestGoal({
        currentAmount: undefined as any, // Force undefined
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing required fields');
      }
    });
  });

  describe('Validation - Invalid Dates', () => {
    it('should return error when createdAt is invalid date string', () => {
      const goal = createTestGoal({
        createdAt: 'invalid-date',
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid dates');
        expect(result.error).toContain('invalid-date');
      }
    });

    it('should return error when updatedAt is invalid date string', () => {
      const goal = createTestGoal({
        updatedAt: 'not-a-date',
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid dates');
        expect(result.error).toContain('not-a-date');
      }
    });

    it('should return error when both dates are invalid', () => {
      const goal = createTestGoal({
        createdAt: '2025-99-99', // Invalid month/day
        updatedAt: '2025-13-45', // Invalid month/day
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid dates');
      }
    });
  });

  describe('Division by Zero Protection', () => {
    it('should use 1 month minimum when goal completed in 0 months (same month)', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-25T00:00:00Z', // Same month
        currentAmount: 50000, // $500
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(0); // differenceInMonths returns 0
        // avgMonthly should use Math.max(months, 1) to avoid division by zero
        expect(result.stats.avgMonthly).toBe(50000); // $500 / max(0, 1) = $500
      }
    });

    it('should handle goal completed on same day (0 months)', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z', // 1 hour later
        currentAmount: 10000, // $100
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(0);
        expect(result.stats.avgMonthly).toBe(10000); // $100 / max(0, 1) = $100
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero currentAmount', () => {
      const goal = createTestGoal({
        currentAmount: 0,
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(5);
        expect(result.stats.avgMonthly).toBe(0); // $0 / 5 months = $0/month
      }
    });

    it('should handle large currentAmount (millions)', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-12-01T00:00:00Z',
        currentAmount: 100000000, // $1,000,000
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(11);
        // $1M / 11 months = 9090909.090909... (floating point precision)
        expect(result.stats.avgMonthly).toBeCloseTo(9090909.09, 2);
      }
    });

    it('should handle fractional avgMonthly (cents precision)', () => {
      const goal = createTestGoal({
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-04-01T00:00:00Z',
        currentAmount: 10000, // $100
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(3);
        // $100 / 3 months = $33.333... (JavaScript floating point)
        expect(result.stats.avgMonthly).toBeCloseTo(3333.33, 2);
      }
    });

    it('should reject updatedAt before createdAt (data corruption - PR86-2)', () => {
      const goal = createTestGoal({
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z', // 5 months BEFORE createdAt (invalid!)
        currentAmount: 50000,
      });

      const result = calculateCelebrationStats(goal);

      // PR86-2: Negative months indicate data corruption (updatedAt < createdAt)
      // Should fail fast with clear error message instead of displaying nonsensical stats
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid date order');
        expect(result.error).toContain('2025-01-01T00:00:00Z'); // updatedAt
        expect(result.error).toContain('2025-06-01T00:00:00Z'); // createdAt
        expect(result.error).toContain('5 months before'); // Clear description
      }
    });

    it('should handle leap year edge case', () => {
      const goal = createTestGoal({
        createdAt: '2024-02-29T00:00:00Z', // Leap year
        updatedAt: '2025-02-28T00:00:00Z', // 1 year later
        currentAmount: 120000, // $1,200
      });

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.months).toBe(12); // Exactly 1 year
        expect(result.stats.avgMonthly).toBe(10000); // $1200 / 12 = $100/month
      }
    });
  });

  describe('Type Safety', () => {
    it('should handle Goal type with all required fields', () => {
      // This test ensures the function works with the full Goal type
      const goal: Goal = {
        id: 'goal_type_test',
        name: 'Type Safety Test',
        targetAmount: 100000,
        currentAmount: 100000,
        targetDate: '2025-12-31',
        monthlyContribution: 20000,
        status: 'completed',
        contributions: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z',
      };

      const result = calculateCelebrationStats(goal);

      expect(result.success).toBe(true);
    });
  });
});
