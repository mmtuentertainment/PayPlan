# Data Model: Inbox Paste Phase B

**Feature**: PayPlan v0.1.4 — Inbox Paste Phase B
**Date**: 2025-10-02
**Status**: Design

---

## Overview

This document defines the data structures and entities for Inbox Paste Phase B, extending Phase A's `Item` and `Issue` models to support 4 new BNPL providers (Afterpay, PayPal Pay in 4, Zip, Sezzle) and row-level confidence scoring.

---

## Core Entities

### 1. Payment Item

**Purpose**: Represents a single BNPL installment payment extracted from an email reminder.

**Location**: `frontend/src/lib/email-extractor.ts`

**TypeScript Interface**:
```typescript
export interface Item {
  provider: string;          // Phase B: Add 'Afterpay' | 'PayPal Pay in 4' | 'Zip' | 'Sezzle'
  installment_no: number;    // 1-12 (installment number)
  due_date: string;          // ISO YYYY-MM-DD format
  amount: number;            // USD amount (e.g., 25.00)
  currency: string;          // Always 'USD' in Phase B (US market)
  autopay: boolean;          // true if autopay detected
  late_fee: number;          // Late fee amount (default: 0)
  confidence: number;        // NEW: 0-1 score indicating extraction quality
}
```

**Changes from Phase A**:
- **provider**: Expanded to support 4 new providers (type union extended)
- **confidence**: NEW field (number, 0-1 range)

**Validation Rules**:
- `provider`: Must be one of: 'Klarna', 'Affirm', 'Afterpay', 'PayPal Pay in 4', 'Zip', 'Sezzle'
- `installment_no`: Integer, 1-12 inclusive
- `due_date`: Valid ISO date string (YYYY-MM-DD)
- `amount`: Positive number, >= 0.01
- `currency`: Must be 'USD'
- `autopay`: Boolean
- `late_fee`: Number, >= 0
- `confidence`: Number, 0 <= confidence <= 1

**Deduplication Key**:
```
provider + installment_no + due_date + amount
```
Rationale: Prevents duplicate emails for same payment, but preserves different purchases on same date.

---

### 2. Confidence Score

**Purpose**: Quantifies extraction quality using a weighted sum of matched signals.

**Formula**:
```
confidence = (
  provider_signal * 0.35 +
  date_signal * 0.25 +
  amount_signal * 0.20 +
  installment_signal * 0.15 +
  autopay_signal * 0.05
)
```

**Signal Definitions**:
| Signal | Weight | Condition | Value |
|--------|--------|-----------|-------|
| provider_signal | 0.35 | Provider detected (not 'Unknown') | 1 or 0 |
| date_signal | 0.25 | due_date extracted successfully | 1 or 0 |
| amount_signal | 0.20 | amount extracted successfully | 1 or 0 |
| installment_signal | 0.15 | installment_no extracted (>0) | 1 or 0 |
| autopay_signal | 0.05 | autopay detection completed | 1 or 0 |

**Threshold Mappings**:
| Level | Range | Color | Display Text |
|-------|-------|-------|--------------|
| High | >= 0.8 | Green | "High" |
| Medium | 0.6 - 0.79 | Yellow | "Med" |
| Low | < 0.6 | Red | "Low" |

**Properties**:
- **Deterministic**: Same input always produces same score
- **Fast**: O(1) calculation
- **Transparent**: Weights reflect criticality (provider > date > amount > installment > autopay)

**Location**: Calculated in `frontend/src/lib/email-extractor.ts` within `extractSingleEmail` function

---

### 3. Provider Signature

**Purpose**: Pattern-matching definition for each BNPL provider's email structure.

**Location**: `frontend/src/lib/extraction/providers/detector.ts`

**TypeScript Interface**:
```typescript
export interface ProviderPatterns {
  signatures: (string | RegExp)[];    // Email domain or keyword signatures
  amountPatterns: RegExp[];           // Regex for extracting payment amount
  datePatterns: RegExp[];             // Regex for extracting due date
  installmentPatterns: RegExp[];      // Regex for extracting installment number
}
```

**Provider Type** (Extended from Phase A):
```typescript
export type Provider =
  | 'Klarna'
  | 'Affirm'
  | 'Afterpay'           // NEW
  | 'PayPal Pay in 4'    // NEW
  | 'Zip'                // NEW
  | 'Sezzle'             // NEW
  | 'Unknown';
```

**New Provider Patterns**:

