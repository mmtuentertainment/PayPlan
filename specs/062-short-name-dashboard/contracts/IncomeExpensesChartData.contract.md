# Contract: IncomeExpensesChartData

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Widget**: Income vs. Expenses (Bar Chart)  
**Created**: 2025-10-29

---

## Purpose

Defines the data contract for the **Income vs. Expenses** widget (bar chart). This contract ensures consistency between the data aggregation layer and the chart component.

---

## TypeScript Interfaces

```typescript
interface IncomeExpensesChartData {
  months: MonthData[];
  maxValue: number;
}

interface MonthData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}
```

---

## Field Specifications

### `months: MonthData[]`

- **Type**: Array of MonthData objects
- **Required**: Yes
- **Constraints**:
  - Min length: 1 month
  - Max length: 12 months (1 year)
  - Default: Last 6 months
- **Order**: Chronological (oldest to newest)
- **Example**: See "Example Data" section below

### `maxValue: number`

- **Type**: Number (float)
- **Required**: Yes
- **Purpose**: Y-axis scaling for the bar chart
- **Calculation**: `Math.max(...months.map(m => Math.max(m.income, m.expenses)))`
- **Constraints**: Must be positive (> 0)
- **Example**: `1500.00` (if max income/expenses is $1,500)

---

## MonthData Field Specifications

### `month: string`

- **Type**: String (3-character month abbreviation)
- **Required**: Yes
- **Format**: `"Jan"`, `"Feb"`, `"Mar"`, `"Apr"`, `"May"`, `"Jun"`, `"Jul"`, `"Aug"`, `"Sep"`, `"Oct"`, `"Nov"`, `"Dec"`
- **Example**: `"Oct"`
- **Constraints**: Must be one of the 12 valid month abbreviations

### `income: number`

- **Type**: Number (float)
- **Required**: Yes
- **Constraints**:
  - Must be non-negative (>= 0)
  - Precision: 2 decimal places
- **Unit**: US Dollars (USD)
- **Example**: `2500.00`
- **Special Cases**:
  - If no income transactions: `income = 0`

### `expenses: number`

- **Type**: Number (float)
- **Required**: Yes
- **Constraints**:
  - Must be non-negative (>= 0)
  - Precision: 2 decimal places
- **Unit**: US Dollars (USD)
- **Calculation**: Sum of `Math.abs(transaction.amount)` for all expense transactions
- **Example**: `1800.00`
- **Special Cases**:
  - If no expense transactions: `expenses = 0`

### `net: number`

- **Type**: Number (float)
- **Required**: Yes
- **Calculation**: `income - expenses`
- **Constraints**:
  - Can be negative (deficit) or positive (surplus)
  - Precision: 2 decimal places
- **Unit**: US Dollars (USD)
- **Example**: `700.00` (surplus) or `-200.00` (deficit)

---

## Example Data

### Valid Data (Last 6 Months)

```json
{
  "months": [
    {
      "month": "May",
      "income": 2500.00,
      "expenses": 1800.00,
      "net": 700.00
    },
    {
      "month": "Jun",
      "income": 2500.00,
      "expenses": 2100.00,
      "net": 400.00
    },
    {
      "month": "Jul",
      "income": 3000.00,
      "expenses": 2200.00,
      "net": 800.00
    },
    {
      "month": "Aug",
      "income": 2500.00,
      "expenses": 2400.00,
      "net": 100.00
    },
    {
      "month": "Sep",
      "income": 2500.00,
      "expenses": 2600.00,
      "net": -100.00
    },
    {
      "month": "Oct",
      "income": 2500.00,
      "expenses": 1900.00,
      "net": 600.00
    }
  ],
  "maxValue": 3000.00
}
```

### Empty State (No Transactions)

```json
{
  "months": [
    {
      "month": "Oct",
      "income": 0,
      "expenses": 0,
      "net": 0
    }
  ],
  "maxValue": 100
}
```

**Note**: When no transactions exist, show current month only with zeros, and set `maxValue = 100` to avoid divide-by-zero errors.

---

## Validation Rules

### Zod Schemas

```typescript
import { z } from 'zod';

export const MonthDataSchema = z.object({
  month: z.enum(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']),
  income: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
  net: z.number(),
});

export type MonthData = z.infer<typeof MonthDataSchema>;

export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(),
});

export type IncomeExpensesChartData = z.infer<typeof IncomeExpensesChartDataSchema>;
```

### Constraints

1. **Net Calculation**: `net` MUST equal `income - expenses` (exact match)
2. **MaxValue Calculation**: `maxValue` MUST be >= max(`income`, `expenses`) across all months
3. **Chronological Order**: Months MUST be in chronological order (oldest to newest)
4. **No Duplicates**: No duplicate month names in the array

---

## Data Source

### localStorage Keys

- **Transactions**: `payplan_transactions_v1`

### Aggregation Logic

```typescript
function aggregateIncomeExpenses(
  transactions: Transaction[],
  monthCount: number = 6
): IncomeExpensesChartData {
  const months: MonthData[] = [];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = monthCount - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - i);
    const targetMonth = targetDate.toISOString().slice(0, 7); // "2025-10"
    
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

---

## Chart Component Usage

### Recharts Integration

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IncomeExpensesChartData } from '@/types/chart-data';

interface IncomeExpensesChartProps {
  data: IncomeExpensesChartData;
}

export function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  if (data.months.length === 0) {
    return <EmptyState message="No income or expense data available" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.months} aria-label="Income vs. expenses by month">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[0, data.maxValue]} />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Legend />
        <Bar dataKey="income" fill="#10b981" name="Income" />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## Accessibility Requirements

1. **ARIA Label**: Chart container MUST have `aria-label="Income vs. expenses by month"`
2. **Data Table Alternative**: Provide hidden `<table>` with income/expenses for each month
3. **Color Contrast**: 
   - Income bar: Green (#10b981 from Tailwind green-500) - 3:1 contrast
   - Expenses bar: Red (#ef4444 from Tailwind red-500) - 3:1 contrast
4. **Keyboard Navigation**: Chart MUST be navigable with Tab/Arrow keys
5. **Tooltip**: MUST have `role="tooltip"` and `aria-live="polite"`

### Accessible Table Alternative

```tsx
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
```

---

## Performance Considerations

1. **Memoization**: Wrap aggregation function in `useMemo`
2. **Max Months**: Default to 6 months, allow up to 12 months
3. **Rendering Time**: MUST render in <500ms for 10,000 transactions

---

## Error Handling

### Empty State

**Condition**: `data.months.length === 0` or all values are 0  
**UI**: Show empty state message: "No income or expense data available"  
**Action**: Display CTA button: "Add Transaction"

### Invalid Data

**Condition**: Zod validation fails  
**Behavior**: Log error to console, show fallback empty state with current month only

---

## Visual Design

### Color Palette

- **Income**: `#10b981` (green-500 from Tailwind)
- **Expenses**: `#ef4444` (red-500 from Tailwind)
- **Net (if displayed separately)**: `#3b82f6` (blue-500 from Tailwind)

### Bar Spacing

- **Bar width**: Auto-calculated by Recharts based on container width
- **Bar gap**: 10px between income and expenses bars
- **Category gap**: 20px between month groups

---

## Version History

- **v1.0** (2025-10-29): Initial contract definition

---

**Contract Status**: ✓ Approved  
**Dependencies**: [data-model.md](../data-model.md), Transactions feature
