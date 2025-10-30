# Chunk 3: Income vs Expenses Chart Widget

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk3-income`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T022-T026 (5 tasks)
**Estimated Time**: 1 hour
**Dependencies**: Chunk 1 complete (T009-T015)

---

## Context Rehydration

### What You're Building

**Goal**: Implement the **Income vs Expenses bar chart widget** (User Story 2, P0).

**Key Files**:
- `frontend/src/components/dashboard/IncomeExpensesChart.tsx` - Recharts BarChart component
- `frontend/src/components/dashboard/IncomeExpensesChartWidget.tsx` - Widget wrapper with surplus/deficit indicator

**What's Already Done**:
- ✅ Chunk 1: Data aggregation layer (`aggregateIncomeExpenses()`)
- ✅ Types: `IncomeExpensesChartData`, `MonthData` interfaces
- ✅ Zod schema: `IncomeExpensesChartDataSchema`

**Why This Chunk**:
User Story 2 is **P0**. Income vs expenses is the fundamental metric for financial health. Users need this comparison to understand cash flow.

---

### Spec Excerpt

**From spec.md - User Story 2**:
> As a user, I want to see my monthly income compared to my expenses so I can track whether I'm living within my means.

**Acceptance Scenarios**:
1. Given I have income and expense transactions, When I view the dashboard, Then I see a bar chart comparing income vs. expenses for the current month
2. Given I have more expenses than income, When I view the chart, Then I see expenses in red with a deficit amount displayed
3. Given I have more income than expenses, When I view the chart, Then I see income in green with a surplus amount displayed

---

### Code Patterns

**Recharts BarChart Pattern**:
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={incomeExpensesData.months}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="income" fill="#10b981" name="Income" />
    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
  </BarChart>
</ResponsiveContainer>
```

---

## Git Workflow

```bash
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk3-income

# After implementation
git add .
git commit -m "feat(dashboard): implement income vs expenses chart (T022-T026)"
git push origin 062-dashboard-chunk3-income

# Create PR
gh pr create --base 062-short-name-dashboard --title "feat(dashboard): Chunk 3 - Income vs Expenses Chart (T022-T026)"
```

---

## Tasks Checklist

### T022: Create IncomeExpensesChart component with Recharts BarChart [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/IncomeExpensesChart.tsx`

**Success Criteria**:
- ✅ Uses Recharts `<BarChart>` with 2 bars (income, expenses)
- ✅ Income bar: green (#10b981)
- ✅ Expenses bar: red (#ef4444)
- ✅ X-axis: Month labels ("Jan", "Feb", etc.)
- ✅ Y-axis: Currency values (auto-scaled)
- ✅ Responsive container (100% width, 300px height)

**Implementation**:
```typescript
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { IncomeExpensesChartData } from '../../types/chart-data';

interface IncomeExpensesChartProps {
  data: IncomeExpensesChartData;
}

export const IncomeExpensesChart: React.FC<IncomeExpensesChartProps> = ({ data }) => {
  if (data.months.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.months}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        <Legend />
        <Bar dataKey="income" fill="#10b981" name="Income" />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
};
```

---

### T023: Add ARIA labels and hidden table for accessibility

**File**: `frontend/src/components/dashboard/IncomeExpensesChart.tsx` (update)

**Success Criteria**:
- ✅ Hidden `<table>` with income/expenses data
- ✅ Screen reader reads "Monthly income vs expenses: Income $3,000, Expenses $2,500, Surplus $500"

**Implementation**:
```typescript
return (
  <>
    <div className="sr-only" aria-label="Monthly income vs expenses data table">
      <table>
        <caption>Income vs expenses for last 6 months</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {data.months.map((month) => (
            <tr key={month.month}>
              <td>{month.month}</td>
              <td>${month.income.toFixed(2)}</td>
              <td>${month.expenses.toFixed(2)}</td>
              <td>${month.net.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      {/* ... BarChart ... */}
    </ResponsiveContainer>
  </>
);
```

---

### T024: Implement color-coded bars with 3:1 contrast

**File**: `frontend/src/components/dashboard/IncomeExpensesChart.tsx` (update)

**Success Criteria**:
- ✅ Income bar: green (#10b981) - WCAG AA compliant
- ✅ Expenses bar: red (#ef4444) - WCAG AA compliant
- ✅ Color contrast ratio >= 3:1

**Note**: Colors already set in T022, verify with WebAIM Contrast Checker.

---

### T025: Add surplus/deficit indicator text above chart

**File**: `frontend/src/components/dashboard/IncomeExpensesChartWidget.tsx` (new file)

**Success Criteria**:
- ✅ Shows current month net income
- ✅ Green text for surplus (+$X)
- ✅ Red text for deficit (-$X)
- ✅ Gray text for break-even ($0)

**Implementation**:
```typescript
import React from 'react';
import { IncomeExpensesChart } from './IncomeExpensesChart';
import { EmptyState } from './EmptyState';
import type { IncomeExpensesChartData } from '../../types/chart-data';

interface IncomeExpensesChartWidgetProps {
  data: IncomeExpensesChartData;
}

export const IncomeExpensesChartWidget: React.FC<IncomeExpensesChartWidgetProps> = ({ data }) => {
  const currentMonth = data.months[data.months.length - 1];
  const netIncome = currentMonth?.net || 0;

  const getNetIncomeColor = () => {
    if (netIncome > 0) return 'text-green-600';
    if (netIncome < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getNetIncomeText = () => {
    if (netIncome > 0) return `+$${netIncome.toFixed(2)} Surplus`;
    if (netIncome < 0) return `-$${Math.abs(netIncome).toFixed(2)} Deficit`;
    return 'Break Even';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Income vs. Expenses</h2>
      {data.months.length === 0 ? (
        <EmptyState
          message="No income or expense data yet"
          action={{
            label: 'Add Transaction',
            onClick: () => console.log('Navigate to transaction entry'),
          }}
          icon="📊"
        />
      ) : (
        <>
          <p className={`text-lg font-semibold mb-4 ${getNetIncomeColor()}`}>
            {getNetIncomeText()}
          </p>
          <IncomeExpensesChart data={data} />
        </>
      )}
    </div>
  );
};
```

---

### T026: Integrate IncomeExpensesChartWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Success Criteria**:
- ✅ Replace Widget 2 placeholder with `<IncomeExpensesChartWidget>`
- ✅ Pass `incomeExpensesData` from hook

**Implementation**:
```typescript
import { IncomeExpensesChartWidget } from '../components/dashboard/IncomeExpensesChartWidget';

// Replace Widget 2 placeholder
<IncomeExpensesChartWidget data={incomeExpensesData} />
```

---

## Validation

### Manual Testing

1. **Test with data**: Add income and expenses, verify bars display correctly
2. **Test surplus**: Verify green text when income > expenses
3. **Test deficit**: Verify red text when expenses > income
4. **Test screen reader**: Verify hidden table is read
5. **Test empty state**: Clear transactions, verify "No income or expense data yet"

---

## Success Criteria Summary

Chunk 3 is DONE when:
- ✅ All 5 tasks (T022-T026) completed
- ✅ Bar chart displays last 6 months of income vs expenses
- ✅ Surplus/deficit indicator shows correct value and color
- ✅ Screen reader reads hidden table
- ✅ Empty state displays when no data
- ✅ Widget integrated into Dashboard page
- ✅ PR created and bot reviews pass

---

**References**: [tasks.md](../tasks.md) | [spec.md](../spec.md) | [chunk-1-foundation.md](./chunk-1-foundation.md)
