# PayPlan v0.1.5 — Low-Confidence Rescue Mode (Locale + Quick Fixes)

**Feature Spec**
**Version:** v0.1.5
**Status:** Draft
**Author:** Claude Code
**Date:** 2025-10-03

---

## Executive Summary

Turn "almost-parsed" emails into usable rows by letting users resolve ambiguity fast (date format, amounts, autopay) directly in the preview, raising confidence without leaving the page.

---

## Problem Statement

Users paste BNPL emails with ambiguous data:
- Date formats (01/02/2025 — is it Jan 2 or Feb 1?)
- Missing decimals in amounts ($25 vs $25.00)
- Unclear autopay language ("automatic billing scheduled")
- Partial installment phrases ("payment 2" without "of 4")

These result in **confidence scores <0.6**, triggering Issue flags and preventing effective planning. Users currently have no way to clarify ambiguity without re-pasting or manually editing the CSV.

---

## Goals

**Primary:**
- Enable users to **resolve ambiguity inline** via Quick Fixes for low-confidence rows
- Support **locale-aware date parsing** (US M/D/YYYY vs EU D/M/YYYY)
- Recompute confidence **live** as fixes are applied
- Maintain **100% client-side** operation (no new API calls)

**Secondary:**
- Reduce Issue flags for real-world paste scenarios
- Improve accessibility for keyboard-only workflows
- Preserve backward compatibility (v0.1.4-b behavior if Quick Fixes not used)

---

## Scope

### In Scope (v0.1.5)

**Frontend-only enhancements:**
1. **Locale Toggle:** US (M/D/YYYY) | EU (D/M/YYYY) date interpretation
2. **Quick Fixes UI:** Inline controls for rows with confidence <0.6
   - Date resolver (US/EU re-parse + manual override)
   - Amount normalizer (enforce 2 decimals)
   - Autopay flip (explicit ON/OFF)
   - Installment helper (dropdown for "X of Y")
3. **Live Confidence Recompute:** Update scores after each fix
4. **One-Level Undo:** Revert individual row to pre-fix state
5. **Re-extract:** Reprocess textarea with selected locale

**Constraints:**
- Zero new npm dependencies
- No backend/API changes
- Reversible (one-level undo per row)
- Performance: <16ms per fix on mid-tier laptop

### Out of Scope

- Multi-level undo/redo
- Persistent user preferences (locale resets on refresh)
- OCR, Gmail integration, or email fetching
- New currencies or providers
- Batch fix operations (must fix rows individually)

---

## Functional Requirements

### Core Requirements

**FR-146: Locale Switcher**
- UI toggle: US (default) | EU
- Affects only current extraction session
- Position: Above textarea, before "Parse Emails" button
- Label: "Date Format: US (MM/DD/YYYY) | EU (DD/MM/YYYY)"

**FR-147: Locale Date Interpretation**
- US mode: "01/02/2025" → January 2, 2025
- EU mode: "01/02/2025" → February 1, 2025
- Applies to `parseDate()` calls during extraction
- Does not mutate already-extracted rows until "Re-extract"

**FR-148: Quick Fix Visibility**
- Rows with `confidence < 0.6` display Quick Fix controls
- Controls appear inline in table row (expandable section)
- Visual indicator: "⚙️ Low Confidence — Quick Fixes Available"
- Accessible via keyboard (Tab navigation)

**FR-149: Date Quick Fix**
- Options:
  1. "Re-parse as US (MM/DD/YYYY)"
  2. "Re-parse as EU (DD/MM/YYYY)"
  3. Manual override: `<input type="date">` with `yyyy-MM-dd` format
- Validates date is between 2020-01-01 and 2030-12-31
- Invalid dates show error: "Date must be between 2020 and 2030"

**FR-150: Amount Quick Fix**
- Input field with placeholder: "25.00"
- Validates: numeric, 2 decimals, range [0.01, 9999.99]
- Auto-formats on blur: "25" → "25.00"
- Error states: "Must be numeric" | "Must have 2 decimals" | "Out of range"

