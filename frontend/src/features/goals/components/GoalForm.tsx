/**
 * Goal Form Component for Goal Tracking Dashboard (Feature 064)
 * Create and edit goals via dialog modal
 * US2: Create Goal, US3: Edit Goal
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../types/goal';
import { MAX_NAME_LENGTH } from '../lib/constants';

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => void;
  goal?: Goal; // If provided, form is in edit mode
  mode: 'create' | 'edit';
}

/**
 * Goal creation/editing form
 *
 * Features:
 * - Client-side validation (Zod validation happens in storage service)
 * - Accessible form with ARIA labels
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Currency input formatting (displays dollars, stores cents)
 * - Date input with min="today" validation
 *
 * @param open - Whether dialog is open
 * @param onClose - Callback when dialog closes
 * @param onSubmit - Callback when form submits (receives CreateGoalInput or UpdateGoalInput)
 * @param goal - Existing goal (edit mode only)
 * @param mode - 'create' or 'edit'
 */
export function GoalForm({ open, onClose, onSubmit, goal, mode }: GoalFormProps) {
  // Form state (all in cents except name and dates)
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); // Display value (dollars)
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState(''); // Display value (dollars)
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Initialize form when goal changes (edit mode)
   */
  useEffect(() => {
    if (goal && mode === 'edit') {
      setName(goal.name);
      setTargetAmount((goal.targetAmount / 100).toFixed(2)); // Cents to dollars
      setTargetDate(goal.targetDate || '');
      setMonthlyContribution(
        goal.monthlyContribution ? (goal.monthlyContribution / 100).toFixed(2) : ''
      );
    } else {
      // Reset form for create mode
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setMonthlyContribution('');
    }
    setErrors({});
  }, [goal, mode, open]);

  /**
   * Validate form inputs
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    } else if (name.trim().length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must not exceed ${MAX_NAME_LENGTH} characters`;
    }

    const targetAmountNum = parseFloat(targetAmount);
    if (!targetAmount || isNaN(targetAmountNum) || targetAmountNum <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than $0';
    }

    if (targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(targetDate);
      if (selectedDate < today) {
        newErrors.targetDate = 'Target date must be today or in the future';
      }
    }

    if (monthlyContribution) {
      const monthlyNum = parseFloat(monthlyContribution);
      if (isNaN(monthlyNum) || monthlyNum < 0) {
        newErrors.monthlyContribution = 'Monthly contribution must be $0 or greater';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Convert dollars to cents
    const targetAmountCents = Math.round(parseFloat(targetAmount) * 100);
    const monthlyContributionCents = monthlyContribution
      ? Math.round(parseFloat(monthlyContribution) * 100)
      : null;

    const data: CreateGoalInput | UpdateGoalInput = {
      name: name.trim(),
      targetAmount: targetAmountCents,
      targetDate: targetDate || null,
      monthlyContribution: monthlyContributionCents,
    };

    onSubmit(data);
  };

  /**
   * Get today's date in YYYY-MM-DD format (for min attribute)
   */
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Goal' : 'Edit Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Name */}
          <div>
            <Label htmlFor="goal-name">
              Goal Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund"
              maxLength={MAX_NAME_LENGTH}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <Label htmlFor="target-amount">
              Target Amount <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="target-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="1000.00"
                className="pl-7"
                aria-required="true"
                aria-invalid={!!errors.targetAmount}
                aria-describedby={errors.targetAmount ? 'target-amount-error' : undefined}
              />
            </div>
            {errors.targetAmount && (
              <p id="target-amount-error" className="text-sm text-red-600 mt-1">
                {errors.targetAmount}
              </p>
            )}
          </div>

          {/* Target Date (Optional) */}
          <div>
            <Label htmlFor="target-date">Target Date (Optional)</Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={getTodayDate()}
              aria-invalid={!!errors.targetDate}
              aria-describedby={errors.targetDate ? 'target-date-error' : undefined}
            />
            {errors.targetDate && (
              <p id="target-date-error" className="text-sm text-red-600 mt-1">
                {errors.targetDate}
              </p>
            )}
          </div>

          {/* Monthly Contribution (Optional) */}
          <div>
            <Label htmlFor="monthly-contribution">
              Monthly Contribution (Optional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="monthly-contribution"
                type="number"
                step="0.01"
                min="0"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="50.00"
                className="pl-7"
                aria-invalid={!!errors.monthlyContribution}
                aria-describedby={
                  errors.monthlyContribution ? 'monthly-contribution-error' : undefined
                }
              />
            </div>
            {errors.monthlyContribution && (
              <p id="monthly-contribution-error" className="text-sm text-red-600 mt-1">
                {errors.monthlyContribution}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Goal' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
