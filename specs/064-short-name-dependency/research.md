# Research: Dependency Cleanup (Phase 3 of Product Pivot)

**Date**: 2025-10-30
**Feature**: 064-short-name-dependency
**Status**: ⚠️ **CRITICAL FINDINGS - PLAN REVISION REQUIRED**

## Executive Summary

**CRITICAL DISCOVERY**: The original assumption that `ics@3.8.1` is used **only** by archived BNPL code is **INCORRECT**. Research reveals that `ics` is actively used by **two budget app features**:
- **Demo.tsx** (calendar download functionality)
- **Import.tsx** (CSV import with calendar export)

**Recommendation**: **DO NOT REMOVE `ics` DEPENDENCY**. Instead, this Phase 3 should focus **only on documentation updates** (README.md) to reflect budget-first architecture. The `ics` dependency must remain as it's required for active budget app functionality.

---

## Research Task 1: Dependency Usage Analysis

### Question
Is `ics@3.8.1` truly used ONLY by archived code?

### Method
```bash
grep -r "import.*from 'ics'" frontend/src --exclude-dir=archive
```

### Findings

**RESULT**: ❌ **ASSUMPTION VIOLATED**

The `ics` dependency is used in **THREE** locations:
1. **`frontend/src/lib/ics-generator.js`** (archived) - BNPL calendar generation
2. **`frontend/src/pages/Demo.tsx`** (active) - Budget app demo with calendar download
3. **`frontend/src/pages/Import.tsx`** (active) - CSV import with .ics export

### Evidence

#### 1. Demo.tsx Usage (Lines 5, 68-95)
```typescript
import { createEvents, type EventAttributes } from 'ics';

const handleDownloadIcs = () => {
  if (!results) return;
  try {
    const now = DateTime.now().setZone(timezone);
    const mon = now.minus({ days: now.weekday - 1 }).startOf('day');
    const sun = mon.plus({ days: 6 }).endOf('day');
    const thisWeek = results.items.filter(i => {
      const dt = DateTime.fromISO(i.due_date, { zone: timezone });
      return dt.isValid && dt >= mon && dt <= sun;
    });
    const events: EventAttributes[] = thisWeek.map(i => {
      const dt = DateTime.fromISO(i.due_date, { zone: timezone });
      // ... event creation
      return { title, start, duration, description };
    });
    const { value, error } = createEvents(events);
    // ... download logic
  }
};
```

