# Data Model: CSV Import MVP

**Feature**: 007-0020-csv-import
**Date**: 2025-10-08
**Status**: Complete

## Overview

This feature reuses existing data models from the email extraction system. Only one new input model is introduced for CSV parsing.

## Entity Definitions

### 1. CSVRow (New - Input Model)

Represents a single row from the uploaded CSV file after parsing.

**Purpose**: Capture raw CSV data before validation and conversion

**Fields**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `provider` | string | Yes | Non-empty, alphanumeric + spaces | BNPL provider name (e.g., "Klarna", "Affirm") |
| `amount` | string | Yes | Numeric format (parsed to number) | Payment amount as string from CSV |
| `currency` | string | Yes | 3-letter code (e.g., "USD") | ISO 4217 currency code |
| `dueISO` | string | Yes | ISO 8601 date (YYYY-MM-DD) | Payment due date |
| `autopay` | string | Yes | "true" or "false" (parsed to boolean) | Whether payment is auto-deducted |

**Validation Rules**:
- All fields must be present (no empty strings)
- `amount` must parse to valid positive number
- `dueISO` must parse to valid date
- `autopay` must be "true" or "false" (case-insensitive)

**Example**:
```typescript
{
  provider: "Klarna",
  amount: "25.00",
  currency: "USD",
  dueISO: "2025-10-15",
  autopay: "false"
}
```

**CSV Format** (header + data row):
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
```

**State Transitions**: None (immutable input)

### 2. NormalizedItem (Existing - Reused)

**Purpose**: Standard payment item format used throughout extraction system

**Source**: Defined in `frontend/src/lib/extraction/types.ts` (or similar)

**Fields** (subset relevant to CSV import):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | BNPL provider name (normalized) |
| `amount` | number | Yes | Payment amount as number |
| `currency` | string | Yes | Currency code |
| `due_date` | string | Yes | ISO 8601 date string |
| `autopay` | boolean | Yes | Autopay flag |
| `installment_no` | number | No | Installment number (set to 1 for CSV imports) |
| `late_fee` | number | No | Late fee amount (default 0 for CSV) |

**Conversion from CSVRow**:
```typescript
function csvRowToNormalizedItem(row: CSVRow): NormalizedItem {
  return {
    provider: row.provider.trim(),
    amount: parseFloat(row.amount),
    currency: row.currency.toUpperCase(),
    due_date: row.dueISO,
    autopay: row.autopay.toLowerCase() === 'true',
    installment_no: 1,
    late_fee: 0
  };
}
```

### 3. ScheduleResult (Existing - Reused)

**Purpose**: Enriched payment item with confidence and risk data for display

**Source**: Output from email extraction orchestrator

**Fields** (extends NormalizedItem):

| Field | Type | Description |
|-------|------|-------------|
| `...NormalizedItem` | - | All fields from NormalizedItem |
| `confidence` | string | Confidence level: "high", "medium", "low" |
| `risks` | Risk[] | Array of detected risks |

**Risk Type**:
```typescript
type Risk = {
  type: 'COLLISION' | 'WEEKEND_AUTOPAY' | 'CASH_CRUNCH';
  severity: 'high' | 'medium' | 'low';
  message: string;
};
```

**For CSV Imports**:
- `confidence` will be "high" (direct data entry, no parsing ambiguity)
- `risks` will include COLLISION and WEEKEND_AUTOPAY only (no CASH_CRUNCH)

### 4. ICSEvent (Existing - Reused)

**Purpose**: Calendar event data for ICS file generation

**Source**: Generated from ScheduleResult for "This Week" filtering

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Event title (e.g., "Klarna $25.00") |
| `start` | DateTime | Event start date/time |
| `description` | string | Event description with risk annotations |
| `duration` | object | Event duration (default: all-day) |

**"This Week" Filter**:
- Only events within current ISO week (Mon-Sun, America/New_York) included
- ISO week boundaries calculated explicitly (not using locale-dependent helpers)

**Risk Annotations** (in description):
```
Payment: Klarna $25.00 USD
Due: 2025-10-15
Autopay: No

