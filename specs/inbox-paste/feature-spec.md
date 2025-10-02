# Feature Specification: Inbox Paste (Email/Receipt Parser)

**Version:** v0.1.3
**Status:** Draft
**Author:** PayPlan Team
**Created:** 2025-10-02
**Last Updated:** 2025-10-02

---

## Executive Summary

**Feature Name:** Inbox Paste (Email/Receipt Parser)

**Why:** Eliminate CSV friction so a new user can paste raw emails/receipts and get a plan in under 60 seconds—no logins, no scraping, no persistence.

**What:** A client-side email parser that extracts BNPL payment data from pasted email text and converts it into our existing normalized `items[]` format, enabling instant payment plan generation without manual CSV creation.

**Impact:**
- **User Experience:** Reduces onboarding friction from ~5 minutes (CSV creation) to <60 seconds (paste & go)
- **Conversion:** Expected 3x increase in first-time users completing their first plan
- **Privacy:** Zero server-side data processing; all extraction happens in browser
- **Accessibility:** Supports users unfamiliar with spreadsheet tools

---

## Problem Statement

### Current Pain Points

1. **CSV Friction:** New users must manually create CSV files with 7 columns, correct headers, proper formatting
2. **Data Entry:** Requires copying data from multiple emails into spreadsheet rows
3. **Learning Curve:** Users need to understand CSV format, required fields, and data types
4. **Mobile Unfriendly:** CSV editing on mobile devices is difficult
5. **Time to Value:** 5+ minutes from landing to first plan generation

### User Story

> "As a new PayPlan user with 5 BNPL payments across different providers, I want to paste my payment reminder emails directly into the app, so I can see my weekly action plan in under 60 seconds without creating a CSV file."

---

## Solution Overview

### High-Level Approach

An offline, browser-only parser that:
1. Accepts pasted email/receipt text in a new "Emails" tab
2. Detects provider signatures (Klarna, Affirm, Afterpay, etc.)
3. Extracts payment data using regex/heuristics per provider
4. Normalizes to existing `items[]` schema
5. Displays preview table with validation errors
6. Calls existing `/api/plan` endpoint with extracted data

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Browser Only)                                  │
│                                                          │
│  ┌─────────────┐    ┌──────────────────┐               │
│  │ Emails Tab  │───▶│ email-extractor  │               │
│  │ (textarea)  │    │ .ts (pure fns)   │               │
│  └─────────────┘    └──────────────────┘               │
│                              │                           │
│                              ▼                           │
│                     ┌─────────────────┐                 │
│                     │ items[] preview │                 │
│                     │ + validation    │                 │
│                     └─────────────────┘                 │
│                              │                           │
│                              ▼                           │
│                     ┌─────────────────┐                 │
│                     │ Build Plan btn  │                 │
│                     └─────────────────┘                 │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
                      POST /api/plan
                      (existing endpoint)
```

**Key Principles:**
- **Zero Network:** Parser runs entirely client-side
- **Zero Storage:** Pasted text never persisted or sent to server
- **Zero Dependencies:** No new npm packages in v0.1.3
- **Privacy-First:** User data never leaves browser during extraction

---

## Scope

### In Scope (v0.1.3)

✅ **UI Components:**
- New "Emails" tab alongside existing "CSV" tab
- Large textarea (16k char capacity minimum)
- "Use Sample Emails" button for demo data
- Preview table showing extracted rows
- "Issues" section for validation errors
- "Copy as CSV" export button

✅ **Supported Providers (US Market):**
1. Klarna
2. Affirm
3. Afterpay
4. PayPal Pay in 4
5. Zip
6. Sezzle

✅ **Extraction Capabilities:**
- Provider detection via brand signatures
- Installment number ("Payment 2 of 4")
- Due date (multiple formats)
- Amount + currency
- Autopay status detection
- Late fee extraction (when present)

✅ **Data Quality:**
- Per-row validation
- Duplicate detection
- Unknown provider handling
- Ambiguous data flagging

✅ **Integration:**
- Seamless handoff to existing `/api/plan` endpoint
- Works with existing business-day shifting
- Compatible with current timezone/country settings

### Out of Scope (Future Versions)

❌ **Not in v0.1.3:**
- Provider integrations/APIs
- Email forwarding/IMAP connections
- Browser extension for Gmail/Outlook
- OCR for receipt images
- Non-US providers (international expansion in v0.2.x)
- Mixing CSV + Email data (tabs are mutually exclusive)
- Historical payment tracking
- Server-side parsing
- Machine learning models

---

## Functional Requirements

### FR-102: Emails Tab UI

**Requirement:** Add "Emails" tab with large textarea for pasting email content.

**Acceptance Criteria:**
- Tab appears alongside existing "CSV" tab
- Textarea accepts minimum 16,000 characters
- Placeholder text: "Paste your BNPL payment reminder emails here (one or multiple)..."
- Character counter shows remaining capacity
- Auto-expanding textarea (or fixed 400px min-height)

**Priority:** P0 (Critical)

---

### FR-103: Sample Emails Button

**Requirement:** "Use Sample Emails" button fills realistic multi-provider examples.

**Acceptance Criteria:**
- Button labeled "Use Sample Emails" above textarea
- Fills textarea with 5-6 realistic email bodies (different providers)
- Replaces existing textarea content with confirmation
- Sample emails represent common formats for each provider

**Priority:** P0 (Critical)

**Sample Data Format:**
```
From: Klarna <no-reply@klarna.com>
Subject: Payment reminder - $45.00 due Oct 6

