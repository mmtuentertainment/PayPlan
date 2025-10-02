# QuickStart: Inbox Paste Phase B

**Feature**: PayPlan v0.1.4 — Inbox Paste Phase B
**Purpose**: End-to-end user validation steps for 6-provider paste scenario
**Date**: 2025-10-02

---

## Prerequisites

**Environment**:
- Local development server running: `npm run dev` (frontend)
- Backend server running: `npm start` (backend on port 3000 or via Vercel dev)
- Chrome/Firefox/Safari/Edge (latest 2 versions)

**Test Fixtures**:
- 6 sample emails available in `tests/fixtures/emails/`:
  - `afterpay-payment1.txt`
  - `paypal4-payment2.txt`
  - `zip-payment1.txt`
  - `sezzle-payment3.txt`
  - `klarna-payment1.txt` (Phase A)
  - `affirm-payment2.txt` (Phase A)

**User Setup**:
- Browser console open (F12) to monitor errors
- Screen reader enabled (optional, for accessibility testing)

---

## QuickStart Steps (Black Box)

### Step 1: Prepare Test Email Batch

**Action**: Open all 6 fixture files and copy contents into a single text block, separated by `---`.

**Expected Input**:
```
From: payments@afterpay.com
Subject: Payment Reminder
Your Afterpay payment of $25.00 is due on October 6, 2025.
Payment 1 of 4. AutoPay is OFF. Late fee: $7.00.

---

From: service@paypal.com
Subject: Pay in 4 Reminder
Your PayPal Pay in 4 installment of $50.00 is due on October 15, 2025.
Payment 2 of 4. Automatic payment enabled.

---

From: notifications@zip.co
Subject: Zip Payment Due
Payment: $30.00 is due on November 1, 2025.
Payment 1 of 4. Auto payment enabled.

---

From: hello@sezzle.com
Subject: Sezzle Payment Reminder
Installment: $35.00 due on December 5, 2025.
Payment 3 of 4. Autopay is on.

---

From: no-reply@klarna.com
Subject: Klarna Payment Reminder
Payment: $45.00 due on October 4, 2025.
Payment 1 of 4. AutoPay is ON. Late fee: $7.00.

---

From: notifications@affirm.com
Subject: Affirm Installment Due
Installment: $60.00 due on 10/20/2025.
Payment 2 of 4.
```

**Time**: < 1 minute

---

### Step 2: Navigate to Inbox Paste

**Action**: Open PayPlan app in browser, navigate to Inbox Paste tab/section.

**Expected UI**:
- Text area labeled "Paste BNPL emails here"
- "Extract" button (or auto-extraction on paste)
- Empty preview table
- Empty Issues section

**Validation**:
✅ Inbox Paste UI loads without errors

**Time**: < 5 seconds

---

### Step 3: Paste Email Batch

**Action**: Paste the prepared email batch into the text area, click "Extract" (or wait for auto-extraction).

**Expected Behavior**:
- Loading spinner appears briefly (<2s)
- Preview table populates with extracted items
- Issues section populates with any errors/warnings

**Validation**:
✅ Extraction completes in <2 seconds
✅ No JavaScript errors in console

**Time**: < 2 seconds

---

### Step 4: Verify Extracted Items

**Action**: Inspect the preview table rows.

**Expected Results**:
| Provider | Installment | Due Date | Amount | Currency | AutoPay | Late Fee | **Confidence** |
|----------|------------|----------|--------|----------|---------|----------|---------------|
| Afterpay | 1 | 2025-10-06 | 25.00 | USD | No | 7.00 | High (green) |
| PayPal Pay in 4 | 2 | 2025-10-15 | 50.00 | USD | Yes | 0.00 | High (green) |
| Zip | 1 | 2025-11-01 | 30.00 | USD | Yes | 0.00 | High (green) |
| Sezzle | 3 | 2025-12-05 | 35.00 | USD | Yes | 0.00 | High (green) |
| Klarna | 1 | 2025-10-04 | 45.00 | USD | Yes | 7.00 | High (green) |
| Affirm | 2 | 2025-10-20 | 60.00 | USD | No | 0.00 | High (green) |

**Validation**:
✅ At least 5 rows extracted (acceptance: ≥5 valid rows)
✅ All 6 providers represented
✅ Confidence pills visible with color coding:
  - Green pill with "High" text for confidence ≥ 0.8
✅ All amounts, dates, installment numbers correct

**Time**: < 30 seconds

---

### Step 5: Verify Low-Confidence Handling (Optional Edge Case)

**Action**: Paste a malformed email (e.g., missing amount):

```
From: unknown@example.com
Subject: Payment Reminder
Your payment is due on October 10, 2025.
```

**Expected Results**:
- Issues section shows new entry:
  - Snippet: "From: [EMAIL] Subject: Payment..." (PII redacted)
  - Reason: "Provider not recognized" or "Amount not found"
  - Field hints: ["Provider not recognized", "Amount not found"] (if partially extracted)
- If partially extracted with confidence < 0.6:
  - Row appears in preview table with red "Low" pill
  - Same row appears in Issues with field hints

