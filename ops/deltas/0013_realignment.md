# Delta 0013: Realign Specs to Modular Extraction Architecture

**Created**: 2025-10-07
**Affects**: Documentation only (zero runtime changes)
**Version Range**: v0.1.3 → v0.1.5-a.2
**Migration Type**: Path references only
**Related Spec**: `specs/002-realign-payplan-specs/`

---

## Summary

Realigns all PayPlan specification documents to reflect the modular extraction architecture implemented in v0.1.5-a.2. Updates **71 stale path references** across **29 spec files** to point to the current extraction module structure under `frontend/src/lib/extraction/`.

### What Changed
- ✅ **29 spec files** updated with accurate module paths
- ✅ **71 stale references** corrected (provider-detectors, date-parser, redact, test paths)
- ✅ **5 new documentation files** created (plan, tasks, ci-gates, ui-enhancements, this delta)
- ✅ **0 code changes** - documentation-only update

### Why This Matters
- 📍 **Navigation**: Developers can find files referenced in specs
- 📚 **Onboarding**: New contributors see accurate architecture
- 🔍 **Maintenance**: Clear migration path for future refactors
- ✅ **Integrity**: Specs match actual codebase structure

---

## Path Migration Tables

### Provider Detection Modules

| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/provider-detectors.ts` | `frontend/src/lib/extraction/providers/detector.ts` | **DELETED → MOVED** | Separated provider detection logic into dedicated module with clearer responsibilities |
| N/A | `frontend/src/lib/extraction/providers/patterns.ts` | **NEW** | Extracted regex patterns from detector.ts for better maintainability and testing |

**Impact**: All references to `provider-detectors.ts` in specs now point to `extraction/providers/detector.ts`

---

### Extractor Modules (Field-Specific)

| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/date-parser.ts` | `frontend/src/lib/extraction/extractors/date.ts` | **MOVED + REFACTORED** | Dedicated date extraction module with enhanced timezone support and edge case handling |
| N/A | `frontend/src/lib/extraction/extractors/amount.ts` | **NEW** | Extracted amount parsing logic from monolithic email-extractor.ts |
| N/A | `frontend/src/lib/extraction/extractors/autopay.ts` | **NEW** | Extracted autopay detection logic for clarity and testability |
| N/A | `frontend/src/lib/extraction/extractors/currency.ts` | **NEW** | New multi-currency detection module (USD, EUR, GBP support) |
| N/A | `frontend/src/lib/extraction/extractors/installment.ts` | **NEW** | Extracted installment number parsing into dedicated module |
| N/A | `frontend/src/lib/extraction/extractors/late-fee.ts` | **NEW** | Extracted late fee detection logic for provider-specific handling |

**Impact**:
- `date-parser.ts` references → `extraction/extractors/date.ts`
- New extractors documented in `extraction/extractors/` directory
- Each extractor handles single field type (SoC principle)

---

### Helper Utilities (Shared Logic)

| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/redact.ts` | `frontend/src/lib/extraction/helpers/redaction.ts` | **MOVED + RENAMED** | Standardized naming convention (redact → redaction) and grouped with other helpers |
| N/A | `frontend/src/lib/extraction/helpers/cache.ts` | **NEW** | LRU cache implementation providing **230-875x performance improvement** |
| N/A | `frontend/src/lib/extraction/helpers/confidence-calculator.ts` | **NEW** | Extracted confidence scoring logic (3-tier system: high/medium/low) |
| N/A | `frontend/src/lib/extraction/helpers/domain-validator.ts` | **NEW** | Email domain validation utilities for BNPL provider verification |
| N/A | `frontend/src/lib/extraction/helpers/date-detector.ts` | **NEW** | Date format detection heuristics (MM/DD, DD/MM, ISO, etc.) |
| N/A | `frontend/src/lib/extraction/helpers/date-reparser.ts` | **NEW** | Date reparsing utilities for handling edge cases and ambiguous formats |
| N/A | `frontend/src/lib/extraction/helpers/error-sanitizer.ts` | **NEW** | Error message sanitization for safe user display (PII removal) |
| N/A | `frontend/src/lib/extraction/helpers/timezone.ts` | **NEW** | Timezone detection and handling (IANA tz, locale-based inference) |
| N/A | `frontend/src/lib/extraction/helpers/field-extractor.ts` | **NEW** | Generic field extraction utilities shared across extractors |
| N/A | `frontend/src/lib/extraction/helpers/regex-profiler.ts` | **NEW** | Regex performance profiling for optimization (detects slow patterns) |
| N/A | `frontend/src/lib/extraction/helpers/currency.ts` | **NEW** | Currency-specific helpers (symbol mapping, formatting) |
| N/A | `frontend/src/lib/extraction/helpers/error-messages.ts` | **NEW** | Standardized error message templates |

**Impact**:
- `redact.ts` references → `extraction/helpers/redaction.ts`
- 11 new helper modules documented in `extraction/helpers/` directory
- Cache module is critical: **230-875x speedup** (1000ms → 50-200ms)

---

### Core Orchestrator (Facade Pattern)

| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/email-extractor.ts` (monolithic ~500 LOC) | `frontend/src/lib/email-extractor.ts` (orchestrator ~150 LOC) | **REFACTORED** | Now imports and orchestrates `extraction/*` modules instead of containing all logic inline. Acts as facade/orchestrator. |

