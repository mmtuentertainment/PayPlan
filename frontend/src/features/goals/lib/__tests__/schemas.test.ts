/**
 * Schema validation tests for Goal Tracking Dashboard (Feature 064)
 * Target: 90%+ coverage (pure validation logic)
 */

import { describe, it, expect } from 'vitest';
import {
  goalSchema,
  contributionSchema,
  createGoalInputSchema,
  updateGoalInputSchema,
  validateGoal,
  validateContribution,
  validateCreateGoalInput,
  validateUpdateGoalInput,
} from '../schemas';
import { createGoal, createContribution } from './fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('Goal Schemas', () => {
  describe('goalSchema', () => {
    it('should validate complete goal with all fields', () => {
      const goal = createGoal();
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(goal);
      }
    });

    it('should accept goal with null targetDate', () => {
      const goal = createGoal({ targetDate: null });
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
    });

    it('should accept goal with null monthlyContribution', () => {
      const goal = createGoal({ monthlyContribution: null });
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
    });

    it('should reject goal with missing name', () => {
      const goal = createGoal({ name: '' });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Name is required');
      }
    });

    it('should reject goal with name exceeding 50 chars', () => {
      const goal = createGoal({ name: 'a'.repeat(51) });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed 50 characters');
      }
    });

    it('should reject negative targetAmount', () => {
      const goal = createGoal({ targetAmount: -100 });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Target amount must be positive');
      }
    });

    it('should reject zero targetAmount', () => {
      const goal = createGoal({ targetAmount: 0 });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Target amount must be positive');
      }
    });

    it('should reject negative currentAmount', () => {
      const goal = createGoal({ currentAmount: -50 });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Current amount cannot be negative');
      }
    });

    it('should accept zero currentAmount', () => {
      const goal = createGoal({ currentAmount: 0 });
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
    });

    it('should reject past targetDate', () => {
      const goal = createGoal({ targetDate: '2020-01-01' });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be today or in the future');
      }
    });

    it('should accept today as targetDate', () => {
      const today = new Date().toISOString().split('T')[0];
      const goal = createGoal({ targetDate: today });
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
    });

    it('should reject invalid targetDate format', () => {
      const goal = createGoal({ targetDate: '01/01/2026' } as any);
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601 date format');
      }
    });

    it('should reject negative monthlyContribution', () => {
      const goal = createGoal({ monthlyContribution: -100 });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Monthly contribution cannot be negative');
      }
    });

    it('should reject invalid status', () => {
      const goal = createGoal({ status: 'pending' } as any);
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod enum uses default message format
        expect(result.error.issues[0].message).toContain('active');
      }
    });

    it('should reject >100 contributions', () => {
      const contributions = Array.from({ length: 101 }, (_, i) =>
        createContribution({ id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}` })
      );
      const goal = createGoal({ contributions });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 100 contributions');
      }
    });

    it('should accept exactly 100 contributions', () => {
      const contributions = Array.from({ length: 100 }, (_, i) =>
        createContribution({ id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}` })
      );
      const goal = createGoal({ contributions });
      const result = validateGoal(goal);

      expect(result.success).toBe(true);
    });

    it('should reject invalid goal ID format', () => {
      const goal = createGoal({ id: 'invalid_id' });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must start with "goal_" prefix');
      }
    });

    it('should reject fractional amounts (non-integer)', () => {
      const goal = createGoal({ targetAmount: 100.5 });
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });

    it('should reject unknown properties (strict mode)', () => {
      const goal = { ...createGoal(), unknownField: 'test' };
      const result = validateGoal(goal);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Unrecognized key');
      }
    });
  });

  describe('contributionSchema', () => {
    it('should validate complete contribution', () => {
      const contribution = createContribution();
      const result = validateContribution(contribution);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(contribution);
      }
    });

    it('should accept null note', () => {
      const contribution = createContribution({ note: null });
      const result = validateContribution(contribution);

      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const contribution = createContribution({ amount: -50 });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Amount must be positive');
      }
    });

    it('should reject zero amount', () => {
      const contribution = createContribution({ amount: 0 });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Amount must be positive');
      }
    });

    it('should reject note exceeding 200 chars', () => {
      const contribution = createContribution({ note: 'a'.repeat(201) });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed 200 characters');
      }
    });

    it('should accept note with exactly 200 chars', () => {
      const contribution = createContribution({ note: 'a'.repeat(200) });
      const result = validateContribution(contribution);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const contribution = createContribution({ id: 'not-a-uuid' });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be a valid UUID');
      }
    });

    it('should reject invalid goalId format', () => {
      const contribution = createContribution({ goalId: 'invalid_goal_id' });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must start with "goal_" prefix');
      }
    });

    it('should reject fractional amount', () => {
      const contribution = createContribution({ amount: 50.5 });
      const result = validateContribution(contribution);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be an integer');
      }
    });
  });

  describe('createGoalInputSchema', () => {
    it('should validate complete create input', () => {
      const input = {
        name: 'Emergency Fund',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: '2026-06-30',
        monthlyContribution: sharedFixtures.amounts.fiftyDollars,
      };
      const result = validateCreateGoalInput(input);

      expect(result.success).toBe(true);
    });

    it('should accept null optional fields', () => {
      const input = {
        name: 'Emergency Fund',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: null,
        monthlyContribution: null,
      };
      const result = validateCreateGoalInput(input);

      expect(result.success).toBe(true);
    });

    it('should trim whitespace from name', () => {
      const input = {
        name: '  Emergency Fund  ',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: null,
        monthlyContribution: null,
      };
      const result = validateCreateGoalInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Emergency Fund');
      }
    });

    it('should reject unknown fields (strict mode)', () => {
      const input = {
        name: 'Emergency Fund',
        targetAmount: sharedFixtures.amounts.thousandDollars,
        targetDate: null,
        monthlyContribution: null,
        unknownField: 'test',
      };
      const result = validateCreateGoalInput(input);

      expect(result.success).toBe(false);
    });
  });

  describe('updateGoalInputSchema', () => {
    it('should validate partial update (name only)', () => {
      const input = { name: 'Updated Goal Name' };
      const result = validateUpdateGoalInput(input);

      expect(result.success).toBe(true);
    });

    it('should validate partial update (targetAmount only)', () => {
      const input = { targetAmount: sharedFixtures.amounts.fiveHundredDollars };
      const result = validateUpdateGoalInput(input);

      expect(result.success).toBe(true);
    });

    it('should validate empty update object', () => {
      const input = {};
      const result = validateUpdateGoalInput(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid fields in partial update', () => {
      const input = { targetAmount: -100 };
      const result = validateUpdateGoalInput(input);

      expect(result.success).toBe(false);
    });

    it('should trim whitespace from name in update', () => {
      const input = { name: '  Updated Name  ' };
      const result = validateUpdateGoalInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
      }
    });
  });
});
