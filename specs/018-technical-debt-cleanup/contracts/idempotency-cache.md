# Idempotency Cache Contract

**Feature**: 018-technical-debt-cleanup
**Version**: 1.0
**Date**: 2025-10-23

## Overview

This contract defines the idempotency cache implementation for preventing duplicate payment operations. It implements FR-003 (cache validation), FR-004 (fail-closed pattern), FR-005 (24-hour TTL), FR-011 (runtime validation), FR-012 (depth limit), and FR-013 (PII sanitization).

---

## Cache Entry Format

### Data Structure

```typescript
interface IdempotencyCacheEntry {
  hash: string; // SHA-256 hash of request (64 hex characters)
  timestamp: number; // Unix timestamp in milliseconds
  result: unknown; // Cached response (sanitized)
  ttl: number; // Time-to-live in milliseconds (default: 86400000 = 24 hours)
}

interface IdempotencyCacheKey {
  operation: string; // Operation name (e.g., 'create_payment')
  resourceId: string; // Resource identifier (e.g., payment ID)
  hash: string; // Request hash for collision detection
}
```

### Example

```json
{
  "hash": "a7b3c2d1e5f4g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1",
  "timestamp": 1729728000000,
  "result": {
    "paymentId": "pay_123",
    "amount": 100,
    "status": "completed"
  },
  "ttl": 86400000
}
```

---

## Validation Contract

### Schema Validation (FR-011)

Per Research Decision 2, use shallow Zod validation with `.passthrough()`:

```typescript
import { z } from 'zod';

const IdempotencyCacheEntrySchema = z.object({
  hash: z.string().length(64), // SHA-256 hex digest
  timestamp: z.number().positive().int(),
  result: z.unknown(), // Don't validate nested structure (performance)
  ttl: z.number().positive().int().default(86400000),
}).passthrough(); // Allow additional fields without validation

function validateCacheEntry(entry: unknown): IdempotencyCacheEntry {
  const result = IdempotencyCacheEntrySchema.safeParse(entry);

  if (!result.success) {
    // Treat as cache miss (don't crash)
    throw new CacheMissError('Invalid cache entry format');
  }

  return result.data;
}
```

