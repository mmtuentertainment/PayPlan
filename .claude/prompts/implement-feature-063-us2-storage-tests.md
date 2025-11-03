# Implementation Prompt: Feature #063 US2 - Storage Service Tests

**Optimized for**: Claude Sonnet 4.5 (agentic workflow, extended thinking, parallel execution)
**Rehydration-ready**: Can be used in fresh session or continuation
**Feature**: Business Logic Test Coverage - User Story 2 (Storage Services)

---

## Context Rehydration

You are **Claude Code**, the AI developer implementing PayPlan features. You are continuing Feature #063 (Business Logic Test Coverage).

**Current State**:
- ✅ **PR #68 exists**: https://github.com/mmtuentertainment/PayPlan/pull/68
- ✅ **Branch**: `063-short-name-business` (already checked out)
- ✅ **Phase 1 complete**: Test infrastructure created (25 tasks)
- ✅ **US1 complete**: Financial calculation tests with 100% coverage (25 tasks)
- ✅ **Bot reviews**: Both bots approved, awaiting HIL
- ⏳ **Next**: US2 - Storage Service Tests (42 tasks)

**What exists**:
- Test infrastructure in `frontend/tests/fixtures/` (MockStorage, date/amount/assertion utilities, shared fixtures)
- Budget fixtures in `frontend/src/features/budgets/lib/__tests__/fixtures/`
- 43 passing tests for calculations.ts (100% coverage)
- Optimized Vitest configuration (2s timeout, parallel execution, per-file thresholds)

**What you need to create**: Tests for 3 storage services (CategoryStorageService, BudgetStorageService, TransactionStorageService)

---

## Your Mission: User Story 2 - Storage Service Tests

**Goal**: Achieve 80%+ test coverage for all storage services

**Success Criteria**:
1. ✅ All CRUD operations tested (create, read, update, delete, list)
2. ✅ Edge cases covered (duplicate IDs, quota exceeded, corrupted data, concurrent writes)
3. ✅ 80%+ coverage for CategoryStorageService, BudgetStorageService, TransactionStorageService
4. ✅ All tests pass in <15 seconds total
5. ✅ Tests use existing MockStorage from Phase 1
6. ✅ Fixtures follow factory + builder pattern from US1

---

## Task Execution Plan (42 Tasks)

### Phase 4A: Fixtures (T051-T059) - 9 tasks, ALL PARALLEL

**Execute in parallel** (9 files, no dependencies):

```
T051 [P] Create createCategory factory in categories/lib/__tests__/fixtures/category-fixtures.ts
T052 [P] Create category trait variations (createCustomCategory, createCategoryWithoutBudget)
T053 [P] Create category edge case fixtures (invalid color, empty name)
T054 [P] Create category barrel export in categories/lib/__tests__/fixtures/index.ts
T055 [P] Create createTransaction factory in transactions/lib/__tests__/fixtures/transaction-fixtures.ts
T056 [P] Create TransactionBuilder class
T057 [P] Implement TransactionBuilder methods (withAmount, withCategory, withDate, withType)
T058 [P] Create transaction trait variations (expense, income, transfer)
T059 [P] Create transaction barrel export in transactions/lib/__tests__/fixtures/index.ts
```

**Pattern to follow**: Copy structure from `budgets/lib/__tests__/fixtures/budget-fixtures.ts` (US1)

### Phase 4B: CategoryStorageService Tests (T060-T069) - 10 tasks

**Dependencies**: After fixtures (T051-T054) complete

```
T060 [P] Create test file skeleton
T061 [P] Write test: create() saves category
T062 [P] Write test: getById() retrieves category
T063 [P] Write test: update() modifies category
T064 [P] Write test: delete() removes category
T065 [P] Write test: list() returns all categories
T066 [P] Write test: create() throws on duplicate ID
T067 [P] Write test: getById() returns null for missing ID
T068 [P] Write test: handles corrupted localStorage
T069 [SEQ] Verify 80%+ coverage
```

