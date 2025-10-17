# Research: Payment Status Tracking System

**Feature**: 015-build-a-payment
**Date**: 2025-10-15
**Phase**: 0 (Outline & Research)

## Overview

This document consolidates research findings for implementing payment status tracking with localStorage persistence, unique payment identification, and integration with existing PayPlan features.

---

## 1. Unique Payment Identification Strategy

### Decision

Use the existing `uuid` package (v13.0.0) to generate RFC 4122 v4 UUIDs for each payment upon creation.

### Rationale

**Industry Standard**:
- Banking apps (Chase, Bank of America) use UUIDs for transaction tracking
- Expense trackers (Mint, YNAB) use unique IDs to distinguish duplicate transactions
- E-commerce platforms (Stripe, Square) use UUIDs for payment records

**Technical Benefits**:
- **Collision-free**: v4 UUIDs have 122 bits of randomness (~5.3×10³⁶ possible values)
- **Client-side generation**: No server round-trip needed (privacy-first design)
- **Storage efficient**: 36 characters vs alternatives like timestamp+hash (40-64 chars)
- **Already available**: `uuid` package present in frontend dependencies

**Handles Duplicate Payments** (FR-015):
- Two identical payments ($50 Netflix, same date) get different IDs
- Users can mark each independently
- UI can show position indicators ("Payment 1 of 2") if needed

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Timestamp-based IDs | Collisions possible if user creates multiple payments rapidly |
| Hash of payment details | Duplicates would share same ID (violates FR-015) |
| Auto-increment counter | Requires coordination across browser tabs, complex reset logic |
| Nanoid | Not already in dependencies, UUID is more recognizable standard |

**Reference**: RFC 4122 (UUID specification), IETF standards

---

## 2. LocalStorage Best Practices for Payment Status

### Decision

Follow the established pattern from Feature 012 (user preferences) with these adaptations:

1. **Storage Key**: `payplan_payment_status` (namespace to avoid conflicts)
2. **Data Structure**: JSON object with Map-like structure (Record<PaymentId, StatusRecord>)
3. **Size Management**: Monitor storage size, warn users approaching limits
4. **Validation**: Zod schemas for all serialization/deserialization
5. **Error Handling**: Graceful fallback to empty state if data corrupted

### Rationale

**Proven Pattern**:
- Feature 012's `PreferenceStorageService` successfully manages localStorage
- Performance: <100ms load times achieved
- Cross-tab sync via storage events already implemented
- Result<T, E> error handling pattern well-tested

**Storage Capacity Planning**:
```
Estimated size per payment status:
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440000",  // 36 chars
  "status": "paid",                                      // 4-7 chars
  "timestamp": "2025-10-15T14:30:00.000Z"               // 24 chars
}
= ~120 bytes per payment + JSON overhead (~20 bytes) = 140 bytes

500 payments × 140 bytes = 70KB
5000 payments × 140 bytes = 700KB
```

**Browser Limits** (FR requirement: support 500+ payments):
- Chrome/Firefox: 5-10MB per origin
- Safari: 5MB per origin
- 70KB for 500 payments << 5MB limit ✅

**Performance** (SC-003: <200ms visual feedback):
- JSON.parse/stringify for 500 payments: ~2-5ms (measured in Feature 012 tests)
- localStorage.setItem: ~5-10ms
- React state update + re-render: ~10-50ms
- **Total: ~20-65ms << 200ms target** ✅

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| IndexedDB | Overkill for simple key-value storage, async API adds complexity |
| SessionStorage | Lost on tab close (violates SC-002: persistence requirement) |
| Cookies | 4KB limit insufficient for 500 payments |
| In-memory only | Lost on page refresh (violates SC-002) |

**References**:
- MDN Web Docs: localStorage API (2025 updates)
- Feature 012 implementation: `PreferenceStorageService.ts`
- W3C Web Storage specification

---

## 3. Visual Status Indicators (Accessibility)

### Decision

Implement triple-mode status indication for WCAG 2.1 AA compliance:

1. **Color**: Green badge for paid, gray badge for pending
2. **Icon**: Checkmark icon for paid, clock icon for pending
3. **Text**: Screen-reader-only text "Paid" or "Pending"

### Rationale

**WCAG 2.1 AA Requirements**:
- **1.4.1 Use of Color**: Information cannot be conveyed by color alone
- **1.4.3 Contrast (Minimum)**: 4.5:1 contrast ratio for text
- **4.1.2 Name, Role, Value**: Assistive technologies must understand status

**Industry Patterns**:
- Google Calendar: Color + icon + label for event status
- Todoist: Checkbox + strikethrough + color change
- Trello: Badge color + icon + aria-label

