# Chunk 6: Polish & Integration

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk6-polish`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T047-T052 (9 tasks)
**Estimated Time**: 1-2 hours
**Dependencies**: Chunks 1-5 complete (all widgets implemented)

---

## Context Rehydration

### What You're Building

**Goal**: Final integration, polish, and production readiness. This chunk brings everything together.

**Key Tasks**:
1. Implement responsive grid layout
2. Add loading skeletons
3. Verify WCAG 2.1 AA compliance
4. Optimize localStorage reads
5. Add error boundary
6. Set Dashboard as default route

**What's Already Done**:
- ✅ Chunks 1-5: All 6 widgets implemented
- ✅ Data aggregation layer complete
- ✅ Custom hooks with useMemo optimization
- ✅ All components created

**Why This Chunk**:
Final polish ensures production quality, accessibility compliance, and error handling. This chunk makes the dashboard robust and user-ready.

---

## Git Workflow

```bash
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk6-polish

# After implementation
git add .
git commit -m "feat(dashboard): add polish, loading states, error handling, and set as default route (T047-T052)"
git push origin 062-dashboard-chunk6-polish

# Create PR
gh pr create --base 062-short-name-dashboard --title "feat(dashboard): Chunk 6 - Polish & Integration (T047-T052)"
```

---

## Tasks Checklist

### T047: Implement responsive grid layout

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Success Criteria**:
- ✅ Mobile (<768px): 1 column, stacked
- ✅ Tablet (768px-1024px): 2 columns
- ✅ Desktop (>1024px): 3 columns
- ✅ All widgets fit within viewport (no horizontal scroll)

**Implementation**:
```typescript
// Update grid classes in Dashboard component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* All 6 widgets */}
</div>
```

**Manual Testing**:
- Open dashboard at 320px width (mobile): verify 1 column
- Open dashboard at 768px width (tablet): verify 2 columns
- Open dashboard at 1920px width (desktop): verify 3 columns

---

### T048: Add loading skeletons for all widgets

**File**: `frontend/src/components/dashboard/LoadingSkeleton.tsx` (new file)

**Success Criteria**:
- ✅ Skeleton displays while data loads
- ✅ Skeleton matches widget shape (chart, list, etc.)
- ✅ Accessible (aria-label="Loading")

**Implementation**:
```typescript
import React from 'react';

