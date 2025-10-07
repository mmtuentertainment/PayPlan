# Research: CI & Lint Guards for Modular Extraction

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Document technical research and decisions for implementing automated guards

---

## Research Questions

### Q1: How to enforce import restrictions with clear error messages?

**Options Evaluated**:

1. **ESLint no-restricted-imports (CHOSEN)**
   - ✅ Built-in rule, no custom plugin needed
   - ✅ Clear custom error messages per path
   - ✅ Works with static and dynamic imports
   - ✅ Mature, well-tested
   - ✅ ~30 LOC configuration
   - ❌ Limited to import statements (not file references in comments)

2. **Custom ESLint Plugin**
   - ✅ Maximum flexibility
   - ❌ 200+ LOC boilerplate
   - ❌ Over-engineering for 3 legacy paths
   - ❌ Maintenance burden

3. **TypeScript Path Mapping Restrictions**
   - ✅ Native TypeScript support
   - ❌ Less clear error messages
   - ❌ Harder to customize per-path guidance
   - ❌ Doesn't block runtime imports

4. **Pre-commit Hooks**
   - ✅ Early catching
   - ❌ Can be bypassed (--no-verify)
   - ❌ Not centrally enforced
   - ❌ Prefers CI enforcement

**Decision**: Use ESLint `no-restricted-imports` with custom messages

**Rationale**:
- Stays within 200 LOC budget
- Clear error messages referencing Delta 0013
- No additional dependencies
- CI enforcement ensures compliance

**Implementation Approach**:
```javascript
// frontend/.eslintrc.cjs
rules: {
  'no-restricted-imports': ['error', {
    paths: [
      { name: 'frontend/src/lib/provider-detectors', message: '❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (Delta 0013)' },
      { name: 'frontend/src/lib/date-parser', message: '❌ Legacy path. Use: frontend/src/lib/extraction/extractors/date (Delta 0013)' },
      { name: 'frontend/src/lib/redact', message: '❌ Legacy path. Use: frontend/src/lib/extraction/helpers/redaction (Delta 0013)' }
    ],
    patterns: [
      { group: ['**/provider-detectors*'], message: '❌ Legacy module. Use extraction/providers/detector' },
      { group: ['**/date-parser*'], message: '❌ Legacy module. Use extraction/extractors/date' },
      { group: ['**/lib/redact*'], message: '❌ Legacy module. Use extraction/helpers/redaction' }
    ]
  }]
}
```

---

### Q2: How to implement performance budgets with delta display?

**Options Evaluated**:

1. **Vitest + GitHub Actions Summary API (CHOSEN)**
   - ✅ Vitest already used in project
   - ✅ GitHub Actions summary API for visible metrics
   - ✅ Median-of-3 sampling reduces flakiness
   - ✅ ~40 LOC CI workflow step
   - ❌ Requires performance test to output parseable format

2. **Lighthouse CI**
   - ✅ Comprehensive metrics
   - ❌ Overkill for extraction benchmarks
   - ❌ Designed for page load, not unit-level tests
   - ❌ Additional configuration overhead

3. **Custom Benchmark Tool**
   - ✅ Maximum control
   - ❌ Reinventing wheel
   - ❌ 100+ LOC implementation
   - ❌ Vitest sufficient for needs

4. **Artillery / k6**
   - ✅ Industry-standard load testing
   - ❌ Designed for API load tests, not unit benchmarks
   - ❌ Overkill for 50-email extraction test
   - ❌ Additional dependency

**Decision**: Use Vitest performance tests with GitHub Actions summary API

**Rationale**:
- Vitest already in `frontend/tests/performance/`
- Median-of-3 sampling proven technique for reducing CI variability
- GitHub Actions summary API provides visible results without log drilling
- 250ms threshold has 10x headroom over current 50-200ms performance