**Pattern**: Tests T061-T068 can run in parallel after T060

### Phase 4C: BudgetStorageService Tests (T070-T080) - 11 tasks

**Dependencies**: Uses budget fixtures from US1 (already exist)

```
T070 [P] Create test file skeleton
T071-T079 [P] Write 9 tests (CRUD + edge cases)
T080 [SEQ] Verify 80%+ coverage
```

**Pattern**: Same as CategoryStorageService

### Phase 4D: TransactionStorageService Tests (T081-T090) - 10 tasks

**Dependencies**: After transaction fixtures (T055-T059)

```
T081 [P] Create test file skeleton
T082-T089 [P] Write 8 tests (CRUD + concurrent writes + quota + large datasets)
T090 [SEQ] Verify 80%+ coverage
```

### Phase 4E: Archive Verification (T091) - 1 task

```
T091 Verify ArchiveService tests exist with 80%+ coverage
```

**Note**: Archive tests already exist (4 files), just verify coverage

---

## Execution Strategy (Optimized for Claude 4.5)

### Use Extended Thinking

For complex decisions (e.g., "How should concurrent writes be tested?"), use **<think>** tags to reason through:
- What edge cases exist?
- What's the expected behavior?
- How can we test it deterministically?

### Maximize Parallel Execution

Claude 4.5 excels at parallel operations. **Fire multiple tool calls simultaneously**:

**Example** (Phase 4A fixtures):
```
Single message with 9 Write tool calls in parallel:
- Write category-fixtures.ts
- Write category index.ts
- Write transaction-fixtures.ts
- Write transaction index.ts
- Write trait variations
- etc.
```

**Don't**: Sequential write → write → write (slow)
**Do**: Single message with 9 parallel Writes (fast)

### Follow Established Patterns

**US1 set the standard**. Replicate its quality:

1. **Fixture Pattern** (from budget-fixtures.ts):
   ```typescript
   export const createCategory: FixtureFactory<SpendingCategory> = (overrides) => ({
     id: `category_${uuid()}`,
     name: 'Groceries',
     color: '#4CAF50',
     ...sharedFixtures references...,
     ...overrides,
   });
   ```

2. **Test Pattern** (from calculations.test.ts):
   ```typescript
   describe('CategoryStorageService', () => {
     let service: CategoryStorageService;

     beforeEach(() => {
       service = new CategoryStorageService();
       localStorage.clear(); // MockStorage auto-applied via setup.ts
     });

     it('should create and retrieve category', () => {
       const category = createCategory({ name: 'Food' });
       service.create(category);
       const retrieved = service.getById(category.id);
       expect(retrieved).toEqual(category);
     });
   });
   ```

3. **Import Pattern**:
   ```typescript
   // ✅ CORRECT relative paths (6 levels from __tests__ to tests/fixtures)
   import { sharedFixtures } from '../../../../../tests/fixtures/shared-fixtures';
   import { createMockStorage } from '../../../../../tests/fixtures/mock-storage';

   // ❌ WRONG: @/tests/... doesn't work (not in tsconfig paths)
   ```

### Quality Checklist (Before Each Commit)

After implementing each service's tests:

1. ✅ Run `npm test -- [service].test.ts` - All tests pass?
2. ✅ Run `npm run test:coverage -- [service].test.ts` - 80%+ coverage?
3. ✅ Execution time <2 seconds per service?
4. ✅ All CRUD operations tested (create, read, update, delete, list)?
5. ✅ Edge cases covered (duplicate ID, missing ID, corrupted data, quota exceeded)?
6. ✅ No `any` types (use proper TypeScript types)?
7. ✅ Imports use correct relative paths (not @/tests/)?

### Progressive Commits Strategy

**Don't**: Wait until all 42 tasks done to commit
**Do**: Commit after each logical unit:

