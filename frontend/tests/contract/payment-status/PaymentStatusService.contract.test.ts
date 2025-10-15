/**
 * Contract Tests: PaymentStatusService
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T019
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusService.contract.md
 *
 * TDD: These tests verify the implementation matches the contract specification.
 * Tests MUST FAIL initially until implementation is complete.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentStatusService } from '../../../src/lib/payment-status/PaymentStatusService';
import { PaymentStatusStorage } from '../../../src/lib/payment-status/PaymentStatusStorage';

describe('PaymentStatusService Contract Validation', () => {
  let service: PaymentStatusService;
  let storage: PaymentStatusStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new PaymentStatusStorage();
    service = new PaymentStatusService(storage);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const validId = '550e8400-e29b-41d4-a716-446655440000';

  // ==========================================================================
  // Contract: markAsPaid()
  // ==========================================================================
  describe('markAsPaid() contract', () => {
    it('✅ Creates record with correct status and timestamp', () => {
      const before = Date.now();
      const result = service.markAsPaid(validId);
      const after = Date.now();

      expect(result.ok).toBe(true);

      const record = service.getStatusWithTimestamp(validId);
      expect(record.ok).toBe(true);
      if (record.ok && record.value) {
        const timestamp = new Date(record.value.timestamp).getTime();
        expect(record.value.status).toBe('paid');
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      }
    });

    it('✅ Idempotent operations update timestamp even if status unchanged', () => {
      service.markAsPaid(validId);
      const first = service.getStatusWithTimestamp(validId);
      const firstTime = first.ok && first.value ? first.value.timestamp : '';

      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      return wait(10).then(() => {
        service.markAsPaid(validId);
        const second = service.getStatusWithTimestamp(validId);
        const secondTime = second.ok && second.value ? second.value.timestamp : '';

        expect(secondTime).not.toBe(firstTime);
        expect(second.ok && second.value?.status).toBe('paid');
      });
    });
  });

  // ==========================================================================
  // Contract: markAsPending()
  // ==========================================================================
  describe('markAsPending() contract', () => {
    it('✅ Updates existing record to pending', () => {
      service.markAsPaid(validId);
      const result = service.markAsPending(validId);

      expect(result.ok).toBe(true);

      const status = service.getStatus(validId);
      expect(status.ok && status.value).toBe('pending');
    });
  });

  // ==========================================================================
  // Contract: toggleStatus()
  // ==========================================================================
  describe('toggleStatus() contract', () => {
    it('✅ Switches between paid/pending correctly', () => {
      let result = service.toggleStatus(validId);
      expect(result.ok && result.value).toBe('paid');

      result = service.toggleStatus(validId);
      expect(result.ok && result.value).toBe('pending');

      result = service.toggleStatus(validId);
      expect(result.ok && result.value).toBe('paid');
    });

    it('✅ Returns new status for immediate UI update', () => {
      const result = service.toggleStatus(validId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const status = service.getStatus(validId);
        expect(status.ok && status.value).toBe(result.value);
      }
    });
  });

  // ==========================================================================
  // Contract: getStatus()
  // ==========================================================================
  describe('getStatus() contract', () => {
    it('✅ Returns "pending" for non-existent records (default)', () => {
      const result = service.getStatus(validId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('pending');
      }
    });

    it('✅ Read operation does not trigger storage events', () => {
      const spy = vi.fn();
      window.addEventListener('storage', spy);

      service.getStatus(validId);

      // Read operations should not modify localStorage
      expect(spy).not.toHaveBeenCalled();

      window.removeEventListener('storage', spy);
    });
  });

  // ==========================================================================
  // Contract: Validation
  // ==========================================================================
  describe('Input validation contract', () => {
    it('✅ Invalid UUID format returns Validation error', () => {
      const result = service.markAsPaid('not-a-uuid');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('UUID');
      }
    });

    it('✅ Empty string returns Validation error', () => {
      const result = service.markAsPaid('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });

  // ==========================================================================
  // Contract: Performance
  // ==========================================================================
  describe('Performance contract', () => {
    it('✅ Single mark in <2 seconds (SC-001)', () => {
      const start = performance.now();
      service.markAsPaid(validId);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('✅ Visual feedback in <200ms (SC-003)', () => {
      const start = performance.now();
      service.toggleStatus(validId);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('✅ Get status in <50ms', () => {
      service.markAsPaid(validId);

      const start = performance.now();
      service.getStatus(validId);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  // ==========================================================================
  // Contract: Error Handling
  // ==========================================================================
  describe('Error handling contract', () => {
    it('✅ Storage errors propagate correctly', () => {
      // Mock storage to throw error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = service.markAsPaid(validId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }

      Storage.prototype.setItem = originalSetItem;
    });

    it('✅ QuotaExceeded error handled gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        const error = new Error();
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = service.markAsPaid(validId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('QuotaExceeded');
      }

      Storage.prototype.setItem = originalSetItem;
    });
  });

  // ==========================================================================
  // Contract: Integration with Mock Storage
  // ==========================================================================
  describe('Integration contract', () => {
    it('✅ Service works with mock storage for testing', () => {
      // This test verifies dependency injection works
      const mockStorage = new PaymentStatusStorage();
      const testService = new PaymentStatusService(mockStorage);

      const result = testService.markAsPaid(validId);
      expect(result.ok).toBe(true);
    });

    it('✅ Service works with real PaymentStatusStorage', () => {
      const realStorage = new PaymentStatusStorage();
      const testService = new PaymentStatusService(realStorage);

      const result = testService.markAsPaid(validId);
      expect(result.ok).toBe(true);

      const status = testService.getStatus(validId);
      expect(status.ok && status.value).toBe('paid');
    });
  });
});
