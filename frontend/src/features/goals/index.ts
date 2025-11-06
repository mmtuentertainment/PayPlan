/**
 * Goals Feature Barrel Export (Feature 064)
 * Public API for Goal Tracking Dashboard
 *
 * Clean imports pattern:
 * import { GoalMetrics, useGoalMetrics } from '@/features/goals';
 */

// Components (Group 3)
export { GoalMetrics } from './components/GoalMetrics';
export { GoalSkeleton } from './components/GoalSkeleton';
export { GoalEmptyState } from './components/GoalEmptyState';

// Components (Group 4)
export { GoalForm } from './components/GoalForm';
export { GoalCard } from './components/GoalCard';
export { GoalList } from './components/GoalList';

// Hooks (Group 3)
export { useGoalMetrics } from './hooks/useGoalMetrics';

// Hooks (Group 4)
export { useGoals } from './hooks/useGoals';

// Types
export type { Goal, CreateGoalInput, UpdateGoalInput, GoalResult } from './types/goal';
export type { Contribution, CreateContributionInput } from './types/contribution';

// Business Logic
export { computeDashboardMetrics, type DashboardMetrics } from './lib/dashboard-metrics';
export { getGoalPercent, getDaysRemaining, getRequiredMonthly, getGoalStatus } from './lib/calculations';
export {
  loadGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  archiveGoal,
  clearGoals,
} from './lib/GoalStorageService';

// Constants
export { STORAGE_KEY, MAX_NAME_LENGTH, MAX_NOTE_LENGTH, MAX_CONTRIBUTIONS, QUICK_ADD_AMOUNTS, STATUS_COLORS, ERROR_MESSAGES } from './lib/constants';
