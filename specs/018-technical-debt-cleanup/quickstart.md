# Quickstart Guide: Technical Debt Cleanup Testing

**Feature**: 018-technical-debt-cleanup
**Version**: 1.0
**Date**: 2025-10-23

## Overview

This guide provides manual testing scenarios for verifying all fixes in the technical debt cleanup feature. Tests are organized by priority (P0 → P3) and map directly to functional requirements.

---

## Prerequisites

### Environment Setup

```bash
# 1. Ensure you're on the feature branch
git checkout 018-technical-debt-cleanup

# 2. Install dependencies
npm install

# 3. Run full test suite (baseline)
npm test

# Expected: All 1387 tests passing (100%)
```

### Build Configurations

```bash
# Development build
npm run dev

# Production build
npm run build
npm run preview
```

---

## P0: Critical Security & Business Logic Tests

### Test 1: Production Console Logging (FR-001)

**Requirement**: System MUST NOT log payment validation details in production builds.

**Steps**:
1. Build production version:
   ```bash
   npm run build
   npm run preview
   ```

2. Open browser DevTools Console

3. Trigger a payment validation error:
   - Navigate to Results page
   - Enter invalid payment data (e.g., negative amount where not allowed)
   - Submit

**Expected**:
- ✅ Production console: No payment details logged
- ✅ Generic user-facing error message shown
- ✅ Network tab shows error, but no sensitive data in response

**Verify**:
```javascript
// In browser console, check:
console.log(import.meta.env.DEV); // Should be false
console.log(import.meta.env.PROD); // Should be true
```

**Development Build Comparison**:
1. Run `npm run dev`
2. Repeat steps above
3. ✅ Dev console SHOULD show payment details

---

### Test 2: Generic API Error Messages (FR-002)

**Requirement**: API MUST return generic error messages to clients.

**Steps**:
1. Open browser DevTools Network tab

2. Trigger various API errors:
   - Invalid request body (malformed JSON)
   - Missing required fields
   - Server error (e.g., disconnect database temporarily)

3. Inspect response bodies

**Expected**:
```json
{
  "error": "An error occurred. Please try again."
}
```

**Verify**:
- ✅ All error responses have identical message
- ✅ No field names mentioned (e.g., "amount is required")
- ✅ No stack traces
- ✅ No database/internal service names

**Server Logs** (check terminal/log files):
- ✅ Full error details logged server-side
- ✅ Includes stack trace, context, timestamp

---

### Test 3: Malformed Cache Data Resilience (FR-003)

**Requirement**: System MUST handle malformed cache data without crashing.

**Steps**:
1. Open browser DevTools Application tab → Local Storage

2. Find idempotency cache entries (keys starting with `idempotency:`)

3. Manually corrupt cache data:
   ```javascript
   // In browser console:
   localStorage.setItem('idempotency:test', '{"hash": "invalid", "timestamp": "not-a-number"}');
   ```

4. Trigger operation that uses idempotency cache

**Expected**:
- ✅ Application continues running (no crash)
- ✅ Corrupted entry treated as cache miss
- ✅ Operation proceeds normally
- ✅ Console shows warning in dev mode (not in production)

---

### Test 4: Fail-Closed Idempotency (FR-004)

**Requirement**: System MUST abort operations when idempotency checks fail.

**Steps**:
1. Simulate cache corruption in code (temporary test):
   ```typescript
   // In idempotency.ts, add:
   if (Math.random() > 0.5) {
     throw new Error('Simulated cache failure');
   }
   ```

2. Attempt payment operation

**Expected**:
- ✅ Operation aborts with error
- ✅ No partial/duplicate payment created
- ✅ User sees: "An error occurred. Please try again."

**Fail-Open Check** (verify this does NOT happen):
- ❌ Operation should NOT proceed despite error
- ❌ Should NOT create duplicate payments

---

### Test 5: 24-Hour Idempotency TTL (FR-005)

**Requirement**: System MUST prevent duplicate payments for at least 24 hours.

