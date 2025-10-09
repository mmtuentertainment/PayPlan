# Data Model & Validation Rules: CSV Import Hardening

**Feature**: 0020.1-csv-hardening
**Branch**: 008-0020-1-csv

---

## Overview

This document defines the entities, schemas, and validation rules for the CSV Import hardening feature. All validation occurs **client-side** with zero network calls.

---

## 1. CSV Row Entity

**Description**: Represents a single payment installment row in the uploaded CSV file.

### Schema

| Field | Type | Required | Format | Validation Rules |
|-------|------|----------|--------|------------------|
| `provider` | string | Yes | Free text | Non-empty after trim; max length: 255 chars |
| `amount` | string | Yes | Numeric string | Must parse to valid float >0 |
| `currency` | string | Yes | ISO 4217 code | Exactly 3 uppercase letters (e.g., USD, EUR) |
| `dueISO` | string | Yes | ISO-8601 date | Format: YYYY-MM-DD; must be real calendar date |
| `autopay` | string | Yes | Boolean string | Must be "true" or "false" (case-insensitive) |

### Example Valid Row

```csv
Klarna,25.00,USD,2025-10-15,false
```

### Example Invalid Rows

| Row | Error | Reason |
|-----|-------|--------|
| `Klarna,25.00,USD,2025-13-45,false` | Invalid date in row 1: 2025-13-45 | Month 13, day 45 don't exist |
| `Klarna,-25.00,USD,2025-10-15,false` | Invalid amount in row 1 | Negative amount |
| `Klarna,25.00,US,2025-10-15,false` | Invalid currency in row 1 | Currency code must be 3 letters |
| `,25.00,USD,2025-10-15,false` | Missing provider in row 1 | Empty provider field |
| `Klarna,25.00,USD,2025-10-15,maybe` | Invalid autopay value in row 1 | Must be "true" or "false" |

---

## 2. Parse Result Entity

**Description**: Represents the outcome of CSV file parsing and validation.

### Schema

```typescript
interface ParseResult {
  rows: Item[];      // Array of successfully validated items
  errors: string[];  // Array of validation error messages
}
```

### Behavior

- **Success**: `rows.length > 0`, `errors.length === 0`
- **Failure**: `rows.length === 0`, `errors.length > 0`
- **Partial failure not allowed**: First error stops parsing; only one error returned

### Example Success

```typescript
{
  rows: [
    { id: 'csv-1', provider: 'Klarna', amount: 25.00, currency: 'USD', due_date: '2025-10-15', autopay: false, ... },
    { id: 'csv-2', provider: 'Affirm', amount: 50.00, currency: 'USD', due_date: '2025-10-16', autopay: true, ... }
  ],
  errors: []
}
```

### Example Failure

```typescript
{
  rows: [],
  errors: ['Invalid date in row 1: 2025-13-45']
}
```

---

## 3. Item Entity (Existing)

**Description**: Internal representation of a payment installment used throughout the app.

### Schema (Subset Relevant to CSV Import)

```typescript
interface Item {
  id: string;              // Format: "csv-{rowNum}" (e.g., "csv-1")
  provider: string;        // Payment provider name (e.g., "Klarna")
  amount: number;          // Payment amount as float (e.g., 25.00)
  currency: string;        // ISO 4217 currency code (e.g., "USD")
  due_date: string;        // ISO-8601 date string (e.g., "2025-10-15")
  autopay: boolean;        // Autopay enabled flag
  installment_no: number;  // Always 1 for CSV import
  late_fee: number;        // Always 0 for CSV import
  confidence: number;      // Always 1.0 for CSV import (high confidence)
}
```

### Transformation: CSV Row → Item

```typescript
function csvRowToItem(row: CSVRow, rowNum: number): Item {
  return {
    id: `csv-${rowNum}`,
    provider: row.provider.trim(),
    amount: parseFloat(row.amount),
    currency: row.currency.trim().toUpperCase(),
    due_date: row.dueISO.trim(),
    autopay: row.autopay.trim().toLowerCase() === 'true',
    installment_no: 1,
    late_fee: 0,
    confidence: 1.0
  };
}
```

---

## 4. Validation Rules (Comprehensive)

