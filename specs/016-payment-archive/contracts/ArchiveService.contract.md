# Contract: ArchiveService

**Feature**: 016-payment-archive-archive
**Component**: ArchiveService
**Type**: Service (Business Logic Layer)
**Location**: `frontend/src/lib/archive/ArchiveService.ts`

## Purpose

Provides business logic for payment history archive management. Orchestrates archive creation (including snapshotting current payment statuses from Feature 015), viewing, exporting, and deletion. Integrates with ArchiveStorage for persistence and PaymentStatusStorage for snapshot creation.

**Pattern**: Follows `PaymentStatusService` from Feature 015 (business logic layer above storage).

---

## Public API

### `class ArchiveService`

#### Constructor

```typescript
constructor(
  private archiveStorage: ArchiveStorage,
  private paymentStatusStorage: PaymentStatusStorage
)
```

**Dependencies**:
- `ArchiveStorage`: For archive persistence (Feature 016)
- `PaymentStatusStorage`: For snapshotting current statuses (Feature 015)

---

#### Methods

##### `createArchive(name: string): Result<Archive, ArchiveError>`

Create a new archive by snapshotting current payment statuses, saving to storage, and resetting current statuses to pending.

**Business Logic**:
1. Validate archive name (non-empty, Unicode support per FR-013)
2. Check archive limit (max 50 per FR-006)
3. Load current payment statuses from Feature 015
4. Verify at least 1 payment exists (per User Story 1 Acceptance Scenario 3)
5. Check for duplicate archive name and auto-append " (2)" if needed (FR-014)
6. Generate unique archive ID (UUID v4)
7. Calculate archive metadata (counts, date range per FR-010)
8. Create Archive entity with immutable snapshot of payments
9. Validate total storage size won't exceed 5MB (FR-015)
10. Save archive to storage
11. Update archive index
12. Reset current payment statuses to pending (FR-003)
13. Return created archive

**Pre-conditions**:
- `name` must be non-empty string
- At least 1 payment with status exists in Feature 015 storage
- Total archives < 50
- Total storage after archive < 5MB

**Post-conditions**:
- New archive exists in localStorage
- Archive index updated
- Current payment statuses reset to pending (Feature 015 cleared)

**Returns**:
- `{ ok: true, value: Archive }` - Archive created successfully
- `{ ok: false, error: ArchiveError }` - Creation failed

**Error Scenarios**:
| Error Type | When | Message |
|------------|------|---------|
| `Validation` | Empty/whitespace name | "Archive name cannot be empty" |
| `Validation` | No payments exist | "No payments to archive. Import or process payments first." |
| `LimitReached` | 50 archives exist | "Archive limit reached (50/50). Delete old archives to create new ones." |
| `QuotaExceeded` | Total size > 5MB | "Storage limit exceeded (5MB). Delete old archives to free space." |

**Performance**:
- **Target**: <5 seconds including name input (SC-001)
- **Breakdown**: Snapshot (50ms) + Save (100ms) + Reset (50ms) + UI (4.8s)

**Example**:
```typescript
const service = new ArchiveService(archiveStorage, paymentStatusStorage);

const result = service.createArchive('October 2025');
if (!result.ok) {
  if (result.error.type === 'LimitReached') {
    showError('Too many archives. Delete old ones first.');
  } else {
    showError(result.error.message);
  }
  return;
}

const archive = result.value;
console.log(`Archive "${archive.name}" created with ${archive.metadata.paymentCount} payments`);
```

---

##### `listArchives(): Result<ArchiveMetadata[], ArchiveError>`

Get list of all archives with metadata (for archive list view).

**Business Logic**:
1. Load archive index from storage
2. Return metadata array sorted by createdAt descending (newest first)

**Pre-conditions**:
- None (works even if no archives exist)

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: ArchiveMetadata[] }` - Array of archive metadata (may be empty)
- `{ ok: false, error: ArchiveError }` - Load failed

**Performance**:
- **Target**: <100ms for 20 archives (SC-004)
- **Method**: Loads only index, not full archive data

**Example**:
```typescript
const result = service.listArchives();
if (!result.ok) {
  console.error('Failed to load archives:', result.error);
  return;
}

const archives = result.value;
console.log(`${archives.length} archives found`);

// Display in UI
for (const metadata of archives) {
  console.log(`- ${metadata.name}: ${metadata.paidCount}/${metadata.paymentCount} paid`);
}
```

---

##### `getArchiveById(archiveId: string): Result<Archive, ArchiveError>`

Load full archive data including all payment records (for archive detail view).

**Business Logic**:
1. Validate archive ID format (UUID v4)
2. Load full archive from storage
3. Return immutable archive data

**Pre-conditions**:
- `archiveId` must be valid UUID v4 format
- Archive must exist in storage

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: Archive }` - Full archive with all payments
- `{ ok: false, error: ArchiveError }` - Load failed

