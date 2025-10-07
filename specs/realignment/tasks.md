# Atomic Tasks: Realign PayPlan Specs to Modular Extraction Architecture

**Branch**: `002-realign-payplan-specs`
**Plan**: [plan.md](./plan.md)
**Status**: Ready to Execute

---

## Task Summary

| # | Task | Duration | Status | Dependencies |
|---|------|----------|--------|--------------|
| 2.1 | Create Delta Migration Document | 45 min | Pending | None |
| 2.2 | Update inbox-paste Specs | 40 min | Pending | 2.1 (reference) |
| 2.3 | Update 001-inbox-paste-phase Specs | 60 min | Pending | 2.1 (reference) |
| 2.4 | Update v0.1.5-rescue Specs | 30 min | Pending | 2.1 (reference) |
| 2.5 | Sweep Remaining Specs for Test Paths | 30 min | Pending | 2.2-2.4 |
| 2.6 | Add CI Gates Specification | 45 min | Pending | None |
| 2.7 | Add Confidence Legend Documentation | 20 min | Pending | None |
| 2.8 | Final Verification & PR Prep | 30 min | Pending | All |

**Total**: ~5 hours

---

## Task 2.1: Create Delta Migration Document ⏱️ 45min

**File**: `ops/deltas/0013_realignment.md`

### Objective
Document the complete migration from monolithic extraction modules to the modular v0.1.5-a.2 architecture with old→new path mappings and rationale.

### Steps

#### 1. Create delta file structure (5 min)
```bash
mkdir -p ops/deltas
touch ops/deltas/0013_realignment.md
```

#### 2. Write header and metadata (5 min)
```markdown
# Delta 0013: Realign Specs to Modular Extraction Architecture

**Created**: 2025-10-07
**Affects**: Documentation only (zero runtime changes)
**Version Range**: v0.1.3 → v0.1.5-a.2
**Migration Type**: Path references only

## Summary
Realigns all PayPlan specification documents to reflect the modular extraction architecture implemented in v0.1.5-a.2. Updates 71 stale references across 29 spec files.
```

#### 3. Create comprehensive path mapping tables (20 min)

**Provider Detection Modules**:
| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/provider-detectors.ts` | `frontend/src/lib/extraction/providers/detector.ts` | DELETED → MOVED | Separated provider detection logic into dedicated module |
| N/A | `frontend/src/lib/extraction/providers/patterns.ts` | NEW | Extracted regex patterns for maintainability and testing |

**Extractor Modules**:
| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/date-parser.ts` | `frontend/src/lib/extraction/extractors/date.ts` | MOVED + REFACTORED | Dedicated date extraction module with enhanced timezone support |
| N/A | `frontend/src/lib/extraction/extractors/amount.ts` | NEW | Extracted amount parsing logic from email-extractor.ts |
| N/A | `frontend/src/lib/extraction/extractors/autopay.ts` | NEW | Extracted autopay detection logic |
| N/A | `frontend/src/lib/extraction/extractors/currency.ts` | NEW | New currency detection module (multi-currency support) |
| N/A | `frontend/src/lib/extraction/extractors/installment.ts` | NEW | Extracted installment number parsing |
| N/A | `frontend/src/lib/extraction/extractors/late-fee.ts` | NEW | Extracted late fee detection logic |

