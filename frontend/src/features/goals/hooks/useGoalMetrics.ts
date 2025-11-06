/**
 * useGoalMetrics Hook for Goal Tracking Dashboard (Feature 064)
 * Memoized computation of dashboard metrics
 * US1: View Dashboard - Performance optimization
 */

import { useMemo } from 'react';
import type { Goal } from '../types/goal';
import { computeDashboardMetrics, type DashboardMetrics } from '../lib/dashboard-metrics';

/**
 * Hook to compute dashboard metrics with memoization
 * Prevents unnecessary recalculations when goals array hasn't changed
 *
 * @param goals - Array of goals to analyze
 * @returns Dashboard metrics (memoized)
 *
 * @example
 * const { goals } = useGoals();
 * const metrics = useGoalMetrics(goals);
 */
export function useGoalMetrics(goals: Goal[]): DashboardMetrics {
  return useMemo(() => computeDashboardMetrics(goals), [goals]);
}
