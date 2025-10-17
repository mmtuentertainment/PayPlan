# Feature 016: Payment History Archive System - Clarifications Needed

**Generated**: 2025-10-17
**Purpose**: Document ambiguities, gaps, and questions identified during planning review
**Status**: 🟡 NEEDS CLARIFICATION

---

## ⚠️ Critical Clarifications (Blocking Implementation)

### 1. Payment Data Integration - Missing Context

**Issue**: Archives store `PaymentStatusRecord[]` from Feature 015, but these records only contain:
- `paymentId` (UUID)
- `status` (paid/pending)
- `timestamp` (when marked)

**Problem**: The spec and contracts reference displaying payment details in archive views:
- Provider name (e.g., "Electricity Bill")
- Amount (e.g., "$150.00")
- Currency (e.g., "USD")
- Due date (e.g., "Oct 15, 2025")
- Autopay status (boolean)

**Questions**:
1. Where is the actual payment data (provider, amount, etc.) stored?
2. Is there a `Payment` entity separate from `PaymentStatusRecord` that we need to join with?
3. Should archives store a **full payment snapshot** (status + payment details), not just status records?
4. How do we access payment details when displaying archive views?

**Proposed Solution**:
```typescript
// Option A: Archive stores full payment + status (recommended)
interface PaymentArchiveRecord {
  // From PaymentStatusRecord (Feature 015)
  paymentId: string;
  status: 'paid' | 'pending';
  timestamp: string;

  // NEW: Full payment snapshot
  payment: {
    provider: string;
    amount: number;
    currency: string;
    dueDate: string;  // ISO date
    autopay: boolean;
  };
}

// Option B: Archives only store status, join with live payment data (NOT recommended - data may change)
```

**Impact**: Without clarification, archive detail views cannot display payment information as described in spec.

**Recommendation**: Update `data-model.md` Section 1 (Archive entity) to include full payment details in snapshot.

---

### 2. Payment Schedule Source - Feature Dependency Unclear

**Issue**: Spec mentions "existing payment schedule" and "import from CSV/email" but doesn't specify where this data comes from.

**Questions**:
1. Is there a separate "Payment Schedule" feature that manages payment data?
2. How do users initially get payments into PayPlan before marking them as paid/pending?
3. What feature/file manages the core `Payment` entity?
4. Should we assume Feature 015 references a payment schedule, or is this a missing dependency?

**Impact**: Cannot implement archive creation without understanding the source of payment data.

**Proposed Action**:
- Search codebase for existing `Payment` entity or payment schedule management
- If missing, create a `PAYMENT_SCHEDULE.md` in `/specs` documenting the assumed structure
- Update `Dependencies` section in [spec.md](spec.md) with specific file paths

---

### 3. Archive Creation UX Flow - Reset Confirmation Needed

**Issue**: Spec says archives "reset all current payment statuses to pending" (FR-003) but doesn't specify:

**Questions**:
1. Should the "Create Archive" dialog include a **warning** that current statuses will be reset?
   - Example: "Creating an archive will reset all payments to pending. Continue?"
2. Should there be a **two-step confirmation** (name input → reset warning)?
3. Should users have the option to create an archive **without resetting** current statuses?
4. What if a user accidentally creates an archive and loses their current tracking data?

**User Story Impact**: User Story 1 Acceptance Scenario 1 says "resets all 15 current payments to pending" but doesn't mention confirmation.

**Proposed UX Flow**:
```
1. User clicks "Create Archive"
2. Dialog shows:
   - Input field: "Archive name"
   - Checkbox (optional): "Reset current payment statuses after archiving"
   - Warning text: "⚠️ This will clear your current tracking data"
   - Buttons: Cancel, Create Archive
3. On "Create Archive" click:
   - Save archive
   - If checkbox checked (default): reset statuses
   - Show success: "Archive 'October 2025' created. Current tracking reset."
```

**Impact**: Without clarity, users may be confused or frustrated by unexpected data loss.

**Recommendation**: Add explicit confirmation to [quickstart.md](quickstart.md) Scenario 1 and update UI mockups.

---

### 4. Storage Keys - Inconsistency Between Documents

**Issue**: Storage keys are inconsistent across planning documents:

**data-model.md Section 4.1**:
- Archive index: `payplan_archive_index`
- Individual archives: `payplan_archive_<uuid>`

**research.md Section 3**:
- Archive index: `payplan:archive:index` (with colons)
- Individual archives: `payplan:archive:<uuid>`

**contracts/ArchiveStorage.contract.md**:
- Constants: `payplan:archive:index` and `payplan:archive:` prefix

**Questions**:
1. Which format is correct: `payplan_archive` or `payplan:archive` (underscores vs colons)?
2. Is this intentional (different namespacing) or a typo?
3. Feature 015 uses `payplan_payment_status` (underscores) - should we match that pattern?

