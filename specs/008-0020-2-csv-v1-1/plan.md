# Implementation Plan: CSV Import v1.1 — Currency Regex + Clear Button

**Feature Branch**: `008-0020-2-csv-v1-1`
**Created**: 2025-10-09
**Status**: Planning (Ready for /tasks)
**Spec**: `specs/008-0020-2-csv-v1-1/spec.md`

---

## Constitution (Enforcement Gates)

| Budget | Limit | Enforcement |
|--------|-------|-------------|
| Files touched | ≤ 4 | Count at PR; reject if exceeded |
| Net new LOC (code + tests) | ≤ 140 (target ≤ 90) | Count at PR; warn if >90, reject if >140 |
| New dependencies | 0 | Check package.json diff; reject if changed |
| Network calls | 0 | Test spy on `fetch`; fail if called |
| Reversibility | Single revert | Validate with `git revert HEAD` in CI |
| ESLint guards | Respected | CI lint must pass |
| A11y baseline | Maintained/improved | Test for label, alert, caption presence |

---

## Phase Structure

```
Phase A (Tests First)
  ├─ Task A1: Add integration tests for currency validation
  ├─ Task A2: Add integration tests for Clear button
  └─ Task A3: Extend existing tests for a11y verification
       ↓
Phase B (Minimal Code)
  ├─ Task B1: Implement strict currency regex validation
  └─ Task B2: Implement Clear button with state reset
       ↓
Phase C (Delta Doc)
  └─ Task C1: Document changes in ops/deltas/ with verification commands
```

---

## Phase A: Tests First (TDD)

### Objective

Add comprehensive test coverage **before** code changes. Tests will fail initially, then pass after Phase B implementation.

### Task A1: Integration Tests — Currency Validation

**File**: `frontend/tests/integration/import-csv-v1-1.test.tsx` (NEW)

**Test cases** (5-8 bullet acceptance criteria):

1. ✅ **Valid currency codes pass**
   - Given: CSV with `USD`, `EUR`, `GBP` currency values
   - When: User uploads and processes CSV
   - Then: Schedule renders, risks display, ICS download available
   - Assert: `screen.getByRole('table')` is present; no error alert

2. ❌ **Lowercase currency code rejected**
   - Given: CSV with `usd` in row 1
   - When: User uploads and processes CSV
   - Then: Error displays: `"Invalid currency code in row 1: usd (expected 3-letter ISO 4217 code)"`
   - Assert: `screen.getByRole('alert')` contains exact error text
   - Assert: No table rendered (`screen.queryByRole('table')` is null)

3. ❌ **Two-letter currency code rejected**
   - Given: CSV with `US` in row 2
   - When: User uploads and processes CSV
   - Then: Error displays: `"Invalid currency code in row 2: US (expected 3-letter ISO 4217 code)"`
   - Assert: Exact error match; no partial results

4. ❌ **Four-letter currency code rejected**
   - Given: CSV with `USDX` in row 1
   - When: User uploads and processes CSV
   - Then: Error displays: `"Invalid currency code in row 1: USDX (expected 3-letter ISO 4217 code)"`

5. ❌ **Numeric/special characters rejected**
   - Given: CSV with `US1`, `U$D`, `12` in different rows
   - When: User uploads and processes CSV (first error wins)
   - Then: Error for first invalid row displays
   - Assert: Single-line error; no stacking

6. ✅ **Whitespace trimmed correctly**
   - Given: CSV with ` USD ` (spaces)
   - When: User uploads and processes CSV
   - Then: Validation passes after trim
   - Assert: Schedule renders successfully

7. 🔒 **No network calls during validation**
   - Given: Any currency validation scenario
   - When: Upload and process CSV
   - Then: `global.fetch` spy not called
   - Assert: `expect(global.fetch).not.toHaveBeenCalled()`

**Constitution Gate (Task A1)**:
- Net new LOC: ~35-40 (test cases only)
- Files: +1 (new test file)
- Privacy: Verify fetch spy in beforeEach

---

### Task A2: Integration Tests — Clear Button

**File**: Same as A1 (`frontend/tests/integration/import-csv-v1-1.test.tsx`)

**Test cases** (5-8 bullet acceptance criteria):

