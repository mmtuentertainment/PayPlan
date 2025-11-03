# Feature Specification: Business Logic Test Coverage

**Feature Branch**: `063-short-name-business`
**Created**: 2025-11-03
**Status**: Draft
**Input**: User description: "Add comprehensive test coverage for business logic in features/*/lib directories to meet Phase 1 TDD requirements (80% coverage for business logic, 90%+ for financial calculations)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Financial Calculation Confidence (Priority: P1)

As a **developer implementing budget features**, I need **high confidence that financial calculations are correct** so that **users never lose money due to calculation bugs**.

**Why this priority**: Financial calculations are the highest risk area - bugs directly impact user money. Constitution v3.1 mandates 90%+ coverage for financial logic.

**Independent Test**: Can be fully tested by running `npm run test:coverage` and verifying budgets/calculations.ts has 90%+ coverage. Delivers immediate value by preventing money-related bugs in the budgets feature.

**Acceptance Scenarios**:

1. **Given** budget calculation functions exist in `features/budgets/lib/calculations.ts`, **When** tests are run, **Then** coverage must be at least 90% for all calculation functions
2. **Given** a developer modifies budget calculation logic, **When** they run tests locally, **Then** the test suite must catch regressions within 15 seconds
3. **Given** edge cases like month boundaries (Jan 31 → Feb), **When** budget calculations run, **Then** tests must verify correct handling per ADR-003

---

### User Story 2 - Storage Service Reliability (Priority: P1)

As a **developer implementing localStorage features**, I need **tests for all CRUD operations** so that **user data is never corrupted or lost**.

**Why this priority**: Storage services are the foundation of all features. Without comprehensive tests, data loss bugs can slip through. This is critical for user trust.

**Independent Test**: Can be fully tested by running tests for CategoryStorageService, BudgetStorageService, TransactionStorageService, and ArchiveService. Each service can be tested independently with mocked localStorage.

**Acceptance Scenarios**:

1. **Given** CategoryStorageService exists, **When** tests run, **Then** all CRUD operations (create, read, update, delete, list) must be tested
2. **Given** BudgetStorageService exists, **When** tests run, **Then** edge cases like duplicate IDs, invalid data, and missing keys must be covered
3. **Given** TransactionStorageService exists, **When** tests run, **Then** concurrent write scenarios and localStorage quota limits must be tested
4. **Given** ArchiveService exists, **When** tests run, **Then** archiving, unarchiving, and bulk operations must be verified

---

### User Story 3 - Schema Validation Coverage (Priority: P2)

As a **developer using Zod schemas**, I need **tests for all validation rules** so that **invalid data is caught before it reaches the UI or storage**.

**Why this priority**: Zod schemas are the first line of defense against bad data. Testing them ensures data integrity across the app. Lower priority than P1 because schemas are simpler than calculations/storage.

**Independent Test**: Can be fully tested by importing each schema (categorySchema, budgetSchema, transactionSchema) and testing valid/invalid inputs. Delivers value by preventing validation bugs in forms and API responses.

**Acceptance Scenarios**:

1. **Given** categorySchema exists in `features/categories/lib/schemas.ts`, **When** tests run, **Then** valid categories must pass and invalid categories (missing required fields, wrong types, out-of-range values) must fail
2. **Given** budgetSchema exists in `features/budgets/lib/schemas.ts`, **When** tests run, **Then** budget amount limits, date ranges, and rollover rules must be validated
3. **Given** transactionSchema exists in `features/transactions/lib/schemas.ts`, **When** tests run, **Then** amount validation, category references, and date formats must be tested

---

### User Story 4 - Dashboard Aggregation Accuracy (Priority: P2)

As a **developer implementing dashboard widgets**, I need **tests for data aggregation functions** so that **users see accurate spending totals and chart data**.

**Why this priority**: Aggregation bugs cause user confusion and distrust. Testing aggregation logic ensures dashboard accuracy. Lower priority than financial calculations because dashboard is informational, not transactional.

**Independent Test**: Can be fully tested by providing sample transaction/budget data and verifying aggregated outputs (totals by category, monthly summaries, goal progress). Delivers value by ensuring dashboard shows correct information.

**Acceptance Scenarios**:

1. **Given** aggregation functions exist in `features/dashboard/lib/aggregation.ts`, **When** tests run, **Then** spending by category calculations must match expected totals
2. **Given** monthly income vs. expenses calculations, **When** tests run, **Then** date range filtering and summation must be accurate
3. **Given** goal progress calculations, **When** tests run, **Then** percentage complete and remaining amounts must be correct

---

### User Story 5 - Gamification Logic Testing (Priority: P3)

As a **developer implementing gamification features**, I need **tests for streak calculations and insight generation** so that **users receive accurate motivational feedback**.

**Why this priority**: Gamification enhances user experience but isn't critical to core budgeting functionality. Bugs here are less severe than money/storage bugs. Lowest priority because features still work without perfect gamification.

**Independent Test**: Can be fully tested by simulating user activity patterns (daily logins, spending records, goal milestones) and verifying streak counts, insight messages, and win celebrations. Delivers value by ensuring gamification is motivating, not frustrating.

