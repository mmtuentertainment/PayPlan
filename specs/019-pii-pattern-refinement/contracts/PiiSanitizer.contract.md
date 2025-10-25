# API Contract: PiiSanitizer Pattern Matching

**Feature**: 019-pii-pattern-refinement
**Date**: 2025-10-24
**Module**: `backend/src/lib/security/PiiSanitizer.js`

## Purpose

This contract defines the behavior of the enhanced PII Sanitizer with word boundary-based pattern matching. All implementations must satisfy these contracts to ensure false positive elimination, authentication secret detection, and backward compatibility.

## Public API

### Class: `PiiSanitizer`

#### Constructor

```javascript
new PiiSanitizer()
```

**Description**: Creates a new PII sanitizer instance with pre-configured patterns.

**Postconditions**:
- Instance has `piiPatterns` array with all required patterns
- Authentication secret patterns (password, token, apiKey, secret, auth, credential, authorization, passwd) are present
- Contact PII patterns (email, phone, address, name) are present
- Financial patterns (card, account, bankaccount, etc.) are present
- Network patterns (ip with scoped matching) are present

**Contract Assertions**:
```javascript
const sanitizer = new PiiSanitizer();
assert(sanitizer.piiPatterns.length > 0, 'Must have patterns configured');
assert(sanitizer.piiPatterns.some(p => p.includes('password')), 'Must include password pattern');
assert(sanitizer.piiPatterns.some(p => p.includes('token')), 'Must include token pattern');
assert(sanitizer.piiPatterns.some(p => p.includes('email')), 'Must include email pattern');
```

---

### Method: `sanitize(data, visited?)`

**Signature**:
```javascript
sanitize(data: any, visited?: WeakSet): any
```

**Description**: Removes PII fields from an object recursively using word boundary pattern matching.

**Parameters**:
- `data` (any, required): The data to sanitize (object, array, primitive, null, undefined)
- `visited` (WeakSet, optional): Internal circular reference tracker (users should not provide this)

**Returns**: Sanitized data
- Same reference as input if no PII found (structural sharing optimization)
- New object/array with PII removed if PII found
- Primitives returned as-is
- `null`/`undefined` returned as-is

**Preconditions**:
- None (method accepts any input type)

**Postconditions**:
- Result contains no PII field names matching configured patterns
- Non-PII fields are preserved with original values
- Nested structures are recursively sanitized
- Circular references are replaced with `'[Circular]'` string
- Performance completes in <50ms for typical objects (10-50 fields, 2-3 levels)

**Side Effects**:
- None (pure function - does not modify input data)

---

### Method: `isPiiField(fieldName)`

**Signature**:
```javascript
isPiiField(fieldName: string): boolean
```

**Description**: Checks if a field name matches any PII pattern using word boundary matching.

**Parameters**:
- `fieldName` (string, required): The field name to check

**Returns**: Boolean
- `true` if field matches any PII pattern at word boundaries
- `false` if field does not match any pattern

**Preconditions**:
- `fieldName` must be a string

**Postconditions**:
- Returns deterministic result (same input always produces same output)

**Side Effects**:
- None (pure function)

---

## Pattern Matching Contracts

### Contract 1: Word Boundary Detection (FR-001, FR-002, FR-003)

**Given**: A field name with patterns at word boundaries
**When**: `isPiiField()` is called with the field name
**Then**: Returns `true` if pattern appears at camelCase or snake_case boundary

**Test Assertions**:
```javascript
// camelCase boundaries
assert(sanitizer.isPiiField('userName') === true, 'Must match userName (camelCase)');
assert(sanitizer.isPiiField('userEmail') === true, 'Must match userEmail (camelCase)');
assert(sanitizer.isPiiField('firstName') === true, 'Must match firstName (camelCase)');

// snake_case boundaries
assert(sanitizer.isPiiField('user_name') === true, 'Must match user_name (snake_case)');
assert(sanitizer.isPiiField('user_email') === true, 'Must match user_email (snake_case)');
assert(sanitizer.isPiiField('first_name') === true, 'Must match first_name (snake_case)');

// Exact matches
assert(sanitizer.isPiiField('name') === true, 'Must match standalone name');
assert(sanitizer.isPiiField('email') === true, 'Must match standalone email');
```

---

### Contract 2: False Positive Prevention (FR-009)

**Given**: A field name where pattern appears within a larger word (not at boundary)
**When**: `isPiiField()` is called with the field name
**Then**: Returns `false` (pattern must NOT match)

