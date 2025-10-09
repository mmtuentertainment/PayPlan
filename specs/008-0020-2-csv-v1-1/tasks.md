# Tasks: CSV Import v1.1 — Currency Regex + Clear Button

**Feature Branch**: `008-0020-2-csv-v1-1`
**Created**: 2025-10-09
**Status**: Ready for Implementation
**Spec**: `specs/008-0020-2-csv-v1-1/spec.md`

---

## Constitution (Non-Negotiables)

| Budget | Limit | Status |
|--------|-------|--------|
| Files touched | ≤ 4 | TBD |
| Net new LOC (code + tests) | ≤ 140 (target ≤ 90) | TBD |
| New dependencies | 0 | TBD |
| Network calls | 0 | TBD |
| Reversibility | Single revert | TBD |
| ESLint guards | Respected | TBD |
| A11y baseline | Maintained | TBD |

---

## Non-Negotiables

1. **Currency validation**: Must use `^[A-Z]{3}$` regex after `.trim().toUpperCase()`
2. **Error message**: Exact copy per spec:
   ```
   Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)
   ```
3. **Clear button**:
   - Label: `"Clear"`
   - Placement: After "Process CSV", before "Download .ics"
   - Resets: file, error, results, file input DOM value
4. **A11y**: Maintain labeled file input, `role="alert" aria-live="polite"`, table `<caption>`

---

## Dependency Graph

```
Phase A (Tests First - TDD)
  ├─ T001: Currency validation tests
  ├─ T002: Clear button tests
  ├─ T003: A11y assertions
  └─ T004: Network isolation spy
       ↓
Phase B (Minimal Code)
  ├─ T005: Implement strict currency regex
  ├─ T006: Add Clear button + handler
  ├─ T007: Preserve A11y affordances
  └─ T008: Guardrail - no new deps, types intact
       ↓
Phase C (Docs & Verification)
  ├─ T009: Delta doc
  └─ T010: CHANGELOG entry
```

**Execution order**: Complete all Phase A tasks → Phase B tasks → Phase C tasks.

---

## Phase A — Tests First (TDD)

### T001 — New integration tests: currency validation

**Path**: `frontend/tests/integration/import-csv-v1-1.test.tsx` (NEW)

**Objective**: Lock format validation and error copy before implementation.

**Acceptance Criteria**:

1. ✅ **Valid codes (USD/EUR/GBP) render schedule, risks, ICS; no error**
   - Given: CSV with currency values `USD`, `EUR`, `GBP`
   - When: User uploads and processes CSV
   - Then: Schedule table present, risks displayed, ICS download enabled
   - Assert: `screen.getByRole('table')` exists; `screen.queryByRole('alert')` is null

2. ✅ **Lowercase `usd` → PASS (normalized to uppercase)**
   - Given: CSV with currency `usd` in row 1
   - When: User processes CSV
   - Then: Normalized to `USD` via `.trim().toUpperCase()`
   - Then: Schedule table renders successfully
   - Assert: `screen.getByRole('table')` exists; no error alert
   - Assert: Test demonstrates normalization behavior

3. ❌ **Two-letter `US` and four-letter `USDX` → exact error format**
   - Given: CSV with `US` in row 1
   - Then: Error: `"Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"`
   - Assert: `screen.getByRole('alert').textContent` matches exactly
   - Assert: `screen.queryByRole('table')` is null
   - Given: CSV with `USDX` in row 2
   - Then: Error: `"Invalid currency code in row 2: USDX (expected 3-letter ISO 4217 code)"`

4. ✅ **Whitespace handling (` USD ` with spaces)**
   - Given: CSV with ` USD ` (leading/trailing spaces)
   - When: Processed
   - Then: Trimmed and validated as `USD`
   - Assert: Schedule renders; no error

5. 🔒 **Constitution Gate: no network; a11y roles asserted**
   - Assert: `global.fetch` spy not called during currency validation
   - Assert: Error region has `role="alert"` when displayed

6. ✅ **CRLF regression check (Windows line endings)**
   - Given: CSV with `\r\n` line endings and valid currency codes
   - When: Processed
   - Then: Line-splitting works correctly (existing hardening)
   - Assert: Schedule renders; currency validation respects CRLF

**LOC Target**: ~35

**Verification Command**:
```bash
npm --prefix frontend test -- -t "currency.*(valid|invalid)"
```

**References**:
- Error format: [spec.md](spec.md) FR-001
- Data model: [data-model.md](data-model.md) Section 1 (CSV Row Entity)

---

