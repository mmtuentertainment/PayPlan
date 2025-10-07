# Quickstart: Testing CI & Lint Guards Locally

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Guide for developers to test guards locally before pushing

---

## Prerequisites

- Node.js 20.x or higher
- Repository cloned with guards implemented
- Dependencies installed (`npm install`)

---

## Quick Test (All Guards)

```bash
# From repository root

# 1. ESLint path guard
cd frontend
npm run lint

# 2. Performance budget
npm run test:perf

# 3. Spec path audit
cd ..
npm run audit:specs

# All green? Safe to push! ✅
```

**Expected Duration**: ~10 seconds

---

## Guard 1: ESLint Path Restrictions

### What It Checks

Blocks imports from legacy paths:
- ❌ `frontend/src/lib/provider-detectors.ts`
- ❌ `frontend/src/lib/date-parser.ts`
- ❌ `frontend/src/lib/redact.ts`

Requires imports from modular paths:
- ✅ `frontend/src/lib/extraction/providers/detector.ts`
- ✅ `frontend/src/lib/extraction/extractors/date.ts`
- ✅ `frontend/src/lib/extraction/helpers/redaction.ts`

### Run Locally

```bash
cd frontend
npm run lint
```

### Success Output

```
✔ No ESLint errors

All imports valid! ✅
```

### Failure Output

```
/home/matt/PROJECTS/PayPlan/frontend/src/components/EmailInput.tsx
  12:8  error  'frontend/src/lib/provider-detectors' is restricted from being used. ❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see Delta 0013)  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
```

### How to Fix

1. **Find the error**: Note file and line number (e.g., `EmailInput.tsx:12`)
2. **Open file**: Navigate to offending import
3. **Replace path**: Update to modular extraction path
4. **Reference Delta 0013**: `ops/deltas/0013_realignment.md` has old→new mappings
5. **Re-run lint**: `npm run lint` to verify fix

**Example Fix**:

```typescript
// ❌ BEFORE (blocked by ESLint)
import { detectProvider } from 'frontend/src/lib/provider-detectors';

// ✅ AFTER (passes ESLint)
import { detectProvider } from 'frontend/src/lib/extraction/providers/detector';
```

---

## Guard 2: Performance Budget

### What It Checks

Ensures 50-email extraction stays under 250ms budget (median of 3 runs).

**Current Baseline**: ~150ms (with cache enabled)
**Threshold**: 250ms
**Headroom**: 10x safety margin

### Run Locally

```bash
cd frontend
npm run test:perf
```

### Success Output

```
✓ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (145ms)

Test Files  1 passed (1)
     Tests  1 passed (1)
  Start at  15:30:00
  Duration  2.5s

PERF_METRIC:extraction_time_ms=145
PERF_THRESHOLD:250

✅ Performance within budget (145ms < 250ms)
```

### Failure Output

```
✗ CI Performance Gate > 50 emails extracted in <250ms (median of 3 runs) (310ms)
  Expected: < 250
  Received: 310

Test Files  1 failed (1)
     Tests  1 failed (1)

PERF_METRIC:extraction_time_ms=310
PERF_THRESHOLD:250

❌ Performance regression detected: +160ms (+120% vs 150ms baseline)
```

### How to Fix

1. **Check cache enabled**: Ensure LRU cache is functioning (`extraction/helpers/cache.ts`)
2. **Profile slow code**: Run `npm run test:unit -- regex-profiler.test.ts`
3. **Review recent changes**: Did you add expensive regex or loops?
4. **Optimize extractors**: Look for O(n²) patterns in extraction logic
5. **Test locally**: Re-run `npm run test:perf` after fixes

**Common Issues**:
- Cache disabled or broken → Verify `cache.ts` imported
- New regex without profiling → Use `regex-profiler.ts` to identify slow patterns
- Sync file I/O in loop → Use async/batch operations

---

## Guard 3: Spec Path Audit

### What It Checks

Scans all `specs/**/*.md` files for file path references:
- ❌ Legacy paths (provider-detectors, date-parser, redact)
- ❌ Test paths without `frontend/` prefix (`tests/unit/` → `frontend/tests/unit/`)
- ✅ Modular extraction paths (`extraction/**`)
- ✅ Correct test paths (`frontend/tests/**`)

### Run Locally

```bash
# From repository root
npm run audit:specs
```

### Success Output

```
✅ Spec Path Audit Passed — All references valid

Scanned 30 spec files, 0 invalid references found.
```

### Failure Output

```
❌ Spec Path Audit Failed

specs/inbox-paste/tasks.md:42: ❌ frontend/src/lib/provider-detectors.ts — Use: extraction/providers/detector.ts (Delta 0013)
specs/inbox-paste/plan.md:18: ⚠️  tests/unit/cache.test.ts — Missing frontend/ prefix. Use: frontend/tests/unit/ (Delta 0013)
specs/001-inbox-paste-phase/data-model.md:67: ❌ frontend/src/lib/redact.ts — Use: extraction/helpers/redaction.ts (Delta 0013)

Found 3 invalid path references.
See ops/deltas/0013_realignment.md for correct paths.
```

### How to Fix

1. **Open spec file**: Use file:line format for quick navigation (e.g., `specs/inbox-paste/tasks.md:42`)
2. **Locate legacy path**: Find the referenced path on that line
3. **Replace with modular path**: Use Delta 0013 mappings
4. **Re-run audit**: `npm run audit:specs` to verify fix

**Example Fix**:

```markdown
<!-- ❌ BEFORE (fails audit) -->
Create `frontend/src/lib/provider-detectors.ts` with detection logic.

<!-- ✅ AFTER (passes audit) -->
Create `frontend/src/lib/extraction/providers/detector.ts` with detection logic.
```

**Test Path Fix**:

