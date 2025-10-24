# Quickstart: Payment History Archive System - Manual Testing Guide

**Feature**: 016-payment-archive-archive
**Date**: 2025-10-17
**Purpose**: Manual testing scenarios to validate payment history archive functionality before automated test implementation

## Prerequisites

### Required Setup

1. **Development Environment**:
   ```bash
   cd /home/matt/PROJECTS/PayPlan
   git checkout 016-payment-archive
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

4. **Test Data Prerequisites**:
   - Feature 015 (Payment Status Tracking) must be functional
   - Import a CSV with 15-20 payments
   - Mark 8-10 payments as "paid" using Feature 015
   - Verify payments are tracked in localStorage (`payplan_payment_status` key)

---

## Test Scenario 1: Create First Archive (Happy Path - P1 MVP)

**Spec Reference**: User Story 1, FR-001, FR-002, FR-003, SC-001, SC-002

### Setup
- Ensure you have 15 payments with 8 marked as paid, 7 pending
- All payment statuses should be visible in "This Week" view

### Steps

1. **Initiate Archive Creation**:
   - [ ] Locate "Create Archive" button (settings menu or payment view)
   - [ ] Click "Create Archive"
   - [ ] **Verify**: Dialog or form appears with name input field
   - [ ] **Verify**: Dialog shows current status summary (e.g., "8 paid, 7 pending")

2. **Enter Archive Name**:
   - [ ] Type "October 2025" in the name input field
   - [ ] **Verify**: Input accepts Unicode characters
   - [ ] **Verify**: Character count or validation shown (if applicable)
   - [ ] Click "Create" or "Confirm" button

3. **Verify Archive Creation** (SC-001):
   - [ ] Start timer from clicking "Create Archive" to completion
   - [ ] **Verify**: Operation completes in **< 5 seconds** ✅
   - [ ] **Verify**: Success message or toast notification appears
   - [ ] **Verify**: Dialog closes automatically

4. **Check Current Payments Reset** (FR-003):
   - [ ] Navigate to "This Week" view
   - [ ] **Verify**: ALL payments now show as "pending" (no paid status)
   - [ ] **Verify**: Visual indicators (checkmarks, badges) cleared
   - [ ] Check DevTools → Local Storage → `payplan_payment_status`
   - [ ] **Verify**: Collection is empty or all statuses are "pending"

5. **Check Archive Stored in localStorage** (FR-004):
   - [ ] Open DevTools → Application → Local Storage
   - [ ] **Verify**: New key exists: `payplan:archive:index`
   - [ ] **Verify**: Archive index JSON contains:
     ```json
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
         }
       ],
       "lastModified": "2025-10-17T14:30:00.000Z"
     }
     ```
   - [ ] **Verify**: Individual archive key exists: `payplan:archive:550e8400-...`
   - [ ] **Verify**: Individual archive contains all 15 payment records with statuses

6. **Test Persistence Across Refresh** (SC-002):
   - [ ] Refresh the page (F5)
   - [ ] Navigate to Archive History page
   - [ ] **Verify**: "October 2025" archive is **still** visible
   - [ ] **Verify**: Current payments remain pending (not restored)

7. **Test Persistence Across Tab Close/Reopen**:
   - [ ] Close the browser tab
   - [ ] Reopen `http://localhost:5173`
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Archive is **still** present (100% persistence)

**Pass Criteria**:
- ✅ Archive creation completes in < 5 seconds
- ✅ Current payments reset to pending immediately
- ✅ Archive stored in localStorage with correct structure
- ✅ Archive persists across refresh and tab close

---

## Test Scenario 2: Create Archive with Duplicate Name (P1 Edge Case)

**Spec Reference**: FR-014, User Story 1 Acceptance Scenario 5

### Setup
- Already have archive "October 2025" from Scenario 1
- Mark 5 new payments as paid

### Steps

1. **Attempt Duplicate Archive Creation**:
   - [ ] Click "Create Archive"
   - [ ] Enter name "October 2025" (exact match)
   - [ ] Click "Create"

2. **Verify Auto-Duplication Handling** (FR-014):
   - [ ] **Verify**: Archive is created (no error)
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Two archives exist:
     - "October 2025" (original)
     - "October 2025 (2)" (new with auto-appended suffix)
   - [ ] **Verify**: Both archives have unique IDs