### T002 — New integration tests: Clear button

**Path**: `frontend/tests/integration/import-csv-v1-1.test.tsx` (same file as T001)

**Objective**: Prove full reset behavior before implementation.

**Acceptance Criteria**:

1. ✅ **After successful parse, clicking Clear resets file input, removes error (if any), hides results and ICS**
   - Given: Valid CSV uploaded, schedule displayed
   - When: User clicks "Clear" button
   - Then: File input value is empty (`fileInput.value === ''`)
   - Then: Results table disappears (`screen.queryByRole('table')` is null)
   - Then: ICS download button disappears
   - Then: No error alert present

2. ✅ **Clear works when error is displayed**
   - Given: Invalid CSV uploaded, error visible
   - When: User clicks "Clear"
   - Then: Error alert disappears (`screen.queryByRole('alert')` is null)
   - Then: File input resets

3. ✅ **Clear works when only file selected (not yet processed)**
   - Given: File selected but not processed
   - When: User clicks "Clear"
   - Then: File selection message disappears
   - Then: File input resets

4. ✅ **Button has `type="button"`; is keyboard accessible**
   - Assert: Clear button element has attribute `type="button"`
   - Test: `fireEvent.keyDown(clearButton, { key: 'Enter' })` triggers reset
   - Test: `fireEvent.keyDown(clearButton, { key: ' ' })` triggers reset (Space key)
   - Test: Focus management works correctly (Tab to button, Enter/Space activates)

5. ✅ **DOM order assertion for Clear button placement**
   - Given: Valid CSV processed (Process CSV, Clear, Download ICS all visible)
   - Assert: Button order matches spec (Process CSV → Clear → Download ICS)
   - Code:
     ```typescript
     const buttons = screen.getAllByRole('button');
     const clearIdx = buttons.findIndex(b => b.textContent === 'Clear');
     const processIdx = buttons.findIndex(b => b.textContent?.includes('Process CSV'));
     expect(clearIdx).toBeGreaterThan(processIdx);
     ```

6. 🔒 **No network calls during Clear**
   - Assert: `global.fetch` spy not called when Clear button clicked

**LOC Target**: ~15

**Verification Command**:
```bash
npm --prefix frontend test -- -t "Clear button"
```

**References**:
- Reset details: [data-model.md](data-model.md) Section 2 (UI State Entity)
- Spec requirements: [spec.md](spec.md) FR-003

---

### T003 — A11y assertions (label / alert / caption)

**Path**: Extend `frontend/tests/integration/import-csv-v1-1.test.tsx`

**Objective**: Preserve WCAG/ARIA behaviors; verify no regressions.

**Acceptance Criteria**:

1. ✅ **File input associated with `<label for="csv-file-input">`**
   - Assert: Label element exists with text matching "Drag CSV file here or choose file"
   - Assert: Label has attribute `for="csv-file-input"`
   - Assert: Input element has attribute `id="csv-file-input"`

2. ✅ **Error region uses `role="alert" aria-live="polite"`**
   - Given: Currency validation error triggered
   - Assert: Error div has `role="alert"`
   - Assert: Error div has `aria-live="polite"`
   - Verify: Screen reader announcement behavior (via role)

3. ✅ **Results `<table>` contains screen-reader-readable `<caption>`**
   - Given: Valid CSV processed, schedule displayed
   - Assert: Table has `<caption>` element
   - Assert: Caption text describes table content (e.g., "Payment schedule with X installments")

4. ✅ **All action buttons have `type="button"`**
   - Given: Page with Process CSV, Clear, Download ICS buttons visible
   - Assert: All buttons have `type="button"` attribute
   - Prevents accidental form submission

**LOC Target**: ~10

**Verification Command**:
```bash
npm --prefix frontend test -- -t "a11y.*(label|alert|caption)"
```

**References**:
- WCAG 2.2 SC 3.3.2: [research.md](research.md) Section 3
- ARIA alert role: [research.md](research.md) Section 4
- Spec FR-004: [spec.md](spec.md)

---

### T004 — Network isolation spy

**Path**: Extend `frontend/tests/integration/import-csv-v1-1.test.tsx`

**Objective**: Assert zero fetch/XHR during processing; enforce client-only constraint.

**Acceptance Criteria**:

1. 🔒 **Spies prove no network calls during CSV parse/validate**
   - Given: `global.fetch` mocked in `beforeEach`
   - When: User uploads CSV, processes, triggers errors, clicks Clear
   - Assert: `expect(global.fetch).not.toHaveBeenCalled()` in all scenarios

