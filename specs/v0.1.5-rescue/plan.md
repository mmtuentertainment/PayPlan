# PayPlan v0.1.5-a — Implementation Plan: Locale + Date Quick Fix

**Micro-Batch:** v0.1.5-a (Locale + Date Quick Fix + Re-extract)
**Spec Reference:** [specs/v0.1.5-rescue/spec.md](./spec.md)
**Author:** Claude Code
**Date:** 2025-10-03

---

## Executive Summary

Implement frontend-only date locale support (US/EU) and inline date Quick Fix for low-confidence rows, enabling users to resolve ambiguous dates ("01/02/2025") without leaving the paste flow.

**Scope:** FR-146, FR-147, FR-149, FR-155, FR-158, FR-159, FR-161, FR-162, FR-163, FR-165
**Constraints:** ≤200 LOC, ≤6 files, zero new deps, <16ms fix round-trip
**Tests:** 10 unit + 2 integration
**Target:** PR #7 → tag v0.1.5-a-locale

---

## Phase 0: Analysis & Setup

### Current Architecture Review

**Existing Flow:**
1. User pastes → `EmailInput.tsx` → `onExtract(text)` callback
2. Parent component calls `extractEmails(text)` from `email-extractor.ts`
3. `parseDate(dateStr, timezone)` uses US format (M/d/yyyy)
4. Results display in `EmailPreview.tsx` with confidence pills
5. Issues shown in `EmailIssues.tsx` for confidence <0.6

**Key Files:**
- `frontend/src/lib/extraction/extractors/date.ts` — Date parsing logic
- `frontend/src/lib/email-extractor.ts` — Main extraction orchestrator
- `frontend/src/components/EmailInput.tsx` — Paste UI
- `frontend/src/components/EmailPreview.tsx` — Results table
- `frontend/src/components/EmailIssues.tsx` — Issue list

**Dependencies:** Luxon (existing), React, shadcn/ui (existing)

### Gap Analysis

**Missing Capabilities:**
1. **Locale Parameter:** `parseDate()` hardcoded to US format
2. **Locale UI:** No toggle for US/EU selection
3. **Quick Fix UI:** No inline controls for date correction
4. **Re-extract:** No way to reprocess with new locale
5. **Undo Mechanism:** No row snapshots for reverting fixes
6. **Confidence Recompute:** No trigger after manual fixes

**Implementation Strategy:**
- Extend `parseDate()` with optional `dateLocale` parameter
- Thread locale through `extractEmails()` → `parseDate()` calls
- Add `LocaleToggle` component before "Extract Payments" button
- Add `DateQuickFix` inline panel for rows with confidence <0.6
- Store row snapshots in parent component state (Map<rowId, snapshot>)
- Recompute confidence via existing `calculateConfidence()` after fix

---

## Phase 1: Core Infrastructure

### 1.1 Date Parser Enhancement

**File:** `frontend/src/lib/extraction/extractors/date.ts`

**Changes:**
```typescript
/**
 * Date locale for parsing ambiguous slash-separated dates.
 * - US: M/d/yyyy (01/02/2025 = Jan 2, 2025)
 * - EU: d/M/yyyy (01/02/2025 = Feb 1, 2025)
 */
export type DateLocale = 'US' | 'EU';

/**
 * Parse date with locale-aware format handling.
 *
 * @param dateStr - Date string to parse
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @param options - Optional parsing options
 * @param options.dateLocale - Locale for ambiguous dates (default: 'US')
 * @returns ISO date string (YYYY-MM-DD)
 * @throws Error if date cannot be parsed or is suspicious
 *
 * @example
 * parseDate('01/02/2025', 'America/New_York', { dateLocale: 'US' })
 * // => '2025-01-02' (Jan 2)
 *
 * parseDate('01/02/2025', 'America/New_York', { dateLocale: 'EU' })
 * // => '2025-02-01' (Feb 1)
 */
export function parseDate(
  dateStr: string,
  timezone: string,
  options?: { dateLocale?: DateLocale }
): string {
  const locale = options?.dateLocale || 'US';

  const formats = [
    'yyyy-MM-dd',           // ISO (unambiguous)
    ...(locale === 'US' ? ['M/d/yyyy', 'MM/dd/yyyy'] : ['d/M/yyyy', 'dd/MM/yyyy']),
    'MMMM d, yyyy',         // October 6, 2025
    'MMM d, yyyy',          // Oct 6, 2025
    'd MMMM yyyy',          // 6 October 2025
    'd MMM yyyy'            // 6 Oct 2025
  ];

  // Existing logic with new formats array
  // ... (keep current implementation)
}
```