#### Afterpay
```typescript
afterpay: {
  signatures: ['@afterpay.com', /\bafterpay\b/i],
  amountPatterns: [
    /\binstallment\b[:\s]+\$?([\d,]+\.\d{2})\b/i,
    /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
    /\bamount\b[:\s]+\$?([\d,]+\.\d{2})\b/i
  ],
  datePatterns: [
    /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/
  ],
  installmentPatterns: [
    /payment\s+(\d+)\s+of\s+(\d+)/i,
    /installment\s+(\d+)\/(\d+)/i
  ]
}
```

#### PayPal Pay in 4
```typescript
paypal4: {
  signatures: ['@paypal.com', /pay\s+in\s+4/i],
  amountPatterns: [
    /payment\s+amount[:\s]+\$?([\d,]+\.\d{2})\b/i,
    /\$\s?([\d,]+\.\d{2})\s+\bdue\b/i,
    /next\s+payment[:\s]+\$?([\d,]+\.\d{2})\b/i
  ],
  datePatterns: [
    /due[:\s]+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /payment\s+due[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/
  ],
  installmentPatterns: [
    /payment\s+(\d+)\s+of\s+4/i,
    /installment\s+(\d+)\/4/i
  ]
}
```

#### Zip
```typescript
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
}
```

#### Sezzle
```typescript
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
```

---

### 4. Extraction Issue

**Purpose**: User-visible message indicating a problem with extraction (parsing error or low confidence).

**Location**: `frontend/src/lib/email-extractor.ts`

**TypeScript Interface** (Extended from Phase A):
```typescript
export interface Issue {
  id: string;                // Unique identifier for React keys
  snippet: string;           // First 100 chars of problematic email (PII-redacted)
  reason: string;            // Error message (e.g., "Provider not recognized")
  fieldHints?: string[];     // NEW: Specific missing/unclear fields for low-confidence items
}
```

**Changes from Phase A**:
- **fieldHints**: NEW optional field (array of strings)

**Field Hints** (for low-confidence items where confidence < 0.6):
- `"Provider not recognized"` — provider_signal = 0
- `"Due date not found"` — date_signal = 0
- `"Amount not found"` — amount_signal = 0
- `"Installment number unclear"` — installment_signal = 0
- `"Autopay status unclear"` — autopay_signal = 0 (rarely flagged due to low weight)

**PII Redaction**:
All `snippet` and `reason` fields MUST pass through `redactPII()` function (see section 5).

---

### 5. PII Redaction

**Purpose**: Protect user privacy by masking sensitive data in error messages and issue snippets.

**Location**: `frontend/src/lib/extraction/helpers/redaction.ts` (NEW module extracted from Phase A)

**Function Signature**:
```typescript
/**
 * Redacts PII and sensitive financial data from text snippets.
 * Protects: emails, amounts, account numbers, names.
 *
 * @param text - Raw text containing potential PII
 * @returns Redacted text with PII masked
 */
export function redactPII(text: string): string;
```

**Redaction Patterns**:
| Pattern | Replacement | Example |
|---------|-------------|---------|
| Email addresses | `[EMAIL]` | `user@example.com` → `[EMAIL]` |
| Dollar amounts | `[AMOUNT]` | `$25.00` → `[AMOUNT]` |
| Account numbers (4+ digits) | `[ACCOUNT]` | `1234567890` → `[ACCOUNT]` |
| Names (capitalized pairs) | `[NAME]` | `John Doe` → `[NAME]` |

**Regex Implementation**:
```typescript
function redactPII(text: string): string {
  let redacted = text;
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
  redacted = redacted.replace(/\$[\d,]+\.?\d*/g, '[AMOUNT]');
  redacted = redacted.replace(/\b\d{4,}\b/g, '[ACCOUNT]');
  redacted = redacted.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]');
  return redacted;
}
```

---

## Data Flow

### Extraction Pipeline

```
User Paste
    ↓
extractItemsFromEmails(emailText, timezone)
    ↓
[1] sanitizeHtml() — Strip HTML tags via DOMParser
    ↓
[2] splitEmails() — Split on delimiters (---, From:, Subject:)
    ↓
[3] For each email block:
        detectProvider(block)
            ↓
        extractSingleEmail(block, timezone)
            ↓
        Calculate signals:
            - provider_signal
            - date_signal
            - amount_signal
            - installment_signal
            - autopay_signal
            ↓
        Calculate confidence score
            ↓
        Build Item object (with confidence field)
    ↓
[4] deduplicateItems() — Remove duplicates by provider+installment+date+amount
    ↓
[5] Flag low-confidence items (confidence < 0.6) as Issues with fieldHints
    ↓
Return ExtractionResult { items, issues, duplicatesRemoved }
    ↓
Display in EmailPreview.tsx (with confidence pills)
    ↓
Flag low-confidence in EmailIssues.tsx (with field hints)
```

