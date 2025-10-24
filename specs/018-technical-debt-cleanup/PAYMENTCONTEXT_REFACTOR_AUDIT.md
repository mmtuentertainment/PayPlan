# PaymentContext Refactor Pre-Audit

**Feature:** 018-technical-debt-cleanup
**User Story:** 3 (P2) - Architecture & Runtime Validation
**Tasks:** T068-T073
**Date:** 2025-10-24

## Executive Summary

The PaymentContext refactor aims to implement **atomic updates** and **React 19's useOptimistic** hook to prevent race conditions during concurrent state updates. This audit analyzes the current implementation and provides a safe refactor plan.

---

## Current Architecture Analysis

### File Structure

```
frontend/src/contexts/
├── PaymentContext.tsx          # Main provider + usePaymentContext hook
├── PaymentContext.context.ts   # Context definition (split for Fast Refresh)
├── PaymentContext.types.ts     # TypeScript interfaces
└── __tests__/
    └── PaymentContext.test.tsx # 425 lines of validation tests (Vitest)
```

### Current Implementation (PaymentContext.tsx)

**State Management:**
```typescript
// Internal state with validation
const [internalPayments, setInternalPayments] = useState<PaymentRecord[]>(value.payments);

// Validated setter
const validatedSetPayments = useMemo(() => {
  return (payments: PaymentRecord[]) => {
    // 1. Validate with Zod schema
    // 2. Update internal state
    // 3. Call parent setter
    setInternalPayments(payments);
    value.setPayments(payments);
  };
}, [value]);
```

**Key Characteristics:**
- ✅ Zod validation on every update (security layer)
- ✅ Error handling with console.error for detailed logging
- ✅ Memoized context value to prevent re-renders
- ❌ **Non-atomic updates**: Two separate setState calls (`setInternalPayments` + `value.setPayments`)
- ❌ **No race condition protection**: Concurrent updates could overwrite each other
- ❌ **No optimistic updates**: No visual feedback before async operations complete

### Usage Pattern (Home.tsx)

```typescript
const paymentContextValue = useMemo(() => ({
  payments: normalizedPayments,
  setPayments: () => {}, // Read-only stub (payments come from API)
}), [normalizedPayments]);

<PaymentContextProvider value={paymentContextValue}>
  {/* App components */}
</PaymentContextProvider>
```

**Current Usage:**
- **Read-only** in Home.tsx (`setPayments: () => {}`)
- Payments derived from API response (`res.normalized`)
- No actual mutations happening via `setPayments` currently
- IDs generated on every `res` change via `useMemo`

### Test Coverage

**File:** `frontend/src/contexts/__tests__/PaymentContext.test.tsx`

**Test Structure:**
- ✅ 425 lines of comprehensive validation tests
- ✅ Amount validation (negative, zero, small, large, decimal precision)
- ✅ Currency validation (ISO 4217 codes, case sensitivity)
- ✅ Date validation (YYYY-MM-DD format, leap years)
- ✅ UUID validation (v4 format, optional field)
- ✅ Provider validation (real BNPL names)
- ✅ Uses Vitest (`describe`, `it`, `expect`)
- ✅ React Testing Library (`render`, `TestWrapper`)

**Test Pattern:**
```typescript
function TestWrapper({ children }: { children: React.ReactNode }) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  return (
    <PaymentContextProvider value={{ payments, setPayments }}>
      {children}
    </PaymentContextProvider>
  );
}
```

---

## Race Condition Risk Analysis

### Current Race Condition Scenarios

**Scenario 1: Concurrent Updates (Theoretical)**
```typescript
// If multiple components call setPayments simultaneously:
setPayments([payment1]); // Update 1
setPayments([payment2]); // Update 2 (overwrites update 1)

// Without functional setState:
setInternalPayments(payments);      // Non-atomic
value.setPayments(payments);        // Second non-atomic call
```

**Risk:** Lost updates if both calls happen before either completes.

**Scenario 2: Archive Creation + Payment Update (Theoretical)**
```typescript
// Component A: Archive button
const { payments } = usePaymentContext();
createArchive(payments); // Reads payments

// Component B: Payment update (if enabled)
setPayments(newPayments); // Writes payments

// If reads/writes overlap, archive might snapshot inconsistent state
```

**Risk:** Archive could contain partial/stale data.

### Current Mitigation

**Why Race Conditions Are Unlikely Now:**
1. **Read-only usage**: Home.tsx provides `setPayments: () => {}` stub
2. **Single source**: Payments only updated when API returns new `res`
3. **Memoization**: `normalizedPayments` only changes when `res` changes
4. **No concurrent writes**: No components currently call `setPayments` with real data