3. **Test Triple Duplication**:
   - [ ] Mark 3 more payments as paid
   - [ ] Create archive "October 2025" again
   - [ ] **Verify**: Third archive becomes "October 2025 (3)"

4. **Check localStorage Structure**:
   - [ ] Open DevTools → Local Storage
   - [ ] **Verify**: Archive index contains 3 entries with unique IDs
   - [ ] **Verify**: Three separate keys: `payplan:archive:{id1}`, `payplan:archive:{id2}`, `payplan:archive:{id3}`

**Pass Criteria**:
- ✅ Duplicate names handled automatically
- ✅ Suffix pattern " (2)", " (3)", etc. applied correctly
- ✅ Each archive has unique ID
- ✅ No errors or data loss

---

## Test Scenario 3: View Archive List (P2)

**Spec Reference**: User Story 2, FR-008, SC-004

### Setup
- Create 3 archives with different names: "August 2025", "September 2025", "October 2025"
- Each with varying payment counts

### Steps

1. **Navigate to Archive History Page**:
   - [ ] Click "Archive History" button or nav menu item
   - [ ] Start timer (measure page load time)
   - [ ] **Verify**: Page loads in **< 100ms** with 3 archives (SC-004) ✅
   - [ ] **Verify**: No full archive data loaded yet (only metadata)

2. **Verify Archive List Display** (FR-008):
   - [ ] **Verify**: All 3 archives shown in list/grid
   - [ ] For each archive, verify metadata displayed:
     - [ ] Archive name (e.g., "October 2025")
     - [ ] Creation date (human-readable format, e.g., "Oct 17, 2025")
     - [ ] Total payment count (e.g., "15 payments")
     - [ ] Paid/pending counts optional (e.g., "8 paid, 7 pending")
   - [ ] **Verify**: Action buttons present: "View", "Export", "Delete"

3. **Verify Sorting/Ordering**:
   - [ ] **Verify**: Archives sorted by creation date (newest first) OR name (alphabetical)
   - [ ] Check order matches localStorage index order

4. **Test Performance with 20 Archives** (SC-004):
   - [ ] Create 17 more archives (total 20)
   - [ ] Refresh page
   - [ ] Start timer
   - [ ] Load Archive History page
   - [ ] **Verify**: Page loads in **< 100ms** ✅
   - [ ] **Verify**: No performance degradation or lag

**Pass Criteria**:
- ✅ Archive list loads in < 100ms (3 archives)
- ✅ All metadata displayed correctly
- ✅ 20 archives load in < 100ms without lag
- ✅ Archive list only loads index, not full data

---

## Test Scenario 4: View Archive Details (P2)

**Spec Reference**: User Story 2, FR-009, SC-003

### Setup
- Have archive "October 2025" with 15 payments (8 paid, 7 pending)

### Steps

1. **Open Archive Detail View**:
   - [ ] Navigate to Archive History page
   - [ ] Click "View" button on "October 2025"
   - [ ] Start timer (measure detail page load)
   - [ ] **Verify**: Detail page loads in **< 100ms** (SC-003) ✅

2. **Verify Payment List Display** (FR-009):
   - [ ] **Verify**: All 15 payments shown in list
   - [ ] For each payment, verify display includes:
     - [ ] Provider name (e.g., "Electricity Bill")
     - [ ] Amount (e.g., "$150.00")
     - [ ] Due date (e.g., "Oct 15, 2025")
     - [ ] Status badge: "Paid" or "Pending"
     - [ ] Timestamp for paid payments (e.g., "Paid on Oct 14, 2:30 PM")
   - [ ] **Verify**: Pending payments show no timestamp or "Not paid" indicator

3. **Verify Read-Only State** (FR-007):
   - [ ] **Verify**: No checkboxes or "Mark as Paid" buttons present
   - [ ] **Verify**: No edit controls (no input fields, no save button)
   - [ ] **Verify**: Payment statuses cannot be changed (immutable)

4. **Test Navigation**:
   - [ ] Click "Back" or breadcrumb to return to archive list
   - [ ] **Verify**: Returns to list view without refresh
   - [ ] **Verify**: List still shows all archives (React state preserved)

5. **Test Performance with Large Archive** (SC-003):
   - [ ] Create archive with 50 payments
   - [ ] View detail page
   - [ ] Start timer
   - [ ] **Verify**: Page loads in **< 100ms** ✅

