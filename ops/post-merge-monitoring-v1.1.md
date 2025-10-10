# Post-Merge Monitoring: CSV Import v1.1

**Release:** v0.1.6-a.2
**Date:** 2025-10-09
**PR:** #23
**Linear:** MMT-13

---

## DevTools Console Monitoring (No Instrumentation Required)

### Currency Validation Errors
**Filter:** `Invalid currency code in row`

**Expected behavior:**
- User uploads CSV with invalid currency (e.g., `US`, `USDX`, `U$D`)
- Error displayed: `"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`
- Console shows same error (no network calls)

**What to look for:**
- ✅ Error message shows original user input
- ✅ No network requests logged
- ✅ Error appears in red alert region on page

---

## UX Sanity Checks

### Happy Path: Valid CSV
1. Upload valid CSV with USD/EUR/GBP
2. Click "Process CSV"
3. ✅ See schedule table with risk detection
4. ✅ See "Download .ics" button
5. ✅ Click "Clear" → all state resets
6. ✅ File input value cleared

### Edge Cases

#### Semicolon CSV (Delimiter Detection)
- **Input:** CSV with semicolons instead of commas
- **Expected:** `"Parse failure: expected comma-delimited CSV"`
- **Verify:** Error shows in alert region, no network calls

#### Large File (>1MB)
- **Input:** CSV >1MB
- **Expected:** `"CSV too large (max 1MB)"`
- **Verify:** Pre-parse guard fires immediately

#### Too Many Rows (>1000)
- **Input:** CSV with 1001+ rows
- **Expected:** `"Too many rows (max 1000)"`
- **Verify:** Guard fires after header validation

#### Invalid Currency Formats
- **Input:** `US`, `USDX`, `U$D`, `123`, `usd` (lowercase)
- **Expected:**
  - `US` → rejected (2 letters)
  - `USDX` → rejected (4 letters)
  - `U$D` → rejected (special char)
  - `123` → rejected (numbers)
  - `usd` → **accepted** (normalized to USD)

---

## Keyboard Navigation

### Clear Button Keyboard Test
1. Upload CSV (valid or invalid)
2. Tab to "Clear" button
3. Press **Enter** → ✅ State resets
4. Upload CSV again
5. Tab to "Clear" button
6. Press **Space** → ✅ State resets

### Verify Focus Management
- ✅ Tab order: File input → Process CSV → Clear → Download .ics
- ✅ Focus visible on all interactive elements
- ✅ No focus traps

---

## Accessibility Verification

### Screen Reader Testing (Optional)
- ✅ File input label announced: "Upload CSV file"
- ✅ Error announced as alert: "Invalid currency code..."
- ✅ Table caption announced: "Payment plan schedule with risk assessment"
- ✅ Clear button announced: "Clear, button"

### ARIA Attributes
- ✅ `<label for="csv-file-input">` present
- ✅ Error region has `role="alert"` and `aria-live="polite"`
- ✅ Results table has `<caption>`
- ✅ All buttons have `type="button"`

---

## Network Isolation Verification

### DevTools Network Tab
1. Open DevTools → Network tab
2. Upload CSV and process
3. ✅ Zero network requests (except initial page load)
4. Click "Download .ics"
5. ✅ Blob URL created locally (no network)

### Test Spy Verification
```bash
npm --prefix frontend test import-csv-v1-1
```
- ✅ All 19 tests passing
- ✅ Network spy enforces zero calls
- ✅ `afterAll` cleanup prevents leakage

---

## Rollback Verification (If Needed)

### Single-Commit Revert
```bash
git revert 576d9e9
git push origin main
```

### Post-Rollback Tests
```bash
npm --prefix frontend test        # All tests pass
npm --prefix frontend run lint    # Clean
npm --prefix frontend run build   # Success
```

---

## Known Non-Issues (Intentional Design)

### Pattern-Only Currency Validation
- ✅ Accepts any 3-letter uppercase code (e.g., ZZZ, ABC)
- ✅ Intentional: Avoids client-side ISO 4217 list drift
- ✅ Backend should enforce strict allowlist if required

### Direct DOM Manipulation in handleClear
- ✅ Uses `document.getElementById('csv-file-input')`
- ✅ Works correctly, React ref would be more idiomatic
- 📋 Tracked in MMT-14 (low priority)

---

## Success Metrics

### Immediate (Day 1)
- ✅ No production errors in logs
- ✅ All CI checks passing
- ✅ Vercel deployments stable
- ✅ User reports: better error messages

### Short-term (Week 1)
- 📊 Monitor console for currency validation errors
- 📊 Track Clear button usage (if analytics added)
- 📊 No accessibility complaints

### Long-term (Month 1)
- 📊 Consider ISO allowlist if users request stricter validation
- 📊 Review MMT-14 backlog items based on feedback

---

## Contact

**Issues:** https://github.com/mmtuentertainment/PayPlan/issues
**Linear:** https://linear.app/mmtu-entertainment
**Rollback doc:** `ops/deltas/0020_2_csv_v1_1.md:157-171`

---

**Status:** ✅ Monitoring active as of 2025-10-09
