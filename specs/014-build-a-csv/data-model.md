# Data Model: CSV Export for Payment Schedules

**Feature**: CSV Export (014-build-a-csv)
**Date**: 2025-10-14
**Status**: Complete

## Overview

Data entities and type definitions for client-side CSV export functionality. All types use TypeScript for compile-time safety and Zod for runtime validation.

## Entities

### 1. PaymentRecord (Source Data)

**Description**: Represents a single payment in the PayPlan system. This is the input data for CSV export.

**Source**: Existing PayPlan type (used throughout the application)

**Fields**:
```typescript
interface PaymentRecord {
  provider: string;           // Provider name (e.g., "Klarna", "Affirm")
  amount: number;             // Payment amount (e.g., 45.00)
  currency: string;           // ISO 4217 currency code (e.g., "USD", "EUR")
  dueISO: string;            // Due date in ISO 8601 format (e.g., "2025-10-14")
  autopay: boolean;          // Autopay enabled/disabled
  risk_type?: string;        // Risk category (optional, may be undefined)
  risk_severity?: string;    // Risk severity level (optional, may be undefined)
  risk_message?: string;     // Risk description (optional, may be undefined)
}
```

**Validation Rules**:
- `provider`: Non-empty string, max 255 characters
- `amount`: Positive number, max 2 decimal places
- `currency`: Exactly 3 uppercase letters (ISO 4217)
- `dueISO`: Valid ISO 8601 date string (YYYY-MM-DD)
- `autopay`: Boolean (true/false)
- `risk_*`: Optional strings, empty string if no risk detected (per FR-010)

**Example**:
```typescript
{
  provider: "Klarna",
  amount: 45.00,
  currency: "USD",
  dueISO: "2025-10-14",
  autopay: true,
  risk_type: "",
  risk_severity: "",
  risk_message: ""
}
```

### 2. CSVRow (Export Data)

**Description**: Represents a single row in the exported CSV file. Transforms `PaymentRecord` to ensure RFC 4180 compliance.

**Fields**:
```typescript
interface CSVRow {
  provider: string;           // Provider name (escaped per RFC 4180)
  amount: string;             // Amount as string to preserve decimal precision
  currency: string;           // ISO 4217 currency code
  dueISO: string;            // ISO 8601 date string
  autopay: string;           // "true" or "false" (string for CSV compatibility)
  risk_type: string;         // Risk type or empty string ""
  risk_severity: string;     // Risk severity or empty string ""
  risk_message: string;      // Risk message or empty string ""
}
```

**Transformation Rules**:
1. `amount`: Convert number to string with exactly 2 decimal places
   - `45` → `"45.00"`
   - `45.5` → `"45.50"`
2. `autopay`: Convert boolean to string
   - `true` → `"true"`
   - `false` → `"false"`
3. `risk_*`: Use empty string `""` if undefined/null (per FR-010)

**Validation Rules** (enforced by Zod schema):
```typescript
const csvRowSchema = z.object({
  provider: z.string().min(1).max(255),
  amount: z.string().regex(/^\d+\.\d{2}$/),  // Must have exactly 2 decimals
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  autopay: z.enum(["true", "false"]),
  risk_type: z.string(),      // Empty string allowed
  risk_severity: z.string(),  // Empty string allowed
  risk_message: z.string()    // Empty string allowed
});
```

**Example**:
```typescript
{
  provider: "Klarna",
  amount: "45.00",
  currency: "USD",
  dueISO: "2025-10-14",
  autopay: "true",
  risk_type: "",
  risk_severity: "",
  risk_message: ""
}
```

### 3. ExportMetadata

**Description**: Metadata about the CSV export operation, including filename generation and record tracking.

**Fields**:
```typescript
interface ExportMetadata {
  filename: string;          // Generated filename with timestamp
  timestamp: string;         // ISO 8601 timestamp (YYYY-MM-DDTHH:mm:ss)
  recordCount: number;       // Total number of records in export
  shouldWarn: boolean;       // True if recordCount > 500 (performance warning)
  generatedAt: Date;         // JavaScript Date object for timestamp
}
```

**Validation Rules**:
- `filename`: Must match pattern `payplan-export-YYYY-MM-DD-HHMMSS.csv`
- `timestamp`: Valid ISO 8601 timestamp
- `recordCount`: Non-negative integer
- `shouldWarn`: Boolean, true when recordCount > 500 (per FR-012)

**Generation Logic**:
```typescript
function generateExportMetadata(recordCount: number): ExportMetadata {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    filename: `payplan-export-${year}-${month}-${day}-${hours}${minutes}${seconds}.csv`,
    timestamp: now.toISOString(),
    recordCount,
    shouldWarn: recordCount > 500,
    generatedAt: now
  };
}
```

**Example**:
```typescript
{
  filename: "payplan-export-2025-10-14-143052.csv",
  timestamp: "2025-10-14T14:30:52.123Z",
  recordCount: 50,
  shouldWarn: false,
  generatedAt: new Date("2025-10-14T14:30:52.123Z")
}
```

### 4. CSVExportData (Complete Export)