**Pass Criteria**:
- ✅ Detail page loads in < 100ms (15 payments)
- ✅ All payment details displayed correctly
- ✅ Read-only state enforced (no edit controls)
- ✅ 50-payment archive loads in < 100ms

---

## Test Scenario 5: Archive Statistics Display (P3)

**Spec Reference**: User Story 3, FR-010

### Setup
- Create archive "October 2025" with 20 payments: 15 paid, 5 pending

### Steps

1. **View Statistics Panel**:
   - [ ] Open "October 2025" archive detail page
   - [ ] Locate statistics panel (top of page or sidebar)

2. **Verify Count Statistics** (FR-010):
   - [ ] **Verify**: "Total Payments: 20" displayed
   - [ ] **Verify**: "Paid: 15 (75%)" displayed with percentage
   - [ ] **Verify**: "Pending: 5 (25%)" displayed with percentage
   - [ ] **Verify**: Percentages calculated correctly:
     - 15/20 = 75%
     - 5/20 = 25%

3. **Verify Date Range** (FR-010):
   - [ ] **Verify**: "Date Range: Oct 1-31, 2025" displayed
   - [ ] **Verify**: Range calculated from earliest to latest payment due dates
   - [ ] Check archive data: verify dates match earliest and latest payments

4. **Test Edge Case: All Pending** (0 Paid):
   - [ ] Create archive with 10 payments, all pending
   - [ ] View statistics
   - [ ] **Verify**: "Paid: 0 (0%)" displayed without errors
   - [ ] **Verify**: "Pending: 10 (100%)" displayed

5. **Test Edge Case: All Paid** (0 Pending):
   - [ ] Create archive with 10 payments, all paid
   - [ ] View statistics
   - [ ] **Verify**: "Paid: 10 (100%)" displayed
   - [ ] **Verify**: "Pending: 0 (0%)" displayed

**Pass Criteria**:
- ✅ All count statistics displayed correctly
- ✅ Percentages calculated accurately
- ✅ Date range shows earliest to latest
- ✅ Edge cases (0% / 100%) handled without errors

---

## Test Scenario 6: Export Archive to CSV (P4)

**Spec Reference**: User Story 4, FR-011, SC-006

### Setup
- Create archive "October 2025" with 15 payments (8 paid, 7 pending)

### Steps

1. **Export Archive CSV**:
   - [ ] Open "October 2025" archive detail page
   - [ ] Click "Export CSV" button
   - [ ] Start timer (measure export time)
   - [ ] **Verify**: CSV file downloads in **< 3 seconds** (SC-006) ✅
   - [ ] **Verify**: File downloaded successfully (no errors)

2. **Verify CSV Filename** (FR-011):
   - [ ] Check downloaded filename
   - [ ] **Verify**: Format: `payplan-archive-october-2025-2025-10-17-143000.csv`
   - [ ] **Verify**: Archive name slugified (spaces → hyphens, special chars removed)
   - [ ] **Verify**: Timestamp in ISO format (YYYY-MM-DD-HHMMSS)

3. **Verify CSV Content - Standard Columns**:
   - [ ] Open CSV in text editor or Excel
   - [ ] **Verify**: Columns include (from Feature 014):
     - `provider` (e.g., "Electricity Bill")
     - `amount` (e.g., "150.00")
     - `currency` (e.g., "USD")
     - `dueISO` (e.g., "2025-10-15")
     - `autopay` (e.g., "true" or "false")
     - `paid_status` (e.g., "paid" or "pending")
     - `paid_timestamp` (e.g., "2025-10-14T14:30:00.000Z" or empty)

4. **Verify CSV Content - Archive Metadata Columns** (FR-011):
   - [ ] **Verify**: Additional columns present:
     - `archive_name` (value: "October 2025" for all rows)
     - `archive_date` (value: "2025-10-17T14:30:00.000Z" for all rows)
   - [ ] **Verify**: Metadata consistent across all 15 rows

5. **Verify Data Accuracy**:
   - [ ] Count rows in CSV (excluding header)
   - [ ] **Verify**: 15 rows (matching archive payment count)
   - [ ] Check 3 paid payments:
     - [ ] `paid_status` = "paid"
     - [ ] `paid_timestamp` = ISO date (not empty)
   - [ ] Check 3 pending payments:
     - [ ] `paid_status` = "pending"
     - [ ] `paid_timestamp` = empty string

