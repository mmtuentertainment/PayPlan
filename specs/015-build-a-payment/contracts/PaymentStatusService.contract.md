# Contract: PaymentStatusService

**Feature**: 015-build-a-payment
**Component**: PaymentStatusService
**Type**: Service (Business Logic Layer)
**Location**: `frontend/src/lib/payment-status/PaymentStatusService.ts`

## Purpose

Provides business logic for payment status tracking operations. Orchestrates status changes, bulk operations, and integrates with storage layer. Enforces business rules and validation.

**Pattern**: Follows service layer pattern established in Feature 012 (separation of business logic from storage).

---

## Public API

### `class PaymentStatusService`

#### Constructor

```typescript
constructor(private storage: PaymentStatusStorage)
```

**Dependency Injection**: Accepts storage implementation (enables testing with mocks).

---

#### Methods

##### `markAsPaid(paymentId: string): Result<void, StorageError>`

Mark a payment as paid.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format
- Payment must exist in system (has been assigned an ID)

**Post-conditions**:
- Payment status is `'paid'`
- Timestamp is updated to current time
- Status is persisted to localStorage

**Returns**:
- `{ ok: true, value: void }` - Payment marked as paid
- `{ ok: false, error: StorageError }` - Operation failed

**Business Rules**:
- Idempotent: Marking as paid when already paid updates timestamp
- Validates paymentId format before storage operation

**Example**:
```typescript
const service = new PaymentStatusService(storage);
const result = service.markAsPaid(paymentId);

if (!result.ok) {
  showError(`Failed to mark payment as paid: ${result.error.message}`);
  return;
}

updateUI(paymentId, 'paid');
showSuccess('Payment marked as paid');
```

---

##### `markAsPending(paymentId: string): Result<void, StorageError>`

Mark a payment as pending (undo paid status).

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- Payment status is `'pending'`
- Timestamp is updated to current time
- Status is persisted to localStorage

**Returns**:
- `{ ok: true, value: void }` - Payment marked as pending
- `{ ok: false, error: StorageError }` - Operation failed

**Business Rules**:
- Supports undo workflow (FR-005: toggle functionality)
- Idempotent: Marking as pending when already pending updates timestamp

**Example**:
```typescript
// User accidentally marked wrong payment
const result = service.markAsPending(paymentId);

if (result.ok) {
  updateUI(paymentId, 'pending');
  showSuccess('Payment status reset to pending');
}
```

---

##### `toggleStatus(paymentId: string): Result<'paid' | 'pending', StorageError>`

Toggle payment status between paid and pending.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- If currently `'paid'`, becomes `'pending'`
- If currently `'pending'`, becomes `'paid'`
- Timestamp is updated to current time

**Returns**:
- `{ ok: true, value: 'paid' }` - Now marked as paid
- `{ ok: true, value: 'pending' }` - Now marked as pending
- `{ ok: false, error: StorageError }` - Toggle failed

**Business Rules**:
- Single-click toggle for UI convenience
- Returns new status for immediate UI update

**Example**:
```typescript
// Checkbox toggle handler
function handleToggle(paymentId: string) {
  const result = service.toggleStatus(paymentId);

  if (result.ok) {
    updateCheckbox(paymentId, result.value === 'paid');
  }
}
```

---

##### `getStatus(paymentId: string): Result<'paid' | 'pending', StorageError>`

Get the current status of a payment.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: 'paid' }` - Payment is marked as paid
- `{ ok: true, value: 'pending' }` - Payment is pending (or no record exists)
- `{ ok: false, error: StorageError }` - Failed to load status

**Business Rules**:
- Defaults to `'pending'` if no record exists (conservative default)
- Read operation does not trigger storage events

**Example**:
```typescript
const result = service.getStatus(paymentId);

