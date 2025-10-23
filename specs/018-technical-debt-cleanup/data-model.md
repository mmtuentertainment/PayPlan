# Data Model: Technical Debt Cleanup

**Feature**: 018-technical-debt-cleanup
**Date**: 2025-10-23
**Based on**: research.md decisions

## Overview

This document defines the validation schemas, security component interfaces, and architectural patterns for the technical debt cleanup feature. All schemas use Zod for runtime validation with TypeScript type inference.

---

## Validation Schemas

### PlanRequestSchema (P1 - Type Safety)

**Purpose**: Runtime validation for API request bodies to reject malformed payment data (FR-007).

**Location**: `backend/src/lib/validation/PlanRequestSchema.ts`

**Schema Definition**:
```typescript
import { z } from 'zod';

export const InstallmentItemSchema = z.object({
  amount: z.number().finite().positive(),
  date: z.string().datetime(), // ISO 8601 format
  description: z.string().min(1).max(500),
  category: z.enum(['payment', 'fee', 'interest']).optional(),
});

export const PlanRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Optional for privacy-first mode
  installments: z.array(InstallmentItemSchema).min(1).max(100),
  timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/), // e.g., America/New_York
  currency: z.string().length(3), // ISO 4217 code
  metadata: z.record(z.unknown()).optional(),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;
export type InstallmentItem = z.infer<typeof InstallmentItemSchema>;
```

**Validation Rules**:
- Amount must be finite number (no NaN/Infinity)
- Positive amounts only (negatives handled separately as refunds per FR-008)
- Date must be valid ISO 8601 datetime string
- Maximum 100 installments per plan (DoS protection)
- Timezone must match standard format (e.g., `America/New_York`)

**Error Handling**:
```typescript
const result = PlanRequestSchema.safeParse(requestBody);
if (!result.success) {
  return {
    error: "An error occurred. Please try again.", // Generic client message (FR-002)
    details: result.error.format() // Server-side logging only
  };
}
```

---

### IdempotencyCacheSchema (P2 - Architecture)

**Purpose**: Runtime validation for idempotency cache entries to prevent crashes from malformed data (FR-003, FR-011).

**Location**: `backend/src/lib/validation/IdempotencySchemas.ts`

**Schema Definition**:
```typescript
import { z } from 'zod';

export const IdempotencyCacheKeySchema = z.object({
  operation: z.string().min(1),
  resourceId: z.string().min(1),
  hash: z.string().length(64), // SHA-256 hash
});

export const IdempotencyCacheEntrySchema = z.object({
  hash: z.string().length(64), // SHA-256 hash of request
  timestamp: z.number().positive().int(), // Unix timestamp in milliseconds
  result: z.unknown(), // Cached response (not deeply validated)
  ttl: z.number().positive().int().default(86400000), // 24 hours in ms (FR-005)
}).passthrough(); // Allow additional fields without validation

export type IdempotencyCacheKey = z.infer<typeof IdempotencyCacheKeySchema>;
export type IdempotencyCacheEntry = z.infer<typeof IdempotencyCacheEntrySchema>;
```

**Validation Rules**:
- Hash must be exactly 64 characters (SHA-256 hex digest)
- Timestamp must be positive integer (milliseconds since epoch)
- TTL defaults to 86400000ms (24 hours) per FR-005
- Uses `.passthrough()` to avoid data loss (research decision 2)

**Performance Target**: <1ms validation time per entry

---

### NumericValidationRules (P1 - Type Safety)

**Purpose**: Detect NaN/Infinity before financial calculations (FR-008).

**Location**: `backend/src/lib/validation/NumericValidator.ts`

**Schema Definition**:
```typescript
import { z } from 'zod';

export const FiniteNumberSchema = z.number().finite();

export const PositiveAmountSchema = z.number().finite().positive();

export const RefundAmountSchema = z.number().finite().negative(); // Negative = refund per clarification

export const PaymentAmountSchema = z.union([
  PositiveAmountSchema,
  RefundAmountSchema,
]);

export type PaymentAmount = z.infer<typeof PaymentAmountSchema>;
```

**Validation Rules**:
- All numbers must be finite (reject NaN, Infinity, -Infinity)
- Positive amounts represent payments
- Negative amounts represent refunds (per clarification answer 5)
- Zero is rejected (neither payment nor refund)