6. **Test Unicode Archive Name** (SC-009):
   - [ ] Create archive "October 2025 💰"
   - [ ] Export CSV
   - [ ] Open file
   - [ ] **Verify**: `archive_name` column shows "October 2025 💰" (Unicode preserved)
   - [ ] **Verify**: Filename is safely slugified (emoji removed or replaced)

7. **Test Large Archive Export** (50 Payments):
   - [ ] Create archive with 50 payments
   - [ ] Export CSV
   - [ ] Start timer
   - [ ] **Verify**: Export completes in **< 3 seconds** ✅

**Pass Criteria**:
- ✅ CSV downloads in < 3 seconds for 15 payments
- ✅ Filename format correct with slugification
- ✅ Standard + archive metadata columns present
- ✅ All 15 payment rows with accurate data
- ✅ Unicode characters preserved in data
- ✅ 50-payment export < 3 seconds

---

## Test Scenario 7: Delete Archive with Confirmation (P5)

**Spec Reference**: User Story 5, FR-012, SC-007

### Setup
- Create 3 archives: "August 2025", "September 2025", "October 2025"

### Steps

1. **Initiate Archive Deletion**:
   - [ ] Navigate to Archive History page
   - [ ] Locate "March 2025" archive (or oldest)
   - [ ] Click "Delete" button
   - [ ] Start timer (measure deletion time)

2. **Verify Confirmation Dialog** (FR-012):
   - [ ] **Verify**: Confirmation dialog appears
   - [ ] **Verify**: Dialog message: "Delete archive 'March 2025'? This cannot be undone."
   - [ ] **Verify**: Two buttons present: "Cancel" and "Delete"

3. **Test Cancel Action**:
   - [ ] Click "Cancel" button
   - [ ] **Verify**: Dialog closes
   - [ ] **Verify**: Archive is **NOT** deleted (still in list)
   - [ ] Check localStorage: archive key still exists

4. **Test Confirm Deletion** (SC-007):
   - [ ] Click "Delete" again
   - [ ] Click "Delete" (confirm) in dialog
   - [ ] Stop timer
   - [ ] **Verify**: Operation completes in **< 3 seconds** ✅
   - [ ] **Verify**: Success message or toast notification
   - [ ] **Verify**: Archive removed from list immediately

5. **Verify localStorage Cleanup** (FR-012):
   - [ ] Open DevTools → Local Storage
   - [ ] **Verify**: Archive key removed (e.g., `payplan:archive:550e8400-...`)
   - [ ] Check `payplan:archive:index`
   - [ ] **Verify**: Deleted archive removed from index array
   - [ ] **Verify**: Remaining 2 archives still present

6. **Test Persistence After Deletion**:
   - [ ] Refresh page
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Deleted archive is **still** gone (persists)
   - [ ] **Verify**: Remaining archives intact

7. **Test Storage Size Reduction**:
   - [ ] Before deletion: Note localStorage total size (DevTools)
   - [ ] Delete archive
   - [ ] After deletion: Check localStorage size again
   - [ ] **Verify**: Size decreased (freed storage)

**Pass Criteria**:
- ✅ Confirmation dialog appears with correct message
- ✅ Cancel works (no deletion)
- ✅ Deletion completes in < 3 seconds
- ✅ Archive removed from localStorage
- ✅ Deletion persists after refresh

---

## Test Scenario 8: Unicode and Emoji Archive Names (Edge Case)

**Spec Reference**: FR-013, SC-009

### Steps

1. **Create Archive with Emoji**:
   - [ ] Mark 5 payments as paid
   - [ ] Create archive named "October 2025 💰🎉"
   - [ ] **Verify**: Archive created successfully (no errors)

2. **Verify UI Display** (SC-009):
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Emoji displays correctly in list ("October 2025 💰🎉")
   - [ ] Click "View" to open detail page
   - [ ] **Verify**: Emoji displays correctly in page title
   - [ ] **Verify**: No visual glitches or encoding errors

3. **Verify localStorage Storage** (FR-013):
   - [ ] Open DevTools → Local Storage
   - [ ] Check `payplan:archive:index`
   - [ ] **Verify**: Archive name stored as "October 2025 💰🎉" (UTF-8 encoded)
   - [ ] **Verify**: No corruption or replacement characters

