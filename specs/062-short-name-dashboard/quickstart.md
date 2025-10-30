# Quickstart Guide: Dashboard with Charts

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Created**: 2025-10-29  
**Target Audience**: Developers implementing the dashboard feature

---

## Prerequisites

Before implementing this feature, ensure you have:

1. ✅ **Feature 061 completed**: Spending Categories & Budgets must be implemented
2. ✅ **Transactions feature**: Manual transaction entry must exist
3. ✅ **localStorage schema**: Ensure `payplan_transactions_v1` and `payplan_categories_v1` keys exist
4. ✅ **Development environment**: Node.js 18+, npm/pnpm, React 19

---

## Installation

### 1. Install Dependencies

All required dependencies are already installed in the project:

```bash
cd frontend
npm install
```

**Existing dependencies** (from constitution):
- `recharts` (2.15.0) - Chart library
- `zod` (4.1.11) - Validation
- `uuid` (13.0.0) - ID generation
- `lucide-react` - Icons
- `tailwindcss` (4.1.13) - Styling

No new dependencies required for Phase 1.

---

## Project Structure

Create the following file structure in `frontend/src/`:

```text
frontend/src/
├── types/
│   ├── dashboard.ts           # DashboardWidget types
│   ├── chart-data.ts          # Chart data interfaces
│   └── gamification.ts        # Gamification types
├── lib/
│   └── dashboard/
│       ├── schemas.ts         # Zod validation schemas
│       ├── aggregation.ts     # Data aggregation functions
│       └── storage.ts         # localStorage utilities
├── hooks/
│   └── useDashboardData.ts    # Custom hook for dashboard data
├── components/
│   └── dashboard/
│       ├── DashboardPage.tsx              # Main dashboard page
│       ├── SpendingChart.tsx              # Pie chart widget
│       ├── IncomeExpensesChart.tsx        # Bar chart widget
│       ├── RecentTransactionsWidget.tsx   # Transaction list widget
│       ├── UpcomingBillsWidget.tsx        # Bills widget
│       ├── GoalProgressWidget.tsx         # Goals widget
│       ├── GamificationWidget.tsx         # Gamification widget
│       └── EmptyState.tsx                 # Empty state component
└── pages/
    └── Dashboard.tsx          # Dashboard route page
```

---

## Step-by-Step Implementation

### Step 1: Create TypeScript Types

Create types for dashboard widgets and chart data.

**File**: `frontend/src/types/chart-data.ts`

```typescript
/**
 * Spending breakdown data (Pie Chart)
 */
export interface SpendingChartData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

/**
 * Income vs. Expenses data (Bar Chart)
 */
export interface IncomeExpensesChartData {
  months: MonthData[];
  maxValue: number;
}

export interface MonthData {
  month: string; // "Jan", "Feb", etc.
  income: number;
  expenses: number;
  net: number;
}
```

**See**: [data-model.md](./data-model.md) for complete type definitions.

---

### Step 2: Create Zod Schemas

Create validation schemas for chart data.

**File**: `frontend/src/lib/dashboard/schemas.ts`

```typescript
import { z } from 'zod';

export const SpendingChartDataSchema = z.object({
  categoryId: z.string().uuid().or(z.literal('uncategorized')),
  categoryName: z.string().min(1).max(50),
  categoryIcon: z.string().min(1),
  categoryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const MonthDataSchema = z.object({
  month: z.enum(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']),
  income: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
  net: z.number(),
});

export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(),
});
```

**See**: [SpendingChartData.contract.md](./contracts/SpendingChartData.contract.md) for validation rules.

---

### Step 3: Implement Data Aggregation

Create functions to aggregate data from localStorage.

**File**: `frontend/src/lib/dashboard/aggregation.ts`