Risks:
- COLLISION: Multiple payments due on same date
```

## Data Flow

```
┌─────────────┐
│ CSV File    │
│ (uploaded)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Parse CSV   │  String split + validation
│ → CSVRow[]  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Convert to       │  csvRowToNormalizedItem()
│ NormalizedItem[] │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Extract via      │  extractItemsFromEmails() or direct
│ orchestrator     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ ScheduleResult[] │  With confidence + risks (COLLISION, WEEKEND_AUTOPAY)
└──────┬───────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Display      │  │ Filter to    │  ISO week in America/New_York
│ Results      │  │ "This Week"  │
│ (UI table)   │  └──────┬───────┘
└──────────────┘         │
                         ▼
                  ┌──────────────┐
                  │ Generate ICS │  createEvents() from ics library
                  │ → Download   │  (no VALARM/reminder)
                  └──────────────┘
```

## Validation Rules Summary

### CSV File Level

- **Encoding**: UTF-8
- **Format**: Plain text, line-break delimited
- **Headers**: First row must be exactly: `provider,amount,currency,dueISO,autopay`
- **Data rows**: At least 1 row after header
- **Max recommended**: 20 rows (for UX performance)

### Row Level (CSVRow)

| Field | Validation | Error Message |
|-------|------------|---------------|
| `provider` | Non-empty after trim | "Missing provider in row {N}" |
| `amount` | Must parse to positive number | "Invalid amount in row {N}" |
| `currency` | 3-letter code, non-empty | "Invalid currency in row {N}" |
| `dueISO` | Must parse to valid date in YYYY-MM-DD | "Invalid date format in row {N}" |
| `autopay` | Must be "true" or "false" | "Invalid autopay value in row {N}" |

### Error Handling Strategy

- **First error stops processing**: Display first validation error, do not process partial data
- **Single-line error message**: No stack traces, concise user-friendly message
- **Page remains usable**: User can fix CSV and retry without reload

## State Management

**Component State** (Import.tsx):

```typescript
type ImportState = {
  file: File | null;
  error: string | null;
  results: ScheduleResult[] | null;
  processing: boolean;
};
```

**State Transitions**:

```
[Initial] → file=null, error=null, results=null, processing=false
   ↓ (user uploads file)
[Processing] → file=File, error=null, results=null, processing=true
   ↓ (parse success)
[Success] → file=File, error=null, results=[], processing=false
   ↓ (parse error)
[Error] → file=File, error="...", results=null, processing=false
   ↓ (user uploads new file)
[Initial] → reset to initial state
```

## Relationships

```
CSVFile (1) ──parses to──> (N) CSVRow
CSVRow (1) ──converts to──> (1) NormalizedItem
NormalizedItem (1) ──enriches to──> (1) ScheduleResult
ScheduleResult (N) ──filters to──> (0..N) ICSEvent  (only "This Week")
```

## Constraints & Invariants

1. **CSV format constraint**: No quoted fields, no commas within values
2. **One-to-one mapping**: Each CSV row maps to exactly one NormalizedItem
3. **Confidence invariant**: All CSV imports have "high" confidence
4. **Risk subset invariant**: CSV results can only have COLLISION or WEEKEND_AUTOPAY risks
5. **ISO week invariant**: ICS exports always filtered to current ISO week (Mon-Sun)
6. **Timezone invariant**: All date calculations use America/New_York

## Testing Data Model

**Sample Valid CSV**:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
Afterpay,37.50,USD,2025-10-15,false
```

**Expected NormalizedItems**:
```json
[
  {
    "provider": "Klarna",
    "amount": 25.00,
    "currency": "USD",
    "due_date": "2025-10-15",
    "autopay": false,
    "installment_no": 1,
    "late_fee": 0
  },
  // ... (2 more items)
]
```

**Expected Risks**:
- COLLISION on 2025-10-15 (Klarna + Afterpay)
- WEEKEND_AUTOPAY if 2025-10-16 is Saturday/Sunday and autopay=true

---
**Data Model Complete**: 2025-10-08
**Next**: Generate contracts and quickstart
