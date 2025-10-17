# Contract: PaymentStatusStorage

**Feature**: 015-build-a-payment
**Component**: PaymentStatusStorage
**Type**: Service (Storage Layer)
**Location**: `frontend/src/lib/payment-status/PaymentStatusStorage.ts`

## Purpose

Manages persistence of payment status data in browser localStorage. Provides CRUD operations for PaymentStatusCollection with validation, error handling, and storage size management.

**Pattern**: Follows `PreferenceStorageService` from Feature 012 (established localStorage abstraction).

---

## Public API

### `class PaymentStatusStorage`

#### Methods

##### `saveStatus(record: PaymentStatusRecord): Result<boolean, StorageError>`

Save or update a single payment status record.

**Pre-conditions**:
- `record` must be valid per `paymentStatusRecordSchema`
- Browser localStorage must be available

**Post-conditions**:
- Record is persisted in localStorage under key `payplan_payment_status`
- Collection metadata (`totalSize`, `lastModified`) is updated
- Storage size is recalculated

**Returns**:
- `{ ok: true, value: true }` - Status saved successfully
- `{ ok: true, value: false }` - Status already exists with same value (no-op)
- `{ ok: false, error: StorageError }` - Save failed (see error types below)

**Side Effects**:
- Triggers `storage` event for cross-tab synchronization
- Updates localStorage immediately (synchronous write)

**Example**:
```typescript
const storage = new PaymentStatusStorage();
const record: PaymentStatusRecord = {
  paymentId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'paid',
  timestamp: new Date().toISOString(),
};

const result = storage.saveStatus(record);
if (result.ok) {
  console.log('Status saved:', result.value);
} else {
  console.error('Save failed:', result.error.message);
}
```

---

##### `loadStatuses(): Result<PaymentStatusCollection, StorageError>`

Load all payment status records from localStorage.

**Pre-conditions**:
- None (works even if no data exists)

**Post-conditions**:
- Returns all stored status records as Map
- Returns default empty collection if no data exists
- Validates and migrates schema if version mismatch

**Returns**:
- `{ ok: true, value: PaymentStatusCollection }` - Loaded successfully
- `{ ok: false, error: StorageError }` - Load failed (corrupted data, security error)

**Fallback Behavior**:
- If data is corrupted: Clear storage, return empty collection
- If version incompatible: Attempt migration or return empty collection
- If localStorage disabled: Return Security error

**Performance**:
- **Target**: <100ms for 500 records (from NFR-001 in Feature 012)
- **Measured**: ~5-10ms in similar Feature 012 implementation

**Example**:
```typescript
const result = storage.loadStatuses();
if (!result.ok) {
  console.error('Load failed:', result.error);
  return;
}

const collection = result.value;
const paidCount = Array.from(collection.statuses.values())
  .filter((r) => r.status === 'paid').length;

console.log(`${paidCount} payments marked as paid`);
```

---

##### `getStatus(paymentId: string): Result<PaymentStatusRecord | null, StorageError>`

Get the status record for a specific payment.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- Returns the status record if exists
- Returns null if payment has no status recorded

**Returns**:
- `{ ok: true, value: PaymentStatusRecord }` - Status found
- `{ ok: true, value: null }` - No status recorded (default: pending)
- `{ ok: false, error: StorageError }` - Load failed

**Example**:
```typescript
const result = storage.getStatus('550e8400-e29b-41d4-a716-446655440000');

if (!result.ok) {
  console.error('Failed to get status:', result.error);
  return;
}

const status = result.value?.status ?? 'pending';  // Default to pending
console.log('Payment status:', status);
```

---

##### `deleteStatus(paymentId: string): Result<boolean, StorageError>`

Remove a payment status record from storage.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- Record is removed from collection
- Collection metadata is updated
- Storage size is recalculated

**Returns**:
- `{ ok: true, value: true }` - Status deleted
- `{ ok: true, value: false }` - Status didn't exist (no-op)
- `{ ok: false, error: StorageError }` - Delete failed

**Example**:
```typescript
const result = storage.deleteStatus(paymentId);
if (result.ok && result.value) {
  console.log('Status cleared');
}
```

---

##### `bulkSaveStatuses(records: PaymentStatusRecord[]): Result<number, StorageError>`

Save multiple payment status records in a single operation.

**Pre-conditions**:
- All `records` must be valid per `paymentStatusRecordSchema`
- Total collection size after save must not exceed browser limits

**Post-conditions**:
- All records are persisted atomically (all or nothing)
- Collection metadata is updated once
- Single `storage` event triggered (not one per record)

**Returns**:
- `{ ok: true, value: number }` - Number of records saved (0 if all were no-ops)
- `{ ok: false, error: StorageError }` - Save failed, no records persisted

**Performance**:
- **Target**: 10 records in <5 seconds (from SC-004)
- **Measured**: ~50ms for 10 records (batched write)

**Example**:
```typescript
const records = [
  { paymentId: 'id-1', status: 'paid', timestamp: now() },
  { paymentId: 'id-2', status: 'paid', timestamp: now() },
  { paymentId: 'id-3', status: 'paid', timestamp: now() },
];

const result = storage.bulkSaveStatuses(records);
if (result.ok) {
  console.log(`Saved ${result.value} payment statuses`);
}
```

---

##### `clearAll(): Result<boolean, StorageError>`

Clear all payment status records from localStorage.

**Pre-conditions**:
- None