**Error Scenarios**:
| Error Type | When | Message |
|------------|------|---------|
| `Validation` | Invalid UUID format | "Invalid archive ID format" |
| `NotFound` | Archive doesn't exist | "Archive not found" |
| `Corrupted` | Data is invalid | "This archive is corrupted and cannot be viewed" (FR-016) |

**Performance**:
- **Target**: <100ms for 50 payments (SC-003)

**Example**:
```typescript
const result = service.getArchiveById('550e8400-e29b-41d4-a716-446655440000');
if (!result.ok) {
  if (result.error.type === 'NotFound') {
    showError('Archive not found. It may have been deleted.');
  } else if (result.error.type === 'Corrupted') {
    showError('This archive is corrupted and cannot be viewed.');
  }
  return;
}

const archive = result.value;
console.log(`Archive: ${archive.name}`);
console.log(`Payments: ${archive.payments.length}`);
```

---

##### `calculateStatistics(archive: Archive): ArchiveSummary`

Calculate summary statistics for an archive (for statistics panel per User Story 3).

**Business Logic**:
1. Count total, paid, and pending payments
2. Calculate percentages
3. Determine date range from earliest to latest payment due dates
4. Return statistics object

**Pre-conditions**:
- `archive` must be valid Archive entity

**Post-conditions**:
- No state changes (pure calculation)

**Returns**:
- `ArchiveSummary` - Statistics object (never fails, always returns valid data)

**Calculation Rules**:
- Paid percentage: `(paidCount / totalCount) * 100`
- Pending percentage: `(pendingCount / totalCount) * 100`
- Date range: `{ start: min(dueDate), end: max(dueDate) }`
- Edge cases: 0 payments → percentages = 0%

**Performance**:
- **Target**: <10ms (pure JS calculation)

**Example**:
```typescript
const archive = /* loaded archive */;
const stats = service.calculateStatistics(archive);

console.log(`Total: ${stats.totalCount}`);
console.log(`Paid: ${stats.paidCount} (${stats.paidPercentage.toFixed(1)}%)`);
console.log(`Pending: ${stats.pendingCount} (${stats.pendingPercentage.toFixed(1)}%)`);
console.log(`Date Range: ${stats.dateRange.start} - ${stats.dateRange.end}`);
```

---

##### `deleteArchive(archiveId: string): Result<void, ArchiveError>`

Delete an archive permanently from storage (with confirmation expected from UI per FR-012).

**Business Logic**:
1. Validate archive ID format (UUID v4)
2. Delete archive from storage
3. Remove from archive index
4. Free storage space

**Pre-conditions**:
- `archiveId` must be valid UUID v4 format
- UI should have shown confirmation dialog (FR-012) before calling this method

**Post-conditions**:
- Archive removed from localStorage
- Archive removed from index
- Storage space freed

**Returns**:
- `{ ok: true, value: undefined }` - Archive deleted successfully
- `{ ok: false, error: ArchiveError }` - Deletion failed

**Warning**: This operation is irreversible. UI must confirm with user before calling (FR-012).

**Idempotency**: Deleting non-existent archive succeeds silently (no error).

**Performance**:
- **Target**: <3 seconds including confirmation dialog (SC-007)
- **Method**: Direct localStorage removal

**Example**:
```typescript
// After user confirms in UI
const result = service.deleteArchive('550e8400-e29b-41d4-a716-446655440000');
if (result.ok) {
  showSuccess('Archive deleted successfully');
} else {
  showError(`Failed to delete: ${result.error.message}`);
}
```

---

##### `exportArchiveToCSV(archive: Archive): Result<string, ArchiveError>`

Generate CSV export data for an archive including archive metadata columns (per User Story 4).

**Business Logic**:
1. Validate archive has payments (handle empty case)
2. Map payments to CSV rows with standard columns (from Feature 014):
   - provider, amount, currency, dueISO, autopay, paid_status, paid_timestamp
3. Add archive metadata columns (FR-011):
   - archive_name, archive_date
4. Use PapaParse to generate CSV string (Feature 014 integration)
5. Return CSV data

**Pre-conditions**:
- `archive` must be valid Archive entity

**Post-conditions**:
- No state changes (pure transformation)

**Returns**:
- `{ ok: true, value: string }` - CSV data ready for download
- `{ ok: false, error: ArchiveError }` - Export failed

**CSV Format**:
```csv
provider,amount,currency,dueISO,autopay,paid_status,paid_timestamp,archive_name,archive_date
Electricity Bill,150.00,USD,2025-10-15,false,paid,2025-10-14T14:30:00.000Z,October 2025,2025-10-17T14:30:00.000Z
Internet,80.00,USD,2025-10-20,true,pending,,October 2025,2025-10-17T14:30:00.000Z
```