4. **Test International Characters**:
   - [ ] Create archive "Paiements Octobre" (French)
   - [ ] **Verify**: Accented characters display correctly
   - [ ] Create archive "十月 2025" (Chinese)
   - [ ] **Verify**: Chinese characters display correctly
   - [ ] Create archive "Οκτώβριος" (Greek)
   - [ ] **Verify**: Greek characters display correctly

5. **Verify CSV Export with Unicode** (SC-009):
   - [ ] Export archive "October 2025 💰🎉"
   - [ ] Open CSV in text editor
   - [ ] **Verify**: `archive_name` column shows "October 2025 💰🎉"
   - [ ] **Verify**: Filename safely slugified (e.g., "payplan-archive-october-2025-...")

**Pass Criteria**:
- ✅ Emoji and Unicode characters accepted in archive names
- ✅ Characters display correctly in UI (100% rendering)
- ✅ Characters stored correctly in localStorage
- ✅ CSV export preserves Unicode in data
- ✅ CSV filename safely slugified

---

## Test Scenario 9: Storage Limit - 50 Archive Limit (Edge Case)

**Spec Reference**: FR-006, SC-008

### Steps

1. **Create 50 Archives**:
   - [ ] Use loop or script to create 50 archives rapidly:
     ```javascript
     // Run in DevTools Console
     for (let i = 1; i <= 50; i++) {
       // Mark 5 payments as paid
       // Create archive `Archive ${i}`
       // Wait for creation to complete
     }
     ```
   - [ ] **Verify**: All 50 archives created successfully
   - [ ] **Verify**: No storage errors during creation

2. **Verify 50-Archive Limit** (FR-006):
   - [ ] Attempt to create 51st archive
   - [ ] Mark 5 payments as paid
   - [ ] Click "Create Archive"
   - [ ] Enter name "Archive 51"
   - [ ] Click "Create"
   - [ ] **Verify**: Error message appears: "Archive limit reached (50/50). Delete old archives to create new ones."
   - [ ] **Verify**: Archive is **NOT** created
   - [ ] Check localStorage: still 50 archives (not 51)

3. **Test Performance with 50 Archives** (SC-008):
   - [ ] Navigate to Archive History page
   - [ ] Start timer
   - [ ] **Verify**: Page loads in **< 100ms** with 50 archives ✅
   - [ ] **Verify**: No performance degradation
   - [ ] **Verify**: No browser lag or freezing

4. **Test Delete and Re-create**:
   - [ ] Delete 1 archive (now 49/50)
   - [ ] Create new archive "Archive 51"
   - [ ] **Verify**: Archive created successfully (limit enforcement works)

**Pass Criteria**:
- ✅ 50 archives can be created
- ✅ 51st archive blocked with error message
- ✅ 50 archives load in < 100ms
- ✅ Delete + re-create works correctly

---

## Test Scenario 10: Empty Payment Schedule (Edge Case)

**Spec Reference**: User Story 1 Acceptance Scenario 3

### Setup
- Clear all payments from schedule OR start with fresh session

### Steps

1. **Attempt to Create Archive with No Payments**:
   - [ ] Ensure payment list is empty (0 payments)
   - [ ] Click "Create Archive"
   - [ ] **Verify**: Error message appears: "No payments to archive. Import or process payments first."
   - [ ] **Verify**: Archive creation dialog does NOT open OR opens with disabled "Create" button
   - [ ] **Verify**: No empty archive created

2. **Verify localStorage**:
   - [ ] Check DevTools → Local Storage
   - [ ] **Verify**: No new archive key created
   - [ ] **Verify**: Archive index unchanged

**Pass Criteria**:
- ✅ Empty payment schedule prevents archive creation
- ✅ Clear error message displayed
- ✅ No empty archive created in storage

---

## Test Scenario 11: Cross-Tab Synchronization (Integration)

**Spec Reference**: FR-017

### Setup
- Open PayPlan in two browser tabs (Tab A and Tab B)
- Navigate both tabs to Archive History page

### Steps

1. **Create Archive in Tab A**:
   - [ ] In **Tab A**: Mark 5 payments as paid
   - [ ] In **Tab A**: Create archive "November 2025"
   - [ ] **Verify**: Tab A shows new archive in list

