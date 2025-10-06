# Component Render Profile - Day 7

**Date**: 2025-10-06
**Purpose**: Identify components that re-render frequently and would benefit from React.memo

## Component Tree Analysis

### App Component Hierarchy
```
App
├── InputCard (manages email input state)
│   ├── Textarea (email input)
│   ├── LocaleToggle (dateLocale state)
│   ├── LoadingSpinner (isExtracting state)
│   ├── SuccessToast (successMessage state)
│   └── Button (extract trigger)
├── EmailPreview (renders extracted items)
│   ├── Button (Copy CSV, Build Plan)
│   ├── Table (item list)
│   └── DateQuickFix (per-row quick fix UI)
├── EmailIssues (extraction issues/errors)
│   └── ErrorList (dismissable errors)
└── PlanResults (after build plan)
    ├── ScheduleTable
    ├── RiskFlags
    ├── SummaryCard
    └── ResultsThisWeek
```

## Re-render Analysis

### High Re-render Components (Memoization Priority)

#### 1. EmailPreview ✅ MEMOIZED
**Re-render Triggers:**
- Parent InputCard state changes (email text, locale, extraction state)
- Items array updates (extraction, deletion, quick fix)
- Callback prop changes (onDelete, onCopyCSV, onBuildPlan, onApplyFix, onUndoFix)

**Why it re-renders unnecessarily:**
- When InputCard's email text changes, EmailPreview re-renders even though items haven't changed
- When locale toggle opens/closes modal, EmailPreview re-renders
- When LoadingSpinner appears/disappears, EmailPreview re-renders

**Memoization Strategy:**
- Wrapped with React.memo() ✅
- Re-renders only when `items`, `locale`, or `timezone` change
- Callbacks should be wrapped with useCallback in parent

**Expected Impact:** 60-80% reduction in re-renders

---

#### 2. DateQuickFix ✅ MEMOIZED
**Re-render Triggers:**
- Parent EmailPreview re-renders (even when this row's data hasn't changed)
- Table row state changes (other rows being edited)
- Props: rowId, rawDueDate, timezone, onFix, onUndo, locale

**Why it re-renders unnecessarily:**
- When any row in the table changes, all DateQuickFix components re-render
- When EmailPreview re-renders for unrelated reasons

**Memoization Strategy:**
- Wrapped with React.memo() ✅
- Re-renders only when props actually change
- Has internal state (manualDate, statusMessage, showUndo)

**Expected Impact:** 70-90% reduction in re-renders per row

---

### Medium Re-render Components

#### 3. EmailIssues
**Re-render Triggers:**
- Issues array updates
- Items array updates (affects "partial success" logic)
- Dismissal state changes

**Current Status:** Not memoized
**Recommendation:** Consider memoization if issues list is large (>10 items)
**Priority:** Medium (issues are usually small lists)

---

#### 4. LocaleToggle
**Re-render Triggers:**
- Modal open/close state
- Current locale changes
- isExtracting state (disables button)

**Current Status:** Not memoized
**Recommendation:** Low priority - small component, minimal render cost
**Priority:** Low

---

### Low Re-render Components

#### 5. LoadingSpinner
**Re-render Triggers:**
- isExtracting state changes (only 2 possible values: true/false)

**Current Status:** Not memoized
**Recommendation:** Not needed - only renders during extraction
**Priority:** Very Low

#### 6. SuccessToast
**Re-render Triggers:**
- successMessage state changes
- Auto-dismiss timer updates

**Current Status:** Not memoized
**Recommendation:** Not needed - short-lived, infrequent renders
**Priority:** Very Low

---

## Callback Optimization Analysis

### Parent Component: InputCard

**Callbacks passed to EmailPreview:**
- `onDelete` - Not wrapped with useCallback ❌
- `onCopyCSV` - Not wrapped with useCallback ❌
- `onBuildPlan` - Not wrapped with useCallback ❌
- `onApplyFix` - Not wrapped with useCallback ❌
- `onUndoFix` - Not wrapped with useCallback ❌

**Impact:**
These callbacks are recreated on every InputCard render, causing EmailPreview (now memoized) to re-render even when items haven't changed.

**Fix Required:** Wrap all callbacks with useCallback

---

## Profiling Results Summary

### Components Memoized
1. ✅ EmailPreview - High priority
2. ✅ DateQuickFix - High priority

### Additional Work Required
1. ❌ Wrap callbacks in InputCard with useCallback
2. ❌ Add render counting tests to verify memoization works
3. ❌ Measure actual re-render reduction (current: estimated based on code analysis)

### Expected Performance Impact
- **EmailPreview:** 60-80% fewer re-renders
- **DateQuickFix:** 70-90% fewer re-renders per row
- **Overall:** Smoother UI, especially when editing dates or toggling locale

---

## Next Steps

1. Add useCallback wrappers in InputCard for all callbacks passed to EmailPreview
2. Create render counting tests using @testing-library/react render spy
3. Consider profiling with React DevTools Profiler in production build
4. Add performance assertions to catch regressions

---

## Notes

- Memoization is most effective for components with:
  - Expensive render logic (loops, computations)
  - Frequent re-renders from parent state changes
  - Large child trees (EmailPreview has table with many rows)

- DateQuickFix benefits especially when multiple rows are rendered (each gets memoized separately)

- Callbacks must be stable (useCallback) for React.memo to be effective
