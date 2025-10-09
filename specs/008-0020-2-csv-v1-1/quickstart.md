# QuickStart: CSV Import v1.1 — Currency Regex + Clear Button

**Feature Branch**: `008-0020-2-csv-v1-1`
**Created**: 2025-10-09
**Status**: Planning

---

## One-Command Verification

### Install & Test (Full Suite)

```bash
# From repository root
npm --prefix frontend install && npm --prefix frontend test
```

**Expected**: All tests pass, including new `import-csv-v1-1.test.tsx` suite.

### Lint Check

```bash
npm --prefix frontend run lint
```

**Expected**: Zero errors, zero warnings.

### Build Check

```bash
npm --prefix frontend run build
```

**Expected**: Clean build, no TypeScript errors.

---

## Manual QA Script (5 minutes)

### Setup

1. Start development server:
   ```bash
   npm --prefix frontend run dev
   ```

2. Navigate to: `http://localhost:5173/import` (or configured port)

3. Have test CSVs ready (see fixtures below)

---

### Test Scenario 1: Valid Currencies

**Steps**:
1. Upload `valid-currencies.csv` (USD, EUR, GBP)
2. Click "Process CSV"

**Expected**:
- ✅ Schedule table appears
- ✅ Risks section shows (if applicable)
- ✅ "Download .ics" button enabled
- ✅ No error message

**CSV Fixture**:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,USD,2025-10-15,false
Affirm,50.00,EUR,2025-10-16,true
Afterpay,37.50,GBP,2025-10-17,false
```

---

### Test Scenario 2: Invalid Currency (Lowercase)

**Steps**:
1. Upload `invalid-lowercase.csv` (contains "usd")
2. Click "Process CSV"

**Expected**:
- ❌ Error banner appears: `"Invalid currency code in row 1: usd (expected 3-letter ISO 4217 code)"`
- ❌ No schedule table
- ❌ No ICS download button

**CSV Fixture**:
```csv
provider,amount,currency,dueISO,autopay
Klarna,25.00,usd,2025-10-15,false
```

---

### Test Scenario 3: Invalid Currency (Two Letters)

**Steps**:
1. Upload `invalid-two-letter.csv` (contains "US")
2. Click "Process CSV"

**Expected**:
- ❌ Error: `"Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"`
- ❌ No partial results

**CSV Fixture**:
```csv
provider,amount,currency,dueISO,autopay
Affirm,50.00,US,2025-10-16,true
```

---

### Test Scenario 4: Invalid Currency (Four Letters)

**Steps**:
1. Upload `invalid-four-letter.csv` (contains "USDX")
2. Click "Process CSV"

**Expected**:
- ❌ Error: `"Invalid currency code in row 1: USDX (expected 3-letter ISO 4217 code)"`

**CSV Fixture**:
```csv
provider,amount,currency,dueISO,autopay
Afterpay,37.50,USDX,2025-10-17,false
```

---

### Test Scenario 5: Clear Button — File Reset

**Steps**:
1. Upload any valid CSV (do not click Process)
2. Note "Selected: filename.csv" message
3. Click "Clear" button

**Expected**:
- ✅ File selection message disappears
- ✅ File input is empty (no file chosen)
- ✅ No error message
- ✅ No results table

---

### Test Scenario 6: Clear Button — Error Reset

**Steps**:
1. Upload invalid CSV (e.g., lowercase currency)
2. Click "Process CSV" → error appears
3. Click "Clear" button

**Expected**:
- ✅ Error banner disappears
- ✅ File input resets
- ✅ Page returns to initial state

---

### Test Scenario 7: Clear Button — Results Reset

**Steps**:
1. Upload valid CSV
2. Click "Process CSV" → schedule appears
3. Click "Clear" button

**Expected**:
- ✅ Schedule table disappears
- ✅ "Download .ics" button disappears
- ✅ File input resets
- ✅ No error message

---

### Test Scenario 8: Keyboard Navigation

**Steps**:
1. Load Import page
2. Press Tab repeatedly to navigate controls
3. Verify Clear button receives focus (visible outline)
4. Press Enter or Space on Clear button

**Expected**:
- ✅ Clear button is keyboard reachable
- ✅ Enter/Space triggers Clear action
- ✅ Page state resets as expected

---

## DevTools Network Verification

### Zero Network Calls Test

**Steps**:
1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Clear existing requests (trash icon)
4. Upload CSV and click "Process CSV"
5. Observe network activity

**Expected**:
- ✅ **Zero XHR/Fetch requests** after initial page load
- ✅ Only static assets (JS/CSS) from page load

**Repeat for Clear**:
1. Clear network log
2. Click "Clear" button
3. Observe network activity

**Expected**:
- ✅ **Zero requests**

---

## Accessibility (A11y) Verification

### Screen Reader Simulation

**Tool**: Chrome DevTools Accessibility Inspector or NVDA/JAWS

**Steps**:
1. Inspect file input element
   - Expected: Has associated `<label for="csv-file-input">`
   - Expected: Screen reader announces label text

2. Trigger currency error
   - Expected: Error div has `role="alert" aria-live="polite"`
   - Expected: Screen reader announces error message

3. Inspect results table (after valid upload)
   - Expected: `<table>` has `<caption>` element
   - Expected: Caption text describes table content

4. Check all buttons
   - Expected: All buttons have `type="button"` attribute
   - Expected: Prevents form submission behavior

---

### Keyboard-Only Navigation

**Steps**:
1. Load Import page
2. Use only keyboard (no mouse):
   - Tab to file input → press Enter → select file
   - Tab to "Process CSV" → press Enter
   - Tab to "Clear" → press Enter
   - Tab to "Download .ics" → press Enter

**Expected**:
- ✅ All interactive elements reachable via Tab
- ✅ Enter/Space activates buttons
- ✅ No keyboard traps
- ✅ Focus indicators visible

---

## Constitution Compliance Check

### Pre-Merge Checklist

Run these checks before creating PR:

```bash
# 1. Count files changed
git diff --name-only main...HEAD | wc -l
# Expected: ≤ 4 files (excluding delta doc)

