# Tasks: Demo Mode End-to-End (Budget-Optimized + ESLint/ISO Week Fixes)

**Input**: Design documents from `/specs/006-0019-demo-mode/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

## Execution Flow (main)

```text
1. Load plan.md from feature directory
   → Loaded: React/TypeScript frontend, REVISED ≤4 code files, ≤180 LOC budget
   → Extract: Tech stack (React 19, React Router 7, ics 3.8.1, luxon 3.7.2)
2. Load optional design documents:
   → data-model.md: Entities (DemoFixture, DemoResults, Risk types) ✓
   → contracts/: N/A (client-only feature, no API contracts)
   → research.md: Orchestrator reuse, risk scope (COLLISION, WEEKEND_AUTOPAY) ✓
3. Generate tasks by category:
   → Setup: Single fixtures module (T001)
   → Core: UI with inline utilities (T002), Route (T003)
   → Tests: Unit test (T004), Integration test (T005)
   → Polish: Delta doc (T006), Manual verification (T007), LOC check (T008)
4. Apply task rules:
   → Fixtures module - single file under pages/ (ESLint compliant)
   → Demo.tsx - self-contained with inline ICS generation
   → Tests - 2 files total (1 unit, 1 integration)
5. Number tasks sequentially (T001-T008)
6. Validate task completeness:
   → All user scenarios have tests? ✓
   → Code files ≤4? ✓ (fixtures.ts under pages/, Demo.tsx, App.tsx modified = 3 files)
   → LOC budget ≤180? ✓ (target enforced in T008)
   → ESLint compliant? ✓ (fixtures.ts under pages/, not lib/)