**FR-151: Autopay Quick Fix**
- Radio buttons: ON | OFF
- Default: current detected value (if any)
- No validation errors (binary choice)

**FR-152: Installment Quick Fix**
- Two dropdowns:
  - "Installment #": 1-24
  - "Total installments": 1-24
- Constraint: current ≤ total
- Error: "Installment # cannot exceed total"

**FR-153: Confidence Recompute**
- Trigger: "Apply Fix" button per row
- Algorithm: Use existing `calculateConfidence()` with updated field values
- Visual feedback: Confidence pill updates color (🔴→🟡→🟢)
- Row re-sorts if confidence crosses 0.6 threshold

**FR-154: PII Redaction Preservation**
- Quick Fix controls never display raw email snippets
- Issue descriptions remain redacted (e.g., "Found snippet: [REDACTED]")
- Fixed values (dates, amounts) are user-provided, not extracted text

**FR-155: Accessibility**
- All controls keyboard-reachable (Tab, Enter, Space)
- Quick Fix section: `role="region"` with `aria-label="Quick fixes for row {N}"`
- Status changes announced: `aria-live="polite"` for "Confidence updated to 0.75"
- Error messages: `aria-describedby` linked to input fields

**FR-156: Performance**
- Apply-fix round-trip (validation → recompute → re-render): <16ms
- Measured with 20 rows, mixed confidence
- Test environment: mid-tier laptop (i5-8250U, 8GB RAM)

**FR-157: Undo Single Fix**
- "Undo" button appears after fix is applied
- Reverts row to pre-fix state (one level only)
- Clears after applying new fix (no undo history)

**FR-158: Locale Toggle Isolation**
- Changing locale does NOT re-extract automatically
- Already-fixed rows are not mutated
- User must click "Re-extract" to apply new locale

**FR-159: Re-extract Button**
- Position: Next to locale toggle
- Action: Reprocess `textarea` content with selected locale
- Clears all Quick Fixes (resets to original extraction)
- Confirmation dialog: "This will discard all Quick Fixes. Continue?"

**FR-160: Live Issue Updates**
- Issue list filters automatically when confidence crosses 0.6
- Example: Row starts at 0.55 (shown in Issues) → fix applied → 0.65 → removed from Issues
- No page reload required

**FR-161: CSV Export with Fixes**
- Exported CSV includes:
  - Fixed field values (not original detected values)
  - Updated confidence scores
- Column order unchanged from v0.1.4-b

**FR-162: Zero New Dependencies**
- Reuse existing: Luxon, React, shadcn/ui
- No new npm packages

**FR-163: Client-Only Operation**
- All logic in browser
- No API calls until user clicks "Send to API"
- POST `/api/plan` receives fixed data

**FR-164: Documentation Coverage**
- JSDoc on all new/modified exports: ≥80%
- Include `@param`, `@returns`, `@throws`, `@example`

**FR-165: Backward Compatibility**
- If user never opens Quick Fixes, behavior identical to v0.1.4-b
- Confidence calculation unchanged (same weights)
- Issue detection unchanged

---

## Data Model

### Extended Types

```typescript
/**
 * Date locale for parsing ambiguous formats.
 * @typedef {'US' | 'EU'} DateLocale
 */
export type DateLocale = 'US' | 'EU';

/**
 * Field that can be fixed via Quick Fixes.
 * @typedef {'dueDate' | 'amount' | 'autopay' | 'installmentNo' | 'installmentTotal'} FixableField
 */
export type FixableField = 'dueDate' | 'amount' | 'autopay' | 'installmentNo' | 'installmentTotal';

/**
 * Patch to apply to a row via Quick Fix.
 * @typedef {Object} RowFixPatch
 * @property {FixableField} field - Field to update
 * @property {any} value - New value (validated before merge)
 */
export interface RowFixPatch {
  field: FixableField;
  value: any;
}

/**
 * Snapshot of row state before fix (for undo).
 * @typedef {Object} RowSnapshot
 * @property {string} dueDate
 * @property {number} amount
 * @property {boolean} autopay
 * @property {number} installmentNo
 * @property {number} installmentTotal
 * @property {number} confidence
 */
export interface RowSnapshot {
  dueDate: string;
  amount: number;
  autopay: boolean;
  installmentNo: number;
  installmentTotal: number;
  confidence: number;
}
```

