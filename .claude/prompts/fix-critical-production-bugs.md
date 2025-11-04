# Fix Critical Production Bugs - Self-Directed Implementation

**Priority**: 🚨 P0 CRITICAL (BLOCKS all new features)
**Estimated**: 1-2 days (15-20 hours)
**Linear Issues**: MMT-94, 95, 96, 103, 104
**Workflow**: Investigate FIRST → Fix with TDD → Validate ALL routes → Merge

---

## Mission

<mission>
**Fix 5 production-blocking bugs that make core PayPlan features unusable.**

**Current State**:
- ❌ /budgets route: ERROR BOUNDARY (users locked out)
- ❌ /transactions route: ERROR BOUNDARY (users locked out)
- ❌ Dashboard: Crashes on empty data (new users can't onboard)
- ⚠️ Silent calculation errors (invalid dates cause wrong spending totals)
- ⚠️ Runtime crashes (corrupted localStorage data)

**Target State**:
- ✅ All routes accessible and functional
- ✅ Graceful empty states (no crashes)
- ✅ Type-safe data validation (no runtime errors)
- ✅ Clear error messages for invalid data
- ✅ All 5 Linear issues closed

**Why Urgent**: Building Goal Tracking on broken foundation creates more debt. Fix core features FIRST.
</mission>

---

## Investigation Protocol

<investigate_before_fixing>
**CRITICAL**: Do NOT guess root causes. Investigate FIRST, document findings, THEN fix.

### Step 1: Reproduce Each Bug

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
# Test each route in order:

1. Navigate to /dashboard
   - Expected: Dashboard loads
   - Check console for errors
   - Test with empty localStorage (clear in DevTools)

2. Navigate to /categories
   - Expected: Categories page loads
   - Check console for errors

3. Navigate to /budgets
   - Expected: ERROR BOUNDARY (MMT-103)
   - SCREENSHOT the error
   - CHECK CONSOLE for actual error message
   - DOCUMENT: What component failed? What's the error?

4. Navigate to /transactions
   - Expected: ERROR BOUNDARY (MMT-104)
   - SCREENSHOT the error
   - CHECK CONSOLE for actual error message
   - DOCUMENT: What component failed? What's the error?
```

### Step 2: Document Actual Errors

Create `bugs-investigation.md` with:
```markdown
## Bug Investigation Report - 2025-11-04

### MMT-103: /budgets Route Error
**Console Error**: [PASTE ACTUAL ERROR]
**Stack Trace**: [PASTE STACK TRACE]
**Root Cause**: [YOUR ANALYSIS]

### MMT-104: /transactions Route Error
**Console Error**: [PASTE ACTUAL ERROR]
**Stack Trace**: [PASTE STACK TRACE]
**Root Cause**: [YOUR ANALYSIS]

[... etc for all 5 bugs]
```

### Step 3: Check If Already Fixed

```bash
# Some bugs may be fixed already - verify each:
grep -n "maxValue.*positive" frontend/src/lib/dashboard/schemas.ts
# If returns nothing, Bug #95 already fixed

grep -n "as.*readGoals" frontend/src/hooks/useDashboardData.ts
# If returns nothing, Bug #94 already fixed

grep -n "startsWith(currentMonth)" frontend/src/lib/dashboard/aggregation.ts
# If returns matches, Bug #96 still present
```
</investigate_before_fixing>

---

## The 5 Bugs (Concrete Fixes)

<bug_1_mmt_103>
### Bug 1: /budgets Route Shows Error Boundary

**Severity**: HIGH
**Impact**: Users locked out of budgets page (core feature)

**Investigation**:
```bash
# 1. Navigate to /budgets
# 2. Open DevTools Console
# 3. Document exact error (likely: "Cannot read property 'X' of undefined")
# 4. Check stack trace for failing component
```

**Likely Causes**:
- Missing prop in Budgets.tsx
- readBudgets() returning invalid data
- Component expecting data before it's loaded

**Fix Pattern** (after investigation):
```typescript
// BEFORE (crashes if data missing)
const budgets = readBudgets();
return <BudgetList budgets={budgets} />;

// AFTER (graceful handling)
const budgets = readBudgets() || [];
if (budgets.length === 0) {
  return <EmptyState message="No budgets yet" />;
}
return <BudgetList budgets={budgets} />;
```

**Test**:
```typescript
it('should render empty state when no budgets', () => {
  localStorage.clear();
  render(<BudgetsPage />);
  expect(screen.getByText(/No budgets yet/i)).toBeInTheDocument();
});
```
</bug_1_mmt_103>

<bug_2_mmt_104>
### Bug 2: /transactions Route Shows Error Boundary

**Severity**: HIGH
**Impact**: Users locked out of transactions page (core feature)

**Investigation**: Same as Bug 1 (navigate, console, document)

**Fix Pattern**: Same as Bug 1 (null checks + empty states)

**Test**: Same pattern as Bug 1
</bug_2_mmt_104>

<bug_3_mmt_94>
### Bug 3: Unsafe Type Assertion in useDashboardData

**Severity**: URGENT
**File**: `frontend/src/hooks/useDashboardData.ts:81-86`

**Current Code** (UNSAFE):
```typescript
const goals = readGoals() as Array<{
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
}>;
```

**Problem**: `as` bypasses type checking. If localStorage has `{id: 123}` (number instead of string), crashes at runtime.

**Fix** (Type-safe with Zod):
```typescript
// 1. Check if Goal type exists
import type { Goal } from '@/types/goal';

// 2. Import or create GoalSchema
import { GoalSchema } from '@/lib/goals/schemas'; // If exists
// OR create inline:
const GoalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  targetDate: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

// 3. Validate instead of asserting
const rawGoals = readGoals();
const goals = Array.isArray(rawGoals)
  ? rawGoals
      .map(g => GoalSchema.safeParse(g))
      .filter(r => r.success)
      .map(r => r.data)
  : [];
```

**Test**:
```typescript
it('should filter out invalid goals from localStorage', () => {
  localStorage.setItem('payplan_goals_v1', JSON.stringify([
    {id: 123, name: 'Bad'}, // Invalid: id is number
    {id: 'valid-uuid', name: 'Good', targetAmount: 1000, currentAmount: 0, targetDate: null, createdAt: '2025-11-04T00:00:00Z'}
  ]));

  const { result } = renderHook(() => useDashboardData());
  expect(result.current.goals).toHaveLength(1); // Only valid goal
});
```
</bug_3_mmt_94>

<bug_4_mmt_95>
### Bug 4: Schema Mismatch - maxValue Rejects 0

**Severity**: URGENT (easiest fix - START HERE)
**File**: `frontend/src/lib/dashboard/schemas.ts:38`

**Current Code** (CRASHES on empty data):
```typescript
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(), // ❌ Rejects 0
});
```

**Problem**: New users with 0 transactions → `maxValue: 0` → schema rejects → dashboard crashes

**Fix** (ONE LINE):
```typescript
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().nonnegative(), // ✅ Allows 0
});
```

**Test**:
```typescript
it('should accept maxValue of 0 for users with no transactions', () => {
  const emptyData = {
    months: [{month: '2025-11', income: 0, expenses: 0}],
    maxValue: 0
  };

  const result = IncomeExpensesChartDataSchema.safeParse(emptyData);
  expect(result.success).toBe(true);
  expect(result.data.maxValue).toBe(0);
});
```
</bug_4_mmt_95>

<bug_5_mmt_96>
### Bug 5: Unsafe Date Filtering

**Severity**: URGENT
**File**: `frontend/src/lib/dashboard/aggregation.ts:45-46`

**Current Code** (UNSAFE):
```typescript
const expensesThisMonth = transactions.filter(
  (t) => t.amount > 0 && t.date.startsWith(currentMonth)
);
```

**Problem**: Assumes `t.date` is always valid ISO format. Malformed dates cause silent failures.

**Fix** (Validate dates):
```typescript
// Option 1: Add validation helper
function isValidISODate(dateStr: string): boolean {
  const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

// Use in filter
const expensesThisMonth = transactions.filter((t) => {
  if (t.amount <= 0) return false;
  if (!isValidISODate(t.date)) {
    console.warn(`[Dashboard] Invalid date: ${t.date}`);
    return false;
  }
  return t.date.startsWith(currentMonth);
});

// Option 2: Use try-catch (if regex overkill)
const expensesThisMonth = transactions.filter((t) => {
  if (t.amount <= 0) return false;

  try {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) return false;
    const month = date.toISOString().slice(0, 7);
    return month === currentMonth;
  } catch {
    console.warn(`[Dashboard] Invalid date: ${t.date}`);
    return false;
  }
});
```

**Test**:
```typescript
it('should filter out transactions with invalid dates', () => {
  const transactions = [
    {amount: 100, date: '2025-11-04'}, // Valid
    {amount: 100, date: '11/04/2025'}, // Invalid format
    {amount: 100, date: '2025-13-40'}, // Invalid date
    {amount: 100, date: 'not-a-date'}, // Invalid
  ];

  const result = aggregateSpendingByCategory(transactions, categories);
  // Should only count first transaction
  expect(getTotalFromResult(result)).toBe(100);
});
```
</bug_5_mmt_96>

---

## Implementation Order

<execution_order>
**Fix in this sequence** (dependency-based):

1. **Bug 4** (30 min) - Schema fix, easiest, builds confidence
2. **Bug 5** (1-2 hrs) - Date validation, enables safe testing of other bugs
3. **Bug 3** (2-3 hrs) - Type safety, prevents dashboard crashes
4. **Bugs 1-2** (4-6 hrs) - Route fixes, may depend on above fixes

**Rationale**: Fix data layer (schemas, validation) before UI layer (routing)
</execution_order>

---

## TDD Workflow (MANDATORY)

<tdd_workflow>
**For EACH bug, follow this order**:

```
1. ❌ RED: Write failing test that reproduces the bug
   → Run test: npm test -- [test-file]
   → Verify: Test fails with expected error

