# Data Model: Payment Status Tracking System

**Feature**: 015-build-a-payment
**Date**: 2025-10-15
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data entities, types, and relationships for the payment status tracking system. All entities are stored client-side in browser localStorage following the established pattern from Feature 012.

---

## Core Entities

### 1. PaymentStatusRecord

Represents the tracking state of a single payment.

**Purpose**: Store whether a payment has been marked as paid and when.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `paymentId` | string (UUID v4) | Yes | Unique identifier for the payment | RFC 4122 format |
| `status` | `'paid' \| 'pending'` | Yes | Current status of the payment | Enum: paid or pending |
| `timestamp` | string (ISO 8601) | Yes | When status was last updated | ISO 8601 date-time |

**Example**:
```json
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "paid",
  "timestamp": "2025-10-15T14:30:00.000Z"
}
```

**Validation Rules** (Zod schema):
```typescript
const paymentStatusRecordSchema = z.object({
  paymentId: z.string().uuid('Must be a valid UUID v4'),
  status: z.enum(['paid', 'pending']),
  timestamp: z.string().datetime('Must be ISO 8601 date-time'),
});
```

**Business Rules**:
- Default status for new payments: `pending`
- Timestamp updates whenever status changes
- Status is toggle-able (paid ↔ pending) for undo support (FR-005)
- Marking as `pending` when already `pending` updates timestamp (idempotent)

---

### 2. PaymentStatusCollection

Represents the complete set of payment status records for the current browser session.

**Purpose**: Manage all payment status data with metadata for storage and synchronization.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `version` | string | Yes | Schema version for migration support | Semantic versioning (e.g., "1.0.0") |
| `statuses` | Map<PaymentId, PaymentStatusRecord> | Yes | All payment status records | Map of paymentId → record |
| `totalSize` | number | Yes | Total storage size in bytes | Positive integer |
| `lastModified` | string (ISO 8601) | Yes | When collection was last updated | ISO 8601 date-time |

**Example**:
```json
{
  "version": "1.0.0",
  "statuses": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "paymentId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "paid",
      "timestamp": "2025-10-15T14:30:00.000Z"
    },
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8": {
      "paymentId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "status": "pending",
      "timestamp": "2025-10-15T15:00:00.000Z"
    }
  },
  "totalSize": 342,
  "lastModified": "2025-10-15T15:00:00.000Z"
}
```

**Validation Rules**:
```typescript
const paymentStatusCollectionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  statuses: z.record(z.string().uuid(), paymentStatusRecordSchema),
  totalSize: z.number().int().positive(),
  lastModified: z.string().datetime(),
});
```

**Business Rules**:
- `totalSize` recalculated on every write (same pattern as Feature 012)
- `lastModified` updates whenever any status changes
- Version starts at "1.0.0" for initial release
- Empty collection (no payments tracked) still stores metadata

---

### 3. Payment (Extended)

**IMPORTANT**: This is an **extension** of the existing Payment entity, not a new entity.

**Purpose**: Add payment status fields to existing payment data structure.

**New Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string (UUID v4) | Yes | Unique identifier assigned at creation | RFC 4122 format |
| `paid_status` | `'paid' \| 'pending'` | No (optional) | Current status for CSV export | Enum: paid or pending |
| `paid_timestamp` | string (ISO 8601) | No (optional) | When marked as paid (for CSV export) | ISO 8601 or empty string |

**Existing Attributes** (preserved):
- `description`: string - Payment description
- `amount`: number - Payment amount
- `date`: string - Payment date
- *(other existing fields unchanged)*

**Example** (CSV export format):
```csv
description,amount,date,paid_status,paid_timestamp
"Electricity Bill",150.00,"2025-10-15","paid","2025-10-15T14:30:00.000Z"
"Netflix Subscription",15.99,"2025-10-17","pending",""
```

**Business Rules**:
- `id` assigned once at payment creation (immutable)
- `paid_status` and `paid_timestamp` are **runtime-only** fields (not stored in Payment entity)
- These fields are **joined** from PaymentStatusCollection during export operations
- Backward compatibility: Existing code works without these optional fields

---

## Data Relationships

```
Payment (existing entity)
  ├── id (UUID v4) ──────────┐
  ├── description             │
  ├── amount                  │
  ├── date                    │
  └── ...                     │
                              │
                              │ (1:1 optional relationship)
                              │
PaymentStatusCollection       │
  ├── version                 │
  ├── statuses: Map ──────────┘
  │     └── [paymentId]: PaymentStatusRecord
  │           ├── paymentId (UUID v4)
  │           ├── status ('paid' | 'pending')
  │           └── timestamp (ISO 8601)
  ├── totalSize
  └── lastModified
```