**Acceptance Scenarios**:

1. **Given** streak calculation logic exists in `features/dashboard/lib/gamification.ts`, **When** tests run, **Then** consecutive day counting, streak breaks, and longest streak tracking must be verified
2. **Given** insight generation logic, **When** tests run, **Then** spending pattern detection, alert thresholds, and personalized message selection must be tested
3. **Given** win celebration triggers, **When** tests run, **Then** goal completion, streak milestones, and under-budget achievements must be recognized

---

### Edge Cases

- **What happens when localStorage is full?** Storage services must handle quota exceeded errors gracefully and provide user-friendly error messages (test with mocked localStorage.setItem throwing QuotaExceededError)
- **How does the system handle invalid dates in calculations?** Budget calculations must validate dates and reject invalid inputs (Feb 30, negative dates, NaN timestamps) before processing
- **What if a user deletes a category that has active budgets?** Tests must verify referential integrity - either cascade delete budgets or prevent category deletion
- **How are floating-point rounding errors handled in financial calculations?** Tests must verify amounts are stored as integers (cents) and calculations round correctly per financial standards
- **What if localStorage data is corrupted?** Storage services must detect invalid JSON, reset to defaults, and log telemetry for debugging
- **How are concurrent writes handled?** Tests must verify last-write-wins semantics and race condition handling in storage services

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Test suite MUST achieve 90%+ coverage for financial calculation functions in `features/budgets/lib/calculations.ts`
- **FR-002**: Test suite MUST achieve 80%+ coverage for all business logic files in `features/*/lib/**/*.ts` directories
- **FR-003**: Test suite MUST complete in under 15 seconds for fast TDD feedback loop (per Constitution v3.1 pre-commit requirements)
- **FR-004**: Tests MUST run automatically in CI/CD pipeline and fail the build if coverage thresholds are not met
- **FR-005**: Tests MUST use Vitest as the test runner (mandated in Constitution)
- **FR-006**: Tests MUST mock localStorage for storage service tests to avoid polluting actual browser storage
- **FR-007**: Tests MUST verify Zod schema validation for all input/output data in business logic
- **FR-008**: Test suite MUST include edge cases documented in User Scenarios section (localStorage quota, invalid dates, corrupted data, concurrent writes, rounding errors, referential integrity)
- **FR-009**: Financial calculation tests MUST verify correct handling of Date.setMonth() boundary conditions per ADR-003
- **FR-010**: Storage service tests MUST verify all CRUD operations (create, read, update, delete, list) for CategoryStorageService, BudgetStorageService, TransactionStorageService, ArchiveService
- **FR-011**: Tests MUST fail fast with clear error messages indicating which assertion failed and what the expected vs. actual values were
- **FR-012**: Test suite MUST generate coverage reports in HTML format for easy review by developers and bots
- **FR-013**: Tests MUST NOT test implementation details (private methods, internal state) - only test public API contracts
- **FR-014**: Test suite MUST support watch mode for TDD workflow (re-run tests on file changes)

### Key Entities *(feature involves test infrastructure)*

- **Test Suite Configuration**: Vitest configuration defining coverage thresholds, test patterns, timeout limits, and mocking strategies
- **Test File Organization**: `__tests__` directories within each `features/*/lib/` folder containing test files mirroring source structure
- **Coverage Report**: HTML/JSON output showing line, branch, function, and statement coverage percentages per file
- **Mock Data Fixtures**: Reusable sample data for categories, budgets, transactions, and archives used across multiple test files
- **Test Utilities**: Helper functions for mocking localStorage, generating test data, and asserting common patterns

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can run full test suite in under 15 seconds (enables fast TDD feedback loop per Constitution)
- **SC-002**: Financial calculation coverage reaches 90%+ within 1 week of implementation
- **SC-003**: Overall business logic coverage reaches 80%+ within 2 weeks of implementation (phased target per Constitution v3.1)
- **SC-004**: CI/CD pipeline fails builds when coverage drops below thresholds (prevents regression)
- **SC-005**: Storage service tests catch 100% of data corruption scenarios identified in edge cases
- **SC-006**: Test suite execution time remains under 15 seconds as features grow (scales to 20+ features)
- **SC-007**: Developers achieve 90%+ first-attempt success rate when running tests locally before pushing to PR
- **SC-008**: Bot reviews approve test coverage quality on first submission (no "add more tests" feedback)
- **SC-009**: Zero financial calculation bugs reported by users within first 100 users (validates 90%+ coverage target)
- **SC-010**: Test failures provide actionable error messages that guide developers to the root cause within 30 seconds

### Qualitative Outcomes

- Developers gain confidence in refactoring business logic without breaking existing functionality
- Code review discussions focus on architecture and design rather than "did you test this?"
- New developers can understand business logic behavior by reading test cases as documentation
- Bot reviews consistently approve test quality, reducing review iterations

## Assumptions *(decisions made to proceed)*