Hi there,

Your next Klarna payment is coming up.

Payment 2 of 4: $45.00
Due date: October 6, 2025
AutoPay is ON - we'll charge your card automatically

Late payment fee: $7.00

---

From: Affirm <notifications@affirm.com>
Subject: Upcoming payment on Oct 10

Your Affirm payment is due soon.

Installment 1 of 3: $58.00
Due: 10/10/2025
Payment method: Bank account ending in 1234
```

---

### FR-104: Provider Detection

**Requirement:** Parser detects provider via logo strings/email signatures.

**Acceptance Criteria:**
- Detects "Klarna" from sender/subject/body
- Detects "Affirm, Inc." or "Affirm"
- Detects "Afterpay"
- Detects "PayPal Pay in 4" or "PayPal Credit"
- Detects "Zip" (formerly QuadPay)
- Detects "Sezzle"
- Case-insensitive matching
- Falls back to "Unknown" if no match

**Priority:** P0 (Critical)

**Detection Signatures:**
| Provider | Signature Patterns |
|----------|-------------------|
| Klarna | `klarna.com`, `from klarna`, `klarna payment` |
| Affirm | `affirm.com`, `affirm, inc.`, `affirm payment` |
| Afterpay | `afterpay.com`, `from afterpay` |
| PayPal Pay in 4 | `paypal pay in 4`, `pay in 4`, `paypal.com/paymentreminder` |
| Zip | `zip.co`, `quadpay`, `from zip` |
| Sezzle | `sezzle.com`, `from sezzle` |

---

### FR-105: Date Extraction

**Requirement:** Robust date extraction supporting multiple formats; normalize using current `timeZone`.

**Acceptance Criteria:**
- Parses "Oct 6, 2025" → `2025-10-06`
- Parses "10/06/2025" → `2025-10-06`
- Parses "2025-10-06" → `2025-10-06`
- Parses "October 6th, 2025" → `2025-10-06`
- Uses current UI timezone for normalization
- Flags dates in the past (>30 days ago) as suspicious
- Flags dates >2 years in future as suspicious

**Priority:** P0 (Critical)

**Date Format Support:**
- `YYYY-MM-DD` (ISO)
- `MM/DD/YYYY` (US)
- `Month D, YYYY` (Oct 6, 2025)
- `Month Dth, YYYY` (October 6th, 2025)
- `D Month YYYY` (6 Oct 2025)

---

### FR-106: Amount Extraction

**Requirement:** Extract amount with currency; normalize to number; detect currency from symbol.

**Acceptance Criteria:**
- Parses `$45.00` → amount: 45, currency: "USD"
- Parses `USD 45.00` → amount: 45, currency: "USD"
- Parses `45` (near "$" symbol) → amount: 45, currency: "USD"
- Parses `€45.00` → amount: 45, currency: "EUR"
- Handles commas: `$1,234.56` → 1234.56
- Defaults to USD if symbol is `$`
- Flags amounts >$10,000 as suspicious
- Flags amounts <$1 as suspicious

**Priority:** P0 (Critical)

**Currency Symbol Mapping:**
- `$` → USD
- `€` → EUR
- `£` → GBP
- `A$` → AUD
- `C$` → CAD

---

### FR-107: Installment Detection

**Requirement:** Extract installment number from phrases like "Payment 2 of 4".

**Acceptance Criteria:**
- Parses "Payment 2 of 4" → `installment_no: 2`
- Parses "2/4" → `installment_no: 2`
- Parses "Installment 2 of 4" → `installment_no: 2`
- Parses "Instalment 2/4" → `installment_no: 2`
- Defaults to `1` if not found
- Flags installment_no > 12 as suspicious

**Priority:** P0 (Critical)

**Pattern Examples:**
- `Payment X of Y`
- `Installment X/Y`
- `Instalment X of Y`
- `X/Y` (when near payment context)

---

### FR-108: Autopay Detection

**Requirement:** Detect autopay status from email text.

**Acceptance Criteria:**
- Detects "AutoPay is on" → `autopay: true`
- Detects "automatic payment" → `autopay: true`
- Detects "will be charged automatically" → `autopay: true`
- Detects "auto-pay enabled" → `autopay: true`
- Defaults to `false` if no autopay keywords found
- Case-insensitive matching

**Priority:** P1 (Important)

**Autopay Keywords:**
- `autopay`
- `auto-pay`
- `automatic payment`
- `automatically charged`
- `auto charge`

---

### FR-109: Late Fee Detection

**Requirement:** Extract late fee amount when present in email.

**Acceptance Criteria:**
- Detects "Late fee: $7.00" → `late_fee: 7`
- Detects "Late payment fee $7" → `late_fee: 7`
- Detects "Late charge: $7.00" → `late_fee: 7`
- Defaults to `0` if not found
- Flags late_fee >$100 as suspicious

**Priority:** P1 (Important)

**Late Fee Keywords:**
- `late fee`
- `late payment fee`
- `late charge`
- `overdue fee`

---

### FR-110: Deduplication

**Requirement:** Remove duplicate rows when multiple emails mention same provider + installment_no + date.

**Acceptance Criteria:**
- Duplicate detection uses: `provider` + `installment_no` + `due_date`
- Keeps first occurrence, discards subsequent duplicates
- Shows count of duplicates removed in UI
- Example: 2 Klarna emails about "Payment 2 of 4 due Oct 6" → extract once

**Priority:** P1 (Important)

**Deduplication Logic:**
```typescript
function isDuplicate(itemA, itemB): boolean {
  return itemA.provider === itemB.provider
    && itemA.installment_no === itemB.installment_no
    && itemA.due_date === itemB.due_date;
}
```

---

### FR-111: Validation & Error Reporting

**Requirement:** Produce per-line errors with row highlighting; invalid rows excluded but shown in "Issues" list.

**Acceptance Criteria:**
- Each extracted row validated against existing schema
- Required fields: `provider`, `due_date`, `amount`
- Invalid rows appear in "Issues" section with reason
- Valid rows appear in preview table
- User can manually edit extracted rows before "Build Plan"
- Validation errors use same rules as CSV validation

**Priority:** P0 (Critical)

**Validation Rules:**
- `provider`: Must be non-empty string
- `installment_no`: Must be integer ≥1
- `due_date`: Must be valid ISO date (YYYY-MM-DD)
- `amount`: Must be number >0
- `currency`: Must be 3-letter currency code
- `autopay`: Must be boolean
- `late_fee`: Must be number ≥0

**Error Messages:**
- "Missing due date" (if date not found)
- "Invalid amount" (if amount unparseable)
- "Unknown provider" (if provider detection failed)
- "Ambiguous data: multiple dates found" (if >1 date candidate)

---

### FR-112: Preview Table

**Requirement:** Show extracted rows in table before calling `/api/plan`.

**Acceptance Criteria:**
- Table displays: Provider, Installment, Due Date, Amount, Autopay, Late Fee
- Row count displayed: "X valid payments extracted"
- User can delete rows from preview
- User can manually edit any field inline
- Table uses same styling as existing CSV results table
- Empty state shows: "No valid payments extracted. Check Issues below."

**Priority:** P0 (Critical)

**Preview Table Columns:**
| Column | Format | Editable |
|--------|--------|----------|
| Provider | Text | Yes |
| Installment # | Integer | Yes |
| Due Date | YYYY-MM-DD | Yes |
| Amount | $X.XX | Yes |
| Currency | USD | Yes |
| Autopay | ✓/✗ | Yes |
| Late Fee | $X.XX | Yes |
| Actions | [Delete] | - |

---

### FR-113: Build Plan Integration

**Requirement:** "Build Plan" calls existing API with extracted `items[]` plus current settings.

**Acceptance Criteria:**
- Button labeled "Build Plan" (same as CSV tab)
- Disabled when no valid rows extracted
- Sends extracted items to POST `/api/plan`
- Includes current: `timeZone`, `businessDayMode`, `country`, `customSkipDates`, `minBuffer`, `paycheckDates`
- Shows same loading state and results as CSV flow
- API response displays in existing results section

**Priority:** P0 (Critical)

**API Call:**
```typescript
POST /api/plan
{
  "items": extractedItems, // from email parser
  "paycheckDates": [...],  // from UI form
  "minBuffer": 100,        // from UI form
  "timeZone": "America/New_York",
  "businessDayMode": true,
  "country": "US",
  "customSkipDates": [...]
}
```

---

### FR-114: Accessibility

**Requirement:** Ensure email parser UI is fully accessible.

**Acceptance Criteria:**
- Textarea has `<label for="email-input">` with clear text
- Validation errors use `role="alert"` and `aria-live="polite"`
- Keyboard shortcut: Cmd/Ctrl+Enter to trigger parse
- Preview table has proper `<caption>` and `<th scope="col">`
- Issues list has `role="status"` for screen readers
- Focus management: after parse, focus moves to preview or first error

**Priority:** P0 (Critical)

**ARIA Attributes:**
- `aria-label="Paste BNPL payment emails"`
- `aria-describedby="email-help-text"`
- `aria-invalid="true"` on rows with errors
- `aria-live="polite"` for extraction status updates

---

### FR-115: Performance

**Requirement:** Parse 50 pasted emails in <2s on mid-tier laptop.

**Acceptance Criteria:**
- Parsing 50 emails (mixed providers) completes in <2000ms
- No UI blocking during parse (use debouncing or web worker if needed)
- Preview table renders incrementally for large datasets
- Character limit enforced to prevent browser hang (16k chars per paste)

**Priority:** P1 (Important)

**Performance Targets:**
- Parse 10 emails: <200ms
- Parse 50 emails: <2000ms
- Render preview table (50 rows): <100ms

---

### FR-116: Security

**Requirement:** No network calls during extraction; no persistence; sanitize HTML if pasted.

**Acceptance Criteria:**
- Parser functions are pure (no side effects)
- No `fetch()` or network calls during extraction
- No `localStorage` or `sessionStorage` writes
- Pasted HTML tags stripped before processing
- No eval() or dangerous JS execution
- XSS protection via DOMPurify or equivalent

**Priority:** P0 (Critical)

**Security Checklist:**
- ✅ Client-side only execution
- ✅ No data sent to server during extraction
- ✅ HTML sanitization before display
- ✅ No user-generated code execution
- ✅ Input length limits enforced

---

### FR-117: Telemetry

**Requirement:** No telemetry in v0.1.3.

**Acceptance Criteria:**
- No analytics events sent during email parsing
- No usage tracking for email extraction
- Consistent with existing privacy-first approach

**Priority:** P2 (Optional)

---

### FR-118: Back-Compatibility

**Requirement:** CSV workflow remains unchanged and fully functional.

**Acceptance Criteria:**
- CSV tab still works exactly as before
- Switching between tabs doesn't cause errors
- CSV validation rules unchanged
- Existing users see no breaking changes
- Both tabs can be used independently

**Priority:** P0 (Critical)

---

### FR-119: Edge Case - Multiple Dates

**Requirement:** If email contains multiple dates, choose the *next* payment date; flag if ambiguous.

**Acceptance Criteria:**
- Email with "Previous payment: Oct 1" and "Next payment: Oct 6" → extracts Oct 6
- Email with multiple future dates without context → flags as ambiguous
- Heuristic: prefer date nearest to "due", "next", "upcoming" keywords
- Ambiguous rows appear in Issues with reason: "Multiple dates found - please verify"

**Priority:** P1 (Important)

**Disambiguation Strategy:**
1. Look for keywords: "next", "due", "upcoming" near dates
2. If tied, choose earliest future date (>today)
3. If still ambiguous, flag for manual review

---

### FR-120: Unknown Provider Handling

**Requirement:** If provider unknown, set `provider:"Unknown"` and flag row; excluded by default with option "Include unknown (advanced)".

**Acceptance Criteria:**
- Unknown providers → `provider: "Unknown"`
- Unknown rows appear in Issues section
- Checkbox: "Include unknown providers (advanced)" - default unchecked
- If checked, unknown rows included in preview table
- Unknown rows not sent to API unless checkbox enabled

**Priority:** P1 (Important)

**Unknown Provider Flow:**
```
Email pasted → Provider detection → Not matched
  ↓