```markdown
<!-- ❌ BEFORE (fails audit) -->
Run tests in `tests/unit/cache.test.ts`

<!-- ✅ AFTER (passes audit) -->
Run tests in `frontend/tests/unit/cache.test.ts`
```

---

## CI Behavior (What Happens on Push)

### GitHub Actions Workflow

When you push a branch, CI runs all three guards:

```yaml
jobs:
  guards:
    runs-on: ubuntu-latest
    steps:
      - name: ESLint Path Guard
        run: cd frontend && npm run lint

      - name: Performance Budget
        run: cd frontend && npm run test:perf

      - name: Spec Path Audit
        run: npm run audit:specs
```

### CI Summary Display (GitHub Actions)

If performance guard runs, you'll see a summary table:

```
### ⚡ Performance Results
| Metric | Value |
|--------|-------|
| Extraction Time (50 emails) | 145ms |
| Budget Threshold | 250ms |
| Baseline | 150ms |
| Status | ✅ PASS (-5ms, -3.3% improvement) |
```

### Build Failure Scenarios

**Scenario 1**: Legacy import detected
- ❌ ESLint guard fails
- **PR Status**: ❌ Checks failed
- **Action**: Fix import, push again

**Scenario 2**: Performance regression
- ❌ Performance guard fails
- **PR Status**: ❌ Checks failed
- **Summary**: Shows +Xms regression delta
- **Action**: Optimize code, push again

**Scenario 3**: Stale spec reference
- ❌ Spec audit fails
- **PR Status**: ❌ Checks failed
- **Action**: Update spec file, push again

---

## Troubleshooting

### Issue: ESLint Error Not Clear

**Symptom**: Error message doesn't show correct path

**Solution**:
1. Check error message includes "Delta 0013" reference
2. Open `ops/deltas/0013_realignment.md` for full mapping table
3. Search for old path in delta file to find new path

### Issue: Performance Test Flaky Locally

**Symptom**: Test passes sometimes, fails others

**Solution**:
1. Run 10 times: `for i in {1..10}; do npm run test:perf; done`
2. Note median time across runs
3. If consistently near 250ms, optimize before pushing
4. CI uses median-of-3, but variability still possible

### Issue: Spec Audit False Positive

**Symptom**: Audit flags valid path as invalid

**Solution**:
1. Check if path is in code block (`` ``` ``) - should be ignored
2. Verify path matches `extraction/**` or `frontend/tests/**` pattern
3. If legitimate false positive, report to maintainers
4. Temporary: Add exception to `ALLOWED_PATTERNS` in script

### Issue: Can't Find Delta 0013

**Location**: `ops/deltas/0013_realignment.md`

**Quick Reference**:
- `provider-detectors.ts` → `extraction/providers/detector.ts`
- `date-parser.ts` → `extraction/extractors/date.ts`
- `redact.ts` → `extraction/helpers/redaction.ts`
- `tests/` → `frontend/tests/`

---

## Testing Scenarios (Before Push)

### Scenario 1: Adding New Component

```bash
# 1. Create component with imports
vim frontend/src/components/NewComponent.tsx

# 2. Check imports valid
cd frontend
npm run lint

# 3. Verify no performance impact
npm run test:perf

# 4. Check if spec needs update
cd ..
npm run audit:specs

# All green? Push! ✅
```

### Scenario 2: Updating Spec File

```bash
# 1. Edit spec file
vim specs/new-feature/tasks.md

# 2. Audit spec paths
npm run audit:specs

# 3. Fix any invalid references
vim specs/new-feature/tasks.md

# 4. Re-audit
npm run audit:specs

# Passed? Push! ✅
```

### Scenario 3: Refactoring Extraction Logic

```bash
# 1. Make changes to extraction module
vim frontend/src/lib/extraction/extractors/date.ts

# 2. Run unit tests
cd frontend
npm run test:unit -- date

# 3. Check performance impact
npm run test:perf

# 4. Lint check
npm run lint

# All passing? Push! ✅
```

---

## Quick Reference Card

| Guard | Command | Pass Criteria | Fix Location |
|-------|---------|---------------|--------------|
| **ESLint** | `cd frontend && npm run lint` | No import errors | Update imports to `extraction/**` |
| **Performance** | `cd frontend && npm run test:perf` | <250ms (median) | Optimize extractors, check cache |
| **Spec Audit** | `npm run audit:specs` | No invalid paths | Update specs to `extraction/**` |

**Delta 0013**: `ops/deltas/0013_realignment.md` (old→new path mappings)

---

## IDE Integration (Optional)

### VSCode ESLint Extension

1. Install: ESLint extension (dbaeumer.vscode-eslint)
2. **Benefit**: See red squiggles on legacy imports in real-time
3. **Auto-fix**: Quick fix suggests correct import path

### VSCode Tasks

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All Guards",
      "type": "shell",
      "command": "cd frontend && npm run lint && npm run test:perf && cd .. && npm run audit:specs",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

**Usage**: Cmd+Shift+B → "Run All Guards"

---

## FAQ

### Q: Why 250ms threshold when current is ~150ms?

**A**: 10x headroom accounts for CI hardware variability and future growth. Prevents false failures while catching real regressions.

### Q: Can I disable a guard temporarily?

**A**: Locally, yes (just skip the command). In CI, no - guards enforce architecture standards. If blocked by false positive, contact maintainers.

### Q: What if I need to reference legacy path in docs?

**A**: Use code blocks (`` ``` ``) for examples - audit script ignores them. Or add clarifying note: "Legacy (pre-Delta 0013)".

### Q: Performance test takes 2.5s - is that normal?

**A**: Yes. 3 runs × 50 emails × extraction time + test overhead. If >5s, check for hanging promises.

---

**Quickstart Status**: ✅ Complete - Ready for developer use
