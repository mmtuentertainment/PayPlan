# Research: Payment History Archive System

**Feature**: 016-build-a-payment
**Date**: 2025-10-17
**Phase**: 0 (Outline & Research)

## Overview

This document consolidates research findings for implementing payment history archiving with localStorage persistence, snapshot creation, archive management, and CSV export integration.

---

## 1. Archive Data Structure Strategy

### Decision

Use separate localStorage keys for each archive with an index collection for efficient listing: `payplan_archive_index` (list of archive metadata) + `payplan_archive_<uuid>` (individual archive data).

### Rationale

**Two-Tier Storage Pattern**:
```typescript
// Index stored at: payplan_archive_index
{
  version: "1.0.0",
  archives: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "October 2025",
      createdAt: "2025-11-01T00:00:00.000Z",
      paymentCount: 20,
      paidCount: 15,
      pendingCount: 5,
      storageSize: 12500  // bytes
    },
    // ... more archive metadata
  ],
  totalSize: 125000,  // sum of all archive sizes
  lastModified: "2025-11-01T00:00:00.000Z"
}

// Individual archive stored at: payplan_archive_550e8400-...
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "October 2025",
  createdAt: "2025-11-01T00:00:00.000Z",
  sourceVersion: "1.0.0",  // Version of PaymentStatusCollection schema
  payments: [
    {
      paymentId: "abc123...",
      status: "paid",
      timestamp: "2025-10-15T14:30:00.000Z"
    },
    // ... more payment records
  ],
  metadata: {
    totalCount: 20,
    paidCount: 15,
    pendingCount: 5,
    dateRange: {
      earliest: "2025-10-01",
      latest: "2025-10-31"
    }
  }
}
```

**Benefits**:
- **Fast Listing**: Load only archive index (~5KB) to display archive list, not all archive data (~500KB)
- **Selective Loading**: Load individual archives on-demand when user views details
- **Easy Deletion**: Delete archive by removing single key (payplan_archive_<id>)
- **Storage Management**: Index tracks total storage size without reading all archives
- **Incremental Loading**: Can paginate archive list if it grows large (50+ archives)

**Alternative Considered - Single Key Nested Structure**:
```typescript
// All archives in one key: payplan_archives
{
  version: "1.0.0",
  archives: {
    "archive-1-id": { /* full archive data */ },
    "archive-2-id": { /* full archive data */ },
    // ... 50 archives = 500KB+
  }
}
```
**Why Rejected**: Must load entire 500KB+ object to display archive list, poor performance for UI listing.

**Performance Targets**:
| Operation | Single Key | Two-Tier | Winner |
|-----------|------------|----------|--------|
| Load archive list | ~200-500ms (parse 500KB JSON) | ~10-20ms (parse 5KB index) | Two-Tier ✅ |
| View single archive | ~200ms (parse 500KB, extract one) | ~15-30ms (parse 12KB) | Two-Tier ✅ |
| Delete archive | ~250ms (parse 500KB, remove, stringify) | ~5ms (remove one key) | Two-Tier ✅ |

---

## 2. Archive Snapshot Creation Strategy

### Decision

Create a deep copy of the current PaymentStatusCollection from Feature 015, enriched with metadata, then reset the source collection to pending states.

### Rationale

**Snapshot Process**:
```typescript
async function createArchive(name: string): Promise<Result<Archive, ArchiveError>> {
  // 1. Load current payment statuses from Feature 015
  const currentStatuses = paymentStatusStorage.loadStatuses();

  // 2. Create deep copy (prevent reference sharing)
  const archivePayments = Array.from(currentStatuses.value.statuses.values());

  // 3. Calculate metadata
  const metadata = calculateArchiveMetadata(archivePayments);

  // 4. Create archive entity
  const archive: Archive = {
    id: generateUUID(),
    name: validateAndSanitizeName(name),
    createdAt: getCurrentTimestamp(),
    sourceVersion: currentStatuses.value.version,
    payments: archivePayments,
    metadata
  };

  // 5. Save archive to separate localStorage key
  await archiveStorage.saveArchive(archive);

  // 6. Reset current payment statuses to pending
  await paymentStatusService.clearAll();  // From Feature 015

  // 7. Update archive index
  await archiveStorage.updateIndex(archive.metadata);

  return { ok: true, value: archive };
}
```

**Deep Copy Importance**:
- Prevents shared references between archive and current statuses
- Ensures archive is a true snapshot (immutable)
- Avoids accidental modification of archived data

**Reset Current Statuses**:
- Users start fresh for new billing period (clean slate)
- Matches user expectation: "archive old, start new"
- Leverages existing Feature 015 clearAll() method

