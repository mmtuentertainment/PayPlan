/**
 * Test Fixtures for Gamification Widget
 *
 * Provides mock data for testing the populated state of the GamificationWidget
 * with streak, insights, and recent wins.
 *
 * Usage:
 * ```typescript
 * import { mockGamificationData } from '@/tests/fixtures/gamification.fixtures';
 *
 * render(<GamificationWidget data={mockGamificationData} />);
 * ```
 */

import type { GamificationData, PersonalizedInsight, RecentWin } from '@/types/gamification';

/**
 * Mock Personalized Insights
 */
export const mockPositiveInsight: PersonalizedInsight = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'positive',
  category: 'spending',
  percentageChange: 15,
  message: 'You spent 15% less this month compared to last month. Keep it up!',
};

export const mockNegativeInsight: PersonalizedInsight = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  type: 'negative',
  category: 'dining',
  percentageChange: -20,
  message: 'Your dining expenses increased by 20% this month. Consider cooking at home more often.',
};

export const mockNeutralInsight: PersonalizedInsight = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  type: 'neutral',
  category: 'weekend',
  percentageChange: 25,
  message: 'You spend 25% more on weekends. Consider meal prepping to save on weekend dining.',
};

/**
 * Mock Recent Wins
 */
export const mockLargeIncomeWin: RecentWin = {
  id: '550e8400-e29b-41d4-a716-446655440004',
  message: 'You received a large income of $1,500!',
  timestamp: new Date('2025-10-31T10:00:00Z').toISOString(),
  icon: '💰',
};

export const mockUnderBudgetWin: RecentWin = {
  id: '550e8400-e29b-41d4-a716-446655440005',
  message: 'You stayed under budget in Groceries this month!',
  timestamp: new Date('2025-10-30T14:30:00Z').toISOString(),
  icon: '🎯',
};

export const mockSavingsGoalWin: RecentWin = {
  id: '550e8400-e29b-41d4-a716-446655440006',
  message: 'You reached 50% of your Emergency Fund goal!',
  timestamp: new Date('2025-10-29T09:15:00Z').toISOString(),
  icon: '🎉',
};

/**
 * Complete Mock Gamification Data - 3 Day Streak
 *
 * Represents a user who has:
 * - Logged in 3 consecutive days
 * - Had a longest streak of 5 days
 * - Has 2 personalized insights (positive + neutral)
 * - Has 2 recent wins (large income + under budget)
 */
export const mockGamificationData: GamificationData = {
  streak: {
    currentStreak: 3,
    longestStreak: 5,
    lastActivityDate: new Date('2025-10-31T12:00:00Z').toISOString(),
  },
  insights: [mockPositiveInsight, mockNeutralInsight],
  recentWins: [mockLargeIncomeWin, mockUnderBudgetWin],
};

/**
 * Mock Gamification Data - Empty State (Streak = 0)
 *
 * Represents a first-time user with no activity.
 * Should trigger the "Start Your Journey" empty state.
 */
export const mockEmptyGamificationData: GamificationData = {
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date('2025-10-31T12:00:00Z').toISOString(),
  },
  insights: [],
  recentWins: [],
};

/**
 * Mock Gamification Data - Long Streak
 *
 * Represents a highly engaged user with a 30-day streak.
 */
export const mockLongStreakData: GamificationData = {
  streak: {
    currentStreak: 30,
    longestStreak: 45,
    lastActivityDate: new Date('2025-10-31T12:00:00Z').toISOString(),
  },
  insights: [mockPositiveInsight, mockNeutralInsight, mockNegativeInsight],
  recentWins: [mockLargeIncomeWin, mockUnderBudgetWin, mockSavingsGoalWin],
};

/**
 * Mock Gamification Data - No Insights or Wins
 *
 * Represents a user with a streak but no insights or wins yet.
 * Should show streak section only.
 */
export const mockStreakOnlyData: GamificationData = {
  streak: {
    currentStreak: 2,
    longestStreak: 2,
    lastActivityDate: new Date('2025-10-31T12:00:00Z').toISOString(),
  },
  insights: [],
  recentWins: [],
};

/**
 * Mock Gamification Data - All Insight Types
 *
 * Represents data with all three insight types for visual testing.
 */
export const mockAllInsightTypesData: GamificationData = {
  streak: {
    currentStreak: 7,
    longestStreak: 10,
    lastActivityDate: new Date('2025-10-31T12:00:00Z').toISOString(),
  },
  insights: [mockPositiveInsight, mockNegativeInsight, mockNeutralInsight],
  recentWins: [mockLargeIncomeWin],
};
