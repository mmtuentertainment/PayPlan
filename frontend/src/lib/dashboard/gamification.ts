/**
 * Gamification Engine
 *
 * Implements streak tracking, insights generation, and wins detection based on
 * behavioral psychology principles and fintech gamification best practices.
 *
 * Research-backed algorithms:
 * - Streak tracking: Loss aversion (Kahneman & Tversky)
 * - Insights: Progress principle (Teresa Amabile)
 * - Wins: Positive reinforcement (BJ Fogg Behavior Model)
 *
 * @module gamification
 */

import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import type {
  StreakData,
  GamificationData,
  PersonalizedInsight,
  RecentWin,
} from '@/types/gamification';
import type { Transaction } from '@/types/transaction';
import type { Budget } from '@/types/budget';
import { readCategories } from './storage';

const GAMIFICATION_STORAGE_KEY = 'payplan_gamification_v1';

/**
 * Transaction Amount Sign Convention Filters
 *
 * PayPlan uses the following convention:
 * - EXPENSES: Positive amounts (e.g., $50.00 = 5000 cents)
 * - INCOME: Negative amounts (e.g., -$1000.00 = -100000 cents)
 *
 * These filters make the convention explicit and prevent sign errors.
 */
const EXPENSE_FILTER = (amount: number): boolean => amount > 0;
const INCOME_FILTER = (amount: number): boolean => amount < 0;

/**
 * Time Constants
 *
 * Standard time unit conversions for date calculations.
 */
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24; // 86,400,000 ms = 1 day

/**
 * Gamification Configuration
 *
 * These thresholds define the sensitivity of insights and wins detection.
 * Extracted to a configuration object for future customization (Phase 2+).
 *
 * Phase 1: Hardcoded defaults based on behavioral research
 * Phase 2+: Could be made user-configurable via settings
 */
export const GAMIFICATION_CONFIG = {
  /** Show weekend vs weekday insight if difference exceeds this percentage */
  INSIGHT_WEEKEND_THRESHOLD_PERCENT: 20,

  /** Show month-over-month insight if difference exceeds this percentage */
  INSIGHT_MONTHLY_THRESHOLD_PERCENT: 10,

  /** Use only last N days for insight calculations (prevents stale data) */
  INSIGHT_RECENCY_DAYS: 30,

  /** Only show month-over-month insight after this percentage of month elapsed */
  INSIGHT_MONTH_PROGRESS_THRESHOLD: 50,

  /** Celebrate income transactions above this amount (in cents) */
  WIN_LARGE_INCOME_THRESHOLD_CENTS: 100000, // $1000

  /** Look for wins in last N days */
  WIN_RECENT_DAYS: 7,
} as const;

// Destructure for backward compatibility
const {
  INSIGHT_WEEKEND_THRESHOLD_PERCENT,
  INSIGHT_MONTHLY_THRESHOLD_PERCENT,
  INSIGHT_RECENCY_DAYS,
  INSIGHT_MONTH_PROGRESS_THRESHOLD,
  WIN_LARGE_INCOME_THRESHOLD_CENTS,
  WIN_RECENT_DAYS,
} = GAMIFICATION_CONFIG;

/**
 * Zod Validation Schemas
 *
 * Validates localStorage data to prevent runtime errors from corrupted data.
 * Constitutional requirement: "Zod for validation: All user inputs validated with Zod schemas"
 */

const StreakDataSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastActivityDate: z.string().datetime(),
});

const RecentWinSchema = z.object({
  id: z.string().uuid(),
  message: z.string().min(1),
  timestamp: z.string().datetime(),
  icon: z.string().min(1),
});

const PersonalizedInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['positive', 'negative', 'neutral']),
  category: z.string().min(1),
  percentageChange: z.number(),
  message: z.string().min(1),
});

const GamificationDataSchema = z.object({
  streak: StreakDataSchema,
  recentWins: z.array(RecentWinSchema).max(3),
  insights: z.array(PersonalizedInsightSchema).max(3),
});

/**
 * Gets current streak data from localStorage
 *
 * @returns Streak data or default (0 streak)
 */
export function getStreakData(): StreakData {
  try {
    const data = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString(),
      };
    }
    const parsed = JSON.parse(data);

    // Validate with Zod schema (HIGH-1 fix)
    const validation = StreakDataSchema.safeParse(parsed.streak);
    if (!validation.success) {
      console.error('[Gamification] Invalid streak data:', validation.error.message);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString(),
      };
    }

    return validation.data;
  } catch (error) {
    // PII-safe error logging (Feature 019 pattern)
    if (error instanceof Error) {
      console.error('[Gamification] Error reading streak:', error.message);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
    };
  }
}

