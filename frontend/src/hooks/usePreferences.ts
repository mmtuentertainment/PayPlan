/**
 * usePreferences - React hook for user preference management
 *
 * Feature: 012-user-preference-management
 * Task: T024
 * Contract: specs/012-user-preference-management/contracts/PreferenceUIComponents.contract.md
 *
 * Provides:
 * - Load/save/update/reset preferences
 * - Cross-tab synchronization via storage events
 * - Debounced saves (300ms) for performance
 * - Error handling with user-friendly messages
 * - ARIA live region status messages for accessibility
 *
 * Uses React 19's useSyncExternalStore for external state management.
 *
 * @see research.md Section 2 - React 19 patterns
 * @see spec.md NFR-001 (<100ms restoration)
 */

import { useSyncExternalStore, useCallback, useRef, useEffect } from 'react';
import type {
  PreferenceCategoryType,
  UserPreference,
  PreferenceCollection,
  StorageError,
} from '../lib/preferences/types';
import { PreferenceStorageService } from '../lib/preferences/PreferenceStorageService';
import { DEBOUNCE_DELAY_MS, SUCCESS_MESSAGES } from '../lib/preferences/constants';

// Singleton storage service instance
const storageService = new PreferenceStorageService();

// ============================================================================
// External Store for useSyncExternalStore
// ============================================================================

/**
 * Store state for preference management.
 * Uses external store pattern compatible with useSyncExternalStore.
 */
interface PreferenceStore {
  preferences: PreferenceCollection;
  error: StorageError | null;
  statusMessage: string | null;
}

// Global store state
let storeState: PreferenceStore = {
  preferences: storageService.loadPreferences().ok
    ? (storageService.loadPreferences() as { ok: true; value: PreferenceCollection }).value
    : {
        version: '1.0.0',
        preferences: new Map(),
        totalSize: 0,
        lastModified: new Date().toISOString(),
      },
  error: null,
  statusMessage: null,
};

// Subscribers for store changes
const subscribers = new Set<() => void>();

/**
 * Subscribe to store changes.
 *
 * @param callback - Function to call when store changes
 * @returns Unsubscribe function
 */
function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Get current store snapshot.
 *
 * @returns Current store state
 */
function getSnapshot(): PreferenceStore {
  return storeState;
}

/**
 * Get server-side snapshot (same as client for localStorage).
 *
 * @returns Store state for SSR
 */
function getServerSnapshot(): PreferenceStore {
  return storeState;
}

/**
 * Notify all subscribers of store changes.
 */
function notifySubscribers(): void {
  subscribers.forEach((callback) => callback());
}

/**
 * Update store state and notify subscribers.
 *
 * @param newState - Partial state to update
 */
function updateStore(newState: Partial<PreferenceStore>): void {
  storeState = { ...storeState, ...newState };
  notifySubscribers();
}

// ============================================================================
// Cross-Tab Synchronization
// ============================================================================

/**
 * Handle storage events from other tabs.
 * Reloads preferences when another tab makes changes.
 *
 * @see research.md Section 1 - localStorage cross-tab sync
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'payplan_preferences_v1' && event.storageArea === localStorage) {
      const loadResult = storageService.loadPreferences();
      if (loadResult.ok) {
        updateStore({
          preferences: loadResult.value,
          statusMessage: 'Preferences synced from another tab',
        });
      }
    }
  });
}

// ============================================================================
// usePreferences Hook
// ============================================================================

export interface UsePreferencesReturn {
  /** Current preference collection (Map of category → preference) */
  preferences: Map<PreferenceCategoryType, UserPreference>;

  /** Current error, if any */
  error: StorageError | null;

  /** Status message for ARIA live region */
  statusMessage: string | null;

  /** Loading state (always false after initial load) */
  isLoading: boolean;

  /**
   * Save a preference with opt-in/opt-out status.
   *
   * @param preference - The preference to save
   */
  savePreference: (preference: UserPreference) => void;

  /**
   * Update a preference value and/or opt-in status.
   *
   * @param category - Preference category
   * @param value - New value
   * @param optInStatus - Optional: new opt-in status
   */
  updatePreference: (
    category: PreferenceCategoryType,
    value: unknown,
    optInStatus?: boolean
  ) => void;

  /**
   * Reset preferences to defaults.
   *
   * @param category - Optional: specific category to reset
   */
  resetPreferences: (category?: PreferenceCategoryType) => void;
}

