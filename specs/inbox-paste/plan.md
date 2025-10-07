# Implementation Plan: Inbox Paste (Email/Receipt Parser)

**Version:** v0.1.3-a (Phase A)
**Status:** Ready for Implementation
**Created:** 2025-10-02
**Estimated Effort:** 6-8 hours (~10 tasks × 45min avg)

---

## Overview

**Goal:** Ship client-side email parser for Klarna & Affirm with full extraction pipeline, preview table, and integration with existing `/api/plan` endpoint.

**Scope Constraint:** Phase A only - Klarna & Affirm providers (≤400 LOC total). Additional providers (Afterpay, PayPal, Zip, Sezzle) deferred to Phase B.

**Success Criteria:**
- Paste 5 mixed Klarna/Affirm emails → extract ≥5 valid payments
- Preview table displays extracted data with inline edit/delete
- "Copy as CSV" exports valid CSV to clipboard
- "Build Plan" calls `/api/plan` and displays results
- End-to-end flow completes in <60s
- Zero network calls during extraction
- Accessibility score ≥90 (Lighthouse)

---

## Architecture

### Module Structure

```
frontend/src/
├── lib/
│   ├── email-extractor.ts          # Core orchestrator (now calls extraction/* modules)
│   ├── extraction/
│   │   ├── providers/
│   │   │   └── detector.ts         # Klarna/Affirm regex patterns (80 LOC)
│   │   ├── extractors/
│   │   │   └── date.ts             # Date normalization + validation (60 LOC)
│   │   └── helpers/
│   │       └── (various utilities)
│   └── sample-emails.ts            # Sample data for demo (40 LOC)
├── hooks/
│   └── useEmailExtractor.ts        # React state management (40 LOC)
├── components/
│   ├── EmailInput.tsx              # Textarea + controls (60 LOC)
│   ├── EmailPreview.tsx            # Preview table with edit/delete (80 LOC)
│   └── EmailIssues.tsx             # Validation errors list (40 LOC)
└── App.tsx                         # Wire Emails tab (modify existing)

frontend/tests/
├── unit/
│   ├── email-extractor.test.ts     # Core logic tests
│   ├── provider-detectors.test.ts  # Pattern matching tests
│   └── date-parser.test.ts         # Date normalization tests
├── integration/
│   └── emails-to-plan.test.ts      # E2E flow test
└── fixtures/
    └── emails/
        ├── klarna-1.txt
        ├── klarna-2.txt
        ├── affirm-1.txt
        ├── affirm-2.txt
        ├── multi-date.txt
        └── unknown-provider.txt
```

**Note (2025-10-07)**: As of v0.1.5-a.2, extraction logic has been refactored into modular architecture under `frontend/src/lib/extraction/{providers,extractors,helpers}/`. See `ops/deltas/0013_realignment.md` for full migration details.

**Total Estimated LOC:** ~400

---

## Technical Design

### 1. Core Extractor: `email-extractor.ts`

**Purpose:** Pure functions for parsing email text into structured items.

**Key Functions:**