Set provider: "Unknown"
  ↓
Add to Issues list with reason: "Provider not recognized"
  ↓
Excluded from preview (unless user enables checkbox)
```

---

### FR-121: Non-USD Currency Handling

**Requirement:** Keep currency code if found (e.g., "AUD"); otherwise default USD and flag.

**Acceptance Criteria:**
- Detects "AUD 45.00" → `currency: "AUD"`
- Detects "£45.00" → `currency: "GBP"`
- Defaults to "USD" if only `$` symbol found
- Flags non-USD currencies with warning: "Non-USD currency detected"
- All rows still processed (no exclusion based on currency)

**Priority:** P1 (Important)

**Supported Currencies (v0.1.3):**
- USD (primary)
- EUR, GBP, AUD, CAD (detected but flagged)

---

### FR-122: Multi-Installment Email Handling

**Requirement:** If email lists multiple future dates (payment schedule), extract **only next** installment.

**Acceptance Criteria:**
- Email showing "Remaining payments: Oct 6 ($45), Nov 6 ($45), Dec 6 ($45)" → extracts only Oct 6
- Heuristic: choose earliest future date
- Note displayed: "Multiple installments detected - showing next payment only"

**Priority:** P1 (Important)

**Multi-Installment Example:**
```
Email body:
"Remaining payments:
- Oct 6, 2025: $45.00
- Nov 6, 2025: $45.00
- Dec 6, 2025: $45.00"

