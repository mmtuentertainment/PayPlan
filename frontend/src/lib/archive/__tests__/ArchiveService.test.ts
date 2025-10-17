/**
 * ArchiveService Unit Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Tasks: T015, T017, T019, T021, T027, T029, T031, T033, T035
 *
 * Tests for archive business logic layer.
 * Follows patterns from Feature 015 (PaymentStatusService.test.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveService } from '../ArchiveService';
import { ArchiveStorage } from '../ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';
import type { PaymentRecord } from '@/types/csvExport';
import { MAX_ARCHIVES, MAX_STORAGE_SIZE } from '../constants';

describe('ArchiveService - Create Archive MVP', () => {
  let service: ArchiveService;
  let archiveStorage: ArchiveStorage;
  let paymentStatusStorage: PaymentStatusStorage;

  beforeEach(() => {
    localStorage.clear();
    archiveStorage = new ArchiveStorage();
    paymentStatusStorage = new PaymentStatusStorage();
    service = new ArchiveService(archiveStorage, paymentStatusStorage);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('T015: createArchive() with valid name', () => {
    it('should create archive successfully with valid payments and name', () => {
      // Setup: Create test payments
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test Provider',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Another Provider',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      // Mark first payment as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });

      const result = service.createArchive('October 2025', payments);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('October 2025');
        expect(result.value.id).toBeTruthy();
        expect(result.value.payments.length).toBe(2);
        expect(result.value.metadata.totalCount).toBe(2);
        expect(result.value.metadata.paidCount).toBe(1);
        expect(result.value.metadata.pendingCount).toBe(1);
      }
    });

    it('should generate unique archive ID', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result1 = service.createArchive('Archive 1', payments);
      const result2 = service.createArchive('Archive 2', payments);

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });
  });

  describe('T017: joinPaymentsWithStatuses()', () => {
    it('should combine payment data with status records', () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Klarna',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
          risk_type: 'collision',
          risk_severity: 'high',
          risk_message: 'Multiple payments due same day',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Affirm',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      // Mark first payment as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });

      const records = service.joinPaymentsWithStatuses(payments);

      expect(records).toHaveLength(2);

      // First payment - paid with full data
      expect(records[0]).toEqual({
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
        provider: 'Klarna',
        amount: 100.00,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
        risk_type: 'collision',
        risk_severity: 'high',
        risk_message: 'Multiple payments due same day',
      });

      // Second payment - pending (no status saved)
      expect(records[1]).toEqual({
        paymentId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'pending',
        timestamp: '',
        provider: 'Affirm',
        amount: 50.00,
        currency: 'USD',
        dueISO: '2025-10-20',
        autopay: true,
        risk_type: undefined,
        risk_severity: undefined,
        risk_message: undefined,
      });
    });

    it('should default to pending when no status exists', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const records = service.joinPaymentsWithStatuses(payments);

      expect(records[0].status).toBe('pending');
      expect(records[0].timestamp).toBe('');
    });
  });

  describe('T019: calculateArchiveMetadata()', () => {
    it('should calculate counts and date range correctly', () => {
      const records = [
        {
          paymentId: '1',
          status: 'paid' as const,
          timestamp: '2025-10-14T14:30:00.000Z',
          provider: 'Test 1',
          amount: 100,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          paymentId: '2',
          status: 'pending' as const,
          timestamp: '',
          provider: 'Test 2',
          amount: 50,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
        {
          paymentId: '3',
          status: 'paid' as const,
          timestamp: '2025-10-16T10:00:00.000Z',
          provider: 'Test 3',
          amount: 75,
          currency: 'USD',
          dueISO: '2025-10-10',
          autopay: false,
        },
      ];

      const metadata = service.calculateArchiveMetadata(records);

      expect(metadata.totalCount).toBe(3);
      expect(metadata.paidCount).toBe(2);
      expect(metadata.pendingCount).toBe(1);
      expect(metadata.dateRange.earliest).toBe('2025-10-10');
      expect(metadata.dateRange.latest).toBe('2025-10-20');
      expect(metadata.storageSize).toBeGreaterThan(0);
    });

    it('should handle empty payment array', () => {
      const metadata = service.calculateArchiveMetadata([]);

      expect(metadata.totalCount).toBe(0);
      expect(metadata.paidCount).toBe(0);
      expect(metadata.pendingCount).toBe(0);
      expect(metadata.dateRange.earliest).toBeNull();
      expect(metadata.dateRange.latest).toBeNull();
    });

    it('should handle all paid payments', () => {
      const records = [
        {
          paymentId: '1',
          status: 'paid' as const,
          timestamp: '2025-10-14T14:30:00.000Z',
          provider: 'Test',
          amount: 100,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
      ];

      const metadata = service.calculateArchiveMetadata(records);

      expect(metadata.paidCount).toBe(1);
      expect(metadata.pendingCount).toBe(0);
    });

    it('should handle all pending payments', () => {
      const records = [
        {
          paymentId: '1',
          status: 'pending' as const,
          timestamp: '',
          provider: 'Test',
          amount: 100,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
      ];

      const metadata = service.calculateArchiveMetadata(records);

      expect(metadata.paidCount).toBe(0);
      expect(metadata.pendingCount).toBe(1);
    });
  });

  describe('T021: ensureUniqueName()', () => {
    it('should return name as-is when unique', () => {
      const name = service.ensureUniqueName('October 2025', ['September 2025', 'November 2025']);
      expect(name).toBe('October 2025');
    });

    it('should append (2) when name exists', () => {
      const name = service.ensureUniqueName('October 2025', ['October 2025', 'September 2025']);
      expect(name).toBe('October 2025 (2)');
    });

    it('should append (3) when name and (2) both exist', () => {
      const name = service.ensureUniqueName('October 2025', [
        'October 2025',
        'October 2025 (2)',
        'September 2025',
      ]);
      expect(name).toBe('October 2025 (3)');
    });

    it('should handle empty existing names array', () => {
      const name = service.ensureUniqueName('October 2025', []);
      expect(name).toBe('October 2025');
    });

    it('should handle sequential counter increments', () => {
      const existing = [
        'Test',
        'Test (2)',
        'Test (3)',
        'Test (4)',
        'Test (5)',
      ];
      const name = service.ensureUniqueName('Test', existing);
      expect(name).toBe('Test (6)');
    });
  });

  describe('T027: Reset statuses integration', () => {
    it('should call PaymentStatusStorage.clearAll() after successful archive', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      // Mark payment as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });

      // Verify status exists
      const beforeResult = paymentStatusStorage.getStatus(payments[0].id!);
      expect(beforeResult.ok && beforeResult.value?.status).toBe('paid');

      // Create archive (should reset statuses)
      const result = service.createArchive('Test Archive', payments);
      expect(result.ok).toBe(true);

      // Verify status was cleared
      const afterResult = paymentStatusStorage.loadStatuses();
      expect(afterResult.ok && afterResult.value.statuses.size).toBe(0);
    });
  });

  describe('T029: Empty name validation', () => {
    it('should reject empty archive name', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = service.createArchive('', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('at least');
      }
    });

    it('should reject whitespace-only archive name', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = service.createArchive('   ', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('should trim and accept name with leading/trailing spaces', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = service.createArchive('  October 2025  ', payments);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('October 2025');
      }
    });
  });

  describe('T031: No payments error', () => {
    it('should throw error when payment list is empty', () => {
      const result = service.createArchive('Test Archive', []);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('No payments');
      }
    });
  });

  describe('T033: 50-archive limit', () => {
    it('should throw error when 50 archives exist', () => {
      // Create 50 archives
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      for (let i = 0; i < MAX_ARCHIVES; i++) {
        const result = service.createArchive(`Archive ${i}`, payments);
        if (!result.ok) {
          // If we hit storage limit before 50, that's OK for this test
          break;
        }
      }

      // Try to create 51st archive
      const result = service.createArchive('Archive 51', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('LimitReached');
        expect(result.error.message).toContain('50');
      }
    });
  });

  describe('T035: 5MB storage limit', () => {
    it('should throw error when storage exceeds 5MB', () => {
      // Create large payment array to exceed storage
      const largePayments: PaymentRecord[] = [];

      // Create 500 payments with large descriptions
      for (let i = 0; i < 500; i++) {
        largePayments.push({
          id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
          provider: 'Test Provider with a very long name that takes up space '.repeat(10),
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
          risk_message: 'A very long risk message that will take up significant storage space. '.repeat(20),
        });
      }

      // Try to create multiple large archives to exceed 5MB
      let lastResult;
      for (let i = 0; i < 20; i++) {
        lastResult = service.createArchive(`Large Archive ${i}`, largePayments);
        if (!lastResult.ok && lastResult.error.type === 'QuotaExceeded') {
          break;
        }
      }

      // Should eventually hit quota
      expect(lastResult?.ok).toBe(false);
      if (lastResult && !lastResult.ok) {
        expect(lastResult.error.type).toBe('QuotaExceeded');
        expect(lastResult.error.message).toContain('5MB');
      }
    });
  });

  describe('T050: listArchives()', () => {
    it('should return empty array when no archives exist', () => {
      const result = service.listArchives();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return all archive metadata from index', () => {
      // Create two archives
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      service.createArchive('Archive 1', payments);
      service.createArchive('Archive 2', payments);

      const result = service.listArchives();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('Archive 2'); // Newest first
        expect(result.value[1].name).toBe('Archive 1');
      }
    });

    it('should include paymentCount in metadata', () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      service.createArchive('Test Archive', payments);

      const result = service.listArchives();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].paymentCount).toBe(2);
      }
    });
  });

  describe('T054: getArchiveById()', () => {
    it('should load full archive by ID', () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test Provider',
        amount: 100.00,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const createResult = service.createArchive('Test Archive', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archiveId = createResult.value.id;

        const result = service.getArchiveById(archiveId);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.id).toBe(archiveId);
          expect(result.value.name).toBe('Test Archive');
          expect(result.value.payments).toHaveLength(1);
          expect(result.value.payments[0].provider).toBe('Test Provider');
        }
      }
    });

    it('should return NotFound error for non-existent archive', () => {
      const result = service.getArchiveById('550e8400-e29b-41d4-a716-446655440000');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('NotFound');
      }
    });

    it('should return Validation error for invalid ID format', () => {
      const result = service.getArchiveById('invalid-id');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });
  });
});
