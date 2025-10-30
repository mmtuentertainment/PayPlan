# Data Model: Dashboard with Charts

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Created**: 2025-10-29  
**Phase**: 1 (Design)

---

## Overview

This document defines the TypeScript types, Zod schemas, and localStorage structure for the Dashboard with Charts feature. The dashboard aggregates data from existing localStorage keys (`payplan_categories_v1`, `payplan_budgets_v1`, `payplan_transactions_v1`, `payplan_goals_v1`) and does **NOT write** to localStorage (read-only).

---

## TypeScript Types

### 1. Dashboard Widget Types

```typescript
/**
 * Base interface for all dashboard widgets
 */
interface DashboardWidget {
  id: string;
  type: 'spending-chart' | 'income-expenses-chart' | 'recent-transactions' | 'upcoming-bills' | 'goal-progress' | 'gamification';
  priority: 'P0' | 'P1' | 'P2';
  visible: boolean;
  order: number;
}

/**
 * Spending breakdown widget (pie chart)
 */
interface SpendingChartWidget extends DashboardWidget {
  type: 'spending-chart';
  data: SpendingChartData[];
  emptyState: boolean;
}

/**
 * Income vs. Expenses widget (bar chart)
 */
interface IncomeExpensesChartWidget extends DashboardWidget {
  type: 'income-expenses-chart';
  data: IncomeExpensesChartData;
  emptyState: boolean;
}

/**
 * Recent transactions widget (list)
 */
interface RecentTransactionsWidget extends DashboardWidget {
  type: 'recent-transactions';
  data: Transaction[];
  emptyState: boolean;
}

/**
 * Upcoming bills widget (list)
 */
interface UpcomingBillsWidget extends DashboardWidget {
  type: 'upcoming-bills';
  data: UpcomingBill[];
  emptyState: boolean;
}

/**
 * Goal progress widget (progress bars)
 */
interface GoalProgressWidget extends DashboardWidget {
  type: 'goal-progress';
  data: GoalProgress[];
  emptyState: boolean;
}

/**
 * Gamification widget (streaks, insights, wins)
 */
interface GamificationWidget extends DashboardWidget {
  type: 'gamification';
  data: GamificationData;
  emptyState: boolean;
}
```

### 2. Chart Data Types

```typescript
/**
 * Data for spending breakdown pie chart
 */
interface SpendingChartData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number; // Total spending in this category (positive number)
  percentage: number; // Percentage of total spending (0-100)
}

/**
 * Data for income vs. expenses bar chart
 */
interface IncomeExpensesChartData {
  months: MonthData[]; // Last 6 months
  maxValue: number; // Max value for Y-axis scaling
}

interface MonthData {
  month: string; // Format: "Jan", "Feb", "Mar", etc.
  income: number; // Total income for the month
  expenses: number; // Total expenses for the month (positive number)
  net: number; // income - expenses (can be negative)
}
```

### 3. Transaction & Bill Types

```typescript
/**
 * Transaction type (extends existing Transaction from Feature 061)
 */
interface Transaction {
  id: string;
  amount: number; // Negative for expenses, positive for income
  categoryId: string | null;
  description: string;
  date: string; // ISO 8601 format
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

/**
 * Upcoming bill (derived from recurring transactions)
 */
interface UpcomingBill {
  id: string;
  name: string;
  amount: number; // Positive number
  dueDate: string; // ISO 8601 format
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  isPaid: boolean;
  isOverdue: boolean;
  daysUntilDue: number; // Negative if overdue
}
```

### 4. Goal & Gamification Types

```typescript
/**
 * Goal progress (derived from goals feature)
 */
interface GoalProgress {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number; // 0-100
  targetDate: string | null; // ISO 8601 format
  daysRemaining: number | null; // null if no target date
  status: 'on-track' | 'at-risk' | 'completed';
}

/**
 * Gamification data
 */
interface GamificationData {
  streak: StreakData;
  recentWins: RecentWin[];
  insights: PersonalizedInsight[];
}

interface StreakData {
  currentStreak: number; // Days
  longestStreak: number; // Days
  lastActivityDate: string; // ISO 8601 format
}

interface RecentWin {
  id: string;
  message: string; // e.g., "Paid $50 toward debt! 💪"
  timestamp: string; // ISO 8601 format
  icon: string; // Emoji
}

interface PersonalizedInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  percentageChange: number; // e.g., -20 for 20% decrease
  message: string; // e.g., "You spent 20% less on dining this month! 🎉"
}
```