2. **Check Tab B Updates**:
   - [ ] Switch to **Tab B** (do NOT refresh)
   - [ ] **Verify**: Archive list updates automatically to show "November 2025"
   - [ ] **Verify**: Update happens **within 1-2 seconds** (storage event)

3. **Delete Archive in Tab B**:
   - [ ] In **Tab B**: Delete "November 2025" archive (confirm)
   - [ ] Switch to **Tab A**
   - [ ] **Verify**: Archive removed from list in Tab A automatically

4. **Test Viewing Deleted Archive** (User Story 5 Acceptance Scenario 5):
   - [ ] In **Tab A**: Open archive "November 2025" detail page
   - [ ] In **Tab B**: Delete "November 2025" archive
   - [ ] Switch back to **Tab A** (detail page)
   - [ ] **Verify**: Page detects deletion and shows message: "This archive has been deleted"
   - [ ] **Verify**: "Back to Archives" button or link provided

**Pass Criteria**:
- ✅ Archive creation syncs across tabs automatically
- ✅ Archive deletion syncs across tabs automatically
- ✅ Sync happens within 1-2 seconds
- ✅ Deleted archive detection works on detail page

---

## Test Scenario 12: Corrupted Archive Handling (Error Recovery)

**Spec Reference**: FR-016

### Setup
- Create 3 valid archives: "Archive 1", "Archive 2", "Archive 3"

### Steps

1. **Manually Corrupt Archive Data**:
   - [ ] Open DevTools → Console
   - [ ] Corrupt one archive's localStorage:
     ```javascript
     // Get archive ID from index
     const index = JSON.parse(localStorage.getItem('payplan:archive:index'));
     const archiveId = index.archives[1].id; // Second archive

     // Corrupt archive data (invalid JSON)
     localStorage.setItem(`payplan:archive:${archiveId}`, '{invalid json');
     ```

2. **Load Archive List** (FR-016):
   - [ ] Refresh page
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Page loads without crashing
   - [ ] **Verify**: "Archive 1" and "Archive 3" display normally
   - [ ] **Verify**: "Archive 2" shows error badge or icon
   - [ ] **Verify**: Warning message: "This archive is corrupted and cannot be viewed"

3. **Test View Corrupted Archive**:
   - [ ] Click "View" button on corrupted archive
   - [ ] **Verify**: "View" button is disabled OR
   - [ ] **Verify**: Detail page shows error message (cannot load data)
   - [ ] **Verify**: No application crash

4. **Test Delete Corrupted Archive** (FR-016):
   - [ ] Click "Delete" on corrupted archive
   - [ ] Confirm deletion
   - [ ] **Verify**: Corrupted archive removed successfully
   - [ ] **Verify**: Remaining valid archives still load correctly

5. **Test Export Corrupted Archive**:
   - [ ] Corrupt another archive
   - [ ] Click "Export CSV" on corrupted archive
   - [ ] **Verify**: Error message: "Cannot export corrupted archive"
   - [ ] **Verify**: No CSV download (graceful failure)

**Pass Criteria**:
- ✅ Corrupted archive doesn't crash application
- ✅ Corrupted archive shows error badge/warning
- ✅ Valid archives load normally
- ✅ Corrupted archive can be deleted
- ✅ Graceful error handling throughout

---

## Test Scenario 13: Performance Test - Archive List with 20 Archives

**Spec Reference**: SC-004

### Setup
- Create exactly 20 archives with varying payment counts

### Steps

1. **Measure Archive List Load Time** (SC-004):
   - [ ] Clear browser cache (Ctrl+Shift+Del)
   - [ ] Navigate away from Archive History
   - [ ] Open DevTools → Performance tab
   - [ ] Start performance recording
   - [ ] Click "Archive History" link
   - [ ] Stop recording after page fully loaded
   - [ ] **Verify**: Time from navigation to first paint **< 100ms** ✅
   - [ ] **Verify**: Time to interactive **< 100ms** ✅

2. **Verify Lazy Loading**:
   - [ ] Open DevTools → Network tab
   - [ ] Navigate to Archive History
   - [ ] **Verify**: Only `payplan:archive:index` loaded from localStorage
   - [ ] **Verify**: Individual archive keys NOT loaded until detail view opened