1. **Testing Framework**: Vitest is already configured in the project (per Constitution requirement)
2. **Test File Location**: Tests will be co-located with source files in `__tests__` directories for easier discoverability
3. **Mock Strategy**: localStorage will be mocked using Vitest's mocking capabilities, not real browser storage
4. **Coverage Tools**: Vitest's built-in coverage via c8/v8 will be used (no Istanbul/nyc migration needed)
5. **Test Data**: Reusable fixture data will be created in `features/*/lib/__tests__/fixtures/` for consistent test scenarios
6. **Phased Rollout**: Tests will be added incrementally (P1 features first, then P2, then P3) to avoid overwhelming initial implementation
7. **CI/CD Integration**: GitHub Actions workflow already exists and can be extended with coverage thresholds
8. **Watch Mode**: Developers will use `npm run test:watch` for TDD workflow, not IDE-integrated test runners
9. **Coverage Reporting**: HTML reports will be generated in `coverage/` directory and gitignored (not checked in)
10. **Test Isolation**: Each test file will be independently runnable without requiring specific execution order

## Out of Scope *(explicitly excluded)*

1. **UI Component Testing**: React component tests are deferred to Phase 2+ (Constitution v3.1 allows manual UI testing in Phase 1)
2. **Integration Tests**: Cross-feature integration tests (e.g., creating budget → updating transactions → dashboard refresh) deferred to Phase 2
3. **E2E Tests**: Playwright browser automation tests deferred to Phase 2+
4. **Performance Benchmarks**: Load testing, stress testing, and performance profiling deferred to Phase 4
5. **Accessibility Tests**: Automated axe-core testing deferred to Phase 2 (manual a11y testing still required)
6. **Visual Regression Tests**: Screenshot comparison tests not planned for any phase (manual visual QA sufficient)
7. **Mutation Testing**: Advanced coverage techniques (Stryker, etc.) deferred to Phase 3+
8. **Cross-Browser Testing**: Focus on Chrome/Firefox only in Phase 1 (Safari/Edge deferred to Phase 2)
9. **Test Parallelization**: Sequential test execution acceptable if under 15 seconds (parallel execution optimization deferred)
10. **Contract Testing**: API contract tests not applicable (localStorage-only, no external APIs in Phase 1)

## Dependencies *(prerequisites)*

1. **Vitest Configuration**: Vitest must be installed and configured (already done per CLAUDE.md)
2. **Coverage Thresholds**: `.coderabbit.yaml` and CI/CD configs must enforce 80%/90% thresholds (pending per Constitution)
3. **ADR-003**: Date arithmetic boundary handling decision must be documented (already exists)
4. **Feature Implementation**: Business logic must exist before it can be tested (categories, budgets, transactions, dashboard)
5. **localStorage Mocking**: Vitest mock setup for browser APIs must be configured
6. **TypeScript Strict Mode**: `strict: true` in tsconfig.json ensures type safety in tests (already enabled)
7. **Zod Schemas**: All business logic inputs/outputs must have Zod schemas defined (already implemented)
8. **Fast Pre-Commit Hooks**: Husky hooks must be configured to run tests in under 15 seconds (pending per Constitution)

## Risks *(potential blockers)*

1. **Test Execution Time**: Risk that tests exceed 15-second threshold as suite grows
   - **Mitigation**: Profile slow tests, optimize setup/teardown, parallelize if needed
2. **False Positives**: Risk of brittle tests that fail on valid code changes
   - **Mitigation**: Test public APIs only, avoid testing implementation details
3. **Coverage Gaming**: Risk of writing meaningless tests just to hit coverage percentages
   - **Mitigation**: Bot reviews check test quality, not just coverage numbers
4. **localStorage Mocking Complexity**: Risk that mocked localStorage doesn't match real browser behavior
   - **Mitigation**: Use battle-tested mocking libraries, add integration tests in Phase 2
5. **Test Maintenance Burden**: Risk that test suite becomes expensive to maintain as features evolve
   - **Mitigation**: Keep tests simple, refactor tests alongside code, delete obsolete tests
6. **Developer Resistance to TDD**: Risk that developers skip tests or write them after-the-fact
   - **Mitigation**: Phased TDD adoption (test-after → hybrid → strict) per Constitution v3.1
7. **Flaky Tests**: Risk of non-deterministic test failures due to timing, randomness, or state pollution
   - **Mitigation**: Reset mocks between tests, avoid real timers (use fake timers), seed random data

## Notes *(additional context)*

- This feature implements Constitution v3.1 Phase 1 TDD requirements: phased coverage (60%→80%), phased TDD adoption (test-after weeks 1-2, hybrid weeks 3-6, strict week 7+)
- Financial calculation coverage (90%+) is ALWAYS required, regardless of phase or week (money bugs are unacceptable)
- Test suite must align with ADR-003 (Date.setMonth boundary handling) to prevent calendar bugs
- Test execution speed (<15s) is critical for TDD workflow - developers abandon slow test suites
- This is the foundation for Phase 2 integration tests and Phase 3 full TDD coverage (80-90%)
- Bot reviews (Claude Code Bot + CodeRabbit AI) will enforce coverage thresholds and test quality
- Tests serve as living documentation - new developers learn business logic by reading tests
- Coverage thresholds will be enforced in CI/CD pipeline (build fails if below 80%/90%)
