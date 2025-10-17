/**
 * ArchiveStorage Unit Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 2 (Foundational Layer)
 * Tasks: T007, T009, T011, T013
 *
 * Tests for archive persistence in browser localStorage.
 * Follows patterns from Feature 015 (PaymentStatusStorage.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveStorage } from '../ArchiveStorage';
import { INDEX_SCHEMA_VERSION, ARCHIVE_INDEX_KEY, getArchiveKey } from '../constants';

describe('ArchiveStorage - Foundational Layer', () => {
  let storage: ArchiveStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new ArchiveStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('T007: createDefaultIndex()', () => {
    it('should return empty ArchiveIndex with correct schema', () => {
      const index = storage.createDefaultIndex();

      expect(index).toEqual({
        version: INDEX_SCHEMA_VERSION,
        archives: [],
        lastModified: expect.any(String),
      });

      // Validate lastModified is ISO 8601
      const parsedDate = new Date(index.lastModified);
      expect(isNaN(parsedDate.getTime())).toBe(false);
      expect(parsedDate.toISOString()).toBe(index.lastModified);
    });

    it('should return fresh index on each call with updated timestamp', () => {
      vi.useFakeTimers();

      const index1 = storage.createDefaultIndex();

      // Advance time by 10ms
      vi.advanceTimersByTime(10);

      const index2 = storage.createDefaultIndex();

      expect(index1.archives).toEqual([]);
      expect(index2.archives).toEqual([]);
      expect(index1.lastModified).not.toBe(index2.lastModified); // Different timestamps

      vi.useRealTimers();
    });
  });

  describe('T009: loadArchiveIndex()', () => {
    it('should return default index when localStorage key does not exist', () => {
      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe(INDEX_SCHEMA_VERSION);
        expect(result.value.archives).toEqual([]);
        expect(result.value.lastModified).toBeTruthy();
      }
    });

    it('should load valid index from localStorage', () => {
      // Setup: Save valid index
      const testIndex = {
        version: INDEX_SCHEMA_VERSION,
        archives: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test Archive',
            createdAt: '2025-10-17T14:30:00.000Z',
            paymentCount: 10,
            paidCount: 5,
            pendingCount: 5,
          },
        ],
        lastModified: '2025-10-17T14:30:00.000Z',
      };
      localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify(testIndex));

      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archives.length).toBe(1);
        expect(result.value.archives[0].name).toBe('Test Archive');
      }
    });

    it('should return default index when localStorage has corrupted JSON', () => {
      localStorage.setItem(ARCHIVE_INDEX_KEY, '{invalid json');

      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archives).toEqual([]);
      }
    });

    it('should return default index when localStorage has invalid schema', () => {
      localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify({ foo: 'bar' }));

      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archives).toEqual([]);
      }
    });
  });

  describe('T011: calculateTotalSize()', () => {
    it('should return 0 when no archives exist', () => {
      const size = storage.calculateTotalSize();
      expect(size).toBe(0);
    });

    it('should calculate size of archive index only', () => {
      const testIndex = {
        version: INDEX_SCHEMA_VERSION,
        archives: [],
        lastModified: '2025-10-17T14:30:00.000Z',
      };
      localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify(testIndex));

      const size = storage.calculateTotalSize();
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(500); // Small index
    });

    it('should sum index + all archive data', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';

      // Create index
      localStorage.setItem(ARCHIVE_INDEX_KEY, JSON.stringify({
        version: INDEX_SCHEMA_VERSION,
        archives: [{ id: testArchiveId, name: 'Test', createdAt: '2025-10-17T14:30:00.000Z', paymentCount: 0, paidCount: 0, pendingCount: 0 }],
        lastModified: '2025-10-17T14:30:00.000Z',
      }));

      // Create archive
      localStorage.setItem(getArchiveKey(testArchiveId), JSON.stringify({
        id: testArchiveId,
        name: 'Test Archive',
        createdAt: '2025-10-17T14:30:00.000Z',
        sourceVersion: '1.0.0',
        payments: [],
        metadata: {
          totalCount: 0,
          paidCount: 0,
          pendingCount: 0,
          dateRange: { earliest: null, latest: null },
          storageSize: 0,
        },
      }));

      const size = storage.calculateTotalSize();
      expect(size).toBeGreaterThan(200); // Index + archive
    });
  });

  describe('T013: handleStorageError()', () => {
    it('should handle QuotaExceededError', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      const result = storage.handleStorageError(quotaError);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('QuotaExceeded');
        expect(result.error.message).toContain('Storage limit exceeded');
      }
    });

    it('should handle SecurityError', () => {
      const securityError = new Error('SecurityError');
      securityError.name = 'SecurityError';

      const result = storage.handleStorageError(securityError);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Security');
        expect(result.error.message).toContain('localStorage is disabled');
      }
    });

    it('should handle unknown errors as Serialization type', () => {
      const unknownError = new Error('Something went wrong');

      const result = storage.handleStorageError(unknownError);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Serialization');
      }
    });

    it('should include archiveId if provided', () => {
      const error = new Error('Test error');
      const archiveId = '550e8400-e29b-41d4-a716-446655440000';

      const result = storage.handleStorageError(error, archiveId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.archiveId).toBe(archiveId);
      }
    });
  });

  describe('T023: saveArchive()', () => {
    it('should save archive to localStorage with correct key', () => {
      const testArchive = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'October 2025',
        createdAt: '2025-10-17T14:30:00.000Z',
        sourceVersion: '1.0.0',
        payments: [],
        metadata: {
          totalCount: 0,
          paidCount: 0,
          pendingCount: 0,
          dateRange: { earliest: null, latest: null },
          storageSize: 0,
        },
      };

      const result = storage.saveArchive(testArchive);

      expect(result.ok).toBe(true);

      // Verify saved to correct key
      const key = getArchiveKey(testArchive.id);
      const saved = localStorage.getItem(key);
      expect(saved).toBeTruthy();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.name).toBe('October 2025');
        expect(parsed.id).toBe(testArchive.id);
      }
    });

    it('should reject invalid archive ID', () => {
      const invalidArchive = {
        id: 'not-a-uuid',
        name: 'Test',
        createdAt: '2025-10-17T14:30:00.000Z',
        sourceVersion: '1.0.0',
        payments: [],
        metadata: {
          totalCount: 0,
          paidCount: 0,
          pendingCount: 0,
          dateRange: { earliest: null, latest: null },
          storageSize: 0,
        },
      };

      const result = storage.saveArchive(invalidArchive);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });

  describe('T025: updateIndex()', () => {
    it('should add new entry to archive index', () => {
      const entry = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'October 2025',
        createdAt: '2025-10-17T14:30:00.000Z',
        paymentCount: 10,
        paidCount: 5,
        pendingCount: 5,
      };

      const result = storage.updateIndex(entry);

      expect(result.ok).toBe(true);

      // Verify index was updated
      const indexResult = storage.loadArchiveIndex();
      expect(indexResult.ok).toBe(true);
      if (indexResult.ok) {
        expect(indexResult.value.archives).toHaveLength(1);
        expect(indexResult.value.archives[0].name).toBe('October 2025');
      }
    });

    it('should add entries at beginning (newest first)', () => {
      // Add first entry
      storage.updateIndex({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Archive 1',
        createdAt: '2025-10-17T14:30:00.000Z',
        paymentCount: 10,
        paidCount: 5,
        pendingCount: 5,
      });

      // Add second entry
      storage.updateIndex({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Archive 2',
        createdAt: '2025-10-18T14:30:00.000Z',
        paymentCount: 8,
        paidCount: 4,
        pendingCount: 4,
      });

      const indexResult = storage.loadArchiveIndex();
      expect(indexResult.ok).toBe(true);
      if (indexResult.ok) {
        expect(indexResult.value.archives).toHaveLength(2);
        // Newest should be first
        expect(indexResult.value.archives[0].name).toBe('Archive 2');
        expect(indexResult.value.archives[1].name).toBe('Archive 1');
      }
    });
  });

  describe('T043: loadArchive()', () => {
    it('should load archive by ID from localStorage', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';
      const testArchive = {
        id: testArchiveId,
        name: 'October 2025',
        createdAt: '2025-10-17T14:30:00.000Z',
        sourceVersion: '1.0.0',
        payments: [
          {
            paymentId: '650e8400-e29b-41d4-a716-446655440000',
            status: 'paid',
            timestamp: '2025-10-15T10:00:00.000Z',
            provider: 'Klarna',
            amount: 45.00,
            currency: 'USD',
            dueISO: '2025-10-20',
            autopay: true,
          },
        ],
        metadata: {
          totalCount: 1,
          paidCount: 1,
          pendingCount: 0,
          dateRange: { earliest: '2025-10-20', latest: '2025-10-20' },
          storageSize: 500,
        },
      };

      // Save archive to localStorage
      const key = getArchiveKey(testArchiveId);
      localStorage.setItem(key, JSON.stringify(testArchive));

      // Load archive
      const result = storage.loadArchive(testArchiveId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe(testArchiveId);
        expect(result.value.name).toBe('October 2025');
        expect(result.value.payments).toHaveLength(1);
        expect(result.value.payments[0].provider).toBe('Klarna');
      }
    });

    it('should return NotFound error when archive does not exist', () => {
      const archiveId = '550e8400-e29b-41d4-a716-446655440000';

      const result = storage.loadArchive(archiveId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NotFound');
        expect(result.error.archiveId).toBe(archiveId);
      }
    });

    it('should return Validation error for invalid archive ID', () => {
      const result = storage.loadArchive('invalid-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });

  describe('T045: loadArchive() validates archive schema', () => {
    it('should validate archive structure with Zod', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';
      const validArchive = {
        id: testArchiveId,
        name: 'Valid Archive',
        createdAt: '2025-10-17T14:30:00.000Z',
        sourceVersion: '1.0.0',
        payments: [],
        metadata: {
          totalCount: 0,
          paidCount: 0,
          pendingCount: 0,
          dateRange: { earliest: null, latest: null },
          storageSize: 0,
        },
      };

      const key = getArchiveKey(testArchiveId);
      localStorage.setItem(key, JSON.stringify(validArchive));

      const result = storage.loadArchive(testArchiveId);

      expect(result.ok).toBe(true);
    });

    it('should return Corrupted error for invalid schema', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidArchive = {
        id: testArchiveId,
        name: 'Invalid',
        // Missing required fields
      };

      const key = getArchiveKey(testArchiveId);
      localStorage.setItem(key, JSON.stringify(invalidArchive));

      const result = storage.loadArchive(testArchiveId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Corrupted');
        expect(result.error.archiveId).toBe(testArchiveId);
      }
    });
  });

  describe('T047: loadArchive() handles corrupted JSON', () => {
    it('should return Corrupted error for malformed JSON', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';
      const key = getArchiveKey(testArchiveId);
      localStorage.setItem(key, '{invalid json');

      const result = storage.loadArchive(testArchiveId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Corrupted');
        expect(result.error.message).toContain('corrupted');
        expect(result.error.archiveId).toBe(testArchiveId);
      }
    });

    it('should handle JSON with special characters gracefully', () => {
      const testArchiveId = '550e8400-e29b-41d4-a716-446655440000';
      const key = getArchiveKey(testArchiveId);
      localStorage.setItem(key, '{"id": null, "name": "\u0000"}');

      const result = storage.loadArchive(testArchiveId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Corrupted');
      }
    });
  });
});
