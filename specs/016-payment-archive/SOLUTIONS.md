# Feature 016: Clarification Solutions

**Generated**: 2025-10-17
**Status**: ✅ RESOLVED
**Based on**: Codebase analysis of Features 014 and 015

---

## 🔍 Codebase Analysis Summary

### Payment Data Structure

**Location**: `frontend/src/types/csvExport.ts`

**Current `PaymentRecord` interface** (Feature 014):
```typescript
export interface PaymentRecord {
  id?: string;               // UUID v4 (Feature 015)
  provider: string;          // "Klarna", "Affirm", etc.
  amount: number;            // 45.00
  currency: string;          // "USD", "EUR"
  dueISO: string;           // "2025-10-14"
  autopay: boolean;         // true/false
  risk_type?: string;       // Optional
  risk_severity?: string;   // Optional
  risk_message?: string;    // Optional
  paid_status?: 'paid' | 'pending';    // Feature 015 - runtime only
  paid_timestamp?: string;  // Feature 015 - runtime only
}
```

**Data Flow**:
1. Backend API returns `PlanResponse.normalized[]` (provider, amount, dueDate, autopay)
2. `Home.tsx` transforms to `PaymentRecord[]` with UUIDs via `generatePaymentId()`
3. Feature 015 tracks status separately in `PaymentStatusStorage` (key: `payplan_payment_status`)
4. CSV export merges payment data + status data at export time

### Storage Key Pattern

**Feature 015 Constant** (`frontend/src/lib/payment-status/constants.ts`):
```typescript
export const STORAGE_KEY = 'payplan_payment_status';  // UNDERSCORES
```

**Pattern**: `payplan_{feature}` with underscores, not colons

### CSV Export Implementation

**Location**: `frontend/src/services/csvExportService.ts`

**PapaParse usage**:
```typescript
export function generateCSV(rows: CSVRow[]): string {
  return Papa.unparse(rows, {
    quotes: true,
    delimiter: ',',
    newline: '\r\n',
    header: true
  });
}
```

**Filename format**: `payplan-export-{YYYY-MM-DD-HHMMSS}.csv`

---

## ✅ Solutions to Critical Issues

### 1. Payment Data Integration - RESOLVED ✅

**Issue**: Archives need full payment details (provider, amount, etc.), not just status records.

**Solution**: Define `PaymentArchiveRecord` that combines both:

```typescript
/**
 * Extended PaymentStatusRecord with full payment snapshot.
 * Archives store complete payment data to enable read-only viewing.
 */
export interface PaymentArchiveRecord {
  // Status data (from Feature 015)
  paymentId: string;          // UUID v4
  status: 'paid' | 'pending';
  timestamp: string;          // ISO 8601 when marked

  // Payment data (snapshot from PaymentRecord)
  provider: string;
  amount: number;
  currency: string;
  dueISO: string;            // Renamed from dueDate to match CSV export
  autopay: boolean;

  // Optional risk data (snapshot at archive time)
  risk_type?: string;
  risk_severity?: string;
  risk_message?: string;
}
```

**Implementation Strategy**:

1. When creating archive, **join** `PaymentStatusRecord` with `PaymentRecord[]` by `id`:
   ```typescript
   // In ArchiveService.createArchive()
   const statusResult = paymentStatusStorage.loadStatuses();
   const currentPayments = getCurrentPayments(); // From app state (Home.tsx)

   const archiveRecords: PaymentArchiveRecord[] = currentPayments.map(payment => {
     const statusRecord = statusResult.value.statuses.get(payment.id);
     return {
       // Status
       paymentId: payment.id,
       status: statusRecord?.status || 'pending',
       timestamp: statusRecord?.timestamp || '',
       // Payment snapshot
       provider: payment.provider,
       amount: payment.amount,
       currency: payment.currency,
       dueISO: payment.dueISO,
       autopay: payment.autopay,
       risk_type: payment.risk_type,
       risk_severity: payment.risk_severity,
       risk_message: payment.risk_message,
     };
   });
   ```

2. Archive stores **full snapshots**, not references, ensuring immutability even if source data changes.

**Files to Update**:
- ✅ `specs/016-payment-archive/data-model.md` Section 1 (Archive entity)
- ✅ `specs/016-payment-archive/contracts/ArchiveService.contract.md` (createArchive method)
- ✅ Add new type definition to planning docs

