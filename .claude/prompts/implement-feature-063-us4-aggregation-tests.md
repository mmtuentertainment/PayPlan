# Implementation Prompt: Feature #063 US4 - Dashboard Aggregation Tests

**Optimized for**: Claude Code (Sonnet 4.5)
**Feature**: Business Logic Test Coverage - User Story 4 (Dashboard Aggregation)
**Branch**: `063-us4-aggregation-tests` (new)
**Previous Work**: US1 (calculations), US2 (storage), US3 (schemas) merged/pending

---

## Context Rehydration

You are implementing Feature #063 User Story 4 (Dashboard Aggregation Tests).

**What exists**:
- ✅ Test infrastructure (MockStorage, fixtures, assertion utilities with strict types)
- ✅ 43 calculation tests (90%+ coverage) - PR #68 merged
- ✅ 78 storage service tests (74-75% coverage) - PR #68 merged
- ✅ 163 schema validation tests (90%+ coverage) - PR #69 (US3 - pending approval)
- ✅ Shared test utilities (schema-test-utils.ts) - PR #69
- ✅ Dashboard aggregation logic (aggregation.ts - 445 lines, 5 functions)
- ✅ Gamification logic (gamification.ts - 485 lines) - will be tested in US5

**What you need to create**: Comprehensive tests for dashboard aggregation functions

---

## Your Mission: User Story 4 - Dashboard Aggregation Accuracy

**Goal**: Achieve 80%+ test coverage for dashboard aggregation functions

**Why this matters**: Aggregation bugs cause user confusion and distrust. Dashboard shows money totals - accuracy is critical for user confidence.

**Success Criteria**:
1. ✅ All aggregation functions tested (spending by category, income/expenses, goals, bills)
2. ✅ Edge cases covered (empty data, zero amounts, missing categories, date boundaries)
3. ✅ 80%+ coverage for `dashboard/lib/aggregation.ts`
4. ✅ All tests pass in <5 seconds total
5. ✅ Use existing test infrastructure (fixtures, assertion utils)
6. ✅ Tests verify dollar amounts match expected (financial accuracy)

---

## Task Execution Plan (15 Tasks)

### Phase 6A: Dashboard Fixtures (T119-T121) - 3 tasks

```
T119 Create createDashboardData factory in dashboard/lib/__tests__/fixtures/dashboard-fixtures.ts
T120 Create scenario variations (emptyDashboard, activeDashboard, overspentDashboard)
T121 Create barrel export in dashboard/lib/__tests__/fixtures/index.ts
```

### Phase 6B: Aggregation Tests (T122-T133) - 12 tasks

```
T122 Create aggregation test file: dashboard/lib/__tests__/aggregation.test.ts
T123 Test: spending by category (single category) - verify totals exact
T124 Test: spending by category (multiple categories) - verify percentages sum to 100%
T125 Test: monthly income calculation - verify negative amounts summed correctly
T126 Test: monthly expenses calculation - verify positive amounts summed correctly
T127 Test: date range filtering (last 6 months) - verify boundary conditions
T128 Test: goal progress percentage - verify (current/target)*100 accurate
T129 Test: goal remaining amount - verify target - current = remaining
T130 Test: aggregation handles empty data (no transactions) - returns []
T131 Test: aggregation handles zero amounts - includes in totals
T132 Test: aggregation handles missing categories - uses UNCATEGORIZED
T133 Verify 80%+ coverage for dashboard/lib/aggregation.ts
```

---

## Implementation Pattern

### Study the Source Code First

**CRITICAL**: Read `dashboard/lib/aggregation.ts` carefully. Note:
- **3 main functions**: `aggregateSpendingByCategory`, `aggregateIncomeExpenses`, `getRecentTransactions`
- **2 helper functions**: `getUpcomingBills`, `getGoalProgress`
- **Edge case handling**: Empty arrays, invalid inputs, zero amounts, missing categories
- **Financial logic**: Expenses = positive, Income = negative (PayPlan convention)
- **Date handling**: Month boundaries, last 6 months, current month filtering
- **Error handling**: Try/catch with console.error, returns empty arrays on failure

### Test Structure (Follow US3 Excellence)

