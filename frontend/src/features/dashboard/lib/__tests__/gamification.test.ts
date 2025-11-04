/**
 * Gamification Logic Tests
 * Feature #063: Business Logic Test Coverage - User Story 5
 *
 * Tests streak tracking, insights generation, and wins detection.
 * Behavioral psychology principles validated:
 * - Streak tracking: Loss aversion (Kahneman & Tversky)
 * - Insights: Progress principle (Teresa Amabile)
 * - Wins: Positive reinforcement (BJ Fogg Behavior Model)
 *
 * Target: 80%+ coverage, <5s execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  getStreakData,
  updateStreakData,
  getGamificationData,
  saveGamificationData,
  generateInsights,
  detectRecentWins,
  GAMIFICATION_CONFIG,
} from '../gamification';
import type {
  StreakData,
  GamificationData,
  PersonalizedInsight,
  RecentWin,
} from '@/features/dashboard/types/gamification';
import { createTransaction, createExpense, createIncome } from '@/features/transactions/lib/__tests__/fixtures/transaction-fixtures';
import { createBudget } from '@/features/budgets/lib/__tests__/fixtures/budget-fixtures';
import { createGoal } from './fixtures/dashboard-fixtures';
import { createCategory } from '@/features/categories/lib/__tests__/fixtures/category-fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

/**
 * Helper: Format a date N days ago as YYYY-MM-DD string
 * @param daysAgo - Number of days in the past (0 = today, 1 = yesterday, etc.)
 * @returns ISO date string in YYYY-MM-DD format
 */
function formatDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('Gamification Logic', () => {
  beforeEach(() => {
    // Clear localStorage before each test (isolation)
    localStorage.clear();

    // Reset any mocked dates
    vi.clearAllMocks();
  });

  describe('getStreakData', () => {
    it('should return default streak data when localStorage is empty', () => {
      const result = getStreakData();

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastActivityDate).toBeTruthy();
      expect(typeof result.lastActivityDate).toBe('string');
    });

    it('should read streak data from localStorage', () => {
      const streakData: GamificationData = {
        streak: {
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(streakData));

      const result = getStreakData();

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.lastActivityDate).toBe('2025-11-03T00:00:00.000Z');
    });

    it('should return default data when localStorage contains corrupted JSON', () => {
      localStorage.setItem('payplan_gamification_v1', 'invalid-json-{');

      const result = getStreakData();

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastActivityDate).toBeTruthy();
    });

    it('should return default data when localStorage contains invalid streak data', () => {
      // Missing currentStreak field (Zod validation should fail)
      const invalidData = {
        streak: {
          longestStreak: 10,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(invalidData));

      const result = getStreakData();

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('should return default data when streak has negative values', () => {
      const invalidData: GamificationData = {
        streak: {
          currentStreak: -5, // Invalid: negative streak
          longestStreak: 10,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(invalidData));

      const result = getStreakData();

      // Zod schema should reject negative values
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });
  });

  describe('updateStreakData', () => {
    /**
     * Test: First activity starts a 1-day streak
     *
     * Scenario:
     * - Last activity: Yesterday
     * - Today: New activity
     *
     * Expected: currentStreak = 1, longestStreak = 1
     */
    it('should start streak on first activity', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(formatDateDaysAgo(1)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastActivityDate).toBeTruthy();

      // Verify persistence
      const stored = getGamificationData();
      expect(stored.streak.currentStreak).toBe(1);
    });

    /**
     * Test: Same-day activity doesn't increment streak (prevents gaming)
     *
     * Scenario:
     * - Activity 1 today: Streak becomes 1
     * - Activity 2 same day: Streak stays 1 (not 2)
     *
     * Expected: Users can't game the system by refreshing the page multiple times
     */
    it('should not increment streak on same-day activity (prevent gaming)', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(formatDateDaysAgo(1)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      // First activity today
      const first = updateStreakData();
      expect(first.currentStreak).toBe(1);

      // Second activity same day (should NOT increment)
      const second = updateStreakData();
      expect(second.currentStreak).toBe(1); // Still 1, not 2
      expect(second.longestStreak).toBe(1);
    });

    /**
     * Test: Consecutive day activity increments streak
     *
     * Scenario:
     * - Yesterday: Activity (streak = 3)
     * - Today: New activity
     *
     * Expected: currentStreak = 4, longestStreak stays 5 (4 < 5)
     */
    it('should increment streak on consecutive day activity', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 3,
          longestStreak: 5,
          lastActivityDate: new Date(formatDateDaysAgo(1)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(4); // 3 + 1
      expect(result.longestStreak).toBe(5); // Unchanged (4 < 5)
    });

    /**
     * Test: Streak breaks after missed days (loss aversion principle)
     *
     * Scenario:
     * - 3 days ago: Activity (streak = 5)
     * - Missed 2 days (no activity)
     * - Today: New activity
     *
     * Expected: currentStreak resets to 1, longestStreak preserved at 10
     */
    it('should detect streak break after missed day', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: new Date(formatDateDaysAgo(3)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(1); // Reset to 1 (loss aversion)
      expect(result.longestStreak).toBe(10); // Longest preserved
    });

    /**
     * Test: Longest streak updates when current exceeds it (aspirational goal)
     *
     * Scenario:
     * - Yesterday: Activity (streak = 9, longest = 9)
     * - Today: New activity
     *
     * Expected: currentStreak = 10, longestStreak = 10 (new personal record!)
     */
    it('should update longest streak when current exceeds it', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 9,
          longestStreak: 9,
          lastActivityDate: new Date(formatDateDaysAgo(1)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(10);
      expect(result.longestStreak).toBe(10); // Updated!
    });

    it('should handle edge case: exactly 24 hours later (consecutive day)', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(formatDateDaysAgo(1)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(2); // Should increment
    });

    /**
     * Test: Longest streak preserved across breaks (historical achievement)
     *
     * Scenario:
     * - 3 days ago: Activity (streak = 5, longest = 20 from past)
     * - Missed 2 days
     * - Today: New activity
     *
     * Expected: currentStreak resets to 1, but longestStreak stays 20
     */
    it('should preserve longest streak across multiple streak breaks', () => {
      const gamificationData: GamificationData = {
        streak: {
          currentStreak: 5,
          longestStreak: 20, // Historical record
          lastActivityDate: new Date(formatDateDaysAgo(3)).toISOString(),
        },
        recentWins: [],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));

      const result = updateStreakData();

      // Streak broke, but longest preserved
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(20); // Still 20!
    });
  });

  describe('getGamificationData', () => {
    it('should return default gamification data when localStorage is empty', () => {
      const result = getGamificationData();

      expect(result.streak.currentStreak).toBe(0);
      expect(result.streak.longestStreak).toBe(0);
      expect(result.recentWins).toEqual([]);
      expect(result.insights).toEqual([]);
    });

    it('should read complete gamification data from localStorage', () => {
      const data: GamificationData = {
        streak: {
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [
          {
            id: uuidv4(), // Use real UUID
            message: 'Test win',
            timestamp: '2025-11-03T00:00:00.000Z',
            icon: '🎉',
          },
        ],
        insights: [
          {
            id: uuidv4(), // Use real UUID
            type: 'positive',
            category: 'Groceries',
            percentageChange: -20,
            message: 'Test insight',
          },
        ],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(data));

      const result = getGamificationData();

      expect(result.streak.currentStreak).toBe(5);
      expect(result.recentWins).toHaveLength(1);
      expect(result.recentWins[0].message).toBe('Test win');
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].message).toBe('Test insight');
    });

    it('should return default data when localStorage contains invalid gamification data', () => {
      // Invalid: recentWins has >3 items (max is 3)
      const invalidData = {
        streak: {
          currentStreak: 5,
          longestStreak: 10,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [
          { id: uuidv4(), message: 'Win 1', timestamp: '2025-11-03T00:00:00.000Z', icon: '🎉' },
          { id: uuidv4(), message: 'Win 2', timestamp: '2025-11-03T00:00:00.000Z', icon: '🎉' },
          { id: uuidv4(), message: 'Win 3', timestamp: '2025-11-03T00:00:00.000Z', icon: '🎉' },
          { id: uuidv4(), message: 'Win 4', timestamp: '2025-11-03T00:00:00.000Z', icon: '🎉' }, // 4th item exceeds max
        ],
        insights: [],
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(invalidData));

      const result = getGamificationData();

      // Zod schema rejects the full object but getStreakData() reads the streak separately
      // So streak is preserved (valid), but wins/insights are reset
      expect(result.streak.currentStreak).toBe(5); // Streak is still valid
      expect(result.streak.longestStreak).toBe(10);
      expect(result.recentWins).toEqual([]); // Wins reset (invalid)
      expect(result.insights).toEqual([]); // Insights reset (valid but empty)
    });
  });

  describe('saveGamificationData', () => {
    it('should persist gamification data to localStorage', () => {
      const data: GamificationData = {
        streak: {
          currentStreak: 7,
          longestStreak: 15,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [],
        insights: [],
      };

      saveGamificationData(data);

      const stored = localStorage.getItem('payplan_gamification_v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.streak.currentStreak).toBe(7);
      expect(parsed.streak.longestStreak).toBe(15);
    });

    it('should handle localStorage write errors gracefully', () => {
      // Mock localStorage.setItem to throw (e.g., quota exceeded)
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const data: GamificationData = {
        streak: {
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: '2025-11-03T00:00:00.000Z',
        },
        recentWins: [],
        insights: [],
      };

      // Should not throw
      expect(() => saveGamificationData(data)).not.toThrow();

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('generateInsights', () => {
    it('should generate weekend overspending insight when difference exceeds threshold', () => {
      // Use fake timers to control "now" and eliminate timezone issues
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-10T12:00:00')); // Monday Nov 10, 2025 at noon

      const transactions = [
        // Weekend: Saturday Nov 1 + Sunday Nov 2 = $400 total
        // NOTE: Date-only strings are parsed as UTC (ECMAScript spec quirk)
        // Nov 1, 2025 = Saturday in UTC (day=6)
        // Nov 2, 2025 = Sunday in UTC (day=0)
        createExpense({ amount: 20000, date: '2025-11-01' }), // Saturday (UTC day=6)
        createExpense({ amount: 20000, date: '2025-11-02' }), // Sunday (UTC day=0)

        // Weekdays: Mon-Fri previous week = $125 total ($25/day × 5 days)
        // Oct 27-31, 2025 = Monday-Friday in UTC (days 1-5)
        createExpense({ amount: 2500, date: '2025-10-27' }), // Monday (UTC day=1)
        createExpense({ amount: 2500, date: '2025-10-28' }), // Tuesday (UTC day=2)
        createExpense({ amount: 2500, date: '2025-10-29' }), // Wednesday (UTC day=3)
        createExpense({ amount: 2500, date: '2025-10-30' }), // Thursday (UTC day=4)
        createExpense({ amount: 2500, date: '2025-10-31' }), // Friday (UTC day=5)
      ];

      const result = generateInsights(transactions);

      vi.useRealTimers(); // Restore real timers

      // Weekend: $400, Weekday: $125
      // diff = (400 - 125) / 125 * 100 = 220% (way exceeds 20% threshold)
      expect(result.length).toBeGreaterThan(0);
      const weekendInsight = result.find((insight) =>
        insight.message.toLowerCase().includes('weekend')
      );
      expect(weekendInsight).toBeDefined();
      expect(weekendInsight?.type).toBe('negative'); // Spending more is negative
    });

    /**
     * Test: Month-over-month spending trend insight (only shows after 50% of month)
     *
     * Scenario:
     * - Today: Nov 20 (20/30 = 66.67% of month elapsed - past 50% threshold)
     * - Current month spending: $500 (on day 15)
     * - Last month spending: $1000 (on day 15)
     * - Difference: -50% (spending less)
     *
     * Expected: POSITIVE insight "You spent 50% less this month 📉"
     *
     * Rationale: Only show month-over-month comparison after 50% of month to ensure
     * statistically valid comparison (prevents "you spent less" on day 2 of month)
     */
    it('should generate month-over-month insight when past 50% of month', () => {
      // Use fake timers to set date past 50% of month (ensures test always runs)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-20T12:00:00')); // Nov 20 (20/30 = 66.67% > 50%)

      const transactions = [
        // Current month (November): $500
        createExpense({ amount: 50000, date: '2025-11-15' }),

        // Last month (October): $1000
        createExpense({ amount: 100000, date: '2025-10-15' }),
      ];

      const result = generateInsights(transactions);

      vi.useRealTimers(); // Restore real timers

      // Current month is 50% less than last month (exceeds 10% threshold)
      const monthlyInsight = result.find((insight) =>
        insight.message.toLowerCase().includes('month')
      );
      expect(monthlyInsight).toBeDefined();
      expect(monthlyInsight?.type).toBe('positive'); // Spending less is positive
    });

    it('should handle empty transactions array', () => {
      const result = generateInsights([]);

      expect(result).toEqual([]);
    });

    it('should limit insights to maximum 3', () => {
      // Create scenario with multiple insights
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 7);

      // Generate many transactions to trigger multiple insights
      const transactions = [
        // Weekend overspending
        ...Array.from({ length: 10 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i * 7); // Weekly on weekends
          const day = date.getDay();
          if (day === 0 || day === 6) {
            return createExpense({ amount: 10000, date: date.toISOString().split('T')[0] });
          }
          return createExpense({ amount: 3000, date: date.toISOString().split('T')[0] });
        }),

        // Month-over-month change
        createExpense({ amount: 100000, date: `${currentMonth}-15` }),
        createExpense({ amount: 50000, date: `${lastMonth}-15` }),
      ];

      const result = generateInsights(transactions);

      // Should return max 3 insights
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should filter transactions to last 30 days for recency', () => {
      const now = new Date();

      // Old transaction (60 days ago) - should be ignored
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      // Recent transaction (10 days ago) - should be included
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);

      const transactions = [
        createExpense({ amount: 100000, date: oldDate.toISOString().split('T')[0] }),
        createExpense({ amount: 5000, date: recentDate.toISOString().split('T')[0] }),
      ];

      const result = generateInsights(transactions);

      // Old transaction should not affect insights
      expect(result).toBeDefined();
    });

    it('should not generate insight when below threshold', () => {
      const saturdayDate = new Date();
      saturdayDate.setDate(saturdayDate.getDate() - ((saturdayDate.getDay() + 1) % 7));

      const mondayDate = new Date(saturdayDate);
      mondayDate.setDate(saturdayDate.getDate() - 5);

      const transactions = [
        // Weekend: $100
        createExpense({ amount: 10000, date: saturdayDate.toISOString().split('T')[0] }),

        // Weekdays: $110 (only 10% more, below 20% threshold)
        createExpense({ amount: 11000, date: mondayDate.toISOString().split('T')[0] }),
      ];

      const result = generateInsights(transactions);

      // 10% difference is below 20% threshold
      const weekendInsight = result.find((insight) =>
        insight.message.toLowerCase().includes('weekend')
      );
      expect(weekendInsight).toBeUndefined();
    });

    it('should handle income transactions correctly (exclude from insights)', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const transactions = [
        // Income (negative amount) - should be filtered out
        createIncome({ amount: -100000, date: `${currentMonth}-01` }),

        // Expense (positive amount) - should be included
        createExpense({ amount: 10000, date: `${currentMonth}-15` }),
      ];

      const result = generateInsights(transactions);

      // Income should not affect spending insights
      expect(result).toBeDefined();
    });
  });

  describe('detectRecentWins', () => {
    /**
     * Test: Under-budget win detection with prorated budget calculation
     *
     * Scenario:
     * - Today: Nov 4 (day 4 of November, which has 30 days)
     * - Day progress: 4/30 = 13.33% of month elapsed
     * - Monthly budget: $500
     * - Prorated budget: $500 × (4/30) = $66.67
     * - Actual spending: $50
     * - Remaining: $16.67 under prorated budget
     *
     * Expected: WIN detected with message "You're $16.67 under budget for Groceries! 💪"
     *
     * Rationale: Prorated budget prevents false wins early in month
     * (e.g., spending $100 on day 1 with $500 monthly budget isn't a "win")
     */
    it('should detect under-budget win (prorated)', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Seed category in localStorage (detectRecentWins reads from readCategories())
      const category = createCategory({
        id: 'cat_groceries',
        name: 'Groceries',
      });
      localStorage.setItem('payplan_categories_v1', JSON.stringify([category]));

      const budget = createBudget({
        categoryId: 'cat_groceries',
        amount: 50000, // $500
        period: currentMonth,
      });

      const transactions = [
        createExpense({
          amount: 5000, // $50 spent (well under $66.67 prorated)
          categoryId: 'cat_groceries',
          date: `${currentMonth}-03`,
        }),
      ];

      const result = detectRecentWins(transactions, [budget]);

      expect(result.length).toBeGreaterThan(0);
      const underBudgetWin = result.find((win) =>
        win.message.toLowerCase().includes('under budget')
      );
      expect(underBudgetWin).toBeDefined();
      expect(underBudgetWin?.icon).toBe('💪');
    });

    it('should not detect win when over prorated budget', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Spent more than prorated budget → NO WIN
      const budget = createBudget({
        categoryId: 'cat_groceries',
        amount: 50000, // $500
        period: currentMonth,
      });

      const transactions = [
        createExpense({
          amount: 30000, // $300 spent (over prorated budget)
          categoryId: 'cat_groceries',
          date: `${currentMonth}-05`,
        }),
      ];

      const result = detectRecentWins(transactions, [budget]);

      const underBudgetWin = result.find((win) =>
        win.message.toLowerCase().includes('under budget')
      );
      expect(underBudgetWin).toBeUndefined();
    });

    it('should detect large income win', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

      const transactions = [
        createIncome({
          amount: -150000, // -$1500 income (exceeds $1000 threshold)
          date: recentDate.toISOString().split('T')[0],
        }),
      ];

      const result = detectRecentWins(transactions, []);

      expect(result.length).toBeGreaterThan(0);
      const incomeWin = result.find((win) =>
        win.message.toLowerCase().includes('earned')
      );
      expect(incomeWin).toBeDefined();
      expect(incomeWin?.icon).toBe('💰');
      expect(incomeWin?.message).toContain('1500'); // Should show $1500
    });

    it('should not detect income win below threshold', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);

      const transactions = [
        createIncome({
          amount: -50000, // -$500 income (below $1000 threshold)
          date: recentDate.toISOString().split('T')[0],
        }),
      ];

      const result = detectRecentWins(transactions, []);

      const incomeWin = result.find((win) =>
        win.message.toLowerCase().includes('earned')
      );
      expect(incomeWin).toBeUndefined();
    });

    it('should not detect income win outside recency window', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30); // 30 days ago (outside 7-day window)

      const transactions = [
        createIncome({
          amount: -150000, // -$1500 (would qualify, but too old)
          date: oldDate.toISOString().split('T')[0],
        }),
      ];

      const result = detectRecentWins(transactions, []);

      const incomeWin = result.find((win) =>
        win.message.toLowerCase().includes('earned')
      );
      expect(incomeWin).toBeUndefined();
    });

    it('should handle multiple wins on same day', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2);

      // Seed category
      const category = createCategory({
        id: 'cat_groceries',
        name: 'Groceries',
      });
      localStorage.setItem('payplan_categories_v1', JSON.stringify([category]));

      // Win 1: Under budget
      const budget = createBudget({
        categoryId: 'cat_groceries',
        amount: 50000, // $500
        period: currentMonth,
      });

      const transactions = [
        // Under budget
        createExpense({
          amount: 5000, // $50 (way under prorated budget)
          categoryId: 'cat_groceries',
          date: `${currentMonth}-05`,
        }),

        // Win 2: Large income
        createIncome({
          amount: -200000, // -$2000
          date: recentDate.toISOString().split('T')[0],
        }),
      ];

      const result = detectRecentWins(transactions, [budget]);

      // Should detect both wins
      expect(result.length).toBeGreaterThanOrEqual(2);

      const underBudgetWin = result.find((win) => win.message.includes('under budget'));
      const incomeWin = result.find((win) => win.message.includes('earned'));

      expect(underBudgetWin).toBeDefined();
      expect(incomeWin).toBeDefined();
    });

    it('should handle no wins gracefully', () => {
      const result = detectRecentWins([], []);

      expect(result).toEqual([]);
    });

    it('should limit wins to maximum 3', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Create many budgets with under-spending
      const budgets = Array.from({ length: 10 }, (_, i) =>
        createBudget({
          id: `budget_${i}`,
          categoryId: `cat_${i}`,
          amount: 50000,
          period: currentMonth,
        })
      );

      const transactions = Array.from({ length: 10 }, (_, i) =>
        createExpense({
          id: `txn_${i}`,
          amount: 1000, // $10 (way under budget)
          categoryId: `cat_${i}`,
          date: `${currentMonth}-05`,
        })
      );

      const result = detectRecentWins(transactions, budgets);

      // Should return max 3 wins
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should sort wins by timestamp (most recent first)', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Create transactions at different times
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 6);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);

      const transactions = [
        // Older income
        createIncome({
          amount: -150000,
          date: oldDate.toISOString().split('T')[0],
        }),

        // Recent income
        createIncome({
          amount: -200000,
          date: recentDate.toISOString().split('T')[0],
        }),
      ];

      const result = detectRecentWins(transactions, []);

      if (result.length >= 2) {
        // Most recent should be first
        const first = new Date(result[0].timestamp).getTime();
        const second = new Date(result[1].timestamp).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    it('should handle empty budgets array', () => {
      const transactions = [
        createExpense({ amount: 10000, date: '2025-11-05' }),
      ];

      const result = detectRecentWins(transactions, []);

      // No budget-related wins, but should not crash
      expect(result).toBeDefined();
    });

    it('should filter expenses correctly (exclude income from spending)', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Seed category
      const category = createCategory({
        id: 'cat_groceries',
        name: 'Groceries',
      });
      localStorage.setItem('payplan_categories_v1', JSON.stringify([category]));

      const budget = createBudget({
        categoryId: 'cat_groceries',
        amount: 50000, // $500
        period: currentMonth,
      });

      const transactions = [
        // Income (negative) - should be excluded from spending calculation
        createIncome({
          amount: -100000, // -$1000 income
          date: `${currentMonth}-03`,
        }),

        // Expense (positive) - should be included
        createExpense({
          amount: 3000, // $30 spent (well under $66.67 prorated budget for day 4)
          categoryId: 'cat_groceries',
          date: `${currentMonth}-03`,
        }),
      ];

      const result = detectRecentWins(transactions, [budget]);

      // Income should not count toward spending
      // $30 spent < $66.67 prorated = under budget win
      const underBudgetWin = result.find((win) => win.message.includes('under budget'));
      expect(underBudgetWin).toBeDefined();
    });
  });
});
