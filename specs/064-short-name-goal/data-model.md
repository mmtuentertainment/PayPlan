# Data Model: Goal Tracking Dashboard

**Feature**: Goal Tracking Dashboard (Feature 064)
**Created**: 2025-11-05
**Purpose**: Define entities, attributes, relationships, Zod schemas, and storage patterns

---

## Entities

### Goal

**Purpose**: Represents a user's savings goal with target amount, current progress, optional deadline, and contribution history

**Attributes**:

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `id` | string (UUID v4) | Primary key, unique, immutable | Unique identifier |
| `name` | string | Required, 1-50 chars | User-defined goal name (e.g., "Emergency Fund") |
| `targetAmount` | number (integer) | Required, >0, cents | Target savings in cents (100000 = $1,000.00) |
| `currentAmount` | number (integer) | Required, ≥0, cents, default: 0 | Current progress in cents |
| `targetDate` | string (ISO 8601) | Optional, nullable, future dates only | Deadline (e.g., "2026-06-01") |
| `monthlyContribution` | number (integer) | Optional, nullable, >0, cents | Suggested monthly amount |
| `status` | GoalStatus enum | Required, default: 'active' | Goal status ('active', 'completed', 'archived') |
| `contributions` | Contribution[] | Required, default: [], max: 100 | Nested contribution history |
| `createdAt` | string (ISO 8601) | Required, immutable, UTC | Creation timestamp |
| `updatedAt` | string (ISO 8601) | Required, UTC | Last update timestamp |

**Relationships**:
- Has many `Contribution` (nested array, 1:N)
- Referenced by `DashboardMetrics` (computed aggregation)

**State Transitions**:
```
[Create] → 'active'
           ↓
  [currentAmount >= targetAmount] → 'completed'
           ↓
  [User archives] → 'archived'
           ↓
  [User unarchives] → 'active'
```

**Business Rules**:
- `currentAmount` can exceed `targetAmount` (over-funding allowed, shows 100%+ progress)
- `status` auto-transitions to 'completed' when `currentAmount >= targetAmount`
- Deleting goal cascades to all nested contributions
- Archiving preserves all contribution history

---

### Contribution

**Purpose**: Represents a single manual deposit toward a goal with optional context note

**Attributes**:

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `id` | string (UUID v4) | Primary key, unique, immutable | Unique identifier |
| `goalId` | string (UUID v4) | Foreign key, required | Parent Goal.id |
| `amount` | number (integer) | Required, >0, cents | Contribution amount (5000 = $50.00) |
| `note` | string | Optional, nullable, max 200 chars | User note (e.g., "Birthday money") |
| `createdAt` | string (ISO 8601) | Required, immutable, UTC | Contribution timestamp |

**Relationships**:
- Belongs to `Goal` (N:1, nested within Goal.contributions array)

**Business Rules**:
- Contributions immutable after creation (can only delete via parent goal)
- Maximum 100 contributions per goal
- Contributions sorted by `createdAt` DESC for display (newest first)

---

###Dash

boardMetrics (Computed Read-Only)

**Purpose**: Aggregated metrics for dashboard overview (computed on-demand, not stored)

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `totalGoals` | number (integer) | Count of active goals (status === 'active') |
| `totalSaved` | number (integer, cents) | Sum of all Goal.currentAmount |
| `goalsOnTrack` | number (integer) | Count where progress >25% (meaningful commitment) |
| `averageProgress` | number (float, %) | Mean percentage across all goals (rounded to 1 decimal) |

**Computation**:
```typescript
function computeDashboardMetrics(goals: Goal[]): DashboardMetrics {
  const active = goals.filter(g => g.status === 'active');
  const totalGoals = active.length;
  const totalSaved = active.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalsOnTrack = active.filter(g => {
    const percent = (g.currentAmount / g.targetAmount) * 100;
    return percent > 25;
  }).length;
  const averageProgress = active.length > 0
    ? Math.round((active.reduce((sum, g) =>
        sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100), 0
      ) / active.length) * 10) / 10
    : 0;

  return { totalGoals, totalSaved, goalsOnTrack, averageProgress };
}
```

---

## Zod Schemas (Validation)

### contributionSchema

**Location**: `frontend/src/features/goals/lib/schemas.ts`

```typescript
import { z } from 'zod';

export const contributionSchema = z.object({
  id: z.string().uuid(),
  goalId: z.string().uuid(),
  amount: z.number()
    .int("Amount must be whole number (cents)")
    .positive("Contribution must be greater than $0"),
  note: z.string()
    .max(200, "Note must be 200 characters or less")
    .nullable()
    .optional(),
  createdAt: z.string().datetime(),
});

export type Contribution = z.infer<typeof contributionSchema>;
```

---

### goalSchema

```typescript
export const goalStatusSchema = z.enum(['active', 'completed', 'archived']);

export const goalSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(1, "Goal name is required")
    .max(50, "Goal name must be 50 characters or less"),
  targetAmount: z.number()
    .int("Target must be whole number (cents)")
    .positive("Target must be greater than $0"),
  currentAmount: z.number()
    .int("Current amount must be whole number (cents)")
    .nonnegative("Current amount cannot be negative")
    .default(0),
  targetDate: z.string()
    .datetime()
    .nullable()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      { message: "Target date must be in the future" }
    )
    .optional(),
  monthlyContribution: z.number()
    .int("Monthly contribution must be whole number (cents)")
    .positive("Monthly contribution must be greater than $0")
    .nullable()
    .optional(),
  status: goalStatusSchema.default('active'),
  contributions: z.array(contributionSchema)
    .max(100, "Maximum 100 contributions per goal")
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Goal = z.infer<typeof goalSchema>;
export type GoalStatus = z.infer<typeof goalStatusSchema>;
```