2. ✅ GREEN: Implement minimal fix
   → Run test: npm test -- [test-file]
   → Verify: Test passes

3. ♻️ REFACTOR: Improve code quality
   → Add error handling
   → Add logging
   → Extract utilities if needed

4. 🧪 EDGE CASES: Add more tests
   → Test empty data
   → Test malformed data
   → Test boundary conditions
```

**Example** (Bug 4):
```bash
# 1. RED: Create test file
touch frontend/src/lib/dashboard/__tests__/schemas.test.ts

# Write test that fails:
it('should accept maxValue of 0', () => {
  const data = {months: [{month: '2025-11', income: 0, expenses: 0}], maxValue: 0};
  expect(IncomeExpensesChartDataSchema.safeParse(data).success).toBe(true);
});

# Run: npm test -- schemas.test.ts
# Expected: FAIL (rejects 0)

# 2. GREEN: Fix schema (positive → nonnegative)
# Run: npm test -- schemas.test.ts
# Expected: PASS

# 3. REFACTOR: Add comment explaining why nonnegative
// maxValue: 0 is valid for users with no transactions (empty state)

# 4. EDGE CASES: Test negative values still rejected
it('should reject negative maxValue', () => {
  const data = {months: [], maxValue: -100};
  expect(IncomeExpensesChartDataSchema.safeParse(data).success).toBe(false);
});
```
</tdd_workflow>

---

## Validation Checklist

<validation>
**After ALL fixes, manually test**:

### Empty State Testing
```bash
# Clear all localStorage
localStorage.clear() # In browser console

