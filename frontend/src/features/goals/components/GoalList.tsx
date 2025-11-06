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
  onAddContribution?: (goal: Goal) => void;
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
 * @param onAddContribution - Optional callback for quick-add (Group 6)
 */
export function GoalList({ goals, onEdit, onDelete, onAddContribution }: GoalListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddContribution={onAddContribution}
        />
      ))}
    </div>
  );
}
