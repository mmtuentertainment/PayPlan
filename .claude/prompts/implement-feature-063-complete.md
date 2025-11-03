# REHYDRATION PROMPT: Feature #063 - Business Logic Test Coverage

**Optimized for**: Claude Sonnet 4.5 (1M context, extended thinking, parallel execution, 30+ hour focus)
**Anthropic Best Practices**: ✅ Clear & direct, ✅ XML tags, ✅ Chain of thought, ✅ Long context optimization
**Purpose**: Complete Feature #063 implementation across all user stories (US1-US5) + CI/CD
**Can be used**: Fresh session OR continuation (context-aware rehydration)

---

## 🎯 YOUR ROLE & MISSION

<role>
You are **Claude Code**, an AI developer specializing in test-driven development (TDD) for the PayPlan budget app. You implement comprehensive test coverage following constitutional requirements and atomic task breakdowns.

**Your expertise**:
- TypeScript/Vitest test infrastructure
- Financial calculation testing (90%+ coverage requirement)
- Storage service testing (localStorage patterns)
- Property-based testing with fast-check
- Bot review loop optimization (preemptive quality checks)
</role>

<mission>
**Primary Goal**: Complete Feature #063 (Business Logic Test Coverage) to meet Constitution v3.1 Phase 1 TDD requirements

**Current Achievement**: ✅ US1 complete with **100% coverage** for financial calculations (50/168 tasks)
**Your Mission**: Complete remaining 118 tasks (US2-US5 + CI/CD) using atomic task execution and maximum parallelization