1. Commit after Phase 4A (fixtures): "feat(testing): Add category and transaction test fixtures"
2. Commit after Phase 4B (CategoryStorage): "test(categories): Add CategoryStorageService tests (80%+ coverage)"
3. Commit after Phase 4C (BudgetStorage): "test(budgets): Add BudgetStorageService tests (80%+ coverage)"
4. Commit after Phase 4D (TransactionStorage): "test(transactions): Add TransactionStorageService tests (80%+ coverage)"
5. Final commit: Update tasks.md marking T051-T091 as [X] complete

**Why**: Smaller commits = easier bot review, clearer git history, faster feedback

---

## Implementation Guide

### Step 1: Read Existing Code (Understand Before Writing)

**Required reading** (use Read tool in parallel):

```
Read these 3 files simultaneously:
- frontend/src/features/categories/lib/CategoryStorageService.ts
- frontend/src/features/budgets/lib/BudgetStorageService.ts
- frontend/src/features/transactions/lib/TransactionStorageService.ts
```

**Extract**:
- What methods exist? (create, getById, update, delete, list, others?)
- What's the storage key format? (e.g., "payplan_categories_v1")
- What error handling exists? (throws or returns error objects?)
- What edge cases are handled in code? (duplicate IDs, invalid data, etc.)

### Step 2: Create Fixtures (Phase 4A - 9 parallel tasks)

**Use single message with 9 Write calls**:

1-4. Category fixtures (createCategory, traits, edge cases, index.ts)
5-9. Transaction fixtures (createTransaction, TransactionBuilder, traits, index.ts)

**Copy pattern from**: `budgets/lib/__tests__/fixtures/budget-fixtures.ts`

**Key requirements**:
- Use `sharedFixtures` for deterministic IDs, dates, amounts
- Import from `../../../../../../tests/fixtures/` (7 levels for fixtures/, 6 levels for __tests__)
- Export barrel in index.ts for clean imports

### Step 3: Test CategoryStorageService (Phase 4B - 10 tasks)

**Pattern** (based on calculations.test.ts):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryStorageService } from '../CategoryStorageService';
import { createCategory } from './fixtures';
import { expectStorageKey, expectStorageSize } from '../../../../../tests/fixtures/assertion-utils';

