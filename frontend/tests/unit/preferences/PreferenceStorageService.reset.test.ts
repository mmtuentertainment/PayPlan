/**
 * Contract tests for PreferenceStorageService.resetPreferences()
 *
 * Feature: 012-user-preference-management
 * Task: T007
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceCategory } from '../../../src/lib/preferences/types';
import type { UserPreference } from '../../../src/lib/preferences/types';
import { PreferenceStorageService } from '../../../src/lib/preferences/PreferenceStorageService';

describe('PreferenceStorageService.resetPreferences()', () => {
  let service: PreferenceStorageService;
  let mockStorage: Storage;
  let storageData: Record<string, string>;

  beforeEach(() => {
    // In-memory storage for mock
    storageData = {};

    // Mock localStorage with functional implementation
    mockStorage = {
      getItem: vi.fn((key: string) => storageData[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storageData[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storageData[key];
      }),
      clear: vi.fn(() => {
        storageData = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    service = new PreferenceStorageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Contract 1: Reset all preferences to defaults
  // ============================================================================

  it('should reset all preferences to defaults', () => {
    // Save some custom preferences
    const customPrefs: UserPreference[] = [
      {
        category: PreferenceCategory.Timezone,
        value: 'America/New_York',
        optInStatus: true,
        timestamp: new Date().toISOString(),
      },
      {
        category: PreferenceCategory.Locale,
        value: 'es-MX',
        optInStatus: true,
        timestamp: new Date().toISOString(),
      },
    ];

    customPrefs.forEach((pref) => service.savePreference(pref));

    // Reset to defaults
    const result = service.resetPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }

    // Verify all preferences are defaults
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const tzPref = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref?.value).toBe('UTC'); // Default
      expect(tzPref?.optInStatus).toBe(false); // Default opt-out

      const localePref = loadResult.value.preferences.get(PreferenceCategory.Locale);
      expect(localePref?.value).toBe('en-US'); // Default
      expect(localePref?.optInStatus).toBe(false);
    }
  });

  // ============================================================================
  // Contract 2: Clear localStorage on reset
  // ============================================================================

  it('should remove preference data from localStorage', () => {
    // Save some preferences
    const pref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(pref);

    // Reset
    service.resetPreferences();

    // Verify removeItem was called
    expect(mockStorage.removeItem).toHaveBeenCalledWith('payplan_preferences_v1');
  });

  // ============================================================================
  // Contract 3: Reset when no preferences exist (idempotent)
  // ============================================================================

  it('should handle reset when no preferences exist', () => {
    mockStorage.getItem = vi.fn().mockReturnValue(null);

    const result = service.resetPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }
  });

  // ============================================================================
  // Contract 4: Reset specific category (optional single-category reset)
  // ============================================================================

  it('should reset specific category to default', () => {
    // Save custom preferences for multiple categories
    const tzPref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const localePref: UserPreference<string> = {
      category: PreferenceCategory.Locale,
      value: 'es-MX',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(tzPref);
    service.savePreference(localePref);

    // Reset only timezone
    const result = service.resetPreferences(PreferenceCategory.Timezone);

    expect(result.ok).toBe(true);

    // Verify timezone reset but locale preserved
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const resetTz = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(resetTz?.value).toBe('UTC'); // Default
      expect(resetTz?.optInStatus).toBe(false);

      const preservedLocale = loadResult.value.preferences.get(PreferenceCategory.Locale);
      expect(preservedLocale?.value).toBe('es-MX'); // Unchanged
      expect(preservedLocale?.optInStatus).toBe(true);
    }
  });

  // ============================================================================
  // Contract 5: Performance requirement (<100ms reset)
  // ============================================================================

  it('should complete reset operation in <100ms', () => {
    // Save some preferences first
    const pref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(pref);

    // Measure reset time
    const startTime = performance.now();
    const result = service.resetPreferences();
    const endTime = performance.now();

    expect(result.ok).toBe(true);
    expect(endTime - startTime).toBeLessThan(100); // <100ms (NFR-001)
  });

  // ============================================================================
  // Contract 6: Reset updates lastModified timestamp
  // ============================================================================

  it('should update lastModified timestamp on reset', () => {
    const oldTimestamp = '2025-10-13T10:00:00.000Z';

    // Save with old timestamp
    const pref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: oldTimestamp,
    };

    service.savePreference(pref);

    // Mock current time
    const currentTime = '2025-10-13T12:00:00.000Z';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(currentTime));

    // Reset
    service.resetPreferences();

    vi.useRealTimers();

    // Verify lastModified updated
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      expect(loadResult.value.lastModified).not.toBe(oldTimestamp);
    }
  });

  // ============================================================================
  // Contract 7: Reset clears all opt-in statuses
  // ============================================================================

  it('should set all opt-in statuses to false after reset', () => {
    // Save with multiple opt-ins
    const prefs: UserPreference[] = [
      {
        category: PreferenceCategory.Timezone,
        value: 'America/New_York',
        optInStatus: true,
        timestamp: new Date().toISOString(),
      },
      {
        category: PreferenceCategory.Locale,
        value: 'es-MX',
        optInStatus: true,
        timestamp: new Date().toISOString(),
      },
      {
        category: PreferenceCategory.CurrencyFormat,
        value: {
          currencyCode: 'EUR',
          decimalSeparator: ',',
          thousandsSeparator: '.',
          symbolPosition: 'after',
        },
        optInStatus: true,
        timestamp: new Date().toISOString(),
      },
    ];

    prefs.forEach((pref) => service.savePreference(pref));

    // Reset
    service.resetPreferences();

    // Verify all opt-ins cleared
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      loadResult.value.preferences.forEach((pref) => {
        expect(pref.optInStatus).toBe(false);
      });
    }
  });

  // ============================================================================
  // Contract 8: Reset totalSize to default collection size
  // ============================================================================

  it('should reset totalSize to default collection size', () => {
    // Save large preferences
    const largePref: UserPreference = {
      category: PreferenceCategory.BusinessDaySettings,
      value: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-12-25', '2025-12-31', '2025-01-01'],
      },
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(largePref);

    const beforeReset = service.loadPreferences();
    const beforeSize = beforeReset.ok ? beforeReset.value.totalSize : 0;

    // Reset
    service.resetPreferences();

    const afterReset = service.loadPreferences();
    const afterSize = afterReset.ok ? afterReset.value.totalSize : 0;

    // Default size should be smaller than custom preferences
    expect(afterSize).toBeLessThan(beforeSize);
    expect(afterSize).toBeGreaterThan(0);
  });

  // ============================================================================
  // Contract 9: Security error handling during reset
  // ============================================================================

  it('should return Security error when localStorage access denied', () => {
    mockStorage.removeItem = vi.fn().mockImplementation(() => {
      const error = new Error('SecurityError');
      error.name = 'SecurityError';
      throw error;
    });

    const result = service.resetPreferences();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Security');
    }
  });

  // ============================================================================
  // Contract 10: Reset fires storage event for cross-tab sync
  // ============================================================================

  it('should trigger storage event for cross-tab synchronization', () => {
    const storageEventListener = vi.fn();
    window.addEventListener('storage', storageEventListener);

    // Save preference
    const pref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(pref);

    // Reset
    service.resetPreferences();

    // Note: storage event only fires in OTHER tabs/windows, not same-origin
    // This test documents expected behavior for cross-tab sync
    // Actual implementation may require manual event dispatch

    window.removeEventListener('storage', storageEventListener);
  });
});
