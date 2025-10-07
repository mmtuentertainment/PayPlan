# Implementation Tasks: Inbox Paste v0.1.3-a

**Total Tasks:** 10
**Estimated Time:** 6-8 hours (~45min average per task)
**Dependencies:** Linear execution recommended (tasks build on each other)

---

## Task 1: Create Core Email Extractor Module

**Estimated Time:** 45 minutes
**Priority:** P0 (Critical)
**Dependencies:** None

### Description
Create `frontend/src/lib/email-extractor.ts` with pure functions for extracting structured payment data from email text.

### Acceptance Criteria
- [ ] `extractItemsFromEmails(emailText, timezone)` function implemented
- [ ] Returns `{ items: Item[], issues: Issue[], duplicatesRemoved: number }`
- [ ] `sanitizeHtml()` uses DOMParser to strip HTML tags
- [ ] `splitEmails()` splits on `---`, `From:`, `Subject:` delimiters
- [ ] `deduplicateItems()` removes items with same provider + installment_no + due_date
- [ ] TypeScript interfaces defined: `Item`, `Issue`, `ExtractionResult`

### Implementation Steps
1. Create file `frontend/src/lib/email-extractor.ts`
2. Define TypeScript interfaces (Item, Issue, ExtractionResult)
3. Implement `sanitizeHtml()` using DOMParser
4. Implement `splitEmails()` with regex delimiters
5. Implement `deduplicateItems()` with Set-based deduplication
6. Implement `extractItemsFromEmails()` main function
7. Add error handling with try/catch for each email block

### Verification
```bash
# Run TypeScript compiler
cd frontend && npx tsc --noEmit

# Check exports
grep -E "export (function|interface)" frontend/src/lib/email-extractor.ts
```

**Expected Output:**
```typescript
export interface Item
export interface Issue
export interface ExtractionResult
export function extractItemsFromEmails
```

---

## Task 2: Implement Provider Detection & Patterns

**Estimated Time:** 45 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 1

### Description
Create `frontend/src/lib/extraction/providers/detector.ts` with regex patterns for Klarna and Affirm detection and data extraction.

### Acceptance Criteria
- [ ] `PROVIDER_PATTERNS` object with Klarna and Affirm patterns
- [ ] `detectProvider()` returns 'Klarna' | 'Affirm' | 'Unknown'
- [ ] `extractAmount()` handles $X.XX and X,XXX.XX formats
- [ ] `extractCurrency()` detects USD from $ symbol
- [ ] `extractInstallmentNumber()` parses "X of Y" and "X/Y" formats
- [ ] `detectAutopay()` checks for autopay keywords
- [ ] `extractLateFee()` parses late fee amounts
- [ ] All functions handle missing data gracefully (throw descriptive errors)

### Implementation Steps
1. Create file `frontend/src/lib/extraction/providers/detector.ts`
2. Define `ProviderPatterns` interface
3. Create `PROVIDER_PATTERNS` with Klarna regex patterns
4. Add Affirm patterns to `PROVIDER_PATTERNS`
5. Implement `detectProvider()` with signature matching
6. Implement `extractAmount()` with multiple regex attempts
7. Implement `extractInstallmentNumber()` with defaults
8. Implement `detectAutopay()` with keyword search
9. Implement `extractLateFee()` with fallback to 0

### Verification
```bash
# Test provider detection manually
node -e "
const { detectProvider } = require('./frontend/src/lib/extraction/providers/detector.ts');
console.log(detectProvider('From: Klarna')); // Should output: Klarna
console.log(detectProvider('From: Affirm')); // Should output: Affirm
console.log(detectProvider('From: Unknown')); // Should output: Unknown
"

# Check all exports present
grep "export function" frontend/src/lib/extraction/providers/detector.ts | wc -l
# Expected: 6 functions
```

---

## Task 3: Build Date Parser with Luxon

**Estimated Time:** 30 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 1

### Description
Create `frontend/src/lib/extraction/extractors/date.ts` to normalize various date formats to ISO YYYY-MM-DD using Luxon.

### Acceptance Criteria
- [ ] `parseDate(dateStr, timezone)` handles 6+ date formats
- [ ] Supports: YYYY-MM-DD, M/D/YYYY, MM/DD/YYYY, Month D YYYY, etc.
- [ ] Strips ordinal suffixes (1st, 2nd, 3rd, 4th)
- [ ] `isSuspiciousDate()` flags dates >30 days past or >2 years future
- [ ] Throws descriptive error when parsing fails
- [ ] Uses Luxon's timezone support

### Implementation Steps
1. Create file `frontend/src/lib/extraction/extractors/date.ts`
2. Import DateTime from luxon
3. Define array of supported date formats
4. Implement `parseDate()` trying each format sequentially
5. Add ordinal suffix stripping (st/nd/rd/th)
6. Implement `isSuspiciousDate()` with day diff calculation
7. Add error handling for unparseable dates

