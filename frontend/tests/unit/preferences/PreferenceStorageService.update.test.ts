/**
 * Contract tests for PreferenceStorageService.updatePreference()
 *
 * Feature: 012-user-preference-management
 * Task: T006
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceCategory } from '../../../src/lib/preferences/types';
import type { UserPreference } from '../../../src/lib/preferences/types';
import { PreferenceStorageService } from '../../../src/lib/preferences/PreferenceStorageService';

describe('PreferenceStorageService.updatePreference()', () => {
  let service: PreferenceStorageService;
  let mockStorage: Storage;
  let storageData: Record<string, string>;

  beforeEach(() => {
    storageData = {};

    // Mock localStorage with functional implementation
    mockStorage = {
      getItem: vi.fn((key: string) => storageData[key] || null),
      setItem: vi.fn((key: string, value: string) => { storageData[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storageData[key]; }),
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
  // Contract 1: Update existing preference value
  // ============================================================================

  it('should update existing preference with new value', () => {
    // Save initial preference
    const initialPref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: '2025-10-13T10:00:00.000Z',
    };

    service.savePreference(initialPref);

    // Update to new value
    const result = service.updatePreference(
      PreferenceCategory.Timezone,
      'Europe/London'
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }

    // Verify updated value is persisted
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const updatedPref = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(updatedPref?.value).toBe('Europe/London');
      expect(updatedPref?.optInStatus).toBe(true); // Opt-in status preserved
    }
  });

  // ============================================================================
  // Contract 2: Update opt-in status only
  // ============================================================================

  it('should update opt-in status without changing value', () => {
    // Start with opt-out default
    const result = service.updatePreference(
      PreferenceCategory.Timezone,
      'America/New_York',
      true // Change to opt-in
    );

    expect(result.ok).toBe(true);

    // Verify opt-in status changed
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const pref = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(pref?.optInStatus).toBe(true);
      expect(pref?.value).toBe('America/New_York');
    }
  });

  // ============================================================================
  // Contract 3: Update with opt-out (should remove from localStorage)
  // ============================================================================

  it('should remove preference from localStorage when opting out', () => {
    // Save with opt-in
    const initialPref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(initialPref);

    // Update to opt-out
    const result = service.updatePreference(
      PreferenceCategory.Timezone,
      'America/New_York',
      false // Opt-out
    );

    expect(result.ok).toBe(true);

    // Verify preference reverts to default
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const pref = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(pref?.optInStatus).toBe(false);
      expect(pref?.value).toBe('UTC'); // Default timezone
    }
  });

  // ============================================================================
  // Contract 4: Validation error for invalid value
  // ============================================================================

  it('should return Validation error for invalid timezone', () => {
    const result = service.updatePreference(
      PreferenceCategory.Timezone,
      'Invalid/Timezone'
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Validation');
      expect(result.error.message).toContain('timezone');
    }
  });

  it('should return Validation error for invalid payday pattern', () => {
    const invalidPattern = {
      type: 'biweekly',
      startDate: 'not-a-date',
      dayOfWeek: 99, // Invalid day
    };

    const result = service.updatePreference(
      PreferenceCategory.PaydayDates,
      invalidPattern
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Validation');
    }
  });

  // ============================================================================
  // Contract 5: Timestamp update on update
  // ============================================================================

  it('should update timestamp when preference is updated', () => {
    const initialTime = '2025-10-13T10:00:00.000Z';
    const updateTime = '2025-10-13T11:00:00.000Z';

    // Save initial
    const initialPref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: initialTime,
    };

    service.savePreference(initialPref);

    // Mock Date.now() for consistent timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date(updateTime));

    // Update value
    service.updatePreference(PreferenceCategory.Timezone, 'Europe/London');

    vi.useRealTimers();

    // Verify timestamp updated
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const pref = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(pref?.timestamp).not.toBe(initialTime);
    }
  });

  // ============================================================================
  // Contract 6: Update non-existent preference (should create)
  // ============================================================================

  it('should create preference if it does not exist', () => {
    const result = service.updatePreference(
      PreferenceCategory.Locale,
      'es-MX',
      true
    );

    expect(result.ok).toBe(true);

    // Verify new preference created
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const pref = loadResult.value.preferences.get(PreferenceCategory.Locale);
      expect(pref?.value).toBe('es-MX');
      expect(pref?.optInStatus).toBe(true);
    }
  });

  // ============================================================================
  // Contract 7: Update complex nested value (business day settings)
  // ============================================================================

  it('should update complex nested business day settings', () => {
    const newSettings = {
      workingDays: [1, 2, 3, 4], // Monday-Thursday
      holidays: ['2025-12-25', '2025-01-01'],
    };

    const result = service.updatePreference(
      PreferenceCategory.BusinessDaySettings,
      newSettings,
      true
    );

    expect(result.ok).toBe(true);

    // Verify complex value saved correctly
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const pref = loadResult.value.preferences.get(
        PreferenceCategory.BusinessDaySettings
      );
      expect(pref?.value).toEqual(newSettings);
    }
  });

  // ============================================================================
  // Contract 8: Performance requirement (<100ms update)
  // ============================================================================

  it('should complete update operation in <100ms', () => {
    const startTime = performance.now();
    const result = service.updatePreference(
      PreferenceCategory.Timezone,
      'America/Chicago',
      true
    );
    const endTime = performance.now();

    expect(result.ok).toBe(true);
    expect(endTime - startTime).toBeLessThan(100); // <100ms (NFR-001)
  });

  // ============================================================================
  // Contract 9: Storage size recalculation after update
  // ============================================================================

  it('should recalculate totalSize after update', () => {
    // Save small preference
    const smallPref: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'UTC',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    service.savePreference(smallPref);

    const loadResult1 = service.loadPreferences();
    const initialSize = loadResult1.ok ? loadResult1.value.totalSize : 0;

    // Update with larger value
    service.updatePreference(
      PreferenceCategory.BusinessDaySettings,
      {
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-12-25', '2025-12-31', '2025-01-01'],
      },
      true
    );

    const loadResult2 = service.loadPreferences();
    const updatedSize = loadResult2.ok ? loadResult2.value.totalSize : 0;

    expect(updatedSize).toBeGreaterThan(initialSize);
    expect(updatedSize).toBeLessThan(5120); // Still under 5KB limit
  });

  // ============================================================================
  // Contract 10: Quota exceeded error on update
  // ============================================================================

  it('should return QuotaExceeded error when update exceeds storage limit', () => {
    // Mock setItem to throw QuotaExceededError
    mockStorage.setItem = vi.fn().mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const largeSettings = {
      workingDays: [1, 2, 3, 4, 5],
      holidays: Array(200).fill('2025-12-25'), // Intentionally huge
    };

    const result = service.updatePreference(
      PreferenceCategory.BusinessDaySettings,
      largeSettings,
      true
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('QuotaExceeded');
    }
  });
});