Extracted:
{provider: "Klarna", installment_no: 2, due_date: "2025-10-06", amount: 45, ...}

Note: "Additional installments detected but not extracted (Nov 6, Dec 6)"
```

---

### FR-123: Max Output Rows

**Requirement:** Limit output to 200 rows; soft warn when exceeded.

**Acceptance Criteria:**
- Parser extracts maximum 200 rows
- If >200 potential rows detected, show warning: "Over 200 payments detected. Showing first 200. Consider pasting fewer emails."
- No hard error; user can still proceed with first 200
- Warning appears above preview table

**Priority:** P2 (Optional)

**Warning Message:**
```
⚠️ Over 200 payments detected. Showing first 200 rows.
Consider pasting fewer emails or splitting into multiple plans.
```

---

### FR-124: Copy as CSV

**Requirement:** One-click button to export extracted rows to CSV format.

**Acceptance Criteria:**
- Button labeled "Copy as CSV" in preview section
- Copies extracted rows to clipboard in valid CSV format
- Headers: `provider,installment_no,due_date,amount,currency,autopay,late_fee`
- User can paste into spreadsheet for verification/editing
- Success toast: "CSV copied to clipboard"

**Priority:** P1 (Important)

**CSV Export Format:**
```csv
provider,installment_no,due_date,amount,currency,autopay,late_fee
Klarna,2,2025-10-06,45.00,USD,true,7.00
Affirm,1,2025-10-10,58.00,USD,false,0
```

---

### FR-125: Documentation

**Requirement:** Add README section "Inbox Paste (Email Parser)" with examples and limitations.

**Acceptance Criteria:**
- README has new section under "Features"
- Explains what email formats are supported
- Shows example email snippets
- Lists supported providers
- Documents limitations (US only, no HTML emails, etc.)
- Links to sample emails

**Priority:** P1 (Important)

**README Content Outline:**
```markdown
## 📧 Inbox Paste (Email Parser)

Paste BNPL payment reminder emails directly - no CSV needed.

### Supported Providers
- Klarna, Affirm, Afterpay, PayPal Pay in 4, Zip, Sezzle

