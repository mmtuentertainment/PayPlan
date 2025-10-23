# Contract: ArchiveStorage

**Feature**: 016-payment-archive-archive
**Component**: ArchiveStorage
**Type**: Service (Storage Layer)
**Location**: `frontend/src/lib/archive/ArchiveStorage.ts`

## Purpose

Manages persistence of payment history archives in browser localStorage using a two-tier structure (archive index + individual archives). Provides CRUD operations for Archive entities with validation, error handling, and storage quota management.

**Pattern**: Follows `PaymentStatusStorage` from Feature 015 and `PreferenceStorageService` from Feature 012 (established localStorage abstraction).

---

## Public API

### `class ArchiveStorage`

#### Methods

##### `saveArchive(archive: Archive): Result<void, ArchiveError>`

Save a new archive to localStorage and update the archive index.

**Pre-conditions**:
- `archive` must be valid per `archiveSchema`
- Archive ID must be unique (not already exist)
- Total archives < 50 (hard limit per FR-006)
- Total storage after save < 5MB (per FR-015)

**Post-conditions**:
- Archive is persisted under key `payplan:archive:{archiveId}`
- Archive index is updated with new metadata
- Index `lastModified` is updated

**Returns**:
- `{ ok: true, value: undefined }` - Archive saved successfully
- `{ ok: false, error: ArchiveError }` - Save failed (see error types below)

**Side Effects**:
- Triggers `storage` event for cross-tab synchronization (FR-017)
- Updates localStorage immediately (synchronous write)
- Creates two localStorage entries (archive + updated index)

**Example**:
```typescript
const storage = new ArchiveStorage();
const archive: Archive = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'October 2025',
  createdAt: '2025-10-17T14:30:00.000Z',
  payments: [ /* payment records */ ],
  metadata: { /* calculated metadata */ },
};

const result = storage.saveArchive(archive);
if (result.ok) {
  console.log('Archive saved successfully');
} else {
  console.error('Save failed:', result.error.message);
}
```

---

##### `loadArchive(archiveId: string): Result<Archive, ArchiveError>`

Load a specific archive from localStorage by ID.

**Pre-conditions**:
- `archiveId` must be valid UUID v4 format
- Archive must exist in index

**Post-conditions**:
- Returns full archive with all payment records
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: Archive }` - Archive loaded successfully
- `{ ok: false, error: ArchiveError }` - Load failed (not found, corrupted, security error)

**Fallback Behavior**:
- If archive key doesn't exist: Return NotFound error
- If data is corrupted: Mark archive as corrupted, return Corrupted error
- If localStorage disabled: Return Security error

**Performance**:
- **Target**: <100ms for 50 payments (SC-003)
- **Method**: Direct localStorage.getItem + JSON.parse + validation

**Example**:
```typescript
const result = storage.loadArchive('550e8400-e29b-41d4-a716-446655440000');
if (!result.ok) {
  console.error('Load failed:', result.error);
  return;
}

const archive = result.value;
console.log(`${archive.name}: ${archive.metadata.paymentCount} payments`);
```

---

##### `loadArchiveIndex(): Result<ArchiveIndex, ArchiveError>`

Load the archive index containing metadata for all archives.

**Pre-conditions**:
- None (works even if no archives exist)

**Post-conditions**:
- Returns index with all archive metadata
- Returns default empty index if no data exists
- Validates and migrates schema if version mismatch

**Returns**:
- `{ ok: true, value: ArchiveIndex }` - Index loaded successfully
- `{ ok: false, error: ArchiveError }` - Load failed (corrupted, security error)

**Fallback Behavior**:
- If index doesn't exist: Return empty index (first run)
- If data is corrupted: Clear index, return empty index
- If version incompatible: Attempt migration or return empty index

**Performance**:
- **Target**: <100ms for 20 archives (SC-004)
- **Measured**: ~5-10ms (index is lightweight, only metadata)

**Example**:
```typescript
const result = storage.loadArchiveIndex();
if (!result.ok) {
  console.error('Load index failed:', result.error);
  return;
}

const index = result.value;
console.log(`${index.archives.length} archives found`);

// Display archive list
for (const metadata of index.archives) {
  console.log(`- ${metadata.name} (${metadata.paymentCount} payments)`);
}
```

---

##### `deleteArchive(archiveId: string): Result<void, ArchiveError>`

Delete an archive and remove it from the index.

**Pre-conditions**:
- `archiveId` must be valid UUID v4 format
- Archive should exist (but delete is idempotent if not)

**Post-conditions**:
- Archive key removed from localStorage
- Archive removed from index
- Index `lastModified` is updated
- Storage space is freed

**Returns**:
- `{ ok: true, value: undefined }` - Archive deleted successfully
- `{ ok: false, error: ArchiveError }` - Delete failed

**Side Effects**:
- Triggers `storage` event for cross-tab synchronization
- Updates localStorage immediately (synchronous operation)
- Removes two entries (archive + updates index)

**Idempotency**: Deleting non-existent archive succeeds silently (returns ok: true)

**Example**:
```typescript
const result = storage.deleteArchive('550e8400-e29b-41d4-a716-446655440000');
if (result.ok) {
  console.log('Archive deleted');
} else {
  console.error('Delete failed:', result.error);
}
```

---

##### `updateIndex(archiveMetadata: ArchiveMetadata): Result<void, ArchiveError>`

Add or update archive metadata in the index.

**Pre-conditions**:
- `archiveMetadata` must be valid per `archiveMetadataSchema`
- Archive ID must match an existing archive OR be a new archive

**Post-conditions**:
- Index updated with new/updated metadata
- Index `lastModified` timestamp updated
- Archive order may change (sorted by createdAt desc)

**Returns**:
- `{ ok: true, value: undefined }` - Index updated
- `{ ok: false, error: ArchiveError }` - Update failed

**Internal Method**: Typically called by `saveArchive()`, not exposed to Service layer directly.

**Example**:
```typescript
const metadata: ArchiveMetadata = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'October 2025',
  createdAt: '2025-10-17T14:30:00.000Z',
  paymentCount: 15,
  paidCount: 8,
  pendingCount: 7,
};

