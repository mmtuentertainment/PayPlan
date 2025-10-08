# QuickStart Guide: Demo Mode End-to-End

**Feature**: 006-0019-demo-mode | **Date**: 2025-10-07

## Overview

This guide provides step-by-step instructions for validating the Demo Mode feature. It covers both manual testing and automated test execution.

## Prerequisites

- Node.js 18+ and pnpm installed
- Repository cloned and dependencies installed (`pnpm install` in `/frontend`)
- Dev server running (`pnpm dev` in `/frontend`)

## Manual Validation

### Step 1: Start Development Server

```bash
cd frontend
pnpm dev
```

**Expected Output**:
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Navigate to Demo Page

1. Open browser to `http://localhost:5173/demo`

**Expected**:
- Page loads without errors
- Page title: "PayPlan Demo"
- 10 email snippets displayed in collapsible sections or cards
- Snippets labeled with provider names (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- "Run Demo" button visible and enabled
- No "Download .ics" button yet (appears after running demo)

**DevTools Check**:
- Open DevTools → Network tab
- Verify: **No network requests** after page load completes

### Step 3: Run Demo Extraction

1. Click "Run Demo" button

**Expected**:
- Button shows loading state (spinner or "Processing...")
- After ~1 second, results appear below
- Results section contains:
  - **Normalized Schedule Table**: 10 rows (one per fixture)
  - **Confidence Pills**: Each row has a pill (High/Medium/Low)
    - Green pill = High (≥0.80)
    - Yellow pill = Medium (0.50-0.79)
    - Orange pill = Low (0.35-0.49)
  - **Risk Pills** (if detected):
    - COLLISION: Red pill "⚠️ Multiple payments on same date"
    - WEEKEND_AUTOPAY: Yellow pill "⚠️ Autopay scheduled for weekend"
- "Download .ics" button now visible and enabled

**DevTools Check**:
- Network tab: **Still no new network requests**
- Console: No errors

### Step 4: Verify Schedule Data

**Check the normalized schedule table**:
- 10 rows present
- Columns: Provider, Installment, Due Date, Amount, Currency, Autopay, Late Fee, Confidence
- Provider variety: At least 5 different providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- Amounts: Reasonable values ($10-$100 range)
- Dates: Future dates (relative to "today")
- No PII: No real names, emails, addresses visible

### Step 5: Download ICS Calendar

1. Click "Download .ics" button

**Expected**:
- Browser download triggered immediately
- File downloads: `payplan-demo.ics` (or similar name)
- File size: ~1-5 KB (small text file)

**Verify ICS Content**:
1. Open `payplan-demo.ics` in text editor
2. Check:
   - Valid ICS format (starts with `BEGIN:VCALENDAR`, ends with `END:VCALENDAR`)
   - Contains `VTIMEZONE` block with correct IANA timezone
   - Contains 1-10 `VEVENT` blocks (only "This Week" events)
   - Each event has:
     - `SUMMARY`: e.g., "Klarna Payment - $25.00"
     - `DTSTART`: Date in "This Week" range
     - `DESCRIPTION`: Contains installment number and risk annotation (if applicable)
   - Risk annotations present if COLLISION or WEEKEND_AUTOPAY detected

**Example ICS Event**:
```
BEGIN:VEVENT
UID:xxx-xxx-xxx
SUMMARY:Klarna Payment - $25.00
DTSTART;TZID=America/New_York:20251015T120000
DURATION:PT1H
DESCRIPTION:Installment 2 of 4\n⚠️ Multiple payments due on this date
END:VEVENT
```

### Step 6: Import to Calendar (Optional)

1. Import `payplan-demo.ics` to Google Calendar, Outlook, or Apple Calendar
2. Verify events appear on correct dates
3. Verify event descriptions include risk warnings (if applicable)

### Step 7: Edge Cases

**Test: No "This Week" Payments**
- Modify fixture dates to be >7 days in future
- Run demo
- Click "Download .ics"
- Verify: ICS file contains header but no events (or appropriate message)

**Test: All Low Confidence**
- Modify fixtures to have minimal data (e.g., missing amounts)
- Run demo
- Verify: All pills show "Low" confidence

**Test: No Risks Detected**
- Ensure no fixtures have duplicate dates or weekend autopay
- Run demo
- Verify: No risk pills displayed

---

## Automated Test Execution

### Unit Tests

```bash
cd frontend
pnpm test -- tests/unit/demo
```

**Expected Output**:
```
✓ tests/unit/demo/load-fixtures.test.ts (3 tests)
  ✓ returns 10 fixtures
  ✓ all fixtures have valid provider names
  ✓ no PII detected in fixture content

✓ tests/unit/demo/ics-client.test.ts (4 tests)
  ✓ generates valid ICS format
  ✓ filters to "This Week" only
  ✓ includes timezone information
  ✓ adds risk annotations to descriptions

Test Files  2 passed (2)
Tests  7 passed (7)
Duration  XXXms
```

### Integration Test

```bash
cd frontend
pnpm test -- tests/integration/demo-page.test.ts
```

**Expected Output**:
```
✓ tests/integration/demo-page.test.ts (5 tests)
  ✓ renders demo page with 10 fixtures
  ✓ "Run Demo" button triggers extraction
  ✓ displays confidence pills after extraction
  ✓ displays risk pills when risks detected
  ✓ "Download .ics" button generates blob

Test Files  1 passed (1)
Tests  5 passed (5)
Duration  XXXms
```

### Performance Validation

```bash
cd frontend
pnpm test:perf
```

**Expected**:
- Existing performance tests still pass
- Demo page not included in perf tests (out of scope)

### Linting

```bash
cd frontend
pnpm lint
```

**Expected**:
- Zero ESLint errors
- No import path violations (demo imports only from `lib/extraction/**` and `lib/demo/**`)

### Spec Audit

```bash
cd /home/matt/PROJECTS/PayPlan
npm run audit:specs
```

**Expected**:
- All file paths in `specs/006-0019-demo-mode/*.md` resolve correctly
- No broken references

---

## Acceptance Criteria Verification

| Requirement | Test Method | Pass Criteria |
|-------------|-------------|---------------|
| FR-001: `/demo` route accessible | Manual: Navigate to `/demo` | Page loads, no 404 |
| FR-002: 10 synthetic snippets displayed | Manual: Count snippets | Exactly 10 snippets visible |
| FR-003: "Run Demo" button | Manual: Click button | Extraction triggers |
| FR-004: Client-side extraction | Manual: DevTools Network tab | Zero requests during demo |
| FR-005: Normalized schedule display | Manual: Check table | 10 rows with all fields |
| FR-006: Confidence pills | Manual: Visual check | High/Med/Low pills present |
| FR-007: Risk detection | Manual: Check for risk pills | COLLISION/WEEKEND_AUTOPAY shown if detected |
| FR-008: Color-coded pills | Manual: Visual check | Green/Yellow/Orange for confidence |
| FR-009: "Download .ics" button | Manual: Click button | ICS file downloads |
| FR-010: "This Week" filtering | Manual: Open ICS file | Only current week events |
| FR-011: Risk annotations in ICS | Manual: Check ICS DESCRIPTION | Risk warnings present |
| FR-012: Timezone-aware dates | Manual: Check ICS TZID | Valid IANA timezone |
| FR-013: Client-side download | Manual: DevTools Network | No upload requests |
| FR-014: Synthetic data only | Manual: Review fixtures | No real PII |
| FR-015: Offline operation | Manual: Disconnect network, reload | Demo still works |
| FR-016: No auth required | Manual: Access page | No login prompt |
| FR-017: No PII collection | Manual: DevTools Network | No tracking/analytics |
| FR-018: Reversible | Manual: Check git diff | All changes in few files |
| FR-019: CI guards green | Automated: `pnpm lint`, `pnpm test:perf` | All pass |
| FR-020: Import path compliance | Automated: ESLint | No violations |

---

## Rollback Test

**Verify single-commit revert restores pre-demo state**:

```bash
# Note the current commit
git log -1 --oneline

# Create a temporary branch
git checkout -b test-rollback

# Revert the demo feature commit
git revert <demo-commit-sha>

# Verify app still works
cd frontend
pnpm dev
# Navigate to http://localhost:5173/ (should work)
# Navigate to http://localhost:5173/demo (should 404)

# Run tests
pnpm test
pnpm lint

# Cleanup
git checkout 006-0019-demo-mode
git branch -D test-rollback
```

**Expected**: All tests pass, main app unaffected, `/demo` route inaccessible.

---

## Troubleshooting

### Issue: "Run Demo" button does nothing

**Check**:
- Browser console for errors
- Verify `loadFixtures()` returns 10 fixtures
- Verify `extractItemsFromEmails` is imported correctly

### Issue: ICS file is empty or invalid

**Check**:
- "This Week" filter logic (may be no events if all dates are outside current week)
- `ics` library version (should be 3.8.1)
- Timezone parameter (must be valid IANA timezone like "America/New_York")

### Issue: Confidence pills all show "Low"

**Check**:
- Fixture content quality (ensure amounts, dates, installment numbers are extractable)
- Provider detection working (check `detectProvider()` in email-extractor)

### Issue: No risk pills shown

**Check**:
- Fixture dates (ensure at least 2 fixtures have same `due_date` for COLLISION)
- Autopay detection (ensure at least 1 fixture has autopay + weekend date)

### Issue: Network requests detected

**Check**:
- Dynamic imports (should be static imports only)
- Analytics/tracking scripts (should be disabled for demo page)
- ICS download (should use Blob + createObjectURL, not fetch)

---

## LOC Budget Verification

**After implementation, verify**:

```bash
cd /home/matt/PROJECTS/PayPlan

# Count LOC for new files
cloc frontend/src/pages/Demo.tsx \
     frontend/src/lib/demo/load-fixtures.ts \
     frontend/src/lib/demo/ics-client.ts \
     frontend/src/lib/demo/fixtures/*.txt \
     ops/deltas/0019_demo_mode.md

# Count LOC for modified files (check git diff)
git diff main frontend/src/App.tsx | grep -E '^\+' | wc -l
```

**Target**: Total net LOC ≤ 200 (excluding tests and delta doc)

---

**Status**: ✅ Ready for validation | **Next**: Execute `/tasks` command to generate tasks.md