**Example Usage**:
```typescript
function validateAmount(input: string): PaymentAmount {
  const parsed = parseFloat(input);
  const result = PaymentAmountSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid amount: ${input} produced ${parsed}`);
  }

  return result.data;
}
```

---

## Security Components

### ErrorSanitizer Interface (P0 - Security)

**Purpose**: Transform detailed errors into generic client messages while preserving server logs (FR-002).

**Location**: `backend/src/lib/security/ErrorSanitizer.ts`

**Interface Definition**:
```typescript
export interface SanitizedError {
  clientMessage: string; // Always "An error occurred. Please try again."
  serverLog: ErrorDetails;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

export interface ErrorSanitizer {
  sanitize(error: Error, context?: Record<string, unknown>): SanitizedError;
}
```

**Implementation Contract**:
- Client always receives: `"An error occurred. Please try again."` (per clarification answer 4)
- Server log contains full error details (message, stack, context, timestamp)
- Never expose internal implementation details to client
- Context object for additional debugging info (sanitized before logging)

---

### ConsoleGuard Interface (P0 - Security)

**Purpose**: Conditional logging that only outputs sensitive information in development builds (FR-001).

**Location**: `frontend/src/lib/security/ConsoleGuard.ts`

**Interface Definition**:
```typescript
export interface ConsoleGuard {
  error(message: string, ...details: unknown[]): void;
  warn(message: string, ...details: unknown[]): void;
  log(message: string, ...details: unknown[]): void;
}

export type LogLevel = 'error' | 'warn' | 'log';
```

**Implementation Contract**:
- Use `import.meta.env.DEV` for environment detection (research decision 1)
- In production (`import.meta.env.PROD === true`): Suppress all logging
- In development (`import.meta.env.DEV === true`): Log to console with details
- Never log payment validation details in production (FR-001)

**Example Usage**:
```typescript
// frontend/src/components/results/ResultsThisWeek.tsx
import { consoleGuard } from '@/lib/security/ConsoleGuard';

// Before: console.error('Payment validation failed:', paymentDetails);
// After:
consoleGuard.error('Payment validation failed', paymentDetails); // Only logs in dev
```

---

### PiiSanitizer Interface (P2 - Architecture)

**Purpose**: Remove PII (email, name, phone, address, SSN) from cache entries before storage (FR-013).

**Location**: `backend/src/lib/security/PiiSanitizer.ts`

**Interface Definition**:
```typescript
export interface PiiSanitizer {
  sanitize<T>(data: T): T; // Returns sanitized copy with structural sharing
  isPiiField(fieldName: string): boolean;
}

export type PiiField = 'email' | 'name' | 'phone' | 'address' | 'ssn';

export const PII_FIELDS: ReadonlySet<PiiField> = new Set([
  'email',
  'name',
  'phone',
  'address',
  'ssn',
]);
```

**Implementation Contract**:
- Recursive deep traversal of objects and arrays (research decision 5)
- Blocklist matching: Remove fields named `email`, `name`, `phone`, `address`, `ssn` (case-insensitive)
- Pattern matching: Also remove `*Email*`, `*Phone*`, `*Address*`, `*SSN*` variations
- Structural sharing: Return original object if no PII found (avoid unnecessary clones)
- Performance target: <5ms for typical cache objects (<10KB)

**Example**:
```typescript
const original = {
  userId: '123',
  userEmail: 'user@example.com', // PII - will be removed
  paymentAmount: 100,
  billingAddress: { street: '123 Main St' }, // PII - will be removed
};

const sanitized = piiSanitizer.sanitize(original);
// Result: { userId: '123', paymentAmount: 100 }
```

---

## Architectural Components

### MaxDepthValidator Configuration (P2 - Architecture)

**Purpose**: Prevent excessively nested JSON structures (10-level maximum) for DoS protection (FR-012).

**Location**: `backend/src/lib/utils/MaxDepthValidator.ts`

**Configuration**:
```typescript
export interface MaxDepthValidatorConfig {
  maxDepth: number; // 10 per clarification answer 3
  throwOnExceed: boolean; // true = throw error, false = return truncated
}

export const DEFAULT_MAX_DEPTH_CONFIG: MaxDepthValidatorConfig = {
  maxDepth: 10,
  throwOnExceed: true,
};

export interface MaxDepthValidator {
  validate<T>(data: T, config?: MaxDepthValidatorConfig): T;
  getDepth(data: unknown): number;
}
```

**Validation Rules**:
- Maximum nesting depth: 10 levels (research decision 3)
- Depth counting: `{ a: { b: {} } }` = 3 levels
- Arrays count as 1 level: `[[[1]]]` = 3 levels
- Primitives count as 1 level
- Throws error when maxDepth exceeded (default behavior)

**Example**:
```typescript
const deepObject = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'too deep' } } } } } } } } } } };
// Depth = 11 levels, exceeds limit

