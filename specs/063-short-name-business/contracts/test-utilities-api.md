# Test Utilities API Contract

**Feature**: Business Logic Test Coverage (Feature #063)
**Date**: 2025-11-03
**Purpose**: Define public API contracts for test utilities, fixtures, and mocks

---

## Overview

This document defines the public API contracts for all test infrastructure utilities. These APIs will be used by developers writing business logic tests across all features.

---

## 1. MockStorage API

**Location**: `tests/fixtures/mock-storage.ts`

**Purpose**: In-memory localStorage implementation for deterministic testing

### Interface

```typescript
export interface MockStorage {
  /**
   * Retrieve a value by key
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  getItem(key: string): string | null;

  /**
   * Store a value by key
   * @param key - Storage key
   * @param value - Value to store (will be stringified)
   * @throws {DOMException} QuotaExceededError if quota exceeded
   */
  setItem(key: string, value: string): void;

  /**
   * Remove a value by key
   * @param key - Storage key to remove
   */
  removeItem(key: string): void;

  /**
   * Clear all stored values
   */
  clear(): void;

  /**
   * Get number of stored items
   */
  readonly length: number;

  /**
   * Get key at index
   * @param index - Index (0-based)
   * @returns Key at index or null if out of bounds
   */
  key(index: number): string | null;

  /**
   * Current storage usage in bytes
   */
  readonly usedBytes: number;

  /**
   * Maximum storage quota in bytes
   */
  readonly quota: number;
}

export interface MockStorageConfig {
  /**
   * Maximum storage quota in bytes
   * @default 5242880 (5MB)
   */
  quota?: number;

  /**
   * Initial data to populate storage
   * @default {}
   */
  initialData?: Record<string, string>;
}

/**
 * Create a new mock storage instance
 * @param config - Optional configuration
 * @returns MockStorage instance
 */
export function createMockStorage(config?: MockStorageConfig): MockStorage;
```

### Usage Examples

```typescript
import { createMockStorage } from '@/tests/fixtures/mock-storage';

// Default configuration (5MB quota)
const storage = createMockStorage();
storage.setItem('key', 'value');
expect(storage.getItem('key')).toBe('value');

// Custom quota (test quota exceeded)
const smallStorage = createMockStorage({ quota: 100 });
expect(() => smallStorage.setItem('key', 'x'.repeat(101)))
  .toThrow('QuotaExceededError');

// Pre-populated storage
const prePopulated = createMockStorage({
  initialData: {
    'categories': JSON.stringify([{ id: '1', name: 'Food' }]),
  },
});
expect(prePopulated.length).toBe(1);
```

---

## 2. Date Utilities API

**Location**: `tests/fixtures/date-utils.ts`

**Purpose**: Deterministic date creation and ADR-003 boundary handling

### Interface

```typescript
/**
 * Create deterministic date (no timezone issues)
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12, NOT 0-11)
 * @param day - Day of month (1-31)
 * @returns Date object in UTC
 */
export function createDate(year: number, month: number, day: number): Date;

/**
 * Get last day of month (handles variable month lengths)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Last day of month (28-31)
 */
export function getLastDayOfMonth(year: number, month: number): number;

/**
 * Get month boundary date (last day of month)
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Date object set to last day of month
 */
export function getMonthBoundary(year: number, month: number): Date;

/**
 * Add months to date (ADR-003 compliant)
 * Handles boundary cases like Jan 31 → Feb 28/29
 * @param date - Starting date
 * @param months - Months to add (can be negative)
 * @returns New date with months added
 */
export function addMonths(date: Date, months: number): Date;

/**
 * Check if year is leap year
 * @param year - Year to check
 * @returns True if leap year
 */
export function isLeapYear(year: number): boolean;

/**
 * Get fiscal year start date (July 1)
 * @param date - Any date in fiscal year
 * @returns July 1 of fiscal year
 */
export function getFiscalYearStart(date: Date): Date;

/**
 * Get fiscal year end date (June 30)
 * @param date - Any date in fiscal year
 * @returns June 30 of fiscal year
 */
export function getFiscalYearEnd(date: Date): Date;
```

### Usage Examples

```typescript
import { createDate, addMonths, getLastDayOfMonth } from '@/tests/fixtures/date-utils';

// Deterministic dates (no timezone issues)
const jan31 = createDate(2025, 1, 31);
expect(jan31.getUTCMonth()).toBe(0); // January is 0

// ADR-003: Jan 31 + 1 month = Feb 28 (not Mar 3!)
const feb28 = addMonths(jan31, 1);
expect(feb28.getUTCDate()).toBe(28);

// Month boundaries
expect(getLastDayOfMonth(2024, 2)).toBe(29); // Leap year
expect(getLastDayOfMonth(2025, 2)).toBe(28); // Non-leap year
```

---

## 3. Amount Utilities API

**Location**: `tests/fixtures/amount-utils.ts`

**Purpose**: Financial amount conversions and validation

### Interface

```typescript
/**
 * Convert dollars to cents (financial calculations use integers)
 * @param dollars - Dollar amount (e.g., 10.50)
 * @returns Cents (e.g., 1050)
 */
export function toCents(dollars: number): number;

/**
 * Convert cents to dollars
 * @param cents - Cent amount (e.g., 1050)
 * @returns Dollars (e.g., 10.50)
 */
export function toDollars(cents: number): number;

/**
 * Round amount to cents precision (banker's rounding)
 * @param amount - Amount in cents
 * @returns Rounded amount
 */
export function roundToCents(amount: number): number;

/**
 * Check if amount is valid (positive integer in safe range)
 * @param amount - Amount to validate
 * @returns True if valid
 */
export function isValidAmount(amount: number): boolean;

/**
 * Check if number is safe integer (no precision loss)
 * @param value - Number to check
 * @returns True if safe integer
 */
export function isSafeInteger(value: number): boolean;

/**
 * Generate random amount within range (for property-based testing)
 * @param min - Minimum cents
 * @param max - Maximum cents
 * @returns Random amount in cents
 */
export function randomAmount(min: number, max: number): number;

/**
 * Get list of invalid amounts for negative testing
 * @returns Array of invalid amounts (NaN, Infinity, negative, etc.)
 */
export function getInvalidAmounts(): number[];
```

### Usage Examples

```typescript
import { toCents, toDollars, isValidAmount, getInvalidAmounts } from '@/tests/fixtures/amount-utils';

// Conversions
expect(toCents(10.50)).toBe(1050);
expect(toDollars(1050)).toBe(10.50);

// Validation
expect(isValidAmount(1000)).toBe(true);
expect(isValidAmount(-100)).toBe(false);
expect(isValidAmount(NaN)).toBe(false);

// Negative testing
const invalidAmounts = getInvalidAmounts(); // [NaN, Infinity, -Infinity, -1, ...]
invalidAmounts.forEach(amount => {
  expect(() => calculateBudgetProgress(amount, 0)).toThrow();
});
```

---

## 4. Assertion Utilities API

**Location**: `tests/fixtures/assertion-utils.ts`

**Purpose**: Custom assertions for common test patterns

### Interface

```typescript
/**
 * Assert localStorage contains key with optional value check
 * @param key - Expected key
 * @param value - Expected value (optional)
 */
export function expectStorageKey(key: string, value?: string): void;

/**
 * Assert localStorage is empty
 */
export function expectStorageEmpty(): void;

/**
 * Assert localStorage has exact number of keys
 * @param expected - Expected key count
 */
export function expectStorageSize(expected: number): void;

/**
 * Assert Zod schema validation succeeds
 * @param schema - Zod schema
 * @param data - Data to validate
 */
export function expectZodSuccess<T>(schema: z.ZodSchema<T>, data: unknown): void;

/**
 * Assert Zod schema validation fails
 * @param schema - Zod schema
 * @param data - Data to validate
 * @param errorMessage - Optional expected error message (partial match)
 */
export function expectZodFailure<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): void;

/**
 * Assert percentage value with tolerance
 * @param actual - Actual percentage
 * @param expected - Expected percentage
 * @param tolerance - Tolerance (default: 0.01 = 0.01%)
 */
export function expectPercentage(
  actual: number,
  expected: number,
  tolerance?: number
): void;

/**
 * Assert cent amounts are equal (handles floating point)
 * @param actual - Actual amount in cents
 * @param expected - Expected amount in cents
 */
export function expectCentsEqual(actual: number, expected: number): void;
```

### Usage Examples

```typescript
import { expectStorageKey, expectZodSuccess, expectPercentage } from '@/tests/fixtures/assertion-utils';

// Storage assertions
expectStorageKey('categories'); // Key exists
expectStorageKey('categories', '[]'); // Key exists with value
expectStorageEmpty(); // No keys in storage
expectStorageSize(3); // Exactly 3 keys

// Zod assertions
expectZodSuccess(categorySchema, { id: '1', name: 'Food', color: '#FF0000' });
expectZodFailure(categorySchema, { name: 'Food' }, 'id'); // Missing 'id' field

// Percentage assertions
expectPercentage(50.123, 50, 0.5); // Within 0.5% tolerance
expectPercentage(99.999, 100, 0.01); // Very close

// Cent assertions (handles floating point precision)
expectCentsEqual(5000, 5000); // $50.00
expectCentsEqual(4999, 5000 - 1); // Exact equality
```

---

## 5. Fixture Factory API

**Location**: `features/*/lib/__tests__/fixtures/*.ts`

**Purpose**: Create test data with defaults and overrides

### Generic Factory Interface

```typescript
/**
 * Factory function type
 * Creates entity with defaults, allows overrides
 */
export type FixtureFactory<T> = (overrides?: Partial<T>) => T;
```

### Specific Factories

#### Budget Factory

```typescript
/**
 * Create budget fixture with defaults
 * @param overrides - Fields to override
 * @returns Budget object
 */
export function createBudget(overrides?: Partial<Budget>): Budget;

/**
 * Budget builder for complex scenarios
 */
export class BudgetBuilder {
  constructor();
  withAmount(amount: number): this;
  withSpent(spent: number): this;
  withRollover(rollover: boolean): this;
  withPeriod(period: 'weekly' | 'biweekly' | 'monthly' | 'yearly'): this;
  withCategory(categoryId: string): this;
  build(): Budget;
}
```

#### Category Factory

```typescript
/**
 * Create category fixture with defaults
 * @param overrides - Fields to override
 * @returns SpendingCategory object
 */
export function createCategory(overrides?: Partial<SpendingCategory>): SpendingCategory;

// Trait variations
export function createCustomCategory(overrides?: Partial<SpendingCategory>): SpendingCategory;
export function createCategoryWithoutBudget(overrides?: Partial<SpendingCategory>): SpendingCategory;
export function createPredefinedCategory(name: string): SpendingCategory;
```

#### Transaction Factory

```typescript
/**
 * Create transaction fixture with defaults
 * @param overrides - Fields to override
 * @returns Transaction object
 */
export function createTransaction(overrides?: Partial<Transaction>): Transaction;

/**
 * Transaction builder for complex scenarios
 */
export class TransactionBuilder {
  constructor();
  withAmount(amount: number): this;
  withCategory(categoryId: string): this;
  withDate(date: Date): this;
  withType(type: 'expense' | 'income' | 'transfer'): this;
  withNotes(notes: string): this;
  build(): Transaction;
}
```

#### Dashboard Factory

```typescript
/**
 * Create dashboard data fixture
 * @param overrides - Fields to override
 * @returns DashboardData object
 */
export function createDashboardData(overrides?: Partial<DashboardData>): DashboardData;

// Scenario variations
export function createEmptyDashboard(): DashboardData;
export function createActiveDashboard(): DashboardData; // Has data
export function createOverspentDashboard(): DashboardData;
```

### Usage Examples

```typescript
import { createBudget, BudgetBuilder } from '@/features/budgets/lib/__tests__/fixtures';
import { createCategory } from '@/features/categories/lib/__tests__/fixtures';

// Simple factory
const category = createCategory({ name: 'Food', budget: 50000 });

// Complex builder
const budget = new BudgetBuilder()
  .withAmount(100000)
  .withSpent(75000)
  .withRollover(true)
  .build();

// Scenario variations
const customCategory = createCustomCategory();
const emptyDashboard = createEmptyDashboard();
```

---

## 6. Shared Fixtures API

**Location**: `tests/fixtures/shared-fixtures.ts`

**Purpose**: Common test data used across features

### Interface

```typescript
export interface SharedFixtures {
  /**
   * Deterministic dates for testing
   */
  dates: {
    jan1: Date;        // January 1, 2025
    jan31: Date;       // January 31, 2025
    feb28: Date;       // February 28, 2025
    feb29LeapYear: Date; // February 29, 2024 (leap year)
    mar1: Date;        // March 1, 2025
    dec31: Date;       // December 31, 2025
    monthBoundaries: Date[]; // Last day of each month (12 dates)
    fiscalYearStarts: Date[]; // July 1 for years 2023-2027
  };

  /**
   * Deterministic UUIDs for tests
   */
  ids: {
    categoryId1: string;
    categoryId2: string;
    categoryId3: string;
    budgetId1: string;
    budgetId2: string;
    budgetId3: string;
    transactionId1: string;
    transactionId2: string;
    transactionId3: string;
    userId: string;
  };

  /**
   * Common amounts in cents
   */
  amounts: {
    zero: 0;
    oneCent: 1;
    tenCents: 10;
    oneDollar: 100;
    tenDollars: 1000;
    fiftyDollars: 5000;
    hundredDollars: 10000;
    fiveHundredDollars: 50000;
    thousandDollars: 100000;
    maxSafeInteger: 9007199254740991;
  };

  /**
   * Valid and invalid color codes
   */
  colors: {
    valid: string[]; // ['#FF0000', '#00FF00', '#0000FF', ...]
    invalid: string[]; // ['red', 'FF0000', '#GGG', ...]
  };
}

/**
 * Get shared fixtures singleton
 */
export const sharedFixtures: SharedFixtures;
```

### Usage Examples

```typescript
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

// Use deterministic dates
const jan31 = sharedFixtures.dates.jan31;
const budget = createBudget({ startDate: jan31.toISOString() });

// Use deterministic IDs (no UUID collisions)
const categoryId = sharedFixtures.ids.categoryId1;
const category = createCategory({ id: categoryId });

// Use common amounts
const fiftyDollars = sharedFixtures.amounts.fiftyDollars; // 5000 cents
const budget = createBudget({ amount: fiftyDollars });

// Use valid/invalid data for testing
sharedFixtures.colors.valid.forEach(color => {
  const category = createCategory({ color });
  expectZodSuccess(categorySchema, category);
});

sharedFixtures.colors.invalid.forEach(color => {
  const category = createCategory({ color });
  expectZodFailure(categorySchema, category);
});
```

---

## API Versioning

**Current Version**: 1.0.0 (Initial Release)

**Backwards Compatibility Policy**:
- All APIs are backwards compatible within Phase 1
- Breaking changes require major version bump
- Deprecated APIs will be marked with `@deprecated` and warning logs
- Deprecated APIs will be removed only in Phase 2+

---

## Testing the API

All test utilities MUST have their own tests:

```typescript
// tests/fixtures/__tests__/mock-storage.test.ts
describe('MockStorage API', () => {
  it('should implement localStorage API correctly', () => {
    const storage = createMockStorage();
    // Test all API methods...
  });
});

// tests/fixtures/__tests__/date-utils.test.ts
describe('Date Utilities API', () => {
  it('should handle ADR-003 boundary cases', () => {
    const jan31 = createDate(2025, 1, 31);
    const result = addMonths(jan31, 1);
    expect(result.getUTCDate()).toBe(28); // Feb 28, not Mar 3
  });
});
```

---

## Summary

This document defines **6 core API contracts**:

1. **MockStorage API**: In-memory localStorage (10 methods)
2. **Date Utilities API**: Deterministic dates, ADR-003 compliance (7 functions)
3. **Amount Utilities API**: Financial conversions, validation (7 functions)
4. **Assertion Utilities API**: Custom test assertions (7 functions)
5. **Fixture Factory API**: Data creation with defaults/overrides (12+ factories)
6. **Shared Fixtures API**: Common test data (dates, IDs, amounts, colors)

**Total API Surface**: ~50 public functions/methods

**Next**: Generate quickstart.md (usage guide for developers)