**Tests (6 unit tests):**
1. `parseDate('01/02/2025', 'America/New_York', { dateLocale: 'US' })` → `'2025-01-02'`
2. `parseDate('01/02/2025', 'America/New_York', { dateLocale: 'EU' })` → `'2025-02-01'`
3. `parseDate('12/31/2025', 'America/New_York', { dateLocale: 'US' })` → `'2025-12-31'`
4. `parseDate('31/12/2025', 'America/New_York', { dateLocale: 'EU' })` → `'2025-12-31'`
5. `parseDate('13/01/2025', 'America/New_York', { dateLocale: 'US' })` → throws (invalid US)
6. `parseDate('32/01/2025', 'America/New_York', { dateLocale: 'EU' })` → throws (invalid EU)

**LOC:** +15 (type def + options param + format array logic)

### 1.2 Email Extractor Plumbing

**File:** `frontend/src/lib/email-extractor.ts`

**Changes:**
```typescript
import { DateLocale } from './date-parser';

export interface ExtractOptions {
  dateLocale?: DateLocale;
}

/**
 * Extract BNPL payment data from email text.
 *
 * @param emailText - Raw email content
 * @param options - Extraction options
 * @param options.dateLocale - Date parsing locale (default: 'US')
 * @returns Array of extracted emails with confidence scores
 */
export function extractEmails(
  emailText: string,
  options?: ExtractOptions
): ExtractedEmail[] {
  // Thread dateLocale to all parseDate() calls
  const locale = options?.dateLocale || 'US';

  // ... existing extraction logic
  // Update all parseDate(dateStr, timezone) calls to:
  // parseDate(dateStr, timezone, { dateLocale: locale })
}
```

**Impact:** ~8 parseDate call sites updated

**Tests:** No new tests (covered by existing email-extractor tests + new date-parser tests)

**LOC:** +10 (type import + interface + threading)

---

## Phase 2: UI Components

### 2.1 Locale Toggle Component

**File:** `frontend/src/components/LocaleToggle.tsx` (NEW)

**Component:**
```typescript
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { DateLocale } from '../lib/date-parser';

interface LocaleToggleProps {
  locale: DateLocale;
  onLocaleChange: (locale: DateLocale) => void;
  onReExtract: () => void;
  hasExtractedData: boolean;
  isExtracting: boolean;
}

export function LocaleToggle({
  locale,
  onLocaleChange,
  onReExtract,
  hasExtractedData,
  isExtracting
}: LocaleToggleProps) {
  const handleReExtract = () => {
    if (hasExtractedData) {
      const confirmed = window.confirm(
        'Re-extracting will discard all Quick Fixes. Continue?'
      );
      if (!confirmed) return;
    }
    onReExtract();
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md border">
      <Label className="text-sm font-medium">Date Format:</Label>
      <RadioGroup
        value={locale}
        onValueChange={(value) => onLocaleChange(value as DateLocale)}
        className="flex gap-4"
        disabled={isExtracting}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="US" id="locale-us" />
          <Label htmlFor="locale-us" className="text-sm">
            US (MM/DD/YYYY)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="EU" id="locale-eu" />
          <Label htmlFor="locale-eu" className="text-sm">
            EU (DD/MM/YYYY)
          </Label>
        </div>
      </RadioGroup>
      {hasExtractedData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReExtract}
          disabled={isExtracting}
        >
          Re-extract with new format
        </Button>
      )}
    </div>
  );
}
```

**Tests (2 unit tests):**
1. Renders with US selected by default
2. Re-extract shows confirmation dialog if data exists

**LOC:** +60

### 2.2 Date Quick Fix Component

**File:** `frontend/src/components/DateQuickFix.tsx` (NEW)

