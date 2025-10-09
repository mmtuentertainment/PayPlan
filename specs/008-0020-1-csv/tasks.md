# Implementation Tasks: CSV Import Safety & Accessibility Hardening

**Feature**: 0020.1-csv-hardening
**Branch**: 008-0020-1-csv
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)
**QuickStart**: [quickstart.md](./quickstart.md)

---

## Task Execution Order

**TDD Approach**: Write failing tests first (T001–T008), then implement (T009–T012), then document (T013–T014).

**Validation Order** (enforced in implementation):
```
size → rows → delimiter → parse → validate
```

---

## Phase A: Tests First (TDD)

### T001 — Fixtures & Helpers (Tests-Only)

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Create inline test fixtures and helpers for all hardening scenarios (valid CSV, invalid dates, oversize file, too many rows, wrong delimiter, XSS strings, formula prefixes).

**Acceptance Criteria**:
- Fixtures created inline (no new files); reusable across tests
- Generator function for N rows: `generateCSV(rows: number): string`
- Generator function for file exceeding 1MB: `generateOversizeFile(): Blob`
- Fixtures include: valid 5-row CSV, invalid-date row (2025-13-45, 2025-02-30), semicolon-delimited CSV, XSS string (`<script>alert(1)</script>`), formula cells (`=SUM(1)`, `+1`, `-2`, `@cmd`)
- Comments show intended error strings for each fixture
- Test file compiles without errors

**Constitution Gate**: ≤4 files; no new dependencies

**LOC Target**: +10

**Verification**:
```bash
cd frontend
pnpm test -t import-hardening -- --passWithNoTests
# Should succeed (collects tests, not passing yet)
```

---

### T002 — Size Limit (1MB) Error Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing test for file size limit (1,048,576 bytes) with exact error message.

**Acceptance Criteria**:
- Upload file with size 1,048,577 bytes → error exactly `"CSV too large (max 1MB)"`
- Upload file with size 1,048,576 bytes → success (no error)
- Error is single-line (no stack trace visible)
- Error region has `role="alert"` and receives text
- Page remains usable (can upload new file)
- No network calls (fetch spy asserts 0 calls)

**Constitution Gate**: Privacy (zero network); locked error copy

**LOC Target**: +8

**Verification**:
```bash
pnpm test -t "rejects file >1MB"
# Should FAIL (red) pre-implementation
```

---

### T003 — Row Count (1000 Non-Empty) Error Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing test for row count limit (1000 non-empty rows) with exact error message.

**Acceptance Criteria**:
- Upload CSV with 1000 non-empty rows → success
- Upload CSV with 1001 non-empty rows → error exactly `"Too many rows (max 1000)"`
- Empty lines (whitespace-only) are ignored in count
- Blank lines between rows do not count toward limit
- Error is single-line; page remains usable
- No network calls

**Constitution Gate**: Deterministic order (size → rows → delimiter → parse)

**LOC Target**: +8

**Verification**:
```bash
pnpm test -t "rejects CSV with >1000 rows"
# Should FAIL (red) pre-implementation
```

---

### T004 — Delimiter Failure Error Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing test for semicolon-delimited CSV with exact error message (Acceptance Scenario #6).

**Acceptance Criteria**:
- Upload semicolon-delimited CSV → error exactly `"Parse failure: expected comma-delimited CSV"`
- No crash or exception leak to console
- Page remains usable (can upload new file)
- No network calls
- Error region has `role="alert"`

**Constitution Gate**: Simple CSV only (no multi-delimiter support)

**LOC Target**: +8

**Verification**:
```bash
pnpm test -t "rejects semicolon-delimited CSV"
# Should FAIL (red) pre-implementation
```

---

### T005 — Invalid Date Validation Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing tests for real calendar date validation with exact error messages.

