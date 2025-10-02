# Phase 0: Research — Inbox Paste Phase B

**Date**: 2025-10-02
**Purpose**: Document provider signature research, confidence scoring algorithm, PII redaction patterns, and Phase A extension strategy

---

## 1. Provider Signature Research

### Objective
Research email patterns for 4 new BNPL providers: Afterpay, PayPal Pay in 4, Zip, Sezzle

### Methodology
- Analyze public BNPL provider documentation
- Review sample payment reminder email structures
- Identify unique signatures: email domains, keyword phrases, amount/date/installment patterns

### Findings

#### 1.1 Afterpay

**Email Domain**: `@afterpay.com`
**Keywords**: "afterpay", "pay later", "installment"
**Amount Patterns**:
- "Installment: $25.00"
- "$25.00 due"
- "Amount due: $25.00"

**Date Patterns**:
- "Due: Oct 6, 2025"
- "Due date: 10/06/2025"
- ISO: "2025-10-06"

**Installment Patterns**:
- "Payment 1 of 4"
- "Installment 2/4"
- "Final payment" (implies last installment)

**Autopay Indicators**:
- "AutoPay is ON"
- "Automatic payment enabled"
- "Will be automatically charged"

**Late Fee Patterns**:
- "Late fee: $7.00"
- Default: $0 (if not mentioned)

**Decision**: Add `afterpay` entry to `PROVIDER_PATTERNS` in `provider-detectors.ts` with above patterns.

#### 1.2 PayPal Pay in 4

**Email Domain**: `@paypal.com`
**Keywords**: "pay in 4", "paypal pay later"
**Amount Patterns**:
- "Payment amount: $50.00"
- "$50.00 due"
- "Next payment: $50.00"

**Date Patterns**:
- "Due: October 15, 2025"
- "Payment due: 10/15/2025"
- "Due on 2025-10-15"

**Installment Patterns**:
- "Payment 1 of 4" (always 4 installments)
- "Installment 2/4"
- "Final installment"

**Autopay Indicators**:
- "Automatic payment enabled"
- "Will charge automatically"
- "AutoPay ON"

**Late Fee Patterns**:
- PayPal Pay in 4 typically has $0 late fees (not explicitly stated)
- Default: $0

**Decision**: Add `paypal4` entry to `PROVIDER_PATTERNS` with "pay in 4" signature to distinguish from regular PayPal.

#### 1.3 Zip (formerly Quadpay)

**Email Domain**: `@zip.co` or `@quadpay.com`
**Keywords**: "zip", "quadpay", "pay in 4"
**Amount Patterns**:
- "Payment: $30.00"
- "$30.00 is due"
- "Amount: $30.00"

**Date Patterns**:
- "Due: Nov 1, 2025"
- "Payment date: 11/01/2025"
- "Due on 2025-11-01"

**Installment Patterns**:
- "Payment 1 of 4"
- "Installment 3/4"

**Autopay Indicators**:
- "Auto payment enabled"
- "Will be charged automatically"

**Late Fee Patterns**:
- "Late fee: $5.00"
- Default: $0

**Decision**: Add `zip` entry to `PROVIDER_PATTERNS` with both domain signatures.

#### 1.4 Sezzle

**Email Domain**: `@sezzle.com`
**Keywords**: "sezzle", "pay in 4"
**Amount Patterns**:
- "Payment amount: $35.00"
- "$35.00 due"
- "Installment: $35.00"

**Date Patterns**:
- "Due: December 5, 2025"
- "Payment due: 12/05/2025"
- "Due on 2025-12-05"

**Installment Patterns**:
- "Payment 1 of 4"
- "Installment 2/4"

**Autopay Indicators**:
- "Autopay is on"
- "Automatic payment"

**Late Fee Patterns**:
- "Late fee: $10.00"
- Default: $0

**Decision**: Add `sezzle` entry to `PROVIDER_PATTERNS`.

### Rationale
All 4 providers follow similar email structures to Klarna/Affirm (Phase A), making pattern-based extraction feasible. No ML or complex NLP required.