**Impact**:
- File still exists at same path (no breaking changes)
- **Internal change only**: Logic moved to `extraction/` subdirectories
- Now imports from:
  - `extraction/providers/detector` for provider detection
  - `extraction/extractors/*` for field extraction
  - `extraction/helpers/*` for utilities

**Spec Update Strategy**:
- References to `email-extractor.ts` remain valid (file exists)
- Add clarifying note: "now orchestrates extraction/* modules"
- Line number references may be outdated (file refactored from ~500 to ~150 LOC)

---

### Test Suites (Relocation + TypeScript Conversion)

| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `tests/unit/*.test.js` | `frontend/tests/unit/*.test.ts` | **MOVED + TS** | Relocated to frontend/ for colocation with source code, converted to TypeScript |
| `tests/integration/*.test.js` | `frontend/tests/integration/*.test.ts` | **MOVED + TS** | Relocated to frontend/, converted to TypeScript |
| N/A | `frontend/tests/performance/*.test.ts` | **NEW** | Performance benchmarks for extraction (with/without cache) and bundle size |
| N/A | `frontend/tests/fixtures/*.ts` | **NEW** | Shared test data: email samples, provider configs, mock items |
| N/A | `frontend/tests/helpers/*.ts` | **NEW** | Test helper utilities (performance measurement, etc.) |

**Impact**:
- All `tests/unit/` references → `frontend/tests/unit/`
- All `tests/integration/` references → `frontend/tests/integration/`
- New test categories: `performance/` and `fixtures/`
- **30+ unit tests**, integration tests for cache and quick-fix flow

---

## Migration Rationale

### Architectural Goals

#### 1. Separation of Concerns (SoC)
- **Before**: Monolithic `email-extractor.ts` (~500 LOC) with all extraction logic
- **After**: Modular structure with dedicated extractors (amount, date, currency, etc.)
- **Benefit**: Each module has single responsibility, easier to understand and modify

#### 2. Testability
- **Before**: Testing extraction required large integration tests
- **After**: Each extractor/helper has focused unit tests
- **Benefit**: Faster test execution, clearer failure messages, higher coverage

#### 3. Maintainability
- **Before**: Changes to date parsing required modifying large file, risk of breaking other fields
- **After**: Date logic isolated in `extraction/extractors/date.ts` (~100 LOC)
- **Benefit**: Reduced cognitive load, safer refactoring, clearer git diffs

#### 4. Performance
- **Before**: No caching, ~1000ms to extract 50 emails
- **After**: LRU cache in `extraction/helpers/cache.ts` → **230-875x speedup**
- **Benefit**: Sub-200ms extraction time, better UX, reduced server load

#### 5. Extensibility
- **Before**: Adding new provider required editing provider-detectors.ts
- **After**: New providers added to `extraction/providers/patterns.ts` with clear structure
- **Benefit**: Easier to add Zip, Sezzle, PayPal Pay in 4, etc.

---

### Benefits Achieved (v0.1.5-a.2)

#### Code Organization
- ✅ **Clear directory structure**: `providers/`, `extractors/`, `helpers/`
- ✅ **Smaller files**: Average 50-150 LOC vs monolithic 500+ LOC
- ✅ **Logical grouping**: Related functionality colocated

#### Performance
- ✅ **LRU Cache**: 230-875x speedup (1000ms → 50-200ms for 50 emails)
- ✅ **Lazy-loading**: Swagger UI code-split (31.7% bundle reduction)
- ✅ **Regex profiling**: Slow patterns identified and optimized

#### Test Coverage
- ✅ **30+ unit tests**: Extractors, helpers, providers individually tested
- ✅ **Integration tests**: Cache integration, quick-fix flow
- ✅ **Performance tests**: Benchmarks for regression detection
- ✅ **Fixtures**: Shared test data for consistency

#### Developer Experience
- ✅ **Easier navigation**: Find code by feature (e.g., `extraction/extractors/date.ts`)
- ✅ **Better onboarding**: Clear module responsibilities
- ✅ **Safer refactoring**: Isolated changes, focused tests
- ✅ **Git clarity**: Small, focused commits per module