**Steps**:
1. Create a payment:
   ```bash
   curl -X POST http://localhost:3000/api/payment \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "userId": "user_123"}'
   ```

2. Immediately retry same request (within seconds)

3. Check response and database

**Expected (Immediate Retry)**:
- ✅ Second request returns cached result
- ✅ Only ONE payment created in database
- ✅ Response IDs match (`paymentId` identical)

**Long-Term Test** (24-hour simulation):
1. Create payment with timestamp
2. Manually update cache entry timestamp to 24 hours + 1 second ago:
   ```javascript
   const entry = JSON.parse(localStorage.getItem('idempotency:...'));
   entry.timestamp = Date.now() - (24 * 60 * 60 * 1000 + 1000);
   localStorage.setItem('idempotency:...', JSON.stringify(entry));
   ```
3. Retry payment
4. ✅ Should create new payment (cache expired)

---

## P1: Type Safety & WCAG Compliance Tests

### Test 6: WCAG Button Touch Targets (FR-006)

**Requirement**: All buttons MUST meet 44×44px minimum on mobile.

**Steps**:
1. Open application in Chrome DevTools mobile emulator:
   - Device: iPhone 12 Pro
   - Viewport: 390×844

2. Navigate to pages with buttons:
   - Payment form
   - Results page
   - Archive list

3. Inspect button elements (right-click → Inspect)

4. Check computed dimensions in Styles pane

**Expected**:
- ✅ All buttons: min-height ≥ 44px on mobile
- ✅ Touch targets include padding (total interactive area ≥ 44×44px)
- ✅ Desktop version may use smaller sizes (36px acceptable)

**Manual Touch Test**:
1. Use actual mobile device (if available)
2. Tap buttons with finger
3. ✅ All buttons easily tappable without precision

**Automated Check**:
```javascript
// In browser console:
document.querySelectorAll('button').forEach(btn => {
  const rect = btn.getBoundingClientRect();
  console.log(btn.textContent, `${rect.width}×${rect.height}px`);
  if (rect.width < 44 || rect.height < 44) {
    console.error('WCAG violation:', btn);
  }
});
```

---

### Test 7: API Request Validation (FR-007)

**Requirement**: API MUST validate all request data before processing.

**Steps**:
1. Test invalid requests via curl or Postman:

   ```bash
   # Missing required field
   curl -X POST http://localhost:3000/api/plan \
     -H "Content-Type: application/json" \
     -d '{"installments": []}'
   # Expected: 400 error, generic message

   # Invalid data type
   curl -X POST http://localhost:3000/api/plan \
     -H "Content-Type: application/json" \
     -d '{"amount": "not-a-number"}'
   # Expected: 400 error, generic message

   # Invalid format
   curl -X POST http://localhost:3000/api/plan \
     -H "Content-Type: application/json" \
     -d '{"date": "2025-13-45"}'
   # Expected: 400 error, generic message
   ```

2. Check server logs for detailed validation errors

**Expected**:
- ✅ Client: Generic error message (no field names)
- ✅ Server logs: Detailed Zod validation errors
- ✅ Validation happens BEFORE processing (check logs)

---

### Test 8: NaN Detection (FR-008)

**Requirement**: System MUST detect NaN/Infinity before financial calculations.

**Steps**:
1. Enter invalid numeric input in payment form:
   - Amount field: "abc"
   - Amount field: "1/0" (infinity)
   - Amount field: "" (empty)

2. Submit form

**Expected**:
- ✅ Form validation error before submission
- ✅ If bypassed, server rejects with error
- ✅ Error message generic to client
- ✅ Server logs show "Invalid numeric value detected"

**Console Test** (development):
```javascript
// In browser console (dev mode):
consoleGuard.error('NaN detected', { amount: parseFloat('abc') });
// Should log: "[DEV] NaN detected { amount: NaN }"
```

**Negative Amount Test** (refunds):
```bash
curl -X POST http://localhost:3000/api/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": -50, "description": "Refund"}'
```
- ✅ Should accept negative amount as refund (per clarification)

---

### Test 9: Runtime Type Guards (FR-009)

**Requirement**: UI components MUST validate input values at runtime.

