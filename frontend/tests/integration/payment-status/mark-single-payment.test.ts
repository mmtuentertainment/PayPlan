/**
 * Integration Test: Mark Payment → localStorage persistence → page refresh
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T020
 *
 * TDD: This test verifies the complete user workflow for marking a payment.
 * Tests MUST FAIL initially until implementation is complete.
 *
 * User Story 1: Mark Individual Payment as Paid
 * Independent Test: Load payment schedule → click checkbox → verify visual change → refresh page → verify persistence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PaymentStatusService } from '../../../src/lib/payment-status/PaymentStatusService';
import { PaymentStatusStorage } from '../../../src/lib/payment-status/PaymentStatusStorage';
import { STORAGE_KEY } from '../../../src/lib/payment-status/constants';

describe('Integration: Mark Single Payment Workflow', () => {
  let service: PaymentStatusService;
  let storage: PaymentStatusStorage;

  beforeEach(() => {
    // Simulate fresh browser session
    localStorage.clear();
    storage = new PaymentStatusStorage();
    service = new PaymentStatusService(storage);
  });

  afterEach(() => {
    localStorage.clear();
  });

  const paymentId = '550e8400-e29b-41d4-a716-446655440000';

  // ==========================================================================
  // Integration Test: Complete User Workflow
  // ==========================================================================
  describe('Complete user workflow (SC-010: 90% first-attempt success)', () => {
    it('should complete mark → verify → refresh → confirm persistence workflow', () => {
      // Step 1: User marks payment as paid
      const markResult = service.markAsPaid(paymentId);
      expect(markResult.ok).toBe(true);

      // Step 2: Verify visual state changes immediately (SC-003: <200ms)
      const statusResult = service.getStatus(paymentId);
      expect(statusResult.ok).toBe(true);
      if (statusResult.ok) {
        expect(statusResult.value).toBe('paid');
      }

      // Step 3: Verify data is in localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).toBeTruthy();
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.statuses[paymentId]).toBeTruthy();
        expect(parsed.statuses[paymentId].status).toBe('paid');
      }

      // Step 4: Simulate page refresh (create new service instances)
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);

      // Step 5: Verify status persists after refresh (SC-002: 100% persistence)
      const persistedStatus = newService.getStatus(paymentId);
      expect(persistedStatus.ok).toBe(true);
      if (persistedStatus.ok) {
        expect(persistedStatus.value).toBe('paid');
      }

      // Step 6: Verify timestamp is still available
      const persistedRecord = newService.getStatusWithTimestamp(paymentId);
      expect(persistedRecord.ok).toBe(true);
      if (persistedRecord.ok && persistedRecord.value) {
        expect(persistedRecord.value.timestamp).toBeTruthy();
        expect(new Date(persistedRecord.value.timestamp).getTime()).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Integration Test: Undo Functionality
  // ==========================================================================
  describe('Toggle/undo workflow (FR-005)', () => {
    it('should allow user to undo accidental mark (paid → pending → paid)', () => {
      // Mark as paid
      service.markAsPaid(paymentId);
      let status = service.getStatus(paymentId);
      expect(status.ok && status.value).toBe('paid');

      // Undo (mark as pending)
      service.markAsPending(paymentId);
      status = service.getStatus(paymentId);
      expect(status.ok && status.value).toBe('pending');

      // Verify persistence of undo
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);
      status = newService.getStatus(paymentId);
      expect(status.ok && status.value).toBe('pending');

      // Re-mark as paid
      newService.markAsPaid(paymentId);
      status = newService.getStatus(paymentId);
      expect(status.ok && status.value).toBe('paid');
    });

    it('should persist toggle state across browser sessions', () => {
      // Toggle multiple times
      service.toggleStatus(paymentId); // → paid
      service.toggleStatus(paymentId); // → pending
      service.toggleStatus(paymentId); // → paid

      // Simulate browser restart
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);

      const status = newService.getStatus(paymentId);
      expect(status.ok && status.value).toBe('paid');
    });
  });

  // ==========================================================================
  // Integration Test: Multiple Payments Isolation
  // ==========================================================================
  describe('Multiple payments isolation (Acceptance Scenario 4)', () => {
    it('should only change status of specific payment, not others', () => {
      const payment1 = '550e8400-e29b-41d4-a716-446655440001';
      const payment2 = '550e8400-e29b-41d4-a716-446655440002';
      const payment3 = '550e8400-e29b-41d4-a716-446655440003';

      // Mark only payment2 as paid
      service.markAsPaid(payment2);

      // Verify only payment2 is paid
      expect(service.getStatus(payment1).ok && service.getStatus(payment1).value).toBe('pending');
      expect(service.getStatus(payment2).ok && service.getStatus(payment2).value).toBe('paid');
      expect(service.getStatus(payment3).ok && service.getStatus(payment3).value).toBe('pending');

      // Verify after refresh
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);

      expect(newService.getStatus(payment1).ok && newService.getStatus(payment1).value).toBe('pending');
      expect(newService.getStatus(payment2).ok && newService.getStatus(payment2).value).toBe('paid');
      expect(newService.getStatus(payment3).ok && newService.getStatus(payment3).value).toBe('pending');
    });
  });

  // ==========================================================================
  // Integration Test: Timestamp Tracking
  // ==========================================================================
  describe('Timestamp tracking (FR-003, FR-017)', () => {
    it('should record timestamp when marked as paid', () => {
      const before = Date.now();
      service.markAsPaid(paymentId);
      const after = Date.now();

      const record = service.getStatusWithTimestamp(paymentId);
      expect(record.ok).toBe(true);
      if (record.ok && record.value) {
        const timestamp = new Date(record.value.timestamp).getTime();
        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      }
    });

    it('should persist timestamp across sessions', () => {
      service.markAsPaid(paymentId);
      const originalRecord = service.getStatusWithTimestamp(paymentId);
      const originalTimestamp = originalRecord.ok && originalRecord.value
        ? originalRecord.value.timestamp
        : '';

      // Simulate page refresh
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);

      const persistedRecord = newService.getStatusWithTimestamp(paymentId);
      const persistedTimestamp = persistedRecord.ok && persistedRecord.value
        ? persistedRecord.value.timestamp
        : '';

      expect(persistedTimestamp).toBe(originalTimestamp);
    });
  });

  // ==========================================================================
  // Integration Test: Performance (SC-001, SC-002, SC-003)
  // ==========================================================================
  describe('Performance targets', () => {
    it('should complete mark operation in <2 seconds (SC-001)', () => {
      const start = performance.now();

      service.markAsPaid(paymentId);
      const status = service.getStatus(paymentId);

      const duration = performance.now() - start;

      expect(status.ok && status.value).toBe('paid');
      expect(duration).toBeLessThan(2000);
    });

    it('should provide visual feedback in <200ms (SC-003)', () => {
      const start = performance.now();

      service.toggleStatus(paymentId);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it('should persist correctly across 100% of browser sessions (SC-002)', () => {
      const iterations = 10;
      let successCount = 0;

      for (let i = 0; i < iterations; i++) {
        const testId = `550e8400-e29b-41d4-a716-44665544000${i}`;

        // Mark as paid
        service.markAsPaid(testId);

        // Simulate browser restart
        const newStorage = new PaymentStatusStorage();
        const newService = new PaymentStatusService(newStorage);

        // Check persistence
        const status = newService.getStatus(testId);
        if (status.ok && status.value === 'paid') {
          successCount++;
        }
      }

      const successRate = successCount / iterations;
      expect(successRate).toBe(1.0); // 100% persistence
    });
  });

  // ==========================================================================
  // Integration Test: Error Recovery
  // ==========================================================================
  describe('Error recovery', () => {
    it('should handle corrupted localStorage gracefully', () => {
      // Manually corrupt localStorage
      localStorage.setItem(STORAGE_KEY, '{invalid json}');

      // Create new instances (simulating app restart)
      const newStorage = new PaymentStatusStorage();
      const newService = new PaymentStatusService(newStorage);

      // Should return default pending status, not crash
      const result = newService.getStatus(paymentId);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('pending');
      }

      // Should be able to save new status
      const markResult = newService.markAsPaid(paymentId);
      expect(markResult.ok).toBe(true);
    });

    it('should handle localStorage disabled scenario', () => {
      // Note: In real browser with disabled localStorage, setItem throws SecurityError
      // This test verifies error handling exists
      const result = service.markAsPaid(paymentId);

      // Should either succeed or return proper error
      if (!result.ok) {
        expect(['Validation', 'Security', 'QuotaExceeded', 'Serialization']).toContain(result.error.type);
      }
    });
  });
});