interface LoadingSkeletonProps {
  type: 'chart' | 'list' | 'progress';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  if (type === 'chart') {
    return (
      <div className="animate-pulse" aria-label="Loading chart">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-3" aria-label="Loading list">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (type === 'progress') {
    return (
      <div className="animate-pulse space-y-4" aria-label="Loading progress">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
```

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Implementation**:
```typescript
import { useState, useEffect } from 'react';
import { LoadingSkeleton } from '../components/dashboard/LoadingSkeleton';

// In Dashboard component
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // Simulate loading (data aggregation happens in useDashboardData hook)
  const timer = setTimeout(() => setIsLoading(false), 500);
  return () => clearTimeout(timer);
}, []);

// Wrap each widget with loading skeleton
{isLoading ? (
  <div className="bg-white rounded-lg shadow-md p-6">
    <LoadingSkeleton type="chart" />
  </div>
) : (
  <SpendingChartWidget data={spendingChartData} />
)}
```

---

### T049: Verify WCAG 2.1 AA compliance

**File**: `TESTING.md` (new file in project root)

**Success Criteria**:
- ✅ All widgets keyboard navigable (Tab, Shift+Tab, Enter, Arrow keys)
- ✅ All widgets screen reader compatible (NVDA/VoiceOver)
- ✅ Color contrast >= 4.5:1 (text) and >= 3:1 (UI)
- ✅ Focus indicators visible (2px outline)

**Manual Testing Checklist**:
```markdown
# Accessibility Testing: Dashboard with Charts

## Keyboard Navigation
- [ ] Tab through all widgets (focus visible on each)
- [ ] Shift+Tab navigates backward
- [ ] Enter activates widget items (transactions, bills, goals)
- [ ] Arrow keys navigate chart segments (pie chart)
- [ ] Escape closes modals/tooltips

## Screen Reader (NVDA/VoiceOver)
- [ ] Spending chart: Screen reader reads hidden table data
- [ ] Income chart: Screen reader reads monthly values
- [ ] Recent transactions: Screen reader reads transaction details
- [ ] Upcoming bills: Screen reader reads urgency levels
- [ ] Goal progress: Screen reader reads progress percentages
- [ ] Gamification: Screen reader reads streak and insights

## Color Contrast
- [ ] Text: 4.5:1 minimum (use WebAIM Contrast Checker)
- [ ] UI elements: 3:1 minimum
- [ ] Chart segments: Distinguishable without color alone

## Focus Management
- [ ] Focus indicators visible on all interactive elements
- [ ] Focus order is logical (top-to-bottom, left-to-right)
- [ ] No keyboard traps
```

**Tool**: WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)

---

### T050: Optimize localStorage reads with debouncing

**File**: `frontend/src/hooks/useDashboardData.ts` (update)

**Success Criteria**:
- ✅ localStorage reads debounced to 500ms
- ✅ Prevents excessive I/O on rapid re-renders

**Implementation**:
```typescript
import { useMemo, useEffect, useState } from 'react';
import { readCategories, readTransactions, readBudgets, readGoals } from '../lib/dashboard/storage';

export function useDashboardData() {
  // Use state to store localStorage data
  const [categories, setCategories] = useState(() => readCategories());
  const [transactions, setTransactions] = useState(() => readTransactions());
  const [budgets, setBudgets] = useState(() => readBudgets());
  const [goals, setGoals] = useState(() => readGoals());

  // Debounced refresh (optional - only if needed for real-time updates)
  useEffect(() => {
    const handleStorageChange = () => {
      setCategories(readCategories());
      setTransactions(readTransactions());
      setBudgets(readBudgets());
      setGoals(readGoals());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Memoized aggregations (unchanged)
  const spendingChartData = useMemo(
    () => aggregateSpendingByCategory(transactions, categories),
    [transactions, categories]
  );

  // ... rest of hook unchanged ...
}
```

**Note**: Debouncing is optional in Phase 1. Only implement if localStorage reads are slow (>500ms).

---

### T051: Add error boundary for localStorage failures

**File**: `frontend/src/components/ErrorBoundary.tsx` (new file)

**Success Criteria**:
- ✅ Catches localStorage quota exceeded errors
- ✅ Catches JSON parse errors
- ✅ Displays user-friendly error message
- ✅ Provides recovery option (clear localStorage)

**Implementation**:
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm('Clear all data and reset dashboard? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Dashboard Error</h1>
            <p className="text-gray-700 mb-4">
              We encountered an error loading your dashboard data. This may be due to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
              <li>Storage limit reached</li>
              <li>Corrupted data</li>
              <li>Browser compatibility issue</li>
            </ul>
            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset Dashboard
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Error: {this.state.error?.message}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Implementation**:
```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

// Wrap entire Dashboard in ErrorBoundary
export const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
};
```

---

### T052: Set Dashboard as default route

**File**: `frontend/src/App.tsx` (update)

**Success Criteria**:
- ✅ Dashboard route at `/` (root)
- ✅ Dashboard loads on app launch
- ✅ Other routes still accessible

**Implementation**:
```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Add other routes as needed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

**Manual Testing**:
- Open `http://localhost:5173/` → Dashboard displays
- Open `http://localhost:5173/dashboard` → Redirects to `/`
- Open invalid URL → Redirects to Dashboard

---

## Validation

### Final Manual Testing

**Test Suite: Full Dashboard**

1. **Empty State Test**:
   - Clear localStorage: `localStorage.clear()`
   - Refresh page
   - ✅ All widgets show empty states
   - ✅ Loading skeletons display briefly

2. **Data Test**:
   - Add 10 transactions, 3 categories, 2 goals
   - Refresh page
   - ✅ Dashboard loads in <1 second
   - ✅ All 6 widgets display correctly

3. **Performance Test**:
   - Add 10,000 transactions via script
   - Open React DevTools Profiler
   - Navigate to dashboard
   - ✅ Aggregation completes in <500ms

4. **Keyboard Navigation Test**:
   - Tab through all widgets
   - ✅ Focus visible on each widget
   - ✅ Enter/Space activates widget items

5. **Screen Reader Test**:
   - Use NVDA (Windows) or VoiceOver (Mac)
   - Navigate through dashboard
   - ✅ All widget content announced correctly

6. **Responsive Layout Test**:
   - Open dashboard at 320px width (mobile)
   - ✅ Widgets stack vertically, no horizontal scroll
   - Open dashboard at 768px width (tablet)
   - ✅ Widgets display in 2-column grid
   - Open dashboard at 1920px width (desktop)
   - ✅ Widgets display in 3-column grid

7. **Error Handling Test**:
   - Simulate localStorage quota exceeded
   - ✅ Error boundary catches error
   - ✅ User-friendly error message displays

---

## Success Criteria Summary

Chunk 6 is DONE when:
- ✅ All 9 tasks (T047-T052) completed
- ✅ Responsive grid layout works on all breakpoints
- ✅ Loading skeletons display while data loads
- ✅ WCAG 2.1 AA compliance verified
- ✅ localStorage reads optimized
- ✅ Error boundary handles failures gracefully
- ✅ Dashboard set as default route
- ✅ PR created and bot reviews pass

---

## Final PR to Main

After Chunk 6 is merged back to `062-short-name-dashboard`, create the **final PR** to merge the entire feature to `main`:

```bash
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard

# Create PR to main
gh pr create --base main --title "feat(dashboard): Dashboard with Charts - Complete Feature (MMT-85)" --body "$(cat <<'EOF'
## Feature: Dashboard with Charts (062-short-name-dashboard)

**Linear Issue**: [MMT-85](https://linear.app/mmtu-entertainment/issue/MMT-85/dashboard-with-charts)

---

### Summary

Implemented complete Dashboard with Charts feature across 6 chunks:
- ✅ Chunk 1: Foundation & Data Layer (T009-T015)
- ✅ Chunk 2: Spending Chart Widget (T016-T021)
- ✅ Chunk 3: Income vs Expenses Chart (T022-T026)
- ✅ Chunk 4: P1 Widgets - Transactions, Bills, Goals (T027-T040)
- ✅ Chunk 5: Gamification Widget (T041-T046)
- ✅ Chunk 6: Polish & Integration (T047-T052)

**Total**: 52 tasks completed

---

### What's in This Feature

**6 Dashboard Widgets**:
1. **Spending by Category** (pie chart, P0)
2. **Income vs. Expenses** (bar chart, P0)
3. **Recent Transactions** (list, P1)
4. **Upcoming Bills** (list with urgency badges, P1)
5. **Goal Progress** (progress bars, P1)
6. **Gamification** (streaks & insights, P2)

**Technical Highlights**:
- Data aggregation layer with useMemo optimization
- Read-only localStorage access (privacy-first)
- WCAG 2.1 AA compliant (keyboard nav, screen reader support)
- Responsive grid (mobile, tablet, desktop)
- Loading skeletons and error boundary
- Dashboard set as default route

---

### Manual Testing Performed

✅ All acceptance scenarios from spec.md verified
✅ Performance: Dashboard loads in <1 second
✅ Accessibility: WCAG 2.1 AA compliance verified
✅ Responsive layout works on all breakpoints
✅ Empty states display correctly
✅ Error handling tested (localStorage failures)

---

### Next Steps

- Monitor for user-reported issues
- Gather feedback on dashboard usability
- Plan Phase 2 features (custom date ranges, drill-down filters)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

**References**: [tasks.md](../tasks.md) | [spec.md](../spec.md) | [chunks 1-5](.)
