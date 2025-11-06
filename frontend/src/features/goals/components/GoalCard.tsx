/**
 * Goal Card Component for Goal Tracking Dashboard (Feature 064)
 * Individual goal display with progress bar, status badge, and actions
 * US1: View Dashboard, US3: Edit Goal, US4: Delete Goal
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/features/budgets/lib/calculations';
import type { Goal } from '../types/goal';
import { getGoalPercent, getDaysRemaining, getGoalStatus } from '../lib/calculations';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onAddContribution?: (goal: Goal) => void;
}

/**
 * Get badge variant based on goal status
 */
function getStatusVariant(
  status: 'completed' | 'past-due' | 'at-risk' | 'on-track'
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'; // Green
    case 'past-due':
      return 'destructive'; // Red
    case 'at-risk':
      return 'secondary'; // Yellow
    case 'on-track':
      return 'outline'; // Blue
    default:
      return 'outline';
  }
}

/**
 * Get status label with icon for accessibility
 */
function getStatusLabel(status: 'completed' | 'past-due' | 'at-risk' | 'on-track'): string {
  switch (status) {
    case 'completed':
      return '✓ Completed';
    case 'past-due':
      return '⚠ Past Due';
    case 'at-risk':
      return '⚠ At Risk';
    case 'on-track':
      return '→ On Track';
    default:
      return status;
  }
}

/**
 * Get progress bar color class based on status (traffic light system)
 * Triple encoding: Color + percentage text + status badge
 *
 * Returns Tailwind classes for Shadcn Progress indicator
 */
function getProgressIndicatorClass(status: 'completed' | 'past-due' | 'at-risk' | 'on-track'): string {
  switch (status) {
    case 'completed':
      return '[&>div]:bg-green-600'; // Green - goal achieved
    case 'past-due':
      return '[&>div]:bg-red-600'; // Red - deadline passed, not complete
    case 'at-risk':
      return '[&>div]:bg-yellow-500'; // Yellow - <75% progress with <30 days
    case 'on-track':
      return '[&>div]:bg-blue-600'; // Blue - making good progress
    default:
      return '[&>div]:bg-blue-600';
  }
}

/**
 * Individual goal card component
 *
 * Features:
 * - Progress bar with percentage and traffic light colors (US3: Visual Progress)
 * - Status badge (completed, at-risk, on-track, past-due)
 * - Amount display (current / target)
 * - Dropdown menu for actions (Edit, Delete)
 * - Triple encoding: Color + icon + text (not color alone)
 *
 * Accessibility:
 * - ARIA progressbar attributes
 * - Keyboard navigation (Tab, Enter)
 * - Screen reader friendly labels
 * - Touch targets 44x44px minimum
 *
 * @param goal - Goal to display
 * @param onEdit - Callback when Edit is clicked
 * @param onDelete - Callback when Delete is clicked
 * @param onAddContribution - Optional callback for quick-add (Group 6)
 */
export function GoalCard({ goal, onEdit, onDelete, onAddContribution }: GoalCardProps) {
  const percentage = getGoalPercent(goal.currentAmount, goal.targetAmount);
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const status = getGoalStatus(percentage, daysRemaining);

  // Detect prefers-reduced-motion (T072 - US5)
  const prefersReducedMotion = (() => {
    try {
      return typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false; // Default to animations enabled
    }
  })();

  const isComplete = percentage >= 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
            {goal.targetDate && (
              <p className="text-sm text-gray-600 mt-1">
                {daysRemaining !== null && daysRemaining >= 0
                  ? `${daysRemaining} days remaining`
                  : daysRemaining !== null && daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : ''}
              </p>
            )}
          </div>
          <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar (Shadcn Progress component - WCAG 2.2 AA compliant) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{percentage}%</span>
              {isComplete && (
                <CheckCircle2
                  className={`w-4 h-4 text-green-600 ${prefersReducedMotion ? '' : 'animate-fade-in'}`}
                  aria-label="Goal completed"
                />
              )}
            </div>
          </div>
          <Progress
            value={percentage}
            className={getProgressIndicatorClass(status)}
            aria-label={`${goal.name}: ${percentage}% complete`}
          />
        </div>

        {/* Amount Display */}
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(goal.currentAmount)}
          </p>
          <p className="text-sm text-gray-600">
            of {formatCurrency(goal.targetAmount)} goal
          </p>
        </div>

        {/* Monthly Contribution (if set) */}
        {goal.monthlyContribution && (
          <p className="text-sm text-gray-600">
            Monthly target: {formatCurrency(goal.monthlyContribution)}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Quick Add Contribution (Group 6 - placeholder for now) */}
        {onAddContribution && (
          <Button
            variant="outline"
            onClick={() => onAddContribution(goal)}
            className="flex-1"
          >
            Add Contribution
          </Button>
        )}

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Goal actions">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(goal)}>Edit Goal</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(goal)}
              className="text-red-600 focus:text-red-600"
            >
              Delete Goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
