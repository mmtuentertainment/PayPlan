# Data Model: Payment History Archive System

**Feature**: 016-payment-archive
**Date**: 2025-10-17
**Phase**: 1 (Design & Contracts)

## Overview

This document defines the data entities, types, and relationships for the payment history archive system. All entities are stored client-side in browser localStorage following the two-tier pattern established in research.md.

---

## Core Entities

### 1. Archive

Represents a complete snapshot of payment status records from a specific period.

**Purpose**: Preserve historical payment tracking data before starting a new billing cycle.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string (UUID v4) | Yes | Unique identifier for the archive | RFC 4122 format |
| `name` | string | Yes | User-defined archive name | 1-100 characters, Unicode support |
| `createdAt` | string (ISO 8601) | Yes | When archive was created | ISO 8601 date-time |
| `sourceVersion` | string | Yes | Version of source PaymentStatusCollection schema | Semantic versioning (e.g., "1.0.0") |
| `payments` | PaymentStatusRecord[] | Yes | Array of archived payment status records | From Feature 015 |
| `metadata` | ArchiveMetadata | Yes | Calculated statistics and summary info | See ArchiveMetadata entity |

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "October 2025",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "sourceVersion": "1.0.0",
  "payments": [
    {
      "paymentId": "abc123-...",
      "status": "paid",
      "timestamp": "2025-10-15T14:30:00.000Z"
    },
    {
      "paymentId": "def456-...",
      "status": "pending",
      "timestamp": "2025-10-20T09:00:00.000Z"
    }
  ],
  "metadata": {
    "totalCount": 20,
    "paidCount": 15,
    "pendingCount": 5,
    "dateRange": {
      "earliest": "2025-10-01",
      "latest": "2025-10-31"
    },
    "storageSize": 12500
  }
}
```

**Validation Rules** (Zod schema):
```typescript
const archiveSchema = z.object({
  id: z.string().uuid('Must be a valid UUID v4'),
  name: z.string()
    .min(1, 'Archive name is required')
    .max(100, 'Archive name must be under 100 characters')
    .transform(name => name.trim()),
  createdAt: z.string().datetime('Must be ISO 8601 date-time'),
  sourceVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  payments: z.array(paymentStatusRecordSchema),  // From Feature 015
  metadata: archiveMetadataSchema,
});
```

**Business Rules**:
- Archive names can contain Unicode (emoji, international characters)
- Duplicate names auto-append counter: "October 2025" → "October 2025 (2)"
- Archives are **immutable** after creation (no update operations)
- payments array is a deep copy from Feature 015's PaymentStatusCollection
- sourceVersion tracks compatibility for future migrations

---

### 2. ArchiveMetadata

Summary statistics calculated when archive is created.

**Purpose**: Enable fast archive list display without loading full payment arrays.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `totalCount` | number | Yes | Total number of payment records | Non-negative integer |
| `paidCount` | number | Yes | Count of payments marked as paid | Non-negative integer, ≤ totalCount |
| `pendingCount` | number | Yes | Count of payments marked as pending | Non-negative integer, ≤ totalCount |
| `dateRange` | DateRange | Yes | Earliest and latest payment dates | See DateRange sub-entity |
| `storageSize` | number | Yes | Archive size in bytes | Positive integer |

**Example**:
```json
{
  "totalCount": 20,
  "paidCount": 15,
  "pendingCount": 5,
  "dateRange": {
    "earliest": "2025-10-01",
    "latest": "2025-10-31"
  },
  "storageSize": 12500
}
```

**Validation Rules**:
```typescript
const archiveMetadataSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  dateRange: dateRangeSchema,
  storageSize: z.number().int().positive(),
}).refine(
  data => data.paidCount + data.pendingCount === data.totalCount,
  { message: 'Paid + Pending must equal Total count' }
);
```

**Business Rules**:
- `paidCount + pendingCount` MUST equal `totalCount`
- `storageSize` calculated via `new Blob([JSON.stringify(archive)]).size`
- Date range is optional if archive has zero payments (edge case)

---

### 3. DateRange

Sub-entity representing the span of payment dates within an archive.

**Purpose**: Display archive time coverage (e.g., "Oct 1-31, 2025").

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `earliest` | string (ISO 8601 date) | Yes | Earliest payment date in archive | YYYY-MM-DD format |
| `latest` | string (ISO 8601 date) | Yes | Latest payment date in archive | YYYY-MM-DD format |

**Example**:
```json
{
  "earliest": "2025-10-01",
  "latest": "2025-10-31"
}
```

**Validation Rules**:
```typescript
const dateRangeSchema = z.object({
  earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
}).refine(
  data => new Date(data.earliest) <= new Date(data.latest),
  { message: 'Earliest must be before or equal to latest' }
);
```

**Business Rules**:
- Extracted from payment dates in archive, not archive creation date
- If archive has 1 payment, earliest === latest (same date)
- If archive has 0 payments, dateRange is `{ earliest: '', latest: '' }` (empty)

---

### 4. ArchiveIndex

Collection of all archive metadata for efficient listing.

**Purpose**: Load archive list UI without parsing all individual archives.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `version` | string | Yes | Schema version for migrations | Semantic versioning |
| `archives` | ArchiveSummary[] | Yes | Array of archive summaries | Sorted by createdAt desc |
| `totalSize` | number | Yes | Sum of all archive storage sizes | Positive integer, bytes |
| `lastModified` | string (ISO 8601) | Yes | When index was last updated | ISO 8601 date-time |

**Example**:
```json
{
  "version": "1.0.0",
  "archives": [
    {
      "id": "550e8400-...",
      "name": "October 2025",
      "createdAt": "2025-11-01T00:00:00.000Z",
      "paymentCount": 20,
      "paidCount": 15,
      "pendingCount": 5,
      "storageSize": 12500
    },
    {
      "id": "6ba7b810-...",
      "name": "September 2025",
      "createdAt": "2025-10-01T00:00:00.000Z",
      "paymentCount": 18,
      "paidCount": 18,
      "pendingCount": 0,
      "storageSize": 11200
    }
  ],
  "totalSize": 23700,
  "lastModified": "2025-11-01T00:00:00.000Z"
}
```

**Validation Rules**:
```typescript
const archiveIndexSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  archives: z.array(archiveSummarySchema),
  totalSize: z.number().int().positive(),
  lastModified: z.string().datetime(),
});
```

**Business Rules**:
- Archives sorted by `createdAt` descending (newest first)
- `totalSize` recalculated on every archive create/delete
- Index stored at localStorage key: `payplan_archive_index`
- Empty index (no archives) is valid with `archives: []`, `totalSize: 0`

---

### 5. ArchiveSummary

Lightweight archive representation for list display.

**Purpose**: Minimal data needed to show archive in list view without loading full archive.

**Attributes**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string (UUID v4) | Yes | Archive identifier | RFC 4122 format |
| `name` | string | Yes | Archive name | 1-100 characters |
| `createdAt` | string (ISO 8601) | Yes | Creation timestamp | ISO 8601 date-time |
| `paymentCount` | number | Yes | Total payment count | Non-negative integer |
| `paidCount` | number | Yes | Paid payment count | Non-negative integer |
| `pendingCount` | number | Yes | Pending payment count | Non-negative integer |
| `storageSize` | number | Yes | Archive size in bytes | Positive integer |

**Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "October 2025",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "paymentCount": 20,
  "paidCount": 15,
  "pendingCount": 5,
  "storageSize": 12500
}
```

