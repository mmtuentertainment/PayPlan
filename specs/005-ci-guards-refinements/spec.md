# Feature Specification: CI Guards Refinements (Delta 0017)

**Feature ID:** 005-ci-guards-refinements
**Delta:** 0017
**Type:** Tooling Enhancement
**Priority:** Medium
**Status:** Draft
**Prerequisites:** Delta 0014 (CI Guards - PR #9)

---

## 1. Overview

**What**: Post-merge refinements to CI guards based on CodeRabbit and Claude review bot feedback from PR #9.

**Why**: Address technical debt and improve robustness of CI guard implementations before they become production-critical.

**Scope**: 6 refinements to scripts and tests created in Delta 0014:
1. Improve audit script regex patterns
2. Add ESLint rule validation tests
3. Add performance test warmup runs
4. Make median calculation dynamic
5. (Optional) Add bundle size tracking
6. (Optional) Document baseline environment

---

## 2. User Stories

### US-1: Robust Spec Path Detection
**As a** repository maintainer
**I want** the audit script to reliably detect all markdown link formats
**So that** stale spec references are caught regardless of formatting variations

**Acceptance Criteria:**
- Detects code-span style: `` `path/to/file.ts` ``
- Detects markdown links: `[text](path/to/file.ts)`
- Handles both inline code and linked references
- Passes validation tests with edge cases

---

### US-2: Validated ESLint Rules
**As a** developer
**I want** automated tests that verify no-restricted-imports rules work correctly
**So that** architectural boundaries are enforced with confidence

**Acceptance Criteria:**
- Test suite validates legacy import blocking
- Positive test: valid imports pass
- Negative test: legacy imports fail with specific error messages
- Tests run in CI on every PR

---

### US-3: Stable Performance Measurements
**As a** CI pipeline maintainer
**I want** performance tests to use warmup runs
**So that** cold-start variance doesn't cause false positives

**Acceptance Criteria:**
- 1 warmup iteration before measured runs
- Warmup results discarded from median calculation
- No impact on overall test duration (still <250ms threshold)
- Documented in test file comments

---

### US-4: Accurate Median Calculation
**As a** developer
**I want** the median function to work with any sample size
**So that** performance statistics remain accurate if sample count changes

**Acceptance Criteria:**
- Replaces hardcoded `[1]` index with proper median function
- Works for odd sample sizes (e.g., n=3 → index 1)
- Works for even sample sizes (e.g., n=4 → average of indices 1 and 2)
- Unit tests verify correctness

---

### US-5: Bundle Size Regression Testing (Optional)
**As a** frontend developer
**I want** automated bundle size tracking
**So that** production bundle growth is monitored and prevented

**Acceptance Criteria:**
- Baseline bundle size recorded in package.json or config
- CI workflow compares current vs. baseline
- Fails if bundle size increases >10% without justification
- Non-blocking initially (continue-on-error: true)

---

### US-6: Performance Baseline Documentation (Optional)
**As a** team member
**I want** documented baseline measurement conditions
**So that** performance benchmarks are reproducible

**Acceptance Criteria:**
- Documented in `frontend/tests/performance/README.md`
- Includes: CPU model, Node.js version, WSL2 details
- Includes: Measurement methodology (median of 3 runs)
- Includes: Expected baseline values with acceptable variance

---

## 3. Functional Requirements

### FR-1: Audit Script Regex Improvement
**What**: Replace single `linkRegex` pattern with separate patterns for code spans and markdown links

**Why**: Current pattern may miss certain reference formats (CodeRabbit finding)

**Details**:
- Use CodeRabbit's suggested pattern: `` const codeSpanRegex = /`([^`]+\.(ts|js|tsx|jsx))`/g; ``
- Add second pattern: `const linkRegex = /\[.*?\]\(([^)]+\.(ts|js|tsx|jsx))\)/g;`
- Combine results from both patterns
- Update validation tests

**File**: `scripts/audit-spec-paths.mjs`
**LOC Impact**: ~5 lines changed

---

### FR-2: ESLint Rule Validation Tests
**What**: Create test suite that validates no-restricted-imports rules actually block legacy imports

**Why**: Ensures architectural enforcement works as intended (CodeRabbit suggestion)

**Details**:
- Create `frontend/tests/unit/eslint-rules.test.ts`
- Test 1: Import from `../lib/shifter` → expect error
- Test 2: Import from `../extraction/shifter` → expect success
- Use ESLint programmatic API (ESLint class)
- Run in CI via npm test

**File**: `frontend/tests/unit/eslint-rules.test.ts` (new)
**LOC Impact**: ~50 lines

---

### FR-3: Performance Test Warmup Runs
**What**: Add 1 warmup iteration before measured performance runs

**Why**: Eliminate cold-start variance for more stable measurements (CodeRabbit suggestion)

**Details**:
- In `frontend/tests/performance/ci-gate.test.ts`
- Before main loop: execute shifter once and discard result
- Document reason in code comment
- Verify no impact on threshold compliance

**File**: `frontend/tests/performance/ci-gate.test.ts`
**LOC Impact**: ~3 lines added

---

### FR-4: Dynamic Median Calculation
**What**: Replace hardcoded `results[1]` with proper median function

**Why**: Hardcoding assumes exactly 3 samples; breaks if sample count changes (CodeRabbit finding)

**Details**:
```javascript
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
```
- Replace `results[1]` with `median(results)`
- Add unit tests for median function

**File**: `frontend/tests/performance/ci-gate.test.ts`
**LOC Impact**: ~8 lines added

---

### FR-5: Bundle Size Tracking (Optional)
**What**: Add GitHub Actions workflow to track production bundle size

**Why**: Prevent regression without manual monitoring

**Details**:
- New workflow: `.github/workflows/bundle-size.yml`
- Runs `npm run build` in frontend/
- Extracts `dist/index.js` size from build output
- Compares to baseline in `frontend/package.json` field `"budgets": {"bundle": 250000}`
- Posts to GitHub Step Summary with size trend
- Non-blocking (`continue-on-error: true`)

**Files**:
- `.github/workflows/bundle-size.yml` (new, ~40 lines)
- `frontend/package.json` (add budgets field, ~1 line)

**LOC Impact**: ~41 lines

---

### FR-6: Baseline Environment Documentation (Optional)
**What**: Document measurement conditions for performance baselines

**Why**: Enable reproducible benchmarking (CodeRabbit suggestion)

**Details**:
- Create `frontend/tests/performance/README.md`
- Sections:
  1. **Baseline Environment**: CPU, Node.js version, WSL2 details
  2. **Measurement Methodology**: Median of 3 runs, warmup explained
  3. **Current Baselines**: `shifter: 150ms ± 20ms`, threshold `<250ms`
  4. **Updating Baselines**: When and how to adjust thresholds

**File**: `frontend/tests/performance/README.md` (new)
**LOC Impact**: ~30 lines

---

## 4. Non-Functional Requirements

### NFR-1: Zero Runtime Impact
- All changes are to tooling, tests, and documentation
- No production code modified
- No API changes

### NFR-2: Backward Compatibility
- All existing CI workflows continue to function
- No breaking changes to scripts or tests
- Graceful degradation if optional features unavailable

### NFR-3: LOC Budget
- **Total**: ≤150 LOC across all files
- **Required items (FR-1 to FR-4)**: ~66 LOC
- **Optional items (FR-5 to FR-6)**: ~71 LOC

### NFR-4: Test Coverage
- ESLint rule validation: 2 test cases (positive + negative)
- Median function: 3 test cases (n=1, n=3 odd, n=4 even)

---

## 5. Out of Scope

- Changing performance thresholds (keep 250ms)
- Modifying ESLint rules themselves (only testing them)
- Adding new guards beyond Delta 0014 scope
- Implementing blocking enforcement (guards remain non-blocking)

---

## 6. Technical Constraints

- Must work in GitHub Actions Ubuntu runners
- Must use existing npm scripts (no new dependencies)
- Must maintain non-blocking behavior (`continue-on-error: true`)
- Must not increase CI duration by >10 seconds

---

## 7. Dependencies

- **Depends on**: Delta 0014 (PR #9) merged ✅
- **Blocks**: None (pure refinements)
- **Related**: Delta 0015/0016 (PR #10) merged ✅

---

## 8. Success Metrics

- All 6 refinements implemented and tested
- Zero CI failures introduced by changes
- CodeRabbit and Claude bot findings marked resolved
- Documentation complete for optional features

---

## 9. Open Questions

1. **Bundle size baseline**: What should initial threshold be? (Suggest: 250KB)
2. **Performance documentation**: Should this live in repo root README or tests/performance/?
3. **Priority**: Should we implement all 6 items or just the 4 required ones?

**Recommendation**: Implement all 4 required items (FR-1 to FR-4) now, defer optional items to separate delta if needed.

---

## 10. Rollback Plan

**If issues arise**:
1. Revert specific commit introducing problem
2. All changes are isolated to tests/scripts (no production impact)
3. Recovery time: <2 minutes (single `git revert`)

---

**Status**: ✅ Specification complete | **Next**: Create implementation plan (`plan.md`)
