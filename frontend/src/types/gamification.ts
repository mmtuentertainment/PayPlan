/**
 * Gamification Types
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

/**
 * Streak tracking data
 */
export interface StreakData {
  currentStreak: number; // Days
  longestStreak: number; // Days
  lastActivityDate: string; // ISO 8601 format
}

/**
 * Recent win (positive financial action)
 */
export interface RecentWin {
  id: string;
  message: string; // e.g., "Paid $50 toward debt! 💪"
  timestamp: string; // ISO 8601 format
  icon: string; // Emoji
}

/**
 * Personalized spending insight
 */
export interface PersonalizedInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  percentageChange: number; // e.g., -20 for 20% decrease
  message: string; // e.g., "You spent 20% less on dining this month! 🎉"
}

/**
 * Complete gamification data for widget
 */
export interface GamificationData {
  streak: StreakData;
  recentWins: RecentWin[]; // Up to 3
  insights: PersonalizedInsight[]; // Up to 3
}
