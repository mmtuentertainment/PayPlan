# ADR 001: localStorage Quota Race Condition Handling

**Status**: Accepted
**Date**: 2025-11-08
**Author**: Claude Code
**Bot Review Issue**: M3 - Storage Quota Race Condition Documentation
**Feature**: Goal Tracking Dashboard (064-short-name-goal, Phase 11: Polish)

---

## Context

PayPlan uses localStorage as the primary storage mechanism (Privacy-First principle). localStorage has a typical quota of 5-10 MB per origin, which can be exceeded when users have many goals or large contribution histories.

When writing to localStorage, there are two competing concerns:

1. **User Experience**: Users should receive immediate feedback if storage is nearly full, before attempting a write operation that will fail
2. **Race Conditions**: Multiple browser tabs can write to localStorage concurrently, meaning storage can become full between a quota check and a write attempt

A naive implementation using only pre-checks can fail due to race conditions. A naive implementation using only try-catch has poor UX (users don't see warnings until writes fail).

## Decision

We implement a **dual-layer defense-in-depth approach** for storage quota handling:

### Layer 1: Pre-Check (Early Feedback)
- Check storage quota **before** attempting write operations
- Block writes if storage is >95% full (critical threshold)
- Provide immediate, user-friendly error messages
- Update UI quota indicator

### Layer 2: Try-Catch (Race Condition Safety Net)
- Wrap `localStorage.setItem()` calls in try-catch blocks
- Catch `QuotaExceededError` exceptions
- Handle quota errors even if pre-check passed (race condition case)
- Provide fallback error messaging

## Rationale

### Why Pre-Check Alone Is Insufficient
```typescript
// ❌ FAILS: Race condition vulnerability
function createGoal(input) {
  const quota = checkStorageQuota();
  if (quota.critical) {
    return { success: false, error: 'Storage full' };
  }

  // ⚠️ RACE CONDITION: Another tab could fill storage HERE
  localStorage.setItem('goals', JSON.stringify(goals));
  // ⚠️ Uncaught QuotaExceededError crashes the app!
}
```

**Problem**: Between the quota check and the write, another browser tab could consume the remaining storage, causing an uncaught `QuotaExceededError`.

### Why Try-Catch Alone Is Insufficient
```typescript
// ❌ POOR UX: No early warning
function createGoal(input) {
  try {
    localStorage.setItem('goals', JSON.stringify(goals));
    return { success: true };
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      return { success: false, error: 'Storage full' };
    }
  }
}
```

**Problem**: User doesn't receive a warning until their write operation fails. If storage is 95% full but not yet exceeded, users should be warned proactively.

### Why Both Layers Together Succeed
```typescript
// ✅ CORRECT: Dual-layer approach
function createGoal(input) {
  // Layer 1: Pre-check (early feedback)
  const quota = checkStorageQuota();
  if (quota.critical) {
    return { success: false, error: 'Storage full (pre-check)' };
  }

  // Layer 2: Try-catch (race condition safety net)
  try {
    localStorage.setItem('goals', JSON.stringify(goals));
    return { success: true };
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      // Handle race condition: storage filled by another tab
      return { success: false, error: 'Storage full (race)' };
    }
    throw err; // Re-throw unexpected errors
  }
}
```

**Benefits**:
- ✅ **Best-effort prevention** via pre-check (99% of cases)
- ✅ **Guaranteed error handling** via try-catch (race condition cases)
- ✅ **Good UX** (early warnings when quota approaches limits)
- ✅ **Robust** (handles concurrent writes from multiple tabs)

## Implementation

### Code Location
- **Primary Implementation**: [`frontend/src/features/goals/hooks/useGoals.ts:142-219`](../../frontend/src/features/goals/hooks/useGoals.ts#L142-L219)
- **Quota Utility**: [`frontend/src/shared/lib/storage.ts`](../../frontend/src/shared/lib/storage.ts)

### Key Threshold
- **Critical quota**: >95% full (block new writes, show error)
- **Warning quota**: >80% full (show warning, allow writes)
- **Normal quota**: <80% full (no warnings)

### Cross-Tab Synchronization
The quota check is also updated via `storage` event listeners to detect changes made by other tabs:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'payplan_goals_v1') {
      refreshGoals(); // Reload goals from localStorage
      checkQuota();   // Update quota indicator
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Consequences

### Positive
- ✅ **Prevents most quota errors** via early detection (pre-check layer)
- ✅ **Handles all quota errors** including race conditions (try-catch layer)
- ✅ **Good user experience** (proactive warnings, not just error messages)
- ✅ **Robust across multiple tabs** (storage event listeners + try-catch)
- ✅ **Fails gracefully** (never crashes app, always returns user-friendly errors)

### Negative
- ❌ **Slight performance overhead** (quota check on every write operation)
- ❌ **Code duplication** (both pre-check and try-catch in every write function)
- ❌ **Not 100% preventable** (race conditions still possible in extreme edge cases)

### Neutral
- 📝 **Documentation requirement** (pattern must be applied consistently across all features)
- 📝 **Testing complexity** (must test both pre-check path and race condition path)

## Alternatives Considered

### Alternative 1: Pre-Check Only
**Rejected**: Vulnerable to race conditions (multiple tabs writing concurrently)

### Alternative 2: Try-Catch Only
**Rejected**: Poor UX (no early warnings, users only see errors after writes fail)

### Alternative 3: Web Locks API
**Rejected**: Limited browser support (not available in Safari as of 2025), adds complexity

### Alternative 4: Storage Quota API
**Considered**: `navigator.storage.estimate()` provides accurate quota information, but:
- Only works in secure contexts (HTTPS)
- Not supported in all browsers
- Still requires try-catch for race conditions
- We still use `localStorage` size calculation as fallback

## Related Decisions

- **Constitution Principle I: Privacy-First** - localStorage-only storage (no server required)
- **Feature 064, Phase 11 (Polish)**: Storage quota indicator in Goal dashboard
- **T101: Storage Quota Checks** - Pre-check before creating/updating goals

## References

- [MDN: Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN: QuotaExceededError](https://developer.mozilla.org/en-US/docs/Web/API/DOMException#quotaexceedederror)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)

---

## Adoption Checklist

This pattern should be applied to ALL features that write to localStorage:

- [x] **Goals** (Feature 064) - `useGoals.ts` (createGoal, updateGoal)
- [ ] **Categories** (Feature 061) - Apply pattern to category creation
- [ ] **Budgets** (Feature 061) - Apply pattern to budget creation
- [ ] **Transactions** (Feature 062) - Apply pattern to transaction entry
- [ ] **Bills** (Future) - Apply pattern to recurring bill creation
- [ ] **Archives** (Future) - Apply pattern to archive operations

---

**Note**: This ADR was created in response to bot review issue M3, which identified the inline documentation in `useGoals.ts` as excellent but potentially more discoverable as a formal ADR.