3. **Test Scrolling Performance**:
   - [ ] Scroll through archive list
   - [ ] **Verify**: No lag or stutter
   - [ ] **Verify**: FPS stays above 30 (preferably 60)

**Pass Criteria**:
- ✅ Archive list loads in < 100ms (20 archives)
- ✅ Only index loaded, not full archive data
- ✅ Smooth scrolling (no performance degradation)

---

## Test Scenario 14: Performance Test - Large Archive (50 Payments)

**Spec Reference**: SC-003

### Setup
- Create archive with exactly 50 payments (all marked as paid)

### Steps

1. **Measure Archive Detail Load Time** (SC-003):
   - [ ] Navigate to Archive History
   - [ ] Open DevTools → Performance tab
   - [ ] Start recording
   - [ ] Click "View" on 50-payment archive
   - [ ] Stop recording after page fully rendered
   - [ ] **Verify**: Time from click to first paint **< 100ms** ✅
   - [ ] **Verify**: All 50 payments rendered

2. **Test Scrolling Performance**:
   - [ ] Scroll through 50-payment list
   - [ ] **Verify**: No lag or freezing
   - [ ] **Verify**: FPS stays above 30

3. **Test Memory Usage**:
   - [ ] Open DevTools → Memory tab
   - [ ] Take heap snapshot
   - [ ] **Verify**: Memory usage reasonable (~5-10 MB for page)
   - [ ] **Verify**: No memory leaks after opening/closing multiple archives

**Pass Criteria**:
- ✅ 50-payment archive loads in < 100ms
- ✅ Smooth scrolling (no lag)
- ✅ Reasonable memory usage

---

## Test Scenario 15: Full Workflow End-to-End (Integration)

**Spec Reference**: SC-010

### Purpose
Validate complete user journey from payment tracking to archive management

### Steps

1. **Setup Phase**:
   - [ ] Start with fresh localStorage (clear all)
   - [ ] Import CSV with 20 payments

2. **Track Payments** (Feature 015):
   - [ ] Mark 12 payments as "paid"
   - [ ] Leave 8 as "pending"
   - [ ] **Verify**: Payment statuses displayed correctly

3. **Create Archive**:
   - [ ] Click "Create Archive"
   - [ ] Enter name "Full Test Archive"
   - [ ] Confirm creation
   - [ ] **Verify**: Archive created successfully
   - [ ] **Verify**: Current payments reset to pending

4. **View Archive List**:
   - [ ] Navigate to Archive History
   - [ ] **Verify**: "Full Test Archive" shown with correct metadata
   - [ ] **Verify**: Displays "20 payments, 12 paid, 8 pending"

5. **View Archive Details**:
   - [ ] Click "View" on archive
   - [ ] **Verify**: All 20 payments displayed with correct statuses
   - [ ] **Verify**: 12 show "Paid" with timestamps
   - [ ] **Verify**: 8 show "Pending"

6. **View Statistics**:
   - [ ] Locate statistics panel
   - [ ] **Verify**: "Total: 20, Paid: 12 (60%), Pending: 8 (40%)"

7. **Export Archive**:
   - [ ] Click "Export CSV"
   - [ ] **Verify**: CSV downloads successfully
   - [ ] Open CSV
   - [ ] **Verify**: 20 rows with correct data
   - [ ] **Verify**: Archive metadata columns present

8. **Delete Archive**:
   - [ ] Return to archive list
   - [ ] Click "Delete" on "Full Test Archive"
   - [ ] Confirm deletion
   - [ ] **Verify**: Archive removed from list

9. **Verify Deletion Persists**:
   - [ ] Refresh page
   - [ ] **Verify**: Archive still deleted (not restored)

10. **Success Rate Check** (SC-010):
    - [ ] **Verify**: Entire workflow completed without errors
    - [ ] **Verify**: No confusion or unclear steps
    - [ ] **Verify**: All features worked as expected

**Pass Criteria**:
- ✅ Complete workflow executes smoothly end-to-end
- ✅ No errors or unexpected behavior
- ✅ 90% first-time success rate (SC-010 target)

---

## Browser Compatibility Testing

### Browsers to Test

Test all scenarios above in:

- [ ] **Chrome 90+** (primary target - localStorage, React 19 support)
- [ ] **Firefox 88+** (localStorage, cross-tab sync)
- [ ] **Safari 14+** (macOS/iOS - localStorage quota may differ)
- [ ] **Edge 90+** (Chromium-based - should match Chrome)

