# Manual Testing Script for CSV Export Feature

**Feature**: CSV Export (014-build-a-csv)
**Date**: 2025-10-15
**Tester**: _______________

## Test Environment Setup

**Prerequisites**:
1. PayPlan running locally: `cd frontend && npm run dev`
2. Open browser to: http://localhost:5173
3. Have test CSV files ready from `/test-data/csv-samples/`

## Test Execution Checklist

### ✅ Scenario 1: Basic CSV Export (Happy Path)

**Test File**: `test-data/csv-samples/01-basic-payments.csv`

**Steps**:
1. [ ] Open PayPlan in browser
2. [ ] Click "Paste CSV" tab
3. [ ] Paste contents of `01-basic-payments.csv`:
   ```csv
   provider,installment_no,due_date,amount,currency,autopay,late_fee
   Klarna,1,2025-10-14,45.00,USD,true,7
   Afterpay,2,2025-10-21,32.50,USD,false,8
   Affirm,1,2025-10-28,58.00,USD,true,10
   ```
4. [ ] Click "Build Plan" button
5. [ ] Scroll down to see results
6. [ ] **VERIFY**: "Download CSV" button appears next to "Download .ics"
7. [ ] **VERIFY**: Button is enabled (not grayed out)
8. [ ] Click "Download CSV" button
9. [ ] **VERIFY**: File downloads with name format `payplan-export-YYYY-MM-DD-HHMMSS.csv`
10. [ ] Open downloaded CSV in text editor
11. [ ] **VERIFY**: Header row: `"provider","amount","currency","dueISO","autopay","risk_type","risk_severity","risk_message"`
12. [ ] **VERIFY**: 3 data rows present
13. [ ] **VERIFY**: Risk columns populated (not all empty)

**Expected Result**: ✅ CSV downloads successfully with proper format

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 2: Empty Risk Data Handling

**Test File**: `test-data/csv-samples/02-empty-risk-data.csv`

**Steps**:
1. [ ] Clear previous data (refresh page)
2. [ ] Upload `02-empty-risk-data.csv`
3. [ ] Build Plan
4. [ ] Download CSV
5. [ ] Open in text editor
6. [ ] **VERIFY**: Risk columns show three consecutive commas: `,,,` (empty strings)
7. [ ] **VERIFY**: NOT showing "null", "undefined", or "N/A"

**Expected Result**: ✅ Empty risk data uses empty strings per RFC 4180

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 3: Special Characters (RFC 4180 Compliance)

**Test File**: `test-data/csv-samples/03-special-characters.csv`

**Steps**:
1. [ ] Clear previous data
2. [ ] Upload `03-special-characters.csv`
3. [ ] Build Plan
4. [ ] Download CSV
5. [ ] Open in Excel or Google Sheets
6. [ ] **VERIFY**: Row 1 shows: `Klarna, Inc.` (comma preserved, not broken into two columns)
7. [ ] **VERIFY**: Row 2 shows: `Bob's "Best" Buy` (quotes preserved correctly)
8. [ ] **VERIFY**: No parsing errors in spreadsheet

**Expected Result**: ✅ Special characters properly escaped

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 4: Unicode Character Preservation

**Test File**: `test-data/csv-samples/04-unicode-characters.csv`

**Steps**:
1. [ ] Clear previous data
2. [ ] Upload `04-unicode-characters.csv`
3. [ ] Build Plan
4. [ ] Download CSV
5. [ ] Open in Excel (check UTF-8 encoding)
6. [ ] **VERIFY**: `Café Münchën` displays correctly (accents preserved)
7. [ ] **VERIFY**: `東京ストア` displays correctly (Japanese characters preserved)
8. [ ] **VERIFY**: `Tienda España` displays correctly

**Expected Result**: ✅ Unicode characters preserved

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 5: Large Dataset Warning (500+ Records)

**Test File**: `test-data/csv-samples/09-large-dataset-600.csv`

**Steps**:
1. [ ] Clear previous data
2. [ ] Upload `09-large-dataset-600.csv` (600 records)
3. [ ] Build Plan
4. [ ] Click "Download CSV"
5. [ ] **VERIFY**: Toast notification appears with message:
   - "Generating large export (600 records). This may take a moment..."
6. [ ] **VERIFY**: Toast auto-dismisses after ~2 seconds
7. [ ] **VERIFY**: CSV still downloads successfully
8. [ ] **VERIFY**: Downloaded file contains all 600 records

**Expected Result**: ✅ Warning appears for 500+ records, download still works

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 6: Button States (Disabled When No Data)

