# Chunk 2: Spending Chart Widget

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk2-spending`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T016-T021 (6 tasks)
**Estimated Time**: 1 hour
**Dependencies**: Chunk 1 complete (T009-T015)

---

## Context Rehydration

### What You're Building

**Goal**: Implement the **Spending by Category pie chart widget** (User Story 1, P0).

**Key Files**:
- `frontend/src/components/dashboard/SpendingChart.tsx` - Recharts PieChart component
- `frontend/src/components/dashboard/SpendingChartWidget.tsx` - Widget wrapper with empty state

**What's Already Done**:
- ✅ Chunk 1: Data aggregation layer (`aggregateSpendingByCategory()`)
- ✅ Chunk 1: Custom hook (`useDashboardData()`)
- ✅ Types: `SpendingChartData` interface
- ✅ Zod schema: `SpendingChartDataSchema`

**Why This Chunk**:
User Story 1 is **P0** (highest priority). Visual spending breakdown is the core value proposition of the dashboard. Users need this to understand where their money goes.

---

### Spec Excerpt

**From spec.md - User Story 1**:
> As a user, I want to see a visual breakdown of my spending by category so I can quickly understand where my money goes.

**Acceptance Scenarios**:
1. Given I have transactions in multiple categories, When I view the dashboard, Then I see a pie chart showing spending breakdown by category
2. Given I have no transactions, When I view the dashboard, Then I see "No spending data yet" with CTA to add transactions
3. Given I hover over a segment, When I hover, Then I see category name, amount, and percentage
4. Given I use a screen reader, When I navigate to pie chart, Then I hear "Spending by category: Groceries $500 (50%), Dining $300 (30%)"

---

### Code Patterns

**Recharts PieChart Pattern**:
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={spendingChartData}
      dataKey="amount"
      nameKey="categoryName"
      cx="50%"
      cy="50%"
      outerRadius={80}
      label={(entry) => `${entry.percentage.toFixed(1)}%`}
    >
      {spendingChartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.categoryColor} />
      ))}
    </Pie>
    <Tooltip content={<CustomTooltip />} />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

**Accessibility Pattern (Hidden Table)**:
```typescript
// Provide screen reader alternative
<div className="sr-only" aria-label="Spending by category">
  <table>
    <caption>Spending breakdown by category</caption>
    <thead>
      <tr>
        <th>Category</th>
        <th>Amount</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      {spendingChartData.map((item) => (
        <tr key={item.categoryId}>
          <td>{item.categoryName}</td>
          <td>${item.amount.toFixed(2)}</td>
          <td>{item.percentage.toFixed(1)}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Git Workflow

```bash
# Create branch from feature branch
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk2-spending

# After implementation
git add .
git commit -m "feat(dashboard): implement spending chart widget (T016-T021)"
git push origin 062-dashboard-chunk2-spending

# Create PR
gh pr create --base 062-short-name-dashboard --title "feat(dashboard): Chunk 2 - Spending Chart Widget (T016-T021)" --body "See chunk-2-spending.md for details"
```

---

## Tasks Checklist

### T016: Create SpendingChart component with Recharts PieChart

**File**: `frontend/src/components/dashboard/SpendingChart.tsx`

**Success Criteria**:
- ✅ Uses Recharts `<PieChart>` with `<Pie>` and `<Cell>` components
- ✅ Each segment colored using `categoryColor` from data
- ✅ Labels show percentage (e.g., "42.5%")
- ✅ Responsive container (100% width, 300px height)
- ✅ No console errors or warnings

**Implementation**:
```typescript
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SpendingChartData } from '../../types/chart-data';

interface SpendingChartProps {
  data: SpendingChartData[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ data }) => {
  if (data.length === 0) {
    return null; // Let parent component handle empty state
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="categoryName"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(entry) => `${entry.percentage.toFixed(1)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.categoryColor} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

---

### T017: Add ARIA labels and hidden table for accessibility

**File**: `frontend/src/components/dashboard/SpendingChart.tsx` (update)

**Success Criteria**:
- ✅ Hidden `<table>` provides screen reader alternative
- ✅ Table has descriptive `<caption>`
- ✅ Table rows match chart data exactly
- ✅ Screen reader reads "Spending by category: Groceries $500 (50%), Dining $300 (30%)"
- ✅ `.sr-only` class hides table visually

**Implementation**:
```typescript
// Add to SpendingChart component
return (
  <>
    {/* Screen reader alternative */}
    <div className="sr-only" aria-label="Spending by category data table">
      <table>
        <caption>Spending breakdown by category for current month</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.categoryId}>
              <td>{item.categoryName}</td>
              <td>${item.amount.toFixed(2)}</td>
              <td>{item.percentage.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Visual chart */}
    <ResponsiveContainer width="100%" height={300}>
      {/* ... PieChart code ... */}
    </ResponsiveContainer>
  </>
);
```

---

### T018: Implement tooltip with category details

**File**: `frontend/src/components/dashboard/SpendingChart.tsx` (update)

**Success Criteria**:
- ✅ Custom tooltip shows category name, amount, percentage
- ✅ Tooltip formatted as currency ($X.XX)
- ✅ Tooltip styled for readability (white background, shadow)

**Implementation**:
```typescript
// Add custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SpendingChartData;
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{data.categoryName}</p>
        <p className="text-gray-700">${data.amount.toFixed(2)}</p>
        <p className="text-gray-600 text-sm">{data.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

// Update <Tooltip> in PieChart
<Tooltip content={<CustomTooltip />} />
```

---

### T019: Add empty state handling

**File**: `frontend/src/components/dashboard/SpendingChartWidget.tsx` (new file)

**Success Criteria**:
- ✅ Shows EmptyState component when no data
- ✅ Message: "No spending data yet"
- ✅ CTA button: "Add Transaction"
- ✅ Icon: 📊

**Implementation**:
```typescript
import React from 'react';
import { SpendingChart } from './SpendingChart';
import { EmptyState } from './EmptyState';
import type { SpendingChartData } from '../../types/chart-data';

interface SpendingChartWidgetProps {
  data: SpendingChartData[];
}

export const SpendingChartWidget: React.FC<SpendingChartWidgetProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Spending by Category</h2>
      {data.length === 0 ? (
        <EmptyState
          message="No spending data yet"
          action={{
            label: 'Add Transaction',
            onClick: () => {
              // TODO: Navigate to transaction entry page (Chunk 6)
              console.log('Navigate to transaction entry');
            },
          }}
          icon="📊"
        />
      ) : (
        <SpendingChart data={data} />
      )}
    </div>
  );
};
```

---

### T020: Wrap SpendingChart in React.memo for performance

**File**: `frontend/src/components/dashboard/SpendingChart.tsx` (update)

**Success Criteria**:
- ✅ Component wrapped in `React.memo`
- ✅ Prevents re-render when data unchanged
- ✅ React DevTools Profiler shows memo working

**Implementation**:
```typescript
// Update export
export const SpendingChart = React.memo<SpendingChartProps>(({ data }) => {
  // ... component code ...
});
```

---

### T021: Integrate SpendingChartWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Success Criteria**:
- ✅ Replace placeholder div with `<SpendingChartWidget>`
- ✅ Pass `spendingChartData` from hook
- ✅ Widget renders in responsive grid

**Implementation**:
```typescript
import { SpendingChartWidget } from '../components/dashboard/SpendingChartWidget';

// In Dashboard component, replace Widget 1 placeholder with:
<SpendingChartWidget data={spendingChartData} />
```

---

## Validation

### Manual Testing

1. **Test with data**: Add 3 categories, verify pie chart displays correctly
2. **Test percentages**: Verify sum of all percentages = 100%
3. **Test tooltip**: Hover over segments, verify tooltip shows correct data
4. **Test screen reader**: Use NVDA/VoiceOver, verify table is read
5. **Test empty state**: Clear transactions, verify "No spending data yet" displays
6. **Test responsive**: Resize browser, verify chart reflows

---

## Success Criteria Summary

Chunk 2 is DONE when:
- ✅ All 6 tasks (T016-T021) completed
- ✅ Pie chart displays spending breakdown correctly
- ✅ Tooltips show category details
- ✅ Screen reader reads hidden table
- ✅ Empty state displays when no data
- ✅ Widget integrated into Dashboard page
- ✅ PR created and bot reviews pass

---

**References**: [tasks.md](../tasks.md) | [spec.md](../spec.md) | [chunk-1-foundation.md](./chunk-1-foundation.md)