**Impact**: Implementation will fail if storage keys don't match between files.

**Proposed Fix**: Standardize on `payplan_archive_index` and `payplan_archive_<uuid>` to match Feature 015 pattern.

**Action Required**: Search-replace all instances in:
- `data-model.md`
- `research.md`
- `contracts/ArchiveStorage.contract.md`
- `plan.md`

---

### 5. CSV Export - Column Mapping Undefined

**Issue**: User Story 4 and FR-011 specify CSV export with "standard payment columns" but don't define the exact mapping.

**Questions**:
1. What are the "standard payment columns" from Feature 014? Where is this defined?
2. How do we map `PaymentArchiveRecord` fields to CSV columns?
3. Are there existing CSV export utilities we should reuse, or do we create new ones?
4. What happens if payment data structure changes (e.g., new fields added)?

**Referenced but not defined**:
- "provider, amount, currency, dueISO, autopay" (mentioned in contracts)
- "paid_status, paid_timestamp" (from Feature 015)
- "archive_name, archive_date" (new metadata columns)

**Proposed Action**:
1. Find and document Feature 014's CSV export implementation
2. Create a table in `data-model.md` showing exact CSV column mapping
3. Define column order and header names

**Example Mapping** (needs confirmation):
```typescript
{
  'Provider': payment.provider,
  'Amount': payment.amount.toFixed(2),
  'Currency': payment.currency,
  'Due Date': payment.dueDate,
  'Autopay': payment.autopay ? 'Yes' : 'No',
  'Status': paymentStatus.status,
  'Paid On': paymentStatus.timestamp || '',
  'Archive Name': archive.name,
  'Archive Date': archive.createdAt.split('T')[0]
}
```

---

## 🟠 Important Clarifications (Should Address Before Implementation)

### 6. Archive Statistics - Currency Handling

**Issue**: User Story 3 Acceptance Scenario 4 says "Average Payment calculation is skipped for multiple currencies" but doesn't specify:

**Questions**:
1. How do we determine if an archive has "multiple currencies"?
2. Should we show multiple averages (one per currency)?
   - Example: "Average (USD): $127.50, Average (EUR): €95.00"
3. Or just show "Multiple currencies (not averaged)"?
4. What if 19/20 payments are USD and 1 is EUR - still skip average?

**Proposed Business Rule**:
- If >90% of payments share the same currency, calculate average for that currency only
- Otherwise, display "Multiple currencies" without average

**Action**: Add explicit rule to `data-model.md` Section 5 (ArchiveSummary) or `contracts/ArchiveService.contract.md`.

---

### 7. Archive Name Deduplication - Edge Cases

**Issue**: FR-014 specifies auto-appending " (2)", " (3)" for duplicates, but edge cases are undefined:

**Questions**:
1. What if user creates "October 2025 (2)" as original name, then later creates "October 2025"?
   - Does second become "October 2025 (2)" (collision) or "October 2025 (3)" (smart detection)?
2. What if user deletes "October 2025" then creates new "October 2025"?
   - Reuse the name (IDs are different) or append " (2)" (name history tracking)?
3. Is deduplication case-sensitive? ("October 2025" vs "october 2025")
4. Is deduplication whitespace-sensitive? ("October 2025" vs "October  2025" with double space)

**Proposed Rules**:
- Normalize names before comparison (trim, lowercase, collapse whitespace)
- Detect existing suffix pattern: regex `/ \((\d+)\)$/`
- Find max suffix number across all archives with base name
- Append next number in sequence

**Action**: Add detailed algorithm to `contracts/ArchiveService.contract.md` under `ensureUniqueName()`.

---

### 8. Performance Targets - Verification Method

**Issue**: Multiple success criteria specify performance targets (<100ms, <3s, <5s) but don't specify how to measure.

**Questions**:
1. Should we use `performance.now()` for measurements?
2. Should these be tested in automated tests or manual quickstart scenarios?
3. Are these targets for production (minified) or development builds?
4. What browser/hardware baseline do we target (2020+ laptop, mobile, etc.)?
5. Should we fail CI if performance targets aren't met, or just warn?

**Proposed Approach**:
- Add `performance.mark()` and `performance.measure()` in code
- Create dedicated performance test suite in `tests/performance/`
- Document measurement method in `quickstart.md` for manual validation
- Set up CI warnings (not failures) for performance regressions

**Action**: Add "Performance Testing" section to `plan.md` Phase 7.

---

### 9. Cross-Tab Synchronization - Conflict Resolution

**Issue**: FR-017 specifies cross-tab sync via storage events but doesn't handle conflicts:

**Questions**:
1. What if **Tab A** creates archive "October 2025" while **Tab B** is creating "October 2025" at the same time?
   - Race condition: both write to localStorage simultaneously