1. ✅ **Clear resets file selection**
   - Given: User has selected a CSV file
   - When: User clicks Clear button
   - Then: File input value is empty (`fileInput.value === ''`)
   - Then: "Selected: filename.csv" message disappears
   - Assert: `screen.queryByText(/Selected:/)` is null

2. ✅ **Clear removes error message**
   - Given: User uploaded invalid CSV (error displayed)
   - When: User clicks Clear
   - Then: Error alert disappears
   - Assert: `screen.queryByRole('alert')` is null

3. ✅ **Clear removes results table**
   - Given: User uploaded valid CSV (schedule displayed)
   - When: User clicks Clear
   - Then: Results table disappears
   - Assert: `screen.queryByRole('table')` is null

4. ✅ **Clear disables ICS download**
   - Given: Valid CSV uploaded, ICS download button present
   - When: User clicks Clear
   - Then: ICS download button disappears
   - Assert: `screen.queryByText(/download.*ics/i)` is null

5. ✅ **Clear button is type="button"**
   - Given: Page loaded
   - When: Inspect Clear button
   - Then: Has `type="button"` attribute
   - Assert: `clearButton.getAttribute('type') === 'button'`

6. ✅ **Clear button is keyboard accessible**
   - Given: Page loaded
   - When: Tab to Clear button and press Enter/Space
   - Then: Clear action executes (state resets)
   - Assert: Use `fireEvent.keyDown` with Enter/Space keys

7. 🔒 **No network calls on Clear**
   - Given: Any Clear scenario
   - When: Click Clear button
   - Then: `global.fetch` not called
   - Assert: `expect(global.fetch).not.toHaveBeenCalled()`

**Constitution Gate (Task A2)**:
- Net new LOC: ~30-35 (test cases)
- Files: Same file as A1 (no additional count)
- A11y: Verify keyboard navigation

---

### Task A3: Extend Existing Tests — A11y Verification

**File**: `frontend/tests/integration/import-hardening.test.tsx` (EXTEND)

**Test additions** (2-3 bullet criteria):

1. ✅ **File input label association verified**
   - Given: Page loaded
   - When: Check label `for` attribute
   - Then: Matches file input `id` (`csv-file-input`)
   - Assert: `label.getAttribute('for') === 'csv-file-input'`
   - **Note**: Already tested; verify still passes

2. ✅ **Error alert has correct ARIA**
   - Given: Currency validation error
   - When: Check error region attributes
   - Then: Has `role="alert"` and `aria-live="polite"`
   - Assert: Both attributes present
   - **Note**: Extend to cover currency errors specifically

3. ✅ **All buttons have type="button"**
   - Given: Valid file uploaded (Process CSV, Clear, Download ICS visible)
   - When: Query all buttons
   - Then: All have `type="button"` attribute
   - Assert: Loop through buttons; check attribute
   - **Note**: Extend to include Clear button

**Constitution Gate (Task A3)**:
- Net new LOC: ~5-10 (extend existing tests)
- Files: Modify existing test file (no new file)
- A11y: Confirm label, alert, button types

---

## Phase B: Minimal Code Changes

### Objective

Implement currency regex validation and Clear button with minimal code changes. Tests from Phase A should now pass.

### Task B1: Strict Currency Regex Validation

**File**: `frontend/src/pages/Import.tsx` (MODIFY)

**Changes** (5-8 bullet acceptance criteria):

1. ✅ **Replace currency length check with regex**
   - Location: `csvRowToItem` function, line ~48-49
   - Current: `if (currency.length !== 3) throw new Error(...)`
   - New: `if (!/^[A-Z]{3}$/.test(currency)) throw new Error(...)`
   - Net: ~0 LOC (replacement)

2. ✅ **Update error message with exact spec copy**
   - Current: `Invalid currency in row ${rowNum}`
   - New: `Invalid currency code in row ${rowNum}: ${row.currency.trim()} (expected 3-letter ISO 4217 code)`
   - Net: ~0 LOC (string update)

3. ✅ **Preserve `.trim().toUpperCase()` normalization**
   - Keep: `const currency = row.currency.trim().toUpperCase();`
   - Rationale: Accept lowercase input; trim whitespace
   - No LOC change

