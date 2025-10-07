# PayPlan v0.1.5-a — Tasks: Locale + Date Quick Fix

**Micro-Batch:** v0.1.5-a
**Plan Reference:** [specs/v0.1.5-rescue/plan.md](./plan.md)
**Target:** PR #7 → v0.1.5-a-locale

---

## Task Summary

| ID | Task | Est. | Priority | Dependencies |
|----|------|------|----------|--------------|
| T1 | Date Parser Locale Support | 1-2h | P0 | None |
| T2 | Email Extractor Plumbing | 30m | P0 | T1 |
| T3 | LocaleToggle Component | 1-2h | P1 | T1 |
| T4 | DateQuickFix Component | 2-3h | P1 | T1 |
| T5 | EmailPreview Integration | 2-3h | P1 | T4 |
| T6 | EmailInput Locale Wiring | 1h | P1 | T3, T5 |
| T7 | Integration Tests | 2h | P2 | T2, T5, T6 |
| T8 | Documentation | 1h | P2 | All |

**Total Estimate:** 10-14 hours

---

## T1: Date Parser Locale Support

**Goal:** Extend `parseDate()` to accept US/EU locale option for disambiguating slash-separated dates.

### Implementation

**File:** `frontend/src/lib/extraction/extractors/date.ts`

1. Add `DateLocale` type:
   ```typescript
   export type DateLocale = 'US' | 'EU';
   ```

2. Update `parseDate()` signature:
   ```typescript
   export function parseDate(
     dateStr: string,
     timezone: string,
     options?: { dateLocale?: DateLocale }
   ): string
   ```

3. Update format array logic:
   ```typescript
   const locale = options?.dateLocale || 'US';
   const formats = [
     'yyyy-MM-dd',
     ...(locale === 'US' ? ['M/d/yyyy', 'MM/dd/yyyy'] : ['d/M/yyyy', 'dd/MM/yyyy']),
     'MMMM d, yyyy',
     'MMM d, yyyy',
     'd MMMM yyyy',
     'd MMM yyyy'
   ];
   ```

4. Add JSDoc with examples showing US vs EU behavior

### Tests

