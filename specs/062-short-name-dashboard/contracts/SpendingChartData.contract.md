# Contract: SpendingChartData

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Widget**: Spending Breakdown (Pie Chart)  
**Created**: 2025-10-29

---

## Purpose

Defines the data contract for the **Spending Breakdown by Category** widget (pie chart). This contract ensures consistency between the data aggregation layer and the chart component.

---

## TypeScript Interface

```typescript
interface SpendingChartData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
```

---

## Field Specifications

### `categoryId: string`

- **Type**: UUID string
- **Required**: Yes
- **Format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID v4)
- **Example**: `"550e8400-e29b-41d4-a716-446655440000"`
- **Special Cases**: 
  - Use `"uncategorized"` for transactions without `categoryId`

### `categoryName: string`

- **Type**: String
- **Required**: Yes
- **Constraints**: 
  - Min length: 1 character
  - Max length: 50 characters
- **Example**: `"Groceries"`
- **Special Cases**:
  - Use `"Uncategorized"` for transactions without `categoryId`

### `categoryIcon: string`

- **Type**: String (lucide-react icon name)
- **Required**: Yes
- **Format**: kebab-case icon name (e.g., `"shopping-cart"`, `"home"`, `"car"`)
- **Example**: `"shopping-cart"`
- **Special Cases**:
  - Use `"help-circle"` for uncategorized transactions
- **Icon List**: [Lucide Icons](https://lucide.dev/icons/)

### `categoryColor: string`

- **Type**: Hex color string
- **Required**: Yes
- **Format**: `#RRGGBB` (6-digit hex)
- **Example**: `"#10b981"` (green-500 from Tailwind)
- **Constraints**:
  - Must meet WCAG 2.1 AA contrast ratio (3:1 against white background)
- **Special Cases**:
  - Use `"#6b7280"` (gray-500) for uncategorized transactions

### `amount: number`

- **Type**: Number (float)
- **Required**: Yes
- **Constraints**:
  - Must be non-negative (>= 0)
  - Precision: 2 decimal places (e.g., `25.50`)
- **Unit**: US Dollars (USD)
- **Example**: `125.50`
- **Special Cases**:
  - Empty state: All amounts = 0

### `percentage: number`

- **Type**: Number (float)
- **Required**: Yes
- **Constraints**:
  - Range: 0-100
  - Precision: 1 decimal place (e.g., `33.3`)
- **Calculation**: `(amount / totalSpending) * 100`
- **Example**: `33.3`
- **Special Cases**:
  - If `totalSpending === 0`, set `percentage = 0` for all categories

---

## Example Data

### Valid Data (Multiple Categories)

```json
[
  {
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryName": "Groceries",
    "categoryIcon": "shopping-cart",
    "categoryColor": "#10b981",
    "amount": 250.75,
    "percentage": 41.8
  },
  {
    "categoryId": "660e8400-e29b-41d4-a716-446655440001",
    "categoryName": "Transportation",
    "categoryIcon": "car",
    "categoryColor": "#3b82f6",
    "amount": 150.00,
    "percentage": 25.0
  },
  {
    "categoryId": "uncategorized",
    "categoryName": "Uncategorized",
    "categoryIcon": "help-circle",
    "categoryColor": "#6b7280",
    "amount": 200.00,
    "percentage": 33.3
  }
]
```

### Empty State (No Transactions)

```json
[]
```

### Single Category

```json
[
  {
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryName": "Groceries",
    "categoryIcon": "shopping-cart",
    "categoryColor": "#10b981",
    "amount": 500.00,
    "percentage": 100.0
  }
]
```

---

## Validation Rules

### Zod Schema

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

export type SpendingChartData = z.infer<typeof SpendingChartDataSchema>;
```

### Constraints

1. **Percentage Sum**: The sum of all `percentage` values SHOULD equal 100.0 (within 0.1% tolerance)
2. **Amount Sum**: The sum of all `amount` values MUST equal the total spending for the period
3. **Unique Categories**: No duplicate `categoryId` values in the array
4. **Non-Empty Names**: `categoryName` MUST NOT be an empty string

---

## Data Source

### localStorage Keys

- **Categories**: `payplan_categories_v1`
- **Transactions**: `payplan_transactions_v1`

### Aggregation Logic

```typescript
function aggregateSpendingByCategory(
  transactions: Transaction[],
  categories: Category[]
): SpendingChartData[] {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
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
```

---

## Chart Component Usage

### Recharts Integration

```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SpendingChartData } from '@/types/chart-data';

interface SpendingChartProps {
  data: SpendingChartData[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  if (data.length === 0) {
    return <EmptyState message="No spending data for this month" />;
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart aria-label="Spending breakdown by category">
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
  );
}
```

---

## Accessibility Requirements

1. **ARIA Label**: Chart container MUST have `aria-label="Spending breakdown by category"`
2. **Data Table Alternative**: Provide hidden `<table>` with same data for screen readers
3. **Color Contrast**: All `categoryColor` values MUST meet 3:1 contrast ratio against white
4. **Keyboard Navigation**: Chart MUST be navigable with Tab/Arrow keys (built-in Recharts 3.0+)
5. **Tooltip**: MUST have `role="tooltip"` and `aria-live="polite"`

---

## Performance Considerations

1. **Memoization**: Wrap aggregation function in `useMemo`
2. **Max Categories**: Limit to 10 categories (merge others into "Other" if exceeded)
3. **Rendering Time**: MUST render in <500ms for 1,000 transactions

---

## Error Handling

### Empty State

**Condition**: `data.length === 0`  
**UI**: Show empty state message: "No spending data for this month"  
**Action**: Display CTA button: "Add Transaction"

### Invalid Data

**Condition**: Zod validation fails  
**Behavior**: Log error to console, show fallback empty state

---

## Version History

- **v1.0** (2025-10-29): Initial contract definition

---

**Contract Status**: ✓ Approved  
**Dependencies**: [data-model.md](../data-model.md), Feature 061 (Categories)
