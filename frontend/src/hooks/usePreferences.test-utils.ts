/**
 * Test utilities for usePreferences hook
 *
 * Feature: 012-user-preference-management
 *
 * IMPORTANT: This file is for testing only and should NOT be included in production builds.
 * It provides controlled access to internal store state for test isolation.
 *
 * @internal
 */

import type { PreferenceCollection, StorageError } from '../lib/preferences/types';

/**
 * Store state interface matching usePreferences internal store
 */
interface PreferenceStore {
  preferences: PreferenceCollection;
  error: StorageError | null;
  statusMessage: string | null;
}

/**
 * Dependencies required for store reset
 */
interface StoreResetDeps {
  storageService: {
    loadPreferences: () => { ok: true; value: PreferenceCollection } | { ok: false; error: StorageError };
  };
  subscribers: Set<() => void>;
  getStoreState: () => PreferenceStore;
  setStoreState: (state: PreferenceStore) => void;
  notifySubscribers: () => void;
}

/**
 * Reset the preference store state - FOR TESTING ONLY
 *
 * This function provides controlled access to reset the global store state
 * between tests. It's needed because the store is initialized at module load
 * time, which happens before test mocks are set up.
 *
 * @param deps - Dependencies for store reset
 * @internal
 */
export function resetStoreForTesting(deps: StoreResetDeps): void {
  // Clear subscribers
  deps.subscribers.clear();

  // Reset store to defaults by reloading from (mocked) localStorage
  const initialLoad = deps.storageService.loadPreferences();
  if (initialLoad.ok) {
    deps.setStoreState({
      preferences: initialLoad.value,
      error: null,
      statusMessage: null,
    });
  } else {
    // On error during load, store error but still provide defaults
    // This matches the behavior at module initialization
    deps.setStoreState({
      preferences: {
        version: '1.0.0',
        preferences: new Map(),
        totalSize: 0,
        lastModified: new Date().toISOString(),
      },
      error: initialLoad.error,
      statusMessage: null,
    });
  }

  // Schedule notification asynchronously so components that subscribe
  // immediately after calling this function will receive the notification
  Promise.resolve().then(() => {
    deps.notifySubscribers();
  });
}