---

### 2. Payment Schedule Source - RESOLVED ✅

**Issue**: Where does payment data come from?

**Finding**: Payment data flows from backend API → Home.tsx state → normalized in useMemo

**Source Chain**:
1. **Backend API**: Returns `PlanResponse` with `normalized[]` array
2. **Home.tsx**: Transforms API data to `PaymentRecord[]` with UUIDs
3. **App State**: Stored in React state (`res` in Home component)
4. **Feature 015**: Tracks paid/pending status separately in localStorage

**Archive Creation Flow**:
```
1. User has normalizedPayments in app state (PaymentRecord[])
2. User marks some as paid → PaymentStatusStorage saves statuses
3. User creates archive → ArchiveService:
   a. Gets normalizedPayments from React context/props
   b. Loads statuses from PaymentStatusStorage
   c. Joins them to create PaymentArchiveRecord[]
   d. Saves archive snapshot to localStorage
   e. Clears PaymentStatusStorage (reset to pending)
```

**Implementation Requirements**:

1. **Create React Context** to share payment data:
   ```typescript
   // NEW: frontend/src/contexts/PaymentContext.tsx
   interface PaymentContextType {
     payments: PaymentRecord[];
     setPayments: (payments: PaymentRecord[]) => void;
   }

   export const PaymentContext = createContext<PaymentContextType>({
     payments: [],
     setPayments: () => {},
   });
   ```

2. **Update Home.tsx** to provide context:
   ```typescript
   <PaymentContext.Provider value={{ payments: normalizedPayments, setPayments: () => {} }}>
     <ResultsThisWeek ... />
     {/* Archive UI will access context */}
   </PaymentContext.Provider>
   ```

3. **ArchiveService** accesses via hook:
   ```typescript
   const { payments } = useContext(PaymentContext);
   const archiveService = new ArchiveService(...);
   archiveService.createArchive(name, payments); // Pass payments explicitly
   ```

**Files to Update**:
- ✅ Add dependency note to `spec.md` Dependencies section
- ✅ Update `plan.md` with React Context setup task
- ✅ Document in `contracts/ArchiveService.contract.md`

---

### 3. Archive Creation UX Flow - RESOLVED ✅

**Issue**: Should users be warned before current statuses are reset?

**Solution**: Two-step confirmation with explicit warning

**Proposed UX Flow**:

```
┌─────────────────────────────────────────────┐
│ Create Payment Archive                      │
├─────────────────────────────────────────────┤
│                                             │
│ Archive name:                               │
│ [October 2025___________________]           │
│                                             │
│ Current tracking summary:                   │
│ • 15 total payments                         │
│ • 8 marked as paid                          │
│ • 7 pending                                 │
│                                             │
│ ⚠️ Warning:                                 │
│ Creating this archive will reset all        │
│ current payment statuses to pending.        │
│ This allows you to start fresh tracking    │
│ for the next billing cycle.                │
│                                             │
│ [Cancel]              [Create Archive]      │
└─────────────────────────────────────────────┘
```

**Business Rules**:
- ✅ Show current status summary (transparency)
- ✅ Include warning text about reset (no surprises)
- ✅ Single-step confirmation (no extra modal)
- ✅ "Create Archive" button is affirmative action (user understands consequence)

**Alternative (optional)**: Checkbox to skip reset
```
☑ Reset current payment statuses after creating archive
  (Uncheck to keep current tracking data)
```

**Recommendation**: Start with **mandatory reset** (simpler UX, matches spec User Story 1), add optional skip in future if requested.

**Files to Update**:
- ✅ `quickstart.md` Scenario 1 - Add warning text to steps
- ✅ `spec.md` User Story 1 - Clarify confirmation in acceptance scenarios
- ✅ Add UI mockup to `plan.md` Phase 4 (UI Components)

---

### 4. Storage Keys - RESOLVED ✅

**Issue**: Inconsistency between `payplan_archive` and `payplan:archive`

**Finding**: Feature 015 uses **underscores**: `payplan_payment_status`

**Decision**: Standardize on **underscores** to match existing pattern

**Correct Storage Keys**:
```typescript
// Constants for Feature 016
export const ARCHIVE_INDEX_KEY = 'payplan_archive_index';     // Index
export const ARCHIVE_KEY_PREFIX = 'payplan_archive_';         // Individual archives
// Example: 'payplan_archive_550e8400-e29b-41d4-a716-446655440000'
```

