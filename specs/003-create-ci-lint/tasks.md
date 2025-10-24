# Tasks: CI & Lint Guards for Modular Extraction

**Feature Branch**: `003-create-ci-lint`
**Input**: Design documents from `/home/matt/PROJECTS/PayPlan/specs/003-create-ci-lint/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅ (3 files)

---

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: ESLint, Vitest, Node.js, GitHub Actions
   → Structure: frontend/, scripts/, .github/workflows/
2. Load design documents ✅
   → contracts/: eslint-rules.md, perf-budget.md, audit-script.md
   → research.md: Technical decisions documented
   → data-model.md: Guard entities defined
3. Generate tasks by category ✅
   → Setup: ESLint config, audit script, CI workflow, npm scripts
   → Tests: Fixture files for guard validation
   → Documentation: Delta file for guard tracking
4. Apply task rules ✅
   → Different files = [P] parallel
   → Same file = sequential
   → Configuration before validation
5. Number tasks sequentially (T001-T008) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness ✅
   → All 3 contracts have implementation tasks
   → All guards testable locally
   → LOC budget tracked (155/200)
9. Return: SUCCESS (tasks ready for execution) ✅
```

---

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- LOC estimates included for budget tracking (target: ≤200 LOC net)

---

## Phase 3.1: Setup & Configuration

### T001: Add ESLint Path Restriction Rules
**Estimated Duration**: 30 minutes
**LOC**: ~30 lines (configuration only)

**Objective**: Configure ESLint to block imports from legacy paths and require modular extraction paths.

**File**: `frontend/.eslintrc.cjs`

**Implementation Steps**:
1. Open `frontend/.eslintrc.cjs`
2. Locate the `rules` section
3. Add `no-restricted-imports` rule with configuration:
   - **Paths**: Block exact legacy module names
     - `frontend/src/lib/provider-detectors` → Use `extraction/providers/detector`
     - `frontend/src/lib/date-parser` → Use `extraction/extractors/date`
     - `frontend/src/lib/redact` → Use `extraction/helpers/redaction`
   - **Patterns**: Block glob patterns
     - `**/provider-detectors*`
     - `**/date-parser*`
     - `**/lib/redact*`
   - **Messages**: Include ❌ emoji, correct path, and "see Delta 0013" reference

**Contract Reference**: `contracts/eslint-rules.md`

**Example Configuration**:
```javascript
rules: {
  'no-restricted-imports': ['error', {
    paths: [
      { name: 'frontend/src/lib/provider-detectors', message: '❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (Delta 0013)' },
      { name: 'frontend/src/lib/date-parser', message: '❌ Legacy path. Use: frontend/src/lib/extraction/extractors/date (Delta 0013)' },
      { name: 'frontend/src/lib/redact', message: '❌ Legacy path. Use: frontend/src/lib/extraction/helpers/redaction (Delta 0013)' }
    ],
    patterns: [
      { group: ['**/provider-detectors*'], message: '❌ Legacy module. Use: extraction/providers/detector' },
      { group: ['**/date-parser*'], message: '❌ Legacy module. Use: extraction/extractors/date' },
      { group: ['**/lib/redact*'], message: '❌ Legacy module. Use: extraction/helpers/redaction' }
    ]
  }]
}
```

**Verification**:
```bash
cd frontend
npm run lint  # Should pass if no legacy imports exist
```

**Acceptance Criteria**:
- [x] Rule added to `.eslintrc.cjs`
- [x] 3 legacy paths blocked (exact names)
- [x] 3 legacy patterns blocked (globs)
- [x] Error messages include ❌, correct path, Delta 0013 reference
- [x] Lint passes on current codebase
- [x] ~30 LOC added

**Dependencies**: None

---

### T002: Create Spec Path Audit Script
**Estimated Duration**: 60 minutes
**LOC**: ~80 lines (new script)

**Objective**: Create Node.js script to scan spec files for invalid path references.

**File**: `scripts/audit-spec-paths.mjs`

**Implementation Steps**:
1. Create file `scripts/audit-spec-paths.mjs` with shebang `#!/usr/bin/env node`
2. Import Node.js built-ins: `fs`, `path`, `glob` (Node 20+)
3. Define allowed patterns (regex array):
   - `frontend/src/lib/extraction/(providers|extractors|helpers)/`
   - `frontend/tests/(unit|integration|performance|fixtures)/`
   - `.github/workflows/`
   - `package.json`
