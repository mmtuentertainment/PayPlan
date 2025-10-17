# Quickstart: Payment Status Tracking - Manual Testing Guide

**Feature**: 015-build-a-payment
**Date**: 2025-10-15
**Purpose**: Manual testing scenarios to validate payment status tracking functionality before automated test implementation

## Prerequisites

### Required Setup

1. **Development Environment**:
   ```bash
   cd /home/matt/PROJECTS/PayPlan
   git checkout 015-build-a-payment
   npm install  # Backend dependencies
   cd frontend && npm install  # Frontend dependencies
   ```

2. **Start Application**:
   ```bash
   # Terminal 1: Backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

3. **Open Browser**:
   - Navigate to `http://localhost:5173` (Vite dev server)
   - Open DevTools: F12 or Right-click → Inspect
   - Navigate to Application → Local Storage → `http://localhost:5173`

4. **Test Data**:
   - Import a CSV with 10+ payments (or use email import)
   - Ensure payments have `id` fields (UUID v4 format)
   - Navigate to "This Week" view

---

## Test Scenario 1: Mark Single Payment as Paid (P1 - Core Functionality)

**Spec Reference**: User Story 1, FR-001, FR-004, SC-001, SC-002

### Setup
- Ensure you have at least 3 payments visible in "This Week" view
- All payments should initially be "pending" (no checkboxes checked)

### Steps

1. **Mark Payment as Paid**:
   - [ ] Locate a payment row (e.g., "Electricity Bill - $150")
   - [ ] Click the checkbox or "Mark as Paid" button next to it
   - [ ] **Verify**: Visual change occurs **within 2 seconds** (SC-001)
   - [ ] **Verify**: Payment shows visual distinction:
     - Strikethrough text OR
     - Green badge/checkmark icon OR
     - Reduced opacity (0.6) OR
     - Combination of above
   - [ ] **Verify**: Other payments remain unchanged (only selected one affected)

2. **Check LocalStorage Persistence**:
   - [ ] Open DevTools → Application → Local Storage
   - [ ] Find key: `payplan_payment_status`
   - [ ] **Verify**: JSON contains payment ID with `"status": "paid"`
   - [ ] **Verify**: `timestamp` field is present (ISO 8601 format)
   - [ ] Example:
     ```json
     {
       "version": "1.0.0",
       "statuses": {
         "550e8400-...": {
           "paymentId": "550e8400-...",
           "status": "paid",
           "timestamp": "2025-10-15T14:30:00.000Z"
         }
       },
       "totalSize": 234,
       "lastModified": "2025-10-15T14:30:00.000Z"
     }
     ```

3. **Test Persistence Across Refresh** (SC-002):
   - [ ] Refresh the page (F5)
   - [ ] **Verify**: Payment is **still** marked as paid (visual indicator present)
   - [ ] **Verify**: Checkbox remains checked
   - [ ] **Verify**: No console errors

4. **Test Persistence Across Tab Close/Reopen**:
   - [ ] Close the browser tab
   - [ ] Reopen `http://localhost:5173`
   - [ ] Navigate back to "This Week" view
   - [ ] **Verify**: Payment is **still** marked as paid

5. **Test Undo (Toggle to Pending)** (FR-005):
   - [ ] Click the checkbox again (or "Mark as Pending" button)
   - [ ] **Verify**: Payment returns to pending state (visual changes revert)
   - [ ] **Verify**: Visual feedback appears **within 200ms** (SC-003)
   - [ ] Check localStorage: `"status": "pending"` OR payment removed from collection

**Pass Criteria**:
- ✅ Visual feedback < 2 seconds
- ✅ Status persists across refresh and tab close
- ✅ Toggle works bidirectionally (paid ↔ pending)
- ✅ Only selected payment changes (isolation)

---

## Test Scenario 2: Risk Analysis Excludes Paid Payments (P2 - Integration)

**Spec Reference**: User Story 2, FR-006, SC-005

### Setup
- Create a payment schedule with **3 payments on the same day** (Friday, for example)
- All 3 payments should initially show a risk warning (collision detected)

### Steps

1. **Verify Initial Risk Warning**:
   - [ ] Navigate to risk analysis view or collision warnings section
   - [ ] **Verify**: Warning appears for the day with 3 payments
   - [ ] Example: "⚠️ 3 payments scheduled for Friday, Oct 20 - Risk of overdraft"

