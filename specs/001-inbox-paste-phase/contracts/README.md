# Contracts: Inbox Paste Phase B

**Feature**: PayPlan v0.1.4 — Inbox Paste Phase B
**Date**: 2025-10-02

---

## Overview

This directory contains internal contracts for the email extraction system. These are **not API endpoints** (no backend changes in Phase B), but rather schema definitions and threshold configurations for frontend-only functionality.

---

## Files

### 1. `email-extraction-output.schema.json`

**Purpose**: JSON Schema defining the structure of extraction results from `extractItemsFromEmails()`.

**Usage**: Validate extraction output in tests and document expected data shape.

**Key Types**:
- `Item`: Single BNPL payment with confidence score
- `Issue`: Extraction error with PII-redacted snippet and field hints
- `ExtractionResult`: Complete output with items, issues, and duplicate count

**Validation Tool**: Use `ajv` or similar JSON Schema validator in tests.

**Example**:
```typescript
import Ajv from 'ajv';
import schema from './contracts/email-extraction-output.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);
const isValid = validate(extractionResult);
```

---

### 2. `confidence-thresholds.yaml`

**Purpose**: Define confidence scoring formula, thresholds, and UI mappings.

**Usage**: Reference document for:
- Confidence calculation logic
- Threshold boundaries (High/Med/Low)
- UI pill styling (colors, text, aria labels)
- CSV export format
- Test case scenarios

**Key Sections**:
- `confidence_formula`: Weighted sum definition
- `signals`: Weight and rationale for each signal
- `thresholds`: High/Med/Low ranges with UI metadata
- `ui_display`: Pill styles, CSV format, Issues section behavior
- `test_cases`: 7 scenarios with expected confidence values

**Example**:
```typescript
// Implementing confidence calculation from YAML
const confidence =
  provider_signal * 0.35 +
  date_signal * 0.25 +
  amount_signal * 0.20 +
  installment_signal * 0.15 +
  autopay_signal * 0.05;
```

---

## Contract Testing Strategy

### Unit Tests

**Test File**: `frontend/tests/unit/email-extractor.test.ts`

**Test Cases** (derived from `confidence-thresholds.yaml`):
1. All signals matched → confidence = 1.0 → "High"
2. Autopay missing → confidence = 0.95 → "High"
3. Installment + autopay missing → confidence = 0.8 → "High" (boundary)
4. Amount missing → confidence = 0.75 → "Med"
5. Only provider + date → confidence = 0.6 → "Med" (boundary)
6. Only provider → confidence = 0.35 → "Low"
7. No signals → confidence = 0.0 → "Low"

**Assertion Example**:
```typescript
test('confidence calculation with all signals matched', () => {
  const result = extractItemsFromEmails(afterpayEmail, 'America/New_York');
  expect(result.items[0].confidence).toBe(1.0);
});
```

### Schema Validation Tests

**Test File**: `frontend/tests/unit/extraction-schema.test.ts`

**Test Cases**:
1. Valid extraction result passes schema validation
2. Missing `confidence` field fails validation
3. Invalid provider name fails validation
4. Invalid due_date format fails validation
5. Out-of-range confidence (<0 or >1) fails validation

---

## Backward Compatibility

**Phase A Compatibility**:
- No API changes (Phase B is frontend-only)
- Existing `Item` interface extended with `confidence` field
- Existing providers (Klarna, Affirm) continue working unchanged
- CSV export backward compatible (confidence added as last column)

**Migration Notes**:
- If Phase A items are loaded without `confidence`, default to `1.0` (High)
- UI gracefully handles missing `confidence` by treating as High

---

## Implementation Checklist

- [ ] Implement confidence calculation in `email-extractor.ts`
- [ ] Add confidence pill to `EmailPreview.tsx`
- [ ] Add confidence column to CSV export
- [ ] Flag low-confidence items in `EmailIssues.tsx`
- [ ] Write unit tests for all 7 test scenarios
- [ ] Validate extraction output against JSON schema
- [ ] Document JSDoc comments referencing this contract

---

## References

- **Feature Spec**: [../spec.md](../spec.md)
- **Data Model**: [../data-model.md](../data-model.md)
- **Research**: [../research.md](../research.md)

---

**Contract Version**: 0.1.4 | **Status**: Ready for Implementation