const result = storage.updateIndex(metadata);
if (result.ok) {
  console.log('Index updated');
}
```

---

##### `removeFromIndex(archiveId: string): Result<void, ArchiveError>`

Remove archive metadata from the index (does not delete archive itself).

**Pre-conditions**:
- `archiveId` must be valid UUID v4 format

**Post-conditions**:
- Metadata removed from index.archives array
- Index `lastModified` updated

**Returns**:
- `{ ok: true, value: undefined }` - Removed from index
- `{ ok: false, error: ArchiveError }` - Update failed

**Internal Method**: Typically called by `deleteArchive()`, not exposed directly.

**Idempotency**: Removing non-existent archive from index succeeds silently.

**Example**:
```typescript
const result = storage.removeFromIndex('550e8400-e29b-41d4-a716-446655440000');
```

---

##### `calculateTotalSize(): number`

Calculate total storage size of all archives + index in bytes.

**Pre-conditions**:
- None (safe to call anytime)

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- Total size in bytes of all archive data + index

**Performance**:
- **Target**: <50ms for 50 archives
- **Method**: Sum of Blob sizes for each archive key + index key

**Example**:
```typescript
const sizeBytes = storage.calculateTotalSize();
const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
console.log(`Total archive storage: ${sizeMB} MB`);

const LIMIT = 5 * 1024 * 1024; // 5MB
if (sizeBytes > LIMIT * 0.8) {
  showWarning('Storage limit approaching (80%)');
}
```

---

## Error Types

### `ArchiveError`

```typescript
export type ArchiveErrorType =
  | 'Validation'      // Invalid data format
  | 'QuotaExceeded'   // Browser storage limit reached (5MB)
  | 'LimitReached'    // 50-archive hard limit reached
  | 'NotFound'        // Archive doesn't exist
  | 'Corrupted'       // Archive data is corrupted
  | 'Security'        // localStorage disabled or blocked
  | 'Serialization';  // JSON.stringify/parse failed

export interface ArchiveError {
  type: ArchiveErrorType;
  message: string;
  archiveId?: string;  // Optional: which archive caused error
}
```

**Error Scenarios**:

| Error Type | When It Occurs | Recovery Strategy |
|------------|----------------|-------------------|
| `Validation` | Invalid UUID, name, or structure | Fix data, retry |
| `QuotaExceeded` | Total size exceeds 5MB | Delete old archives, warn user (FR-015) |
| `LimitReached` | 50 archives already exist | Delete old archives (FR-006) |
| `NotFound` | Archive ID doesn't exist | Check index, handle gracefully |
| `Corrupted` | Invalid JSON or schema | Show warning, allow deletion (FR-016) |
| `Security` | localStorage disabled | Show error, suggest enabling |
| `Serialization` | Circular reference or invalid JSON | Log error, reset if needed |

---

## Constants

```typescript
export const ARCHIVE_INDEX_KEY = 'payplan:archive:index';
export const ARCHIVE_KEY_PREFIX = 'payplan:archive:';
export const SCHEMA_VERSION = '1.0.0';
export const MAX_ARCHIVES = 50;  // FR-006 hard limit
export const TOTAL_STORAGE_LIMIT = 5 * 1024 * 1024;  // 5MB (FR-015)
export const WARNING_THRESHOLD = 0.8 * TOTAL_STORAGE_LIMIT;  // 4MB
```

---

## Validation Assertions

### Unit Tests Must Verify

**Save Operations**:
- ✅ Valid archive is saved to localStorage with correct key
- ✅ Archive index is updated with new metadata
- ✅ Invalid archive structure throws Validation error
- ✅ Duplicate archive ID throws error (no overwrites)
- ✅ 51st archive throws LimitReached error (FR-006)
- ✅ Archive exceeding 5MB total throws QuotaExceeded error (FR-015)
- ✅ Storage event is triggered for cross-tab sync

**Load Operations**:
- ✅ Valid archive is deserialized correctly with all payments
- ✅ Non-existent archive ID returns NotFound error
- ✅ Corrupted JSON returns Corrupted error (not crash)
- ✅ Empty localStorage returns empty index (first run)
- ✅ Performance: 50-payment archive loads in <100ms (SC-003)
- ✅ Performance: 20-archive index loads in <100ms (SC-004)

**Index Operations**:
- ✅ Index updated atomically when archive saved
- ✅ Index ordered by createdAt descending (newest first)
- ✅ Index contains accurate metadata (counts match archive)
- ✅ Corrupted index is reset to defaults (graceful recovery)

**Delete Operations**:
- ✅ Archive key removed from localStorage
- ✅ Archive removed from index
- ✅ Delete is idempotent (deleting twice doesn't error)
- ✅ Storage size decreases after delete

**Size Calculations**:
- ✅ calculateTotalSize() returns accurate byte count
- ✅ Total size includes all archives + index
- ✅ Size calculation completes in <50ms for 50 archives

**Error Handling**:
- ✅ Security error when localStorage disabled
- ✅ QuotaExceeded error when 5MB limit reached
- ✅ LimitReached error when 50 archives exist
- ✅ NotFound error for invalid archive ID
- ✅ Corrupted archive handled gracefully (FR-016)

---

## Integration Contract

### With ArchiveService

```typescript
// Service depends on Storage for persistence
class ArchiveService {
  constructor(
    private archiveStorage: ArchiveStorage,
    private paymentStatusStorage: PaymentStatusStorage
  ) {}