**Rationale**:
- Consistency with Feature 015 (`payplan_payment_status`)
- Follows established project convention
- Avoids confusion for future features

**Action Required**: Search-replace in all planning docs:
- ❌ `payplan:archive:index` → ✅ `payplan_archive_index`
- ❌ `payplan:archive:{id}` → ✅ `payplan_archive_{id}`

**Files to Update** (search-replace all instances):
- ✅ `data-model.md` Section 4 (Storage Schema)
- ✅ `research.md` Section 3 (localStorage Architecture)
- ✅ `contracts/ArchiveStorage.contract.md` (Constants section)
- ✅ `plan.md` (any references)

---

### 5. CSV Export - Column Mapping - RESOLVED ✅

**Issue**: "Standard payment columns" not defined

**Finding**: Feature 014 defines exact CSV structure

**Standard CSV Columns** (from Feature 014):
```csv
provider,amount,currency,dueISO,autopay,risk_type,risk_severity,risk_message,paid_status,paid_timestamp
```

**Archive CSV Columns** (Feature 016 extension):
```csv
provider,amount,currency,dueISO,autopay,risk_type,risk_severity,risk_message,paid_status,paid_timestamp,archive_name,archive_date
```

**Column Mapping**:

| CSV Column | Source | Type | Example |
|------------|--------|------|---------|
| `provider` | `PaymentArchiveRecord.provider` | string | "Klarna" |
| `amount` | `PaymentArchiveRecord.amount` | string (2 decimals) | "45.00" |
| `currency` | `PaymentArchiveRecord.currency` | string (ISO 4217) | "USD" |
| `dueISO` | `PaymentArchiveRecord.dueISO` | string (YYYY-MM-DD) | "2025-10-14" |
| `autopay` | `PaymentArchiveRecord.autopay` | string ("true"/"false") | "true" |
| `risk_type` | `PaymentArchiveRecord.risk_type` | string (or "") | "collision" |
| `risk_severity` | `PaymentArchiveRecord.risk_severity` | string (or "") | "high" |
| `risk_message` | `PaymentArchiveRecord.risk_message` | string (or "") | "3 payments due same day" |
| `paid_status` | `PaymentArchiveRecord.status` | string | "paid" or "pending" |
| `paid_timestamp` | `PaymentArchiveRecord.timestamp` | string (ISO 8601 or "") | "2025-10-14T14:30:00.000Z" |
| **`archive_name`** ⭐ | `Archive.name` | string | "October 2025" |
| **`archive_date`** ⭐ | `Archive.createdAt` | string (ISO 8601) | "2025-11-01T00:00:00.000Z" |

**Implementation Strategy**:

1. **Reuse Feature 014's `csvExportService.ts`** functions:
   ```typescript
   import { generateCSV, downloadCSV } from '@/services/csvExportService';
   ```

2. **Create archive-specific transformer**:
   ```typescript
   // In ArchiveService
   export function exportArchiveToCSV(archive: Archive): string {
     const rows = archive.payments.map(payment => ({
       // Standard columns (Feature 014 format)
       provider: payment.provider,
       amount: payment.amount.toFixed(2),
       currency: payment.currency,
       dueISO: payment.dueISO,
       autopay: payment.autopay.toString(),
       risk_type: payment.risk_type || '',
       risk_severity: payment.risk_severity || '',
       risk_message: payment.risk_message || '',
       paid_status: payment.status,
       paid_timestamp: payment.timestamp || '',
       // NEW: Archive metadata columns
       archive_name: archive.name,
       archive_date: archive.createdAt,
     }));

     return generateCSV(rows); // Reuse Feature 014's PapaParse wrapper
   }
   ```

3. **Filename pattern** (match Feature 014 style):
   ```typescript
   // Feature 014: "payplan-export-2025-10-14-143052.csv"
   // Feature 016: "payplan-archive-october-2025-2025-11-01-000000.csv"

   function generateArchiveFilename(archiveName: string, createdAt: string): string {
     const slugified = archiveName
       .toLowerCase()
       .replace(/[^\w\s-]/g, '') // Remove special chars
       .replace(/\s+/g, '-');     // Spaces to hyphens

     const timestamp = new Date(createdAt)
       .toISOString()
       .replace(/[:.]/g, '')      // Remove colons/dots
       .slice(0, 15);              // YYYY-MM-DDTHHMMSS

     return `payplan-archive-${slugified}-${timestamp}.csv`;
   }
   ```