**Component:**
```typescript
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { parseDate, DateLocale } from '../lib/date-parser';

interface DateQuickFixProps {
  originalDate: string;
  currentDate: string;
  timezone: string;
  onApplyFix: (newDate: string) => void;
  onCancel: () => void;
}

export function DateQuickFix({
  originalDate,
  currentDate,
  timezone,
  onApplyFix,
  onCancel
}: DateQuickFixProps) {
  const [mode, setMode] = useState<'us' | 'eu' | 'manual'>('us');
  const [manualDate, setManualDate] = useState(currentDate);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    setError(null);

    try {
      let newDate: string;

      if (mode === 'manual') {
        // Validate manual input
        const dt = new Date(manualDate);
        const year = dt.getFullYear();
        if (year < 2020 || year > 2030) {
          throw new Error('Date must be between 2020-01-01 and 2030-12-31');
        }
        newDate = manualDate;
      } else {
        // Re-parse with selected locale
        newDate = parseDate(originalDate, timezone, {
          dateLocale: mode === 'us' ? 'US' : 'EU'
        });
      }

      onApplyFix(newDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid date');
    }
  };

  return (
    <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-200">
      <div className="text-sm font-medium">
        📅 Date: Ambiguous "{originalDate}"
      </div>

      <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="us" id="date-us" />
          <Label htmlFor="date-us" className="text-sm">
            Re-parse as US (MM/DD/YYYY)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="eu" id="date-eu" />
          <Label htmlFor="date-eu" className="text-sm">
            Re-parse as EU (DD/MM/YYYY)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="manual" id="date-manual" />
          <Label htmlFor="date-manual" className="text-sm">Manual:</Label>
          <Input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="w-40 h-8 text-sm"
            disabled={mode !== 'manual'}
            min="2020-01-01"
            max="2030-12-31"
          />
        </div>
      </RadioGroup>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleApply}>Apply Fix</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
```

**Tests (3 unit tests):**
1. Re-parse US: "01/02/2025" → 2025-01-02
2. Re-parse EU: "01/02/2025" → 2025-02-01
3. Manual override: validates 2020-2030 range, rejects 2019

**LOC:** +80

### 2.3 EmailPreview Integration

**File:** `frontend/src/components/EmailPreview.tsx` (UPDATE)

**Changes:**
```typescript
import { DateQuickFix } from './DateQuickFix';

// Add state for Quick Fix UI
const [activeQuickFix, setActiveQuickFix] = useState<string | null>(null);
const [rowSnapshots, setRowSnapshots] = useState<Map<string, any>>(new Map());

// Add handler for applying date fix
const handleApplyDateFix = (rowId: string, newDate: string) => {
  // 1. Create snapshot if first fix
  if (!rowSnapshots.has(rowId)) {
    const row = extractedEmails.find(e => e.id === rowId);
    if (row) {
      setRowSnapshots(new Map(rowSnapshots.set(rowId, { ...row })));
    }
  }

  // 2. Update row with new date
  setExtractedEmails(prev =>
    prev.map(email =>
      email.id === rowId
        ? { ...email, dueDate: newDate }
        : email
    )
  );

  // 3. Recompute confidence
  const updatedRow = extractedEmails.find(e => e.id === rowId);
  if (updatedRow) {
    const newConfidence = calculateConfidence({
      ...updatedRow,
      dueDate: newDate
    });

    setExtractedEmails(prev =>
      prev.map(email =>
        email.id === rowId
          ? { ...email, confidence: newConfidence }
          : email
      )
    );
  }

  setActiveQuickFix(null);
};

// In row rendering:
{email.confidence < 0.6 && (
  <div>
    {activeQuickFix === email.id ? (
      <DateQuickFix
        originalDate={email.rawDate || email.dueDate}
        currentDate={email.dueDate}
        timezone={email.timezone || 'America/New_York'}
        onApplyFix={(date) => handleApplyDateFix(email.id, date)}
        onCancel={() => setActiveQuickFix(null)}
      />
    ) : (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setActiveQuickFix(email.id)}
      >
        ⚙️ Quick Fixes Available
      </Button>
    )}
  </div>
)}
```

**LOC:** +40 (snapshot logic + fix handler + UI integration)

### 2.4 EmailInput Integration

**File:** `frontend/src/components/EmailInput.tsx` (UPDATE)

