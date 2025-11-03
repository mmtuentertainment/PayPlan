# Implementation Prompt: Feature #063 US5 - Gamification Logic Tests

**Optimized for**: Claude Code (Sonnet 4.5)
**Feature**: Business Logic Test Coverage - User Story 5 (Gamification Logic)
**Branch**: `063-us5-gamification-tests` (new)
**Previous Work**: US1-US4 merged (calculations, storage, schemas, aggregation)

---

## Context Rehydration

You are implementing Feature #063 User Story 5 (Gamification Logic Tests).

**What exists**:
- ✅ Test infrastructure (MockStorage, fixtures, assertion utilities with strict types)
- ✅ 43 calculation tests (90%+ coverage) - PR #68 merged
- ✅ 78 storage service tests (74-75% coverage) - PR #68 merged
- ✅ 163 schema validation tests (90%+ coverage) - PR #69 merged
- ✅ 39 aggregation tests (92.77% coverage) - PR #70 merged
- ✅ Shared test utilities (assertion-utils, shared-fixtures)
- ✅ Gamification logic (gamification.ts - 484 lines, 6 functions)

**What you need to create**: Comprehensive tests for gamification functions

---

## Your Mission: User Story 5 - Gamification Logic Testing

**Goal**: Achieve 80%+ test coverage for gamification logic (streaks, insights, wins)

**Why this matters**: Gamification motivates users to build healthy financial habits. Bugs here undermine user trust and engagement. Accurate streak tracking and relevant insights are critical for retention.

**Success Criteria**:
1. ✅ All gamification functions tested (streaks, insights, wins detection)
2. ✅ Edge cases covered (no activity, streak breaks, multiple wins same day)
3. ✅ 80%+ coverage for `dashboard/lib/gamification.ts`
4. ✅ All tests pass in <5 seconds total
5. ✅ Use existing test infrastructure (fixtures, assertion utils)
6. ✅ Tests verify behavioral psychology principles work correctly

---

## Task Execution Plan (13 Tasks)

### Phase 7: Gamification Tests (T134-T146)

```
T134 Create gamification test file: dashboard/lib/__tests__/gamification.test.ts
T135 Test: consecutive day counting works correctly
T136 Test: streak breaks are detected
T137 Test: longest streak tracking is accurate
T138 Test: spending pattern detection works
T139 Test: alert thresholds trigger correctly
T140 Test: personalized messages are selected appropriately
T141 Test: goal completion triggers win celebration
T142 Test: streak milestones trigger win celebration
T143 Test: under-budget achievement triggers win celebration
T144 Test: gamification handles no activity
T145 Test: gamification handles multiple wins same day
T146 Verify 80%+ coverage for dashboard/lib/gamification.ts
```

---

## Implementation Pattern

### Study the Source Code First

**CRITICAL**: Read `dashboard/lib/gamification.ts` carefully (484 lines). Note:
- **6 main functions**:
  1. `getStreakData()` - Read streak from localStorage
  2. `updateStreakData()` - Update streak with new activity
  3. `getGamificationData()` - Read all gamification data
  4. `saveGamificationData()` - Write gamification data
  5. `generateInsights()` - Create personalized spending insights
  6. `detectRecentWins()` - Detect achievements (goals, streaks, under-budget)

- **Key algorithms**:
  - Consecutive day counting (streak logic)
  - Streak break detection (missed days)
  - Longest streak tracking
  - Spending pattern analysis (overspending, weekend patterns)
  - Win detection (goal milestones, streak achievements, budget wins)

- **Edge cases**:
  - No activity (empty transactions/budgets/goals)
  - Streak breaks (days without activity)
  - Multiple wins same day
  - Invalid dates, missing data
  - localStorage errors

---

## Test Structure (Follow US4 Excellence)

