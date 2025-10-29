/**
 * useLocalStorage Hook
 *
 * Feature: 061-spending-categories-budgets
 * Infrastructure: localStorage synchronization with React state
 *
 * A robust hook for syncing React state with localStorage using useSyncExternalStore.
 * Automatically syncs changes across tabs, windows, and components.
 *
 * Based on React 18+ best practices for external store synchronization.
 * Reference: https://react.dev/reference/react/useSyncExternalStore
 *
 * @example
 * function MyComponent() {
 *   const { value, setValue } = useLocalStorage('myKey', { count: 0 });
 *
 *   return (
 *     <button onClick={() => setValue({ count: value.count + 1 })}>
 *       Count: {value.count}
 *     </button>
 *   );
 * }
 */

import { useSyncExternalStore, useCallback, useRef } from 'react';

export interface UseLocalStorageResult<T> {
  /** Current value from localStorage */
  value: T;
  /** Update the value in localStorage (syncs across tabs) */
  setValue: (newValue: T) => void;
  /** Remove the value from localStorage */
  removeValue: () => void;
}

/**
 * Custom hook for syncing React state with localStorage.
 *
 * Uses useSyncExternalStore to subscribe to localStorage changes.
 * Automatically syncs across tabs and windows via storage events.
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns Current value, setter function, and remover function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageResult<T> {
  // Cache to prevent infinite loops (getSnapshot must return same object if data unchanged)
  const cache = useRef<{ stringValue: string | null; parsedValue: T | null }>({
    stringValue: null,
    parsedValue: null,
  });

  /**
   * Subscribe to localStorage changes.
   * This function is called by useSyncExternalStore to set up the subscription.
   *
   * The storage event fires when localStorage changes in OTHER tabs/windows.
   * We also listen for custom events dispatched in the current tab.
   */
  const subscribe = useCallback(
    (callback: () => void) => {
      // Listen for storage events (fired when localStorage changes in other tabs)
      const handleStorageChange = (e: StorageEvent) => {
        // Only trigger callback if our key changed (or all keys cleared)
        if (e.key === key || e.key === null) {
          callback();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // Cleanup: remove event listener when component unmounts
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    },
    [key]
  );

  /**
   * Get the current snapshot of data from localStorage.
   * This function is called by useSyncExternalStore to read the current value.
   *
   * CRITICAL: Must return the same object reference if the data hasn't changed.
   * Otherwise, React will detect a change on every call and trigger infinite re-renders.
   *
   * Called on:
   * - Initial render
   * - After storage events
   * - When React needs to re-render
   */
  const getSnapshot = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);

      // Only parse if the string value actually changed
      // This prevents infinite loops by returning the same object reference
      if (item !== cache.current.stringValue) {
        cache.current.stringValue = item;
        cache.current.parsedValue = item ? JSON.parse(item) : initialValue;
      }

      return cache.current.parsedValue as T;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  /**
   * Get the server snapshot (for SSR).
   * Since localStorage doesn't exist on the server, return the initial value.
   */
  const getServerSnapshot = useCallback((): T => {
    return initialValue;
  }, [initialValue]);

  // Subscribe to localStorage using useSyncExternalStore
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Update the value in localStorage.
   * Dispatches a custom storage event to trigger re-renders in the current tab.
   *
   * Note: The native storage event only fires in OTHER tabs, so we manually
   * dispatch it to ensure the current tab also re-renders.
   */
  const setValue = useCallback(
    (newValue: T) => {
      try {
        const valueToStore = JSON.stringify(newValue);
        const oldValue = window.localStorage.getItem(key);
        window.localStorage.setItem(key, valueToStore);

        // Manually dispatch storage event for the current tab
        // (storage event only fires in other tabs by default)
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: valueToStore,
            oldValue,
            storageArea: window.localStorage,
            url: window.location.href,
          })
        );
      } catch (error) {
        console.error(`[useLocalStorage] Error writing key "${key}":`, error);
      }
    },
    [key]
  );

  /**
   * Remove the value from localStorage.
   * Dispatches a storage event to trigger re-renders.
   */
  const removeValue = useCallback(() => {
    try {
      const oldValue = window.localStorage.getItem(key);
      window.localStorage.removeItem(key);

      // Manually dispatch storage event for the current tab
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: null,
          oldValue,
          storageArea: window.localStorage,
          url: window.location.href,
        })
      );
    } catch (error) {
      console.error(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key]);

  return { value, setValue, removeValue };
}
