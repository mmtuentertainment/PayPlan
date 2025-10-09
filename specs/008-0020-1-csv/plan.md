# Implementation Plan: CSV Import Safety & Accessibility Hardening

**Feature**: 0020.1-csv-hardening
**Branch**: 008-0020-1-csv
**Status**: Planning Complete
**Spec**: [spec.md](./spec.md)

---

## 1. Summary

**What will change:**
This patch hardens the existing CSV Import page (`/import`) with six categories of improvements:

1. **File size & row count limits** — reject files >1MB or >1000 non-empty rows before parsing
2. **Real calendar date validation** — verify dates exist (reject 2025-13-45, 2025-02-30)
3. **Delimiter failure handling** — detect non-comma delimiters, emit single-line error
4. **XSS/CSV-injection safety** — treat formula prefixes (=, +, -, @) and HTML tags as plain text
5. **Accessibility affordances** — add `<label>`, `role="alert"`, `<caption>`, `type="button"`
6. **Zero-network enforcement** — add test spy to verify no fetch calls

**User impact:**
- More helpful error messages (exact copy locked)
- Earlier failure for oversized/malformed files (no parse attempt)
- Screen-reader accessible (WCAG 2.1 Level A compliance)
- Safer handling of untrusted CSV content

**Zero runtime side-effects:**
- ICS generation unchanged (no VALARM; This Week filter; America/New_York)
- Risk detection unchanged (COLLISION, WEEKEND_AUTOPAY only)
- No new dependencies
- Client-only; no API/backend changes
- Reversible via single revert

---

## 2. Technical Context

### Current CSV Import Flow (Import.tsx)

1. User selects file via `<input type="file">`
2. On "Process CSV" click: `file.text()` reads content
3. `parseCSV()` validates header, splits rows, checks field count
4. `csvRowToItem()` validates each row (provider, amount, currency, date format, autopay)
5. Risk detection: COLLISION (same due_date), WEEKEND_AUTOPAY (Sat/Sun autopay)
6. Render results table + "Download .ics" button
7. ICS generation: filter This Week (ISO Mon–Sun), create events, download blob

### Current Validation Gaps (addressed by this patch)

- **No file size limit** — 10MB file could freeze UI
- **No row count limit** — 5000 rows could cause OOM
- **Regex-only date check** — accepts impossible dates like 2025-13-45
- **Generic error messages** — "Invalid row 2" doesn't specify what's invalid
- **No delimiter detection** — semicolon CSV fails with cryptic field-count error
- **No XSS/formula guards** — `=SUM(A1)` or `<script>` could render unsafely (React escapes by default, but not explicitly tested)
- **Missing a11y** — no `<label>` for file input, no `role="alert"`, no `<caption>`
- **No network spy** — tests don't explicitly verify zero fetch calls

### Where Validations Will Live

All changes contained in **Import.tsx**:

- **Early validation** (before parseCSV): file.size check, row count check (pre-split)
- **parseCSV()** enhancement: delimiter detection via header/row field-count
- **csvRowToItem()** enhancement: real calendar date validation (DateTime.isValid)
- **Render layer**: add `<label>`, `role="alert"`, `<caption>`, explicit `type="button"`

Tests in **frontend/tests/integration/import-page.test.tsx**:
- New test cases for file size, row count, invalid dates, delimiter failure, XSS, a11y, network spy

Delta doc in **ops/deltas/0020.1_csv_hardening.md**:
- Summarize changes, error messages, rollback command

---

## 3. Constitution Check

| Gate | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| **Files** | ≤4 files touched | ✅ PASS | 3 files: Import.tsx (modify), import-page.test.tsx (modify), 0020.1_csv_hardening.md (add) |
| **LOC** | ≤140 total (target ≤90) | ✅ PLAN-TO-PASS | Estimate: 85 LOC (see budget table below) |
| **Reversible** | Single revert | ✅ PASS | One merge commit; `git revert <commit>` restores prior state |
| **Privacy** | Zero PII, zero network | ✅ PASS | Client-only CSV parse; test spy enforces no fetch calls |
| **Offline** | No API/backend changes | ✅ PASS | All changes in frontend/src/pages/Import.tsx |
| **Dependencies** | No new deps | ✅ PASS | Reuse luxon (already imported for DateTime) |
| **ESLint guards** | Import-path compliance | ✅ PASS | Only imports from @/lib/email-extractor (existing) and luxon (existing) |
| **ICS behavior** | Unchanged | ✅ PASS | No edits to handleDownloadIcs() logic; This Week filter preserved |
| **Risks** | COLLISION, WEEKEND_AUTOPAY only | ✅ PASS | No changes to risk detection logic |

