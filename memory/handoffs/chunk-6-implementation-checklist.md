# Chunk 6 Implementation Checklist

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk6-polish`
**Base**: `main` (post PR #62)
**Estimated Time**: 2-3 hours total

---

## Pre-Implementation

- [ ] Read enhanced spec: `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-6-polish.md`
- [ ] Read bot feedback patterns (lines 13-96)
- [ ] Read T048b data accuracy fixes (lines 595-984)
- [ ] Create branch: `git checkout -b 062-dashboard-chunk6-polish`

---

## T048: Loading Skeletons (30-45 min)

### Step 1: Create LoadingSkeleton Component
- [ ] Create `frontend/src/components/dashboard/LoadingSkeleton.tsx`
- [ ] Copy implementation from spec (lines 226-293)
- [ ] Verify Tailwind classes (no custom CSS)

### Step 2: Update useDashboardData Hook
- [ ] Open `frontend/src/hooks/useDashboardData.ts`
- [ ] Add `isLoading` state with `useState(true)`
- [ ] Set to `false` after all aggregations complete
- [ ] Return `isLoading` in hook return value
- [ ] Verify implementation matches spec (lines 304-352)

### Step 3: Integrate into Dashboard
- [ ] Open `frontend/src/pages/Dashboard.tsx`
- [ ] Import `LoadingSkeleton`
- [ ] Destructure `isLoading` from `useDashboardData()`
- [ ] Wrap each widget with conditional: `{isLoading ? <LoadingSkeleton /> : <Widget />}`
- [ ] Verify implementation matches spec (lines 363-469)

### Step 4: Manual Test
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:5173/`
- [ ] ✅ Verify skeletons appear briefly (100-500ms)
- [ ] ✅ Verify widgets load after skeletons
- [ ] ✅ Verify no console errors
- [ ] Test with empty localStorage (should still work)

---

## T048b: Data Accuracy Fixes (45-60 min)

### Step 1: Fix Weekend/Weekday Insight (15 min)
- [ ] Open `frontend/src/lib/dashboard/gamification.ts`
- [ ] Navigate to lines 280-306 (weekend/weekday insight)
- [ ] Add constant: `const INSIGHT_RECENCY_DAYS = 30;`
- [ ] Add filter: `const thirtyDaysAgo = Date.now() - INSIGHT_RECENCY_DAYS * MILLISECONDS_PER_DAY;`
- [ ] Add time check to weekend filter: `transactionTime > thirtyDaysAgo`
- [ ] Add time check to weekday filter: `transactionTime > thirtyDaysAgo`
- [ ] Copy exact code from spec (lines 639-667)
- [ ] Save and verify TypeScript compiles

### Step 2: Fix Partial Month Logic (15 min)
- [ ] Navigate to lines 308-334 (month-over-month insight)
- [ ] Add date calculation after line 308:
  ```typescript
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgressPercent = (dayOfMonth / daysInMonth) * 100;
  ```
- [ ] Wrap existing logic in: `if (monthProgressPercent > 50) { ... }`
- [ ] Copy exact code from spec (lines 802-836)
- [ ] Save and verify TypeScript compiles

### Step 3: Fix Prorated Budget Wins (15 min)
- [ ] Navigate to lines 368-396 (budget win detection)
- [ ] After line 692 (`const budgetDollars = budget.amount / 100;`), add:
  ```typescript
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const proratedBudget = (budgetDollars * dayOfMonth) / daysInMonth;
  ```
- [ ] Change condition from `spentDollars < budgetDollars` to `spentDollars < proratedBudget`
- [ ] Update message to use `proratedBudget - spentDollars`
- [ ] Copy exact code from spec (lines 717-750)
- [ ] Save and verify TypeScript compiles

---

## Manual Testing (30 min)

### Test 1: Weekend/Weekday Insight (30-day filter)
- [ ] Open DevTools Console
- [ ] Run:
  ```javascript
  const old = { id: 'test1', amount: 10000, date: '2025-04-01', categoryId: 'c1' };
  const recent = { id: 'test2', amount: 10000, date: '2025-10-25', categoryId: 'c1' };
  localStorage.setItem('transactions', JSON.stringify([old, recent]));
  location.reload();
  ```
- [ ] ✅ Verify gamification widget ONLY uses recent transaction
- [ ] ✅ Verify old transaction ignored

### Test 2: Month-over-Month Insight (50% threshold)
- [ ] Mock date to Oct 10 (32% through month):
  ```javascript
  // In gamification.ts, temporarily add at top of generateInsights():
  const now = new Date('2025-10-10'); // Test date
  ```
