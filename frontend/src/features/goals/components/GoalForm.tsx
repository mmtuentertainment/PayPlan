/**
 * Goal Form Component for Goal Tracking Dashboard (Feature 064)
 * Create and edit goals via dialog modal
 * US2: Create Goal, US3: Edit Goal
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Alert } from '@/shared/components/ui/alert';
import { Info } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/utils';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../types/goal';
import { MAX_NAME_LENGTH } from '../lib/constants';
import { getRequiredMonthly } from '../lib/calculations';

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

  // T082: Track required monthly recalculation
  const [previousRequiredMonthly, setPreviousRequiredMonthly] = useState<number | null>(null);
  const [recalculationMessage, setRecalculationMessage] = useState<string | null>(null);

  // PR78-4: Focus management for accessibility (WCAG 2.2 AA requirement)
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Focus management: Focus title when dialog opens
  useEffect(() => {
    if (open && titleRef.current) {
      // Small delay to ensure modal is fully rendered
      const timeoutId = setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

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

      // T082: Initialize previous required monthly for edit mode
      if (goal.targetDate) {
        const initialRequired = getRequiredMonthly(
          goal.currentAmount,
          goal.targetAmount,
          goal.targetDate
        );
        setPreviousRequiredMonthly(initialRequired);
      }
    } else {
      // Reset form for create mode
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setMonthlyContribution('');
      setPreviousRequiredMonthly(null);
    }
    setErrors({});
    setRecalculationMessage(null);
  }, [goal, mode, open]);

  /**
   * T082: Recalculate required monthly when target date or amount changes
   */
  useEffect(() => {
    // Only show recalculation message in edit mode with a target date
    if (mode !== 'edit' || !goal || !targetDate || !targetAmount) {
      setRecalculationMessage(null);
      return;
    }

    const targetAmountCents = Math.round(parseFloat(targetAmount) * 100);
    const newRequiredMonthly = getRequiredMonthly(
      goal.currentAmount,
      targetAmountCents,
      targetDate
    );

    // Show message if required monthly changed from previous value
    if (
      previousRequiredMonthly !== null &&
      newRequiredMonthly !== null &&
      previousRequiredMonthly !== newRequiredMonthly
    ) {
      setRecalculationMessage(
        `Required monthly changed from ${formatCurrency(previousRequiredMonthly)} to ${formatCurrency(newRequiredMonthly)}`
      );
    } else {
      setRecalculationMessage(null);
    }
  }, [targetDate, targetAmount, goal, mode, previousRequiredMonthly]);

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
      // Fix timezone bug: Append 'T00:00:00' to force local timezone parsing
      // (date-only strings like "2025-11-05" are parsed as UTC, causing off-by-one day errors)
      const selectedDate = new Date(targetDate + 'T00:00:00');
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
   * Fix timezone bug: Use local date components instead of toISOString() (which uses UTC)
   */
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
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

          {/* T082: Recalculation message */}
          {recalculationMessage && (
            <Alert className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <span className="text-sm">{recalculationMessage}</span>
            </Alert>
          )}

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