**Steps**:
1. Test InputCard component with invalid values:
   - Set tab value to non-existent tab
   - Set radio value outside allowed options

2. Check console for validation errors (dev mode)

**Expected**:
- ✅ Invalid values rejected or defaulted to safe value
- ✅ No React render errors
- ✅ Console warning in dev mode (not production)

---

### Test 10: Browser API Type Safety (FR-010)

**Requirement**: Browser APIs MUST be accessed with proper typing.

**Steps**:
1. Test telemetry in browser without Do Not Track:
   ```javascript
   // In browser console:
   delete navigator.doNotTrack; // Simulate missing API
   ```

2. Trigger telemetry collection

**Expected**:
- ✅ Application continues without crash
- ✅ Graceful fallback when API missing
- ✅ No TypeScript compilation errors

---

## P2: Architecture & Runtime Validation Tests

### Test 11: JSON Depth Limit (FR-012)

**Requirement**: System MUST limit JSON nesting to 10 levels.

**Steps**:
1. Send deeply nested JSON to API:
   ```bash
   curl -X POST http://localhost:3000/api/plan \
     -H "Content-Type: application/json" \
     -d '{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":{"k":"too deep"}}}}}}}}}}}'
   ```

2. Check response

**Expected**:
- ✅ Request rejected with error
- ✅ Error message: "Maximum nesting depth exceeded"
- ✅ Client sees generic error message

**Valid Depth Test** (10 levels):
```bash
# 10 levels exactly - should succeed
curl -X POST ... -d '{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":"ok"}}}}}}}}}}'
```

---

### Test 12: PII Sanitization (FR-013)

**Requirement**: System MUST remove PII from cache entries.

**Steps**:
1. Create cache entry with PII:
   ```javascript
   const entry = {
     hash: 'abc...'.padEnd(64, '0'),
     timestamp: Date.now(),
     result: {
       paymentId: 'pay_123',
       amount: 100,
       userEmail: 'test@example.com',
       billingAddress: { street: '123 Main St' },
       userName: 'John Doe',
       phoneNumber: '555-1234',
     },
     ttl: 86400000,
   };
   ```

2. Store in cache via API call

3. Retrieve from cache and inspect

**Expected**:
- ✅ PII fields removed: `userEmail`, `userName`, `phoneNumber`, `billingAddress`
- ✅ Non-PII preserved: `paymentId`, `amount`
- ✅ Nested PII also removed

**Check in Browser DevTools**:
```javascript
// Application tab → Local Storage
const cached = JSON.parse(localStorage.getItem('idempotency:...'));
console.log(cached.result);
// Should NOT contain email, name, phone, address, ssn
```

---

### Test 13: Concurrent Payment Updates (FR-015)

**Requirement**: Payment updates MUST use atomic operations.

**Steps**:
1. Open two browser tabs with PayPlan

2. In both tabs simultaneously:
   - Add payment to same list
   - Update same payment
   - Delete same payment

3. Check final state in database/local storage

**Expected**:
- ✅ All updates applied correctly
- ✅ No race conditions (lost updates)
- ✅ Final state consistent across tabs

**Code Review Check**:
```typescript
// Verify PaymentContext uses functional setState:
setPayments(prev => [...prev, newPayment]); // ✅ Atomic
// NOT:
setPayments([...payments, newPayment]); // ❌ Race condition
```

---

## P3: Code Quality & Documentation Tests

### Test 14: Script Portability (FR-017)

**Requirement**: Scripts MUST work across different environments.

**Steps**:
1. Run fix-lint.sh on different machines:
   - Developer laptop
   - CI/CD server
   - Different user home directories

2. Check for hardcoded paths

**Expected**:
- ✅ Script runs without modification
- ✅ No hardcoded `/home/username/` paths
- ✅ Uses relative paths or environment variables

**Review Script**:
```bash
cat scripts/fix-lint.sh | grep -E '\/home|\/Users|C:\\\\Users'
# Should return no results
```

---

### Test 15: Date Sorting Reliability (FR-018)

