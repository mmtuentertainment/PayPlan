/**
 * PreferenceStorageService - Browser localStorage management for user preferences
 *
 * Feature: 012-user-preference-management
 * Task: T022
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * Implements privacy-first local storage with:
 * - Opt-in/opt-out per category (FR-002)
 * - 5KB storage limit validation (FR-014)
 * - <100ms restoration performance (NFR-001)
 * - Cross-tab synchronization via storage events
 *
 * @see research.md Section 1 - localStorage best practices
 * @see research.md Section 2 - React 19 useSyncExternalStore
 */

import type {
  PreferenceCategoryType,
  UserPreference,
  PreferenceCollection,
  SerializedPreferenceCollection,
  StorageError,
  Result,
} from './types';
import {
  serializedPreferenceCollectionSchema,
  validatePreferenceValue,
} from './validation';
import {
  STORAGE_KEY,
  STORAGE_LIMIT_BYTES,
  SCHEMA_VERSION,
  DEFAULT_PREFERENCES,
  ERROR_MESSAGES,
} from './constants';

/**
 * Service for managing user preference persistence in localStorage.
 *
 * Key Responsibilities:
 * - Save/load preferences with validation
 * - Enforce 5KB storage limit (FR-014)
 * - Handle opt-in/opt-out status (FR-002)
 * - Provide error handling with Result types
 * - Support cross-tab synchronization
 *
 * @example
 * const service = new PreferenceStorageService();
 *
 * // Save preference
 * const result = service.savePreference({
 *   category: PreferenceCategory.Timezone,
 *   value: 'America/New_York',
 *   optInStatus: true,
 *   timestamp: new Date().toISOString(),
 * });
 *
 * // Load all preferences
 * const loadResult = service.loadPreferences();
 * if (loadResult.ok) {
 *   console.log(loadResult.value.preferences);
 * }
 */
export class PreferenceStorageService {
  /**
   * Format error keywords for distinguishing format/type validation errors
   * from size/quota validation errors during pre-save validation.
   */
  private static readonly FORMAT_ERROR_KEYWORDS = [
    'IANA timezone',
    'ISO date format',
    'BCP 47',
    'ISO 4217',
    'valid date',
    '0-6',
    '1-31',
  ] as const;

  /**
   * Save a single preference to localStorage.
   *
   * If optInStatus is false, the preference is NOT persisted (privacy-first).
   * Validates the preference value before saving.
   *
   * @param preference - The preference to save
   * @returns Result<boolean, StorageError> - true if saved, false if not opted-in
   *
   * @see spec.md FR-002 (explicit opt-in required)
   */
  savePreference(preference: UserPreference): Result<boolean, StorageError> {
    // FR-002: If user hasn't opted in, handle opt-out behavior
    if (!preference.optInStatus) {
      try {
        const loadResult = this.loadPreferences();
        if (!loadResult.ok) {
          // Storage invalid: clear to ensure opt-out is honored (privacy-first)
          localStorage.removeItem(STORAGE_KEY);
          return { ok: true, value: false };
        }

        const collection = loadResult.value;
        const existing = collection.preferences.get(preference.category);

        // If there was an existing opt-in preference, delete it
        if (existing && existing.optInStatus) {
          collection.preferences.delete(preference.category);
          const hasAnyOptIn = Array.from(collection.preferences.values()).some(
            (p) => p.optInStatus
          );
          if (!hasAnyOptIn) {
            localStorage.removeItem(STORAGE_KEY);
            return { ok: true, value: false };
          }
          collection.lastModified = new Date().toISOString();
          collection.totalSize = this.calculateStorageSize(collection);
          return this.saveCollection(collection);
        }

        // No existing opt-in preference, nothing to save
        return { ok: true, value: false };
      } catch (error) {
        return this.handleStorageError(error, preference.category);
      }
    }

    // Try validation - if it fails with format errors, return immediately
    // But allow other errors (like oversized data) to be caught by storage operations
    try {
      const validationResult = validatePreferenceValue(
        preference.category,
        preference.value
      );

      if (!validationResult.success) {
        const errorMsg = validationResult.error.issues[0].message;
        // Only fail fast for format/type validation errors
        // Let size/quota errors be caught during actual save operation
        const isFormatError = PreferenceStorageService.FORMAT_ERROR_KEYWORDS.some((keyword) =>
          errorMsg.includes(keyword)
        );

        if (isFormatError) {
          return {
            ok: false,
            error: {
              type: 'Validation',
              message: errorMsg,
              category: preference.category,
            },
          };
        }
      }
    } catch {
      // If validation throws (e.g., can't validate circular ref), continue to save
      // and let serialization catch the error
    }

    try {
      // Load existing preferences
      const loadResult = this.loadPreferences();
      const collection = loadResult.ok
        ? loadResult.value
        : this.createDefaultCollection();

      // Update collection with new preference
      collection.preferences.set(preference.category, preference);
      collection.lastModified = new Date().toISOString();

      // Calculate size BEFORE saving
      collection.totalSize = this.calculateStorageSize(collection);

      // Check if size exceeds limit
      if (collection.totalSize > STORAGE_LIMIT_BYTES) {
        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            category: preference.category,
          },
        };
      }