4. Define legacy patterns with messages:
   - `frontend/src/lib/provider-detectors.ts` → message
   - `frontend/src/lib/date-parser.ts` → message
   - `frontend/src/lib/redact.ts` → message
   - `^tests/` (missing frontend/ prefix) → message
5. Implement path extraction function:
   - Regex: ``(?:`|^|\s)([a-zA-Z0-9_\-\.\/]+\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml))(?:`|$|\s|\))``
   - Returns array of unique paths from line
6. Scan all `specs/**/*.md` files (ignore node_modules)
7. For each file, process line by line:
   - Extract paths
   - Check legacy patterns first (fail if match)
   - Check allowed patterns (pass if match)
   - Report errors in `file:line: icon path — message` format
8. Exit with code 0 (success) or 1 (errors found)

**Contract Reference**: `contracts/audit-script.md`

**Script Template**:
```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const ALLOWED_PATTERNS = [ /* ... */ ];
const LEGACY_PATTERNS = [ /* ... */ ];

function extractPaths(content) { /* ... */ }

const specFiles = glob.sync('specs/**/*.md', { ignore: ['**/node_modules/**'] });
const errors = [];

for (const file of specFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const paths = extractPaths(line);
    paths.forEach(p => {
      // Check legacy, then allowed
      // Push errors if invalid
    });
  });
}

if (errors.length > 0) {
  console.error('❌ Spec Path Audit Failed\n');
  errors.forEach(err => console.error(err));
  process.exit(1);
} else {
  console.log('✅ Spec Path Audit Passed');
}
```

**Verification**:
```bash
node scripts/audit-spec-paths.mjs  # Should pass (specs already realigned in Delta 0013)
```

**Acceptance Criteria**:
- [x] Script created at `scripts/audit-spec-paths.mjs`
- [x] Executable with Node 20+
- [x] Uses only built-in modules (no external deps)
- [x] Scans all `specs/**/*.md` files
- [x] Detects legacy paths (provider-detectors, date-parser, redact)
- [x] Detects test paths without frontend/ prefix
- [x] Outputs file:line format for errors
- [x] Exit code 0 (pass) or 1 (fail)
- [x] ~80 LOC total

**Dependencies**: None

---

### T003: Add Performance Budget Test
**Estimated Duration**: 45 minutes
**LOC**: ~40 lines (test file + fixtures reference)

**Objective**: Create Vitest performance test that fails if 50-email extraction exceeds 250ms (median of 3 runs).

**Files**:
- `frontend/tests/performance/ci-gate.test.ts` (new)
- `frontend/tests/performance/fixtures/sample-emails.ts` (reference existing or create minimal)

**Implementation Steps**:
1. Create `frontend/tests/performance/ci-gate.test.ts`
2. Import dependencies:
   - Vitest: `describe`, `test`, `expect`
   - Extraction: `extractFromEmail` from `@/lib/email-extractor`
   - Fixtures: `emails50` array (50 representative BNPL emails)
3. Implement test:
   - Run extraction 3 times over 50 emails
   - Record duration for each run
   - Calculate median (sort, take middle value)
   - Output parseable metrics:
     - `console.log(\`PERF_METRIC:extraction_time_ms=\${median}\`)`
     - `console.log('PERF_THRESHOLD:250')`
   - Assert: `expect(median).toBeLessThan(250)`

**Contract Reference**: `contracts/perf-budget.md`

**Test Template**:
```typescript
import { describe, test, expect } from 'vitest';
import { extractFromEmail } from '@/lib/email-extractor';
import { emails50 } from './fixtures/sample-emails';

describe('CI Performance Gate', () => {
  test('50 emails extracted in <250ms (median of 3 runs)', async () => {
    const runs: number[] = [];

    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      for (const email of emails50) {
        await extractFromEmail(email);
      }
      runs.push(performance.now() - start);
    }

    const median = runs.sort((a, b) => a - b)[1];

    // Output for CI parsing
    console.log(`PERF_METRIC:extraction_time_ms=${median}`);
    console.log('PERF_THRESHOLD:250');

    expect(median).toBeLessThan(250);
  });
});
```

**Fixtures Note**: If `emails50` doesn't exist, create minimal fixture:
```typescript
// frontend/tests/performance/fixtures/sample-emails.ts
export const emails50: string[] = [
  // 10 Klarna, 10 Affirm, 10 Afterpay, 10 PayPal, 10 misc
  `From: klarna@klarna.com\nSubject: Payment due\n...`,
  // ... 49 more
];
```

