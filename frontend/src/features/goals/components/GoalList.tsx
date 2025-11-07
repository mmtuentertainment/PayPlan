/**
 * Goal List Component for Goal Tracking Dashboard (Feature 064)
 * Responsive grid of goal cards
 * US1: View Dashboard
 */

import { GoalCard } from './GoalCard';
import type { Goal } from '../types/goal';

interface GoalListProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onArchive?: (goal: Goal) => void; // T090: Archive completed goal
  onUnarchive?: (goal: Goal) => void; // PR85-8: Unarchive goal (restore to active)
  onContributionAdded?: () => void; // T087: Trigger parent refresh
  onGoalComplete?: (goal: Goal) => void; // For celebration trigger
}

/**
 * Responsive grid of goal cards
 *
 * Responsive layout:
 * - Mobile (375px): 1 column
 * - Tablet (768px): 2 columns
 * - Desktop (1920px): 3 columns
 *
 * @param goals - Array of goals to display
 * @param onEdit - Callback when Edit is clicked on a goal
 * @param onDelete - Callback when Delete is clicked on a goal
 * @param onContributionAdded - Optional callback after contribution added
 * @param onGoalComplete - Optional callback when goal reaches 100%
 */
export function GoalList({ goals, onEdit, onDelete, onArchive, onUnarchive, onContributionAdded, onGoalComplete }: GoalListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onContributionAdded={onContributionAdded}
          onGoalComplete={onGoalComplete}
        />
      ))}
    </div>
  );
}