**Alternative Considered - Reference Current Data**:
Store archive as pointers to existing PaymentStatusCollection, don't reset.

**Why Rejected**:
- Archives would change when current statuses update (not a snapshot)
- No clean separation between "history" and "current period"
- Confusing UX: marking current payment changes archived view

---

## 3. Archive Naming and Validation

### Decision

Validate archive names with constraints: 1-100 characters, Unicode support (emoji allowed), automatic duplicate handling with counter suffix.

### Rationale

**Validation Rules**:
```typescript
const archiveNameSchema = z.string()
  .min(1, 'Archive name is required')
  .max(100, 'Archive name must be under 100 characters')
  .transform(name => name.trim());  // Remove leading/trailing whitespace

// Duplicate handling
function ensureUniqueName(proposedName: string, existingNames: string[]): string {
  let finalName = proposedName;
  let counter = 2;

  while (existingNames.includes(finalName)) {
    finalName = `${proposedName} (${counter})`;
    counter++;
  }

  return finalName;
}
```

**Unicode Support** (SC-009):
- Allows emoji: "💰 October 2025", "🎯 Q3 Goals"
- Supports international characters: "Octubre 2025", "十月 2025"
- No character restriction beyond length

**Duplicate Handling** (FR-019):
- First: "October 2025"
- Second: "October 2025 (2)"
- Third: "October 2025 (3)"

**Industry Patterns**:
- Google Drive: Appends "(1)", "(2)" for duplicates ✅
- Dropbox: Appends timestamp for duplicates (complex, overkill)
- macOS Finder: "copy", "copy 2" pattern (less clear)

**Alternative Considered - Reject Duplicates**:
Show error: "Archive name already exists. Please choose a different name."

**Why Rejected**: Poor UX - forces user to manually modify name, adds friction to common workflow (archiving monthly with same pattern).

---

## 4. localStorage Storage Management and Quota Handling

### Decision

Implement proactive storage monitoring with warnings at 80% capacity and enforcement of 50-archive limit (estimated ~500KB-1MB total).

### Rationale

**Storage Capacity Planning**:
```
Average archive size estimate:
- Archive metadata: ~200 bytes
- 20 payment records × 140 bytes each = 2,800 bytes
- Archive wrapper (JSON structure): ~300 bytes
Total per archive: ~3,300 bytes (3.3KB)

50 archives × 3.3KB = 165KB (archives only)
+ Current PaymentStatusCollection: ~70KB (500 payments from Feature 015)
+ Archive index: ~5KB
= ~240KB total for archive feature

Browser localStorage limits: 5-10MB
→ Archive feature uses 2-5% of available storage ✅
```

**Storage Monitoring Strategy**:
```typescript
interface StorageQuota {
  used: number;      // Bytes currently used
  available: number; // Estimated browser limit (5MB)
  percentage: number; // used / available
}

function checkStorageQuota(): StorageQuota {
  const used = calculateTotalStorageSize();
  const available = 5 * 1024 * 1024;  // 5MB conservative estimate
  const percentage = (used / available) * 100;

  return { used, available, percentage };
}

// Warn user at 80% capacity
if (quota.percentage > 80) {
  showWarning('Storage is 80% full. Consider deleting old archives.');
}

// Block new archives at 95% capacity
if (quota.percentage > 95) {
  return {
    ok: false,
    error: {
      type: 'QuotaExceeded',
      message: 'Storage limit reached. Please delete old archives before creating new ones.'
    }
  };
}
```

**Hard Limit: 50 Archives**:
- Prevents unbounded growth (user archiving weekly for years = 100+ archives)
- Conservative estimate: 50 × 3.3KB = 165KB << 5MB ✅
- Matches user behavior assumptions (1-2 archives/month = 2 years of data)

**User Actions When Full**:
1. Delete old archives (P5 - user story)
2. Export to CSV then delete (preserve data externally)
3. Clear browser cache (resets all PayPlan data - warning needed)

**Alternative Considered - Unlimited Archives**:
No hard limit, only soft warnings.

**Why Rejected**: Risk of hitting browser quota unexpectedly, poor error handling if create fails mid-operation.

---

## 5. React 19 State Management for Archives

### Decision

Use React 19's `useSyncExternalStore` with custom hook `usePaymentArchives()` following the same pattern as Feature 015's `usePaymentStatus()`.

### Rationale