# Test each route with NO data:
- [ ] /dashboard loads (shows empty states, no crashes)
- [ ] /categories loads (shows empty state)
- [ ] /budgets loads (shows empty state, NO ERROR BOUNDARY)
- [ ] /transactions loads (shows empty state, NO ERROR BOUNDARY)
```

### Happy Path Testing
```bash
# Add test data
- [ ] Create 1 category
- [ ] Create 1 budget for that category
- [ ] Create 1 transaction in that category
- [ ] Navigate to /budgets → progress updates
- [ ] Navigate to /dashboard → chart shows data
- [ ] Navigate to /transactions → transaction visible
```

### Malformed Data Testing
```bash
# Corrupt localStorage in console:
localStorage.setItem('payplan_goals_v1', '{invalid json}');
localStorage.setItem('payplan_transactions_v1', '[{date:"bad-date"}]');

# Test routes don't crash:
- [ ] /dashboard loads (filters bad data, shows good data)
- [ ] Console shows warnings (not silent failures)
```

### Test Suite
```bash
- [ ] npm test → All tests pass
- [ ] npm run test:coverage → Meets thresholds
- [ ] npx tsc --noEmit → 0 TypeScript errors
```
</validation>

---

## Success Criteria

<success_criteria>
**Functional**:
1. ✅ All 5 routes accessible (no ERROR BOUNDARY)
2. ✅ Empty states render gracefully (no crashes)
3. ✅ Invalid data filtered with console warnings (no silent errors)
4. ✅ Budget progress updates after transaction creation

**Testing**:
5. ✅ Regression test for each bug (5 new tests minimum)
6. ✅ All existing tests still pass
7. ✅ Manual testing checklist 100% complete

**Quality**:
8. ✅ No `as` type assertions (use Zod validation)
9. ✅ All date operations validated
10. ✅ Both bots approve (no CRITICAL/HIGH feedback)

**Closure**:
11. ✅ All 5 Linear issues closed with fix commit references
12. ✅ Bug fix summary in memory/bugfix-2025-11-04.md
</success_criteria>

---

## Quick Commands

<commands>
```bash
# Investigate
npm run dev                    # Start server, manually test routes
grep -rn "\.positive()" frontend/src/lib/  # Find other .positive() issues
grep -rn "as " frontend/src/   # Find other unsafe type assertions