```typescript
import { Transaction, Category } from '@/types';
import { SpendingChartData, IncomeExpensesChartData, MonthData } from '@/types/chart-data';

/**
 * Aggregate spending by category for current month
 */
export function aggregateSpendingByCategory(
  transactions: Transaction[],
  categories: Category[]
): SpendingChartData[] {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
  
  const expensesThisMonth = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
  );
  
  const totalSpending = expensesThisMonth.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
  
  const spendingByCategory = expensesThisMonth.reduce((acc, t) => {
    const categoryId = t.categoryId || 'uncategorized';
    acc[categoryId] = (acc[categoryId] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(spendingByCategory).map(([categoryId, amount]) => {
    const category = categories.find((c) => c.id === categoryId) || {
      id: 'uncategorized',
      name: 'Uncategorized',
      iconName: 'help-circle',
      color: '#6b7280',
    };
    
    return {
      categoryId,
      categoryName: category.name,
      categoryIcon: category.iconName,
      categoryColor: category.color,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
    };
  });
}

/**
 * Aggregate income vs. expenses for last N months
 */
export function aggregateIncomeExpenses(
  transactions: Transaction[],
  monthCount: number = 6
): IncomeExpensesChartData {
  const months: MonthData[] = [];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - i);
    const targetMonth = targetDate.toISOString().slice(0, 7);
    
    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(targetMonth)
    );
    
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    months.push({
      month: monthLabels[targetDate.getMonth()],
      income,
      expenses,
      net: income - expenses,
    });
  }
  
  const maxValue = Math.max(
    100, // Min value to avoid divide-by-zero
    ...months.map((m) => Math.max(m.income, m.expenses))
  );
  
  return { months, maxValue };
}
```

**See**: [data-model.md](./data-model.md) Section 4 for complete aggregation logic.

---

### Step 4: Create Custom Hook

Create a custom hook to load and aggregate dashboard data.

**File**: `frontend/src/hooks/useDashboardData.ts`

```typescript
import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { aggregateSpendingByCategory, aggregateIncomeExpenses } from '@/lib/dashboard/aggregation';
import { Transaction, Category } from '@/types';

export function useDashboardData() {
  const [categories] = useLocalStorage<Category[]>('payplan_categories_v1', []);
  const [transactions] = useLocalStorage<Transaction[]>('payplan_transactions_v1', []);
  
  const spendingChartData = useMemo(
    () => aggregateSpendingByCategory(transactions, categories),
    [transactions, categories]
  );
  
  const incomeExpensesData = useMemo(
    () => aggregateIncomeExpenses(transactions, 6),
    [transactions]
  );
  
  const recentTransactions = useMemo(
    () => [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [transactions]
  );
  
  return {
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    isLoading: false,
  };
}
```

**Performance**: All aggregations are memoized with `useMemo` to prevent recalculation on every render.

---

### Step 5: Create Chart Components

#### Spending Chart (Pie Chart)

**File**: `frontend/src/components/dashboard/SpendingChart.tsx`

```tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SpendingChartData } from '@/types/chart-data';
import { EmptyState } from './EmptyState';

interface SpendingChartProps {
  data: SpendingChartData[];
}

export const SpendingChart = React.memo(({ data }: SpendingChartProps) => {
  if (data.length === 0) {
    return <EmptyState message="No spending data for this month" />;
  }
  
  return (
    <div role="region" aria-label="Spending breakdown by category">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart aria-label="Pie chart showing spending by category">
          <Pie
            data={data}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => `${entry.categoryName} (${entry.percentage.toFixed(1)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.categoryColor} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Hidden table alternative for screen readers */}
      <table className="sr-only" aria-label="Spending data">
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
  );
});

SpendingChart.displayName = 'SpendingChart';
```

**Accessibility**: Includes ARIA labels and hidden table alternative for screen readers.

#### Income vs. Expenses Chart (Bar Chart)

**File**: `frontend/src/components/dashboard/IncomeExpensesChart.tsx`

```tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IncomeExpensesChartData } from '@/types/chart-data';
import { EmptyState } from './EmptyState';