/**
 * Updates streak data based on current date
 *
 * **Streak Logic**:
 * - Same day: No update (prevents gaming system)
 * - Consecutive day (diff = 1): Increment streak
 * - Skipped day (diff > 1): Reset to 1 (loss aversion)
 *
 * **Behavioral Design**:
 * - Loss aversion: Fear of breaking streak drives daily engagement
 * - Immediate feedback: Streak updates instantly on page load
 * - Long-term goal: Longest streak creates aspirational target
 *
 * **Timezone Handling** (HIGH-2 fix):
 * - Uses local timezone (not UTC) to prevent unfair streak breaks
 * - Example: User in California logs in at 11 PM Oct 30 local time
 *   - UTC would be Oct 31 → streak broken unfairly ❌
 *   - Local time is Oct 30 → streak continues fairly ✅
 *
 * @returns Updated streak data
 */
export function updateStreakData(): StreakData {
  const currentStreak = getStreakData();

  // Use local date (not UTC) to prevent timezone-related streak breaks (HIGH-2 fix)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // "2025-10-30" in local time
  const lastActivityDay = currentStreak.lastActivityDate.slice(0, 10);

  // Same day - no update (prevent gaming by multiple visits)
  if (today === lastActivityDay) {
    return currentStreak;
  }

  // Calculate days difference
  const todayDate = new Date(today);
  const lastDate = new Date(lastActivityDay);
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / MILLISECONDS_PER_DAY
  );

  let newStreak: StreakData;

  if (daysDiff === 1) {
    // Consecutive day - increment streak (reward consistency)
    const newStreakCount = currentStreak.currentStreak + 1;
    newStreak = {
      currentStreak: newStreakCount,
      longestStreak: Math.max(currentStreak.longestStreak, newStreakCount),
      lastActivityDate: new Date().toISOString(),
    };
  } else {
    // Streak broken - reset to 1 (loss aversion - user feels loss)
    newStreak = {
      currentStreak: 1,
      longestStreak: currentStreak.longestStreak, // Preserve historical record
      lastActivityDate: new Date().toISOString(),
    };
  }

  // Persist to localStorage
  const fullData = getGamificationData();
  saveGamificationData({ ...fullData, streak: newStreak });

  return newStreak;
}

/**
 * Gets full gamification data from localStorage
 *
 * @returns Complete gamification data or default
 */
export function getGamificationData(): GamificationData {
  try {
    const data = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!data) {
      return {
        streak: getStreakData(),
        recentWins: [],
        insights: [],
      };
    }

    const parsed = JSON.parse(data);

    // Validate with Zod schema (HIGH-1 fix)
    const validation = GamificationDataSchema.safeParse(parsed);
    if (!validation.success) {
      console.error('[Gamification] Invalid gamification data:', validation.error.message);
      return {
        streak: getStreakData(),
        recentWins: [],
        insights: [],
      };
    }

    return validation.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Gamification] Error reading data:', error.message);
    }
    return {
      streak: getStreakData(),
      recentWins: [],
      insights: [],
    };
  }
}

/**
 * Saves gamification data to localStorage
 *
 * @param data - Complete gamification data
 */
export function saveGamificationData(data: GamificationData): void {
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Gamification] Error saving data:', error.message);
    }
  }
}

/**
 * Generates personalized spending insights based on behavioral patterns
 *
 * **Insight Types**:
 * 1. Weekend vs Weekday Spending (>20% difference)
 * 2. Month-over-Month Trends (>10% difference)
 *
 * **Behavioral Design**:
 * - Actionable: Specific suggestions user can act on
 * - Relevant: Based on user's actual data
 * - Timely: Current month data is fresh
 * - Positive framing: Celebrate decreases, warn about increases
 *
 * @param transactions - All user transactions
 * @returns Up to 3 personalized insights
 */
