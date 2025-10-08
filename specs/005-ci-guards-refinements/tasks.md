# Tasks: CI Guards Refinements (Delta 0017)

**Input**: [plan.md](plan.md)
**Prerequisites**: Delta 0014 merged ✅

---

## Phase 0: Setup

- [X] T001 Create feature branch `005-ci-guards-refinements` from `main`
- [X] T002 Verify Delta 0014 artifacts present (audit script, perf tests, guards workflow)

---

## Phase 1: Core Refinements (Required - 66 LOC)

### FR-1: Audit Script Regex Improvement

- [X] T003 [P] Update `scripts/audit-spec-paths.mjs` with dual regex patterns (code-span + markdown link)
- [X] T004 [P] Test audit script with spec files containing both reference formats

### FR-2: ESLint Rule Validation Tests

- [X] T005 [P] Create `frontend/tests/unit/eslint-rules.test.ts` with 3 test cases
- [X] T006 Run `npm test` in frontend/ to verify ESLint rule validation tests pass

### FR-3: Performance Test Warmup

- [X] T007 [P] Add warmup run to `frontend/tests/performance/ci-gate.test.ts` (discard first iteration)

### FR-4: Dynamic Median Calculation

- [X] T008 Add `median()` function to `frontend/tests/performance/ci-gate.test.ts`
- [X] T009 Replace `results[1]` with `median(results)` in performance test
- [X] T010 [P] Add unit tests for `median()` function (n=1, odd, even cases)

---

## Phase 2: Integration & Validation

- [X] T011 Run full test suite (`npm run test:all`) and verify all tests pass
- [X] T012 Run audit script (`npm run audit:specs`) and verify improved regex works
- [X] T013 Run performance tests (`npm run test:perf`) and verify warmup + median work

---

## Phase 3: Documentation

- [X] T014 [P] Create `ops/deltas/0017_ci_guards_refinements.md` with summary of changes
- [X] T015 Commit all changes with Delta 0017 message

---

## Optional Phase: Enhancements (71 LOC - DEFERRED)

These tasks are marked for future delta if needed:

- [ ] T016 [DEFERRED] Create `.github/workflows/bundle-size.yml` for bundle tracking
- [ ] T017 [DEFERRED] Add `budgets.bundle` field to `frontend/package.json`
- [ ] T018 [DEFERRED] Create `frontend/tests/performance/README.md` documenting baseline environment

---

## Dependencies

- T002 blocks T003-T010 (must verify Delta 0014 present)
- T003-T010 can run in parallel (different files)
- T011-T013 block T014 (validation before docs)

---

## Parallel Execution Example

```bash
# After T002 completes, launch T003, T005, T007, T010 in parallel:
Task: "Update scripts/audit-spec-paths.mjs with dual regex patterns"
Task: "Create frontend/tests/unit/eslint-rules.test.ts with 3 test cases"
Task: "Add warmup run to frontend/tests/performance/ci-gate.test.ts"
Task: "Add unit tests for median() function"
```

---

## Validation Checklist

- [ ] All required tests pass (eslint-rules.test.ts, median unit tests)
- [ ] Audit script detects both `` `file.ts` `` and `[text](file.ts)` formats
- [ ] Performance test uses warmup and dynamic median
- [ ] Zero production code changes
- [ ] LOC budget: 66 lines (within ≤150 limit)

---

**Status**: ✅ Tasks ready | **Next**: Execute `/implement`