2. **Mark One Payment as Paid**:
   - [ ] Mark the first of the 3 Friday payments as paid
   - [ ] **Verify**: Risk warning updates to show only **2 payments** at risk
   - [ ] Example: "⚠️ 2 payments scheduled for Friday, Oct 20 - Risk of overdraft"

3. **Mark Second Payment as Paid**:
   - [ ] Mark the second Friday payment as paid
   - [ ] **Verify**: Risk warning updates to show **1 payment** (or warning disappears if threshold not met)

4. **Mark All Payments as Paid**:
   - [ ] Mark the third (last) Friday payment as paid
   - [ ] **Verify**: **No collision warning** shown for Friday (SC-005: 100% accuracy)

5. **Test Undo Restores Warning**:
   - [ ] Mark one Friday payment back to pending (undo)
   - [ ] **Verify**: Risk warning **re-appears** for Friday
   - [ ] **Verify**: Warning shows correct count (1 pending payment)

6. **Edge Case: No Pending Payments**:
   - [ ] Mark all payments in the week as paid
   - [ ] **Verify**: Risk analysis shows "No risks detected" or similar message
   - [ ] **Verify**: No false warnings appear

**Pass Criteria**:
- ✅ Risk warnings exclude paid payments
- ✅ Warnings update immediately when status changes
- ✅ Un-marking payment re-adds it to risk calculation
- ✅ No false positives when all payments paid

---

## Test Scenario 3: Bulk Mark Multiple Payments (P3 - Efficiency)

**Spec Reference**: User Story 3, FR-007, FR-008, SC-004

### Setup
- Ensure you have at least 10 payments visible
- All payments should be pending initially

### Steps

1. **Select Multiple Payments**:
   - [ ] Enable selection mode (if required - e.g., "Select Multiple" button)
   - [ ] Select 5 payments using checkboxes
   - [ ] **Verify**: Selected payments are visually highlighted

2. **Bulk Mark as Paid**:
   - [ ] Click "Mark as Paid" button (bulk action)
   - [ ] **Verify**: All 5 payments change status **simultaneously**
   - [ ] **Verify**: Operation completes in **<5 seconds** (SC-004)
   - [ ] **Verify**: All 5 have the **same timestamp** (check localStorage)

3. **Bulk Mark as Pending** (Undo):
   - [ ] Select the same 5 payments (now marked as paid)
   - [ ] Click "Mark as Pending" button
   - [ ] **Verify**: All 5 return to pending state **simultaneously**
   - [ ] **Verify**: New shared timestamp applied

4. **Mixed Selection** (Edge Case):
   - [ ] Mark 2 payments as paid manually
   - [ ] Select all 5 payments (2 paid, 3 pending)
   - [ ] Click "Mark as Paid"
   - [ ] **Verify**: 3 pending payments become paid
   - [ ] **Verify**: 2 already-paid payments remain paid (idempotent)

5. **Performance Test** (SC-004):
   - [ ] Select 10 payments
   - [ ] Start timer
   - [ ] Click "Mark as Paid"
   - [ ] Stop timer when all 10 show paid status
   - [ ] **Verify**: Total time **< 5 seconds** ✅

6. **Check localStorage (Single Write)**:
   - [ ] Before bulk operation: Note the `lastModified` timestamp
   - [ ] Perform bulk mark on 5 payments
   - [ ] Check localStorage: `lastModified` should update **once** (not 5 times)
   - [ ] **Verify**: Single `storage` event triggered (open second tab to test cross-tab sync)

**Pass Criteria**:
- ✅ Bulk operations update all selected payments atomically
- ✅ 10 payments bulk-marked in <5 seconds
- ✅ Single storage write (not one per payment)
- ✅ Mixed selections handled correctly (idempotent)

---

## Test Scenario 4: CSV Export with Payment Status (P4 - Export Integration)

**Spec Reference**: User Story 4, FR-009, FR-010, FR-011

### Setup
- Mark 3 payments as paid, leave 3 as pending
- Navigate to CSV export feature

### Steps

1. **Export All Payments**:
   - [ ] Click "Export to CSV" button
   - [ ] **Verify**: CSV file downloads successfully
   - [ ] Open CSV in text editor or Excel
   - [ ] **Verify**: Columns include `paid_status` and `paid_timestamp`
   - [ ] **Verify**: Paid payments show:
     - `paid_status`: `"paid"`
     - `paid_timestamp`: ISO 8601 date (e.g., `"2025-10-15T14:30:00.000Z"`)
   - [ ] **Verify**: Pending payments show:
     - `paid_status`: `"pending"`
     - `paid_timestamp`: `""` (empty string)