### Alternatives Considered
- **Machine Learning extraction**: Rejected due to complexity, added dependencies, and lack of training data
- **External email parsing API**: Rejected due to privacy concerns and added network dependencies

---

## 2. Confidence Scoring Algorithm

### Objective
Define a deterministic, lightweight confidence scoring formula to indicate extraction quality.

### Methodology
Extract requirements from FR-136 and design a weighted sum of matched signals.

### Formula

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
- `provider_signal`: 1 if provider detected (not 'Unknown'), else 0
- `date_signal`: 1 if due_date successfully extracted, else 0
- `amount_signal`: 1 if amount successfully extracted, else 0
- `installment_signal`: 1 if installment_no extracted (>0), else 0
- `autopay_signal`: 1 if autopay detection completed, else 0

**Thresholds**:
- **High**: confidence >= 0.8 (all 5 signals matched, or 4 with autopay missing)
- **Medium**: 0.6 <= confidence < 0.8 (3-4 signals matched)
- **Low**: confidence < 0.6 (<=2 signals matched)

### Properties
- **Deterministic**: Same input always produces same score
- **Fast**: O(1) computation after extraction
- **Transparent**: Human-readable weights explain scoring

### Rationale
Weighted sum is simpler than ML, requires no training, and directly maps to extraction success. Provider signature (0.35) weighted highest because it gates all other extractions.

### Alternatives Considered
- **Uniform weights**: Rejected because provider detection is more critical than autopay
- **Bayesian confidence**: Rejected due to complexity and lack of prior data
- **ML-based scoring**: Rejected due to added dependencies and training overhead

---

## 3. PII Redaction Patterns

### Objective
Define regex patterns to redact PII from error snippets and issue messages (FR-139).

### Methodology
Survey OWASP PII guidelines and existing Phase A `redactPII` function in `email-extractor.ts`.

### Patterns

```typescript
// Email addresses
/[\w.-]+@[\w.-]+\.\w+/g → '[EMAIL]'

// Dollar amounts
/\$[\d,]+\.?\d*/g → '[AMOUNT]'

// Account numbers (4+ consecutive digits)
/\b\d{4,}\b/g → '[ACCOUNT]'

// Names (capitalized first/last name pairs)
/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g → '[NAME]'
```

### Extension Strategy
Existing `redactPII` function in `email-extractor.ts:173-189` already implements these patterns. We'll:
1. Extract `redactPII` into a standalone module: `frontend/src/lib/redact.ts`
2. Add unit tests to ensure all patterns work
3. Import and reuse in `email-extractor.ts` and `EmailIssues.tsx`

### Rationale
Reusing existing patterns ensures consistency. Moving to standalone module improves testability and enforces DRY.

### Alternatives Considered
- **Server-side redaction**: Rejected because this is client-only feature
- **More aggressive redaction (all numbers)**: Rejected because it would break issue debugging
- **Named entity recognition (NER)**: Rejected due to added dependencies and complexity

---

## 4. Existing Phase A Architecture Review

### Objective
Understand extension points in Phase A code to ensure backward compatibility (FR-145).

### Files Reviewed

#### 4.1 `frontend/src/lib/provider-detectors.ts`

**Current Structure**:
- `Provider` type: `'Klarna' | 'Affirm' | 'Unknown'`
- `PROVIDER_PATTERNS` record with `klarna` and `affirm` keys
- Helper functions: `extractAmount`, `extractDueDate`, `extractInstallmentNumber`, `detectAutopay`, `extractLateFee`

**Extension Strategy**:
1. Update `Provider` type to include new providers:
   ```typescript
   export type Provider = 'Klarna' | 'Affirm' | 'Afterpay' | 'PayPal Pay in 4' | 'Zip' | 'Sezzle' | 'Unknown';
   ```
2. Add 4 new entries to `PROVIDER_PATTERNS`:
   ```typescript
   afterpay: { signatures, amountPatterns, datePatterns, installmentPatterns }
   paypal4: { ... }
   zip: { ... }
   sezzle: { ... }
   ```