---

## Migration Timeline

### v0.1.3 (Baseline - Monolithic)
- `frontend/src/lib/email-extractor.ts` - ~500 LOC, all extraction logic
- `frontend/src/lib/provider-detectors.ts` - All provider regex patterns
- `frontend/src/lib/date-parser.ts` - Date parsing only
- `tests/unit/*.test.js` - JavaScript tests at repo root

### v0.1.4-a (Confidence Scoring)
- Added confidence calculation within email-extractor.ts
- Introduced `redact.ts` for PII redaction

### v0.1.4-b (Provider Expansion)
- Added Afterpay, PayPal Pay in 4, Zip, Sezzle
- Provider patterns growing unwieldy in single file

### v0.1.5-a.1 (Locale & Modular Foundation)
- Created `frontend/src/lib/extraction/` directory
- Moved some logic to `extraction/core/types.ts`
- Introduced `extraction/providers/` structure

### v0.1.5-a.2 (Complete Modular Refactor)
- ✅ **All extractors** moved to `extraction/extractors/`
- ✅ **All helpers** moved to `extraction/helpers/`
- ✅ **Provider logic** split: `detector.ts` + `patterns.ts`
- ✅ **Tests relocated** to `frontend/tests/`
- ✅ **Cache module** added (230-875x performance gain)
- ✅ **Performance tests** added for regression prevention

### v0.2.0 (This Delta - Documentation Realignment)
- 🔄 **Specs updated** to reference current architecture
- 🔄 **CI gates specified** (performance benchmarks)
- 🔄 **UI docs added** (confidence legend, CSV format)
- 🔄 **Migration guide** created (this document)

---

## Impact Analysis

### Runtime Impact
- **Code Changes**: **ZERO** (documentation-only update)
- **Behavior Changes**: **NONE**
- **Performance Impact**: **NONE** (no code modified in this delta)
- **Breaking Changes**: **NONE**
- **API Changes**: **NONE**

### Documentation Impact
- **Spec Files Updated**: 29 files
- **Total Reference Updates**: ~71 path references
- **New Documentation Files**: 5 (plan, tasks, ci-gates, ui-enhancements, this delta)
- **Stale References Eliminated**: 100%

### Developer Impact
- **Navigation**: ✅ Specs now point to correct file locations
- **Onboarding**: ✅ New developers see accurate architecture
- **Maintenance**: ✅ Clear migration guide for future refactors
- **Confusion**: ❌ Eliminated (stale paths removed)

---

## Affected Specification Files

### High Priority (Direct Module References)

