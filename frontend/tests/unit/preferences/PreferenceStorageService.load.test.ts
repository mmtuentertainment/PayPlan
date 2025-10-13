/**
 * Contract tests for PreferenceStorageService.loadPreferences()
 *
 * Feature: 012-user-preference-management
 * Task: T005
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceCategory } from '../../../src/lib/preferences/types';
import type { SerializedPreferenceCollection } from '../../../src/lib/preferences/types';
import { PreferenceStorageService } from '../../../src/lib/preferences/PreferenceStorageService';

describe('PreferenceStorageService.loadPreferences()', () => {
  let service: PreferenceStorageService;
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
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
  // Contract 1: Load empty preferences (first visit)
  // ============================================================================

  it('should return default preferences when localStorage is empty', () => {
    mockStorage.getItem = vi.fn().mockReturnValue(null);

    const result = service.loadPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preferences.size).toBe(5); // 5 default categories
      expect(result.value.version).toBe('1.0.0');
      expect(result.value.totalSize).toBeGreaterThan(0);

      // Verify all defaults are opt-out
      result.value.preferences.forEach((pref) => {
        expect(pref.optInStatus).toBe(false);
      });
    }
  });

  // ============================================================================
  // Contract 2: Load existing preferences
  // ============================================================================

  it('should load saved preferences from localStorage', () => {
    const savedData: SerializedPreferenceCollection = {
      version: '1.0.0',
      preferences: {
        [PreferenceCategory.Timezone]: {
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true,
          timestamp: '2025-10-13T10:00:00.000Z',
        },
      },
      totalSize: 150,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedData));

    const result = service.loadPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      const tzPref = result.value.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref).toBeDefined();
      expect(tzPref?.value).toBe('America/New_York');
      expect(tzPref?.optInStatus).toBe(true);
    }
  });

  // ============================================================================
  // Contract 3: Deserialization error (corrupted data)
  // ============================================================================

  it('should return Deserialization error for corrupted localStorage data', () => {
    mockStorage.getItem = vi.fn().mockReturnValue('{ invalid json }');

    const result = service.loadPreferences();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Deserialization');
      expect(result.error.message).toContain('corrupted');
    }
  });

  // ============================================================================
  // Contract 4: Schema version mismatch
  // ============================================================================

  it('should handle schema version mismatch gracefully', () => {
    const oldVersionData: SerializedPreferenceCollection = {
      version: '0.9.0', // Old version
      preferences: {},
      totalSize: 50,
      lastModified: '2025-01-01T00:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(oldVersionData));

    const result = service.loadPreferences();

    // Should either migrate or return defaults
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.version).toBe('1.0.0'); // Current version
    }
  });

  // ============================================================================
  // Contract 5: Performance requirement (<100ms load operation)
  // ============================================================================

  it('should complete load operation in <100ms', () => {
    const savedData: SerializedPreferenceCollection = {
      version: '1.0.0',
      preferences: {
        [PreferenceCategory.Timezone]: {
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true,
          timestamp: '2025-10-13T10:00:00.000Z',
        },
      },
      totalSize: 150,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedData));

    const startTime = performance.now();
    const result = service.loadPreferences();
    const endTime = performance.now();

    expect(result.ok).toBe(true);
    expect(endTime - startTime).toBeLessThan(100); // <100ms (NFR-001)
  });

  // ============================================================================
  // Contract 6: Security error (localStorage access denied)
  // ============================================================================

  it('should return Security error when localStorage access denied', () => {
    mockStorage.getItem = vi.fn().mockImplementation(() => {
      const error = new Error('SecurityError');
      error.name = 'SecurityError';
      throw error;
    });

    const result = service.loadPreferences();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Security');
    }
  });

  // ============================================================================
  // Contract 7: Map conversion (Record → Map)
  // ============================================================================

  it('should convert serialized Record to Map structure', () => {
    const savedData: SerializedPreferenceCollection = {
      version: '1.0.0',
      preferences: {
        [PreferenceCategory.Timezone]: {
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true,
          timestamp: '2025-10-13T10:00:00.000Z',
        },
        [PreferenceCategory.Locale]: {
          category: PreferenceCategory.Locale,
          value: 'en-US',
          optInStatus: true,
          timestamp: '2025-10-13T10:00:00.000Z',
        },
      },
      totalSize: 200,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedData));

    const result = service.loadPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.preferences).toBeInstanceOf(Map);
      expect(result.value.preferences.size).toBe(5); // All 5 categories (saved + defaults)

      // Verify saved opt-in preferences are loaded
      const tzPref = result.value.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref?.optInStatus).toBe(true);
      expect(tzPref?.value).toBe('America/New_York');

      const localePref = result.value.preferences.get(PreferenceCategory.Locale);
      expect(localePref?.optInStatus).toBe(true);
      expect(localePref?.value).toBe('en-US');
    }
  });

  // ============================================================================
  // Contract 8: Validation error for invalid saved data
  // ============================================================================

  it('should return Validation error for invalid preference values', () => {
    const invalidData: SerializedPreferenceCollection = {
      version: '1.0.0',
      preferences: {
        [PreferenceCategory.Timezone]: {
          category: PreferenceCategory.Timezone,
          value: 'Invalid/Timezone', // Invalid IANA timezone
          optInStatus: true,
          timestamp: '2025-10-13T10:00:00.000Z',
        },
      },
      totalSize: 150,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(invalidData));

    const result = service.loadPreferences();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Validation');
    }
  });

  // ============================================================================
  // Contract 9: Merge with defaults (opt-in categories only)
  // ============================================================================

  it('should merge saved opt-in preferences with default opt-out preferences', () => {
    const savedData: SerializedPreferenceCollection = {
      version: '1.0.0',
      preferences: {
        [PreferenceCategory.Timezone]: {
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true, // User opted in
          timestamp: '2025-10-13T10:00:00.000Z',
        },
      },
      totalSize: 150,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    mockStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedData));

    const result = service.loadPreferences();

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should have all 5 categories
      expect(result.value.preferences.size).toBe(5);

      // Timezone should be opt-in with custom value
      const tzPref = result.value.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref?.optInStatus).toBe(true);
      expect(tzPref?.value).toBe('America/New_York');

      // Other categories should be opt-out with defaults
      const localePref = result.value.preferences.get(PreferenceCategory.Locale);
      expect(localePref?.optInStatus).toBe(false);
      expect(localePref?.value).toBe('en-US'); // Default
    }
  });
});
