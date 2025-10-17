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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ArchiveService } from '../ArchiveService';
import { ArchiveStorage } from '../ArchiveStorage';
import { PaymentStatusStorage } from '@/lib/payment-status/PaymentStatusStorage';
import type { PaymentRecord } from '@/types/csvExport';
import { MAX_ARCHIVES } from '../constants';
import { generateArchiveFilename } from '../utils';

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
    it('should create archive successfully with valid payments and name', async () => {
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

      const result = await service.createArchive('October 2025', payments);

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

    it('should generate unique archive ID', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result1 = await service.createArchive('Archive 1', payments);
      const result2 = await service.createArchive('Archive 2', payments);

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
    it('should call PaymentStatusStorage.clearAll() after successful archive', async () => {
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
      const result = await service.createArchive('Test Archive', payments);
      expect(result.ok).toBe(true);

      // Verify status was cleared
      const afterResult = paymentStatusStorage.loadStatuses();
      expect(afterResult.ok && afterResult.value.statuses.size).toBe(0);
    });
  });

  describe('T029: Empty name validation', () => {
    it('should reject empty archive name', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = await service.createArchive('', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('at least');
      }
    });

    it('should reject whitespace-only archive name', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = await service.createArchive('   ', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
      }
    });

    it('should trim and accept name with leading/trailing spaces', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const result = await service.createArchive('  October 2025  ', payments);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('October 2025');
      }
    });
  });

  describe('T031: No payments error', () => {
    it('should throw error when payment list is empty', async () => {
      const result = await service.createArchive('Test Archive', []);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('No payments');
      }
    });
  });

  describe('T033: 50-archive limit', () => {
    it('should throw error when 50 archives exist', async () => {
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
        const result = await service.createArchive(`Archive ${i}`, payments);
        if (!result.ok) {
          // If we hit storage limit before 50, that's OK for this test
          break;
        }
      }

      // Try to create 51st archive
      const result = await service.createArchive('Archive 51', payments);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('LimitReached');
        expect(result.error.message).toContain('50');
      }
    });
  });

  describe('T035: 5MB storage limit', () => {
    it('should throw error when storage exceeds 5MB', async () => {
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
        lastResult = await service.createArchive(`Large Archive ${i}`, largePayments);
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

    it('should return all archive metadata from index', async () => {
      // Create two archives
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      await service.createArchive('Archive 1', payments);
      await service.createArchive('Archive 2', payments);

      const result = service.listArchives();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('Archive 2'); // Newest first
        expect(result.value[1].name).toBe('Archive 1');
      }
    });

    it('should include paymentCount in metadata', async () => {
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

      await service.createArchive('Test Archive', payments);

      const result = service.listArchives();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0].paymentCount).toBe(2);
      }
    });
  });

  describe('T054: getArchiveById()', () => {
    it('should load full archive by ID', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test Provider',
        amount: 100.00,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      const createResult = await service.createArchive('Test Archive', payments);
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

  describe('T061-T070: calculateStatistics()', () => {
    it('T061: should calculate counts and percentages correctly', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          provider: 'Test 3',
          amount: 75.00,
          currency: 'USD',
          dueISO: '2025-10-25',
          autopay: false,
        },
      ];

      // Mark first two as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });
      paymentStatusStorage.saveStatus({
        paymentId: payments[1].id!,
        status: 'paid',
        timestamp: '2025-10-19T10:00:00.000Z',
      });

      const createResult = await service.createArchive('Stats Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const stats = service.calculateStatistics(archive);

        expect(stats.totalCount).toBe(3);
        expect(stats.paidCount).toBe(2);
        expect(stats.pendingCount).toBe(1);
        expect(stats.paidPercentage).toBe(66.7); // 2/3 = 66.7%
        expect(stats.pendingPercentage).toBe(33.3); // 1/3 = 33.3%
        expect(stats.dateRange.earliest).toBe('2025-10-15');
        expect(stats.dateRange.latest).toBe('2025-10-25');
      }
    });

    it('T067: should handle all pending (0% paid) without error', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      const createResult = await service.createArchive('All Pending', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const stats = service.calculateStatistics(archive);

        expect(stats.totalCount).toBe(2);
        expect(stats.paidCount).toBe(0);
        expect(stats.pendingCount).toBe(2);
        expect(stats.paidPercentage).toBe(0.0); // 0/2 = 0%
        expect(stats.pendingPercentage).toBe(100.0); // 2/2 = 100%
      }
    });

    it('T069: should handle all paid (100% paid) without error', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      // Mark all as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });
      paymentStatusStorage.saveStatus({
        paymentId: payments[1].id!,
        status: 'paid',
        timestamp: '2025-10-19T10:00:00.000Z',
      });

      const createResult = await service.createArchive('All Paid', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const stats = service.calculateStatistics(archive);

        expect(stats.totalCount).toBe(2);
        expect(stats.paidCount).toBe(2);
        expect(stats.pendingCount).toBe(0);
        expect(stats.paidPercentage).toBe(100.0); // 2/2 = 100%
        expect(stats.pendingPercentage).toBe(0.0); // 0/2 = 0%
      }
    });

    it('should calculate average amount for single currency', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          provider: 'Test 3',
          amount: 75.00,
          currency: 'USD',
          dueISO: '2025-10-25',
          autopay: false,
        },
      ];

      const createResult = await service.createArchive('Average Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const stats = service.calculateStatistics(archive);

        expect(stats.averageAmount).toBe(75.0); // (100 + 50 + 75) / 3 = 75
        expect(stats.currency).toBe('USD');
      }
    });

    it('should skip average for multiple currencies', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 50.00,
          currency: 'EUR',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ];

      const createResult = await service.createArchive('Multi-Currency Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const stats = service.calculateStatistics(archive);

        expect(stats.averageAmount).toBeUndefined();
        expect(stats.currency).toBeUndefined();
      }
    });

    it('should handle 0 payments edge case', async () => {
      // This is a theoretical test - in practice createArchive validates against empty payments
      // But we can test with a manually constructed archive
      const mockArchive = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Empty Archive',
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

      const stats = service.calculateStatistics(mockArchive);

      expect(stats.totalCount).toBe(0);
      expect(stats.paidPercentage).toBe(0.0);
      expect(stats.pendingPercentage).toBe(0.0);
      expect(stats.averageAmount).toBeUndefined();
      expect(stats.currency).toBeUndefined();
    });
  });

  describe('T073-T083: exportArchiveToCSV()', () => {
    it('T073: should generate CSV with 12 columns (10 payment + 2 archive)', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test Provider',
          amount: 100.50,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
          risk_type: 'collision',
          risk_severity: 'high',
          risk_message: 'Test risk',
        },
      ];

      // Mark as paid
      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });

      const createResult = await service.createArchive('Test Archive', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        // Parse CSV to check columns
        const lines = csv.split('\r\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));

        expect(headers).toHaveLength(12);
        expect(headers).toEqual([
          'provider',
          'amount',
          'currency',
          'dueISO',
          'autopay',
          'risk_type',
          'risk_severity',
          'risk_message',
          'paid_status',
          'paid_timestamp',
          'archive_name',
          'archive_date',
        ]);
      }
    });

    it('T075: should transform PaymentArchiveRecord to CSV row correctly', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Klarna',
          amount: 45.99,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: true,
          risk_type: 'collision',
          risk_severity: 'high',
          risk_message: 'Multiple payments due',
        },
      ];

      paymentStatusStorage.saveStatus({
        paymentId: payments[0].id!,
        status: 'paid',
        timestamp: '2025-10-14T14:30:00.000Z',
      });

      const createResult = await service.createArchive('October 2025', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        // Parse data row (skip header)
        const lines = csv.split('\r\n');
        const dataRow = lines[1];

        // Should contain all payment data + archive metadata
        expect(dataRow).toContain('Klarna');
        expect(dataRow).toContain('45.99');
        expect(dataRow).toContain('USD');
        expect(dataRow).toContain('2025-10-15');
        expect(dataRow).toContain('true');
        expect(dataRow).toContain('collision');
        expect(dataRow).toContain('high');
        expect(dataRow).toContain('Multiple payments due');
        expect(dataRow).toContain('paid');
        expect(dataRow).toContain('2025-10-14T14:30:00.000Z');
        expect(dataRow).toContain('October 2025');
        expect(dataRow).toContain(archive.createdAt);
      }
    });

    it('T077: should maintain correct CSV column order', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test',
          amount: 100,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
      ];

      const createResult = await service.createArchive('Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        const lines = csv.split('\r\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));

        // Verify exact column order
        expect(headers[0]).toBe('provider');
        expect(headers[1]).toBe('amount');
        expect(headers[2]).toBe('currency');
        expect(headers[3]).toBe('dueISO');
        expect(headers[4]).toBe('autopay');
        expect(headers[5]).toBe('risk_type');
        expect(headers[6]).toBe('risk_severity');
        expect(headers[7]).toBe('risk_message');
        expect(headers[8]).toBe('paid_status');
        expect(headers[9]).toBe('paid_timestamp');
        expect(headers[10]).toBe('archive_name');
        expect(headers[11]).toBe('archive_date');
      }
    });

    it('T079: should generate correct filename with slugified archive name', () => {
      // This test is for utils.ts generateArchiveFilename()
      // Already implemented in utils.ts
      const filename = generateArchiveFilename('October 2025', '2025-10-17T14:30:22.000Z');
      expect(filename).toBe('payplan-archive-october-2025-2025-10-17-143022.csv');

      // Test Unicode handling
      const unicodeFilename = generateArchiveFilename('October 2025 💰', '2025-10-17T14:30:22.000Z');
      expect(unicodeFilename).toBe('payplan-archive-october-2025-2025-10-17-143022.csv');
    });

    it('T081: should preserve Unicode characters in CSV data', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Paiements Français 💰',
          amount: 100.00,
          currency: 'EUR',
          dueISO: '2025-10-15',
          autopay: false,
          risk_message: 'Risque élevé 🔴',
        },
      ];

      const createResult = await service.createArchive('Octobre 2025 💰', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        // Unicode should be preserved in CSV content
        expect(csv).toContain('Paiements Français 💰');
        expect(csv).toContain('Risque élevé 🔴');
        expect(csv).toContain('Octobre 2025 💰');
      }
    });

    it('T083: should export 50 payments in <3 seconds', async () => {
      // Create 50 payments
      const payments: PaymentRecord[] = [];
      for (let i = 0; i < 50; i++) {
        payments.push({
          id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
          provider: `Provider ${i}`,
          amount: 100.00 + i,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: i % 2 === 0,
          risk_type: 'collision',
          risk_severity: 'high',
          risk_message: `Risk message for payment ${i}`,
        });
      }

      const createResult = await service.createArchive('Large Archive', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;

        const startTime = performance.now();
        const csv = service.exportArchiveToCSV(archive);
        const endTime = performance.now();

        const exportTime = endTime - startTime;

        // Should complete in <3 seconds (3000ms)
        expect(exportTime).toBeLessThan(3000);

        // Verify CSV has 50 data rows + 1 header
        const lines = csv.split('\r\n').filter(line => line.trim());
        expect(lines.length).toBe(51); // 1 header + 50 data rows
      }
    });

    it('should handle empty risk fields correctly', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test Provider',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
          // No risk fields
        },
      ];

      const createResult = await service.createArchive('Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        // Parse data row
        const lines = csv.split('\r\n');
        const dataRow = lines[1].split(',').map(cell => cell.replace(/"/g, ''));

        // Risk fields should be empty strings
        expect(dataRow[5]).toBe(''); // risk_type
        expect(dataRow[6]).toBe(''); // risk_severity
        expect(dataRow[7]).toBe(''); // risk_message
      }
    });

    it('should format amounts to exactly 2 decimal places', async () => {
      const payments: PaymentRecord[] = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          provider: 'Test',
          amount: 100.5, // Should become 100.50
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          provider: 'Test 2',
          amount: 45, // Should become 45.00
          currency: 'USD',
          dueISO: '2025-10-16',
          autopay: true,
        },
      ];

      const createResult = await service.createArchive('Test', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archive = createResult.value;
        const csv = service.exportArchiveToCSV(archive);

        expect(csv).toContain('100.50');
        expect(csv).toContain('45.00');
      }
    });
  });

  describe('Phase 7: deleteArchive()', () => {
    it('should delete archive by ID successfully', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      // Create archive first
      const createResult = await service.createArchive('Test Archive', payments);
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const archiveId = createResult.value.id;

        // Verify archive exists
        const loadBefore = service.getArchiveById(archiveId);
        expect(loadBefore.ok).toBe(true);

        // Delete archive
        const deleteResult = service.deleteArchive(archiveId);
        expect(deleteResult.ok).toBe(true);

        // Verify archive no longer exists
        const loadAfter = service.getArchiveById(archiveId);
        expect(loadAfter.ok).toBe(false);
        if (!loadAfter.ok) {
          expect(loadAfter.error.type).toBe('NotFound');
        }
      }
    });

    it('should return Validation error for invalid UUID', () => {
      const result = service.deleteArchive('invalid-uuid');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('Validation');
        expect(result.error.message).toContain('Invalid');
      }
    });

    it('should handle NotFound gracefully (idempotent)', () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // Delete non-existent archive (should succeed - idempotent)
      const result = service.deleteArchive(nonExistentId);

      expect(result.ok).toBe(true);
    });

    it('should update archive list after deletion', async () => {
      const payments: PaymentRecord[] = [{
        id: '550e8400-e29b-41d4-a716-446655440000',
        provider: 'Test',
        amount: 100,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: false,
      }];

      // Create two archives
      await service.createArchive('Archive 1', payments);
      const createResult2 = await service.createArchive('Archive 2', payments);

      expect(createResult2.ok).toBe(true);

      // Verify two archives exist
      const listBefore = service.listArchives();
      expect(listBefore.ok && listBefore.value.length).toBe(2);

      // Delete one archive
      if (createResult2.ok) {
        service.deleteArchive(createResult2.value.id);

        // Verify only one archive remains
        const listAfter = service.listArchives();
        expect(listAfter.ok && listAfter.value.length).toBe(1);
      }
    });
  });
});