# Fix
npm test -- [file].test.ts    # Run specific test
npm test                       # Run all tests
npm run test:coverage          # Verify coverage
npx tsc --noEmit              # Check TypeScript

# Validate
git add [files] && git commit  # Commit fix
git push                       # Push to PR
gh pr create                   # Create PR
```
</commands>

---

## Common Pitfalls

<avoid>
❌ **Don't** guess root causes - investigate with console first
❌ **Don't** fix without tests - write test first (TDD)
❌ **Don't** skip manual testing - automated tests don't catch routing errors
❌ **Don't** defer bot feedback - these are CRITICAL bugs, fix ALL issues
❌ **Don't** create 5 separate PRs - one PR with all fixes (easier to review)
</avoid>

---

## Definition of Done

<done>
**Code**:
- [ ] All 5 bugs investigated (actual root causes documented)
- [ ] All 5 bugs fixed with regression tests
- [ ] No new bugs introduced
- [ ] No TypeScript errors
- [ ] Test coverage maintained or improved

**Manual Testing**:
- [ ] All routes accessible (/dashboard, /categories, /budgets, /transactions)
- [ ] Empty states work (clear localStorage, all routes render)
- [ ] Data CRUD works (create category → budget → transaction → see in dashboard)
- [ ] Malformed data handled gracefully (no crashes)

**Quality**:
- [ ] Both bots approve (Claude Code Bot + CodeRabbit AI)
- [ ] ALL CRITICAL/HIGH feedback addressed
- [ ] MEDIUM/LOW feedback addressed (don't defer - these are critical bugs)

**Closure**:
- [ ] PR merged
- [ ] All 5 Linear issues closed (MMT-94, 95, 96, 103, 104)
- [ ] Bug fix report created
- [ ] Ready for Goal Tracking feature
</done>

---

**INVESTIGATE FIRST. Fix with evidence, not assumptions. All 5 bugs must be resolved before building new features.**