**Test Assertions**:
```javascript
// 'name' pattern should NOT match these
assert(sanitizer.isPiiField('filename') === false, 'Must NOT match filename');
assert(sanitizer.isPiiField('username') === false, 'Must NOT match username (no camelCase boundary)');
assert(sanitizer.isPiiField('hostname') === false, 'Must NOT match hostname');
assert(sanitizer.isPiiField('rename') === false, 'Must NOT match rename');

// 'account' pattern should NOT match these
assert(sanitizer.isPiiField('accountId') === false, 'Must NOT match accountId');
assert(sanitizer.isPiiField('accountType') === false, 'Must NOT match accountType');

// 'card' pattern should NOT match these
assert(sanitizer.isPiiField('dashboard') === false, 'Must NOT match dashboard');
assert(sanitizer.isPiiField('discard') === false, 'Must NOT match discard');

// 'ip' pattern should NOT match these (scoped pattern)
assert(sanitizer.isPiiField('zip') === false, 'Must NOT match zip');
assert(sanitizer.isPiiField('ship') === false, 'Must NOT match ship');
assert(sanitizer.isPiiField('tip') === false, 'Must NOT match tip');
```

---

### Contract 3: Authentication Secret Detection (FR-010)

**Given**: A field name containing authentication secret patterns
**When**: `isPiiField()` is called with the field name
**Then**: Returns `true` (must detect all auth secrets)

**Test Assertions**:
```javascript
// Exact matches
assert(sanitizer.isPiiField('password') === true, 'Must match password');
assert(sanitizer.isPiiField('token') === true, 'Must match token');
assert(sanitizer.isPiiField('apiKey') === true, 'Must match apiKey');
assert(sanitizer.isPiiField('secret') === true, 'Must match secret');

// Compound fields with auth secrets at boundaries
assert(sanitizer.isPiiField('userPassword') === true, 'Must match userPassword');
assert(sanitizer.isPiiField('accessToken') === true, 'Must match accessToken');
assert(sanitizer.isPiiField('api_key') === true, 'Must match api_key');
assert(sanitizer.isPiiField('client_secret') === true, 'Must match client_secret');
```

---

### Contract 4: Case Insensitivity (FR-004)

**Given**: A field name with various case variations
**When**: `isPiiField()` is called with the field name
**Then**: Returns `true` for all case variations

**Test Assertions**:
```javascript
assert(sanitizer.isPiiField('name') === true, 'Must match lowercase name');
assert(sanitizer.isPiiField('Name') === true, 'Must match capitalized Name');
assert(sanitizer.isPiiField('NAME') === true, 'Must match uppercase NAME');
assert(sanitizer.isPiiField('NaMe') === true, 'Must match mixed case NaMe');

assert(sanitizer.isPiiField('EMAIL') === true, 'Must match uppercase EMAIL');
assert(sanitizer.isPiiField('Email') === true, 'Must match capitalized Email');
```

---

### Contract 5: Scoped IP Pattern (FR-011)

**Given**: A field name containing 'ip' substring
**When**: `isPiiField()` is called with the field name
**Then**: Returns `true` ONLY for specific compound patterns (ipAddress, remote_ip, etc.)

**Test Assertions**:
```javascript
// Allowed compound patterns
assert(sanitizer.isPiiField('ipAddress') === true, 'Must match ipAddress');
assert(sanitizer.isPiiField('remoteIp') === true, 'Must match remoteIp');
assert(sanitizer.isPiiField('clientIp') === true, 'Must match clientIp');
assert(sanitizer.isPiiField('remote_ip') === true, 'Must match remote_ip');
assert(sanitizer.isPiiField('client_ip') === true, 'Must match client_ip');

// NOT allowed (false positives)
assert(sanitizer.isPiiField('zip') === false, 'Must NOT match zip');
assert(sanitizer.isPiiField('ship') === false, 'Must NOT match ship');
assert(sanitizer.isPiiField('tip') === false, 'Must NOT match tip');
assert(sanitizer.isPiiField('ip') === false, 'Must NOT match standalone ip');
```

---

## Sanitization Behavior Contracts

### Contract 6: Structural Sharing Optimization (FR-008)

**Given**: An object with no PII fields
**When**: `sanitize()` is called on the object
**Then**: Returns the exact same object reference (not a copy)