**Verification**:
```bash
cd frontend
npm run test:perf  # Should pass (current performance ~50-200ms)
```

**Acceptance Criteria**:
- [x] Test file created at `frontend/tests/performance/ci-gate.test.ts`
- [x] Uses median-of-3 sampling
- [x] Outputs PERF_METRIC and PERF_THRESHOLD lines
- [x] Threshold: 250ms
- [x] Test passes with current codebase
- [x] ~40 LOC added

**Dependencies**: T005 (npm script for test:perf)

---

### T004: Update CI Workflow with Guard Steps
**Estimated Duration**: 45 minutes
**LOC**: ~40 lines (workflow steps)

**Objective**: Add CI workflow steps for ESLint, performance budget, and spec audit guards.

**File**: `.github/workflows/ci.yml` (or create `guards.yml` if separate)

**Implementation Steps**:
1. Open/create `.github/workflows/ci.yml`
2. Add three sequential steps after existing checks:

**Step 1: ESLint Path Guard**
```yaml
- name: ESLint Path Guard
  run: |
    cd frontend
    npm run lint
```

**Step 2: Performance Budget Guard**
```yaml
- name: Performance Budget Guard
  run: |
    cd frontend
    npm run test:perf -- --reporter=verbose > perf-output.txt

    # Extract metrics
    ACTUAL=$(grep "PERF_METRIC" perf-output.txt | cut -d= -f2)
    THRESHOLD=250
    BASELINE=150

    # Calculate delta
    DELTA=$((ACTUAL - BASELINE))
    PERCENT=$(awk "BEGIN {printf \"%.1f\", ($DELTA * 100.0) / $BASELINE}")

    # GitHub Actions summary
    echo "### ⚡ Performance Results" >> $GITHUB_STEP_SUMMARY
    echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
    echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
    echo "| Extraction Time (50 emails) | ${ACTUAL}ms |" >> $GITHUB_STEP_SUMMARY
    echo "| Budget Threshold | ${THRESHOLD}ms |" >> $GITHUB_STEP_SUMMARY
    echo "| Baseline | ${BASELINE}ms |" >> $GITHUB_STEP_SUMMARY

    if [ "$DELTA" -gt 0 ]; then
      echo "| **Regression** | **+${DELTA}ms (+${PERCENT}%)** ❌ |" >> $GITHUB_STEP_SUMMARY
    else
      ABS_DELTA=$((DELTA * -1))
      echo "| Improvement | -${ABS_DELTA}ms (-${PERCENT}%) ✅ |" >> $GITHUB_STEP_SUMMARY
    fi

    # Fail if threshold exceeded
    if [ "$ACTUAL" -ge "$THRESHOLD" ]; then
      exit 1
    fi
```

**Step 3: Spec Path Audit Guard**
```yaml
- name: Spec Path Audit Guard
  run: node scripts/audit-spec-paths.mjs
```

**Contract Reference**: `contracts/perf-budget.md`, `contracts/audit-script.md`

**Verification**:
- Manually inspect workflow file syntax
- Push to branch to trigger CI (after all guards implemented)

**Acceptance Criteria**:
- [x] 3 guard steps added to CI workflow
- [x] ESLint step runs `npm run lint`
- [x] Performance step outputs GitHub Actions summary table
- [x] Performance step calculates delta vs 150ms baseline
- [x] Performance step fails if ≥250ms
- [x] Audit step runs `node scripts/audit-spec-paths.mjs`
- [x] ~40 LOC added to workflow

**Dependencies**: T001 (ESLint rules), T002 (audit script), T003 (performance test), T005 (npm scripts)

---

### T005: Add npm Script Entries
**Estimated Duration**: 10 minutes
**LOC**: ~5 lines (package.json entries)

**Objective**: Add npm scripts for easy local testing of all guards.

**Files**:
- `frontend/package.json` (2 scripts: lint, test:perf)
- Root `package.json` (1 script: audit:specs)

**Implementation Steps**:

**1. Frontend package.json** (`frontend/package.json`):
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "test:perf": "vitest run tests/performance/ci-gate.test.ts"
  }
}
```

**2. Root package.json** (root `package.json`):
```json
{
  "scripts": {
    "audit:specs": "node scripts/audit-spec-paths.mjs"
  }
}
```

**Verification**:
```bash
# From frontend/
npm run lint        # ✅ Should pass
npm run test:perf   # ✅ Should pass

