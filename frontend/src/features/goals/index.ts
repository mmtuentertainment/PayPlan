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

// Components (Group 6)
export { QuickAddSection } from './components/QuickAddSection';

// Components (Group 7)
export { GoalCelebration } from './components/GoalCelebration';

// Components (Group 9 - Phase 9: US7)
export { ContributionForm } from './components/ContributionForm';
export { ContributionHistory } from './components/ContributionHistory';

// Components (Group 10 - Phase 11: T103)
export { ExportGoalsButton } from './components/ExportGoalsButton';

// Hooks (Group 3)
export { useGoalMetrics } from './hooks/useGoalMetrics';

// Hooks (Group 4)
export { useGoals } from './hooks/useGoals';

// Hooks (Group 6)
export { useContributions } from './hooks/useContributions';
export type { UseContributionsResult } from './hooks/useContributions';

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
  unarchiveGoal,
  clearGoals,
  checkStorageQuota,
} from './lib/GoalStorageService';
export type { StorageQuotaResult, LoadGoalsResult } from './lib/GoalStorageService';

// Constants
export { STORAGE_KEY, MAX_NAME_LENGTH, MAX_NOTE_LENGTH, MAX_CONTRIBUTIONS, QUICK_ADD_AMOUNTS, STATUS_COLORS, ERROR_MESSAGES } from './lib/constants';
