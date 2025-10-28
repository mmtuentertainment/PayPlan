# Data Model: Spending Categories & Budget Creation

**Feature**: MMT-61 - Spending Categories & Budget Creation  
**Created**: 2025-10-28  
**Version**: 1.0

## Overview

This document defines the data schemas, TypeScript types, and localStorage structure for the spending categories and budgets feature.

## Entities

### Category

Represents a spending category (e.g., "Groceries", "Dining").

**TypeScript Interface**:
```typescript
interface Category {
  id: string;                 // UUID v4
  name: string;               // Display name (e.g., "Groceries")
  icon: string;               // Lucide icon name (e.g., "shopping-cart")
  color: string;              // Hex color code (e.g., "#10b981")
  isPredefined: boolean;      // true for system categories, false for custom
  createdAt: string;          // ISO 8601 timestamp
}
```

**Zod Schema**:
```typescript
import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  isPredefined: z.boolean(),
  createdAt: z.string().datetime()
});

export type Category = z.infer<typeof CategorySchema>;
```

**Validation Rules**:
- `name`: Required, 1-50 characters
- `icon`: Required, must be valid Lucide icon name
- `color`: Required, must be valid hex color (#RRGGBB)
- `isPredefined`: Required boolean
- `createdAt`: Required ISO 8601 timestamp

**Constraints**:
- Category names must be unique (case-insensitive)
- Pre-defined categories cannot be deleted (only hidden)
- Maximum 100 categories per user (performance limit)

---

### Budget

Represents a monthly spending limit for a category.

**TypeScript Interface**:
```typescript
interface Budget {
  id: string;                 // UUID v4
  categoryId: string;         // Foreign key to Category.id
  monthlyLimit: number;       // Budget amount in cents (e.g., 50000 = $500.00)
  period: 'monthly';          // Only 'monthly' supported in Phase 1
  rollover: boolean;          // Carry unused balance to next month (Phase 2)
  createdAt: string;          // ISO 8601 timestamp
  updatedAt: string;          // ISO 8601 timestamp
}
```

**Zod Schema**:
```typescript
import { z } from 'zod';

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  monthlyLimit: z.number().int().positive("Budget must be greater than $0"),
  period: z.literal('monthly'),
  rollover: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Budget = z.infer<typeof BudgetSchema>;
```

**Validation Rules**:
- `monthlyLimit`: Required, must be positive integer (in cents)
- `categoryId`: Required, must reference existing category
- `period`: Must be 'monthly' (only option in Phase 1)
- `rollover`: Defaults to false (feature not implemented in Phase 1)

**Constraints**:
- One budget per category (1:1 relationship)
- Budget amount must be > $0
- Budget cannot exist without a category

---

### Transaction (Updated)

Existing transaction entity with new `categoryId` field.

**TypeScript Interface** (changes only):
```typescript
interface Transaction {
  // ... existing fields ...
  categoryId?: string;        // NEW: Foreign key to Category.id (optional)
}
```

**Zod Schema** (changes only):
```typescript
export const TransactionSchema = z.object({
  // ... existing fields ...
  categoryId: z.string().uuid().optional()  // NEW
});
```

**Validation Rules**:
- `categoryId`: Optional, must reference existing category if provided

---

## localStorage Structure

### Complete Schema

```typescript
interface PayPlanStorage {
  version: string;            // Schema version (e.g., "1.0")
  categories: Category[];     // Array of categories
  budgets: Budget[];          // Array of budgets
  transactions: Transaction[]; // Existing transactions with new categoryId field
  // ... other existing fields ...
}
```

### Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `payplan:version` | string | Schema version |
| `payplan:categories` | Category[] | All categories (pre-defined + custom) |
| `payplan:budgets` | Budget[] | All budgets |
| `payplan:transactions` | Transaction[] | All transactions (updated with categoryId) |

### Example localStorage Data

```json
{
  "version": "1.0",
  "categories": [
    {
      "id": "cat-1",
      "name": "Groceries",
      "icon": "shopping-cart",
      "color": "#10b981",
      "isPredefined": true,
      "createdAt": "2025-10-28T20:00:00Z"
    },
    {
      "id": "cat-2",
      "name": "Coffee Shops",
      "icon": "coffee",
      "color": "#f59e0b",
      "isPredefined": false,
      "createdAt": "2025-10-28T20:15:00Z"
    }
  ],
  "budgets": [
    {
      "id": "bud-1",
      "categoryId": "cat-1",
      "monthlyLimit": 50000,
      "period": "monthly",
      "rollover": false,
      "createdAt": "2025-10-28T20:00:00Z",
      "updatedAt": "2025-10-28T20:00:00Z"
    }
  ],
  "transactions": [
    {
      "id": "txn-1",
      "amount": 4500,
      "merchant": "Whole Foods",
      "date": "2025-10-28",
      "categoryId": "cat-1"
    }
  ]
}
```

---

## Pre-defined Categories

### Default Categories (9 total)

| Name | Icon | Color | Description |
|------|------|-------|-------------|
| Groceries | shopping-cart | #10b981 (green) | Food and household items |
| Dining | utensils | #f59e0b (amber) | Restaurants and takeout |
| Transportation | car | #3b82f6 (blue) | Gas, parking, public transit |
| Housing | home | #8b5cf6 (purple) | Rent, mortgage, utilities |
| Utilities | zap | #06b6d4 (cyan) | Electric, water, internet |
| Entertainment | film | #ec4899 (pink) | Movies, streaming, hobbies |
| Healthcare | heart-pulse | #ef4444 (red) | Medical, pharmacy, insurance |
| Debt | credit-card | #f97316 (orange) | Credit cards, loans, BNPL |
| Savings | piggy-bank | #22c55e (green) | Savings, investments |

**Implementation**:
```typescript
export const PREDEFINED_CATEGORIES: Category[] = [
  {
    id: 'cat-groceries',
    name: 'Groceries',
    icon: 'shopping-cart',
    color: '#10b981',
    isPredefined: true,
    createdAt: new Date().toISOString()
  },
  // ... other 8 categories
];
```

---

## Relationships

### Category ↔ Budget (1:1)
- One category can have zero or one budget
- One budget belongs to exactly one category
- Deleting a category deletes its budget (cascade)

### Category ↔ Transaction (1:N)
- One category can have many transactions
- One transaction belongs to zero or one category
- Deleting a category sets transaction.categoryId to null (nullify)

### Budget ↔ Transaction (indirect via Category)
- Budget progress calculated by summing transactions where transaction.categoryId === budget.categoryId

---

## Data Operations

### Category Operations

**Create**:
```typescript
function createCategory(data: Omit<Category, 'id' | 'createdAt'>): Category {
  const category: Category = {
    id: uuid(),
    ...data,
    createdAt: new Date().toISOString()
  };
  
  // Validate
  CategorySchema.parse(category);
  
  // Check uniqueness
  const existing = getCategories();
  if (existing.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
    throw new Error('Category name must be unique');
  }
  
  // Save
  const categories = [...existing, category];
  localStorage.setItem('payplan:categories', JSON.stringify(categories));
  
  return category;
}
```

**Update**:
```typescript
function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'isPredefined'>>): Category {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) {
    throw new Error('Category not found');
  }
  
  const updated = { ...categories[index], ...updates };
  
  // Validate
  CategorySchema.parse(updated);
  
  // Check uniqueness (if name changed)
  if (updates.name && updates.name !== categories[index].name) {
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === updates.name.toLowerCase())) {
      throw new Error('Category name must be unique');
    }
  }
  
  // Save
  categories[index] = updated;
  localStorage.setItem('payplan:categories', JSON.stringify(categories));
  
  return updated;
}
```

**Delete**:
```typescript
function deleteCategory(id: string): void {
  const categories = getCategories();
  const category = categories.find(c => c.id === id);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Check if category has transactions
  const transactions = getTransactions();
  const hasTransactions = transactions.some(t => t.categoryId === id);
  
  if (hasTransactions) {
    // Require confirmation (handled in UI)
    // Uncategorize transactions
    const updatedTransactions = transactions.map(t => 
      t.categoryId === id ? { ...t, categoryId: undefined } : t
    );
    localStorage.setItem('payplan:transactions', JSON.stringify(updatedTransactions));
  }
  
  // Delete budget (cascade)
  const budgets = getBudgets();
  const updatedBudgets = budgets.filter(b => b.categoryId !== id);
  localStorage.setItem('payplan:budgets', JSON.stringify(updatedBudgets));
  
  // Delete category
  const updatedCategories = categories.filter(c => c.id !== id);
  localStorage.setItem('payplan:categories', JSON.stringify(updatedCategories));
}
```

### Budget Operations

**Create**:
```typescript
function createBudget(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Budget {
  // Check if category exists
  const categories = getCategories();
  if (!categories.some(c => c.id === data.categoryId)) {
    throw new Error('Category not found');
  }
  
  // Check if budget already exists for this category
  const budgets = getBudgets();
  if (budgets.some(b => b.categoryId === data.categoryId)) {
    throw new Error('Budget already exists for this category');
  }
  
  const budget: Budget = {
    id: uuid(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Validate
  BudgetSchema.parse(budget);
  
  // Save
  const updated = [...budgets, budget];
  localStorage.setItem('payplan:budgets', JSON.stringify(updated));
  
  return budget;
}
```

**Calculate Progress**:
```typescript
interface BudgetProgress {
  spent: number;        // Total spent in cents
  remaining: number;    // Remaining budget in cents
  percentage: number;   // Percentage spent (0-100+)
  status: 'safe' | 'warning' | 'danger';  // Visual status
}

function calculateBudgetProgress(categoryId: string): BudgetProgress {
  const budget = getBudgets().find(b => b.categoryId === categoryId);
  
  if (!budget) {
    throw new Error('Budget not found');
  }
  
  // Get current month transactions
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const transactions = getTransactions().filter(t => 
    t.categoryId === categoryId &&
    new Date(t.date) >= monthStart &&
    new Date(t.date) <= monthEnd
  );
  
  const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = budget.monthlyLimit - spent;
  const percentage = (spent / budget.monthlyLimit) * 100;
  
  let status: 'safe' | 'warning' | 'danger';
  if (percentage < 80) {
    status = 'safe';
  } else if (percentage < 100) {
    status = 'warning';
  } else {
    status = 'danger';
  }
  
  return { spent, remaining, percentage, status };
}
```

---

## Storage Limits & Monitoring

### Limits
- **Maximum localStorage**: 5 MB (browser limit)
- **Maximum categories**: 100 (soft limit for performance)
- **Maximum budgets**: 100 (one per category)
- **Maximum transactions**: 10,000 (estimated ~2 MB)

### Monitoring
```typescript
function getStorageUsage(): { used: number; limit: number; percentage: number } {
  const data = JSON.stringify(localStorage);
  const used = new Blob([data]).size;
  const limit = 5 * 1024 * 1024; // 5 MB
  const percentage = (used / limit) * 100;
  
  return { used, limit, percentage };
}

function checkStorageLimit(): void {
  const { percentage } = getStorageUsage();
  
  if (percentage >= 95) {
    throw new Error('Storage limit reached. Please export data or delete old transactions.');
  } else if (percentage >= 80) {
    console.warn('Storage usage at 80%. Consider exporting data.');
  }
}
```

---

## Migration Strategy

### Version 1.0 (Initial)
- Add `categories` array to localStorage
- Add `budgets` array to localStorage
- Add `categoryId` field to existing transactions
- Initialize with 9 pre-defined categories

### Future Versions
- Version 1.1: Add `rollover` support
- Version 1.2: Add `period` options (weekly, biweekly)
- Version 1.3: Add category groups

---

## Performance Considerations

### Indexing
- Categories indexed by `id` (Map for O(1) lookups)
- Budgets indexed by `categoryId` (Map for O(1) lookups)
- Transactions filtered by `categoryId` and date range

### Caching
- Category list cached in React state (useCategories hook)
- Budget progress cached and recomputed only when transactions change
- localStorage reads debounced to 500ms

### Optimization
- Use React.memo for CategoryCard and BudgetCard
- Virtualize lists if >100 items
- Debounce localStorage writes to 500ms

---

## References

- **Spec**: `spec.md`
- **Plan**: `plan.md`
- **Constitution**: `memory/constitution_v1.1_TEMP.md` (lines 800-1000+)