2. **Export Only Pending Payments** (FR-011):
   - [ ] Select "Export only pending payments" option (if available)
   - [ ] Click "Export to CSV"
   - [ ] **Verify**: CSV contains **only** pending payments (paid ones excluded)
   - [ ] **Verify**: `paid_status` column still present (all rows show "pending")

3. **Backward Compatibility**:
   - [ ] If user has no paid payments, export CSV
   - [ ] **Verify**: Export still works (no errors)
   - [ ] **Verify**: All `paid_status` = `"pending"`, all `paid_timestamp` = `""`

4. **Calendar Export** (FR-012):
   - [ ] Click "Export to Calendar" button
   - [ ] Download `.ics` file
   - [ ] Open in text editor
   - [ ] **Verify**: Paid payments have `[PAID]` prefix in `SUMMARY` field
   - [ ] Example:
     ```
     BEGIN:VEVENT
     SUMMARY:[PAID] Electricity Bill - $150
     DTSTART:20251015
     END:VEVENT
     ```
   - [ ] **Verify**: Pending payments have **no prefix**

**Pass Criteria**:
- ✅ CSV includes `paid_status` and `paid_timestamp` columns
- ✅ Paid payments show correct status and timestamp
- ✅ Pending-only export works correctly
- ✅ Calendar events include `[PAID]` prefix

---

## Test Scenario 5: Clear All Payment Statuses (P5 - Maintenance)

**Spec Reference**: User Story 5, FR-013, FR-014

### Setup
- Mark 5+ payments as paid
- Ensure some payments remain pending

### Steps

1. **Trigger Clear All**:
   - [ ] Click "Clear All Payment Statuses" button (or navigate to settings)
   - [ ] **Verify**: Confirmation dialog appears (FR-014)
   - [ ] **Verify**: Dialog message warns about irreversibility
   - [ ] Example: "This will reset all payments to pending. This cannot be undone."

2. **Cancel Clear** (FR-014):
   - [ ] Click "Cancel" in confirmation dialog
   - [ ] **Verify**: Dialog closes
   - [ ] **Verify**: No changes made (all paid payments remain paid)

3. **Confirm Clear**:
   - [ ] Click "Clear All" button again
   - [ ] Click "Confirm" in dialog
   - [ ] **Verify**: All payments return to **pending** state
   - [ ] **Verify**: Operation completes in **<3 seconds** (SC-007)
   - [ ] Check localStorage: `payplan_payment_status` key is **removed**

4. **Edge Case: Clear When Empty** (FR-014 edge case):
   - [ ] Ensure no payments are marked as paid
   - [ ] Click "Clear All Payment Statuses"
   - [ ] **Verify**: Message indicates nothing to clear (e.g., "No payment statuses to clear")
   - [ ] **Verify**: No confirmation dialog shown (or confirmation shows "0 statuses")

5. **Verify Persistence**:
   - [ ] After clearing, mark 2 payments as paid
   - [ ] Refresh page
   - [ ] **Verify**: Only the 2 new payments are marked as paid (old cleared data does not return)

**Pass Criteria**:
- ✅ Confirmation dialog appears before clearing
- ✅ Cancel button works (no changes)
- ✅ Confirm clears all statuses in <3 seconds
- ✅ Empty state handled gracefully

---

## Test Scenario 6: Accessibility & Visual Indicators (WCAG 2.1 AA)

**Spec Reference**: SC-009, FR-004

### Setup
- Mark 3 payments as paid, leave 3 as pending
- Use browser accessibility tools (e.g., Axe DevTools)

### Steps

1. **Color Contrast** (WCAG 1.4.3):
   - [ ] Use browser DevTools Color Picker
   - [ ] Check paid badge background vs. text color
   - [ ] **Verify**: Contrast ratio ≥ 4.5:1 for normal text
   - [ ] Check pending badge background vs. text color
   - [ ] **Verify**: Contrast ratio ≥ 4.5:1 for normal text

2. **Non-Color Indicators** (WCAG 1.4.1):
   - [ ] Enable browser colorblind simulation (DevTools → Rendering → Emulate vision deficiencies)
   - [ ] Try "Protanopia" (red-green colorblindness)
   - [ ] **Verify**: Paid vs. pending payments are **still distinguishable**
   - [ ] Should rely on icons + text, not just color

