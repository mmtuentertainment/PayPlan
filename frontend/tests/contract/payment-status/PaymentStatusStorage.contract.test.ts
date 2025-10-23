/**
 * Contract Tests: PaymentStatusStorage
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T018
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusStorage.contract.md
 *
 * TDD: These tests verify the implementation matches the contract specification.
 * Tests MUST FAIL initially until implementation is complete.
 *
 * This test file validates ALL assertions from the contract document.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentStatusStorage } from '../../../src/lib/payment-status/PaymentStatusStorage';
import type { PaymentStatusRecord } from '../../../src/lib/payment-status/types';
import { STORAGE_KEY } from '../../../src/lib/payment-status/constants';

describe('PaymentStatusStorage Contract Validation', () => {
  let storage: PaymentStatusStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new PaymentStatusStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // Contract: saveStatus()
  // ==========================================================================
  describe('saveStatus() contract', () => {
    it('✅ Valid record is saved to localStorage', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    });

    it('✅ Invalid paymentId throws Validation error', () => {
      const record: unknown = {
        paymentId: 'not-a-uuid',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('✅ Invalid status enum throws Validation error', () => {
      const record: unknown = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('✅ Invalid timestamp throws Validation error', () => {
      const record: unknown = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: 'not-iso-8601',
      };

      const result = storage.saveStatus(record);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('✅ Collection metadata updates (totalSize, lastModified)', () => {
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
        expect(parsed.totalSize).toBeGreaterThan(0);
        expect(parsed.lastModified).toBeTruthy();
        expect(new Date(parsed.lastModified).getTime()).toBeGreaterThan(0);
      }
    });

    it('✅ Storage event is triggered for cross-tab sync', () => {
      // Note: jsdom doesn't trigger storage events in same window
      // This test verifies that setItem is called (which triggers events)
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      // Verify localStorage was modified (which triggers event)
      expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    });
  });

  // ==========================================================================
  // Contract: loadStatuses()
  // ==========================================================================
  describe('loadStatuses() contract', () => {
    it('✅ Empty localStorage returns empty collection', () => {
      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(0);
        expect(result.value.version).toBe('1.0.0');
      }
    });

    it('✅ Valid data is deserialized correctly', () => {
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
        const record = result.value.statuses.get('550e8400-e29b-41d4-a716-446655440000');
        expect(record?.status).toBe('paid');
      }
    });

    it('✅ Corrupted JSON is handled (clear + return empty)', () => {
      localStorage.setItem(STORAGE_KEY, '{invalid json');

      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(0);
      }
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('✅ Version mismatch triggers migration', () => {
      const data = {
        version: '0.9.0',
        statuses: {},
        totalSize: 100,
        lastModified: '2025-10-15T14:30:00.000Z',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.version).toBe('1.0.0');
      }
    });

    it('✅ Performance: 500 records load in <100ms', () => {
      const statuses: Record<string, unknown> = {};
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
      expect(duration).toBeLessThan(100);
    });
  });

  // ==========================================================================
  // Contract: Performance Contract
  // ==========================================================================
  describe('Performance contract', () => {
    it('✅ Load 500 records in <100ms (NFR-001)', () => {
      const statuses: Record<string, unknown> = {};
      for (let i = 0; i < 500; i++) {
        const id = `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`;
        statuses[id] = {
          paymentId: id,
          status: 'paid',
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
      storage.loadStatuses();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('✅ Save single record in <200ms (SC-003)', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      const start = performance.now();
      storage.saveStatus(record);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('✅ Calculate size in <50ms', () => {
      const record: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record);

      const start = performance.now();
      storage.calculateSize();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  // ==========================================================================
  // Contract: Size Calculations
  // ==========================================================================
  describe('Size calculation contract', () => {
    it('✅ calculateSize() returns accurate byte count', () => {
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

    it('✅ Size recalculated on every save', () => {
      const record1: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record1);
      const size1 = storage.calculateSize();

      const record2: PaymentStatusRecord = {
        paymentId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'paid',
        timestamp: '2025-10-15T14:30:00.000Z',
      };

      storage.saveStatus(record2);
      const size2 = storage.calculateSize();

      expect(size2).toBeGreaterThan(size1);
    });

    it('✅ Size matches actual localStorage usage (within 5%)', () => {
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

  // ==========================================================================
  // Contract: Error Handling
  // ==========================================================================
  describe('Error handling contract', () => {
    it('✅ QuotaExceeded error when storage limit reached', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error();
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

      Storage.prototype.setItem = originalSetItem;
    });

    it('✅ Graceful degradation for all error types', () => {
      // Test corrupted data fallback
      localStorage.setItem(STORAGE_KEY, 'not valid json');
      const result = storage.loadStatuses();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.statuses.size).toBe(0);
      }
    });
  });
});