**Validation**:
✅ Low-confidence item (<0.6) appears in Issues
✅ Field hints clearly indicate missing data
✅ PII redacted in snippet (email → [EMAIL], amounts → [AMOUNT])
✅ aria-live="polite" announces issue update (test with screen reader)

**Time**: < 1 minute

---

### Step 6: Verify CSV Export

**Action**: Click "Copy as CSV" button in preview section.

**Expected Behavior**:
- Clipboard contains CSV data
- Paste into text editor or spreadsheet

**Expected CSV Format**:
```csv
provider,installment_no,due_date,amount,currency,autopay,late_fee,confidence
Afterpay,1,2025-10-06,25.00,USD,false,7.00,1.0
PayPal Pay in 4,2,2025-10-15,50.00,USD,true,0.00,1.0
Zip,1,2025-11-01,30.00,USD,true,0.00,1.0
Sezzle,3,2025-12-05,35.00,USD,true,0.00,1.0
Klarna,1,2025-10-04,45.00,USD,true,7.00,1.0
Affirm,2,2025-10-20,60.00,USD,false,0.00,1.0
```

**Validation**:
✅ CSV has header row with "confidence" as last column
✅ All 6 items exported
✅ Confidence values are decimals (0-1)
✅ CSV parses correctly in spreadsheet apps

**Time**: < 30 seconds

---

### Step 7: Build Payment Plan

**Action**: Click "Build Plan" button (or navigate to plan builder with extracted items).

**Expected Behavior**:
- UI transitions to plan builder or displays plan result
- POST request sent to `/api/plan` with extracted items
- Plan returned within 60 seconds (total time from Step 3)

**Expected Plan Output**:
- 6 payment items in schedule
- Risk flags if applicable (e.g., weekend autopay, cash crunch)
- Actions prioritized by late fee (Afterpay, Klarna first)
- Summary bullets (6-8 items)
- ICS calendar export option

**Validation**:
✅ POST /api/plan returns 200 OK
✅ Plan includes all 6 extracted items
✅ Total time from paste (Step 3) to plan result < 60 seconds
✅ No network calls before /api/plan (extraction is client-only)

**Time**: < 5 seconds

---

## Success Criteria (Black Box)

✅ **All 6 providers extracted**: Afterpay, PayPal Pay in 4, Zip, Sezzle, Klarna, Affirm
✅ **≥5 valid rows** in preview table (acceptance threshold)
✅ **Confidence pills displayed** with correct color coding (High/Med/Low)
✅ **Low-confidence items flagged** in Issues with field hints (if any)
✅ **CSV export includes confidence** as last column
✅ **Build Plan works unchanged** (no API changes)
✅ **Total time < 60 seconds** from paste to plan result
✅ **No network calls before /api/plan** (extraction is client-only)
✅ **PII redacted** in all error/issue snippets
✅ **Accessibility**: Confidence pills have text alternatives; Issues use aria-live

---

## Performance Benchmarks

### Extraction Performance

**Test**: Paste 50 emails (8-10 of each provider).

**Measurement**: Time from "Extract" click to preview table populated.

**Target**: < 2 seconds on mid-tier laptop (Intel i5, 8GB RAM)

**Validation**:
```javascript
// In browser console
console.time('extraction');
// [paste 50 emails, click Extract]
console.timeEnd('extraction');
// Expected: extraction: 1800ms (or less)
```

### End-to-End Performance

**Test**: Full flow from Step 3 (paste) to Step 7 (plan result).

**Target**: < 60 seconds total

**Breakdown**:
- Extraction: < 2s
- User review: ~30s (manual)
- Build Plan API call: < 5s
- **Total**: ~37s typical, < 60s max

---

## Accessibility Validation (Optional)

### Screen Reader Test

**Tool**: NVDA (Windows), VoiceOver (macOS), or JAWS

**Steps**:
1. Navigate to Inbox Paste with keyboard only (Tab, Enter)
2. Paste emails, trigger extraction
3. Navigate preview table with arrow keys
4. Listen for confidence pill announcements (e.g., "Extraction confidence: High")
5. Navigate to Issues section, verify aria-live announcements

**Validation**:
✅ All interactive elements keyboard-accessible
✅ Confidence pills have meaningful aria-labels
✅ Issues section announces new items when added (aria-live="polite")
✅ No visual-only information (color not sole indicator)

---

## Rollback Plan

If Phase B fails validation:

1. **Revert commit**: `git revert <commit-hash>`
2. **Redeploy Phase A**: No changes to API, so frontend-only rollback
3. **User Impact**: Inbox Paste reverts to 2 providers (Klarna, Affirm); no confidence pills

**Zero downtime**: Backend unchanged, so rollback is instant.

---

## Next Steps After Validation

- [ ] Run integration test suite (`npm test`)
- [ ] Run performance benchmark (50 emails < 2s)
- [ ] Run accessibility audit (axe DevTools)
- [ ] Update README.md with new providers
- [ ] Tag release: `v0.1.4-a` (Phase A: Afterpay + confidence)
- [ ] Deploy to staging
- [ ] User acceptance testing (UAT)
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

---

**QuickStart Complete** | Ready for User Validation