# From root/
npm run audit:specs # ✅ Should pass
```

**Acceptance Criteria**:
- [x] `frontend/package.json` has "lint" script
- [x] `frontend/package.json` has "test:perf" script
- [x] Root `package.json` has "audit:specs" script
- [x] All 3 scripts executable locally
- [x] ~5 LOC added

**Dependencies**: None (can be done early)

---

## Phase 3.2: Testing & Validation (Parallel Execution)

### T006 [P]: Create ESLint Test Fixtures
**Estimated Duration**: 20 minutes
**LOC**: ~20 lines (test fixtures, not counted in 200 LOC budget)

**Objective**: Create fixture files to verify ESLint rules block legacy imports and allow modular imports.

**Files** (create in temporary test directory):
- `frontend/tests/fixtures/eslint/invalid-import.fixture.ts` (should fail lint)
- `frontend/tests/fixtures/eslint/valid-import.fixture.ts` (should pass lint)

**Implementation Steps**:

**1. Invalid Import Fixture** (`invalid-import.fixture.ts`):
```typescript
// This file should trigger ESLint errors
import { detectProvider } from 'frontend/src/lib/provider-detectors';  // ❌ Should fail
import { parseDate } from 'frontend/src/lib/date-parser';              // ❌ Should fail
import { redactPII } from 'frontend/src/lib/redact';                   // ❌ Should fail
```

**2. Valid Import Fixture** (`valid-import.fixture.ts`):
```typescript
// This file should pass ESLint
import { detectProvider } from 'frontend/src/lib/extraction/providers/detector';  // ✅ Should pass
import { parseDate } from 'frontend/src/lib/extraction/extractors/date';          // ✅ Should pass
import { redactPII } from 'frontend/src/lib/extraction/helpers/redaction';        // ✅ Should pass
import { extractFromEmail } from 'frontend/src/lib/email-extractor';              // ✅ Orchestrator allowed
```

**Verification**:
```bash
cd frontend

# Test invalid imports (should fail)
npx eslint tests/fixtures/eslint/invalid-import.fixture.ts
# Expected: 3 errors with Delta 0013 messages

# Test valid imports (should pass)
npx eslint tests/fixtures/eslint/valid-import.fixture.ts
# Expected: No errors
```

**Acceptance Criteria**:
- [x] Invalid fixture created with 3 legacy imports
- [x] Valid fixture created with 3 modular imports + orchestrator
- [x] Invalid fixture fails lint with clear error messages
- [x] Valid fixture passes lint
- [x] Error messages reference Delta 0013

**Dependencies**: T001 (ESLint rules must exist first)

---

### T007 [P]: Create Spec Audit Test Fixtures
**Estimated Duration**: 20 minutes
**LOC**: ~30 lines (test fixtures, not counted in budget)

**Objective**: Create fixture markdown files to verify spec path audit script.

**Files** (create in temporary test directory):
- `specs/003-create-ci-lint/test/invalid-paths.fixture.md`
- `specs/003-create-ci-lint/test/valid-paths.fixture.md`

**Implementation Steps**:

**1. Invalid Paths Fixture** (`invalid-paths.fixture.md`):
```markdown
# Test Fixture: Invalid Paths

This spec references legacy paths that should fail audit:

- Create `frontend/src/lib/provider-detectors.ts` with detection logic.
- Run tests in `tests/unit/cache.test.ts` (missing frontend/ prefix).
- Import from `frontend/src/lib/date-parser.ts` for date parsing.
```

**2. Valid Paths Fixture** (`valid-paths.fixture.md`):
```markdown
# Test Fixture: Valid Paths

This spec references current modular paths:

- Create `frontend/src/lib/extraction/providers/detector.ts` with detection logic.
- Run tests in `frontend/tests/unit/cache.test.ts`.
- Import from `frontend/src/lib/extraction/extractors/date.ts` for date parsing.
- CI workflow in `.github/workflows/ci.yml`.
```

**Verification**:
```bash
# Test invalid fixture (should fail)
node scripts/audit-spec-paths.mjs
# Manually check it catches invalid-paths.fixture.md

