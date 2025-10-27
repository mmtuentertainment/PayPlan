# localStorage Security & Data Protection Strategy

**Feature**: PayPlan Application-Wide
**Created**: 2025-10-23
**Updated**: 2025-10-23

## Overview

This document defines the security and data protection strategy for all localStorage operations in the PayPlan application. It establishes clear guidelines for what data can be stored, how it must be protected, and how to prevent sensitive information leakage.

## Privacy-First Principles

PayPlan operates on a **privacy-first, no-server** architecture. All data is stored locally in the user's browser. This makes localStorage security CRITICAL because:

1. No server-side validation or sanitization
2. No encryption at rest (browser limitation)
3. Data persists across sessions
4. Data is accessible to all JavaScript code in the same origin

## Allowed localStorage Keys & Data

### 1. Payment Status Storage (`payment_status_storage_v1`)

**Purpose**: Track which payments have been marked as "paid" vs "pending"

**Allowed Data**:
- ✅ Payment IDs (UUID v4 format only)
- ✅ Status values (`'paid'` | `'pending'`)
- ✅ Timestamps (ISO 8601 format)
- ✅ Schema version number
- ✅ Collection metadata (lastModified, totalSize)

**PROHIBITED Data**:
- ❌ Payment amounts (e.g., `45.00`, `32.50`)
- ❌ Provider names (e.g., `'Klarna'`, `'Affirm'`)
- ❌ Due dates (e.g., `'2025-10-14'`)
- ❌ Currency codes
- ❌ Any PII (Personally Identifiable Information)

**Example Valid Storage**:
```json
{
  "version": 1,
  "statuses": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "paymentId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "paid",
      "timestamp": "2025-10-14T10:30:00Z"
    }
  },
  "totalSize": 256,
  "lastModified": "2025-10-14T10:30:00Z"
}
```

**Rationale**: Payment status storage only needs to track the minimal data required for the checkbox state. Storing only IDs prevents sensitive financial data from lingering in localStorage unnecessarily.

---

### 2. Payment Archive Storage (`payment_archive_*`)

**Purpose**: Save complete snapshots of payment history for user reference

**Allowed Data**:
- ✅ Complete PaymentRecord objects (amounts, providers, dates, etc.)
- ✅ Archive metadata (name, createdAt, id)

**Why This Is Different**:
Archives are **intentional user actions** to save their payment history. Users explicitly choose to create archives and understand they're saving their data. This is different from transient status tracking.

**Protection Measures**:
- ✅ 50-archive limit (prevents unbounded storage)
- ✅ 5MB total size limit (enforced by ArchiveService)
- ✅ User can delete archives at any time
- ✅ Zod validation before storage

**Keys**:
- `payment_archive_index_v1` - Index of all archives
- `payment_archive_{archiveId}` - Individual archive data

---

### 3. User Preferences (Future: Feature 018 or later)

**Allowed Data** (when implemented):
- ✅ Timezone preference
- ✅ Currency format preference
- ✅ Locale settings
- ✅ UI theme preference

**PROHIBITED Data**:
- ❌ Any payment-related data
- ❌ Financial information
- ❌ Authentication tokens (we don't use auth)

---

## Validation Requirements

### Before Writing to localStorage

All data MUST be validated with Zod schemas before storage:

```typescript
// ✅ CORRECT: Validate before storage
const validated = paymentRecordSchema.parse(payment);
localStorage.setItem(key, JSON.stringify(validated));

// ❌ INCORRECT: Direct storage without validation
localStorage.setItem(key, JSON.stringify(payment)); // NO!
```

### Schema Requirements

1. **PaymentRecord**: See `paymentRecordSchema` in `/frontend/src/types/csvExport.ts`
   - Enforces UUID v4 for IDs
   - Max 2 decimal places for amounts
   - ISO 4217 currency codes
   - ISO 8601 dates

2. **PaymentStatusRecord**: See `/frontend/src/lib/payment-status/validation.ts`
   - Only IDs and status values
   - No sensitive fields

---

## XSS Prevention

### User-Controlled Strings

All user-controlled strings (archive names, etc.) MUST be sanitized before display:

```typescript
// ✅ CORRECT: Sanitize before using in UI
const sanitizedName = archiveName
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

setMessage(`Archive "${sanitizedName}" created`);

// ❌ INCORRECT: Raw interpolation
setMessage(`Archive "${archiveName}" created`); // VULNERABLE!
```

**Why**: Archive names are user-controlled and displayed in toast notifications. Without sanitization, a malicious archive name like `<script>alert('XSS')</script>` could execute code.

---

## Testing Requirements

### Required Tests for All localStorage Operations

1. **Validation Tests**: Verify Zod schemas reject invalid data
2. **Security Tests**: Verify sensitive data not stored in status keys
3. **Cleanup Tests**: Verify timeouts/refs cleaned on unmount
4. **Size Tests**: Verify storage limits enforced

### Example Security Test

```typescript
it('should not store raw payment amounts in status storage', () => {
  // ... trigger payment status save ...

  const statusStorage = localStorage.getItem('payment_status_storage_v1');
  expect(statusStorage).not.toContain('45.00'); // amount
  expect(statusStorage).not.toContain('Klarna'); // provider
});
```

---

## Encryption & Tokenization

### Current Status: **NOT IMPLEMENTED**

**Why**: Browser localStorage does not support encryption at rest. Any "encryption" in JavaScript is security theater because the encryption key must also be stored in localStorage or in-code (accessible to attackers).

### Future Considerations

If server-side storage is added:
- Use server-generated tokens instead of raw data
- Store only references/IDs in localStorage
- Fetch sensitive data on-demand from server

---

## Storage Limits

| Storage Type | Size Limit | Record Limit | Enforcement |
|--------------|------------|--------------|-------------|
| Payment Status | 5MB | Unlimited | `PaymentStatusStorage.saveStatus()` |
| Payment Archives | 5MB | 50 archives | `ArchiveService.createArchive()` |
| **Total localStorage** | **~10MB** | N/A | Browser limit (varies) |

---

## Cross-Tab Synchronization

Payment status changes sync across tabs via `storage` events. This does NOT increase security risk because:

- Only status changes sync (not full payment data)
- UUIDs are opaque identifiers
- Listeners validate incoming data

---

## Incident Response

### If Sensitive Data Found in localStorage

1. **Immediate**: Clear the affected storage key
2. **Identify**: Find the code that wrote the data
3. **Fix**: Add Zod validation before storage
4. **Test**: Add security test to prevent regression
5. **Document**: Update this file with the fix

### Reporting

Security issues should be reported via GitHub issues with `security` label.

---

## Compliance Checklist

Before merging code that uses localStorage:

- [ ] Zod schema validates data before storage
- [ ] User-controlled strings sanitized (XSS prevention)
- [ ] Sensitive data (amounts, providers) only in archive keys
- [ ] Payment status keys contain ONLY IDs and statuses
- [ ] Tests verify no sensitive data leakage
- [ ] setTimeout/setInterval cleaned up properly
- [ ] Storage size limits enforced
- [ ] Error handling with Result types

---

## Code Review Guidelines

When reviewing PRs that touch localStorage:

1. **Search for `localStorage.setItem`**
   - Verify Zod validation before write
   - Check for sensitive data fields

2. **Search for user-controlled strings**
   - Archive names, preferences, etc.
   - Verify HTML escaping before display

3. **Check cleanup**
   - `useEffect` cleanup for timers
   - `useRef` for timeout tracking

---

**Document Status**: ✅ Active
**Last Reviewed**: 2025-10-23
**Next Review**: Before each release

