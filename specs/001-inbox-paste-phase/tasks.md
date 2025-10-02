# Tasks: PayPlan v0.1.4 — Inbox Paste Phase B

**Feature Branch**: `001-inbox-paste-phase`
**Input**: Design documents from `/home/matt/PROJECTS/PayPlan/specs/001-inbox-paste-phase/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md

---

## Overview

This document defines 10 atomic tasks for implementing Inbox Paste Phase B:
- **v0.1.4-a** (T1-T8): Afterpay + confidence engine + UI pills + CSV + low-confidence Issues + tests/docs
- **v0.1.4-b** (T9-T10): PayPal Pay in 4, Zip, Sezzle detectors + tests

**Constraints**:
- Frontend-only (no backend changes)
- No new npm dependencies
- ≤400 LOC net addition
- Client-side extraction only
- JSDoc ≥80% on changed exports

---

## Path Conventions

This is a **web application** with separated frontend and backend:
- Frontend: `/home/matt/PROJECTS/PayPlan/frontend/src/`
- Tests: `/home/matt/PROJECTS/PayPlan/frontend/tests/` (unit/integration)
- Backend: **UNCHANGED** (no tasks modify backend)

---

## Phase v0.1.4-a: Afterpay + Confidence Engine

### T1: Extract PII Redaction to Standalone Module

**Description**: Extract existing `redactPII()` function from `email-extractor.ts` into a new standalone module `redact.ts` with unit tests. This enables reuse in `EmailIssues.tsx` and enforces DRY.

**Status**: ⏳ Not Started

**Files to Modify**:
- ✏️ Create: `frontend/src/lib/redact.ts`
- ✏️ Modify: `frontend/src/lib/email-extractor.ts` (remove `redactPII`, import from redact.ts)
- ✏️ Create: `frontend/tests/unit/redact.test.ts`

**Acceptance Criteria**:
- [x] `redactPII()` exported from `frontend/src/lib/redact.ts`
- [x] Email addresses replaced with `[EMAIL]`
- [x] Dollar amounts replaced with `[AMOUNT]`
- [x] Account numbers (4+ digits) replaced with `[ACCOUNT]`
- [x] Names (capitalized pairs) replaced with `[NAME]`
- [x] Unit tests cover all 4 redaction patterns + combined PII
- [x] `email-extractor.ts` imports and uses `redactPII` from `redact.ts`
- [x] JSDoc on `redactPII()` with @param, @returns, @example

**Code Stub** (`frontend/src/lib/redact.ts`):
```typescript
/**
 * Redacts PII and sensitive financial data from text snippets.
 * Protects: emails, amounts, account numbers, names.
 *
 * @param text - Raw text containing potential PII
 * @returns Redacted text with PII masked
 * @example
 * redactPII("From: user@example.com, Payment: $25.00")
 * // Returns: "From: [EMAIL], Payment: [AMOUNT]"
 */
export function redactPII(text: string): string {
  let redacted = text;

  // Redact email addresses
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');

  // Redact dollar amounts
  redacted = redacted.replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]');

  // Redact account numbers (4+ digits)
  redacted = redacted.replace(/\b\d{4,}\b/g, '[ACCOUNT]');

  // Redact names (capitalized first/last name pairs)
  redacted = redacted.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');

  return redacted;
}
```

**Unit Tests** (`frontend/tests/unit/redact.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { redactPII } from '../../src/lib/redact';

describe('redactPII', () => {
  test('redacts email addresses', () => {
    expect(redactPII('user@example.com')).toBe('[EMAIL]');
    expect(redactPII('Contact: john.doe@company.org')).toBe('Contact: [EMAIL]');
  });

  test('redacts dollar amounts', () => {
    expect(redactPII('Payment: $25.00')).toBe('Payment: [AMOUNT]');
    expect(redactPII('$1,234.56 due')).toBe('[AMOUNT] due');
    expect(redactPII('$999')).toBe('[AMOUNT]');
  });

  test('redacts account numbers', () => {
    expect(redactPII('Account: 1234567890')).toBe('Account: [ACCOUNT]');
    expect(redactPII('Card ending in 4567')).toBe('Card ending in [ACCOUNT]');
  });

  test('redacts names', () => {
    expect(redactPII('Dear John Doe,')).toBe('Dear [NAME],');
    expect(redactPII('From: Jane Smith')).toBe('From: [NAME]');
  });

  test('redacts combined PII', () => {
    const input = 'From: john.doe@example.com, Payment: $25.00, Account: 123456';
    const expected = 'From: [EMAIL], Payment: [AMOUNT], Account: [ACCOUNT]';
    expect(redactPII(input)).toBe(expected);
  });
});
```

**CLI Commands**:
```bash
# Run tests (should pass)
cd frontend
npm test -- redact.test.ts

# Verify JSDoc coverage
npx typedoc --entryPoints src/lib/redact.ts --out docs/redact --excludePrivate
```

**Verification Steps**:
1. Tests pass: `npm test -- redact.test.ts`
2. `email-extractor.ts` imports `redactPII` correctly
3. No regressions in existing extraction tests
4. JSDoc renders correctly in IDE hover

**Definition of Done**:
- [ ] `redact.ts` created with `redactPII()` function
- [ ] 5 unit tests pass (email, amount, account, name, combined)
- [ ] `email-extractor.ts` imports and uses `redactPII` from `redact.ts`
- [ ] JSDoc complete with @param, @returns, @example
- [ ] No lint errors
- [ ] Git commit: `feat: Extract PII redaction to standalone module`

**Estimated LOC**: +40 (redact.ts: ~30, tests: ~50, email-extractor.ts: -10)

---

### T2: Add Confidence Scoring to Email Extractor

**Description**: Extend `email-extractor.ts` to calculate a confidence score (0-1) for each extracted `Item` using the weighted signal formula. Add `confidence` field to `Item` interface and implement `calculateConfidence()` function.

**Status**: ⏳ Not Started
**Depends On**: T1 (for PII redaction in Issues)

**Files to Modify**:
- ✏️ Modify: `frontend/src/lib/email-extractor.ts`
- ✏️ Create: `frontend/tests/unit/confidence.test.ts`

**Acceptance Criteria**:
- [x] `Item` interface has `confidence: number` field
- [x] `calculateConfidence()` function uses weighted formula: provider(0.35) + date(0.25) + amount(0.20) + installment(0.15) + autopay(0.05)
- [x] Each extracted item has confidence score computed
- [x] Unit tests validate 7 scenarios from `contracts/confidence-thresholds.yaml`
- [x] JSDoc on `calculateConfidence()` with formula explanation

**Code Stub** (`frontend/src/lib/email-extractor.ts`):
```typescript
// Add to Item interface
export interface Item {
  provider: string;
  installment_no: number;
  due_date: string;
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
  confidence: number; // NEW: 0-1 confidence score
}

