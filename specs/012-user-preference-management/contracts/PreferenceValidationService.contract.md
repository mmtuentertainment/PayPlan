# Contract: PreferenceValidationService

**Feature**: 012-user-preference-management
**Created**: 2025-10-13
**Purpose**: Define validation contracts for preference values using Zod schemas

---

## Overview

PreferenceValidationService provides runtime type validation for all preference categories using Zod. It ensures data integrity before persistence and validates restored data from localStorage.

---

## API Contract

### 1. validatePreferenceValue

**Signature**:

```typescript
function validatePreferenceValue(
  category: PreferenceCategory,
  value: unknown
): Result<void, ValidationError>
```

**Purpose**: Validate a preference value against its category-specific schema.

**Returns**:
- Success: `{ ok: true, value: undefined }`
- Error: `{ ok: false, error: ValidationError }`

**Validation Rules** (from data-model.md):
- **Timezone**: IANA timezone (luxon validation)
- **PaydayDates**: PaydayPattern union validation
- **BusinessDaySettings**: workingDays array (0-6), holidays array (ISO dates)
- **CurrencyFormat**: ISO 4217 code, valid separators, position
- **Locale**: BCP 47 language tag

**Contract Tests**:

```typescript
describe('validatePreferenceValue', () => {
  it('should validate valid timezone', () => {
    const result = service.validatePreferenceValue('timezone', 'America/New_York');
    expect(result.ok).toBe(true);
  });

  it('should reject invalid timezone', () => {
    const result = service.validatePreferenceValue('timezone', 'InvalidTZ');
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('timezone');
  });

  it('should validate biweekly payday pattern', () => {
    const pattern = { type: 'biweekly', startDate: '2025-10-10', dayOfWeek: 5 };
    const result = service.validatePreferenceValue('payday_dates', pattern);
    expect(result.ok).toBe(true);
  });

  it('should reject payday pattern with mismatched day', () => {
    const pattern = { type: 'biweekly', startDate: '2025-10-10', dayOfWeek: 1 }; // Oct 10 is Friday (5), not Monday (1)
    const result = service.validatePreferenceValue('payday_dates', pattern);
    expect(result.ok).toBe(false);
  });
});
```

---

### 2. validateStorageSize

**Signature**:

```typescript
function validateStorageSize(
  preferences: PreferenceCollection
): Result<void, QuotaError>
```

**Purpose**: Ensure total storage size is under 5KB limit (FR-014).

**Returns**:
- Success: `{ ok: true, value: undefined }`
- Error: `{ ok: false, error: QuotaError }`

**Contract Tests**:

```typescript
describe('validateStorageSize', () => {
  it('should pass for preferences under 5KB', () => {
    const small = createMockCollection(500); // 500 bytes
    const result = service.validateStorageSize(small);
    expect(result.ok).toBe(true);
  });

  it('should reject preferences over 5KB', () => {
    const large = createMockCollection(6000); // 6KB
    const result = service.validateStorageSize(large);
    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('5KB');
  });
});
```

---

### 3. validatePaydayPattern

**Signature**:

```typescript
function validatePaydayPattern(
  pattern: unknown
): Result<PaydayPattern, ValidationError>
```

**Purpose**: Deep validation of payday patterns with luxon date checks.

**Contract Tests**:

```typescript
describe('validatePaydayPattern', () => {
  it('should validate specific dates pattern', () => {
    const pattern = { type: 'specific', dates: [1, 15] };
    const result = service.validatePaydayPattern(pattern);
    expect(result.ok).toBe(true);
  });

  it('should reject invalid day of month', () => {
    const pattern = { type: 'specific', dates: [32] };
    const result = service.validatePaydayPattern(pattern);
    expect(result.ok).toBe(false);
  });
});
```

---

## Implementation File

**Path**: `frontend/src/lib/preferences/validation.ts`

**Dependencies**: Zod 4.1.11, luxon 3.7.2

**Zod Schemas**: Defined in data-model.md Section "Validation Schemas"

---

**Next Contract**: PreferenceUIComponents.contract.md