if (result.ok) {
  renderPaymentRow(paymentId, result.value);
}
```

---

##### `bulkMarkAsPaid(paymentIds: string[]): Result<number, StorageError>`

Mark multiple payments as paid in a single operation.

**Pre-conditions**:
- All `paymentIds` must be valid UUID v4 format
- Array must not be empty

**Post-conditions**:
- All specified payments have status `'paid'`
- All have the same timestamp (operation time)
- Single storage write (batched)

**Returns**:
- `{ ok: true, value: number }` - Number of payments updated
- `{ ok: false, error: StorageError }` - Bulk operation failed (no changes made)

**Business Rules**:
- **Atomic operation**: All payments updated or none (transaction-like)
- Skips payments already marked as paid (counts them in return value)
- Single timestamp for entire batch (audit trail shows batch operation)

**Performance**:
- **Target**: 10 payments in <5 seconds (SC-004)
- **Method**: Batched storage write (not individual saves)

**Example**:
```typescript
const selectedIds = getSelectedPayments();  // ['id-1', 'id-2', 'id-3']
const result = service.bulkMarkAsPaid(selectedIds);

if (result.ok) {
  showSuccess(`Marked ${result.value} payments as paid`);
  refreshPaymentList();
}
```

---

##### `bulkMarkAsPending(paymentIds: string[]): Result<number, StorageError>`

Mark multiple payments as pending in a single operation (bulk undo).

**Pre-conditions**:
- All `paymentIds` must be valid UUID v4 format
- Array must not be empty

**Post-conditions**:
- All specified payments have status `'pending'`
- All have the same timestamp (operation time)
- Single storage write (batched)

**Returns**:
- `{ ok: true, value: number }` - Number of payments updated
- `{ ok: false, error: StorageError }` - Bulk operation failed

**Business Rules**:
- Same atomic guarantees as `bulkMarkAsPaid`
- Supports bulk undo workflow (FR-008)

**Example**:
```typescript
// User realizes they marked wrong batch
const result = service.bulkMarkAsPending(incorrectBatch);

if (result.ok) {
  showSuccess(`Reset ${result.value} payments to pending`);
}
```

---

##### `clearAll(): Result<number, StorageError>`

Clear all payment statuses (reset to defaults).

**Pre-conditions**:
- **User confirmation required** (caller responsibility - see FR-014)

**Post-conditions**:
- All payment status records are deleted
- localStorage key is removed
- Returns count of records cleared

**Returns**:
- `{ ok: true, value: number }` - Number of statuses cleared
- `{ ok: false, error: StorageError }` - Clear operation failed

**Business Rules**:
- **Irreversible operation**: No undo available
- Caller must show confirmation dialog before calling
- Returns 0 if no statuses existed (safe no-op)

**Example**:
```typescript
async function handleClearAll() {
  const confirmed = await showConfirmDialog({
    title: 'Clear All Payment Statuses?',
    message: 'This will reset all payments to pending. This cannot be undone.',
    confirmText: 'Clear All',
    cancelText: 'Cancel',
  });

  if (!confirmed) return;

  const result = service.clearAll();
  if (result.ok) {
    if (result.value === 0) {
      showInfo('No payment statuses to clear');
    } else {
      showSuccess(`Cleared ${result.value} payment statuses`);
      refreshPaymentList();
    }
  }
}
```

---

##### `getStatusWithTimestamp(paymentId: string): Result<PaymentStatusRecord | null, StorageError>`

Get full status record including timestamp.

**Pre-conditions**:
- `paymentId` must be valid UUID v4 format

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: PaymentStatusRecord }` - Full record found
- `{ ok: true, value: null }` - No record exists (payment never marked)
- `{ ok: false, error: StorageError }` - Failed to load

**Use Case**: Display "Paid on Oct 15, 2025 at 2:30 PM" (FR-017)

**Example**:
```typescript
const result = service.getStatusWithTimestamp(paymentId);

if (result.ok && result.value) {
  const { status, timestamp } = result.value;
  const formatted = formatTimestamp(timestamp);  // "Paid on Oct 15, 2025 at 2:30 PM"
  showPaymentDetails(paymentId, status, formatted);
}
```