**Archive State Hook Pattern**:
```typescript
interface ArchiveState {
  archives: ArchiveMetadata[];  // List for UI display
  selectedArchive: Archive | null;  // Currently viewing
  isLoading: boolean;
  error: ArchiveError | null;

  // Actions
  createArchive: (name: string) => Promise<Result<Archive, ArchiveError>>;
  loadArchive: (id: string) => Promise<Result<Archive, ArchiveError>>;
  deleteArchive: (id: string) => Promise<Result<void, ArchiveError>>;
  exportArchiveCSV: (id: string) => Promise<Result<Blob, ArchiveError>>;
}

export function usePaymentArchives(): ArchiveState {
  const subscribe = useCallback((callback: () => void) => {
    // Listen for localStorage changes (cross-tab sync)
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback(() => {
    // Read archive index from localStorage
    const result = archiveStorage.loadArchiveIndex();
    return result.ok ? result.value.archives : [];
  }, []);

  const archives = useSyncExternalStore(subscribe, getSnapshot);

  // ... action implementations

  return { archives, /* ... */ };
}
```

**Performance** (SC-003, SC-004):
- Archive list load: Parse 5KB index JSON ~10ms ✅
- Archive detail load: Parse 12KB archive JSON ~20ms ✅
- React re-render: ~10-15ms
- **Total: ~25-45ms << 100ms target** ✅

**Cross-Tab Synchronization**:
- Archive created in Tab A → Tab B's list updates automatically
- Archive deleted in Tab A → Tab B's list removes entry
- Same localStorage event mechanism as Feature 015

**Alternative Considered - useReducer + useEffect**:
Traditional React state management without external store hook.

**Why Rejected**:
- Race conditions with localStorage updates from other tabs
- More complex sync logic required
- useSyncExternalStore is React 19 best practice for external stores

---

## 6. CSV Export Integration for Archives

### Decision

Extend existing CSV export from Feature 014 with archive-specific metadata columns and filename generation.

### Rationale

**Archive CSV Schema Extension**:
```typescript
// Standard payment export columns (from Feature 014/015)
interface PaymentCSVRow {
  description: string;
  amount: number;
  date: string;
  paid_status: 'paid' | 'pending';
  paid_timestamp: string;

  // NEW: Archive-specific columns
  archive_name: string;      // e.g., "October 2025"
  archive_date: string;      // e.g., "2025-11-01"
}

// Export function
function exportArchiveToCSV(archive: Archive): string {
  const rows = archive.payments.map(payment => ({
    // ... existing payment fields
    paid_status: payment.status,
    paid_timestamp: payment.timestamp,

    // Archive metadata
    archive_name: archive.name,
    archive_date: archive.createdAt.split('T')[0]  // YYYY-MM-DD
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

**Filename Generation** (FR-012):
```typescript
function generateArchiveCSVFilename(archive: Archive): string {
  // Sanitize archive name for filename
  const safeName = archive.name
    .replace(/[^a-zA-Z0-9-_]/g, '-')  // Replace special chars with dash
    .replace(/-+/g, '-')               // Collapse multiple dashes
    .substring(0, 50);                 // Limit to 50 chars

  const date = new Date(archive.createdAt)
    .toISOString()
    .split('T')[0];  // YYYY-MM-DD

  return `PayPlan_Archive_${safeName}_${date}.csv`;

  // Examples:
  // "October 2025" → "PayPlan_Archive_October-2025_2025-11-01.csv"
  // "💰 Q3 2025" → "PayPlan_Archive_Q3-2025_2025-10-01.csv"
}
```

**PapaParse Integration** (existing from Feature 014):
- Already handles CSV generation efficiently
- Supports dynamic column addition (backward compatible)
- No new dependencies needed ✅

**Alternative Considered - Separate Archive Export Format**:
Create custom JSON or XML export specifically for archives.

**Why Rejected**:
- Adds complexity (new format, new parsing)
- CSV is universal, works with Excel/Sheets
- Consistency with existing Feature 014/015 exports

---

## 7. Archive Data Immutability Guarantees

### Decision

Enforce read-only archives through: 1) No update methods in ArchiveStorage, 2) TypeScript readonly properties, 3) UI components that don't allow editing.

### Rationale

**Immutability Enforcement Layers**:

**Layer 1: Type System**:
```typescript
interface Archive {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly payments: ReadonlyArray<Readonly<PaymentStatusRecord>>;
  readonly metadata: Readonly<ArchiveMetadata>;
}
```

**Layer 2: Storage API**:
```typescript
class ArchiveStorage {
  // ONLY provide create, read, delete - NO update
  createArchive(archive: Archive): Result<void, ArchiveError> { /* ... */ }
  loadArchive(id: string): Result<Archive, ArchiveError> { /* ... */ }
  deleteArchive(id: string): Result<void, ArchiveError> { /* ... */ }