/**
 * Calculates extraction confidence score using weighted signal sum.
 *
 * Formula: provider(0.35) + date(0.25) + amount(0.20) + installment(0.15) + autopay(0.05)
 *
 * @param signals - Object with boolean flags for each signal
 * @returns Confidence score between 0 and 1
 * @example
 * calculateConfidence({ provider: true, date: true, amount: true, installment: true, autopay: true })
 * // Returns: 1.0
 */
export function calculateConfidence(signals: {
  provider: boolean;
  date: boolean;
  amount: boolean;
  installment: boolean;
  autopay: boolean;
}): number {
  return (
    (signals.provider ? 0.35 : 0) +
    (signals.date ? 0.25 : 0) +
    (signals.amount ? 0.20 : 0) +
    (signals.installment ? 0.15 : 0) +
    (signals.autopay ? 0.05 : 0)
  );
}

// Modify extractSingleEmail to compute confidence
function extractSingleEmail(emailText: string, timezone: string): Item {
  const provider = detectProvider(emailText);

  if (provider === 'Unknown') {
    throw new Error('Provider not recognized');
  }

  const patterns = PROVIDER_PATTERNS[provider.toLowerCase()];

  // Track signals for confidence calculation
  let amount: number | undefined;
  let dueDate: string | undefined;
  let installmentNo: number | undefined;
  let autopay: boolean | undefined;
  let lateFee: number | undefined;
  const errors: string[] = [];

  try {
    amount = extractAmount(emailText, patterns.amountPatterns);
  } catch (e) {
    errors.push(`Amount: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    dueDate = extractDueDate(emailText, patterns.datePatterns, timezone);
  } catch (e) {
    errors.push(`Due date: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    installmentNo = extractInstallmentNumber(emailText, patterns.installmentPatterns);
  } catch (e) {
    errors.push(`Installment: ${e instanceof Error ? e.message : 'not found'}`);
  }

  try {
    autopay = detectAutopay(emailText);
  } catch (e) {
    errors.push(`Autopay: ${e instanceof Error ? e.message : 'detection failed'}`);
  }

  try {
    lateFee = extractLateFee(emailText);
  } catch (e) {
    // Late fee is optional, don't add to errors
    lateFee = 0;
  }

  // If critical fields failed, throw aggregated error
  if (errors.length > 0) {
    throw new Error(`Failed to extract: ${errors.join(', ')}`);
  }

  // Calculate confidence based on successful extractions
  const confidence = calculateConfidence({
    provider: provider !== 'Unknown',
    date: !!dueDate,
    amount: !!amount,
    installment: !!installmentNo && installmentNo > 0,
    autopay: autopay !== undefined
  });

  return {
    provider,
    installment_no: installmentNo!,
    due_date: dueDate!,
    amount: amount!,
    currency: extractCurrency(emailText),
    autopay: autopay!,
    late_fee: lateFee!,
    confidence // NEW
  };
}
```

**Unit Tests** (`frontend/tests/unit/confidence.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { calculateConfidence } from '../../src/lib/email-extractor';

describe('calculateConfidence', () => {
  test('all signals matched → 1.0 (High)', () => {
    const confidence = calculateConfidence({
      provider: true, date: true, amount: true, installment: true, autopay: true
    });
    expect(confidence).toBe(1.0);
  });

  test('autopay missing → 0.95 (High)', () => {
    const confidence = calculateConfidence({
      provider: true, date: true, amount: true, installment: true, autopay: false
    });
    expect(confidence).toBe(0.95);
  });

  test('installment + autopay missing → 0.8 (High boundary)', () => {
    const confidence = calculateConfidence({
      provider: true, date: true, amount: true, installment: false, autopay: false
    });
    expect(confidence).toBe(0.8);
  });

  test('amount missing → 0.75 (Med)', () => {
    const confidence = calculateConfidence({
      provider: true, date: true, amount: false, installment: true, autopay: true
    });
    expect(confidence).toBe(0.75);
  });

  test('only provider + date → 0.6 (Med boundary)', () => {
    const confidence = calculateConfidence({
      provider: true, date: true, amount: false, installment: false, autopay: false
    });
    expect(confidence).toBe(0.6);
  });

  test('only provider → 0.35 (Low)', () => {
    const confidence = calculateConfidence({
      provider: true, date: false, amount: false, installment: false, autopay: false
    });
    expect(confidence).toBe(0.35);
  });

  test('no signals → 0.0 (Low)', () => {
    const confidence = calculateConfidence({
      provider: false, date: false, amount: false, installment: false, autopay: false
    });
    expect(confidence).toBe(0.0);
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- confidence.test.ts
npm run build
```

**Verification Steps**:
1. All 7 unit tests pass
2. Existing extraction tests still pass (backward compat)
3. Build succeeds with no type errors

**Definition of Done**:
- [ ] `Item.confidence` field added
- [ ] `calculateConfidence()` function implemented
- [ ] 7 unit tests pass (matching `confidence-thresholds.yaml`)
- [ ] JSDoc complete with formula and example
- [ ] No regressions in existing tests
- [ ] Git commit: `feat: Add confidence scoring to email extractor`

**Estimated LOC**: +50 (calculateConfidence: ~15, extractSingleEmail mods: ~20, tests: ~50)

---

### T3: Add Afterpay Provider Detector

**Description**: Extend `provider-detectors.ts` to support Afterpay emails. Add `'Afterpay'` to `Provider` type union and add `afterpay` entry to `PROVIDER_PATTERNS` with email domain and keyword signatures.

**Status**: ⏳ Not Started
**Depends On**: T2 (confidence engine must exist for integration)

**Files to Modify**:
- ✏️ Modify: `frontend/src/lib/provider-detectors.ts`
- ✏️ Create: `frontend/tests/unit/afterpay-detector.test.ts`
- ✏️ Create: `frontend/tests/fixtures/emails/afterpay-payment1.txt`
- ✏️ Create: `frontend/tests/fixtures/emails/afterpay-payment2.txt`

**Acceptance Criteria**:
- [x] `Provider` type includes `'Afterpay'`
- [x] `PROVIDER_PATTERNS.afterpay` defined with signatures, amount/date/installment patterns
- [x] `detectProvider()` returns `'Afterpay'` for Afterpay emails
- [x] 2 realistic fixture emails created (1 autopay, 1 with late fee)
- [x] Unit tests cover happy path + edge cases (HTML, text, missing fields)
- [x] JSDoc updated on `Provider` type

**Code Stub** (`frontend/src/lib/provider-detectors.ts`):
```typescript
// Extend Provider type
export type Provider =
  | 'Klarna'
  | 'Affirm'
  | 'Afterpay' // NEW
  | 'Unknown';

// Add to PROVIDER_PATTERNS
export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  // ... existing klarna, affirm ...

  afterpay: {
    signatures: ['@afterpay.com', /\bafterpay\b/i],
    amountPatterns: [
      /\binstallment\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /\bamount\s+due\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
      // Fallback: allow 0-2 decimals
      /\binstallment\b[:\s]+\$?([\d,]+\.?\d{0,2})\b/i
    ],
    datePatterns: [
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /due\s+date[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /installment\s+(\d+)\/(\d+)/i,
      /final\s+payment/i // implies last installment
    ]
  }
};

// Update detectProvider to check afterpay
export function detectProvider(emailText: string): Provider {
  const matchesSignature = (text: string, sig: string | RegExp): boolean => {
    if (typeof sig === 'string') {
      return text.includes(sig);
    }
    return sig.test(text);
  };

  const lower = emailText.toLowerCase();

  if (PROVIDER_PATTERNS.klarna.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Klarna';
  }

  if (PROVIDER_PATTERNS.affirm.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Affirm';
  }

  // NEW: Afterpay detection
  if (PROVIDER_PATTERNS.afterpay.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Afterpay';
  }

  return 'Unknown';
}
```

**Test Fixture** (`frontend/tests/fixtures/emails/afterpay-payment1.txt`):
```
From: payments@afterpay.com
Subject: Payment Reminder
Date: Mon, 30 Sep 2025 10:00:00 -0400

Hi there,

Your Afterpay installment of $25.00 is due on October 6, 2025.
Payment 1 of 4. AutoPay is OFF. Late fee: $7.00.

Pay now: https://afterpay.com/pay

Thanks,
Afterpay
```

**Unit Tests** (`frontend/tests/unit/afterpay-detector.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, detectAutopay, extractLateFee, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

describe('Afterpay detector', () => {
  test('detects Afterpay from email domain', () => {
    expect(detectProvider('From: payments@afterpay.com')).toBe('Afterpay');
  });

  test('detects Afterpay from keyword', () => {
    expect(detectProvider('Your Afterpay payment is due')).toBe('Afterpay');
  });

  test('extracts amount from Afterpay email', () => {
    const text = 'Installment: $25.00 due';
    const amount = extractAmount(text, PROVIDER_PATTERNS.afterpay.amountPatterns);
    expect(amount).toBe(25.00);
  });

  test('extracts due date from Afterpay email', () => {
    const text = 'Due: October 6, 2025';
    const date = extractDueDate(text, PROVIDER_PATTERNS.afterpay.datePatterns, 'America/New_York');
    expect(date).toBe('2025-10-06');
  });

  test('extracts installment number', () => {
    const text = 'Payment 1 of 4';
    const num = extractInstallmentNumber(text, PROVIDER_PATTERNS.afterpay.installmentPatterns);
    expect(num).toBe(1);
  });

  test('detects autopay OFF', () => {
    const text = 'AutoPay is OFF';
    expect(detectAutopay(text)).toBe(false);
  });

  test('extracts late fee', () => {
    const text = 'Late fee: $7.00';
    expect(extractLateFee(text)).toBe(7.00);
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- afterpay-detector.test.ts
npm run build
```

**Verification Steps**:
1. All Afterpay tests pass
2. Existing Klarna/Affirm tests still pass (no regressions)
3. `detectProvider()` correctly identifies Afterpay emails

**Definition of Done**:
- [ ] `Provider` type includes `'Afterpay'`
- [ ] `PROVIDER_PATTERNS.afterpay` defined
- [ ] 2 fixture emails created
- [ ] 7 unit tests pass (detection, amount, date, installment, autopay, late fee, edge cases)
- [ ] No regressions in existing provider tests
- [ ] Git commit: `feat: Add Afterpay provider detector`

**Estimated LOC**: +40 (patterns: ~20, tests: ~50, fixtures: ~30 chars each)

---

### T4: Add Confidence Pills to EmailPreview UI

**Description**: Update `EmailPreview.tsx` to display confidence pills (High/Med/Low) for each extracted item. Add confidence column to CSV export as last field.

**Status**: ⏳ Not Started
**Depends On**: T2 (Item.confidence must exist)

**Files to Modify**:
- ✏️ Modify: `frontend/src/components/EmailPreview.tsx`
- ✏️ Modify: `frontend/src/lib/csv.ts` (if separate CSV logic exists, otherwise inline)
- ✏️ Create: `frontend/tests/unit/EmailPreview.test.tsx`

**Acceptance Criteria**:
- [x] Confidence pill column added to preview table after provider column
- [x] Pills color-coded: Green (High ≥0.8), Yellow (Med 0.6-0.79), Red (Low <0.6)
- [x] Pills have text alternatives (`aria-label="Extraction confidence: High"`)
- [x] CSV export includes `confidence` as last column
- [x] Unit tests verify pill rendering for all 3 levels
- [x] Existing table functionality unchanged (backward compat)

**Code Stub** (`frontend/src/components/EmailPreview.tsx`):
```typescript
import React from 'react';
import { Item } from '../lib/email-extractor';

interface ConfidencePillProps {
  confidence: number;
}

/**
 * Displays confidence level as color-coded pill.
 * High ≥0.8 (green), Med 0.6-0.79 (yellow), Low <0.6 (red).
 */
function ConfidencePill({ confidence }: ConfidencePillProps) {
  let level: 'High' | 'Med' | 'Low';
  let colorClass: string;

  if (confidence >= 0.8) {
    level = 'High';
    colorClass = 'bg-green-100 text-green-800';
  } else if (confidence >= 0.6) {
    level = 'Med';
    colorClass = 'bg-yellow-100 text-yellow-800';
  } else {
    level = 'Low';
    colorClass = 'bg-red-100 text-red-800';
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}
      aria-label={`Extraction confidence: ${level}`}
    >
      {level}
    </span>
  );
}

interface EmailPreviewProps {
  items: Item[];
}

export function EmailPreview({ items }: EmailPreviewProps) {
  const handleCopyCSV = () => {
    const header = 'provider,installment_no,due_date,amount,currency,autopay,late_fee,confidence\n';
    const rows = items.map(item =>
      `${item.provider},${item.installment_no},${item.due_date},${item.amount},${item.currency},${item.autopay},${item.late_fee},${item.confidence.toFixed(2)}`
    ).join('\n');

    navigator.clipboard.writeText(header + rows);
  };

  return (
    <div>
      <button onClick={handleCopyCSV} className="btn">Copy as CSV</button>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Confidence</th> {/* NEW */}
            <th>Installment</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>AutoPay</th>
            <th>Late Fee</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.provider}</td>
              <td><ConfidencePill confidence={item.confidence} /></td> {/* NEW */}
              <td>{item.installment_no}</td>
              <td>{item.due_date}</td>
              <td>${item.amount.toFixed(2)}</td>
              <td>{item.currency}</td>
              <td>{item.autopay ? 'Yes' : 'No'}</td>
              <td>${item.late_fee.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Unit Tests** (`frontend/tests/unit/EmailPreview.test.tsx`):
```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailPreview } from '../../src/components/EmailPreview';

describe('EmailPreview', () => {
  test('displays High confidence pill for confidence ≥ 0.8', () => {
    const items = [{ provider: 'Afterpay', installment_no: 1, due_date: '2025-10-06', amount: 25, currency: 'USD', autopay: false, late_fee: 7, confidence: 1.0 }];
    render(<EmailPreview items={items} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByLabelText('Extraction confidence: High')).toBeInTheDocument();
  });

  test('displays Med confidence pill for confidence 0.6-0.79', () => {
    const items = [{ provider: 'Klarna', installment_no: 2, due_date: '2025-10-10', amount: 50, currency: 'USD', autopay: true, late_fee: 0, confidence: 0.75 }];
    render(<EmailPreview items={items} />);
    expect(screen.getByText('Med')).toBeInTheDocument();
  });

  test('displays Low confidence pill for confidence < 0.6', () => {
    const items = [{ provider: 'Affirm', installment_no: 1, due_date: '2025-10-15', amount: 30, currency: 'USD', autopay: false, late_fee: 0, confidence: 0.35 }];
    render(<EmailPreview items={items} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  test('CSV export includes confidence column', () => {
    const items = [{ provider: 'Afterpay', installment_no: 1, due_date: '2025-10-06', amount: 25, currency: 'USD', autopay: false, late_fee: 7, confidence: 1.0 }];
    render(<EmailPreview items={items} />);

    // Trigger CSV copy and verify clipboard content
    // (requires mocking navigator.clipboard in test setup)
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- EmailPreview.test.tsx
npm run dev # Visual verification
```

**Verification Steps**:
1. Unit tests pass
2. Visual check: confidence pills render with correct colors
3. CSV export contains confidence column
4. Screen reader announces confidence labels

**Definition of Done**:
- [ ] Confidence pill column added to table
- [ ] Pills color-coded correctly (green/yellow/red)
- [ ] Pills have aria-labels
- [ ] CSV export includes confidence as last column
- [ ] 3+ unit tests pass
- [ ] Git commit: `feat: Add confidence pills to EmailPreview UI`

**Estimated LOC**: +60 (ConfidencePill: ~25, CSV mod: ~10, tests: ~40)

---

### T5: Add Low-Confidence Flagging to EmailIssues

**Description**: Update `EmailIssues.tsx` to flag items with confidence <0.6 in the Issues section with field-level hints. Add `aria-live="polite"` for accessibility.

**Status**: ⏳ Not Started
**Depends On**: T1 (redactPII), T2 (confidence scoring)

**Files to Modify**:
- ✏️ Modify: `frontend/src/components/EmailIssues.tsx`
- ✏️ Modify: `frontend/src/lib/email-extractor.ts` (add fieldHints to Issue interface)
- ✏️ Create: `frontend/tests/unit/EmailIssues.test.tsx`

**Acceptance Criteria**:
- [x] `Issue` interface has optional `fieldHints?: string[]`
- [x] Low-confidence items (<0.6) added to Issues with field hints
- [x] Field hints based on missing signals (provider, date, amount, installment)
- [x] Issues section uses `aria-live="polite"` for dynamic updates
- [x] PII redacted in all snippets (using `redactPII` from T1)
- [x] Unit tests verify low-confidence flagging + field hints

**Code Stub** (`frontend/src/lib/email-extractor.ts`):
```typescript
// Extend Issue interface
export interface Issue {
  id: string;
  snippet: string;
  reason: string;
  fieldHints?: string[]; // NEW: Specific missing fields for low-confidence items
}

// Modify extractItemsFromEmails to flag low-confidence items
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  // ... existing extraction logic ...

  const items: Item[] = [];
  const issues: Issue[] = [];

  for (let i = 0; i < emailBlocks.length; i++) {
    const block = emailBlocks[i];
    try {
      const item = extractSingleEmail(block, timezone);
      items.push(item);

      // NEW: Flag low-confidence items
      if (item.confidence < 0.6) {
        const hints: string[] = [];
        if (item.provider === 'Unknown') hints.push('Provider not recognized');
        if (!item.due_date) hints.push('Due date not found');
        if (!item.amount || item.amount === 0) hints.push('Amount not found');
        if (!item.installment_no || item.installment_no === 0) hints.push('Installment number unclear');

        issues.push({
          id: `low-confidence-${Date.now()}-${i}`,
          snippet: redactPII(block.slice(0, 100)),
          reason: `Low confidence (${(item.confidence * 100).toFixed(0)}%)`,
          fieldHints: hints
        });
      }
    } catch (err) {
      // ... existing error handling ...
    }
  }

  // ... deduplicate and return ...
}
```

**Code Stub** (`frontend/src/components/EmailIssues.tsx`):
```typescript
import React from 'react';
import { Issue } from '../lib/email-extractor';

interface EmailIssuesProps {
  issues: Issue[];
}

export function EmailIssues({ issues }: EmailIssuesProps) {
  if (issues.length === 0) return null;

  return (
    <div aria-live="polite" className="issues-section">
      <h3>Issues ({issues.length})</h3>
      <ul>
        {issues.map(issue => (
          <li key={issue.id} className="issue-item">
            <div className="snippet">{issue.snippet}</div>
            <div className="reason">{issue.reason}</div>
            {issue.fieldHints && issue.fieldHints.length > 0 && (
              <ul className="field-hints">
                {issue.fieldHints.map((hint, idx) => (
                  <li key={idx} className="hint">{hint}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Unit Tests** (`frontend/tests/unit/EmailIssues.test.tsx`):
```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailIssues } from '../../src/components/EmailIssues';

describe('EmailIssues', () => {
  test('displays low-confidence issue with field hints', () => {
    const issues = [{
      id: 'issue-1',
      snippet: 'From: [EMAIL]...',
      reason: 'Low confidence (35%)',
      fieldHints: ['Provider not recognized', 'Amount not found']
    }];

    render(<EmailIssues issues={issues} />);
    expect(screen.getByText('Low confidence (35%)')).toBeInTheDocument();
    expect(screen.getByText('Provider not recognized')).toBeInTheDocument();
    expect(screen.getByText('Amount not found')).toBeInTheDocument();
  });

  test('uses aria-live for accessibility', () => {
    const issues = [{ id: 'issue-1', snippet: 'Test', reason: 'Error' }];
    const { container } = render(<EmailIssues issues={issues} />);
    const section = container.querySelector('[aria-live="polite"]');
    expect(section).toBeInTheDocument();
  });

  test('hides section when no issues', () => {
    const { container } = render(<EmailIssues issues={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- EmailIssues.test.tsx
npm run dev # Visual verification
```

**Verification Steps**:
1. Unit tests pass
2. Low-confidence items appear in Issues with field hints
3. Screen reader announces new issues (aria-live)
4. PII redacted in snippets

**Definition of Done**:
- [ ] `Issue.fieldHints` added
- [ ] Low-confidence items flagged in Issues
- [ ] Field hints display correctly
- [ ] aria-live="polite" on Issues section
- [ ] 3+ unit tests pass
- [ ] Git commit: `feat: Add low-confidence flagging to EmailIssues`

**Estimated LOC**: +50 (email-extractor.ts: ~20, EmailIssues.tsx: ~15, tests: ~30)

---

### T6: Unit Tests for Phase A' (Confidence + Afterpay)

**Description**: Write comprehensive unit tests for confidence scoring, Afterpay detector, and PII redaction. Target: 40+ total unit tests across all Phase A' changes.

**Status**: ⏳ Not Started
**Depends On**: T1, T2, T3, T4, T5 (all implementation tasks)

**Files to Modify**:
- ✏️ Verify: `frontend/tests/unit/redact.test.ts` (from T1)
- ✏️ Verify: `frontend/tests/unit/confidence.test.ts` (from T2)
- ✏️ Verify: `frontend/tests/unit/afterpay-detector.test.ts` (from T3)
- ✏️ Verify: `frontend/tests/unit/EmailPreview.test.tsx` (from T4)
- ✏️ Verify: `frontend/tests/unit/EmailIssues.test.tsx` (from T5)
- ✏️ Create: `frontend/tests/unit/email-extractor-integration.test.ts` (end-to-end extraction)

**Acceptance Criteria**:
- [x] All existing unit tests pass (backward compat)
- [x] 40+ unit tests total (5 from T1, 7 from T2, 7 from T3, 3 from T4, 3 from T5, 15+ integration)
- [x] Test coverage ≥80% on changed modules
- [x] All edge cases covered (malformed emails, missing fields, HTML vs text)

**Additional Integration Tests** (`frontend/tests/unit/email-extractor-integration.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';

describe('Email extraction integration', () => {
  test('extracts Afterpay email with high confidence', () => {
    const email = `
      From: payments@afterpay.com
      Installment: $25.00 due on October 6, 2025
      Payment 1 of 4. AutoPay is OFF. Late fee: $7.00
    `;
    const result = extractItemsFromEmails(email, 'America/New_York');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].provider).toBe('Afterpay');
    expect(result.items[0].amount).toBe(25.00);
    expect(result.items[0].confidence).toBe(1.0);
    expect(result.issues).toHaveLength(0);
  });

  test('flags low-confidence item in Issues', () => {
    const email = `
      From: unknown@example.com
      Payment reminder
    `;
    const result = extractItemsFromEmails(email, 'America/New_York');

    expect(result.items).toHaveLength(0);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].reason).toContain('Provider not recognized');
  });

  test('deduplicates identical Afterpay emails', () => {
    const email = `
      From: payments@afterpay.com
      Installment: $25.00 due on October 6, 2025
      Payment 1 of 4.

      ---

      From: payments@afterpay.com
      Installment: $25.00 due on October 6, 2025
      Payment 1 of 4.
    `;
    const result = extractItemsFromEmails(email, 'America/New_York');

    expect(result.items).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(1);
  });

  // ... 12+ more integration tests ...
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- --coverage
# Verify coverage ≥80% on changed files
```

**Verification Steps**:
1. All unit tests pass
2. Coverage report shows ≥80% on redact.ts, email-extractor.ts, provider-detectors.ts
3. No test failures in CI

**Definition of Done**:
- [ ] 40+ unit tests total
- [ ] All tests pass
- [ ] Coverage ≥80% on changed modules
- [ ] Edge cases covered
- [ ] Git commit: `test: Add comprehensive unit tests for Phase A'`

**Estimated LOC**: +200 (integration tests: ~150, edge case tests: ~50)

---

### T7: Integration Test (Email → Preview → CSV → Plan)

**Description**: Write end-to-end integration test that pastes 6 emails (Afterpay, PayPal Pay in 4, Zip, Sezzle, Klarna, Affirm), verifies extraction, CSV export, and plan building. Measure performance (<2s for 50 emails).

**Status**: ⏳ Not Started
**Depends On**: T1-T6 (all Phase A' implementation)

**Files to Modify**:
- ✏️ Create: `frontend/tests/integration/inbox-paste-e2e.test.ts`
- ✏️ Create: `frontend/tests/fixtures/emails/mixed-6-providers.txt`

**Acceptance Criteria**:
- [x] Test pastes 6 emails (1 of each provider)
- [x] Verifies ≥5 items extracted with confidence scores
- [x] Verifies CSV export includes confidence column
- [x] Verifies POST /api/plan works unchanged (mock API)
- [x] Performance test: 50 emails extracted in <2s
- [x] Total E2E time <60s (simulated user flow)

**Test Fixture** (`frontend/tests/fixtures/emails/mixed-6-providers.txt`):
```
From: payments@afterpay.com
Installment: $25.00 due on October 6, 2025. Payment 1 of 4. AutoPay is OFF. Late fee: $7.00.

---

From: service@paypal.com
Your PayPal Pay in 4 payment of $50.00 is due on October 15, 2025. Payment 2 of 4. Automatic payment enabled.

---

From: notifications@zip.co
Payment: $30.00 is due on November 1, 2025. Payment 1 of 4. Auto payment enabled.

---

From: hello@sezzle.com
Installment: $35.00 due on December 5, 2025. Payment 3 of 4. Autopay is on.

---

From: no-reply@klarna.com
Payment: $45.00 due on October 4, 2025. Payment 1 of 4. AutoPay is ON. Late fee: $7.00.

---

From: notifications@affirm.com
Installment: $60.00 due on 10/20/2025. Payment 2 of 4.
```

**Integration Test** (`frontend/tests/integration/inbox-paste-e2e.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import fs from 'fs';
import path from 'path';

describe('Inbox Paste E2E', () => {
  test('extracts 6 providers with confidence scores', () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, '../fixtures/emails/mixed-6-providers.txt'),
      'utf-8'
    );

    const result = extractItemsFromEmails(fixture, 'America/New_York');

    expect(result.items.length).toBeGreaterThanOrEqual(5); // Acceptance: ≥5 valid
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: 'Afterpay', confidence: expect.any(Number) }),
        expect.objectContaining({ provider: 'PayPal Pay in 4', confidence: expect.any(Number) }),
        expect.objectContaining({ provider: 'Zip', confidence: expect.any(Number) }),
        expect.objectContaining({ provider: 'Sezzle', confidence: expect.any(Number) }),
        expect.objectContaining({ provider: 'Klarna', confidence: expect.any(Number) }),
        expect.objectContaining({ provider: 'Affirm', confidence: expect.any(Number) })
      ])
    );
  });

  test('CSV export includes confidence column', () => {
    const items = [
      { provider: 'Afterpay', installment_no: 1, due_date: '2025-10-06', amount: 25, currency: 'USD', autopay: false, late_fee: 7, confidence: 1.0 }
    ];

    const csv = generateCSV(items); // Assuming CSV export function
    expect(csv).toContain('confidence');
    expect(csv).toContain('1.00');
  });

  test('performance: 50 emails in <2s', () => {
    const singleEmail = `From: payments@afterpay.com\nInstallment: $25.00 due on Oct 6, 2025. Payment 1 of 4.`;
    const batch = Array(50).fill(singleEmail).join('\n---\n');

    const start = Date.now();
    const result = extractItemsFromEmails(batch, 'America/New_York');
    const duration = Date.now() - start;

    expect(result.items.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000); // <2s
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- inbox-paste-e2e.test.ts
```

**Verification Steps**:
1. E2E test passes
2. Performance test passes (<2s for 50 emails)
3. CSV export validated
4. API integration (mocked) works

**Definition of Done**:
- [ ] E2E test extracts 6 providers
- [ ] Performance test passes (<2s)
- [ ] CSV export verified
- [ ] Total test time <10s
- [ ] Git commit: `test: Add E2E integration test for Inbox Paste`

**Estimated LOC**: +100 (test: ~80, fixture: ~20)

---

### T8: Documentation & JSDoc (Phase A')

**Description**: Update README.md with new providers and confidence legend. Ensure JSDoc coverage ≥80% on all changed exports. Add inline code comments for complex logic.

**Status**: ⏳ Not Started
**Depends On**: T1-T7 (all implementation and tests)

**Files to Modify**:
- ✏️ Modify: `README.md` (add providers, confidence legend)
- ✏️ Verify JSDoc on: `redact.ts`, `email-extractor.ts`, `provider-detectors.ts`
- ✏️ Create: `docs/confidence-scoring.md` (detailed algorithm explanation)

**Acceptance Criteria**:
- [x] README.md lists 6 supported providers (Klarna, Affirm, Afterpay, PayPal Pay in 4, Zip, Sezzle)
- [x] README.md has confidence legend (High/Med/Low with thresholds)
- [x] JSDoc coverage ≥80% on changed exports (measured via TypeDoc)
- [x] All public functions have @param, @returns, @example
- [x] Complex logic has inline comments

**README Update** (`README.md`):
```markdown
## Inbox Paste Feature

Paste BNPL payment reminder emails to automatically extract payment details.

### Supported Providers

- **Klarna** (@klarna.com)
- **Affirm** (@affirm.com)
- **Afterpay** (@afterpay.com) ✨ NEW
- **PayPal Pay in 4** (@paypal.com) ✨ NEW
- **Zip** (@zip.co, @quadpay.com) ✨ NEW
- **Sezzle** (@sezzle.com) ✨ NEW

### Confidence Scoring

Each extracted payment has a confidence score (0-1) indicating extraction quality:

| Level | Range | Meaning |
|-------|-------|---------|
| **High** | ≥0.8 | All critical fields extracted (provider, date, amount, installment) |
| **Med** | 0.6-0.79 | 3-4 fields extracted; minor gaps |
| **Low** | <0.6 | ≤2 fields extracted; significant gaps; flagged in Issues |

**Formula**: `confidence = provider(0.35) + date(0.25) + amount(0.20) + installment(0.15) + autopay(0.05)`

### Usage

1. Paste emails into the text area
2. Review extracted items with confidence pills
3. Check Issues section for low-confidence items
4. Export to CSV (includes confidence column)
5. Build payment plan

### Performance

- 50 emails parsed in <2 seconds
- Non-blocking UI during extraction
```

**JSDoc Example** (`frontend/src/lib/email-extractor.ts`):
```typescript
/**
 * Main extraction entry point.
 * Extracts payment items from pasted BNPL reminder emails.
 *
 * @param emailText - Raw text from pasted emails (HTML will be sanitized)
 * @param timezone - IANA timezone for date parsing (e.g., "America/New_York")
 * @returns Extraction result with items, issues, duplicate count, and confidence scores
 * @throws Error if input exceeds maximum length (16000 chars)
 * @example
 * const result = extractItemsFromEmails(pastedText, 'America/New_York');
 * console.log(result.items); // [{ provider: 'Afterpay', confidence: 1.0, ... }]
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  // ... implementation ...
}
```

**CLI Commands**:
```bash
cd frontend
npx typedoc --entryPoints src/lib --out docs/api --excludePrivate
# Check coverage ≥80%

npm run lint
npm run build
```

**Verification Steps**:
1. README.md updated with providers and confidence legend
2. TypeDoc generates docs without errors
3. All public exports have JSDoc with @param, @returns
4. Inline comments explain complex confidence logic

**Definition of Done**:
- [ ] README.md updated
- [ ] JSDoc coverage ≥80%
- [ ] All public functions documented
- [ ] Inline comments on complex logic
- [ ] TypeDoc build succeeds
- [ ] Git commit: `docs: Update README and JSDoc for Phase A'`

**Estimated LOC**: +100 (README: ~30, JSDoc: ~50, inline comments: ~20)

---

## Phase v0.1.4-b: PayPal Pay in 4, Zip, Sezzle

### T9: Add PayPal Pay in 4 Provider Detector

**Description**: Extend `provider-detectors.ts` to support PayPal Pay in 4 emails. Add `'PayPal Pay in 4'` to `Provider` type and add `paypal4` entry to `PROVIDER_PATTERNS`.

**Status**: ⏳ Not Started
**Depends On**: T1-T8 (Phase A' complete)

**Files to Modify**:
- ✏️ Modify: `frontend/src/lib/provider-detectors.ts`
- ✏️ Create: `frontend/tests/unit/paypal4-detector.test.ts`
- ✏️ Create: `frontend/tests/fixtures/emails/paypal4-payment1.txt`
- ✏️ Create: `frontend/tests/fixtures/emails/paypal4-payment2.txt`

**Acceptance Criteria**:
- [x] `Provider` type includes `'PayPal Pay in 4'`
- [x] `PROVIDER_PATTERNS.paypal4` defined with "pay in 4" signature
- [x] `detectProvider()` returns `'PayPal Pay in 4'` for PayPal Pay in 4 emails
- [x] 2 realistic fixture emails created (1 first payment, 1 final payment)
- [x] Unit tests cover happy path + edge cases
- [x] JSDoc updated

**Code Stub** (`frontend/src/lib/provider-detectors.ts`):
```typescript
// Extend Provider type
export type Provider =
  | 'Klarna'
  | 'Affirm'
  | 'Afterpay'
  | 'PayPal Pay in 4' // NEW
  | 'Unknown';

// Add to PROVIDER_PATTERNS
export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  // ... existing patterns ...

  paypal4: {
    signatures: ['@paypal.com', /pay\s+in\s+4/i],
    amountPatterns: [
      /payment\s+amount[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /next\s+payment[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\bpayment\b[:\s]+\$?([\d,]+\.?\d{0,2})\b/i
    ],
    datePatterns: [
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /payment\s+due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /due\s+on[:\s]+(\d{4}-\d{2}-\d{2})/i
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+4/i, // Always 4 installments
      /installment\s+(\d+)\/4/i,
      /final\s+installment/i
    ]
  }
};

// Update detectProvider
export function detectProvider(emailText: string): Provider {
  // ... existing logic ...

  // NEW: PayPal Pay in 4 detection (must check for "pay in 4" phrase)
  if (PROVIDER_PATTERNS.paypal4.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'PayPal Pay in 4';
  }

  return 'Unknown';
}
```

**Test Fixture** (`frontend/tests/fixtures/emails/paypal4-payment1.txt`):
```
From: service@paypal.com
Subject: PayPal Pay in 4 Payment Reminder

Hi,

Your PayPal Pay in 4 payment of $50.00 is due on October 15, 2025.
Payment 2 of 4. Automatic payment enabled.

Manage payments: https://paypal.com/pay-in-4

Thanks,
PayPal
```

**Unit Tests** (`frontend/tests/unit/paypal4-detector.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

describe('PayPal Pay in 4 detector', () => {
  test('detects PayPal Pay in 4 from phrase', () => {
    expect(detectProvider('Your PayPal Pay in 4 payment')).toBe('PayPal Pay in 4');
  });

  test('extracts amount', () => {
    const text = 'Payment amount: $50.00';
    const amount = extractAmount(text, PROVIDER_PATTERNS.paypal4.amountPatterns);
    expect(amount).toBe(50.00);
  });

  test('extracts due date', () => {
    const text = 'Due: October 15, 2025';
    const date = extractDueDate(text, PROVIDER_PATTERNS.paypal4.datePatterns, 'America/New_York');
    expect(date).toBe('2025-10-15');
  });

  test('extracts installment number (always /4)', () => {
    const text = 'Payment 2 of 4';
    const num = extractInstallmentNumber(text, PROVIDER_PATTERNS.paypal4.installmentPatterns);
    expect(num).toBe(2);
  });

  test('detects autopay enabled', () => {
    const text = 'Automatic payment enabled';
    expect(detectAutopay(text)).toBe(true);
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- paypal4-detector.test.ts
npm run build
```

**Verification Steps**:
1. All PayPal Pay in 4 tests pass
2. No regressions in existing provider tests
3. `detectProvider()` correctly identifies PayPal Pay in 4 emails

**Definition of Done**:
- [ ] `Provider` type includes `'PayPal Pay in 4'`
- [ ] `PROVIDER_PATTERNS.paypal4` defined
- [ ] 2 fixture emails created
- [ ] 5+ unit tests pass
- [ ] No regressions
- [ ] Git commit: `feat: Add PayPal Pay in 4 provider detector`

**Estimated LOC**: +40 (patterns: ~20, tests: ~40, fixtures: ~30 chars each)

---

### T10: Add Zip & Sezzle Provider Detectors

**Description**: Extend `provider-detectors.ts` to support Zip and Sezzle emails. Add both to `Provider` type and add entries to `PROVIDER_PATTERNS`.

**Status**: ⏳ Not Started
**Depends On**: T9 (PayPal Pay in 4 complete)

**Files to Modify**:
- ✏️ Modify: `frontend/src/lib/provider-detectors.ts`
- ✏️ Create: `frontend/tests/unit/zip-detector.test.ts`
- ✏️ Create: `frontend/tests/unit/sezzle-detector.test.ts`
- ✏️ Create: `frontend/tests/fixtures/emails/zip-payment1.txt`
- ✏️ Create: `frontend/tests/fixtures/emails/sezzle-payment1.txt`

**Acceptance Criteria**:
- [x] `Provider` type includes `'Zip'` and `'Sezzle'`
- [x] `PROVIDER_PATTERNS.zip` and `PROVIDER_PATTERNS.sezzle` defined
- [x] `detectProvider()` returns correct provider for Zip/Sezzle emails
- [x] 2 realistic fixture emails created (1 each)
- [x] Unit tests cover happy path + edge cases for both
- [x] JSDoc updated
- [x] Final README update with all 6 providers

**Code Stub** (`frontend/src/lib/provider-detectors.ts`):
```typescript
// Final Provider type
export type Provider =
  | 'Klarna'
  | 'Affirm'
  | 'Afterpay'
  | 'PayPal Pay in 4'
  | 'Zip' // NEW
  | 'Sezzle' // NEW
  | 'Unknown';

// Add to PROVIDER_PATTERNS
export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  // ... existing patterns ...

  zip: {
    signatures: ['@zip.co', '@quadpay.com', /\bzip\b/i, /\bquadpay\b/i],
    amountPatterns: [
      /payment[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+is\s+due/i,
      /amount[:\s]+\$?([\d,]+\.\d{2})\b/i
    ],
    datePatterns: [
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /payment\s+date[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /installment\s+(\d+)\/(\d+)/i
    ]
  },

  sezzle: {
    signatures: ['@sezzle.com', /\bsezzle\b/i],
    amountPatterns: [
      /payment\s+amount[:\s]+\$?([\d,]+\.\d{2})\b/i,
      /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
      /installment[:\s]+\$?([\d,]+\.\d{2})\b/i
    ],
    datePatterns: [
      /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /payment\s+due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /installment\s+(\d+)\/(\d+)/i
    ]
  }
};

// Update detectProvider (order matters - check new providers)
export function detectProvider(emailText: string): Provider {
  const lower = emailText.toLowerCase();

  if (PROVIDER_PATTERNS.klarna.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Klarna';
  }

  if (PROVIDER_PATTERNS.affirm.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Affirm';
  }

  if (PROVIDER_PATTERNS.afterpay.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Afterpay';
  }

  if (PROVIDER_PATTERNS.paypal4.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'PayPal Pay in 4';
  }

  // NEW: Zip detection
  if (PROVIDER_PATTERNS.zip.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Zip';
  }

  // NEW: Sezzle detection
  if (PROVIDER_PATTERNS.sezzle.signatures.some(sig => matchesSignature(lower, sig))) {
    return 'Sezzle';
  }

  return 'Unknown';
}
```

**Unit Tests** (`frontend/tests/unit/zip-detector.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

describe('Zip detector', () => {
  test('detects Zip from domain', () => {
    expect(detectProvider('From: notifications@zip.co')).toBe('Zip');
  });

  test('detects Zip from keyword', () => {
    expect(detectProvider('Your Zip payment is due')).toBe('Zip');
  });

  test('extracts amount', () => {
    const text = 'Payment: $30.00 is due';
    const amount = extractAmount(text, PROVIDER_PATTERNS.zip.amountPatterns);
    expect(amount).toBe(30.00);
  });

  test('extracts due date', () => {
    const text = 'Due: November 1, 2025';
    const date = extractDueDate(text, PROVIDER_PATTERNS.zip.datePatterns, 'America/New_York');
    expect(date).toBe('2025-11-01');
  });

  test('extracts installment number', () => {
    const text = 'Payment 1 of 4';
    const num = extractInstallmentNumber(text, PROVIDER_PATTERNS.zip.installmentPatterns);
    expect(num).toBe(1);
  });
});
```

**Unit Tests** (`frontend/tests/unit/sezzle-detector.test.ts`):
```typescript
import { describe, test, expect } from 'vitest';
import { detectProvider, extractAmount, extractDueDate, extractInstallmentNumber, PROVIDER_PATTERNS } from '../../src/lib/provider-detectors';

describe('Sezzle detector', () => {
  test('detects Sezzle from domain', () => {
    expect(detectProvider('From: hello@sezzle.com')).toBe('Sezzle');
  });

  test('detects Sezzle from keyword', () => {
    expect(detectProvider('Your Sezzle installment is due')).toBe('Sezzle');
  });

  test('extracts amount', () => {
    const text = 'Installment: $35.00 due';
    const amount = extractAmount(text, PROVIDER_PATTERNS.sezzle.amountPatterns);
    expect(amount).toBe(35.00);
  });

  test('extracts due date', () => {
    const text = 'Due: December 5, 2025';
    const date = extractDueDate(text, PROVIDER_PATTERNS.sezzle.datePatterns, 'America/New_York');
    expect(date).toBe('2025-12-05');
  });

  test('extracts installment number', () => {
    const text = 'Payment 3 of 4';
    const num = extractInstallmentNumber(text, PROVIDER_PATTERNS.sezzle.installmentPatterns);
    expect(num).toBe(3);
  });
});
```

**CLI Commands**:
```bash
cd frontend
npm test -- zip-detector.test.ts sezzle-detector.test.ts
npm run build
npm test # Run all tests to ensure no regressions
```

**Verification Steps**:
1. All Zip and Sezzle tests pass
2. No regressions in existing provider tests
3. `detectProvider()` correctly identifies all 6 providers
4. Final integration test passes with all 6 providers

**Definition of Done**:
- [ ] `Provider` type includes `'Zip'` and `'Sezzle'`
- [ ] `PROVIDER_PATTERNS.zip` and `PROVIDER_PATTERNS.sezzle` defined
- [ ] 2 fixture emails created
- [ ] 10+ unit tests pass (5 each for Zip, Sezzle)
- [ ] No regressions
- [ ] Final README update
- [ ] Git commit: `feat: Add Zip and Sezzle provider detectors`

**Estimated LOC**: +80 (patterns: ~40, tests: ~80, fixtures: ~30 chars each)

---

## Task Summary

| Task | Description | LOC | Depends On | Parallel |
|------|-------------|-----|------------|----------|
| T1 | Extract PII redaction to redact.ts | +40 | None | ✅ |
| T2 | Add confidence scoring | +50 | T1 | ✅ |
| T3 | Add Afterpay detector | +40 | T2 | ✅ |
| T4 | Add confidence pills UI | +60 | T2 | ✅ |
| T5 | Add low-confidence flagging | +50 | T1, T2 | ✅ |
| T6 | Unit tests Phase A' | +200 | T1-T5 | ❌ |
| T7 | Integration test E2E | +100 | T1-T6 | ❌ |
| T8 | Docs & JSDoc | +100 | T1-T7 | ❌ |
| T9 | Add PayPal Pay in 4 detector | +40 | T1-T8 | ✅ |
| T10 | Add Zip & Sezzle detectors | +80 | T9 | ✅ |
| **Total** | **All tasks** | **~760 LOC** | | |

**Note**: Estimated LOC includes test code. Net production code ≤400 LOC.

---

## Dependencies

```
T1 (redact.ts) → T2, T5
T2 (confidence) → T3, T4, T5
T1-T5 → T6 (unit tests)
T6 → T7 (integration)
T7 → T8 (docs)
T8 → T9 (PayPal Pay in 4)
T9 → T10 (Zip, Sezzle)
```

---

## Parallel Execution Strategy

**Phase 1 (v0.1.4-a foundation)**:
- T1 (redact.ts) alone (no dependencies)
- Wait for T1 → Launch T2, T3, T4, T5 in parallel

**Phase 2 (v0.1.4-a tests)**:
- T6, T7, T8 sequentially (depend on all prior tasks)

**Phase 3 (v0.1.4-b providers)**:
- T9 alone
- Wait for T9 → Launch T10

**Total Estimated Time** (single developer):
- Phase 1: ~6 hours (T1: 1h, T2-T5: 4-5h parallel)
- Phase 2: ~4 hours (T6: 2h, T7: 1h, T8: 1h)
- Phase 3: ~2 hours (T9: 1h, T10: 1h)
- **Total**: ~12 hours

---

## Validation Checklist

**GATE: All tasks complete when:**

- [ ] All 10 tasks marked complete with DoD checkboxes
- [ ] All unit tests pass (40+ tests)
- [ ] Integration test passes (E2E)
- [ ] Performance test passes (<2s for 50 emails)
- [ ] JSDoc coverage ≥80%
- [ ] No lint errors
- [ ] README.md updated
- [ ] Git commits for each task
- [ ] Frontend builds successfully
- [ ] No regressions in existing functionality
- [ ] QuickStart validation passes (manual testing)

---

**Next Step**: Execute tasks T1-T10 sequentially or in parallel as dependencies allow.
