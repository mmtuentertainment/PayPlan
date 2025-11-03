# Implementation Plan: Business Logic Test Coverage

**Branch**: `063-short-name-business` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/063-short-name-business/spec.md`

## Summary

This feature establishes comprehensive test coverage for business logic in PayPlan to meet Phase 1 TDD requirements. The primary requirement is achieving **80%+ coverage for all business logic** (`features/*/lib/**/*.ts`) and **90%+ coverage for financial calculations** (`features/budgets/lib/calculations.ts`) while maintaining a **<15 second test suite execution time** for fast TDD feedback loops.

**Technical Approach** (from research):
- Use Vitest 3.2.4 (already configured) with v8 coverage provider
- Co-locate tests in `__tests__` directories within each `lib/` folder
- Mock localStorage using Vitest's `vi.mock()` capabilities
- Create reusable fixture data in `fixtures/` directories
- Target P1 features first (financial calculations, storage services), then P2 (schemas, aggregation), then P3 (gamification)
- Configure CI/CD coverage thresholds to fail builds below 80%/90%
- Optimize for speed: 5s test timeout, parallel execution, minimal setup/teardown

## Technical Context

**Language/Version**: TypeScript 5.8.3 (strict mode enabled)
**Primary Dependencies**:
- Vitest 3.2.4 (test runner, already installed)
- @vitest/ui 3.2.4 (test UI, already installed)
- @vitest/coverage-v8 (coverage provider, needs verification)
- jsdom (browser environment simulation, already configured)
- Zod 4.1.11 (schema validation to test)

**Storage**: localStorage (browser API, will be mocked in tests)
**Testing**: Vitest with v8 coverage provider, jsdom environment
**Target Platform**: Browser (Chrome/Firefox primary, Phase 1)
**Project Type**: Web application (React 19.1.1 frontend)

**Performance Goals**:
- Test suite completes in <15 seconds (critical for TDD workflow)
- Coverage reports generate in <5 seconds
- Watch mode re-runs affected tests in <2 seconds

**Constraints**:
- Must not test implementation details (only public APIs)
- Tests must be deterministic (no flaky tests)
- Must mock browser APIs (localStorage, Date, etc.)
- Must support watch mode for TDD workflow
- Coverage reports must be human-readable (HTML format)

**Scale/Scope**:
- **P1**: 2 features (budgets calculations ~200 LOC, storage services ~600 LOC)
- **P2**: 2 features (schemas ~150 LOC, aggregation ~300 LOC)
- **P3**: 1 feature (gamification ~200 LOC)
- **Total**: ~1,450 LOC of business logic to test
- **Expected test LOC**: ~2,500 LOC (1.7x ratio typical for comprehensive tests)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Immutable Principles Compliance

✅ **Privacy-First (Principle I)**: Not applicable - test infrastructure doesn't handle user data
✅ **Accessibility-First (Principle II)**: Not applicable - test infrastructure (manual UI testing per Phase 1)
✅ **Free Core (Principle III)**: Not applicable - test infrastructure is development tooling

### Phase 1 Requirements Compliance

✅ **TDD for Business Logic**: This feature IMPLEMENTS the requirement (80%/90% coverage targets)
✅ **Manual UI Testing**: Spec explicitly excludes UI component tests (Out of Scope item 1)
✅ **Privacy Compliance**: Tests will verify PII sanitization in edge cases
✅ **Features Must Work**: Tests ensure business logic reliability
✅ **WCAG 2.2 AA**: Not applicable to test infrastructure
✅ **localStorage-First**: Tests will verify storage service correctness

### Quality Gates (v3.1)

**Layer 1 - Pre-Commit Hooks** (Fast <15s):
- ✅ **Tests Must Run in <15s**: Spec requirement FR-003, success criterion SC-001
- ✅ **ESLint + Prettier**: Test files will follow linting rules
- ✅ **TypeScript Check**: Test files will be strictly typed

**Layer 2 - CI/CD Pipeline**:
- ✅ **Coverage Thresholds**: FR-004 requires CI/CD enforcement
- ✅ **Build Fails Below Thresholds**: SC-004 requires regression prevention
- ⚠️ **Phased Coverage** (60%→70%→80%): Needs clarification on phasing strategy for this feature

**Layer 3 - Bot Reviews**:
- ✅ **CodeRabbit AI**: Will enforce test quality, coverage, edge cases
- ✅ **Claude Code Bot**: Will verify test patterns, no implementation details tested

### YAGNI/Simplicity Compliance (Principle VII)

✅ **Simple Testing Strategy**: Co-located tests, standard Vitest patterns, no custom frameworks
✅ **Incremental Rollout**: P1→P2→P3 phased approach (assumption 6 in spec)
✅ **No Over-Engineering**: No mutation testing, visual regression, cross-browser in Phase 1
✅ **Defer Complexity**: Integration tests, E2E tests, performance benchmarks all deferred

### Gate Status: ✅ **PASS**

All immutable principles respected, Phase 1 requirements met, quality gates addressed. One clarification needed (phased coverage strategy) will be resolved in Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/063-short-name-business/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated - test utilities API)
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── features/                    # Feature-based architecture
│   │   ├── budgets/
│   │   │   └── lib/
│   │   │       ├── __tests__/       # ⭐ NEW: Budget tests
│   │   │       │   ├── fixtures/    # ⭐ NEW: Test data
│   │   │       │   │   └── budget-fixtures.ts
│   │   │       │   ├── calculations.test.ts  # ⭐ NEW: P1 (90%+ coverage)
│   │   │       │   ├── BudgetStorageService.test.ts  # ⭐ NEW: P1
│   │   │       │   └── schemas.test.ts       # ⭐ NEW: P2
│   │   │       ├── calculations.ts
│   │   │       ├── BudgetStorageService.ts
│   │   │       └── schemas.ts
│   │   ├── categories/
│   │   │   └── lib/
│   │   │       ├── __tests__/       # ⭐ NEW: Category tests
│   │   │       │   ├── fixtures/
│   │   │       │   │   └── category-fixtures.ts
│   │   │       │   ├── CategoryStorageService.test.ts  # ⭐ NEW: P1
│   │   │       │   └── schemas.test.ts       # ⭐ NEW: P2
│   │   │       ├── CategoryStorageService.ts
│   │   │       └── schemas.ts
│   │   ├── transactions/
│   │   │   └── lib/
│   │   │       ├── __tests__/       # ⭐ NEW: Transaction tests
│   │   │       │   ├── fixtures/
│   │   │       │   │   └── transaction-fixtures.ts
│   │   │       │   ├── TransactionStorageService.test.ts  # ⭐ NEW: P1
│   │   │       │   └── schemas.test.ts       # ⭐ NEW: P2
│   │   │       ├── TransactionStorageService.ts
│   │   │       └── schemas.ts
│   │   ├── dashboard/
│   │   │   └── lib/
│   │   │       ├── __tests__/       # ⭐ NEW: Dashboard tests
│   │   │       │   ├── fixtures/
│   │   │       │   │   └── dashboard-fixtures.ts
│   │   │       │   ├── aggregation.test.ts   # ⭐ NEW: P2
│   │   │       │   └── gamification.test.ts  # ⭐ NEW: P3
│   │   │       ├── aggregation.ts
│   │   │       └── gamification.ts
│   │   └── archive/
│   │       └── lib/
│   │           ├── __tests__/       # ✅ EXISTING: Archive tests (4 files)
│   │           │   ├── ArchiveService.test.ts
│   │           │   ├── ArchiveStorage.test.ts
│   │           │   ├── validation.test.ts
│   │           │   └── performance.test.ts
│   │           ├── ArchiveService.ts
│   │           └── ArchiveStorage.ts
│   └── shared/
│       └── lib/
│           └── __tests__/           # ⚠️ FUTURE: Shared utilities tests (Phase 2)
│               └── test-utils.ts    # ⭐ NEW: Shared test helpers
├── tests/
│   ├── setup.ts                     # ⚠️ UPDATE: Add localStorage mocks
│   └── fixtures/                    # ⭐ NEW: Shared test fixtures
│       └── shared-fixtures.ts       # Common test data (dates, IDs, etc.)
├── vite.config.ts                   # ⚠️ UPDATE: Coverage thresholds
└── package.json                     # ✅ Already has Vitest 3.2.4
```