3. **Screen Reader Support** (WCAG 4.1.2):
   - [ ] Enable screen reader (NVDA on Windows, VoiceOver on Mac)
   - [ ] Tab to a paid payment
   - [ ] **Verify**: Screen reader announces "Paid" or "Payment marked as paid"
   - [ ] Tab to a pending payment
   - [ ] **Verify**: Screen reader announces "Pending" or "Payment pending"

4. **Keyboard Navigation**:
   - [ ] Use Tab key to navigate to payment checkboxes
   - [ ] Press Space to toggle status
   - [ ] **Verify**: Status changes without mouse click
   - [ ] **Verify**: Focus indicator is visible

5. **ARIA Attributes**:
   - [ ] Inspect paid payment in DevTools
   - [ ] **Verify**: `role="status"` or `aria-label` present
   - [ ] **Verify**: `aria-live="polite"` for status changes (screen reader announces updates)

**Pass Criteria**:
- ✅ Contrast ratios meet WCAG 2.1 AA (4.5:1)
- ✅ Colorblind users can distinguish paid/pending
- ✅ Screen readers announce status correctly
- ✅ Keyboard-only navigation works

---

## Test Scenario 7: Cross-Tab Synchronization

**Spec Reference**: research.md Section 2 (localStorage + storage events)

### Setup
- Open PayPlan in two browser tabs (Tab A and Tab B)
- Navigate both tabs to "This Week" view

### Steps

1. **Mark Payment in Tab A**:
   - [ ] In **Tab A**: Mark a payment as paid
   - [ ] **Verify**: Tab A shows paid status immediately

2. **Check Tab B Updates**:
   - [ ] Switch to **Tab B** (do not refresh)
   - [ ] **Verify**: Payment status updates automatically (shows as paid)
   - [ ] **Verify**: Update happens **within 1-2 seconds** (storage event propagation)

3. **Bulk Operation Sync**:
   - [ ] In **Tab A**: Bulk mark 5 payments as paid
   - [ ] Switch to **Tab B**
   - [ ] **Verify**: All 5 payments update in Tab B

4. **Clear All Sync**:
   - [ ] In **Tab A**: Clear all payment statuses
   - [ ] Switch to **Tab B**
   - [ ] **Verify**: All payments reset to pending in Tab B

**Pass Criteria**:
- ✅ Changes in one tab reflect in other tabs automatically
- ✅ No manual refresh required
- ✅ Sync happens within 1-2 seconds

---

## Test Scenario 8: Error Handling & Edge Cases

**Spec Reference**: data-model.md Error Handling, StorageError types

### Steps

1. **QuotaExceeded Error** (Test Storage Limit):
   - [ ] Open DevTools Console
   - [ ] Run script to fill localStorage near capacity:
     ```javascript
     // Fill localStorage
     for (let i = 0; i < 5000; i++) {
       localStorage.setItem(`test_${i}`, 'x'.repeat(1000));
     }
     ```
   - [ ] Try to mark a payment as paid
   - [ ] **Verify**: Error message shown: "Storage limit exceeded. Please clear old payment statuses."
   - [ ] **Verify**: Payment status does NOT change (failed safely)
   - [ ] Clean up:
     ```javascript
     // Clear test data
     for (let i = 0; i < 5000; i++) {
       localStorage.removeItem(`test_${i}`);
     }
     ```

2. **Security Error** (localStorage Disabled):
   - [ ] Open DevTools → Application → Storage
   - [ ] Right-click "Local Storage" → Block
   - [ ] Try to mark payment as paid
   - [ ] **Verify**: Error message: "Browser storage is disabled or blocked."
   - [ ] Re-enable localStorage after test

3. **Corrupted Data Recovery**:
   - [ ] Open DevTools Console
   - [ ] Manually corrupt localStorage:
     ```javascript
     localStorage.setItem('payplan_payment_status', '{invalid json');
     ```
   - [ ] Refresh page
   - [ ] **Verify**: No errors (graceful recovery)
   - [ ] **Verify**: Corrupted data is cleared
   - [ ] **Verify**: All payments show as pending (default state)

4. **Invalid Payment ID**:
   - [ ] Open DevTools Console
   - [ ] Try to mark payment with invalid ID:
     ```javascript
     paymentStatusService.markAsPaid('not-a-uuid');
     ```
   - [ ] **Verify**: Validation error returned (not saved)
   - [ ] **Verify**: Error message: "Invalid payment ID format. Must be UUID v4."