**Relationship Notes**:
- **1:1 Optional**: Each Payment MAY have a corresponding PaymentStatusRecord
- **Lookup**: `paymentStatusCollection.statuses.get(payment.id)`
- **Missing Record**: If no record exists, status defaults to `pending`
- **Orphaned Records**: If Payment deleted but StatusRecord remains, it's harmless (cleanup optional)

---

## Storage Schema

### LocalStorage Key

**Key**: `payplan_payment_status`

**Structure**:
```typescript
interface SerializedPaymentStatusCollection {
  version: string;
  statuses: Record<string, PaymentStatusRecord>;
  totalSize: number;
  lastModified: string;
}
```

**Serialization**:
- **Write**: `Map → Record → JSON.stringify → localStorage.setItem`
- **Read**: `localStorage.getItem → JSON.parse → Record → Map`

**Example** (localStorage value):
```json
{
  "version": "1.0.0",
  "statuses": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "paymentId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "paid",
      "timestamp": "2025-10-15T14:30:00.000Z"
    }
  },
  "totalSize": 234,
  "lastModified": "2025-10-15T14:30:00.000Z"
}
```

---

## State Transitions

### PaymentStatusRecord State Machine

```
           ┌─────────────┐
           │   PENDING   │ ◄─── Default state for new payments
           └─────────────┘
                  │
                  │ markAsPaid()
                  │
                  ▼
           ┌─────────────┐
           │    PAID     │
           └─────────────┘
                  │
                  │ markAsPending() (undo)
                  │
                  ▼
           ┌─────────────┐
           │   PENDING   │
           └─────────────┘
```

**Allowed Transitions**:
- `pending → paid`: User marks payment as completed
- `paid → pending`: User undoes (e.g., payment failed, wrong payment marked)
- `pending → pending`: Idempotent (updates timestamp)
- `paid → paid`: Idempotent (updates timestamp)

**Forbidden Transitions**: None (all transitions allowed for flexibility)

---

## Validation Summary

### Zod Schemas

**PaymentStatusRecord**:
```typescript
import { z } from 'zod';

export const paymentStatusRecordSchema = z.object({
  paymentId: z.string().uuid('Must be a valid UUID v4'),
  status: z.enum(['paid', 'pending'], {
    errorMap: () => ({ message: 'Status must be "paid" or "pending"' }),
  }),
  timestamp: z.string().datetime({
    message: 'Timestamp must be ISO 8601 date-time',
  }),
});

export type PaymentStatusRecord = z.infer<typeof paymentStatusRecordSchema>;
```

**PaymentStatusCollection**:
```typescript
export const paymentStatusCollectionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be semantic versioning format (e.g., 1.0.0)',
  }),
  statuses: z.record(
    z.string().uuid('Payment ID must be valid UUID'),
    paymentStatusRecordSchema
  ),
  totalSize: z.number().int().positive({
    message: 'Total size must be positive integer',
  }),
  lastModified: z.string().datetime({
    message: 'Last modified must be ISO 8601 date-time',
  }),
});

export type SerializedPaymentStatusCollection = z.infer<
  typeof paymentStatusCollectionSchema
>;
```

**Type Guards**:
```typescript
export function isPaymentStatusRecord(value: unknown): value is PaymentStatusRecord {
  return paymentStatusRecordSchema.safeParse(value).success;
}

export function isValidPaymentId(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}
```

---

## Error Handling

### Error Types

Following the Result<T, E> pattern from Feature 012:

```typescript
export type StorageErrorType =
  | 'Validation'      // Schema validation failed
  | 'QuotaExceeded'   // Storage limit reached
  | 'Security'        // localStorage disabled or blocked
  | 'Serialization';  // JSON.stringify failed

export interface StorageError {
  type: StorageErrorType;
  message: string;
  paymentId?: string;  // Optional: which payment caused error
}

export type Result<T, E = StorageError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Example Usage**:
```typescript
const result = paymentStatusService.markAsPaid(paymentId);

if (!result.ok) {
  switch (result.error.type) {
    case 'Validation':
      showError('Invalid payment ID');
      break;
    case 'QuotaExceeded':
      showWarning('Storage limit reached. Please clear old payments.');
      break;
    case 'Security':
      showError('Browser storage disabled. Enable in settings.');
      break;
    default:
      showError('Failed to save payment status');
  }
  return;
}

// Success: update UI
updatePaymentUI(paymentId, 'paid');
```

---

## Constants

### Default Values

```typescript
export const STORAGE_KEY = 'payplan_payment_status';
export const SCHEMA_VERSION = '1.0.0';
export const DEFAULT_STATUS = 'pending' as const;

