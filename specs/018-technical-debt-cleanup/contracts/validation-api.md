# Validation API Contract

**Feature**: 018-technical-debt-cleanup
**Version**: 1.0
**Date**: 2025-10-23

## Overview

This contract defines the validation patterns, error formats, and schema composition for runtime validation using Zod in the PayPlan application.

---

## Schema Patterns

### Request Validation Pattern

All API requests MUST follow this validation pattern:

```typescript
import { z } from 'zod';

// 1. Define schema
const RequestSchema = z.object({
  // ... fields
});

// 2. Infer TypeScript type
type Request = z.infer<typeof RequestSchema>;

// 3. Validate with safeParse
function handleRequest(body: unknown): Response {
  const result = RequestSchema.safeParse(body);

  if (!result.success) {
    // Return generic error to client (FR-002)
    return {
      status: 400,
      clientMessage: "An error occurred. Please try again.",
      serverLog: result.error.format() // Log full details server-side only
    };
  }

  // result.data is now typed as Request
  return processRequest(result.data);
}
```

### Numeric Validation Pattern

All numeric inputs MUST be validated for NaN/Infinity before financial calculations (FR-008):

```typescript
import { z } from 'zod';

const FiniteNumberSchema = z.number().finite();
const PaymentAmountSchema = z.number().finite().refine(
  (val) => val !== 0,
  { message: "Amount cannot be zero" }
);

// Usage
function parseAmount(input: string): number {
  const parsed = parseFloat(input);
  const result = PaymentAmountSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid amount: ${input} → ${parsed}`);
  }

  return result.data;
}
```

### Deep Object Validation Pattern

Cache entries MUST use shallow validation with `.passthrough()` (Research Decision 2):

```typescript
const CacheEntrySchema = z.object({
  hash: z.string(),
  timestamp: z.number(),
  result: z.unknown() // Don't validate nested structure
}).passthrough(); // Allow additional fields

// DON'T: Deep validation (too slow)
const BadCacheSchema = z.object({
  result: z.object({ /* deeply nested */ })
}); // ❌ 10-50ms overhead
```

---

## Error Response Format

### Client Error Response (Generic)

Per FR-002 and Clarification Answer 4, ALL error responses to clients MUST use this exact format:

```json
{
  "error": "An error occurred. Please try again."
}
```

**Requirements**:
- ✅ MUST NOT include implementation details
- ✅ MUST NOT include stack traces
- ✅ MUST NOT include field names or validation specifics
- ✅ MUST be identical for all error types (validation, server, database, etc.)

### Server Error Logging (Detailed)

Server-side logs MUST include full error details:

```typescript
interface ServerErrorLog {
  timestamp: number; // Unix timestamp in milliseconds
  level: 'error' | 'warn' | 'info';
  message: string; // Full error message
  stack?: string; // Stack trace if available
  context: {
    userId?: string;
    requestId: string;
    endpoint: string;
    validationErrors?: z.ZodFormattedError<any>; // Zod error details
  };
}
```

**Example**:
```typescript
// Client receives:
{ "error": "An error occurred. Please try again." }

// Server logs:
{
  timestamp: 1729728000000,
  level: "error",
  message: "Validation failed on /api/plan endpoint",
  stack: "...",
  context: {
    requestId: "req-123",
    endpoint: "/api/plan",
    validationErrors: {
      amount: { _errors: ["Expected number, received string"] },
      date: { _errors: ["Invalid datetime format"] }
    }
  }
}
```

---

## Validation Error Formats

### Zod Error Structure

When validation fails, use `safeParse()` and access errors via `.error.format()`:

```typescript
const result = Schema.safeParse(data);

if (!result.success) {
  const formatted = result.error.format();
  // Structure:
  // {
  //   fieldName: { _errors: ["error message 1", "error message 2"] },
  //   nestedField: {
  //     childField: { _errors: ["..."] }
  //   }
  // }
}
```

### Custom Error Messages

Provide clear, actionable error messages for server logs:

```typescript
const AmountSchema = z.number().finite().positive().refine(
  (val) => val <= 1000000,
  { message: "Amount exceeds maximum allowed value (1,000,000)" }
);

const DateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid date format. Expected ISO 8601 (e.g., '2025-10-23T12:00:00Z')" }
);
```

---

## Schema Composition

### Reusable Base Schemas

Define common validation patterns once:

```typescript
// Common patterns
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PositiveIntSchema = z.number().int().positive();
export const TimezoneSchema = z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/);
export const CurrencyCodeSchema = z.string().length(3); // ISO 4217

// Compose into larger schemas
export const UserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema.optional(), // Optional for privacy
  timezone: TimezoneSchema,
  currency: CurrencyCodeSchema,
});
```

### Extending Schemas

Use `.extend()` for schema inheritance:

```typescript
const BaseRequestSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.number().positive().int(),
});