**Test Assertions**:
```javascript
const clean = { id: '123', amount: 100, filename: 'report.csv' };
const result = sanitizer.sanitize(clean);
assert(result === clean, 'Must return same reference when no PII');
```

---

### Contract 7: PII Removal (FR-005)

**Given**: An object with PII fields
**When**: `sanitize()` is called on the object
**Then**: Returns a new object with PII fields removed, non-PII preserved

**Test Assertions**:
```javascript
const dirty = { id: '123', email: 'user@example.com', amount: 100 };
const result = sanitizer.sanitize(dirty);
assert(result !== dirty, 'Must return new object when PII found');
assert(result.id === '123', 'Must preserve non-PII field: id');
assert(result.amount === 100, 'Must preserve non-PII field: amount');
assert(!('email' in result), 'Must remove PII field: email');
```

---

### Contract 8: Nested Sanitization (FR-005)

**Given**: An object with nested objects/arrays containing PII
**When**: `sanitize()` is called on the object
**Then**: Recursively sanitizes all nested structures

**Test Assertions**:
```javascript
const nested = {
  user: {
    id: '123',
    email: 'user@example.com',
    profile: {
      name: 'John Doe',
      age: 30
    }
  },
  amount: 100
};

const result = sanitizer.sanitize(nested);
assert(result.user.id === '123', 'Must preserve nested non-PII: id');
assert(!('email' in result.user), 'Must remove nested PII: email');
assert(!('name' in result.user.profile), 'Must remove deeply nested PII: name');
assert(result.user.profile.age === 30, 'Must preserve deeply nested non-PII: age');
assert(result.amount === 100, 'Must preserve top-level non-PII: amount');
```

---

### Contract 9: Circular Reference Handling (FR-005)

**Given**: An object with circular references
**When**: `sanitize()` is called on the object
**Then**: Replaces circular references with `'[Circular]'` string

**Test Assertions**:
```javascript
const circular = { id: '123', amount: 100 };
circular.self = circular;

const result = sanitizer.sanitize(circular);
assert(result.id === '123', 'Must preserve non-circular fields');
assert(result.amount === 100, 'Must preserve non-circular fields');
assert(result.self === '[Circular]', 'Must replace circular reference with placeholder');
```

---

### Contract 10: Special Object Type Handling (FR-006)

**Given**: Objects with special types (Date, RegExp, Map, Set)
**When**: `sanitize()` is called on these objects
**Then**: Converts to appropriate string/array representation

**Test Assertions**:
```javascript
// Date
const withDate = { timestamp: new Date('2025-10-24T12:00:00Z') };
const result1 = sanitizer.sanitize(withDate);
assert(typeof result1.timestamp === 'string', 'Must convert Date to ISO string');

// RegExp
const withRegex = { pattern: /test/i };
const result2 = sanitizer.sanitize(withRegex);
assert(typeof result2.pattern === 'string', 'Must convert RegExp to string');

// Map (with PII keys)
const withMap = { data: new Map([['email', 'user@example.com'], ['id', '123']]) };
const result3 = sanitizer.sanitize(withMap);
assert(typeof result3.data === 'object', 'Must convert Map to object');
assert(!('email' in result3.data), 'Must sanitize PII keys in Map');

// Set
const withSet = { tags: new Set(['tag1', 'tag2']) };
const result4 = sanitizer.sanitize(withSet);
assert(Array.isArray(result4.tags), 'Must convert Set to array');
```

---

### Contract 11: Prototype Pollution Protection (FR-005)

**Given**: An object with dangerous keys (__proto__, constructor, prototype)
**When**: `sanitize()` is called on the object
**Then**: Removes dangerous keys to prevent prototype pollution

**Test Assertions**:
```javascript
const dangerous = {
  id: '123',
  __proto__: { malicious: true },
  constructor: { malicious: true },
  prototype: { malicious: true }
};

const result = sanitizer.sanitize(dangerous);
assert(result.id === '123', 'Must preserve safe fields');
assert(!('__proto__' in result), 'Must remove __proto__');
assert(!('constructor' in result), 'Must remove constructor');
assert(!('prototype' in result), 'Must remove prototype');
```

---

## Performance Contracts

### Contract 12: Performance Target (FR-008, SC-004)

**Given**: A typical object (10-50 fields, 2-3 nesting levels)
**When**: `sanitize()` is called on the object
**Then**: Completes in <50ms