**Post-conditions**:
- localStorage key `payplan_payment_status` is removed
- All status data is permanently deleted

**Returns**:
- `{ ok: true, value: true }` - Cleared successfully
- `{ ok: false, error: StorageError }` - Clear failed

**Warning**: This operation is irreversible. Caller should confirm with user (see FR-014).

**Example**:
```typescript
// After user confirmation
const result = storage.clearAll();
if (result.ok) {
  console.log('All payment statuses cleared');
}
```

---

##### `calculateSize(): number`

Calculate the current storage size in bytes.

**Pre-conditions**:
- None (safe to call anytime)

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- Size in bytes of serialized PaymentStatusCollection

**Performance**:
- **Target**: <50ms (from data-model.md)
- **Method**: JSON.stringify + Blob.size (accurate UTF-8 byte count)

**Example**:
```typescript
const sizeBytes = storage.calculateSize();
const sizeKB = (sizeBytes / 1024).toFixed(2);
console.log(`Storage usage: ${sizeKB} KB`);

if (sizeBytes > WARNING_THRESHOLD) {
  showWarning('Storage limit approaching');
}
```

---

## Error Types

### `StorageError`

```typescript
export type StorageErrorType =
  | 'Validation'      // Invalid data format
  | 'QuotaExceeded'   // Browser storage limit reached
  | 'Security'        // localStorage disabled or blocked
  | 'Serialization';  // JSON.stringify/parse failed

export interface StorageError {
  type: StorageErrorType;
  message: string;
  paymentId?: string;  // Optional: which payment caused error
}
```

**Error Scenarios**:

| Error Type | When It Occurs | Recovery Strategy |
|------------|----------------|-------------------|
| `Validation` | Invalid UUID, status, or timestamp | Fix data, retry |
| `QuotaExceeded` | Storage size exceeds browser limit | Clear old statuses, warn user |
| `Security` | localStorage disabled in browser | Show error, suggest enabling |
| `Serialization` | Circular reference or invalid JSON | Reset storage, log error |

---

## Constants

```typescript
export const STORAGE_KEY = 'payplan_payment_status';
export const SCHEMA_VERSION = '1.0.0';
export const BROWSER_STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
export const WARNING_THRESHOLD = 0.8 * BROWSER_STORAGE_LIMIT; // 4MB
```

---

## Validation Assertions

### Unit Tests Must Verify

**Save Operations**:
- ✅ Valid record is saved to localStorage
- ✅ Invalid paymentId throws Validation error
- ✅ Invalid status enum throws Validation error
- ✅ Invalid timestamp throws Validation error
- ✅ Collection metadata updates (totalSize, lastModified)
- ✅ Storage event is triggered for cross-tab sync

**Load Operations**:
- ✅ Empty localStorage returns empty collection
- ✅ Valid data is deserialized correctly
- ✅ Corrupted JSON is handled (clear + return empty)
- ✅ Version mismatch triggers migration
- ✅ Incompatible version resets to defaults
- ✅ Performance: 500 records load in <100ms

**Bulk Operations**:
- ✅ Multiple records saved atomically (all or nothing)
- ✅ Single storage event triggered (not one per record)
- ✅ Performance: 10 records save in <5s (target: <50ms)

**Error Handling**:
- ✅ QuotaExceeded error when storage limit reached
- ✅ Security error when localStorage disabled
- ✅ Graceful degradation for all error types

**Size Calculations**:
- ✅ calculateSize() returns accurate byte count
- ✅ Size recalculated on every save
- ✅ Size matches actual localStorage usage (within 5%)

---

## Integration Contract

### With PaymentStatusService

```typescript
// Service depends on Storage for persistence
class PaymentStatusService {
  constructor(private storage: PaymentStatusStorage) {}

  markAsPaid(paymentId: string): Result<void, StorageError> {
    const record: PaymentStatusRecord = {
      paymentId,
      status: 'paid',
      timestamp: new Date().toISOString(),
    };
    return this.storage.saveStatus(record);
  }
}
```

### With React Hook (usePaymentStatus)

```typescript
// Hook uses Storage for external store pattern
function usePaymentStatus() {
  const storage = useMemo(() => new PaymentStatusStorage(), []);

  const getSnapshot = () => {
    const result = storage.loadStatuses();
    return result.ok ? result.value : createDefaultCollection();
  };

  const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  };

  return useSyncExternalStore(subscribe, getSnapshot);
}
```

---

## Performance Contract

| Operation | Target | Success Criteria |
|-----------|--------|------------------|
| Load 500 records | <100ms | NFR-001 (Feature 012 standard) |
| Save single record | <200ms | SC-003 (visual feedback) |
| Bulk save 10 records | <5s | SC-004 (efficiency gain) |
| Calculate size | <50ms | data-model.md spec |

---

## Browser Compatibility

**Supported**:
- ✅ Chrome/Edge 90+ (localStorage + storage events)
- ✅ Firefox 88+ (localStorage + storage events)
- ✅ Safari 14+ (localStorage + storage events)

**Fallback**:
- ❌ Private/Incognito mode with localStorage disabled → Security error
- ❌ Older browsers without localStorage → Security error

---

## References

- Feature 012: `PreferenceStorageService.ts` (established pattern)
- [data-model.md](../data-model.md): Entity definitions
- [research.md](../research.md): localStorage best practices
- MDN: localStorage API (2025)
- W3C: Web Storage specification
