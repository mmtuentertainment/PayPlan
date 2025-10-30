# Chunk 4: P1 Widgets (Transactions, Bills, Goals)

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk4-widgets`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T027-T040 (14 tasks)
**Estimated Time**: 2-3 hours
**Dependencies**: Chunk 1 complete (T009-T015)
**Research**: Enhanced with React 19.1, date-fns 3.5, Recharts 3.2, WCAG 2.1 AA, 2025 dashboard UX best practices

---

## Context Rehydration

### What You're Building

**Goal**: Implement 3 P1 (priority 1) widgets following industry-leading patterns from YNAB, Mint, and PocketGuard:
1. **Recent Transactions Widget** (User Story 3, P1) - Clean list with quick-scan visual hierarchy
2. **Upcoming Bills Widget** (User Story 4, P1) - Urgency-driven design with at-a-glance status
3. **Goal Progress Widget** (User Story 5, P1) - Progress bars with motivational status indicators

**Key Files**:
- `frontend/src/components/dashboard/RecentTransactionsWidget.tsx`
- `frontend/src/components/dashboard/UpcomingBillsWidget.tsx`
- `frontend/src/components/dashboard/GoalProgressWidget.tsx`

**What's Already Done**:
- ✅ Chunk 1: Data aggregation (`getRecentTransactions()`, `getUpcomingBills()`, `getGoalProgress()`)
- ✅ Types: `Transaction`, `UpcomingBill`, `GoalProgress` interfaces
- ✅ Zod schemas for all data types
- ✅ EmptyState component (reusable across all widgets)
- ✅ Widget architecture pattern established (Chunks 2-3)

**Industry Research Insights Applied**:
- ✅ PocketGuard's clean snapshot layout (net worth, bills, spending at-a-glance)
- ✅ YNAB's goal-oriented progress tracking with status indicators
- ✅ Mint's automatic transaction categorization with visual hierarchy
- ✅ 2025 Dashboard UX: Prioritize key info, avoid clutter, mobile-first responsive

---

## Git Workflow

```bash
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk4-widgets

# After implementation
git add .
git commit -m "feat(dashboard): implement P1 widgets - transactions, bills, goals (T027-T040)"
git push origin 062-dashboard-chunk4-widgets

# Create PR
gh pr create --base 062-short-name-dashboard --title "feat(dashboard): Chunk 4 - P1 Widgets (T027-T040)"
```

---

## TypeScript Patterns (From Chunks 1-3)

**IMPORTANT**: Follow these TypeScript strict mode patterns to avoid compilation errors:

### 1. Type-Only Imports
Use `import type` for interfaces and types from external libraries:
```typescript
import type { Transaction } from '../../types/transaction';
import type { UpcomingBill } from '../../types/bill';
```

### 2. React.memo for Performance
All widget components should use `React.memo` to prevent unnecessary re-renders:
```typescript
export const MyWidget = React.memo<MyWidgetProps>(({ data }) => {
  // ... component code
});

MyWidget.displayName = 'MyWidget'; // For debugging
```

**Why**: Widgets re-render when Dashboard updates. React.memo prevents wasteful re-renders.

### 3. Explicit Return Types
Always specify return types for functions:
```typescript
const getUrgencyBadge = (daysUntilDue: number): JSX.Element | null => {
  // ...
};
```

---

## Industry-Leading Widget Design Patterns (2025)

### Design Philosophy

**From Research** (YNAB, Mint, PocketGuard, 2025 UX trends):

**Visual Hierarchy**:
- Most critical info first (amount, due date, urgency)
- Secondary info second (category icon, days until due)
- Tertiary info last (transaction ID, metadata)

**Mobile-First Responsive**:
- Touch targets: 44x44px minimum (WCAG 2.5.5)
- Readable text: 16px body minimum
- Generous spacing: 16-24px between items

**Color Coding** (established in Chunks 2-3):
- Green `#22c55e`: Positive (income, surplus, on-track)
- Red `#dc2626`: Negative (expenses, deficit, at-risk)
- Yellow `#eab308`: Warning (due soon, approaching limit)
- Gray `#6b7280`: Neutral (uncategorized, no data)