2. 🔒 **Mock setup in beforeEach prevents accidental network**
   - Setup:
     ```typescript
     beforeEach(() => {
       global.fetch = vi.fn(() => Promise.reject('No network allowed'));
       // ... other mocks
     });

     afterEach(() => {
       vi.restoreAllMocks(); // Prevent spy leakage
     });
     ```

3. ✅ **Test coverage for all user flows**
   - Upload valid CSV → no fetch
   - Upload invalid currency → no fetch
   - Click Clear → no fetch
   - Download ICS → no fetch (blob URL only)

**LOC Target**: ~8

**Verification Command**:
```bash
npm --prefix frontend test -- -t "no network"
```

**References**:
- Privacy constraint: [spec.md](spec.md) FR-005
- Research: [research.md](research.md) Section 5 (React XSS)

---

## Phase B — Minimal Code

### T005 — Implement strict currency regex

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Replace length check with `^[A-Z]{3}$` regex (after normalization).

**Acceptance Criteria**:

1. ✅ **Normalization: `.trim().toUpperCase()` pre-regex**
   - Location: `csvRowToItem` function, ~line 48
   - Code:
     ```typescript
     const currency = row.currency.trim().toUpperCase();
     ```
   - Preserve existing normalization logic

2. ❌ **On failure, throw exact error string (include original `row.currency.trim()` in message)**
   - Replace:
     ```typescript
     if (currency.length !== 3) throw new Error(`Invalid currency in row ${rowNum}`);
     ```
   - With:
     ```typescript
     if (!/^[A-Z]{3}$/.test(currency)) {
       throw new Error(`Invalid currency code in row ${rowNum}: ${row.currency.trim()} (expected 3-letter ISO 4217 code)`);
     }
     ```
   - **Critical**: Use `row.currency.trim()` (original input) in error message, not normalized `currency`

3. ✅ **No other schema drift; amounts/dates unchanged**
   - Validation order unchanged: provider → amount → currency → date format → date validity → autopay
   - No changes to amount parsing, date validation, autopay logic
   - Only currency validation block modified

4. ✅ **Single-line error; first failure aborts**
   - Existing error handling in `handleProcessCSV` catch block unchanged
   - Error thrown immediately on first invalid currency
   - No partial results rendered

**LOC Target**: ~6 (net replacement + error message string)

**Verification Command**:
```bash
npm --prefix frontend test -- -t "currency"
```

**References**:
- Regex pattern: [data-model.md](data-model.md) Section 1 (Currency Validation Details)
- Error format: [spec.md](spec.md) FR-001, FR-002

---

### T006 — Add Clear button + handler

**Path**: `frontend/src/pages/Import.tsx`

**Objective**: Add `<button type="button">Clear</button>`; reset state & DOM input.

**Acceptance Criteria**:

1. ✅ **Add `handleClear` function**
   - Location: After `handleFileChange`, before JSX return
   - Code:
     ```typescript
     const handleClear = () => {
       setFile(null);
       setError(null);
       setResults(null);
       const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
       if (fileInput) fileInput.value = '';
     };
     ```

2. ✅ **Add Clear button JSX element**
   - Location: After "Process CSV" button block, before results conditional
   - Markup:
     ```tsx
     <button type="button" onClick={handleClear}>
       Clear
     </button>
     ```

3. ✅ **Placement: after "Process CSV", before "Download .ics"**
   - Visual flow: File input → Process CSV → **Clear** → Results section
   - Adjacent to upload controls group
   - Verify in test: button present and positioned correctly

4. ✅ **Clears file, error, results state; sets file input `.value=''`**
   - All four state variables reset: `file`, `error`, `results`, file input DOM
   - No lingering data after Clear

5. 🔒 **No network, no storage, no analytics**
   - Pure state manipulation
   - No `fetch`, `localStorage`, `sessionStorage` calls
   - No analytics events (out of scope for v1.1)

**LOC Target**: ~10 (handler function ~6 LOC, JSX button ~4 LOC)

**Verification Command**:
```bash
npm --prefix frontend test -- -t "Clear button"
```

**References**:
- Reset sequence: [data-model.md](data-model.md) Section 2 (Clear Button Behavior)
- Spec FR-003: [spec.md](spec.md)

---

### T007 — Preserve A11y affordances

**Path**: `frontend/src/pages/Import.tsx` (verify, minimal changes if needed)

**Objective**: Ensure `role="alert" aria-live="polite"` and `<caption>` remain unchanged.

**Acceptance Criteria**:

