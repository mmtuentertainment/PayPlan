# Research Findings: useSyncExternalStore Common Bugs

## From React Official Docs

### Critical Issue #1: getSnapshot MUST Return Cached Values

**The Error:**
> "The result of getSnapshot should be cached to avoid an infinite loop"

**Root Cause:**
- If `getSnapshot` returns a NEW object every time, React will re-render infinitely
- React compares the return value with the previous one
- If it's always different (new object reference), infinite loop

**Example of BROKEN code:**
```javascript
function getSnapshot() {
  // 🔴 WRONG: Returns new object every time
  return {
    todos: myStore.todos
  };
}
```

**Example of CORRECT code:**
```javascript
function getSnapshot() {
  // ✅ CORRECT: Returns immutable data directly
  return myStore.todos;
}
```

### Critical Issue #2: subscribe Function Must Be Stable

**The Problem:**
- If `subscribe` is defined inside the component, it's a NEW function on every render
- React will resubscribe on every render (performance issue)

**Solution:**
- Define `subscribe` outside the component, OR
- Wrap it in `useCallback` with proper dependencies

---

## From Medium Article (Amit's Debugging Article)

Title: "This Tiny React Optimization Prevents Hours of Debugging"

**Key Insight:**
> "Syncing React state with localStorage using useSyncExternalStore can break your app"

This suggests there ARE common pitfalls specific to localStorage + useSyncExternalStore.

---

## From Stack Overflow

### Common Error: "Maximum update depth exceeded"

**When it happens:**
- Using hooks inside `getSnapshot`
- `getSnapshot` returns different objects on each call
- Infinite loop in state updates

---

## What I Need to Check in Our Code

1. **Does `getSnapshot` in `useLocalStorage` return a new object every time?**
   - Line 86-94 in `/home/ubuntu/PayPlan/frontend/src/hooks/useLocalStorage.ts`
   - It calls `JSON.parse()` which ALWAYS returns a new object!
   - **THIS IS LIKELY THE BUG**

2. **Is the `subscribe` function stable?**
   - It's wrapped in `useCallback` with `[key]` dependency
   - This should be fine

---

## Hypothesis

**The bug is in `getSnapshot`:**

```typescript
const getSnapshot = useCallback((): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;  // ❌ NEW OBJECT EVERY TIME!
  } catch (error) {
    console.error(`[useLocalStorage] Error reading key "${key}":`, error);
    return initialValue;
  }
}, [key, initialValue]);
```

Every time `getSnapshot` is called, `JSON.parse()` returns a **new object reference**, even if the content is the same. This causes React to think the state changed, triggering a re-render, which calls `getSnapshot` again, creating an infinite loop.

---

## The Fix

We need to **cache the parsed value** and only return a new object if the localStorage content actually changed.

**Option 1: Cache based on string comparison**
```typescript
let cachedValue: T | null = null;
let cachedString: string | null = null;

const getSnapshot = useCallback((): T => {
  const item = window.localStorage.getItem(key);
  
  // Only parse if the string changed
  if (item !== cachedString) {
    cachedString = item;
    cachedValue = item ? JSON.parse(item) : initialValue;
  }
  
  return cachedValue!;
}, [key, initialValue]);
```

**Option 2: Use a ref to store the cache**
```typescript
const cache = useRef<{ string: string | null; value: T | null }>({ string: null, value: null });

const getSnapshot = useCallback((): T => {
  const item = window.localStorage.getItem(key);
  
  if (item !== cache.current.string) {
    cache.current.string = item;
    cache.current.value = item ? JSON.parse(item) : initialValue;
  }
  
  return cache.current.value!;
}, [key, initialValue]);
```

---

## Next Steps

1. Verify this is the bug by checking if `getSnapshot` is being called repeatedly
2. Update the `useLocalStorage` hook to cache the parsed value
3. Test the fix locally
4. Update the Claude Code prompt with the REAL root cause and fix
