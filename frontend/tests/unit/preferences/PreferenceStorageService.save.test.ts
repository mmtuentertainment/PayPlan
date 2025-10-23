/**
 * Contract tests for PreferenceStorageService.savePreference()
 *
 * Feature: 012-user-preference-management
 * Task: T004
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 * Run: npm test -- PreferenceStorageService.save.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceCategory } from '../../../src/lib/preferences/types';
import type { UserPreference } from '../../../src/lib/preferences/types';

// Service to be implemented in T022
import { PreferenceStorageService } from '../../../src/lib/preferences/PreferenceStorageService';

describe('PreferenceStorageService.savePreference()', () => {
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

    // Replace global localStorage
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
  // Contract 1: Save new preference (opt-in)
  // ============================================================================

  it('should save new timezone preference with opt-in', () => {
    const preference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(preference);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }

    // Verify localStorage.setItem was called
    expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'payplan_preferences_v1',
      expect.any(String)
    );
  });

  it('should save new payday pattern preference with opt-in', () => {
    const preference: UserPreference = {
      category: PreferenceCategory.PaydayDates,
      value: {
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 5,
      },
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(preference);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }
  });

  // ============================================================================
  // Contract 2: Save preference without opt-in (should not persist)
  // ============================================================================

  it('should not save preference when optInStatus is false', () => {
    const preference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/Los_Angeles',
      optInStatus: false,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(preference);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(false); // Should return false when not saved
    }

    // Verify localStorage.setItem was NOT called
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Contract 3: Update existing preference
  // ============================================================================

  it('should update existing preference with new value', () => {
    // First save
    const firstPreference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: '2025-10-13T10:00:00.000Z',
    };

    const firstResult = service.savePreference(firstPreference);
    expect(firstResult.ok).toBe(true);

    // Update with new value
    const updatedPreference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'Europe/London',
      optInStatus: true,
      timestamp: '2025-10-13T11:00:00.000Z',
    };

    const updateResult = service.savePreference(updatedPreference);
    expect(updateResult.ok).toBe(true);

    // Verify setItem called twice (once for first save, once for update)
    expect(mockStorage.setItem).toHaveBeenCalledTimes(2);
  });

  // ============================================================================
  // Contract 4: Storage quota exceeded error
  // ============================================================================

  it('should return QuotaExceeded error when storage limit exceeded', () => {
    // Mock setItem to throw QuotaExceededError
    mockStorage.setItem = vi.fn().mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const largePreference: UserPreference = {
      category: PreferenceCategory.BusinessDaySettings,
      value: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: Array(100).fill('2025-12-25'), // Intentionally large
      },
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(largePreference);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('QuotaExceeded');
      expect(result.error.message).toContain('storage limit exceeded');
    }
  });

  // ============================================================================
  // Contract 5: Security error (localStorage access denied)
  // ============================================================================

  it('should return Security error when localStorage access denied', () => {
    // Mock setItem to throw SecurityError
    mockStorage.setItem = vi.fn().mockImplementation(() => {
      const error = new Error('SecurityError');
      error.name = 'SecurityError';
      throw error;
    });

    const preference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(preference);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Security');
      expect(result.error.message).toContain('storage');
    }
  });

  // ============================================================================
  // Contract 6: Validation error (invalid preference value)
  // ============================================================================

  it('should return Validation error for invalid timezone', () => {
    const invalidPreference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'Invalid/Timezone',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(invalidPreference);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Validation');
      expect(result.error.message).toContain('timezone');
    }
  });

  it('should return Validation error for invalid payday pattern', () => {
    const invalidPreference: UserPreference = {
      category: PreferenceCategory.PaydayDates,
      value: {
        type: 'biweekly',
        startDate: 'invalid-date',
        dayOfWeek: 5,
      },
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(invalidPreference);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Validation');
      expect(result.error.message).toContain('date');
    }
  });

  // ============================================================================
  // Contract 7: Serialization error
  // ============================================================================

  it('should return Serialization error for circular references', () => {
    const circularValue: Record<string, unknown> = { foo: 'bar' };
    circularValue.self = circularValue; // Create circular reference

    const invalidPreference: UserPreference = {
      category: PreferenceCategory.Timezone,
      value: circularValue,
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(invalidPreference);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('Serialization');
    }
  });

  // ============================================================================
  // Contract 8: Performance requirement (<100ms save operation)
  // ============================================================================

  it('should complete save operation in <100ms', () => {
    const preference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const startTime = performance.now();
    const result = service.savePreference(preference);
    const endTime = performance.now();

    expect(result.ok).toBe(true);
    expect(endTime - startTime).toBeLessThan(100); // <100ms (NFR-001)
  });

  // ============================================================================
  // Contract 9: Timestamp update on save
  // ============================================================================

  it('should update timestamp on each save', () => {
    const firstTimestamp = '2025-10-13T10:00:00.000Z';
    const secondTimestamp = '2025-10-13T11:00:00.000Z';

    const preference1: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: firstTimestamp,
    };

    service.savePreference(preference1);

    const preference2: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: secondTimestamp,
    };

    const result = service.savePreference(preference2);

    expect(result.ok).toBe(true);

    // Verify the saved preference has updated timestamp
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      const savedPreference = loadResult.value.preferences.get(PreferenceCategory.Timezone);
      expect(savedPreference?.timestamp).toBe(secondTimestamp);
    }
  });

  // ============================================================================
  // Contract 10: Storage size tracking
  // ============================================================================

  it('should update totalSize after save', () => {
    const preference: UserPreference<string> = {
      category: PreferenceCategory.Timezone,
      value: 'America/New_York',
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    const result = service.savePreference(preference);
    expect(result.ok).toBe(true);

    // Load and verify totalSize is calculated
    const loadResult = service.loadPreferences();
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      expect(loadResult.value.totalSize).toBeGreaterThan(0);
      expect(loadResult.value.totalSize).toBeLessThan(5120); // <5KB limit
    }
  });
});