---

## 4. Implementation Phases

### Phase A: Tests-First Deltas (30 LOC)

**Goal**: Add focused integration tests for new guarantees before modifying production code.

**File**: `frontend/tests/integration/import-page.test.tsx` (+30 LOC)

**Test cases to add** (grouped under new `describe` block: "Import Page - 0020.1 Hardening"):

1. **File size limit** — Upload 2MB mock file → error "CSV too large (max 1MB)"
2. **Row count limit** — Upload CSV with 1001 rows → error "Too many rows (max 1000)"
3. **Invalid calendar date** — Upload CSV with "2025-13-45" → error "Invalid date in row 1: 2025-13-45"
4. **Invalid calendar date (leap year)** — Upload CSV with "2025-02-30" → error "Invalid date in row 1: 2025-02-30"
5. **Delimiter failure** — Upload semicolon-delimited CSV → error "Parse failure: expected comma-delimited CSV"
6. **Formula prefix safety** — Upload CSV with provider "=SUM(A1)" → renders as plain text "=SUM(A1)"
7. **HTML tag safety** — Upload CSV with provider "`<script>alert('xss')</script>`" → renders as plain text (no script execution)
8. **Accessibility: label** — Assert file input has associated `<label>` with `htmlFor` attribute
9. **Accessibility: alert region** — Assert error div has `role="alert" aria-live="polite"`
10. **Accessibility: table caption** — Assert results table has `<caption>` with screen-reader text
11. **Button types** — Assert all buttons have `type="button"` (Process CSV, Download .ics)
12. **Network spy** — Assert `fetch` not called during upload/parse (already exists; ensure coverage)

**Acceptance**: All 12 tests fail initially (TDD red phase); will pass after Phase B.

**LOC estimate**: +30 lines (12 compact test cases; leverage existing fixtures)

---

### Phase B: Minimal Import.tsx Edits (50 LOC)

**Goal**: Implement validations, a11y, and error handling with surgical precision.

**File**: `frontend/src/pages/Import.tsx` (+50 LOC)

#### B1: File Size & Row Count Limits (10 LOC)

**Location**: `handleProcessCSV()` — add early validation before `parseCSV()`

**Pseudocode**:
```
if (file.size > 1_048_576) {
  setError("CSV too large (max 1MB)");
  return;
}
const text = await file.text();
const lines = text.trim().split('\n');
const nonEmptyRows = lines.slice(1).filter(line => line.trim().length > 0);
if (nonEmptyRows.length > 1000) {
  setError("Too many rows (max 1000)");
  return;
}
```

**LOC**: +10

---

#### B2: Real Calendar Date Validation (15 LOC)

**Location**: `csvRowToItem()` — replace regex-only check with DateTime.isValid

**Current code**:
```typescript
if (!/^\d{4}-\d{2}-\d{2}$/.test(dueISO)) throw new Error(`Invalid date format in row ${rowNum}. Expected YYYY-MM-DD`);
```

**New code**:
```typescript
const dueISO = row.dueISO.trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(dueISO)) {
  throw new Error(`Invalid date format in row ${rowNum}. Expected YYYY-MM-DD`);
}
const dt = DateTime.fromISO(dueISO, { zone: 'America/New_York' });
if (!dt.isValid) {
  throw new Error(`Invalid date in row ${rowNum}: ${dueISO}`);
}
```

**LOC**: +5 (net: replace 1 line with 6 lines)

---

#### B3: Delimiter Detection (10 LOC)

**Location**: `parseCSV()` — enhance header/row field-count logic