```typescript
import { DateTime } from 'luxon';

export interface Item {
  provider: string;
  installment_no: number;
  due_date: string; // ISO YYYY-MM-DD
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
}

export interface Issue {
  snippet: string; // First 100 chars of problematic email
  reason: string;
}

export interface ExtractionResult {
  items: Item[];
  issues: Issue[];
  duplicatesRemoved: number;
}

/**
 * Main extraction entry point
 */
export function extractItemsFromEmails(
  emailText: string,
  timezone: string
): ExtractionResult {
  // 1. Sanitize HTML if pasted
  const sanitized = sanitizeHtml(emailText);

  // 2. Split on common delimiters (---, From:, Subject:)
  const emailBlocks = splitEmails(sanitized);

  const items: Item[] = [];
  const issues: Issue[] = [];

  for (const block of emailBlocks) {
    try {
      const item = extractSingleEmail(block, timezone);
      items.push(item);
    } catch (err) {
      issues.push({
        snippet: block.slice(0, 100),
        reason: err.message
      });
    }
  }

  // 3. Deduplicate
  const deduplicated = deduplicateItems(items);

  return {
    items: deduplicated,
    issues,
    duplicatesRemoved: items.length - deduplicated.length
  };
}

function extractSingleEmail(emailText: string, timezone: string): Item {
  const provider = detectProvider(emailText);

  if (provider === 'Unknown') {
    throw new Error('Provider not recognized');
  }

  const patterns = PROVIDER_PATTERNS[provider.toLowerCase()];

  const amount = extractAmount(emailText, patterns.amountPatterns);
  const currency = extractCurrency(emailText);
  const dueDate = extractDueDate(emailText, patterns.datePatterns, timezone);
  const installmentNo = extractInstallmentNumber(emailText, patterns.installmentPatterns);
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

function sanitizeHtml(text: string): string {
  // Use DOMParser to strip HTML tags (no external deps)
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent || text;
}

function splitEmails(text: string): string[] {
  // Split on common delimiters
  const delimiters = /---+|From:|Subject:|_{3,}/gi;
  const blocks = text.split(delimiters)
    .map(b => b.trim())
    .filter(b => b.length > 20); // Ignore tiny fragments

  return blocks.length > 0 ? blocks : [text];
}

function deduplicateItems(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.provider}-${item.installment_no}-${item.due_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

---

### 2. Provider Detection: `extraction/providers/detector.ts`

**Purpose:** Regex patterns for Klarna & Affirm.

```typescript
export type Provider = 'Klarna' | 'Affirm' | 'Unknown';

export interface ProviderPatterns {
  signatures: string[];
  amountPatterns: RegExp[];
  datePatterns: RegExp[];
  installmentPatterns: RegExp[];
}

export const PROVIDER_PATTERNS: Record<string, ProviderPatterns> = {
  klarna: {
    signatures: ['klarna.com', 'klarna', 'from klarna'],
    amountPatterns: [
      /payment[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+due/i,
      /amount[:\s]+\$?([\d,]+\.?\d{0,2})/i
    ],
    datePatterns: [
      /due\s+(?:date)?[:\s]*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/
    ],
    installmentPatterns: [
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/
    ]
  },

  affirm: {
    signatures: ['affirm.com', 'affirm', 'from affirm'],
    amountPatterns: [
      /installment[:\s]+\$?([\d,]+\.?\d{0,2})/i,
      /\$\s?([\d,]+\.?\d{0,2})\s+due/i,
      /amount[:\s]+\$?([\d,]+\.?\d{0,2})/i
    ],
    datePatterns: [
      /due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ],
    installmentPatterns: [
      /installment\s+(\d+)\s+of\s+(\d+)/i,
      /payment\s+(\d+)\s+of\s+(\d+)/i,
      /(\d+)\s*\/\s*(\d+)/
    ]
  }
};

export function detectProvider(emailText: string): Provider {
  const lower = emailText.toLowerCase();

  if (PROVIDER_PATTERNS.klarna.signatures.some(sig => lower.includes(sig))) {
    return 'Klarna';
  }

  if (PROVIDER_PATTERNS.affirm.signatures.some(sig => lower.includes(sig))) {
    return 'Affirm';
  }

  return 'Unknown';
}

export function extractAmount(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  throw new Error('Amount not found or invalid');
}

export function extractCurrency(text: string): string {
  // Simple: if $ symbol present, assume USD
  // Future: detect EUR (€), GBP (£), etc.
  if (text.includes('$') || text.toLowerCase().includes('usd')) {
    return 'USD';
  }
  return 'USD'; // default
}

export function extractInstallmentNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 12) {
        return num;
      }
    }
  }
  return 1; // default to first installment
}

export function detectAutopay(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'autopay is on',
    'autopay enabled',
    'auto-pay',
    'automatic payment',
    'automatically charged',
    'will be charged automatically'
  ];
  return keywords.some(kw => lower.includes(kw));
}

export function extractLateFee(text: string): number {
  const patterns = [
    /late\s+(?:payment\s+)?fee[:\s]+\$?([\d,]+\.?\d{0,2})/i,
    /late\s+charge[:\s]+\$?([\d,]+\.?\d{0,2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const fee = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(fee) && fee >= 0) {
        return fee;
      }
    }
  }
  return 0; // default: no late fee
}

export function extractDueDate(
  text: string,
  patterns: RegExp[],
  timezone: string
): string {
  import { parseDate } from '../extractors/date';

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        return parseDate(match[1], timezone);
      } catch {
        continue;
      }
    }
  }
  throw new Error('Due date not found or invalid');
}
```

---

### 3. Date Parser: `extraction/extractors/date.ts`

**Purpose:** Normalize various date formats using Luxon.

```typescript
import { DateTime } from 'luxon';