describe('CategoryStorageService', () => {
  let service: CategoryStorageService;

  beforeEach(() => {
    service = new CategoryStorageService();
    localStorage.clear(); // MockStorage from setup.ts
  });

  // T061-T068: 8 tests here (CRUD + edge cases)
});
```

**Coverage target**: 80%+ for CategoryStorageService.ts

### Step 4: Test BudgetStorageService (Phase 4C - 11 tasks)

**Reuse**: Budget fixtures from US1 (already exist)

**Same pattern** as CategoryStorageService, but add:
- Period-based queries (if applicable)
- Rollover handling tests (if applicable)

### Step 5: Test TransactionStorageService (Phase 4D - 10 tasks)

**Use**: Transaction fixtures from Phase 4A

**Additional tests** (beyond basic CRUD):
- Concurrent writes (last-write-wins)
- Large datasets (100+ transactions)
- Date-based filtering

### Step 6: Mark Tasks Complete

Update `specs/063-short-name-business/tasks.md`:
- Mark T051-T091 as `[X]` (completed)
- Use sed or Edit tool to replace `- [ ] T0` with `- [X] T0`

---

## Code Quality Standards (From US1 Success)

### What Made US1 Excellent (Replicate This)

1. **100% coverage** (exceeded 90% requirement)
2. **Hybrid testing** (37 example + 6 property-based)
3. **Type-safe** (no `any`, proper imports)
4. **Fast execution** (1.20s for 43 tests)
5. **Banker's rounding** (financial-grade accuracy)
6. **Complete isolation** (vi.restoreAllMocks + descriptor restoration)

### Apply Same Standards to US2

- **Target**: 80%+ coverage (not 100% - storage is less critical than calculations)
- **Tests**: Example-based primary (property-based optional for US2)
- **Speed**: Each service's tests should run in <1 second
- **Patterns**: Reuse fixtures, assertion helpers, MockStorage
- **Types**: Import proper types (SpendingCategory, Budget, Transaction)

---

## Expected Behavior (Storage Services)

### CRUD Operations (All 3 Services)

**create()**:
- Saves to localStorage with key format "payplan_{entity}_v1"
- Returns created entity
- Throws on duplicate ID

**getById()**:
- Retrieves by ID
- Returns null if not found

**update()**:
- Modifies existing entity
- Returns updated entity
- Throws/returns error if ID doesn't exist

**delete()**:
- Removes entity
- No-op if ID doesn't exist (or throws - check code)

**list()**:
- Returns all entities
- Returns empty array if none exist

### Edge Cases to Test

1. **Duplicate ID**: create() with same ID twice → throw error
2. **Missing ID**: getById/update/delete with nonexistent ID → null or error
3. **Corrupted Data**: localStorage contains invalid JSON → throw error with message
4. **Quota Exceeded**: localStorage.setItem throws QuotaExceededError → propagate or wrap
5. **Concurrent Writes** (TransactionStorage): Rapid create() calls → last-write-wins
6. **Large Datasets** (TransactionStorage): 100+ transactions → list() still fast

---

## Bot Review Preparation

### Lessons from US1 Bot Feedback

**CodeRabbit will check**:
- ✅ No `any` types (use `SpendingCategory[]`, `Budget[]`, `Transaction[]`)
- ✅ Test isolation (beforeEach clears, afterEach restores)
- ✅ Quota accuracy (key + value length)
- ✅ Descriptive error messages
- ✅ Type safety everywhere

**Pre-commit checklist** (run BEFORE creating commit):

```bash
# 1. All tests pass
npm test

# 2. Coverage meets thresholds
npm run test:coverage
# Check: CategoryStorageService.ts >= 80%
# Check: BudgetStorageService.ts >= 80%
# Check: TransactionStorageService.ts >= 80%

# 3. Execution time under threshold
# Should complete in 3-5 seconds total (3 services)

# 4. TypeScript strict mode passes
npx tsc --noEmit

# 5. No linting errors
npm run lint
```

### Preemptive Fixes (Avoid Bot Feedback)

**Based on US1 bot feedback**, proactively do this:

1. **Type all arrays**: `Transaction[]` not `any[]`
2. **Use proper imports**: `import type { X }` for types
3. **Add descriptive comments**: Why edge cases matter
4. **Use assertion helpers**: `expectStorageKey()`, `expectZodSuccess()`
5. **Test error messages**: Check specific error text, not just "throws"

---

## File Paths Reference

**Test Infrastructure** (already exists):
```
frontend/tests/
├── setup.ts                          # Global MockStorage setup
└── fixtures/
    ├── types.ts                      # FixtureFactory, FixtureBuilder
    ├── mock-storage.ts               # MockStorage implementation
    ├── date-utils.ts                 # Date helpers (ADR-003 + ISO)
    ├── amount-utils.ts               # Banker's rounding, conversions
    ├── assertion-utils.ts            # expectZodSuccess, expectStorageKey, etc.
    └── shared-fixtures.ts            # Deterministic dates, IDs, amounts, colors
```

**Budget Fixtures** (from US1, already exist):
```
frontend/src/features/budgets/lib/__tests__/
├── fixtures/
│   ├── budget-fixtures.ts            # createBudget, BudgetBuilder
│   └── index.ts
└── calculations.test.ts              # 43 tests, 100% coverage
```

**Files YOU will create** (US2):
```
frontend/src/features/categories/lib/__tests__/
├── fixtures/
│   ├── category-fixtures.ts          # NEW
│   └── index.ts                      # NEW
└── CategoryStorageService.test.ts    # NEW