validator.validate(deepObject); // Throws: "Maximum nesting depth exceeded (limit: 10)"
```

---

### AtomicUpdatePattern for PaymentContext (P2 - Architecture)

**Purpose**: Race-condition-free payment updates using React 19's `useOptimistic` (FR-015).

**Location**: `frontend/src/contexts/PaymentContext.tsx`

**Pattern Definition**:
```typescript
import { useOptimistic, useState } from 'react';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface PaymentContextValue {
  payments: Payment[];
  optimisticPayments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
}

// Atomic update pattern (research decision 3)
export function usePaymentState() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [optimisticPayments, addOptimistic] = useOptimistic(payments);

  const addPayment = (payment: Payment) => {
    addOptimistic(payment); // Instant UI update
    setPayments(prev => [...prev, payment]); // Atomic append
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    setPayments(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p) // Atomic map
    );
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id)); // Atomic filter
  };

  return { payments, optimisticPayments, addPayment, updatePayment, deletePayment };
}
```

**Implementation Rules**:
- Always use functional setState: `setPayments(prev => updater(prev))`
- Never use direct replacement: `setPayments(newArray)` ❌
- Use `useOptimistic` for instant UI feedback while server confirms
- Updater functions must be pure (no side effects)
- Prevents race conditions when multiple operations occur <100ms apart

---

### TimezoneHandler Interface (P2 - Architecture)

**Purpose**: Consistent date/time validation across all timezones (FR-014).

**Location**: `backend/src/lib/utils/TimezoneHandler.ts`

**Interface Definition**:
```typescript
export interface TimezoneHandler {
  parseDate(dateString: string, timezone: string): Date;
  formatDate(date: Date, timezone: string): string;
  isValidTimezone(timezone: string): boolean;
}

export const TIMEZONE_PATTERN = /^[A-Za-z_]+\/[A-Za-z_]+$/; // e.g., America/New_York
```

**Implementation Contract**:
- Always use UTC for storage and comparison
- Accept timezone parameter for display formatting
- Validate timezone strings match IANA format (e.g., `America/New_York`)
- Never use `Date.parse()` directly (locale-dependent)
- Use timestamp comparison for sorting (research finding: fragile date sorting issue)

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layer (P0)                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ ConsoleGuard │    │ErrorSanitizer│    │PiiSanitizer  │  │
│  │ (Frontend)   │    │  (Backend)   │    │  (Backend)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Validation Layer (P1)                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │PlanRequest   │    │Idempotency   │    │ Numeric      │  │
│  │Schema        │    │CacheSchema   │    │ Validator    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Architectural Layer (P2)                     │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │MaxDepth      │    │AtomicUpdate  │    │Timezone      │  │
│  │Validator     │    │Pattern       │    │Handler       │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Flow**:
1. **Request Arrival** → ConsoleGuard (dev logging) → PlanRequestSchema (validation)
2. **Validation Failure** → ErrorSanitizer (generic message) → Client response
3. **Idempotency Check** → IdempotencyCacheSchema (structure validation) → PiiSanitizer (remove PII)
4. **Cache Storage** → MaxDepthValidator (DoS protection) → TimezoneHandler (normalize dates)
5. **Payment Update** → NumericValidator (NaN check) → AtomicUpdatePattern (race-free)

---

## Testing Considerations

### Unit Test Coverage

Each component requires isolated unit tests:

1. **Schemas** (Zod validation):
   - Valid input passes
   - Invalid input rejected with descriptive errors
   - Edge cases (empty strings, zero, negative, NaN, Infinity)

2. **Security Components**:
   - ConsoleGuard: Verify no logs in production (`import.meta.env.PROD`)
   - ErrorSanitizer: Verify generic client message, full server log
   - PiiSanitizer: Verify all PII fields removed, non-PII preserved

3. **Architectural Components**:
   - MaxDepthValidator: Test depth counting, error on exceed
   - AtomicUpdatePattern: Test concurrent updates, race conditions
   - TimezoneHandler: Test timezone parsing, UTC conversion

### Integration Test Coverage

Test component interactions:

1. **API Validation Flow**: Request → Schema → Error Sanitizer → Response
2. **Idempotency Flow**: Request → Hash → Cache Lookup → Validation → PII Sanitization
3. **Payment Update Flow**: User Action → Validation → Atomic Update → UI Refresh

---

## Performance Targets

| Component | Target | Measurement |
|-----------|--------|-------------|
| PlanRequestSchema | <5ms | safeParse() execution time |
| IdempotencyCacheSchema | <1ms | safeParse() execution time |
| NumericValidator | <0.1ms | Per number validation |
| PiiSanitizer | <5ms | For <10KB cache objects |
| MaxDepthValidator | <2ms | For 10-level objects |
| AtomicUpdatePattern | <1ms | setState execution time |

All measurements use `performance.now()` in automated tests.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial data model based on research decisions |
