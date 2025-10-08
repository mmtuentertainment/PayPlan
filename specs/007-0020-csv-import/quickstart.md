# QuickStart: CSV Import MVP

**Feature**: 007-0020-csv-import
**Date**: 2025-10-08
**Purpose**: Manual testing walkthrough for CSV import functionality

## Prerequisites

- Development server running: `pnpm -C frontend dev`
- Sample CSV files prepared (see below)
- Browser DevTools available (Network tab for verification)
- Calendar application for ICS testing (optional)

## Test Scenario 1: Happy Path (Valid CSV)

**Goal**: Verify complete flow from upload to ICS download

### Setup

Create a test CSV file `sample-valid.csv`:

```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
Afterpay,37.50,USD,2025-10-15,false
PayPal Pay-in-4,45.00,USD,2025-10-18,true
Zip,30.00,USD,2025-10-22,false
```

**Note**: Adjust dates to ensure at least 2-3 payments fall within the current ISO week (Monday-Sunday) for ICS testing.

### Steps

1. **Navigate to import page**
   - Open browser to `http://localhost:5173/import` (or configured dev port)
   - **Expected**: Page loads with upload area and helper text showing CSV format example

2. **View helper text**
   - Read the sample CSV format documentation on page
   - **Expected**: Clear explanation of required headers and simple format rules

3. **Upload CSV file**
   - Drag `sample-valid.csv` onto drop zone OR click "Choose CSV" and select file
   - **Expected**: File name appears, "Process CSV" button becomes enabled

4. **Process CSV**
   - Click "Process CSV" button
   - **Expected**: Loading state appears briefly (<1s)

5. **View results**
   - **Expected**:
     - Table displays 5 rows with columns: Provider, Amount, Currency, Due Date, Autopay
     - Each row shows a confidence pill (should be "high" for all)
     - COLLISION risk pill appears on Klarna and Afterpay rows (same due date: 2025-10-15)
     - WEEKEND_AUTOPAY risk pill appears on Affirm or PayPal rows IF due date is Sat/Sun
     - "Download .ics" button is visible and enabled

6. **Download ICS**
   - Click "Download .ics" button
   - **Expected**:
     - File `payment-schedule.ics` (or similar name) downloads
     - No errors in console

7. **Verify ICS contents**
   - Open downloaded `.ics` file in text editor
   - **Expected**:
     - File contains only payments within current ISO week (Mon-Sun)
     - Each event has:
       - `SUMMARY` with provider and amount (e.g., "Klarna $25.00")
       - `DTSTART` matching due date
       - `DESCRIPTION` with payment details
       - Risk annotations on separate lines if risks present
     - No `VALARM` components (reminders excluded in MVP)
     - Timezone: America/New_York

8. **Verify no network requests**
   - Open DevTools → Network tab
   - Reload page and repeat steps 3-5
   - **Expected**: No network requests during CSV processing (only initial page load assets)

### Success Criteria

- [x] CSV uploads successfully
- [x] Results table displays with all 5 rows
- [x] Confidence pills show "high" for all rows
- [x] COLLISION risk appears for rows with duplicate due dates
- [x] WEEKEND_AUTOPAY risk appears for weekend autopay payments (if applicable)
- [x] ICS file downloads
- [x] ICS contains only "This Week" events
- [x] ICS includes risk annotations
- [x] No VALARM in ICS file
- [x] No network requests during processing

## Test Scenario 2: Invalid CSV (Missing Field)

**Goal**: Verify error handling for malformed CSV

### Setup

Create `sample-missing-field.csv`:

```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,,2025-10-16,true
```

**Note**: Row 2 is missing `currency` field (empty value between commas)

### Steps

1. Navigate to `/import`
2. Upload `sample-missing-field.csv`
3. Click "Process CSV"
4. **Expected**:
   - Error message appears: "Invalid currency in row 2" (or similar)
   - No results table displayed
   - Page remains usable (can upload different file)
   - No stack trace visible

### Success Criteria

- [x] Error message is clear and actionable
- [x] Error is single-line (no stack trace)
- [x] Page remains responsive
- [x] Can upload new file without reload

## Test Scenario 3: Invalid Date Format

**Goal**: Verify date validation

### Setup

Create `sample-invalid-date.csv`:

```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,10/15/2025,false
```

**Note**: Date is in MM/DD/YYYY format instead of ISO 8601 (YYYY-MM-DD)

### Steps

1. Navigate to `/import`
2. Upload `sample-invalid-date.csv`
3. Click "Process CSV"
4. **Expected**: Error message "Invalid date format in row 1" (or similar)

### Success Criteria

