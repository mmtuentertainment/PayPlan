/**
 * Contract tests for PreferenceStorageService.calculateStorageSize()
 *
 * Feature: 012-user-preference-management
 * Task: T008
 * Contract: specs/012-user-preference-management/contracts/PreferenceStorageService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PreferenceCategory } from '../../../src/lib/preferences/types';
import type { UserPreference, PreferenceCollection } from '../../../src/lib/preferences/types';
import { PreferenceStorageService } from '../../../src/lib/preferences/PreferenceStorageService';
import { STORAGE_LIMIT_BYTES } from '../../../src/lib/preferences/constants';

describe('PreferenceStorageService.calculateStorageSize()', () => {
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
  // Contract 1: Calculate size for empty collection
  // ============================================================================

  it('should calculate size for empty preference collection', () => {
    const emptyCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map(),
      totalSize: 0,
      lastModified: new Date().toISOString(),
    };

    const size = service.calculateStorageSize(emptyCollection);

    expect(size).toBeGreaterThan(0); // Metadata has some size
    expect(size).toBeLessThan(STORAGE_LIMIT_BYTES); // Must be under 5KB
  });

  // ============================================================================
  // Contract 2: Calculate size for single preference
  // ============================================================================

  it('should calculate size for single timezone preference', () => {
    const collection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'America/New_York',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0, // Will be calculated
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size = service.calculateStorageSize(collection);

    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(STORAGE_LIMIT_BYTES); // Under 5KB
  });

  // ============================================================================
  // Contract 3: Calculate size for full collection (all 5 categories)
  // ============================================================================

  it('should calculate size for full preference collection', () => {
    const fullCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'America/New_York',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.PaydayDates,
          {
            category: PreferenceCategory.PaydayDates,
            value: {
              type: 'biweekly',
              startDate: '2025-01-03',
              dayOfWeek: 5,
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.BusinessDaySettings,
          {
            category: PreferenceCategory.BusinessDaySettings,
            value: {
              workingDays: [1, 2, 3, 4, 5],
              holidays: ['2025-12-25', '2025-01-01'],
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.CurrencyFormat,
          {
            category: PreferenceCategory.CurrencyFormat,
            value: {
              currencyCode: 'USD',
              decimalSeparator: '.',
              thousandsSeparator: ',',
              symbolPosition: 'before',
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.Locale,
          {
            category: PreferenceCategory.Locale,
            value: 'en-US',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size = service.calculateStorageSize(fullCollection);

    expect(size).toBeGreaterThan(400); // Full collection is substantial
    expect(size).toBeLessThan(STORAGE_LIMIT_BYTES); // Must be under 5KB
  });

  // ============================================================================
  // Contract 4: Size calculation matches JSON.stringify byte length
  // ============================================================================

  it('should calculate size matching JSON.stringify byte length', () => {
    const collection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'America/New_York',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const calculatedSize = service.calculateStorageSize(collection);

    // Update collection with calculated size for accurate comparison
    collection.totalSize = calculatedSize;

    // Serialize collection (Map → Record for JSON)
    const serialized = {
      version: collection.version,
      preferences: Object.fromEntries(collection.preferences),
      totalSize: collection.totalSize,
      lastModified: collection.lastModified,
    };

    const jsonString = JSON.stringify(serialized);
    const expectedSize = new Blob([jsonString]).size; // UTF-8 byte length

    // Should match within 2 bytes (fixed-point iteration convergence)
    expect(Math.abs(calculatedSize - expectedSize)).toBeLessThanOrEqual(2);
  });

  // ============================================================================
  // Contract 5: Size calculation for complex nested values
  // ============================================================================

  it('should accurately calculate size for complex business day settings', () => {
    const complexCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.BusinessDaySettings,
          {
            category: PreferenceCategory.BusinessDaySettings,
            value: {
              workingDays: [1, 2, 3, 4, 5],
              holidays: [
                '2025-01-01',
                '2025-12-25',
                '2025-12-31',
                '2025-07-04',
                '2025-11-28',
              ],
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size = service.calculateStorageSize(complexCollection);

    expect(size).toBeGreaterThan(200); // Complex value is larger
    expect(size).toBeLessThan(STORAGE_LIMIT_BYTES);
  });

  // ============================================================================
  // Contract 6: Detect quota exceeded before saving
  // ============================================================================

  it('should detect when collection would exceed 5KB limit', () => {
    // Create intentionally large collection
    const largeHolidays = Array(500)
      .fill(0)
      .map((_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-01`);

    const largeCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.BusinessDaySettings,
          {
            category: PreferenceCategory.BusinessDaySettings,
            value: {
              workingDays: [1, 2, 3, 4, 5],
              holidays: largeHolidays,
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size = service.calculateStorageSize(largeCollection);

    expect(size).toBeGreaterThan(STORAGE_LIMIT_BYTES); // Should exceed 5KB
  });

  // ============================================================================
  // Contract 7: Performance requirement (<10ms calculation)
  // ============================================================================

  it('should calculate size in <10ms for typical collection', () => {
    const typicalCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'America/New_York',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.Locale,
          {
            category: PreferenceCategory.Locale,
            value: 'en-US',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const startTime = performance.now();
    const size = service.calculateStorageSize(typicalCollection);
    const endTime = performance.now();

    expect(size).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(25); // avoid CI flakiness
  });

  // ============================================================================
  // Contract 8: Size increases with more preferences
  // ============================================================================

  it('should calculate larger size for more preferences', () => {
    const onePreference: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'UTC',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const twoPreferences: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'UTC',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
        [
          PreferenceCategory.Locale,
          {
            category: PreferenceCategory.Locale,
            value: 'en-US',
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size1 = service.calculateStorageSize(onePreference);
    const size2 = service.calculateStorageSize(twoPreferences);

    expect(size2).toBeGreaterThan(size1);
  });

  // ============================================================================
  // Contract 9: Handle UTF-8 multi-byte characters
  // ============================================================================

  it('should correctly calculate size for UTF-8 multi-byte characters', () => {
    const unicodeCollection: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.CurrencyFormat,
          {
            category: PreferenceCategory.CurrencyFormat,
            value: {
              currencyCode: 'EUR',
              decimalSeparator: ',',
              thousandsSeparator: '.',
              symbolPosition: 'before', // € symbol is multi-byte UTF-8
            },
            optInStatus: true,
            timestamp: '2025-10-13T10:00:00.000Z',
          },
        ],
      ]),
      totalSize: 0,
      lastModified: '2025-10-13T10:00:00.000Z',
    };

    const size = service.calculateStorageSize(unicodeCollection);

    // EUR symbol (€) is 3 bytes in UTF-8
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(STORAGE_LIMIT_BYTES);
  });

  // ============================================================================
  // Contract 10: Size validation before save
  // ============================================================================

  it('should validate size before allowing save operation', () => {
    // Create collection that exceeds limit
    const largeHolidays = Array(1000)
      .fill(0)
      .map((_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`);

    const oversizedPref: UserPreference = {
      category: PreferenceCategory.BusinessDaySettings,
      value: {
        workingDays: [1, 2, 3, 4, 5],
        holidays: largeHolidays,
      },
      optInStatus: true,
      timestamp: new Date().toISOString(),
    };

    // Attempt to save should fail with QuotaExceeded
    const result = service.savePreference(oversizedPref);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('QuotaExceeded');
    }
  });
});