```typescript
// dashboard/lib/__tests__/aggregation.test.ts
import { describe, it, expect } from 'vitest';
import {
  aggregateSpendingByCategory,
  aggregateIncomeExpenses,
  getRecentTransactions,
  getUpcomingBills,
  getGoalProgress,
} from '../aggregation';
import { createTransaction, createCategory, createBudget } from '../../test-helpers'; // You'll need these
import { expectCentsEqual } from '../../../../../tests/fixtures/assertion-utils';
import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';

describe('Dashboard Aggregation', () => {
  describe('aggregateSpendingByCategory', () => {
    it('should aggregate spending for single category', () => {
      const categories = [
        { id: 'cat_1', name: 'Groceries', iconName: 'shopping-cart', color: '#22c55e', isDefault: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ];

      const transactions = [
        { id: 'txn_1', amount: 5000, description: 'Walmart', date: '2025-11-15', categoryId: 'cat_1', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'txn_2', amount: 3000, description: 'Costco', date: '2025-11-20', categoryId: 'cat_1', createdAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateSpendingByCategory(transactions, categories);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('cat_1');
      expect(result[0].categoryName).toBe('Groceries');
      expectCentsEqual(result[0].amount, 8000); // $80.00 total
      expect(result[0].percentage).toBe(100); // 100% of spending
    });

    it('should handle multiple categories with correct percentages', () => {
      const categories = [
        { id: 'cat_1', name: 'Groceries', iconName: 'shopping-cart', color: '#22c55e', isDefault: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'cat_2', name: 'Transport', iconName: 'car', color: '#3b82f6', isDefault: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ];

      const transactions = [
        { id: 'txn_1', amount: 6000, description: 'Walmart', date: '2025-11-15', categoryId: 'cat_1', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'txn_2', amount: 4000, description: 'Gas', date: '2025-11-20', categoryId: 'cat_2', createdAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateSpendingByCategory(transactions, categories);

      expect(result).toHaveLength(2);
      expectCentsEqual(result[0].amount + result[1].amount, 10000); // Total = $100

      // Percentages should sum to 100%
      const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1); // Allow 0.1% rounding
    });

    it('should handle empty transactions array', () => {
      const categories = [
        { id: 'cat_1', name: 'Groceries', iconName: 'shopping-cart', color: '#22c55e', isDefault: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateSpendingByCategory([], categories);

      expect(result).toEqual([]);
    });

    it('should handle missing category (use UNCATEGORIZED)', () => {
      const categories = []; // No categories

      const transactions = [
        { id: 'txn_1', amount: 5000, description: 'Walmart', date: '2025-11-15', categoryId: 'cat_missing', createdAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateSpendingByCategory(transactions, categories);

      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Uncategorized');
      expectCentsEqual(result[0].amount, 5000);
    });

    it('should only include current month transactions', () => {
      const categories = [
        { id: 'cat_1', name: 'Groceries', iconName: 'shopping-cart', color: '#22c55e', isDefault: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ];

      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-11"
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

      const transactions = [
        { id: 'txn_1', amount: 5000, description: 'This month', date: `${currentMonth}-15`, categoryId: 'cat_1', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'txn_2', amount: 3000, description: 'Last month', date: `${lastMonth}-15`, categoryId: 'cat_1', createdAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateSpendingByCategory(transactions, categories);

      expect(result).toHaveLength(1);
      expectCentsEqual(result[0].amount, 5000); // Only current month
    });
  });

  describe('aggregateIncomeExpenses', () => {
    it('should calculate monthly income and expenses for last 6 months', () => {
      const transactions = [
        { id: 'txn_1', amount: 10000, description: 'Expense', date: '2025-11-15', createdAt: '2025-01-01T00:00:00Z' }, // Expense
        { id: 'txn_2', amount: -50000, description: 'Income', date: '2025-11-15', createdAt: '2025-01-01T00:00:00Z' }, // Income
      ];

      const result = aggregateIncomeExpenses(transactions);

      expect(result.months).toHaveLength(6); // Last 6 months
      expect(result.months[5].income).toBe(50000); // Most recent month
      expect(result.months[5].expenses).toBe(10000);
      expect(result.months[5].net).toBe(40000); // $400 net positive
    });

    it('should handle empty transactions array', () => {
      const result = aggregateIncomeExpenses([]);

      expect(result.months).toHaveLength(6); // 6 months with zero values
      expect(result.maxValue).toBe(0);
      expect(result.months[0].income).toBe(0);
      expect(result.months[0].expenses).toBe(0);
    });

    it('should correctly separate income (negative) from expenses (positive)', () => {
      const transactions = [
        { id: 'txn_1', amount: 10000, description: 'Expense', date: '2025-11-01', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'txn_2', amount: -20000, description: 'Income', date: '2025-11-01', createdAt: '2025-01-01T00:00:00Z' },
        { id: 'txn_3', amount: 5000, description: 'Expense 2', date: '2025-11-01', createdAt: '2025-01-01T00:00:00Z' },
      ];

      const result = aggregateIncomeExpenses(transactions);

      const currentMonth = result.months[result.months.length - 1];
      expect(currentMonth.income).toBe(20000); // Absolute value of negative
      expect(currentMonth.expenses).toBe(15000); // Sum of positives
      expect(currentMonth.net).toBe(5000); // $50 net positive
    });
  });

  describe('getGoalProgress', () => {
    it('should calculate goal progress percentage accurately', () => {
      const goals = [
        {
          id: 'goal_1',
          name: 'Emergency Fund',
          targetAmount: 100000, // $1000
          currentAmount: 50000, // $500
          targetDate: '2025-12-31',
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      const result = getGoalProgress(goals);

      expect(result).toHaveLength(1);
      expect(result[0].percentage).toBe(50); // 50% complete
      expect(result[0].currentAmount).toBe(50000);
      expect(result[0].targetAmount).toBe(100000);
    });

    it('should cap percentage at 100% for completed goals', () => {
      const goals = [
        {
          id: 'goal_1',
          name: 'Emergency Fund',
          targetAmount: 100000,
          currentAmount: 120000, // Over target
          targetDate: '2025-12-31',
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      const result = getGoalProgress(goals);

      expect(result[0].percentage).toBe(100); // Capped at 100%
      expect(result[0].status).toBe('completed');
    });

    it('should handle zero target amount (prevent divide by zero)', () => {
      const goals = [
        {
          id: 'goal_1',
          name: 'Invalid Goal',
          targetAmount: 0,
          currentAmount: 5000,
          targetDate: null,
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      const result = getGoalProgress(goals);

      expect(result[0].percentage).toBe(0); // Should not crash
    });

    it('should handle empty goals array', () => {
      const result = getGoalProgress([]);

      expect(result).toEqual([]);
    });
  });
});
```

