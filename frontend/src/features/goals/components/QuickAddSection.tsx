/**
 * Quick Add Section Component for Goal Tracking Dashboard (Feature 064)
 * One-click contribution with preset amounts ($5, $10, $25)
 * US4: Quick-Add Contributions
 */

import { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { Goal } from '../types/goal';
import { QUICK_ADD_AMOUNTS } from '../lib/constants';
import { formatCurrency } from '@/shared/lib/utils';
import { useContributions } from '../hooks/useContributions';

interface QuickAddSectionProps {
  goals: Goal[];
  onGoalComplete?: (goal: Goal) => void;
  onContributionAdded?: () => void;
}

/**
 * Quick-add contribution section with preset buttons
 *
 * Features:
 * - Goal selector dropdown (Select component)
 * - Three preset buttons ($5, $10, $25)
 * - Buttons disabled until goal selected
 * - Toast notification with 5-second undo
 * - Optimistic UI updates
 *
 * UX Research:
 * - 83% time reduction vs manual form (2-3s vs 15-20s)
 * - Makes saving as easy as spending (contactless friction reduction)
 * - Low-income user friendly ($5/$10/$25 amounts)
 *
 * Accessibility:
 * - ARIA labels on all interactive elements
 * - Keyboard navigation (Tab, Enter)
 * - Touch targets 44x44px minimum
 * - Screen reader friendly
 *
 * @param goals - Array of active goals
 * @param onGoalComplete - Optional callback when goal reaches 100%
 * @param onContributionAdded - Optional callback after contribution added
 */
export function QuickAddSection({
  goals,
  onGoalComplete,
  onContributionAdded,
}: QuickAddSectionProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const { addContribution } = useContributions(onGoalComplete);

  /**
   * Handle quick-add button click
   */
  const handleQuickAdd = (amountCents: number) => {
    if (!selectedGoalId) return;

    const result = addContribution(selectedGoalId, amountCents);

    if (result.success && onContributionAdded) {
      onContributionAdded();
    }
  };

  // Get selected goal for display
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add Contribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Selector */}
        <div>
          <label htmlFor="goal-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select Goal
          </label>
          <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
            <SelectTrigger id="goal-selector" aria-label="Select goal for contribution">
              <SelectValue placeholder="Choose a goal..." />
            </SelectTrigger>
            <SelectContent>
              {goals.length === 0 ? (
                <SelectItem value="no-goals" disabled>
                  No active goals
                </SelectItem>
              ) : (
                goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name} - {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Goal Display */}
        {selectedGoal && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Adding to:</span> {selectedGoal.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Current: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
            </p>
          </div>
        )}

        {/* Quick-Add Buttons */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Add Amount</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ADD_AMOUNTS.map((amountCents) => (
              <Button
                key={amountCents}
                variant="outline"
                size="lg"
                onClick={() => handleQuickAdd(amountCents)}
                disabled={!selectedGoalId}
                className="h-16 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Add ${formatCurrency(amountCents)} to selected goal`}
              >
                {formatCurrency(amountCents)}
              </Button>
            ))}
          </div>
        </div>

        {/* Helper Text */}
        {!selectedGoalId && (
          <p className="text-sm text-gray-500 text-center">
            Select a goal to enable quick-add buttons
          </p>
        )}
      </CardContent>
    </Card>
  );
}
