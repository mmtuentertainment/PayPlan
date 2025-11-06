/**
 * Goal Card Component for Goal Tracking Dashboard (Feature 064)
 * Individual goal display with progress bar, status badge, and actions
 * US1: View Dashboard, US3: Edit Goal, US4: Delete Goal, US7: Manual Contribution
 */

import { useState } from 'react';
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
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/features/budgets/lib/calculations';
import type { Goal } from '../types/goal';
import { getGoalPercent, getDaysRemaining, getRequiredMonthly, getGoalStatus } from '../lib/calculations';
import { ContributionForm } from './ContributionForm';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onArchive?: (goal: Goal) => void; // T090: Archive completed goal
  onContributionAdded?: () => void; // T087: Trigger parent refresh
  onGoalComplete?: (goal: Goal) => void; // For celebration trigger
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
 * @param onContributionAdded - Optional callback after contribution added
 * @param onGoalComplete - Optional callback when goal reaches 100%
 */
export function GoalCard({ goal, onEdit, onDelete, onArchive, onContributionAdded, onGoalComplete }: GoalCardProps) {
  const percentage = getGoalPercent(goal.currentAmount, goal.targetAmount);
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const requiredMonthly = getRequiredMonthly(goal.currentAmount, goal.targetAmount, goal.targetDate);
  const status = getGoalStatus(percentage, daysRemaining);

  // T087: Contribution form dialog state
  const [isContributionFormOpen, setIsContributionFormOpen] = useState(false);

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
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-600">
                  {daysRemaining !== null && daysRemaining >= 0
                    ? `${daysRemaining} days remaining`
                    : daysRemaining !== null && daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : ''}
                </p>
                {/* T078: Required monthly contribution display */}
                {requiredMonthly !== null && requiredMonthly > 0 && percentage < 100 && (
                  <p className="text-sm text-gray-600">
                    Need {formatCurrency(requiredMonthly)}/month to reach target
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
            {/* T079: Behind Schedule warning badge */}
            {status === 'at-risk' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                Behind Schedule
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* T083: ARIA live region for status announcements (screen readers) */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {status === 'completed' && `Goal ${goal.name} is complete at ${percentage}%`}
          {status === 'at-risk' && `Goal ${goal.name} is behind schedule at ${percentage}% with ${daysRemaining} days remaining`}
          {status === 'past-due' && `Goal ${goal.name} is past due at ${percentage}%`}
          {status === 'on-track' && `Goal ${goal.name} is on track at ${percentage}%`}
        </div>

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
        {/* T087: Manual contribution button (opens dialog) */}
        <Button
          variant="outline"
          onClick={() => setIsContributionFormOpen(true)}
          className="flex-1"
        >
          Add Contribution
        </Button>

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
            {/* T090: Archive menu item (only show for completed goals) */}
            {goal.status === 'completed' && onArchive && (
              <DropdownMenuItem onClick={() => onArchive(goal)}>
                Archive Goal
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(goal)}
              className="text-red-600 focus:text-red-600"
            >
              Delete Goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>

      {/* T087: Contribution Form Dialog */}
      <ContributionForm
        open={isContributionFormOpen}
        onClose={() => setIsContributionFormOpen(false)}
        goalId={goal.id}
        goalName={goal.name}
        onContributionAdded={onContributionAdded}
        onGoalComplete={onGoalComplete}
      />
    </Card>
  );
}
