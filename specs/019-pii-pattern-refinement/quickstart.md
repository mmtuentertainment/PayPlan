# Quickstart: Manual Testing Scenarios

**Feature**: 019-pii-pattern-refinement
**Date**: 2025-10-24
**Purpose**: Manual validation scenarios for PII pattern refinement before and after implementation

## Overview

This guide provides step-by-step manual testing scenarios to validate the word boundary-based pattern matching enhancement. These scenarios correspond directly to the acceptance criteria in the feature specification and contracts.

## Prerequisites

- Node.js 20.x installed
- PayPlan repository cloned
- Backend dependencies installed (`npm install` in backend directory)

## Test Environment Setup

```bash
# Navigate to backend directory
cd /home/matt/PROJECTS/PayPlan/backend

# Start Node.js REPL for interactive testing
node

# Load the PiiSanitizer
const { piiSanitizer } = require('./src/lib/security/PiiSanitizer.js');
```

---

## Scenario 1: Validate False Positive Prevention

**User Story**: P1 Story 1 - Developer Debugging
**Acceptance Criteria**: SC-001 (Zero false positives)
**Contract**: Contract 2

### Step 1: Test 'filename' Field (Should NOT Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { id: '123', filename: 'report.csv', amount: 100 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { id: '123', amount: 100 } - filename removed (FALSE POSITIVE)
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { id: '123', filename: 'report.csv', amount: 100 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { id: '123', filename: 'report.csv', amount: 100 } - filename preserved
console.log(result === data); // true (structural sharing - no PII found)
```

### Step 2: Test 'accountId' Field (Should NOT Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { accountId: 'acc-789', accountType: 'savings', balance: 500 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { balance: 500 } - accountId and accountType removed (FALSE POSITIVES)
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { accountId: 'acc-789', accountType: 'savings', balance: 500 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { accountId: 'acc-789', accountType: 'savings', balance: 500 } - all preserved
console.log(result === data); // true (structural sharing - no PII found)
```

### Step 3: Test 'dashboard' Field (Should NOT Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { dashboardUrl: '/app/dashboard', widgets: 5 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { widgets: 5 } - dashboardUrl removed (FALSE POSITIVE, 'card' pattern matches)
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { dashboardUrl: '/app/dashboard', widgets: 5 };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { dashboardUrl: '/app/dashboard', widgets: 5 } - all preserved
console.log(result === data); // true (structural sharing - no PII found)
```

### Step 4: Test 'zipCode' Field (Should NOT Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { zipCode: '12345', city: 'Springfield' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { city: 'Springfield' } - zipCode removed (FALSE POSITIVE, 'ip' pattern matches)
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { zipCode: '12345', city: 'Springfield' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { zipCode: '12345', city: 'Springfield' } - all preserved
console.log(result === data); // true (structural sharing - no PII found)
```

**Pass Criteria**:
- ✅ All 4 fields preserved in Feature 019 (currently fail in Feature 018)
- ✅ Structural sharing: `result === data` is `true` (same reference)
- ✅ No unnecessary object cloning

---

## Scenario 2: Validate Authentication Secret Detection

**User Story**: P1 Story 2 - Security Secret Detection
**Acceptance Criteria**: SC-002 (Zero false negatives)
**Contract**: Contract 3

### Step 1: Test 'password' Field (MUST Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { username: 'john.doe', password: 'secret123', id: '123' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { username: 'john.doe', password: 'secret123', id: '123' }
// PASSWORD NOT SANITIZED - SECURITY VULNERABILITY!
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { username: 'john.doe', password: 'secret123', id: '123' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { username: 'john.doe', id: '123' } - password removed
console.log('password' in result); // false (security secret detected and removed)
```

### Step 2: Test 'token' Field (MUST Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { userId: '123', accessToken: 'tok_abc123', sessionId: 'sess_xyz' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { userId: '123', accessToken: 'tok_abc123', sessionId: 'sess_xyz' }
// TOKEN NOT SANITIZED - SECURITY VULNERABILITY!
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { userId: '123', accessToken: 'tok_abc123', sessionId: 'sess_xyz' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { userId: '123', sessionId: 'sess_xyz' } - accessToken removed
console.log('accessToken' in result); // false (security secret detected and removed)
```

### Step 3: Test 'apiKey' Field (MUST Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { api_key: 'sk_live_abc123', endpoint: '/v1/payments' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { api_key: 'sk_live_abc123', endpoint: '/v1/payments' }
// API KEY NOT SANITIZED - SECURITY VULNERABILITY!
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { api_key: 'sk_live_abc123', endpoint: '/v1/payments' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { endpoint: '/v1/payments' } - api_key removed
console.log('api_key' in result); // false (security secret detected and removed)
```

### Step 4: Test 'clientSecret' Field (MUST Be Sanitized)

**Current Behavior** (Feature 018 - BROKEN):
```javascript
const data = { clientId: 'client_123', clientSecret: 'cs_abc123', scope: 'read' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (broken): { clientId: 'client_123', clientSecret: 'cs_abc123', scope: 'read' }
// CLIENT SECRET NOT SANITIZED - SECURITY VULNERABILITY!
```

**Expected Behavior** (Feature 019 - FIXED):
```javascript
const data = { clientId: 'client_123', clientSecret: 'cs_abc123', scope: 'read' };
const result = piiSanitizer.sanitize(data);
console.log(result);
// EXPECTED (fixed): { clientId: 'client_123', scope: 'read' } - clientSecret removed
console.log('clientSecret' in result); // false (security secret detected and removed)
```

**Pass Criteria**:
- ✅ All 8 authentication patterns detected (password, passwd, token, apiKey, secret, auth, credential, authorization)
- ✅ Both camelCase (apiKey, accessToken) and snake_case (api_key, access_token) variants detected
- ✅ No security secrets leak into sanitized output

---

## Scenario 3: Validate Word Boundary Matching (camelCase + snake_case)

**User Story**: P1 Story 1 - Developer Debugging
**Acceptance Criteria**: SC-001, SC-008 (Predictable behavior)
**Contract**: Contract 1

### Step 1: Test camelCase Boundaries

```javascript
// Valid PII at camelCase boundaries (MUST be sanitized)
const camelCase = {
  id: '123',
  userName: 'john.doe',      // 'name' at boundary → SANITIZE
  userEmail: 'j@example.com', // 'email' at boundary → SANITIZE
  firstName: 'John',          // 'name' at boundary → SANITIZE
  amount: 100
};

const result = piiSanitizer.sanitize(camelCase);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - all PII fields removed
console.log('userName' in result);  // false
console.log('userEmail' in result); // false
console.log('firstName' in result); // false
```

### Step 2: Test snake_case Boundaries

```javascript
// Valid PII at snake_case boundaries (MUST be sanitized)
const snakeCase = {
  id: '123',
  user_name: 'john.doe',      // 'name' at boundary → SANITIZE
  user_email: 'j@example.com', // 'email' at boundary → SANITIZE
  first_name: 'John',          // 'name' at boundary → SANITIZE
  amount: 100
};

const result = piiSanitizer.sanitize(snakeCase);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - all PII fields removed
console.log('user_name' in result);  // false
console.log('user_email' in result); // false
console.log('first_name' in result); // false
```

### Step 3: Test Mixed Boundaries

```javascript
// Mixed camelCase and snake_case in same object
const mixed = {
  id: '123',
  userName: 'john.doe',   // camelCase PII → SANITIZE
  user_email: 'j@ex.com', // snake_case PII → SANITIZE
  filename: 'report.csv',  // false positive → PRESERVE
  account_id: 'acc-789',   // false positive → PRESERVE
  amount: 100
};

const result = piiSanitizer.sanitize(mixed);
console.log(result);
// EXPECTED: { id: '123', filename: 'report.csv', account_id: 'acc-789', amount: 100 }
console.log('userName' in result);    // false (PII removed)
console.log('user_email' in result);  // false (PII removed)
console.log('filename' in result);    // true (preserved)
console.log('account_id' in result);  // true (preserved)
```

**Pass Criteria**:
- ✅ camelCase boundaries detected (e.g., `userName`, `userEmail`)
- ✅ snake_case boundaries detected (e.g., `user_name`, `user_email`)
- ✅ False positives NOT matched (e.g., `filename`, `account_id`)
- ✅ Mixed conventions handled correctly in same object

---

## Scenario 4: Validate Case Insensitivity

**User Story**: P1 Story 1 - Developer Debugging
**Acceptance Criteria**: SC-008 (Predictable behavior)
**Contract**: Contract 4

### Step 1: Test Various Case Variations

```javascript
// All case variations should be detected
const caseVariations = {
  name: 'John Doe',       // lowercase
  Name: 'John Doe',       // capitalized
  NAME: 'John Doe',       // uppercase
  NaMe: 'John Doe',       // mixed case
  EMAIL: 'j@example.com', // uppercase
  Email: 'j@example.com', // capitalized
  id: '123',
  amount: 100
};

const result = piiSanitizer.sanitize(caseVariations);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - all case variations removed
console.log('name' in result);  // false
console.log('Name' in result);  // false
console.log('NAME' in result);  // false
console.log('EMAIL' in result); // false
```

**Pass Criteria**:
- ✅ All case variations detected (lowercase, UPPERCASE, Capitalized, MiXeD)
- ✅ Case-insensitive matching consistent across all patterns

---

## Scenario 5: Validate Scoped IP Pattern

**User Story**: P2 Story 3 - Scoped IP Detection
**Acceptance Criteria**: SC-002 (Zero false negatives), SC-001 (Zero false positives)
**Contract**: Contract 5

### Step 1: Test IP Address Fields (MUST Be Sanitized)

```javascript
// Valid IP address fields (MUST be sanitized)
const validIp = {
  id: '123',
  ipAddress: '192.168.1.1',  // specific compound → SANITIZE
  remoteIp: '10.0.0.1',      // specific compound → SANITIZE
  clientIp: '172.16.0.1',    // specific compound → SANITIZE
  remote_ip: '10.0.0.2',     // snake_case variant → SANITIZE
  client_ip: '172.16.0.2',   // snake_case variant → SANITIZE
  amount: 100
};

const result = piiSanitizer.sanitize(validIp);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - all IP fields removed
console.log('ipAddress' in result); // false
console.log('remoteIp' in result);  // false
console.log('remote_ip' in result); // false
```

### Step 2: Test False Positives (Should NOT Be Sanitized)

```javascript
// False positives with 'ip' substring (MUST be preserved)
const falsePositives = {
  id: '123',
  zip: '12345',              // NOT an IP address → PRESERVE
  zipCode: '67890',          // NOT an IP address → PRESERVE
  ship: true,                // NOT an IP address → PRESERVE
  shipment: 'pending',       // NOT an IP address → PRESERVE
  tip: 15.00,                // NOT an IP address → PRESERVE
  description: 'payment tip', // NOT an IP address → PRESERVE
  amount: 100
};

const result = piiSanitizer.sanitize(falsePositives);
console.log(result);
// EXPECTED: Same as input (all fields preserved)
console.log(result === falsePositives); // true (structural sharing - no PII found)
console.log('zip' in result);        // true (preserved)
console.log('shipment' in result);   // true (preserved)
console.log('tip' in result);        // true (preserved)
```

**Pass Criteria**:
- ✅ Specific IP compound patterns sanitized (ipAddress, remoteIp, clientIp, remote_ip, client_ip)
- ✅ Generic 'ip' substring does NOT trigger false positives (zip, ship, tip)
- ✅ Scoped pattern prevents over-sanitization

---

## Scenario 6: Validate Authentication Secret Precedence

**User Story**: P1 Story 2 - Security Secret Detection
**Acceptance Criteria**: SC-002 (Zero false negatives), SC-006 (Improved security)
**Contract**: Contract 3 (with FR-012 precedence rule)

### Step 1: Test Compound Field with Multiple Patterns

```javascript
// Field matches both 'password' (auth secret) and 'name' (PII)
// Authentication secret should take precedence
const compoundField = {
  id: '123',
  passwordName: 'my-secret',  // Matches both 'password' and 'name'
  userName: 'john.doe',        // Matches only 'name'
  amount: 100
};

const result = piiSanitizer.sanitize(compoundField);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - both PII fields removed
// passwordName removed because 'password' pattern matches (auth secret precedence)
console.log('passwordName' in result); // false (auth secret takes precedence)
console.log('userName' in result);     // false (regular PII)
```

### Step 2: Verify Evaluation Order (Security-First)

```javascript
// Large object with both auth secrets and regular PII
// Auth secrets should be evaluated first (FR-013)
const largeObject = {
  id: '123',
  email: 'user@example.com',     // Regular PII
  phone: '555-1234',              // Regular PII
  name: 'John Doe',               // Regular PII
  password: 'secret123',          // Auth secret (evaluated first)
  token: 'tok_abc',               // Auth secret (evaluated first)
  apiKey: 'sk_live_123',          // Auth secret (evaluated first)
  amount: 100
};

const result = piiSanitizer.sanitize(largeObject);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - all PII removed
// Auth secrets evaluated first (defense-in-depth)
console.log('password' in result); // false
console.log('token' in result);    // false
console.log('apiKey' in result);   // false
console.log('email' in result);    // false
console.log('phone' in result);    // false
console.log('name' in result);     // false
```

**Pass Criteria**:
- ✅ Compound fields matching multiple patterns handled correctly
- ✅ Authentication secrets take precedence in evaluation order
- ✅ All sensitive data removed regardless of pattern category

---

## Scenario 7: Validate Backward Compatibility

**User Story**: P2 Story 4 - Backward Compatibility
**Acceptance Criteria**: SC-003 (All 226+ existing tests pass)
**Contract**: Contract 13

### Step 1: Test Existing Valid Sanitization

```javascript
// This should behave identically in Feature 018 and Feature 019
const existingBehavior = {
  id: '123',
  email: 'user@example.com',      // Always sanitized → REMOVE
  phone: '555-1234',               // Always sanitized → REMOVE
  ssn: '123-45-6789',              // Always sanitized → REMOVE
  amount: 100
};

const result = piiSanitizer.sanitize(existingBehavior);
console.log(result);
// EXPECTED: { id: '123', amount: 100 } - same behavior as Feature 018
console.log('email' in result); // false (sanitized)
console.log('phone' in result); // false (sanitized)
console.log('ssn' in result);   // false (sanitized)
```

### Step 2: Run Full Test Suite

```bash
# Exit Node.js REPL
# Run full test suite to validate backward compatibility
npm test -- PiiSanitizer.test.ts

# Expected output:
# ✓ All 226+ existing tests PASS
# ✓ 30-50 new word boundary tests PASS
# ✓ Total: 256+ tests PASS
```

**Pass Criteria**:
- ✅ All existing valid sanitization behavior unchanged
- ✅ All 226+ existing tests pass
- ✅ No breaking changes to public API

---

## Scenario 8: Validate Performance

**User Story**: P2 Story 4 - Backward Compatibility
**Acceptance Criteria**: SC-004 (Performance <50ms)
**Contract**: Contract 12

### Step 1: Test Typical Object Performance

```javascript
// Create typical object (10-50 fields, 2-3 nesting levels)
const typical = {
  id: '123',
  email: 'user@example.com',
  profile: {
    name: 'John Doe',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'Springfield',
      zip: '12345'
    }
  },
  transactions: Array(20).fill({ amount: 100, date: '2025-10-24', description: 'payment' })
};

// Measure performance
const start = performance.now();
const result = piiSanitizer.sanitize(typical);
const duration = performance.now() - start;

console.log(`Sanitization took ${duration.toFixed(2)}ms`);
console.log(`Target: <50ms`);
console.log(`Pass: ${duration < 50 ? 'YES' : 'NO'}`);
```

**Pass Criteria**:
- ✅ Typical object sanitization completes in <50ms
- ✅ Performance is comparable to Feature 018 implementation
- ✅ Regex word boundary matching does not cause significant slowdown

---

## Scenario 9: Validate Nested Structure Handling

**User Story**: P2 Story 4 - Backward Compatibility
**Acceptance Criteria**: SC-003 (All existing tests pass)
**Contract**: Contract 8

### Step 1: Test Deeply Nested PII

```javascript
// Deeply nested structure with PII at multiple levels
const nested = {
  id: '123',
  user: {
    email: 'user@example.com',  // Level 1 PII → REMOVE
    profile: {
      name: 'John Doe',          // Level 2 PII → REMOVE
      age: 30,
      contact: {
        phone: '555-1234',       // Level 3 PII → REMOVE
        address: {
          street: '123 Main St', // Level 4 PII → REMOVE
          city: 'Springfield'
        }
      }
    }
  },
  amount: 100
};

const result = piiSanitizer.sanitize(nested);
console.log(JSON.stringify(result, null, 2));
// EXPECTED:
// {
//   "id": "123",
//   "user": {
//     "profile": {
//       "age": 30,
//       "contact": {
//         "address": {
//           "city": "Springfield"
//         }
//       }
//     }
//   },
//   "amount": 100
// }

// Verify nested structure preserved
console.log(result.user.profile.age === 30);                       // true
console.log(result.user.profile.contact.address.city === 'Springfield'); // true

// Verify PII removed at all levels
console.log('email' in result.user);                    // false
console.log('name' in result.user.profile);             // false
console.log('phone' in result.user.profile.contact);    // false
console.log('street' in result.user.profile.contact.address); // false
```

**Pass Criteria**:
- ✅ PII removed at all nesting levels
- ✅ Non-PII fields preserved at all nesting levels
- ✅ Nested structure integrity maintained

---

## Scenario 10: Validate Circular Reference Handling

**User Story**: P2 Story 4 - Backward Compatibility
**Acceptance Criteria**: SC-003 (All existing tests pass)
**Contract**: Contract 9

### Step 1: Test Circular Reference Detection

```javascript
// Create object with circular reference
const circular = {
  id: '123',
  amount: 100,
  email: 'user@example.com'
};
circular.self = circular;

// Sanitize (should not throw, should handle circular ref)
const result = piiSanitizer.sanitize(circular);
console.log(result);
// EXPECTED: { id: '123', amount: 100, self: '[Circular]' }
// email removed (PII), circular reference replaced with placeholder

console.log(result.id === '123');       // true
console.log(result.amount === 100);     // true
console.log(result.self === '[Circular]'); // true (circular ref placeholder)
console.log('email' in result);         // false (PII removed)
```

**Pass Criteria**:
- ✅ Circular references detected and replaced with `'[Circular]'`
- ✅ No infinite loops or stack overflow errors
- ✅ PII still removed from circular objects

---

## Summary of Manual Test Results

After running all scenarios, validate the following:

| Scenario | Pass Criteria | Status |
|----------|--------------|--------|
| 1. False Positive Prevention | 4/4 fields preserved (filename, accountId, dashboard, zip) | ⬜ |
| 2. Auth Secret Detection | 4/4 secrets sanitized (password, token, apiKey, secret) | ⬜ |
| 3. Word Boundary Matching | camelCase + snake_case boundaries detected | ⬜ |
| 4. Case Insensitivity | All case variations detected | ⬜ |
| 5. Scoped IP Pattern | IP addresses sanitized, false positives preserved | ⬜ |
| 6. Auth Secret Precedence | Compound fields handled correctly | ⬜ |
| 7. Backward Compatibility | All 226+ existing tests pass | ⬜ |
| 8. Performance | <50ms for typical objects | ⬜ |
| 9. Nested Structure | PII removed at all nesting levels | ⬜ |
| 10. Circular References | Circular refs replaced with placeholder | ⬜ |

**Overall Feature Readiness**: ⬜ Ready for Implementation / ⬜ Needs Refinement

---

## Automated Test Execution

After manual validation, run the automated test suite:

```bash
# Run all PiiSanitizer tests
npm test -- PiiSanitizer.test.ts

# Expected output:
# PASS  backend/tests/unit/PiiSanitizer.test.ts
#   PII Pattern Matching
#     Authentication Secrets
#       ✓ password at word boundary (2ms)
#       ✓ token in compound field (1ms)
#       ✓ apiKey in snake_case (1ms)
#       ... (30-50 new tests)
#     False Positive Prevention
#       ✓ filename not sanitized (1ms)
#       ✓ accountId not sanitized (1ms)
#       ... (existing + new tests)
#     Backward Compatibility
#       ✓ all 226+ existing tests pass (20ms)
#
# Tests:  256+ passed, 256+ total
# Time:   2.5s
```

---

**Status**: Quickstart Manual Testing Guide Complete - Ready for Implementation
