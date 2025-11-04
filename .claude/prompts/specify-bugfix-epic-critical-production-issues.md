# Specification Prompt: Critical Production Bug Fixes - Epic

**For**: Manus (Spec-Kit) → Claude Code (Implementation)
**Type**: Bug Fix Epic (5 CRITICAL/URGENT issues)
**Priority**: P0 (BLOCKS all new feature development)
**Estimated Effort**: 1-2 days
**Created**: 2025-11-04

---

## Context & Urgency

<context>
**Current State**: PayPlan has 3 completed features (Categories, Budgets, Dashboard) but Linear tracking shows **5 CRITICAL/URGENT bugs** that make core features unusable.

**Problem**: Linear backlog contains production-blocking bugs from bot reviews (MMT-94, 95, 96, 103, 104) that were deferred but never fixed. These bugs make /budgets and /transactions routes completely broken.

**Impact**:
- Users cannot access budgets page (ERROR BOUNDARY)
- Users cannot access transactions page (ERROR BOUNDARY)
- Dashboard crashes on empty data (schema validation error)
- Silent calculation errors with malformed data
- Runtime crashes with corrupted localStorage

**Urgency**: CRITICAL - Must fix before building Goal Tracking or any new features. Building on broken foundation creates more technical debt.

**Constitution Requirement**: Privacy-First (Principle I) + Quality-First (Principle VI) mandate we fix user-facing bugs before adding features.
</context>

---

## Feature Intent

<intent>
Fix all 5 production-blocking bugs to restore core feature functionality and prevent runtime crashes. Deliver a stable, working budgeting app before expanding with new features.

**Success Criteria**:
1. /budgets route renders without errors
2. /transactions route renders without errors
3. Dashboard handles empty data gracefully
4. Date filtering validated (no silent errors)
5. Type assertions replaced with Zod validation
6. All 5 Linear issues closed as complete
7. Manual testing confirms all core features work end-to-end
</intent>

---

## Bugs to Fix (Linear Issues)

<bugs>
### Bug 1: MMT-103 (HIGH) - /budgets Route Error
**Symptom**: React error boundary triggered on /budgets
**Impact**: Users cannot access budgets page (core feature broken)
**Root Cause**: TBD (likely component initialization or missing props)
**Evidence**: Pre-existing since PR #59 manual testing
**File**: `frontend/src/pages/Budgets.tsx` (suspected)

### Bug 2: MMT-104 (HIGH) - /transactions Route Error
**Symptom**: React error boundary triggered on /transactions
**Impact**: Users cannot access transactions page (core feature broken)
**Root Cause**: TBD (likely component initialization or missing props)
**Evidence**: Pre-existing since PR #59 manual testing
**File**: `frontend/src/pages/Transactions.tsx` (suspected)

### Bug 3: MMT-94 (URGENT) - Unsafe Type Assertion in useDashboardData
**Symptom**: `as` type assertion bypasses validation
**Impact**: Runtime crashes if localStorage contains invalid goal data
**Root Cause**: Line 81-86 uses `as` cast on unknown data from `readGoals()`
**Fix**: Replace with Zod validation (GoalSchema.safeParse)
**File**: `frontend/src/hooks/useDashboardData.ts:81-86`

### Bug 4: MMT-95 (URGENT) - Schema Mismatch (maxValue)
**Symptom**: Dashboard crashes when no transactions exist
**Root Cause**: `maxValue: z.number().positive()` rejects 0, but empty data returns 0
**Fix**: Change `.positive()` to `.nonnegative()` to allow 0
**File**: `frontend/src/lib/dashboard/schemas.ts:38`
**Effort**: 1 line change + test

### Bug 5: MMT-96 (URGENT) - Unsafe Date Filtering
**Symptom**: `.startsWith()` filtering assumes ISO format without validation
**Impact**: Silent failures if dates malformed, incorrect calculations
**Root Cause**: Line 45-46 no validation that `t.date` is valid ISO format
**Fix**: Add try-catch with `new Date()` validation and `isNaN()` check
**File**: `frontend/src/lib/dashboard/aggregation.ts:45-46`
</bugs>

---

## Technical Constraints

<constraints>
**Must Follow**:
- Constitution v3.1 (Quality-First, Privacy-First)
- TDD for business logic (80%+ coverage)
- WCAG 2.1 AA accessibility
- No breaking changes to existing APIs
- Backward compatible with existing localStorage data

**Testing Requirements**:
- Add regression tests for all 5 bugs
- Test empty data states (Bug 4, 5)
- Test malformed localStorage data (Bug 3, 5)
- Test route rendering (Bug 1, 2)
- Manual testing: All routes accessible

**Performance**:
- No performance degradation (date validation should be fast)
- Empty states must render in <1s
</constraints>

---

## Research Questions

<research>
1. **Bugs 1-2 (Route Errors)**: What component error is causing error boundary?
   - Check browser console for actual error message
   - Review recent changes to Budgets.tsx, Transactions.tsx
   - Check for missing props, undefined data, or lifecycle issues
   - Verify routes are correctly defined in App.tsx

