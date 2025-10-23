# Tasks: Technical Debt Cleanup

**Feature**: 018-technical-debt-cleanup | **Branch**: `018-technical-debt-cleanup` | **Date**: 2025-10-23

## Overview

This feature systematically addresses 44 security vulnerabilities, type safety issues, and architectural improvements through 4 prioritized user stories. Each story is independently testable and can be delivered incrementally.

**Total Estimated Tasks**: 67 tasks
**Approach**: TDD (Test-Driven Development) - Tests written before implementation per project constitution

---

## Story Organization & Dependencies

### User Story Breakdown

| Story | Priority | Focus | Tasks | Independently Testable |
|-------|----------|-------|-------|----------------------|
| User Story 1 | P0 | Critical Security & Business Logic | 15 | ✅ Yes - Security fixes |
| User Story 2 | P1 | Type Safety & WCAG Compliance | 18 | ✅ Yes - Validation & accessibility |
| User Story 3 | P2 | Architecture & Runtime Validation | 20 | ✅ Yes - Architectural improvements |
| User Story 4 | P3 | Code Quality & Documentation | 8 | ✅ Yes - Code cleanup |

### Dependency Graph

```
Phase 1: Setup (Foundational)
    ↓
Phase 2: User Story 1 (P0) - Security Fixes [BLOCKING]
    ↓
Phase 3: User Story 2 (P1) - Type Safety & WCAG [Can run in parallel after US1]
    ↓
Phase 4: User Story 3 (P2) - Architecture [Can run in parallel after US1]
    ↓
Phase 5: User Story 4 (P3) - Code Quality [Can run in parallel after US1]
    ↓
Phase 6: Polish & Integration
```

**Critical Path**: Setup → US1 (P0) → Integration
**Parallel Opportunities**: US2, US3, US4 can execute in parallel after US1 completes

---

## MVP Scope

**Minimum Viable Product**: User Story 1 (P0) only

Delivers critical security fixes:
- Production console logging protection (FR-001)
- Generic API error messages (FR-002)
- Idempotency cache validation (FR-003)
- Fail-closed idempotency pattern (FR-004)
- 24-hour duplicate prevention (FR-005)

**MVP Success Criteria**:
- ✅ Zero payment logs in production console
- ✅ All API errors use generic message format
- ✅ Malformed cache data doesn't crash app
- ✅ Duplicate payments prevented for 24 hours

---

## Phase 1: Setup & Foundational Infrastructure

**Goal**: Establish baseline testing infrastructure and project structure

**Duration**: ~1 hour

### Tasks

- [x] T001 Verify development environment setup (TypeScript 5.8.3, Node.js 20.x, React 19.1.1)
- [x] T002 Install missing dependencies if needed (Zod 4.1.11, Vitest 3.2.4 confirmed in package.json)
- [x] T003 Create directory structure for new lib components (backend/src/lib/security/, backend/src/lib/validation/, backend/src/lib/utils/, frontend/src/lib/security/, frontend/src/lib/validation/)
- [x] T004 Set up baseline performance measurement script for build time and bundle size tracking (store in scripts/measure-performance.sh)
- [x] T005 Document baseline metrics (current build time, bundle size, test count) in specs/018-technical-debt-cleanup/BASELINE_METRICS.md

**Parallel Execution**: All tasks can run in parallel except T005 (depends on T004)

**Completion Criteria**:
- ✅ All directories exist
- ✅ Baseline metrics documented
- ✅ Build succeeds without errors

---

## Phase 2: User Story 1 - Critical Security & Business Logic Fixes (P0)

**Story Goal**: Protect payment information and prevent duplicate transactions

**Why This Priority**: Critical security issues that directly impact payment safety, user privacy, and system reliability. Must be fixed before production deployment.

**Independent Test**: Production build shows no payment logs, generic errors only, handles malformed cache without crashing, prevents duplicates for 24 hours.

### P0.1: ConsoleGuard (Frontend Security)