**Acceptance Criteria**:
- Upload CSV with `2025-13-45` → error exactly `"Invalid date in row 1: 2025-13-45"`
- Upload CSV with `2025-02-30` → error exactly `"Invalid date in row 1: 2025-02-30"`
- Upload CSV with `2025-04-31` → error exactly `"Invalid date in row 1: 2025-04-31"`
- Regex format check AND calendar validity enforced (both checks)
- Error reports first failing row number
- Valid dates (2024-02-29 leap year, 2025-02-28) pass

**Constitution Gate**: FR-001 exact copy; no new dependencies (use existing date util)

**LOC Target**: +10

**Verification**:
```bash
pnpm test -t "rejects invalid calendar date"
# Should FAIL (red) pre-implementation
```

---

### T006 — Accessibility Contract Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing tests for WCAG 2.2 accessibility affordances (label, alert, caption).

**Acceptance Criteria**:
- File input has `<label htmlFor="csv-file-input">` with text "Choose CSV file" (or similar)
- File input has `id="csv-file-input"` matching label's `htmlFor`
- Error region has `role="alert"` and `aria-live="polite"`
- Results table has `<caption>` element (screen-reader accessible)
- Caption text includes "Payment schedule" or similar descriptive text
- Use `getByLabelText()`, `getByRole('alert')`, `getByRole('table')` queries

**Constitution Gate**: FR-003 (WCAG 2.2 Level A/AA compliance)

**LOC Target**: +8

**Verification**:
```bash
pnpm test -t "accessibility affordances"
# Should FAIL (red) pre-implementation
```

---

### T007 — Button Types & No-Network Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing tests for button `type="button"` and network isolation.

**Acceptance Criteria**:
- All buttons ("Process CSV", "Download .ics") have `type="button"` attribute
- Query all buttons: `screen.getAllByRole('button')`; assert each has `type="button"`
- Network spy (global.fetch mock) asserts 0 calls during: upload → parse → render → download ICS
- Spy setup in `beforeEach`; assertion in test
- Test covers full flow (upload valid CSV → download ICS) with network verification

**Constitution Gate**: Privacy (zero network); FR-003 (prevent accidental form submit)

**LOC Target**: +8

**Verification**:
```bash
pnpm test -t "buttons have type=button"
pnpm test -t "no network calls"
# Both should FAIL (red) pre-implementation
```

---

### T008 — Rendering Safety (XSS & CSV Injection) Test

**Path**: `frontend/tests/integration/import-hardening.test.tsx`

**Objective**: Write failing tests to assert plain-text rendering for `<script>` tags and formula prefixes.

**Acceptance Criteria**:
- Upload CSV with provider `<script>alert('xss')</script>` → renders as literal text (no script execution)
- Upload CSV with provider `=SUM(A1)` → renders as literal text `=SUM(A1)`
- Upload CSV with provider `+1`, `-2`, `@cmd` → all render as literal text
- Use `screen.getByText('<script>alert(\'xss\')</script>')` to verify literal rendering
- No `dangerouslySetInnerHTML` usage (code review check)
- DevTools console shows no errors or script execution

**Constitution Gate**: FR-004 (rendering safety; no formula execution, no XSS)

**LOC Target**: +10

**Verification**:
```bash
pnpm test -t "renders HTML tags as plain text"
pnpm test -t "renders formula prefixes as plain text"
# Both should FAIL (red) pre-implementation
```

---

## Phase B: Implementation (Minimal Diffs)

### T009 — Pre-Parse Guards: Size & Rows

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Implement file size (1MB) and row count (1000 non-empty rows) validation before parsing; use exact locked error copy.

**Acceptance Criteria**:
- Validation order honored: size → rows → delimiter → parse → validate
- Size check: `if (file.size > 1_048_576) setError("CSV too large (max 1MB)")`
- Row count check: split lines, filter non-empty (`line.trim().length > 0`), count ≤ 1000
- Error message exactly: `"Too many rows (max 1000)"` (no variation)
- Single-line errors displayed in `<div role="alert" aria-live="polite">`
- Page remains usable after error (state cleared properly)
- Tests T002, T003 pass

**Constitution Gate**: Deterministic order; locked error copy

**LOC Target**: +12