- [x] Date validation rejects non-ISO format
- [x] Error message is helpful
- [x] Page remains usable

## Test Scenario 4: Empty CSV

**Goal**: Verify handling of CSV with header only

### Setup

Create `sample-empty.csv`:

```csv
provider,amount,currency,dueISO,autopay
```

**Note**: Header row only, no data rows

### Steps

1. Navigate to `/import`
2. Upload `sample-empty.csv`
3. Click "Process CSV"
4. **Expected**: Error message "No data rows found" (or similar)

### Success Criteria

- [x] Empty CSV rejected gracefully
- [x] Clear error message
- [x] No crash or blank screen

## Test Scenario 5: This Week Filtering

**Goal**: Verify ICS export only includes current week events

### Setup

Create `sample-mixed-weeks.csv` with dates spanning 3 weeks:

```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,{last_week_date},false
Affirm,50.00,USD,{this_week_date},true
Afterpay,37.50,USD,{next_week_date},false
```

**Replace placeholders**:
- `{last_week_date}`: Any date in previous ISO week
- `{this_week_date}`: Any date in current ISO week (Mon-Sun)
- `{next_week_date}`: Any date in next ISO week

### Steps

1. Navigate to `/import`
2. Upload `sample-mixed-weeks.csv`
3. Click "Process CSV"
4. **Expected**: Results table shows all 3 rows
5. Click "Download .ics"
6. Open `.ics` file
7. **Expected**: Only the event from current week (`{this_week_date}`) is in ICS file

### Success Criteria

- [x] All rows displayed in results table
- [x] ICS file contains only 1 event (current week)
- [x] Past and future week events excluded from ICS

## Test Scenario 6: Drag and Drop

**Goal**: Verify drag-drop upload works

### Steps

1. Navigate to `/import`
2. Drag `sample-valid.csv` from file explorer onto upload area
3. **Expected**: File accepted, same as file chooser flow
4. Process CSV
5. **Expected**: Same results as Test Scenario 1

### Success Criteria

- [x] Drag-drop works equivalently to file chooser
- [x] Visual feedback on drag-over
- [x] Results identical to manual file selection

## Performance Verification

**Goal**: Verify performance targets met

### Setup

Create `sample-20-rows.csv` with 20 payment rows (use script or manual duplication)

### Steps

1. Navigate to `/import`
2. Open DevTools → Performance tab (optional)
3. Upload `sample-20-rows.csv`
4. Click "Process CSV" and start timer (or use Performance recording)
5. Note when results appear
6. **Expected**:
   - CSV parsing: <100ms
   - Total processing (upload to results): <1.5s
   - ICS download: <100ms after click

### Success Criteria

- [x] 20-row CSV processes in <1.5s
- [x] No UI freeze or lag
- [x] Smooth user experience

## Rollback Verification

**Goal**: Verify feature can be safely removed

### Steps

1. Note current `/import` route exists
2. Simulate rollback: comment out `/import` route in `App.tsx`
3. Rebuild: `pnpm -C frontend build`
4. **Expected**: Build succeeds with no errors
5. Navigate to `/import`
6. **Expected**: 404 or redirect (import page gone)
7. Verify demo page still works: navigate to `/demo`
8. **Expected**: Demo functionality unaffected

### Success Criteria

- [x] Route removal is clean (no broken imports)
- [x] Build succeeds after removal
- [x] No residual errors
- [x] Demo page unaffected (independent feature)

## LOC Budget Verification

**Goal**: Verify code stays within ≤180 LOC budget

### Steps

1. Count lines in new/modified files (excluding blank lines and comments):
   ```bash
   # Import page
   cat frontend/src/pages/Import.tsx | sed '/^\s*$/d' | sed '/^\s*\/\//d' | wc -l

   # App.tsx changes (just the new route lines)
   git diff frontend/src/App.tsx | grep '^+' | wc -l

   # Total
   # Sum above counts
   ```

2. **Expected**: Total ≤180 LOC (target ≤150 LOC)

### Success Criteria

- [x] Total code LOC ≤180
- [x] Ideally ≤150 (30 LOC buffer)

## Checklist Summary

Complete when all scenarios pass:

- [ ] Happy path: CSV upload → results → ICS download
- [ ] Error handling: Missing field, invalid date, empty CSV
- [ ] This Week filtering: ICS contains only current week events
- [ ] Drag-drop upload works
- [ ] No network requests (verified in DevTools)
- [ ] Performance: <1.5s for 20 rows
- [ ] Rollback: Feature can be cleanly removed
- [ ] LOC budget: ≤180 code lines

---
**QuickStart Ready**: 2025-10-08
**Estimated Time**: 15-20 minutes for all scenarios