      // Try to save - this will catch Serialization and Security errors
      return this.saveCollection(collection);
    } catch (error) {
      return this.handleStorageError(error, preference.category);
    }
  }

  /**
   * Load all preferences from localStorage.
   *
   * If no saved preferences exist, returns defaults.
   * Merges saved opt-in preferences with default opt-out preferences.
   *
   * Performance: Instrumented with performance.mark/measure for monitoring (NFR-001).
   *
   * @returns Result<PreferenceCollection, StorageError>
   *
   * @see spec.md FR-007 (merge with defaults)
   * @see spec.md NFR-001 (<100ms restoration target)
   */
  loadPreferences(): Result<PreferenceCollection, StorageError> {
    // Performance monitoring start (T034: NFR-001)
    if (typeof performance !== 'undefined') {
      performance.mark('preferences-restore-start');
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);

      // No saved preferences: return defaults
      if (serialized === null || serialized === undefined) {
        // Performance monitoring end (T034: NFR-001)
        if (typeof performance !== 'undefined') {
          performance.mark('preferences-restore-end');
          performance.measure(
            'preferences-restore-complete',
            'preferences-restore-start',
            'preferences-restore-end'
          );
        }
        return { ok: true, value: this.createDefaultCollection() };
      }

      // Deserialize and validate
      const parsed = JSON.parse(serialized);
      const validationResult = serializedPreferenceCollectionSchema.safeParse(parsed);

      if (!validationResult.success) {
        // Corrupted data: clear storage and fallback to defaults
        localStorage.removeItem(STORAGE_KEY);
        return { ok: true, value: this.createDefaultCollection() };
      }

      const serializedCollection = validationResult.data;

      // Handle version mismatch - migrate or use current version
      const versionMismatch = serializedCollection.version !== SCHEMA_VERSION;
      if (versionMismatch) {
        // Simple migration: bump version now; recompute size after building collection
        serializedCollection.version = SCHEMA_VERSION;
      }

      // Convert Record to Map
      const preferences = new Map<PreferenceCategoryType, UserPreference>();

      // Start with defaults (all opt-out)
      Object.entries(DEFAULT_PREFERENCES).forEach(([category, pref]) => {
        preferences.set(category as PreferenceCategoryType, pref);
      });

      // Override with saved opt-in preferences
      for (const [category, pref] of Object.entries(serializedCollection.preferences)) {
        if (pref.optInStatus) {
          // Validate saved preference value
          const validationResult = validatePreferenceValue(
            category as PreferenceCategoryType,
            pref.value
          );

          if (!validationResult.success) {
            // Invalid saved data - return validation error
            return {
              ok: false,
              error: {
                type: 'Validation',
                message: validationResult.error.issues[0].message,
                category: category as PreferenceCategoryType,
              },
            };
          }

          preferences.set(category as PreferenceCategoryType, pref);
        }
      }

      const collection: PreferenceCollection = {
        version: serializedCollection.version,
        preferences,
        totalSize: serializedCollection.totalSize,
        lastModified: serializedCollection.lastModified,
      };

      // Ensure size metadata is accurate post-migration
      if (versionMismatch) {
        collection.totalSize = this.calculateStorageSize(collection);
      }

      // Performance monitoring end (T034: NFR-001)
      if (typeof performance !== 'undefined') {
        performance.mark('preferences-restore-end');
        performance.measure(
          'preferences-restore-complete',
          'preferences-restore-start',
          'preferences-restore-end'
        );
      }

      return { ok: true, value: collection };
    } catch (error) {
      // Security errors should be surfaced to user
      if (error instanceof Error && error.name === 'SecurityError') {
        return this.handleStorageError(error);
      }
      // Parse errors and other issues: fallback to defaults for resilient UX
      // Performance monitoring end (T034: NFR-001)
      if (typeof performance !== 'undefined') {
        performance.mark('preferences-restore-end');
        performance.measure(
          'preferences-restore-complete',
          'preferences-restore-start',
          'preferences-restore-end'
        );
      }
      return { ok: true, value: this.createDefaultCollection() };
    }
  }

  /**
   * Update an existing preference or create a new one.
   *
   * @param category - Preference category
   * @param value - New preference value
   * @param optInStatus - Optional: update opt-in status
   * @returns Result<boolean, StorageError>
   */
  updatePreference(
    category: PreferenceCategoryType,
    value: unknown,
    optInStatus?: boolean
  ): Result<boolean, StorageError> {
    // Validate value FIRST, but only fail fast for format/type errors
    // Let size/quota errors be caught during actual save operation
    const validationResult = validatePreferenceValue(category, value);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0].message;
      // Only fail fast for format/type validation errors
      const isFormatError = PreferenceStorageService.FORMAT_ERROR_KEYWORDS.some((keyword) =>
        errorMsg.includes(keyword)
      );

      if (isFormatError) {
        return {
          ok: false,
          error: {
            type: 'Validation',
            message: errorMsg,
            category,
          },
        };
      }
    }

    const loadResult = this.loadPreferences();
    if (!loadResult.ok) {
      return loadResult as Result<boolean, StorageError>;
    }

    const collection = loadResult.value;
    const existing = collection.preferences.get(category);

    const updated: UserPreference = {
      category,
      value,
      optInStatus: optInStatus !== undefined ? optInStatus : existing?.optInStatus ?? false,
      timestamp: new Date().toISOString(),
    };

    return this.savePreference(updated);
  }

  /**
   * Reset preferences to defaults.
   *
   * If category is provided, resets only that category.
   * Otherwise, resets all preferences and clears localStorage.
   *
   * @param category - Optional: specific category to reset
   * @returns Result<boolean, StorageError>
   *
   * @see spec.md FR-008 (reset all preferences)
   */
  resetPreferences(category?: PreferenceCategoryType): Result<boolean, StorageError> {
    try {
      if (category) {
        // Reset specific category
        const loadResult = this.loadPreferences();
        if (!loadResult.ok) {
          return loadResult as Result<boolean, StorageError>;
        }

        const collection = loadResult.value;
        const defaultPref = DEFAULT_PREFERENCES[category];

        if (!defaultPref.optInStatus) {
          collection.preferences.delete(category);
        } else {
          collection.preferences.set(category, {
            ...defaultPref,
            timestamp: new Date().toISOString(),
          });
        }

        collection.lastModified = new Date().toISOString();
        collection.totalSize = this.calculateStorageSize(collection);

        return this.saveCollection(collection);
      } else {
        // Reset all: clear localStorage
        localStorage.removeItem(STORAGE_KEY);
        return { ok: true, value: true };
      }
    } catch (error) {
      return this.handleStorageError(error, category);
    }
  }

  /**
   * Calculate the byte size of a preference collection.
   *
   * Uses JSON.stringify + Blob to get accurate UTF-8 byte length.
   *
   * @param collection - The preference collection
   * @returns Size in bytes
   *
   * @see spec.md FR-014 (5KB limit)
   * @see research.md Section 1 (localStorage sizing)
   */
  calculateStorageSize(collection: PreferenceCollection): number {
    try {
      // Use fixed-point iteration to handle self-referential totalSize
      // Calculate size for only opted-in preferences (matches serialization)
      const base = {
        version: collection.version,
        preferences: Object.fromEntries(
          Array.from(collection.preferences.entries()).filter(([, pref]) => pref.optInStatus)
        ),
        lastModified: collection.lastModified,
      };

      // Iterate until size stabilizes (digit count converges)
      let estimate = 0;
      for (let i = 0; i < 3; i++) {
        const json = JSON.stringify({ ...base, totalSize: estimate });
        estimate = new Blob([json]).size;
      }

      return estimate;
    } catch {
      // If serialization fails, return 0
      return 0;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Save a preference collection to localStorage.
   *
   * @param collection - The collection to save
   * @returns Result<boolean, StorageError>
   */
  private saveCollection(collection: PreferenceCollection): Result<boolean, StorageError> {
    try {
      // Persist only opted-in preferences (privacy-first)
      const serialized: SerializedPreferenceCollection = {
        version: collection.version,
        preferences: Object.fromEntries(
          Array.from(collection.preferences.entries()).filter(([, pref]) => pref.optInStatus)
        ),
        totalSize: collection.totalSize,
        lastModified: collection.lastModified,
      };

      const jsonString = JSON.stringify(serialized);
      localStorage.setItem(STORAGE_KEY, jsonString);

      return { ok: true, value: true };
    } catch (error) {
      // Check for circular reference specifically
      if (error instanceof TypeError && error.message.includes('circular')) {
        return {
          ok: false,
          error: {
            type: 'Serialization',
            message: 'Cannot serialize preference with circular references',
          },
        };
      }
      return this.handleStorageError(error);
    }
  }

  /**
   * Create a default preference collection.
   *
   * All preferences start as opt-out (privacy-first).
   *
   * @returns Default preference collection
   */
  private createDefaultCollection(): PreferenceCollection {
    const preferences = new Map<PreferenceCategoryType, UserPreference>();

    Object.entries(DEFAULT_PREFERENCES).forEach(([category, pref]) => {
      preferences.set(category as PreferenceCategoryType, {
        ...pref,
        timestamp: new Date().toISOString(),
      });
    });

    const collection: PreferenceCollection = {
      version: SCHEMA_VERSION,
      preferences,
      totalSize: 0,
      lastModified: new Date().toISOString(),
    };

    collection.totalSize = this.calculateStorageSize(collection);

    return collection;
  }

  /**
   * Handle storage errors and convert to StorageError type.
   *
   * @param error - The caught error
   * @param category - Optional: related category
   * @returns Result<never, StorageError>
   */
  private handleStorageError(
    error: unknown,
    category?: PreferenceCategoryType
  ): Result<never, StorageError> {
    if (error instanceof Error) {
      // Handle cross-browser QuotaExceeded variants
      const DOMEx = (globalThis as any).DOMException;
      const isQuota =
        error.name === 'QuotaExceededError' ||
        error.name === 'QUOTA_EXCEEDED_ERR' ||
        (DOMEx &&
          error instanceof DOMEx &&
          ((error as any).code === 22 || (error as any).code === 1014));

      if (isQuota) {
        return {
          ok: false,
          error: {
            type: 'QuotaExceeded',
            message: ERROR_MESSAGES.QUOTA_EXCEEDED,
            category,
          },
        };
      }

      if (error.name === 'SecurityError') {
        return {
          ok: false,
          error: {
            type: 'Security',
            message: ERROR_MESSAGES.SECURITY_ERROR,
            category,
          },
        };
      }
    }

    return {
      ok: false,
      error: {
        type: 'Serialization',
        message: ERROR_MESSAGES.UNKNOWN_ERROR,
        category,
      },
    };
  }
}