```typescript
// dashboard/lib/__tests__/gamification.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStreakData,
  updateStreakData,
  getGamificationData,
  saveGamificationData,
  generateInsights,
  detectRecentWins,
} from '../gamification';
import { createTransaction, createExpense, createIncome } from '@/features/transactions/lib/__tests__/fixtures/transaction-fixtures';
import { createBudget } from '@/features/budgets/lib/__tests__/fixtures/budget-fixtures';
import { createGoal } from '../__tests__/fixtures/dashboard-fixtures';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('Gamification Logic', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getStreakData', () => {
    it('should return default streak data when localStorage is empty', () => {
      const result = getStreakData();

      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastActivityDate).toBeNull();
    });

    it('should read streak data from localStorage', () => {
      const streakData = {
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: '2025-11-03',
      };
      localStorage.setItem('payplan_gamification_v1', JSON.stringify(streakData));

      const result = getStreakData();

      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.lastActivityDate).toBe('2025-11-03');
    });
  });

  describe('updateStreakData', () => {
    it('should start streak on first activity', () => {
      const result = updateStreakData();

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastActivityDate).toBeTruthy();
    });

    it('should increment streak on consecutive day activity', () => {
      // Simulate activity yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem('payplan_gamification_v1', JSON.stringify({
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: yesterday.toISOString().split('T')[0],
      }));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(4); // Incremented
      expect(result.longestStreak).toBe(5); // Unchanged (4 < 5)
    });

    it('should detect streak break after missed day', () => {
      // Simulate activity 3 days ago (missed 2 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      localStorage.setItem('payplan_gamification_v1', JSON.stringify({
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: threeDaysAgo.toISOString().split('T')[0],
      }));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(1); // Reset to 1
      expect(result.longestStreak).toBe(10); // Longest preserved
    });

    it('should update longest streak when current exceeds it', () => {
      localStorage.setItem('payplan_gamification_v1', JSON.stringify({
        currentStreak: 9,
        longestStreak: 9,
        lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      const result = updateStreakData();

      expect(result.currentStreak).toBe(10);
      expect(result.longestStreak).toBe(10); // Updated!
    });
  });

  describe('generateInsights', () => {
    it('should generate overspending alert when expenses exceed income', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const transactions = [
        createExpense({ amount: 100000, date: `${currentMonth}-15` }), // $1000 expenses
        createIncome({ amount: -50000, date: `${currentMonth}-01` }), // -$500 income
      ];
      const budgets = [
        createBudget({ amount: 80000, period: currentMonth }), // $800 budget
      ];

      const result = generateInsights(transactions, budgets);

      expect(result.length).toBeGreaterThan(0);
      const overspendingInsight = result.find((insight) =>
        insight.message.toLowerCase().includes('overspending') ||
        insight.message.toLowerCase().includes('over budget')
      );
      expect(overspendingInsight).toBeDefined();
      expect(overspendingInsight?.severity).toBe('warning');
    });

    it('should handle empty transactions array', () => {
      const result = generateInsights([], []);

      expect(result).toEqual([]);
    });
  });

  describe('detectRecentWins', () => {
    it('should detect goal completion win', () => {
      const goals = [
        createGoal({
          id: 'goal_completed',
          targetAmount: 100000, // $1000
          currentAmount: 100000, // $1000 (100% complete!)
        }),
      ];

      const result = detectRecentWins([], [], goals);

      expect(result.length).toBeGreaterThan(0);
      const goalWin = result.find((win) => win.type === 'goal-completed');
      expect(goalWin).toBeDefined();
      expect(goalWin?.title).toContain('Goal');
    });

    it('should detect streak milestone win', () => {
      // Simulate 7-day streak milestone
      localStorage.setItem('payplan_gamification_v1', JSON.stringify({
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: new Date().toISOString().split('T')[0],
      }));

      const result = detectRecentWins([], [], []);

      // Check if streak milestone detected (depends on implementation)
      // May need to call updateStreakData first
      expect(result).toBeDefined();
    });

    it('should handle multiple wins on same day', () => {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Win 1: Goal completed
      const goals = [
        createGoal({ currentAmount: 100000, targetAmount: 100000 }),
      ];

      // Win 2: Under budget
      const transactions = [
        createExpense({ amount: 50000, date: `${currentMonth}-15` }),
      ];
      const budgets = [
        createBudget({ amount: 100000, period: currentMonth }),
      ];

      const result = detectRecentWins(transactions, budgets, goals);

      // Should detect both wins
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle no wins gracefully', () => {
      const result = detectRecentWins([], [], []);

      expect(result).toEqual([]);
    });
  });
});
```

---

## Key Testing Patterns

### 1. Streak Calculation (Time-Based Testing)

```typescript
// Use deterministic dates
it('should count consecutive days correctly', () => {
  const today = new Date('2025-11-03');
  const yesterday = new Date('2025-11-02');

  // Simulate activity on consecutive days
  // Test that currentStreak increments
});

// Test streak breaks
it('should reset streak after missed day', () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Last activity: 3 days ago (missed 2 days)
  // Current streak should reset to 1
});
```

### 2. Insight Generation (Pattern Detection)