**File:** `frontend/tests/unit/locale-parsing.test.ts` (NEW)

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
      .toThrow('Unable to parse date');
  });

  test('EU mode: invalid 32/01/2025 throws', () => {
    expect(() => parseDate('32/01/2025', 'America/New_York', { dateLocale: 'EU' }))
      .toThrow('Unable to parse date');
  });
});
```

### Acceptance Criteria

- [ ] `DateLocale` type exported from `extraction/extractors/date.ts`
- [ ] `parseDate()` accepts optional `{ dateLocale: 'US' | 'EU' }` parameter
- [ ] US mode: "01/02/2025" → 2025-01-02
- [ ] EU mode: "01/02/2025" → 2025-02-01
- [ ] Invalid dates throw error (e.g., "13/01/2025" in US mode)
- [ ] All 6 unit tests pass
- [ ] JSDoc includes `@param options.dateLocale` with examples
- [ ] TypeScript builds clean

### Definition of Done

- Code implemented and reviewed
- 6 unit tests passing
- JSDoc coverage ≥80%
- No TypeScript errors
- Git commit: "feat(date-parser): Add US/EU locale support for ambiguous dates"

---

## T2: Email Extractor Plumbing

**Goal:** Thread `dateLocale` option from `extractEmails()` to all `parseDate()` calls.

### Implementation

**File:** `frontend/src/lib/email-extractor.ts`

1. Import `DateLocale` type:
   ```typescript
   import { DateLocale } from './date-parser';
   ```

2. Add `ExtractOptions` interface:
   ```typescript
   export interface ExtractOptions {
     dateLocale?: DateLocale;
   }
   ```

3. Update `extractEmails()` signature:
   ```typescript
   export function extractEmails(
     emailText: string,
     options?: ExtractOptions
   ): ExtractedEmail[]
   ```

4. Thread locale to all `parseDate()` calls:
   ```typescript
   const locale = options?.dateLocale || 'US';
   // Update ~8 parseDate call sites:
   parseDate(dateStr, timezone, { dateLocale: locale })
   ```

### Tests

No new tests required (covered by T1 tests + existing email-extractor tests)

Verify:
- Existing tests still pass
- No behavior changes when `dateLocale` not provided (defaults to US)

### Acceptance Criteria

- [ ] `ExtractOptions` interface exported
- [ ] `extractEmails()` accepts optional `options` parameter
- [ ] All `parseDate()` calls updated to pass `dateLocale`
- [ ] Default behavior unchanged (US locale if not specified)
- [ ] All existing email-extractor tests pass
- [ ] TypeScript builds clean

### Definition of Done

- Code implemented and reviewed
- All existing tests pass (no regressions)
- JSDoc updated on `extractEmails()`
- No TypeScript errors
- Git commit: "feat(email-extractor): Thread dateLocale to parseDate calls"

---

## T3: LocaleToggle Component

**Goal:** Create UI component for US/EU locale selection with re-extract button.

### Implementation

**File:** `frontend/src/components/LocaleToggle.tsx` (NEW)

**Component Structure:**
- RadioGroup: US (default) | EU
- Re-extract button (only shown if `hasExtractedData`)
- Confirmation dialog if re-extracting with existing data

**Props:**
```typescript
interface LocaleToggleProps {
  locale: DateLocale;
  onLocaleChange: (locale: DateLocale) => void;
  onReExtract: () => void;
  hasExtractedData: boolean;
  isExtracting: boolean;
}
```

**Confirmation Dialog:**
```typescript
const handleReExtract = () => {
  if (hasExtractedData) {
    const confirmed = window.confirm(
      'Re-extracting will discard all Quick Fixes. Continue?'
    );
    if (!confirmed) return;
  }
  onReExtract();
};
```

### Tests

**File:** `frontend/tests/unit/locale-toggle.test.tsx` (NEW)

```typescript
describe('LocaleToggle', () => {
  test('renders with US selected by default', () => {
    render(<LocaleToggle locale="US" ... />);
    expect(screen.getByLabelText('US (MM/DD/YYYY)')).toBeChecked();
  });

  test('calls onLocaleChange when EU selected', () => {
    const onChange = vi.fn();
    render(<LocaleToggle locale="US" onLocaleChange={onChange} ... />);
    fireEvent.click(screen.getByLabelText('EU (DD/MM/YYYY)'));
    expect(onChange).toHaveBeenCalledWith('EU');
  });

  test('shows re-extract button only if hasExtractedData', () => {
    const { rerender } = render(<LocaleToggle hasExtractedData={false} ... />);
    expect(screen.queryByText('Re-extract with new format')).not.toBeInTheDocument();

    rerender(<LocaleToggle hasExtractedData={true} ... />);
    expect(screen.getByText('Re-extract with new format')).toBeInTheDocument();
  });

  test('shows confirmation dialog before re-extract', () => {
    window.confirm = vi.fn(() => false);
    const onReExtract = vi.fn();
    render(<LocaleToggle hasExtractedData={true} onReExtract={onReExtract} ... />);

    fireEvent.click(screen.getByText('Re-extract with new format'));
    expect(window.confirm).toHaveBeenCalled();
    expect(onReExtract).not.toHaveBeenCalled();
  });
});
```

### Acceptance Criteria

- [ ] Component renders US/EU radio buttons
- [ ] Default selection: US
- [ ] `onLocaleChange` called when user changes selection
- [ ] Re-extract button only visible if `hasExtractedData={true}`
- [ ] Confirmation dialog shown before re-extract
- [ ] Disabled state respected when `isExtracting={true}`
- [ ] All 4 component tests pass
- [ ] Keyboard accessible (Tab, Space, Enter)

### Definition of Done

- Component implemented with shadcn/ui components
- 4 unit tests passing
- Accessible (keyboard navigation works)
- Git commit: "feat(locale): Add LocaleToggle component with re-extract"

---

## T4: DateQuickFix Component

**Goal:** Create inline UI for resolving ambiguous dates (US/EU re-parse + manual override).

### Implementation

**File:** `frontend/src/components/DateQuickFix.tsx` (NEW)

**Component Structure:**
- RadioGroup: Re-parse US | Re-parse EU | Manual
- Input (type="date") for manual override
- Validation: 2020-01-01 to 2030-12-31
- Error alert for invalid dates
- Apply/Cancel buttons

**Props:**
```typescript
interface DateQuickFixProps {
  originalDate: string;      // Raw date from email (e.g., "01/02/2025")
  currentDate: string;        // Current parsed ISO date
  timezone: string;
  onApplyFix: (newDate: string) => void;
  onCancel: () => void;
}
```

**Validation Logic:**
```typescript
const handleApply = () => {
  setError(null);

  try {
    let newDate: string;

    if (mode === 'manual') {
      const dt = new Date(manualDate);
      const year = dt.getFullYear();
      if (year < 2020 || year > 2030) {
        throw new Error('Date must be between 2020-01-01 and 2030-12-31');
      }
      newDate = manualDate;
    } else {
      newDate = parseDate(originalDate, timezone, {
        dateLocale: mode === 'us' ? 'US' : 'EU'
      });
    }

    onApplyFix(newDate);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Invalid date');
  }
};
```

### Tests

**File:** `frontend/tests/unit/date-quick-fix.test.tsx` (NEW)

```typescript
describe('DateQuickFix', () => {
  test('re-parse US: 01/02/2025 → 2025-01-02', async () => {
    const onApply = vi.fn();
    render(
      <DateQuickFix
        originalDate="01/02/2025"
        currentDate="2025-01-02"
        timezone="America/New_York"
        onApplyFix={onApply}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Re-parse as US (MM/DD/YYYY)'));
    fireEvent.click(screen.getByText('Apply Fix'));
    expect(onApply).toHaveBeenCalledWith('2025-01-02');
  });

  test('re-parse EU: 01/02/2025 → 2025-02-01', async () => {
    const onApply = vi.fn();
    render(<DateQuickFix originalDate="01/02/2025" ... />);

    fireEvent.click(screen.getByLabelText('Re-parse as EU (DD/MM/YYYY)'));
    fireEvent.click(screen.getByText('Apply Fix'));
    expect(onApply).toHaveBeenCalledWith('2025-02-01');
  });

  test('manual override: 2025-06-15 accepted', async () => {
    const onApply = vi.fn();
    render(<DateQuickFix ... />);

    fireEvent.click(screen.getByLabelText('Manual:'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2025-06-15' } });
    fireEvent.click(screen.getByText('Apply Fix'));
    expect(onApply).toHaveBeenCalledWith('2025-06-15');
  });

  test('manual override: 2019-12-31 rejected (year < 2020)', async () => {
    render(<DateQuickFix ... />);

    fireEvent.click(screen.getByLabelText('Manual:'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2019-12-31' } });
    fireEvent.click(screen.getByText('Apply Fix'));

    expect(screen.getByText(/Date must be between 2020-01-01 and 2030-12-31/)).toBeInTheDocument();
  });

  test('manual override: 2031-01-01 rejected (year > 2030)', async () => {
    render(<DateQuickFix ... />);

    fireEvent.click(screen.getByLabelText('Manual:'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2031-01-01' } });
    fireEvent.click(screen.getByText('Apply Fix'));

    expect(screen.getByText(/Date must be between 2020-01-01 and 2030-12-31/)).toBeInTheDocument();
  });

  test('cancel clears error state', async () => {
    const onCancel = vi.fn();
    render(<DateQuickFix onCancel={onCancel} ... />);

    // Trigger error
    fireEvent.click(screen.getByLabelText('Manual:'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2019-01-01' } });
    fireEvent.click(screen.getByText('Apply Fix'));
    expect(screen.getByText(/Date must be between/)).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

### Acceptance Criteria

- [ ] Component renders 3 modes: US re-parse, EU re-parse, manual
- [ ] Manual mode: date input with min="2020-01-01" max="2030-12-31"
- [ ] Validation: rejects dates outside 2020-2030 range
- [ ] Error messages displayed in Alert component
- [ ] Error linked to input via `aria-describedby` (a11y)
- [ ] Apply button triggers `onApplyFix(newDate)`
- [ ] Cancel button triggers `onCancel()` and clears errors
- [ ] All 6 component tests pass
- [ ] Keyboard accessible

### Definition of Done

- Component implemented with shadcn/ui (RadioGroup, Input, Alert)
- 6 unit tests passing
- Accessible (aria-describedby, keyboard navigation)
- Git commit: "feat(quick-fix): Add DateQuickFix component with validation"

---

## T5: EmailPreview Integration

**Goal:** Integrate DateQuickFix into EmailPreview, add snapshot/undo logic, recompute confidence.

### Implementation

**File:** `frontend/src/components/EmailPreview.tsx` (UPDATE)

**State:**
```typescript
const [activeQuickFix, setActiveQuickFix] = useState<string | null>(null);
const [rowSnapshots, setRowSnapshots] = useState<Map<string, ExtractedEmail>>(new Map());
```

**Fix Handler:**
```typescript
const handleApplyDateFix = (rowId: string, newDate: string) => {
  // 1. Create snapshot if first fix
  if (!rowSnapshots.has(rowId)) {
    const row = extractedEmails.find(e => e.id === rowId);
    if (row) {
      setRowSnapshots(prev => new Map(prev.set(rowId, { ...row })));
    }
  }

  // 2. Update row with new date
  const updatedRow = extractedEmails.find(e => e.id === rowId);
  if (!updatedRow) return;

  const rowWithNewDate = { ...updatedRow, dueDate: newDate };

  // 3. Recompute confidence
  const newConfidence = calculateConfidence(rowWithNewDate);

  // 4. Update state
  setExtractedEmails(prev =>
    prev.map(email =>
      email.id === rowId
        ? { ...rowWithNewDate, confidence: newConfidence }
        : email
    )
  );

  setActiveQuickFix(null);
};

const handleUndoFix = (rowId: string) => {
  const snapshot = rowSnapshots.get(rowId);
  if (!snapshot) return;

  setExtractedEmails(prev =>
    prev.map(email => (email.id === rowId ? snapshot : email))
  );

  setRowSnapshots(prev => {
    const updated = new Map(prev);
    updated.delete(rowId);
    return updated;
  });
};
```

**Rendering:**
```typescript
{email.confidence < 0.6 && (
  <div className="mt-2">
    {activeQuickFix === email.id ? (
      <DateQuickFix
        originalDate={email.rawDate || email.dueDate}
        currentDate={email.dueDate}
        timezone={email.timezone || 'America/New_York'}
        onApplyFix={(date) => handleApplyDateFix(email.id, date)}
        onCancel={() => setActiveQuickFix(null)}
      />
    ) : rowSnapshots.has(email.id) ? (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600">
          ✅ Fix applied — confidence updated to {email.confidence.toFixed(2)}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUndoFix(email.id)}
        >
          Undo
        </Button>
      </div>
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

### Tests

Tests covered in T7 (integration tests)

### Acceptance Criteria

- [ ] Rows with confidence <0.6 show "Quick Fixes Available" button
- [ ] Clicking button expands DateQuickFix panel
- [ ] Applying fix creates snapshot (if first fix on row)
- [ ] Applying fix updates `dueDate` and recomputes `confidence`
- [ ] Confidence pill updates color based on new score
- [ ] "Undo" button appears after fix is applied
- [ ] Undo restores original row state from snapshot
- [ ] Snapshot deleted after undo (one-level only)
- [ ] EmailIssues list updates live (rows ≥0.6 removed)

### Definition of Done

- EmailPreview updated with Quick Fix UI
- Snapshot/undo logic implemented
- Confidence recompute integrated
- Manual QA: paste ambiguous date → fix → confidence updates → issue clears
- Git commit: "feat(preview): Integrate DateQuickFix with snapshot/undo"

---

## T6: EmailInput Locale Wiring

**Goal:** Wire LocaleToggle into EmailInput, handle re-extract flow.

### Implementation

**File:** `frontend/src/components/EmailInput.tsx` (UPDATE)

**State:**
```typescript
const [dateLocale, setDateLocale] = useState<DateLocale>('US');
```

**Props Update:**
```typescript
interface EmailInputProps {
  onExtract: (text: string, locale: DateLocale) => void;
  isExtracting: boolean;
  hasExtractedData: boolean;
}
```

**Handlers:**
```typescript
const handleExtract = () => {
  if (text.trim()) {
    onExtract(text, dateLocale);
  }
};

const handleReExtract = () => {
  handleExtract(); // Uses current dateLocale state
};
```

**Rendering:**
```typescript
<div className="space-y-4">
  {/* Label + Use Sample button */}

  <LocaleToggle
    locale={dateLocale}
    onLocaleChange={setDateLocale}
    onReExtract={handleReExtract}
    hasExtractedData={hasExtractedData}
    isExtracting={isExtracting}
  />

  {/* Textarea */}
  {/* Extract button */}
</div>
```

**Parent Component (e.g., Home/Index):**
```typescript
const [hasExtractedData, setHasExtractedData] = useState(false);

const handleExtract = (text: string, locale: DateLocale) => {
  setIsExtracting(true);
  const emails = extractEmails(text, { dateLocale: locale });
  setExtractedEmails(emails);
  setHasExtractedData(emails.length > 0);
  setIsExtracting(false);
};
```

### Tests

Tests covered in T7 (integration tests)

### Acceptance Criteria

- [ ] LocaleToggle renders above textarea
- [ ] Default locale: US
- [ ] Changing locale persists until page refresh
- [ ] Re-extract button triggers extraction with new locale
- [ ] Re-extract clears all row snapshots in EmailPreview
- [ ] Confirmation dialog shown if re-extracting with existing fixes

### Definition of Done

- EmailInput wired to LocaleToggle
- Parent component handles locale state
- Re-extract flow implemented
- Manual QA: toggle locale → re-extract → dates update
- Git commit: "feat(input): Wire LocaleToggle to extraction flow"

---

## T7: Integration Tests

**Goal:** E2E tests for re-extract flow and confidence rescue workflow.

### Implementation

**File:** `frontend/tests/integration/locale-rescue.test.tsx` (NEW)

**Test 1: Re-extract with EU Locale**
```typescript
test('re-extract with EU locale flips ambiguous dates', async () => {
  const fixture = `
From: noreply@klarna.com
Subject: Payment reminder
Date: Thu, 1 Oct 2025 10:00:00 -0700

Your payment is due on 01/02/2025.
Amount: $25.00
Payment 1 of 4
  `;

  // 1. Paste fixture (default US locale)
  render(<App />);
  fireEvent.change(screen.getByLabelText(/Paste BNPL/), { target: { value: fixture } });
  fireEvent.click(screen.getByText('Extract Payments'));

  // 2. Verify US interpretation: 2025-01-02
  await waitFor(() => {
    expect(screen.getByText(/2025-01-02/)).toBeInTheDocument();
  });

  // 3. Toggle to EU
  fireEvent.click(screen.getByLabelText('EU (DD/MM/YYYY)'));

  // 4. Re-extract
  fireEvent.click(screen.getByText('Re-extract with new format'));

  // 5. Verify EU interpretation: 2025-02-01
  await waitFor(() => {
    expect(screen.getByText(/2025-02-01/)).toBeInTheDocument();
  });
});
```

**Test 2: Quick Fix Increases Confidence**
```typescript
test('apply date fix increases confidence and clears issue', async () => {
  const fixture = `
From: noreply@klarna.com
Your payment is due on 01/02/2025.
Amount: $25
  `; // Amount missing decimals → low confidence

  // 1. Paste fixture
  render(<App />);
  fireEvent.change(screen.getByLabelText(/Paste BNPL/), { target: { value: fixture } });
  fireEvent.click(screen.getByText('Extract Payments'));

  // 2. Verify low confidence (<0.6) and issue visible
  await waitFor(() => {
    const pill = screen.getByText(/0\.\d{2}/);
    expect(parseFloat(pill.textContent!)).toBeLessThan(0.6);
    expect(screen.getByText(/Quick Fixes Available/)).toBeInTheDocument();
  });

  // 3. Open Quick Fix
  fireEvent.click(screen.getByText(/Quick Fixes Available/));

  // 4. Apply EU interpretation
  fireEvent.click(screen.getByLabelText('Re-parse as EU (DD/MM/YYYY)'));
  fireEvent.click(screen.getByText('Apply Fix'));

  // 5. Verify confidence increased, issue cleared
  await waitFor(() => {
    const pill = screen.getByText(/0\.\d{2}/);
    expect(parseFloat(pill.textContent!)).toBeGreaterThanOrEqual(0.6);
    expect(screen.queryByText(/Quick Fixes Available/)).not.toBeInTheDocument();
  });
});
```

**Fixtures:**

**File:** `frontend/tests/fixtures/emails/ambiguous-date.txt` (NEW)
```
From: noreply@klarna.com
Subject: Payment reminder
Date: Thu, 1 Oct 2025 10:00:00 -0700

Your payment is due on 01/02/2025.
Amount: $25.00
Payment 1 of 4
```

### Acceptance Criteria

- [ ] Test 1: Re-extract with EU flips "01/02/2025" from Jan 2 → Feb 1
- [ ] Test 2: Apply date fix increases confidence from <0.6 → ≥0.6
- [ ] Test 2: Issue list removes row after confidence crosses threshold
- [ ] Both integration tests pass
- [ ] Fixtures created in `tests/fixtures/emails/`

### Definition of Done

- 2 integration tests passing
- Test fixtures created
- Tests run in CI pipeline
- Git commit: "test(integration): Add locale rescue E2E tests"

---

## T8: Documentation

**Goal:** Document changes, rollback instructions, and user-facing features.

### Implementation

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

**Net Production LOC:** +220

## Tests Added (12)
- 6 locale parsing unit tests
- 4 DateQuickFix component tests
- 2 integration tests (re-extract + confidence boost)

## Functional Requirements Implemented
- FR-146: Locale Switcher (US/EU)
- FR-147: Locale Date Interpretation (M/D/YYYY vs D/M/YYYY)
- FR-149: Date Quick Fix (re-parse + manual override)
- FR-155: Accessibility (keyboard navigation, aria-live)
- FR-158: Locale Toggle Isolation (no auto re-extract)
- FR-159: Re-extract Button (with confirmation)
- FR-161: CSV Export with Fixes
- FR-162: Zero New Dependencies
- FR-163: Client-Only Operation
- FR-165: Backward Compatibility

## Deployment
1. PR #7 → CI green
2. Squash-merge to main
3. Tag: v0.1.5-a-locale
4. Deploy to Vercel production
5. Smoke test: paste ambiguous date → fix → export CSV

## Rollback
```bash
# Revert merge commit
git revert <merge-commit-sha> -m 1
git push origin main

# Redeploy
vercel deploy --prod
```

## Dependencies
None (reuses Luxon, React, shadcn/ui)

## Known Issues
None

## Next Steps
v0.1.5-b: Amount/Autopay/Installment Quick Fixes
```

**File:** `README.md` (UPDATE)

Add section after "Inbox Paste" section:
```markdown
### Locale + Quick Fixes (v0.1.5-a)

**Date Format Toggle:**
- 🌍 **US (MM/DD/YYYY)** — default for US-based BNPL providers
- 🌍 **EU (DD/MM/YYYY)** — opt-in for European date formats
- Toggle above paste area; re-extract to apply new locale

**Quick Fixes for Low-Confidence Rows (<0.6):**
- 📅 **Date Ambiguity Resolver:**
  - Re-parse as US or EU format
  - Manual override (yyyy-MM-dd) with validation (2020-2030)
- ⚙️ **One-Level Undo:** Revert individual row to pre-fix state
- 🔄 **Re-extract:** Reprocess emails with new locale (clears all fixes)

**Workflow:**
1. Paste emails → rows with confidence <0.6 show "Quick Fixes Available"
2. Click to expand → select date interpretation → Apply
3. Confidence recalculates → issue clears if ≥0.6
4. CSV export includes fixed values

**Example:**
```
Ambiguous date: "01/02/2025"
- US mode → Jan 2, 2025
- EU mode → Feb 1, 2025
- Manual → 2025-03-15 (custom override)
```
```

**JSDoc Coverage:**

Update all modified/new functions with JSDoc:
- `parseDate()` — add `@param options.dateLocale` with examples
- `extractEmails()` — add `@param options.dateLocale`
- `LocaleToggle` component — add component-level JSDoc
- `DateQuickFix` component — add component-level JSDoc

Ensure ≥80% coverage on new/changed exports.

### Acceptance Criteria

- [ ] Delta document created in `ops/deltas/`
- [ ] README updated with Locale + Quick Fixes section
- [ ] JSDoc coverage ≥80% on new/modified exports
- [ ] All documentation reviewed for clarity and completeness

### Definition of Done

- All documentation files created/updated
- JSDoc comments added to all new exports
- README reflects user-facing features
- Git commit: "docs(v0.1.5-a): Add locale rescue documentation"

---

## Final Checklist

**Pre-Implementation:**
- [ ] Review spec: [specs/v0.1.5-rescue/spec.md](./spec.md)
- [ ] Review plan: [specs/v0.1.5-rescue/plan.md](./plan.md)
- [ ] Confirm dependencies: Luxon, React, shadcn/ui (no new deps)

**Implementation (T1-T6):**
- [ ] T1: Date Parser Locale Support ✅
- [ ] T2: Email Extractor Plumbing ✅
- [ ] T3: LocaleToggle Component ✅
- [ ] T4: DateQuickFix Component ✅
- [ ] T5: EmailPreview Integration ✅
- [ ] T6: EmailInput Locale Wiring ✅

**Testing (T7):**
- [ ] T7: Integration Tests ✅
- [ ] All 97 tests pass (85 existing + 12 new)
- [ ] TypeScript builds clean

**Documentation (T8):**
- [ ] T8: Documentation ✅
- [ ] Delta document created
- [ ] README updated
- [ ] JSDoc coverage ≥80%

**Pre-Merge:**
- [ ] Manual QA: paste ambiguous date → fix → export CSV
- [ ] Lighthouse a11y ≥90
- [ ] Performance: fix round-trip <16ms
- [ ] No console errors/warnings

**Deployment:**
- [ ] PR #7 created with all tasks
- [ ] CI green (all tests pass)
- [ ] Squash-merge to main
- [ ] Tag: v0.1.5-a-locale
- [ ] Deploy to Vercel production
- [ ] Smoke test production

**Post-Deploy:**
- [ ] Monitor Sentry for errors (24h)
- [ ] Comment final URL to PR #7
- [ ] Update project board: v0.1.5-a ✅

---

**End of Tasks**