- [ ] Refresh dashboard
- [ ] ✅ Verify month-over-month insight DOES NOT show
- [ ] Change to Oct 20 (65% through month):
  ```javascript
  const now = new Date('2025-10-20'); // Test date
  ```
- [ ] Refresh dashboard
- [ ] ✅ Verify month-over-month insight DOES show
- [ ] Remove test code after verification

### Test 3: Prorated Budget Wins
- [ ] Mock date to Oct 5:
  ```javascript
  const now = new Date('2025-10-05');
  ```
- [ ] Create $500 grocery budget in UI
- [ ] Add $50 grocery transaction on Oct 1
- [ ] Refresh dashboard
- [ ] ✅ Verify win shows: "You're $30.65 under budget in Groceries!"
  - Calculation: $500 × (5/31) = $80.65, $80.65 - $50 = $30.65
- [ ] Add $40 more (total $90)
- [ ] Refresh dashboard
- [ ] ✅ Verify win DOES NOT show (over prorated pace: $90 > $80.65)
- [ ] Remove test code

### Test 4: Edge Cases
- [ ] Test on last day of month (Oct 31)
  - ✅ Verify prorated budget = full budget
  - ✅ Verify month-over-month insight shows
- [ ] Test with no transactions
  - ✅ Verify no insights/wins
  - ✅ Verify empty state shows
- [ ] Test with only income (negative amounts)
  - ✅ Verify no expense insights
  - ✅ Verify income wins show correctly

---

## Unit Tests (15 min) - OPTIONAL Phase 1

### Add to `frontend/src/lib/dashboard/__tests__/gamification.test.ts`

- [ ] Test 1: Weekend insight 30-day filter
- [ ] Test 2: Month insight before 50%
- [ ] Test 3: Month insight after 50%
- [ ] Test 4: Prorated win under pace
- [ ] Test 5: Prorated win over pace

_Copy tests from spec lines 864-933_

---

## Verification Checklist

### TypeScript
- [ ] Run `npx tsc --noEmit`
- [ ] ✅ Verify 0 errors

### Build
- [ ] Run `npm run build`
- [ ] ✅ Verify build succeeds
- [ ] ✅ Verify no warnings

### Manual Testing
- [ ] All 4 test scenarios pass
- [ ] Loading skeletons display correctly
- [ ] Data accuracy verified (correct prorated math)
- [ ] No console errors

### Accessibility
- [ ] Screen reader test (NVDA/VoiceOver)
  - ✅ Loading skeletons announced
  - ✅ Widgets announced after load
  - ✅ All ARIA labels present
- [ ] Keyboard navigation
  - ✅ Tab through all widgets
  - ✅ Focus indicators visible

---

## Create PR

### Commit Messages
```bash
# Commit 1: Loading skeletons
git add frontend/src/components/dashboard/LoadingSkeleton.tsx
git add frontend/src/hooks/useDashboardData.ts
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat(dashboard): add loading skeletons for all widgets

- Create LoadingSkeleton component with shimmer animation
- Add isLoading state to useDashboardData hook
- Integrate skeletons into Dashboard page
- Improve perceived performance (100-500ms load time)

Addresses T048 from Chunk 6 specification"

# Commit 2: Data accuracy fixes
git add frontend/src/lib/dashboard/gamification.ts
git commit -m "fix(gamification): improve data accuracy in insights and wins

Fix 1: Filter weekend/weekday insight to last 30 days (not all-time)
Fix 2: Prorate budget wins by day of month (accurate math)
Fix 3: Only show month-over-month insight after 50% of month

These fixes ensure accurate financial insights and prevent:
- Outdated insights (6-month-old data)
- Misleading wins (wrong prorated math)
- Invalid comparisons (15 days vs 30 days)

User impact: Trust and better financial decisions

Addresses T048b from Chunk 6 specification"

# Commit 3: Unit tests (if added)
git add frontend/src/lib/dashboard/__tests__/gamification.test.ts
git commit -m "test(gamification): add unit tests for data accuracy fixes

- Test weekend insight 30-day filter
- Test month insight 50% threshold (before/after)
- Test prorated budget wins (under/over pace)

All tests use jest.useFakeTimers for date mocking"
```

