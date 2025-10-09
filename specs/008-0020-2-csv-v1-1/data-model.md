# Data Model: CSV Import v1.1 — Currency Regex + Clear Button

**Feature Branch**: `008-0020-2-csv-v1-1`
**Created**: 2025-10-09
**Status**: Planning

---

## Overview

This document defines the data entities and validation rules for CSV Import v1.1. The feature extends existing CSV Row validation with strict currency regex and introduces UI state management for the Clear button.

**Key changes from v1.0**:
- Currency field validation upgraded from length check to regex pattern
- UI state explicitly tracks clearable resources for reset behavior

---

## 1. CSV Row Entity (Extended)

### Attributes

| Field | Type | Format | Validation Rule | Error Message |
|-------|------|--------|-----------------|---------------|
| `provider` | string | Non-empty | `provider.trim().length > 0` | `"Missing provider in row X"` |
| `amount` | number | Positive float | `parseFloat(amount) > 0 && !isNaN(amount)` | `"Invalid amount in row X"` |
| **`currency`** | **string** | **3-letter uppercase** | **`/^[A-Z]{3}$/.test(currency.trim().toUpperCase())`** | **`"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`** |
| `dueISO` | string | YYYY-MM-DD | Format check + Luxon real-date validation | `"Invalid date format in row X"` or `"Invalid date in row X: <dueISO>"` |
| `autopay` | boolean | "true" or "false" | `autopay.toLowerCase() === 'true' \|\| 'false'` | `"Invalid autopay value in row X"` |

### Validation Order (Sequential)

1. **Pre-parse guards** (before row-by-row):
   - File size ≤ 1,048,576 bytes → `"CSV too large (max 1MB)"`
   - Non-empty rows ≤ 1000 → `"Too many rows (max 1000)"`
   - Header matches `provider,amount,currency,dueISO,autopay` → `"Invalid CSV headers..."` or `"Parse failure: expected comma-delimited CSV"`

2. **Per-row validation** (in `csvRowToItem`):
   - Provider non-empty
   - Amount > 0 and numeric
   - **Currency matches `^[A-Z]{3}$`** ← NEW
   - Date format `^\d{4}-\d{2}-\d{2}$`
   - Date is real calendar date (Luxon `isValid`)
   - Autopay is "true" or "false"

**First error aborts parsing**: No partial results are rendered when validation fails.

### Currency Validation Details

**Current behavior (v1.0)**:
```typescript
const currency = row.currency.trim().toUpperCase();
if (currency.length !== 3) throw new Error(`Invalid currency in row ${rowNum}`);
```

**New behavior (v1.1)**:
```typescript
const currency = row.currency.trim().toUpperCase();
if (!/^[A-Z]{3}$/.test(currency)) {
  throw new Error(`Invalid currency code in row ${rowNum}: ${row.currency.trim()} (expected 3-letter ISO 4217 code)`);
}
```

**Examples**:

| Input | Normalized | Validation | Result |
|-------|------------|------------|--------|
| `USD` | `USD` | `/^[A-Z]{3}$/` ✅ | PASS |
| `usd` | `USD` | `/^[A-Z]{3}$/` ✅ | PASS (after `.toUpperCase()`) |
| `US` | `US` | `/^[A-Z]{3}$/` ❌ | FAIL: `"Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"` |
| `US1` | `US1` | `/^[A-Z]{3}$/` ❌ | FAIL: `"Invalid currency code in row 1: US1 (expected 3-letter ISO 4217 code)"` |
| `USDX` | `USDX` | `/^[A-Z]{3}$/` ❌ | FAIL: `"Invalid currency code in row 1: USDX (expected 3-letter ISO 4217 code)"` |
| ` EUR ` | `EUR` | `/^[A-Z]{3}$/` ✅ | PASS (after `.trim()`) |

**Edge case**: Pattern-only validation accepts three-letter codes that are not official ISO 4217 currencies (e.g., "ZZZ"). This is acceptable per research notes (client-only constraint; format validation primary goal).

---

## 2. UI State Entity (New)

### Purpose

Explicitly track clearable resources for the Clear button. Previously implicit; now formalized for v1.1.

### State Variables

| Variable | Type | Initial Value | Cleared By | Description |
|----------|------|---------------|------------|-------------|
| `file` | `File \| null` | `null` | `setFile(null)` | Selected CSV file object |
| `error` | `string \| null` | `null` | `setError(null)` | Current error message (single-line) |
| `results` | `{items: Item[], risks: Risk[]} \| null` | `null` | `setResults(null)` | Parsed schedule + risk analysis |
| `processing` | `boolean` | `false` | N/A | Upload in progress (not cleared) |

**File input reset**: The `<input type="file">` element must be reset programmatically:
```typescript
const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
if (fileInput) fileInput.value = '';
```

### Clear Button Behavior

**Trigger**: User clicks Clear button
**Precondition**: None (button always available)
**Action**:
1. Reset file state: `setFile(null)`
2. Reset error state: `setError(null)`
3. Reset results state: `setResults(null)`
4. Reset file input DOM element: `fileInput.value = ''`