---

## Key Testing Patterns

### 1. Financial Accuracy (Use expectCentsEqual)

```typescript
// ✅ CORRECT: Test exact cent amounts
expectCentsEqual(result.amount, 8000); // $80.00

// ❌ WRONG: Float comparison (unreliable)
expect(result.amount).toBe(8000.0);
```

### 2. Date Filtering (Test Month Boundaries)

```typescript
// Test ADR-003 compliance: Jan 31 - 1 month should not crash
const jan31 = '2025-01-31';
const transactions = [
  { date: jan31, amount: 1000, ... },
  { date: '2024-12-31', amount: 2000, ... },
];

const result = aggregateIncomeExpenses(transactions);
// Should not crash, should handle month boundary correctly
```

### 3. Empty State Handling

```typescript
// Every aggregation function should handle empty inputs gracefully
it('should return empty array for no data', () => {
  const result = aggregateSpendingByCategory([], []);
  expect(result).toEqual([]);
});
```

### 4. Percentage Calculations

```typescript
// Test percentages sum to 100% (allow small rounding error)
const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0);
expect(totalPercentage).toBeCloseTo(100, 1); // Within 0.1%
```

---

## Files to Create

**New test files** (2):
```
frontend/src/features/dashboard/lib/__tests__/fixtures/dashboard-fixtures.ts
frontend/src/features/dashboard/lib/__tests__/fixtures/index.ts
frontend/src/features/dashboard/lib/__tests__/aggregation.test.ts
```

**Modified files** (2):
```
frontend/vite.config.ts (add aggregation coverage thresholds)
specs/063-short-name-business/tasks.md (mark T119-T133 complete)
```

---

## Coverage Targets