**Pass Criteria**:
- ✅ QuotaExceeded error shown when storage full
- ✅ Security error shown when localStorage disabled
- ✅ Corrupted data handled gracefully (no crash)
- ✅ Invalid IDs rejected with clear error message

---

## Test Scenario 9: Performance Benchmarks

**Spec Reference**: SC-001, SC-003, SC-004, SC-008

### Setup
- Create a payment schedule with **500 payments** (maximum supported)
- Use browser DevTools Performance tab

### Steps

1. **Load 500 Payments** (SC-008):
   - [ ] Open Performance tab in DevTools
   - [ ] Start recording
   - [ ] Refresh page
   - [ ] Stop recording after payments load
   - [ ] **Verify**: Payment status load time **< 100ms** (NFR from Feature 012)
   - [ ] **Verify**: No performance warnings or errors

2. **Mark Single Payment** (SC-001):
   - [ ] Start timer (use stopwatch or DevTools)
   - [ ] Click "Mark as Paid" on a payment
   - [ ] Measure time until visual change appears
   - [ ] **Verify**: Total time **< 2 seconds** ✅

3. **Visual Feedback Latency** (SC-003):
   - [ ] Open Performance tab
   - [ ] Record clicking "Mark as Paid"
   - [ ] Measure time from click to first paint (visual change)
   - [ ] **Verify**: Visual feedback appears **< 200ms** ✅

4. **Bulk 10 Payments** (SC-004):
   - [ ] Select 10 payments
   - [ ] Start timer
   - [ ] Click "Mark as Paid"
   - [ ] Stop timer when all 10 visually change
   - [ ] **Verify**: Total time **< 5 seconds** ✅

5. **Storage Size with 500 Payments** (SC-008):
   - [ ] Mark all 500 payments as paid
   - [ ] Open DevTools → Application → Local Storage
   - [ ] Check `payplan_payment_status` size
   - [ ] **Verify**: Size ≈ 50-70 KB (from research.md estimate)
   - [ ] **Verify**: No storage errors

**Pass Criteria**:
- ✅ 500 payments load in <100ms
- ✅ Single mark in <2 seconds
- ✅ Visual feedback in <200ms
- ✅ Bulk 10 in <5 seconds
- ✅ 500 payments stored without errors (~50-70 KB)

---

## Browser Compatibility Testing

### Browsers to Test

Test all scenarios above in:

- [ ] **Chrome 90+** (primary target)
- [ ] **Firefox 88+**
- [ ] **Safari 14+** (macOS/iOS)
- [ ] **Edge 90+**

### Known Issues / Fallbacks

- **Private/Incognito Mode**: localStorage may be disabled → Security error expected
- **Older Browsers** (<2021): May lack useSyncExternalStore → Use polyfill or fallback

---

## Cleanup After Testing

```bash
# Clear all test data
localStorage.clear();

# Or clear only payment status
localStorage.removeItem('payplan_payment_status');

# Reset browser to normal state
# - Re-enable localStorage if disabled
# - Remove colorblind simulation
# - Close extra tabs
```

---

## Success Criteria Summary

**All scenarios must pass** for feature to be ready for automated testing and deployment:

| Scenario | Pass? | Notes |
|----------|-------|-------|
| 1. Mark Single Payment | ⬜ | Core P1 functionality |
| 2. Risk Analysis Integration | ⬜ | P2 integration |
| 3. Bulk Operations | ⬜ | P3 efficiency |
| 4. CSV/Calendar Export | ⬜ | P4 export integration |
| 5. Clear All Statuses | ⬜ | P5 maintenance |
| 6. Accessibility (WCAG) | ⬜ | SC-009 compliance |
| 7. Cross-Tab Sync | ⬜ | localStorage events |
| 8. Error Handling | ⬜ | Resilience |
| 9. Performance | ⬜ | SC-001, SC-003, SC-004, SC-008 |

---

## Next Steps After Manual Testing

1. **Capture Test Results**: Document any failures or unexpected behavior
2. **Generate Automated Tests**: Use `/speckit.tasks` to create TDD task breakdown
3. **Implement Feature**: Follow tasks.md with test-first approach
4. **Run Automated Test Suite**: `npm test` (frontend tests)
5. **Deploy to Staging**: Test in production-like environment

---

**Questions or Issues?**
- Review contracts: [PaymentStatusStorage](contracts/PaymentStatusStorage.contract.md), [PaymentStatusService](contracts/PaymentStatusService.contract.md)
- Check data model: [data-model.md](data-model.md)
- Review research: [research.md](research.md)
