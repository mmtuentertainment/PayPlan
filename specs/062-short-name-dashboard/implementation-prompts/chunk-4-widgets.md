# Chunk 4: P1 Widgets (Transactions, Bills, Goals)

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk4-widgets`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T027-T040 (14 tasks)
**Estimated Time**: 2-3 hours
**Dependencies**: Chunk 1 complete (T009-T015)

---

## Context Rehydration

### What You're Building

**Goal**: Implement 3 P1 (priority 1) widgets:
1. **Recent Transactions Widget** (User Story 3, P1)
2. **Upcoming Bills Widget** (User Story 4, P1)
3. **Goal Progress Widget** (User Story 5, P1)

**Key Files**:
- `frontend/src/components/dashboard/RecentTransactionsWidget.tsx`
- `frontend/src/components/dashboard/UpcomingBillsWidget.tsx`
- `frontend/src/components/dashboard/GoalProgressWidget.tsx`

**What's Already Done**:
- ✅ Chunk 1: Data aggregation (`getRecentTransactions()`, `getUpcomingBills()`, `getGoalProgress()`)
- ✅ Types: `Transaction`, `UpcomingBill`, `GoalProgress` interfaces
- ✅ Zod schemas for all data types

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

## Validation

### Manual Testing

1. **Test Recent Transactions**: Add 10 transactions, verify only 5 most recent show
2. **Test Upcoming Bills**: Add recurring transactions, verify bills show with correct urgency badges
3. **Test Goal Progress**: Create 3 goals with different progress levels, verify bars and status indicators
4. **Test Empty States**: Clear all data, verify empty states display
5. **Test Keyboard Navigation**: Tab through widgets, verify focus and Enter/Space activation
6. **Test Screen Reader**: Verify ARIA labels announced correctly

---

## Success Criteria Summary

Chunk 4 is DONE when:
- ✅ All 14 tasks (T027-T040) completed
- ✅ Recent Transactions widget displays 5 transactions
- ✅ Upcoming Bills widget displays bills with urgency badges
- ✅ Goal Progress widget displays progress bars with status indicators
- ✅ All widgets integrated into Dashboard page
- ✅ Empty states display correctly
- ✅ PR created and bot reviews pass

---

**References**: [tasks.md](../tasks.md) | [spec.md](../spec.md) | [chunk-1-foundation.md](./chunk-1-foundation.md)