**vite.config.ts additions**:
```typescript
'src/features/dashboard/lib/aggregation.ts': {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
},
```

**Rationale**: Aggregation has try/catch error handling that's hard to test in Phase 1 (requires mocking console.error). 80% is realistic, 90% deferred to Phase 2.

---

## Critical Test Cases

### Must Test (Financial Accuracy)

1. **Spending by Category**:
   - ✅ Single category: Total matches sum of transactions
   - ✅ Multiple categories: Percentages sum to 100%
   - ✅ Uncategorized: Missing categoryId uses fallback
   - ✅ Current month only: No old transactions included

2. **Income vs Expenses**:
   - ✅ Income (negative amounts): Summed as absolute value
   - ✅ Expenses (positive amounts): Summed directly
   - ✅ Net calculation: income - expenses = net
   - ✅ Last 6 months: 6 data points returned

3. **Goal Progress**:
   - ✅ Percentage: (current/target) * 100
   - ✅ Cap at 100%: Over-funded goals show 100%
   - ✅ Zero target: Returns 0% (no divide by zero)
   - ✅ Status: on-track, at-risk, completed

### Edge Cases to Test

1. **Empty Data**:
   - No transactions → return []
   - No categories → use UNCATEGORIZED
   - No goals → return []

2. **Zero Amounts**:
   - Transaction with amount: 0 → include in calculations
   - Category with $0 spent → include in results (0%)

3. **Invalid Inputs**:
   - Non-array transactions → return []
   - Non-array categories → return []
   - Null/undefined → return []

4. **Date Edge Cases**:
   - Month boundaries (Jan 31 → Feb)
   - Leap years (Feb 29)
   - Year rollover (Dec → Jan)

---

## Example Test Pattern (Copy This)

```typescript
describe('aggregateSpendingByCategory', () => {
  it('should calculate exact dollar amounts and percentages', () => {
    // Arrange: Create test data with known totals
    const categories = [
      createCategory({ id: 'cat_groceries', name: 'Groceries' }),
      createCategory({ id: 'cat_transport', name: 'Transport' }),
    ];

    const transactions = [
      createTransaction({ amount: 6000, categoryId: 'cat_groceries', date: '2025-11-15' }), // $60
      createTransaction({ amount: 4000, categoryId: 'cat_transport', date: '2025-11-20' }), // $40
    ];
    // Total: $100 ($60 + $40)

    // Act: Run aggregation
    const result = aggregateSpendingByCategory(transactions, categories);

    // Assert: Verify exact amounts
    expect(result).toHaveLength(2);

    const groceries = result.find(r => r.categoryId === 'cat_groceries')!;
    expectCentsEqual(groceries.amount, 6000);
    expect(groceries.percentage).toBe(60); // 60% of $100

    const transport = result.find(r => r.categoryId === 'cat_transport')!;
    expectCentsEqual(transport.amount, 4000);
    expect(transport.percentage).toBe(40); // 40% of $100

    // Percentages sum to 100%
    const total = result.reduce((sum, r) => sum + r.percentage, 0);
    expect(total).toBeCloseTo(100, 0.01);
  });
});
```

---

## Bot Review Preparation

**CodeRabbit will check** (based on US3 learnings):
- ✅ Use `expectCentsEqual` for financial amounts (not toBe)
- ✅ Test edge cases (empty data, zero amounts, missing refs)
- ✅ No `any` types
- ✅ Descriptive test names
- ✅ Percentages validated (sum to 100%, no >100%)