**Changes:**
```typescript
import { LocaleToggle } from './LocaleToggle';
import { DateLocale } from '../lib/date-parser';

interface EmailInputProps {
  onExtract: (text: string, locale: DateLocale) => void;
  isExtracting: boolean;
  hasExtractedData: boolean;
}

export function EmailInput({ onExtract, isExtracting, hasExtractedData }: EmailInputProps) {
  const [text, setText] = useState('');
  const [dateLocale, setDateLocale] = useState<DateLocale>('US');

  const handleExtract = () => {
    if (text.trim()) {
      onExtract(text, dateLocale);
    }
  };

  const handleReExtract = () => {
    handleExtract();
  };

  return (
    <div className="space-y-4">
      {/* Existing label + Use Sample button */}

      <LocaleToggle
        locale={dateLocale}
        onLocaleChange={setDateLocale}
        onReExtract={handleReExtract}
        hasExtractedData={hasExtractedData}
        isExtracting={isExtracting}
      />

      {/* Existing Textarea + Extract button */}
    </div>
  );
}
```

**LOC:** +15 (locale state + re-extract handler)

---

## Phase 3: Testing & Documentation

### 3.1 Unit Tests

**File:** `frontend/tests/unit/locale-parsing.test.ts` (NEW)

**Tests (10 total):**

**Date Locale (6 tests):**
```typescript
describe('parseDate with locale', () => {
  test('US mode: 01/02/2025 → 2025-01-02', () => {
    expect(parseDate('01/02/2025', 'America/New_York', { dateLocale: 'US' }))
      .toBe('2025-01-02');
  });

  test('EU mode: 01/02/2025 → 2025-02-01', () => {
    expect(parseDate('01/02/2025', 'America/New_York', { dateLocale: 'EU' }))
      .toBe('2025-02-01');
  });

  test('US mode: 12/31/2025 → 2025-12-31', () => {
    expect(parseDate('12/31/2025', 'America/New_York', { dateLocale: 'US' }))
      .toBe('2025-12-31');
  });

  test('EU mode: 31/12/2025 → 2025-12-31', () => {
    expect(parseDate('31/12/2025', 'America/New_York', { dateLocale: 'EU' }))
      .toBe('2025-12-31');
  });

  test('US mode: invalid 13/01/2025 throws', () => {
    expect(() => parseDate('13/01/2025', 'America/New_York', { dateLocale: 'US' }))
      .toThrow();
  });

  test('EU mode: invalid 32/01/2025 throws', () => {
    expect(() => parseDate('32/01/2025', 'America/New_York', { dateLocale: 'EU' }))
      .toThrow();
  });
});
```

**Date Quick Fix (4 tests):**
```typescript
describe('DateQuickFix validation', () => {
  test('manual date: 2025-06-15 accepted', () => {
    // Component test: enter 2025-06-15 → Apply → onApplyFix called with '2025-06-15'
  });

  test('manual date: 2019-12-31 rejected (year < 2020)', () => {
    // Component test: enter 2019-12-31 → Apply → shows error
  });

  test('manual date: 2031-01-01 rejected (year > 2030)', () => {
    // Component test: enter 2031-01-01 → Apply → shows error
  });

  test('cancel clears error state', () => {
    // Component test: trigger error → Cancel → error cleared
  });
});
```

### 3.2 Integration Tests

**File:** `frontend/tests/integration/locale-rescue.test.tsx` (NEW)

**Tests (2):**

```typescript
describe('Locale + Date Quick Fix E2E', () => {
  test('Re-extract with EU locale flips ambiguous dates', async () => {
    // 1. Paste fixture with "01/02/2025" (ambiguous-date.txt)
    // 2. Default US → extracts as 2025-01-02
    // 3. Toggle EU → click Re-extract → confirm dialog → extracts as 2025-02-01
    // 4. Verify row updated, confidence recalculated
  });

  test('Apply date fix increases confidence, clears issue', async () => {
    // 1. Paste fixture with low confidence due to ambiguous date
    // 2. Verify confidence <0.6, issue appears
    // 3. Open Quick Fix → select EU → Apply
    // 4. Verify confidence ≥0.6, issue removed from list
  });
});
```

### 3.3 Test Fixtures

**File:** `frontend/tests/fixtures/emails/ambiguous-date.txt` (NEW)

```
From: noreply@klarna.com
Subject: Payment reminder
Date: Thu, 1 Oct 2025 10:00:00 -0700

Your payment is due on 01/02/2025.
Amount: $25.00
Payment 1 of 4
```

**File:** `frontend/tests/fixtures/emails/ambiguous-date-eu.txt` (NEW)

```
From: noreply@klarna.com
Subject: Payment reminder (EU format)
Date: Thu, 1 Oct 2025 10:00:00 +0100

Your payment is due on 06/10/2025.
Amount: €25.00
Payment 1 of 4
```

