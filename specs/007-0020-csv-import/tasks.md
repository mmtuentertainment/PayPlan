# Tasks: CSV Import MVP

**Feature**: 007-0020-csv-import
**Input**: Design documents from `/specs/007-0020-csv-import/`
**Prerequisites**: plan.md, research.md, data-model.md, quickstart.md

## Overview

**Goal**: Add client-only CSV import at `/import` for BNPL payment schedule visualization with risk detection (COLLISION, WEEKEND_AUTOPAY) and "This Week" ICS export.

**Budgets**: ≤8 files changed (code), ≤180 LOC code-only (target 150 LOC)

**Constitutional Constraints**: No network calls; imports only from `frontend/src/lib/extraction/**` and `email-extractor.ts`; simple CSV format (no quotes/commas-in-fields); no VALARM in ICS; ISO week Mon-Sun America/New_York

**Rollback**: Single revert; zero runtime API changes; feature is independent and reversible

---

## Execution Flow (main)

```text
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript/React/Vite, existing extraction system
   → Structure: web app (frontend-only changes)
2. Load optional design documents ✓
   → data-model.md: CSVRow, NormalizedItem (reused), ScheduleResult (reused)
   → quickstart.md: 6 manual test scenarios
   → research.md: CSV parsing (simple split), ICS (no VALARM), ISO week
3. Generate tasks by category:
   → Tests: Integration tests with happy/negative paths [P]
   → Core: Import.tsx (CSV parse + UI + ICS), App.tsx route
   → Polish: Delta doc, quickstart alignment, LOC budget verification
4. Apply task rules:
   → Tests before implementation (TDD)
   → Different files = [P] for parallel
   → Same file = sequential
5. Number tasks sequentially (T001-T012) ✓
6. Validate task completeness ✓
7. Return: SUCCESS (tasks ready for execution)
```

---

## Phase A: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE B

**CRITICAL**: These tests MUST be written and MUST FAIL before ANY implementation

### T001 [P] Integration test - Happy path + This Week filter + risks + no network

**File**: `frontend/tests/integration/import-page.test.tsx`

**Description**: Create integration test for successful CSV import flow with all core features