const PlanRequestSchema = BaseRequestSchema.extend({
  installments: z.array(InstallmentItemSchema),
  timezone: TimezoneSchema,
});
```

---

## Performance Requirements

Per NFR-004 and research findings, validation MUST meet these targets:

| Schema Type | Max Validation Time | Measurement Method |
|-------------|---------------------|-------------------|
| Simple request (1-5 fields) | <5ms | `performance.now()` |
| Cache entry (shallow) | <1ms | `performance.now()` |
| Numeric validation | <0.1ms | `performance.now()` |
| Complex request (>10 fields) | <10ms | `performance.now()` |

**Measurement**:
```typescript
const start = performance.now();
const result = Schema.safeParse(data);
const duration = performance.now() - start;

if (duration > TARGET_MS) {
  logger.warn(`Validation exceeded target: ${duration}ms > ${TARGET_MS}ms`);
}
```

---

## Testing Contract

All validation schemas MUST have tests covering:

### 1. Valid Input Tests
```typescript
test('accepts valid payment request', () => {
  const valid = {
    amount: 100.50,
    date: '2025-10-23T12:00:00Z',
    description: 'Payment 1',
  };

  const result = InstallmentItemSchema.safeParse(valid);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual(valid);
  }
});
```

### 2. Invalid Input Tests
```typescript
test('rejects NaN amount', () => {
  const invalid = { amount: NaN, date: '...', description: '...' };
  const result = InstallmentItemSchema.safeParse(invalid);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.format().amount?._errors).toContain('Expected finite number');
  }
});
```

### 3. Edge Case Tests
```typescript
test('rejects zero amount', () => {
  const zero = { amount: 0, date: '...', description: '...' };
  const result = InstallmentItemSchema.safeParse(zero);
  expect(result.success).toBe(false);
});

test('rejects Infinity', () => {
  const inf = { amount: Infinity, date: '...', description: '...' };
  const result = InstallmentItemSchema.safeParse(inf);
  expect(result.success).toBe(false);
});

test('accepts negative amount as refund', () => {
  const refund = { amount: -50, date: '...', description: 'Refund' };
  const result = RefundAmountSchema.safeParse(refund.amount);
  expect(result.success).toBe(true);
});
```

---

## Migration Notes

### From Unvalidated to Validated

When adding validation to existing endpoints:

1. **Phase 1**: Add validation with warning-only mode
   ```typescript
   const result = Schema.safeParse(data);
   if (!result.success) {
     logger.warn('Validation would fail:', result.error);
     // Continue processing anyway (backward compatible)
   }
   ```

2. **Phase 2**: Enable strict validation
   ```typescript
   const result = Schema.safeParse(data);
   if (!result.success) {
     return { error: "An error occurred. Please try again." };
   }
   ```

3. **Phase 3**: Update clients to send valid data

---

## Security Considerations

### Input Sanitization

Validation does NOT sanitize inputs. PII removal is handled separately by PiiSanitizer:

```typescript
// 1. Validate structure
const validated = Schema.parse(data);

// 2. Sanitize PII (if caching)
const sanitized = piiSanitizer.sanitize(validated);

// 3. Store sanitized data
cache.set(key, sanitized);
```

### DoS Protection

Prevent resource exhaustion:

```typescript
// Limit array sizes
const InstallmentsSchema = z.array(ItemSchema).max(100); // Max 100 items

// Limit string lengths
const DescriptionSchema = z.string().max(500); // Max 500 chars

// Limit nesting depth (separate validator)
const validated = Schema.parse(data);
maxDepthValidator.validate(validated, { maxDepth: 10 });
```

---

## Examples

### Complete Request Validation Flow

```typescript
import { z } from 'zod';
import { errorSanitizer } from '@/lib/security/ErrorSanitizer';
import { logger } from '@/lib/logging';

const PlanRequestSchema = z.object({
  installments: z.array(InstallmentItemSchema).min(1).max(100),
  timezone: z.string().regex(/^[A-Za-z_]+\/[A-Za-z_]+$/),
});

export async function handlePlanRequest(req: Request): Promise<Response> {
  // 1. Parse request body
  const body = await req.json();

  // 2. Validate with Zod
  const result = PlanRequestSchema.safeParse(body);

  if (!result.success) {
    // 3. Sanitize error for client
    const sanitized = errorSanitizer.sanitize(
      new Error('Validation failed'),
      { validationErrors: result.error.format() }
    );

    // 4. Log full details server-side
    logger.error('Plan request validation failed', sanitized.serverLog);

    // 5. Return generic error to client
    return Response.json(
      { error: sanitized.clientMessage },
      { status: 400 }
    );
  }

  // 6. Process validated data
  return processPlan(result.data);
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial validation API contract |
