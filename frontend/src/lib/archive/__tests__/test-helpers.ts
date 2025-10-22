/**
 * Test Helper Factories for Archive Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting) - Phase F
 *
 * Reduces test duplication by providing reusable mock factories.
 */

import { vi } from 'vitest';
import type { Archive, ArchiveIndexEntry, ArchiveSummary } from '../types';
import type { PaymentRecord } from '@/types/csvExport';

/**
 * Create mock usePaymentArchives hook return value
 *
 * @param overrides - Partial overrides for hook return value
 * @returns Mock hook return value with sensible defaults
 *
 * @example
 * ```typescript
 * const mockHook = createMockUsePaymentArchives({
 *   archives: [mockArchiveEntry],
 *   isLoading: false,
 * });
 * vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue(mockHook);
 * ```
 */
export function createMockUsePaymentArchives(overrides?: {
  archives?: ArchiveIndexEntry[];
  isLoading?: boolean;
  error?: { type: string; message: string } | null;
  createArchive?: ReturnType<typeof vi.fn>;
  listArchives?: ReturnType<typeof vi.fn>;
  getArchiveById?: ReturnType<typeof vi.fn>;
  deleteArchive?: ReturnType<typeof vi.fn>;
  clearError?: ReturnType<typeof vi.fn>;
}) {
  return {
    archives: overrides?.archives ?? [],
    isLoading: overrides?.isLoading ?? false,
    error: overrides?.error ?? null,
    createArchive: overrides?.createArchive ?? vi.fn(),
    listArchives: overrides?.listArchives ?? vi.fn(),
    getArchiveById: overrides?.getArchiveById ?? vi.fn(),
    deleteArchive: overrides?.deleteArchive ?? vi.fn(),
    clearError: overrides?.clearError ?? vi.fn(),
  };
}

/**
 * Create mock archive index entry
 *
 * @param overrides - Partial overrides for entry
 * @returns Mock archive index entry with sensible defaults
 */
export function createMockArchiveIndexEntry(overrides?: Partial<ArchiveIndexEntry>): ArchiveIndexEntry {
  return {
    id: overrides?.id ?? '550e8400-e29b-41d4-a716-446655440000',
    name: overrides?.name ?? 'Test Archive',
    createdAt: overrides?.createdAt ?? '2025-10-17T14:30:00.000Z',
    paymentCount: overrides?.paymentCount ?? 10,
    paidCount: overrides?.paidCount ?? 7,
    pendingCount: overrides?.pendingCount ?? 3,
  };
}

/**
 * Create mock payment record
 *
 * @param overrides - Partial overrides for payment
 * @returns Mock payment record with valid defaults
 */
export function createMockPayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: overrides?.id ?? '550e8400-e29b-41d4-a716-446655440001',
    provider: overrides?.provider ?? 'Test Provider',
    amount: overrides?.amount ?? 100.00,
    currency: overrides?.currency ?? 'USD',
    dueISO: overrides?.dueISO ?? '2025-10-15',
    autopay: overrides?.autopay ?? false,
    ...overrides,
  };
}

/**
 * Create mock archive summary
 *
 * @param overrides - Partial overrides for summary
 * @returns Mock archive summary with valid defaults
 */
export function createMockArchiveSummary(overrides?: Partial<ArchiveSummary>): ArchiveSummary {
  const totalCount = overrides?.totalCount ?? 10;
  const paidCount = overrides?.paidCount ?? 7;
  const pendingCount = overrides?.pendingCount ?? 3;

  return {
    totalCount,
    paidCount,
    pendingCount,
    paidPercentage: overrides?.paidPercentage ?? (paidCount / totalCount) * 100,
    pendingPercentage: overrides?.pendingPercentage ?? (pendingCount / totalCount) * 100,
    dateRange: overrides?.dateRange ?? {
      earliest: '2025-10-01',
      latest: '2025-10-31',
    },
    averageAmount: overrides?.averageAmount,
    currency: overrides?.currency,
  };
}

/**
 * Create mock full archive
 *
 * @param overrides - Partial overrides for archive
 * @returns Mock archive with valid defaults
 */
export function createMockArchive(overrides?: Partial<Archive>): Archive {
  const payments = overrides?.payments ?? [
    {
      paymentId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'paid' as const,
      timestamp: '2025-10-16T10:00:00.000Z',
      provider: 'Test Provider',
      amount: 100.00,
      currency: 'USD',
      dueISO: '2025-10-15',
      autopay: false,
    },
  ];

  return {
    id: overrides?.id ?? '550e8400-e29b-41d4-a716-446655440000',
    name: overrides?.name ?? 'Test Archive',
    createdAt: overrides?.createdAt ?? '2025-10-17T14:30:00.000Z',
    payments,
    metadata: overrides?.metadata ?? {
      totalCount: payments.length,
      paidCount: payments.filter(p => p.status === 'paid').length,
      pendingCount: payments.filter(p => p.status === 'pending').length,
      paidPercentage: 70,
      pendingPercentage: 30,
      dateRange: {
        earliest: '2025-10-01',
        latest: '2025-10-31',
      },
      averageAmount: 100.00,
      currency: 'USD',
      sizeBytes: 1024,
      sourceVersion: '1.0.0',
    },
  };
}