/**
 * Parse common date formats to ISO YYYY-MM-DD
 */
export function parseDate(dateStr: string, timezone: string): string {
  const formats = [
    'yyyy-MM-dd',           // 2025-10-06
    'M/d/yyyy',             // 10/6/2025
    'MM/dd/yyyy',           // 10/06/2025
    'MMMM d, yyyy',         // October 6, 2025
    'MMM d, yyyy',          // Oct 6, 2025
    'd MMMM yyyy',          // 6 October 2025
    'd MMM yyyy'            // 6 Oct 2025
  ];

  // Clean input
  const cleaned = dateStr.trim().replace(/st|nd|rd|th/gi, '');

  for (const format of formats) {
    const dt = DateTime.fromFormat(cleaned, format, { zone: timezone });
    if (dt.isValid) {
      // Check if suspicious
      if (isSuspiciousDate(dt.toISODate()!)) {
        throw new Error(`Suspicious date: ${dt.toISODate()} (too far past/future)`);
      }
      return dt.toISODate()!;
    }
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Flag dates >30 days in past or >2 years in future
 */
export function isSuspiciousDate(isoDate: string): boolean {
  const dt = DateTime.fromISO(isoDate);
  const now = DateTime.now();

  const daysDiff = dt.diff(now, 'days').days;

  return daysDiff < -30 || daysDiff > 730;
}
```

---

### 4. React Hook: `useEmailExtractor.ts`

**Purpose:** Manage extraction state with debouncing.

```typescript
import { useState, useCallback } from 'react';
import { extractItemsFromEmails, ExtractionResult, Item } from '../lib/email-extractor';

export function useEmailExtractor(timezone: string) {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editableItems, setEditableItems] = useState<Item[]>([]);

  const extract = useCallback((emailText: string) => {
    if (!emailText.trim()) {
      setResult(null);
      return;
    }

    setIsExtracting(true);

    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      try {
        const extracted = extractItemsFromEmails(emailText, timezone);
        setResult(extracted);
        setEditableItems(extracted.items);
      } catch (err) {
        setResult({
          items: [],
          issues: [{ snippet: '', reason: `Extraction failed: ${err.message}` }],
          duplicatesRemoved: 0
        });
        setEditableItems([]);
      } finally {
        setIsExtracting(false);
      }
    }, 0);
  }, [timezone]);

  const updateItem = useCallback((index: number, updates: Partial<Item>) => {
    setEditableItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  const deleteItem = useCallback((index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setEditableItems([]);
  }, []);

  return {
    result,
    editableItems,
    isExtracting,
    extract,
    updateItem,
    deleteItem,
    clear
  };
}
```

---

### 5. Sample Emails: `sample-emails.ts`

**Purpose:** Demo data for "Use Sample Emails" button.

```typescript
export const SAMPLE_EMAILS = `From: Klarna <no-reply@klarna.com>
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

---

From: Klarna <no-reply@klarna.com>
Subject: Payment due Oct 15

Payment 3 of 4: $45.00
Due: October 15, 2025

---

From: Affirm <notifications@affirm.com>
Subject: Payment reminder

Installment 2 of 3: $58.00
Due date: Nov 6, 2025
AutoPay is enabled

---

From: Klarna <no-reply@klarna.com>
Subject: Final payment reminder

Payment 4 of 4: $45.00
Due: October 24, 2025
Late fee if missed: $7.00
`;
```

---

### 6. UI Components

**EmailInput.tsx:**

```typescript
import React, { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { SAMPLE_EMAILS } from '../lib/sample-emails';

interface EmailInputProps {
  onExtract: (text: string) => void;
  isExtracting: boolean;
}

export function EmailInput({ onExtract, isExtracting }: EmailInputProps) {
  const [text, setText] = useState('');
  const maxChars = 16000;

  const handleUseSample = () => {
    setText(SAMPLE_EMAILS);
  };

  const handleExtract = () => {
    if (text.trim()) {
      onExtract(text);
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
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Paste your BNPL payment reminder emails here..."
        className="min-h-[400px] font-mono text-sm"
        aria-label="Paste BNPL payment emails"
        disabled={isExtracting}
      />

      <div className="flex justify-between text-sm text-gray-500">
        <span>Tip: Press Cmd/Ctrl+Enter to extract</span>
        <span>{text.length} / {maxChars} chars</span>
      </div>

      <Button
        onClick={handleExtract}
        disabled={!text.trim() || isExtracting}
        className="w-full"
      >
        {isExtracting ? 'Extracting...' : 'Extract Payments'}
      </Button>
    </div>
  );
}
```

**EmailPreview.tsx:**

```typescript
import React from 'react';
import { Button } from './ui/button';
import { Item } from '../lib/email-extractor';

interface EmailPreviewProps {
  items: Item[];
  onUpdate: (index: number, updates: Partial<Item>) => void;
  onDelete: (index: number) => void;
  onCopyCSV: () => void;
  onBuildPlan: () => void;
}

export function EmailPreview({ items, onUpdate, onDelete, onCopyCSV, onBuildPlan }: EmailPreviewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No valid payments extracted. Check Issues below.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          Extracted Payments ({items.length})
        </h3>
        <Button variant="outline" size="sm" onClick={onCopyCSV}>
          Copy as CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Provider</th>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Due Date</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Autopay</th>
              <th className="text-left p-2">Late Fee</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{item.provider}</td>
                <td className="p-2">{item.installment_no}</td>
                <td className="p-2">{item.due_date}</td>
                <td className="p-2">${item.amount.toFixed(2)}</td>
                <td className="p-2">{item.autopay ? '✓' : '✗'}</td>
                <td className="p-2">${item.late_fee.toFixed(2)}</td>
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(idx)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={onBuildPlan} className="w-full">
        Build Plan
      </Button>
    </div>
  );
}
```

**EmailIssues.tsx:**

```typescript
import React from 'react';
import { Issue } from '../lib/email-extractor';

interface EmailIssuesProps {
  issues: Issue[];
}

export function EmailIssues({ issues }: EmailIssuesProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6" role="status" aria-live="polite">
      <h3 className="font-medium text-yellow-700 mb-2">
        Issues ({issues.length})
      </h3>
      <div className="space-y-2">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ {issue.reason}
            </p>
            {issue.snippet && (
              <p className="text-xs text-gray-600 mt-1 font-mono">
                "{issue.snippet}..."
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Test Strategy

### Unit Tests

**email-extractor.test.ts (12 tests):**

```typescript
describe('email-extractor', () => {
  describe('extractItemsFromEmails', () => {
    it('extracts Klarna payment with autopay', () => {
      const email = readFixture('klarna-1.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        provider: 'Klarna',
        installment_no: 2,
        due_date: '2025-10-06',
        amount: 45,
        currency: 'USD',
        autopay: true,
        late_fee: 7
      });
    });

    it('extracts Affirm payment without autopay', () => {
      const email = readFixture('affirm-1.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items[0]).toMatchObject({
        provider: 'Affirm',
        installment_no: 1,
        autopay: false,
        late_fee: 0
      });
    });

    it('deduplicates identical payments', () => {
      const emails = readFixture('klarna-1.txt') + '\n---\n' + readFixture('klarna-1.txt');
      const result = extractItemsFromEmails(emails, 'America/New_York');

      expect(result.items).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('handles unknown provider gracefully', () => {
      const email = readFixture('unknown-provider.txt');
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.items).toHaveLength(0);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].reason).toContain('not recognized');
    });

    it('flags suspicious dates', () => {
      const email = 'From: Klarna\nPayment: $45\nDue: January 1, 2030';
      const result = extractItemsFromEmails(email, 'America/New_York');

      expect(result.issues.length).toBeGreaterThan(0);
    });

    // ... 7 more tests for date formats, amounts, installments, etc.
  });
});
```

**Integration Test: emails-to-plan.test.ts:**

```typescript
describe('Emails to Plan Integration', () => {
  it('full flow: paste → extract → build plan', async () => {
    const sampleEmails = SAMPLE_EMAILS;

    // Extract
    const extracted = extractItemsFromEmails(sampleEmails, 'America/New_York');
    expect(extracted.items.length).toBeGreaterThanOrEqual(5);

    // Build request
    const request = {
      items: extracted.items,
      paycheckDates: ['2025-10-01', '2025-10-15', '2025-11-01'],
      minBuffer: 100,
      timeZone: 'America/New_York',
      businessDayMode: true,
      country: 'US'
    };

    // Call API
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.summary).toBeDefined();
    expect(result.actionsThisWeek).toBeInstanceOf(Array);
    expect(result.ics).toBeDefined();
  });
});
```

---

## Implementation Tasks

See [tasks.md](./tasks.md) for detailed task breakdown (10 tasks × ≤45min each).

---

## Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Parse 10 emails | <200ms | 500ms |
| Parse 50 emails | <2s | 5s |
| Render preview (50 rows) | <100ms | 300ms |
| Total UX (paste → plan) | <60s | 90s |

**Optimization:**
- Non-blocking extraction via `setTimeout(fn, 0)`
- Debounced input handling
- Memoized extraction results

---

## Security & Privacy

**Guarantees:**
- ✅ Zero network calls during extraction
- ✅ No localStorage/sessionStorage writes
- ✅ HTML sanitization via DOMParser (no eval/innerHTML)
- ✅ Input length limits (16k chars)
- ✅ No user data sent to server until "Build Plan" clicked

**Sanitization:**
```typescript
function sanitizeHtml(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent || text;
}
```

---

## Accessibility

**Requirements:**
- ✅ Proper `<label for="">` on textarea
- ✅ `aria-live="polite"` on Issues section
- ✅ Keyboard shortcut: Cmd/Ctrl+Enter to extract
- ✅ Focus management: after extract, focus preview or first issue
- ✅ Table has `<caption>` and proper `<th scope="col">`

**Target:** Lighthouse Accessibility Score ≥90

---

## Rollout Checklist

### Pre-Launch
- [ ] All unit tests passing (12 tests)
- [ ] Integration test passing (1 test)
- [ ] Manual testing with 6 fixtures
- [ ] Accessibility audit (Lighthouse)
- [ ] Performance testing (50 emails <2s)

### Launch
- [ ] Merge to main via feature branch
- [ ] Deploy to production
- [ ] Update README "Inbox Paste" section
- [ ] Add CHANGELOG entry

### Post-Launch
- [ ] Monitor error rates (extraction failures)
- [ ] Collect user feedback
- [ ] Plan Phase B (Afterpay, PayPal, Zip, Sezzle)

---

## Deliverables

1. **Code:**
   - `frontend/src/lib/email-extractor.ts` (orchestrator)
   - `frontend/src/lib/extraction/providers/detector.ts`
   - `frontend/src/lib/extraction/extractors/date.ts`
   - `frontend/src/lib/sample-emails.ts`
   - `frontend/src/hooks/useEmailExtractor.ts`
   - `frontend/src/components/EmailInput.tsx`
   - `frontend/src/components/EmailPreview.tsx`
   - `frontend/src/components/EmailIssues.tsx`
   - Modified: `frontend/src/App.tsx` (add Emails tab)

2. **Tests:**
   - `frontend/tests/unit/email-extractor.test.ts`
   - `frontend/tests/unit/provider-detectors.test.ts`
   - `frontend/tests/unit/date-parser.test.ts`
   - `frontend/tests/integration/emails-to-plan.test.ts`
   - `frontend/tests/fixtures/emails/*.txt` (6 files)

3. **Documentation:**
   - Updated `README.md` (Inbox Paste section)
   - `CHANGELOG.md` entry
   - `specs/inbox-paste/plan.md` (this file)
   - `specs/inbox-paste/tasks.md`

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Date parsing fails for edge formats | Medium | Extensive test fixtures; graceful fallback to Issues list |
| HTML emails break extraction | Medium | DOMParser sanitization; test with HTML fixtures |
| Performance on large paste (>50 emails) | Low | Input length limit (16k chars); non-blocking setTimeout |
| Unknown provider false negatives | Low | Clear Issues messaging; manual CSV fallback option |

---

## Future Work (Phase B)

**Deferred to v0.1.3-b:**
- Additional providers: Afterpay, PayPal Pay in 4, Zip, Sezzle
- More date formats (European: DD/MM/YYYY)
- Non-USD currency detection (EUR, GBP, AUD)
- Multi-installment email handling (extract only next payment)
- Browser extension for Gmail/Outlook

---

**End of Plan**