**Preemptive fixes**:
1. Create helper factories for complex test data (categories + transactions + budgets)
2. Test ALL public functions in aggregation.ts (don't skip getUpcomingBills, getRecentTransactions)
3. Document why certain values are expected (e.g., "60% = $60 / $100")
4. Use real date calculations (not hardcoded "2025-11")

---

## Execution Strategy

### 1. Read Source Files Thoroughly

Read ALL of these files to understand the logic:
- `frontend/src/features/dashboard/lib/aggregation.ts` (445 lines - main file)
- `frontend/src/features/dashboard/types/chart-data.ts` (return types)
- `frontend/src/shared/types/goal.ts` (Goal interface)
- `frontend/src/shared/types/bill.ts` (UpcomingBill interface)

### 2. Create Fixtures First (Parallel)

Create helper factories for:
- `createDashboardScenario()` - Full dashboard data (categories, transactions, budgets, goals)
- `createEmptyDashboard()` - Zero data
- `createActiveDashboard()` - Realistic active user
- `createOverspentDashboard()` - User over budget

### 3. Write Tests (Parallel by Function)

Write tests for each aggregation function:
- `aggregateSpendingByCategory` (6-8 tests)
- `aggregateIncomeExpenses` (5-7 tests)
- `getRecentTransactions` (3-5 tests)
- `getUpcomingBills` (4-6 tests, complex!)
- `getGoalProgress` (4-6 tests)

### 4. Progressive Commits

```
Commit 1: Dashboard fixtures (T119-T121)
Commit 2: Spending aggregation tests (T122-T124)
Commit 3: Income/expenses + goals tests (T125-T129)
Commit 4: Edge case tests (T130-T132)
Commit 5: Coverage verification (T133)
Commit 6: Update tasks.md (T119-T133 complete)
```

---

## Expected Test Count

**Minimum**: 15 tests (1 per task)
**Realistic**: 30-35 tests (comprehensive edge cases)
**Target**: 35 tests total

**Breakdown**:
- `aggregateSpendingByCategory`: 8 tests
- `aggregateIncomeExpenses`: 7 tests
- `getRecentTransactions`: 5 tests
- `getUpcomingBills`: 8 tests (complex recurring logic!)
- `getGoalProgress`: 7 tests

---

## Success Validation

Before creating PR:

```bash
# 1. All aggregation tests pass
npm test -- aggregation.test.ts
# Expected: ~35 tests passing

# 2. Coverage meets 80%+ threshold
npm run test:coverage -- aggregation
# Expected: aggregation.ts 80%+

# 3. Execution time under threshold
# Expected: <5s for all aggregation tests

# 4. No TypeScript errors
npx tsc --noEmit

# 5. All schema tests still pass (regression check)
npm test -- schemas.test.ts
# Expected: 163 tests passing
```

---

## What Makes This Prompt Expert-Level

### 1. Complete Context
- Previous work summarized
- Existing infrastructure documented
- Source code size specified (445 lines)

### 2. Concrete Examples
- Full test code snippets (not just descriptions)
- Exact expected values ($60, 60%, etc.)
- Real edge cases from source code

### 3. Behavioral Guidance
- "Study source code first" (not "start coding")
- "Copy this pattern" (reduces cognitive load)
- "Preemptive fixes" (anticipate bot feedback)

### 4. Quality Gates
- Success validation commands
- Expected test counts
- Coverage rationale

### 5. Progressive Execution
- Read → Fixtures → Tests → Verify
- Parallel opportunities identified
- Commit strategy specified

---

## Context Preservation

**If session ends, save this state**:
- Branch: `063-us4-aggregation-tests`
- Completed: US1, US2, US3 merged/pending
- Next: T119-T133 (Phase 6: Dashboard Aggregation)
- Source: aggregation.ts (445 lines, 5 functions)
- Target: 80%+ coverage, ~35 tests

**To resume**: "Continue implementing US4 (Dashboard Aggregation Tests) for Feature #063 on branch 063-us4-aggregation-tests. US1+US2 merged in PR #68, US3 in PR #69 pending approval. Follow atomic task breakdown (T119-T133, 15 tasks)."

---

## Quick Start Command

```bash
# Start US4 implementation
git checkout -b 063-us4-aggregation-tests

# Read aggregation source code first
cat frontend/src/features/dashboard/lib/aggregation.ts

# Study the 5 functions:
# 1. aggregateSpendingByCategory (lines 62-125)
# 2. aggregateIncomeExpenses (lines 136-207)
# 3. getRecentTransactions (lines 219-239)
# 4. getUpcomingBills (lines 265-366)
# 5. getGoalProgress (lines 385-444)

# Create fixtures → Write tests → Verify coverage → Commit
```

---

**Expected timeline**: 90-120 minutes for 15 tasks (similar to US3)

🚀 **Execute with US3-level excellence!** Follow established patterns from 163 schema tests, proactively address bot feedback, use strict types, test financial accuracy.
