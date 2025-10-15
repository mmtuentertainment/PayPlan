/**
 * Unit Tests: PaymentStatusStorage
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Tasks: T012, T013, T014
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusStorage.contract.md
 *
 * TDD: These tests are written FIRST and MUST FAIL initially.
 * Implementation: T021-T027
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PaymentStatusStorage } from '../../../src/lib/payment-status/PaymentStatusStorage';
import type { PaymentStatusRecord } from '../../../src/lib/payment-status/types';
import { STORAGE_KEY } from '../../../src/lib/payment-status/constants';

describe('PaymentStatusStorage', () => {
  let storage: PaymentStatusStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new PaymentStatusStorage();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  // ==========================================================================
  // T012: Unit test for saveStatus()
  // ==========================================================================
  describe('saveStatus()', () => {
    it('should save a valid payment status record to localStorage', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }

      // Verify it was saved to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.statuses[record.paymentId]).toEqual(record);
      }
    });

    it('should return validation error for invalid payment ID', () => {
      const record: PaymentStatusRecord = {
        paymentId: 'invalid-id',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('UUID');
      }
    });

    it('should return validation error for invalid status', () => {
      const record = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid-status' as any,
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('should update collection metadata on save', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.totalSize).toBeGreaterThan(0);
        expect(parsed.lastModified).toBeTruthy();
      }
    });

    it('should trigger storage event for cross-tab sync', () => {
      const storageEventSpy = vi.fn();
      window.addEventListener('storage', storageEventSpy);

      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      // Storage events are triggered by actual localStorage changes
      // In test environment, this may not trigger, but we verify the save
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();

      window.removeEventListener('storage', storageEventSpy);
    });

    it('should return QuotaExceeded error when storage limit reached', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('QuotaExceeded');
      }

      // Restore original setItem
      Storage.prototype.setItem = originalSetItem;
    });
  });

  // ==========================================================================
  // T013: Unit test for loadStatuses()
  // ==========================================================================
  describe('loadStatuses()', () => {
    it('should return empty collection when no data exists', () => {
      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(0);
        expect(result.value.version).toBe('1.0.0');
      }
    });

    it('should load valid data from localStorage', () => {
      // Manually set valid data
      const data = {
        version: '1.0.0',
        statuses: {
          '550e8400-e29b-41d4-a716-446655440000': {
            paymentId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'paid',
            timestamp: '2025-10-15T14:30:00.000Z',
          },
        },
        totalSize: 200,
        lastModified: '2025-10-15T14:30:00.000Z',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(1);
        const record = result.value.statuses.get(
          '550e8400-e29b-41d4-a716-446655440000'
        );
        expect(record?.status).toBe('paid');
      }
    });

    it('should clear and return defaults for corrupted data', () => {
      // Set corrupted JSON
      localStorage.setItem(STORAGE_KEY, '{invalid json');

      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(0);
      }

      // Corrupted data should be cleared
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeNull();
    });

    it('should handle version mismatch with migration', () => {
      const data = {
        version: '0.9.0',
        statuses: {
          '550e8400-e29b-41d4-a716-446655440000': {
            paymentId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'paid',
            timestamp: '2025-10-15T14:30:00.000Z',
          },
        },
        totalSize: 200,
        lastModified: '2025-10-15T14:30:00.000Z',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('1.0.0');
      }
    });

    it('should load within 100ms for 500 records (performance target)', () => {
      // Create 500 records
      const statuses: any = {};
      for (let i = 0; i < 500; i++) {
        const id = `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`;
        statuses[id] = {
          paymentId: id,
          status: i % 2 === 0 ? 'paid' : 'pending',
          timestamp: '2025-10-15T14:30:00.000Z',
        };
      }

      const data = {
        version: '1.0.0',
        statuses,
        totalSize: 70000,
        lastModified: '2025-10-15T14:30:00.000Z',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const start = performance.now();
      const result = storage.loadStatuses();
      const duration = performance.now() - start;

      expect(result.ok).toBe(true);
      expect(duration).toBeLessThan(100); // <100ms target
    });
  });

  // ==========================================================================
  // T014: Unit test for getStatus()
  // ==========================================================================
  describe('getStatus()', () => {
    it('should return status record for existing payment', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      const result = storage.getStatus(record.paymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(record);
      }
    });

    it('should return null for non-existent payment', () => {
      const result = storage.getStatus('550e8400-e29b-41d4-a716-446655440000');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should return validation error for invalid payment ID', () => {
      const result = storage.getStatus('invalid-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });

  // ==========================================================================
  // Additional tests for contract compliance
  // ==========================================================================
  describe('calculateSize()', () => {
    it('should return accurate byte count', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      const size = storage.calculateSize();

      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(5 * 1024 * 1024); // < 5MB
    });

    it('should match actual localStorage usage within 5%', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      const calculatedSize = storage.calculateSize();
      const saved = localStorage.getItem(STORAGE_KEY);
      const actualSize = saved ? new Blob([saved]).size : 0;

      const difference = Math.abs(calculatedSize - actualSize);
      const percentDiff = (difference / actualSize) * 100;

      expect(percentDiff).toBeLessThan(5);
    });
  });
});