**Interaction Patterns**:
- Hover states: `hover:bg-gray-50` (subtle feedback)
- Focus indicators: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2` (2px outline minimum)
- Active states: Visual feedback on click/tap

**Accessibility Requirements** (WCAG 2.1 AA):
- Color contrast: 4.5:1 text, 3:1 UI components
- Keyboard navigation: Tab, Enter, Space, Arrow keys
- Screen reader support: ARIA labels, semantic HTML, live regions
- Focus management: Visible indicators, logical order

---

## date-fns Integration (v3.5.0+)

### Best Practices from Official Docs

**Correct Unicode Tokens** (avoid common mistakes):
```typescript
import { format } from 'date-fns';

// ✅ CORRECT: Calendar year and day of month
format(new Date(), 'yyyy-MM-dd'); // 2025-10-30

// ❌ WRONG: Week year and day of year
format(new Date(), 'YYYY-MM-DD'); // 2025-10-283 (BUG!)
```

**Transaction Date Formatting**:
```typescript
// Format: "Oct 30, 2025"
{format(new Date(transaction.date), 'MMM d, yyyy')}

// For bills: "Due Oct 30" or "Overdue"
{bill.isOverdue
  ? 'Overdue'
  : `Due ${format(new Date(bill.dueDate), 'MMM d')}`
}
```

**Performance Optimization**:
- `format()` is fast (<1ms per call)
- No need to memoize date formatting (negligible cost)
- Tree-shakeable: only imports `format` function (not entire library)

---

## Widget Component Patterns (Established in Chunks 1-3)

### Standard Widget Architecture

**Pattern** (DO NOT DEVIATE - this is PayPlan's gold standard):

```
Widget (e.g., RecentTransactionsWidget.tsx)
  ├─ Container div (bg-white, rounded-lg, shadow-md, p-6)
  ├─ Header h2 (text-xl, font-semibold, text-gray-900, mb-4)
  └─ Conditional Rendering
      ├─ Empty State (if data.length === 0)
      │   └─ EmptyState component with message, action, icon
      └─ Content (if data.length > 0)
          └─ List/grid of items with interactions
```

**Code Template**:
```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from './EmptyState';
import type { DataType } from '../../types';

interface WidgetProps {
  data: DataType[];
}