---

## State Transitions

### Confidence Lifecycle

```
Extraction Start
    ↓
All signals default to 0
    ↓
For each extraction step:
    - Provider detected? → provider_signal = 1
    - Date extracted? → date_signal = 1
    - Amount extracted? → amount_signal = 1
    - Installment extracted? → installment_signal = 1
    - Autopay detected? → autopay_signal = 1
    ↓
Calculate weighted confidence
    ↓
Threshold check:
    - >= 0.8 → High (green pill)
    - 0.6-0.79 → Medium (yellow pill)
    - < 0.6 → Low (red pill) + Add to Issues
```

---

## Validation & Constraints

### Input Validation

**extractItemsFromEmails**:
- `emailText.length <= 16000` (prevent abuse)
- `timezone` must be valid IANA timezone string (validated by Luxon)

**Item Fields**:
- `amount >= 0.01` (minimum payment)
- `installment_no` between 1-12 (typical BNPL range)
- `due_date` must parse to valid ISO date
- `confidence` between 0-1 (inclusive)

**Provider Detection**:
- Must match at least one signature (domain or keyword)
- Case-insensitive matching for keywords

---

## Performance Considerations

**Parsing Budget**: 50 emails in < 2 seconds (FR-141)

**Optimization Strategies**:
- Regex patterns pre-compiled in `PROVIDER_PATTERNS`
- Single-pass extraction per email block
- O(1) confidence calculation
- O(n) deduplication with Set-based key lookup

**Measurement**:
- Integration test will measure end-to-end time with 50 fixture emails
- Target: < 2000ms on mid-tier laptop (Intel i5, 8GB RAM)

---

## Backward Compatibility

### Phase A Compatibility

**No Breaking Changes**:
- Existing `Item` interface extended (new `confidence` field)
- Existing providers (Klarna, Affirm) unchanged
- New providers additive only
- Existing extraction functions (extractAmount, extractDueDate, etc.) unchanged
- CSV export extended (confidence as last column), not replaced

**Migration Path**:
- Phase A items without confidence field default to `confidence = 1.0` (backward compat)
- UI gracefully handles missing confidence (displays as "High" if undefined)

---

## Testing Requirements

### Unit Test Coverage

**extraction/providers/detector.ts**:
- [ ] Test Afterpay detection (happy path + edge cases)
- [ ] Test PayPal Pay in 4 detection (happy path + edge cases)
- [ ] Test Zip detection (happy path + edge cases)
- [ ] Test Sezzle detection (happy path + edge cases)
- [ ] Test backward compat with Klarna/Affirm

**email-extractor.ts**:
- [ ] Test confidence calculation with all 5 signals matched (expect 1.0)
- [ ] Test confidence with 4 signals matched (expect 0.95 or 0.8 depending on which missing)
- [ ] Test confidence with 3 signals matched (expect ~0.6-0.75)
- [ ] Test low-confidence item flagged as issue (confidence < 0.6)
- [ ] Test fieldHints populated correctly for missing signals

**redact.ts**:
- [ ] Test email redaction
- [ ] Test amount redaction
- [ ] Test account number redaction
- [ ] Test name redaction
- [ ] Test combined PII in single snippet

### Integration Test Coverage

**End-to-End Flow**:
- [ ] Paste 6 emails (all providers) → Extract >= 5 items with confidence
- [ ] Low-confidence item appears in Issues with field hints
- [ ] CSV export includes confidence column
- [ ] POST /api/plan works with new items (no API changes)
- [ ] Performance: 50 emails < 2s

---

## Summary

This data model extends Phase A's extraction pipeline to support:
1. **4 new providers**: Afterpay, PayPal Pay in 4, Zip, Sezzle
2. **Confidence scoring**: Deterministic weighted formula (0-1 range)
3. **Low-confidence flagging**: Items < 0.6 appear in Issues with field hints
4. **PII redaction**: Standalone module for privacy protection

All changes are **backward compatible** with Phase A. No API changes required.

---

**Next Step**: Phase 1 Contracts (JSON schema, confidence thresholds YAML)