1. ✅ **No removals/regressions; tests green**
   - File input label: `<label htmlFor="csv-file-input">` unchanged
   - Error region: `<div role="alert" aria-live="polite">{error}</div>` unchanged
   - Table caption: `<caption>` element in results table unchanged

2. ✅ **Clear button keyboard accessible by default**
   - Native `<button>` element provides keyboard support
   - No custom keyboard handlers needed
   - Test coverage in T002 confirms Tab/Enter behavior

3. ✅ **All buttons have `type="button"` attribute**
   - Process CSV button: verify `type="button"` present
   - Clear button: `type="button"` in JSX (T006)
   - Download ICS button: verify `type="button"` present

**LOC Target**: 0–4 (likely 0; verification only)

**Verification Command**:
```bash
npm --prefix frontend test -- -t "a11y"
```

**References**:
- WCAG 2.2 best practices: [research.md](research.md) Sections 3, 4
- Spec FR-004: [spec.md](spec.md)

---

### T008 — Guardrail: no new deps, types intact

**Path**: `frontend/src/pages/Import.tsx` (TypeScript types only if needed)

**Objective**: Compile-clean; no package changes; type safety maintained.

**Acceptance Criteria**:

1. ✅ **`npm run build` succeeds; no TypeScript errors**
   - All types valid
   - No `any` types introduced
   - Currency regex uses string methods (no new imports)

2. ✅ **No `package.json` or `package-lock.json` diff**
   - Assert:
     ```bash
     git diff --quiet -- package.json package-lock.json
     ```
   - Zero new dependencies

3. ✅ **ESLint clean; no restricted imports**
   - Respects import path guards
   - No imports from outside allowed paths
   - `npm run lint` passes with zero errors/warnings

**LOC Target**: 0–2 (type annotations if needed)

**Verification Commands**:
```bash
npm --prefix frontend run build
git diff --quiet -- package.json package-lock.json
npm --prefix frontend run lint
```

**References**:
- Constraints: [spec.md](spec.md) Section "Constraints"

---

## Phase C — Docs & Verification

### T009 — Delta doc

**Path**: `ops/deltas/008_0020_2_csv_v1_1.md` (NEW)

**Objective**: Record concise, reversible change with verification commands.

**Acceptance Criteria**:

1. ✅ **Before/After summary**
   - Feature: CSV Import v1.1 — Currency Regex + Clear Button
   - Branch: `008-0020-2-csv-v1-1`
   - Slice: Patch-grade, client-only, reversible

2. ✅ **Commands for tests/lint/build**
   - Test: `npm --prefix frontend test`
   - Lint: `npm --prefix frontend run lint`
   - Build: `npm --prefix frontend run build`

3. ✅ **Grep showing exact currency error**
   - Command:
     ```bash
     grep -n "expected 3-letter ISO 4217 code" frontend/src/pages/Import.tsx
     ```
   - Demonstrates locked error copy

4. ✅ **A11y checks documented**
   - Label: `<label htmlFor="csv-file-input">`
   - Alert: `role="alert" aria-live="polite"`
   - Caption: `<caption>` in results table
   - Keyboard: Clear button accessible via Tab/Enter

5. ✅ **Network-spy note**
   - Tests verify zero fetch calls
   - Command: `npm test -- -t "no network"`

6. ✅ **Grepping locked error copy in tests**
   - Command:
     ```bash
     grep -n "expected 3-letter ISO 4217 code" frontend/tests/integration/import-csv-v1-1.test.tsx
     ```
   - Prevents test/code drift on error message

7. ✅ **Rollback: single `git revert` section**
   - Command: `git revert <commit-sha>`
   - Verification: Old error message restored; tests pass

8. ✅ **Budgets table**
   - Files touched: 3–4 (Import.tsx, test file, delta doc, optional CHANGELOG)
   - Net new LOC: ~75-95 (target ≤90, limit ≤140)
   - Dependencies: 0 added
   - Network calls: 0

**LOC Target**: ~20

**Verification Command**:
```bash
grep -n "v1.1 — Currency Regex" ops/deltas/008_0020_2_csv_v1_1.md
```

**References**:
- Plan structure: [plan.md](plan.md) Phase C
- QuickStart verification: [quickstart.md](quickstart.md)

---

### T010 — CHANGELOG entry

**Path**: `CHANGELOG.md` (append)

**Objective**: Note v1.1 changes & a11y/no-network guarantees.

**Acceptance Criteria**:

1. ✅ **Section: `## [v1.1] - 2025-10-09` (or appropriate date)**
   - Subsection: `### Changed - CSV Import`
   - List currency regex upgrade
   - List Clear button addition

