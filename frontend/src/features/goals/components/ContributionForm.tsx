/**
 * Contribution Form Component for Goal Tracking Dashboard (Feature 064)
 * Manual contribution entry with optional note
 * US7: Contribution Notes
 */

import { useState, useEffect, useRef } from 'react';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { useContributions } from '../hooks/useContributions';
import { MAX_NOTE_LENGTH } from '../lib/constants';

interface ContributionFormProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalName: string; // For display in dialog title
  onContributionAdded?: () => void; // Trigger parent refresh
  onGoalComplete?: (goal: any) => void; // For celebration trigger
}

/**
 * Manual contribution form
 *
 * Features:
 * - Amount input (dollars → cents conversion)
 * - Optional note (max 200 characters)
 * - Client-side validation
 * - Toast notification on success (built into useContributions)
 * - Auto-complete detection (triggers celebration)
 *
 * @param open - Whether dialog is open
 * @param onClose - Callback when dialog closes
 * @param goalId - Goal ID to add contribution to
 * @param goalName - Goal name for display
 * @param onContributionAdded - Optional callback after successful contribution
 * @param onGoalComplete - Optional callback when goal reaches 100%
 */
export function ContributionForm({
  open,
  onClose,
  goalId,
  goalName,
  onContributionAdded,
  onGoalComplete,
}: ContributionFormProps) {
  // Form state
  const [amount, setAmount] = useState(''); // Display value (dollars)
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // useContributions hook for adding contribution
  const { addContribution } = useContributions(onGoalComplete);

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
   * Reset form when dialog opens/closes
   */
  useEffect(() => {
    if (open) {
      setAmount('');
      setNote('');
      setErrors({});
    }
  }, [open]);

  /**
   * Validate form inputs
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than $0';
    }

    // Validate note length (optional field)
    if (note && note.length > MAX_NOTE_LENGTH) {
      newErrors.note = `Note must not exceed ${MAX_NOTE_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    // T085: Convert dollars to cents
    const amountCents = Math.round(parseFloat(amount) * 100);

    // Add contribution via hook (handles toast, undo, auto-complete)
    const result = addContribution(
      goalId,
      amountCents,
      note.trim() || null // PR83-1: Pass null if note is empty (matches type)
    );

    if (result.success) {
      // Close dialog and trigger parent refresh
      onClose();
      if (onContributionAdded) {
        onContributionAdded();
      }
    } else {
      // Show error (unlikely - validation should catch most issues)
      setErrors({ submit: result.error || 'Failed to add contribution' });
    }
  };

  /**
   * Handle Enter key press (submit form)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>Add Contribution</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Add a contribution to "{goalName}"
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div>
            <Label htmlFor="contribution-amount">
              Amount <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="contribution-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="50.00"
                className="pl-7"
                aria-required="true"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                autoFocus
              />
            </div>
            {errors.amount && (
              <p id="amount-error" className="text-sm text-red-600 mt-1">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Note Textarea (Optional) */}
          <div>
            <Label htmlFor="contribution-note">
              Note (Optional)
              <span className="text-sm text-gray-500 ml-2">
                {note.length}/{MAX_NOTE_LENGTH}
              </span>
            </Label>
            <Textarea
              id="contribution-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Birthday money, Bonus, Tax refund..."
              maxLength={MAX_NOTE_LENGTH}
              rows={3}
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? 'note-error' : undefined}
            />
            {errors.note && (
              <p id="note-error" className="text-sm text-red-600 mt-1">
                {errors.note}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Contribution</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