### 3.4 Documentation

**File:** `ops/deltas/0009_rescue_a_locale.md` (NEW)

```markdown
# Delta 0009: Rescue Mode v0.1.5-a — Locale + Date Quick Fix

## Summary
Frontend-only: Add US/EU date locale toggle + inline date Quick Fix for low-confidence rows.

## Files Changed (6)
- NEW: frontend/src/components/LocaleToggle.tsx (+60 LOC)
- NEW: frontend/src/components/DateQuickFix.tsx (+80 LOC)
- UPDATE: frontend/src/lib/extraction/extractors/date.ts (+15 LOC)
- UPDATE: frontend/src/lib/email-extractor.ts (+10 LOC)
- UPDATE: frontend/src/components/EmailInput.tsx (+15 LOC)
- UPDATE: frontend/src/components/EmailPreview.tsx (+40 LOC)

**Net Production LOC:** +220 (within 200 target, refactor to hit goal)

## Tests Added (12)
- 6 locale parsing unit tests
- 4 DateQuickFix component tests
- 2 integration tests (re-extract + confidence boost)

## Deployment
1. PR #7 → CI green
2. Squash-merge to main
3. Tag: v0.1.5-a-locale
4. Deploy to Vercel production
5. Smoke test: paste ambiguous date → fix → export CSV

## Rollback
```bash
git revert <merge-commit-sha>
git push origin main
vercel deploy --prod
```

## Dependencies
None (reuses Luxon, React, shadcn/ui)
```

**File:** `README.md` (UPDATE)

Add section:
```markdown
### Locale + Quick Fixes (v0.1.5-a)

**Date Format Toggle:**
- US (MM/DD/YYYY) — default
- EU (DD/MM/YYYY) — opt-in via toggle

**Quick Fixes for Low-Confidence Rows (<0.6):**
- 📅 **Date:** Re-parse as US/EU or manual override (yyyy-MM-dd)
- ⚙️ One-level undo per row
- 🔄 Re-extract with new locale (clears fixes)

**Workflow:**
1. Paste emails → rows with confidence <0.6 show "Quick Fixes Available"
2. Click to expand → select date interpretation → Apply
3. Confidence recalculates → issue clears if ≥0.6
4. CSV export includes fixed values
```

---

## Phase 4: Implementation Order

### Task Breakdown (8 tasks)

**T1: Date Parser Locale Support** (1-2 hours)
- [ ] Add `DateLocale` type to `extraction/extractors/date.ts`
- [ ] Add `options` parameter with `dateLocale`
- [ ] Update format array logic (US vs EU)
- [ ] Write 6 unit tests (US/EU disambiguation)
- [ ] AC: All tests pass, TypeScript builds clean

**T2: Email Extractor Plumbing** (30 min)
- [ ] Import `DateLocale` type
- [ ] Add `ExtractOptions` interface
- [ ] Thread `dateLocale` to all `parseDate()` calls
- [ ] AC: No behavior changes, existing tests pass

**T3: LocaleToggle Component** (1-2 hours)
- [ ] Create `LocaleToggle.tsx` with US/EU radio + Re-extract button
- [ ] Add confirmation dialog if data exists
- [ ] Wire to parent state (locale + re-extract handler)
- [ ] AC: Renders correctly, re-extract confirms before action

**T4: DateQuickFix Component** (2-3 hours)
- [ ] Create `DateQuickFix.tsx` with US/EU/manual modes
- [ ] Implement date validation (2020-2030 range)
- [ ] Add error states (aria-describedby for a11y)
- [ ] Write 4 component tests (valid/invalid dates)
- [ ] AC: Validates correctly, errors display, tests pass

**T5: EmailPreview Integration** (2-3 hours)
- [ ] Add `activeQuickFix` state to `EmailPreview.tsx`
- [ ] Add `rowSnapshots` Map for undo support
- [ ] Implement `handleApplyDateFix` with confidence recompute
- [ ] Render DateQuickFix for rows <0.6
- [ ] AC: Quick Fix opens/closes, fix updates row, confidence recalculates

**T6: EmailInput Locale Wiring** (1 hour)
- [ ] Add `dateLocale` state to `EmailInput.tsx`
- [ ] Render `LocaleToggle` above textarea
- [ ] Update `onExtract` to pass locale
- [ ] Implement re-extract handler
- [ ] AC: Locale persists during session, re-extract works