  createArchive(name: string): Result<Archive, ArchiveError> {
    // Snapshot current payment statuses
    const statusResult = this.paymentStatusStorage.loadStatuses();
    if (!statusResult.ok) return statusResult;

    // Create archive entity
    const archive = this.buildArchive(name, statusResult.value);

    // Save archive
    const saveResult = this.archiveStorage.saveArchive(archive);
    if (!saveResult.ok) return saveResult;

    // Reset current statuses (Feature 015 integration)
    this.paymentStatusStorage.clearAll();

    return { ok: true, value: archive };
  }
}
```

### With React Hook (usePaymentArchives)

```typescript
// Hook uses Storage for archive list subscription
function usePaymentArchives() {
  const storage = useMemo(() => new ArchiveStorage(), []);

  const getSnapshot = () => {
    const result = storage.loadArchiveIndex();
    return result.ok ? result.value.archives : [];
  };

  const subscribe = (callback: () => void) => {
    const handler = (e: StorageEvent) => {
      if (e.key === ARCHIVE_INDEX_KEY) callback();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  };

  return useSyncExternalStore(subscribe, getSnapshot);
}
```

---

## Performance Contract

| Operation | Target | Success Criteria |
|-----------|--------|------------------|
| Load archive index (20 archives) | <100ms | SC-004 |
| Load single archive (50 payments) | <100ms | SC-003 |
| Save archive | <5s | SC-001 (includes UI interaction) |
| Delete archive | <3s | SC-007 |
| Calculate total size (50 archives) | <50ms | Internal target |

---

## Storage Structure

### Two-Tier Architecture

**Archive Index** (loaded for list views):
```typescript
// localStorage key: "payplan:archive:index"
{
  "version": "1.0.0",
  "archives": [
    {
      "id": "550e8400-...",
      "name": "October 2025",
      "createdAt": "2025-10-17T14:30:00.000Z",
      "paymentCount": 15,
      "paidCount": 8,
      "pendingCount": 7
    },
    // ... more archives
  ],
  "lastModified": "2025-10-17T14:30:00.000Z"
}
```

**Individual Archive** (loaded for detail views):
```typescript
// localStorage key: "payplan:archive:550e8400-..."
{
  "id": "550e8400-...",
  "name": "October 2025",
  "createdAt": "2025-10-17T14:30:00.000Z",
  "payments": [
    {
      "paymentId": "payment-id-1",
      "status": "paid",
      "timestamp": "2025-10-14T14:30:00.000Z",
      // ... original payment details
    },
    // ... more payments
  ],
  "metadata": {
    "paymentCount": 15,
    "paidCount": 8,
    "pendingCount": 7,
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-10-31"
    }
  }
}
```

**Benefits**:
- Fast list loading (only index, not all archives)
- Lazy loading for detail views
- Easy cross-tab sync (watch index key)
- Efficient storage (no duplicate metadata)

---

## Browser Compatibility

**Supported**:
- ✅ Chrome/Edge 90+ (localStorage + storage events)
- ✅ Firefox 88+ (localStorage + storage events)
- ✅ Safari 14+ (localStorage + storage events, 5MB+ quota)

**Fallback**:
- ❌ Private/Incognito mode with localStorage disabled → Security error
- ❌ Older browsers without localStorage → Security error
- ⚠️ Safari <14: May have smaller localStorage quota → Adjust MAX_ARCHIVES if needed

---

## References

- Feature 015: `PaymentStatusStorage.ts` (similar pattern)
- Feature 012: `PreferenceStorageService.ts` (established pattern)
- [data-model.md](../data-model.md): Archive entity definitions
- [research.md](../research.md): Two-tier storage architecture
- [spec.md](../spec.md): Functional requirements FR-001 through FR-020
- MDN: localStorage API (2025)
- W3C: Web Storage specification
