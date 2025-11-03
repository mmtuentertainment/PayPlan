# Data Model: Business Logic Test Coverage

**Feature**: Business Logic Test Coverage (Feature #063)
**Date**: 2025-11-03
**Purpose**: Define test infrastructure entities, fixtures, utilities, and mock configurations

---

## Overview

This feature doesn't introduce user-facing data models but rather defines **test infrastructure entities** used to test business logic. These include test fixtures, mock configurations, and utility types.

---

## Entity 1: Test Fixture

**Purpose**: Reusable sample data for testing business logic

**Attributes**:
- `id`: string (UUID) - Unique identifier
- `type`: 'budget' | 'category' | 'transaction' | 'archive' - Entity type
- `isValid`: boolean - Whether fixture represents valid or invalid data
- `scenario`: string - Description of what scenario this tests (e.g., "overspent budget", "invalid color")
- `data`: T (generic) - Actual entity data matching business logic types

**Relationships**:
- Fixtures can reference other fixtures (e.g., Transaction references Category)
- Organized by feature in `features/*/lib/__tests__/fixtures/`

**Validation Rules**:
- Valid fixtures MUST pass Zod schema validation
- Invalid fixtures MUST document why they're invalid (for negative testing)
- All fixtures MUST be deterministic (no random data in definitions)

**TypeScript Interface**:

```typescript
// tests/fixtures/types.ts
export interface TestFixture<T> {
  id: string;
  type: 'budget' | 'category' | 'transaction' | 'archive';
  isValid: boolean;
  scenario: string;
  data: T;
}

// Factory function type
export type FixtureFactory<T> = (overrides?: Partial<T>) => T;

// Builder type (for complex entities)
export interface FixtureBuilder<T> {
  build(): T;
}
```

---

## Entity 2: Mock Storage

**Purpose**: In-memory localStorage replacement for tests

**Attributes**:
- `store`: Record<string, string> - Key-value storage
- `quota`: number - Maximum bytes allowed (default: 5MB)
- `usedBytes`: number - Current storage usage
- `methods`: localStorage API (getItem, setItem, removeItem, clear, length, key)

**Behavior**:
- Throws `QuotaExceededError` when quota exceeded
- Resets between tests (via `beforeEach`)
- Tracks byte usage for realistic quota enforcement
- Supports all localStorage API methods

**TypeScript Interface**:

```typescript
// tests/fixtures/mock-storage.ts
export interface MockStorage {
  store: Record<string, string>;
  quota: number;
  usedBytes: number;

  // localStorage API
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly length: number;
  key(index: number): string | null;
}

export interface MockStorageConfig {
  quota?: number; // Default: 5MB
  initialData?: Record<string, string>;
}
```

---

## Entity 3: Test Utilities

**Purpose**: Helper functions for common test operations

**Categories**:

### 3a. Date Utilities
```typescript
// tests/fixtures/date-utils.ts
export interface DateTestUtils {
  // Create deterministic dates
  createDate(year: number, month: number, day: number): Date;

  // ADR-003: Date.setMonth() boundary cases
  getMonthBoundary(year: number, month: number): Date; // Last day of month
  getNextMonth(date: Date): Date; // Handle boundaries correctly
  isLeapYear(year: number): boolean;

  // Fiscal year helpers
  getFiscalYearStart(date: Date): Date;
  getFiscalYearEnd(date: Date): Date;
}
```

### 3b. Amount Utilities
```typescript
// tests/fixtures/amount-utils.ts
export interface AmountTestUtils {
  // Convert between dollars and cents
  toCents(dollars: number): number;
  toDollars(cents: number): number;

  // Rounding (banker's rounding)
  roundToCents(amount: number): number;

  // Validation
  isValidAmount(amount: number): boolean;
  isSafeInteger(amount: number): boolean;

  // Test data generators
  randomAmount(min: number, max: number): number;
  invalidAmounts(): number[]; // NaN, Infinity, negative, etc.
}
```

### 3c. Assertion Utilities
```typescript
// tests/fixtures/assertion-utils.ts
export interface AssertionUtils {
  // Check localStorage state
  expectStorageKey(key: string, value?: string): void;
  expectStorageEmpty(): void;
  expectStorageSize(expected: number): void;

  // Check Zod validation
  expectZodSuccess<T>(schema: z.ZodSchema<T>, data: unknown): void;
  expectZodFailure<T>(schema: z.ZodSchema<T>, data: unknown, errorMessage?: string): void;

  // Check calculation results
  expectPercentage(value: number, expected: number, tolerance?: number): void;
  expectCentsEqual(actual: number, expected: number): void;
}
```

---

## Entity 4: Fixture Collections

**Purpose**: Pre-defined sets of fixtures for common scenarios

### 4a. Budget Fixtures

```typescript
// features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
import { Budget } from '../../types';

export interface BudgetFixtures {
  // Basic scenarios
  validBudget: Budget;
  emptyBudget: Budget;
  overbudget: Budget;
  underbudget: Budget;

  // Rollover scenarios
  budgetWithRollover: Budget;
  budgetWithoutRollover: Budget;

  // Edge cases
  zeroBudget: Budget;
  maxBudget: Budget;
  invalidNegativeBudget: Budget; // For negative testing
}

// Builder class
export class BudgetBuilder implements FixtureBuilder<Budget> {
  private budget: Budget;

  constructor();
  withAmount(amount: number): this;
  withSpent(spent: number): this;
  withRollover(rollover: boolean): this;
  withPeriod(period: Budget['period']): this;
  build(): Budget;
}

// Factory function
export const createBudget: FixtureFactory<Budget>;
```

### 4b. Category Fixtures

```typescript
// features/categories/lib/__tests__/fixtures/category-fixtures.ts
import { SpendingCategory } from '../../types';

export interface CategoryFixtures {
  // Pre-defined categories
  groceries: SpendingCategory;
  entertainment: SpendingCategory;
  transportation: SpendingCategory;
  housing: SpendingCategory;

  // Custom categories
  customCategory: SpendingCategory;
  categoryWithoutBudget: SpendingCategory;

  // Edge cases
  categoryWithInvalidColor: SpendingCategory;
  categoryWithEmptyName: SpendingCategory;
}

// Factory function
export const createCategory: FixtureFactory<SpendingCategory>;

// Trait variations
export const createCustomCategory: FixtureFactory<SpendingCategory>;
export const createCategoryWithoutBudget: FixtureFactory<SpendingCategory>;
```

### 4c. Transaction Fixtures

```typescript
// features/transactions/lib/__tests__/fixtures/transaction-fixtures.ts
import { Transaction } from '../../types';

export interface TransactionFixtures {
  // Basic types
  expense: Transaction;
  income: Transaction;
  transfer: Transaction;

  // Scenarios
  recentTransaction: Transaction;
  oldTransaction: Transaction;
  recurringTransaction: Transaction;

  // Edge cases
  zeroAmountTransaction: Transaction;
  largeAmountTransaction: Transaction;
  invalidTransaction: Transaction;
}

// Factory function
export const createTransaction: FixtureFactory<Transaction>;

// Builder class
export class TransactionBuilder implements FixtureBuilder<Transaction> {
  private transaction: Transaction;

  constructor();
  withAmount(amount: number): this;
  withCategory(categoryId: string): this;
  withDate(date: Date): this;
  withType(type: Transaction['type']): this;
  build(): Transaction;
}
```

### 4d. Dashboard Fixtures

```typescript
// features/dashboard/lib/__tests__/fixtures/dashboard-fixtures.ts
import { DashboardData } from '../../types';

export interface DashboardFixtures {
  // Aggregated data scenarios
  emptyDashboard: DashboardData;
  activeDashboard: DashboardData; // Has transactions, budgets, goals
  overspentDashboard: DashboardData;
  underbudgetDashboard: DashboardData;

  // Gamification scenarios
  newUserDashboard: DashboardData; // No streaks yet
  activeStreakDashboard: DashboardData; // 7+ day streak
  brokenStreakDashboard: DashboardData; // Streak broken yesterday
}

// Factory function
export const createDashboardData: FixtureFactory<DashboardData>;
```

---

## Entity 5: Shared Fixtures

**Purpose**: Common test data used across multiple features

```typescript
// tests/fixtures/shared-fixtures.ts

export interface SharedFixtures {
  // Common dates
  dates: {
    jan1: Date;
    feb28: Date;
    feb29LeapYear: Date;
    dec31: Date;
    monthBoundaries: Date[];
    fiscalYearStarts: Date[];
  };

  // Common IDs (deterministic UUIDs for tests)
  ids: {
    categoryId1: string;
    categoryId2: string;
    budgetId1: string;
    budgetId2: string;
    transactionId1: string;
    userId: string;
  };

  // Common amounts (in cents)
  amounts: {
    zero: 0;
    oneCent: 1;
    oneDollar: 100;
    tenDollars: 1000;
    hundredDollars: 10000;
    thousandDollars: 100000;
    maxSafeInteger: 9007199254740991; // Number.MAX_SAFE_INTEGER
  };

  // Common colors (for categories)
  colors: {
    valid: string[];
    invalid: string[];
  };
}

export const sharedFixtures: SharedFixtures;
```

---

## Entity Relationships

```
SharedFixtures
  ├── Used by → CategoryFixtures
  ├── Used by → BudgetFixtures
  ├── Used by → TransactionFixtures
  └── Used by → DashboardFixtures

CategoryFixtures
  ├── Referenced by → BudgetFixtures (categoryId)
  └── Referenced by → TransactionFixtures (categoryId)

BudgetFixtures
  └── References → CategoryFixtures (via categoryId)

TransactionFixtures
  ├── References → CategoryFixtures (via categoryId)
  └── Used by → DashboardFixtures (aggregated data)

DashboardFixtures
  ├── Aggregates → BudgetFixtures
  ├── Aggregates → TransactionFixtures
  └── Aggregates → CategoryFixtures

MockStorage
  └── Used by → All storage service tests
```

---

## File Organization

```
frontend/
├── tests/
│   ├── setup.ts                          # Global test setup (MockStorage)
│   └── fixtures/
│       ├── types.ts                      # Common types (TestFixture, FixtureFactory)
│       ├── shared-fixtures.ts            # Shared fixtures (dates, IDs, amounts)
│       ├── mock-storage.ts               # MockStorage implementation
│       ├── date-utils.ts                 # Date test utilities
│       ├── amount-utils.ts               # Amount test utilities
│       └── assertion-utils.ts            # Custom assertions
│
├── src/features/
│   ├── budgets/lib/__tests__/fixtures/
│   │   ├── budget-fixtures.ts            # BudgetFixtures, BudgetBuilder
│   │   └── index.ts                      # Barrel export
│   │
│   ├── categories/lib/__tests__/fixtures/
│   │   ├── category-fixtures.ts          # CategoryFixtures
│   │   └── index.ts
│   │
│   ├── transactions/lib/__tests__/fixtures/
│   │   ├── transaction-fixtures.ts       # TransactionFixtures, TransactionBuilder
│   │   └── index.ts
│   │
│   └── dashboard/lib/__tests__/fixtures/
│       ├── dashboard-fixtures.ts         # DashboardFixtures
│       └── index.ts
```

---

## Data Validation Rules

### For Valid Fixtures

1. **Type Safety**: All fixtures MUST match their TypeScript interface exactly
2. **Schema Compliance**: Valid fixtures MUST pass Zod schema validation
3. **Determinism**: No `Math.random()`, `Date.now()`, or non-deterministic generation
4. **Completeness**: All required fields MUST be present (no undefined unless intentional)
5. **Realistic**: Data should reflect real-world usage (valid amounts, dates, etc.)

### For Invalid Fixtures

1. **Documentation**: MUST include `scenario` field explaining why invalid
2. **Targeted**: Each invalid fixture tests ONE specific validation rule
3. **Clear Naming**: Name should indicate what's invalid (e.g., `categoryWithInvalidColor`)
4. **Expected Behavior**: Tests using invalid fixtures MUST expect failure/rejection

---

## Mock Configurations

### MockStorage Configuration

```typescript
// Default configuration
export const defaultMockStorageConfig: MockStorageConfig = {
  quota: 5 * 1024 * 1024, // 5MB
  initialData: {},
};

// Quota exceeded scenario
export const lowQuotaConfig: MockStorageConfig = {
  quota: 1024, // 1KB (very small)
  initialData: {},
};

// Pre-populated scenario
export const populatedStorageConfig: MockStorageConfig = {
  quota: 5 * 1024 * 1024,
  initialData: {
    'categories': JSON.stringify([/* category data */]),
    'budgets': JSON.stringify([/* budget data */]),
  },
};
```

### Test Timeout Configuration

```typescript
// Default timeouts (from vite.config.ts)
export const testTimeouts = {
  default: 2000, // 2 seconds (most tests)
  slow: 5000,    // 5 seconds (integration-like tests)
  fast: 500,     // 500ms (simple unit tests)
};
```

---

## Fixture Usage Examples

### Using Factory Functions

```typescript
// Simple override
const category = createCategory({ name: 'Entertainment', budget: 20000 });

// No overrides (use defaults)
const defaultCategory = createCategory();

// Invalid fixture for negative testing
const invalidCategory = createCategory({ color: 'not-a-color' });
expect(() => categorySchema.parse(invalidCategory)).toThrow();
```

### Using Builder Pattern

```typescript
// Complex object with many customizations
const budget = new BudgetBuilder()
  .withAmount(100000) // $1000.00
  .withSpent(75000)   // $750.00
  .withRollover(true)
  .withPeriod('monthly')
  .build();

// Chain methods for readability
const overbudget = new BudgetBuilder()
  .withAmount(50000)
  .withSpent(75000) // Spent more than budget
  .build();
```

### Using Shared Fixtures

```typescript
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

// Use deterministic dates
const jan31 = sharedFixtures.dates.jan1;
const nextMonth = getNextMonth(jan31); // Uses ADR-003 logic

// Use deterministic IDs
const categoryId = sharedFixtures.ids.categoryId1;
const budget = createBudget({ categoryId });
```

---

## Testing the Test Infrastructure

**Meta-Tests**: The test infrastructure itself should be tested!

```typescript
// tests/fixtures/__tests__/mock-storage.test.ts
describe('MockStorage', () => {
  it('should throw QuotaExceededError when quota exceeded', () => {
    const storage = createMockStorage({ quota: 100 });
    const largeData = 'x'.repeat(101); // 101 bytes

    expect(() => storage.setItem('key', largeData))
      .toThrow('QuotaExceededError');
  });

  it('should track used bytes accurately', () => {
    const storage = createMockStorage();
    storage.setItem('key1', 'value1'); // 6 bytes
    storage.setItem('key2', 'value2'); // 6 bytes

    expect(storage.usedBytes).toBe(12);
  });
});
```

---

## Summary

This data model defines **5 core entities** for test infrastructure:

1. **Test Fixture**: Reusable sample data (budgets, categories, transactions)
2. **Mock Storage**: In-memory localStorage replacement
3. **Test Utilities**: Helpers for dates, amounts, assertions
4. **Fixture Collections**: Pre-defined scenario sets per feature
5. **Shared Fixtures**: Common data (dates, IDs, amounts) across features

**Total Files to Create**: ~20
- 4 shared utilities (tests/fixtures/)
- 4 feature fixture files (budgets, categories, transactions, dashboard)
- 1 global setup (tests/setup.ts)
- 10+ test files (calculations, storage services, schemas, aggregation, gamification)

**Next**: Generate contracts/ (test utility APIs) and quickstart.md (usage guide)