**Validation Rules**:
```typescript
const archiveSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  paymentCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  storageSize: z.number().int().positive(),
});
```

**Business Rules**:
- Derived from full Archive entity (subset of fields)
- Used in ArchiveIndex for list rendering
- Clicking archive in list triggers full Archive load

---

## Data Relationships

```
ArchiveIndex (localStorage: payplan_archive_index)
  ├── version
  ├── archives: ArchiveSummary[]
  │     ├── id ──────────┐
  │     ├── name          │
  │     ├── createdAt     │
  │     ├── paymentCount  │
  │     ├── paidCount     │
  │     ├── pendingCount  │
  │     └── storageSize   │
  ├── totalSize           │
  └── lastModified        │
                          │
Archive (localStorage: payplan_archive_<id>)
  ├── id ◄───────────────┘ (1:1 relationship)
  ├── name
  ├── createdAt
  ├── sourceVersion
  ├── payments: PaymentStatusRecord[]  (from Feature 015)
  │     ├── paymentId
  │     ├── status
  │     └── timestamp
  └── metadata: ArchiveMetadata
        ├── totalCount
        ├── paidCount
        ├── pendingCount
        ├── dateRange
        │     ├── earliest
        │     └── latest
        └── storageSize
```

**Relationship Notes**:
- **1:1**: Each ArchiveSummary in index corresponds to exactly one Archive in localStorage
- **Index → Archive**: Archive loaded on-demand when user clicks summary in list
- **Archive → Payments**: Deep copy of PaymentStatusRecord[] from Feature 015
- **Synchronization**: Creating archive adds summary to index; deleting archive removes summary from index

