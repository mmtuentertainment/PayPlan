# QuickStart Verification Guide: CSV Import Hardening

**Feature**: 0020.1-csv-hardening
**Branch**: 008-0020-1-csv

---

## Overview

This guide provides one-command checks and manual verification steps to validate the CSV Import hardening implementation.

**Audience**: Developers, QA testers, code reviewers

**Time to Complete**: ~15 minutes

---

## 1. Automated Checks (One-Command)

### 1.1. Run All Tests

```bash
cd /home/matt/PROJECTS/PayPlan/frontend
pnpm test import-page.test.tsx
```

**Expected Output**:
```
✓ Import Page - Happy Path (7 tests)
✓ Import Page - Error Handling (5 tests)
✓ Import Page - 0020.1 Hardening (12 tests)
  ✓ rejects file >1MB with "CSV too large (max 1MB)"
  ✓ rejects CSV with >1000 rows with "Too many rows (max 1000)"
  ✓ rejects invalid calendar date (2025-13-45)
  ✓ rejects invalid calendar date (2025-02-30)
  ✓ rejects semicolon-delimited CSV
  ✓ renders formula prefix (=SUM) as plain text
  ✓ renders HTML tags (<script>) as plain text
  ✓ file input has associated <label>
  ✓ error div has role="alert" aria-live="polite"
  ✓ results table has <caption>
  ✓ all buttons have type="button"
  ✓ no fetch calls during upload/parse

Test Files  1 passed (1)
     Tests  24 passed (24)
```

**If Tests Fail**: Review error output; ensure Import.tsx changes match plan.md.

---

### 1.2. Run ESLint (Path Guard Compliance)

```bash
cd /home/matt/PROJECTS/PayPlan/frontend
pnpm lint
```

**Expected Output**:
```
✔ No ESLint warnings or errors
```

**If ESLint Fails**: Check for accidental imports from restricted paths (see research.md §7).

---

### 1.3. Build (TypeScript Compilation)

```bash
cd /home/matt/PROJECTS/PayPlan/frontend
pnpm build
```

**Expected Output**:
```
✓ TypeScript compilation successful
✓ Vite build complete
```

**If Build Fails**: Check for type errors in Import.tsx.

---

## 2. Manual Verification Matrix

**Environment**: Local dev server (`pnpm dev`) or production deployment

### 2.1. Happy Path (Valid CSV)

**Test File**: `test-valid.csv`
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,USD,2025-10-16,true
Afterpay,37.50,USD,2025-10-17,false
```

**Steps**:
1. Navigate to `/import`
2. Upload `test-valid.csv`
3. Click "Process CSV"

**Expected Result**:
- ✅ Table displays 3 rows
- ✅ Risk analysis shows (if Oct 15/16/17 are same or weekend):
  - "Multiple payments due on 2025-10-15" (if applicable)
  - "Autopay on weekend: Affirm on 2025-10-16" (if Sat/Sun)
- ✅ "Download .ics" button enabled
- ✅ No error messages

---

### 2.2. Invalid Calendar Date (2025-13-45)

**Test File**: `test-invalid-date-1.csv`
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-13-45,false
```

**Steps**:
1. Upload `test-invalid-date-1.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Error message (single-line): `"Invalid date in row 1: 2025-13-45"`
- ✅ Error div has red/pink background
- ✅ No table displayed
- ✅ Page remains usable (can upload new file)

---

### 2.3. Invalid Calendar Date (2025-02-30)

**Test File**: `test-invalid-date-2.csv`
```csv
provider,amount,currency,dueISO,autopay
Affirm,50.00,USD,2025-02-30,true
```

**Steps**:
1. Upload `test-invalid-date-2.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Error message: `"Invalid date in row 1: 2025-02-30"`
- ✅ Single-line error (not multi-line stack trace)

---

### 2.4. Oversize File (>1MB)