export function generateInsights(
  transactions: Transaction[]
): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = [];

  // Insight 1: Weekend vs weekday spending (last 30 days only)
  // Fix 1 (Chunk 6): Filter to last 30 days to show recent patterns (not 6-month-old data)
  const thirtyDaysAgo = Date.now() - INSIGHT_RECENCY_DAYS * MILLISECONDS_PER_DAY;

  const weekendSpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      const transactionTime = new Date(t.date).getTime();
      return (
        (day === 0 || day === 6) &&
        EXPENSE_FILTER(t.amount) &&
        transactionTime > thirtyDaysAgo // Only last 30 days
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const weekdaySpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      const transactionTime = new Date(t.date).getTime();
      return (
        day >= 1 &&
        day <= 5 &&
        EXPENSE_FILTER(t.amount) &&
        transactionTime > thirtyDaysAgo // Only last 30 days
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  if (weekendSpending > 0 && weekdaySpending > 0) {
    const diff = ((weekendSpending - weekdaySpending) / weekdaySpending) * 100;
    if (Math.abs(diff) > INSIGHT_WEEKEND_THRESHOLD_PERCENT) {
      insights.push({
        id: uuid(),
        type: diff > 0 ? 'negative' : 'positive',
        category: 'General',
        percentageChange: diff,
        message: `You spend ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} on weekends ${diff > 0 ? '😅' : '🎉'}`,
      });
    }
  }

  // Insight 2: Month-over-month spending change
  // Fix 3 (Chunk 6): Only show after 50% of month to avoid invalid comparisons
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 7); // "2025-10"
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7); // "2025-09"

  // Check if we're past halfway through current month
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgressPercent = (dayOfMonth / daysInMonth) * 100;

  // Only show insight if >50% through month (statistically valid comparison)
  if (monthProgressPercent > INSIGHT_MONTH_PROGRESS_THRESHOLD) {
    const currentMonthSpending = transactions
      .filter((t) => t.date.startsWith(currentMonth) && EXPENSE_FILTER(t.amount))
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthSpending = transactions
      .filter((t) => t.date.startsWith(lastMonth) && EXPENSE_FILTER(t.amount))
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthSpending > 0) {
      // Avoid divide by zero
      const diff = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
      if (Math.abs(diff) > INSIGHT_MONTHLY_THRESHOLD_PERCENT) {
        insights.push({
          id: uuid(),
          type: diff > 0 ? 'negative' : 'positive',
          category: 'General',
          percentageChange: diff,
          message: `You spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} this month ${diff > 0 ? '📈' : '📉'}`,
        });
      }
    }
  }

  // Return max 3 insights (prevents overwhelming user)
  return insights.slice(0, 3);
}

/**
 * Detects recent wins (positive financial actions)
 *
 * **Win Types**:
 * 1. Under Budget: Spent less than monthly limit for any category
 * 2. Large Income: Earned >$1000 in last 7 days
 *
 * **Behavioral Design**:
 * - Positive framing: Celebrate successes, not failures
 * - Specific numbers: "$123.45" > "lots of money"
 * - Timely: Last 7 days are memorable
 *
 * @param transactions - All user transactions
 * @param budgets - All user budgets
 * @returns Up to 3 recent wins
 */
export function detectRecentWins(
  transactions: Transaction[],
  budgets: Budget[]
): RecentWin[] {
  const wins: RecentWin[] = [];

  // Win 1: Under budget for any category (prorated by day of month)
  // Fix 2 (Chunk 6): Prorate budget by day of month for accurate pace tracking
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Read categories to get category names
  const categories = readCategories();

  // Calculate prorated budget based on day of month
  const now = new Date();
  const dayOfMonth = now.getDate(); // 1-31
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); // 28-31

  budgets.forEach((budget) => {
    const spent = transactions
      .filter(
        (t) =>
          t.categoryId === budget.categoryId &&
          t.date.startsWith(currentMonth) &&
          EXPENSE_FILTER(t.amount) // Expenses only
      )
      .reduce((sum, t) => sum + t.amount, 0); // amount is already positive for expenses

    // Convert cents to dollars (Phase 1 pattern from Chunk 4)
    const spentDollars = spent / 100;
    const budgetDollars = budget.amount / 100;

    // Calculate prorated budget for current day of month
    // Example: Oct 5 of 31-day month → 5/31 = 16.1% → $500 budget → $80.65 prorated
    const proratedBudget = (budgetDollars * dayOfMonth) / daysInMonth;

    // Only show win if under PRORATED budget (not full month budget)
    if (spentDollars < proratedBudget) {
      const remainingDollars = proratedBudget - spentDollars;

      const category = categories.find((c) => c.id === budget.categoryId);
      const categoryName = category?.name || 'Unknown';

      wins.push({
        id: uuid(),
        message: `You're $${remainingDollars.toFixed(2)} under budget for ${categoryName}! 💪`,
        timestamp: new Date().toISOString(),
        icon: '💪',
      });
    }
  });

  // Win 2: Large income transaction (last WIN_RECENT_DAYS days)
  const recentDaysAgo = Date.now() - WIN_RECENT_DAYS * MILLISECONDS_PER_DAY;
  const recentIncome = transactions
    .filter(
      (t) => INCOME_FILTER(t.amount) && new Date(t.date).getTime() > recentDaysAgo // Income only (negative amounts)
    )
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]; // Largest income (by absolute value)

  if (recentIncome && Math.abs(recentIncome.amount) > WIN_LARGE_INCOME_THRESHOLD_CENTS) {
    const amountDollars = Math.abs(recentIncome.amount) / 100;
    wins.push({
      id: uuid(),
      message: `💰 Nice! You earned $${amountDollars.toFixed(2)}`,
      timestamp: recentIncome.date,
      icon: '💰',
    });
  }

  // Sort by timestamp (most recent first) and limit to 3
  return wins
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
}