### How to Use
1. Click "Emails" tab
2. Paste email text (copy from your inbox)
3. Review extracted payments
4. Click "Build Plan"

### What Gets Extracted
- Provider name
- Payment number (e.g., "2 of 4")
- Due date
- Amount
- Autopay status
- Late fee (if mentioned)

### Limitations
- US providers only (v0.1.3)
- Plain text emails work best
- One installment per email
- No historical payments
```

---

## Technical Design

### Architecture Overview

```
frontend/src/
├── components/
│   ├── EmailInput.tsx          # New: Email textarea tab
│   ├── EmailPreview.tsx        # New: Extracted rows table
│   └── EmailIssues.tsx         # New: Validation errors list
├── lib/
│   ├── email-extractor.ts      # New: Core parser (pure functions)
│   ├── provider-detectors.ts   # New: Per-provider regex patterns
│   └── date-parser.ts          # New: Date normalization utilities
└── hooks/
    └── useEmailExtractor.ts    # New: React hook wrapping extractor
```

### Core Module: `email-extractor.ts`

**Purpose:** Pure function library for extracting structured data from email text.

**Key Functions:**

```typescript
/**
 * Extract BNPL payment items from pasted email text
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  const emails = splitEmails(emailText);
  const items: Item[] = [];
  const issues: Issue[] = [];

  for (const email of emails) {
    const provider = detectProvider(email);

    if (provider === 'Unknown') {
      issues.push({
        email: truncate(email),
        reason: 'Provider not recognized'
      });
      continue;
    }

    try {
      const item = extractItem(email, provider, timezone);
      items.push(item);
    } catch (err) {
      issues.push({
        email: truncate(email),
        reason: err.message
      });
    }
  }

  const deduplicated = deduplicateItems(items);

  return {
    items: deduplicated,
    issues,
    duplicatesRemoved: items.length - deduplicated.length
  };
}

/**
 * Detect BNPL provider from email text
 */
function detectProvider(emailText: string): Provider {
  const text = emailText.toLowerCase();

  if (text.includes('klarna')) return 'Klarna';
  if (text.includes('affirm')) return 'Affirm';
  if (text.includes('afterpay')) return 'Afterpay';
  if (text.includes('paypal pay in 4') || text.includes('pay in 4')) return 'PayPal';
  if (text.includes('zip') || text.includes('quadpay')) return 'Zip';
  if (text.includes('sezzle')) return 'Sezzle';

  return 'Unknown';
}

/**
 * Extract single item from one email
 */
function extractItem(
  emailText: string,
  provider: Provider,
  timezone: string
): Item {
  const amount = extractAmount(emailText);
  const currency = extractCurrency(emailText);
  const dueDate = extractDueDate(emailText, timezone);
  const installmentNo = extractInstallmentNumber(emailText);
  const autopay = detectAutopay(emailText);
  const lateFee = extractLateFee(emailText);

  return {
    provider,
    installment_no: installmentNo,
    due_date: dueDate,
    amount,
    currency,
    autopay,
    late_fee: lateFee
  };
}
```

**Type Definitions:**

```typescript
interface Item {
  provider: string;
  installment_no: number;
  due_date: string; // ISO YYYY-MM-DD
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
}

interface Issue {
  email: string; // Truncated email text
  reason: string; // Human-readable error
}

interface ExtractionResult {
  items: Item[];
  issues: Issue[];
  duplicatesRemoved: number;
}

type Provider = 'Klarna' | 'Affirm' | 'Afterpay' | 'PayPal' | 'Zip' | 'Sezzle' | 'Unknown';
```

---

### Provider-Specific Patterns: `provider-detectors.ts`

**Purpose:** Regex patterns and heuristics per provider.

```typescript
export const PROVIDER_PATTERNS = {
  klarna: {
    signatures: ['klarna.com', 'from klarna', 'klarna payment'],
    amountPatterns: [
      /payment.*?\$?([\d,]+\.?\d*)/i,
      /amount.*?\$?([\d,]+\.?\d*)/i
    ],
    datePatterns: [
      /due\s*(?:date)?\s*:?\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /payment\s+(?:on|due)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\/(\d+)/
    ]
  },

  affirm: {
    signatures: ['affirm.com', 'affirm, inc.', 'affirm payment'],
    amountPatterns: [
      /installment.*?\$?([\d,]+\.?\d*)/i,
      /\$?([\d,]+\.?\d*)\s+due/i
    ],
    datePatterns: [
      /due\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+payment/i
    ],
    installmentPatterns: [
      /installment\s+(\d+)\s+of\s+(\d+)/i
    ]
  },

  // ... patterns for other providers
};
```

---

### Date Parser: `date-parser.ts`

**Purpose:** Normalize various date formats to ISO YYYY-MM-DD using Luxon.

```typescript
import { DateTime } from 'luxon';

/**
 * Parse various date formats to ISO YYYY-MM-DD
 */