**Helper Utilities**:
| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/redact.ts` | `frontend/src/lib/extraction/helpers/redaction.ts` | MOVED | Standardized naming convention (redact → redaction) |
| N/A | `frontend/src/lib/extraction/helpers/cache.ts` | NEW | LRU cache implementation (230-875x performance improvement) |
| N/A | `frontend/src/lib/extraction/helpers/confidence-calculator.ts` | NEW | Extracted confidence scoring logic |
| N/A | `frontend/src/lib/extraction/helpers/domain-validator.ts` | NEW | Email domain validation utilities |
| N/A | `frontend/src/lib/extraction/helpers/date-detector.ts` | NEW | Date format detection heuristics |
| N/A | `frontend/src/lib/extraction/helpers/date-reparser.ts` | NEW | Date reparsing utilities for edge cases |
| N/A | `frontend/src/lib/extraction/helpers/error-sanitizer.ts` | NEW | Error message sanitization for user display |
| N/A | `frontend/src/lib/extraction/helpers/timezone.ts` | NEW | Timezone detection and handling |
| N/A | `frontend/src/lib/extraction/helpers/field-extractor.ts` | NEW | Generic field extraction utilities |
| N/A | `frontend/src/lib/extraction/helpers/regex-profiler.ts` | NEW | Regex performance profiling for optimization |

**Core Orchestrator**:
| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `frontend/src/lib/email-extractor.ts` (monolithic) | `frontend/src/lib/email-extractor.ts` (orchestrator) | REFACTORED | Now imports and orchestrates extraction/* modules instead of containing all logic |

**Test Suites**:
| Old Path | New Path | Status | Rationale |
|----------|----------|--------|-----------|
| `tests/unit/*.test.js` | `frontend/tests/unit/*.test.ts` | MOVED + TS | Relocated to frontend/, converted to TypeScript |
| `tests/integration/*.test.js` | `frontend/tests/integration/*.test.ts` | MOVED + TS | Relocated to frontend/, converted to TypeScript |
| N/A | `frontend/tests/performance/*.test.ts` | NEW | Performance benchmarks for extraction and caching |
| N/A | `frontend/tests/fixtures/*.ts` | NEW | Shared test data (email samples, providers, mock items) |

#### 4. Add migration rationale section (10 min)

```markdown
## Migration Rationale

### Why Modular Architecture?
1. **Separation of Concerns**: Each extractor handles a single field type (amount, date, currency, etc.)
2. **Testability**: Individual modules easier to unit test in isolation
3. **Maintainability**: Smaller files (~50-150 LOC) vs monolithic email-extractor.ts (500+ LOC)
4. **Performance**: Dedicated cache module enables 230-875x speedup
5. **Extensibility**: New providers/extractors can be added without modifying core logic

### Benefits Achieved
- ✅ **Code Organization**: Clear separation of providers, extractors, and helpers
- ✅ **Performance**: LRU cache reduced extraction time from ~1000ms to ~50-200ms
- ✅ **Test Coverage**: 30+ unit tests, integration tests, performance benchmarks
- ✅ **Developer Experience**: Easier to navigate and understand codebase structure

### Migration Timeline
- **v0.1.3**: Monolithic email-extractor.ts, provider-detectors.ts, date-parser.ts
- **v0.1.4-b**: Began extracting provider patterns
- **v0.1.5-a.1**: Introduced extraction/ directory structure
- **v0.1.5-a.2**: Completed modular refactor with all extractors and helpers
- **v0.2.0 (this delta)**: Documentation realignment

## Impact Analysis

### Runtime Impact
- **Code Changes**: ZERO (documentation-only update)
- **Behavior Changes**: NONE
- **Performance Impact**: NONE (no code modified)
- **Breaking Changes**: NONE

### Documentation Impact
- **Spec Files Updated**: 29 files
- **Total Reference Updates**: ~71 path references
- **New Documentation**: 5 files (plan, tasks, ci-gates, ui-enhancements, this delta)

### Developer Impact
- **Navigation**: Specs now point to correct file locations
- **Onboarding**: New developers see accurate architecture
- **Maintenance**: Clear migration guide for future refactors
```

#### 5. Add affected files section (5 min)

```markdown
## Affected Specification Files

### High Priority (Direct Module References)
1. `specs/inbox-paste/tasks.md` - 18 references
2. `specs/inbox-paste/plan.md` - 3 references
3. `specs/001-inbox-paste-phase/tasks.md` - 27 references
4. `specs/001-inbox-paste-phase/data-model.md` - 7 references
5. `specs/001-inbox-paste-phase/research.md` - 7 references
6. `specs/v0.1.5-rescue/tasks.md` - 5 references
7. `specs/v0.1.5-rescue/tasks-a2.md` - 3 references
8. `specs/v0.1.5-rescue/review-analysis-a2.md` - 1 reference

### Medium Priority (Test Path References)
- All specs with `tests/unit/` → `frontend/tests/unit/`
- All specs with `tests/integration/` → `frontend/tests/integration/`

### Low Priority (Potential Indirect References)
- `specs/bnpl-manager/{feature-spec,plan,tasks}.md`
- `specs/api-hardening/{feature-spec,plan,tasks}.md`
- `specs/public-deployment/{feature-spec,plan,tasks}.md`
- `specs/business-days/{feature-spec,analysis}.md`
```

### Acceptance Criteria
- [x] File `ops/deltas/0013_realignment.md` created
- [x] All 20+ module migrations documented in tables
- [x] Old→new path mappings complete with status
- [x] Rationale explains benefits (SoC, testability, performance, maintainability)
- [x] Migration timeline included (v0.1.3 → v0.1.5-a.2)
- [x] Impact analysis confirms zero runtime changes
- [x] Affected files listed with reference counts

### Verification
```bash
# Verify file exists
ls -la ops/deltas/0013_realignment.md

# Verify completeness (should have all key sections)
grep -E "^##" ops/deltas/0013_realignment.md
# Expected: Summary, Path Mappings, Rationale, Impact, Affected Files
```

---

## Task 2.2: Update inbox-paste Specs ⏱️ 40min

**Files**: `specs/inbox-paste/{tasks.md, plan.md}`

### Objective
Update the original inbox-paste specs (v0.1.3 era) with current modular extraction paths.

### Steps

#### 1. Update tasks.md (25 min)

**File**: `specs/inbox-paste/tasks.md`
**Stale References**: 18

##### Find/Replace Operations:
```bash
# 1. Provider detectors (8 occurrences)
sed -i 's|frontend/src/lib/provider-detectors\.ts|frontend/src/lib/extraction/providers/detector.ts|g' specs/inbox-paste/tasks.md

# 2. Date parser (5 occurrences)
sed -i 's|frontend/src/lib/date-parser\.ts|frontend/src/lib/extraction/extractors/date.ts|g' specs/inbox-paste/tasks.md

# 3. Email extractor (3 occurrences - add note)
# Manual: Add note that email-extractor.ts now orchestrates extraction/* modules

# 4. Redaction (if present)
sed -i 's|frontend/src/lib/redact\.ts|frontend/src/lib/extraction/helpers/redaction.ts|g' specs/inbox-paste/tasks.md

# 5. Test paths (2 occurrences)
sed -i 's|tests/unit/|frontend/tests/unit/|g' specs/inbox-paste/tasks.md
sed -i 's|tests/integration/|frontend/tests/integration/|g' specs/inbox-paste/tasks.md
```

##### Manual Updates:
- Update code verification commands with new paths
- Add architectural note explaining modular refactor

#### 2. Update plan.md (15 min)

**File**: `specs/inbox-paste/plan.md`
**Stale References**: 3

##### Find/Replace Operations:
```bash
# 1. Module list section
sed -i 's|frontend/src/lib/email-extractor\.ts|frontend/src/lib/email-extractor.ts (orchestrator)|g' specs/inbox-paste/plan.md
sed -i 's|frontend/src/lib/provider-detectors\.ts|frontend/src/lib/extraction/providers/detector.ts|g' specs/inbox-paste/plan.md
sed -i 's|frontend/src/lib/date-parser\.ts|frontend/src/lib/extraction/extractors/date.ts|g' specs/inbox-paste/plan.md
```

##### Manual Updates:
- Add note in "Implementation Details" or similar section:
  ```markdown
  **Note (2025-10-07)**: As of v0.1.5-a.2, the extraction logic has been refactored into a modular architecture:
  - Providers: `frontend/src/lib/extraction/providers/`
  - Extractors: `frontend/src/lib/extraction/extractors/`
  - Helpers: `frontend/src/lib/extraction/helpers/`

  See `ops/deltas/0013_realignment.md` for full migration details.
  ```

### Acceptance Criteria
- [x] All 18 references in tasks.md updated
- [x] All 3 references in plan.md updated
- [x] Test paths include `frontend/` prefix
- [x] Architectural note added explaining v0.1.5-a.2 refactor
- [x] No stale paths remain (verified via grep)

### Verification
```bash
# Verify no stale references
! grep -E "provider-detectors\.ts|date-parser\.ts" specs/inbox-paste/tasks.md
! grep -E "provider-detectors\.ts|date-parser\.ts" specs/inbox-paste/plan.md

# Verify test paths updated
grep "frontend/tests" specs/inbox-paste/tasks.md

# Verify note added
grep "v0.1.5-a.2" specs/inbox-paste/plan.md
```

---

## Task 2.3: Update 001-inbox-paste-phase Specs ⏱️ 60min

**Files**: `specs/001-inbox-paste-phase/{tasks.md, data-model.md, research.md}`

### Objective
Update the comprehensive Phase 001 specs with all new modular paths and architectural context.

### Steps

#### 1. Update tasks.md (30 min)

**File**: `specs/001-inbox-paste-phase/tasks.md`
**Stale References**: 27

##### Find/Replace Operations:
```bash
cd /home/matt/PROJECTS/PayPlan

# 1. Redaction module (5 occurrences)
sed -i 's|frontend/src/lib/redact\.ts|frontend/src/lib/extraction/helpers/redaction.ts|g' specs/001-inbox-paste-phase/tasks.md

# 2. Email extractor (10 occurrences - careful, some may need context)
# Manual review needed - some are imports, some are file locations

# 3. Provider detectors (8 occurrences)
sed -i 's|frontend/src/lib/provider-detectors\.ts|frontend/src/lib/extraction/providers/detector.ts|g' specs/001-inbox-paste-phase/tasks.md

# 4. Date parser (if present)
sed -i 's|frontend/src/lib/date-parser\.ts|frontend/src/lib/extraction/extractors/date.ts|g' specs/001-inbox-paste-phase/tasks.md

# 5. CSV module (if separate)
# Check if csv.ts exists; likely absorbed into extraction logic
```

##### Manual Updates:
- **Code stubs**: Update import statements to use new paths
- **Test commands**: Update file paths in grep/test commands
- **Architecture diagrams**: Update any ASCII/markdown diagrams with new structure

##### Example Code Stub Update:
```typescript
// OLD
import { redactPII } from './frontend/src/lib/redact';

// NEW
import { redactPII } from './frontend/src/lib/extraction/helpers/redaction';
```

#### 2. Update data-model.md (15 min)

**File**: `specs/001-inbox-paste-phase/data-model.md`
**Stale References**: 7 (mostly "Location:" annotations)

##### Find/Replace Operations:
```bash
# 1. Update Location: annotations
sed -i 's|Location\*\*: `frontend/src/lib/email-extractor\.ts`|Location**: `frontend/src/lib/email-extractor.ts` (orchestrator - imports from extraction/*)|g' specs/001-inbox-paste-phase/data-model.md

sed -i 's|Location\*\*: `frontend/src/lib/provider-detectors\.ts`|Location**: `frontend/src/lib/extraction/providers/detector.ts`|g' specs/001-inbox-paste-phase/data-model.md

sed -i 's|Location\*\*: `frontend/src/lib/redact\.ts`|Location**: `frontend/src/lib/extraction/helpers/redaction.ts`|g' specs/001-inbox-paste-phase/data-model.md
```

##### Manual Updates:
- Add architectural context note at top of file explaining modular refactor

#### 3. Update research.md (15 min)

**File**: `specs/001-inbox-paste-phase/research.md`
**Stale References**: 7

##### Find/Replace Operations:
```bash
# 1. Redaction module
sed -i 's|frontend/src/lib/redact\.ts|frontend/src/lib/extraction/helpers/redaction.ts|g' specs/001-inbox-paste-phase/research.md

# 2. Provider detectors
sed -i 's|frontend/src/lib/provider-detectors\.ts|frontend/src/lib/extraction/providers/detector.ts|g' specs/001-inbox-paste-phase/research.md

# 3. Email extractor
sed -i 's|frontend/src/lib/email-extractor\.ts|frontend/src/lib/email-extractor.ts|g' specs/001-inbox-paste-phase/research.md
# Add note: "(now orchestrator for extraction/* modules)"
```

##### Manual Updates:
- **Section 4** (if present): Update architectural discussion with modular benefits
- Add subsection explaining v0.1.5-a.2 modular refactor evolution

### Acceptance Criteria
- [x] All 27 references in tasks.md updated
- [x] All 7 references in data-model.md updated
- [x] All 7 references in research.md updated
- [x] Code stubs use correct import paths
- [x] Location annotations point to current files
- [x] Research doc includes architectural evolution note
- [x] No stale paths remain (verified via grep)

### Verification
```bash
# Verify no stale references in all 3 files
for file in tasks.md data-model.md research.md; do
  echo "Checking specs/001-inbox-paste-phase/$file..."
  ! grep -E "lib/(provider-detectors|date-parser|redact)\.ts" "specs/001-inbox-paste-phase/$file"
done

# Verify extraction paths present
grep "extraction/providers" specs/001-inbox-paste-phase/tasks.md
grep "extraction/helpers" specs/001-inbox-paste-phase/data-model.md
```

---

## Task 2.4: Update v0.1.5-rescue Specs ⏱️ 30min

**Files**: `specs/v0.1.5-rescue/{tasks.md, tasks-a2.md, review-analysis-a2.md}`

### Objective
Update the v0.1.5 rescue sprint specs with current paths and add orchestrator pattern notes.

### Steps

#### 1. Update tasks.md (12 min)

**File**: `specs/v0.1.5-rescue/tasks.md`
**Stale References**: 5

##### Find/Replace Operations:
```bash
# 1. Date parser references
sed -i 's|frontend/src/lib/date-parser\.ts|frontend/src/lib/extraction/extractors/date.ts|g' specs/v0.1.5-rescue/tasks.md

# 2. Email extractor references (with context preservation)
# Manual: Check if line numbers need updating or orchestrator note
```

##### Manual Updates:
- If file references include line numbers (e.g., `:48`), verify accuracy or add note
- Add orchestrator context where email-extractor.ts is mentioned

#### 2. Update tasks-a2.md (10 min)

**File**: `specs/v0.1.5-rescue/tasks-a2.md`
**Stale References**: 3

##### Find/Replace Operations:
```bash
# 1. Email extractor references
# Manual review: Likely discussing JSDoc or specific functions

# 2. Add architectural note
```

##### Manual Updates:
- Update JSDoc examples if they reference old module paths
- Add note explaining extraction/* modular structure

#### 3. Update review-analysis-a2.md (8 min)

**File**: `specs/v0.1.5-rescue/review-analysis-a2.md`
**Stale References**: 1 (likely a location reference)

##### Find/Replace Operations:
```bash
# 1. Location reference with line number
sed -i 's|frontend/src/lib/email-extractor\.ts:\([0-9]*\)|frontend/src/lib/email-extractor.ts:\1 (orchestrator)|g' specs/v0.1.5-rescue/review-analysis-a2.md
```

##### Manual Updates:
- Verify line number accuracy (may have shifted during refactor)
- Add note about modular architecture if providing context

### Acceptance Criteria
- [x] All 5 references in tasks.md updated
- [x] All 3 references in tasks-a2.md updated
- [x] 1 reference in review-analysis-a2.md updated
- [x] Line numbers preserved or noted as approximate
- [x] Orchestrator pattern explained where relevant
- [x] No stale paths remain (verified via grep)

### Verification
```bash
# Verify no stale date-parser references
! grep "date-parser\.ts" specs/v0.1.5-rescue/tasks.md

# Verify orchestrator notes added
grep -c "orchestrator" specs/v0.1.5-rescue/*.md
# Expected: At least 2-3 occurrences
```

---

## Task 2.5: Sweep Remaining Specs for Test Paths ⏱️ 30min

**Files**: All other specs (bnpl-manager, api-hardening, public-deployment, business-days)

### Objective
Ensure all remaining specs use `frontend/tests/` prefix and catch any missed stale references.

### Steps

#### 1. Search for stale references (10 min)

```bash
cd /home/matt/PROJECTS/PayPlan

# 1. Find test path references without frontend/ prefix
echo "=== Test paths without frontend/ prefix ==="
grep -r "tests/unit" specs/ --include="*.md" | grep -v "frontend/tests" | grep -v "002-realign"

echo "=== Test paths without frontend/ prefix (integration) ==="
grep -r "tests/integration" specs/ --include="*.md" | grep -v "frontend/tests" | grep -v "002-realign"

# 2. Find any remaining old module references
echo "=== Stale provider-detectors references ==="
grep -r "provider-detectors\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"

echo "=== Stale date-parser references ==="
grep -r "date-parser\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"

echo "=== Stale redact references ==="
grep -r "lib/redact\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:"
```

#### 2. Update bnpl-manager specs (5 min)

**Files**: `specs/bnpl-manager/{feature-spec,plan,quickstart}.md`

```bash
# Update test paths if present
sed -i 's|tests/unit/|frontend/tests/unit/|g' specs/bnpl-manager/*.md
sed -i 's|tests/integration/|frontend/tests/integration/|g' specs/bnpl-manager/*.md
```

#### 3. Update api-hardening specs (5 min)

**Files**: `specs/api-hardening/{feature-spec,plan,tasks}.md`

```bash
# Update test paths if present
sed -i 's|tests/unit/|frontend/tests/unit/|g' specs/api-hardening/*.md
sed -i 's|tests/integration/|frontend/tests/integration/|g' specs/api-hardening/*.md
```

#### 4. Update public-deployment specs (5 min)

**Files**: `specs/public-deployment/{feature-spec,plan,tasks}.md`

```bash
# Update test paths if present
sed -i 's|tests/unit/|frontend/tests/unit/|g' specs/public-deployment/*.md
sed -i 's|tests/integration/|frontend/tests/integration/|g' specs/public-deployment/*.md
```

#### 5. Update business-days specs (5 min)

**Files**: `specs/business-days/{feature-spec,analysis}.md`

```bash
# Update test paths if present
sed -i 's|tests/unit/|frontend/tests/unit/|g' specs/business-days/*.md
sed -i 's|tests/integration/|frontend/tests/integration/|g' specs/business-days/*.md
```

### Acceptance Criteria
- [x] All test paths prefixed with `frontend/`
- [x] No stale module references in swept specs
- [x] Search results empty (no more stale refs)
- [x] All 4 spec groups checked (bnpl, api, deployment, business-days)

### Verification
```bash
# Final sweep - should return empty
echo "=== Final verification (should be empty) ==="

grep -r "tests/unit/" specs/ --include="*.md" | grep -v "frontend/tests" | grep -v "002-realign" | grep -v "Old:"

grep -r "provider-detectors\.ts\|date-parser\.ts\|lib/redact\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:" | grep -v "extraction"

# Should output: (nothing)
```

---

## Task 2.6: Add CI Gates Specification ⏱️ 45min

**File**: `specs/realignment/ci-gates.md` (new)

### Objective
Document CI performance gates, Swagger lazy-load verification, and artifact upload requirements.

### Steps

#### 1. Create CI gates specification file (40 min)

**File**: `specs/realignment/ci-gates.md`

##### Structure:
```markdown
# CI Performance Gates Specification

**Created**: 2025-10-07
**Status**: Specification (not yet implemented)
**Related**: Delta 0013 - Realignment

---

## Overview

Automated CI gates to prevent performance regressions in email extraction and maintain bundle optimization.

### Goals
1. **Performance Regression Detection**: Catch extraction slowdowns before merge
2. **Bundle Optimization**: Ensure Swagger remains lazy-loaded (31.7% bundle reduction)
3. **Trend Analysis**: Track performance metrics over time via artifacts

---

## Gate 1: Extraction Performance Benchmark

### Threshold
- **Requirement**: 50 emails processed in <2000ms
- **Current Performance**: ~50-200ms (with LRU cache enabled)
- **Headroom**: 10x safety margin (cache provides 230-875x speedup)

### Test Command
```bash
cd frontend
npm run test:perf
```

### Expected Output
```
✓ Cache benchmark: 50 emails
  ├─ Without cache: 1000-1500ms
  ├─ With cache (cold): 200-300ms
  └─ With cache (warm): 50-100ms ✅

Performance gate: PASS (< 2000ms threshold)
```

### Fail Condition
- Average extraction time across 3 runs exceeds 2000ms
- Cache disabled or not functioning
- Regression > 50% from baseline

### Implementation Notes
```yaml
# .github/workflows/ci.yml (example)
- name: Performance Gate
  run: |
    npm run test:perf --prefix frontend
    # Parses output for threshold check
    # Fails build if >2000ms
```

---

## Gate 2: Swagger Lazy-Loading Verification

### Requirement
SwaggerUI must be code-split and lazy-loaded to maintain bundle size optimization.

### Context
- **Baseline Bundle**: 450 KB (before lazy-load)
- **Optimized Bundle**: 307 KB (after lazy-load) - 31.7% reduction
- **Lazy-load commit**: d6aa10d (Day 7, Task 7.7)

### Verification Method
```bash
# Build production bundle
npm run build --prefix frontend

# Check if SwaggerUI is in main bundle (should fail)
if grep -q "SwaggerUI\|swagger-ui-react" frontend/dist/assets/index*.js; then
  echo "❌ SwaggerUI found in main bundle (not lazy-loaded)"
  exit 1
else
  echo "✅ SwaggerUI lazy-loaded correctly"
fi

# Verify separate chunk exists
if ls frontend/dist/assets/*swagger*.js 1>/dev/null 2>&1; then
  echo "✅ Swagger chunk file found"
else
  echo "⚠️  No swagger chunk file (check lazy-load implementation)"
fi
```

### Fail Condition
- SwaggerUI code found in main bundle (index*.js)
- Bundle size > 320 KB (5% tolerance from 307 KB baseline)
- Lazy-load import missing in `Docs.tsx`

### Implementation Notes
```yaml
# .github/workflows/ci.yml (example)
- name: Bundle Size Check
  run: |
    npm run build --prefix frontend
    # Check main bundle for SwaggerUI
    ! grep -q "swagger-ui-react" frontend/dist/assets/index*.js
    # Verify bundle size
    BUNDLE_SIZE=$(stat -f%z frontend/dist/assets/index*.js)
    if [ $BUNDLE_SIZE -gt 335872 ]; then  # 320 KB in bytes
      echo "❌ Bundle size exceeded: $BUNDLE_SIZE bytes"
      exit 1
    fi
```

---

## Gate 3: Artifact Upload & Retention

### Purpose
Track performance trends over time for regression analysis and optimization opportunities.

### Artifact Specification

**Artifact Name**: `perf-benchmarks-{SHA}`

**Format**: JSON
```json
{
  "timestamp": "2025-10-07T15:30:00Z",
  "commit": "e282b98",
  "branch": "002-realign-payplan-specs",
  "environment": {
    "node": "20.11.0",
    "os": "ubuntu-latest",
    "ci": "github-actions"
  },
  "benchmarks": {
    "extraction_50_emails": {
      "without_cache_ms": 1250,
      "with_cache_cold_ms": 280,
      "with_cache_warm_ms": 75,
      "cache_speedup": "16.7x",
      "threshold_ms": 2000,
      "passed": true
    },
    "bundle_size": {
      "main_bundle_kb": 307,
      "swagger_chunk_kb": 145,
      "total_kb": 452,
      "lazy_load_savings_kb": 143,
      "lazy_load_savings_pct": 31.7,
      "threshold_kb": 320,
      "passed": true
    }
  },
  "status": "PASS"
}
```

**Retention**: 90 days

**Upload Command**:
```yaml
- name: Upload Performance Artifacts
  uses: actions/upload-artifact@v4
  with:
    name: perf-benchmarks-${{ github.sha }}
    path: frontend/perf-results.json
    retention-days: 90
```

### Usage
- **Trend Analysis**: Download artifacts from last 30 days, plot metrics
- **Regression Detection**: Compare current run to main branch baseline
- **Optimization Tracking**: Verify performance improvements persist

---

## Implementation Checklist

### Phase 1: Test Scripts
- [ ] Add `test:perf` script to `frontend/package.json`
- [ ] Implement performance benchmark in `frontend/tests/performance/ci-gate.test.ts`
- [ ] Add JSON output formatter for artifact generation

### Phase 2: Workflow Integration
- [ ] Create `.github/workflows/perf-gate.yml`
- [ ] Add performance gate to main CI workflow
- [ ] Configure artifact upload with 90-day retention

### Phase 3: Documentation
- [ ] Update README.md with gate information
- [ ] Add troubleshooting guide for gate failures
- [ ] Document how to run gates locally

---

## Local Execution

Developers can run gates locally before pushing:

```bash
# Performance gate
cd frontend
npm run test:perf

# Bundle size check
npm run build
ls -lh dist/assets/index*.js
# Should be ~307 KB

# Verify lazy-load
! grep -q "swagger-ui-react" dist/assets/index*.js && echo "✅ Lazy-load OK"
```

---

## Troubleshooting

### Performance Gate Failing

**Symptom**: Extraction >2000ms

**Causes**:
1. Cache disabled or broken
2. Regex performance regression
3. CI environment under load

**Resolution**:
```bash
# Check cache functionality
npm run test:unit -- cache.test.ts

# Profile regex performance
npm run test -- regex-profiler.test.ts

# Run locally to isolate CI environment issues
npm run test:perf
```

### Bundle Size Gate Failing

**Symptom**: SwaggerUI in main bundle or size >320 KB

**Causes**:
1. Lazy-load import removed from Docs.tsx
2. Dynamic import converted to static
3. New dependencies added to main bundle

**Resolution**:
```bash
# Check Docs.tsx for lazy-load
grep "React.lazy.*Swagger" frontend/src/pages/Docs.tsx

# Analyze bundle composition
npm run build -- --analyze

# Verify dynamic import syntax
grep -A5 "const SwaggerUI" frontend/src/pages/Docs.tsx
```

---

## Future Enhancements

1. **Regression Trend Detection**: Alert on 3 consecutive slowdowns
2. **Performance Budgets**: Separate thresholds for cache/no-cache scenarios
3. **Lighthouse CI**: Add page load performance gates
4. **Bundle Analysis**: Automated bundle composition reports
```

#### 2. Add reference in main plan.md (5 min)

Add cross-reference to `specs/realignment/plan.md`:
```markdown
### CI Gates
See detailed specification in [ci-gates.md](./ci-gates.md).
```

### Acceptance Criteria
- [x] File `specs/realignment/ci-gates.md` created
- [x] All 3 gates documented (perf, bundle, artifacts)
- [x] Thresholds clearly defined (50 emails <2s, bundle <320KB)
- [x] Example workflow snippets provided
- [x] Local execution commands included
- [x] Troubleshooting guide present
- [x] Cross-referenced from plan.md

### Verification
```bash
# Verify file exists and has required sections
ls -la specs/realignment/ci-gates.md

grep -E "^## Gate [123]:" specs/realignment/ci-gates.md
# Expected: 3 matches (Gate 1, Gate 2, Gate 3)

# Verify thresholds documented
grep "2000ms\|320 KB\|90 days" specs/realignment/ci-gates.md
```

---

## Task 2.7: Add Confidence Legend Documentation ⏱️ 20min

**Files**:
- `specs/realignment/ui-enhancements.md` (new)
- CSV export documentation (update or create)

### Objective
Document the confidence legend component and add CSV column descriptions for user clarity.

### Steps

#### 1. Create UI enhancements specification (15 min)

**File**: `specs/realignment/ui-enhancements.md`

```markdown
# UI/Documentation Enhancements for Realignment

**Created**: 2025-10-07
**Related**: Delta 0013 - Realignment

---

## Overview

Documents UI components and documentation additions related to confidence scoring and user-facing features.

---

## Confidence Legend Component

### Location
`frontend/src/components/ConfidenceLegend.tsx` (if exists) or inline in results display

### Purpose
Explains confidence scores to users viewing extraction results.

### Visual Design (3-tier system)

```
Confidence Score Guide:
━━━━━━━━━━━━━━━━━━━━━
🟢 High (0.8 - 1.0)
   All required fields extracted successfully
   Safe to proceed with data

🟡 Medium (0.5 - 0.8)
   Some fields missing or ambiguous
   Review before using

🔴 Low (0.0 - 0.5)
   Major extraction issues detected
   Manual review required
```

### Implementation Reference
```tsx
// frontend/src/components/ConfidenceLegend.tsx (example)
export function ConfidenceLegend() {
  return (
    <div className="confidence-legend">
      <h3>Confidence Score Guide</h3>
      <div className="tier high">
        <span className="badge">🟢 High (0.8+)</span>
        <p>All required fields extracted successfully</p>
      </div>
      <div className="tier medium">
        <span className="badge">🟡 Medium (0.5-0.8)</span>
        <p>Some fields missing or ambiguous</p>
      </div>
      <div className="tier low">
        <span className="badge">🔴 Low (<0.5)</span>
        <p>Major extraction issues - manual review required</p>
      </div>
    </div>
  );
}
```

### Display Context
- **Results Page**: Show legend below extraction results table
- **EmailPreview Component**: Include confidence badge per item
- **EmailIssues Component**: Already shows low-confidence warnings

---

## CSV Export Documentation

### Column: `confidence`

**Type**: Decimal (0.0 - 1.0)

**Description**: Extraction confidence score indicating data quality and completeness

**Interpretation**:
- **0.8 - 1.0** (High Confidence - Green)
  - All required fields successfully extracted
  - Provider detected with high certainty
  - Date, amount, currency parsed without ambiguity
  - Safe to use data without manual review

- **0.5 - 0.8** (Medium Confidence - Yellow)
  - Some optional fields missing (e.g., late_fee, autopay)
  - Date format unusual but parseable
  - Amount or currency inferred from context
  - **Recommendation**: Quick manual review before use

- **0.0 - 0.5** (Low Confidence - Red)
  - Required fields missing (provider, date, or amount)
  - Multiple extraction errors detected
  - Ambiguous or conflicting data found
  - **Requirement**: Manual data entry or correction needed

**CSV Format Example**:
```csv
provider,installment_no,due_date,amount,currency,autopay,late_fee,confidence
Klarna,1,2025-10-15,45.00,USD,true,7.00,0.95
Affirm,2,2025-11-01,50.00,USD,false,0.00,0.85
Unknown,1,2025-10-20,25.00,USD,false,0.00,0.45
```

### Documentation Locations

**Primary**: `frontend/README.md` or `frontend/docs/CSV_EXPORT.md`

**Secondary**: Results page UI tooltip

**Example Documentation Block**:
```markdown
## CSV Export Format

The exported CSV includes the following columns:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `provider` | String | BNPL provider name | Klarna, Affirm, Afterpay |
| `installment_no` | Integer | Payment installment number | 1, 2, 3, 4 |
| `due_date` | Date (ISO) | Payment due date | 2025-10-15 |
| `amount` | Decimal | Payment amount | 45.00 |
| `currency` | String (ISO 4217) | Currency code | USD, EUR, GBP |
| `autopay` | Boolean | Autopay enabled | true, false |
| `late_fee` | Decimal | Late fee amount (if applicable) | 7.00, 0.00 |
| **`confidence`** | **Decimal** | **Extraction confidence (0.0-1.0)** | **0.95** |

### Confidence Score Explained

The `confidence` column indicates how certain the extraction algorithm is about the data quality:

- **0.8+ (High)**: ✅ All required fields extracted successfully - safe to use
- **0.5-0.8 (Medium)**: ⚠️ Some fields missing or ambiguous - review recommended
- **<0.5 (Low)**: ❌ Major extraction issues - manual review required

Rows with low confidence (<0.5) are highlighted in red in the UI and should be manually verified before use.

See the **Confidence Legend** on the results page for visual guidance.
```

---

## Integration Points

### Components
- `EmailPreview.tsx`: Display confidence badge per item
- `EmailIssues.tsx`: Already shows low-confidence warnings
- `ScheduleTable.tsx`: Could add confidence column (optional)

### Documentation
- `frontend/README.md`: Add CSV export section
- Results page: Inline legend component
- CSV export tooltip: Link to full docs

---

## Acceptance Criteria
- [x] Confidence legend documented with 3-tier system
- [x] CSV column description written
- [x] Visual design provided (badges, colors)
- [x] Implementation reference included
- [x] Documentation locations specified
```

#### 2. Add CSV documentation to appropriate file (5 min)

If `frontend/README.md` or `frontend/docs/CSV_EXPORT.md` exists, add the confidence column description. Otherwise, note in `ui-enhancements.md` where it should be added.

### Acceptance Criteria
- [x] File `specs/realignment/ui-enhancements.md` created
- [x] Confidence legend documented with 3-tier system (0.8+, 0.5-0.8, <0.5)
- [x] CSV confidence column description written
- [x] Visual design included (colors, badges)
- [x] Component reference provided (`ConfidenceLegend`)
- [x] Documentation locations specified (README, results page, tooltip)

### Verification
```bash
# Verify file exists
ls -la specs/realignment/ui-enhancements.md

# Verify 3-tier system documented
grep -E "0\.8.*1\.0|0\.5.*0\.8|0\.0.*0\.5" specs/realignment/ui-enhancements.md

# Verify CSV column described
grep "confidence.*column\|CSV.*confidence" specs/realignment/ui-enhancements.md
```

---

## Task 2.8: Final Verification & PR Prep ⏱️ 30min

### Objective
Run comprehensive verification checks and prepare PR description with complete checklist.

### Steps

#### 1. Automated path verification (10 min)

```bash
#!/bin/bash
# verify-realignment.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PayPlan Realignment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check 1: No stale provider-detectors references
echo "1️⃣  Checking for stale provider-detectors references..."
STALE_PD=$(grep -r "frontend/src/lib/provider-detectors\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:" | grep -v "extraction" || true)
if [ -n "$STALE_PD" ]; then
  echo "❌ Found stale provider-detectors references:"
  echo "$STALE_PD"
  exit 1
else
  echo "✅ No stale provider-detectors references"
fi
echo ""

# Check 2: No stale date-parser references
echo "2️⃣  Checking for stale date-parser references..."
STALE_DP=$(grep -r "frontend/src/lib/date-parser\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:" | grep -v "extraction" || true)
if [ -n "$STALE_DP" ]; then
  echo "❌ Found stale date-parser references:"
  echo "$STALE_DP"
  exit 1
else
  echo "✅ No stale date-parser references"
fi
echo ""

# Check 3: No stale redact references
echo "3️⃣  Checking for stale redact.ts references..."
STALE_REDACT=$(grep -r "frontend/src/lib/redact\.ts" specs/ --include="*.md" | grep -v "002-realign" | grep -v "Old:" | grep -v "extraction" || true)
if [ -n "$STALE_REDACT" ]; then
  echo "❌ Found stale redact.ts references:"
  echo "$STALE_REDACT"
  exit 1
else
  echo "✅ No stale redact.ts references"
fi
echo ""

# Check 4: Test paths have frontend/ prefix
echo "4️⃣  Checking test path prefixes..."
STALE_TESTS=$(grep -r "tests/unit/\|tests/integration/" specs/ --include="*.md" | grep -v "frontend/tests" | grep -v "002-realign" | grep -v "Old:" || true)
if [ -n "$STALE_TESTS" ]; then
  echo "❌ Found test paths without frontend/ prefix:"
  echo "$STALE_TESTS"
  exit 1
else
  echo "✅ All test paths have frontend/ prefix"
fi
echo ""

# Check 5: Required new files exist
echo "5️⃣  Checking for required new files..."
REQUIRED_FILES=(
  "specs/realignment/plan.md"
  "specs/realignment/tasks.md"
  "specs/realignment/ci-gates.md"
  "specs/realignment/ui-enhancements.md"
  "ops/deltas/0013_realignment.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  else
    echo "✅ $file"
  fi
done
echo ""

# Check 6: No code changes (only .md files)
echo "6️⃣  Checking for code changes..."
CODE_CHANGES=$(git diff main --name-only | grep -E "\.(ts|tsx|js|jsx)$" || true)
if [ -n "$CODE_CHANGES" ]; then
  echo "❌ Unexpected code changes detected:"
  echo "$CODE_CHANGES"
  exit 1
else
  echo "✅ No code changes (docs-only verified)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Realignment verification complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

#### 2. Generate file change summary (5 min)

```bash
# Count updated files
echo "Files updated:"
git diff main --name-status | grep "^M" | wc -l

# Count new files
echo "Files created:"
git diff main --name-status | grep "^A" | wc -l

# List all changed files
git diff main --name-status
```

#### 3. Prepare PR description (15 min)

**File**: `specs/realignment/PR_DESCRIPTION.md` (template)

```markdown
## 📋 Realign PayPlan Specs to Modular Extraction Architecture

**Type**: 📚 Documentation
**Runtime Impact**: ✅ None (docs-only)
**Breaking Changes**: ❌ None

---

### Summary

Realigns all specification documents to reflect the modular extraction architecture implemented in v0.1.5-a.2. Updates **71 stale path references** across **29 spec files**, adds CI performance gate specifications, and documents UI enhancements for confidence scoring.

---

### 🎯 Objectives Achieved

- ✅ **Updated 29 spec files** with accurate module paths
- ✅ **Created migration guide** (`ops/deltas/0013_realignment.md`)
- ✅ **Documented CI gates** (50 emails <2s, Swagger lazy-load, artifact upload)
- ✅ **Documented UI enhancements** (confidence legend component, CSV docs)

---

### 📦 Changes

#### Files Updated (29)
- `specs/inbox-paste/{tasks,plan}.md` - 21 refs updated
- `specs/001-inbox-paste-phase/{tasks,data-model,research}.md` - 41 refs updated
- `specs/v0.1.5-rescue/{tasks,tasks-a2,review-analysis-a2}.md` - 9 refs updated
- `specs/{bnpl-manager,api-hardening,public-deployment,business-days}/*.md` - Test paths updated

#### Files Created (5)
- `specs/realignment/plan.md` - Implementation plan
- `specs/realignment/tasks.md` - Atomic task breakdown
- `specs/realignment/ci-gates.md` - CI performance gate specification
- `specs/realignment/ui-enhancements.md` - Confidence legend documentation
- `ops/deltas/0013_realignment.md` - Migration guide (old→new paths)

---

### 🔄 Path Migrations

**Old Architecture** → **New Architecture (v0.1.5-a.2)**

| Old Path | New Path | Status |
|----------|----------|--------|
| `frontend/src/lib/provider-detectors.ts` | `frontend/src/lib/extraction/providers/detector.ts` | MOVED |
| `frontend/src/lib/date-parser.ts` | `frontend/src/lib/extraction/extractors/date.ts` | MOVED |
| `frontend/src/lib/redact.ts` | `frontend/src/lib/extraction/helpers/redaction.ts` | MOVED |
| `tests/unit/` | `frontend/tests/unit/` | RELOCATED |
| `tests/integration/` | `frontend/tests/integration/` | RELOCATED |

**New Modules** (v0.1.5-a.2):
- Extractors: `amount.ts`, `autopay.ts`, `currency.ts`, `installment.ts`, `late-fee.ts`
- Helpers: `cache.ts`, `confidence-calculator.ts`, `domain-validator.ts`, `date-detector.ts`, `date-reparser.ts`, `error-sanitizer.ts`, `timezone.ts`, `field-extractor.ts`, `regex-profiler.ts`
- Providers: `patterns.ts` (extracted from detector.ts)

---

### 🚦 CI Gates Specification

#### Gate 1: Extraction Performance
- **Threshold**: 50 emails in <2000ms
- **Current**: ~50-200ms (with cache)
- **Test**: `npm run test:perf`

#### Gate 2: Swagger Lazy-Loading
- **Requirement**: SwaggerUI code-split (not in main bundle)
- **Baseline**: 307 KB (31.7% reduction from 450 KB)
- **Verification**: Bundle analysis + grep check

#### Gate 3: Artifact Upload
- **Format**: JSON with metrics, timestamp, environment
- **Retention**: 90 days
- **Usage**: Trend analysis, regression detection

---

### 📊 Confidence Legend Documentation

**3-Tier System**:
- 🟢 **High (0.8+)**: All required fields extracted - safe to use
- 🟡 **Medium (0.5-0.8)**: Some fields missing - review recommended
- 🔴 **Low (<0.5)**: Major issues - manual review required

**Documentation Locations**:
- Results page: Inline legend component
- CSV export: Column description added
- Component: `ConfidenceLegend.tsx` reference

---

### ✅ Verification

#### Automated Checks
```bash
# Run verification script
bash scripts/verify-realignment.sh

# Expected output:
# ✅ No stale provider-detectors references
# ✅ No stale date-parser references
# ✅ No stale redact.ts references
# ✅ All test paths have frontend/ prefix
# ✅ All required files present
# ✅ No code changes (docs-only verified)
# 🎉 Realignment verification complete!
```

#### Manual Checks
- [x] All path references point to existing files
- [x] No code changes in `git diff` (only .md files)
- [x] Delta file includes all 20+ module migrations
- [x] CI gates have clear thresholds and examples
- [x] Confidence legend uses 3-tier system

---

### 📝 Related

- **Delta File**: `ops/deltas/0013_realignment.md`
- **Spec Branch**: `002-realign-payplan-specs`
- **Base Version**: v0.1.5-a.2 (modular extraction architecture)
- **Plan**: `specs/realignment/plan.md`
- **Tasks**: `specs/realignment/tasks.md`

---

### 🚀 Post-Merge

No action required - documentation-only update with zero runtime impact.

**Optional Follow-ups**:
- Implement CI gates in `.github/workflows/` (separate PR)
- Add `ConfidenceLegend` component to results page (if not exists)
- Update frontend README with CSV export documentation

---

### 📸 Before/After Example

**Before** (stale reference):
```markdown
Create `frontend/src/lib/provider-detectors.ts` with detection logic.
```

**After** (updated reference):
```markdown
Create `frontend/src/lib/extraction/providers/detector.ts` with detection logic.
```

---

**Ready to merge** ✅
```

### Acceptance Criteria
- [x] Verification script created and executed successfully
- [x] No stale path references found
- [x] All required files present (5 new files)
- [x] No code changes detected (docs-only verified)
- [x] PR description prepared with complete checklist
- [x] File change summary generated

### Verification
```bash
# Run verification script
bash specs/realignment/verify-realignment.sh

# Expected: All checks pass, exit code 0

# Review PR description
cat specs/realignment/PR_DESCRIPTION.md
```

---

## Completion Checklist

- [ ] Task 2.1: Delta migration document created
- [ ] Task 2.2: inbox-paste specs updated (21 refs)
- [ ] Task 2.3: 001-inbox-paste-phase specs updated (41 refs)
- [ ] Task 2.4: v0.1.5-rescue specs updated (9 refs)
- [ ] Task 2.5: Remaining specs swept for test paths
- [ ] Task 2.6: CI gates specification created
- [ ] Task 2.7: Confidence legend documentation created
- [ ] Task 2.8: Verification script passes + PR description ready

---

**Total Estimated Duration**: ~5 hours (8 tasks)

**Status**: Ready to execute ✅