**Generate File** (Linux/macOS):
```bash
cd /tmp
head -c 2000000 /dev/zero | tr '\0' 'x' > test-oversize.csv
echo "provider,amount,currency,dueISO,autopay" | cat - > test-oversize.csv
```

**Steps**:
1. Upload `test-oversize.csv` (2MB)
2. Click "Process CSV"

**Expected Result**:
- ✅ Error message: `"CSV too large (max 1MB)"`
- ✅ Error appears **immediately** (no file read delay)

---

### 2.5. Too Many Rows (>1000)

**Generate File** (Linux/macOS):
```bash
cd /tmp
echo "provider,amount,currency,dueISO,autopay" > test-1001-rows.csv
for i in {1..1001}; do
  echo "Klarna,25.00,USD,2025-10-15,false" >> test-1001-rows.csv
done
```

**Steps**:
1. Upload `test-1001-rows.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Error message: `"Too many rows (max 1000)"`
- ✅ Error appears within ~100ms (fast row count check)

---

### 2.6. Semicolon-Delimited CSV

**Test File**: `test-semicolon.csv`
```csv
provider;amount;currency;dueISO;autopay
Klarna;25.00;USD;2025-10-15;false
```

**Steps**:
1. Upload `test-semicolon.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Error message: `"Parse failure: expected comma-delimited CSV"`
- ✅ Clear guidance (not cryptic "5 fields expected")

---

### 2.7. Formula Prefix Safety (=SUM)

**Test File**: `test-formula.csv`
```csv
provider,amount,currency,dueISO,autopay
=SUM(A1),25.00,USD,2025-10-15,false
```

**Steps**:
1. Upload `test-formula.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Table displays with provider cell showing `=SUM(A1)` as **plain text**
- ✅ Text is visible (not hidden or stripped)
- ✅ No formula execution in browser

**DevTools Check**:
- Open Inspect Element on provider cell
- Verify HTML: `<td>...=SUM(A1)</td>` (not `<td>=SUM(A1)</td>` causing parsing issues)

---

### 2.8. HTML Tag Safety (<script>)

**Test File**: `test-xss.csv`
```csv
provider,amount,currency,dueISO,autopay
<script>alert('xss')</script>,25.00,USD,2025-10-15,false
```

**Steps**:
1. Upload `test-xss.csv`
2. Click "Process CSV"

**Expected Result**:
- ✅ Table displays with provider cell showing `<script>alert('xss')</script>` as **plain text**
- ✅ No alert popup
- ✅ No script execution

**DevTools Check**:
- Verify HTML: `<td>&lt;script&gt;alert('xss')&lt;/script&gt;</td>` (HTML entities escaped)

---

### 2.9. Accessibility: File Input Label

**Steps**:
1. Navigate to `/import`
2. Open DevTools → Elements
3. Inspect file input

**Expected HTML**:
```html
<label htmlFor="csv-file-input">Choose CSV file</label>
<input id="csv-file-input" type="file" accept=".csv,text/csv" ... />
```

**Screen Reader Test** (if available):
- Enable VoiceOver (macOS), NVDA (Windows), or TalkBack (Android)
- Tab to file input
- **Expected Announcement**: "Choose CSV file, button" (or similar)

---

### 2.10. Accessibility: Error Alert Region

**Steps**:
1. Upload invalid file (e.g., `test-invalid-date-1.csv`)
2. Click "Process CSV"
3. Inspect error div in DevTools

**Expected HTML**:
```html
<div role="alert" aria-live="polite" style="...">
  Invalid date in row 1: 2025-13-45
</div>
```

**Screen Reader Test**:
- **Expected Announcement**: Error message announced immediately (polite mode waits for current speech)

---

### 2.11. Accessibility: Table Caption

**Steps**:
1. Upload valid CSV
2. Process CSV
3. Inspect `<table>` in DevTools

**Expected HTML**:
```html
<table style="...">
  <caption style="position: absolute; left: -10000px;">
    Payment schedule with 3 payments
  </caption>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