---

## localStorage Storage Schema

### Key: `payplan_goals_v1`

**Format**: JSON array of Goal entities

**Example**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Emergency Fund",
    "targetAmount": 100000,
    "currentAmount": 40000,
    "targetDate": "2026-06-01",
    "monthlyContribution": 5000,
    "status": "active",
    "contributions": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "goalId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 20000,
        "note": "Initial deposit",
        "createdAt": "2025-11-01T10:00:00.000Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "goalId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 20000,
        "note": "Paycheck savings",
        "createdAt": "2025-11-15T14:30:00.000Z"
      }
    ],
    "createdAt": "2025-11-01T10:00:00.000Z",
    "updatedAt": "2025-11-15T14:30:00.000Z"
  }
]
```

**Schema Version**: v1 (initial)

**Migration Path** (if v2 needed in future):
1. Read from `payplan_goals_v1`
2. Transform to v2 schema (add new fields, migrate data)
3. Write to `payplan_goals_v2`
4. Delete `payplan_goals_v1`

---

## CRUD Operations

### CREATE Goal

```typescript
function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'active',
    currentAmount: 0,
    contributions: [],
    ...data,
  };

  // Validate with Zod
  const validated = goalSchema.parse(goal);

  // Save to localStorage
  const goals = readGoals();
  goals.push(validated);
  writeGoals(goals);

  return validated;
}
```

### READ Goals

```typescript
function readGoals(): Goal[] {
  try {
    const data = localStorage.getItem('payplan_goals_v1');
    if (!data) return [];

    const parsed = JSON.parse(data);
    return z.array(goalSchema).parse(parsed);
  } catch (error) {
    console.error('Failed to read goals:', error);
    return []; // Graceful fallback
  }
}

function readGoal(id: string): Goal | null {
  const goals = readGoals();
  return goals.find(g => g.id === id) ?? null;
}
```

### UPDATE Goal

```typescript
function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Goal {
  const goals = readGoals();
  const index = goals.findIndex(g => g.id === id);

  if (index === -1) throw new Error(`Goal not found: ${id}`);

  const updated: Goal = {
    ...goals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Validate
  const validated = goalSchema.parse(updated);

  goals[index] = validated;
  writeGoals(goals);

  return validated;
}
```

### DELETE Goal

```typescript
function deleteGoal(id: string): boolean {
  const goals = readGoals();
  const filtered = goals.filter(g => g.id !== id);

  if (filtered.length === goals.length) return false; // Not found

  writeGoals(filtered);
  return true;
}
```

---

## Calculation Functions (90%+ Test Coverage Required)

### getGoalPercent (with clamping)

```typescript
/**
 * Calculate goal progress percentage (CLAMPED to 100%)
 *
 * @param goal - Goal entity
 * @returns Percentage (0-100, rounded to 1 decimal)
 *
 * @example
 * getGoalPercent({ currentAmount: 50000, targetAmount: 100000 }) // 50.0
 * getGoalPercent({ currentAmount: 120000, targetAmount: 100000 }) // 100.0 (CLAMPED)
 */
export function getGoalPercent(goal: Goal): number {
  if (goal.targetAmount === 0) return 0;

  const raw = (goal.currentAmount / goal.targetAmount) * 100;
  const clamped = Math.min(100, raw); // CLAMP to 100%
  return Math.round(clamped * 10) / 10; // Round to 1 decimal
}
```

### getDaysRemaining

```typescript
/**
 * Calculate days until target date
 *
 * @param targetDate - ISO 8601 date string or null
 * @returns Days remaining (integer), null if no target date
 */
export function getDaysRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;

  const today = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - today.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
```

### getRequiredMonthly

```typescript
/**
 * Calculate required monthly contribution to reach goal by target date
 *
 * @param remainingAmount - Amount needed to reach target (cents)
 * @param daysRemaining - Days until target date
 * @returns Required monthly contribution (cents), 0 if no date or goal complete
 */
export function getRequiredMonthly(remainingAmount: number, daysRemaining: number | null): number {
  if (!daysRemaining || daysRemaining <= 0 || remainingAmount <= 0) return 0;

  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.44)); // Avg days/month
  return Math.ceil(remainingAmount / monthsRemaining);
}
```

### getGoalStatus

```typescript
/**
 * Determine goal status based on progress and target date
 *
 * @param goal - Goal entity
 * @returns Status ('on-track', 'at-risk', 'completed', 'past-due')
 */
export function getGoalStatus(goal: Goal): 'on-track' | 'at-risk' | 'completed' | 'past-due' {
  const percentage = getGoalPercent(goal);

  if (percentage >= 100) return 'completed';

  const daysRemaining = getDaysRemaining(goal.targetDate);

  // Behind schedule: <30 days AND <75% progress
  if (daysRemaining !== null && daysRemaining < 30 && percentage < 75) {
    return 'at-risk';
  }

  // Past due: target date passed and not complete
  if (daysRemaining !== null && daysRemaining < 0) {
    return 'past-due';
  }

  return 'on-track';
}
```

---

## References

- **Spec**: [spec.md](spec.md) - Feature requirements
- **Research**: [research.md](research.md) - Technical decisions
- **Constitution**: [../../memory/constitution.md](../../memory/constitution.md) - v3.1 TDD requirements
- **Feature 062**: [../062-short-name-dashboard/data-model.md](../062-short-name-dashboard/data-model.md) - GoalProgress interface (display type)
- **Feature 063**: [../063-short-name-business/](../063-short-name-business/) - Test fixture patterns
