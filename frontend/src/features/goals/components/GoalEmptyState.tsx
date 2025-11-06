/**
 * Goal Empty State Component for Goal Tracking Dashboard (Feature 064)
 * Displays when user has no goals yet
 * US1: View Dashboard - Zero state handling
 */

import { Button } from '@/shared/components/ui/button';

interface GoalEmptyStateProps {
  onCreateGoal: () => void;
}

/**
 * Empty state display for goals dashboard
 * Encourages user to create their first goal
 *
 * Accessibility:
 * - Semantic HTML (section, heading, paragraph)
 * - ARIA label for context
 * - Focus management on button
 *
 * @param onCreateGoal - Callback when "Create First Goal" button is clicked
 */
export function GoalEmptyState({ onCreateGoal }: GoalEmptyStateProps) {
  return (
    <section
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="region"
      aria-label="No goals created yet"
    >
      {/* Icon placeholder (could add actual icon later) */}
      <div className="w-16 h-16 mb-6 rounded-full bg-blue-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No goals yet
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Start building your financial future by creating your first savings goal.
        Track your progress and celebrate when you reach your targets!
      </p>

      <Button onClick={onCreateGoal} size="lg">
        Create First Goal
      </Button>
    </section>
  );
}