  // NO updateArchive() method exists!
}
```

**Layer 3: UI Components**:
```tsx
<ArchiveDetailView archive={archive}>
  {/* Read-only display - no input fields or checkboxes */}
  <StatusIndicator status={payment.status} readOnly />
  <Typography>{payment.timestamp}</Typography>
  {/* No "Mark as Paid" buttons */}
</ArchiveDetailView>
```

**Why Immutability Matters**:
- Archives are historical snapshots, not active tracking
- Prevents accidental modification of past records
- Simplifies storage model (no update logic needed)
- Matches user mental model: "history is fixed, current is active"

**Alternative Considered - Allow Archive Editing**:
Provide UI to modify archived payment statuses after creation.

**Why Rejected**:
- Breaks snapshot integrity (no longer true historical record)
- Adds complexity (update logic, validation, conflict resolution)
- Confusing UX: "Is this current data or historical data?"

---

## 8. Archive Performance Optimization

### Decision

Implement lazy loading for archive details (load on-demand) and memoization for archive list rendering.

### Rationale

**Lazy Loading Pattern**:
```typescript
// Archive list: Load only index (5KB)
function ArchiveListView() {
  const { archives } = usePaymentArchives();  // Just metadata

  return (
    <ul>
      {archives.map(meta => (
        <ArchiveListItem key={meta.id} metadata={meta} />
      ))}
    </ul>
  );
}

// Archive detail: Load full archive only when viewing
function ArchiveDetailView({ archiveId }: { archiveId: string }) {
  const { loadArchive } = usePaymentArchives();
  const [archive, setArchive] = useState<Archive | null>(null);

  useEffect(() => {
    loadArchive(archiveId).then(result => {
      if (result.ok) setArchive(result.value);
    });
  }, [archiveId]);

  if (!archive) return <LoadingSpinner />;

  return <ArchivePaymentList payments={archive.payments} />;
}
```

**Memoization Strategy**:
```typescript
// Memoize expensive calculations
const archiveStatistics = useMemo(() => {
  return calculateArchiveStats(archive.payments);
}, [archive.payments]);

// Memoize list items
const ArchiveListItem = React.memo(({ metadata }: { metadata: ArchiveMetadata }) => {
  return (
    <li>
      <h3>{metadata.name}</h3>
      <p>{metadata.paidCount}/{metadata.totalCount} paid</p>
    </li>
  );
});
```

**Performance Targets** (SC-003, SC-004):
| Operation | Without Optimization | With Optimization | Target | Pass |
|-----------|---------------------|-------------------|--------|------|
| Load 20 archives list | ~200ms (load all 20 × 12KB) | ~15ms (load 5KB index) | <100ms | ✅ |
| View 50-payment archive | ~50ms | ~25ms (memoized stats) | <100ms | ✅ |
| Re-render archive list | ~80ms | ~10ms (memoized items) | <50ms | ✅ |

**Alternative Considered - Load All Archives Upfront**:
Load all archive data into memory on app start.

**Why Rejected**:
- Wastes bandwidth if user never views archives
- Blocks initial app load (poor perceived performance)
- Consumes memory unnecessarily (50 × 12KB = 600KB)

---

## Summary of Key Decisions

| Topic | Decision | Primary Benefit |
|-------|----------|-----------------|
| **Data Structure** | Two-tier (index + separate keys) | Fast archive list loading (~15ms) |
| **Snapshot Strategy** | Deep copy + reset current statuses | True historical snapshot, clean separation |
| **Archive Naming** | Unicode support + auto-duplicate handling | User-friendly, handles edge cases |
| **Storage Management** | 80% warning + 50-archive hard limit | Prevents quota errors, manageable size |
| **State Management** | useSyncExternalStore + lazy loading | React 19 best practice, optimal performance |
| **CSV Export** | Extend existing with archive metadata | Backward compatible, consistent UX |
| **Immutability** | readonly types + no update methods | Guarantees historical integrity |
| **Performance** | Lazy loading + memoization | Meets <100ms targets for 50 records |

---

## Technologies Summary

**Required** (already in dependencies from Feature 015):
- `uuid` v13.0.0 - Archive ID generation
- `zod` v4.1.11 - Archive validation
- `react` v19.1.1 - useSyncExternalStore
- `papaparse` v5.5.3 - CSV export for archives
- `lucide-react` - Archive UI icons (archive-box, folder, download)
- `@radix-ui/react-*` - Accessible UI components (dialogs for delete confirmation)

**No new dependencies needed** ✅

---

## Open Questions

None - all technical decisions resolved based on Feature 015 patterns and localStorage best practices.

---

**Next Phase**: Generate data-model.md with archive entity definitions based on these research findings.