**Test Assertions**:
```javascript
const typical = {
  id: '123',
  email: 'user@example.com',
  profile: {
    name: 'John Doe',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'Springfield'
    }
  },
  transactions: Array(20).fill({ amount: 100, date: '2025-10-24' })
};

const start = performance.now();
const result = sanitizer.sanitize(typical);
const duration = performance.now() - start;

assert(duration < 50, `Must complete in <50ms, took ${duration}ms`);
```

---

## Backward Compatibility Contracts

### Contract 13: Existing Test Compatibility (FR-007, SC-003)

**Given**: All 226+ existing backend tests from Feature 018
**When**: Tests are run against the enhanced PiiSanitizer
**Then**: All tests pass (zero breaking changes to valid behavior)

**Test Assertions**:
```javascript
// This is a meta-assertion validated by the test suite
// Run: npm test -- PiiSanitizer.test.ts
// Expected: All existing tests pass + 30-50 new tests for word boundary matching
assert(existingTestsPassed === true, 'All 226+ existing tests must pass');
assert(newTestsPassed === true, 'All new word boundary tests must pass');
assert(totalTests >= 256, 'Total test count must be 226 + 30+ new tests');
```

---

## Input/Output Schema

### `sanitize()` Input Schema

```typescript
type Input = any; // Accepts all JavaScript types

// Valid inputs:
// - null
// - undefined
// - primitives (string, number, boolean)
// - objects (plain, Date, RegExp, Map, Set)
// - arrays
// - nested structures
// - circular references
```

### `sanitize()` Output Schema

```typescript
type Output = any; // Returns same type family as input

// Output types:
// - null → null
// - undefined → undefined
// - primitive → primitive (unchanged)
// - object with no PII → same reference
// - object with PII → new object (PII removed)
// - array with no PII → same reference
// - array with PII → new array (PII removed)
// - circular reference → '[Circular]' string
```

### `isPiiField()` Input Schema

```typescript
type FieldNameInput = string;

// Valid inputs:
// - Any non-empty string
// - camelCase field names (e.g., 'userName')
// - snake_case field names (e.g., 'user_name')
// - Mixed case (e.g., 'UserName')
// - Single word (e.g., 'email')
```

### `isPiiField()` Output Schema

```typescript
type FieldNameOutput = boolean;

// true: Field matches a PII pattern at word boundary
// false: Field does not match any pattern OR matches only within larger word
```

---

## Error Handling

### No Exceptions Thrown

**Contract**: `sanitize()` and `isPiiField()` must NEVER throw exceptions

**Rationale**: These methods are used in error logging/observability code. If they throw exceptions, they would break the very systems designed to capture errors.

**Error Handling Strategy**:
- Invalid input types: Return as-is (primitives, null, undefined)
- Circular references: Replace with `'[Circular]'` string (no throw)
- Special object types: Convert to safe representations
- Malicious input: Sanitize safely (prototype pollution protection)

**Test Assertions**:
```javascript
// Should not throw on any input
assert.doesNotThrow(() => sanitizer.sanitize(null));
assert.doesNotThrow(() => sanitizer.sanitize(undefined));
assert.doesNotThrow(() => sanitizer.sanitize(123));
assert.doesNotThrow(() => sanitizer.sanitize('string'));
assert.doesNotThrow(() => sanitizer.sanitize(circular));
assert.doesNotThrow(() => sanitizer.sanitize({ __proto__: { malicious: true } }));
```

---

## Contract Validation Strategy

All contracts in this document will be validated through:

1. **Unit Tests**: 240-250 comprehensive tests covering all contracts (SC-007)
2. **Edge Case Tests**: 7 edge cases from spec.md explicitly tested
3. **Backward Compatibility Tests**: All 226+ existing tests must pass (SC-003)
4. **Performance Tests**: Automated timing validation for <50ms target (SC-004)

**Test Organization** (from research.md Q5):
```
describe('PII Pattern Matching', () => {
  describe('Authentication Secrets', () => { /* Contract 3 tests */ });
  describe('False Positive Prevention', () => { /* Contract 2 tests */ });
  describe('Word Boundary Detection', () => { /* Contract 1 tests */ });
  describe('Scoped IP Pattern', () => { /* Contract 5 tests */ });
  describe('Sanitization Behavior', () => { /* Contracts 6-11 tests */ });
  describe('Performance', () => { /* Contract 12 tests */ });
  describe('Backward Compatibility', () => { /* Contract 13 tests */ });
});
```

---

**Status**: Contract Definition Complete - Ready for Quickstart and Implementation