### Known Issues / Fallbacks

- **Private/Incognito Mode**: localStorage may be disabled → Show error message
- **Safari <14**: localStorage quota may be smaller (5MB vs 10MB) → Adjust archive limit if needed
- **Older Browsers** (<2021): May lack modern JavaScript features → Consider polyfills or show warning

---

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab through archive list using Tab key
- [ ] Press Enter to open archive (instead of clicking "View")
- [ ] Tab through archive detail page
- [ ] Press Escape to close dialogs (create archive, delete confirmation)
- [ ] **Verify**: All interactive elements reachable via keyboard
- [ ] **Verify**: Focus indicators visible (blue outline or custom styling)

### Screen Reader Support

- [ ] Enable screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Navigate to Archive History page
- [ ] **Verify**: Screen reader announces "Archive History" heading
- [ ] Tab to archive item
- [ ] **Verify**: Screen reader reads archive name, date, payment count
- [ ] Tab to "View" button
- [ ] **Verify**: Screen reader announces "View October 2025 archive"
- [ ] Open archive detail
- [ ] **Verify**: Screen reader announces payment statuses correctly

### ARIA Attributes

- [ ] Inspect archive list item in DevTools
- [ ] **Verify**: `role="list"` on archive list container
- [ ] **Verify**: `role="listitem"` on each archive
- [ ] **Verify**: `aria-label` or `aria-labelledby` on buttons
- [ ] Inspect statistics panel
- [ ] **Verify**: `role="region"` or `aria-label="Archive Statistics"`

### Color Contrast (WCAG 2.1 AA)

- [ ] Use browser DevTools Color Picker
- [ ] Check archive name text vs. background
- [ ] **Verify**: Contrast ratio ≥ 4.5:1 for normal text
- [ ] Check "Paid" badge vs. background
- [ ] **Verify**: Contrast ratio ≥ 4.5:1
- [ ] Check "Pending" badge vs. background
- [ ] **Verify**: Contrast ratio ≥ 4.5:1

---

## Cleanup After Testing

```bash
# Clear all test data from DevTools Console
localStorage.clear();

# Or selectively clear archives
localStorage.removeItem('payplan:archive:index');
for (let key of Object.keys(localStorage)) {
  if (key.startsWith('payplan:archive:')) {
    localStorage.removeItem(key);
  }
}
```

---

## Success Criteria Summary

**All scenarios must pass** for feature to be ready for automated testing and deployment:

| Scenario | Pass? | Notes |
|----------|-------|-------|
| 1. Create First Archive (P1 MVP) | ⬜ | Core functionality |
| 2. Duplicate Archive Names | ⬜ | Edge case handling |
| 3. View Archive List | ⬜ | P2 viewing |
| 4. View Archive Details | ⬜ | P2 viewing |
| 5. Archive Statistics | ⬜ | P3 analytics |
| 6. Export Archive to CSV | ⬜ | P4 export |
| 7. Delete Archive | ⬜ | P5 maintenance |
| 8. Unicode/Emoji Names | ⬜ | Edge case |
| 9. 50-Archive Limit | ⬜ | Edge case |
| 10. Empty Payment Schedule | ⬜ | Edge case |
| 11. Cross-Tab Sync | ⬜ | Integration |
| 12. Corrupted Archive Handling | ⬜ | Error recovery |
| 13. Performance (20 Archives) | ⬜ | SC-004 |
| 14. Performance (50 Payments) | ⬜ | SC-003 |
| 15. Full Workflow E2E | ⬜ | SC-010 |

---

## Next Steps After Manual Testing

1. **Capture Test Results**: Document any failures or unexpected behavior in GitHub issues
2. **Generate Contract Files**: Create contracts for ArchiveStorage and ArchiveService
3. **Generate Automated Tests**: Use Vitest + @testing-library/react for TDD
4. **Implement Feature**: Follow tasks.md with test-first approach
5. **Run Automated Test Suite**: `npm test` (frontend tests)
6. **Deploy to Staging**: Test in production-like environment

---

**Questions or Issues?**
- Review spec: [spec.md](spec.md)
- Review plan: [plan.md](plan.md)
- Check data model: [data-model.md](data-model.md)
- Review research: [research.md](research.md)