---

## Storage Schema

### LocalStorage Keys

**Archive Index**:
- **Key**: `payplan_archive_index`
- **Value**: Serialized ArchiveIndex JSON
- **Size**: ~5KB for 50 archives

**Individual Archives**:
- **Key Pattern**: `payplan_archive_<uuid>`
- **Example**: `payplan_archive_550e8400-e29b-41d4-a716-446655440000`
- **Value**: Serialized Archive JSON
- **Size**: ~10-15KB per archive (20 payments)

**Total Storage Estimate**:
```
Archive Index: 5KB
50 Archives × 12KB each = 600KB
Feature 015 current statuses: 70KB
Total: ~675KB << 5MB browser limit ✅
```

### Serialization

**Write Pattern**:
```typescript
// 1. Create archive entity
const archive: Archive = { /* ... */ };

// 2. Serialize to JSON
const archiveJSON = JSON.stringify(archive);

// 3. Save individual archive
localStorage.setItem(`payplan_archive_${archive.id}`, archiveJSON);

// 4. Update index
const index = loadArchiveIndex();
index.archives.unshift({  // Add to beginning (newest first)
  id: archive.id,
  name: archive.name,
  createdAt: archive.createdAt,
  paymentCount: archive.metadata.totalCount,
  paidCount: archive.metadata.paidCount,
  pendingCount: archive.metadata.pendingCount,
  storageSize: archive.metadata.storageSize
});
index.totalSize += archive.metadata.storageSize;
index.lastModified = getCurrentTimestamp();

// 5. Save updated index
localStorage.setItem('payplan_archive_index', JSON.stringify(index));
```

**Read Pattern**:
```typescript
// Load archive list (fast - only reads index)
const indexJSON = localStorage.getItem('payplan_archive_index');
const index: ArchiveIndex = JSON.parse(indexJSON);
return index.archives;  // Array of summaries

// Load individual archive (on-demand)
const archiveJSON = localStorage.getItem(`payplan_archive_${archiveId}`);
const archive: Archive = JSON.parse(archiveJSON);
return archive;
```

---

## State Transitions

### Archive Lifecycle

```
                    ┌─────────────────┐
                    │  DOES NOT EXIST │
                    └─────────────────┘
                            │
                            │ createArchive(name)
                            │
                            ▼
                    ┌─────────────────┐
                    │     CREATED     │ ◄── Immutable state
                    └─────────────────┘
                            │
                            │ User action
                            │
                    ┌───────┴────────┐
                    │                │
          loadArchive()      deleteArchive()
                    │                │
                    ▼                ▼
            ┌─────────────┐  ┌─────────────┐
            │   VIEWED    │  │   DELETED   │
            └─────────────┘  └─────────────┘
                    │                │
                    │                └──► Removed from localStorage
                    │
            exportArchiveCSV()
                    │
                    ▼
            ┌─────────────┐
            │   EXPORTED  │
            └─────────────┘
```

**Allowed Operations**:
- **Does Not Exist → Created**: `createArchive(name)`
- **Created → Viewed**: `loadArchive(id)`
- **Created → Deleted**: `deleteArchive(id)` (with confirmation)
- **Created → Exported**: `exportArchiveCSV(id)`

**Forbidden Operations**:
- **Update Archive**: No `updateArchive()` method exists (immutability)
- **Modify Payments**: No edit operations on `archive.payments[]`
- **Un-delete Archive**: Deletion is permanent, no recovery

---

## Validation Summary

### Zod Schemas