---

## Zod Schemas

### 1. Chart Data Schemas

```typescript
import { z } from 'zod';

/**
 * Spending chart data schema
 */
export const SpendingChartDataSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string().min(1).max(50),
  categoryIcon: z.string().min(1),
  categoryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type SpendingChartData = z.infer<typeof SpendingChartDataSchema>;

/**
 * Month data schema (for income vs. expenses chart)
 */
export const MonthDataSchema = z.object({
  month: z.string().min(3).max(3), // "Jan", "Feb", etc.
  income: z.number().nonnegative(),
  expenses: z.number().nonnegative(),
  net: z.number(),
});

/**
 * Income vs. expenses chart data schema
 */
export const IncomeExpensesChartDataSchema = z.object({
  months: z.array(MonthDataSchema).min(1).max(12),
  maxValue: z.number().positive(),
});

export type IncomeExpensesChartData = z.infer<typeof IncomeExpensesChartDataSchema>;
```

### 2. Widget Data Schemas

```typescript
/**
 * Upcoming bill schema
 */
export const UpcomingBillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().min(1).max(50),
  categoryIcon: z.string().min(1),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  daysUntilDue: z.number(),
});

export type UpcomingBill = z.infer<typeof UpcomingBillSchema>;

/**
 * Goal progress schema
 */
export const GoalProgressSchema = z.object({
  goalId: z.string().uuid(),
  goalName: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  targetDate: z.string().datetime().nullable(),
  daysRemaining: z.number().nullable(),
  status: z.enum(['on-track', 'at-risk', 'completed']),
});

export type GoalProgress = z.infer<typeof GoalProgressSchema>;
```

### 3. Gamification Schemas

```typescript
/**
 * Streak data schema
 */
export const StreakDataSchema = z.object({
  currentStreak: z.number().nonnegative(),
  longestStreak: z.number().nonnegative(),
  lastActivityDate: z.string().datetime(),
});

export type StreakData = z.infer<typeof StreakDataSchema>;

/**
 * Recent win schema
 */
export const RecentWinSchema = z.object({
  id: z.string().uuid(),
  message: z.string().min(1).max(200),
  timestamp: z.string().datetime(),
  icon: z.string().min(1).max(2), // Single emoji
});

export type RecentWin = z.infer<typeof RecentWinSchema>;

/**
 * Personalized insight schema
 */
export const PersonalizedInsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['positive', 'negative', 'neutral']),
  category: z.string().min(1).max(50),
  percentageChange: z.number(),
  message: z.string().min(1).max(200),
});

export type PersonalizedInsight = z.infer<typeof PersonalizedInsightSchema>;

/**
 * Gamification data schema
 */
export const GamificationDataSchema = z.object({
  streak: StreakDataSchema,
  recentWins: z.array(RecentWinSchema).max(3),
  insights: z.array(PersonalizedInsightSchema).max(3),
});

export type GamificationData = z.infer<typeof GamificationDataSchema>;
```

---

## localStorage Structure

### Existing Keys (Read-Only)

The dashboard **reads** from these existing localStorage keys (created by Feature 061 and other features):

