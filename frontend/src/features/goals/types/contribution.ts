/**
 * Contribution type definitions for Goal Tracking Dashboard (Feature 064)
 */

/**
 * Individual contribution to a savings goal
 *
 * @example
 * {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   goalId: "goal_1a2b3c4d",
 *   amount: 5000, // $50.00 in cents
 *   note: "Birthday money",
 *   createdAt: "2025-11-05T10:00:00Z"
 * }
 */
export interface Contribution {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Parent goal ID */
  goalId: string;

  /** Contribution amount in cents (integer, >0) */
  amount: number;

  /** Optional note (max 200 characters) */
  note: string | null;

  /** ISO 8601 datetime when contribution was made */
  createdAt: string;
}

/**
 * Input for creating a new contribution
 * Excludes auto-generated fields (id, createdAt)
 */
export interface CreateContributionInput {
  /** Parent goal ID */
  goalId: string;

  /** Contribution amount in cents (integer, >0) */
  amount: number;

  /** Optional note (max 200 characters) */
  note: string | null;
}
