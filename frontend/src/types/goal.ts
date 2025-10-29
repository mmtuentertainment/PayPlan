/**
 * Goal Progress Types
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

/**
 * Goal progress data for dashboard widget
 */
export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number; // 0-100
  targetDate: string | null; // ISO 8601 format, null if no deadline
  daysRemaining: number | null; // null if no target date
  status: 'on-track' | 'at-risk' | 'completed';
}