export const MyWidget = React.memo<WidgetProps>(({ data }) => {
  const navigate = useNavigate();

  const handleItemClick = (id: string): void => {
    navigate(`/route/${id}`); // ✅ CORRECT: useNavigate() hook
    // console.log('Navigate...'); // ❌ WRONG: placeholder only
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Widget Title</h2>
      {data.length === 0 ? (
        <EmptyState
          message="No data yet"
          action={{
            label: 'Add Data',
            onClick: () => navigate('/add'),
          }}
          icon="📊"
        />
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <li key={item.id}>
              {/* Item content */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

MyWidget.displayName = 'MyWidget';
```

**Why React.memo?**
- Widgets re-render when Dashboard updates (parent component)
- React.memo prevents unnecessary re-renders if props unchanged
- **Critical for performance** with 100+ transactions

---

## Accessibility Implementation (WCAG 2.1 AA Compliance)

### Keyboard Navigation Requirements

**Pattern** (from WAI-ARIA best practices):

```typescript
<li
  key={item.id}
  onClick={() => handleClick(item.id)}
  className="... cursor-pointer transition-colors"
  tabIndex={0}
  role="button"
  aria-label={`View details for ${item.name}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent scroll on Space
      handleClick(item.id);
    }
  }}
>
  {/* Item content */}
</li>
```

**Key Requirements**:
- `tabIndex={0}`: Adds to tab order
- `role="button"`: Announces as interactive element
- `aria-label`: Provides context for screen readers
- `onKeyDown`: Handles Enter and Space keys
- `e.preventDefault()`: Prevents Space from scrolling page

### Color Contrast Verification (from Chunks 2-3)

**Verified Ratios** (all pass WCAG 2.1 AA):
- Heading text (#111827 on white): 21:1 ✅
- Body text (#6b7280 on white): 4.6:1 ✅
- Green status (#22c55e on white): 3.4:1 ✅
- Red status (#dc2626 on white): 4.7:1 ✅
- Yellow badges (#eab308 on #fef3c7): 8.2:1 ✅

**Tool**: Use WebAIM Contrast Checker to verify custom colors

### Screen Reader Support

**Pattern**: Add descriptive labels to all interactive elements

```typescript
// Progress bar example
<div
  className="h-3 rounded-full transition-all duration-300 bg-green-500"
  style={{ width: `${percentage}%` }}
  role="progressbar"
  aria-valuenow={percentage}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${goalName}: ${percentage.toFixed(0)}% complete`}
/>

// Urgency badge example
<span
  className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded"
  aria-label="Urgent: Bill due today"
>
  Due Today
</span>
```

---

## Navigation Pattern (Established in Chunk 2)

### DO NOT Use console.log Placeholders

**Pattern**: Always use `useNavigate()` hook for routing

```typescript
import { useNavigate } from 'react-router-dom';

export const MyWidget: React.FC<Props> = ({ data }) => {
  const navigate = useNavigate();

  // ✅ CORRECT: Direct navigation
  const handleAddClick = (): void => {
    navigate('/transactions');
  };

  // ✅ CORRECT: Navigation with ID
  const handleItemClick = (id: string): void => {
    navigate(`/transactions/${id}`);
  };

  // ❌ WRONG: console.log placeholder (DO NOT DO THIS)
  const handleClick = (): void => {
    console.log('Navigate to transactions'); // This will be flagged in review
  };

  return (
    <EmptyState
      message="No transactions"
      action={{
        label: 'Add Transaction',
        onClick: handleAddClick, // ✅ CORRECT
      }}
      icon="💸"
    />
  );
};
```

**Rationale**: Placeholders were acceptable in early design, but Chunk 2 established the navigation pattern. Bot reviews will flag console.log usage as incomplete implementation.

---

## Performance Optimization (React 19.1 Best Practices)

### When to Use React.memo

**Pattern** (from official React docs):

```typescript
// ✅ Use React.memo for expensive rendering
export const ExpensiveWidget = React.memo<WidgetProps>(({ data }) => {
  // Component that takes >16ms to render
  // Or component with expensive child components
});

ExpensiveWidget.displayName = 'ExpensiveWidget';
```

**When to use**:
- Widget components (always - they re-render frequently)
- Components with expensive children (charts, long lists)
- Components that render >100 items

**When NOT to use**:
- Simple components (<16ms render time)
- Components that change on every parent render
- Premature optimization (profile first)

### useMemo for Expensive Calculations

**Pattern** (from Chunks 1-3):

```typescript
import { useMemo } from 'react';

export const MyWidget: React.FC<Props> = ({ transactions }) => {
  // ✅ Memoize expensive calculations
  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [transactions]
  );

  // ❌ Don't memoize simple calculations
  const count = transactions.length; // Fast, no need to memoize

  return <div>{/* Render sortedTransactions */}</div>;
};
```

**Guidelines**:
- Use for sorting/filtering large arrays (>100 items)
- Use for complex calculations (>5ms)
- Don't use for simple arithmetic or string operations

---

## Tasks Checklist

### Widget 1: Recent Transactions (US3)

#### T027: Create RecentTransactionsWidget component [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/RecentTransactionsWidget.tsx`

**Success Criteria**:
- ✅ Displays 5 most recent transactions
- ✅ Shows date, description, amount, category icon
- ✅ Click handler navigates to transaction details (placeholder)
- ✅ Empty state: "No transactions yet" with CTA

**Implementation**:
```typescript
import React from 'react';
import { format } from 'date-fns';
import type { Transaction } from '../../types';
import { EmptyState } from './EmptyState';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ transactions }) => {
  const handleTransactionClick = (id: string) => {
    // TODO: Navigate to transaction details (Chunk 6)
    console.log('Navigate to transaction:', id);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <EmptyState
          message="No transactions yet"
          action={{
            label: 'Add Transaction',
            onClick: () => console.log('Navigate to transaction entry'),
          }}
          icon="💸"
        />
      ) : (
        <ul className="space-y-3">
          {transactions.map((t) => (
            <li
              key={t.id}
              onClick={() => handleTransactionClick(t.id)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTransactionClick(t.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.type === 'income' ? '💰' : '💳'}</span>
                <div>
                  <p className="font-medium text-gray-900">{t.description}</p>
                  <p className="text-sm text-gray-500">{format(new Date(t.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**Note**: Install `date-fns` if not already present: `npm install date-fns`

#### T028-T030: Complete Recent Transactions Widget

**T028**: Implement transaction list with date, description, amount, category icon (done in T027)

**T029**: Add click handler to navigate to transaction details page (done in T027, placeholder)

**T030**: Integrate RecentTransactionsWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Implementation**:
```typescript
import { RecentTransactionsWidget } from '../components/dashboard/RecentTransactionsWidget';

// Replace Widget 3 placeholder
<RecentTransactionsWidget transactions={recentTransactions} />
```

---

### Widget 2: Upcoming Bills (US4)

#### T031: Create UpcomingBillsWidget component [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/UpcomingBillsWidget.tsx`

**Success Criteria**:
- ✅ Displays bills due in next 7 days
- ✅ Sorted by due date (soonest first)
- ✅ Shows name, amount, due date
- ✅ Urgency badges: "Due Today" (red), "Due in 1-3 days" (yellow)
- ✅ Empty state: "No bills due in the next 7 days"

**Implementation**:
```typescript
import React from 'react';
import { format } from 'date-fns';
import type { UpcomingBill } from '../../types/bill';
import { EmptyState } from './EmptyState';

interface UpcomingBillsWidgetProps {
  bills: UpcomingBill[];
}

export const UpcomingBillsWidget: React.FC<UpcomingBillsWidgetProps> = ({ bills }) => {
  const getUrgencyBadge = (daysUntilDue: number) => {
    if (daysUntilDue === 0) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Due Today</span>;
    }
    if (daysUntilDue <= 3) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">Due in {daysUntilDue} days</span>;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Bills</h2>
      {bills.length === 0 ? (
        <EmptyState
          message="No bills due in the next 7 days"
          icon="📅"
        />
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <li key={bill.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{bill.categoryIcon || '💳'}</span>
                <div>
                  <p className="font-medium text-gray-900">{bill.name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(bill.dueDate), 'MMM d, yyyy')}</p>
                  {getUrgencyBadge(bill.daysUntilDue)}
                </div>
              </div>
              <p className="font-semibold text-gray-900">${bill.amount.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### T032-T035: Complete Upcoming Bills Widget

**T032**: Implement recurring transaction detection logic (done in Chunk 1, `getUpcomingBills()`)

**T033**: Add urgency badges (done in T031)

**T034**: Add screen reader announcements for bill urgency

**File**: `frontend/src/components/dashboard/UpcomingBillsWidget.tsx` (update)

**Implementation**:
```typescript
// Add aria-label to urgency badges
const getUrgencyBadge = (daysUntilDue: number) => {
  if (daysUntilDue === 0) {
    return (
      <span
        className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded"
        aria-label="Urgent: Bill due today"
      >
        Due Today
      </span>
    );
  }
  if (daysUntilDue <= 3) {
    return (
      <span
        className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded"
        aria-label={`Warning: Bill due in ${daysUntilDue} days`}
      >
        Due in {daysUntilDue} days
      </span>
    );
  }
  return null;
};
```

**T035**: Integrate UpcomingBillsWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Implementation**:
```typescript
import { UpcomingBillsWidget } from '../components/dashboard/UpcomingBillsWidget';

// Replace Widget 4 placeholder
<UpcomingBillsWidget bills={upcomingBills} />
```

---

### Widget 3: Goal Progress (US5)

#### T036: Create GoalProgressWidget component [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/GoalProgressWidget.tsx`

**Success Criteria**:
- ✅ Displays up to 3 active goals
- ✅ Progress bars with percentage and remaining amount
- ✅ Status indicators: on-track (green), at-risk (yellow), completed (green with celebration)
- ✅ Conditional rendering: hide if goals feature not implemented
- ✅ Empty state: "Create your first savings goal"

**Implementation**:
```typescript
import React from 'react';
import type { GoalProgress } from '../../types/goal';
import { EmptyState } from './EmptyState';

interface GoalProgressWidgetProps {
  goals: GoalProgress[];
}

export const GoalProgressWidget: React.FC<GoalProgressWidgetProps> = ({ goals }) => {
  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'on-track') return 'bg-green-500';
    if (status === 'at-risk') return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return '🎉 Goal Complete!';
    if (status === 'on-track') return '✅ On Track';
    if (status === 'at-risk') return '⚠️ At Risk';
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Goal Progress</h2>
      {goals.length === 0 ? (
        <EmptyState
          message="Create your first savings goal"
          action={{
            label: 'Create Goal',
            onClick: () => console.log('Navigate to goal creation'),
          }}
          icon="🎯"
        />
      ) : (
        <ul className="space-y-4">
          {goals.slice(0, 3).map((goal) => (
            <li key={goal.goalId}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{goal.goalName}</p>
                <p className="text-sm text-gray-600">{goal.percentage.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getStatusColor(goal.status)}`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={goal.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.goalName}: ${goal.percentage.toFixed(0)}% complete`}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                </p>
                <p className="text-gray-500">{getStatusText(goal.status)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### T037-T040: Complete Goal Progress Widget

**T037**: Implement progress bars with percentage and remaining amount (done in T036)

**T038**: Add status indicators (done in T036)

**T039**: Add conditional rendering (hide widget if goals feature not implemented)

**File**: `frontend/src/components/dashboard/GoalProgressWidget.tsx` (update)

**Note**: Widget is already conditionally rendered via empty state. If `goals = []`, empty state shows.

**T040**: Integrate GoalProgressWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Implementation**:
```typescript
import { GoalProgressWidget } from '../components/dashboard/GoalProgressWidget';

// Replace Widget 5 placeholder
<GoalProgressWidget goals={goalProgress} />
```

---

## Comprehensive Manual Testing (from Chunks 1-3 Experience)

### Pre-Implementation Checklist

- [ ] **Verify TypeScript Compiler**: `npx tsc --noEmit` → 0 errors
- [ ] **Verify Dev Server Running**: `npm run dev` → no errors in console
- [ ] **Read Types**: Review `Transaction`, `UpcomingBill`, `GoalProgress` interfaces

### Functional Testing (7 Scenarios)

#### 1. Empty State Verification
**Objective**: Verify all 3 widgets show empty states when no data exists

**Steps**:
1. Clear localStorage: Open http://localhost:5174 in new incognito window
2. Navigate to Dashboard (`/`)
3. Verify Recent Transactions shows empty state with "Add Transaction" button
4. Verify Upcoming Bills shows empty state with appropriate message
5. Verify Goal Progress shows empty state with "Create Goal" button

**Expected**:
- ✅ All 3 empty states display with correct icons (💸, 📅, 🎯)
- ✅ CTA buttons visible and styled correctly
- ✅ No console errors

#### 2. Transaction Widget Rendering
**Objective**: Verify Recent Transactions widget displays 5 most recent transactions

**Steps**:
1. Inject 10+ transactions with different dates using test data script
2. Navigate to Dashboard
3. Verify only 5 most recent transactions display
4. Verify transactions sorted by date descending (newest first)
5. Verify each transaction shows: date, description, amount, type icon

**Expected**:
- ✅ Only 5 transactions visible
- ✅ Newest transaction at top
- ✅ Income shows green +$amount, expenses show $amount
- ✅ Date formatted as "MMM d, yyyy" (e.g., "Oct 30, 2025")
- ✅ Icons: 💰 for income, 💳 for expenses

#### 3. Bills Widget with Urgency Badges
**Objective**: Verify Upcoming Bills widget shows correct urgency indicators

**Steps**:
1. Inject recurring transactions (2+ occurrences of same amount/description)
2. Set some bills due today, some in 1-3 days, some in 4-7 days
3. Navigate to Dashboard
4. Verify urgency badges display correctly

**Expected**:
- ✅ "Due Today" badge (red bg-red-100, text-red-800) for bills due today
- ✅ "Due in X days" badge (yellow bg-yellow-100, text-yellow-800) for bills due 1-3 days
- ✅ No badge for bills due 4-7 days
- ✅ Bills sorted by due date (soonest first)

#### 4. Goal Progress Widget Status Indicators
**Objective**: Verify progress bars show correct status (on-track, at-risk, completed)

**Steps**:
1. Inject 3 goals:
   - Goal A: 90% complete, target date 10 days away (on-track)
   - Goal B: 30% complete, target date 5 days away (at-risk)
   - Goal C: 100% complete (completed)
2. Navigate to Dashboard
3. Verify status indicators display correctly

**Expected**:
- ✅ On-track goal: green progress bar, "✅ On Track" label
- ✅ At-risk goal: yellow progress bar, "⚠️ At Risk" label
- ✅ Completed goal: green progress bar, "🎉 Goal Complete!" label
- ✅ Percentage displayed correctly (e.g., "90%")

#### 5. Keyboard Navigation Testing
**Objective**: Verify all widgets are fully keyboard accessible

**Steps**:
1. Navigate to Dashboard using only keyboard
2. Press Tab repeatedly, verify focus moves through:
   - Recent Transactions items
   - Upcoming Bills items
   - Goal Progress items
   - Empty state CTA buttons (if applicable)
3. Press Enter on focused item, verify navigation occurs
4. Press Space on focused item, verify navigation occurs

**Expected**:
- ✅ Tab moves focus through all interactive elements
- ✅ Focus indicator visible (2px blue ring)
- ✅ Enter key activates focused element
- ✅ Space key activates focused element (and doesn't scroll page)
- ✅ No keyboard traps (can Tab out of all widgets)

#### 6. Screen Reader Testing (NVDA/VoiceOver)
**Objective**: Verify WCAG 2.1 AA screen reader compliance

**Steps**:
1. Enable screen reader (NVDA on Windows or VoiceOver on Mac)
2. Navigate to Dashboard
3. Tab through Recent Transactions widget
4. Verify screen reader announces:
   - "View details for [transaction description]"
   - Transaction amount and date
5. Tab through Upcoming Bills widget
6. Verify urgency badges announced:
   - "Urgent: Bill due today"
   - "Warning: Bill due in X days"
7. Tab through Goal Progress widget
8. Verify progress bars announced:
   - "[Goal name]: X% complete"

**Expected**:
- ✅ All interactive elements have descriptive ARIA labels
- ✅ Urgency communicated via aria-label (not just color)
- ✅ Progress bars announce current percentage
- ✅ No unlabeled interactive elements

#### 7. Responsive Design Testing
**Objective**: Verify widgets responsive across 3 viewport sizes

**Test Viewports**:
- Mobile: 375px width (iPhone SE)
- Tablet: 768px width (iPad)
- Desktop: 1920px width (Full HD)

**Steps**:
1. Open Dashboard in Chrome DevTools Device Mode
2. Test each viewport size
3. Verify:
   - Text readable (minimum 16px body)
   - Touch targets large enough (44x44px minimum)
   - No horizontal scrolling
   - Widgets stack vertically on mobile
   - Spacing consistent (16-24px between items)

**Expected**:
- ✅ Mobile: Widgets stack vertically, full width
- ✅ Tablet: Widgets in 2-column grid (if space allows)
- ✅ Desktop: Widgets in 3-column grid
- ✅ All text readable at all sizes
- ✅ No layout shifts or broken styling

### Console Error Verification

**Steps**:
1. Open Chrome DevTools Console (F12)
2. Navigate to Dashboard
3. Interact with all widgets (click, hover, keyboard)
4. Check console for errors/warnings

**Expected**:
- ✅ No TypeScript errors (TS1484, TS2339, TS7006)
- ✅ No React warnings (key props, useEffect dependencies)
- ✅ No null reference errors
- ✅ No 404 errors for images/assets

### Color Contrast Verification

**Tool**: WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)

**Colors to Verify**:
- Heading (#111827 on #ffffff): Should be ≥4.5:1
- Body text (#6b7280 on #ffffff): Should be ≥4.5:1
- Red badge text (#991b1b on #fecaca): Should be ≥4.5:1
- Yellow badge text (#854d0e on #fef3c7): Should be ≥4.5:1
- Green status (#22c55e): Should be ≥3:1 against white

**Expected**:
- ✅ All text meets 4.5:1 minimum
- ✅ All UI components meet 3:1 minimum

### Build Verification

**Steps**:
1. Run production build: `npm run build`
2. Verify build succeeds with 0 errors
3. Check bundle size (should be <500KB for dashboard)

**Expected**:
- ✅ Build completes successfully
- ✅ No TypeScript errors
- ✅ No Vite warnings
- ✅ Bundle size reasonable

---

## Test Data Injection Script

**File**: `frontend/public/inject-test-data-chunk4.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Inject Test Data - Chunk 4</title>
</head>
<body>
    <h1>Injecting test data for Chunk 4...</h1>
    <p>You will be redirected to the dashboard in 2 seconds.</p>

    <script>
        localStorage.clear();

        // Inject categories
        localStorage.setItem('payplan_categories_v1', JSON.stringify({
          version: '1.0',
          categories: [
            { id: 'cat1', name: 'Groceries', iconName: 'shopping-cart', color: '#22c55e', isDefault: true, createdAt: '2025-10-01T00:00:00Z', updatedAt: '2025-10-01T00:00:00Z' },
            { id: 'cat2', name: 'Utilities', iconName: 'zap', color: '#eab308', isDefault: true, createdAt: '2025-10-01T00:00:00Z', updatedAt: '2025-10-01T00:00:00Z' },
            { id: 'cat3', name: 'Rent', iconName: 'home', color: '#dc2626', isDefault: true, createdAt: '2025-10-01T00:00:00Z', updatedAt: '2025-10-01T00:00:00Z' }
          ]
        }));

        // Inject 10 transactions (5 will show in Recent Transactions)
        const transactions = [];
        for (let i = 0; i < 10; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          transactions.push({
            id: `txn${i}`,
            amount: i % 2 === 0 ? 50.00 + i * 10 : -100.00 - i * 5, // Alternate income/expense
            description: i % 2 === 0 ? `Grocery Store ${i}` : `Salary Payment ${i}`,
            date: date.toISOString().slice(0, 10),
            categoryId: i % 3 === 0 ? 'cat1' : i % 3 === 1 ? 'cat2' : 'cat3',
            createdAt: date.toISOString()
          });
        }

        // Add recurring transactions for bills (2 occurrences each)
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Bill 1: Due today (recurring utility)
        transactions.push(
          { id: 'bill1a', amount: 100, description: 'Electric Bill', date: thirtyDaysAgo.toISOString().slice(0, 10), categoryId: 'cat2', createdAt: thirtyDaysAgo.toISOString() },
          { id: 'bill1b', amount: 100, description: 'Electric Bill', date: yesterday.toISOString().slice(0, 10), categoryId: 'cat2', createdAt: yesterday.toISOString() }
        );

        // Bill 2: Due in 2 days (recurring rent)
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const thirtyTwoDaysAgo = new Date(today);
        thirtyTwoDaysAgo.setDate(thirtyTwoDaysAgo.getDate() - 32);

        transactions.push(
          { id: 'bill2a', amount: 1500, description: 'Rent Payment', date: thirtyTwoDaysAgo.toISOString().slice(0, 10), categoryId: 'cat3', createdAt: thirtyTwoDaysAgo.toISOString() },
          { id: 'bill2b', amount: 1500, description: 'Rent Payment', date: twoDaysAgo.toISOString().slice(0, 10), categoryId: 'cat3', createdAt: twoDaysAgo.toISOString() }
        );

        localStorage.setItem('payplan_transactions_v1', JSON.stringify({
          version: '1.0',
          transactions
        }));

        // Inject 3 goals (on-track, at-risk, completed)
        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
        const fiveDaysFromNow = new Date(today);
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

        localStorage.setItem('payplan_goals_v1', JSON.stringify({
          version: '1.0',
          goals: [
            { id: 'goal1', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 900, targetDate: tenDaysFromNow.toISOString(), createdAt: '2025-10-01T00:00:00Z' },
            { id: 'goal2', name: 'Vacation', targetAmount: 2000, currentAmount: 600, targetDate: fiveDaysFromNow.toISOString(), createdAt: '2025-10-01T00:00:00Z' },
            { id: 'goal3', name: 'New Laptop', targetAmount: 1500, currentAmount: 1500, targetDate: null, createdAt: '2025-09-01T00:00:00Z' }
          ]
        }));

        // Redirect to dashboard
        setTimeout(() => window.location.href = '/', 2000);
    </script>
</body>
</html>
```

**Usage**: Open http://localhost:5174/inject-test-data-chunk4.html in browser

---

## Success Criteria Summary

Chunk 4 is DONE when:

### Functional Requirements
- ✅ All 14 tasks (T027-T040) completed
- ✅ Recent Transactions widget displays 5 most recent transactions
- ✅ Upcoming Bills widget displays bills with urgency badges (due today = red, due 1-3 days = yellow)
- ✅ Goal Progress widget displays progress bars with status indicators (on-track, at-risk, completed)
- ✅ All widgets integrated into Dashboard page (replace Widget 3, 4, 5 placeholders)
- ✅ Empty states display with CTAs for all 3 widgets

### Code Quality
- ✅ TypeScript strict mode: 0 errors on `npx tsc --noEmit`
- ✅ All widgets use React.memo for performance
- ✅ Type-only imports for external libraries
- ✅ Explicit return types on all functions
- ✅ Navigation uses `useNavigate()` hook (no console.log placeholders)

### Accessibility (WCAG 2.1 AA)
- ✅ Keyboard navigation works (Tab, Enter, Space keys)
- ✅ Focus indicators visible (2px blue ring)
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader announces urgency (not just color)
- ✅ Color contrast verified (4.5:1 text, 3:1 UI)

### Testing
- ✅ All 7 manual test scenarios pass
- ✅ No console errors or warnings
- ✅ Responsive design verified (mobile, tablet, desktop)
- ✅ `npm run build` succeeds with 0 errors

### Bot Review
- ✅ PR created and submitted for review
- ✅ Both bots approve (Claude Code Bot + CodeRabbit AI)
- ✅ All CRITICAL/HIGH issues fixed immediately
- ✅ MEDIUM/LOW issues deferred to Linear with proper tracking

---

**Next**: After Chunk 4 merges, proceed to Chunk 5 (Gamification Widget)

**References**:
- [tasks.md](../tasks.md) - Full task breakdown
- [CHUNKS-1-3-LESSONS-LEARNED.md](../CHUNKS-1-3-LESSONS-LEARNED.md) - Patterns from previous chunks
- [chunk-1-foundation.md](./chunk-1-foundation.md) - Foundation layer
- [chunk-2-spending.md](./chunk-2-spending.md) - Chart patterns
- [chunk-3-income.md](./chunk-3-income.md) - TypeScript strict mode patterns