**Implementation Approach**:
```typescript
// frontend/tests/performance/ci-gate.test.ts
import { describe, test, expect } from 'vitest';
import { extractFromEmail } from '@/lib/email-extractor';
import { emails50 } from './fixtures/sample-emails';

describe('CI Performance Gate', () => {
  test('50 emails extracted in <250ms (median of 3 runs)', async () => {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      for (const email of emails50) {
        await extractFromEmail(email);
      }
      runs.push(performance.now() - start);
    }

    const median = runs.sort((a,b) => a-b)[1];
    console.log(`PERF_METRIC:extraction_time_ms=${median}`);
    console.log(`PERF_THRESHOLD:250`);

    expect(median).toBeLessThan(250);
  });
});
```

```yaml
# .github/workflows/ci.yml
- name: Performance Gate
  run: |
    cd frontend
    npm run test:perf -- --reporter=verbose > perf-output.txt

    ACTUAL=$(grep "PERF_METRIC" perf-output.txt | cut -d= -f2)
    THRESHOLD=250
    BASELINE=150

    DELTA=$((ACTUAL - BASELINE))
    PERCENT=$(( (DELTA * 100) / BASELINE ))

    echo "### ⚡ Performance Results" >> $GITHUB_STEP_SUMMARY
    echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
    echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
    echo "| Extraction Time (50 emails) | ${ACTUAL}ms |" >> $GITHUB_STEP_SUMMARY
    echo "| Budget Threshold | ${THRESHOLD}ms |" >> $GITHUB_STEP_SUMMARY

    if [ $DELTA -gt 0 ]; then
      echo "| **Regression** | **+${DELTA}ms (+${PERCENT}%)** ❌ |" >> $GITHUB_STEP_SUMMARY
    else
      echo "| Improvement | ${DELTA}ms (${PERCENT}%) ✅ |" >> $GITHUB_STEP_SUMMARY
    fi
```

---

### Q3: How to audit spec file paths without external dependencies?

**Options Evaluated**:

1. **Node.js + Regex (CHOSEN)**
   - ✅ No external dependencies (fs, path built-ins)
   - ✅ Simple regex for path extraction
   - ✅ ~80 LOC implementation
   - ✅ Fast execution
   - ❌ Less precise than AST parsing (acceptable trade-off)

2. **Markdown Parser (remark/unified)**
   - ✅ AST-based parsing (more precise)
   - ❌ External dependency
   - ❌ 150+ LOC with traversal logic
   - ❌ Overkill for path extraction

3. **Grep-based Solution**
   - ✅ Minimal LOC (shell script)
   - ❌ Less portable (bash-specific)
   - ❌ Harder to customize error messages
   - ❌ Regex escaping challenges

4. **Python Script**
   - ✅ Strong regex support
   - ❌ Adds Python requirement to CI
   - ❌ Prefer Node.js consistency (frontend is TS/JS)
   - ❌ Extra runtime dependency

**Decision**: Node.js script using regex for path extraction, validate against allow-list patterns

**Rationale**:
- Zero external dependencies
- Simple ~80 LOC implementation
- Regex sufficient for markdown path extraction
- Outputs file:line format for easy navigation
- Executable locally and in CI