### Verification
```bash
# Run unit tests
npm test -- date.test.ts

# Manual verification
node -e "
const { parseDate } = require('./frontend/src/lib/extraction/extractors/date.ts');
console.log(parseDate('Oct 6, 2025', 'America/New_York')); // 2025-10-06
console.log(parseDate('10/6/2025', 'America/New_York'));   // 2025-10-06
console.log(parseDate('October 6th, 2025', 'America/New_York')); // 2025-10-06
"
```

---

## Task 4: Create Sample Email Data

**Estimated Time:** 20 minutes
**Priority:** P0 (Critical)
**Dependencies:** None

### Description
Create `frontend/src/lib/sample-emails.ts` with 5 realistic sample emails (3 Klarna, 2 Affirm) for demo purposes.

### Acceptance Criteria
- [ ] Export const `SAMPLE_EMAILS` string
- [ ] Contains 5 email bodies separated by `---`
- [ ] Mix of autopay/manual, with/without late fees
- [ ] Realistic email headers (From, Subject, Date)
- [ ] Various date formats used
- [ ] Total length <2000 chars

### Implementation Steps
1. Create file `frontend/src/lib/sample-emails.ts`
2. Write Klarna email #1 with autopay + late fee
3. Write Affirm email #1 without autopay
4. Write Klarna email #2 (different format)
5. Write Affirm email #2 with autopay
6. Write Klarna email #3 (final payment)
7. Join with `---` delimiter
8. Export as const

### Verification
```bash
# Check sample emails exist and are valid
node -e "
const { SAMPLE_EMAILS } = require('./frontend/src/lib/sample-emails.ts');
console.log('Length:', SAMPLE_EMAILS.length);
console.log('Delimiters:', (SAMPLE_EMAILS.match(/---/g) || []).length);
"
# Expected: Length <2000, Delimiters: 4 (separates 5 emails)
```

---

## Task 5: Build React Hook for Extraction

**Estimated Time:** 30 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 1, Task 2, Task 3

### Description
Create `frontend/src/hooks/useEmailExtractor.ts` React hook to manage extraction state and provide UI actions.

### Acceptance Criteria
- [ ] Returns `{ result, editableItems, isExtracting, extract, updateItem, deleteItem, clear }`
- [ ] `extract()` runs extraction in setTimeout (non-blocking)
- [ ] `editableItems` state allows inline editing
- [ ] `updateItem()` updates specific item fields
- [ ] `deleteItem()` removes item from preview
- [ ] Error handling sets issues in result
- [ ] Uses useCallback for stable function references

### Implementation Steps
1. Create file `frontend/src/hooks/useEmailExtractor.ts`
2. Set up state: result, isExtracting, editableItems
3. Implement `extract()` with setTimeout wrapper
4. Add error handling in try/catch
5. Implement `updateItem()` with immutable state update
6. Implement `deleteItem()` with filter
7. Implement `clear()` to reset state
8. Wrap all functions in useCallback

### Verification
```bash
# TypeScript check
cd frontend && npx tsc --noEmit

# Check hook exports
grep "export function useEmailExtractor" frontend/src/hooks/useEmailExtractor.ts
```

---

## Task 6: Create Email Input Component

**Estimated Time:** 40 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 4, Task 5

### Description
Build `frontend/src/components/EmailInput.tsx` with textarea, sample button, and keyboard shortcuts.

### Acceptance Criteria
- [ ] Textarea with 16k char limit
- [ ] "Use Sample Emails" button fills SAMPLE_EMAILS
- [ ] Character counter shows `X / 16000 chars`
- [ ] Cmd/Ctrl+Enter triggers extraction
- [ ] "Extract Payments" button disabled when empty or extracting
- [ ] Proper ARIA labels and accessibility
- [ ] Uses existing shadcn/ui components (Textarea, Button)

### Implementation Steps
1. Create file `frontend/src/components/EmailInput.tsx`
2. Import useState, Textarea, Button, SAMPLE_EMAILS
3. Set up text state with maxChars = 16000
4. Implement handleUseSample to fill textarea
5. Implement handleExtract to call onExtract prop
6. Add onKeyDown handler for Cmd/Ctrl+Enter
7. Add aria-label and accessibility attributes
8. Style with Tailwind classes

### Verification
```bash
# Component exists
ls frontend/src/components/EmailInput.tsx

# Run Storybook or dev server
cd frontend && npm run dev

# Manual test:
# 1. Click "Use Sample Emails" - textarea fills
# 2. Press Cmd+Enter - extract triggers
# 3. Check char counter updates
```

---

## Task 7: Build Email Preview Table Component

**Estimated Time:** 45 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 5

### Description
Create `frontend/src/components/EmailPreview.tsx` with preview table, inline editing, delete, and Copy as CSV.