**Visual Check**:
- ✅ Caption is **not visible** on screen (visually hidden)

**Screen Reader Test**:
- Tab to table
- **Expected Announcement**: "Payment schedule with 3 payments, table, 7 columns, 4 rows" (or similar)

---

### 2.12. Button Type Attribute

**Steps**:
1. Navigate to `/import`
2. Inspect "Process CSV" and "Download .ics" buttons in DevTools

**Expected HTML** (both buttons):
```html
<button type="button" ...>Process CSV</button>
<button type="button" ...>Download .ics</button>
```

**Why This Matters**: Prevents accidental form submission if page later wrapped in `<form>`

---

## 3. DevTools Network Check (Zero Network Calls)

**Steps**:
1. Open DevTools → Network tab
2. Clear network log
3. Upload `test-valid.csv`
4. Click "Process CSV"
5. Wait for results table to render

**Expected Result**:
- ✅ **Zero network requests** in Network tab
- ✅ No fetch/XHR requests
- ✅ Only local operations (file read, parse, render)

**If Network Calls Detected**:
- Check for accidental analytics, remote validation, or external API calls
- Violates FR-005 (zero network guarantee)

---

## 4. ICS Download Verification

**Steps**:
1. Upload valid CSV with dates in "This Week" (ISO Mon–Sun relative to today)
2. Process CSV
3. Click "Download .ics"
4. Open downloaded `payment-schedule.ics` in text editor

**Expected ICS Content**:
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PayPlan//NONSGML v1.0//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Klarna $25.00 USD
DTSTART:20251015
DURATION:PT1H
DESCRIPTION:Payment: Klarna 25.00 USD\nDue: 2025-10-15\nAutopay: false
END:VEVENT
...
END:VCALENDAR
```

**Verify**:
- ✅ Only "This Week" events included (not all CSV rows)
- ✅ Timezone: America/New_York (implicit in DTSTART date-only format)
- ✅ **No VALARM** (reminder) blocks
- ✅ DESCRIPTION is plain text (no HTML/formula execution)

---

## 5. Error Recovery (Page Remains Usable)

**Steps**:
1. Upload `test-invalid-date-1.csv`
2. Click "Process CSV" → Error displays
3. **Without refreshing page**, upload `test-valid.csv`
4. Click "Process CSV"

**Expected Result**:
- ✅ Error message clears
- ✅ Valid CSV processes successfully
- ✅ Results table displays
- ✅ No page reload required

**Why This Matters**: Good UX; validates state management (error clearing on new upload)

---

## 6. Performance Check

**Test File**: Generate 1000-row CSV
```bash
cd /tmp
echo "provider,amount,currency,dueISO,autopay" > test-1000-rows.csv
for i in {1..1000}; do
  echo "Klarna,25.00,USD,2025-10-15,false" >> test-1000-rows.csv
done
```

**Steps**:
1. Upload `test-1000-rows.csv`
2. Open DevTools → Performance tab
3. Start recording
4. Click "Process CSV"
5. Stop recording when table renders

**Expected Result**:
- ✅ Total time < 500ms (target: < 100ms)
- ✅ No UI freeze or lag

**Performance Breakdown** (approximate):
- File read: ~10ms
- Row count check: ~2ms
- Parsing + validation: ~50ms (1000 × DateTime.fromISO)
- React render: ~50ms

---

## 7. Rollback Verification

**After merging PR, if rollback needed:**

```bash
# Identify merge commit
git log --oneline --merges -n 5

# Revert merge commit
git revert -m 1 <merge-commit-sha>

