/**
 * Dashboard Metrics Calculation for Goal Tracking Dashboard (Feature 064)
 * Computes aggregate metrics for 4 dashboard cards
 */

import type { Goal } from '../types/goal';
import { getGoalPercent, getGoalStatus } from './calculations';

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  totalGoals: number;
  totalSaved: number; // cents
  goalsOnTrack: number;
  averageProgress: number; // percentage (0-100)
}

/**
 * Compute dashboard metrics from goals array
 * @param goals - Array of goals to analyze
 * @returns DashboardMetrics object
 */
export function computeDashboardMetrics(goals: Goal[]): DashboardMetrics {
  // Handle empty case
  if (goals.length === 0) {
    return {
      totalGoals: 0,
      totalSaved: 0,
      goalsOnTrack: 0,
      averageProgress: 0,
    };
  }

  // Total saved across all goals
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  // Count goals that are on-track or completed
  const goalsOnTrack = goals.filter((goal) => {
    const percent = getGoalPercent(goal.currentAmount, goal.targetAmount);
    const status = getGoalStatus(
      percent,
      goal.targetDate
        ? Math.floor(
            (new Date(goal.targetDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null
    );
    return status === 'on-track' || status === 'completed';
  }).length;

  // Average progress across all goals
  const totalProgress = goals.reduce((sum, goal) => {
    const percent = getGoalPercent(goal.currentAmount, goal.targetAmount);
    return sum + percent;
  }, 0);
  const averageProgress = Math.round(totalProgress / goals.length);

  return {
    totalGoals: goals.length,
    totalSaved,
    goalsOnTrack,
    averageProgress,
  };
}