**Risk Assessment:** 🟡 **Low** (but will increase if mutations are added in future features)

---

## React 19 useOptimistic Integration

### What is useOptimistic?

React 19 introduced `useOptimistic` for optimistic UI updates:

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  actualState,
  (currentState, optimisticValue) => {
    // Merge logic
    return [...currentState, optimisticValue];
  }
);
```

**Benefits:**
- Shows immediate UI feedback before async operations complete
- Automatically reverts if operation fails
- Built-in race condition handling

**Use Case for PaymentContext:**
```typescript
// User archives a payment schedule
addOptimistic({ id: '...', status: 'archiving' }); // Immediate UI feedback
await archivePayment(); // Async operation
// If success: state updates naturally
// If failure: optimistic state auto-reverts
```

### Current Compatibility

**Blockers:**
- ❌ Home.tsx uses read-only stub (`setPayments: () => {}`)
- ❌ No async operations on payments (archives are separate entities)
- ❌ Payments are fully derived from API response (no client-side mutations)

**Recommendation:**
- ⚠️ **useOptimistic is premature** for current usage pattern
- Only add if future features introduce client-side payment mutations (e.g., manual adjustments, status updates, draft payments)

---

## Atomic Update Requirements

### What is Atomic Update?

**Non-Atomic (Current):**
```typescript
setInternalPayments(payments);  // Update 1
value.setPayments(payments);    // Update 2 (separate)
```

**Atomic (Functional setState):**
```typescript
setInternalPayments(prev => {
  const validated = validate(newPayments);
  return validated;
});