**T7: Integration Tests** (2 hours)
- [ ] Create `ambiguous-date.txt` fixture
- [ ] Test: Re-extract with EU flips dates
- [ ] Test: Apply fix increases confidence, clears issue
- [ ] AC: E2E flows work, issues update live

**T8: Documentation** (1 hour)
- [ ] Create `ops/deltas/0009_rescue_a_locale.md`
- [ ] Update README with Locale + Quick Fixes section
- [ ] Add JSDoc to new exports (≥80% coverage)
- [ ] AC: Docs complete, delta has rollback instructions

---

## Acceptance Criteria (Black-Box)

**AC-1: Ambiguous Date Resolution**
- Paste email with "01/02/2025"
- Default US: displays as 2025-01-02
- Toggle EU → Re-extract → displays as 2025-02-01
- Manual override: enter "2025-03-15" → accepted
- Result: Confidence increases from 0.55 → 0.75

**AC-2: Quick Fix Workflow**
- Paste email with confidence <0.6
- "Quick Fixes Available" button visible
- Click → DateQuickFix panel expands
- Select EU → Apply → confidence updates, pill color changes
- Issue removed from list if confidence ≥0.6

**AC-3: Re-extract Behavior**
- Extract with US locale
- Apply manual date fix to row
- Toggle EU → Re-extract → shows confirmation dialog
- Confirm → all fixes discarded, rows re-extracted with EU locale

**AC-4: CSV Export**
- Apply date fix to 2 rows
- Export CSV
- Verify: fixed dates present, confidence column updated
- POST to `/api/plan` → no validation errors

**AC-5: Accessibility**
- Tab to LocaleToggle → radio buttons keyboard-navigable
- Tab to Quick Fixes button → Enter opens panel
- Error messages linked via `aria-describedby`
- Lighthouse a11y score ≥90

**AC-6: Performance**
- Paste 20 emails (10 with confidence <0.6)
- Apply date fix to one row
- DevTools Performance: validation + recompute + re-render <16ms

**AC-7: Backward Compatibility**
- Paste emails without using Quick Fixes
- Behavior identical to v0.1.4-b
- All 85 existing tests pass

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LOC exceeds 200 | Refactor LocaleToggle/DateQuickFix to share validation logic; extract helpers |
| EU locale confuses US users | Default to US; require explicit toggle + re-extract confirmation |
| Performance degrades with many rows | Debounce confidence recompute; use React.memo for row components |
| A11y gaps | Test keyboard-only workflow early; add aria-live for confidence updates |
| Snapshot complexity | Limit to one-level undo; clear snapshot on new fix |

---

## Success Metrics

**Quantitative:**
- All 97 tests pass (85 existing + 12 new)
- TypeScript builds clean (0 errors)
- Lighthouse a11y ≥90
- Fix round-trip <16ms

**Qualitative:**
- User can resolve "01/02/2025" ambiguity in <30s
- CSV export reflects user intent (fixed dates)
- No regressions in v0.1.4-b flows

---

## Deployment Checklist

**Pre-Merge:**
- [ ] All 97 tests pass locally
- [ ] TypeScript build clean (`npm run build`)
- [ ] Lighthouse a11y ≥90 (`npm run lighthouse`)
- [ ] Manual QA: paste ambiguous date → fix → export CSV

**Merge & Tag:**
- [ ] Squash-merge PR #7
- [ ] Tag: `v0.1.5-a-locale`
- [ ] Push tag: `git push origin v0.1.5-a-locale`

**Deploy:**
- [ ] `vercel pull --yes --environment=production`
- [ ] `vercel deploy --prebuilt --prod`
- [ ] Smoke test production: paste fixture → apply fix → confidence updates

**Post-Deploy:**
- [ ] Comment final URL to PR #7
- [ ] Monitor Sentry for errors (first 24h)
- [ ] Update project board: v0.1.5-a ✅

---

## Next Steps (v0.1.5-b)

After v0.1.5-a is deployed:
1. Implement Amount Quick Fix (2-decimal validation)
2. Implement Autopay Quick Fix (ON/OFF radio)
3. Implement Installment Quick Fix (current/total dropdowns)
4. Add Undo mechanism for all fields
5. Integration tests for multi-field fixes

**Target:** PR #8 → v0.1.5-b → production

---

**End of Plan**