### Acceptance Criteria
- [ ] Table displays: Provider, #, Due Date, Amount, Autopay, Late Fee, Actions
- [ ] Delete button per row
- [ ] "Copy as CSV" button copies to clipboard
- [ ] "Build Plan" button triggers onBuildPlan callback
- [ ] Empty state shows helpful message
- [ ] Row count displayed: "Extracted Payments (X)"
- [ ] Uses shadcn/ui Table or custom table with Tailwind

### Implementation Steps
1. Create file `frontend/src/components/EmailPreview.tsx`
2. Implement empty state UI
3. Build table structure with proper headers
4. Map items to table rows
5. Add Delete button per row calling onDelete(index)
6. Implement copyToCSV function:
   - Convert items to CSV format
   - Use navigator.clipboard.writeText()
   - Show toast on success
7. Add "Build Plan" button
8. Add accessibility attributes (aria-label, role)

### Verification
```bash
# Component exists
ls frontend/src/components/EmailPreview.tsx

# Manual test in browser:
# 1. Extract sample emails
# 2. Verify 5 rows display
# 3. Click Delete - row removed
# 4. Click "Copy as CSV" - check clipboard
# 5. Paste in text editor - verify CSV format
```

---

## Task 8: Build Email Issues Component

**Estimated Time:** 20 minutes
**Priority:** P1 (Important)
**Dependencies:** Task 5

### Description
Create `frontend/src/components/EmailIssues.tsx` to display validation errors and extraction issues.

### Acceptance Criteria
- [ ] Shows list of issues with warning icons
- [ ] Each issue shows reason + email snippet (first 100 chars)
- [ ] aria-live="polite" for screen readers
- [ ] Styled with yellow/warning colors
- [ ] Hidden when no issues
- [ ] Issue count displayed: "Issues (X)"

### Implementation Steps
1. Create file `frontend/src/components/EmailIssues.tsx`
2. Add early return if issues.length === 0
3. Map issues to UI cards/alerts
4. Display reason with ⚠️ icon
5. Show truncated email snippet in monospace
6. Add aria-live="polite" to container
7. Style with yellow/warning Tailwind classes

### Verification
```bash
# Component exists
ls frontend/src/components/EmailIssues.tsx

# Manual test:
# 1. Paste unknown provider email
# 2. Verify issue appears in Issues section
# 3. Check screen reader announces issue (aria-live)
```

---

## Task 9: Wire Emails Tab into Main App

**Estimated Time:** 45 minutes
**Priority:** P0 (Critical)
**Dependencies:** Task 6, Task 7, Task 8

### Description
Integrate Emails tab into existing `frontend/src/App.tsx` alongside CSV tab, with state management and API integration.

### Acceptance Criteria
- [ ] New "Emails" tab visible in UI
- [ ] Tab switching works (CSV ↔ Emails)
- [ ] useEmailExtractor hook integrated
- [ ] Extract → Preview → Build Plan flow works
- [ ] "Build Plan" calls POST /api/plan with extracted items
- [ ] Response displays in existing results section
- [ ] Timezone from UI settings passed to parser
- [ ] Business-day mode settings included in API call

### Implementation Steps
1. Open `frontend/src/App.tsx`
2. Import EmailInput, EmailPreview, EmailIssues components
3. Import useEmailExtractor hook
4. Add tab state: `[activeTab, setActiveTab] = useState('csv')`
5. Render Tabs component with CSV and Emails options
6. Wire useEmailExtractor with current timezone
7. Create handleBuildPlan function:
   - Build request with editableItems
   - Include paycheckDates, minBuffer, timezone, businessDayMode, country
   - Call POST /api/plan
   - Set response to existing results state
8. Connect EmailInput onExtract to hook
9. Connect EmailPreview callbacks to hook methods
10. Test tab switching preserves state

### Verification
```bash
# Run dev server
cd frontend && npm run dev

# Manual E2E test:
# 1. Open app in browser
# 2. Click "Emails" tab
# 3. Click "Use Sample Emails"
# 4. Click "Extract Payments"
# 5. Verify 5 rows in preview
# 6. Click "Build Plan"
# 7. Verify actions/summary/ics appear
# 8. Total time should be <60s
```

---

## Task 10: Write Tests & Documentation

**Estimated Time:** 60 minutes
**Priority:** P0 (Critical)
**Dependencies:** Tasks 1-9

### Description
Create comprehensive unit tests, integration test, fixtures, and update documentation.

### Acceptance Criteria
- [ ] Unit tests for email-extractor (6 tests)
- [ ] Unit tests for provider-detectors (4 tests)
- [ ] Unit tests for date-parser (2 tests)
- [ ] Integration test: emails-to-plan.test.ts (1 test)
- [ ] 6 test fixtures in tests/fixtures/emails/
- [ ] README updated with "Inbox Paste" section
- [ ] CHANGELOG.md entry for v0.1.3
- [ ] All tests passing: `npm test`