**Steps**:
1. [ ] Refresh page (no data loaded)
2. [ ] Scroll to bottom (if results area visible)
3. [ ] **VERIFY**: "Download CSV" button does NOT appear (or is disabled)
4. [ ] Load sample CSV
5. [ ] Build Plan
6. [ ] **VERIFY**: "Download CSV" button appears and is enabled
7. [ ] Click "Clear" button
8. [ ] **VERIFY**: "Download CSV" button becomes disabled or disappears

**Expected Result**: ✅ Button only enabled when payments exist

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 7: Round-trip Compatibility

**Test File**: `test-data/csv-samples/01-basic-payments.csv`

**Steps**:
1. [ ] Upload `01-basic-payments.csv`
2. [ ] Build Plan
3. [ ] Download CSV (save as `exported.csv`)
4. [ ] Clear/refresh PayPlan
5. [ ] Upload the `exported.csv` file you just downloaded
6. [ ] **VERIFY**: Import succeeds without errors
7. [ ] Build Plan again
8. [ ] **VERIFY**: Same results as first import (no data loss)
9. [ ] Compare risk columns in both exports

**Expected Result**: ✅ Export → Re-import works without data loss

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 8: Keyboard Accessibility

**Steps**:
1. [ ] Load sample CSV and Build Plan
2. [ ] Press Tab key repeatedly
3. [ ] **VERIFY**: Focus reaches "Download CSV" button
4. [ ] **VERIFY**: Button has visible focus ring
5. [ ] Press Enter key while focused
6. [ ] **VERIFY**: CSV downloads
7. [ ] Repeat test with Space key
8. [ ] **VERIFY**: Space key also triggers download

**Expected Result**: ✅ Full keyboard navigation support

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 9: Filename Timestamp Format

**Steps**:
1. [ ] Note current time (e.g., 2025-10-15 15:30:45)
2. [ ] Load sample CSV, Build Plan
3. [ ] Click "Download CSV"
4. [ ] Check downloaded filename
5. [ ] **VERIFY**: Filename format: `payplan-export-2025-10-15-153045.csv`
6. [ ] **VERIFY**: Timestamp matches click time (within 1-2 seconds)
7. [ ] **VERIFY**: No invalid characters (colons, spaces, etc.)
8. [ ] Download again immediately
9. [ ] **VERIFY**: Second filename is different (timestamp updated)

**Expected Result**: ✅ Timestamped filenames prevent overwrites

**Actual Result**: _______________

**Pass/Fail**: _______________

---

### ✅ Scenario 10: Error Handling

**Steps**:
1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Load sample CSV, Build Plan
4. [ ] Click "Download CSV"
5. [ ] **VERIFY**: No errors in console
6. [ ] Manually corrupt data (edit window object in console)
7. [ ] Try downloading CSV
8. [ ] **VERIFY**: Error toast appears with message
9. [ ] **VERIFY**: App doesn't crash

**Expected Result**: ✅ Graceful error handling

**Actual Result**: _______________

**Pass/Fail**: _______________

---

## Browser Compatibility Tests

Test the feature in multiple browsers:

### Chrome
- [ ] Scenario 1 (Basic export)
- [ ] Scenario 5 (Large dataset warning)
- [ ] Scenario 8 (Keyboard nav)
- **Result**: _______________

### Firefox
- [ ] Scenario 1 (Basic export)
- [ ] Scenario 3 (Special characters)
- **Result**: _______________

### Safari
- [ ] Scenario 1 (Basic export)
- [ ] Scenario 4 (Unicode)
- **Result**: _______________

### Edge
- [ ] Scenario 1 (Basic export)
- **Result**: _______________

---

## Performance Benchmarks

**Measure export time** for different dataset sizes:

| Records | Expected Time | Actual Time | Pass/Fail |
|---------|---------------|-------------|-----------|
| 10      | <100ms        | _________   | _______   |
| 50      | <200ms        | _________   | _______   |
| 100     | <300ms        | _________   | _______   |
| 500     | <1s           | _________   | _______   |
| 600     | <2s           | _________   | _______   |

**How to measure**:
1. Open DevTools → Console
2. Before clicking "Download CSV", run: `console.time('csv-export')`
3. Click "Download CSV"
4. Run: `console.timeEnd('csv-export')`

---

## Summary

**Total Scenarios**: 10
**Scenarios Passed**: ___ / 10
**Scenarios Failed**: ___ / 10

**Critical Issues Found**: _______________

**Minor Issues Found**: _______________

**Overall Status**: ✅ PASS / ⚠️ PASS WITH ISSUES / ❌ FAIL

**Tester Signature**: _______________
**Date**: _______________
**Time Spent**: _______________

---

## Next Steps

If all tests pass:
- [ ] Mark feature as production-ready
- [ ] Deploy to production
- [ ] Update release notes

If issues found:
- [ ] Document issues in GitHub
- [ ] Create fix tasks
- [ ] Re-test after fixes