### Push and Create PR
```bash
git push origin 062-dashboard-chunk6-polish

gh pr create --title "feat(dashboard): Chunk 6 - Loading skeletons and data accuracy fixes" --body "$(cat <<'EOF'
## Summary
Completes Chunk 6 (T047-T052) with loading skeletons and critical data accuracy fixes for gamification logic.

## Changes

### T048: Loading Skeletons ✅
- Created `LoadingSkeleton.tsx` with shimmer animation
- Added `isLoading` state to `useDashboardData` hook
- Integrated skeletons into all 6 Dashboard widgets
- Improves perceived performance (100-500ms load feedback)

### T048b: Data Accuracy Fixes ✅
**Fix 1: Weekend/Weekday Insight (30-day filter)**
- Problem: Used all-time data (could be 6 months old)
- Solution: Filter to last 30 days for recent patterns
- Impact: Prevents outdated insights

**Fix 2: Prorated Budget Wins**
- Problem: Compared full month spending to full budget (even on day 5)
- Solution: Prorate budget by day of month (Oct 5 = 5/31 of budget)
- Impact: Accurate wins, prevents misleading feedback
- Example: $500 budget on Oct 5 → prorated to $80.65, not $500

**Fix 3: Partial Month Logic**
- Problem: Compared 15 days (current month) to 30 days (last month)
- Solution: Only show month-over-month insight after 50% of month
- Impact: Statistically valid comparisons, no anxiety

### T047, T049, T051, T052: Verified ✅
- T047: Responsive grid already implemented
- T049: WCAG 2.1 AA compliance verified
- T051: ErrorBoundary exceeds spec
- T052: Dashboard default route verified

## Testing

### Manual Tests ✅
- [x] Loading skeletons display during data load (100-500ms)
- [x] Weekend insight uses only last 30 days
- [x] Month insight shows only after 50% of month
- [x] Budget wins use prorated math (Oct 5 example: $80.65 vs $500)
- [x] All edge cases tested (last day, no data, income only)

### Accessibility ✅
- [x] Screen reader compatible (NVDA tested)
- [x] Keyboard navigation works
- [x] ARIA labels on all elements
- [x] Loading skeletons properly announced

### Build Health ✅
- [x] TypeScript: 0 errors
- [x] Build: Successful
- [x] No console errors

## Impact

### User Trust
- ✅ Recent insights (last 30 days) → "App understands my current behavior"
- ✅ Accurate wins (prorated math) → "App helps me pace spending"
- ✅ Valid comparisons (50% threshold) → "App gives actionable feedback"

### Financial Decisions
**Example**: User with $500 grocery budget on Oct 5
- **Before Fix**: "🎉 You're $450 under budget!" (wrong)
- **After Fix**: "💪 You're $30.65 under budget!" (correct prorated)
- **Result**: Accurate feedback → better decisions → budget success

## Constitutional Compliance ✅
- ✅ Privacy-First: All calculations client-side, no PII leaks
- ✅ Accessibility-First: WCAG 2.1 AA compliant
- ✅ Phase 1: Manual testing prioritized, ship fast

## Files Changed
- `frontend/src/components/dashboard/LoadingSkeleton.tsx` (new)
- `frontend/src/hooks/useDashboardData.ts` (add isLoading)
- `frontend/src/pages/Dashboard.tsx` (skeleton integration)
- `frontend/src/lib/dashboard/gamification.ts` (3 data accuracy fixes)

## Related
- Feature 062 (Dashboard with Charts) - Final chunk
- Chunk 1-5: All widgets implemented (merged in PR #62)
- Spec: `specs/062-short-name-dashboard/implementation-prompts/chunk-6-polish.md`

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Bot Review Response Strategy

### Expected Bot Feedback

**CRITICAL Issues** (Fix immediately):
- Import path violations (use relative, not alias)
- Security vulnerabilities
- Privacy violations

**HIGH Issues** (Fix immediately):
- Missing ARIA attributes (ensure aria-atomic on live regions)
- Performance issues (useMemo dependencies)
- Data validation gaps

**MEDIUM/LOW Issues** (Defer to Linear):
- Code refactoring suggestions
- Minor optimizations
- Documentation improvements

### Response Workflow
1. Categorize feedback (CRITICAL → HIGH → MEDIUM → LOW)
2. Fix CRITICAL + HIGH immediately
3. Create Linear issues for MEDIUM + LOW with label `bot-suggestion`
4. Commit fixes: `fix(scope): address bot feedback - [description]`
5. Wait for bots to re-review
6. Repeat until both bots GREEN

---

## Definition of Done

- [ ] ✅ T048 (loading skeletons) implemented
- [ ] ✅ T048b (data accuracy fixes) implemented
- [ ] ✅ All manual tests pass
- [ ] ✅ TypeScript builds (0 errors)
- [ ] ✅ Accessibility verified (WCAG 2.1 AA)
- [ ] ✅ Claude Code Bot: GREEN
- [ ] ✅ CodeRabbit AI: GREEN
- [ ] ✅ HIL approved
- [ ] ✅ PR merged to main

---

**Last Updated**: 2025-10-31
**Next Action**: Create branch and start implementation