**Performance**:
- **Target**: <3 seconds for 50 payments (SC-006)

**Example**:
```typescript
const archive = /* loaded archive */;
const result = service.exportArchiveToCSV(archive);
if (!result.ok) {
  showError(`Export failed: ${result.error.message}`);
  return;
}

const csvData = result.value;
const filename = generateFilename(archive.name, archive.createdAt);  // "payplan-archive-october-2025-2025-10-17-143000.csv"
downloadFile(csvData, filename);
```

---

##### `generateArchiveFilename(archiveName: string, createdAt: string): string`

Generate safe CSV filename from archive name and timestamp (per User Story 4 Acceptance Scenario 3).

**Business Logic**:
1. Slugify archive name (lowercase, spaces → hyphens, remove special chars)
2. Handle Unicode/emoji by removing or replacing (SC-009)
3. Parse ISO timestamp to YYYY-MM-DD-HHMMSS format
4. Combine: `payplan-archive-{slugified-name}-{timestamp}.csv`

**Pre-conditions**:
- `archiveName` must be non-empty string
- `createdAt` must be valid ISO 8601 timestamp

**Post-conditions**:
- No state changes (pure function)

**Returns**:
- Safe filename string (always succeeds)

**Slugification Rules**:
- Lowercase all characters
- Replace spaces with hyphens
- Remove Unicode/emoji characters
- Remove special characters except hyphens
- Collapse multiple hyphens to one
- Trim leading/trailing hyphens

**Example**:
```typescript
const filename = service.generateArchiveFilename('October 2025 💰', '2025-10-17T14:30:22.000Z');
// Result: "payplan-archive-october-2025-2025-10-17-143022.csv"

const filename2 = service.generateArchiveFilename('Paiements Octobre', '2025-10-17T09:15:00.000Z');
// Result: "payplan-archive-paiements-octobre-2025-10-17-091500.csv"
```

---

##### `ensureUniqueName(proposedName: string): Result<string, ArchiveError>`

Ensure archive name is unique by appending " (2)", " (3)", etc. if duplicate exists (FR-014).

**Business Logic**:
1. Load archive index
2. Check if `proposedName` exists
3. If unique: return as-is
4. If duplicate: find highest suffix number and increment
5. Return unique name

**Pre-conditions**:
- `proposedName` must be non-empty string

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: string }` - Unique archive name (may have suffix appended)
- `{ ok: false, error: ArchiveError }` - Failed to load index

**Duplication Handling**:
- "October 2025" → "October 2025" (if unique)
- "October 2025" → "October 2025 (2)" (if "October 2025" exists)
- "October 2025 (2)" → "October 2025 (3)" (if both exist)

**Example**:
```typescript
const result = service.ensureUniqueName('October 2025');
if (!result.ok) {
  console.error('Failed to check name:', result.error);
  return;
}

const uniqueName = result.value;  // May be "October 2025 (2)" if duplicate
console.log(`Using archive name: ${uniqueName}`);
```

---

## Error Types

Uses same `ArchiveError` type as ArchiveStorage (see ArchiveStorage contract).

**Additional Service-Level Errors**:
- `Validation`: "No payments to archive" when trying to archive empty schedule
- `Validation`: "Archive name cannot be empty" when name is whitespace-only

---

## Validation Assertions

### Unit Tests Must Verify

**Create Archive**:
- ✅ Valid name creates archive successfully
- ✅ Empty name throws Validation error
- ✅ Duplicate name gets " (2)" suffix (FR-014)
- ✅ No payments throws "No payments to archive" error
- ✅ 51st archive throws LimitReached error (FR-006)
- ✅ Archive > 5MB throws QuotaExceeded error (FR-015)
- ✅ Current statuses reset to pending after archive created (FR-003)
- ✅ Archive metadata calculated correctly (counts, date range)

**List Archives**:
- ✅ Empty storage returns empty array (no error)
- ✅ Multiple archives returned sorted by createdAt descending
- ✅ Performance: 20 archives load in <100ms (SC-004)

**Get Archive**:
- ✅ Valid ID returns full archive with all payments
- ✅ Invalid UUID throws Validation error
- ✅ Non-existent ID throws NotFound error
- ✅ Corrupted archive throws Corrupted error (FR-016)
- ✅ Performance: 50-payment archive loads in <100ms (SC-003)

**Calculate Statistics**:
- ✅ Correct totals, paid, pending counts
- ✅ Correct percentages (paid and pending sum to 100%)
- ✅ Correct date range (earliest to latest)
- ✅ Edge case: 0 payments → 0% / 0% (no division by zero)
- ✅ Edge case: All paid → 100% / 0%
- ✅ Edge case: All pending → 0% / 100%

**Delete Archive**:
- ✅ Valid ID deletes archive successfully
- ✅ Archive removed from storage and index
- ✅ Delete is idempotent (deleting twice doesn't error)
- ✅ Performance: <3 seconds (SC-007)

**Export CSV**:
- ✅ Standard columns present (provider, amount, etc.)
- ✅ Archive metadata columns present (archive_name, archive_date)
- ✅ Paid payments show timestamp, pending show empty
- ✅ All payment rows have same archive metadata
- ✅ Unicode archive names preserved in CSV data (SC-009)
- ✅ Performance: 50-payment export in <3 seconds (SC-006)

**Filename Generation**:
- ✅ Slugification works (spaces → hyphens, lowercase)
- ✅ Unicode/emoji removed safely
- ✅ Timestamp formatted correctly (YYYY-MM-DD-HHMMSS)
- ✅ Format: "payplan-archive-{name}-{timestamp}.csv"

**Unique Name Handling**:
- ✅ Unique name returned as-is
- ✅ Duplicate gets " (2)" appended
- ✅ Multiple duplicates get incrementing numbers (2, 3, 4, ...)
- ✅ Works with names already containing " (N)" suffix

---

## Integration Contract

### With Feature 015 (PaymentStatusStorage)

```typescript
// ArchiveService snapshots current statuses during archive creation
const statusResult = this.paymentStatusStorage.loadStatuses();
if (!statusResult.ok) return statusResult;

