# Feature 064 PR Audit - Detailed Issue Log

**Analysis Date**: 2025-11-06
**Total Unique Issues**: 92

---

## Open Issues


### CRITICAL (8 issues)

**PR78-1**
- Location: `Claude Code Bot Review #1`
- Description: - Missing Test Coverage for Business Logic. The `useGoals` hook contains business logic but has NO test file. Constitution v3.1 requires 80% coverage for business logic. This hook manages ALL CRUD ope...
- First Seen: PR #78
- Duplicate Count: 1

**PR78-2**
- Location: `Claude Code Bot Review #1 & #2`
- Description: - Date Comparison Timezone Bug. `new Date('2025-11-05')` parses as UTC midnight. Users in non-UTC timezones cannot select "today" as target date. **Fix**: Use `new Date(targetDate + 'T00:00:00')` to f...
- First Seen: PR #78
- Duplicate Count: 1

**PR80-1**
- Location: `Claude Bot Review #2`
- Description: - Missing Tests for Business Logic. Hook contains financial logic (179 lines) but has NO test file. Constitution v3.1 requires TDD for all business logic with 80%+ coverage. **Critical logic includes*...
- First Seen: PR #80
- Duplicate Count: 1

**PR80-2**
- Location: `Claude Bot Review #2`
- Description: - Undo Race Condition. If user rapidly adds two contributions, clicking Undo on first toast may revert to wrong state (closure captures outdated previousState). **Risk**: Data corruption (user loses m...
- First Seen: PR #80
- Duplicate Count: 1

**PR81-1**
- Location: `Claude Bot Review #1 - C1`
- Description: - Missing Tests for Business Logic (Constitution Violation). Constitution v3.1 requires TDD for business logic. The celebration modal contains date calculations (differenceInMonths) and currency forma...
- First Seen: PR #81
- Duplicate Count: 1

**PR81-2**
- Location: `Claude Bot Review #1 - C2`
- Description: - Race Condition in handleGoalComplete. Goals.tsx doesn't call refreshGoals() after celebration triggers, meaning the modal may show stale data. **Fix**: Add refreshGoals() call in handleGoalComplete ...
- First Seen: PR #81
- Duplicate Count: 1

**PR84-1**
- Location: `frontend/src/features/goals/lib/__tests__/GoalStorageService.test.ts`
- Description: The PR adds new `unarchiveGoal()` function to GoalStorageService.ts but NO TESTS were written for it. This violates Constitution v3.1 Phase 1 requirements: 80% coverage target for lib/...
- First Seen: PR #84
- Duplicate Count: 1

**PR85-1**
- Location: `frontend/src/features/goals/lib/export.ts (222 lines, 0% coverage)`
- Description: New export.ts file contains 222 lines of business logic with ZERO tests. Constitution v3.1 REQUIRES TDD for all business logic in lib/...
- First Seen: PR #85
- Duplicate Count: 1


### HIGH (11 issues)

**PR78-3**
- Location: `Claude Code Bot Review #1 & #2`
- Description: - Missing Error Handling in Goals Page. Using `alert()` instead of accessible error UI. This violates WCAG 2.2 AA. **Replace** with inline error message with ARIA attributes....
- First Seen: PR #78
- Duplicate Count: 1

**PR78-4**
- Location: `Claude Code Bot Review #1`
- Description: - Missing Focus Management in Dialogs. Add `autoFocus` to first input field for WCAG 2.2 AA compliance (2.4.3 Focus Order). Review #2 LOW issue #7 also mentions "No auto-focus on form open"....
- First Seen: PR #78
- Duplicate Count: 1

**PR78-5**
- Location: `Claude Code Bot Review #1`
- Description: - Potential Memory Leak in useGoals Hook. If component unmounts during 300ms debounce, `refreshGoals()` will call `setGoals()` on unmounted component. Track mount status with `isMounted` flag....
- First Seen: PR #78
- Duplicate Count: 1

**PR79-1**
- Location: `Claude Code Bot`
- Description: - Missing Tests for Business Logic (Constitution v3.1 Requirement). The getProgressIndicatorClass function is business logic but has no unit tests. Constitution v3.1 requires TDD for business logic (8...
- First Seen: PR #79
- Duplicate Count: 1

**PR80-3**
- Location: `Claude Bot Review #1`
- Description: - Missing undoContribution Dependency. The addContribution callback uses undoContribution in the toast action but doesn't list it in dependencies. This violates React Hooks rules and could cause stale...
- First Seen: PR #80
- Duplicate Count: 1

**PR80-4**
- Location: `Claude Bot Review #2`
- Description: - Unnecessary Dependency. Added next-themes@^0.4.6 but not used (sonner.tsx hardcodes theme="light"). **Fix**: npm uninstall next-themes (saves ~15KB)....
- First Seen: PR #80
- Duplicate Count: 1

**PR81-3**
- Location: `Claude Bot Review #1 - H1`
- Description: - Missing Focus Management. When modal opens, focus should move to the modal title (WCAG 2.2 AA requirement). **Fix**: Add useRef + useEffect to focus the DialogTitle when modal opens....
- First Seen: PR #81
- Duplicate Count: 1

**PR81-4**
- Location: `Claude Bot Review #1 - H2`
- Description: - No Goal Data Validation. Missing validation for required fields (createdAt, updatedAt, currentAmount). Could crash with NaN or Invalid Date. **Fix**: Add proper validation before calculations with d...
- First Seen: PR #81
- Duplicate Count: 1

**PR81-5**
- Location: `Claude Bot Review #1 - H3`
- Description: - Performance Issue. prefersReducedMotion check runs on every render via IIFE. Should be memoized with useMemo....
- First Seen: PR #81
- Duplicate Count: 1

**PR84-3**
- Location: `frontend/src/pages/Goals.tsx:266-270, 286-290`
- Description: Empty state messages lack semantic HTML and ARIA labels for screen readers. Constitution Violation: Principle II (Accessibility-First, WCAG 2.2 AA)....
- First Seen: PR #84
- Duplicate Count: 1

**PR85-3**
- Location: `frontend/src/features/goals/lib/export.ts:125`
- Description: Comment says "Fixed: currentAmount, not savedAmount" but currentAmount field may not exist on Goal type. Line 125: `currentAmount: formatCurrency(goal.currentAmount)`. Need to verify field exists in f...
- First Seen: PR #85
- Duplicate Count: 1


### MEDIUM (24 issues)

**PR74-1**
- Location: `Claude Code Bot`
- Description: - Documentation Additions Not Yet in CLAUDE.md. PR includes 2 large markdown files (`TESTING-SUMMARY-FINAL.md`, `bugs-investigation.md`, `bugs-manual-testing-report.md`) but these are not referenced i...
- First Seen: PR #74
- Duplicate Count: 1

**PR74-2**
- Location: `Claude Code Bot`
- Description: - Empty Feature Barrel Export. File exists but exports nothing (unused in Phase 1). Creates false expectation that feature is partially implemented. Per CLAUDE.md: "Each feature has an index.ts barrel...
- First Seen: PR #74
- Duplicate Count: 1

**PR74-3**
- Location: `Claude Code Bot`
- Description: - New Dependencies Not Documented in CLAUDE.md. PR adds 3 new runtime dependencies (`canvas-confetti@1.9.3`, `date-fns@4.1.0`, `@radix-ui/react-icons@1.3.2`) but `CLAUDE.md` "Technology Stack" section...
- First Seen: PR #74
- Duplicate Count: 1

**PR75-11**
- Location: `Claude Code Bot`
- Description: - Toast Component Naming Inconsistency. The plan mentions installing both `toast` and `sonner`. Shadcn has deprecated `toast` in favor of `sonner` (a better toast library). The plan correctly uses `so...
- First Seen: PR #75
- Duplicate Count: 1

**PR75-12**
- Location: `Claude Code Bot`
- Description: - Empty Component Availability. The doc recommends installing an `empty` component from Shadcn: `npx shadcn@latest add empty`. **Issue**: The `empty` component is not a standard Shadcn component. Shad...
- First Seen: PR #75
- Duplicate Count: 1

**PR76-1**
- Location: `Claude Code Bot`
- Description: - Date Validation Edge Case - Timezone Handling. The function may allow past dates in edge cases due to timezone handling. When `startDate` is in ISO format (e.g., "2025-11-04"), `new Date()` parses i...
- First Seen: PR #76
- Duplicate Count: 1

**PR76-2**
- Location: `Claude Code Bot`
- Description: - Inconsistent Error Handling - `saveGoals()` vs `GoalResult` Pattern. `saveGoals()` throws an exception on error, but other methods (e.g., `addGoal()`, `updateGoal()`) return a `GoalResult` type with...
- First Seen: PR #76
- Duplicate Count: 1

**PR77-1**
- Location: `Claude Code Bot`
- Description: - Potential Import Cross-Feature Dependency. Importing formatCurrency from the budgets feature creates a cross-feature dependency. According to PayPlan feature-based architecture, shared utilities sho...
- First Seen: PR #77
- Duplicate Count: 1

**PR78-6**
- Location: `Claude Code Bot Review #1 & #2`
- Description: - Performance: Missing Memoization in GoalCard. Not blocking but wasteful for lists with 10+ goals. Defer to Linear....
- First Seen: PR #78
- Duplicate Count: 1

**PR78-7**
- Location: `Claude Code Bot Review #1`
- Description: - Code Quality: Duplicate Status Mapping Logic. Three separate functions map status to variants/labels/colors. Violates DRY principle. Recommend refactoring into single STATUS_CONFIG object....
- First Seen: PR #78
- Duplicate Count: 1

**PR78-8**
- Location: `Claude Code Bot Review #1`
- Description: - Accessibility: Color Contrast in At Risk Status. Yellow bg-yellow-500 may have contrast issues. Verify with WebAIM Contrast Checker....
- First Seen: PR #78
- Duplicate Count: 1

**PR79-2**
- Location: `Claude Code Bot`
- Description: - Color Contrast Verification Needed. PR mentions 3:1 contrast for UI elements but does not show actual contrast ratios tested. WCAG 2.2 AA Requirement: UI components (progress bars) require 3:1 minim...
- First Seen: PR #79
- Duplicate Count: 1

**PR79-3**
- Location: `Claude Code Bot`
- Description: - Tailwind Arbitrary Variant Safelist. Issue: Tailwind might not detect arbitrary variant classes for purging unless configured. **Recommendation**: Verify that these classes are included in productio...
- First Seen: PR #79
- Duplicate Count: 1

**PR80-5**
- Location: `Claude Bot Review #1`
- Description: - Missing Validation for Negative Amounts. No check that amountCents > 0 before adding contribution. While QUICK_ADD_AMOUNTS are always positive, the hook is a public API....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-6**
- Location: `Claude Bot Review #1`
- Description: - Toast Timeout Issue. previousState not cleared after 5s toast duration expires....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-7**
- Location: `Claude Bot Review #2`
- Description: - Deep Copy Missing. Shallow copy for undo state - should use deep copy for data integrity....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-8**
- Location: `Claude Bot Review #2`
- Description: - No Loading State. Quick-add buttons lack loading state for slow devices (could lead to double-click issues)....
- First Seen: PR #80
- Duplicate Count: 1

**PR81-6**
- Location: `Claude Bot Review #1 - M1 / Review #2 - M1`
- Description: - Missing Test Coverage (Constitution v3.1 Requirement). Phase 1 requires TDD for business logic (80% coverage for lib/**/*.ts). While UI components do not require tests in Phase 1, the calculation lo...
- First Seen: PR #81
- Duplicate Count: 1

**PR81-7**
- Location: `Claude Bot Review #1 - M2 / Review #2 - M2`
- Description: - Potential Date Parsing Issue (ECMAScript Quirk). ECMAScript spec quirk - date-only strings are parsed as UTC, which can cause timezone issues (see ADR-003 in docs/architecture/decisions/). **Questio...
- First Seen: PR #81
- Duplicate Count: 1

**PR81-8**
- Location: `Claude Bot Review #2 - M3`
- Description: - Animation Class Not Defined in Tailwind. Uses animate-fade-in Tailwind class, but bot doesn't see it defined in the codebase. **Question**: Is animate-fade-in a custom Tailwind utility? Verify it is...
- First Seen: PR #81
- Duplicate Count: 1

**PR82-1**
- Location: `GoalForm.tsx lines 274-280`
- Description: The recalculation Alert uses Shadcn's default role="alert" but doesn't have aria-live="assertive" or aria-live="polite". Screen readers should announce when required monthly changes (important informa...
- First Seen: PR #82
- Duplicate Count: 1

**PR83-1**
- Location: `ContributionForm.tsx line 110`
- Description: Type expects `note: string | null` but code passes `undefined`. Line 110: `note.trim() || undefined` should be `note.trim() || null`....
- First Seen: PR #83
- Duplicate Count: 1

**PR84-5**
- Location: `frontend/src/features/goals/lib/GoalStorageService.ts:351`
- Description: The error message "Cannot unarchive non-archived goal" is hardcoded instead of using ERROR_MESSAGES constant. This breaks consistency with existing pattern (all other errors use constants), makes it h...
- First Seen: PR #84
- Duplicate Count: 1

**PR85-7**
- Location: `frontend/src/features/goals/lib/export.ts:106`
- Description: CSV export only includes contributionCount but not individual contribution details (dates, amounts, notes). Makes export less useful for users who want full history....
- First Seen: PR #85
- Duplicate Count: 1


### LOW (25 issues)

**PR74-4**
- Location: `Claude Code Bot`
- Description: - Spec Files Include Phase 8 Implementation Prompt. This PR is Feature 064 Phase 1, but file references Feature 063 Phase 8. Likely leftover from previous work session. **Recommendation Option A**: Re...
- First Seen: PR #74
- Duplicate Count: 1

**PR74-5**
- Location: `Claude Code Bot`
- Description: - Large Documentation Files in PR. PR includes 3 large markdown files (1,500+ lines total) that document Feature 063 bug fixes, not Feature 064 Phase 1. Mixing features in one PR. **Recommendation Opt...
- First Seen: PR #74
- Duplicate Count: 1

**PR75-8**
- Location: `CodeRabbit AI`
- Description: - Clarify Shadcn toast component naming (toast vs sonner). Line 21 references "Toast (undo notifications)" as a NEW component, but line 159 lists "sonner.tsx" and line 181's bash command uses `sonner`...
- First Seen: PR #75
- Duplicate Count: 1

**PR75-9**
- Location: `CodeRabbit AI`
- Description: - Clarify phase merge strategy—sequential vs. stacked. The PR review strategy is ambiguous. Line 57 states "Merge to `064-phase1-setup`" for Phase 2, but the base branch diagram shows 11 sibling phase...
- First Seen: PR #75
- Duplicate Count: 1

**PR75-10**
- Location: `CodeRabbit AI`
- Description: - Align currency formatting imports—inconsistent across examples. Line 17 imports `formatCentsAsUSD` from `@/lib/currency`, but line 341 imports `formatCurrency` from `@/features/budgets`. For a devel...
- First Seen: PR #75
- Duplicate Count: 1

**PR75-13**
- Location: `Claude Code Bot`
- Description: - Test Coverage Targets Clarification. The plan states: Business Logic: 80% minimum, Financial Calculations: 90%+ minimum, Overall Project: 60% minimum. **Observation**: The "Overall Project: 60%" mig...
- First Seen: PR #75
- Duplicate Count: 1

**PR75-14**
- Location: `Claude Code Bot`
- Description: - Cross-Feature Currency Import. Example shows: `import { formatCurrency } from '@/features/budgets';`. **Observation**: This creates a dependency on the budgets feature. If budgets feature changes it...
- First Seen: PR #75
- Duplicate Count: 1

**PR76-3**
- Location: `Claude Code Bot`
- Description: - Missing JSDoc - `saveGoals()`. `saveGoals()` lacks JSDoc documentation, while other public methods have it. **Recommendation**: Add JSDoc comment explaining parameters, return type, and exceptions....
- First Seen: PR #76
- Duplicate Count: 1

**PR76-4**
- Location: `Claude Code Bot`
- Description: - Test Coverage Gap - `clearGoals()`. `clearGoals()` method exists but has no test coverage. While simple, it's a destructive operation that should be tested. **Recommendation**: Add test verifying cl...
- First Seen: PR #76
- Duplicate Count: 1

**PR77-2**
- Location: `Claude Code Bot`
- Description: - MetricCard Could Use ARIA Labels. Individual MetricCard components do not have ARIA labels. Screen reader users hear "Total Goals 5" but do not get semantic context that this is a metric card. **Why...
- First Seen: PR #77
- Duplicate Count: 1

**PR77-3**
- Location: `Claude Code Bot`
- Description: - Barrel Export References Non-Existent Components. The barrel export references Phase 4 components that do not exist yet: GoalForm, GoalCard, GoalList, useGoals. **Recommendation**: Remove these expo...
- First Seen: PR #77
- Duplicate Count: 1

**PR78-9**
- Location: `Claude Code Bot Review #1`
- Description: - Code Style: Inconsistent React Import. React 19 + JSX transform doesn't require import React....
- First Seen: PR #78
- Duplicate Count: 1

**PR78-10**
- Location: `Claude Code Bot Review #1`
- Description: - Documentation: Missing JSDoc for Helper Functions. GoalCard helpers lack JSDoc comments. **Additional Issues from Review #2** (overlapping or minor variations): - **** Hardcoded button classes inste...
- First Seen: PR #78
- Duplicate Count: 1

**PR79-4**
- Location: `Claude Code Bot`
- Description: - TypeScript Type Safety. Suggestion: The status type is repeated in multiple helper functions. Consider extracting a GoalStatus type to types/goal.ts for single source of truth. **Benefit**: Easier r...
- First Seen: PR #79
- Duplicate Count: 1

**PR79-5**
- Location: `Claude Code Bot`
- Description: - Color Consistency. Observation: getStatusVariant uses Shadcn badge variants (default, destructive, secondary, outline) which map to different colors than the progress bar. **Question**: Do badge col...
- First Seen: PR #79
- Duplicate Count: 1

**PR80-9**
- Location: `Claude Bot Review #1`
- Description: - Missing aria-live Region. Selected goal display not announced to screen readers....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-10**
- Location: `Claude Bot Review #1`
- Description: - Missing Refresh Callback. No onContributionUndone callback for UI refresh after undo....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-11**
- Location: `Claude Bot Review #3`
- Description: - Error Handling: Silent Failures. When `addContribution` fails, there's no user-facing error notification. User clicks button, nothing happens. **Fix**: Add error toast when `result.success === false...
- First Seen: PR #80
- Duplicate Count: 1

**PR80-12**
- Location: `Claude Bot Review #3`
- Description: - Type Safety: Missing Import. `React` namespace used without import....
- First Seen: PR #80
- Duplicate Count: 1

**PR80-13**
- Location: `Claude Bot Review #2, #3`
- Description: - Missing onGoalComplete Prop. QuickAddSection missing onGoalComplete prop in Goals.tsx:152-156. **Impact**: Phase 7 confetti won't work. **Fix**: Add prop OR defer to Phase 7 with TODO....
- First Seen: PR #80
- Duplicate Count: 1

**PR81-9**
- Location: `Claude Bot Review #2 - L1`
- Description: - Inline Function Definition in Render (Minor Performance). prefersReducedMotion is recalculated on every render using an IIFE. While not a performance bottleneck in Phase 1, this could be optimized w...
- First Seen: PR #81
- Duplicate Count: 1

**PR81-10**
- Location: `Claude Bot Review #1 - M2 / Review #2 - L2`
- Description: - Poor UX - Archive Button Uses alert(). Browser alert() is jarring and breaks polished UX. Replace with toast.info() for consistency. Archive functionality "coming soon" alert is acceptable for Phase...
- First Seen: PR #81
- Duplicate Count: 1

**PR82-3**
- Location: `GoalCard.tsx lines 173-176`
- Description: The ARIA live region announces status on every render, which could be noisy for screen reader users if component re-renders frequently (e.g., when parent state updates)....
- First Seen: PR #82
- Duplicate Count: 1

**PR83-4**
- Location: `PR description`
- Description: Missing manual test evidence in PR description....
- First Seen: PR #83
- Duplicate Count: 1

**PR84-6**
- Location: `frontend/src/pages/Goals.tsx:121, 171`
- Description: New handlers (handleArchiveGoal, handleArchiveFromCelebration) lack JSDoc comments....
- First Seen: PR #84
- Duplicate Count: 1



---

## Resolved Issues