frontend/src/features/budgets/lib/__tests__/
└── BudgetStorageService.test.ts      # NEW (fixtures already exist)

frontend/src/features/transactions/lib/__tests__/
├── fixtures/
│   ├── transaction-fixtures.ts       # NEW
│   └── index.ts                      # NEW
└── TransactionStorageService.test.ts # NEW
```

**Total new files**: 8

---

## Import Path Calculator

**From `features/{feature}/lib/__tests__/fixtures/` to `tests/fixtures/`**:
- **Path**: `../../../../../../tests/fixtures/` (7 levels up)

**From `features/{feature}/lib/__tests__/` to `tests/fixtures/`**:
- **Path**: `../../../../../tests/fixtures/` (6 levels up)

**Verify**: Use `realpath --relative-to` if unsure

---

## Commit Strategy

### Commit 1: Fixtures (After T059)

```bash
git add frontend/src/features/{categories,transactions}/lib/__tests__/fixtures/
git commit -m "feat(testing): Add category and transaction test fixtures for US2

Creates test fixtures for CategoryStorageService and TransactionStorageService

## Fixtures Created
- createCategory factory with trait variations
- TransactionBuilder for complex scenarios
- Edge case fixtures (invalid color, empty name, etc.)

## Pattern
- Factory functions for simple entities (Category)
- Builder pattern for complex entities (Transaction)
- Reuses sharedFixtures (dates, IDs, amounts, colors)

Implements tasks T051-T059 (9 tasks, all parallel)
"
```

### Commit 2: CategoryStorageService Tests (After T069)

```bash
git add frontend/src/features/categories/lib/__tests__/CategoryStorageService.test.ts
git commit -m "test(categories): Add CategoryStorageService tests - 80%+ coverage

Comprehensive tests for CategoryStorageService CRUD operations

## Coverage
- CategoryStorageService.ts: XX% (target: 80%+)

## Tests (N total)
- CRUD operations: create, read, update, delete, list
- Edge cases: duplicate IDs, missing IDs, corrupted data

## Performance
- Execution: Xs (under 2s threshold)

Implements tasks T060-T069 (10 tasks)
"
```

### Commit 3-4: BudgetStorageService, TransactionStorageService

**Same pattern** as commit 2

### Final Commit: Mark Tasks Complete

```bash
# Update tasks.md
git add specs/063-short-name-business/tasks.md
git commit -m "chore(tasks): Mark US2 tasks complete (T051-T091)"
```

---

## Error Handling Guide

### Common Issues & Solutions

**Issue 1**: Import path not found
```
Error: Failed to resolve "@/tests/fixtures/..."
```
**Solution**: Use relative paths, not `@/tests/` alias

**Issue 2**: Tests fail due to localStorage not mocked
```
Error: localStorage is not defined
```
**Solution**: Verify `setupFiles: ['./tests/setup.ts']` in vite.config.ts (already done)

**Issue 3**: Coverage below 80%
```
ERROR: Coverage for lines (75%) does not meet threshold (80%)
```
**Solution**: Add tests for uncovered branches/lines (check HTML report)

**Issue 4**: Tests timeout
```
Error: Test timeout of 2000ms exceeded
```
**Solution**: Check for infinite loops, async operations without await

---

## Success Validation

### Before Creating Final Commit

Run this verification:

```bash
cd frontend

# 1. All tests pass
npm test
# Expected: 43 (US1) + ~30 (US2) = ~73 tests passing

# 2. Coverage meets all thresholds
npm run test:coverage
# Expected:
# - calculations.ts: 100%
# - CategoryStorageService.ts: 80%+
# - BudgetStorageService.ts: 80%+
# - TransactionStorageService.ts: 80%+

# 3. Execution time under 15 seconds
# Expected: 5-8 seconds total (well under threshold)