**Structure Decision**:
- Use **feature-based co-location** for tests (`features/*/lib/__tests__/`)
- Each feature gets its own `fixtures/` directory for test data
- Shared test utilities go in `shared/lib/__tests__/test-utils.ts`
- Global test setup in `tests/setup.ts` (localStorage mocking)
- This structure aligns with PayPlan's feature-based architecture reorganization (Nov 2025)

**Key Changes**:
1. ⭐ **NEW**: Add `__tests__/` directories in 5 features (budgets, categories, transactions, dashboard, archive already has tests)
2. ⭐ **NEW**: Create `fixtures/` subdirectories for reusable test data
3. ⭐ **NEW**: Implement 13 test files (P1: 4 files, P2: 4 files, P3: 1 file, shared: 4 files)
4. ⚠️ **UPDATE**: Enhance `tests/setup.ts` with localStorage mocks
5. ⚠️ **UPDATE**: Adjust `vite.config.ts` coverage thresholds (already at 80%, may need per-file overrides)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All constitution requirements are met:
- Privacy-First: N/A (test infrastructure)
- Accessibility-First: N/A (test infrastructure)
- Free Core: N/A (development tooling)
- Phase 1 TDD: This feature implements the requirement
- YAGNI: Simple Vitest setup, no custom frameworks
- Quality Gates: <15s execution, CI/CD enforcement