export function parseDate(dateStr: string, timezone: string): string {
  const formats = [
    'yyyy-MM-dd',           // 2025-10-06
    'M/d/yyyy',             // 10/6/2025
    'MMMM d, yyyy',         // October 6, 2025
    'MMM d, yyyy',          // Oct 6, 2025
    'd MMMM yyyy',          // 6 October 2025
    'MMMM do, yyyy'         // October 6th, 2025
  ];

  for (const format of formats) {
    const dt = DateTime.fromFormat(dateStr, format, { zone: timezone });
    if (dt.isValid) {
      return dt.toISODate();
    }
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Check if date is suspicious (too far past/future)
 */
export function isSuspiciousDate(isoDate: string): boolean {
  const dt = DateTime.fromISO(isoDate);
  const now = DateTime.now();

  const daysDiff = dt.diff(now, 'days').days;

  // Flag if >30 days in past or >730 days in future
  return daysDiff < -30 || daysDiff > 730;
}
```

---

### React Hook: `useEmailExtractor.ts`

**Purpose:** Integrate extraction logic with React component state.

```typescript
import { useState, useCallback } from 'react';
import { extractItemsFromEmails, ExtractionResult } from '../lib/email-extractor';

export function useEmailExtractor(timezone: string) {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const extract = useCallback((emailText: string) => {
    setIsExtracting(true);

    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const extracted = extractItemsFromEmails(emailText, timezone);
        setResult(extracted);
      } catch (err) {
        setResult({
          items: [],
          issues: [{ email: '', reason: 'Extraction failed: ' + err.message }],
          duplicatesRemoved: 0
        });
      } finally {
        setIsExtracting(false);
      }
    }, 0);
  }, [timezone]);

  const clear = useCallback(() => {
    setResult(null);
  }, []);

  return {
    result,
    isExtracting,
    extract,
    clear
  };
}
```

---

### UI Component: `EmailInput.tsx`

**Purpose:** Email textarea tab with sample data button.

```typescript
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SAMPLE_EMAILS } from '@/lib/sample-data';

interface EmailInputProps {
  onExtract: (emailText: string) => void;
  isExtracting: boolean;
}

