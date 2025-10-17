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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ArchiveStorage } from '../ArchiveStorage';
import { INDEX_SCHEMA_VERSION } from '../constants';

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
      expect(() => new Date(index.lastModified)).not.toThrow();
      expect(new Date(index.lastModified).toISOString()).toBe(index.lastModified);
    });

    it('should return fresh index on each call with updated timestamp', async () => {
      const index1 = storage.createDefaultIndex();
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const index2 = storage.createDefaultIndex();

      expect(index1.archives).toEqual([]);
      expect(index2.archives).toEqual([]);
      expect(index1.lastModified).not.toBe(index2.lastModified); // Different timestamps
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
      localStorage.setItem('payplan_archive_index', JSON.stringify(testIndex));

      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archives.length).toBe(1);
        expect(result.value.archives[0].name).toBe('Test Archive');
      }
    });

    it('should return default index when localStorage has corrupted JSON', () => {
      localStorage.setItem('payplan_archive_index', '{invalid json');

      const result = storage.loadArchiveIndex();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archives).toEqual([]);
      }
    });

    it('should return default index when localStorage has invalid schema', () => {
      localStorage.setItem('payplan_archive_index', JSON.stringify({ foo: 'bar' }));

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
      localStorage.setItem('payplan_archive_index', JSON.stringify(testIndex));

      const size = storage.calculateTotalSize();
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(500); // Small index
    });

    it('should sum index + all archive data', () => {
      // Create index
      localStorage.setItem('payplan_archive_index', JSON.stringify({
        version: INDEX_SCHEMA_VERSION,
        archives: [{ id: 'test-id', name: 'Test', createdAt: '2025-10-17T14:30:00.000Z', paymentCount: 0, paidCount: 0, pendingCount: 0 }],
        lastModified: '2025-10-17T14:30:00.000Z',
      }));

      // Create archive
      localStorage.setItem('payplan_archive_test-id', JSON.stringify({
        id: 'test-id',
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
});