---

##### `getPaidPayments(paymentIds: string[]): Result<Set<string>, StorageError>`

Get set of payment IDs that are marked as paid.

**Pre-conditions**:
- All `paymentIds` must be valid UUID v4 format

**Post-conditions**:
- No state changes (read-only operation)

**Returns**:
- `{ ok: true, value: Set<string> }` - Set of paid payment IDs
- `{ ok: false, error: StorageError }` - Failed to load statuses

**Use Case**: Filter pending payments for risk analysis (FR-006)

**Example**:
```typescript
const allPaymentIds = payments.map((p) => p.id);
const result = service.getPaidPayments(allPaymentIds);

if (result.ok) {
  const paidIds = result.value;
  const pendingPayments = payments.filter((p) => !paidIds.has(p.id));

  // Run risk analysis on pending payments only
  const risks = detectCollisions(pendingPayments);
}
```

---

## Validation

### Input Validation

All methods validate `paymentId` before storage operations:

```typescript
private validatePaymentId(id: string): Result<void, StorageError> {
  if (!z.string().uuid().safeParse(id).success) {
    return {
      ok: false,
      error: {
        type: 'Validation',
        message: 'Invalid payment ID format. Must be UUID v4.',
        paymentId: id,
      },
    };
  }
  return { ok: true, value: undefined };
}
```

**Validation Assertions**:
- ✅ Invalid UUID format returns Validation error
- ✅ Empty string returns Validation error
- ✅ Null/undefined returns Validation error

---

## Business Rules Summary

| Rule | Enforcement | Spec Reference |
|------|-------------|----------------|
| Status is toggle-able | `toggleStatus()`, `markAsPending()` | FR-005 |
| Timestamps update on every change | All mutation methods | FR-003 |
| Default status is pending | `getStatus()` returns 'pending' if no record | data-model.md |
| Bulk operations are atomic | `bulkMarkAsPaid/Pending` uses single write | SC-004 |
| Clear requires confirmation | Caller responsibility (documented) | FR-014 |
| Paid payments excluded from risk | `getPaidPayments()` enables filtering | FR-006 |

---

## Error Handling

### Error Propagation

Service layer propagates storage errors without transformation:

```typescript
markAsPaid(paymentId: string): Result<void, StorageError> {
  const validationResult = this.validatePaymentId(paymentId);
  if (!validationResult.ok) return validationResult;

  const record: PaymentStatusRecord = {
    paymentId,
    status: 'paid',
    timestamp: new Date().toISOString(),
  };

  const saveResult = this.storage.saveStatus(record);
  if (!saveResult.ok) return saveResult;  // Propagate storage error

  return { ok: true, value: undefined };
}
```

**Error Types** (inherited from PaymentStatusStorage):
- `Validation`: Invalid input data
- `QuotaExceeded`: Storage limit reached
- `Security`: localStorage disabled
- `Serialization`: JSON operation failed

---

## Integration Contract

### With React Hook (usePaymentStatus)

```typescript
function usePaymentStatus() {
  const service = useMemo(
    () => new PaymentStatusService(new PaymentStatusStorage()),
    []
  );

  const markAsPaid = useCallback(
    (paymentId: string) => {
      const result = service.markAsPaid(paymentId);
      if (!result.ok) {
        showError(result.error.message);
      }
      return result;
    },
    [service]
  );

  return { markAsPaid, /* other methods */ };
}
```

### With Risk Analysis Service

```typescript
class RiskAnalysisService {
  constructor(private paymentStatusService: PaymentStatusService) {}

  detectCollisions(payments: Payment[]): RiskWarning[] {
    // Filter out paid payments (FR-006)
    const allIds = payments.map((p) => p.id);
    const paidResult = this.paymentStatusService.getPaidPayments(allIds);

    if (!paidResult.ok) {
      console.warn('Failed to load payment statuses, analyzing all payments');
      return this.analyzePayments(payments);
    }

    const paidIds = paidResult.value;
    const pendingPayments = payments.filter((p) => !paidIds.has(p.id));

    // Existing collision detection logic
    return this.analyzePayments(pendingPayments);
  }
}
```