### 4.1. File-Level Validation (Pre-Parse)

**Validation Order**: Execute in sequence; stop on first failure.

| Rule ID | Check | Error Message | Rationale |
|---------|-------|---------------|-----------|
| V-001 | File size ≤ 1,048,576 bytes | `"CSV too large (max 1MB)"` | Prevent UI freeze; fail fast |
| V-002 | Non-empty rows ≤ 1000 | `"Too many rows (max 1000)"` | Prevent OOM; performance limit |

**Definition of "Non-Empty Row"**:
```typescript
const nonEmptyRows = lines.slice(1).filter(line => line.trim().length > 0);
```

- **Excludes**: Blank lines (whitespace-only after trim)
- **Includes**: Malformed rows (e.g., "Klarna,25.00,USD,,false")
- **Rationale**: Safety-first (prevent abuse via comma-padding); user-friendly (ignore trailing newlines)

---

### 4.2. Header Validation

| Rule ID | Check | Error Message | Rationale |
|---------|-------|---------------|-----------|
| V-003 | Exact header match | `"Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay"` | Enforce schema contract |
| V-004 | Header has semicolons OR ≠5 fields | `"Parse failure: expected comma-delimited CSV"` | Detect delimiter mismatch early |

**Header Match Logic**:
```typescript
const header = lines[0].trim();
if (header !== 'provider,amount,currency,dueISO,autopay') {
  if (header.includes(';') || header.split(',').length !== 5) {
    throw new Error('Parse failure: expected comma-delimited CSV');
  }
  throw new Error('Invalid CSV headers...');
}
```

---

### 4.3. Row-Level Parsing

| Rule ID | Check | Error Message | Rationale |
|---------|-------|---------------|-----------|
| V-005 | Row has exactly 5 fields (comma-split) | `"Parse failure: expected comma-delimited CSV"` | Detect wrong delimiter or missing/extra fields |

**Field Count Check**:
```typescript
const v = line.split(',');
if (v.length !== 5) {
  throw new Error('Parse failure: expected comma-delimited CSV');
}
```

---

### 4.4. Field-Level Validation

Execute in order for each row; stop on first field error.

#### Provider Field (V-006)

```typescript
const provider = row.provider.trim();
if (!provider) throw new Error(`Missing provider in row ${rowNum}`);
```

- **Type**: string
- **Required**: Yes
- **Constraint**: Non-empty after trim
- **Max Length**: 255 chars (practical limit; not enforced)

#### Amount Field (V-007)

```typescript
const amount = parseFloat(row.amount);
if (isNaN(amount) || amount <= 0) throw new Error(`Invalid amount in row ${rowNum}`);
```

- **Type**: numeric string
- **Required**: Yes
- **Constraint**: Must parse to float >0
- **Precision**: No rounding applied; preserves input precision

#### Currency Field (V-008)

```typescript
const currency = row.currency.trim().toUpperCase();
if (currency.length !== 3) throw new Error(`Invalid currency in row ${rowNum}`);
```

- **Type**: string
- **Required**: Yes
- **Format**: ISO 4217 code (3 uppercase letters)
- **Normalization**: Convert to uppercase
- **Validation**: Length check only (no whitelist of valid codes)

#### Due Date Field (V-009, V-010)

**V-009: Format Validation**
```typescript
const dueISO = row.dueISO.trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(dueISO)) {
  throw new Error(`Invalid date format in row ${rowNum}. Expected YYYY-MM-DD`);
}
```

- **Type**: ISO-8601 date string
- **Required**: Yes
- **Format**: `YYYY-MM-DD` (regex check)

**V-010: Calendar Validity (NEW IN THIS PATCH)**
```typescript
const dt = DateTime.fromISO(dueISO, { zone: 'America/New_York' });
if (!dt.isValid) {
  throw new Error(`Invalid date in row ${rowNum}: ${dueISO}`);
}
```

- **Real Calendar Check**: Must be valid Gregorian date
- **Timezone**: America/New_York (for consistency with risk detection)
- **Invalid Examples**: 2025-13-45, 2025-02-30, 2025-04-31
- **Valid Examples**: 2025-02-28, 2024-02-29 (leap year), 2025-10-15