**Archive**:
```typescript
import { z } from 'zod';
import { paymentStatusRecordSchema } from '../payment-status/validation';  // Feature 015

export const dateRangeSchema = z.object({
  earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
}).refine(
  data => new Date(data.earliest) <= new Date(data.latest),
  { message: 'Earliest must be before or equal to latest' }
);

export const archiveMetadataSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  dateRange: dateRangeSchema,
  storageSize: z.number().int().positive(),
}).refine(
  data => data.paidCount + data.pendingCount === data.totalCount,
  { message: 'Paid + Pending must equal Total count' }
);

export const archiveSchema = z.object({
  id: z.string().uuid('Must be a valid UUID v4'),
  name: z.string()
    .min(1, 'Archive name is required')
    .max(100, 'Archive name must be under 100 characters')
    .transform(name => name.trim()),
  createdAt: z.string().datetime('Must be ISO 8601 date-time'),
  sourceVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  payments: z.array(paymentStatusRecordSchema),
  metadata: archiveMetadataSchema,
});

export type Archive = z.infer<typeof archiveSchema>;
```

**ArchiveIndex**:
```typescript
export const archiveSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  paymentCount: z.number().int().nonnegative(),
  paidCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  storageSize: z.number().int().positive(),
});

export const archiveIndexSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semantic version'),
  archives: z.array(archiveSummarySchema),
  totalSize: z.number().int().nonnegative(),
  lastModified: z.string().datetime(),
});

export type ArchiveIndex = z.infer<typeof archiveIndexSchema>;
export type ArchiveSummary = z.infer<typeof archiveSummarySchema>;
```

**Type Guards**:
```typescript
export function isArchive(value: unknown): value is Archive {
  return archiveSchema.safeParse(value).success;
}

export function isArchiveIndex(value: unknown): value is ArchiveIndex {
  return archiveIndexSchema.safeParse(value).success;
}
```

---

## Error Handling

### Error Types

Following the Result<T, E> pattern from Feature 015:

```typescript
export type ArchiveErrorType =
  | 'Validation'      // Schema validation failed
  | 'QuotaExceeded'   // Storage limit reached
  | 'Security'        // localStorage disabled or blocked
  | 'Serialization'   // JSON.stringify/parse failed
  | 'NotFound'        // Archive ID doesn't exist
  | 'LimitReached';   // 50 archive limit reached

export interface ArchiveError {
  type: ArchiveErrorType;
  message: string;
  archiveId?: string;  // Optional: which archive caused error
}

export type Result<T, E = ArchiveError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Example Usage**:
```typescript
const result = archiveService.createArchive('October 2025');

if (!result.ok) {
  switch (result.error.type) {
    case 'Validation':
      showError('Invalid archive name');
      break;
    case 'QuotaExceeded':
      showWarning('Storage limit reached. Please delete old archives.');
      break;
    case 'LimitReached':
      showWarning('Maximum 50 archives allowed. Please delete old archives.');
      break;
    case 'Security':
      showError('Browser storage disabled. Enable in settings.');
      break;
    default:
      showError('Failed to create archive');
  }
  return;
}

// Success: show archive in list
showSuccess(`Archive "${result.value.name}" created successfully`);
```

---

## Constants

### Default Values

```typescript
export const ARCHIVE_INDEX_KEY = 'payplan_archive_index';
export const ARCHIVE_KEY_PREFIX = 'payplan_archive_';
export const ARCHIVE_SCHEMA_VERSION = '1.0.0';
export const MAX_ARCHIVES = 50;  // Hard limit (FR-017)
export const MAX_ARCHIVE_NAME_LENGTH = 100;  // FR-016

export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: 'Storage limit exceeded. Please delete old archives.',
  LIMIT_REACHED: 'Maximum 50 archives allowed. Please delete old archives.',
  SECURITY_ERROR: 'Browser storage is disabled or blocked.',
  VALIDATION_ERROR: 'Invalid archive data.',
  SERIALIZATION_ERROR: 'Failed to save archive.',
  NOT_FOUND: 'Archive not found.',
  NAME_REQUIRED: 'Archive name is required.',
  NAME_TOO_LONG: 'Archive name must be under 100 characters.',
} as const;
```

### Storage Limits

```typescript
// Estimated sizes (from research.md)
export const ESTIMATED_ARCHIVE_SIZE = 3300;  // bytes per archive (20 payments)
export const MAX_SAFE_ARCHIVES = 50;         // Target from FR-017
export const WARNING_THRESHOLD = 0.8;        // Warn at 80% capacity