**Effect**:
- File chooser shows no selection
- Error banner disappears
- Results table disappears
- ICS download button disappears (disabled/hidden)
- Page returns to initial state

**No side effects**:
- No network calls
- No localStorage changes
- No analytics events (out of scope for v1.1)

---

## 3. Risk Entity (Unchanged)

Included for completeness; no changes in v1.1.

### Attributes

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `type` | `'COLLISION' \| 'WEEKEND_AUTOPAY'` | Enum | Risk category |
| `severity` | `'high' \| 'medium' \| 'low'` | Enum | Risk severity level |
| `message` | `string` | Plain text | User-facing description |
| `affectedItems` | `string[]` | Item IDs | Links risk to specific payments |

### Risk Detection Rules (Unchanged)

- **COLLISION**: Multiple payments due on same date → severity `high`
- **WEEKEND_AUTOPAY**: Autopay scheduled on Saturday/Sunday → severity `medium`

---

## 4. Item Entity (Unchanged)

Included for completeness; no changes in v1.1.

### Attributes

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | `csv-${rowNum}` |
| `provider` | `string` | Provider name |
| `amount` | `number` | Payment amount |
| `currency` | `string` | 3-letter code (validated) |
| `due_date` | `string` | YYYY-MM-DD |
| `autopay` | `boolean` | Auto-payment enabled |
| `installment_no` | `number` | Always `1` for CSV import |
| `late_fee` | `number` | Always `0` for CSV import |
| `confidence` | `number` | Always `1.0` for CSV import |

---

## 5. Validation Error Model

### Error Display Requirements

**Single-line constraint**: All errors must be single-line, non-stacking.

**Error priority** (first error wins):
1. File size guard: `"CSV too large (max 1MB)"`
2. Row count guard: `"Too many rows (max 1000)"`
3. Parse errors: `"CSV file is empty"`, `"No data rows found"`, `"Invalid CSV headers..."`, `"Parse failure: expected comma-delimited CSV"`
4. Row validation errors: Provider, amount, **currency**, date format, date validity, autopay

**Currency error format** (new):
```
Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)
```

**Examples**:
- Row 1 has `usd` → `"Invalid currency code in row 1: usd (expected 3-letter ISO 4217 code)"`
- Row 5 has `12` → `"Invalid currency code in row 5: 12 (expected 3-letter ISO 4217 code)"`

**Error region**:
- Element: `<div role="alert" aria-live="polite">{error}</div>`
- Replaces previous error (not appended)
- Cleared by successful parse or Clear button

---

## 6. ICS Calendar Model (Unchanged)

Included for completeness; no changes in v1.1.

### Event Attributes

| Field | Type | Source |
|-------|------|--------|
| `title` | `string` | `${provider} $${amount} ${currency}` |
| `start` | `[year, month, day]` | Parsed from `due_date` |
| `duration` | `{hours: 1}` | Fixed 1-hour duration |
| `description` | `string` | Payment details + risks |

**Filter**: Only includes items with `due_date` in current week (Monday-Sunday, America/New_York timezone).

---

## Data Flow Diagram

```
User selects file
       ↓
  setFile(file)
  setError(null)
  setResults(null)
       ↓
User clicks "Process CSV"
       ↓
  Pre-parse guards (size, rows)
       ↓ (pass)
  parseCSV(text) → CSV Row[]
       ↓
  For each row:
    1. Validate provider
    2. Validate amount
    3. Validate currency ← NEW REGEX CHECK
    4. Validate date format
    5. Validate date validity (Luxon)
    6. Validate autopay
       ↓ (all pass)
  Convert to Item[]
       ↓
  Risk detection (COLLISION, WEEKEND_AUTOPAY)
       ↓
  setResults({items, risks})
       ↓
  Render schedule table + Download ICS button

───────────────────────────────────

User clicks "Clear" (new)
       ↓
  setFile(null)
  setError(null)
  setResults(null)
  Reset file input DOM
       ↓
  Page returns to initial state
```

---

## Constitution Compliance

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| ≤4 files | Data model extends existing entities (no new files) | ✅ |
| ≤140 LOC (target ≤90) | Regex validation ~5 LOC; Clear handler ~10 LOC; tests ~40-50 LOC | ✅ |
| Zero new deps | Uses existing Luxon, React, ics | ✅ |
| Client-only | All validation in-browser; no network | ✅ |
| Reversible | Single git revert removes regex + Clear button | ✅ |
| Privacy | No PII collected/stored/transmitted | ✅ |

---

## Summary

**New validations**:
- Currency field: `^[A-Z]{3}$` regex (replaces length check)
- Error message: Explicit format expectation

**New UI state management**:
- Clear button resets: file, error, results, file input DOM

**Unchanged**:
- Pre-parse guards (size, rows, delimiter)
- Date validation (format + Luxon real-date check)
- Risk detection (COLLISION, WEEKEND_AUTOPAY)
- ICS calendar generation

---

**End of Data Model**