# Remove invalid fixture, test valid fixture (should pass)
rm specs/003-create-ci-lint/test/invalid-paths.fixture.md
node scripts/audit-spec-paths.mjs
# Expected: ✅ Pass
```

**Acceptance Criteria**:
- [x] Invalid fixture created with 3 legacy path references
- [x] Valid fixture created with 4 modular path references
- [x] Audit script detects invalid fixture errors
- [x] Audit script passes on valid fixture
- [x] Errors output in file:line format

**Dependencies**: T002 (audit script must exist first)

---

### T008 [P]: Test Performance Gate Locally
**Estimated Duration**: 15 minutes
**LOC**: 0 (verification only)

**Objective**: Verify performance test runs correctly and outputs parseable metrics.

**File**: `frontend/tests/performance/ci-gate.test.ts` (created in T003)

**Implementation Steps**:
1. Run performance test locally:
   ```bash
   cd frontend
   npm run test:perf -- --reporter=verbose
   ```
2. Verify output includes:
   - Test passes (median < 250ms)
   - `PERF_METRIC:extraction_time_ms=XXX` line
   - `PERF_THRESHOLD:250` line
3. Manually parse metrics:
   ```bash
   npm run test:perf -- --reporter=verbose > perf-output.txt
   ACTUAL=$(grep "PERF_METRIC" perf-output.txt | cut -d= -f2)
   echo "Actual: ${ACTUAL}ms"
   # Should be ~50-200ms
   ```
4. Test median calculation:
   - Note 3 individual run times
   - Verify median is correct (middle value after sorting)

**Acceptance Criteria**:
- [x] Test runs successfully
- [x] Test passes (median < 250ms)
- [x] PERF_METRIC line outputs actual median
- [x] PERF_THRESHOLD line outputs 250
- [x] Metrics parseable via grep/cut
- [x] Median calculation verified (middle of 3 runs)

**Dependencies**: T003 (performance test), T005 (npm script)

---

## Phase 3.3: Documentation

### T009: Create Delta Documentation
**Estimated Duration**: 30 minutes
**LOC**: 0 (documentation only, not counted)

**Objective**: Document the CI & Lint Guards addition in a delta file for traceability.

**File**: `ops/deltas/0014_ci_lint_perf.md`

**Implementation Steps**:
1. Create `ops/deltas/0014_ci_lint_perf.md`
2. Include sections:
   - **Created**: Date
   - **Affects**: CI/CD, linting, documentation audit (zero runtime impact)
   - **Summary**: 3 guards added (ESLint, performance, spec audit)
   - **Changes**: List files modified/created
   - **Guards Details**:
     - ESLint: Legacy paths blocked, error messages, Delta 0013 refs
     - Performance: 250ms budget, median-of-3, GitHub Actions summary
     - Spec Audit: Validates paths in specs/**/*.md
   - **LOC Budget**: Final count (~155 LOC total)
   - **Verification**: Local test commands (quickstart guide reference)
   - **Rollback**: Git revert instructions
   - **References**: Link to spec.md, plan.md, contracts/

**Template**:
```markdown
# Delta 0014: CI & Lint Guards for Modular Extraction

**Created**: 2025-10-07
**Affects**: CI/CD, ESLint, spec documentation (zero runtime impact)
**Related**: Delta 0013 (Modular extraction architecture)

## Summary

Added three automated guards to enforce modular extraction architecture:
1. ESLint path guards (block legacy imports)
2. Performance budget (50 emails <250ms)
3. Spec path audit (validate spec file references)

## Changes

### Files Modified
- `frontend/.eslintrc.cjs` - Added no-restricted-imports rules (~30 LOC)
- `.github/workflows/ci.yml` - Added 3 guard steps (~40 LOC)
- `frontend/package.json` - Added lint/test:perf scripts (~2 LOC)
- `package.json` - Added audit:specs script (~1 LOC)

### Files Created
- `scripts/audit-spec-paths.mjs` - Spec path validator (~80 LOC)
- `frontend/tests/performance/ci-gate.test.ts` - Performance test (~40 LOC)

**Total LOC**: ~155 lines (45 under 200 budget)

## Guard Details

[... detailed sections for each guard ...]

## Verification

See `specs/003-create-ci-lint/quickstart.md` for local testing.

## Rollback

```bash
git revert <commit-sha>  # Single revert restores pre-guard state
```
```

**Acceptance Criteria**:
- [x] Delta file created at `ops/deltas/0014_ci_lint_perf.md`
- [x] All file changes documented
- [x] LOC budget tracked (~155/200)
- [x] Guard details explained
- [x] Verification commands included
- [x] Rollback instructions provided
- [x] References to spec/plan/contracts

**Dependencies**: T001-T005 (all implementation complete)

---

## Dependencies Graph

```
Setup Phase (Sequential):
T005 (npm scripts) ────┐
                       ├──> T001 (ESLint rules) ──┐
                       │                           ├──> T004 (CI workflow)