**Current code**:
```typescript
if (lines[0].trim() !== 'provider,amount,currency,dueISO,autopay') {
  throw new Error('Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay');
}
```

**New code**:
```typescript
const header = lines[0].trim();
if (header !== 'provider,amount,currency,dueISO,autopay') {
  // Detect common delimiter mistakes
  if (header.includes(';') || header.split(',').length !== 5) {
    throw new Error('Parse failure: expected comma-delimited CSV');
  }
  throw new Error('Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay');
}
```

**Also update row parsing**:
```typescript
const v = line.split(',');
if (v.length !== 5) {
  throw new Error('Parse failure: expected comma-delimited CSV');
}
```

**LOC**: +10 (net: enhance 2 locations)

---

#### B4: Accessibility Affordances (10 LOC)

**Location**: JSX render section

**Changes**:
1. Wrap file input in `<label htmlFor="csv-file-input">Choose CSV file</label>`
2. Add `id="csv-file-input"` to `<input type="file">`
3. Add `role="alert" aria-live="polite"` to error div
4. Add `<caption className="sr-only">Payment schedule</caption>` to results table
5. Verify all buttons already have `type="button"` (lines 109, 142) — no change needed

**LOC**: +5 (label + id + role + caption)

---

#### B5: XSS/Formula Safety (5 LOC)

**Note**: React already escapes HTML by default. No code changes needed for rendering safety.

**Action**: Add comment in render section to document safety assumption:
```typescript
{/* Note: React escapes HTML/formula chars by default; validated in tests */}
<td style={s.td}>{item.provider}</td>
```

**LOC**: +1 (comment only)

---

#### B6: Error Message Standardization (5 LOC)

**Location**: Various error throw statements

**Standardize exact copy**:
- File size: `"CSV too large (max 1MB)"`
- Row count: `"Too many rows (max 1000)"`
- Invalid date: ``Invalid date in row ${rowNum}: ${dueISO}``
- Parse failure: `"Parse failure: expected comma-delimited CSV"`

**LOC**: +4 (net: update 4 error messages)

---

**Phase B Total**: +50 LOC (10 + 5 + 10 + 5 + 1 + 4 = 35 net new + 15 refactored)

**Acceptance**: All Phase A tests pass; manual smoke test (see Phase C).

---

### Phase C: Delta Doc + Verification Scripts (5 LOC)

**Goal**: Document changes for ops/reversibility; provide manual verification checklist.

**File**: `ops/deltas/0020.1_csv_hardening.md` (+5 LOC)

**Contents**:
- Summary of changes (bulleted list)
- Error message table (exact copy)
- Rollback command: `git revert <commit-sha>`
- Manual verification checklist (refer to quickstart.md)

**LOC**: +5 (concise delta doc)

**Acceptance**: Delta doc exists; rollback command is valid.

---

## 5. File & LOC Budget Table

| File | Type | LOC Estimate | Cumulative |
|------|------|--------------|------------|
| `frontend/tests/integration/import-page.test.tsx` | Modify | +30 | 30 |
| `frontend/src/pages/Import.tsx` | Modify | +50 | 80 |
| `ops/deltas/0020.1_csv_hardening.md` | Add | +5 | 85 |
| **Total** | — | **85** | **✅ ≤140 (target ≤90)** |

**Files touched**: 3 (✅ ≤4)
**LOC total**: 85 (✅ ≤140, ✅ target ≤90)

---

## 6. Error Copy Table (Locked for Tests)

| Error Scenario | Exact Message | Validation Point |
|----------------|---------------|------------------|
| File size >1MB | `"CSV too large (max 1MB)"` | Early validation (before parse) |
| Rows >1000 | `"Too many rows (max 1000)"` | Early validation (after split) |
| Invalid date format | `"Invalid date format in row {n}. Expected YYYY-MM-DD"` | csvRowToItem() — regex check |
| Invalid calendar date | `"Invalid date in row {n}: {value}"` | csvRowToItem() — DateTime.isValid |
| Wrong delimiter | `"Parse failure: expected comma-delimited CSV"` | parseCSV() — header/row field count |
| Missing required field | `"Missing provider in row {n}"` (existing) | csvRowToItem() — field presence |
| Invalid amount | `"Invalid amount in row {n}"` (existing) | csvRowToItem() — parseFloat check |
| Invalid currency | `"Invalid currency in row {n}"` (existing) | csvRowToItem() — 3-letter check |