// Browser limits (conservative estimate)
export const BROWSER_STORAGE_LIMIT = 5 * 1024 * 1024;  // 5MB
```

---

## Data Migrations

### Version History

**Version 1.0.0** (Initial Release):
- Basic archive creation and viewing
- Statistics calculation
- CSV export
- Archive deletion

**Future Versions** (Planned):
```typescript
// Version 1.1.0: Add archive notes (backward compatible)
interface ArchiveV1_1 extends Archive {
  notes?: string;  // Optional user notes about archive
}

// Version 2.0.0: Add date range filtering (breaking change)
interface ArchiveV2 {
  // ... existing fields
  filters: {
    dateFrom?: string;
    dateTo?: string;
  };
}
```

### Migration Strategy

```typescript
function migrateArchiveIndex(
  data: ArchiveIndex
): ArchiveIndex {
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
  return createDefaultIndex();
}
```

---

## Performance Considerations

### Size Calculations

**Per-Archive Overhead**:
```
Archive metadata: 200 bytes
20 payment records × 140 bytes = 2,800 bytes
JSON structure overhead: 300 bytes
Total: ~3,300 bytes (3.3KB)
```

**Index Overhead**:
```
Version + metadata: 100 bytes
50 archive summaries × 90 bytes = 4,500 bytes
Total: ~4,600 bytes (4.6KB)
```

**Target Capacity** (50 archives):
```
50 archives × 3.3KB = 165KB
+ Archive index: 5KB
+ Feature 015 current statuses: 70KB
= ~240KB total
<< 5MB browser limit ✅
```

### Read/Write Performance

**Operation Targets** (from Success Criteria):

| Operation | Target | Measured (Estimated) |
|-----------|--------|---------------------|
| Load archive list | <100ms | ~15ms (parse 5KB index) ✅ |
| Load single archive | <100ms | ~20ms (parse 12KB) ✅ |
| Create archive | <5s | ~50ms (snapshot + save) ✅ |
| Delete archive | <2s | ~10ms (remove key + update index) ✅ |
| Export archive CSV | <3s | ~100ms (serialize + download) ✅ |

---

## Integration Points

### With Feature 015 (Payment Status Tracking)

**Snapshot Creation**:
```typescript
function createArchive(name: string): Result<Archive, ArchiveError> {
  // 1. Load current payment statuses from Feature 015
  const statusResult = paymentStatusStorage.loadStatuses();
  if (!statusResult.ok) return statusResult;

  // 2. Extract payment records
  const payments = Array.from(statusResult.value.statuses.values());

  // 3. Create archive with deep copy
  const archive: Archive = {
    id: generateUUID(),
    name: validateAndSanitizeName(name),
    createdAt: getCurrentTimestamp(),
    sourceVersion: statusResult.value.version,
    payments: payments.map(p => ({ ...p })),  // Deep copy
    metadata: calculateMetadata(payments)
  };

  // 4. Save archive
  const saveResult = archiveStorage.saveArchive(archive);
  if (!saveResult.ok) return saveResult;

  // 5. Reset current statuses to pending (Feature 015)
  await paymentStatusService.clearAll();

  return { ok: true, value: archive };
}
```

### With Feature 014 (CSV Export)

**CSV Export Pattern**:
```typescript
function exportArchiveToCSV(archive: Archive): string {
  const rows = archive.payments.map(payment => ({
    // Existing payment fields (from Feature 014)
    description: payment.paymentId,  // Would join with actual payment data
    amount: 0,  // Would join with actual payment data
    date: '',   // Would join with actual payment data

    // Payment status fields (from Feature 015)
    paid_status: payment.status,
    paid_timestamp: payment.timestamp,

    // Archive metadata fields (NEW)
    archive_name: archive.name,
    archive_date: archive.createdAt.split('T')[0]
  }));

  return Papa.unparse(rows, {
    columns: [
      'description', 'amount', 'date',
      'paid_status', 'paid_timestamp',
      'archive_name', 'archive_date'
    ]
  });
}
```

---

## Next Steps

- **Phase 1 (continued)**: Generate API contracts in `contracts/`
- **Phase 1 (continued)**: Generate manual testing guide in `quickstart.md`
- **Phase 2**: Generate task breakdown in `tasks.md` (via `/speckit.tasks`)

---

**References**:
- Feature 015: Payment Status Tracking System (source data)
- Feature 014: CSV Export (integration pattern)
- [research.md](research.md): Technical decisions and rationale
- [spec.md](spec.md): Functional requirements (FR-001 through FR-020)