2. **Bug 3 (Type Assertion)**: Does Goal type already exist?
   - Check `frontend/src/types/goal.ts`
   - Check if GoalSchema already exists in schemas.ts
   - If not, should we create Goal schema or use simpler validation?

3. **Bug 4 (Schema Mismatch)**: Are there other schema issues?
   - Audit all schemas for `.positive()` that should be `.nonnegative()`
   - Check if other widgets have similar empty state bugs

4. **Bug 5 (Date Filtering)**: Where else is date filtering used?
   - Grep for `.startsWith(currentMonth)` pattern
   - Check all aggregation functions for similar issues
   - Should we create a shared `isValidISODate()` utility?
</research>

---

## Existing Patterns to Follow

<patterns>
**Error Handling** (from Feature #063):
```typescript
try {
  const result = riskyOperation();
  return result;
} catch (error) {
  console.error('[Module] Error:', error.message);
  return defaultValue;
}
```

**Zod Validation** (from Feature #063):
```typescript
const validation = Schema.safeParse(data);
if (!validation.success) {
  console.error('[Module] Invalid data:', validation.error.message);
  return defaultValue;
}
return validation.data;
```

**Date Validation** (best practice):
```typescript
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(dateStr: string): boolean {
  if (!ISO_DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
```

**Test Pattern** (from Feature #063):
```typescript
it('should handle invalid localStorage data gracefully', () => {
  localStorage.setItem('key', 'invalid-json');
  const result = readData();
  expect(result).toEqual(defaultValue);
});
```
</patterns>

---

## Success Criteria

<success>
**Functional**:
1. ✅ /budgets route renders without error boundary
2. ✅ /transactions route renders without error boundary
3. ✅ Dashboard renders with 0 transactions (empty state)
4. ✅ Invalid localStorage data doesn't crash app
5. ✅ Malformed dates filtered out (no silent errors)

**Testing**:
6. ✅ Regression tests added for all 5 bugs
7. ✅ All existing tests still pass (no regressions)
8. ✅ New tests achieve 80%+ coverage

**Quality**:
9. ✅ No `as` type assertions (use Zod validation)
10. ✅ All bot feedback addressed (no new CRITICAL/HIGH)
11. ✅ Manual testing checklist complete

**Documentation**:
12. ✅ All 5 Linear issues closed
13. ✅ Bug fixes documented in memory/
14. ✅ ADR created if architectural decisions made
</success>

---

## Output Format

<output>
Create bug fix epic specification in `specs/064-bugfix-critical-production/`:

### Required Files:

**1. spec.md**:
- List all 5 bugs as "user stories" (Given broken state, When fixed, Then works)
- Acceptance criteria for each bug
- Independent test scenarios
- Why each bug is CRITICAL (user impact)

**2. plan.md**:
- Technical approach for each bug
- Root cause analysis (after investigation)
- Fix strategy with code examples
- Risk mitigation (how to avoid regressions)
- Constitutional validation

**3. tasks.md**:
- Atomic task breakdown (estimate: 20-30 tasks)
- Bug investigation tasks (find root cause)
- Fix implementation tasks
- Test creation tasks
- Validation tasks
- Dependency ordering

**4. research.md**:
- Browser console error investigation
- Component tree analysis (for routing bugs)
- Zod validation best practices
- Date validation patterns from industry

**5. quickstart.md** (optional):
- How to reproduce each bug
- How to verify each fix
- Testing commands

**6. TESTING-CHECKLIST.md**:
- Manual testing steps for all core features
- Regression testing checklist
- Empty state testing scenarios
</output>

---

## Investigation Commands

<commands>
```bash
# Bug 1-2: Check browser console errors
npm run dev
# Navigate to /budgets, /transactions, check console

# Bug 3: Check if Goal types exist
grep -r "interface Goal" frontend/src/types/
grep -r "GoalSchema" frontend/src/

# Bug 4: Check schema
cat frontend/src/lib/dashboard/schemas.ts | grep -A 3 "maxValue"

# Bug 5: Find all date filtering
grep -rn "\.startsWith(currentMonth)" frontend/src/

# Check for other .positive() that should be .nonnegative()
grep -rn "\.positive()" frontend/src/lib/ | grep -v "__tests__"
```
</commands>

---

## Example Bug Fix (Bug 4)

<example>
**File**: `frontend/src/lib/dashboard/schemas.ts:38`

**Before** (BUGGY):
```typescript
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(), // ❌ Rejects 0
});
```

**After** (FIXED):
```typescript
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().nonnegative(), // ✅ Allows 0 for empty state
});
```

**Test**:
```typescript
it('should accept maxValue of 0 for empty transaction data', () => {
  const emptyData = {
    months: [{ month: '2025-11', income: 0, expenses: 0 }],
    maxValue: 0
  };

  const result = IncomeExpensesChartDataSchema.safeParse(emptyData);
  expect(result.success).toBe(true);
});
```
</example>

---

## Prioritization

<priority>
**Fix Order** (dependency-based):

1. **Bug 4** (schema): Fix first (easiest, 30 min)
2. **Bug 5** (date validation): Fix second (enables testing other bugs)
3. **Bug 3** (type assertion): Fix third (dashboard dependency)
4. **Bugs 1-2** (routes): Fix last (may depend on fixes above)

**Rationale**: Fix easiest first (quick win), then foundational issues (schema, validation), then higher-level bugs (routing).
</priority>

---

## Definition of Done

<done>
**Code**:
- ✅ All 5 bugs fixed with tests
- ✅ No TypeScript errors (npx tsc --noEmit)
- ✅ All existing tests pass
- ✅ New regression tests pass

**Manual Testing**:
- ✅ /budgets route accessible, renders correctly
- ✅ /transactions route accessible, renders correctly
- ✅ Dashboard loads with 0 transactions
- ✅ Dashboard loads with malformed localStorage (graceful)
- ✅ All category/budget/transaction CRUD operations work

**Quality**:
- ✅ Both bots approve (Claude Code Bot + CodeRabbit AI)
- ✅ All CRITICAL/HIGH feedback addressed
- ✅ HIL final approval

**Documentation**:
- ✅ All 5 Linear issues closed
- ✅ Bug fixes documented
- ✅ Memory files updated
</done>

---

## Special Instructions

<instructions>
**For Manus**:
1. Investigate each bug BEFORE specifying (run `npm run dev`, check console)
2. Document actual root causes (not hypotheticals)
3. Create comprehensive regression test plan
4. Mark as **Tier 0** (critical, must fix before new features)

**For Claude Code**:
1. Start with Bug 4 (easiest, builds confidence)
2. Add tests BEFORE fixing (TDD for regressions)
3. Manual test ALL routes after each fix
4. Create single PR with all 5 fixes (or separate PRs if too large)
5. Address ALL bot feedback (no deferrals - these are critical bugs)
</instructions>

---

## Relationship to Roadmap

<roadmap>
**Blocks**:
- Goal Tracking (MMT-86)
- All future features

**Enables**:
- Stable foundation for MVP
- User trust (core features work)
- Technical debt reduction

**After This**:
- Resume normal roadmap (Goal Tracking → Recurring Bills → Analytics)
- MVP delivery timeline can proceed

**Constitution Alignment**:
- Quality-First (Principle VI): Fix bugs before adding features
- Privacy-First (Principle I): Prevent data corruption from bad validation
- Accessibility-First (Principle II): Ensure routes accessible to all users
</roadmap>

---

## Key Questions for Specification

<questions>
1. Are Bugs 1-2 (routing) the same root cause or different issues?
2. Does Goal type/schema already exist? (affects Bug 3 fix complexity)
3. Are there OTHER routes with similar error boundary issues?
4. Should we create shared utilities (isValidISODate, validateWithZod)?
5. Do we need ADR for "always validate localStorage data" pattern?
</questions>

---

## Expected Deliverables

<deliverables>
**Specification** (specs/064-bugfix-critical-production/):
- spec.md (5 bugs as user stories)
- plan.md (root cause analysis + fix strategy)
- tasks.md (20-30 atomic tasks)
- research.md (error investigation findings)

**Implementation**:
- Bug fixes with regression tests
- Shared validation utilities (if needed)
- Manual testing report
- PR with all 5 fixes

**Timeline**:
- Spec creation: 4-6 hours
- Investigation: 2-3 hours
- Implementation: 6-8 hours
- Testing: 2-3 hours
- Bot review: 1-2 hours
- **Total**: 15-22 hours (1-2 days)
</deliverables>

---

## Success Metrics

<metrics>
**Before** (Current State):
- ❌ /budgets: Error boundary (broken)
- ❌ /transactions: Error boundary (broken)
- ❌ Dashboard: Crashes on empty data
- ⚠️ Silent calculation errors possible
- ⚠️ Runtime crashes possible

**After** (Target State):
- ✅ /budgets: Renders with data or empty state
- ✅ /transactions: Renders with data or empty state
- ✅ Dashboard: Graceful empty states
- ✅ Invalid data filtered with warnings
- ✅ Type-safe localStorage reads
- ✅ 0 production crashes
- ✅ 5/5 Linear issues closed
</metrics>

---

## Prompt Quality Checklist

✅ **Clear structure** with XML tags
✅ **Explicit context** (why urgent, what's broken)
✅ **Concrete examples** (Bug 4 fix demonstrated)
✅ **Investigation guidance** (browser console, grep commands)
✅ **Success criteria** (measurable outcomes)
✅ **Dependencies** (fix order with rationale)
✅ **Constitutional alignment** (Quality-First principle)
✅ **Realistic timeline** (15-22 hours detailed breakdown)

---

**Make this spec excellent - these bugs block 40M potential users from using PayPlan's core features. Fix the foundation before building the future.**