#### Autopay Field (V-011)

```typescript
const autopayStr = row.autopay.trim().toLowerCase();
if (autopayStr !== 'true' && autopayStr !== 'false') {
  throw new Error(`Invalid autopay value in row ${rowNum}`);
}
```

- **Type**: boolean string
- **Required**: Yes
- **Valid Values**: "true" or "false" (case-insensitive)
- **Normalization**: Convert to lowercase before comparison

---

## 5. Validation Execution Flow

```
1. User selects file
   ↓
2. User clicks "Process CSV"
   ↓
3. File-level validation (V-001, V-002)
   ├─ FAIL → Display error, STOP
   └─ PASS → Continue
   ↓
4. Read file.text()
   ↓
5. Split into lines
   ↓
6. Header validation (V-003, V-004)
   ├─ FAIL → Display error, STOP
   └─ PASS → Continue
   ↓
7. For each row (lines[1...n]):
   ├─ Parse row (V-005: split on comma, check 5 fields)
   │  ├─ FAIL → Display error, STOP
   │  └─ PASS → Continue
   ├─ Validate fields (V-006 to V-011 in order)
   │  ├─ FAIL → Display error, STOP
   │  └─ PASS → Continue
   └─ Transform to Item
   ↓
8. All rows valid → Return ParseResult with rows
   ↓
9. Display results table + risks + enable ICS download
```

**Key Property**: **Fail-Fast**
- First error stops all processing
- Only one error message displayed (single-line guarantee)
- No partial results (all-or-nothing)

---

## 6. Invariants & Guarantees

### Invariants

1. **Non-empty row count invariant**:
   ```
   nonEmptyRows.length ≤ 1000
   ```

2. **Field count invariant** (per row):
   ```
   row.split(',').length === 5
   ```

3. **Date format invariant**:
   ```
   /^\d{4}-\d{2}-\d{2}$/.test(dueISO) === true
   ```

4. **Date validity invariant** (NEW):
   ```
   DateTime.fromISO(dueISO, { zone: 'America/New_York' }).isValid === true
   ```

5. **Currency length invariant**:
   ```
   currency.length === 3
   ```

6. **Autopay value invariant**:
   ```
   autopay ∈ {'true', 'false'} (after lowercase normalization)
   ```

### Guarantees

1. **Single error guarantee**: At most one error message displayed per upload attempt
2. **Atomic success guarantee**: Either all rows succeed OR none succeed (no partial results)
3. **Performance guarantee**: Validation completes in <100ms for 1000-row file (typical modern hardware)
4. **Privacy guarantee**: Zero network calls during parse/validate (verified by test spy)
5. **Idempotency guarantee**: Same CSV file → same result every time (deterministic validation)

---

## 7. Error Message Catalog (Locked)

All error messages are **exact strings** (for test assertions and UX consistency).

| Error Code | Message Template | Example |
|------------|------------------|---------|
| E-001 | `"CSV too large (max 1MB)"` | `"CSV too large (max 1MB)"` |
| E-002 | `"Too many rows (max 1000)"` | `"Too many rows (max 1000)"` |
| E-003 | `"Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay"` | `"Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay"` |
| E-004 | `"Parse failure: expected comma-delimited CSV"` | `"Parse failure: expected comma-delimited CSV"` |
| E-005 | `"CSV file is empty"` | `"CSV file is empty"` |
| E-006 | `"No data rows found"` | `"No data rows found"` |
| E-007 | `"Missing provider in row {n}"` | `"Missing provider in row 1"` |
| E-008 | `"Invalid amount in row {n}"` | `"Invalid amount in row 2"` |
| E-009 | `"Invalid currency in row {n}"` | `"Invalid currency in row 3"` |
| E-010 | `"Invalid date format in row {n}. Expected YYYY-MM-DD"` | `"Invalid date format in row 4. Expected YYYY-MM-DD"` |
| E-011 | `"Invalid date in row {n}: {value}"` | `"Invalid date in row 5: 2025-13-45"` |
| E-012 | `"Invalid autopay value in row {n}"` | `"Invalid autopay value in row 6"` |

