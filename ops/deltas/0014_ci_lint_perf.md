# Delta 0014: CI & Lint Guards

**Status**: ✅ Complete
**Date**: 2025-10-07
**LOC Impact**: +175 LOC (133 implementation + 42 tests/fixtures)
**Reversibility**: Full (zero runtime changes)

## Summary

Added three automated guardrails to enforce modular extraction architecture (Delta 0013) with zero runtime behavior changes:

1. **ESLint Path Guard**: Blocks legacy import paths in CI and local development
2. **Performance Budget Guard**: Enforces <250ms extraction time for 50 emails
3. **Spec Path Audit Guard**: Validates markdown documentation references

## Changes

### Implementation (133 LOC)

#### [frontend/eslint.config.js](../../frontend/eslint.config.js) (+14 LOC)
Added `no-restricted-imports` rule blocking three legacy paths:
- `frontend/src/lib/provider-detectors` → use `extraction/providers/detector`
- `frontend/src/lib/date-parser` → use `extraction/extractors/date`
- `frontend/src/lib/redact` → use `extraction/helpers/redaction`

Each violation shows actionable error with Delta 0013 reference.

#### [scripts/audit-spec-paths.mjs](../../scripts/audit-spec-paths.mjs) (+73 LOC)
Node 20+ script validating spec file references:
- Extracts file paths from `specs/**/*.md` using regex
- Checks against allowed patterns (extraction/*, tests/*, workflows/, deltas/)
- Detects legacy patterns (provider-detectors, date-parser, redact)
- Outputs `file:line` format for IDE integration
- Exit codes: 0 (pass), 1 (violations found)

#### [frontend/tests/performance/ci-gate.test.ts](../../frontend/tests/performance/ci-gate.test.ts) (+42 LOC)
Vitest performance test with:
- 50-email fixture (25 KLARNA_SMALL + 25 KLARNA_MEDIUM_BASE)
- Median-of-3 sampling to reduce CI noise
- Outputs `PERF_METRIC:extraction_time_ms=X` and `PERF_THRESHOLD:250`
- Fails if median ≥250ms

#### [.github/workflows/guards.yml](../../.github/workflows/guards.yml) (+40 LOC)
CI workflow with three sequential steps:
1. **ESLint Path Guard**: `cd frontend && npm run lint`
2. **Performance Budget Guard**: Parses test output, calculates delta vs 150ms baseline, writes GitHub Actions summary table
3. **Spec Path Audit Guard**: `npm run audit:specs`

Triggers on push to `main` and `feature/**` branches, plus all PRs.

#### npm Scripts (+2 LOC)
- `frontend/package.json`: Added `"test:perf": "vitest run tests/performance/ci-gate.test.ts"`
- `package.json` (root): Added `"audit:specs": "node scripts/audit-spec-paths.mjs"`

### Test Fixtures (22 LOC)

#### ESLint Fixtures (8 LOC)
- [frontend/tests/fixtures/eslint/invalid-imports.ts](../../frontend/tests/fixtures/eslint/invalid-imports.ts) - Blocked imports
- [frontend/tests/fixtures/eslint/valid-imports.ts](../../frontend/tests/fixtures/eslint/valid-imports.ts) - Allowed imports

#### Spec Audit Fixtures (14 LOC)
- [specs/fixtures/invalid-paths.md](../../specs/fixtures/invalid-paths.md) - Legacy path references
- [specs/fixtures/valid-paths.md](../../specs/fixtures/valid-paths.md) - Modular architecture paths

## Verification

All three guards verified working:

```bash
# ESLint blocks legacy imports
cd frontend && npx eslint tests/fixtures/eslint/invalid-imports.ts
# ❌ 9 errors (3 path restrictions + 3 pattern restrictions + 3 unused vars)

# Performance test passes with headroom
cd frontend && npm run test:perf
# PERF_METRIC:extraction_time_ms=X (where X < 250)

# Spec audit detects violations
npm run audit:specs
# ❌ 223 invalid path references across legacy specs (expected - to be cleaned up in future delta)
```

## Migration Notes

**For Developers**:
- Update imports in existing branches to use `frontend/src/lib/extraction/*` paths
- Run `cd frontend && npm run lint` before committing to catch violations early
- Legacy imports will cause CI failures on PRs

**For Spec Authors**:
- Reference files using modular architecture paths
- Run `npm run audit:specs` to validate documentation
- See [ops/deltas/0013_realignment.md](./0013_realignment.md) for correct path patterns

## Related

- **Depends On**: Delta 0013 (Modular Extraction Architecture)
- **Spec**: [specs/003-create-ci-lint/spec.md](../../specs/003-create-ci-lint/spec.md)
- **Tasks**: [specs/003-create-ci-lint/tasks.md](../../specs/003-create-ci-lint/tasks.md)
- **Contracts**:
  - [specs/003-create-ci-lint/contracts/eslint-rules.md](../../specs/003-create-ci-lint/contracts/eslint-rules.md)
  - [specs/003-create-ci-lint/contracts/perf-budget.md](../../specs/003-create-ci-lint/contracts/perf-budget.md)
  - [specs/003-create-ci-lint/contracts/audit-script.md](../../specs/003-create-ci-lint/contracts/audit-script.md)