### With CSV Export Service

```typescript
class CSVExportService {
  constructor(private paymentStatusService: PaymentStatusService) {}

  exportPayments(payments: Payment[]): string {
    // Enrich payments with status data (FR-009, FR-010)
    const enriched = payments.map((payment) => {
      const statusResult = this.paymentStatusService.getStatusWithTimestamp(
        payment.id
      );

      const status = statusResult.ok && statusResult.value
        ? statusResult.value.status
        : 'pending';

      const timestamp = statusResult.ok && statusResult.value?.status === 'paid'
        ? statusResult.value.timestamp
        : '';

      return {
        ...payment,
        paid_status: status,
        paid_timestamp: timestamp,
      };
    });

    return Papa.unparse(enriched);
  }
}
```

---

## Performance Contract

| Operation | Target | Method |
|-----------|--------|--------|
| Single mark | <2s | SC-001 (user action to persistence) |
| Visual feedback | <200ms | SC-003 (mark → UI update) |
| Bulk 10 payments | <5s | SC-004 (efficiency target) |
| Get status | <50ms | Read from storage (no write overhead) |

---

## Testing Assertions

### Unit Tests Must Verify

**Status Operations**:
- ✅ `markAsPaid` creates record with correct status and timestamp
- ✅ `markAsPending` updates existing record to pending
- ✅ `toggleStatus` switches between paid/pending correctly
- ✅ `getStatus` returns 'pending' for non-existent records
- ✅ Idempotent operations update timestamp even if status unchanged

**Bulk Operations**:
- ✅ `bulkMarkAsPaid` updates all records atomically
- ✅ Failed bulk operation does not partially update
- ✅ Bulk operations use single storage write (spy on storage.bulkSave)
- ✅ Performance: 10 records bulk-marked in <5s

**Validation**:
- ✅ Invalid UUID returns Validation error
- ✅ Empty paymentId array throws error
- ✅ Validation happens before storage operations

**Error Handling**:
- ✅ Storage errors propagate correctly
- ✅ QuotaExceeded error handled gracefully
- ✅ Security error when localStorage disabled

**Integration**:
- ✅ Service works with mock storage for testing
- ✅ Service works with real PaymentStatusStorage

---

## Example Usage Patterns

### Basic Status Management

```typescript
const service = new PaymentStatusService(new PaymentStatusStorage());

// Mark payment as paid
await service.markAsPaid(paymentId);

// Check status
const status = service.getStatus(paymentId);
console.log(status.ok ? status.value : 'Unknown');

// Toggle status
const newStatus = service.toggleStatus(paymentId);
```

### Bulk Operations with UI Feedback

```typescript
async function handleBulkMarkAsPaid(selectedIds: string[]) {
  setLoading(true);

  const result = service.bulkMarkAsPaid(selectedIds);

  setLoading(false);

  if (!result.ok) {
    showError(`Failed: ${result.error.message}`);
    return;
  }

  showSuccess(`Marked ${result.value} payments as paid`);
  refreshPaymentList();
}
```

### Risk Analysis Integration

```typescript
function calculateRisks(payments: Payment[]): RiskWarning[] {
  const allIds = payments.map((p) => p.id);
  const paidResult = service.getPaidPayments(allIds);

  const paidIds = paidResult.ok ? paidResult.value : new Set<string>();
  const pendingPayments = payments.filter((p) => !paidIds.has(p.id));

  return detectCollisions(pendingPayments);
}
```

---

## References

- [PaymentStatusStorage.contract.md](PaymentStatusStorage.contract.md): Storage layer contract
- [data-model.md](../data-model.md): Entity definitions
- [research.md](../research.md): Business logic patterns
- [spec.md](../spec.md): Functional requirements (FR-001 through FR-017)