### Implementation Steps

**Unit Tests:**
1. Create `frontend/tests/unit/email-extractor.test.ts`:
   - Test Klarna extraction
   - Test Affirm extraction
   - Test deduplication
   - Test unknown provider
   - Test multiple dates handling
   - Test HTML sanitization

2. Create `frontend/tests/unit/provider-detectors.test.ts`:
   - Test provider detection
   - Test amount extraction
   - Test installment number parsing
   - Test autopay detection

3. Create `frontend/tests/unit/date-parser.test.ts`:
   - Test date format parsing
   - Test suspicious date flagging

**Integration Test:**
4. Create `frontend/tests/integration/emails-to-plan.test.ts`:
   - Full flow: SAMPLE_EMAILS → extract → POST /api/plan → verify response

**Fixtures:**
5. Create `tests/fixtures/emails/`:
   - `klarna-1.txt` - with autopay + late fee
   - `klarna-2.txt` - manual payment
   - `affirm-1.txt` - standard installment
   - `affirm-2.txt` - with autopay
   - `multi-date.txt` - email with multiple dates
   - `unknown-provider.txt` - generic payment email

**Documentation:**
6. Update README.md:
   - Add "📧 Inbox Paste (Email Parser)" section
   - List supported providers
   - Show example usage
   - Document limitations

7. Update CHANGELOG.md:
   - Add v0.1.3 section
   - List new features
   - Note Phase A (Klarna/Affirm only)

### Verification
```bash
# Run all tests
npm test

# Expected output:
# PASS frontend/tests/unit/email-extractor.test.ts (6 tests)
# PASS frontend/tests/unit/provider-detectors.test.ts (4 tests)
# PASS frontend/tests/unit/date-parser.test.ts (2 tests)
# PASS frontend/tests/integration/emails-to-plan.test.ts (1 test)
#
# Test Suites: 4 passed, 4 total
# Tests: 13 passed, 13 total

# Check fixtures exist
ls tests/fixtures/emails/*.txt | wc -l
# Expected: 6

# Verify README updated
grep "Inbox Paste" README.md
# Should show new section

# Verify CHANGELOG
grep "v0.1.3" CHANGELOG.md
```

---

## Task Execution Order

**Recommended sequence for optimal flow:**

1. ✅ Task 1: Core Email Extractor (foundation)
2. ✅ Task 2: Provider Detection (business logic)
3. ✅ Task 3: Date Parser (utility)
4. ✅ Task 4: Sample Emails (test data)
5. ✅ Task 5: React Hook (state management)
6. ✅ Task 6: Email Input Component (UI)
7. ✅ Task 7: Email Preview Component (UI)
8. ✅ Task 8: Email Issues Component (UI)
9. ✅ Task 9: Wire into Main App (integration)
10. ✅ Task 10: Tests & Documentation (validation)

**Parallel Opportunities:**
- Tasks 2 & 3 can run in parallel after Task 1
- Tasks 6, 7, 8 can run in parallel after Task 5
- Task 4 can run anytime (independent)

---

## Success Metrics

**Completion Criteria:**
- [ ] All 10 tasks completed
- [ ] 13 tests passing
- [ ] E2E manual test: <60s paste → plan
- [ ] Accessibility: Lighthouse score ≥90
- [ ] Performance: 50 emails parse in <2s
- [ ] Zero console errors in browser
- [ ] README and CHANGELOG updated
- [ ] Code merged to main

**Quality Gates:**
- TypeScript compilation: 0 errors
- Test coverage: >80% for new code
- Bundle size increase: <50KB
- No new npm dependencies

---

## Rollback Plan

If critical issues found post-deployment:

1. **Immediate:** Hide Emails tab via feature flag
2. **Short-term:** Revert merge commit
3. **Long-term:** Fix issues in new branch, re-test, re-deploy

**Feature Flag Pattern:**
```typescript
const FEATURE_EMAIL_PARSER = process.env.REACT_APP_FEATURE_EMAIL_PARSER === 'true';

{FEATURE_EMAIL_PARSER && <EmailsTab />}
```

---

## Post-Launch Tasks (Not in v0.1.3-a)

**Phase B - Additional Providers:**
- [ ] Add Afterpay detector patterns
- [ ] Add PayPal Pay in 4 patterns
- [ ] Add Zip patterns
- [ ] Add Sezzle patterns
- [ ] Create fixtures for each
- [ ] Update tests

**Future Enhancements:**
- [ ] HTML email support (beyond DOMParser)
- [ ] Non-USD currency detection
- [ ] Multi-installment extraction
- [ ] Browser extension (Chrome/Firefox)

---

**End of Tasks**