#### Tests
- [ ] T006 [P] [US1] Write unit test: ConsoleGuard logs in development (import.meta.env.DEV=true) in frontend/src/lib/security/ConsoleGuard.test.ts
- [ ] T007 [P] [US1] Write unit test: ConsoleGuard silent in production (import.meta.env.PROD=true) in frontend/src/lib/security/ConsoleGuard.test.ts
- [ ] T008 [P] [US1] Write unit test: ConsoleGuard preserves log levels (error/warn/log) in frontend/src/lib/security/ConsoleGuard.test.ts

#### Implementation
- [ ] T009 [US1] Implement ConsoleGuard class with environment detection in frontend/src/lib/security/ConsoleGuard.ts
- [ ] T010 [US1] Export singleton consoleGuard instance in frontend/src/lib/security/ConsoleGuard.ts
- [ ] T011 [US1] Replace console.error with consoleGuard.error in frontend/src/components/results/ResultsThisWeek.tsx
- [ ] T012 [US1] Run ConsoleGuard tests and verify all pass

### P0.2: ErrorSanitizer (Backend Security)

#### Tests
- [ ] T013 [P] [US1] Write unit test: ErrorSanitizer returns generic client message in backend/tests/unit/ErrorSanitizer.test.ts
- [ ] T014 [P] [US1] Write unit test: ErrorSanitizer preserves full error in server log in backend/tests/unit/ErrorSanitizer.test.ts
- [ ] T015 [P] [US1] Write unit test: ErrorSanitizer does not leak implementation details in backend/tests/unit/ErrorSanitizer.test.ts

#### Implementation
- [ ] T016 [US1] Implement ErrorSanitizer class with sanitize method in backend/src/lib/security/ErrorSanitizer.ts
- [ ] T017 [US1] Integrate ErrorSanitizer into API error handling in backend/src/api/plan.ts
- [ ] T018 [US1] Run ErrorSanitizer tests and verify all pass

### P0.3: Idempotency Cache Validation & Fail-Closed

#### Tests
- [ ] T019 [P] [US1] Write unit test: IdempotencyCacheSchema validates structure in backend/tests/unit/IdempotencySchemas.test.ts
- [ ] T020 [P] [US1] Write unit test: Malformed cache treated as miss (no crash) in backend/tests/integration/idempotency.test.ts
- [ ] T021 [P] [US1] Write unit test: Cache validation failure triggers fail-closed (abort operation) in backend/tests/integration/idempotency.test.ts
- [ ] T022 [P] [US1] Write unit test: 24-hour TTL prevents duplicates in backend/tests/integration/idempotency.test.ts

#### Implementation
- [ ] T023 [US1] Create IdempotencyCacheSchema with 64-char hash, timestamp, ttl validation in backend/src/lib/validation/IdempotencySchemas.ts
- [ ] T024 [US1] Update idempotency.ts to validate cache entries before use (FR-003) in backend/src/services/idempotency.ts
- [ ] T025 [US1] Implement fail-closed pattern (throw error on cache validation failure) in backend/src/services/idempotency.ts
- [ ] T026 [US1] Update TTL constant from 60 seconds to 86400000ms (24 hours) in backend/src/services/idempotency.ts
- [ ] T027 [US1] Run idempotency tests and verify all pass

**Phase 2 Completion Criteria**:
- ✅ All US1 tests passing (12 tests)
- ✅ Production console: zero payment logs
- ✅ API errors: generic message format only
- ✅ Malformed cache: no crashes
- ✅ Duplicates prevented for 24 hours

**Parallel Opportunities**: T006-T008 || T013-T015 || T019-T022 (all test writing can run in parallel)

---

## Phase 3: User Story 2 - Type Safety & WCAG Compliance (P1)

**Story Goal**: Ensure accessible interfaces and reliable financial calculations

**Why This Priority**: Type safety prevents financial errors; WCAG compliance is legally required and ensures all users can interact with payment controls.

**Independent Test**: Buttons meet 44×44px on mobile, malformed requests rejected, NaN detected, runtime validation works, browser APIs handled gracefully.

### P1.1: Numeric Validation (NaN Detection)

