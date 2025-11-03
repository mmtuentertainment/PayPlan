# Implementation Prompt: Feature #063 US3 - Schema Validation Tests

**Optimized for**: Claude Code (Sonnet 4.5)
**Feature**: Business Logic Test Coverage - User Story 3 (Schema Validation)
**Branch**: `063-us3-schema-tests` (new)
**Previous Work**: US1 (calculations) + US2 (storage) merged in PR #68

---

## Context Rehydration

You are **Claude Code**, implementing Feature #063 User Story 3 (Schema Validation Tests).

**What exists (merged in PR #68)**:
- ✅ Test infrastructure (MockStorage, fixtures, utilities)
- ✅ 43 calculation tests (100% coverage)
- ✅ 78 storage service tests (74-75% coverage)
- ✅ 14 realistic data tests (faker.js)
- ✅ All quality improvements from bot reviews

**What you need to create**: Tests for 3 Zod schema modules

---

## Your Mission: User Story 3 - Schema Validation Tests

**Goal**: Achieve 80%+ test coverage for all Zod validation schemas

**Success Criteria**:
1. ✅ All valid inputs pass validation
2. ✅ All invalid inputs fail with specific error messages
3. ✅ 80%+ coverage for all schema files
4. ✅ Edge cases tested (boundary values, special chars, etc.)
5. ✅ All tests pass in <5 seconds total
6. ✅ Tests use existing test infrastructure

---

## Task Execution Plan (27 Tasks)

### Phase 5A: Category Schema Tests (T092-T101) - 10 tasks

```
T092 Create test file skeleton: categories/lib/__tests__/schemas.test.ts
T093-T100 Write 8 validation tests:
  - Valid category (default + custom)
  - Missing fields (id, name, iconName, color)
  - Invalid color format (not hex, wrong length)
  - Invalid name (empty, >50 chars)
  - Invalid timestamps (not ISO 8601)
  - Edge cases (special chars, Unicode)
T101 Verify 80%+ coverage for categories/lib/schemas.ts
```

### Phase 5B: Budget Schema Tests (T102-T109) - 8 tasks

```
T102 Create test file skeleton: budgets/lib/__tests__/schemas.test.ts
T103-T108 Write 6 validation tests:
  - Valid budget (with/without rollover)
  - Invalid amount (negative, zero, non-integer)
  - Invalid period (wrong format, invalid month)
  - Invalid categoryId format
  - Boundary values (MAX_SAFE_INTEGER)
  - Date edge cases
T109 Verify 80%+ coverage for budgets/lib/schemas.ts
```

### Phase 5C: Transaction Schema Tests (T110-T118) - 9 tasks

```
T110 Create test file skeleton: transactions/lib/__tests__/schemas.test.ts
T111-T117 Write 7 validation tests:
  - Valid transaction (expense, income, transfer)
  - Invalid amount (negative, non-integer)
  - Missing/invalid categoryId
  - Invalid date format
  - Invalid description (empty, >200 chars)
  - Optional fields (categoryId can be undefined)
  - Edge cases (zero amount, Unicode)
T118 Verify 80%+ coverage for transactions/lib/schemas.ts
```

---

## Implementation Pattern

### Test Structure (Follow US1/US2 Pattern)

```typescript
// categories/lib/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  categorySchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  validateCategory,
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
} from '../schemas';
import { createCategory } from './fixtures';
import { expectZodSuccess, expectZodError } from '../../../../../tests/fixtures/assertion-utils';

describe('Category Schemas', () => {
  describe('categorySchema', () => {
    it('should validate complete category with all fields', () => {
      const category = createCategory();
      const result = categorySchema.safeParse(category);

      expectZodSuccess(result);
      expect(result.data).toEqual(category);
    });

    it('should reject category with missing id', () => {
      const invalid = { ...createCategory(), id: undefined };
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'id');
    });

    it('should reject invalid color format', () => {
      const invalid = createCategory({ color: 'not-a-hex-color' });
      const result = categorySchema.safeParse(invalid);

      expectZodError(result, 'color');
      expect(result.error?.issues[0].message).toContain('hex');
    });
  });

  describe('createCategoryInputSchema', () => {
    it('should validate create input', () => {
      const input = {
        name: 'Groceries',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodSuccess(result);
    });

    it('should reject empty name', () => {
      const input = {
        name: '',
        iconName: 'shopping-cart',
        color: '#22c55e',
      };

      const result = createCategoryInputSchema.safeParse(input);
      expectZodError(result, 'name');
    });
  });
});
```

### Use Existing Utilities

**Assertion helpers** (already exist):
```typescript
import { expectZodSuccess, expectZodError } from '../../../../../tests/fixtures/assertion-utils';
```

**Fixtures** (already exist):
```typescript
import { createCategory } from './fixtures';
import { createBudget } from './fixtures';
import { createTransaction } from './fixtures';
```

---

## Coverage Targets

Based on US2 success, use realistic thresholds:

**vite.config.ts additions**:
```typescript
'src/features/categories/lib/schemas.ts': {
  lines: 90,  // Schemas should be highly tested
  statements: 90,
  branches: 85,
  functions: 90,
},
'src/features/budgets/lib/schemas.ts': {
  lines: 90,
  statements: 90,
  branches: 85,
  functions: 90,
},
'src/features/transactions/lib/schemas.ts': {
  lines: 90,
  statements: 90,
  branches: 85,
  functions: 90,
},
```

**Rationale**: Schemas are pure validation logic (no browser APIs), so 90%+ is achievable.

---

## Execution Strategy

### 1. Read Existing Schemas

Read all 3 schema files to understand validation rules:
- `frontend/src/features/categories/lib/schemas.ts`
- `frontend/src/features/budgets/lib/schemas.ts`
- `frontend/src/features/transactions/lib/schemas.ts`

### 2. Create Tests (Parallel by Feature)

Create 3 test files in parallel:
- CategorySchema tests (10 tasks)
- BudgetSchema tests (8 tasks)
- TransactionSchema tests (9 tasks)

### 3. Progressive Commits

```
Commit 1: Category schema tests (T092-T101)
Commit 2: Budget schema tests (T102-T109)
Commit 3: Transaction schema tests (T110-T118)
Commit 4: Update tasks.md (T092-T118 complete)
```

### 4. Create PR

Title: "test(schemas): Add Zod schema validation tests - US3"
- Link to PR #68 (previous work)
- 27 new tests
- 90%+ coverage for all schemas
- <5s execution

---

## Expected Test Count

**Minimum**: 21 tests (7 per schema)
**Realistic**: 30-40 tests (comprehensive edge cases)
**Target**: 35 tests total

---

## Quality Checklist

Before each commit:
1. ✅ Run `npm test -- schemas.test.ts` - All pass?
2. ✅ Run `npm run test:coverage -- schemas` - 90%+ coverage?
3. ✅ Execution time <2s per schema file?
4. ✅ All edge cases covered (empty, null, invalid formats)?
5. ✅ Error messages tested (not just "fails")?
6. ✅ No `any` types?

---

## Common Schema Patterns to Test

### 1. Required vs Optional Fields

```typescript
// Test that optional fields work
it('should validate category without optional field', () => {
  const category = createCategory();
  delete category.budget; // If budget is optional

  const result = categorySchema.safeParse(category);
  expectZodSuccess(result);
});
```

### 2. String Validation

```typescript
// Min/max length
it('should reject name exceeding max length', () => {
  const category = createCategory({ name: 'A'.repeat(51) });
  const result = categorySchema.safeParse(category);

  expectZodError(result, 'name');
  expect(result.error?.issues[0].message).toContain('50');
});

// Regex patterns
it('should reject invalid color format', () => {
  const category = createCategory({ color: 'blue' }); // Not hex
  const result = categorySchema.safeParse(category);

  expectZodError(result, 'color');
});
```

### 3. Number Validation

```typescript
// Positive/negative
it('should reject negative budget amount', () => {
  const budget = createBudget({ amount: -1000 });
  const result = budgetSchema.safeParse(budget);

  expectZodError(result, 'amount');
});

// Integer validation
it('should reject decimal amount', () => {
  const budget = { ...createBudget(), amount: 100.50 };
  const result = budgetSchema.safeParse(budget);

  expectZodError(result, 'amount');
});
```

### 4. Date Validation

```typescript
// ISO 8601 format
it('should reject invalid date format', () => {
  const transaction = createTransaction({ date: '11/15/2025' }); // MM/DD/YYYY
  const result = transactionSchema.safeParse(transaction);

  expectZodError(result, 'date');
  expect(result.error?.issues[0].message).toContain('YYYY-MM-DD');
});
```

---

## Bot Review Preparation

**CodeRabbit will check** (based on US2 feedback):
- ✅ No `any` types
- ✅ Comprehensive edge cases
- ✅ Error messages tested (not just "fails")
- ✅ Use expectZodSuccess/expectZodError helpers
- ✅ Test both schema objects and validation functions

**Preemptive fixes**:
1. Import schemas using `import type` where possible
2. Test ALL validation functions (validateX, X.safeParse, etc.)
3. Document why certain error cases matter
4. Use descriptive test names

---

## Files You'll Create

**New test files** (3):
```
frontend/src/features/categories/lib/__tests__/schemas.test.ts
frontend/src/features/budgets/lib/__tests__/schemas.test.ts
frontend/src/features/transactions/lib/__tests__/schemas.test.ts
```

**Modified files** (2):
```
frontend/vite.config.ts (add schema coverage thresholds)
specs/063-short-name-business/tasks.md (mark T092-T118 complete)
```

---

## Success Validation

Before creating PR:

```bash
# 1. All schema tests pass
npm test -- schemas.test.ts
# Expected: ~35 tests passing

# 2. Coverage meets 90%+ threshold
npm run test:coverage
# Expected: All schema files 90%+

# 3. Execution time under threshold
# Expected: <5s for all 3 schema files

# 4. No TypeScript errors
npx tsc --noEmit

# 5. No linting errors
npm run lint
```

---

## What to Report Back

After completing US3:

1. **Tasks completed**: "Completed T092-T118 (27 tasks)"
2. **Coverage achieved**: "CategorySchema: 95%, BudgetSchema: 92%, TransactionSchema: 94%"
3. **Test count**: "Added 35 schema tests (170 total in suite)"
4. **Execution time**: "Full suite: 8-10 seconds"
5. **Commits created**: "3 commits (category, budget, transaction schemas)"
6. **Next steps**: "Ready to create PR or proceed to US4?"

---

## Context Preservation

**If session ends, save this state**:
- Branch: `063-us3-schema-tests`
- Completed: US1 (calculations) + US2 (storage) merged
- Next: T092-T118 (Phase 5: Schema Validation)
- Pattern: Follow US1/US2 quality standards

**To resume**: "Continue implementing US3 (Schema Validation Tests) for Feature #063 on branch 063-us3-schema-tests. US1+US2 merged in PR #68. Follow atomic task breakdown (T092-T118)."

---

## Quick Start Command

```bash
# Start US3 implementation
git checkout 063-us3-schema-tests

# Read schemas to understand validation rules
cat frontend/src/features/categories/lib/schemas.ts
cat frontend/src/features/budgets/lib/schemas.ts
cat frontend/src/features/transactions/lib/schemas.ts

# Create test files (3 in parallel)
# Follow US2 pattern: Read schema → Write tests → Verify coverage → Commit
```

---

**Expected timeline**: 90-120 minutes for 27 tasks (faster than US2 - simpler validation testing)

🚀 **Execute with the same excellence as US2!** Follow established patterns, maintain quality standards, proactively address bot feedback.