3. Update `detectProvider` logic to check new signatures

**Backward Compatibility**: Existing Klarna/Affirm patterns unchanged; new providers only add, never modify.

#### 4.2 `frontend/src/lib/email-extractor.ts`

**Current Structure**:
- `Item` interface: `provider, installment_no, due_date, amount, currency, autopay, late_fee`
- `extractItemsFromEmails` function: main entry point
- `extractSingleEmail`: per-email extraction logic
- `redactPII`: PII redaction (lines 173-189)

**Extension Strategy**:
1. Add `confidence` field to `Item` interface:
   ```typescript
   export interface Item {
     provider: string;
     installment_no: number;
     due_date: string;
     amount: number;
     currency: string;
     autopay: boolean;
     late_fee: number;
     confidence: number; // NEW
   }
   ```
2. Modify `extractSingleEmail` to compute confidence score after extraction:
   ```typescript
   const confidence = calculateConfidence({
     provider: provider !== 'Unknown',
     date: !!dueDate,
     amount: !!amount,
     installment: !!installmentNo,
     autopay: autopay !== undefined
   });
   ```
3. Move `redactPII` to `frontend/src/lib/redact.ts` and import
4. Update `Issue` interface to add `fieldHints: string[]` for low-confidence items

**Backward Compatibility**: Existing extraction logic unchanged; confidence added as new field, defaults to 1.0 for backward compat if needed.

#### 4.3 `frontend/src/lib/date-parser.ts`

**Current Structure**:
- `parseDate(dateStr: string, timezone: string): string` - timezone-aware parsing

**Extension Strategy**:
No changes needed. Reuse as-is for all 4 new providers.

**Backward Compatibility**: No changes = guaranteed compatibility.

#### 4.4 `frontend/src/components/EmailPreview.tsx`

**Current Structure**:
- Displays extracted items in a table
- "Copy as CSV" button exports items

**Extension Strategy**:
1. Add confidence pill column after provider column
2. Append `confidence` field to CSV export as last column
3. Use color-coded pills:
   - Green pill "High" for >= 0.8
   - Yellow pill "Med" for 0.6-0.79
   - Red pill "Low" for < 0.6
4. Add `aria-label` to pills for screen readers

**Backward Compatibility**: Existing table columns unchanged; confidence column added as new column, not replacing anything.

#### 4.5 `frontend/src/components/EmailIssues.tsx`

**Current Structure**:
- Displays extraction errors/issues with snippet and reason

**Extension Strategy**:
1. Add low-confidence flagging: any item with `confidence < 0.6` gets added to issues with field hints
2. Field hints based on missing signals:
   - Missing provider: "Unknown provider"
   - Missing date: "Due date not found"
   - Missing amount: "Amount not found"
   - Missing installment: "Installment number unclear"
3. Use `aria-live="polite"` for dynamic issue updates

**Backward Compatibility**: Existing issue rendering unchanged; low-confidence items added as new issue type.

---

## Summary & Next Steps

### Research Outcomes

✅ **Provider Signatures**: 4 new providers documented with email domains, keywords, and extraction patterns
✅ **Confidence Scoring**: Weighted formula defined (provider 0.35, date 0.25, amount 0.2, installment 0.15, autopay 0.05)
✅ **PII Redaction**: Existing patterns validated; extraction to standalone module planned
✅ **Extension Strategy**: Backward-compatible approach for all Phase A files

### Next Steps (Phase 1)

1. **data-model.md**: Document updated `Item` interface with `confidence` field and threshold mappings
2. **contracts/**: Create JSON schema for `email-extraction-output.schema.json` and `confidence-thresholds.yaml`
3. **Failing Tests**: Generate contract tests for 4 new providers, confidence calculation, and PII redaction
4. **quickstart.md**: Define user validation steps for 6-provider paste scenario

---

**Research Complete** | Ready for Phase 1: Design & Contracts