```typescript
// Categories (Feature 061)
localStorage.getItem('payplan_categories_v1')
// Structure:
{
  "version": "1.0",
  "categories": [
    {
      "id": "uuid",
      "name": "Groceries",
      "iconName": "shopping-cart",
      "color": "#10b981",
      "isDefault": true,
      "createdAt": "2025-10-28T20:00:00Z",
      "updatedAt": "2025-10-28T20:00:00Z"
    }
  ]
}

// Budgets (Feature 061)
localStorage.getItem('payplan_budgets_v1')
// Structure:
{
  "version": "1.0",
  "budgets": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "monthlyLimit": 500,
      "period": "monthly",
      "rollover": false,
      "createdAt": "2025-10-28T20:00:00Z",
      "updatedAt": "2025-10-28T20:00:00Z"
    }
  ]
}

// Transactions (Existing feature)
localStorage.getItem('payplan_transactions_v1')
// Structure:
{
  "version": "1.0",
  "transactions": [
    {
      "id": "uuid",
      "amount": -25.50,
      "categoryId": "uuid",
      "description": "Grocery shopping",
      "date": "2025-10-28",
      "type": "expense",
      "createdAt": "2025-10-28T20:00:00Z",
      "updatedAt": "2025-10-28T20:00:00Z"
    }
  ]
}

// Goals (Future feature, conditional)
localStorage.getItem('payplan_goals_v1')
// Structure:
{
  "version": "1.0",
  "goals": [
    {
      "id": "uuid",
      "name": "Emergency Fund",
      "targetAmount": 1000,
      "currentAmount": 250,
      "targetDate": "2025-12-31",
      "createdAt": "2025-10-28T20:00:00Z",
      "updatedAt": "2025-10-28T20:00:00Z"
    }
  ]
}
```

### New Key (Dashboard-Specific)

The dashboard **writes** to this new localStorage key for gamification state:

```typescript
// Gamification state (Dashboard feature)
localStorage.getItem('payplan_gamification_v1')
// Structure:
{
  "version": "1.0",
  "streak": {
    "currentStreak": 7,
    "longestStreak": 14,
    "lastActivityDate": "2025-10-28"
  },
  "achievements": [] // Defer to Phase 2
}
```

---

## Data Aggregation Logic

### 1. Spending Breakdown (Pie Chart)

**Source**: `payplan_transactions_v1` + `payplan_categories_v1`  
**Filter**: Current month, expenses only (`amount < 0`)  
**Aggregation**: Group by `categoryId`, sum `Math.abs(amount)`

```typescript
function aggregateSpendingByCategory(
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
```

### 2. Income vs. Expenses (Bar Chart)

**Source**: `payplan_transactions_v1`  
**Filter**: Last 6 months  
**Aggregation**: Group by month, sum income and expenses separately

```typescript
function aggregateIncomeExpenses(
  transactions: Transaction[]
): IncomeExpensesChartData {
  const months: MonthData[] = [];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
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
    ...months.map((m) => Math.max(m.income, m.expenses))
  );
  
  return { months, maxValue };
}
```

### 3. Recent Transactions

**Source**: `payplan_transactions_v1` + `payplan_categories_v1`  
**Filter**: All transactions  
**Sort**: By `date` descending  
**Limit**: 5 transactions

```typescript
function getRecentTransactions(
  transactions: Transaction[],
  limit: number = 5
): Transaction[] {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
```

### 4. Upcoming Bills

**Source**: `payplan_transactions_v1` (recurring patterns)  
**Filter**: Next 7 days  
**Detection**: Transactions with same description + amount in last 30 days

```typescript
function getUpcomingBills(
  transactions: Transaction[],
  categories: Category[]
): UpcomingBill[] {
  // Simplified: Detect recurring transactions by description + amount
  const recurringTransactions = detectRecurringTransactions(transactions);
  
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return recurringTransactions
    .filter((bill) => {
      const dueDate = new Date(bill.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    })
    .map((bill) => {
      const category = categories.find((c) => c.id === bill.categoryId);
      return {
        ...bill,
        categoryName: category?.name || 'Uncategorized',
        categoryIcon: category?.iconName || 'help-circle',
        isOverdue: new Date(bill.dueDate) < today,
        daysUntilDue: Math.floor(
          (new Date(bill.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    });
}
```

### 5. Goal Progress

**Source**: `payplan_goals_v1` (if feature exists)  
**Calculation**: `percentage = (currentAmount / targetAmount) * 100`  
**Status**: `on-track` if >= 50% by midpoint, `at-risk` if < 50%, `completed` if >= 100%