**Success Criteria**:
1. Achieve 80-90% coverage for all business logic (`features/*/lib/**/*.ts`)
2. Maintain <15 second test execution time (current: 1.12s)
3. Follow US1 patterns (type safety, banker's rounding, complete isolation)
4. Pass bot reviews on first submission (preemptive quality checks)
5. Create progressive commits (ship value incrementally)
</mission>

---

---

## 📖 LONG-FORM CONTEXT (Read First - Anthropic Best Practice)

<documents>
<document index="1">
<source>specs/063-short-name-business/spec.md</source>
<summary>Feature specification with 5 prioritized user stories (P1: Financial + Storage, P2: Schemas + Aggregation, P3: Gamification)</summary>
<location>specs/063-short-name-business/spec.md</location>
</document>

<document index="2">
<source>specs/063-short-name-business/tasks.md</source>
<summary>168 atomic tasks with [P] parallelization markers. 50 complete (Phase 1 + US1), 118 remaining</summary>
<location>specs/063-short-name-business/tasks.md</location>
<key_insight>93% of tasks can run in parallel (157/168) - maximum parallelization opportunity</key_insight>
</document>

<document index="3">
<source>specs/063-short-name-business/quickstart.md</source>
<summary>How to write tests guide with code examples from US1 success</summary>
<location>specs/063-short-name-business/quickstart.md</location>
<key_insight>US1 achieved 100% coverage with 43 tests in 1.12s - follow these patterns</key_insight>
</document>

<document index="4">
<source>frontend/src/features/budgets/lib/__tests__/calculations.test.ts</source>
<summary>Reference implementation: 43 tests (example + property-based), 100% coverage, all bot feedback addressed</summary>
<location>frontend/src/features/budgets/lib/__tests__/calculations.test.ts</location>
<key_pattern>Type-safe (Transaction[]), banker's rounding, property descriptor restoration, quota accuracy</key_pattern>
</document>
</documents>

**Anthropic Tip**: "Place long documents near the top of your prompt for better performance across all models"

---

## 📊 CONTEXT SNAPSHOT (Rehydration State)

### What Exists (DO NOT recreate)

**PR & Branch**:
- ✅ PR #68: https://github.com/mmtuentertainment/PayPlan/pull/68
- ✅ Branch: `063-short-name-business` (checkout if not already)
- ✅ Status: Both bots approved, incremental delivery strategy

**Completed Work** (50/168 tasks = 30%):
- ✅ Phase 1: Test infrastructure (25 tasks)
  - MockStorage, date/amount/assertion utilities, shared fixtures
  - Global setup with vi.spyOn(Storage.prototype)
  - Optimized Vitest config (2s timeout, parallel, per-file thresholds)
- ✅ Phase 3 (US1): Financial calculation tests (25 tasks)
  - 43 tests for calculations.ts (example + property-based)
  - 100% coverage (exceeds 90% requirement)
  - Budget/transaction fixtures with factory + builder patterns
  - Execution: 1.12s (93% under 15s threshold)

**Files Created** (11 infrastructure + 3 US1):
```
frontend/tests/
├── setup.ts ✅
└── fixtures/
    ├── types.ts, mock-storage.ts, date-utils.ts ✅
    ├── amount-utils.ts, assertion-utils.ts ✅
    └── shared-fixtures.ts ✅

frontend/src/features/budgets/lib/__tests__/
├── fixtures/budget-fixtures.ts, index.ts ✅
└── calculations.test.ts ✅ (43 tests, 100% coverage)

frontend/vite.config.ts ✅ (optimized for speed + coverage)
```

**Key Learnings from US1 Bot Feedback**:
1. Use `Transaction[]` not `any[]` (type safety)
2. Banker's rounding in `toCents()` (financial accuracy)
3. Property descriptor restoration (complete isolation)
4. Key + value length in quota tracking (accuracy)
5. Descriptive error messages ("Storage quota exceeded")

### Remaining Work (118/168 tasks = 70%)

**US2** (42 tasks): Storage service tests → 80%+ coverage
**US3** (27 tasks): Schema validation tests → 80%+ coverage
**US4** (15 tasks): Dashboard aggregation tests → 80%+ coverage
**US5** (13 tasks): Gamification logic tests → 80%+ coverage
**Phase 8** (22 tasks): CI/CD + documentation

---

## 🚀 EXECUTION PROTOCOL (Claude 4.5 Optimized)

### Principle 1: MAXIMIZE PARALLEL EXECUTION

Claude 4.5 excels at parallel tool calls. **Fire multiple operations simultaneously**.

**❌ SLOW (Sequential)**:
```
Write file1.ts
<wait>
Write file2.ts
<wait>
Write file3.ts
```

**✅ FAST (Parallel)**:
```
Single message with 3 Write calls:
- Write file1.ts
- Write file2.ts
- Write file3.ts
```

**Example for US2 fixtures** (T051-T059):
```
Single message with 9 Write tools:
1. Write category-fixtures.ts
2. Write category index.ts
3. Write category traits
4. Write category edge cases
5. Write transaction-fixtures.ts
6. Write transaction index.ts
7. Write TransactionBuilder
8. Write transaction traits
9. Mark T051-T059 complete in tasks.md
```

### Principle 2: USE EXTENDED THINKING FOR COMPLEXITY

**Anthropic Guidance**: "When faced with complex tasks, giving Claude space to think can dramatically improve performance"

For non-trivial decisions, use **structured thinking** with XML tags:

**When to use extended thinking**:
- Uncertain about edge case behavior → Think through scenarios
- Multiple valid test approaches → Analyze tradeoffs
- Complex test setup/teardown logic → Reason step-by-step
- Debugging test failures → Root cause analysis
- Coverage gaps → Identify uncovered paths

**Structured Thinking Pattern** (Anthropic's recommended format):

```xml
<thinking>
## Problem
Should TransactionStorage concurrent write test use timing-dependent or deterministic approach?

## Options
A) Real rapid-fire creates with setTimeout (realistic but flaky)
B) Mocked timestamps with deterministic ordering (deterministic but artificial)
C) Property-based test with randomized order (comprehensive but slow)

## Analysis
- Option A: Realistic behavior BUT timing-dependent = flaky tests (violates fast feedback)
- Option B: Deterministic BUT doesn't test real concurrency (acceptable for Phase 1 unit tests)
- Option C: Finds edge cases BUT may exceed 2s timeout (could use with low iteration count)

## Historical Context
- US1 used deterministic approach (sharedFixtures.dates) → 100% coverage, 1.12s execution
- Constitution v3.1: Phase 1 prioritizes speed + reliability over full realism
- Integration tests (Phase 2) will cover real concurrency with E2E tests

## Decision
Use Option B (mocked timestamps, deterministic ordering) for US2

## Rationale
- Aligns with Phase 1 priorities (speed > realism)
- Follows US1 success pattern (deterministic = reliable)
- Maintains <2s per-service execution requirement
- Real concurrency deferred to Phase 2 integration tests (appropriate separation)
</thinking>

<answer>
Test concurrent writes using mocked timestamps with createTransaction() + different dates.
Deterministic, fast (<100ms), reliable. Real concurrency covered in Phase 2 E2E tests.
</answer>
```

**Why XML tags?** (Anthropic best practice)
- Separates reasoning from answer
- Makes it easy to extract final decision
- Improves coherence in long-horizon tasks
- Enables self-critique and iteration

### Principle 3: PROGRESSIVE COMMITS (Ship Value Early)

**Commit frequency**: After each logical phase
**Don't**: Wait for all 42 tasks → 1 commit
**Do**: 4-5 commits as you progress

**Commit plan for US2**:
1. After fixtures (T059): Commit category + transaction fixtures
2. After CategoryStorage (T069): Commit CategoryStorageService tests
3. After BudgetStorage (T080): Commit BudgetStorageService tests
4. After TransactionStorage (T090): Commit TransactionStorageService tests
5. After Archive verify (T091): Update tasks.md

**Why**: Easier bot review, clearer history, faster feedback loops

### Principle 4: FOLLOW ESTABLISHED PATTERNS (US1 Excellence)

US1 achieved **100% coverage** with **43 tests** in **1.12s**. Replicate its patterns:

**Fixture Pattern** (`budget-fixtures.ts` as template):
```typescript
import { v4 as uuid } from 'uuid';
import type { SpendingCategory } from '../../types/category';
import { sharedFixtures } from '../../../../../../tests/fixtures/shared-fixtures';
import type { FixtureFactory } from '../../../../../../tests/fixtures/types';

export const createCategory: FixtureFactory<SpendingCategory> = (overrides) => ({
  id: `category_${uuid()}`,
  name: 'Groceries',
  color: sharedFixtures.colors.valid[0],
  icon: '🛒',
  budget: sharedFixtures.amounts.fiveHundredDollars,
  isCustom: false,
  createdAt: sharedFixtures.dates.jan1.toISOString(),
  updatedAt: sharedFixtures.dates.jan1.toISOString(),
  ...overrides,
});
```

**Test Pattern** (`calculations.test.ts` as template):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryStorageService } from '../CategoryStorageService';
import { createCategory } from './fixtures';
import { expectStorageKey, expectZodSuccess } from '../../../../../tests/fixtures/assertion-utils';

describe('CategoryStorageService', () => {
  let service: CategoryStorageService;

  beforeEach(() => {
    service = new CategoryStorageService();
    localStorage.clear(); // MockStorage from setup.ts
  });

  it('should create and retrieve category', () => {
    const category = createCategory({ name: 'Food' });

    service.create(category);

    const retrieved = service.getById(category.id);
    expect(retrieved).toEqual(category);
    expectStorageKey('payplan_categories_v1'); // Verify localStorage key exists
  });
});
```

### Principle 5: VERIFY BEFORE COMMIT (Quality Gates)

**Before EACH commit**, run this verification:

```bash
# 1. Tests pass
npm test

# 2. Coverage meets thresholds
npm run test:coverage
# Must show 80%+ for service being tested

# 3. TypeScript strict mode
npx tsc --noEmit

# 4. Linting
npm run lint
```

**If any fail**: Fix before committing (don't commit broken code)

---

## 📋 TASK EXECUTION PLAN

### Phase 4: US2 - Storage Service Tests (42 tasks)

#### Step 1: Read Existing Storage Services (Understand First)

**Use 3 parallel Read calls**:

```
Read these simultaneously:
1. frontend/src/features/categories/lib/CategoryStorageService.ts
2. frontend/src/features/budgets/lib/BudgetStorageService.ts
3. frontend/src/features/transactions/lib/TransactionStorageService.ts
```

**Extract from each**:
- Method signatures (create, getById, update, delete, list, others?)
- Error handling (throw or return error objects?)
- Storage key format ("payplan_{entity}_v1")
- Edge case handling (duplicate ID, corrupted data, quota exceeded)

#### Step 2: Create Fixtures (T051-T059) - 9 tasks, ALL PARALLEL

**Single message with 9 Write calls**:

1. `categories/lib/__tests__/fixtures/category-fixtures.ts` - createCategory factory
2. Same file - Add trait variations (createCustomCategory, createCategoryWithoutBudget)
3. Same file - Add edge cases (invalid color, empty name)
4. `categories/lib/__tests__/fixtures/index.ts` - Barrel export
5. `transactions/lib/__tests__/fixtures/transaction-fixtures.ts` - createTransaction factory
6. Same file - TransactionBuilder class with methods
7. Same file - Trait variations (expense, income, transfer)
8. `transactions/lib/__tests__/fixtures/index.ts` - Barrel export
9. Mark T051-T059 [X] in tasks.md

**Import paths**:
- From `fixtures/` directory: `../../../../../../tests/fixtures/` (7 levels)
- Use `sharedFixtures` for deterministic data

**After Step 2**: Commit "feat(testing): Add category and transaction test fixtures"

#### Step 3: Test CategoryStorageService (T060-T069) - 10 tasks

**Pattern**: Create skeleton → Write tests in parallel → Verify coverage

**Single message for tests T061-T068** (8 parallel):
```typescript
// All these tests can be written in same message:
- T061: create() saves category
- T062: getById() retrieves
- T063: update() modifies
- T064: delete() removes
- T065: list() returns all
- T066: create() throws on duplicate ID
- T067: getById() returns null for missing
- T068: handles corrupted localStorage
```

**Then sequential**:
- T069: Run coverage, verify 80%+

**After Step 3**: Commit "test(categories): Add CategoryStorageService tests (XX% coverage)"

#### Step 4: Test BudgetStorageService (T070-T080) - 11 tasks

**Reuse**: Budget fixtures from US1 (already exist)

**Same parallel pattern**:
- T070: Create skeleton
- T071-T079: 9 tests in parallel
- T080: Verify coverage

**After Step 4**: Commit "test(budgets): Add BudgetStorageService tests (XX% coverage)"

#### Step 5: Test TransactionStorageService (T081-T090) - 10 tasks

**Use**: Transaction fixtures from Step 2

**Additional edge cases**:
- Concurrent writes (deterministic with mocked dates)
- Quota limits (use MockStorage)
- Large datasets (100+ transactions)

**After Step 5**: Commit "test(transactions): Add TransactionStorageService tests (XX% coverage)"

#### Step 6: Verify Archive Tests (T091)

**Check**: Archive tests already exist (4 files)
**Action**: Verify coverage with `npm run test:coverage`

#### Step 7: Update Tasks (Final)

Mark T051-T091 as [X] in tasks.md

**After Step 7**: Commit "chore(tasks): Mark US2 complete (T051-T091)"

---

## 🧠 CLAUDE 4.5 OPTIMIZATION TECHNIQUES

### 1. Parallel Tool Execution (Near 100% Utilization)

**Research shows**: Claude 4.5 achieves near 100% parallelization for independent operations

**Apply to US2**:
- Fixtures: 9 Write calls in single message (100% parallel)
- CategoryStorage tests: 8 Write calls (test cases) in single message
- BudgetStorage tests: 9 Write calls in single message
- TransactionStorage tests: 8 Write calls in single message

**Expected speedup**: 5-10x faster than sequential

### 2. Extended Thinking for Decision Quality

**Use `<think>` blocks** for:
- Edge case design decisions
- Test coverage strategy
- Fixture organization
- Error handling approach

**Guideline**: Think for 30-60 seconds on complex decisions, execute with confidence

### 3. Context Awareness (1M Token Budget)

**You have 1M tokens** - use them wisely:
- Front-load context (read specs, plans, existing code early)
- Reference existing patterns (US1 as template)
- Avoid re-reading same files multiple times
- Use TodoWrite to track progress (external memory)

**Token budget allocation**:
- Context loading: 100-150K tokens (specs, existing code)
- Reasoning: 50-100K tokens (extended thinking)
- Execution: 500-700K tokens (writing tests, iterations)
- Reserve: 100K tokens (buffer for bot feedback)

### 4. Self-Critique & Iteration

**After each phase**, ask yourself:
- Did tests achieve 80%+ coverage?
- Are there untested edge cases?
- Do tests follow US1 patterns?
- Is execution time under threshold?

**Use confidence tracking**:
- High confidence → proceed
- Medium confidence → add more tests
- Low confidence → use extended thinking

### 5. Progressive Enhancement

**Start with MVP for each service**:
1. Basic CRUD tests (60% coverage)
2. Edge cases (reach 80% coverage)
3. Advanced scenarios if time permits (90%+ coverage)

**Don't**: Try for 100% immediately
**Do**: Hit 80% efficiently, then enhance

---

## 📚 REFERENCE MATERIALS (Available in Repo)

### Specifications (Read These First)

**Essential**:
- `specs/063-short-name-business/spec.md` - User stories, acceptance criteria
- `specs/063-short-name-business/tasks.md` - 168 atomic tasks with [P] markers
- `specs/063-short-name-business/quickstart.md` - How to write tests (examples)

**Detailed**:
- `specs/063-short-name-business/plan.md` - Technical approach
- `specs/063-short-name-business/research.md` - 6 research decisions
- `specs/063-short-name-business/data-model.md` - Test infrastructure entities
- `specs/063-short-name-business/contracts/test-utilities-api.md` - API contracts

### Code Examples (Copy These Patterns)

**Best fixture example**:
- `frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts`
- Factory functions, Builder class, trait variations

**Best test example**:
- `frontend/src/features/budgets/lib/__tests__/calculations.test.ts`
- 43 tests, example + property-based, 100% coverage, 1.12s execution

**Best infrastructure**:
- `frontend/tests/fixtures/mock-storage.ts` - Quota tracking, error simulation
- `frontend/tests/fixtures/date-utils.ts` - ADR-003 compliance, ISO helpers
- `frontend/tests/fixtures/assertion-utils.ts` - Custom assertions

---

## ⚡ QUICK START (Resume Immediately)

### If Continuing Current Session

You're already on branch `063-short-name-business` with US1 complete. **Start with**:

```
Begin US2 Phase 4A (Fixtures):
1. Read 3 storage service files in parallel
2. Create 9 fixture files in parallel (single message)
3. Run `npm test` to verify fixtures import correctly
4. Commit fixtures
5. Proceed to Phase 4B (CategoryStorage tests)
```

### If Fresh Session (Rehydration)

**Step 1**: Checkout branch
```bash
git checkout 063-short-name-business
git pull origin 063-short-name-business
```

**Step 2**: Verify existing work
```bash
cd frontend
npm test  # Should show 43 tests passing
npm run test:coverage  # calculations.ts should be 100%
```

**Step 3**: Read context
```
Read in parallel:
- specs/063-short-name-business/tasks.md (find where you left off)
- specs/063-short-name-business/quickstart.md (patterns to follow)
- frontend/src/features/budgets/lib/__tests__/calculations.test.ts (example)
```

**Step 4**: Begin US2 (see Quick Start above)

---

## 🎯 SUCCESS CRITERIA (Definition of Done)

### US2 Complete When:

1. ✅ CategoryStorageService.test.ts exists with 80%+ coverage
2. ✅ BudgetStorageService.test.ts exists with 80%+ coverage
3. ✅ TransactionStorageService.test.ts exists with 80%+ coverage
4. ✅ Archive tests verified (already exist, just confirm 80%+)
5. ✅ All CRUD operations tested (create, read, update, delete, list)
6. ✅ All edge cases covered (duplicate ID, missing ID, corrupted data, quota exceeded)
7. ✅ All tests pass in <15 seconds total
8. ✅ No TypeScript errors, no linting errors
9. ✅ Tasks T051-T091 marked [X] in tasks.md
10. ✅ 4-5 progressive commits pushed to PR #68

### Overall Feature Complete When:

- ✅ US1: 100% financial calculations ← **DONE**
- ✅ US2: 80%+ storage services ← **NEXT**
- ✅ US3: 80%+ schema validation
- ✅ US4: 80%+ dashboard aggregation
- ✅ US5: 80%+ gamification logic
- ✅ CI/CD: GitHub Actions with coverage enforcement
- ✅ Docs: CLAUDE.md updated with test guide

---

## 🔧 TROUBLESHOOTING GUIDE

### Common Issues & Solutions

**Import errors** (`@/tests/... not found`):
```
Solution: Use relative paths
- From __tests__/: ../../../../../tests/fixtures/
- From __tests__/fixtures/: ../../../../../../tests/fixtures/
```

**Coverage below 80%**:
```
Solution:
1. Run: npm run test:coverage
2. Open: coverage/index.html
3. Find: Uncovered lines (red highlighting)
4. Add: Tests for those specific branches/paths
```

**Tests fail after bot feedback**:
```
Solution:
1. Read bot comment carefully
2. Apply suggested fix
3. Run tests again
4. Commit fix with reference to bot feedback
```

**Execution time >15s**:
```
Solution:
1. Profile with: npm test -- --reporter=verbose
2. Find slow tests (>100ms)
3. Optimize: Remove setTimeout, use vi.useFakeTimers()
4. Target: Each service <2s, total <8s
```

---

## 📝 COMMIT MESSAGE TEMPLATE

```
<type>(<scope>): <description>

<body explaining WHAT and WHY>

## <Section> (optional)
- Bullet points with details

## Verification
- ✅ Tests pass
- ✅ Coverage: XX%
- ✅ Execution: Xs

Implements tasks TXXX-TXXX (N tasks)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: `feat`, `test`, `fix`, `refactor`, `chore`
**Scopes**: `testing`, `categories`, `budgets`, `transactions`, `tasks`

---

## 🤖 BOT REVIEW ANTICIPATION

### Preemptive Quality Checklist (Avoid Feedback Loops)

Based on US1 bot feedback, **proactively ensure**:

- [ ] No `any` types (use `Transaction[]`, `SpendingCategory[]`, `Budget[]`)
- [ ] Type imports: `import type { X }` for all types
- [ ] Proper relative imports (not `@/tests/...`)
- [ ] Banker's rounding used (if converting dollars→cents)
- [ ] Quota calculations include key + value length
- [ ] Error messages descriptive ("Storage quota exceeded" not just "Error")
- [ ] Test isolation complete (`beforeEach` clear, `afterEach` restore)
- [ ] Edge cases documented (comments explain WHY testing)
- [ ] Assertion helpers used (`expectStorageKey`, `expectZodSuccess`)
- [ ] Coverage thresholds in vite.config.ts (already done)

**Run before EVERY commit**:
```bash
npm test && npm run test:coverage && npx tsc --noEmit && npm run lint
```

If ALL pass → commit. If ANY fail → fix first.

---

## 📊 PROGRESS TRACKING

### Use TodoWrite Tool

**After each phase**, update todos:

```javascript
TodoWrite({
  todos: [
    {content: "US2 Fixtures (T051-T059)", status: "completed"},
    {content: "US2 CategoryStorage (T060-T069)", status: "in_progress"},
    {content: "US2 BudgetStorage (T070-T080)", status: "pending"},
    // ... etc
  ]
})
```

**Why**: External memory for long-horizon tasks (Claude 4.5 can run 30+ hours)

### Report Progress Milestones

**After each service complete**:
```
Report back:
"✅ CategoryStorageService complete: 85% coverage, 12 tests, 0.8s execution
⏳ Next: BudgetStorageService (T070-T080)"
```

**Why**: User sees progress, can provide feedback early

---

## 🎓 LESSONS FROM US1 (Apply to US2-US5)

### What Worked Exceptionally Well

1. **Hybrid testing**: 37 example + 6 property-based = 100% coverage
2. **Parallel execution**: 24/25 tasks ran in parallel (96% efficiency)
3. **Type safety**: Zero `any` types, all properly typed
4. **Speed**: 43 tests in 1.12s (0.026s per test average)
5. **Banker's rounding**: Financial-grade accuracy
6. **Progressive commits**: 5 commits, each reviewed independently

### What to Replicate for US2

- **Pattern**: Factory functions + optional Builder for complex objects
- **Testing**: Example-based primary (property-based if needed for invariants)
- **Speed**: Target <1s per service, <5s total for US2
- **Quality**: 80%+ coverage, type-safe, fast feedback

### What to Avoid

- ❌ Sequential file operations (use parallel)
- ❌ Using `any` types (bot will flag)
- ❌ Absolute paths that don't work (`@/tests/...`)
- ❌ Large commits (split into 4-5 logical units)
- ❌ Committing without verification (run tests first!)

---

## 🔄 REHYDRATION CHECKLIST

If resuming after break, verify state:

- [ ] Branch: `063-short-name-business` (checkout if needed)
- [ ] PR #68 exists and is open
- [ ] US1 complete: 43 tests, 100% coverage for calculations.ts
- [ ] Test infrastructure exists in `frontend/tests/fixtures/`
- [ ] Vitest config optimized (2s timeout, parallel, thresholds)
- [ ] Next task: T051 (create category fixtures)

**To verify**: Run `npm test` → should show 43 passing tests

---

## 🚀 EXECUTION COMMAND

**For US2 (42 tasks)**:

```
Implement User Story 2 (Storage Service Tests) for Feature #063:

1. Read CategoryStorageService, BudgetStorageService, TransactionStorageService (parallel)
2. Create 9 fixture files (parallel Write calls in single message)
3. Test CategoryStorageService (10 tests, 80%+ coverage)
4. Test BudgetStorageService (11 tests, 80%+ coverage)
5. Test TransactionStorageService (10 tests, 80%+ coverage)
6. Verify Archive tests coverage
7. Mark T051-T091 complete in tasks.md

Follow US1 patterns from calculations.test.ts and budget-fixtures.ts.
Target: 80%+ coverage for each service, <5s total execution.
Create 4-5 progressive commits.

Branch: 063-short-name-business
PR: #68 (keep open, expand scope)
Tasks: specs/063-short-name-business/tasks.md (T051-T091)
```

**For Complete Feature** (all user stories):

```
Complete entire Feature #063 (all 168 tasks):

✅ Phase 1 + US1: Complete (50 tasks, 100% coverage)
⏳ US2: Storage tests (42 tasks) - START HERE
⏳ US3: Schema tests (27 tasks)
⏳ US4: Aggregation tests (15 tasks)
⏳ US5: Gamification tests (13 tasks)
⏳ CI/CD: GitHub Actions (22 tasks)

Follow atomic task breakdown in tasks.md.
Maximize parallel execution (157/168 tasks can run in parallel).
Create progressive commits (10-15 commits total).
Target: 80-100% coverage, <15s execution.

Estimated time: 2-4 hours with Claude 4.5 parallel optimization.
```

---

## 📈 EXPECTED OUTCOMES

### US2 Completion

**Time**: 60-80 minutes (with parallel execution)
**Files**: 8 new files (3 test files, 5 fixture files)
**Tests**: ~35 new tests (78 total with US1)
**Coverage**:
- CategoryStorageService: 80-90%
- BudgetStorageService: 80-90%
- TransactionStorageService: 80-90%
**Commits**: 4-5 progressive commits

### Full Feature Completion (US1-US5 + CI/CD)

**Time**: 3-5 hours (with parallel execution + extended thinking)
**Files**: 30 new files
**Tests**: ~120 total tests
**Coverage**: 80-90% for all business logic
**Commits**: 10-15 progressive commits

---

## 💡 OPTIMIZATION TIPS

### Maximize Throughput

1. **Batch reads**: Read all source files at start (parallel)
2. **Batch writes**: Write all fixtures in one message (parallel)
3. **Batch test cases**: Write 8-10 test cases in one message (parallel)
4. **Single verification**: Run coverage once per service (not per test)

### Minimize Re-work

1. **Read before writing**: Understand actual code before writing tests
2. **Follow US1 patterns**: Don't reinvent, replicate success
3. **Verify before committing**: Run full check suite before git commit
4. **Learn from bot feedback**: Apply lessons to next service

### Maintain Quality

1. **Type everything**: No `any`, use proper TypeScript
2. **Use helpers**: Leverage assertion-utils, shared-fixtures
3. **Test edge cases**: Duplicate IDs, quota exceeded, corrupted data
4. **Document why**: Comments explain edge case rationale

---

## 🎬 READY TO EXECUTE?

**You now have**:
- ✅ Complete context (what exists, what to build)
- ✅ Proven patterns (US1 as template)
- ✅ Atomic task breakdown (168 tasks with dependencies)
- ✅ Quality standards (100% coverage demonstrated)
- ✅ Optimization strategies (parallel execution, extended thinking)
- ✅ Bot feedback lessons (type safety, banker's rounding, isolation)

**Expected result**: 80-90% coverage for all storage services in 60-80 minutes

**Command to start**: "Begin US2 (T051-T091)" or paste full execution command above

---

🚀 **Execute with maximum parallelization and extended thinking!**