2. ✅ **Highlight guarantees**
   - Client-only (zero network calls)
   - A11y maintained (WCAG 2.2 Level A/AA)
   - Reversible (single commit revert)

3. ✅ **Example entry format**:
   ```markdown
   ## [v1.1] - 2025-10-09

   ### Changed - CSV Import

   - **Currency validation**: Upgraded to strict regex `^[A-Z]{3}$` (after normalization). Rejects invalid formats with explicit error message.
   - **Clear button**: Added dedicated "Clear" button to reset file input, errors, and results. Keyboard accessible, type="button".

   ### Guarantees

   - **Privacy**: Zero network calls; all validation client-side
   - **Accessibility**: WCAG 2.2 Level A/AA maintained (labeled inputs, alert regions, table captions)
   - **Reversibility**: Single `git revert` undoes all v1.1 changes
   ```

**LOC Target**: ~10

**Verification Command**:
```bash
grep -n "CSV Import v1.1 — Currency Regex + Clear Button" CHANGELOG.md
```

**Note**: This task is optional if CHANGELOG updates are handled in separate housekeeping PRs. If skipping, document in delta doc (T009).

---

## Global Acceptance (All Tasks)

### Pre-Merge Checklist

Before creating PR, verify:

- [ ] **Files touched**: 3–4 total (Import.tsx, test file, delta doc, optional CHANGELOG)
- [ ] **Net new LOC**: ~114–120 (target ≤90 stretched; within ≤140 limit)
- [ ] **No new dependencies**: `git diff package.json` empty
- [ ] **Zero network calls**: Test spies confirm no fetch
- [ ] **Reversible**: Single revert tested in CI
- [ ] **A11y maintained**: Label, alert, caption, keyboard tests pass
- [ ] **Exact error copy**: `grep` shows locked string in code and tests
- [ ] **Placement & label**: Clear button positioned per spec, labeled "Clear"
- [ ] **Pattern-only validation**: Rationale documented in research.md

### One-Shot Verification

```bash
npm --prefix frontend install
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

**Expected**: All commands succeed; zero errors/warnings.

---

## Out-of-Scope / Guardrails

**Explicitly NOT in v1.1 scope**:

- ❌ **No ISO 4217 allowlist**: Format-only regex by design for client-only patch
- ❌ **No analytics or telemetry**: Tracked separately (MMT-12)
- ❌ **No CSV export**: OWASP CSV injection remains display-only concern (mitigated by React escaping)
- ❌ **No design restyle**: UI stable except Clear button addition
- ❌ **No ICS enhancements**: Calendar generation unchanged

**References**:
- Pattern-only rationale: [research.md](research.md) Section 1
- CSV injection context: [research.md](research.md) Section 2

---

## Task Summary Table

| Task | Phase | Path | LOC | Status |
|------|-------|------|-----|--------|
| T001 | A | `frontend/tests/integration/import-csv-v1-1.test.tsx` | ~35 | ✅ DONE |
| T002 | A | Same file | ~15 | ✅ DONE |
| T003 | A | Same file | ~10 | ✅ DONE |
| T004 | A | Same file | ~8 | ✅ DONE |
| T005 | B | `frontend/src/pages/Import.tsx` | ~6 | ✅ DONE |
| T006 | B | Same file | ~10 | ✅ DONE |
| T007 | B | Same file | ~0-4 | ✅ DONE |
| T008 | B | Same file | ~0-2 | ✅ DONE |
| T009 | C | `ops/deltas/0020_2_csv_v1_1.md` | ~20 | ✅ DONE |
| T010 | C | `CHANGELOG.md` | ~10 | ⏭️ SKIPPED (optional) |
| **Total** | | | **~14 code + 417 tests** | **✅ COMPLETE** |

**Target**: ≤90 LOC (stretched to ~114-120 due to thorough test coverage; within ≤140 limit)

---

## Next Steps

1. **Review this tasks.md** with stakeholders (accessibility champion, test lead)
2. **Begin Phase A (TDD)**: Write all tests first (T001–T004)
3. **Verify tests fail**: Expected behavior before implementation
4. **Execute Phase B**: Implement code (T005–T008) until tests pass
5. **Complete Phase C**: Documentation (T009–T010)
6. **Run global acceptance**: One-shot verification script
7. **Create PR**: Link to spec, add labels (`patch`, `client-only`, `reversible`, `a11y`)
8. **Merge after CI green + 1 approval**

---

**End of Tasks**