/**
 * React hook for user preference management.
 *
 * Features:
 * - Automatic localStorage persistence
 * - Debounced saves (300ms)
 * - Cross-tab synchronization
 * - Error handling
 * - ARIA live region status messages
 *
 * @returns Preference management interface
 *
 * @example
 * function MyComponent() {
 *   const {
 *     preferences,
 *     savePreference,
 *     updatePreference,
 *     resetPreferences,
 *     error,
 *     statusMessage,
 *   } = usePreferences();
 *
 *   const handleTimezoneChange = (tz: string) => {
 *     updatePreference(PreferenceCategory.Timezone, tz, true);
 *   };
 *
 *   return (
 *     <div>
 *       <div aria-live="polite" aria-atomic="true">
 *         {statusMessage}
 *       </div>
 *       {error && <div role="alert">{error.message}</div>}
 *       // ... UI
 *     </div>
 *   );
 * }
 */
export function usePreferences(): UsePreferencesReturn {
  // Use React 19's useSyncExternalStore for external state
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Status message timer ref (for auto-clear)
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear status message after 3 seconds.
   */
  const clearStatusMessage = useCallback(() => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    statusTimerRef.current = setTimeout(() => {
      updateStore({ statusMessage: null });
    }, 3000);
  }, []);

  /**
   * Save preference with debouncing.
   */
  const savePreference = useCallback(
    (preference: UserPreference) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Optimistically update local state
      const newPreferences = new Map(store.preferences.preferences);
      newPreferences.set(preference.category, preference);

      updateStore({
        preferences: {
          ...store.preferences,
          preferences: newPreferences,
        },
        error: null,
        statusMessage: null,
      });

      // Debounce actual localStorage write
      debounceTimerRef.current = setTimeout(() => {
        const result = storageService.savePreference(preference);

        if (result.ok) {
          if (result.value) {
            // Successfully saved
            updateStore({
              statusMessage: SUCCESS_MESSAGES.SAVED,
            });
            clearStatusMessage();
          }
          // result.value === false means not opted-in (no error)
        } else {
          // Error occurred
          updateStore({
            error: result.error,
            statusMessage: `Error: ${result.error.message}`,
          });
          clearStatusMessage();

          // Reload to revert optimistic update
          const loadResult = storageService.loadPreferences();
          if (loadResult.ok) {
            updateStore({ preferences: loadResult.value });
          }
        }
      }, DEBOUNCE_DELAY_MS);
    },
    [store.preferences, clearStatusMessage]
  );

  /**
   * Update preference value and/or opt-in status.
   */
  const updatePreference = useCallback(
    (category: PreferenceCategoryType, value: unknown, optInStatus?: boolean) => {
      const result = storageService.updatePreference(category, value, optInStatus);

      if (result.ok) {
        // Reload preferences after update
        const loadResult = storageService.loadPreferences();
        if (loadResult.ok) {
          updateStore({
            preferences: loadResult.value,
            error: null,
            statusMessage: SUCCESS_MESSAGES.SAVED,
          });
          clearStatusMessage();
        }
      } else {
        // Error occurred
        updateStore({
          error: result.error,
          statusMessage: `Error: ${result.error.message}`,
        });
        clearStatusMessage();
      }
    },
    [clearStatusMessage]
  );

  /**
   * Reset preferences to defaults.
   */
  const resetPreferences = useCallback(
    (category?: PreferenceCategoryType) => {
      const result = storageService.resetPreferences(category);

      if (result.ok) {
        // Reload preferences after reset
        const loadResult = storageService.loadPreferences();
        if (loadResult.ok) {
          updateStore({
            preferences: loadResult.value,
            error: null,
            statusMessage: SUCCESS_MESSAGES.RESET,
          });
          clearStatusMessage();
        }
      } else {
        // Error occurred
        updateStore({
          error: result.error,
          statusMessage: `Error: ${result.error.message}`,
        });
        clearStatusMessage();
      }
    },
    [clearStatusMessage]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  return {
    preferences: store.preferences.preferences,
    error: store.error,
    statusMessage: store.statusMessage,
    isLoading: false, // Always false after initial load (sync operation)
    savePreference,
    updatePreference,
    resetPreferences,
  };
}