#### Tests
- [ ] T028 [P] [US2] Write unit test: PaymentAmountSchema rejects NaN in backend/tests/unit/NumericValidator.test.ts
- [ ] T029 [P] [US2] Write unit test: PaymentAmountSchema rejects Infinity in backend/tests/unit/NumericValidator.test.ts
- [ ] T030 [P] [US2] Write unit test: PaymentAmountSchema accepts negative as refund in backend/tests/unit/NumericValidator.test.ts
- [ ] T031 [P] [US2] Write unit test: PaymentAmountSchema rejects zero in backend/tests/unit/NumericValidator.test.ts

#### Implementation
- [ ] T032 [US2] Create NumericValidator with FiniteNumberSchema, PaymentAmountSchema in backend/src/lib/validation/NumericValidator.ts
- [ ] T033 [US2] Integrate NumericValidator into payment processing in backend/src/api/plan.ts
- [ ] T034 [US2] Run NumericValidator tests and verify all pass

### P1.2: API Request Validation (Zod Schemas)

#### Tests
- [ ] T035 [P] [US2] Write unit test: PlanRequestSchema validates valid request in backend/tests/unit/PlanRequestSchema.test.ts
- [ ] T036 [P] [US2] Write unit test: PlanRequestSchema rejects malformed request in backend/tests/unit/PlanRequestSchema.test.ts
- [ ] T037 [P] [US2] Write unit test: PlanRequestSchema enforces max 100 installments in backend/tests/unit/PlanRequestSchema.test.ts
- [ ] T038 [P] [US2] Write integration test: Malformed request returns 400 with generic error in backend/tests/integration/validation.test.ts

#### Implementation
- [ ] T039 [US2] Create PlanRequestSchema with InstallmentItemSchema in backend/src/lib/validation/PlanRequestSchema.ts
- [ ] T040 [US2] Integrate PlanRequestSchema validation into API endpoint in backend/src/api/plan.ts
- [ ] T041 [US2] Run PlanRequestSchema tests and verify all pass

### P1.3: Runtime Type Guards (UI Validation)

#### Tests
- [ ] T042 [P] [US2] Write unit test: RuntimeTypeGuard validates UI input values in frontend/tests/lib/RuntimeTypeGuard.test.ts
- [ ] T043 [P] [US2] Write unit test: RuntimeTypeGuard rejects invalid tab/radio values in frontend/tests/lib/RuntimeTypeGuard.test.ts

#### Implementation
- [ ] T044 [US2] Create RuntimeTypeGuard with input validation helpers in frontend/src/lib/validation/RuntimeTypeGuard.ts
- [ ] T045 [US2] Integrate RuntimeTypeGuard into InputCard component in frontend/src/components/inputs/InputCard.tsx
- [ ] T046 [US2] Integrate typed navigator.doNotTrack access in frontend/src/lib/telemetry/telemetry.ts
- [ ] T047 [US2] Run RuntimeTypeGuard tests and verify all pass

### P1.4: WCAG Button Touch Targets

#### Tests
- [ ] T048 [P] [US2] Write component test: Button 'sm' variant meets 44×44px on mobile in frontend/tests/components/button.test.tsx
- [ ] T049 [P] [US2] Write component test: All button variants meet WCAG minimum in frontend/tests/components/button.test.tsx

#### Implementation (RESEARCH FINDING: Already compliant!)
- [ ] T050 [US2] Verify button.constants.ts already implements 44×44px minimum in frontend/src/components/ui/button.constants.ts
- [ ] T051 [US2] Document WCAG compliance verification in specs/018-technical-debt-cleanup/WCAG_VERIFICATION.md
- [ ] T052 [US2] Run button tests and verify all pass

**Phase 3 Completion Criteria**:
- ✅ All US2 tests passing (13 tests)
- ✅ Buttons: ≥44×44px mobile
- ✅ API validation: 100% malformed requests rejected
- ✅ Numeric validation: 0% NaN occurrences
- ✅ Runtime guards: invalid inputs prevented

**Parallel Opportunities**: T028-T031 || T035-T038 || T042-T043 || T048-T049 (all test writing can run in parallel)

---

## Phase 4: User Story 3 - Architecture & Runtime Validation (P2)

**Story Goal**: Robust defenses against malicious inputs and edge cases

**Why This Priority**: Architectural improvements that prevent future bugs, improve maintainability, and strengthen security posture.

**Independent Test**: JSON depth limited to 10 levels, PII removed from cache, concurrent updates succeed, date validation timezone-independent.