4. ✅ **Maintain validation order**
   - Order: provider → amount → **currency** → date format → date validity → autopay
   - No reordering; currency check stays at line ~48-49
   - Net: ~0 LOC

5. ✅ **Single-line error behavior unchanged**
   - Throw error immediately on first currency failure
   - No partial results rendered
   - Existing error handling in `handleProcessCSV` catch block
   - Net: ~0 LOC

**Constitution Gate (Task B1)**:
- Net new LOC: ~0-5 (mostly replacements)
- Files: 1 modified (Import.tsx)
- Privacy: No network calls (pure validation)
- Locked copy: Error message matches spec exactly

---

### Task B2: Clear Button with State Reset

**File**: `frontend/src/pages/Import.tsx` (MODIFY)

**Changes** (5-8 bullet acceptance criteria):

1. ✅ **Add Clear button handler function**
   - Function: `handleClear`
   - Actions:
     - `setFile(null)`
     - `setError(null)`
     - `setResults(null)`
     - Reset file input: `document.getElementById('csv-file-input').value = ''`
   - Net: ~8-10 LOC

2. ✅ **Add Clear button JSX element**
   - Location: After "Process CSV" button, before results section
   - Markup:
     ```tsx
     <button type="button" onClick={handleClear}>
       Clear
     </button>
     ```
   - Net: ~3-5 LOC

3. ✅ **Button placement per spec**
   - Visual flow: File input → Process CSV → **Clear** → Results/ICS
   - Adjacent to upload controls group
   - Net: ~0 LOC (placement decision)

4. ✅ **Ensure type="button" attribute**
   - Prevents accidental form submission
   - Explicit in JSX: `type="button"`
   - Net: ~0 LOC (included in markup)

5. ✅ **Keyboard accessible by default**
   - Native `<button>` element
   - No custom keyboard handling needed
   - Net: ~0 LOC

6. ✅ **No network calls**
   - Pure state reset; no async operations
   - No `fetch`, `XMLHttpRequest`, or external calls
   - Net: ~0 LOC

**Constitution Gate (Task B2)**:
- Net new LOC: ~11-15 (handler + JSX)
- Files: Same file as B1 (Import.tsx, still 1 modified)
- A11y: Native button keyboard support
- Privacy: Client-only state manipulation

---

## Phase C: Delta Documentation

### Objective

Document all changes in a delta document with verification commands for QA and rollback instructions.

### Task C1: Create Delta Doc

**File**: `ops/deltas/008_0020_2_csv_v1_1.md` (NEW)

**Contents** (5-8 bullet acceptance criteria):

1. ✅ **Scope summary**
   - Feature: CSV Import v1.1 — Currency Regex + Clear Button
   - Slice: Patch-grade, client-only, reversible
   - Branch: `008-0020-2-csv-v1-1`

2. ✅ **Exact changes table**
   - Files modified: `frontend/src/pages/Import.tsx`, test files
   - Functions changed: `csvRowToItem` (currency regex), `handleClear` (new)
   - JSX changes: Clear button added
   - Error messages: Currency error text updated

3. ✅ **Verification commands**
   - Run tests: `npm --prefix frontend test`
   - Run linter: `npm --prefix frontend run lint`
   - Check no network: grep test output for fetch spy
   - Manual QA: Upload CSVs with valid/invalid currencies, test Clear button

4. ✅ **A11y verification steps**
   - Check file input has label: Inspect `<label for="csv-file-input">`
   - Check error has alert: Inspect `role="alert"` on error div
   - Check table has caption: Inspect `<caption>` in results table
   - Keyboard nav: Tab to Clear button, press Enter

5. ✅ **DevTools network check**
   - Open DevTools → Network tab
   - Upload CSV → verify no XHR/fetch requests
   - Click Clear → verify no XHR/fetch requests

6. ✅ **Rollback command**
   - Single revert: `git revert <commit-sha>`
   - Verification: `npm test` passes; old error message restored

7. ✅ **Budgets table**
   - Files touched: 3 (Import.tsx, 2 test files)
   - Net new LOC: ~60-70 (target ≤90, limit ≤140)
   - Dependencies: 0 added
   - Network calls: 0

