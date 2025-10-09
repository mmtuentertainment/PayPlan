# CSV Fixtures for Manual QA

Sample CSV files for testing PayPlan's CSV import functionality.

## Files

### valid.csv
**Purpose:** Happy path testing with multiple providers and currencies

**Contents:**
- 6 rows with mixed providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- Multiple currencies (USD, EUR, GBP)
- Mixed autopay settings (true/false)
- Valid date format (YYYY-MM-DD)

**Expected behavior:**
- ✅ Uploads successfully
- ✅ All currency codes pass validation (USD, EUR, GBP)
- ✅ Schedule table displays with 6 payments
- ✅ Risk detection runs (may show COLLISION or CASH_CRUNCH depending on paydays)
- ✅ "Download .ics" button appears

**Test:** Upload this file to verify basic CSV import flow works end-to-end.

---

### too-many-rows.csv
**Purpose:** Test row count limit (max 1000 rows)

**Contents:**
- 1001 data rows (plus header = 1002 total lines)
- All identical: `Klarna,25.00,USD,2025-10-15,false`

**Expected behavior:**
- ❌ Upload fails with error: `"Too many rows (max 1000)"`
- ❌ Error displays in red alert region
- ❌ No schedule table appears

**Test:** Upload this file to verify row count guard fires correctly.

**Error ID:** E-002 (from v0.1.6-a.1 hardening)

---

### semicolon.csv
**Purpose:** Test delimiter detection (must be comma-delimited)

**Contents:**
- 3 rows with semicolons (`;`) instead of commas
- Otherwise valid data (Klarna, Affirm, Afterpay)

**Expected behavior:**
- ❌ Upload fails with error: `"Parse failure: expected comma-delimited CSV"`
- ❌ Error displays in red alert region
- ❌ No schedule table appears

**Test:** Upload this file to verify delimiter guard fires correctly.

**Error ID:** E-003 (from v0.1.6-a.1 hardening)

---

## Manual QA Workflow

### 1. Basic Upload Test (valid.csv)
```
1. Go to PayPlan demo site
2. Click "CSV" tab
3. Upload valid.csv
4. Click "Process CSV"
5. ✅ Verify: Schedule table appears with 6 payments
6. ✅ Verify: Currency codes (USD/EUR/GBP) all accepted
7. ✅ Verify: Risk flags appear (if applicable)
8. ✅ Verify: "Download .ics" button enabled
9. Click "Clear"
10. ✅ Verify: File input cleared, table removed
```

### 2. Row Limit Test (too-many-rows.csv)
```
1. Upload too-many-rows.csv
2. Click "Process CSV"
3. ❌ Verify: Error "Too many rows (max 1000)"
4. ❌ Verify: Error shown in red alert region with role="alert"
5. ❌ Verify: No schedule table appears
6. Click "Clear"
7. ✅ Verify: Error cleared
```

### 3. Delimiter Test (semicolon.csv)
```
1. Upload semicolon.csv
2. Click "Process CSV"
3. ❌ Verify: Error "Parse failure: expected comma-delimited CSV"
4. ❌ Verify: Error shown in red alert region
5. ❌ Verify: No schedule table appears
```

### 4. Keyboard Navigation Test (valid.csv)
```
1. Upload valid.csv
2. Tab through form elements
3. ✅ Verify tab order: File input → Process CSV → Clear → Download .ics
4. Focus on "Clear" button
5. Press Enter key
6. ✅ Verify: State resets (file cleared, error cleared, results cleared)
7. Upload valid.csv again
8. Focus on "Clear" button
9. Press Space key
10. ✅ Verify: State resets
```

### 5. Currency Validation Test (create custom file)
Create `invalid-currency.csv`:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,US,2025-10-15,false
```

**Test:**
```
1. Upload invalid-currency.csv
2. Click "Process CSV"
3. ❌ Verify: Error "Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"
4. ✅ Verify: Original invalid value "US" shown in error message
```

---

## Accessibility Checklist

### Screen Reader Testing
- [ ] File input has `<label for="csv-file-input">`
- [ ] Error messages use `role="alert"` + `aria-live="polite"`
- [ ] Results table has `<caption>`
- [ ] All buttons have `type="button"`
- [ ] "Clear" button announces as "Clear, button"

### Keyboard Navigation
- [ ] Tab order: File input → Process CSV → Clear → Download .ics
- [ ] Enter key activates all buttons
- [ ] Space key activates all buttons
- [ ] No focus traps
- [ ] Visible focus indicators on all interactive elements

---

## Related Documentation

- **CSV Import v1.1 spec:** `specs/008-0020-2-csv-v1-1/spec.md`
- **Delta doc:** `ops/deltas/0020_2_csv_v1_1.md`
- **Monitoring guide:** `ops/post-merge-monitoring-v1.1.md`
- **CHANGELOG:** [v0.1.6-a.2](../../CHANGELOG.md#v016-a2---2025-10-09)
- **Release notes:** [v0.1.6-a.2](https://github.com/mmtuentertainment/PayPlan/releases/tag/v0.1.6-a.2)

---

**Last updated:** 2025-10-09 (v0.1.6-a.2)