**Acceptance Criteria**:
- Test uploads valid CSV (5 rows) and verifies results table displays
- Test verifies confidence pills show "high" for all CSV-derived rows
- Test verifies COLLISION risk appears for rows with same due date
- Test verifies WEEKEND_AUTOPAY risk appears for weekend autopay payments
- Test verifies "Download .ics" button is enabled after processing
- Test downloads ICS and verifies only "This Week" events included (ISO Mon-Sun)
- Test asserts NO network requests made during processing (mock/spy on fetch)
- Test must FAIL initially (Import.tsx doesn't exist yet)

**LOC Target**: 0 (test file, not counted in code budget)

**Constitution Check**: Satisfies "offline-only; zero network" and "ISO week Mon-Sun America/New_York" requirements

**Verification**:
```bash
pnpm -C frontend test import-page.test.tsx
# Expected: Test fails with "cannot find module 'pages/Import'" or similar
```

---

### T002 [P] Integration test - Negative cases (missing field, invalid date, empty CSV)

**File**: `frontend/tests/integration/import-page.test.tsx` (same file as T001, extends it)

**Description**: Add negative test cases for error handling

**Acceptance Criteria**:
- Test case 1: CSV with missing `currency` field shows error "Invalid currency in row N"
- Test case 2: CSV with invalid date format (MM/DD/YYYY) shows error "Invalid date format in row N"
- Test case 3: CSV with header only (no data rows) shows error "No data rows found"
- All error messages are single-line (no stack traces visible)
- Page remains usable after error (can upload new file without reload)
- Tests must FAIL initially

**LOC Target**: 0 (test file, not counted in code budget)

**Constitution Check**: Satisfies "Errors: single-line, no stack traces; page remains usable"

**Verification**:
```bash
pnpm -C frontend test import-page.test.tsx
# Expected: All negative tests fail (Import.tsx error handling not implemented)
```

---

### T003 CSV test fixtures (inline strings)

**File**: `frontend/tests/integration/import-page.test.tsx` (same file, add fixture strings)

**Description**: Define CSV test fixtures as inline strings to avoid extra files

**Acceptance Criteria**:
- Valid CSV fixture: 5 rows, includes 2 with same due date (COLLISION), 1 weekend autopay
- Missing field fixture: 2 rows, row 2 has empty currency value
- Invalid date fixture: 1 row with MM/DD/YYYY format
- Empty CSV fixture: header row only
- Mixed weeks fixture: 3 rows spanning last/current/next ISO week
- Fixtures are const strings in test file (not separate .csv files to save file count)

**LOC Target**: 0 (test file, not counted in code budget)

**Constitution Check**: Satisfies "≤8 files changed" budget by using inline fixtures

**Verification**:
```bash
# No separate command; fixtures used in T001-T002 tests
grep -c "const.*CSV.*=" frontend/tests/integration/import-page.test.tsx
# Expected: 5 (five fixture constants)
```

---

## Phase B: Core Implementation (ONLY after tests are failing)

### T004 Import.tsx skeleton - UI (dropzone + chooser + helper text)

**File**: `frontend/src/pages/Import.tsx` (NEW)

**Description**: Create Import page component with file upload UI and helper text

**Acceptance Criteria**:
- Page renders with heading "Import CSV"
- Drag-and-drop zone with visual feedback on drag-over
- "Choose CSV" file input (accept=".csv,text/csv")
- Helper text showing sample CSV format: `provider,amount,currency,dueISO,autopay`
- Helper text notes: "Simple comma-delimited format, no quotes or commas within values"
- "Process CSV" button (disabled until file selected)
- Component state: file, error, results, processing
- No parsing logic yet (just UI structure)

**LOC Target**: 35 LOC

**Constitution Check**: Satisfies "UX: drag/drop and chooser; sample CSV helper text on page"

**Verification**:
```bash
pnpm -C frontend dev
# Manual: Navigate to /import (will 404 until T009), then check via direct component render test
pnpm -C frontend test import-page.test.tsx
# Expected: Tests now find component, fail on parsing/results logic
```

---

### T005 CSV parser (simple split + header validation)

**File**: `frontend/src/pages/Import.tsx` (MODIFY - add parser function)

**Description**: Implement inline CSV parser with header validation

**Acceptance Criteria**:
- Function `parseCSV(text: string): CSVRow[]` added within Import.tsx
- Splits by `\n` for lines, `split(',')` for values (no RFC 4180 quote handling)
- Validates header row exactly matches: `provider,amount,currency,dueISO,autopay`
- Returns array of CSVRow objects with string values
- Throws error if header mismatch: "Invalid CSV headers"
- Throws error if any row has wrong field count: "Invalid row N: expected 5 fields"
- Does NOT validate field values yet (that's T006)

**LOC Target**: 15 LOC

**Constitution Check**: Satisfies "CSV format MVP: comma-delimited, header row, no quoted fields"

**Verification**:
```bash
pnpm -C frontend test import-page.test.tsx
# Expected: Header validation tests pass, value validation tests still fail
```

---

### T006 CSV → NormalizedItem converter (per data-model)

**File**: `frontend/src/pages/Import.tsx` (MODIFY - add converter function)

**Description**: Convert validated CSV rows to NormalizedItem format

**Acceptance Criteria**:
- Function `csvRowToNormalizedItem(row: CSVRow): NormalizedItem`
- Validates `amount` parses to positive number, throws "Invalid amount in row N"
- Validates `dueISO` matches YYYY-MM-DD format, throws "Invalid date format in row N"
- Validates `autopay` is "true" or "false" (case-insensitive), throws "Invalid autopay value in row N"
- Validates `provider` is non-empty, throws "Missing provider in row N"
- Validates `currency` is 3-letter code, throws "Invalid currency in row N"
- Returns NormalizedItem with: provider (trimmed), amount (number), currency (uppercase), due_date, autopay (boolean), installment_no=1, late_fee=0
- First validation error stops processing (no partial results)

**LOC Target**: 20 LOC

**Constitution Check**: Satisfies data-model.md CSVRow → NormalizedItem conversion with validation

**Verification**:
```bash
pnpm -C frontend test import-page.test.tsx
# Expected: Negative test cases (missing field, invalid date) now pass
```

---

### T007 Orchestrator wiring + results table with confidence/risk pills

**File**: `frontend/src/pages/Import.tsx` (MODIFY - add orchestrator call and results display)

**Description**: Wire CSV data to extraction orchestrator and render results

**Acceptance Criteria**:
- Import `extractItemsFromEmails` from `frontend/src/lib/email-extractor.ts` (or equivalent)
- Convert NormalizedItems to synthetic email strings OR pass directly if orchestrator supports
- Call orchestrator, capture ScheduleResult[] output
- Render results table with columns: Provider, Amount, Currency, Due Date, Autopay
- Display confidence pill for each row (use existing pill component or inline badge)
- Display risk pills (COLLISION, WEEKEND_AUTOPAY) for rows with detected risks
- No CASH_CRUNCH detection (out of scope)
- "Download .ics" button enabled when results present
- Respect import path rules: only from `frontend/src/lib/extraction/**` and `email-extractor.ts`

**LOC Target**: 35 LOC

**Constitution Check**: Satisfies "Imports: only from frontend/src/lib/extraction/** and email-extractor.ts" and "Risks: COLLISION + WEEKEND_AUTOPAY only"

**Verification**:
```bash
pnpm -C frontend lint
# Expected: No import path violations
pnpm -C frontend test import-page.test.tsx
# Expected: Happy path test passes, ICS download test still fails
```

---

### T008 ICS generation (ISO week filter, no VALARM, risk annotations)

**File**: `frontend/src/pages/Import.tsx` (MODIFY - add ICS generation function)

**Description**: Generate ICS calendar file filtered to "This Week" with risk annotations

**Acceptance Criteria**:
- Import `createEvents` from `ics` library (already in dependencies)
- Import `DateTime` from `luxon` for timezone handling
- Function `getISOWeekBounds(now: DateTime): [DateTime, DateTime]` with explicit Monday/Sunday calculation (NOT `startOf('week')`)
- Function `generateICS(items: ScheduleResult[]): string`
- Filter items to current ISO week (Mon-Sun) in America/New_York timezone
- For each item, create event with:
  - `title`: "{provider} ${amount} {currency}" (e.g., "Klarna $25.00 USD")
  - `start`: due_date as all-day event
  - `description`: "Payment: {provider} {amount} {currency}\nDue: {due_date}\nAutopay: {autopay}\n\nRisks:\n{risk annotations}" (risks on separate lines)
  - NO `alarms`/`VALARM` component (explicitly excluded)
- No explicit TZID header (match 0019 pattern)
- "Download .ics" button triggers file download with generated content
- Filename: `payment-schedule.ics`

**LOC Target**: 30 LOC

**Constitution Check**: Satisfies "ISO week Mon–Sun America/New_York (explicit math)" and "ICS: no VALARM and no explicit TZID header"

**Verification**:
```bash
pnpm -C frontend test import-page.test.tsx
# Expected: All tests pass (happy path + This Week filter + ICS download)
cat downloaded-file.ics | grep -c "VALARM"
# Expected: 0 (no VALARM components)
```

---

## Phase C: Integration & Documentation

### T009 /import route in App.tsx

**File**: `frontend/src/App.tsx` (MODIFY - add route)

**Description**: Add routing for /import page

**Acceptance Criteria**:
- Import Import component from `frontend/src/pages/Import.tsx`
- Add route: `<Route path="/import" element={<Import />} />`
- No other changes to App.tsx
- Exactly +2 LOC (import + route)

**LOC Target**: 2 LOC

**Constitution Check**: Satisfies "≤8 files changed" and "≤180 LOC" budgets

**Verification**:
```bash
pnpm -C frontend dev
# Manual: Navigate to http://localhost:5173/import → page loads
git diff frontend/src/App.tsx | grep '^+' | wc -l
# Expected: 2 (two added lines)
```

---

### T010 Delta document (scope, verify, rollback, LOC table)

**File**: `ops/deltas/0020_csv_import_mvp.md` (NEW)

**Description**: Create operational delta document for feature tracking

**Acceptance Criteria**:
- Section: Scope (1-2 sentences: CSV import at /import, client-only, no API changes)
- Section: Verification Commands:
  - `pnpm -C frontend lint`
  - `pnpm -C frontend test`
  - `pnpm -C frontend dev` → manual /import test
- Section: Rollback (single revert command, no production impact note)
- Section: LOC Table:
  ```
  | File | LOC Added | LOC Removed | Net |
  |------|-----------|-------------|-----|
  | Import.tsx | ~135 | 0 | +135 |
  | App.tsx | 2 | 0 | +2 |
  | Total Code | ~137 | 0 | +137 |
  ```
- Section: Files Changed (list: Import.tsx, App.tsx, import-page.test.tsx, this delta doc)

**LOC Target**: 0 (documentation, not counted in code budget)

**Constitution Check**: Satisfies "Reversible with single revert" and "≤8 files changed" tracking

**Verification**:
```bash
cat ops/deltas/0020_csv_import_mvp.md
# Manual: Review for completeness
```

---

### T011 Quickstart scenario checklist in delta

**File**: `ops/deltas/0020_csv_import_mvp.md` (MODIFY - add manual test checklist)

**Description**: Add quickstart manual test scenarios as checklist

**Acceptance Criteria**:
- Section: "Manual Test Scenarios (from quickstart.md)"
- Checklist with 6 scenarios:
  1. [ ] Happy path: Valid CSV → results table → ICS download → verify "This Week" events
  2. [ ] Invalid CSV (missing field): Error message, page usable
  3. [ ] Invalid date format: Error message displayed
  4. [ ] Empty CSV: Error message displayed
  5. [ ] This Week filtering: Mixed weeks CSV → only current week in ICS
  6. [ ] Drag-and-drop: Works equivalently to file chooser
- Note: "See specs/007-0020-csv-import/quickstart.md for detailed steps"

**LOC Target**: 0 (documentation, not counted in code budget)

**Constitution Check**: Satisfies quickstart.md alignment requirement

**Verification**:
```bash
grep -c "^\s*\- \[ \]" ops/deltas/0020_csv_import_mvp.md
# Expected: 6 (six checklist items)
```

---

### T012 LOC budget gate (compute final count, trim notes if >180)

**File**: Multiple (verification task, no file changes)

**Description**: Verify final code LOC is within budget

**Acceptance Criteria**:
- Count code LOC (excluding blank lines, comments, tests):
  ```bash
  cat frontend/src/pages/Import.tsx | sed '/^\s*$/d' | sed '/^\s*\/\//d' | sed '/^\s*\/\*/d' | sed '/^\s*\*/d' | wc -l
  ```
- Add App.tsx LOC change (+2)
- Total must be ≤180 (target ≤150)
- If >150 but ≤180: Note in delta doc "Within buffer range"
- If >180: Document where to trim (suggestions: reduce helper text, simplify error messages, inline small functions)
- Update LOC table in delta doc with actual counts

**LOC Target**: 0 (verification task)

**Constitution Check**: Satisfies "≤180 LOC code-only (target 150)" budget

**Verification**:
```bash
# Run LOC count command from acceptance criteria
# Verify total ≤180
cat ops/deltas/0020_csv_import_mvp.md | grep "Total Code"
# Expected: Shows actual LOC count with Net ≤180
```

---

## Task Rollup Table

| Task | File(s) | LOC Target | Constitution Rule Satisfied |
|------|---------|------------|----------------------------|
| T001 | import-page.test.tsx | 0 (test) | Offline-only, ISO week Mon-Sun, no network |
| T002 | import-page.test.tsx | 0 (test) | Single-line errors, page remains usable |
| T003 | import-page.test.tsx | 0 (test) | ≤8 files budget (inline fixtures) |
| T004 | Import.tsx | 35 | Drag/drop + chooser + helper text UX |
| T005 | Import.tsx | 15 | CSV format MVP: comma-delimited, no quotes |
| T006 | Import.tsx | 20 | Data-model CSVRow → NormalizedItem validation |
| T007 | Import.tsx | 35 | Import path rules, COLLISION + WEEKEND_AUTOPAY only |
| T008 | Import.tsx | 30 | ISO week explicit math, no VALARM, risk annotations |
| T009 | App.tsx | 2 | ≤8 files, ≤180 LOC budgets |
| T010 | 0020_csv_import_mvp.md | 0 (doc) | Reversible with single revert tracking |
| T011 | 0020_csv_import_mvp.md | 0 (doc) | Quickstart alignment requirement |
| T012 | (verification) | 0 | ≤180 LOC budget gate check |
| **TOTAL** | **4 code files** | **137 LOC** | **All constitutional constraints** |

**Code Files Changed**: 2 (Import.tsx NEW, App.tsx MODIFY)
**Test Files Changed**: 1 (import-page.test.tsx NEW)
**Doc Files Changed**: 1 (0020_csv_import_mvp.md NEW)
**Total Files**: 4 (well within ≤8 budget)

---

## Dependencies

**Phase A (Tests)**: T001, T002, T003 can run in parallel [P] (all same file, but independent test cases)

**Phase B (Implementation)**: Sequential within Import.tsx
- T004 → T005 → T006 → T007 → T008 (same file, build up functionality)

**Phase C (Integration)**: T009 independent, T010-T012 independent
- T009 can run parallel with T010-T011 [P] (different files)
- T012 runs last (verification gate)

**Critical Path**: Tests (T001-T003) MUST complete and FAIL before starting T004

---

## Parallel Execution Examples

**Phase A - All tests together** (must fail before Phase B):
```bash
# Write all test cases in one session
# T001: Happy path test
# T002: Negative test cases
# T003: Fixture strings
pnpm -C frontend test import-page.test.tsx
# Expected: All fail (Import.tsx doesn't exist)
```

**Phase B - Sequential** (same file):
```bash
# Must be done in order T004 → T005 → T006 → T007 → T008
# Each builds on previous in Import.tsx
```

**Phase C - Partial parallel**:
```bash
# T009 and T010 can run together (different files):
# Terminal 1: Add route to App.tsx
# Terminal 2: Create delta doc 0020_csv_import_mvp.md
# Then T011 (modify delta doc)
# Finally T012 (verify LOC budget)
```

---

## Notes

- **No [P] markers in Phase B**: All tasks modify same file (Import.tsx), must be sequential
- **TDD enforced**: Phase A must complete with FAILING tests before Phase B starts
- **Import path rules**: ESLint will catch violations in T007 verification
- **LOC tracking**: Tests don't count toward 180 LOC budget; only source files
- **Rollback safety**: Single revert of feature branch removes all changes cleanly

---

## Validation Checklist

- [x] All test scenarios have corresponding tests (T001-T003)
- [x] All entities have implementation tasks (CSVRow/NormalizedItem in T005-T006)
- [x] All tests come before implementation (Phase A before Phase B)
- [x] Parallel tasks truly independent (T001-T003 same file but different tests; T009-T010 different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (Phase B is sequential)
- [x] Constitutional constraints integrated into task acceptance criteria
- [x] LOC budget tracked (137 target, ≤180 hard cap)

---

**Tasks Ready**: 2025-10-08
**Next**: Execute Phase A (T001-T003) to establish failing tests