T002 (audit script) ───┼──> T003 (perf test) ─────┤
                       │                           │
                       └───────────────────────────┘
                                                   │
Testing Phase (Parallel):                         │
T006 [P] (ESLint fixtures) ────────────────────────┤
T007 [P] (audit fixtures)  ────────────────────────┼──> T009 (delta docs)
T008 [P] (perf test verify) ───────────────────────┘
```

**Critical Path**: T002 → T004 → T009 (longest dependency chain)

---

## Parallel Execution Examples

### After T001-T005 Complete (Setup Done)

Launch all testing tasks in parallel:

```bash
# Terminal 1: ESLint fixtures
Task: "Create ESLint test fixtures with invalid/valid imports in frontend/tests/fixtures/eslint/"

# Terminal 2: Spec audit fixtures
Task: "Create spec audit test fixtures with invalid/valid paths in specs/003-create-ci-lint/test/"

# Terminal 3: Performance test verification
Task: "Run performance test locally, verify median-of-3 and PERF_METRIC output"
```

All three can run simultaneously (different files, no conflicts).

---

## LOC Budget Tracking

| File | Estimated LOC | Actual LOC | Status |
|------|--------------|------------|--------|
| `frontend/.eslintrc.cjs` | 30 | TBD | Pending |
| `scripts/audit-spec-paths.mjs` | 80 | TBD | Pending |
| `.github/workflows/ci.yml` | 40 | TBD | Pending |
| `package.json` (both) | 5 | TBD | Pending |
| `frontend/tests/performance/ci-gate.test.ts` | N/A (test) | TBD | Pending |
| **Total** | **155** | **TBD** | **45 LOC under budget** |

**Budget**: ≤200 LOC net
**Current Plan**: ~155 LOC
**Headroom**: 45 LOC for adjustments

---

## Task Checklist

### Phase 3.1: Setup & Configuration
- [x] **T001**: Add ESLint path restriction rules (30 min, ~30 LOC)
- [x] **T002**: Create spec path audit script (60 min, ~80 LOC)
- [x] **T003**: Add performance budget test (45 min, ~40 LOC)
- [x] **T004**: Update CI workflow with guard steps (45 min, ~40 LOC)
- [x] **T005**: Add npm script entries (10 min, ~5 LOC)

### Phase 3.2: Testing & Validation (Parallel)
- [x] **T006 [P]**: Create ESLint test fixtures (20 min)
- [x] **T007 [P]**: Create spec audit test fixtures (20 min)
- [x] **T008 [P]**: Test performance gate locally (15 min)

### Phase 3.3: Documentation
- [x] **T009**: Create delta documentation (30 min)

**Total Estimated Duration**: ~4.5 hours (can be reduced to ~3 hours with parallelization)

---

## Verification Checklist

Before marking feature complete:

### ESLint Guard
- [x] `cd frontend && npm run lint` passes
- [x] Invalid import fixture fails with 3 errors
- [x] Valid import fixture passes
- [x] Error messages reference Delta 0013

### Performance Budget
- [x] `cd frontend && npm run test:perf` passes
- [x] Test outputs PERF_METRIC and PERF_THRESHOLD
- [x] Median < 250ms
- [x] Median calculation correct (middle of 3 runs)

### Spec Path Audit
- [x] `npm run audit:specs` passes
- [x] Invalid fixture detected and reported
- [x] Valid fixture passes
- [x] Output in file:line format

### CI Integration
- [x] All 3 guards added to `.github/workflows/ci.yml`
- [x] Performance step includes GitHub Actions summary
- [x] CI fails if any guard fails

### LOC Budget
- [x] Total LOC ≤200 (target: ~155)
- [x] No runtime code changes (only configs/tests/scripts)

### Rollback
- [x] Single `git revert` removes all guards cleanly
- [x] No breaking changes to existing code

---

## Notes

- **[P] tasks**: Different files, no dependencies - run in parallel for speed
- **Sequential tasks**: Same file or dependencies - must run in order
- **LOC budget**: Strictly enforced - 200 LOC net maximum
- **Zero runtime impact**: Only configuration, tests, and CI changes
- **Reversible**: Single git revert restores pre-guard state
- **Contracts**: All tasks implement exact specifications from contracts/ directory

---

**Task Generation Complete** ✅

**Next Step**: Execute tasks T001-T009 in order (or parallelize T006-T008 after T001-T005)

**Estimated Total Duration**: 3-4.5 hours (depending on parallelization)