## Phase 0: Research Tasks

### Research Task 1: Phased Coverage Strategy
**Question**: How to implement phased coverage ramp (60%→70%→80%) for this test infrastructure feature?

**Context**: Constitution v3.1 requires phased coverage (60% weeks 1-2, 70% weeks 3-6, 80% week 7+), but this feature implements the test infrastructure itself. Should we:
- A) Implement all tests to 80%/90% immediately (this feature enables TDD for others)
- B) Follow phased approach (60%→80% over 3 weeks)
- C) Different strategy for infrastructure vs. application code

**Best Practice Research Needed**: Coverage ramp strategies for test infrastructure vs. application code

---

### Research Task 2: localStorage Mocking Best Practices
**Question**: What's the best way to mock localStorage in Vitest for deterministic, realistic tests?

**Research Areas**:
- Vitest built-in mocking (`vi.mock()`, `vi.stubGlobal()`)
- localStorage mock libraries (vitest-localstorage-mock, etc.)
- Quota exceeded error simulation (QuotaExceededError)
- Concurrent write simulation
- Reset strategies (beforeEach, afterEach, global setup)

**Deliverable**: Recommended mocking approach with example code

---

### Research Task 3: Fast Test Execution Strategies
**Question**: How to keep test suite under 15 seconds as it grows to 2,500+ LOC?

**Research Areas**:
- Vitest parallel execution (default behavior, configuration)
- Test timeout optimization (current: 5s, may need reduction)
- Setup/teardown optimization (minimize per-test overhead)
- Fixture reuse strategies (singleton vs. factory patterns)
- Coverage collection overhead (v8 vs. c8 performance)
- Watch mode optimization (affected tests only, no full re-runs)

**Deliverable**: Performance optimization checklist and configuration recommendations

---

### Research Task 4: Test Fixture Design Patterns
**Question**: What's the best pattern for reusable, maintainable test fixtures?

**Research Areas**:
- Factory functions vs. object literals vs. classes
- Builder pattern for complex objects (budgets, transactions)
- Trait/mixin patterns for variations (valid/invalid, edge cases)
- Fixture organization (shared vs. feature-specific)
- TypeScript typing for fixtures (ensuring type safety)
- Fixture versioning (handling data model changes)

**Deliverable**: Recommended fixture pattern with examples for budgets, categories, transactions

---

### Research Task 5: Financial Calculation Testing Best Practices
**Question**: How to achieve 90%+ coverage for financial calculations with edge cases?

**Research Areas**:
- Property-based testing (fast-check library) vs. example-based testing
- Boundary value analysis (month edges, year edges, leap years per ADR-003)
- Floating-point rounding strategies (cents vs. dollars, precision)
- Date arithmetic edge cases (Date.setMonth() boundary handling)
- Currency conversion testing (if applicable)
- Negative testing (invalid inputs, NaN, Infinity)

**Deliverable**: Financial calculation test strategy with edge case catalog

---

### Research Task 6: CI/CD Coverage Enforcement
**Question**: How to configure GitHub Actions to fail builds below 80%/90% thresholds?

**Research Areas**:
- Vitest coverage reporters (text, json, lcov)
- GitHub Actions coverage plugins (codecov, coveralls)
- Custom coverage gates (bash scripts, GitHub Actions expressions)
- Per-feature coverage enforcement (budgets 90%, others 80%)
- Coverage trend tracking (prevent regression)
- Bot integration (CodeRabbit, Claude Code Bot coverage checks)

**Deliverable**: GitHub Actions workflow configuration with coverage gates

---

## Phase 1: Design (Blocked until Phase 0 complete)

Phase 1 will generate:
- **data-model.md**: Test fixtures, test utilities, mock configurations (entities for testing)
- **contracts/**: Test utility APIs (localStorage mocks, fixture factories, assertion helpers)
- **quickstart.md**: How to run tests, write new tests, debug test failures

**Note**: Phase 1 execution depends on research findings from Phase 0. Will generate these files after research completion.

---

## Next Steps

1. ✅ **Phase 0 Complete**: Generate `research.md` resolving all 6 research tasks
2. ⏳ **Phase 1 Pending**: Generate `data-model.md`, `contracts/`, `quickstart.md` after research
3. ⏳ **Phase 2 Pending**: Run `/speckit.tasks` to generate executable task breakdown

**Command to continue**: After reviewing this plan, proceed with research phase (automated in `/speckit.plan` workflow).