**Description**: Aggregates all data and metadata for a complete CSV export operation.

**Fields**:
```typescript
interface CSVExportData {
  rows: CSVRow[];            // Array of CSV rows
  metadata: ExportMetadata;  // Export metadata
  csvContent: string;        // Generated CSV string (RFC 4180 compliant)
}
```

**Validation Rules**:
- `rows`: Array of valid CSVRow objects (min 0, max 1000)
- `metadata`: Valid ExportMetadata object
- `csvContent`: Non-empty string, must start with header row

**Header Row** (fixed order per spec FR-002, FR-003):
```
provider,amount,currency,dueISO,autopay,risk_type,risk_severity,risk_message
```

**Example**:
```typescript
{
  rows: [
    {
      provider: "Klarna",
      amount: "45.00",
      currency: "USD",
      dueISO: "2025-10-14",
      autopay: "true",
      risk_type: "",
      risk_severity: "",
      risk_message: ""
    }
  ],
  metadata: {
    filename: "payplan-export-2025-10-14-143052.csv",
    timestamp: "2025-10-14T14:30:52.123Z",
    recordCount: 1,
    shouldWarn: false,
    generatedAt: new Date("2025-10-14T14:30:52.123Z")
  },
  csvContent: "provider,amount,currency,dueISO,autopay,risk_type,risk_severity,risk_message\nKlarna,45.00,USD,2025-10-14,true,,,\n"
}
```

## Type Definitions File Structure

**File**: `frontend/src/types/csvExport.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Source Data Types (Existing PayPlan Types)
// ============================================================================

export interface PaymentRecord {
  provider: string;
  amount: number;
  currency: string;
  dueISO: string;
  autopay: boolean;
  risk_type?: string;
  risk_severity?: string;
  risk_message?: string;
}

// ============================================================================
// CSV Export Types
// ============================================================================

export interface CSVRow {
  provider: string;
  amount: string;
  currency: string;
  dueISO: string;
  autopay: string;
  risk_type: string;
  risk_severity: string;
  risk_message: string;
}

export interface ExportMetadata {
  filename: string;
  timestamp: string;
  recordCount: number;
  shouldWarn: boolean;
  generatedAt: Date;
}

export interface CSVExportData {
  rows: CSVRow[];
  metadata: ExportMetadata;
  csvContent: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const csvRowSchema = z.object({
  provider: z.string().min(1).max(255),
  amount: z.string().regex(/^\d+\.\d{2}$/),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  dueISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  autopay: z.enum(["true", "false"]),
  risk_type: z.string(),
  risk_severity: z.string(),
  risk_message: z.string()
});

export const exportMetadataSchema = z.object({
  filename: z.string().regex(/^payplan-export-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/),
  timestamp: z.string().datetime(),
  recordCount: z.number().int().nonnegative(),
  shouldWarn: z.boolean(),
  generatedAt: z.date()
});

export const csvExportDataSchema = z.object({
  rows: z.array(csvRowSchema).min(0).max(1000),
  metadata: exportMetadataSchema,
  csvContent: z.string().min(1)
});
```

## Relationships

```
PaymentRecord (1..n) ────transforms to────> CSVRow (1..n)
                                                    │
                                                    │
                                                    ▼
ExportMetadata (1) ──────aggregates────────> CSVExportData (1)
                                                    │
                                                    │
                                                    ▼
                                               CSV File (download)
```

## Data Flow

```
1. Input: PaymentRecord[] (from app state)
   ↓
2. Transform: PaymentRecord → CSVRow
   - Format numbers/booleans as strings
   - Handle missing risk data (empty strings)
   ↓
3. Generate Metadata
   - Create filename with timestamp
   - Count records
   - Determine warning flag
   ↓
4. Generate CSV Content
   - PapaParse.unparse(rows)
   - Add header row
   - RFC 4180 escaping
   ↓
5. Create CSVExportData object
   ↓
6. Trigger Download
   - Create Blob
   - Generate download URL
   - Trigger browser download
   ↓
7. Output: CSV file downloaded to user's device
```

## Validation Points

1. **Pre-transform**: Validate PaymentRecord[] using existing app schemas
2. **Post-transform**: Validate CSVRow[] using `csvRowSchema`
3. **Pre-export**: Validate CSVExportData using `csvExportDataSchema`
4. **Post-generation**: Verify CSV content has header row
5. **Round-trip**: Validate re-imported CSV matches original data

## Edge Cases Handled

1. **Empty Dataset**: `rows: []` is valid, generates header-only CSV
2. **Missing Risk Data**: Uses empty strings `""` per RFC 4180
3. **Special Characters**: PapaParse handles quoting automatically
4. **Large Datasets**: Metadata includes `shouldWarn` flag for 500+ records
5. **Decimal Precision**: Always 2 decimals (e.g., `45.00` not `45`)
6. **Boolean Strings**: Lowercase `"true"`/`"false"` for consistency

## Notes

- All types are immutable (use `readonly` where appropriate in implementation)
- Zod schemas enable runtime validation and type inference
- Export format exactly matches import format for round-trip compatibility
- No PII (Personally Identifiable Information) - only payment metadata