```typescript
function getGoalProgress(goals: Goal[]): GoalProgress[] {
  return goals.map((goal) => {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    let status: 'on-track' | 'at-risk' | 'completed' = 'on-track';
    if (percentage >= 100) {
      status = 'completed';
    } else if (goal.targetDate) {
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const totalDays = (targetDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (today.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const expectedPercentage = (elapsedDays / totalDays) * 100;
      
      status = percentage >= expectedPercentage ? 'on-track' : 'at-risk';
    }
    
    const daysRemaining = goal.targetDate
      ? Math.floor((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      percentage,
      targetDate: goal.targetDate,
      daysRemaining,
      status,
    };
  });
}
```

---

## Performance Considerations

### 1. Memoization Strategy

**All aggregation functions** should be wrapped in `useMemo` to prevent recalculation on every render:

```typescript
const spendingChartData = useMemo(
  () => aggregateSpendingByCategory(transactions, categories),
  [transactions, categories]
);
```

### 2. localStorage Read Optimization

**Read localStorage once** in a custom hook and cache the result:

```typescript
function useDashboardData() {
  const categories = useLocalStorage('payplan_categories_v1', []);
  const budgets = useLocalStorage('payplan_budgets_v1', []);
  const transactions = useLocalStorage('payplan_transactions_v1', []);
  const goals = useLocalStorage('payplan_goals_v1', []);
  
  const spendingChartData = useMemo(
    () => aggregateSpendingByCategory(transactions, categories),
    [transactions, categories]
  );
  
  const incomeExpensesData = useMemo(
    () => aggregateIncomeExpenses(transactions),
    [transactions]
  );
  
  return {
    spendingChartData,
    incomeExpensesData,
    // ... other widget data
  };
}
```

### 3. Widget Component Memoization

**Wrap widget components** in `React.memo` to prevent unnecessary re-renders:

```typescript
export const SpendingChartWidget = React.memo(
  ({ data }: { data: SpendingChartData[] }) => {
    return <SpendingChart data={data} />;
  }
);
```

---

## File Structure

```
frontend/src/
├── types/
│   ├── dashboard.ts           # DashboardWidget types
│   ├── chart-data.ts          # SpendingChartData, IncomeExpensesChartData
│   ├── gamification.ts        # GamificationData, StreakData, RecentWin
│   └── goal.ts                # GoalProgress types
├── lib/
│   └── dashboard/
│       ├── schemas.ts         # Zod schemas for dashboard types
│       ├── aggregation.ts     # Data aggregation functions
│       └── storage.ts         # localStorage read utilities
└── hooks/
    └── useDashboardData.ts    # Custom hook for dashboard data
```

---

## Validation Rules

### Required Fields

- All `id` fields: UUID format
- All `amount` fields: Non-negative numbers
- All `date` fields: ISO 8601 datetime strings
- All `percentage` fields: 0-100 range

### Optional Fields

- `categoryId`: Can be `null` (uncategorized transactions)
- `targetDate`: Can be `null` (goals without deadlines)
- `daysRemaining`: Can be `null` (if no target date)

### Constraints

- `currentStreak` <= `longestStreak` (always enforced)
- `recentWins` array: Max 3 items
- `insights` array: Max 3 items
- `months` array: Max 12 items (1 year of data)

---

## Testing Strategy (Phase 1: Manual)

### Test Cases

1. **Empty State**: No transactions, no categories → Show empty state messages
2. **Single Category**: 1 transaction → Pie chart shows 100%
3. **Multiple Categories**: 5 transactions, 3 categories → Pie chart splits correctly
4. **Large Dataset**: 10,000 transactions → Dashboard loads in <1s
5. **Edge Case**: Transaction with `categoryId = null` → Shows "Uncategorized"
6. **Goal Feature Missing**: No `payplan_goals_v1` → Hide Goal Progress widget

---

## Next Steps

1. **Create TypeScript types** in `frontend/src/types/dashboard.ts`
2. **Create Zod schemas** in `frontend/src/lib/dashboard/schemas.ts`
3. **Create aggregation functions** in `frontend/src/lib/dashboard/aggregation.ts`
4. **Create custom hook** in `frontend/src/hooks/useDashboardData.ts`
5. **Create widget components** in `frontend/src/components/dashboard/`
6. **Create contracts** in `specs/062-short-name-dashboard/contracts/`

---

**Data Model Status**: ✓ Complete (Phase 1)  
**Ready for**: Contracts (Phase 1)