**Requirements**:
- ✅ Validate structure only (hash, timestamp, ttl)
- ✅ Do NOT validate nested `result` content (performance: <1ms)
- ✅ Use `.passthrough()` to preserve additional fields
- ✅ Throw CacheMissError on validation failure (don't crash app)

### JSON Depth Validation (FR-012)

Per Clarification Answer 3, enforce 10-level maximum depth:

```typescript
import { maxDepthValidator } from '@/lib/utils/MaxDepthValidator';

function storeCacheEntry(key: string, entry: IdempotencyCacheEntry): void {
  // 1. Validate structure
  const validated = validateCacheEntry(entry);

  // 2. Check depth limit (DoS protection)
  maxDepthValidator.validate(validated.result, { maxDepth: 10 });

  // 3. Sanitize PII
  const sanitized = piiSanitizer.sanitize(validated);

  // 4. Store
  cache.set(key, sanitized);
}
```

**Requirements**:
- ✅ Maximum nesting depth: 10 levels
- ✅ Reject deeply nested payloads with clear error
- ✅ Example rejection: `{ a: { b: { c: { ... 11 levels deep } } } }`

### PII Sanitization (FR-013)

Per Clarification Answer 2, remove specific PII fields before caching:

```typescript
const PII_FIELDS = new Set(['email', 'name', 'phone', 'address', 'ssn']);

function sanitizeForCache(entry: IdempotencyCacheEntry): IdempotencyCacheEntry {
  return {
    ...entry,
    result: piiSanitizer.sanitize(entry.result),
  };
}
```

**PII Fields to Remove** (case-insensitive):
- `email`, `*Email*`, `*email*`
- `name`, `*Name*`, `*name*`
- `phone`, `*Phone*`, `*phone*`
- `address`, `*Address*`, `*address*`
- `ssn`, `*SSN*`, `*ssn*`

---

## TTL Configuration (FR-005)

### Default TTL

Per Clarification Answer (already in spec), default TTL is **24 hours** (86400000 milliseconds):

```typescript
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 86400000ms = 24 hours

function createCacheEntry(result: unknown): IdempotencyCacheEntry {
  return {
    hash: generateHash(result),
    timestamp: Date.now(),
    result,
    ttl: DEFAULT_TTL,
  };
}
```

### TTL Validation

Check TTL before using cached entry:

```typescript
function isExpired(entry: IdempotencyCacheEntry): boolean {
  const age = Date.now() - entry.timestamp;
  return age > entry.ttl;
}

function getCacheEntry(key: string): IdempotencyCacheEntry | null {
  const entry = cache.get(key);

  if (!entry) return null;

  // Validate structure
  const validated = validateCacheEntry(entry);

  // Check expiration
  if (isExpired(validated)) {
    cache.delete(key); // Clean up expired entry
    return null;
  }

  return validated;
}
```

**Requirements**:
- ✅ Default TTL: 24 hours (86400000ms)
- ✅ Configurable per operation (optional)
- ✅ Automatic cleanup of expired entries
- ✅ Timestamp in milliseconds (Unix epoch)

---

## Fail-Closed Pattern (FR-004)

### Error Handling

Per FR-004, when idempotency check fails, abort operation instead of proceeding:

```typescript
async function performIdempotentOperation(
  key: IdempotencyCacheKey,
  operation: () => Promise<unknown>
): Promise<unknown> {
  try {
    // 1. Check cache
    const cached = getCacheEntry(serializeKey(key));

    if (cached) {
      // Duplicate detected - return cached result
      return cached.result;
    }

    // 2. Perform operation
    const result = await operation();

    // 3. Store result
    storeCacheEntry(serializeKey(key), {
      hash: key.hash,
      timestamp: Date.now(),
      result,
      ttl: DEFAULT_TTL,
    });

    return result;
  } catch (error) {
    // ❌ FAIL-CLOSED: Abort operation
    throw new IdempotencyError(
      'Idempotency check failed - operation aborted',
      { cause: error }
    );
    // ✅ Do NOT proceed with operation
    // ✅ Do NOT return partial results
  }
}
```

**Fail-Closed vs Fail-Open**:

```typescript
// ❌ FAIL-OPEN (bad - FR-004 violation):
try {
  const cached = getCacheEntry(key);
  if (cached) return cached;
} catch (error) {
  // Ignore error, proceed anyway - allows duplicates!
  return performOperation();
}

// ✅ FAIL-CLOSED (correct - FR-004 compliant):
try {
  const cached = getCacheEntry(key);
  if (cached) return cached;
} catch (error) {
  // Abort operation - prevents duplicates
  throw new IdempotencyError('Cache check failed', { cause: error });
}
```

---

## Hash Generation

### SHA-256 Hash

Use SHA-256 for request hashing (collision-resistant):

```typescript
import { createHash } from 'crypto';

function generateHash(request: unknown): string {
  const canonical = JSON.stringify(request, Object.keys(request).sort());
  const hash = createHash('sha256').update(canonical).digest('hex');
  return hash; // 64 hex characters
}
```

**Requirements**:
- ✅ Use SHA-256 algorithm
- ✅ Canonicalize JSON (sorted keys) for consistent hashing
- ✅ Output: 64 hexadecimal characters
- ✅ Include relevant request fields only (exclude metadata like timestamps)

### Key Serialization

```typescript
function serializeKey(key: IdempotencyCacheKey): string {
  return `${key.operation}:${key.resourceId}:${key.hash}`;
}

function deserializeKey(serialized: string): IdempotencyCacheKey {
  const [operation, resourceId, hash] = serialized.split(':');
  return { operation, resourceId, hash };
}
```

---

## Cache Implementation

### In-Memory LRU Cache

Per codebase analysis (Research findings), PayPlan uses Map-based LRU cache:

```typescript
class IdempotencyCache {
  private cache = new Map<string, IdempotencyCacheEntry>();
  private readonly maxSize = 10000; // Limit cache size

  set(key: string, entry: IdempotencyCacheEntry): void {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // Validate before storing
    const validated = validateCacheEntry(entry);
    const sanitized = sanitizeForCache(validated);

    this.cache.set(key, sanitized);
  }

  get(key: string): IdempotencyCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Validate on retrieval (defense in depth)
    try {
      const validated = validateCacheEntry(entry);
      if (isExpired(validated)) {
        this.cache.delete(key);
        return null;
      }
      return validated;
    } catch (error) {
      // Malformed cache entry - treat as miss
      this.cache.delete(key);
      return null;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

## Testing Contract

### Unit Tests

```typescript
describe('IdempotencyCache', () => {
  let cache: IdempotencyCache;

  beforeEach(() => {
    cache = new IdempotencyCache();
  });

  test('prevents duplicate operations within TTL', async () => {
    const key = { operation: 'create_payment', resourceId: 'pay_123', hash: 'abc...' };

    let callCount = 0;
    const operation = async () => {
      callCount++;
      return { paymentId: 'pay_123', amount: 100 };
    };

    // First call - executes operation
    const result1 = await performIdempotentOperation(key, operation);
    expect(callCount).toBe(1);

    // Second call - returns cached result
    const result2 = await performIdempotentOperation(key, operation);
    expect(callCount).toBe(1); // Not called again
    expect(result2).toEqual(result1);
  });

  test('treats malformed cache data as cache miss', () => {
    const malformed = {
      hash: 'invalid', // Wrong length
      timestamp: -1, // Invalid
      result: {},
    };

    cache.set('key1', malformed as IdempotencyCacheEntry);
    const retrieved = cache.get('key1');

    expect(retrieved).toBeNull(); // Treated as miss, not crash
  });

  test('rejects deeply nested JSON (>10 levels)', () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 'too deep' } } } } } } } } } } };

    expect(() => {
      cache.set('key2', {
        hash: 'abc...'.padEnd(64, '0'),
        timestamp: Date.now(),
        result: deep,
        ttl: DEFAULT_TTL,
      });
    }).toThrow('Maximum nesting depth exceeded');
  });

  test('sanitizes PII before caching', () => {
    const entry: IdempotencyCacheEntry = {
      hash: 'abc...'.padEnd(64, '0'),
      timestamp: Date.now(),
      result: {
        paymentId: 'pay_123',
        amount: 100,
        userEmail: 'user@example.com', // PII
        billingAddress: { street: '123 Main St' }, // PII
      },
      ttl: DEFAULT_TTL,
    };

    cache.set('key3', entry);
    const retrieved = cache.get('key3');

    expect(retrieved?.result).not.toHaveProperty('userEmail');
    expect(retrieved?.result).not.toHaveProperty('billingAddress');
    expect(retrieved?.result).toHaveProperty('paymentId');
    expect(retrieved?.result).toHaveProperty('amount');
  });

  test('expires entries after TTL', async () => {
    const entry: IdempotencyCacheEntry = {
      hash: 'abc...'.padEnd(64, '0'),
      timestamp: Date.now() - 86400001, // 24 hours + 1ms ago
      result: { data: 'expired' },
      ttl: 86400000, // 24 hours
    };

    cache.set('key4', entry);
    const retrieved = cache.get('key4');

    expect(retrieved).toBeNull(); // Expired
  });

  test('fails closed when cache check throws', async () => {
    const key = { operation: 'create_payment', resourceId: 'pay_123', hash: 'abc...' };

    // Simulate cache corruption
    jest.spyOn(cache, 'get').mockImplementation(() => {
      throw new Error('Cache corrupted');
    });

    await expect(
      performIdempotentOperation(key, async () => ({ result: 'data' }))
    ).rejects.toThrow('Idempotency check failed');
  });
});
```

### Integration Tests

```typescript
describe('Idempotency Integration', () => {
  test('prevents duplicate payments within 24 hours', async () => {
    const paymentData = {
      amount: 100,
      userId: 'user_123',
      timestamp: Date.now(),
    };

    // First payment
    const payment1 = await createPayment(paymentData);
    expect(payment1.status).toBe('completed');

    // Retry after 30 minutes (within 24-hour window)
    await sleep(100); // Simulate delay
    const payment2 = await createPayment(paymentData);

    // Should return cached result, not create duplicate
    expect(payment2.id).toBe(payment1.id);
    expect(payment2.status).toBe('completed');
  });

  test('allows retry after 24-hour window expires', async () => {
    const paymentData = {
      amount: 100,
      userId: 'user_456',
      timestamp: Date.now(),
    };

    // First payment
    const payment1 = await createPayment(paymentData);

    // Simulate 24 hours + 1 second passing
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 86400001);

    // Retry after expiration
    const payment2 = await createPayment(paymentData);

    // Should create new payment (cache expired)
    expect(payment2.id).not.toBe(payment1.id);
  });
});
```

---

## Performance Requirements

Per NFR-004 and research findings:

| Operation | Target Time | Measurement |
|-----------|-------------|-------------|
| Cache lookup | <1ms | `performance.now()` |
| Entry validation | <1ms | `performance.now()` |
| Hash generation | <5ms | `performance.now()` |
| PII sanitization | <5ms | For <10KB objects |
| Depth validation | <2ms | For 10-level objects |

---

## Security Considerations

### Hash Collision Attacks

SHA-256 provides 2^256 possible hashes - collision probability is negligible for practical purposes. However:

```typescript
// Include operation type in key to prevent cross-operation collisions
const key = {
  operation: 'create_payment', // Namespacing
  resourceId: paymentId,
  hash: generateHash(request),
};
```

### Cache Poisoning

Validate all cache entries before use:

```typescript
// ❌ BAD: Trust cache blindly
const cached = cache.get(key);
return cached.result; // Could be malicious data

// ✅ GOOD: Validate before using
const cached = cache.get(key);
if (!cached) return performOperation();

const validated = validateCacheEntry(cached); // Schema check
return validated.result; // Safe to use
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial idempotency cache contract |
