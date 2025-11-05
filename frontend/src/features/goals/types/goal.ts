/**
 * Goal and related type definitions for Goal Tracking Dashboard (Feature 064)
 */

import type { Contribution } from './contribution';

/**
 * Savings goal for tracking progress toward financial targets
 *
 * @example
 * {
 *   id: "goal_1a2b3c4d",
 *   name: "Emergency Fund",
 *   targetAmount: 100000, // $1,000.00 in cents
 *   currentAmount: 50000,  // $500.00 in cents
 *   targetDate: "2026-06-30",
 *   monthlyContribution: 5000, // $50.00 in cents
 *   status: "active",
 *   contributions: [...],
 *   createdAt: "2025-11-05T10:00:00Z",
 *   updatedAt: "2025-11-05T10:00:00Z"
 * }
 */
export interface Goal {
  /** Unique identifier (UUID v4 format: goal_xxxxxxxx) */
  id: string;

  /** Display name (1-50 characters) */
  name: string;

  /** Target amount in cents (integer, >0) */
  targetAmount: number;

  /** Current saved amount in cents (integer, >=0) */
  currentAmount: number;

  /** Optional target completion date (ISO 8601 date string YYYY-MM-DD) */
  targetDate: string | null;

  /** Optional monthly contribution target in cents (integer, >=0) */
  monthlyContribution: number | null;

  /** Goal status */
  status: 'active' | 'completed' | 'archived';

  /** Contribution history (max 100 per goal) */
  contributions: Contribution[];

  /** ISO 8601 datetime when goal was created */
  createdAt: string;

  /** ISO 8601 datetime when goal was last modified */
  updatedAt: string;
}

/**
 * Input for creating a new goal
 * Excludes auto-generated fields (id, currentAmount, contributions, timestamps, status)
 */
export interface CreateGoalInput {
  /** Display name (1-50 characters) */
  name: string;

  /** Target amount in cents (integer, >0) */
  targetAmount: number;

  /** Optional target completion date (ISO 8601 date string YYYY-MM-DD) */
  targetDate: string | null;

  /** Optional monthly contribution target in cents (integer, >=0) */
  monthlyContribution: number | null;
}

/**
 * Input for updating an existing goal
 * All fields optional (partial update)
 */
export interface UpdateGoalInput {
  /** Display name (1-50 characters) */
  name?: string;

  /** Target amount in cents (integer, >0) */
  targetAmount?: number;

  /** Current saved amount in cents (integer, >=0) */
  currentAmount?: number;

  /** Optional target completion date (ISO 8601 date string YYYY-MM-DD) */
  targetDate?: string | null;

  /** Optional monthly contribution target in cents (integer, >=0) */
  monthlyContribution?: number | null;

  /** Goal status */
  status?: 'active' | 'completed' | 'archived';
}

/**
 * Result type for goal operations
 * Success: { success: true, data: T }
 * Failure: { success: false, error: string }
 */
export type GoalResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