| File | Stale Refs | Primary Changes |
|------|-----------|-----------------|
| `specs/inbox-paste/tasks.md` | 18 | provider-detectors → providers/detector, date-parser → extractors/date, test paths |
| `specs/inbox-paste/plan.md` | 3 | Module list updates, architectural note |
| `specs/001-inbox-paste-phase/tasks.md` | 27 | Extensive: redact, provider-detectors, email-extractor imports, test paths |
| `specs/001-inbox-paste-phase/data-model.md` | 7 | "Location:" annotations updated to extraction/* paths |
| `specs/001-inbox-paste-phase/research.md` | 7 | Architectural discussion updated with modular context |
| `specs/v0.1.5-rescue/tasks.md` | 5 | date-parser → extractors/date, email-extractor context notes |
| `specs/v0.1.5-rescue/tasks-a2.md` | 3 | JSDoc examples, orchestrator pattern notes |
| `specs/v0.1.5-rescue/review-analysis-a2.md` | 1 | Location reference with line number updated |

**Total**: 71 stale references across 8 high-priority files

### Medium Priority (Test Path References)

All specs referencing `tests/` without `frontend/` prefix:
- `specs/bnpl-manager/*.md`
- `specs/api-hardening/*.md`
- `specs/public-deployment/*.md`
- `specs/business-days/*.md`

**Updates**: `tests/unit/` → `frontend/tests/unit/`, `tests/integration/` → `frontend/tests/integration/`

### New Documentation (Created in This Delta)

| File | Purpose | Key Content |
|------|---------|-------------|
| `specs/realignment/plan.md` | Implementation plan | Phase breakdown, timeline, exit criteria |
| `specs/realignment/tasks.md` | Atomic tasks | 8 tasks @ 20-60min each, acceptance criteria |
| `specs/realignment/ci-gates.md` | CI specification | Performance gates (50 emails <2s), Swagger lazy-load, artifacts |
| `specs/realignment/ui-enhancements.md` | UI documentation | Confidence legend (3-tier), CSV column descriptions |
| `ops/deltas/0013_realignment.md` | Migration guide | This document - path mappings, rationale, impact |

---

## Verification & Validation

### Pre-Merge Checks

#### 1. Path Reference Validation
```bash
# Should return EMPTY (no stale refs)
grep -r "frontend/src/lib/provider-detectors\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"
grep -r "frontend/src/lib/date-parser\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"
grep -r "frontend/src/lib/redact\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"
```

#### 2. Test Path Validation
```bash
# Should return EMPTY (all have frontend/ prefix)
grep -r "tests/unit/\|tests/integration/" specs/ --include="*.md" | grep -v "frontend/tests" | grep -v "002-realign"
```

#### 3. File Existence Check
```bash
# All 5 new files should exist
ls -la specs/realignment/{plan,tasks,ci-gates,ui-enhancements}.md
ls -la ops/deltas/0013_realignment.md
```

#### 4. Code Change Check
```bash
# Should return EMPTY (docs-only delta)
git diff main --name-only | grep -E "\.(ts|tsx|js|jsx)$"
```

### Post-Merge Validation

#### 1. Spot-Check Updated Specs
```bash
# Verify extraction paths present
grep "extraction/providers/detector" specs/inbox-paste/tasks.md
grep "extraction/extractors/date" specs/v0.1.5-rescue/tasks.md
grep "extraction/helpers/redaction" specs/001-inbox-paste-phase/data-model.md
```

#### 2. Verify Module Existence
```bash
# All referenced modules should exist
ls -la frontend/src/lib/extraction/providers/detector.ts
ls -la frontend/src/lib/extraction/extractors/date.ts
ls -la frontend/src/lib/extraction/helpers/redaction.ts
ls -la frontend/tests/unit/
ls -la frontend/tests/integration/
```

#### 3. Documentation Integrity
```bash
# Delta file should reference all key modules
grep -E "amount|autopay|currency|date|installment|late-fee" ops/deltas/0013_realignment.md
grep -E "cache|confidence|domain-validator|redaction|timezone" ops/deltas/0013_realignment.md
```

---

## Future Considerations

### Potential Follow-up Deltas

#### Delta 0014: Implement CI Performance Gates
- Create `.github/workflows/perf-gate.yml`
- Implement `npm run test:perf` script
- Configure artifact upload (90-day retention)
- Add benchmark result parser

#### Delta 0015: Add Confidence Legend Component
- Create `frontend/src/components/ConfidenceLegend.tsx`
- Integrate into results page
- Add CSV export tooltip
- Update frontend README with CSV format docs

#### Delta 0016: Automated Path Validation
- Add pre-commit hook for spec path validation
- Create `scripts/validate-spec-paths.sh`
- Integrate into CI workflow
- Add "last updated" timestamps to spec files

---

## Rollback Plan

### If Issues Arise Post-Merge

```bash
# Option 1: Revert the merge commit
git revert -m 1 <merge-commit-sha>

# Option 2: Delete branch and start over
git checkout main
git branch -D 002-realign-payplan-specs

# Specs revert to v0.1.5-a.2 state
# All code continues functioning normally (no runtime impact)
```

**Safe Rollback**: This delta has **zero runtime impact** - reverting only affects documentation, not code execution.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Spec Files Updated** | 29 |
| **Stale References Corrected** | 71 |
| **New Documentation Files** | 5 |
| **Code Changes** | 0 |
| **Breaking Changes** | 0 |
| **Runtime Impact** | None |
| **New Modules Documented** | 20+ |
| **Provider Modules** | 2 (detector, patterns) |
| **Extractor Modules** | 6 (amount, autopay, currency, date, installment, late-fee) |
| **Helper Modules** | 12 (cache, confidence, domain, dates, errors, timezone, etc.) |
| **Test Locations Updated** | All (tests/ → frontend/tests/) |

---

## References

### Related Documentation
- **Spec**: `specs/002-realign-payplan-specs/spec.md`
- **Plan**: `specs/realignment/plan.md`
- **Tasks**: `specs/realignment/tasks.md`
- **CI Gates**: `specs/realignment/ci-gates.md`
- **UI Enhancements**: `specs/realignment/ui-enhancements.md`

### Key Commits
- **v0.1.5-a.2**: Modular extraction architecture (baseline)
- **LRU Cache**: Commit `63f96a1` (230-875x speedup)
- **Swagger Lazy-load**: Commit `d6aa10d` (31.7% bundle reduction)

### Audit Reports
- **Repository Audit**: `ops/audits/audit-20251007-1102.md`
- **Module Inventory**: See "Key Module Presence" section in audit

---

**Delta Status**: ✅ Complete - Ready for review and merge

**Merge Impact**: Documentation-only (zero runtime risk)