### State Management

```typescript
// EmailInboxPaste component state
const [dateLocale, setDateLocale] = useState<DateLocale>('US');
const [rowSnapshots, setRowSnapshots] = useState<Map<string, RowSnapshot>>(new Map());
const [activeQuickFix, setActiveQuickFix] = useState<string | null>(null); // row ID
```

---

## Architecture

### Component Structure

```
EmailInboxPaste (existing)
├── LocaleToggle (NEW)
│   ├── US/EU radio buttons
│   └── Re-extract button
├── EmailPreviewTable (modified)
│   └── EmailPreviewRow (modified)
│       ├── ConfidencePill (existing)
│       ├── QuickFixPanel (NEW) — only if confidence < 0.6
│       │   ├── DateQuickFix (NEW)
│       │   ├── AmountQuickFix (NEW)
│       │   ├── AutopayQuickFix (NEW)
│       │   └── InstallmentQuickFix (NEW)
│       └── UndoFixButton (NEW)
└── EmailIssuesList (existing) — updates live
```

### Data Flow

```
1. User pastes emails → extractEmails(text, { dateLocale })
2. Rows with confidence <0.6 show Quick Fix panel
3. User edits field → applyRowFix(rowId, patch)
4. Validation → merge → recomputeConfidence(row)
5. State updates → EmailPreviewTable re-renders
6. Issue list filters (confidence ≥0.6 rows hidden)
7. CSV export uses fixed values
8. POST /api/plan receives fixed data
```

### Key Functions

#### `extractEmails(text: string, options: { dateLocale?: DateLocale }): ExtractedEmail[]`
- **Input:** Raw email text, locale option
- **Output:** Array of extracted emails with confidence scores
- **Changes:** Pass `dateLocale` to `parseDate()` calls

#### `applyRowFix(row: ExtractedEmail, patch: RowFixPatch): ExtractedEmail`
- **Input:** Current row, field patch
- **Output:** Updated row with new confidence
- **Steps:**
  1. Validate patch value (throw if invalid)
  2. Create snapshot if first fix on this row
  3. Merge patch into row
  4. Recalculate confidence via `calculateConfidence(row)`
  5. Return updated row

#### `undoRowFix(rowId: string): void`
- **Input:** Row identifier
- **Output:** Restored row from snapshot
- **Steps:**
  1. Retrieve snapshot from Map
  2. Replace current row state
  3. Delete snapshot (one-level only)

#### `reExtractEmails(text: string, locale: DateLocale): ExtractedEmail[]`
- **Input:** Original textarea content, new locale
- **Output:** Fresh extraction (all fixes discarded)
- **Steps:**
  1. Confirm user intent (dialog)
  2. Clear all snapshots
  3. Run `extractEmails(text, { dateLocale: locale })`

---

## UI/UX Specifications

### Locale Toggle

**Position:** Above textarea, same row as "Parse Emails" button

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Date Format:  ⚪ US (MM/DD/YYYY)             │
│               ⚫ EU (DD/MM/YYYY)             │
│ [Re-extract with new format]                │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Default: US selected
- Changing radio does NOT trigger extraction
- "Re-extract" shows confirmation if fixes exist

### Quick Fix Panel

**Trigger:** Confidence <0.6