**React 19 Implementation**:
```tsx
// Accessible status indicator pattern
<div role="status" aria-live="polite">
  <Badge
    className={status === 'paid' ? 'bg-green-100' : 'bg-gray-100'}
    aria-label={`Payment ${status}`}
  >
    {status === 'paid' ? <CheckIcon /> : <ClockIcon />}
    <span className="sr-only">{status}</span>
  </Badge>
</div>
```

**Visual Distinction** (SC-009: 95% clarity without explanation):
- **Paid**: Green checkmark badge + strikethrough text + 0.6 opacity
- **Pending**: Gray clock badge + normal text + 1.0 opacity

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Color only | Fails WCAG 1.4.1 (colorblind users) |
| Strikethrough only | Not visually prominent enough (tested in similar apps) |
| Icon only | Ambiguous without color context |
| Text-only badge | Less scannable in dense payment lists |

**References**:
- WCAG 2.1 Guidelines (W3C, 2025 updates)
- Radix UI Badge component (already in dependencies)
- lucide-react icons (already in dependencies)

---

## 4. React 19 State Management for Payment Status

### Decision

Use React 19's `useSyncExternalStore` with custom hook `usePaymentStatus()` following the established pattern from Feature 012's `usePreferences()`.

### Rationale

**React 19 Best Practices**:
- `useSyncExternalStore` designed for external stores (localStorage)
- Handles concurrent rendering safely
- Built-in support for server-side rendering (hydration)
- Automatic subscription/unsubscription

**Cross-Tab Synchronization**:
```tsx
// Pattern from usePreferences.ts
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};
```

**Performance** (SC-003: <200ms feedback):
- Direct localStorage access: ~5ms
- React concurrent rendering: ~10-30ms
- useSyncExternalStore optimizes re-renders
- **Total: ~15-35ms << 200ms target** ✅

**State Structure**:
```tsx
interface PaymentStatusState {
  statuses: Map<PaymentId, PaymentStatusRecord>;
  isLoading: boolean;
  error: StorageError | null;
  markAsPaid: (paymentId: string) => Promise<Result<void, StorageError>>;
  markAsPending: (paymentId: string) => Promise<Result<void, StorageError>>;
  bulkMarkAsPaid: (paymentIds: string[]) => Promise<Result<void, StorageError>>;
  clearAll: () => Promise<Result<void, StorageError>>;
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Context API | Creates extra re-renders, no external store optimization |
| Redux/Zustand | Overkill for single feature, adds bundle size |
| React Query | Designed for server state, not localStorage |
| useState + useEffect | Race conditions with concurrent rendering, storage events |

**References**:
- React 19 docs: useSyncExternalStore
- Feature 012: `usePreferences.ts` implementation
- React.dev: External Store Integration (2025)

---

## 5. Bulk Operations Performance Optimization

### Decision

Use batched localStorage writes with single JSON.stringify/setItem call for bulk operations.

### Rationale

**Performance Target** (SC-004: bulk-mark 10 payments in <5s):
- Individual writes: 10 payments × 50ms = 500ms ✅
- Batched write: 1 × 50ms = 50ms ✅✅ (10× faster)

**Implementation**:
```typescript
bulkMarkAsPaid(paymentIds: string[]): Result<void, StorageError> {
  const updates = new Map(this.loadStatuses().value);

  // Update all in memory first
  paymentIds.forEach(id => {
    updates.set(id, {
      status: 'paid',
      timestamp: new Date().toISOString()
    });
  });

  // Single write to localStorage
  return this.saveStatuses(updates);
}
```

**React State Update**:
- Use `React.startTransition` for bulk operations (React 19)
- Prevents UI blocking during large updates
- Visual feedback appears within 200ms even with 50+ selections

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Individual writes | 10× slower, unnecessary storage events |
| Web Workers | Overkill for <1ms operations, adds complexity |
| RequestIdleCallback | Unpredictable timing, fails <5s guarantee |

**References**:
- React 19: startTransition API
- localStorage performance benchmarks (MDN)

---

## 6. Risk Analysis Integration

### Decision

Filter paid payments at the data layer before passing to risk detection algorithm.

### Rationale

**Minimal Changes** to existing risk analysis:
```typescript
// In risk analysis service
const pendingPayments = payments.filter(p => {
  const status = paymentStatusService.getStatus(p.id);
  return status?.status !== 'paid';
});

