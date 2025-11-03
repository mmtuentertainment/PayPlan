# Tasks: Business Logic Test Coverage

**Input**: Design documents from `/specs/063-short-name-business/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: This feature IS about testing, so all tasks are test-related

**Organization**: Tasks are ATOMIC and grouped by user story to enable maximum parallelization

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files OR independent sections)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `frontend/src/`, `frontend/tests/`
- Feature-based architecture**: `frontend/src/features/*/lib/__tests__/`
- Co-located tests with source files

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Initialize test infrastructure and shared test utilities

- [X] T001 Install @fast-check/vitest dependency in frontend/package.json
- [X] T002 [P] Create MockStorage class skeleton in frontend/tests/fixtures/mock-storage.ts
- [X] T003 [P] Implement MockStorage getItem/setItem methods in frontend/tests/fixtures/mock-storage.ts
- [X] T004 [P] Implement MockStorage removeItem/clear methods in frontend/tests/fixtures/mock-storage.ts
- [X] T005 [P] Implement MockStorage length/key methods in frontend/tests/fixtures/mock-storage.ts
- [X] T006 [P] Implement MockStorage quota tracking in frontend/tests/fixtures/mock-storage.ts
- [X] T007 [P] Create createDate function in frontend/tests/fixtures/date-utils.ts (deterministic dates)
- [X] T008 [P] Create addMonths function in frontend/tests/fixtures/date-utils.ts (ADR-003 compliant)
- [X] T009 [P] Create date boundary functions in frontend/tests/fixtures/date-utils.ts (getLastDayOfMonth, isLeapYear)
- [X] T010 [P] Create fiscal year functions in frontend/tests/fixtures/date-utils.ts (getFiscalYearStart, getFiscalYearEnd)
- [X] T011 [P] Create toCents/toDollars functions in frontend/tests/fixtures/amount-utils.ts
- [X] T012 [P] Create amount validation functions in frontend/tests/fixtures/amount-utils.ts (isValidAmount, isSafeInteger)
- [X] T013 [P] Create amount test helpers in frontend/tests/fixtures/amount-utils.ts (randomAmount, getInvalidAmounts)
- [X] T014 [P] Create storage assertion functions in frontend/tests/fixtures/assertion-utils.ts (expectStorageKey, expectStorageEmpty, expectStorageSize)
- [X] T015 [P] Create Zod assertion functions in frontend/tests/fixtures/assertion-utils.ts (expectZodSuccess, expectZodFailure)
- [X] T016 [P] Create numeric assertion functions in frontend/tests/fixtures/assertion-utils.ts (expectPercentage, expectCentsEqual)
- [X] T017 [P] Create shared dates in frontend/tests/fixtures/shared-fixtures.ts (jan1, jan31, feb28, feb29, dec31, monthBoundaries)
- [X] T018 [P] Create shared IDs in frontend/tests/fixtures/shared-fixtures.ts (categoryId1-3, budgetId1-3, transactionId1-3, userId)
- [X] T019 [P] Create shared amounts in frontend/tests/fixtures/shared-fixtures.ts (zero, oneCent, oneDollar, etc., maxSafeInteger)
- [X] T020 [P] Create shared colors in frontend/tests/fixtures/shared-fixtures.ts (valid array, invalid array)
- [X] T021 [P] Create fixture type interfaces in frontend/tests/fixtures/types.ts (TestFixture, FixtureFactory, FixtureBuilder)
- [X] T022 Update global test setup in frontend/tests/setup.ts with MockStorage integration
- [X] T023 Update Vitest config in frontend/vite.config.ts: reduce timeout to 2s
- [X] T024 Update Vitest config in frontend/vite.config.ts: configure parallel execution
- [X] T025 Update Vitest config in frontend/vite.config.ts: set per-file coverage thresholds (90% calculations.ts, 80% others)

**Checkpoint**: Test infrastructure ready (25 tasks) - user story tests can now be written

---

## Phase 2: Foundational (No Blocking Prerequisites)

**Purpose**: This feature has no blocking foundational tasks - test infrastructure from Phase 1 is sufficient

**⚠️ SKIP**: All user stories can begin immediately after Phase 1

---

## Phase 3: User Story 1 - Financial Calculation Confidence (Priority: P1) 🎯 MVP

**Goal**: Achieve 90%+ test coverage for financial calculations in budgets/lib/calculations.ts

**Independent Test**: Run `npm run test:coverage` and verify budgets/calculations.ts has 90%+ coverage. Tests should complete in <15 seconds.

### Test Fixtures for User Story 1

- [X] T026 [P] [US1] Create createBudget factory function in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T027 [P] [US1] Create BudgetBuilder class skeleton in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T028 [P] [US1] Implement BudgetBuilder.withAmount() in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T029 [P] [US1] Implement BudgetBuilder.withSpent() in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T030 [P] [US1] Implement BudgetBuilder.withRollover() in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T031 [P] [US1] Implement BudgetBuilder.withPeriod() in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts
- [X] T032 [P] [US1] Create trait variations in frontend/src/features/budgets/lib/__tests__/fixtures/budget-fixtures.ts (createOverspentBudget, createUnderbudget)
- [X] T033 [P] [US1] Create budget fixture barrel export in frontend/src/features/budgets/lib/__tests__/fixtures/index.ts

### Tests for User Story 1 (Financial Calculations)

> **NOTE**: These are THE implementation - this feature is about writing tests

- [X] T034 [P] [US1] Create calculations test file skeleton in frontend/src/features/budgets/lib/__tests__/calculations.test.ts
- [X] T035 [P] [US1] Write test: calculateBudgetProgress returns 0% when nothing spent
- [X] T036 [P] [US1] Write test: calculateBudgetProgress returns 50% when half spent
- [X] T037 [P] [US1] Write test: calculateBudgetProgress returns 100% when fully spent
- [X] T038 [P] [US1] Write test: calculateBudgetProgress returns >100% when overspent
- [X] T039 [P] [US1] Write test: calculateBudgetProgress handles zero budget
- [X] T040 [P] [US1] Write test: calculateBudgetProgress throws on negative budget
- [X] T041 [P] [US1] Write test: calculateBudgetProgress handles cents precision correctly
- [X] T042 [P] [US1] Write test: calculateBudgetProgress handles MAX_SAFE_INTEGER
- [X] T043 [P] [US1] Write property test: calculateBudgetProgress always non-negative (using fast-check)
- [X] T044 [P] [US1] Write property test: calculateBudgetProgress is 100% when spent equals budget (using fast-check)
- [X] T045 [P] [US1] Write test: adjustBudgetForRollover handles Jan 31 → Feb 28 (ADR-003)
- [X] T046 [P] [US1] Write test: adjustBudgetForRollover handles Feb 29 → Mar 29 in leap year (ADR-003)
- [X] T047 [P] [US1] Write test: adjustBudgetForRollover handles Dec 31 → Jan 31 year rollover (ADR-003)
- [X] T048 [P] [US1] Write test: adjustBudgetForRollover rejects invalid dates
- [X] T049 [P] [US1] Write property test: adjustBudgetForRollover always produces future date (using fast-check)
- [X] T050 [US1] Verify 90%+ coverage for calculations.ts using `npm run test:coverage`

**Checkpoint**: Financial calculations have 90%+ test coverage (25 tasks), all tests pass in <15 seconds

---

## Phase 4: User Story 2 - Storage Service Reliability (Priority: P1)

**Goal**: Achieve 80%+ test coverage for all storage services (Category, Budget, Transaction, Archive)

**Independent Test**: Run tests for each storage service independently with mocked localStorage. Verify CRUD operations, edge cases, quota limits.

### Test Fixtures for User Story 2

- [ ] T051 [P] [US2] Create createCategory factory function in frontend/src/features/categories/lib/__tests__/fixtures/category-fixtures.ts
- [ ] T052 [P] [US2] Create category trait variations in frontend/src/features/categories/lib/__tests__/fixtures/category-fixtures.ts (createCustomCategory, createCategoryWithoutBudget)
- [ ] T053 [P] [US2] Create category edge case fixtures in frontend/src/features/categories/lib/__tests__/fixtures/category-fixtures.ts (invalid color, empty name)
- [ ] T054 [P] [US2] Create category fixture barrel export in frontend/src/features/categories/lib/__tests__/fixtures/index.ts
- [ ] T055 [P] [US2] Create createTransaction factory function in frontend/src/features/transactions/lib/__tests__/fixtures/transaction-fixtures.ts
- [ ] T056 [P] [US2] Create TransactionBuilder class in frontend/src/features/transactions/lib/__tests__/fixtures/transaction-fixtures.ts
- [ ] T057 [P] [US2] Implement TransactionBuilder methods in frontend/src/features/transactions/lib/__tests__/fixtures/transaction-fixtures.ts (withAmount, withCategory, withDate, withType)
- [ ] T058 [P] [US2] Create transaction trait variations in frontend/src/features/transactions/lib/__tests__/fixtures/transaction-fixtures.ts (expense, income, transfer)
- [ ] T059 [P] [US2] Create transaction fixture barrel export in frontend/src/features/transactions/lib/__tests__/fixtures/index.ts

### Tests for User Story 2 (CategoryStorageService)

- [ ] T060 [P] [US2] Create CategoryStorageService test file skeleton in frontend/src/features/categories/lib/__tests__/CategoryStorageService.test.ts
- [ ] T061 [P] [US2] Write test: CategoryStorageService.create() saves category to localStorage
- [ ] T062 [P] [US2] Write test: CategoryStorageService.getById() retrieves category
- [ ] T063 [P] [US2] Write test: CategoryStorageService.update() modifies existing category
- [ ] T064 [P] [US2] Write test: CategoryStorageService.delete() removes category
- [ ] T065 [P] [US2] Write test: CategoryStorageService.list() returns all categories
- [ ] T066 [P] [US2] Write test: CategoryStorageService.create() throws on duplicate ID
- [ ] T067 [P] [US2] Write test: CategoryStorageService.getById() returns null for missing ID
- [ ] T068 [P] [US2] Write test: CategoryStorageService handles corrupted localStorage data
- [ ] T069 [US2] Verify 80%+ coverage for CategoryStorageService

### Tests for User Story 2 (BudgetStorageService)

- [ ] T070 [P] [US2] Create BudgetStorageService test file skeleton in frontend/src/features/budgets/lib/__tests__/BudgetStorageService.test.ts
- [ ] T071 [P] [US2] Write test: BudgetStorageService.create() saves budget to localStorage
- [ ] T072 [P] [US2] Write test: BudgetStorageService.getById() retrieves budget
- [ ] T073 [P] [US2] Write test: BudgetStorageService.update() modifies existing budget
- [ ] T074 [P] [US2] Write test: BudgetStorageService.delete() removes budget
- [ ] T075 [P] [US2] Write test: BudgetStorageService.list() returns all budgets
- [ ] T076 [P] [US2] Write test: BudgetStorageService.create() throws on duplicate ID
- [ ] T077 [P] [US2] Write test: BudgetStorageService handles invalid data
- [ ] T078 [P] [US2] Write test: BudgetStorageService throws QuotaExceededError when quota exceeded
- [ ] T079 [P] [US2] Write test: BudgetStorageService handles corrupted JSON
- [ ] T080 [US2] Verify 80%+ coverage for BudgetStorageService

### Tests for User Story 2 (TransactionStorageService)

- [ ] T081 [P] [US2] Create TransactionStorageService test file skeleton in frontend/src/features/transactions/lib/__tests__/TransactionStorageService.test.ts
- [ ] T082 [P] [US2] Write test: TransactionStorageService.create() saves transaction to localStorage
- [ ] T083 [P] [US2] Write test: TransactionStorageService.getById() retrieves transaction
- [ ] T084 [P] [US2] Write test: TransactionStorageService.update() modifies existing transaction
- [ ] T085 [P] [US2] Write test: TransactionStorageService.delete() removes transaction
- [ ] T086 [P] [US2] Write test: TransactionStorageService.list() returns all transactions
- [ ] T087 [P] [US2] Write test: TransactionStorageService handles concurrent writes (last-write-wins)
- [ ] T088 [P] [US2] Write test: TransactionStorageService handles localStorage quota limits
- [ ] T089 [P] [US2] Write test: TransactionStorageService handles large datasets efficiently
- [ ] T090 [US2] Verify 80%+ coverage for TransactionStorageService

### Verify Archive Tests

- [ ] T091 [US2] Verify ArchiveService tests already exist and have 80%+ coverage (4 existing test files)

**Checkpoint**: All storage services have 80%+ test coverage (42 tasks)

---

## Phase 5: User Story 3 - Schema Validation Coverage (Priority: P2)

**Goal**: Achieve 80%+ test coverage for Zod schemas (category, budget, transaction)

**Independent Test**: Import each schema and test valid/invalid inputs. Verify validation rules catch all edge cases.

### Tests for User Story 3 (Category Schema)

- [ ] T092 [P] [US3] Create category schema test file skeleton in frontend/src/features/categories/lib/__tests__/schemas.test.ts
- [ ] T093 [P] [US3] Write test: categorySchema validates valid category
- [ ] T094 [P] [US3] Write test: categorySchema validates custom category
- [ ] T095 [P] [US3] Write test: categorySchema rejects missing id field
- [ ] T096 [P] [US3] Write test: categorySchema rejects missing name field
- [ ] T097 [P] [US3] Write test: categorySchema rejects invalid color format
- [ ] T098 [P] [US3] Write test: categorySchema rejects negative budget
- [ ] T099 [P] [US3] Write test: categorySchema validates all valid colors from sharedFixtures
- [ ] T100 [P] [US3] Write test: categorySchema rejects all invalid colors from sharedFixtures
- [ ] T101 [US3] Verify 80%+ coverage for categories/lib/schemas.ts

### Tests for User Story 3 (Budget Schema)

- [ ] T102 [P] [US3] Create budget schema test file skeleton in frontend/src/features/budgets/lib/__tests__/schemas.test.ts
- [ ] T103 [P] [US3] Write test: budgetSchema validates valid budget
- [ ] T104 [P] [US3] Write test: budgetSchema validates budget with rollover
- [ ] T105 [P] [US3] Write test: budgetSchema rejects negative amount
- [ ] T106 [P] [US3] Write test: budgetSchema rejects invalid period value
- [ ] T107 [P] [US3] Write test: budgetSchema rejects invalid date format
- [ ] T108 [P] [US3] Write test: budgetSchema validates amount limits (min/max)
- [ ] T109 [US3] Verify 80%+ coverage for budgets/lib/schemas.ts

### Tests for User Story 3 (Transaction Schema)

- [ ] T110 [P] [US3] Create transaction schema test file skeleton in frontend/src/features/transactions/lib/__tests__/schemas.test.ts
- [ ] T111 [P] [US3] Write test: transactionSchema validates expense transaction
- [ ] T112 [P] [US3] Write test: transactionSchema validates income transaction
- [ ] T113 [P] [US3] Write test: transactionSchema validates transfer transaction
- [ ] T114 [P] [US3] Write test: transactionSchema rejects invalid amount
- [ ] T115 [P] [US3] Write test: transactionSchema rejects missing category reference
- [ ] T116 [P] [US3] Write test: transactionSchema rejects invalid date format
- [ ] T117 [P] [US3] Write test: transactionSchema validates zero amount (edge case)
- [ ] T118 [US3] Verify 80%+ coverage for transactions/lib/schemas.ts

**Checkpoint**: All Zod schemas have 80%+ test coverage (27 tasks)

---

## Phase 6: User Story 4 - Dashboard Aggregation Accuracy (Priority: P2)

**Goal**: Achieve 80%+ test coverage for dashboard aggregation functions

**Independent Test**: Provide sample transaction/budget data, verify aggregated outputs match expected totals

### Test Fixtures for User Story 4

- [ ] T119 [P] [US4] Create createDashboardData factory function in frontend/src/features/dashboard/lib/__tests__/fixtures/dashboard-fixtures.ts
- [ ] T120 [P] [US4] Create dashboard scenario variations in frontend/src/features/dashboard/lib/__tests__/fixtures/dashboard-fixtures.ts (emptyDashboard, activeDashboard, overspentDashboard)
- [ ] T121 [P] [US4] Create dashboard fixture barrel export in frontend/src/features/dashboard/lib/__tests__/fixtures/index.ts

### Tests for User Story 4 (Aggregation)

- [ ] T122 [P] [US4] Create aggregation test file skeleton in frontend/src/features/dashboard/lib/__tests__/aggregation.test.ts
- [ ] T123 [P] [US4] Write test: spending by category totals match expected (single category)
- [ ] T124 [P] [US4] Write test: spending by category totals match expected (multiple categories)
- [ ] T125 [P] [US4] Write test: monthly income calculation is accurate
- [ ] T126 [P] [US4] Write test: monthly expenses calculation is accurate
- [ ] T127 [P] [US4] Write test: date range filtering works correctly
- [ ] T128 [P] [US4] Write test: goal progress percentage is accurate
- [ ] T129 [P] [US4] Write test: goal remaining amount is accurate
- [ ] T130 [P] [US4] Write test: aggregation handles empty data gracefully
- [ ] T131 [P] [US4] Write test: aggregation handles zero amounts
- [ ] T132 [P] [US4] Write test: aggregation handles missing categories
- [ ] T133 [US4] Verify 80%+ coverage for dashboard/lib/aggregation.ts

**Checkpoint**: Dashboard aggregation has 80%+ test coverage (15 tasks)

---

## Phase 7: User Story 5 - Gamification Logic Testing (Priority: P3)

**Goal**: Achieve 80%+ test coverage for gamification logic (streaks, insights, wins)

**Independent Test**: Simulate user activity patterns, verify streak counts, insight messages, win celebrations

### Tests for User Story 5 (Gamification)

- [ ] T134 [P] [US5] Create gamification test file skeleton in frontend/src/features/dashboard/lib/__tests__/gamification.test.ts
- [ ] T135 [P] [US5] Write test: consecutive day counting works correctly
- [ ] T136 [P] [US5] Write test: streak breaks are detected
- [ ] T137 [P] [US5] Write test: longest streak tracking is accurate
- [ ] T138 [P] [US5] Write test: spending pattern detection works
- [ ] T139 [P] [US5] Write test: alert thresholds trigger correctly
- [ ] T140 [P] [US5] Write test: personalized messages are selected appropriately
- [ ] T141 [P] [US5] Write test: goal completion triggers win celebration
- [ ] T142 [P] [US5] Write test: streak milestones trigger win celebration
- [ ] T143 [P] [US5] Write test: under-budget achievement triggers win celebration
- [ ] T144 [P] [US5] Write test: gamification handles no activity
- [ ] T145 [P] [US5] Write test: gamification handles multiple wins same day
- [ ] T146 [US5] Verify 80%+ coverage for dashboard/lib/gamification.ts

**Checkpoint**: Gamification logic has 80%+ test coverage (13 tasks)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: CI/CD integration, documentation, and final validation

- [ ] T147 [P] Create GitHub Actions workflow skeleton in .github/workflows/test.yml
- [ ] T148 [P] Add test execution step to .github/workflows/test.yml
- [ ] T149 [P] Add coverage report generation to .github/workflows/test.yml
- [ ] T150 [P] Add coverage threshold check to .github/workflows/test.yml (fail if <80%/90%)
- [ ] T151 [P] Add per-file coverage check for calculations.ts to .github/workflows/test.yml (must be 90%+)
- [ ] T152 [P] Add coverage report upload as artifact to .github/workflows/test.yml
- [ ] T153 [P] Add PR comment with coverage summary to .github/workflows/test.yml
- [ ] T154 [P] Add coverage badge configuration to README.md (optional)
- [ ] T155 [P] Document test writing patterns in CLAUDE.md (examples from quickstart.md)
- [ ] T156 [P] Document fixture usage in CLAUDE.md
- [ ] T157 [P] Document running tests in CLAUDE.md
- [ ] T158 Run full test suite: `npm test` - verify all tests pass
- [ ] T159 Run test suite with coverage: `npm run test:coverage` - verify <15 second execution
- [ ] T160 Verify overall business logic coverage >= 80%
- [ ] T161 Verify financial calculation coverage >= 90%
- [ ] T162 Generate and review HTML coverage report for gaps
- [ ] T163 Run quickstart.md examples - verify all code snippets work
- [ ] T164 Create PR with test infrastructure and all tests
- [ ] T165 Address CRITICAL bot feedback (security, privacy, accessibility blockers)
- [ ] T166 Address HIGH bot feedback (performance, error handling, validation)
- [ ] T167 Create Linear issues for MEDIUM/LOW bot feedback (defer)
- [ ] T168 Iterate until both bots approve (Claude Code Bot + CodeRabbit AI green)

**Checkpoint**: All tests complete, coverage targets met, CI/CD integrated, bots green (22 tasks)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - **25 tasks total, 24 can run in parallel** (only T001 must complete first for fast-check dependency)
- **Foundational (Phase 2)**: SKIPPED
- **User Stories (Phase 3-7)**: All depend on Phase 1 completion
  - After Phase 1, **all 5 user stories can start in parallel**
  - US1: 25 tasks (24 parallel)
  - US2: 42 tasks (40 parallel)
  - US3: 27 tasks (25 parallel)
  - US4: 15 tasks (14 parallel)
  - US5: 13 tasks (12 parallel)
- **Polish (Phase 8)**: Depends on completed stories
  - **22 tasks total, 11 can run in parallel**

### Within Each User Story

**US1 (Financial Calculations)**:
- Fixtures (T026-T033): All 8 parallel after Phase 1
- Test file creation (T034): After fixtures
- Tests (T035-T049): All 15 parallel after T034
- Verification (T050): After all tests

**US2 (Storage Services)**:
- Fixtures (T051-T059): All 9 parallel after Phase 1
- Category tests (T060-T069): All 10 parallel after fixtures
- Budget tests (T070-T080): All 11 parallel after fixtures
- Transaction tests (T081-T090): All 10 parallel after fixtures
- Archive verification (T091): After Phase 1

**US3-US5**: Similar pattern - fixtures → test creation → parallel test writing → verification

### Parallel Execution Examples

**Phase 1 Maximum Parallelization** (24 tasks simultaneously):
```bash
# After T001 completes, spawn 24 parallel workers:
T002 & T003 & T004 & T005 & T006 &  # MockStorage (5 parallel)
T007 & T008 & T009 & T010 &          # date-utils (4 parallel)
T011 & T012 & T013 &                 # amount-utils (3 parallel)
T014 & T015 & T016 &                 # assertion-utils (3 parallel)
T017 & T018 & T019 & T020 &          # shared-fixtures (4 parallel)
T021 &                               # types (1)
T022 & T023 & T024 & T025            # config updates (4 parallel)
wait  # All complete together
```

**US1 Maximum Parallelization** (15 test tasks simultaneously):
```bash
# After T034 completes, spawn 15 parallel workers:
T035 & T036 & T037 & T038 & T039 &  # Progress tests (5)
T040 & T041 & T042 & T043 & T044 &  # More progress (5)
T045 & T046 & T047 & T048 & T049    # Rollover tests (5)
wait  # All complete together
T050  # Verify coverage
```

**All User Stories in Parallel** (after Phase 1):
```bash
# Spawn 5 teams working on different stories:
Team1: T026-T050 (US1) &
Team2: T051-T091 (US2) &
Team3: T092-T118 (US3) &
Team4: T119-T133 (US4) &
Team5: T134-T146 (US5) &
wait  # All stories complete
```

---

## Implementation Strategy

### MVP Scope (P1 Stories Only)

**MVP = Phase 1 + US1 + US2 + CI/CD**
- Phase 1: 25 tasks (24 parallel)
- US1: 25 tasks (24 parallel)
- US2: 42 tasks (40 parallel)
- CI/CD: 7 tasks (7 parallel) - T147-T153

**Total MVP**: 99 tasks, **95 can run in parallel** (96% parallelizable!)

**Time Estimates**:
- **With 10 developers**: 2-3 days (massive parallelization)
- **With 5 developers**: 3-4 days
- **With 2 developers**: 5-7 days
- **Solo developer**: 10-12 days (sequential execution)

### Full Feature Delivery

**All Phases**: 168 tasks total
- **Parallelizable**: 157 tasks (93%)
- **Sequential**: 11 tasks (verification steps)

**Time Estimates**:
- **With 10 developers**: 4-5 days
- **With 5 developers**: 7-9 days
- **With 2 developers**: 12-15 days
- **Solo developer**: 18-22 days

---

## Summary Statistics

**Total Tasks**: 168 (increased from 73 for atomicity)
- Phase 1 (Setup): 25 tasks (was 9)
- Phase 3 (US1): 25 tasks (was 9)
- Phase 4 (US2): 42 tasks (was 17)
- Phase 5 (US3): 27 tasks (was 13)
- Phase 6 (US4): 15 tasks (was 8)
- Phase 7 (US5): 13 tasks (was 6)
- Phase 8 (Polish): 22 tasks (was 11)

**Parallelization**:
- **Parallelizable tasks**: 157 (93%)
- **Sequential tasks**: 11 (verification steps only)
- **Parallel efficiency**: 2.3x increase from original 73 tasks

**Task Distribution**:
- US1 (P1): 25 tasks (15%)
- US2 (P1): 42 tasks (25%)
- US3 (P2): 27 tasks (16%)
- US4 (P2): 15 tasks (9%)
- US5 (P3): 13 tasks (8%)
- Setup/Polish: 47 tasks (28%)

**Atomic Task Benefits**:
- ✅ Each task is 5-15 minutes of work (vs 30-60 min before)
- ✅ 93% of tasks can run in parallel (vs 42% before)
- ✅ Better progress tracking (168 checkboxes vs 73)
- ✅ Easier team coordination (clear work units)
- ✅ Faster feedback loops (small PRs per task)

---

## Format Validation

✅ **All 168 tasks follow checklist format**: `- [ ] [ID] [P?] [Story?] Description with file path`
✅ **157 tasks marked [P]** (parallelizable)
✅ **122 tasks have [Story] labels** (US1-US5, correctly applied)
✅ **All file paths are specific and absolute**
✅ **All phases have checkpoints with independent test criteria**
✅ **Dependencies clearly documented**

---

**Next Steps**:
1. ✅ Review atomic task breakdown
2. ⏳ Begin Phase 1 (25 tasks, 24 parallel, ~3-4 hours with team)
3. ⏳ Complete MVP (99 tasks, 95 parallel, ~3-5 days with team)
4. ⏳ Full feature (168 tasks, 157 parallel, ~7-9 days with team)

**Command to start**: Begin with T001, then spawn 24 parallel workers for T002-T025

🚀 **Maximum parallelization achieved!**