```typescript
// Test spending patterns
it('should detect weekend overspending pattern', () => {
  const transactions = [
    // Weekend transactions with higher amounts
    createExpense({ amount: 10000, date: '2025-11-02' }), // Saturday
    createExpense({ amount: 8000, date: '2025-11-03' }), // Sunday
    // Weekday transactions with lower amounts
    createExpense({ amount: 3000, date: '2025-10-28' }), // Monday
  ];

  const insights = generateInsights(transactions, []);

  // Should detect weekend pattern if algorithm supports it
});
```

### 3. Win Detection (Achievement Testing)

```typescript
// Test goal milestone wins
it('should detect 50% goal progress milestone', () => {
  const goals = [
    createGoal({
      currentAmount: 50000,
      targetAmount: 100000, // 50% complete
    }),
  ];

  const wins = detectRecentWins([], [], goals);

  // May or may not detect milestone depending on implementation
  // Verify win structure if detected
});
```

### 4. localStorage Integration

```typescript
// Mock localStorage
beforeEach(() => {
  localStorage.clear();
});

// Test read/write
it('should persist gamification data to localStorage', () => {
  const data = {
    currentStreak: 5,
    longestStreak: 10,
    lastActivityDate: '2025-11-03',
  };

  saveGamificationData(data);

  const stored = localStorage.getItem('payplan_gamification_v1');
  expect(stored).toBeTruthy();
  expect(JSON.parse(stored!)).toMatchObject(data);
});
```

---

## Files to Create

**New test file** (1):
```
frontend/src/features/dashboard/lib/__tests__/gamification.test.ts
```

**Modified files** (2):
```
frontend/vite.config.ts (add gamification coverage thresholds)
specs/063-short-name-business/tasks.md (mark T134-T146 complete)
```

---

## Coverage Targets

**vite.config.ts additions**:
```typescript
'src/features/dashboard/lib/gamification.ts': {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
},
```

**Rationale**: Gamification has localStorage I/O and date calculations that may have hard-to-test edge cases. 80% is realistic for Phase 1, higher coverage deferred to Phase 2.

---

## Critical Test Cases

### Must Test (Gamification Accuracy)

1. **Streak Tracking**:
   - ✅ First activity: Creates 1-day streak
   - ✅ Consecutive days: Increments streak
   - ✅ Missed day: Resets streak to 1
   - ✅ Longest streak: Preserves max value

2. **Insight Generation**:
   - ✅ Overspending alert: Expenses > income
   - ✅ Budget approaching: 80% of budget used
   - ✅ Budget exceeded: 100%+ of budget used
   - ✅ Personalized messages: Appropriate severity levels

3. **Win Detection**:
   - ✅ Goal completion: currentAmount >= targetAmount
   - ✅ Streak milestones: 7, 14, 30, 60, 90 days
   - ✅ Under budget: Expenses < budget
   - ✅ Multiple wins: Same day, different types

### Edge Cases to Test

1. **Empty Data**:
   - No transactions → no insights
   - No budgets → no budget-related insights
   - No goals → no goal wins
   - No activity → streak stays 0