// Existing risk detection logic runs on pendingPayments
const risks = detectCollisions(pendingPayments);
```

**Performance**:
- Filter 500 payments with Map.get(): ~1ms
- Existing risk analysis: ~50-100ms (unchanged)
- **Total: minimal impact** ✅

**Accuracy** (SC-005: 100% correct exclusion):
- Paid payments guaranteed excluded via filter
- Risk warnings only consider pending
- Un-marking payment (undo) re-adds to risk analysis

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Modify risk algorithm | More complex, harder to test |
| Post-processing filter | Risk warnings calculated then discarded (wasteful) |
| Separate risk analysis for paid | Code duplication |

**References**:
- Existing codebase: risk detection service patterns
- Feature 012: data filtering patterns

---

## 7. CSV/Calendar Export Integration

### Decision

**CSV Export** (FR-009, FR-010):
- Add `paid_status` and `paid_timestamp` columns to existing export
- Extend `Payment` type with optional status fields
- PapaParse handles new fields automatically

**Calendar Export** (FR-012):
- Prefix event title with "[PAID]" for paid payments
- Use existing `ics` package (v3.8.1)
- Example: "[PAID] Electricity Bill - $150"

### Rationale

**CSV Schema Extension**:
```typescript
// Existing Payment type
interface Payment {
  description: string;
  amount: number;
  date: string;
  // ... existing fields

  // NEW: Status fields (optional for backward compatibility)
  paid_status?: 'paid' | 'pending';
  paid_timestamp?: string;
}
```

**Calendar Format** (iCal/ICS standard):
```
BEGIN:VEVENT
SUMMARY:[PAID] Netflix Subscription - $15.99
DTSTART:20251015
DESCRIPTION:Paid on 2025-10-15 at 2:30 PM
END:VEVENT
```

**Backward Compatibility**:
- Existing exports work without status (optional fields)
- New exports include status for enhanced tracking
- No breaking changes to CSV consumers

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Separate CSV for paid/pending | Confusing UX, multiple downloads |
| Calendar description only | Less scannable, requires opening event |
| Exclude paid from calendar | Users want complete history (clarification Q1 resolved) |

**References**:
- PapaParse docs: Dynamic fields
- iCal RFC 5545 specification
- Feature 014: CSV export implementation

---

## 8. Storage Migration & Versioning

### Decision

Use schema versioning pattern from Feature 012 with version bump on incompatible changes.

### Rationale

**Schema Version**:
```typescript
interface PaymentStatusSchema {
  version: '1.0.0';  // Semantic versioning
  statuses: Record<PaymentId, PaymentStatusRecord>;
  lastModified: string;
  totalSize: number;
}
```

**Migration Strategy**:
```typescript
if (stored.version !== CURRENT_VERSION) {
  // Migrate or reset based on compatibility
  if (isCompatible(stored.version, CURRENT_VERSION)) {
    migrateSchema(stored);
  } else {
    // Incompatible: warn user and reset
    showMigrationWarning();
    resetStorage();
  }
}
```

**Future-Proofing**:
- Version 1.0.0: Initial release (current plan)
- Version 1.1.0: Add payment notes field (backward compatible)
- Version 2.0.0: Restructure for payment categories (breaking change)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| No versioning | Can't handle future changes safely |
| Timestamp-based | Semantic versioning more standard |
| Automatic migration | Too risky for user data, explicit better |

**References**:
- Feature 012: Schema versioning implementation
- Semantic Versioning 2.0.0 spec

---

## Summary of Key Decisions

| Topic | Decision | Primary Benefit |
|-------|----------|-----------------|
| **Unique IDs** | UUID v4 (existing package) | Industry standard, collision-free |
| **Storage** | localStorage (Feature 012 pattern) | Proven performance, <200ms updates |
| **Visual Indicators** | Triple-mode (color+icon+text) | WCAG 2.1 AA compliant |
| **State Management** | useSyncExternalStore hook | React 19 best practice, concurrent-safe |
| **Bulk Operations** | Batched writes | 10× faster than individual writes |
| **Risk Integration** | Filter at data layer | Minimal changes, guaranteed accuracy |
| **Exports** | Extend existing schemas | Backward compatible, optional fields |
| **Versioning** | Semantic versioning (1.0.0) | Future-proof, explicit migrations |

---

## Technologies Summary

**Required** (already in dependencies):
- `uuid` v13.0.0 - Payment ID generation
- `zod` v4.1.11 - Schema validation
- `react` v19.1.1 - useSyncExternalStore
- `papaparse` v5.5.3 - CSV export extension
- `ics` v3.8.1 - Calendar export extension
- `lucide-react` - Status icons
- `@radix-ui/react-*` - Accessible UI components

**No new dependencies needed** ✅

---

## Open Questions

None - all technical decisions resolved based on existing patterns and industry standards.

---

**Next Phase**: Generate data-model.md with entity definitions based on these research findings.