**Constitution Gate (Task C1)**:
- Net new LOC: ~15-20 (delta doc)
- Files: +1 (delta doc, not counted in code budget)
- Reversibility: Single revert command documented
- QA: Verification commands provided

---

## Task Dependency Graph

```
      [Spec Approved]
            ↓
    ┌───────┴───────┐
    │ Phase A (TDD) │
    └───────┬───────┘
            │
    ┌───────┼───────┐
    │       │       │
   A1      A2      A3
(Currency)(Clear)(A11y)
    │       │       │
    └───────┼───────┘
            ↓
    ┌───────┴───────┐
    │  Phase B      │
    │  (Code)       │
    └───────┬───────┘
            │
    ┌───────┼───────┐
    │       │       │
   B1      B2
(Regex) (Button)
    │       │
    └───────┼───────┘
            ↓
    ┌───────┴───────┐
    │  Phase C      │
    │  (Delta Doc)  │
    └───────┬───────┘
            │
           C1
        (Delta)
            ↓
      [Ready for PR]
```

---

## Quality Gates Summary

### Per-Task Gates

| Task | Files | LOC | Privacy | A11y | Locked Copy | ESLint |
|------|-------|-----|---------|------|-------------|--------|
| A1   | +1    | ~35-40 | ✅ Fetch spy | N/A | N/A | ✅ |
| A2   | 0     | ~30-35 | ✅ Fetch spy | ✅ Keyboard | N/A | ✅ |
| A3   | 0     | ~5-10  | N/A | ✅ Label/alert/button | N/A | ✅ |
| B1   | +1*   | ~0-5   | ✅ Pure fn | N/A | ✅ Exact error | ✅ |
| B2   | 0*    | ~11-15 | ✅ No network | ✅ Native button | N/A | ✅ |
| C1   | +1†   | ~15-20 | N/A | N/A | N/A | N/A |

*Same file modified (Import.tsx counts once)
†Delta doc (not counted in code budget)

### Final Acceptance Gate

Before merging to main:

- [ ] Files touched ≤ 4 (actual: 3 code + 1 delta = 4)
- [ ] Net new LOC ≤ 140 (actual: ~96-125, target ≤90 stretched but acceptable)
- [ ] Zero new dependencies (`git diff package.json` empty)
- [ ] All tests pass (`npm test`)
- [ ] ESLint clean (`npm run lint`)
- [ ] No network calls (test spies confirm)
- [ ] A11y affordances present (label, alert, caption, keyboard nav)
- [ ] Locked error copy matches spec exactly
- [ ] Single revert tested in CI
- [ ] Delta doc complete with verification commands

---

## LOC Budget Breakdown

| Category | Estimate | Justification |
|----------|----------|---------------|
| **Tests** | ~70-85 LOC | A1: 35-40, A2: 30-35, A3: 5-10 |
| **Code** | ~11-20 LOC | B1: 0-5 (replacement), B2: 11-15 (handler + JSX) |
| **Delta Doc** | ~15-20 LOC | C1: Markdown documentation |
| **Total (Code + Tests)** | **~81-105 LOC** | Within target ≤90 (best case) or ≤140 (limit) |

**Risk**: If test fixtures verbose, may approach 140 LOC limit. Mitigation: Reuse existing test helpers; keep cases concise.

---

## Non-Goals (Scope Control)

Explicitly **out of scope** for v1.1:

- ❌ ISO 4217 allowlist validation (pattern-only sufficient)
- ❌ Analytics/instrumentation (tracked in MMT-12)
- ❌ Design restyle or layout changes (except Clear button addition)
- ❌ ICS calendar enhancements (no export logic changes)
- ❌ Server-side currency validation (client-only constraint)

---

## Ready for /tasks? Gate Checklist

- [x] All phases defined (A, B, C)
- [x] All tasks have 5-8 bullet acceptance criteria
- [x] Dependency graph clear
- [x] Constitution gates documented per task
- [x] LOC budget breakdown provided
- [x] Quality gates table complete
- [x] Non-goals explicitly listed
- [x] Delta doc structure defined
- [x] Rollback command specified
- [x] Verification commands provided

**Status**: ✅ **READY FOR /TASKS**

---

**End of Implementation Plan**