### P2.1: PII Sanitization

#### Tests
- [ ] T053 [P] [US3] Write unit test: PiiSanitizer removes email field in backend/tests/unit/PiiSanitizer.test.ts
- [ ] T054 [P] [US3] Write unit test: PiiSanitizer removes name, phone, address, SSN in backend/tests/unit/PiiSanitizer.test.ts
- [ ] T055 [P] [US3] Write unit test: PiiSanitizer handles nested PII (userEmail, billingAddress) in backend/tests/unit/PiiSanitizer.test.ts
- [ ] T056 [P] [US3] Write unit test: PiiSanitizer preserves non-PII fields in backend/tests/unit/PiiSanitizer.test.ts
- [ ] T057 [P] [US3] Write unit test: PiiSanitizer uses structural sharing (no clone if no PII) in backend/tests/unit/PiiSanitizer.test.ts

#### Implementation
- [ ] T058 [US3] Create PiiSanitizer with recursive deep traversal in backend/src/lib/security/PiiSanitizer.ts
- [ ] T059 [US3] Implement PII field blocklist (email, name, phone, address, ssn) in backend/src/lib/security/PiiSanitizer.ts
- [ ] T060 [US3] Integrate PiiSanitizer into cache storage in backend/src/services/idempotency.ts
- [ ] T061 [US3] Run PiiSanitizer tests and verify all pass

### P2.2: JSON Depth Validation

#### Tests
- [ ] T062 [P] [US3] Write unit test: MaxDepthValidator counts depth correctly in backend/tests/unit/MaxDepthValidator.test.ts
- [ ] T063 [P] [US3] Write unit test: MaxDepthValidator rejects >10 levels in backend/tests/unit/MaxDepthValidator.test.ts
- [ ] T064 [P] [US3] Write unit test: MaxDepthValidator accepts ≤10 levels in backend/tests/unit/MaxDepthValidator.test.ts

#### Implementation
- [ ] T065 [US3] Create MaxDepthValidator with recursive depth counting in backend/src/lib/utils/MaxDepthValidator.ts
- [ ] T066 [US3] Integrate MaxDepthValidator into cache validation in backend/src/services/idempotency.ts
- [ ] T067 [US3] Run MaxDepthValidator tests and verify all pass

### P2.3: Atomic Payment Updates

#### Tests
- [ ] T068 [P] [US3] Write unit test: PaymentContext uses functional setState in frontend/tests/contexts/PaymentContext.test.tsx
- [ ] T069 [P] [US3] Write unit test: Concurrent updates don't lose data in frontend/tests/contexts/PaymentContext.test.tsx
- [ ] T070 [P] [US3] Write unit test: useOptimistic provides instant UI feedback in frontend/tests/contexts/PaymentContext.test.tsx

#### Implementation
- [ ] T071 [US3] Refactor PaymentContext to use functional setState pattern in frontend/src/contexts/PaymentContext.tsx
- [ ] T072 [US3] Integrate React 19 useOptimistic hook for optimistic updates in frontend/src/contexts/PaymentContext.tsx
- [ ] T073 [US3] Run PaymentContext tests and verify all pass

### P2.4: Timezone-Independent Date Validation

#### Tests
- [ ] T074 [P] [US3] Write unit test: TimezoneHandler validates IANA timezone format in backend/tests/unit/TimezoneHandler.test.ts
- [ ] T075 [P] [US3] Write unit test: Date sorting uses timestamp comparison in backend/tests/unit/dateUtils.test.ts

#### Implementation
- [ ] T076 [US3] Create TimezoneHandler with UTC normalization in backend/src/lib/utils/TimezoneHandler.ts
- [ ] T077 [US3] Update date sorting to use timestamp comparison in backend/src/lib/utils/dateUtils.ts
- [ ] T078 [US3] Run timezone tests and verify all pass

**Phase 4 Completion Criteria**:
- ✅ All US3 tests passing (15 tests)
- ✅ PII removal: email, name, phone, address, SSN
- ✅ JSON depth: 10-level limit enforced
- ✅ Atomic updates: race-free
- ✅ Date validation: timezone-independent

