/**
 * Unit Tests: PaymentStatusService
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Tasks: T015, T016, T017
 * Contract: specs/015-build-a-payment/contracts/PaymentStatusService.contract.md
 *
 * TDD: These tests are written FIRST and MUST FAIL initially.
 * Implementation: T028-T031
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentStatusService } from '../../../src/lib/payment-status/PaymentStatusService';
import { PaymentStatusStorage } from '../../../src/lib/payment-status/PaymentStatusStorage';

describe('PaymentStatusService', () => {
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

  // ==========================================================================
  // T015: Unit test for markAsPaid()
  // ==========================================================================
  describe('markAsPaid()', () => {
    const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should mark payment as paid successfully', () => {
      const result = service.markAsPaid(validPaymentId);

      expect(result.ok).toBe(true);

      // Verify status was saved
      const statusResult = service.getStatus(validPaymentId);
      expect(statusResult.ok).toBe(true);
      if (statusResult.ok) {
        expect(statusResult.value).toBe('paid');
      }
    });

    it('should create record with current timestamp', () => {
      const before = Date.now();
      service.markAsPaid(validPaymentId);
      const after = Date.now();

      const statusResult = service.getStatusWithTimestamp(validPaymentId);
      expect(statusResult.ok).toBe(true);
      if (statusResult.ok && statusResult.value) {
        const timestamp = new Date(statusResult.value.timestamp).getTime();
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      }
    });

    it('should be idempotent (marking paid when already paid updates timestamp)', () => {
      service.markAsPaid(validPaymentId);

      const firstStatus = service.getStatusWithTimestamp(validPaymentId);
      const firstTimestamp = firstStatus.ok && firstStatus.value
        ? firstStatus.value.timestamp
        : '';

      // Wait a tiny bit to ensure different timestamp
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      return wait(10).then(() => {
        service.markAsPaid(validPaymentId);

        const secondStatus = service.getStatusWithTimestamp(validPaymentId);
        const secondTimestamp = secondStatus.ok && secondStatus.value
          ? secondStatus.value.timestamp
          : '';

        expect(secondTimestamp).not.toBe(firstTimestamp);
        expect(secondStatus.ok && secondStatus.value?.status).toBe('paid');
      });
    });

    it('should return validation error for invalid payment ID', () => {
      const result = service.markAsPaid('invalid-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('UUID');
      }
    });

    it('should complete in under 2 seconds (SC-001)', () => {
      const start = performance.now();
      service.markAsPaid(validPaymentId);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });

  // ==========================================================================
  // T016: Unit test for markAsPending()
  // ==========================================================================
  describe('markAsPending()', () => {
    const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should mark payment as pending successfully', () => {
      // First mark as paid
      service.markAsPaid(validPaymentId);

      // Then mark as pending (undo)
      const result = service.markAsPending(validPaymentId);

      expect(result.ok).toBe(true);

      // Verify status was updated
      const statusResult = service.getStatus(validPaymentId);
      expect(statusResult.ok).toBe(true);
      if (statusResult.ok) {
        expect(statusResult.value).toBe('pending');
      }
    });

    it('should support undo workflow (paid → pending)', () => {
      service.markAsPaid(validPaymentId);
      let status = service.getStatus(validPaymentId);
      expect(status.ok && status.value).toBe('paid');

      service.markAsPending(validPaymentId);
      status = service.getStatus(validPaymentId);
      expect(status.ok && status.value).toBe('pending');
    });

    it('should be idempotent (marking pending when already pending updates timestamp)', () => {
      service.markAsPending(validPaymentId);

      const firstStatus = service.getStatusWithTimestamp(validPaymentId);
      const firstTimestamp = firstStatus.ok && firstStatus.value
        ? firstStatus.value.timestamp
        : '';

      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      return wait(10).then(() => {
        service.markAsPending(validPaymentId);

        const secondStatus = service.getStatusWithTimestamp(validPaymentId);
        const secondTimestamp = secondStatus.ok && secondStatus.value
          ? secondStatus.value.timestamp
          : '';

        expect(secondTimestamp).not.toBe(firstTimestamp);
      });
    });

    it('should return validation error for invalid payment ID', () => {
      const result = service.markAsPending('invalid-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });

  // ==========================================================================
  // T017: Unit test for toggleStatus()
  // ==========================================================================
  describe('toggleStatus()', () => {
    const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should toggle from pending to paid', () => {
      const result = service.toggleStatus(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('paid');
      }

      const status = service.getStatus(validPaymentId);
      expect(status.ok && status.value).toBe('paid');
    });

    it('should toggle from paid to pending', () => {
      service.markAsPaid(validPaymentId);

      const result = service.toggleStatus(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('pending');
      }

      const status = service.getStatus(validPaymentId);
      expect(status.ok && status.value).toBe('pending');
    });

    it('should return new status after toggle', () => {
      let result = service.toggleStatus(validPaymentId);
      expect(result.ok && result.value).toBe('paid');

      result = service.toggleStatus(validPaymentId);
      expect(result.ok && result.value).toBe('pending');

      result = service.toggleStatus(validPaymentId);
      expect(result.ok && result.value).toBe('paid');
    });

    it('should complete with visual feedback in under 200ms (SC-003)', () => {
      const start = performance.now();
      service.toggleStatus(validPaymentId);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  // ==========================================================================
  // Additional tests for getStatus() and getStatusWithTimestamp()
  // ==========================================================================
  describe('getStatus()', () => {
    const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return pending for non-existent payment (default)', () => {
      const result = service.getStatus(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('pending');
      }
    });

    it('should return paid for marked payment', () => {
      service.markAsPaid(validPaymentId);

      const result = service.getStatus(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('paid');
      }
    });

    it('should not trigger storage events (read-only)', () => {
      const storageEventSpy = vi.fn();
      window.addEventListener('storage', storageEventSpy);

      service.getStatus(validPaymentId);

      // Read operations should not trigger storage events
      expect(storageEventSpy).not.toHaveBeenCalled();

      window.removeEventListener('storage', storageEventSpy);
    });
  });

  describe('getStatusWithTimestamp()', () => {
    const validPaymentId = '550e8400-e29b-41d4-a716-446655440000';

    it('should return null for non-existent payment', () => {
      const result = service.getStatusWithTimestamp(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should return full record with timestamp for marked payment', () => {
      service.markAsPaid(validPaymentId);

      const result = service.getStatusWithTimestamp(validPaymentId);

      expect(result.ok).toBe(true);
      if (result.ok && result.value) {
        expect(result.value.paymentId).toBe(validPaymentId);
        expect(result.value.status).toBe('paid');
        expect(result.value.timestamp).toBeTruthy();
      }
    });
  });
});