# Verify rollback
pnpm test import-page.test.tsx  # Old tests still pass
pnpm dev  # Navigate to /import; confirm old behavior
```

**Expected Result**:
- ✅ Import page works as before patch (no hardening)
- ✅ Accepts invalid dates like 2025-13-45 (regex-only validation)
- ✅ No file size / row count limits
- ✅ No accessibility attributes

---

## 8. Checklist Summary

Use this checklist during code review or QA:

### Automated Tests
- [ ] All tests pass (`pnpm test import-page.test.tsx`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

### Functional Verification
- [ ] Happy path: valid CSV processes successfully
- [ ] Invalid date (2025-13-45): rejected with clear error
- [ ] Invalid date (2025-02-30): rejected with clear error
- [ ] Oversize file (>1MB): rejected immediately
- [ ] Too many rows (>1000): rejected quickly
- [ ] Semicolon-delimited: rejected with clear error
- [ ] Formula prefix (=SUM): renders as plain text
- [ ] HTML tags (<script>): renders as plain text, no execution

### Accessibility
- [ ] File input has `<label htmlFor>` association
- [ ] Error div has `role="alert" aria-live="polite"`
- [ ] Results table has visually-hidden `<caption>`
- [ ] All buttons have `type="button"`

### Privacy & Security
- [ ] Zero network calls (DevTools Network tab empty)
- [ ] No fetch/XHR requests during upload/parse

### ICS Behavior (Unchanged)
- [ ] Only "This Week" events in ICS
- [ ] No VALARM reminders
- [ ] Timezone: America/New_York
- [ ] DESCRIPTION is plain text

### UX & Performance
- [ ] Error recovery: can upload new file after error
- [ ] 1000-row CSV processes in <500ms
- [ ] No UI freeze or lag

### Rollback
- [ ] Single `git revert` command restores prior behavior

---

## 9. Known Limitations (Expected Behavior)

These are **intentional design decisions** (not bugs):

1. **Blank lines ignored**: Empty rows (whitespace-only) don't count toward 1000-row limit
2. **CSV format: simple only**: No support for quoted fields containing commas
3. **No formula sanitization on import**: Formulas (=SUM) preserved as-is; safe in display, but warn if future CSV export added
4. **Client-side limits bypassable**: Users can modify JavaScript to bypass size/row limits (acceptable: no server-side risk)
5. **Currency validation: length only**: Doesn't validate against ISO 4217 whitelist (accepts "XXX", "FOO")
6. **No autocorrection**: Invalid dates not auto-fixed (e.g., 2025-02-30 → 2025-02-28); fail explicitly

---

## 10. Troubleshooting

### Issue: Tests fail with "fetch is not defined"

**Cause**: Test environment not mocking `fetch`

**Fix**: Verify `beforeEach` in `import-page.test.tsx` includes:
```typescript
global.fetch = vi.fn(() => Promise.reject('No network allowed'));
```

---

### Issue: ESLint error "import from restricted path"

**Cause**: Accidental import from disallowed module

**Fix**: Remove import; use only `@/lib/email-extractor`, `luxon`, `ics`

---

### Issue: DateTime.fromISO accepts 2025-13-45

**Cause**: Missing `.isValid` check

**Fix**: Ensure code includes:
```typescript
const dt = DateTime.fromISO(dueISO, { zone: 'America/New_York' });
if (!dt.isValid) throw new Error(`Invalid date in row ${rowNum}: ${dueISO}`);
```

---

### Issue: Error message is multi-line stack trace

**Cause**: Uncaught exception rendering stack trace

**Fix**: Wrap validation in try-catch; use `err.message` (not `err.toString()`)

---

### Issue: Screen reader doesn't announce error

**Cause**: Missing `role="alert"` or error div not in DOM

**Fix**: Verify error div has:
```html
<div role="alert" aria-live="polite">...</div>
```

---

## 11. Contact & Feedback

**Questions**: Open GitHub issue or contact feature owner

**Bugs**: Report in issue tracker with:
- Test file (CSV content)
- Browser/OS
- DevTools console output
- Expected vs. actual behavior

---
