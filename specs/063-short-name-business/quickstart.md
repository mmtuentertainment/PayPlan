# Quickstart: Writing Business Logic Tests

**Feature**: Business Logic Test Coverage (Feature #063)
**Date**: 2025-11-03
**Purpose**: Get started writing tests quickly with examples and best practices

---

## Prerequisites

- ✅ Vitest 3.2.4 installed (already configured)
- ✅ TypeScript 5.8.3 with strict mode
- ✅ Node.js 20+ and npm
- ✅ Familiarity with Vitest/Jest syntax

---

## Quick Start (30 seconds)

### 1. Run Existing Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (TDD)
npm run test:watch

# Run specific test file
npm test budgets/lib/__tests__/calculations.test.ts
```

### 2. Check Coverage Report

```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser (after running coverage)
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### 3. Write Your First Test

```typescript
// features/budgets/lib/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBudgetProgress } from '../calculations';

describe('calculateBudgetProgress', () => {
  it('should calculate 50% when half spent', () => {
    const result = calculateBudgetProgress(50000, 25000);
    expect(result).toBe(50);
  });
});
```

---

## File Organization

### Where to Put Tests

```
features/
└── budgets/
    └── lib/
        ├── __tests__/              # ⭐ Create this directory
        │   ├── fixtures/           # ⭐ Test data goes here
        │   │   ├── budget-fixtures.ts
        │   │   └── index.ts        # Barrel export
        │   ├── calculations.test.ts  # ⭐ Tests for calculations.ts
        │   ├── BudgetStorageService.test.ts
        │   └── schemas.test.ts
        ├── calculations.ts         # Source file
        ├── BudgetStorageService.ts
        └── schemas.ts
```

**Rule**: Tests are **co-located** with source files in `__tests__/` directories.

---

## Writing Tests

### Pattern 1: Simple Unit Test

```typescript
// features/categories/lib/__tests__/CategoryStorageService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryStorageService } from '../CategoryStorageService';
import { createCategory } from './fixtures';

describe('CategoryStorageService', () => {
  let service: CategoryStorageService;

  beforeEach(() => {
    service = new CategoryStorageService();
    localStorage.clear(); // Reset between tests
  });

  it('should create and retrieve category', () => {
    const category = createCategory({ name: 'Food' });

    service.create(category);

    const retrieved = service.getById(category.id);
    expect(retrieved).toEqual(category);
  });

  it('should throw on duplicate ID', () => {
    const category = createCategory();

    service.create(category);

    expect(() => service.create(category))
      .toThrow('Category with id already exists');
  });
});
```

### Pattern 2: Testing Calculations (90%+ coverage required)

```typescript
// features/budgets/lib/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest'; // Property-based testing
import { calculateBudgetProgress, adjustBudgetForRollover } from '../calculations';
import { createDate, addMonths } from '@/tests/fixtures/date-utils';
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

describe('calculateBudgetProgress', () => {
  // ========================================
  // Example-based tests (document behavior)
  // ========================================

  it('should return 0% when nothing spent', () => {
    expect(calculateBudgetProgress(50000, 0)).toBe(0);
  });

  it('should return 100% when fully spent', () => {
    expect(calculateBudgetProgress(50000, 50000)).toBe(100);
  });

  it('should return >100% when overspent', () => {
    expect(calculateBudgetProgress(50000, 75000)).toBe(150);
  });

  // Edge cases
  it('should handle zero budget', () => {
    expect(calculateBudgetProgress(0, 0)).toBe(0);
  });

  it('should throw on negative budget', () => {
    expect(() => calculateBudgetProgress(-1000, 500))
      .toThrow('Budget amount must be positive');
  });

  // ========================================
  // Property-based tests (find edge cases)
  // ========================================

  test.prop([
    fc.integer({ min: 1, max: 1000000 }),
    fc.integer({ min: 0, max: 2000000 }),
  ])('progress should always be non-negative', (budget, spent) => {
    const progress = calculateBudgetProgress(budget, spent);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  test.prop([
    fc.integer({ min: 1, max: 1000000 }),
  ])('progress should be 100% when spent equals budget', (amount) => {
    expect(calculateBudgetProgress(amount, amount)).toBe(100);
  });
});

describe('adjustBudgetForRollover', () => {
  // ADR-003: Date.setMonth() boundary handling
  it('should handle Jan 31 → Feb correctly', () => {
    const jan31 = createDate(2025, 1, 31);
    const result = adjustBudgetForRollover(jan31, 50000, 10000);

    expect(result.newStartDate).toBe('2025-02-28'); // Feb has 28 days
  });

  it('should handle Feb 29 → Mar in leap year', () => {
    const feb29 = createDate(2024, 2, 29); // 2024 is leap year
    const result = adjustBudgetForRollover(feb29, 50000, 10000);

    expect(result.newStartDate).toBe('2024-03-29');
  });

  it('should handle year rollover (Dec → Jan)', () => {
    const dec31 = createDate(2024, 12, 31);
    const result = adjustBudgetForRollover(dec31, 50000, 10000);

    expect(result.newStartDate).toBe('2025-01-31');
  });
});
```

### Pattern 3: Testing Zod Schemas

```typescript
// features/categories/lib/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { categorySchema } from '../schemas';
import { createCategory } from './fixtures';
import { expectZodSuccess, expectZodFailure } from '@/tests/fixtures/assertion-utils';
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

describe('categorySchema', () => {
  // Valid cases
  it('should validate valid category', () => {
    const category = createCategory();
    expectZodSuccess(categorySchema, category);
  });

  it('should allow custom categories', () => {
    const category = createCategory({ isCustom: true });
    expectZodSuccess(categorySchema, category);
  });

  // Invalid cases (negative testing)
  it('should reject missing required fields', () => {
    expectZodFailure(categorySchema, { name: 'Food' }, 'id');
    expectZodFailure(categorySchema, { id: '1' }, 'name');
  });

  it('should reject invalid color format', () => {
    const category = createCategory({ color: 'not-a-color' });
    expectZodFailure(categorySchema, category, 'color');
  });

  it('should reject negative budget', () => {
    const category = createCategory({ budget: -1000 });
    expectZodFailure(categorySchema, category, 'budget');
  });

  // Test all invalid colors
  sharedFixtures.colors.invalid.forEach(color => {
    it(`should reject invalid color: ${color}`, () => {
      const category = createCategory({ color });
      expectZodFailure(categorySchema, category);
    });
  });
});
```

### Pattern 4: Testing Storage Services

```typescript
// features/budgets/lib/__tests__/BudgetStorageService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetStorageService } from '../BudgetStorageService';
import { createBudget, BudgetBuilder } from './fixtures';
import { expectStorageKey, expectStorageSize } from '@/tests/fixtures/assertion-utils';

describe('BudgetStorageService', () => {
  let service: BudgetStorageService;

  beforeEach(() => {
    service = new BudgetStorageService();
    localStorage.clear();
  });

  describe('CRUD Operations', () => {
    it('should create budget', () => {
      const budget = createBudget();

      const result = service.create(budget);

      expect(result).toEqual(budget);
      expectStorageKey('budgets');
    });

    it('should read budget by ID', () => {
      const budget = createBudget();
      service.create(budget);

      const result = service.getById(budget.id);

      expect(result).toEqual(budget);
    });

    it('should update budget', () => {
      const budget = createBudget({ amount: 50000 });
      service.create(budget);

      const updated = service.update(budget.id, { amount: 75000 });

      expect(updated.amount).toBe(75000);
    });

    it('should delete budget', () => {
      const budget = createBudget();
      service.create(budget);

      service.delete(budget.id);

      expect(service.getById(budget.id)).toBeNull();
    });

    it('should list all budgets', () => {
      const budget1 = createBudget({ amount: 50000 });
      const budget2 = createBudget({ amount: 75000 });
      service.create(budget1);
      service.create(budget2);

      const budgets = service.list();

      expect(budgets).toHaveLength(2);
      expect(budgets).toContainEqual(budget1);
      expect(budgets).toContainEqual(budget2);
    });
  });

  describe('Edge Cases', () => {
    it('should throw on duplicate ID', () => {
      const budget = createBudget();
      service.create(budget);

      expect(() => service.create(budget))
        .toThrow('Budget with id already exists');
    });

    it('should handle missing budget', () => {
      expect(service.getById('nonexistent')).toBeNull();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('budgets', 'invalid json');

      expect(() => service.list())
        .toThrow('Failed to parse budgets from storage');
    });

    it('should handle quota exceeded error', () => {
      const largeData = 'x'.repeat(5 * 1024 * 1024 + 1); // >5MB
      const budget = createBudget({ notes: largeData } as any);

      expect(() => service.create(budget))
        .toThrow('QuotaExceededError');
    });
  });
});
```

---

## Using Test Fixtures

### Creating Fixtures

```typescript
// features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
import { v4 as uuid } from 'uuid';
import type { Budget } from '../../types';
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

// Simple factory function
export const createBudget = (overrides?: Partial<Budget>): Budget => ({
  id: uuid(),
  categoryId: sharedFixtures.ids.categoryId1,
  amount: 50000, // $500.00
  period: 'monthly',
  startDate: sharedFixtures.dates.jan1.toISOString(),
  rollover: false,
  spent: 0,
  remaining: 50000,
  ...overrides,
});

// Builder pattern for complex scenarios
export class BudgetBuilder {
  private budget: Budget;

  constructor() {
    this.budget = createBudget();
  }

  withAmount(amount: number): this {
    this.budget.amount = amount;
    this.budget.remaining = amount - this.budget.spent;
    return this;
  }

  withSpent(spent: number): this {
    this.budget.spent = spent;
    this.budget.remaining = this.budget.amount - spent;
    return this;
  }

  withRollover(rollover: boolean): this {
    this.budget.rollover = rollover;
    return this;
  }

  build(): Budget {
    return { ...this.budget };
  }
}

// Trait variations
export const createOverspentBudget = () =>
  new BudgetBuilder()
    .withAmount(50000)
    .withSpent(75000) // Spent more than budget
    .build();

export const createUnderbudget = () =>
  new BudgetBuilder()
    .withAmount(100000)
    .withSpent(25000) // Well under budget
    .build();
```

### Using Fixtures in Tests

```typescript
import { createBudget, BudgetBuilder, createOverspentBudget } from './fixtures';

// Simple usage
const budget = createBudget({ amount: 100000 });

// Builder usage
const complexBudget = new BudgetBuilder()
  .withAmount(100000)
  .withSpent(75000)
  .withRollover(true)
  .build();

// Trait usage
const overbudget = createOverspentBudget();
```

---

## Common Patterns

### 1. Testing Error Handling

```typescript
it('should throw on invalid input', () => {
  expect(() => calculateBudgetProgress(-1000, 500))
    .toThrow('Budget amount must be positive');
});

it('should return error result (not throw)', () => {
  const result = service.update('nonexistent', { amount: 1000 });
  expect(result.success).toBe(false);
  expect(result.error).toBe('Budget not found');
});
```

### 2. Testing Async Operations

```typescript
it('should save budget asynchronously', async () => {
  const budget = createBudget();

  await service.saveAsync(budget);

  const retrieved = await service.getByIdAsync(budget.id);
  expect(retrieved).toEqual(budget);
});
```

### 3. Testing Date Boundaries (ADR-003)

```typescript
import { createDate, addMonths } from '@/tests/fixtures/date-utils';

it('should handle month boundary correctly', () => {
  const jan31 = createDate(2025, 1, 31);
  const result = addMonths(jan31, 1);

  // Feb only has 28 days, should be Feb 28 (not Mar 3)
  expect(result.getUTCDate()).toBe(28);
  expect(result.getUTCMonth()).toBe(1); // February
});
```

### 4. Testing with Shared Fixtures

```typescript
import { sharedFixtures } from '@/tests/fixtures/shared-fixtures';

it('should use deterministic dates', () => {
  const jan31 = sharedFixtures.dates.jan31;
  const budget = createBudget({ startDate: jan31.toISOString() });

  expect(budget.startDate).toBe('2025-01-31T00:00:00.000Z');
});

it('should use deterministic IDs', () => {
  const categoryId = sharedFixtures.ids.categoryId1;
  const budget = createBudget({ categoryId });

  expect(budget.categoryId).toBe(categoryId);
});
```

---

## Debugging Tests

### 1. Run Specific Test

```bash
# Run single test file
npm test calculations.test.ts

# Run single test block (use .only)
describe.only('calculateBudgetProgress', () => {
  // Only this block runs
});

# Run single test (use it.only)
it.only('should calculate 50%', () => {
  // Only this test runs
});
```

### 2. Debug with Console

```typescript
it('should debug calculation', () => {
  const result = calculateBudgetProgress(50000, 25000);

  console.log('Result:', result);
  console.log('localStorage:', localStorage);

  expect(result).toBe(50);
});
```

### 3. Debug with VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:watch"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 4. Check Coverage for Specific File

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Check specific file in terminal
cat coverage/coverage-summary.json | jq '.["src/features/budgets/lib/calculations.ts"]'
```

---

## Best Practices

### ✅ DO

1. **Test public APIs only**: Don't test private methods or implementation details
2. **Use fixtures**: Reuse test data with factories and builders
3. **Test edge cases**: Month boundaries, zero amounts, null values, etc.
4. **Write descriptive test names**: "should calculate 50% when half spent" not "test1"
5. **Reset state between tests**: Use `beforeEach` to clear localStorage, reset mocks
6. **Keep tests fast**: 2,500 LOC should run in <15 seconds
7. **Use property-based testing**: For calculations (fast-check)
8. **Follow AAA pattern**: Arrange, Act, Assert

### ❌ DON'T

1. **Don't test implementation details**: Internal state, private methods
2. **Don't copy-paste test data**: Use fixtures instead
3. **Don't use real localStorage**: Use mocks (already configured)
4. **Don't skip edge cases**: Test boundaries, invalid inputs, errors
5. **Don't write slow tests**: Avoid setTimeout, real API calls, file I/O
6. **Don't test frameworks**: Don't test React, Zod, localStorage—test YOUR code
7. **Don't use magic numbers**: Use shared fixtures for amounts, dates, IDs

---

## Checklist for New Tests

Before creating a PR with new tests:

- [ ] Tests are co-located in `__tests__/` directory
- [ ] Fixtures are in `__tests__/fixtures/` subdirectory
- [ ] Tests cover happy path (valid inputs)
- [ ] Tests cover edge cases (boundaries, null, invalid)
- [ ] Tests cover error handling (throw or return error)
- [ ] Financial calculations have 90%+ coverage (if applicable)
- [ ] Business logic has 80%+ coverage (if applicable)
- [ ] Tests run in <15 seconds (check with `npm test`)
- [ ] Coverage report shows green (check with `npm run test:coverage`)
- [ ] No console.log left in code (debug statements removed)
- [ ] Test names are descriptive ("should X when Y")
- [ ] Fixtures use shared data (sharedFixtures.dates, ids, amounts)

---

## Getting Help

### 1. Check Existing Tests

Look at `frontend/src/features/archive/lib/__tests__/` for examples:
- `ArchiveService.test.ts` - CRUD operations
- `ArchiveStorage.test.ts` - localStorage interaction
- `validation.test.ts` - Zod schema testing
- `performance.test.ts` - Performance benchmarks

### 2. Read Documentation

- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest API](https://vitest.dev/api/)
- [fast-check Guide](https://fast-check.dev/)
- [ADR-003: Date Arithmetic](../../docs/architecture/decisions/003-date-arithmetic-setmonth-boundary-handling.md)

### 3. Ask for Review

Tag tests in PR description:
```markdown
## Tests Added
- [ ] calculations.test.ts (90% coverage)
- [ ] BudgetStorageService.test.ts (85% coverage)
- [ ] schemas.test.ts (95% coverage)
```

---

## Next Steps

1. ✅ **Quickstart Complete**: You can now write business logic tests
2. ⏳ **Phase 2 Next**: Run `/speckit.tasks` to generate executable task breakdown
3. ⏳ **Implementation**: Start with P1 features (financial calculations, storage services)
4. ⏳ **CI/CD Integration**: Configure GitHub Actions coverage gates

**Happy Testing!** 🧪