**Files to Update**:
- ✅ `data-model.md` Section 1 - Add CSV column mapping table
- ✅ `contracts/ArchiveService.contract.md` - Document `exportArchiveToCSV()` implementation
- ✅ `spec.md` User Story 4 - Add exact CSV format example

---

## 📋 Implementation Checklist

**Before starting Phase 1**:

- [ ] **Update data-model.md**:
  - [ ] Define `PaymentArchiveRecord` type (Section 1)
  - [ ] Add CSV column mapping table (Section 1 or new section)
  - [ ] Fix storage keys (Section 4): `payplan_archive_index`, `payplan_archive_{id}`

- [ ] **Update contracts/ArchiveService.contract.md**:
  - [ ] Update `createArchive()` to accept `PaymentRecord[]` parameter
  - [ ] Document join logic (status + payment data)
  - [ ] Update `exportArchiveToCSV()` with exact column mapping

- [ ] **Update contracts/ArchiveStorage.contract.md**:
  - [ ] Fix storage key constants (underscores)
  - [ ] Update examples with correct keys

- [ ] **Update spec.md**:
  - [ ] User Story 1: Add confirmation dialog description
  - [ ] User Story 4: Add CSV format example with archive columns
  - [ ] Dependencies: Document PaymentContext requirement

- [ ] **Update plan.md**:
  - [ ] Phase 0: Add React Context setup task
  - [ ] Phase 4: Add UI mockup for CreateArchiveDialog
  - [ ] Fix all storage key references

- [ ] **Update research.md**:
  - [ ] Section 3: Fix storage key examples (underscores)

- [ ] **Update quickstart.md**:
  - [ ] Scenario 1: Add warning text to archive creation steps
  - [ ] Scenario 6: Add exact CSV column list with archive metadata

---

## 🎯 Key Implementation Notes

### PaymentRecord Access Pattern

```typescript
// Home.tsx provides payments via context
<PaymentContext.Provider value={{ payments: normalizedPayments }}>
  <App />
</PaymentContext.Provider>

// Archive components consume context
function CreateArchiveDialog() {
  const { payments } = useContext(PaymentContext);
  const archiveService = useArchiveService();

  const handleCreate = (name: string) => {
    archiveService.createArchive(name, payments); // Pass explicitly
  };
}
```

### Archive Creation with Data Join

```typescript
// ArchiveService.createArchive(name, currentPayments)
createArchive(name: string, currentPayments: PaymentRecord[]): Result<Archive, Error> {
  // 1. Load current statuses
  const statusResult = this.paymentStatusStorage.loadStatuses();

  // 2. Join payments + statuses
  const archiveRecords: PaymentArchiveRecord[] = currentPayments.map(payment => ({
    paymentId: payment.id,
    status: statusResult.value.statuses.get(payment.id)?.status || 'pending',
    timestamp: statusResult.value.statuses.get(payment.id)?.timestamp || '',
    // Full payment snapshot
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    dueISO: payment.dueISO,
    autopay: payment.autopay,
    risk_type: payment.risk_type,
    risk_severity: payment.risk_severity,
    risk_message: payment.risk_message,
  }));

  // 3. Create archive
  const archive = {
    id: generateUUID(),
    name: await this.ensureUniqueName(name),
    createdAt: new Date().toISOString(),
    sourceVersion: '1.0.0',
    payments: archiveRecords,
    metadata: this.calculateMetadata(archiveRecords),
  };

  // 4. Save
  await this.archiveStorage.saveArchive(archive);

  // 5. Reset current statuses
  await this.paymentStatusStorage.clearAll();

  return { ok: true, value: archive };
}
```

---

## 🔄 Next Steps

1. ✅ **Review solutions** with project team
2. ⏳ **Update planning documents** with resolved solutions (checklist above)
3. ⏳ **Generate tasks.md** with atomic TDD breakdown
4. ⏳ **Begin Phase 1** implementation with clean data models

---

**All critical issues resolved!** Ready to proceed with implementation.