export function EmailInput({ onExtract, isExtracting }: EmailInputProps) {
  const [emailText, setEmailText] = useState('');
  const maxChars = 16000;

  const handleUseSample = () => {
    setEmailText(SAMPLE_EMAILS);
  };

  const handleExtract = () => {
    if (emailText.trim()) {
      onExtract(emailText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor="email-input" className="text-sm font-medium">
          Paste BNPL Payment Emails
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseSample}
          disabled={isExtracting}
        >
          Use Sample Emails
        </Button>
      </div>

      <Textarea
        id="email-input"
        value={emailText}
        onChange={(e) => setEmailText(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Paste your BNPL payment reminder emails here (one or multiple)..."
        className="min-h-[400px] font-mono text-sm"
        aria-label="Paste BNPL payment emails"
        aria-describedby="email-help-text"
        maxLength={maxChars}
      />

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span id="email-help-text">
          Tip: Press Cmd/Ctrl+Enter to extract payments
        </span>
        <span>
          {emailText.length} / {maxChars} characters
        </span>
      </div>

      <Button
        onClick={handleExtract}
        disabled={!emailText.trim() || isExtracting}
        className="w-full"
      >
        {isExtracting ? 'Extracting...' : 'Extract Payments'}
      </Button>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests: `tests/unit/email-extractor.test.ts`

**Coverage:**
- 2 sample emails per provider (12 total)
- Edge cases: multiple dates, unknown provider, missing fields
- Date parsing: all supported formats
- Amount parsing: with/without symbols, commas
- Installment detection: various phrase formats
- Deduplication logic

**Sample Test:**

```typescript
describe('email-extractor', () => {
  describe('extractItemsFromEmails', () => {
    it('extracts Klarna payment from sample email', () => {
      const email = `
        From: Klarna <no-reply@klarna.com>
        Subject: Payment reminder

        Payment 2 of 4: $45.00
        Due date: October 6, 2025
        AutoPay is ON
        Late payment fee: $7.00
      `;

      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        provider: 'Klarna',
        installment_no: 2,
        due_date: '2025-10-06',
        amount: 45,
        currency: 'USD',
        autopay: true,
        late_fee: 7
      });
    });

    it('handles unknown provider gracefully', () => {
      const email = 'Payment due: $50 on 10/6/2025';
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(0);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].reason).toBe('Provider not recognized');
    });

    it('deduplicates identical payments', () => {
      const emails = `
        From: Klarna
        Payment 2 of 4: $45 due Oct 6, 2025

        ---

        From: Klarna
        Payment 2 of 4: $45.00 due October 6, 2025
      `;

      const result = extractItemsFromEmails(emails, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });
  });

  describe('parseDate', () => {
    it('parses ISO format', () => {
      expect(parseDate('2025-10-06', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses US format', () => {
      expect(parseDate('10/6/2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses long format', () => {
      expect(parseDate('October 6, 2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('throws on invalid date', () => {
      expect(() => parseDate('not a date', 'America/New_York')).toThrow();
    });
  });
});
```

---

### Integration Tests: `tests/integration/emails-to-plan.test.ts`

**Coverage:**
- Full flow: paste emails → extract → call API → get results
- Multi-provider sample (5+ emails)
- Verify API request format matches existing schema
- Verify results display correctly

**Sample Test:**

```typescript
describe('Email to Plan Integration', () => {
  it('full flow: paste emails → get action plan', async () => {
    const sampleEmails = SAMPLE_EMAILS; // 5 emails, different providers

    // Step 1: Extract
    const extracted = extractItemsFromEmails(sampleEmails, 'America/New_York');
    expect(extracted.items.length).toBeGreaterThanOrEqual(5);

    // Step 2: Build API request
    const request = {
      items: extracted.items,
      paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
      minBuffer: 100,
      timeZone: 'America/New_York',
      businessDayMode: true,
      country: 'US'
    };

    // Step 3: Call API
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    // Step 4: Verify results
    expect(result.summary).toBeDefined();
    expect(result.actionsThisWeek).toBeInstanceOf(Array);
    expect(result.ics).toBeDefined();
  });
});
```

---

### Test Fixtures: `tests/fixtures/emails/`

**Files:**
- `klarna-1.txt` - Klarna autopay reminder
- `klarna-2.txt` - Klarna manual payment
- `affirm-1.txt` - Affirm installment reminder
- `affirm-2.txt` - Affirm with late fee
- `afterpay-1.txt` - Afterpay autopay
- `afterpay-2.txt` - Afterpay manual
- `paypal-1.txt` - PayPal Pay in 4
- `zip-1.txt` - Zip payment reminder
- `sezzle-1.txt` - Sezzle installment
- `unknown-provider.txt` - Generic payment email
- `multi-date.txt` - Email with multiple dates
- `multi-installment.txt` - Full payment schedule

**Sample Fixture: `klarna-1.txt`**

```
From: Klarna <no-reply@klarna.com>
To: user@example.com
Subject: Payment reminder - $45.00 due Oct 6
Date: Sep 29, 2025 10:30 AM

Hi there,

Your next Klarna payment is coming up.

Payment Details:
- Payment 2 of 4: $45.00
- Due date: October 6, 2025
- AutoPay is ON - we'll charge your Visa ending in 1234 automatically

If you miss this payment, a late fee of $7.00 may apply.

Need help? Contact us at support@klarna.com

Thanks,
The Klarna Team
```

---

## User Experience

### User Flow

```
1. User lands on PayPlan
   ↓
2. Clicks "Emails" tab
   ↓
3. Clicks "Use Sample Emails" (or pastes own emails)
   ↓
4. Reviews extracted payments in preview table
   ↓
5. (Optional) Edits or deletes rows
   ↓
6. Clicks "Build Plan"
   ↓
7. Views action plan + downloads .ics
   ↓
8. Success! (<60 seconds total)
```

---

### Wireframes

**Email Input Tab:**

```
┌─────────────────────────────────────────────────────────┐
│ PayPlan - BNPL Payment Manager                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [CSV] [Emails] ← Active                                 │
│                                                          │
│ Paste BNPL Payment Emails    [Use Sample Emails]        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                       │ │
│ │  From: Klarna <no-reply@klarna.com>                 │ │
│ │  Payment 2 of 4: $45.00                             │ │
│ │  Due: October 6, 2025                               │ │
│ │  AutoPay is ON                                       │ │
│ │                                                       │ │
│ │  ---                                                  │ │
│ │                                                       │ │
│ │  From: Affirm                                         │ │
│ │  Installment 1 of 3: $58.00                          │ │
│ │  Due: 10/10/2025                                     │ │
│ │                                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Tip: Press Cmd/Ctrl+Enter to extract    245 / 16000 chars│
│                                                          │
│                  [Extract Payments]                      │
└─────────────────────────────────────────────────────────┘
```

---

**Preview Table:**

```
┌─────────────────────────────────────────────────────────┐
│ Extracted Payments (5 valid)                            │
│                                    [Copy as CSV]         │
├─────────────────────────────────────────────────────────┤
│ Provider  │ # │ Due Date    │ Amount │ Autopay │ Fee    │
├───────────┼───┼─────────────┼────────┼─────────┼────────┤
│ Klarna    │ 2 │ 2025-10-06  │ $45.00 │   ✓     │ $7.00  │
│ Affirm    │ 1 │ 2025-10-10  │ $58.00 │   ✗     │ $0     │
│ Afterpay  │ 3 │ 2025-10-15  │ $32.50 │   ✓     │ $8.00  │
│ PayPal    │ 2 │ 2025-10-20  │ $25.00 │   ✗     │ $0     │
│ Sezzle    │ 1 │ 2025-10-25  │ $40.00 │   ✓     │ $0     │
└─────────────────────────────────────────────────────────┘

Issues (1)
├─────────────────────────────────────────────────────────┤
│ ⚠️ Email from unknown provider - provider not recognized│
│    "Payment of $30 due Nov 1..."                        │
└─────────────────────────────────────────────────────────┘

                    [Build Plan]
```

---

## Privacy & Security

### Privacy Guarantees

✅ **Client-Side Only:**
- All email parsing happens in browser
- No network calls during extraction
- Pasted text never sent to server
- No tracking or analytics on email content

✅ **No Persistence:**
- No localStorage writes
- No sessionStorage writes
- No cookies set during extraction
- Data cleared when tab closed

✅ **Data Minimization:**
- Only structured payment data sent to API
- Email text discarded after extraction
- No user identification in extracted data

---

### Security Measures

**Input Sanitization:**
```typescript
import DOMPurify from 'dompurify';

function sanitizeEmailText(rawText: string): string {
  // Strip HTML tags if pasted from email client
  return DOMPurify.sanitize(rawText, { ALLOWED_TAGS: [] });
}
```

**Length Limits:**
- Max 16,000 characters per paste
- Max 200 extracted rows
- Prevents DoS via large inputs

**No Code Execution:**
- No `eval()` usage
- No `Function()` constructor
- No dynamic script injection
- Pure data extraction only

---

## Performance

### Performance Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Parse 10 emails | 200ms | 500ms |
| Parse 50 emails | 2000ms | 5000ms |
| Render preview (50 rows) | 100ms | 300ms |
| Total UX (paste → plan) | <60s | <90s |

---

### Optimization Strategies

**Debouncing:**
```typescript
// Debounce extraction to avoid blocking UI
const debouncedExtract = useDebouncedCallback((text: string) => {
  extract(text);
}, 300);
```

**Incremental Rendering:**
```typescript
// Render preview table incrementally for large datasets
const [visibleRows, setVisibleRows] = useState(50);

useEffect(() => {
  if (items.length > visibleRows) {
    const timer = setTimeout(() => {
      setVisibleRows(prev => prev + 50);
    }, 100);
    return () => clearTimeout(timer);
  }
}, [visibleRows, items.length]);
```

**Memoization:**
```typescript
const extractedItems = useMemo(() => {
  return extractItemsFromEmails(emailText, timezone);
}, [emailText, timezone]);
```

---

## Limitations & Future Work

### Known Limitations (v0.1.3)

❌ **Provider Coverage:**
- US providers only (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- International providers not supported
- Niche BNPL providers not detected

❌ **Email Formats:**
- Plain text only (HTML emails may fail)
- Assumes standard reminder format
- Custom/forwarded emails may not parse

❌ **Data Extraction:**
- Single installment per email
- No historical payment tracking
- No total loan amount extraction

❌ **Integration:**
- No email forwarding address
- No browser extension
- Manual copy-paste required

---

### Future Enhancements (v0.2.x+)

**v0.2.0 - HTML Email Support:**
- Parse HTML emails with style stripping
- Extract from email signatures/footers
- Handle formatted tables

**v0.2.1 - International Providers:**
- Klarna EU, UK variants
- Clearpay (UK Afterpay)
- Atome (Singapore)

**v0.2.2 - Browser Extension:**
- Chrome/Firefox extension
- One-click extraction from Gmail/Outlook
- Auto-fill PayPlan with detected payments

**v0.3.0 - Smart Forwarding:**
- PayPlan email address (forward@payplan.app)
- Auto-extract from forwarded emails
- Email notification when plan ready

---

## Success Metrics

### Key Performance Indicators

**Adoption:**
- % of new users using Email tab vs CSV (target: >60%)
- Time from landing to first plan (target: <60s)
- Completion rate for Email flow (target: >80%)

**Quality:**
- Extraction accuracy per provider (target: >95%)
- False positive rate (wrong provider detected) (target: <5%)
- User corrections per extracted row (target: <0.1)

**Engagement:**
- Average emails pasted per session (target: 3-5)
- Return usage of Email tab (target: >70%)

---

## Rollout Plan

### Phase 1: Development (Week 1-2)

- [ ] Implement `email-extractor.ts` core logic
- [ ] Create provider detection patterns
- [ ] Build date/amount parsing utilities
- [ ] Write unit tests (>90% coverage)
- [ ] Create test fixtures (12 sample emails)

### Phase 2: UI Integration (Week 2-3)

- [ ] Add "Emails" tab to existing UI
- [ ] Build EmailInput component
- [ ] Build EmailPreview component
- [ ] Build EmailIssues component
- [ ] Implement "Copy as CSV" export
- [ ] Accessibility audit

### Phase 3: Testing (Week 3-4)

- [ ] Integration tests (emails → API → results)
- [ ] Manual testing with real emails (50+ samples)
- [ ] Performance testing (50 emails in <2s)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (responsive layout)

### Phase 4: Launch (Week 4)

- [ ] Update README with Email parser docs
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Iterate on provider patterns

---

## Dependencies

### No New Dependencies (v0.1.3)

✅ Existing dependencies sufficient:
- **Luxon:** Date parsing and timezone handling
- **Zod:** Schema validation (if needed)
- **React 19:** UI framework
- **TypeScript:** Type safety

---

## Appendix

### Sample Email Templates

See: `tests/fixtures/emails/` for full examples.

**Klarna Template:**
```
From: Klarna <no-reply@klarna.com>
Subject: Payment reminder - $45.00 due Oct 6

Your next Klarna payment is coming up.

Payment 2 of 4: $45.00
Due date: October 6, 2025
AutoPay is ON

Late payment fee: $7.00
```

**Affirm Template:**
```
From: Affirm <notifications@affirm.com>
Subject: Upcoming payment on Oct 10

Your Affirm payment is due soon.

Installment 1 of 3: $58.00
Due: 10/10/2025
Payment method: Bank account
```

---

### Related Documentation

- [Current CSV Input Spec](../bnpl-manager/feature-spec.md)
- [API Contract](../bnpl-manager/contracts/post-plan.yaml)
- [Data Model](../bnpl-manager/data-model.md)
- [Privacy Policy](../../README.md#privacy)

---

### Glossary

**BNPL:** Buy Now Pay Later - financing option splitting purchases into installments

**Installment:** Individual payment in a BNPL plan (e.g., "Payment 2 of 4")

**Autopay:** Automatic payment charging from saved payment method

**Late Fee:** Penalty charged for missed payment

**Provider:** BNPL service (Klarna, Affirm, etc.)

**Extraction:** Process of parsing unstructured email text into structured data

**Deduplication:** Removing duplicate entries (same provider + installment + date)

---

**End of Specification**
