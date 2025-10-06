# Code Duplication Analysis - Day 8 Task 8.2

**Analysis Date**: 2025-10-06
**Target**: Frontend codebase - test fixtures and patterns
**Methodology**: Grep pattern matching + manual file inspection

---

## Summary

Found **5 major duplication clusters** across test files:

1. **Klarna email fixtures** (3 instances)
2. **Mock Item objects** (5+ instances)
3. **Email extraction test patterns** (4 instances)
4. **Provider fixture data** (5 instances)
5. **Repeated `.repeat()` test data generation** (7 instances)

---

## 1. Klarna Email Fixtures

### Duplication Pattern: Similar Klarna email samples across test files

**Instance 1**: [tests/integration/cache-integration.test.ts:7-13](tests/integration/cache-integration.test.ts#L7-L13)
```typescript
const klarnaEmail = `
  Your Klarna payment is due soon!
  Payment 1 of 4
  Due: October 15, 2025
  Amount: $25.00
  Order #12345
`;
```

**Instance 2**: [tests/unit/cache.test.ts:30](tests/unit/cache.test.ts#L30)
```typescript
const email = 'Klarna payment 1/4: $25.00 due 10/15/2025';
```

**Instance 3**: [tests/performance/extraction-benchmark.test.ts:6-11](tests/performance/extraction-benchmark.test.ts#L6-L11)
```typescript
const SMALL_EMAIL = `
Klarna payment reminder
Payment 1 of 4
Amount: $25.00
Due: 10/15/2025
`;
```

**Impact**: 3 files with similar Klarna email fixtures
**Lines of duplication**: ~18 lines total

**Proposed Solution**:
- Create `tests/fixtures/email-samples.ts` with shared constants:
  - `KLARNA_PAYMENT_SIMPLE`
  - `KLARNA_PAYMENT_FULL`
  - `AFFIRM_PAYMENT_FULL`
  - etc.

---

## 2. Mock Item Objects

### Duplication Pattern: Repeated mock payment item objects for testing

**Instance 1**: [tests/unit/cache.test.ts:8-23](tests/unit/cache.test.ts#L8-L23)
```typescript
const mockResult: ExtractionResult = {
  items: [{
    id: 'test-1',
    provider: 'Klarna',
    installment_no: 1,
    due_date: '2025-10-15',
    amount: 2500,
    currency: 'USD',
    autopay: false,
    late_fee: 700,
    confidence: 1.0
  }],
  issues: [],
  duplicatesRemoved: 0,
  dateLocale: 'US'
};
```

**Instance 2**: [tests/unit/email-preview-confidence.test.tsx](tests/unit/email-preview-confidence.test.tsx) (similar structure)

**Instance 3**: [tests/unit/email-preview-memo.test.tsx](tests/unit/email-preview-memo.test.tsx) (similar structure)

**Instance 4**: [tests/unit/email-issues-lowconf.test.tsx](tests/unit/email-issues-lowconf.test.tsx) (similar structure)

**Instance 5**: [tests/integration/quick-fix-flow.test.ts](tests/integration/quick-fix-flow.test.ts) (similar structure)

**Impact**: 5+ files with nearly identical mock objects
**Lines of duplication**: ~80 lines total (16 lines × 5 files)

**Proposed Solution**:
- Create `tests/fixtures/mock-items.ts` with factory functions:
  - `createMockItem(overrides?: Partial<Item>): Item`
  - `createMockExtractionResult(overrides?: Partial<ExtractionResult>): ExtractionResult`
  - `KLARNA_MOCK_ITEM`, `AFFIRM_MOCK_ITEM`, etc.

---

## 3. Medium/Large Email Test Data

### Duplication Pattern: Complex multi-line emails with `.repeat()` for size

**Instance 1**: [tests/performance/extraction-benchmark.test.ts:13-40](tests/performance/extraction-benchmark.test.ts#L13-L40)
```typescript
const MEDIUM_EMAIL = `
From: reminders@klarna.com
Subject: Payment Reminder
...
`.repeat(2); // ~1KB
```

**Instance 2**: [tests/performance/extraction-benchmark.test.ts:42-102](tests/performance/extraction-benchmark.test.ts#L42-L102)
```typescript
const LARGE_EMAIL = `
From: payment-reminders@affirm.com
Subject: Your Affirm Payment is Due Soon
...
`.repeat(10); // ~10KB
```

**Instance 3**: [tests/integration/cache-integration.test.ts:116](tests/integration/cache-integration.test.ts#L116)
```typescript
const largeEmail = klarnaEmail.repeat(5); // 5x larger input
```

**Instance 4**: [tests/unit/security-injection.test.ts:332](tests/unit/security-injection.test.ts#L332)
```typescript
const nested = '('.repeat(1000) + 'Klarna $25.00' + ')'.repeat(1000);
```

**Impact**: 4 files using similar `.repeat()` pattern for test data scaling
**Lines of duplication**: ~120 lines of complex email templates

**Proposed Solution**:
- Create `tests/fixtures/email-samples.ts` with:
  - Base email templates (not repeated)
  - Helper function: `scaleEmail(template: string, size: 'small' | 'medium' | 'large'): string`
  - Constants: `SMALL_SIZE = 1`, `MEDIUM_SIZE = 2`, `LARGE_SIZE = 10`

---

## 4. Provider Test Fixtures

### Duplication Pattern: Hardcoded provider names in test assertions

**Instance 1**: [tests/unit/email-preview-confidence.test.tsx](tests/unit/email-preview-confidence.test.tsx)
```typescript
provider: 'Klarna'
```

**Instance 2**: [tests/unit/cache.test.ts](tests/unit/cache.test.ts)
```typescript
provider: 'Klarna'
```

**Instance 3**: [tests/integration/quick-fix-flow.test.ts](tests/integration/quick-fix-flow.test.ts)
```typescript
provider: 'Klarna', 'Affirm', 'Afterpay'
```

**Instance 4**: [tests/performance/extraction-benchmark.test.ts:168](tests/performance/extraction-benchmark.test.ts#L168)
```typescript
expect(result.items[0].provider).toBe('Klarna');
```

**Instance 5**: [tests/unit/security-injection.test.ts:47](tests/unit/security-injection.test.ts#L47)
```typescript
expect(result.items[0].provider).toBe('Klarna');
```

**Impact**: 5+ files with hardcoded provider strings
**Lines of duplication**: Not critical, but inconsistent

**Proposed Solution**:
- Create `tests/fixtures/providers.ts`:
  - `export const PROVIDERS = { KLARNA: 'Klarna', AFFIRM: 'Affirm', ... } as const`
  - Use `PROVIDERS.KLARNA` instead of string literals

---

## 5. Test Helper Pattern Duplication

### Duplication Pattern: Inline helper functions repeated across test files

**Instance 1**: [tests/unit/security-injection.test.ts:6-9](tests/unit/security-injection.test.ts#L6-L9)
```typescript
function extractItemsFromEmail(email: string, timezone: string) {
  return extractItemsFromEmails(email, timezone);
}
```

**Not duplicated yet, but worth preventing**: Other test files might create similar wrappers

**Proposed Solution**:
- Create `tests/helpers/test-utils.ts` with common test utilities:
  - `extractSingle(email: string, timezone?: string): ExtractionResult`
  - `expectValidItem(item: Item, expected: Partial<Item>): void`
  - `createTimezone(tz: string = 'America/New_York'): string`

---

## Consolidation Strategy

### Priority 1: Email Fixtures (High Impact)
- **File**: `tests/fixtures/email-samples.ts`
- **Exports**:
  - `KLARNA_SIMPLE`: Short inline Klarna payment
  - `KLARNA_FULL`: Full multi-line Klarna email
  - `AFFIRM_FULL`: Full Affirm email (from benchmark)
  - `MEDIUM_EMAIL_BASE`: Base template for medium emails
  - `LARGE_EMAIL_BASE`: Base template for large emails
  - `scaleEmail(template, times)`: Helper to repeat emails

### Priority 2: Mock Item Factory (High Impact)
- **File**: `tests/fixtures/mock-items.ts`
- **Exports**:
  - `createMockItem(overrides)`: Factory for Item objects
  - `createMockResult(overrides)`: Factory for ExtractionResult
  - `KLARNA_ITEM`: Pre-built Klarna item constant
  - `AFFIRM_ITEM`: Pre-built Affirm item constant
  - `DEFAULT_TIMEZONE`: 'America/New_York'

### Priority 3: Provider Constants (Low Impact, High Consistency)
- **File**: `tests/fixtures/providers.ts`
- **Exports**:
  - `PROVIDERS` object with all provider names
  - Ensure type safety with `as const`

### Priority 4: Test Helpers (Medium Impact)
- **File**: `tests/helpers/test-utils.ts`
- **Exports**:
  - `extractSingle()`: Wrapper for single email extraction
  - `expectValidItem()`: Common assertion patterns
  - Date helpers, timezone helpers, etc.

---

## Estimated Impact

| Cluster | Files Affected | Lines Saved | Priority |
|---------|---------------|-------------|----------|
| Email Fixtures | 3 | ~18 | HIGH |
| Mock Items | 5+ | ~80 | HIGH |
| Large Emails | 4 | ~120 | MEDIUM |
| Providers | 5+ | ~10 | LOW |
| Helpers | 1+ | ~15 | MEDIUM |
| **TOTAL** | **18+** | **~243** | - |

---

## Next Steps (Task 8.2.2)

1. Create `tests/fixtures/email-samples.ts`
2. Create `tests/fixtures/mock-items.ts`
3. Update test files to import from fixtures
4. Run tests to verify no regressions (444 tests passing)
5. Commit with validation results