**Verification**:
```bash
pnpm test -t "rejects file >1MB"
pnpm test -t "rejects CSV with >1000 rows"
# Both should PASS (green)
```

---

### T010 — Delimiter Detection & Parse Error

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Detect semicolon-delimited files or field count mismatch; emit exact error message.

**Acceptance Criteria**:
- Check header for semicolons: `if (header.includes(';'))` → error
- Check field count: `if (header.split(',').length !== 5)` → error
- Error message exactly: `"Parse failure: expected comma-delimited CSV"`
- Keep simple comma split (no new CSV parser library)
- No new dependencies
- Error path leaves page usable; no network calls
- Test T004 passes

**Constitution Gate**: Simple CSV constraint; no new dependencies; privacy

**LOC Target**: +10

**Verification**:
```bash
pnpm test -t "rejects semicolon-delimited CSV"
# Should PASS (green)
```

---

### T011 — Real-Date Validation

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Validate ISO-8601 format AND real calendar validity (use existing date utility; no new deps).

**Acceptance Criteria**:
- First check regex: `/^\d{4}-\d{2}-\d{2}$/` → error "Invalid date format in row X. Expected YYYY-MM-DD"
- Then check calendar validity (use existing luxon DateTime or similar) → error `"Invalid date in row X: {value}"`
- Reject impossible dates: 2025-13-45, 2025-02-30, 2025-04-31
- Accept valid dates: 2024-02-29 (leap year), 2025-02-28
- Message includes row number and exact date value
- No mutation of valid rows; no ICS generation changes
- Test T005 passes

**Constitution Gate**: FR-001; no new dependencies (reuse existing luxon import)

**LOC Target**: +12

**Verification**:
```bash
pnpm test -t "rejects invalid calendar date"
# Should PASS (green)
```

---

### T012 — A11y & Safety Wiring

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Add accessibility affordances (label, alert, caption) and ensure plain-text rendering (no dangerouslySetInnerHTML).

**Acceptance Criteria**:
- Add `<label htmlFor="csv-file-input">Choose CSV file</label>` and `id="csv-file-input"` to file input
- Add `role="alert" aria-live="polite"` to error div
- Add `<caption style={{ position: 'absolute', left: '-10000px' }}>Payment schedule with {results.items.length} payments</caption>` to results table
- Verify all buttons have `type="button"` attribute
- Ensure all user input rendered via JSX text nodes (e.g., `{item.provider}`), no `dangerouslySetInnerHTML`
- Tests T006, T007, T008 pass

**Constitution Gate**: FR-003 (WCAG 2.2), FR-004 (rendering safety), FR-005 (privacy)

**LOC Target**: +14

**Verification**:
```bash
pnpm test -t "accessibility affordances"
pnpm test -t "buttons have type=button"
pnpm test -t "renders HTML tags as plain text"
pnpm test -t "renders formula prefixes as plain text"
# All should PASS (green)
```

---

## Phase C: Docs & Delta

### T013 — Delta Doc

**Path**: `ops/deltas/0020_1_csv_hardening.md`

**Objective**: Summarize scope, exact error strings, validation order, a11y, privacy, LOC accounting, rollback procedure.

**Acceptance Criteria**:
- Summary: client-only CSV Import hardening (size/row limits, real-date validation, delimiter detection, a11y, rendering safety)
- Locked error message catalog (E-001 to E-012) from data-model.md
- Validation order documented: size → rows → delimiter → parse → validate
- Accessibility affordances listed: `<label>`, `role="alert" aria-live="polite"`, `<caption>`
- Privacy guarantee: zero network calls (verified by test spy)
- LOC table: Import.tsx (+48 LOC), import-hardening.test.tsx (+70 LOC), delta doc (+25 LOC docs) = 118 total code LOC
- Rollback command: `git revert <merge-commit-sha>`
- Verification block: `pnpm test -t import-hardening`, `pnpm lint`, DevTools Network tab check
- Constitution checklist: ≤4 files ✅, ≤140 LOC ✅, reversible ✅, zero network ✅, no new deps ✅