**Visual:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Row #2 | Klarna | 01/02/2025 | $25.00 | Payment 1 | 🟡 0.55    │
│ ⚙️ Low Confidence — Quick Fixes Available                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📅 Date: Ambiguous "01/02/2025"                             │ │
│ │    ⚪ Re-parse as US (Jan 2, 2025)                          │ │
│ │    ⚪ Re-parse as EU (Feb 1, 2025)                          │ │
│ │    Manual: [2025-02-01] (yyyy-MM-dd)                        │ │
│ │                                                              │ │
│ │ 💰 Amount: [25.00]                                          │ │
│ │ 🔄 Autopay: ⚪ ON  ⚫ OFF                                    │ │
│ │                                                              │ │
│ │ [Apply Fixes]  [Cancel]                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**After Fix Applied:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Row #2 | Klarna | 2025-02-01 | $25.00 | Payment 1 | 🟢 0.75    │
│ ✅ Fix applied — confidence increased to 0.75  [Undo]          │
└─────────────────────────────────────────────────────────────────┘
```

### Error States

**Date validation failure:**
```
📅 Date: [2019-12-31]
     ❌ Date must be between 2020-01-01 and 2030-12-31
```

**Amount validation failure:**
```
💰 Amount: [abc]
     ❌ Must be numeric with 2 decimals (e.g., 25.00)
```

**Installment constraint violation:**
```
🔢 Installment: [5] of [3]
     ❌ Installment # cannot exceed total
```

### Accessibility Features

- **Keyboard Navigation:** Tab through all controls; Enter/Space to activate
- **Screen Reader:**
  - "Low confidence row 2 of 5, Klarna payment. Quick fixes available."
  - "Confidence updated from 0.55 to 0.75. Fix applied successfully."
- **Focus Management:** After fix, focus moves to "Undo" button
- **Color Independence:** Icons + text labels (not color-only indicators)

---

## Testing Strategy

### Unit Tests (≥24)

**Date Locale (6 tests):**
1. US mode: "01/02/2025" → 2025-01-02
2. EU mode: "01/02/2025" → 2025-02-01
3. US mode: "12/31/2025" → 2025-12-31
4. EU mode: "31/12/2025" → 2025-12-31
5. Invalid US: "13/01/2025" → fallback to ISO parse
6. Invalid EU: "32/01/2025" → fallback to ISO parse

**Quick Fixes (12 tests):**
7. Date fix: valid manual override (2025-06-15)
8. Date fix: invalid year (2019) → error
9. Date fix: invalid format ("June 15") → error
10. Amount fix: "25" → "25.00"
11. Amount fix: "25.5" → "25.50"
12. Amount fix: "abc" → error
13. Amount fix: negative → error
14. Autopay fix: ON → boolean true
15. Autopay fix: OFF → boolean false
16. Installment fix: valid (2 of 4)
17. Installment fix: current > total → error
18. Installment fix: zero → error

**Confidence Recompute (4 tests):**
19. Fix date: confidence 0.55 → 0.70 (crosses threshold)
20. Fix amount: confidence 0.58 → 0.62
21. Fix multiple fields: confidence 0.50 → 0.80
22. Boundary: 0.59 → 0.60 (exactly at threshold)

**Undo (2 tests):**
23. Undo date fix: reverts to original value + confidence
24. Undo after multiple fixes: only reverts last snapshot

### Integration Tests (≥4)

**End-to-End Workflows:**
1. Paste ambiguous dates → apply US/EU fixes → confidence increases → issues clear
2. Re-extract with EU locale → ambiguous dates flip → fixed rows unchanged until re-extract
3. CSV export after fixes → includes corrected values + updated confidence
4. POST `/api/plan` with fixed data → server accepts (no validation errors)

### Test Fixtures

**`ambiguous-date.txt`:**
```
From: noreply@klarna.com
Subject: Payment reminder
Date: Thu, 1 Oct 2025 10:00:00 -0700

