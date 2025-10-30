/**
 * Goal Progress Widget
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * User Story: US5 - Goal Progress Widget
 * Tasks: T036-T040
 *
 * Displays up to 3 active goals with progress bars and status indicators.
 * Follows patterns established in Chunks 1-3 (React.memo, type-only imports, ARIA labels).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { GoalProgress } from '../../types/goal';
import { EmptyState } from './EmptyState';

export interface GoalProgressWidgetProps {
  goals: GoalProgress[];
}

/**
 * Goal Progress Widget
 * Shows up to 3 active goals with progress bars and status
 *
 * @param goals - Array of goal progress data
 */
export const GoalProgressWidget = React.memo<GoalProgressWidgetProps>(({ goals }) => {
  const navigate = useNavigate();

  const handleCreateGoalClick = (): void => {
    navigate('/goals');
  };

  /**
   * Returns CSS class for progress bar color based on status
   */
  const getStatusColor = (status: string): string => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'on-track') return 'bg-green-500';
    if (status === 'at-risk') return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  /**
   * Returns status text with emoji based on goal status
   */
  const getStatusText = (status: string): string => {
    if (status === 'completed') return '🎉 Goal Complete!';
    if (status === 'on-track') return '✅ On Track';
    if (status === 'at-risk') return '⚠️ At Risk';
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Goal Progress</h2>
      {goals.length === 0 ? (
        <EmptyState
          message="Create your first savings goal"
          action={{
            label: 'Create Goal',
            onClick: handleCreateGoalClick,
          }}
          icon="🎯"
        />
      ) : (
        <ul className="space-y-4">
          {goals.slice(0, 3).map((goal) => (
            <li key={goal.goalId}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{goal.goalName}</p>
                <p className="text-sm text-gray-600">{goal.percentage.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(
                    goal.status
                  )}`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(goal.percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.goalName}: ${goal.percentage.toFixed(0)}% complete`}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                </p>
                <p className="text-gray-500">{getStatusText(goal.status)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

GoalProgressWidget.displayName = 'GoalProgressWidget';