value.setPayments(prev => {
  const validated = validate(newPayments);
  return validated;
});
```

### Required Changes

**1. Convert to Functional setState:**
```typescript
const validatedSetPayments = useMemo(() => {
  return (updater: PaymentRecord[] | ((prev: PaymentRecord[]) => PaymentRecord[])) => {
    const newPayments = typeof updater === 'function'
      ? updater(internalPayments)
      : updater;

    // Validate
    const validationResults = newPayments.map(/* ... */);
    if (failures.length > 0) throw new Error(/* ... */);

    // Atomic updates
    setInternalPayments(() => newPayments);
    value.setPayments(() => newPayments);
  };
}, [internalPayments, value]);
```

**2. Update Type Definition:**
```typescript
// PaymentContext.types.ts
export interface PaymentContextType {
  payments: PaymentRecord[];
  setPayments: (
    updater: PaymentRecord[] | ((prev: PaymentRecord[]) => PaymentRecord[])
  ) => void;
}
```

**3. Update Home.tsx:**
```typescript
const paymentContextValue = useMemo(() => ({
  payments: normalizedPayments,
  setPayments: (updater) => {
    // If future mutations needed, implement here
    // For now, read-only
  },
}), [normalizedPayments]);
```

---

## Refactor Plan

### Phase 1: Add Atomic Update Support (Tasks T068-T070)

**Goal:** Support functional setState pattern without breaking existing code.

**Changes:**
1. Update `PaymentContext.types.ts`:
   - Add union type for `setPayments`: `PaymentRecord[] | ((prev: PaymentRecord[]) => PaymentRecord[])`

2. Update `PaymentContext.tsx`:
   - Convert `validatedSetPayments` to handle both array and function
   - Use functional setState for both `setInternalPayments` and `value.setPayments`

3. Add tests (`PaymentContext.test.tsx`):
   ```typescript
   it('should support functional setState pattern', () => {
     const { setPayments } = usePaymentContext();
     setPayments(prev => [...prev, newPayment]); // Functional update
   });

   it('should prevent race conditions with concurrent updates', async () => {
     // Simulate concurrent updates
     const { setPayments } = usePaymentContext();
     await Promise.all([
       setPayments(prev => [...prev, payment1]),
       setPayments(prev => [...prev, payment2]),
     ]);
     // Both payments should be present (no lost updates)
   });
   ```

**Backward Compatibility:**
- ✅ Existing array-based calls continue to work: `setPayments([payment1, payment2])`
- ✅ No changes needed in Home.tsx (stub remains valid)

### Phase 2: Add useOptimistic (Tasks T071-T073) - DEFERRED

**Decision:** Skip for now unless future feature requires it.

**Reasoning:**
- Current usage is read-only (no mutations)
- No async operations on payments
- Archives are separate entities (not payment mutations)
- Adding unused complexity violates YAGNI principle

**When to Revisit:**
- Feature adds client-side payment mutations (e.g., manual adjustments)
- Feature adds draft payments (not yet saved to API)
- Feature adds optimistic archive status updates

---

## Test Strategy

### New Tests Required (T068-T070)

**File:** `frontend/src/contexts/__tests__/PaymentContext.test.tsx`

**Test Cases:**

1. **Functional setState Support:**
   ```typescript
   it('should accept functional setState pattern', () => {
     const TestComponent = () => {
       const { setPayments } = usePaymentContext();
       setPayments(prev => [...prev, validPayment]);
       return null;
     };
     // Should not throw
   });
   ```

2. **Concurrent Update Safety:**
   ```typescript
   it('should handle concurrent updates without data loss', async () => {
     const TestComponent = () => {
       const { setPayments, payments } = usePaymentContext();

       // Simulate concurrent updates
       const update1 = () => setPayments(prev => [...prev, payment1]);
       const update2 = () => setPayments(prev => [...prev, payment2]);

       Promise.all([update1(), update2()]);

       // Verify both payments present
       expect(payments).toContainEqual(payment1);
       expect(payments).toContainEqual(payment2);
     };
   });
   ```

3. **Validation Preserved:**
   ```typescript
   it('should still validate payments with functional setState', () => {
     const TestComponent = () => {
       const { setPayments } = usePaymentContext();
       setPayments(prev => [...prev, invalidPayment]); // Missing required field
       return null;
     };
     // Should throw validation error
   });
   ```

### Existing Tests

**Status:** ✅ All 425 lines of existing tests must continue passing
- Amount validation (7 tests)
- Currency validation (3 tests)
- Date validation (3 tests)
- UUID validation (3 tests)
- Provider validation (1 test)

**Strategy:** Run full test suite after refactor:
```bash
npm run test:frontend -- PaymentContext.test.tsx
```

---

## Risk Assessment

### Low Risk ✅

- **Read-only usage**: Current implementation has no real mutations
- **Test coverage**: 425 lines of validation tests already exist
- **Backward compatibility**: Functional setState is additive (doesn't break array-based calls)

### Medium Risk ⚠️

- **Type changes**: Union type for `setPayments` could cause TypeScript errors in consumers
  - **Mitigation:** Audit all `setPayments` call sites (currently only Home.tsx with stub)
- **useState dependency**: `useMemo` depends on `value`, which could cause re-renders
  - **Mitigation:** Already memoized properly

### High Risk (if not careful) 🚨

- **Breaking validation**: Refactor could accidentally remove Zod validation
  - **Mitigation:** Keep validation logic intact, only wrap in functional setState
- **Breaking fast refresh**: Splitting files incorrectly could break React Fast Refresh
  - **Mitigation:** Keep existing file structure (already split for Fast Refresh)

---

## Implementation Checklist

### Pre-Refactor
- [x] Audit current implementation
- [x] Identify all `setPayments` call sites (Home.tsx only)
- [x] Review test coverage (425 lines, comprehensive)
- [x] Document race condition scenarios (none active currently)

### Refactor Steps (T068-T070)
- [ ] Update `PaymentContext.types.ts` with union type
- [ ] Refactor `validatedSetPayments` to support functional updates
- [ ] Convert `setInternalPayments` to functional pattern
- [ ] Convert `value.setPayments` to functional pattern
- [ ] Add 3 new test cases for atomic updates
- [ ] Run full test suite (expect 425 + 3 = 428 passing tests)
- [ ] TypeScript compilation check
- [ ] Linting check

### Post-Refactor Validation
- [ ] Verify Home.tsx still works (no changes needed)
- [ ] Verify archive creation still works
- [ ] Performance check (no new re-renders)
- [ ] Document in CLAUDE.md

---

## Defer Decision: useOptimistic

**Status:** ⏸️ **NOT RECOMMENDED** for current scope

**Reasoning:**
1. Current usage is read-only (no mutations)
2. No async operations on payments
3. Premature optimization (YAGNI)
4. Adds complexity without current benefit

**When to Revisit:**
- Feature 020+: Payment mutation features
- Feature 021+: Draft payment support
- Feature 022+: Optimistic archive status

**Estimated Savings:** ~2-3 hours by deferring useOptimistic

---

## Conclusion

**Recommendation:** Implement **atomic updates only** (T068-T070), **defer useOptimistic** (T071-T073).

**Rationale:**
- ✅ Atomic updates: Low-risk, future-proofs against race conditions (even if unlikely now)
- ❌ useOptimistic: No current use case, adds complexity, can be added later if needed

**Estimated Effort:**
- Atomic updates: 1-1.5 hours (implementation + tests)
- useOptimistic (deferred): Would add 2-3 hours with no current benefit

**Next Steps:**
1. Implement atomic updates (T068-T070)
2. Skip useOptimistic (T071-T073) - mark as deferred in tasks.md
3. Move to Phase 4 completion

---

**Audit Completed:** 2025-10-24
**Auditor:** Claude (Feature 018, Phase 4)