9. Return: SUCCESS (tasks ready for execution) ✓
```

## Budget Constraints

**Code Files**: ≤4 (excluding tests and docs)
- `frontend/src/pages/demo/fixtures.ts` (NEW) - **Note**: Moved from `lib/demo/` to avoid ESLint violations
- `frontend/src/pages/Demo.tsx` (NEW)
- `frontend/src/App.tsx` (MODIFIED)
- **Total: 3 files** ✓

**Code LOC**: ≤180 (buffer for review nits, target <200)
- fixtures.ts: ~60 LOC
- Demo.tsx: ~100 LOC (includes inline ICS generation)
- App.tsx: +2 LOC
- **Total: ~162 LOC** ✓

**Test Files**: 2 (not counted in code file budget)
- `frontend/tests/unit/demo/fixtures.test.ts`
- `frontend/tests/integration/demo-page.test.ts`

**ESLint Compliance**:
- ✅ Fixtures module moved to `pages/demo/` (ESLint rule allows only `extraction/**` or `email-extractor.ts` under `lib/`)
- ✅ Imports: `@/lib/email-extractor` (allowed) and `@/pages/demo/fixtures` (allowed)

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `frontend/tests/`
- All paths are absolute from repository root: `/home/matt/PROJECTS/PayPlan/`

---

## Phase 3.1: Foundation

### T001 Create Fixtures Module

**File**: `/home/matt/PROJECTS/PayPlan/frontend/src/pages/demo/fixtures.ts`

**LOC Target**: ~60 LOC

**Description**:
Create a single TypeScript module exporting 10 synthetic BNPL email snippets as string constants. This module is placed under `pages/demo/` to comply with ESLint rules (which restrict `lib/` to only `extraction/**` and `email-extractor.ts`).

**Requirements**:
- Export interface: `DemoFixture { id: string; provider: string; emailText: string; }`
- Export constant: `FIXTURES: DemoFixture[]` containing 10 fixtures
- Each fixture is a multi-line string template literal (backticks)
- Provider distribution:
  - Klarna: 3 fixtures
  - Affirm: 2 fixtures
  - Afterpay: 2 fixtures
  - PayPal Pay-in-4: 1 fixture
  - Zip: 1 fixture
  - Sezzle: 1 fixture

**Risk Coverage** (required for demo):
- At least 2 fixtures with **same due date** (e.g., "October 15, 2025") for COLLISION detection
- At least 1 fixture with **autopay enabled + weekend due date** (e.g., Saturday October 18, 2025) for WEEKEND_AUTOPAY detection

**Fixture Structure** (template for each):
```typescript
{
  id: 'klarna-1',
  provider: 'Klarna',
  emailText: `From: noreply@klarna.com
Subject: Payment Reminder - Due Soon

Hi there,

Your payment of $25.00 USD is due on October 15, 2025.

This is installment 2 of 4.

Autopay is enabled for this payment.

Thank you for using Klarna!`
}
```

**PII Requirements**:
- No real names (use generic greetings like "Hi there")
- No real email addresses (use noreply@provider.com)
- No phone numbers, addresses, or account numbers
- Amounts: $10-$100 range
- Dates: October-December 2025

**Acceptance Criteria**:
- File exists at `frontend/src/pages/demo/fixtures.ts`
- Exports `DemoFixture` interface and `FIXTURES` constant
- `FIXTURES.length === 10`
- All 6 providers represented
- Provider patterns detectable by existing `detectProvider()` from `extraction/providers.ts`
- At least 2 fixtures share a due date (for COLLISION)
- At least 1 fixture has autopay + weekend date (for WEEKEND_AUTOPAY)
- No PII in any fixture
- TypeScript compiles without errors
- ESLint passes (no violations for file location)
- LOC count ≤60

---

## Phase 3.2: Core Implementation

### T002 Create Demo Page Component

**File**: `/home/matt/PROJECTS/PayPlan/frontend/src/pages/Demo.tsx`

**LOC Target**: ~100 LOC

**Description**:
Create the main Demo page component with fixtures display, extraction logic, confidence/risk pills, and **inline ICS generation**. This is a self-contained component with no separate utility files. Uses explicit ISO week calculation (Mon-Sun) in America/New_York timezone.

**Requirements**:

**Imports**:
```typescript
import { useState } from 'react';
import { FIXTURES, type DemoFixture } from './demo/fixtures';
import { extractItemsFromEmails, type Item } from '@/lib/email-extractor';
import { DateTime } from 'luxon';
import { createEvents, type EventAttributes } from 'ics';
```

**State**:
```typescript
const [results, setResults] = useState<{ items: Item[]; risks: Risk[] } | null>(null);
const [loading, setLoading] = useState(false);
```

**Core Functions** (inline in component):

1. **handleRunDemo()** (~15 LOC):
   - Loop through `FIXTURES`, call `extractItemsFromEmails(fixture.emailText, 'America/New_York')`
   - Aggregate all items
   - Call `detectRisks(items)` for COLLISION and WEEKEND_AUTOPAY
   - Update state

2. **detectRisks(items)** (~15 LOC):
   - COLLISION: Group by `due_date`, flag dates with >1 item
   - WEEKEND_AUTOPAY: Check if `autopay === true` and day is Sat/Sun (use `DateTime.fromISO(due_date).weekday` where 6=Sat, 7=Sun)
   - Return `Risk[]` array
   - **EXCLUDE** CASH_CRUNCH (not implemented for demo)

3. **generateIcs(items, risks)** (~25 LOC):
   - **Filter items to "This Week" using explicit ISO week calculation**:
     ```typescript
     const now = DateTime.now().setZone('America/New_York');
     const monday = now.minus({ days: now.weekday - 1 }).startOf('day'); // weekday: 1=Mon..7=Sun
     const sunday = monday.plus({ days: 6 }).endOf('day');
     const inThisWeek = (isoDate: string) => {
       const dt = DateTime.fromISO(isoDate, { zone: 'America/New_York' });
       return dt >= monday && dt <= sunday;
     };
     const thisWeekItems = items.filter(item => inThisWeek(item.due_date));
     ```
   - Map `thisWeekItems` to `EventAttributes[]`:
     - `title`: `${provider} Payment - $${amount}`
     - `start`: `[year, month, day]`
     - `duration`: `{ hours: 1 }`
     - `description`: `Installment ${installment_no}\n` + risk annotations if applicable
   - Call `createEvents(events)`
   - Return `Blob` with type `text/calendar`

4. **handleDownloadIcs()** (~10 LOC):
   - Generate blob via `generateIcs(results.items, results.risks)`
   - Create download link with `URL.createObjectURL(blob)`
   - Trigger download as `payplan-demo.ics`
   - Clean up URL

**UI Layout** (~35 LOC):
```tsx
<div className="container mx-auto p-4 space-y-4 max-w-4xl">
  <h1 className="text-3xl font-bold">PayPlan Demo</h1>
  <p className="text-muted-foreground">
    Try our BNPL email extraction with 10 synthetic samples
  </p>

  {/* Fixtures Preview */}
  <div className="grid gap-2">
    {FIXTURES.map(f => (
      <details key={f.id}>
        <summary>{f.provider} - {f.id}</summary>
        <pre className="text-xs bg-muted p-2 rounded">
          {f.emailText.slice(0, 200)}...
        </pre>
      </details>
    ))}
  </div>

  {/* Run Demo Button */}
  <button onClick={handleRunDemo} disabled={loading}>
    {loading ? 'Processing...' : 'Run Demo'}
  </button>

  {/* Results */}
  {results && (
    <>
      {/* Normalized Schedule Table */}
      <table>
        <thead>...</thead>
        <tbody>
          {results.items.map(item => (
            <tr key={item.id}>
              <td>{item.provider}</td>
              <td>{item.due_date}</td>
              <td>${item.amount}</td>
              <td>
                {/* Confidence Pill */}
                <span className={getConfidenceClass(item.confidence)}>
                  {getConfidenceLabel(item.confidence)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Risk Pills */}
      {results.risks.length > 0 && (
        <div className="flex gap-2">
          {results.risks.map((r, i) => (
            <span key={i} className={getRiskClass(r.type)}>
              {r.message}
            </span>
          ))}
        </div>
      )}

      {/* Download ICS Button */}
      <button onClick={handleDownloadIcs}>
        Download .ics Calendar
      </button>
    </>
  )}
</div>
```

**Helper Functions** (inline, ~10 LOC total):
```typescript
function getConfidenceLabel(conf: number): string {
  return conf >= 0.80 ? 'High' : conf >= 0.50 ? 'Medium' : 'Low';
}

function getConfidenceClass(conf: number): string {
  return conf >= 0.80 ? 'bg-green-500' : conf >= 0.50 ? 'bg-yellow-500' : 'bg-orange-500';
}

function getRiskClass(type: string): string {
  return type === 'COLLISION' ? 'bg-red-500' : 'bg-yellow-500';
}
```

**Type Definitions** (inline):
```typescript
interface Risk {
  type: 'COLLISION' | 'WEEKEND_AUTOPAY';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedItems?: string[];
}
```

**Acceptance Criteria**:
- File exists at `frontend/src/pages/Demo.tsx`
- Default export React component
- Imports fixtures from `./demo/fixtures` (relative path, ESLint compliant)
- "Run Demo" button triggers extraction for all 10 fixtures
- Results display normalized schedule with confidence pills (High/Med/Low)
- Risk pills show COLLISION and WEEKEND_AUTOPAY when detected
- "Download .ics" generates valid ICS file
- **ICS events filtered using explicit ISO week calculation** (Monday to Sunday, America/New_York)
- Risk annotations appear in ICS event descriptions
- No network requests (all processing client-side)
- No separate utility files (all logic inline)
- TypeScript compiles without errors
- ESLint passes (import paths compliant)
- LOC count ≤100

---

### T003 Add Demo Route

**File**: `/home/matt/PROJECTS/PayPlan/frontend/src/App.tsx` (MODIFY)

**LOC Target**: +2 LOC

**Description**:
Add the `/demo` route to the existing React Router configuration.

**Changes**:
```typescript
import Demo from './pages/Demo';

// Inside <Routes>:
<Route path="/demo" element={<Demo />} />
```

**Acceptance Criteria**:
- `App.tsx` imports `Demo` component
- Route `<Route path="/demo" element={<Demo />} />` added to `<Routes>`
- Navigating to `http://localhost:5173/demo` renders Demo page
- Existing routes (/, /docs, /privacy) still work
- TypeScript compiles without errors
- ESLint passes
- LOC change exactly +2 (1 import, 1 route)

---

## Phase 3.3: Tests

### T004 Unit Test: Fixtures Module

**File**: `/home/matt/PROJECTS/PayPlan/frontend/tests/unit/demo/fixtures.test.ts`

**LOC Target**: ~40 LOC

**Description**:
Create unit tests for the fixtures module to verify structure, provider coverage, and PII-free content.

**Test Cases**:
1. **Returns 10 fixtures**: `expect(FIXTURES).toHaveLength(10)`
2. **All fixtures have valid structure**: Each has `id`, `provider`, `emailText` fields (all non-empty strings)
3. **Provider coverage**: Verify at least 5 different providers in `FIXTURES.map(f => f.provider)`
4. **IDs are unique**: No duplicate IDs
5. **No PII detected**: Scan all `emailText` for patterns:
   - No `@gmail.com`, `@yahoo.com`, `@hotmail.com` (real personal emails)
   - No phone patterns like `\d{3}-\d{3}-\d{4}`
   - No common first names (use simple regex or keyword list)
6. **Risk coverage**: At least 2 fixtures share a `due_date` substring (e.g., "October 15")
7. **Weekend autopay coverage**: At least 1 fixture contains both "autopay" AND a weekend date

**Imports**:
```typescript
import { FIXTURES } from '@/pages/demo/fixtures';
// or: import { FIXTURES } from '../../../src/pages/demo/fixtures';
```

**Acceptance Criteria**:
- File exists at `frontend/tests/unit/demo/fixtures.test.ts`
- All 7 test cases implemented using Vitest
- Tests import `FIXTURES` from correct path (ESLint compliant)
- All tests pass
- No false positives on PII detection (noreply@provider.com is OK)
- LOC count ≤40

---

### T005 Integration Test: Demo Page Flow

**File**: `/home/matt/PROJECTS/PayPlan/frontend/tests/integration/demo-page.test.ts`

**LOC Target**: ~60 LOC

**Description**:
Create end-to-end integration test for the complete demo page user flow.

**Test Cases**:
1. **Page renders**: Render `<Demo />`, verify no errors
2. **Fixtures displayed**: Verify 10 `<details>` elements (one per fixture)
3. **"Run Demo" button exists**: `screen.getByText(/run demo/i)`
4. **Click "Run Demo"**: Simulate click, wait for results
5. **Results table appears**: Verify `<table>` with 10 rows
6. **Confidence pills displayed**: Verify presence of "High", "Medium", or "Low" text in results
7. **Risk pills appear**: If COLLISION/WEEKEND_AUTOPAY detected, verify pill elements
8. **"Download .ics" button enabled**: Verify button becomes clickable
9. **Click download**: Simulate click, verify `URL.createObjectURL` called (mock it)
10. **No network requests**: Mock `global.fetch` and verify no calls

**Setup**:
```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Demo from '@/pages/Demo';

// Mock fetch
global.fetch = vi.fn(() => Promise.reject('No network allowed'));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
```

**Acceptance Criteria**:
- File exists at `frontend/tests/integration/demo-page.test.ts`
- All 10 test cases implemented using Vitest + React Testing Library
- Tests render `<Demo />` component directly
- Mock `URL.createObjectURL` to verify ICS download
- Mock `fetch` to ensure no network requests
- All tests pass
- LOC count ≤60

---

## Phase 3.4: Documentation & Verification

### T006 Create Delta Documentation

**File**: `/home/matt/PROJECTS/PayPlan/ops/deltas/0019_demo_mode.md`

**LOC Target**: ~100 LOC (documentation, not counted in code budget)

**Description**:
Create delta documentation following the repository's delta template format.

**Required Sections**:

1. **Header**:
   ```markdown
   # Delta 0019: Demo Mode End-to-End

   **Date:** 2025-10-07
   **Type:** Feature
   **Risk:** Low
   **Rollback:** Single revert (3 files: fixtures.ts, Demo.tsx, App.tsx)
   **Prerequisites:** None
   ```

2. **Summary**:
   - One-paragraph description of the demo feature
   - Emphasize: client-only, no PII, offline-capable, reversible
   - Note: Fixtures placed in `pages/demo/` for ESLint compliance

3. **Changes**:
   - List all 3 code files with LOC counts
   - Note risk scope: COLLISION + WEEKEND_AUTOPAY only (CASH_CRUNCH excluded)
   - Note ISO week calculation: explicit Monday-Sunday window in America/New_York

4. **LOC Budget**:
   ```markdown
   | Component | + | - | Net |
   |-----------|--:|--:|----:|
   | Fixtures (pages/demo/fixtures.ts) | 60 | 0 | +60 |
   | UI (Demo.tsx) | 100 | 0 | +100 |
   | Route (App.tsx) | 2 | 0 | +2 |
   | **Total (code only)** | **162** | **0** | **+162** |
   | Tests (not counted) | ~100 | 0 | +100 |

   **Actual:** +162 LOC (within ≤180 budget) ✓
   ```

5. **Verification**:
   ```bash
   # Dev server
   cd frontend && pnpm dev
   # Open http://localhost:5173/demo

   # Unit tests
   pnpm test -- tests/unit/demo/fixtures.test.ts

   # Integration test
   pnpm test -- tests/integration/demo-page.test.ts

   # Lint (verify ESLint passes with new file locations)
   pnpm lint

   # Spec audit
   cd .. && npm run audit:specs
   ```

6. **Files Modified**:
   ```
   PayPlan/
   ├── frontend/
   │   ├── src/
   │   │   ├── pages/
   │   │   │   ├── demo/
   │   │   │   │   └── fixtures.ts        # NEW (+60 LOC)
   │   │   │   └── Demo.tsx               # NEW (+100 LOC)
   │   │   └── App.tsx                    # MODIFIED (+2 LOC)
   │   └── tests/
   │       ├── unit/demo/
   │       │   └── fixtures.test.ts       # NEW (+40 LOC, not counted)
   │       └── integration/
   │           └── demo-page.test.ts      # NEW (+60 LOC, not counted)
   └── ops/deltas/
       └── 0019_demo_mode.md              # NEW (this file)
   ```

7. **Notes**:
   - Risk scope: COLLISION (duplicate due dates) and WEEKEND_AUTOPAY (autopay on Sat/Sun) only
   - CASH_CRUNCH not implemented (requires payday data, out of scope for demo)
   - "This Week" uses explicit ISO week calculation: Monday (weekday=1) to Sunday (weekday=7) in America/New_York
   - All processing client-side; zero network requests
   - Single revert restores pre-demo state
   - **ESLint Compliance**: Fixtures moved to `pages/demo/` to comply with import rules (only `extraction/**` and `email-extractor.ts` allowed under `lib/`)

**Acceptance Criteria**:
- File exists at `ops/deltas/0019_demo_mode.md`
- Follows delta template format (reference: `ops/deltas/0017_ci_guards_refinements.md`)
- All verification commands documented
- LOC table shows actual counts from implementation
- Risk scope explicitly documented
- ISO week calculation documented (explicit Monday-Sunday window)
- ESLint compliance note included
- Rollback strategy clear (single git revert of 1 commit touching 3 files)

---

### T007 Manual Verification

**Reference**: `/home/matt/PROJECTS/PayPlan/specs/006-0019-demo-mode/quickstart.md`

**Description**:
Execute manual verification steps from quickstart.md to validate the demo feature.

**Steps**:
1. Start dev server: `cd frontend && pnpm dev`
2. Navigate to `http://localhost:5173/demo`
3. Verify page loads, 10 fixture previews visible
4. Open DevTools → Network tab, clear requests
5. Click "Run Demo"
6. Verify:
   - Results table appears with 10 rows
   - Confidence pills present (High/Med/Low)
   - Risk pills appear (COLLISION and/or WEEKEND_AUTOPAY if detected)
   - No network requests in DevTools
7. Click "Download .ics"
8. Verify file downloads as `payplan-demo.ics`
9. Open ICS file in text editor, verify:
   - Valid ICS format (`BEGIN:VCALENDAR` ... `END:VCALENDAR`)
   - Events only for "This Week" (ISO week Monday-Sunday)
   - Risk annotations in event descriptions
   - Timezone: `TZID:America/New_York`
10. Run automated tests: `pnpm test`
11. Run linter (verify ESLint passes): `pnpm lint`
12. Run spec audit: `cd .. && npm run audit:specs`

**Acceptance Criteria**:
- All manual steps pass
- All automated tests pass (unit + integration)
- **Linter reports zero errors** (ESLint passes with new file locations)
- Spec audit reports no broken file references
- No network requests detected (DevTools confirms)
- ICS file valid and importable to calendar apps (optional: test with Google Calendar)
- Demo works offline (disconnect network, reload page, run demo)
- **ISO week filtering works correctly** (only Mon-Sun events in current week)

---

### T008 LOC Budget Check & Optimization

**Description**:
Verify final LOC counts and optimize if budget exceeded.

**Steps**:
1. Count LOC for code files only (exclude tests and docs):
   ```bash
   cd /home/matt/PROJECTS/PayPlan/frontend/src

   # Count new files
   wc -l pages/demo/fixtures.ts
   wc -l pages/Demo.tsx

   # Count modified lines in App.tsx
   git diff main frontend/src/App.tsx | grep -E '^\+' | grep -v '^\+\+\+' | wc -l
   ```

2. Sum total LOC

3. If total > 180:
   - **Optimize Demo.tsx**:
     - Remove unnecessary comments
     - Inline simple helper functions
     - Simplify UI (remove verbose className chains)
     - Combine related state variables
   - **Optimize fixtures.ts**:
     - Shorten fixture email text (minimum viable for extraction)
     - Remove extra blank lines

4. Re-count after optimization

5. Document final counts in delta doc (T006)

**Target**:
- fixtures.ts: ≤60 LOC
- Demo.tsx: ≤100 LOC
- App.tsx: +2 LOC
- **Total: ≤162 LOC** (well under 180 budget)

**Acceptance Criteria**:
- Final LOC count ≤180 (target ≤162)
- All code files counted (excluding tests/docs)
- LOC table in delta doc updated with actual counts
- If optimizations made, all tests still pass
- TypeScript still compiles without errors
- ESLint still passes
- No functionality lost during optimization

---

## Dependencies

```text
T001 (fixtures.ts in pages/demo/)
  ↓
T002 (Demo.tsx) ← depends on T001
  ↓
T003 (App.tsx) ← depends on T002
  ↓
T004 (fixtures test) ← depends on T001 (tests will fail until T001 complete)
T005 (integration test) ← depends on T001, T002, T003 (tests will fail until all complete)
  ↓
T006 (delta doc) ← depends on T001-T005 complete
  ↓
T007 (manual verification) ← depends on T001-T006 complete
  ↓
T008 (LOC check) ← depends on all complete
```

**Execution Order**:
1. T001 (fixtures in pages/demo/)
2. T002 (Demo.tsx with corrected imports)
3. T003 (route)
4. T004, T005 (tests in parallel - will fail until implementation done)
5. T006 (delta doc)
6. T007 (manual verification)
7. T008 (LOC check & optimization if needed)

---

## Parallel Execution

**Not Applicable** - Tasks are sequential due to dependencies. However, T004 and T005 can be written in parallel after T001-T003 are complete (they will fail initially, which is expected for TDD).

---

## Budget Summary

### Code Files (excludes tests and docs)
- `frontend/src/pages/demo/fixtures.ts` (NEW) - **ESLint compliant location**
- `frontend/src/pages/Demo.tsx` (NEW)
- `frontend/src/App.tsx` (MODIFIED)
- **Total: 3 files** ✓ (well under ≤4 budget)

### Code LOC Target
| File | LOC |
|------|----:|
| pages/demo/fixtures.ts | 60 |
| pages/Demo.tsx | 100 |
| App.tsx | +2 |
| **Total** | **162** |

**Budget**: ≤180 LOC
**Status**: ✓ Within budget (18 LOC buffer)

### Test Files (not counted in code budget)
- `frontend/tests/unit/demo/fixtures.test.ts` (~40 LOC)
- `frontend/tests/integration/demo-page.test.ts` (~60 LOC)
- **Total: 2 test files, ~100 LOC**

### Documentation (not counted)
- `ops/deltas/0019_demo_mode.md` (~100 LOC)

---

## Risk Scope (Explicit)

**Implemented**:
- ✅ **COLLISION**: Multiple payments on same due date
- ✅ **WEEKEND_AUTOPAY**: Autopay scheduled for Saturday or Sunday

**Not Implemented**:
- ❌ **CASH_CRUNCH**: Requires payday data, out of scope for demo

**"This Week" Definition** (CORRECTED):
- ISO week (Monday-Sunday) in `America/New_York` timezone
- **Explicit calculation**:
  ```typescript
  const now = DateTime.now().setZone('America/New_York');
  const monday = now.minus({ days: now.weekday - 1 }).startOf('day'); // weekday: 1=Mon..7=Sun
  const sunday = monday.plus({ days: 6 }).endOf('day');
  const inThisWeek = (isoDate: string) => {
    const dt = DateTime.fromISO(isoDate, { zone: 'America/New_York' });
    return dt >= monday && dt <= sunday;
  };
  ```
- **NOT** using `startOf('week')/endOf('week')` (which may use locale-specific week starts)

---

## ESLint Compliance (CORRECTED)

**Import Rules**:
- ✅ **Allowed under `lib/`**: Only `extraction/**` or `email-extractor.ts`
- ❌ **Forbidden under `lib/`**: `lib/demo/` violates this rule

**Solution**:
- ✅ **Fixtures moved to**: `pages/demo/fixtures.ts`
- ✅ **Demo page imports**: `./demo/fixtures` (relative path, same directory)
- ✅ **Test imports**: `@/pages/demo/fixtures` or relative path

**Verification**:
- Run `pnpm lint` after implementation
- Verify zero ESLint errors
- Specifically check no "restricted import" errors

---

## Validation Checklist

*GATE: Checked before marking tasks.md complete*

- [x] All user scenarios have tests (T005 covers full flow)
- [x] Code files ≤4 (3 files: fixtures.ts under pages/, Demo.tsx, App.tsx)
- [x] Code LOC ≤180 (target: 162 LOC)
- [x] Tests before implementation (T004-T005 written, expected to fail initially)
- [x] Each task specifies exact file path
- [x] Risk scope explicitly documented
- [x] "This Week" definition uses explicit ISO week calculation (Monday-Sunday)
- [x] Import rules enforced (fixtures moved to pages/ for ESLint compliance)
- [x] Offline requirement validated (no fetch calls)
- [x] Single revert rollback possible
- [x] ESLint compliance verified (fixtures.ts location corrected)

---

## Corrections Applied

### 1. ESLint Compliance Fix
- **Before**: `frontend/src/lib/demo/fixtures.ts`
- **After**: `frontend/src/pages/demo/fixtures.ts`
- **Reason**: ESLint rule restricts `lib/` to only `extraction/**` and `email-extractor.ts`
- **Impact**: All imports updated in Demo.tsx and tests

### 2. ISO Week Calculation Fix
- **Before**: `DateTime.now().startOf('week')` and `.endOf('week')`
- **After**: Explicit calculation using `weekday - 1` for Monday and `+ 6 days` for Sunday
- **Reason**: `startOf('week')` may use locale-specific week starts (e.g., Sunday in US locales)
- **Impact**: Ensures true ISO week (Monday-Sunday) regardless of locale

---

**Status**: ✅ Ready for implementation | **Total Tasks**: 8 | **Code Files**: 3 | **Code LOC**: ~162 | **ESLint Compliant**: ✓ | **ISO Week**: ✓
