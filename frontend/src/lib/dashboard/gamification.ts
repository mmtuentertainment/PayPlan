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
 * Gamification Thresholds
 *
 * These constants define the sensitivity of insights and wins detection.
 * Extracted from magic numbers to improve readability and maintainability.
 */
const INSIGHT_WEEKEND_THRESHOLD_PERCENT = 20; // Show weekend vs weekday insight if >20% difference
const INSIGHT_MONTHLY_THRESHOLD_PERCENT = 10; // Show month-over-month insight if >10% difference
const WIN_LARGE_INCOME_THRESHOLD_CENTS = 100000; // $1000 in cents - celebrate large income
const WIN_RECENT_DAYS = 7; // Look for wins in last 7 days

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
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
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

  // Insight 1: Weekend vs weekday spending
  const weekendSpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return (day === 0 || day === 6) && EXPENSE_FILTER(t.amount); // Sunday or Saturday, expenses only
    })
    .reduce((sum, t) => sum + t.amount, 0); // amount is already positive for expenses

  const weekdaySpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return day >= 1 && day <= 5 && EXPENSE_FILTER(t.amount); // Monday-Friday, expenses only
    })
    .reduce((sum, t) => sum + t.amount, 0); // amount is already positive for expenses

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
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7); // "2025-09"

  const currentMonthSpending = transactions
    .filter((t) => t.date.startsWith(currentMonth) && EXPENSE_FILTER(t.amount))
    .reduce((sum, t) => sum + t.amount, 0); // amount is already positive for expenses

  const lastMonthSpending = transactions
    .filter((t) => t.date.startsWith(lastMonth) && EXPENSE_FILTER(t.amount))
    .reduce((sum, t) => sum + t.amount, 0); // amount is already positive for expenses

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

  // Win 1: Under budget for any category
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Read categories to get category names
  const categories = readCategories();

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
    const budgetDollars = budget.amount / 100; // ✅ FIX: Use budget.amount instead of monthlyLimit

    if (spentDollars < budgetDollars) {
      const remainingDollars = budgetDollars - spentDollars;

      // ✅ FIX: Get category name from categories array
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
  const recentDaysAgo = Date.now() - WIN_RECENT_DAYS * 24 * 60 * 60 * 1000;
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