interface IncomeExpensesChartProps {
  data: IncomeExpensesChartData;
}

export const IncomeExpensesChart = React.memo(({ data }: IncomeExpensesChartProps) => {
  if (data.months.length === 0) {
    return <EmptyState message="No income or expense data available" />;
  }
  
  return (
    <div role="region" aria-label="Income vs. expenses by month">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.months} aria-label="Bar chart showing income vs. expenses">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, data.maxValue]} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Hidden table alternative for screen readers */}
      <table className="sr-only" aria-label="Income vs. expenses data">
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
  );
});

IncomeExpensesChart.displayName = 'IncomeExpensesChart';
```

---

### Step 6: Create Dashboard Page

**File**: `frontend/src/pages/Dashboard.tsx`

```tsx
import { useDashboardData } from '@/hooks/useDashboardData';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { IncomeExpensesChart } from '@/components/dashboard/IncomeExpensesChart';

export function DashboardPage() {
  const { spendingChartData, incomeExpensesData, isLoading } = useDashboardData();
  
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Spending Breakdown</h2>
          <SpendingChart data={spendingChartData} />
        </div>
        
        {/* Income vs. Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Income vs. Expenses</h2>
          <IncomeExpensesChart data={incomeExpensesData} />
        </div>
      </div>
    </div>
  );
}
```

---

### Step 7: Add Route

**File**: `frontend/src/App.tsx` (or routing file)

```tsx
import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '@/pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      {/* Other routes */}
    </Routes>
  );
}
```

---

## Testing (Phase 1: Manual)

### Test Checklist

1. **Empty State**:
   - Clear localStorage
   - Navigate to dashboard
   - ✅ Should show empty state messages

2. **Single Category**:
   - Add 1 transaction with 1 category
   - ✅ Pie chart should show 100% for that category

3. **Multiple Categories**:
   - Add 5 transactions across 3 categories
   - ✅ Pie chart should split correctly
   - ✅ Percentages should sum to 100%

4. **Income vs. Expenses**:
   - Add income and expense transactions
   - ✅ Bar chart should show correct values
   - ✅ Last 6 months should be displayed

5. **Accessibility**:
   - Test with keyboard navigation (Tab, Arrow keys)
   - ✅ All charts should be focusable
   - Test with screen reader (NVDA/VoiceOver)
   - ✅ Screen reader should read chart data from hidden tables

6. **Performance**:
   - Add 1,000 transactions
   - ✅ Dashboard should load in <1 second
   - ✅ Charts should render in <500ms

---

## Troubleshooting

### Chart Not Rendering

**Problem**: Chart shows blank white space  
**Solution**: Check browser console for errors. Ensure `recharts` is installed: `npm install recharts@2.15.0`

### Data Not Showing

**Problem**: Empty state shows even with transactions  
**Solution**: 
1. Check localStorage keys: `localStorage.getItem('payplan_transactions_v1')`
2. Verify transaction dates are in correct format (ISO 8601)
3. Check `type` field is `"expense"` or `"income"`

### Performance Issues

**Problem**: Dashboard loads slowly  
**Solution**:
1. Verify `useMemo` is used in aggregation functions
2. Check transaction count: `transactions.length`
3. If >10,000 transactions, consider pagination (defer to Phase 2)

---

## Next Steps

After implementing the basic dashboard:

1. **Add remaining widgets** (Recent Transactions, Upcoming Bills, Goal Progress)
2. **Add gamification** (Streaks, Insights, Recent Wins)
3. **Test accessibility** with NVDA/VoiceOver
4. **Create PR** and wait for bot reviews
5. **Iterate** on bot feedback until both bots are green

---

## Resources

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [data-model.md](./data-model.md) - Data model and TypeScript types
- [research.md](./research.md) - Research findings
- [Recharts Documentation](https://recharts.org/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Quickstart Status**: ✓ Complete  
**Ready for**: Implementation (`/speckit.implement`)
