/**
 * Zod Validation Schemas for Goals (Feature 064)
 *
 * Type definitions: @/features/goals/types/* (ADR 001: Interface-First)
 * This file provides RUNTIME validation only (no z.infer exports)
 */

import { z } from 'zod';
import { MAX_NAME_LENGTH, MAX_NOTE_LENGTH, MAX_CONTRIBUTIONS } from './constants';

/**
 * Contribution schema
 * Type definition: @/features/goals/types/contribution (Contribution interface)
 */
export const contributionSchema = z.object({
  id: z.string().uuid('Contribution ID must be a valid UUID'),
  goalId: z
    .string()
    .regex(/^goal_[a-z0-9_]+$/, 'Goal ID must start with "goal_" prefix'),
  amount: z.number().int('Amount must be an integer').positive('Amount must be positive'),
  note: z
    .string()
    .max(MAX_NOTE_LENGTH, `Note must not exceed ${MAX_NOTE_LENGTH} characters`)
    .nullable(),
  createdAt: z.string().datetime('Created date must be ISO 8601 datetime'),
});

/**
 * Goal schema
 * Type definition: @/features/goals/types/goal (Goal interface)
 */
export const goalSchema = z
  .object({
    id: z
      .string()
      .regex(/^goal_[a-z0-9_]+$/, 'Goal ID must start with "goal_" prefix'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(MAX_NAME_LENGTH, `Name must not exceed ${MAX_NAME_LENGTH} characters`)
      .trim(),
    targetAmount: z
      .number()
      .int('Target amount must be an integer')
      .positive('Target amount must be positive'),
    currentAmount: z
      .number()
      .int('Current amount must be an integer')
      .nonnegative('Current amount cannot be negative'),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be ISO 8601 date format (YYYY-MM-DD)')
      .nullable()
      .refine(
        (date) => {
          if (!date) return true; // null is valid
          const targetDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
          return targetDate >= today;
        },
        { message: 'Target date must be today or in the future' }
      ),
    monthlyContribution: z
      .number()
      .int('Monthly contribution must be an integer')
      .nonnegative('Monthly contribution cannot be negative')
      .nullable(),
    status: z.enum(['active', 'completed', 'archived'], {
      errorMap: () => ({ message: 'Status must be active, completed, or archived' }),
    }),
    contributions: z
      .array(contributionSchema)
      .max(MAX_CONTRIBUTIONS, `Maximum ${MAX_CONTRIBUTIONS} contributions allowed per goal`),
    createdAt: z.string().datetime('Created date must be ISO 8601 datetime'),
    updatedAt: z.string().datetime('Updated date must be ISO 8601 datetime'),
  })
  .strict(); // Reject unknown properties

/**
 * CreateGoalInput schema (for validating new goal input)
 * Type definition: @/features/goals/types/goal (CreateGoalInput interface)
 */
export const createGoalInputSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(MAX_NAME_LENGTH, `Name must not exceed ${MAX_NAME_LENGTH} characters`)
      .trim(),
    targetAmount: z
      .number()
      .int('Target amount must be an integer')
      .positive('Target amount must be positive'),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be ISO 8601 date format (YYYY-MM-DD)')
      .nullable()
      .refine(
        (date) => {
          if (!date) return true;
          const targetDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return targetDate >= today;
        },
        { message: 'Target date must be today or in the future' }
      ),
    monthlyContribution: z
      .number()
      .int('Monthly contribution must be an integer')
      .nonnegative('Monthly contribution cannot be negative')
      .nullable(),
  })
  .strict();

/**
 * UpdateGoalInput schema (for validating goal update input)
 * Type definition: @/features/goals/types/goal (UpdateGoalInput interface)
 */
export const updateGoalInputSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(MAX_NAME_LENGTH, `Name must not exceed ${MAX_NAME_LENGTH} characters`)
      .trim()
      .optional(),
    targetAmount: z
      .number()
      .int('Target amount must be an integer')
      .positive('Target amount must be positive')
      .optional(),
    currentAmount: z
      .number()
      .int('Current amount must be an integer')
      .nonnegative('Current amount cannot be negative')
      .optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be ISO 8601 date format (YYYY-MM-DD)')
      .nullable()
      .refine(
        (date) => {
          if (!date) return true;
          const targetDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return targetDate >= today;
        },
        { message: 'Target date must be today or in the future' }
      )
      .optional(),
    monthlyContribution: z
      .number()
      .int('Monthly contribution must be an integer')
      .nonnegative('Monthly contribution cannot be negative')
      .nullable()
      .optional(),
    status: z
      .enum(['active', 'completed', 'archived'], {
        errorMap: () => ({ message: 'Status must be active, completed, or archived' }),
      })
      .optional(),
  })
  .strict();

/**
 * CreateContributionInput schema (for validating new contribution input)
 * Type definition: @/features/goals/types/contribution (CreateContributionInput interface)
 */
export const createContributionInputSchema = z
  .object({
    goalId: z
      .string()
      .regex(/^goal_[a-z0-9_]+$/, 'Goal ID must start with "goal_" prefix'),
    amount: z.number().int('Amount must be an integer').positive('Amount must be positive'),
    note: z
      .string()
      .max(MAX_NOTE_LENGTH, `Note must not exceed ${MAX_NOTE_LENGTH} characters`)
      .nullable(),
  })
  .strict();

/**
 * Goal storage schema (for validating entire storage structure)
 */
export const goalStorageSchema = z.object({
  version: z.string(),
  goals: z.array(goalSchema),
  lastModified: z.string().datetime(),
});

/**
 * Validation helper functions
 */

export function validateGoal(data: unknown) {
  return goalSchema.safeParse(data);
}

export function validateContribution(data: unknown) {
  return contributionSchema.safeParse(data);
}

export function validateCreateGoalInput(data: unknown) {
  return createGoalInputSchema.safeParse(data);
}

export function validateUpdateGoalInput(data: unknown) {
  return updateGoalInputSchema.safeParse(data);
}

export function validateCreateContributionInput(data: unknown) {
  return createContributionInputSchema.safeParse(data);
}

export function validateGoalStorage(data: unknown) {
  return goalStorageSchema.safeParse(data);
}