**Note**: Error messages are **single-line** (no multi-line stack traces). Errors are displayed in `<div role="alert">` for accessibility.

---

## 8. Example Validation Scenarios

### Scenario A: Happy Path

**Input**:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
```

**Validation Steps**:
1. V-001: File size = 150 bytes ✅ (< 1MB)
2. V-002: Non-empty rows = 2 ✅ (< 1000)
3. V-003: Header exact match ✅
4. V-005: Row 1 has 5 fields ✅
5. V-006 to V-011: All fields valid ✅
6. V-005: Row 2 has 5 fields ✅
7. V-006 to V-011: All fields valid ✅

**Output**:
```typescript
{
  rows: [Item, Item],
  errors: []
}
```

---

### Scenario B: Invalid Calendar Date

**Input**:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-13-45,false
```

**Validation Steps**:
1. V-001: ✅
2. V-002: ✅
3. V-003: ✅
4. V-005: ✅
5. V-006 to V-009: ✅
6. **V-010: FAIL** — DateTime.fromISO('2025-13-45').isValid === false

**Output**:
```typescript
{
  rows: [],
  errors: ['Invalid date in row 1: 2025-13-45']
}
```

---

### Scenario C: File Too Large

**Input**: 2MB file

**Validation Steps**:
1. **V-001: FAIL** — file.size = 2,097,152 > 1,048,576

**Output**:
```typescript
{
  rows: [],
  errors: ['CSV too large (max 1MB)']
}
```

---

### Scenario D: Wrong Delimiter (Semicolon)

**Input**:
```csv
provider;amount;currency;dueISO;autopay
Klarna;25.00;USD;2025-10-15;false
```

**Validation Steps**:
1. V-001: ✅
2. V-002: ✅
3. V-003: header ≠ expected
4. **V-004: FAIL** — header.includes(';') === true

**Output**:
```typescript
{
  rows: [],
  errors: ['Parse failure: expected comma-delimited CSV']
}
```

---

## 9. Testing Assertions

### Test: File Size Limit
```typescript
const file = new File(['x'.repeat(2_000_000)], 'big.csv', { type: 'text/csv' });
// Assert: error === "CSV too large (max 1MB)"
```

### Test: Row Count Limit
```typescript
const rows = Array(1002).fill('Klarna,25,USD,2025-10-15,false').join('\n');
const csv = `provider,amount,currency,dueISO,autopay\n${rows}`;
// Assert: error === "Too many rows (max 1000)"
```

### Test: Invalid Calendar Date
```typescript
const csv = `provider,amount,currency,dueISO,autopay\nKlarna,25,USD,2025-13-45,false`;
// Assert: error === "Invalid date in row 1: 2025-13-45"
```

### Test: Non-Empty Row Definition
```typescript
const csv = `provider,amount,currency,dueISO,autopay
Klarna,25,USD,2025-10-15,false

Affirm,50,USD,2025-10-16,true`;
// Assert: rows.length === 2 (blank line ignored)
```

---

## 10. Data Flow Diagram

```
┌──────────────┐
│ User uploads │
│  CSV file    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ File-level validation │
│  - Size ≤ 1MB        │
│  - Rows ≤ 1000       │
└──────┬───────────────┘
       │ PASS
       ▼
┌──────────────────────┐
│ Read file.text()     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Header validation    │
│  - Exact match       │
│  - Delimiter check   │
└──────┬───────────────┘
       │ PASS
       ▼
┌──────────────────────┐
│ For each row:        │
│  1. Parse (split ',')│
│  2. Validate fields  │
│  3. Transform to Item│
└──────┬───────────────┘
       │ ALL PASS
       ▼
┌──────────────────────┐
│ Risk Detection       │
│  - COLLISION         │
│  - WEEKEND_AUTOPAY   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Display Results      │
│  - Table (a11y)      │
│  - Risks             │
│  - ICS download      │
└──────────────────────┘
```

**Failure Path** (any validation fails):
```
Validation FAIL
       │
       ▼
┌──────────────────────┐
│ Set error message    │
│ (single-line)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Display in alert div │
│ role="alert"         │
│ aria-live="polite"   │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Page remains usable  │
│ (can upload new file)│
└──────────────────────┘
```

---
