/**
 * Goal Celebration Component for Goal Tracking Dashboard (Feature 064)
 * Professional completion modal with statistics
 * US5: Subtle Completion Moment
 */

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/features/budgets/lib/calculations';
import { differenceInMonths } from 'date-fns';
import type { Goal } from '../types/goal';

interface GoalCelebrationProps {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSetNewGoal: () => void;
  onArchiveGoal: () => void;
}

/**
 * Goal celebration modal with completion statistics
 *
 * Features:
 * - Professional "Goal complete" title (no playful emoji)
 * - CheckCircle2 icon (green, decorative)
 * - Completion statistics (time to complete, average monthly contribution)
 * - Two action buttons: "Set New Goal" and "Archive Goal"
 * - Shadcn Dialog with built-in accessibility
 *
 * Accessibility:
 * - Dialog has focus trap (Escape to close)
 * - CheckCircle2 has aria-hidden="true" (decorative)
 * - Buttons are 44x44px minimum (Shadcn default)
 * - WCAG 2.2 AA compliant
 *
 * @param open - Whether the dialog is open
 * @param goal - The completed goal to celebrate
 * @param onClose - Callback when dialog closes
 * @param onSetNewGoal - Callback for "Set New Goal" button
 * @param onArchiveGoal - Callback for "Archive Goal" button
 */
export function GoalCelebration({
  open,
  goal,
  onClose,
  onSetNewGoal,
  onArchiveGoal,
}: GoalCelebrationProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Focus management for accessibility (WCAG 2.2 AA requirement)
  useEffect(() => {
    if (open && titleRef.current) {
      // Small delay to ensure modal is fully rendered
      const timeoutId = setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  if (!goal) return null;

  // Calculate completion statistics (T073)
  const months = differenceInMonths(
    new Date(goal.updatedAt),
    new Date(goal.createdAt)
  );
  const avgMonthly = goal.currentAmount / Math.max(months, 1); // Avoid division by zero

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
            <DialogTitle ref={titleRef} tabIndex={-1}>Goal complete</DialogTitle>
          </div>
        </DialogHeader>

        {/* Goal details */}
        <div className="space-y-4 py-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">{goal.name}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>

          {/* Completion statistics */}
          <div className="space-y-1">
            {months > 0 ? (
              <>
                <p className="text-sm text-gray-600">
                  Completed in {months} {months === 1 ? 'month' : 'months'}
                </p>
                <p className="text-sm text-gray-600">
                  Average contribution: {formatCurrency(avgMonthly)}/month
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Completed in less than a month!
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSetNewGoal}>
            Set New Goal
          </Button>
          <Button onClick={onArchiveGoal}>
            Archive Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