# 2. Count net new LOC (code + tests)
git diff main...HEAD -- 'frontend/src/**' 'frontend/tests/**' | grep -E '^\+' | grep -v '^\+++' | wc -l
# Expected: ≤ 140 lines (target ≤ 90)

# 3. Check dependencies
git diff main...HEAD -- package.json frontend/package.json
# Expected: No changes

# 4. Run tests
npm --prefix frontend test
# Expected: All pass

# 5. Run linter
npm --prefix frontend run lint
# Expected: Zero errors/warnings

# 6. Check ESLint guards (no restricted imports)
npm --prefix frontend run lint -- --rule 'no-restricted-imports: error'
# Expected: Zero violations
```

### Error Copy Verification

**Grep for locked error message**:
```bash
grep -n "expected 3-letter ISO 4217 code" frontend/src/pages/Import.tsx
```

**Expected**: Exact match on error message line:
```
Invalid currency code in row ${rowNum}: ${row.currency.trim()} (expected 3-letter ISO 4217 code)
```

---

## Rollback Test

### Single Revert Verification

```bash
# Create test commit (on feature branch)
git add -A
git commit -m "Test commit for revert"

# Record commit SHA
export TEST_COMMIT=$(git rev-parse HEAD)

# Revert commit
git revert HEAD --no-edit

# Verify old behavior restored
npm --prefix frontend test
# Expected: Tests pass with old error message

# Check error message reverted
grep "Invalid currency in row" frontend/src/pages/Import.tsx
# Expected: Old message (no "expected 3-letter ISO 4217 code")

# Clean up
git reset --hard $TEST_COMMIT
```

**Expected**: Single revert cleanly undoes all v1.1 changes.

---

## Common Issues & Troubleshooting

### Issue: Tests Fail with "fetch is not defined"

**Cause**: Missing fetch mock in test setup
**Fix**: Check `beforeEach` in test file has:
```typescript
global.fetch = vi.fn(() => Promise.reject('No network allowed'));
```

---

### Issue: Clear Button Not Working

**Symptom**: Click Clear, but file input not reset
**Debug**:
```typescript
const fileInput = document.getElementById('csv-file-input');
console.log('File input:', fileInput);
console.log('Value before clear:', fileInput?.value);
fileInput!.value = '';
console.log('Value after clear:', fileInput?.value);
```

**Expected**: Value changes from filename to empty string

---

### Issue: Currency Validation Too Strict

**Symptom**: Valid currencies like "eur" rejected
**Debug**: Check normalization:
```typescript
const currency = row.currency.trim().toUpperCase();
console.log('Normalized currency:', currency);
console.log('Regex test:', /^[A-Z]{3}$/.test(currency));
```

**Expected**: Lowercase input normalized to uppercase before regex

---

### Issue: Error Message Wrong Format

**Symptom**: Error doesn't match spec exactly
**Fix**: Verify exact string template:
```typescript
throw new Error(`Invalid currency code in row ${rowNum}: ${row.currency.trim()} (expected 3-letter ISO 4217 code)`);
```

**Note**: Include `row.currency.trim()` (original input) in error, not normalized value

---

## Performance Baseline

### Expected Test Duration

| Test Suite | Duration | Notes |
|------------|----------|-------|
| `import-csv-v1-1.test.tsx` | ~2-3s | New currency + Clear tests |
| `import-hardening.test.tsx` | ~5-8s | Existing safety tests (extended) |
| `import-page.test.tsx` | ~1-2s | Basic smoke tests |
| **Total** | **~8-13s** | Full test suite |

**Regression alert**: If test duration >20s, investigate test setup overhead.

---

## Quick Reference: File Locations

| File | Purpose | Path |
|------|---------|------|
| Main component | Import page | `frontend/src/pages/Import.tsx` |
| New tests | Currency + Clear | `frontend/tests/integration/import-csv-v1-1.test.tsx` |
| Existing tests | Safety hardening | `frontend/tests/integration/import-hardening.test.tsx` |
| Delta doc | Change summary | `ops/deltas/008_0020_2_csv_v1_1.md` |
| Spec | Source of truth | `specs/008-0020-2-csv-v1-1/spec.md` |

---

## Next Steps

After verifying all QA steps pass:

1. Create PR with title: `v1.1: CSV Import — Currency Regex + Clear Button`
2. Link PR to spec: `Implements specs/008-0020-2-csv-v1-1/spec.md`
3. Add PR labels: `patch`, `client-only`, `reversible`, `a11y`
4. Request review from: accessibility champion, test lead
5. Merge after CI green + 1 approval

---

**End of QuickStart**