**Parallel Opportunities**: T053-T057 || T062-T064 || T068-T070 || T074-T075 (all test writing can run in parallel)

---

## Phase 5: User Story 4 - Code Quality & Documentation (P3)

**Story Goal**: Maintainable code that works across different environments

**Why This Priority**: Code quality improvements that improve developer experience, reduce future bugs, and make codebase easier to maintain.

**Independent Test**: No redundant styles, scripts portable, date sorting reliable, suppressions documented.

### P3.1: Code Quality Fixes

#### Tests
- [ ] T079 [P] [US4] Write unit test: Date sorting uses timestamps (not localeCompare) in backend/tests/unit/dateUtils.test.ts
- [ ] T080 [P] [US4] Write linting test: No eslint-disable without explanation in scripts/lint-check.sh

#### Implementation
- [ ] T081 [US4] Remove redundant inline styles from MobileMenu component in frontend/src/styles/components/MobileMenu.tsx
- [ ] T082 [US4] Update fix-lint.sh to use relative paths (remove hardcoded /home/username/) in scripts/fix-lint.sh
- [ ] T083 [US4] Add JSDoc @todo comments for all eslint-disable statements with ticket references
- [ ] T084 [US4] Run code quality tests and verify all pass

**Phase 5 Completion Criteria**:
- ✅ All US4 tests passing (2 tests)
- ✅ No redundant inline styles
- ✅ Scripts portable across machines
- ✅ Date sorting reliable
- ✅ All suppressions documented

**Parallel Opportunities**: T079 || T080 (test writing can run in parallel)

---

## Phase 6: Polish & Integration

**Goal**: Validate entire feature, ensure all quality gates pass

**Duration**: ~2 hours

### Integration & Validation

- [ ] T085 Run full test suite (all 1387 existing + new tests) and verify 100% pass rate
- [ ] T086 Run TypeScript compilation and verify zero errors
- [ ] T087 Run ESLint and verify zero errors
- [ ] T088 Measure build time and verify ≤110% baseline (NFR-004)
- [ ] T089 Measure bundle size and verify ≤105% baseline (NFR-004)
- [ ] T090 Run manual testing scenarios from quickstart.md (P0 tests minimum)
- [ ] T091 Verify all Success Criteria met (SC-001 through SC-010)
- [ ] T092 Update CLAUDE.md with any new patterns or learnings

**Parallel Execution**: T085, T086, T087 can run in parallel

**Completion Criteria**:
- ✅ All 1387 existing tests + new tests passing
- ✅ Zero TypeScript errors
- ✅ Zero linting errors
- ✅ Build time ≤110% baseline
- ✅ Bundle size ≤105% baseline
- ✅ All 10 success criteria met

---

## Parallel Execution Strategy

### Maximum Parallelization by Phase

**Phase 2 (US1 - P0 Security)**:
- Parallel set 1: T006-T008 (ConsoleGuard tests) || T013-T015 (ErrorSanitizer tests) || T019-T022 (Idempotency tests)
- Sequential: T009-T012 → T016-T018 → T023-T027 (implementations)

**Phase 3 (US2 - P1 Type Safety)**:
- Parallel set 1: T028-T031 (Numeric tests) || T035-T038 (Schema tests) || T042-T043 (TypeGuard tests) || T048-T049 (Button tests)
- Sequential: T032-T034 → T039-T041 → T044-T047 → T050-T052 (implementations)

**Phase 4 (US3 - P2 Architecture)**:
- Parallel set 1: T053-T057 (PII tests) || T062-T064 (Depth tests) || T068-T070 (Atomic tests) || T074-T075 (Timezone tests)
- Sequential: T058-T061 → T065-T067 → T071-T073 → T076-T078 (implementations)

**Phase 5 (US4 - P3 Code Quality)**:
- Parallel set 1: T079 || T080 (all tests)
- Sequential: T081-T084 (implementations)

**Cross-Phase Parallelization**:
After US1 (P0) completes, US2 (P1) || US3 (P2) || US4 (P3) can all execute in parallel.

---

## Testing Strategy

**Approach**: Test-Driven Development (TDD)

**Test Organization**:
- Unit tests: backend/tests/unit/, frontend/tests/lib/
- Component tests: frontend/tests/components/
- Integration tests: backend/tests/integration/