2. What if **Tab A** deletes an archive that **Tab B** is currently viewing?
   - Detail page should show "Archive deleted" (covered in User Story 5 Acceptance Scenario 5)
3. What if storage events are missed (browser throttling, tab in background)?
   - Should we implement fallback polling or accept eventual consistency?

**Proposed Strategy**:
- Accept eventual consistency (last-write-wins for localStorage)
- Use archive IDs (UUIDs) to prevent actual conflicts (different IDs even if same name)
- Implement error recovery if archive expected but missing (show "Archive not found" instead of crash)

**Action**: Document conflict scenarios in `research.md` Section 6 (Cross-Tab Sync).

---

### 10. Corrupted Archive Recovery - User Actions

**Issue**: FR-016 says corrupted archives show with "error badge" and "allow deletion" but doesn't specify:

**Questions**:
1. Can users **attempt to repair** corrupted archives (e.g., reset invalid fields to defaults)?
2. Should corrupted archives be **automatically quarantined** (hidden from list by default with "Show corrupted" toggle)?
3. Should we **log corruption details** to browser console for debugging?
4. Can users **export corrupted archive data** as raw JSON for manual recovery?
5. Should system **auto-delete** corrupted archives after warning, or require manual deletion?

**Proposed UX**:
```
Corrupted Archive Item:
┌────────────────────────────────────┐
│ ⚠️ October 2025 (Corrupted)        │
│ Created: Oct 17, 2025              │
│ Error: Invalid JSON structure      │
│                                    │
│ [View Raw Data] [Delete]           │
└────────────────────────────────────┘
```

**Action**: Add detailed corruption handling to `quickstart.md` Scenario 12.

---

## 🟢 Minor Clarifications (Nice to Have)

### 11. Archive Naming Conventions - User Guidance

**Suggestion**: Provide suggested naming patterns to users:
- Monthly: "October 2025", "November 2025"
- Quarterly: "Q4 2025", "2025 Q1"
- Custom: "Before vacation", "After bonus"

**Action**: Add naming suggestions to CreateArchiveDialog placeholder or helper text.

---

### 12. Archive Export Filename - Date Format

**Issue**: Spec says filename is "payplan-archive-october-2025-2025-10-17-143000.csv" but is the timestamp export time or archive creation time?

**Questions**:
1. Should filename timestamp be **export time** (when CSV generated) or **archive creation time**?
2. Should we include seconds in timestamp or just date?

**Proposed Format**: `payplan-archive-{slugified-name}-{archive-createdAt}.csv` (use archive creation date for consistency)

---

### 13. Archive Statistics - Date Range Format

**Issue**: Example shows "Oct 1-31, 2025" but format isn't standardized.

**Questions**:
1. Should we use localized date format (respects user's locale)?
2. What format for single-day archives? "Oct 15, 2025" or "Oct 15-15, 2025"?
3. Should we abbreviate months ("Oct") or use full names ("October")?

**Proposed Format**:
- Use locale-aware `Intl.DateTimeFormat` for consistency with Feature 012 (Preferences)
- Single-day: "Oct 15, 2025" (no range dash)
- Range: "Oct 1-31, 2025"

---

### 14. Empty Archive Edge Case - Should We Allow?

**Issue**: User Story 1 Acceptance Scenario 3 says "no payments to archive" shows error, but what about:

**Questions**:
1. Should users be able to create an archive with **all pending** (0 paid)?
   - This is technically valid data, just not very useful
2. Should we **warn** but still allow, or **block** entirely?

**Proposed Rule**: Allow archives with 0 paid payments (they're tracking data), but block archives with 0 total payments.

---

## 📋 Action Items Summary

**Critical** (Must resolve before implementation):
1. ✅ Clarify payment data integration (Payment entity + PaymentArchiveRecord structure)
2. ✅ Identify payment schedule feature dependency
3. ✅ Define archive creation reset confirmation UX
4. ✅ Standardize storage key format across all documents
5. ✅ Document CSV column mapping from Feature 014

**Important** (Should resolve during Phase 1-2):
6. Define currency handling rules for statistics
7. Document archive name deduplication algorithm
8. Define performance measurement method
9. Document cross-tab conflict resolution
10. Specify corrupted archive recovery UX

**Minor** (Can resolve during implementation):
11. Add archive naming guidance
12. Clarify export filename timestamp source
13. Standardize date range display format
14. Define empty archive rules

---

## 🔄 Next Steps

1. **Review with stakeholders**: Discuss critical clarifications (1-5)
2. **Update planning docs**: Incorporate resolutions into spec.md, data-model.md, contracts
3. **Re-run constitution check**: Ensure no new violations introduced
4. **Generate tasks.md**: Once clarifications resolved, create atomic task breakdown
5. **Begin Phase 1 implementation**: Setup & Types with resolved data models

---

**Questions or feedback?** Add comments to this file or discuss in feature branch PR review.