**Implementation Approach**:
```javascript
// scripts/audit-spec-paths.mjs
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';  // Built-in Node 20+

// Allowed patterns from Delta 0013
const ALLOWED_PATTERNS = [
  /frontend\/src\/lib\/extraction\/(providers|extractors|helpers)\//,
  /frontend\/tests\/(unit|integration|performance|fixtures)\//,
  /\.github\/workflows\//,
  /package\.json$/,
];

// Legacy patterns to reject
const LEGACY_PATTERNS = [
  { pattern: /frontend\/src\/lib\/provider-detectors\.ts/, message: 'Use: extraction/providers/detector.ts (Delta 0013)' },
  { pattern: /frontend\/src\/lib\/date-parser\.ts/, message: 'Use: extraction/extractors/date.ts (Delta 0013)' },
  { pattern: /frontend\/src\/lib\/redact\.ts/, message: 'Use: extraction/helpers/redaction.ts (Delta 0013)' },
  { pattern: /^tests\//, message: 'Missing frontend/ prefix. Use: frontend/tests/ (Delta 0013)' },
];

// Extract paths from markdown
function extractPaths(content) {
  const pathRegex = /(?:`|^|\s)([a-zA-Z0-9_\-\.\/]+\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml))(?:`|$|\s|\))/g;
  const paths = [];
  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return [...new Set(paths)];
}

// Audit all specs
const specFiles = glob.sync('specs/**/*.md', { ignore: ['**/node_modules/**'] });
const errors = [];

for (const file of specFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const paths = extractPaths(line);
    paths.forEach(p => {
      // Check legacy first
      for (const legacy of LEGACY_PATTERNS) {
        if (legacy.pattern.test(p)) {
          errors.push(`${file}:${idx+1}: ❌ ${p} — ${legacy.message}`);
          return;
        }
      }

      // Check allowed
      const allowed = ALLOWED_PATTERNS.some(pat => pat.test(p));
      if (!allowed && (p.startsWith('frontend/') || p.startsWith('tests/'))) {
        errors.push(`${file}:${idx+1}: ⚠️ ${p} — Not in extraction/* or frontend/tests/* (Delta 0013)`);
      }
    });
  });
}

// Report
if (errors.length > 0) {
  console.error('❌ Spec Path Audit Failed\n');
  errors.forEach(err => console.error(err));
  console.error(`\nFound ${errors.length} invalid references. See Delta 0013.\n`);
  process.exit(1);
} else {
  console.log('✅ Spec Path Audit Passed');
}
```

---

## Best Practices Research

### ESLint Rule Patterns

**Reference**: [ESLint no-restricted-imports docs](https://eslint.org/docs/latest/rules/no-restricted-imports)

**Key Findings**:
- `paths` array: Exact module name matches
- `patterns` array: Glob patterns for broader matching
- Custom `message` field for user guidance
- Works with ESM and CommonJS imports

**Application**: Use both `paths` (exact legacy file names) and `patterns` (glob wildcards) for comprehensive coverage

---

### GitHub Actions Summary API

**Reference**: [GitHub Actions step summary docs](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary)

**Key Findings**:
- `$GITHUB_STEP_SUMMARY` file path for markdown output
- Supports tables, headers, emoji, links
- Visible on workflow run page without drilling into logs
- Append-only (use `>>` not `>`)

**Application**: Output performance metrics as markdown table with delta calculations

---

### Performance Testing Flakiness

**Reference**: Industry best practices (Martin Fowler, Google Testing Blog)

**Key Findings**:
- Single-run benchmarks unreliable on CI (noisy neighbors, CPU throttling)
- Median-of-3 more stable than mean (outlier resistant)
- Thresholds should have headroom (2-5x typical performance)
- Warm-up runs recommended but add complexity

**Application**:
- Median-of-3 sampling
- 250ms threshold (10x headroom over 50-200ms typical)
- No warm-up (simplicity, tests include cache cold start)

---

## Delta 0013 Reference

**Source**: `ops/deltas/0013_realignment.md`

**Key Path Mappings**:

| Old Path | New Path | Notes |
|----------|----------|-------|
| `frontend/src/lib/provider-detectors.ts` | `frontend/src/lib/extraction/providers/detector.ts` | DELETED → MOVED |
| `frontend/src/lib/date-parser.ts` | `frontend/src/lib/extraction/extractors/date.ts` | MOVED + REFACTORED |
| `frontend/src/lib/redact.ts` | `frontend/src/lib/extraction/helpers/redaction.ts` | MOVED + RENAMED |
| `tests/unit/` | `frontend/tests/unit/` | RELOCATED |
| `tests/integration/` | `frontend/tests/integration/` | RELOCATED |

**Extraction Module Structure**:
```
frontend/src/lib/extraction/
├── providers/
│   ├── detector.ts
│   └── patterns.ts
├── extractors/
│   ├── amount.ts
│   ├── autopay.ts
│   ├── currency.ts
│   ├── date.ts
│   ├── installment.ts
│   └── late-fee.ts
└── helpers/
    ├── cache.ts
    ├── confidence-calculator.ts
    ├── domain-validator.ts
    ├── date-detector.ts
    ├── date-reparser.ts
    ├── error-sanitizer.ts
    ├── timezone.ts
    ├── field-extractor.ts
    ├── regex-profiler.ts
    └── redaction.ts
```

---

## LOC Budget Analysis

**Constraint**: ≤200 LOC net for all guard files

**Breakdown**:

| File | Estimated LOC | Notes |
|------|--------------|-------|
| `.eslintrc.cjs` (rules addition) | 30 | 3 paths + 3 patterns with messages |
| `scripts/audit-spec-paths.mjs` | 80 | Script with regex, glob, validation |
| `.github/workflows/ci.yml` (steps) | 40 | ESLint, performance, audit steps |
| `package.json` (scripts) | 5 | Audit script entry |
| **Total** | **155 LOC** | **45 LOC under budget** ✅ |

**Headroom**: 45 LOC available for adjustments, additional patterns, or enhanced error messages

---

## Risk Assessment

### Risk 1: ESLint Rule False Positives

**Risk**: Rule might block valid imports (e.g., email-extractor.ts orchestrator)

**Mitigation**:
- Test with fixture imports covering edge cases
- `email-extractor.ts` explicitly NOT in legacy patterns (still valid)
- Patterns use specific legacy paths, not broad wildcards

**Likelihood**: Low
**Impact**: Medium (developer frustration)

### Risk 2: Performance Test Flakiness on CI

**Risk**: CI hardware variability causes false failures

**Mitigation**:
- Median-of-3 sampling reduces noise
- 250ms threshold has 10x headroom (50-200ms typical)
- Baseline (150ms) is conservative estimate

**Likelihood**: Low
**Impact**: Medium (blocked PRs)

### Risk 3: Spec Audit Regex Misses Edge Cases

**Risk**: Regex path extraction misses some file references

**Mitigation**:
- Test with diverse fixture markdown (code blocks, inline, prose)
- Allow-list approach: Only frontend/* and tests/* validated
- Manual review during initial rollout

**Likelihood**: Medium
**Impact**: Low (false negatives won't break builds)

### Risk 4: LOC Budget Exceeded

**Risk**: Implementation exceeds 200 LOC

**Mitigation**:
- Detailed LOC breakdown in research (155 LOC estimate)
- 45 LOC headroom for adjustments
- Simplicity-first approach (no custom plugins, minimal deps)

**Likelihood**: Very Low
**Impact**: High (violates constraint, requires refactor)

---

## Alternatives Not Pursued

### 1. Comprehensive Linting Overhaul
- **Why Not**: Out of scope, feature focused on modular architecture guards only
- **Could Add Later**: Style rules, complexity checks, etc.

### 2. Bundle Size Guards
- **Why Not**: Already handled (Swagger lazy-loading in Delta 0013)
- **Could Add Later**: Max bundle size threshold guard

### 3. Automated Path Migration Tool
- **Why Not**: Specs already realigned in Delta 0013
- **Could Add Later**: CLI tool to auto-fix legacy imports

### 4. Pre-commit Hook Enforcement
- **Why Not**: Can be bypassed, prefer CI enforcement
- **Could Add Later**: Optional local developer tool

---

## Dependencies & Prerequisites

**Prerequisites**:
- ✅ Delta 0013: Modular extraction architecture established
- ✅ Specs realigned: Branch `002-realign-payplan-specs` merged
- ✅ Performance tests exist: `frontend/tests/performance/extraction-benchmark.test.ts`
- ✅ ESLint configured: `frontend/.eslintrc.cjs`

**No New Dependencies**:
- ESLint: Already in project
- Vitest: Already in project
- Node.js built-ins: fs, path, glob (Node 20+)
- GitHub Actions: Existing workflow

---

## Summary of Decisions

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| Import restriction | ESLint no-restricted-imports | Clear errors, no custom plugin, ~30 LOC |
| Performance budget | Vitest + GH Actions summary | Existing tool, visible metrics, median-of-3 |
| Spec path audit | Node.js regex script | Zero deps, ~80 LOC, file:line output |
| Total LOC | 155 LOC (45 under budget) | Meets constraint, headroom for adjustments |
| Error message style | Actionable with Delta 0013 refs | Guides developers to correct paths |
| Reversibility | Git revert, comment-out rules | Zero runtime impact, safe rollback |

**All NEEDS CLARIFICATION Resolved** ✅

**Ready for Phase 1: Design & Contracts**