**Test Count by Story**:
- User Story 1 (P0): 12 tests
- User Story 2 (P1): 13 tests
- User Story 3 (P2): 15 tests
- User Story 4 (P3): 2 tests
- **Total New Tests**: 42 tests
- **Total with Existing**: 1429 tests (1387 + 42)

**Coverage Requirements**:
- All new components: 100% unit test coverage
- All modified files: Regression tests added
- Integration flows: End-to-end tests for P0 scenarios

---

## Implementation Strategy

### MVP-First Approach

**Week 1**: User Story 1 (P0) only
- Deploy to production immediately after US1 completion
- Delivers critical security fixes
- 15 tasks, ~8-10 hours

**Week 2**: User Stories 2, 3, 4 (P1-P3)
- Can be developed in parallel
- Deploy incrementally as each story completes
- 51 tasks, ~15-20 hours total

### Incremental Delivery

Each user story is independently deployable:
1. **After US1**: Production has critical security fixes
2. **After US2**: Add type safety and accessibility
3. **After US3**: Add architectural improvements
4. **After US4**: Code quality enhanced

### Risk Mitigation

- All changes maintain 100% backward compatibility (NFR-005)
- Existing test suite must pass at every phase
- Feature flags not needed (fixes don't change user-facing behavior)
- Rollback strategy: Revert individual user story if issues detected

---

## Success Metrics Tracking

Track these metrics throughout implementation:

| Metric | Baseline | Target | Tracking Method |
|--------|----------|--------|-----------------|
| Test Pass Rate | 1387/1387 (100%) | 1429/1429 (100%) | `npm test` |
| Build Time | [Baseline TBD] | ≤110% baseline | `scripts/measure-performance.sh` |
| Bundle Size | [Baseline TBD] | ≤105% baseline | `scripts/measure-performance.sh` |
| TypeScript Errors | 0 | 0 | `tsc --noEmit` |
| ESLint Errors | 0 | 0 | `npm run lint` |
| P0 Issues Remaining | 5 | 0 | Manual verification |
| P1 Issues Remaining | 5 | 0 | Manual verification |
| Production Console Logs | [Unknown] | 0 | Manual testing (prod build) |
| API Generic Error Rate | [Unknown] | 100% | Manual testing |
| Duplicate Payment Rate | [Unknown] | 0% (24hr window) | Manual testing |

---

## Notes

- **CodeRabbit Source**: 44 findings from commit 80aa6a6
- **Linear Epic**: MMT-31 (User Stories map to MMT-21 through MMT-30, MMT-32)
- **Total Estimated Effort**: 25-30 hours (including tests)
- **Recommended MVP**: User Story 1 only (P0) for initial deployment
- **Backward Compatibility**: All changes maintain existing API contracts
- **No Breaking Changes**: Feature is purely internal improvements
- **Test Infrastructure**: Vitest 3.2.4 already configured, no changes needed

---

## Validation Checklist

Before marking feature complete:

### User Story 1 (P0) - Critical Security
- [ ] Production console: zero payment logs (SC-001)
- [ ] API errors: generic message format (SC-002)
- [ ] Malformed cache: no crashes (SC-003)
- [ ] Duplicates: prevented 24 hours (SC-004)

### User Story 2 (P1) - Type Safety & WCAG
- [ ] Buttons: ≥44×44px mobile (SC-005)
- [ ] API validation: 100% rejection rate (SC-006)
- [ ] Numeric validation: 0% NaN (SC-007)

### User Story 3 (P2) - Architecture
- [ ] JSON depth: 10-level limit enforced
- [ ] PII: removed from cache (email, name, phone, address, SSN)
- [ ] Atomic updates: race-free

### User Story 4 (P3) - Code Quality
- [ ] No redundant styles
- [ ] Scripts portable
- [ ] Suppressions documented

### Overall Quality Gates
- [ ] Tests: 1429/1429 passing (SC-008)
- [ ] P0 issues: 0 remaining (SC-009)
- [ ] P1 issues: 0 remaining (SC-010)
- [ ] Build time: ≤110% baseline
- [ ] Bundle size: ≤105% baseline
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Backward compatibility: maintained