const currentStatuses = statusResult.value;
const payments = Array.from(currentStatuses.statuses.values());

// ... create archive with payments ...

// Reset current statuses after archiving (FR-003)
await this.paymentStatusStorage.clearAll();
```

**Dependencies**:
- `PaymentStatusStorage.loadStatuses()` - To snapshot current data
- `PaymentStatusStorage.clearAll()` - To reset after archiving
- `PaymentStatusRecord` type - For payment data structure

### With Feature 014 (CSV Export)

```typescript
// ArchiveService uses PapaParse from Feature 014 for CSV generation
import Papa from 'papaparse';

const rows = archive.payments.map((payment) => ({
  // Standard columns from Feature 014
  provider: payment.provider,
  amount: payment.amount,
  currency: payment.currency,
  dueISO: payment.dueDate,
  autopay: payment.autopay,
  paid_status: payment.status,
  paid_timestamp: payment.timestamp || '',
  // NEW: Archive metadata columns
  archive_name: archive.name,
  archive_date: archive.createdAt,
}));

const csvData = Papa.unparse(rows, { /* options */ });
```

### With React Hook (usePaymentArchives)

```typescript
// Hook uses Service for archive operations
function usePaymentArchives() {
  const service = useMemo(() => new ArchiveService(archiveStorage, paymentStatusStorage), []);

  const createArchive = async (name: string) => {
    const result = service.createArchive(name);
    if (!result.ok) {
      showError(result.error.message);
      return null;
    }
    return result.value;
  };

  const listArchives = () => {
    const result = service.listArchives();
    return result.ok ? result.value : [];
  };

  return { createArchive, listArchives, /* ... */ };
}
```

---

## Performance Contract

| Operation | Target | Success Criteria |
|-----------|--------|------------------|
| Create archive | <5s | SC-001 (includes UI time) |
| List archives (20) | <100ms | SC-004 |
| Get archive (50 payments) | <100ms | SC-003 |
| Calculate statistics | <10ms | Internal target (pure JS) |
| Delete archive | <3s | SC-007 (includes confirmation) |
| Export CSV (50 payments) | <3s | SC-006 |

---

## Business Rules

1. **Archive Immutability** (FR-007): Once created, archives cannot be modified. No update operations exist.
2. **50-Archive Limit** (FR-006): Hard limit enforced at service layer before storage.
3. **Storage Quota** (FR-015): 5MB total limit validated before archive creation.
4. **Current Status Reset** (FR-003): Creating archive ALWAYS resets Feature 015 statuses to pending.
5. **Duplicate Names** (FR-014): Automatically append " (2)", " (3)", etc. - never reject duplicate names.
6. **Empty Schedule** (User Story 1 Acceptance Scenario 3): Cannot create archive with 0 payments.
7. **Corrupted Archives** (FR-016): Show warning, allow deletion, don't crash app.

---

## References

- Feature 015: `PaymentStatusService.ts` (similar business logic pattern)
- Feature 014: CSV export utilities and PapaParse library
- [data-model.md](../data-model.md): Archive and ArchiveSummary entities
- [research.md](../research.md): Business logic design decisions
- [spec.md](../spec.md): User Stories 1-5 and Functional Requirements
- [ArchiveStorage.contract.md](./ArchiveStorage.contract.md): Storage layer API