Your payment is due on 01/02/2025.
Amount: $25
```

**`amount-missing.txt`:**
```
From: hello@afterpay.com
Due: 2025-10-15
Payment 1 of 4: $25 (no decimals)
```

**`autopay-ambiguous.txt`:**
```
From: affirm.com
We'll process your payment automatically when due.
Amount: $50.00
```

**`installment-partial.txt`:**
```
From: sezzle.com
Payment 2 is coming up.
Amount: $30.00
Due: 2025-11-15
```

---

## Acceptance Criteria

**Black-Box Tests:**

1. **Ambiguous Date Resolution:**
   - Paste email with "01/02/2025"
   - Default US: parsed as Jan 2
   - Toggle EU → Re-extract → parsed as Feb 1
   - Apply manual override → "2025-03-15" → accepted
   - Confidence increases from 0.55 → 0.75

2. **Multi-Field Fix:**
   - Paste email missing amount decimals + unclear autopay
   - Quick Fix: Amount "25" → "25.00", Autopay → ON
   - Apply → confidence 0.50 → 0.70
   - Issue flag clears from list

3. **CSV Export:**
   - Fix 2 rows (date + amount)
   - Export CSV
   - Verify: fixed values present, confidence column updated
   - Re-import to `/api/plan` → no errors

4. **Undo:**
   - Apply date fix → confidence 0.55 → 0.75
   - Click Undo → reverts to original date + 0.55
   - Second Undo → button disabled (no deeper history)

5. **Accessibility:**
   - Keyboard-only: Tab to Quick Fix → Enter to expand → Tab through fields → Apply
   - Screen reader announces confidence change
   - Lighthouse a11y score ≥90

6. **Performance:**
   - Paste 20 emails (10 with confidence <0.6)
   - Apply fix to one row
   - Measure: validation + recompute + re-render <16ms (DevTools Performance)

**Acceptance Gates:**
- All 85 existing tests pass (no regressions)
- All 28+ new tests pass
- TypeScript builds clean
- No console errors/warnings
- Lighthouse: a11y ≥90, performance ≥90

---

## Non-Goals (v0.1.5)

- **Persistent Preferences:** Locale resets on page refresh (future: localStorage)
- **Multi-Level Undo:** Only one snapshot per row (future: undo stack)
- **Batch Operations:** Cannot fix multiple rows at once (future: "Apply to all similar")
- **AI Suggestions:** No ML-based auto-fix (future: confidence-based recommendations)
- **Email Fetching:** Still manual paste (future: Gmail OAuth)
- **Currency Conversion:** Only USD (per v0.1.4-b constraint)

---

## Rollout Plan

### Micro-Batches

**v0.1.5-a: Locale + Date Fix**
- Locale toggle component
- Date locale parsing (US/EU)
- Date Quick Fix UI
- Re-extract button
- Tests: 6 locale + 3 date fix
- Delta: 0009_rescue_a_locale.md

**v0.1.5-b: Amount/Autopay/Installment Fixes**
- Amount Quick Fix UI + validation
- Autopay Quick Fix UI
- Installment Quick Fix UI
- Undo mechanism
- Confidence recompute integration
- Tests: 9 quick-fix + 4 confidence + 2 undo + 4 integration
- Delta: 0010_rescue_b_fixes.md

### Deployment

1. **PR #7 (v0.1.5-a):** Locale + Date → merge → tag `v0.1.5-a-locale`
2. **PR #8 (v0.1.5-b):** Full Quick Fixes → merge → tag `v0.1.5-b` → production
3. **Smoke Test:** Paste ambiguous fixture → apply fixes → export CSV → POST `/api/plan`

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| EU locale breaks existing US users | High | Default to US; explicit user action required |
| Quick Fix UI clutters table | Med | Collapsible panel; only show for <0.6 rows |
| Performance degradation with many rows | Med | Debounce re-renders; optimize confidence calc |
| Accessibility gaps | Med | Early a11y testing; keyboard-only QA pass |
| Undo complexity (edge cases) | Low | Single-level only; clear snapshot on new fix |

---

## Success Metrics

**Quantitative:**
- ≥80% of low-confidence rows (<0.6) can be rescued to ≥0.6 via Quick Fixes
- Avg time to fix ambiguous row: <30s
- Zero new console errors in production
- Test coverage: 85+ tests passing

**Qualitative:**
- User can resolve date ambiguity without leaving paste flow
- CSV export reflects user intent (fixed values)
- No regressions in v0.1.4-b behavior

---

## Deliverables

1. **specs/v0.1.5-rescue/spec.md** (this document)
2. **specs/v0.1.5-rescue/plan.md** (implementation plan, 2 micro-batches)
3. **specs/v0.1.5-rescue/tasks.md** (≤10 atomic tasks)
4. **ops/deltas/0009_rescue_a_locale.md** (v0.1.5-a rollout)
5. **ops/deltas/0010_rescue_b_fixes.md** (v0.1.5-b rollout)
6. **README.md** (updated: Locale + Quick Fixes section)
7. **Code:**
   - `frontend/src/components/LocaleToggle.tsx`
   - `frontend/src/components/QuickFixPanel.tsx`
   - `frontend/src/lib/quick-fix-validator.ts`
   - Updated: `email-extractor.ts`, `EmailInboxPaste.tsx`, `EmailPreviewTable.tsx`
8. **Tests:**
   - `frontend/tests/unit/locale-parsing.test.ts`
   - `frontend/tests/unit/quick-fix-validator.test.ts`
   - `frontend/tests/integration/rescue-flow.test.tsx`
9. **Fixtures:**
   - `frontend/tests/fixtures/emails/ambiguous-date.txt`
   - `frontend/tests/fixtures/emails/amount-missing.txt`
   - `frontend/tests/fixtures/emails/autopay-ambiguous.txt`
   - `frontend/tests/fixtures/emails/installment-partial.txt`

---

## Appendix: Example User Flow

**Scenario:** User pastes Klarna email with ambiguous date "01/02/2025" and missing amount decimals.

1. **Paste:**
   ```
   User pastes email into textarea → clicks "Parse Emails"
   ```

2. **Extraction:**
   ```
   Default US locale → "01/02/2025" parsed as 2025-01-02
   Amount detected as "$25" (no decimals)
   Confidence: 0.55 (date confidence 0.8, amount confidence 0.3)
   ```

3. **Preview:**
   ```
   Row appears with 🟡 0.55 pill
   "⚙️ Low Confidence — Quick Fixes Available" button visible
   Issue list shows: "Amount missing 2 decimal places"
   ```

4. **Quick Fix:**
   ```
   User clicks "Quick Fixes" → panel expands
   Date section: "01/02/2025" — ⚪ US (Jan 2) ⚫ EU (Feb 1) Manual: [____]
   Amount section: [25.00] (user adds ".00")
   User clicks "Apply Fixes"
   ```

5. **Recompute:**
   ```
   Confidence recalculated:
   - Date: 0.8 (unchanged, but now explicit)
   - Amount: 0.9 (2 decimals confirmed)
   New confidence: 0.85
   Pill updates to 🟢 0.85
   Issue clears from list
   ```

6. **Export:**
   ```
   User clicks "Export CSV"
   CSV includes: 2025-01-02, 25.00, confidence: 0.85
   User clicks "Send to API"
   POST /api/plan receives corrected data → success
   ```

---

## References

- **v0.1.4-b spec:** [specs/001-inbox-paste-phase/spec.md](../001-inbox-paste-phase/spec.md)
- **Confidence architecture:** [frontend/src/lib/confidence.ts](../../frontend/src/lib/confidence.ts)
- **Provider detectors:** [frontend/src/lib/provider-detectors.ts](../../frontend/src/lib/provider-detectors.ts)
- **shadcn/ui components:** [ui.shadcn.com](https://ui.shadcn.com)

---

**End of Specification**