**Constitution Gate**: Reversible; docs-only delta record

**LOC Target**: +25 (docs, excluded from code LOC budget)

**Verification**:
```bash
cat ops/deltas/0020_1_csv_hardening.md
# Should include all sections above
```

---

### T014 — LOC & Gates Verification

**Path**: N/A (verification task)

**Objective**: Prove final budgets and constitutional gates pass.

**Acceptance Criteria**:
- Code LOC (Import.tsx diffs + test diffs) ≤ 140 (target ≤ 90)
  - Count: `git diff main --stat frontend/src/pages/Import.tsx frontend/tests/integration/import-hardening.test.tsx`
  - Expected: ~48 (Import.tsx) + ~70 (tests) = 118 LOC ✅
- Files touched ≤ 4: Import.tsx, import-hardening.test.tsx, delta doc (3 files) ✅
- All new tests pass: `pnpm test -t import-hardening` → 12 tests pass
- No existing tests regress: `pnpm test` → all suites pass
- Zero network verified: Network tab empty during manual smoke test + test spy passes
- ESLint passes: `pnpm lint` → 0 errors
- Build succeeds: `pnpm build` → TypeScript compiles

**Constitution Gate**: Final Constitution pass (all constraints verified)

**LOC Target**: 0 (verification only)

**Verification**:
```bash
# LOC count
git diff main --stat frontend/src/pages/Import.tsx frontend/tests/integration/import-hardening.test.tsx | grep -E "changed"

# All tests pass
pnpm test

# Lint
pnpm lint

# Build
pnpm build

# Expected output: All green ✅
```

---

## Task Dependency Graph

```
T001 (fixtures)
  ↓
T002, T003, T004, T005, T006, T007, T008 (all failing tests)
  ↓
T009 (size/rows implementation) → makes T002, T003 pass
  ↓
T010 (delimiter detection) → makes T004 pass
  ↓
T011 (real-date validation) → makes T005 pass
  ↓
T012 (a11y & safety wiring) → makes T006, T007, T008 pass
  ↓
T013 (delta doc)
  ↓
T014 (verification)
```

---

## Budget Summary

| Category | Target | Cap | Actual (Estimated) | Status |
|----------|--------|-----|-------------------|--------|
| Files touched | 3 | 4 | 3 | ✅ |
| Code LOC | ≤90 | ≤140 | 118 | ✅ |
| Import.tsx LOC | ~40 | — | ~48 | ✅ |
| Test LOC | ~50 | — | ~70 | ✅ |
| Docs LOC | — | (excluded) | 25 | N/A |
| New dependencies | 0 | 0 | 0 | ✅ |

---

## Constitution Checklist (Final Gates)

- [x] **Files**: ≤4 touched (Import.tsx, import-hardening.test.tsx, delta doc)
- [x] **LOC**: Code ≤140 (target ≤90); actual ~118
- [x] **Reversible**: Single `git revert` command documented
- [x] **Privacy**: Zero network (test spy + manual verification)
- [x] **Dependencies**: 0 new (reuse luxon, ics, react)
- [x] **ESLint**: Path guards respected (no imports from restricted paths)
- [x] **Risks**: Unchanged (COLLISION, WEEKEND_AUTOPAY only)
- [x] **ICS**: Behavior preserved (no VALARM, This Week filter, America/New_York)
- [x] **A11y**: WCAG 2.2 Level A/AA (label, alert, caption)
- [x] **Safety**: Plain-text rendering (no dangerouslySetInnerHTML, formula execution, or XSS)

---

## Execution Notes

**TDD Order**: T001 → T002–T008 (all red) → T009–T012 (turn green) → T013–T014 (document & verify)

**Error Copy**: All error messages locked in data-model.md; implementation MUST use exact strings.

**Validation Order**: Enforce deterministic precedence in T009–T011 (size → rows → delimiter → parse → validate).

**No Implementation Details in Spec**: This tasks.md references implementation (paths, code, tests) but spec.md remains WHAT-only.

---

**Ready for implementation.**

---