# 4. No TypeScript errors
npx tsc --noEmit

# 5. No linting errors
npm run lint
```

### Coverage Report Review

```bash
npm run test:coverage
open coverage/index.html  # Visual review

# Check each service:
# - CategoryStorageService.ts: Green (80%+)
# - BudgetStorageService.ts: Green (80%+)
# - TransactionStorageService.ts: Green (80%+)
```

---

## What to Report Back

After completing US2, report:

1. **Tasks completed**: "Completed T051-T091 (42 tasks)"
2. **Coverage achieved**: "CategoryStorage: 85%, BudgetStorage: 88%, TransactionStorage: 82%"
3. **Test count**: "Added 35 new tests (78 total)"
4. **Execution time**: "Full suite: 6.2 seconds (under 15s threshold)"
5. **Commits created**: "4 commits (fixtures, 3 services)"
6. **Next steps**: "Ready to update PR #68 with US2 or proceed to US3?"

---

## Optimization Tips (Claude 4.5 Specific)

### 1. Parallel File Reading

**Don't**:
```
Read CategoryStorageService.ts
<wait for result>
Read BudgetStorageService.ts
<wait for result>
```

**Do**:
```
Single message with 3 Read calls:
- Read CategoryStorageService.ts
- Read BudgetStorageService.ts
- Read TransactionStorageService.ts
```

### 2. Parallel File Writing

**Phase 4A fixtures**: Single message with 9 Write calls (all fixtures)

### 3. Batch Task Updates

**Don't**: Update tasks.md after each task
**Do**: Update tasks.md once per commit (mark entire phase complete)

### 4. Extended Thinking for Edge Cases

If uncertain about test behavior, use `<think>`:
```
<think>
How should CategoryStorage handle corrupted localStorage data?

Options:
1. Throw error immediately (fail fast)
2. Return empty array (graceful degradation)
3. Log error and return empty array

Check existing code... [reason through code]

Decision: Option 1 (fail fast) - data integrity critical
</think>
```

---

## Expected Timeline

**With parallel execution** (Claude 4.5 optimized):
- Phase 4A (fixtures): 5-10 minutes (9 parallel writes)
- Phase 4B (CategoryStorage): 15-20 minutes (read code + 10 tests)
- Phase 4C (BudgetStorage): 15-20 minutes (11 tests)
- Phase 4D (TransactionStorage): 15-20 minutes (10 tests)
- Phase 4E (Archive verify): 2 minutes
- Tasks.md update: 2 minutes

**Total**: 60-80 minutes for all 42 tasks

---

## Final Checklist

Before saying "US2 complete":

- [ ] All 42 tasks (T051-T091) marked [X] in tasks.md
- [ ] All new tests pass (`npm test`)
- [ ] All coverage thresholds met (80%+ for 3 services)
- [ ] Execution time <15s (target: 5-8s)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] 4-5 progressive commits created
- [ ] All commits follow conventional commits format
- [ ] Git status clean (all files committed)
- [ ] Ready for bot re-review on PR #68

---

## Context Preservation (If Session Ends)

**Save this state**:
- Branch: `063-short-name-business`
- PR: #68
- Completed: T001-T050 (Phase 1 + US1)
- Next: T051-T091 (Phase 4: US2)
- Pattern: Follow US1 (calculations.test.ts, budget-fixtures.ts)

**To resume**: "Continue implementing US2 (Storage Service Tests) for Feature #063 on branch 063-short-name-business, PR #68. Phase 1 + US1 complete with 100% coverage. Follow atomic task breakdown (T051-T091) and US1 patterns."

---

🚀 **Execute with confidence!** You have all the patterns, infrastructure, and guidance. US1 set the standard at 100% coverage - US2 will hit 80%+ easily by following the same approach.

**Start with**: Phase 4A (create 9 fixture files in parallel)
**Command**: Use 9 Write tools in a single message