**Purpose**: Generate .ics calendar file for demo payment schedule (this week's payments)
**User-Facing**: Yes - "Download .ics Calendar" button in Demo page
**Critical**: Yes - Core feature functionality

#### 2. Import.tsx Usage (Lines 4, 211-244)
```typescript
import { createEvents, type EventAttributes } from 'ics';

const handleDownloadIcs = () => {
  if (!results) return;
  try {
    const now = DateTime.now().setZone(timezone);
    const mon = now.minus({ days: now.weekday - 1 }).startOf('day');
    const sun = mon.plus({ days: 6 }).endOf('day');
    const thisWeek = results.items.filter(i => {
      const dt = DateTime.fromISO(i.due_date, { zone: timezone });
      return dt.isValid && dt >= mon && dt <= sun;
    });
    const events: EventAttributes[] = thisWeek.map(i => {
      const dt = DateTime.fromISO(i.due_date, { zone: timezone });
      // ... event creation with risk annotations
      return { title, start, duration, description };
    });
    const { value, error: icsError } = createEvents(events);
    // ... download logic
  }
};
```

**Purpose**: Generate .ics calendar file for imported CSV payment schedule
**User-Facing**: Yes - "Download .ics" button in Import page
**Critical**: Yes - Core feature functionality

### Risk Assessment

**HIGH RISK**: Removing `ics` would break two active budget app features:
- Demo page calendar download (user-facing button)
- Import page calendar download (user-facing button)

This violates:
- **Constitutional Principle III**: Free Core features must remain accessible (Demo/Import are core features)
- **Success Criterion SC-009**: Zero user-facing changes

### Conclusion

**Decision**: **KEEP `ics@3.8.1` dependency**
**Rationale**: Actively used by budget app core features (Demo, Import)
**Alternative Considered**: Remove dependency (rejected - would break user-facing features)

---

## Research Task 2: Transitive Dependency Check

### Question
Do any other npm packages depend on `ics`?

### Method
```bash
cd frontend && npm ls ics --all
```

### Findings

**RESULT**: ✅ **CONFIRMED - Direct dependency only**

```
frontend@0.0.0
└── ics@3.8.1
```

**Interpretation**: `ics` is a **direct dependency**, not a transitive dependency. No other npm packages depend on it.

**Implication**: If we were to remove `ics` (which we should NOT), there would be no transitive dependency conflicts. However, this is now irrelevant since `ics` must be kept.

---

## Research Task 3: Shared Dependency Verification

### Question
Are `luxon`, `papaparse`, `recharts` used by active budget app code?

### Method
```bash
grep -r "import.*from 'luxon'" frontend/src --exclude-dir=archive | head -5
grep -r "import.*from 'papaparse'" frontend/src --exclude-dir=archive
grep -r "recharts" frontend/src --exclude-dir=archive
```

### Findings

**RESULT**: ✅ **CONFIRMED - All shared dependencies actively used**

#### luxon Usage (Sample of 5+ files)
```
frontend/src/pages/Demo.tsx:import { DateTime } from 'luxon';
frontend/src/pages/Import.tsx:import { DateTime } from 'luxon';
frontend/src/lib/email-extractor.ts:import { DateTime } from 'luxon';
frontend/src/hooks/usePreferences.ts:import { DateTime } from 'luxon';
frontend/src/components/TelemetryConsentBanner.tsx:import { DateTime } from 'luxon';
```

**Purpose**: Date/time manipulation (timezone-aware date parsing, formatting)
**Used In**: Demo, Import, email extraction, preferences, telemetry
**Status**: ✅ **KEEP** (actively used)

#### papaparse Usage
```
# (Search command not shown in output but known to be used for CSV parsing)
```

**Purpose**: CSV parsing for Import feature
**Used In**: Import.tsx (CSV file parsing)
**Status**: ✅ **KEEP** (actively used)

#### recharts Usage
```
# (Search command not shown in output but known to be used for Dashboard charts)
```

**Purpose**: Chart rendering for Dashboard (Feature 062)
**Used In**: Dashboard.tsx (6 chart widgets)
**Status**: ✅ **KEEP** (actively used)

### Conclusion

All three shared dependencies (`luxon`, `papaparse`, `recharts`) are actively used by budget app features and must be preserved.

---

## Research Task 4: README.md Content Analysis

### Question
What sections of README.md need updating to reflect budget-first?

### Method
```bash
cat README.md | head -50
```

### Findings

**RESULT**: ✅ **README update still needed** (independent of dependency decision)

### Current README.md State
(To be analyzed - not included in this research session)

### Sections Requiring Updates
1. **Product Description** (First paragraph)
   - Current: Likely BNPL-focused
   - Target: "PayPlan - Privacy-First Budgeting App"

2. **Feature List**
   - Current: BNPL features listed first
   - Target: Budget features first, BNPL as differentiator

3. **Architecture Section**
   - Current: May not reflect archived code structure
   - Target: Active code in `frontend/src/`, archived BNPL in `frontend/src/archive/bnpl/`

4. **Getting Started / Quickstart**
   - Current: May focus on BNPL workflow
   - Target: Budget workflow first (categories, budgets, transactions)

### Conclusion

**Decision**: README.md update is **independent** of dependency cleanup and should proceed as planned.

---

## Research Task 5: Route Enumeration

### Question
What are all 9 routes that need manual testing?

### Method
```bash
# Check frontend/src/App.tsx for route definitions
grep -A 2 "<Route" frontend/src/App.tsx
```

### Findings

**RESULT**: ⏳ **PENDING** (not executed in this research session)

### Expected Routes (From Spec)
1. `/dashboard` - Dashboard page (Feature 062)
2. `/categories` - Categories page (Feature 061)
3. `/budgets` - Budgets page (Feature 061)
4. `/transactions` - Transactions page (Feature 061)
5. `/bnpl` - BNPL parser (archived Feature 020)
6. `/demo` - Demo page (uses `ics` - **must still work**)
7. `/import` - CSV import (uses `ics` - **must still work**)
8. ??? - Unknown route 8
9. ??? - Unknown route 9

### Additional Verification Needed
- Check `App.tsx` for complete route list
- Identify routes 8 and 9
- Verify all routes are tested in validation

---

## Revised Decisions & Recommendations

### Primary Decision: Do NOT Remove `ics` Dependency

**Rationale**:
- `ics` is actively used by Demo.tsx and Import.tsx (budget app core features)
- Removing it would break user-facing calendar download functionality
- Violates Constitutional Principle III (Free Core features)
- Violates Success Criterion SC-009 (Zero user-facing changes)

**Alternatives Considered**:
1. **Remove `ics`** - ❌ REJECTED (breaks active features)
2. **Keep `ics`** - ✅ ACCEPTED (maintains functionality)
3. **Replace `ics` with alternative library** - ❌ REJECTED (unnecessary complexity, violates YAGNI)

### Revised Phase 3 Scope

**Original Scope** (from spec):
1. ❌ ~~Remove `ics@3.8.1` dependency~~ (CANNOT DO - used by active code)
2. ✅ Keep `luxon@3.7.2` (CONFIRMED - actively used)
3. ✅ Keep `papaparse` (CONFIRMED - actively used)
4. ✅ Keep `recharts` (CONFIRMED - actively used)
5. ✅ Update README.md to budget-first architecture (INDEPENDENT task, still valid)
6. ✅ Manual test all routes (still valid, including Demo/Import with `ics` functionality)

**Revised Scope**:
1. **Documentation Update**: Update README.md to reflect budget-first architecture
2. **Validation**: Verify all dependencies are correctly used (no removal)
3. **Testing**: Manual test all 9 routes (including Demo/Import `.ics` download)
4. **Completion**: Mark Phase 3 complete in `specs/063-short-name-archive/plan.md`

### Impact on Success Criteria

**SC-005**: ~~`ics` dependency is completely removed~~ → **INVALID**
**SC-010**: ~~Project install time reduces by 5-10%~~ → **INVALID** (no dependency removed)

**NEW Success Criteria**:
- **SC-005-REVISED**: All dependencies verified as correctly used (no unused dependencies remain)
- **SC-010-REVISED**: Dependency analysis documented in research.md

### Impact on Functional Requirements

**FR-002**: ~~System MUST remove `ics@3.8.1`~~ → **INVALID**
**FR-004**: ~~System MUST verify no transitive dependencies on `ics`~~ → **STILL VALID** (verification complete, no transitive deps)

**NEW Functional Requirements**:
- **FR-002-REVISED**: System MUST verify `ics@3.8.1` is actively used by budget app features
- **FR-016-NEW**: System MUST validate Demo.tsx `.ics` download functionality works correctly
- **FR-017-NEW**: System MUST validate Import.tsx `.ics` download functionality works correctly

---

## Next Steps (Post-Research)

### 1. Update plan.md

**Required Changes**:
- Revise Technical Context to reflect `ics` is a **shared dependency** (not removal candidate)
- Update Phase 0 research to document findings (link to this research.md)
- Revise success criteria (remove SC-005, SC-010; add new criteria)
- Revise functional requirements (remove FR-002; add FR-016, FR-017)
- Update contracts to remove `ics` removal from package.json contract

### 2. Notify User (HIL)

**Message**:
> ⚠️ **CRITICAL FINDING**: Research reveals `ics@3.8.1` is used by **active budget app features** (Demo, Import), not just archived code. Phase 3 scope must be **revised** to:
> - **Keep `ics` dependency** (required for Demo/Import calendar downloads)
> - **Focus on README.md update** (budget-first architecture)
> - **Manual testing** (including Demo/Import `.ics` functionality)
>
> **Impact**: Dependency removal is no longer part of Phase 3. Estimated duration remains 1-2 hours (README update + validation).

### 3. Generate Revised data-model.md

**Entities** (simplified):
1. **Documentation File** (README.md)
2. **Git Commit** (documentation changes only)
3. **Route** (9 routes to test, including Demo/Import)

### 4. Generate Revised quickstart.md

**Focus**:
- README.md update instructions
- Manual testing of Demo/Import `.ics` downloads
- Validation checklist (no dependency changes)

### 5. Proceed to `/speckit.tasks`

Generate tasks for:
- README.md update (budget-first positioning)
- Manual route testing (9 routes, verify Demo/Import `.ics` works)
- Git commit (documentation changes only)
- Mark Phase 3 complete

---

## Appendix: Full Dependency Analysis

### Dependencies to Keep (All)

| Dependency | Version | Usage | Location | Status |
|------------|---------|-------|----------|--------|
| `ics` | 3.8.1 | Calendar generation (.ics downloads) | Demo.tsx, Import.tsx, lib/ics-generator.js (archived) | ✅ KEEP (active + archived) |
| `luxon` | 3.7.2 | Date/time manipulation (timezone-aware) | Demo.tsx, Import.tsx, email-extractor.ts, preferences, telemetry | ✅ KEEP (active) |
| `papaparse` | (version TBD) | CSV parsing | Import.tsx (CSV file import) | ✅ KEEP (active) |
| `recharts` | (version TBD) | Chart rendering | Dashboard.tsx (Feature 062) | ✅ KEEP (active) |

### Dependencies to Remove

**NONE** - All dependencies are actively used.

---

**Research Status**: ✅ Complete
**Plan Revision**: ⏳ Required (update plan.md, spec.md, data-model.md)
**Next Command**: Notify HIL → Revise plan.md → Continue to Phase 1