---

## 7. Validation Order (Deterministic Precedence)

To ensure predictable error messages and early failure, validations execute in this order:

1. **File size** (`file.size > 1_048_576`) → stop; return "CSV too large (max 1MB)"
2. **File read** (`await file.text()`) → if empty, continue to next check
3. **Row count** (split, filter non-empty, count >1000) → stop; return "Too many rows (max 1000)"
4. **Header validation** (parseCSV: check delimiter, field count) → stop; return "Parse failure" or "Invalid CSV headers"
5. **Per-row parsing** (parseCSV: split each row, check field count) → stop on first row; return "Parse failure"
6. **Per-row validation** (csvRowToItem: provider, amount, currency, date format, date validity, autopay) → stop on first invalid row; return specific error

**Rationale**: Size/count checks are cheap (O(1) and O(n) string split); fail fast before expensive parsing. Delimiter check prevents cryptic "field count" errors. Date validity check happens after format check (fail fast on regex before DateTime).

---

## 8. Test Matrix (Inputs → Expected Outcomes)

| Input | Expected Outcome | Test Location |
|-------|------------------|---------------|
| Valid CSV (5 rows, <1MB) | Success: render 5 rows, show risks, enable ICS | Existing test (happy path) |
| 2MB file | Error: "CSV too large (max 1MB)" | Phase A: test 1 |
| 1001 rows | Error: "Too many rows (max 1000)" | Phase A: test 2 |
| Row with "2025-13-45" | Error: "Invalid date in row 1: 2025-13-45" | Phase A: test 3 |
| Row with "2025-02-30" | Error: "Invalid date in row 1: 2025-02-30" | Phase A: test 4 |
| Semicolon-delimited CSV | Error: "Parse failure: expected comma-delimited CSV" | Phase A: test 5 |
| Provider field "=SUM(A1)" | Success: renders as plain text "=SUM(A1)" | Phase A: test 6 |
| Provider field "`<script>x</script>`" | Success: renders as plain text (no script execution) | Phase A: test 7 |
| File input | Assert: has `<label htmlFor>` | Phase A: test 8 |
| Error div | Assert: has `role="alert" aria-live="polite"` | Phase A: test 9 |
| Results table | Assert: has `<caption>` | Phase A: test 10 |
| All buttons | Assert: all have `type="button"` | Phase A: test 11 |
| Upload + parse flow | Assert: `fetch` not called | Phase A: test 12 (existing spy check) |

---

## 9. Rollback

**Command**:
```bash
git revert <merge-commit-sha>
```

**Effect**: Single revert removes all Import.tsx changes, test additions, and delta doc. Prior CSV Import behavior fully restored.

**Verification**: Run existing tests; confirm Import page renders and processes valid CSV as before patch.

---

## 10. STOP Note

**This plan does NOT generate /tasks or code.**

All implementation details are design decisions (WHAT to change, WHERE to change it, HOW to sequence it). The next step is `/tasks` to generate actionable task list, followed by implementation.

**Ready for /tasks**.

---

## Appendix: Running LOC Ledger (Phase-by-Phase)

| Phase | Activity | LOC Delta | Running Total |
|-------|----------|-----------|---------------|
| A | Add 12 integration tests | +30 | 30 |
| B1 | File size & row count limits | +10 | 40 |
| B2 | Real calendar date validation | +5 | 45 |
| B3 | Delimiter detection | +10 | 55 |
| B4 | Accessibility affordances | +5 | 60 |
| B5 | XSS/formula safety comment | +1 | 61 |
| B6 | Error message standardization | +4 | 65 |
| — | **Phase B subtotal** | **+50** (includes refactor) | **80** |
| C | Delta doc | +5 | 85 |
| **Final** | — | **85** | **✅ ≤90 target** |

---