**Requirement**: Date sorting MUST use timestamp comparison.

**Steps**:
1. Create payments with various dates:
   - Different timezones
   - Different locales
   - Edge cases (Feb 29, DST transitions)

2. Trigger sort operation

3. Verify sort order

**Expected**:
- ✅ Dates sorted correctly regardless of timezone
- ✅ Uses numeric timestamp comparison (not string comparison)
- ✅ Consistent across locales

**Code Review**:
```typescript
// ❌ BEFORE (fragile):
dates.sort((a, b) => a.localeCompare(b));

// ✅ AFTER (reliable):
dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
```

---

## Regression Testing

### Full Test Suite

After all manual tests, run automated test suite:

```bash
# Run all tests
npm test

# Expected: All 1387 tests passing (100%)
```

### Build Verification

```bash
# Development build
npm run dev
# Should start without errors

# Production build
npm run build
# Should complete without errors

# Check build metrics
npm run build -- --mode production
# Build time: Should not increase > 10% from baseline
# Bundle size: Should not increase > 5% from baseline
```

### Linting

```bash
npm run lint
# Expected: 0 errors, 0 warnings
```

---

## Performance Validation

### Validation Performance

```javascript
// In browser console or test file:
const start = performance.now();
const result = PlanRequestSchema.safeParse(largeRequest);
const duration = performance.now() - start;

console.log(`Validation took ${duration}ms`);
// Expected: <5ms for simple requests, <10ms for complex
```

### Build Time Tracking

```bash
# Baseline (before changes)
time npm run build
# Record time

# After changes
time npm run build
# Should be ≤ 110% of baseline
```

### Bundle Size Tracking

```bash
# Check bundle size
npm run build
ls -lh dist/assets/*.js

# Compare to baseline
# Should be ≤ 105% of baseline
```

---

## Acceptance Checklist

Before marking feature complete, verify:

### P0 Requirements
- [ ] Production console: No payment logs (FR-001)
- [ ] API errors: Generic message only (FR-002)
- [ ] Malformed cache: No crashes (FR-003)
- [ ] Idempotency failures: Fail-closed (FR-004)
- [ ] Duplicate prevention: 24-hour window (FR-005)

### P1 Requirements
- [ ] Button sizes: ≥44×44px mobile (FR-006)
- [ ] API validation: Zod schemas (FR-007)
- [ ] Numeric validation: NaN detection (FR-008)
- [ ] Runtime guards: UI validation (FR-009)
- [ ] Browser APIs: Type-safe access (FR-010)

### P2 Requirements
- [ ] Cache validation: Runtime schemas (FR-011)
- [ ] JSON depth: 10-level limit (FR-012)
- [ ] PII removal: Email/name/phone/address/SSN (FR-013)
- [ ] Date/time: Timezone-independent (FR-014)
- [ ] Atomic updates: Race-free (FR-015)

### P3 Requirements
- [ ] Styles: No redundant inline (FR-016)
- [ ] Scripts: Portable paths (FR-017)
- [ ] Date sorting: Timestamp comparison (FR-018)
- [ ] Linting: Documented suppressions (FR-019)

### Non-Functional Requirements
- [ ] Tests: All 1387 passing (NFR-001)
- [ ] Linting: 0 errors (NFR-002)
- [ ] Compilation: No TypeScript errors (NFR-003)
- [ ] Build time: ≤110% baseline (NFR-004)
- [ ] Bundle size: ≤105% baseline (NFR-004)
- [ ] Backward compatibility: Maintained (NFR-005)

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail in production build
- Check `import.meta.env.DEV` vs `import.meta.env.PROD`
- Verify Vite configuration

**Issue**: Validation too slow
- Profile with `performance.now()`
- Check for deep validation (should be shallow)
- Verify `.passthrough()` used

**Issue**: PII still in cache
- Check PII_FIELDS list
- Verify recursive traversal
- Test with nested objects

**Issue**: Race conditions in tests
- Add `await` for async operations
- Use `waitFor` in React testing
- Verify atomic setState patterns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-23 | Initial quickstart guide |
