/**
 * Integration tests for usePreferences hook
 *
 * Feature: 012-user-preference-management
 * Task: T014
 * Contract: specs/012-user-preference-management/contracts/PreferenceUIComponents.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 * Run: npm test -- usePreferences.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

// Hook to be implemented in T024
import { usePreferences } from '../../../src/hooks/usePreferences';

describe('usePreferences Hook Integration', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Contract 1: Initial Load (Default Preferences)
  // ============================================================================

  describe('Initial Load', () => {
    it('should load default preferences on first render', () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      expect(result.current.preferences).toBeDefined();
      expect(result.current.preferences.size).toBe(5); // 5 categories
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set all default preferences to opt-out status', () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      result.current.preferences.forEach((pref) => {
        expect(pref.optInStatus).toBe(false);
      });
    });

    it('should load defaults in <100ms (NFR-001)', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const startTime = performance.now();
      const { result } = renderHook(() => usePreferences());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // <100ms requirement
    });
  });

  // ============================================================================
  // Contract 2: Load Saved Preferences
  // ============================================================================

  describe('Load Saved Preferences', () => {
    it('should load saved preferences from localStorage', () => {
      const savedData = JSON.stringify({
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
      });

      mockStorage.getItem = vi.fn().mockReturnValue(savedData);

      const { result } = renderHook(() => usePreferences());

      const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref).toBeDefined();
      expect(tzPref?.value).toBe('America/New_York');
      expect(tzPref?.optInStatus).toBe(true);
    });

    it('should merge saved preferences with defaults', () => {
      const savedData = JSON.stringify({
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
      });

      mockStorage.getItem = vi.fn().mockReturnValue(savedData);

      const { result } = renderHook(() => usePreferences());

      // Should have all 5 categories
      expect(result.current.preferences.size).toBe(5);

      // Timezone should be custom
      const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
      expect(tzPref?.optInStatus).toBe(true);
      expect(tzPref?.value).toBe('America/New_York');

      // Other categories should be defaults
      const localePref = result.current.preferences.get(PreferenceCategory.Locale);
      expect(localePref?.optInStatus).toBe(false);
      expect(localePref?.value).toBe('en-US');
    });
  });

  // ============================================================================
  // Contract 3: Save Preference
  // ============================================================================

  describe('Save Preference', () => {
    it('should save preference with opt-in', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/Los_Angeles',
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(tzPref?.value).toBe('America/Los_Angeles');
        expect(tzPref?.optInStatus).toBe(true);
      });

      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it('should not save preference without opt-in', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/Los_Angeles',
          optInStatus: false,
          timestamp: new Date().toISOString(),
        });
      });

      // Should not call setItem when optInStatus is false
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('should debounce rapid saves (300ms debounce)', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);
      vi.useFakeTimers();

      const { result } = renderHook(() => usePreferences());

      // Make 3 rapid saves
      act(() => {
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/Chicago',
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/Los_Angeles',
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
      });

      // Should not have called setItem yet
      expect(mockStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should only save once (debounced)
        expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });
  });

  // ============================================================================
  // Contract 4: Update Preference
  // ============================================================================

  describe('Update Preference', () => {
    it('should update preference value', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.updatePreference(
          PreferenceCategory.Locale,
          'es-MX',
          true
        );
      });

      await waitFor(() => {
        const localePref = result.current.preferences.get(PreferenceCategory.Locale);
        expect(localePref?.value).toBe('es-MX');
        expect(localePref?.optInStatus).toBe(true);
      });
    });

    it('should update opt-in status', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.updatePreference(
          PreferenceCategory.Timezone,
          'America/New_York',
          true
        );
      });

      await waitFor(() => {
        const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(tzPref?.optInStatus).toBe(true);
      });
    });

    it('should handle validation errors gracefully', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.updatePreference(
          PreferenceCategory.Timezone,
          'Invalid/Timezone',
          true
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.type).toBe('Validation');
      });
    });
  });

  // ============================================================================
  // Contract 5: Reset Preferences
  // ============================================================================

  describe('Reset Preferences', () => {
    it('should reset all preferences to defaults', async () => {
      const savedData = JSON.stringify({
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
      });

      mockStorage.getItem = vi.fn().mockReturnValue(savedData);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.resetPreferences();
      });

      await waitFor(() => {
        const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(tzPref?.value).toBe('UTC'); // Default
        expect(tzPref?.optInStatus).toBe(false);
      });

      expect(mockStorage.removeItem).toHaveBeenCalledWith('payplan_preferences_v1');
    });

    it('should reset specific category', async () => {
      const savedData = JSON.stringify({
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
            value: 'es-MX',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        },
        totalSize: 200,
        lastModified: '2025-10-13T10:00:00.000Z',
      });

      mockStorage.getItem = vi.fn().mockReturnValue(savedData);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.resetPreferences(PreferenceCategory.Timezone);
      });

      await waitFor(() => {
        const tzPref = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(tzPref?.value).toBe('UTC'); // Reset to default
        expect(tzPref?.optInStatus).toBe(false);

        const localePref = result.current.preferences.get(PreferenceCategory.Locale);
        expect(localePref?.value).toBe('es-MX'); // Unchanged
        expect(localePref?.optInStatus).toBe(true);
      });
    });
  });

  // ============================================================================
  // Contract 6: Error Handling
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle QuotaExceededError gracefully', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);
      mockStorage.setItem = vi.fn().mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.savePreference({
          category: PreferenceCategory.BusinessDaySettings,
          value: {
            workingDays: [1, 2, 3, 4, 5],
            holidays: Array(1000).fill('2025-12-25'), // Intentionally large
          },
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.type).toBe('QuotaExceeded');
      });
    });

    it('should handle SecurityError gracefully', async () => {
      mockStorage.getItem = vi.fn().mockImplementation(() => {
        const error = new Error('SecurityError');
        error.name = 'SecurityError';
        throw error;
      });

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.type).toBe('Security');
      });
    });

    it('should handle corrupted localStorage data', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue('{ invalid json }');

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.type).toBe('Deserialization');
      });

      // Should fall back to defaults despite error
      expect(result.current.preferences.size).toBe(5);
    });
  });

  // ============================================================================
  // Contract 7: Cross-Tab Synchronization
  // ============================================================================

  describe('Cross-Tab Synchronization', () => {
    it('should sync preferences when storage event fires', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      // Initial state: defaults
      const initialTz = result.current.preferences.get(PreferenceCategory.Timezone);
      expect(initialTz?.value).toBe('UTC');

      // Simulate storage event from another tab
      const newData = JSON.stringify({
        version: '1.0.0',
        preferences: {
          [PreferenceCategory.Timezone]: {
            category: PreferenceCategory.Timezone,
            value: 'Europe/London',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        },
        totalSize: 150,
        lastModified: '2025-10-13T10:00:00.000Z',
      });

      mockStorage.getItem = vi.fn().mockReturnValue(newData);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'payplan_preferences_v1',
            newValue: newData,
            storageArea: mockStorage,
          })
        );
      });

      await waitFor(() => {
        const updatedTz = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(updatedTz?.value).toBe('Europe/London');
        expect(updatedTz?.optInStatus).toBe(true);
      });
    });

    it('should not sync when key does not match', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      const initialTz = result.current.preferences.get(PreferenceCategory.Timezone);
      const initialValue = initialTz?.value;

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'other_key',
            newValue: 'some data',
            storageArea: mockStorage,
          })
        );
      });

      // Should not have changed
      const unchangedTz = result.current.preferences.get(PreferenceCategory.Timezone);
      expect(unchangedTz?.value).toBe(initialValue);
    });
  });

  // ============================================================================
  // Contract 8: React 19 useSyncExternalStore Pattern
  // ============================================================================

  describe('React 19 useSyncExternalStore', () => {
    it('should use useSyncExternalStore for external state', () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      // Hook should provide consistent snapshot
      const snapshot1 = result.current.preferences;
      const snapshot2 = result.current.preferences;

      expect(snapshot1).toBe(snapshot2); // Same reference for same state
    });

    it('should trigger re-render on external storage change', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result, rerender } = renderHook(() => usePreferences());

      const initialVersion = result.current.preferences.get(PreferenceCategory.Timezone);

      // Simulate external change
      const newData = JSON.stringify({
        version: '1.0.0',
        preferences: {
          [PreferenceCategory.Timezone]: {
            category: PreferenceCategory.Timezone,
            value: 'Asia/Tokyo',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        },
        totalSize: 150,
        lastModified: '2025-10-13T10:00:00.000Z',
      });

      mockStorage.getItem = vi.fn().mockReturnValue(newData);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'payplan_preferences_v1',
            newValue: newData,
            storageArea: mockStorage,
          })
        );
      });

      rerender();

      await waitFor(() => {
        const updatedVersion = result.current.preferences.get(PreferenceCategory.Timezone);
        expect(updatedVersion?.value).not.toBe(initialVersion?.value);
        expect(updatedVersion?.value).toBe('Asia/Tokyo');
      });
    });
  });

  // ============================================================================
  // Contract 9: Performance Requirements
  // ============================================================================

  describe('Performance Requirements', () => {
    it('should restore preferences in <100ms (NFR-001)', async () => {
      const savedData = JSON.stringify({
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
      });

      mockStorage.getItem = vi.fn().mockReturnValue(savedData);

      const startTime = performance.now();
      const { result } = renderHook(() => usePreferences());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // <100ms (NFR-001)
    });

    it('should handle rapid updates efficiently', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      const startTime = performance.now();

      // Make 10 rapid updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.updatePreference(
            PreferenceCategory.Timezone,
            `America/Timezone_${i}`,
            true
          );
        }
      });

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });

  // ============================================================================
  // Contract 10: Accessibility (ARIA Live Regions)
  // ============================================================================

  describe('Accessibility', () => {
    it('should provide status messages for screen readers', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.savePreference({
          category: PreferenceCategory.Timezone,
          value: 'America/New_York',
          optInStatus: true,
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        // Hook should expose status message for ARIA live region
        expect(result.current.statusMessage).toBeDefined();
        expect(result.current.statusMessage).toContain('saved');
      });
    });

    it('should provide error messages for screen readers', async () => {
      mockStorage.getItem = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.updatePreference(
          PreferenceCategory.Timezone,
          'Invalid/Timezone',
          true
        );
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.statusMessage).toContain('error');
      });
    });
  });
});