2. **Time Edge Cases**:
   - Activity same day twice (doesn't double-count)
   - Activity at midnight (boundary testing)
   - Leap year dates (Feb 29)
   - Month boundaries (Jan 31 → Feb 1)

3. **Invalid Inputs**:
   - Null/undefined transactions → return empty
   - Malformed localStorage data → reset to defaults
   - Invalid dates → handle gracefully

---

## Example Test Pattern (Copy This)

```typescript
describe('updateStreakData', () => {
  it('should maintain streak on consecutive day activity', () => {
    // Arrange: Simulate activity yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    localStorage.setItem('payplan_gamification_v1', JSON.stringify({
      currentStreak: 5,
      longestStreak: 10,
      lastActivityDate: yesterday.toISOString().split('T')[0],
    }));

    // Act: Update streak (today's activity)
    const result = updateStreakData();

    // Assert: Streak increments
    expect(result.currentStreak).toBe(6); // 5 + 1
    expect(result.longestStreak).toBe(10); // Unchanged (6 < 10)
    expect(result.lastActivityDate).toBe(new Date().toISOString().split('T')[0]);
  });
});
```

---

## Bot Review Preparation

**CodeRabbit will check** (based on US3/US4 learnings):
- ✅ Use deterministic dates (not `new Date()` directly in assertions)
- ✅ Test edge cases (empty data, streak breaks, multiple wins)
- ✅ No `any` types
- ✅ Descriptive test names
- ✅ localStorage mocking (beforeEach clear)
- ✅ Strong assertions (verify specific values, not just "doesn't crash")

**Preemptive fixes**:
1. Use `beforeEach(() => localStorage.clear())` to isolate tests
2. Test ALL public functions in gamification.ts
3. Document why certain behavioral psychology principles are tested
4. Use dynamic dates with offsets (day - 1, day - 3) not hardcoded dates

---

## Execution Strategy

### 1. Read Source Files Thoroughly

Read ALL of these files to understand the logic:
- `frontend/src/features/dashboard/lib/gamification.ts` (484 lines - main file)
- `frontend/src/features/dashboard/types/gamification.ts` (type definitions)
- `frontend/src/shared/types/goal.ts` (Goal interface)

### 2. Create Test File (Single File)

No fixtures needed (reuse existing transaction/budget/goal fixtures from US4).

### 3. Write Tests (By Function)

Write tests for each gamification function:
- `getStreakData` / `updateStreakData` (6-8 tests)
- `getGamificationData` / `saveGamificationData` (4-6 tests)
- `generateInsights` (6-8 tests)
- `detectRecentWins` (6-8 tests)

### 4. Progressive Commits

```
Commit 1: Streak tracking tests (T134-T137)
Commit 2: Insight generation tests (T138-T140)
Commit 3: Win detection tests (T141-T143)
Commit 4: Edge case tests (T144-T145)
Commit 5: Coverage verification (T146)
Commit 6: Update tasks.md (T134-T146 complete)
```

---

## Expected Test Count

**Minimum**: 13 tests (1 per task)
**Realistic**: 30-40 tests (comprehensive edge cases)
**Target**: 35 tests total

**Breakdown**:
- `getStreakData` / `updateStreakData`: 8 tests
- `getGamificationData` / `saveGamificationData`: 6 tests
- `generateInsights`: 8 tests
- `detectRecentWins`: 10 tests
- Edge cases: 3 tests

---

## Success Validation

Before creating PR:

```bash
# 1. All gamification tests pass
npm test -- gamification.test.ts
# Expected: ~35 tests passing

# 2. Coverage meets 80%+ threshold
npm run test:coverage -- gamification
# Expected: gamification.ts 80%+

# 3. Execution time under threshold
# Expected: <5s for all gamification tests

# 4. No TypeScript errors
npx tsc --noEmit

# 5. All aggregation tests still pass (regression check)
npm test -- aggregation.test.ts
# Expected: 39 tests passing
```

---

## What Makes This Prompt Expert-Level

### 1. Complete Context
- Previous work summarized (US1-US4)
- Existing infrastructure documented
- Source code size specified (484 lines, 6 functions)

### 2. Concrete Examples
- Full test code snippets (not just descriptions)
- Exact expected behaviors (streak increments, resets, etc.)
- Real edge cases from gamification logic

### 3. Behavioral Guidance
- "Study source code first" (not "start coding")
- "Copy this pattern" (reduces cognitive load)
- "Preemptive fixes" (anticipate bot feedback)

### 4. Quality Gates
- Success validation commands
- Expected test counts
- Coverage rationale

### 5. Progressive Execution
- Read → Write Tests → Verify
- Parallel opportunities identified
- Commit strategy specified

---

## Context Preservation

**If session ends, save this state**:
- Branch: `063-us5-gamification-tests`
- Completed: US1-US4 merged
- Next: T134-T146 (Phase 7: Gamification Logic)
- Source: gamification.ts (484 lines, 6 functions)
- Target: 80%+ coverage, ~35 tests

**To resume**: "Continue implementing US5 (Gamification Logic Tests) for Feature #063 on branch 063-us5-gamification-tests. US1-US4 merged. Follow atomic task breakdown (T134-T146, 13 tasks). Target: 80%+ coverage, ~35 tests."

---

## Quick Start Command

```bash
# Start US5 implementation
git checkout -b 063-us5-gamification-tests

# Read gamification source code first
cat frontend/src/features/dashboard/lib/gamification.ts

# Study the 6 functions:
# 1. getStreakData (lines 126-150)
# 2. updateStreakData (lines 184-233)
# 3. getGamificationData (lines 235-265)
# 4. saveGamificationData (lines 277-290)
# 5. generateInsights (lines 303-390)
# 6. detectRecentWins (lines 410-484)

# Create test file → Write tests → Verify coverage → Commit
```

---

**Expected timeline**: 90-120 minutes for 13 tasks (similar to US4)

🚀 **Execute with US4-level excellence!** Follow established patterns from 39 aggregation tests, use strong assertions (not >= 0), test behavioral psychology principles work correctly.