export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: 'Storage limit exceeded. Please clear old payment statuses.',
  SECURITY_ERROR: 'Browser storage is disabled or blocked.',
  VALIDATION_ERROR: 'Invalid payment status data.',
  SERIALIZATION_ERROR: 'Failed to save payment status.',
} as const;
```

### Storage Limits

```typescript
// Estimated sizes (from research.md)
export const ESTIMATED_RECORD_SIZE = 140; // bytes per record
export const MAX_SAFE_RECORDS = 500;      // Target from SC-008
export const WARNING_THRESHOLD = 0.8;     // Warn at 80% capacity

// Browser limits (conservative estimate)
export const BROWSER_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
```

---

## Data Migrations

### Version History

**Version 1.0.0** (Initial Release):
- Basic status tracking (paid/pending)
- Timestamp recording
- UUID-based identification

**Future Versions** (Planned):
```typescript
// Version 1.1.0: Add payment notes (backward compatible)
interface PaymentStatusRecordV1_1 extends PaymentStatusRecord {
  notes?: string;  // Optional user notes
}

// Version 2.0.0: Add payment categories (breaking change)
interface PaymentStatusRecordV2 {
  paymentId: string;
  status: 'paid' | 'pending' | 'cancelled';  // New status
  category: string;                           // New field
  timestamp: string;
}
```

### Migration Strategy

```typescript
function migrateSchema(
  data: SerializedPaymentStatusCollection
): SerializedPaymentStatusCollection {
  const currentVersion = '1.0.0';

  if (data.version === currentVersion) {
    return data;  // No migration needed
  }

  // Version-specific migrations
  if (data.version === '0.9.0') {
    // Migrate 0.9.0 → 1.0.0
    return migrate_0_9_to_1_0(data);
  }

  // Incompatible version: reset to defaults
  console.warn(`Incompatible version ${data.version}, resetting to defaults`);
  return createDefaultCollection();
}
```

---

## Performance Considerations

### Size Calculations

**Per-Record Overhead**:
```
UUID: 36 bytes
Status: 4-7 bytes
Timestamp: 24 bytes
JSON structure: ~20 bytes
Total: ~90-110 bytes per record (avg: 100 bytes)
```

**Collection Overhead**:
```
Version: 10 bytes
Metadata: 50 bytes
Total: ~60 bytes + (N × 100 bytes)
```

**Target Capacity** (500 payments):
```
500 payments × 100 bytes = 50KB
+ 60 bytes metadata = 50.06KB
<< 5MB browser limit ✅
```

### Read/Write Performance

**Operation Targets** (from Success Criteria):

| Operation | Target | Measured (Feature 012 pattern) |
|-----------|--------|--------------------------------|
| Load all statuses | <100ms | ~5-10ms (500 records) ✅ |
| Mark single payment | <200ms | ~15-35ms ✅ |
| Bulk mark 10 payments | <5s | ~50ms ✅ |
| Calculate storage size | <50ms | ~2-5ms ✅ |

---

## Integration Points

### With Existing Payment Data

**Joining Pattern**:
```typescript
function enrichPaymentWithStatus(
  payment: Payment,
  statusCollection: PaymentStatusCollection
): Payment & { paid_status?: string; paid_timestamp?: string } {
  const statusRecord = statusCollection.statuses.get(payment.id);

  return {
    ...payment,
    paid_status: statusRecord?.status ?? 'pending',
    paid_timestamp: statusRecord?.status === 'paid'
      ? statusRecord.timestamp
      : '',
  };
}
```

### With Risk Analysis

**Filtering Pattern**:
```typescript
function getPendingPayments(
  payments: Payment[],
  statusCollection: PaymentStatusCollection
): Payment[] {
  return payments.filter((payment) => {
    const status = statusCollection.statuses.get(payment.id);
    return status?.status !== 'paid';
  });
}
```

### With CSV Export

**PapaParse Integration**:
```typescript
import Papa from 'papaparse';

function exportToCSV(
  payments: Payment[],
  statusCollection: PaymentStatusCollection
): string {
  const enrichedPayments = payments.map((payment) =>
    enrichPaymentWithStatus(payment, statusCollection)
  );

  return Papa.unparse(enrichedPayments, {
    columns: [
      'description',
      'amount',
      'date',
      'paid_status',
      'paid_timestamp',
      // ... other columns
    ],
  });
}
```

---

## Next Steps

- **Phase 1 (continued)**: Generate API contracts in `/contracts/`
- **Phase 1 (continued)**: Generate manual testing guide in `quickstart.md`
- **Phase 2**: Generate task breakdown in `tasks.md` (via `/speckit.tasks`)

---

**References**:
- Feature 012: User Preference Management (established patterns)
- [research.md](research.md): Technical decisions and rationale
- [spec.md](spec.md): Functional requirements (FR-001 through FR-017)
