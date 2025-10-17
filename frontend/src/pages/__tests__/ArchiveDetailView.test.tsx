/**
 * ArchiveDetailView Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Task: T055
 *
 * Tests for archive detail view component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ArchiveDetailView } from '../ArchiveDetailView';
import * as usePaymentArchivesModule from '@/hooks/usePaymentArchives';
import type { Archive } from '@/lib/archive/types';

// Mock the hook
vi.mock('@/hooks/usePaymentArchives');

// Test archive data
const mockArchive: Archive = {
  id: '550e8400-e29b-41d4-a716-446655440000',
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
    {
      paymentId: '650e8400-e29b-41d4-a716-446655440001',
      status: 'pending',
      timestamp: '',
      provider: 'Affirm',
      amount: 100.00,
      currency: 'USD',
      dueISO: '2025-10-25',
      autopay: false,
    },
  ],
  metadata: {
    totalCount: 2,
    paidCount: 1,
    pendingCount: 1,
    dateRange: {
      earliest: '2025-10-20',
      latest: '2025-10-25',
    },
    storageSize: 500,
  },
};

describe('ArchiveDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T055: should show read-only payment records (no edit controls)', async () => {
    const mockGetArchiveById = vi.fn().mockReturnValue(mockArchive);

    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: null,
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: mockGetArchiveById,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/archives/550e8400-e29b-41d4-a716-446655440000']}>
        <Routes>
          <Route path="/archives/:id" element={<ArchiveDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for async loading
    await waitFor(() => {
      expect(screen.getByText('October 2025')).toBeInTheDocument();
    });

    // Check archive name and metadata
    expect(screen.getByText('October 2025')).toBeInTheDocument();
    expect(screen.getByText(/Created Oct 17, 2025/)).toBeInTheDocument();

    // Check payment records are displayed
    expect(screen.getByText('Klarna')).toBeInTheDocument();
    expect(screen.getByText('Affirm')).toBeInTheDocument();

    // Check amounts are displayed
    expect(screen.getByText('45.00 USD')).toBeInTheDocument();
    expect(screen.getByText('100.00 USD')).toBeInTheDocument();

    // T055: Verify NO edit controls exist (read-only)
    // No checkboxes
    const checkboxes = screen.queryAllByRole('checkbox');
    expect(checkboxes).toHaveLength(0);

    // No edit buttons (check for button elements, not table headers)
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

    // Should have read-only notice
    expect(screen.getByText(/This archive is read-only/i)).toBeInTheDocument();
  });

  it('should display payment status badges correctly', async () => {
    const mockGetArchiveById = vi.fn().mockReturnValue(mockArchive);

    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: null,
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: mockGetArchiveById,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/archives/550e8400-e29b-41d4-a716-446655440000']}>
        <Routes>
          <Route path="/archives/:id" element={<ArchiveDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for async loading
    await waitFor(() => {
      expect(screen.getByText('Klarna')).toBeInTheDocument();
    });

    // Check for status badges
    const statusBadges = screen.getAllByText(/paid|pending/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('should show error state when archive not found', async () => {
    const mockGetArchiveById = vi.fn().mockReturnValue(null);

    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: {
        type: 'NotFound',
        message: 'Archive not found',
      },
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: mockGetArchiveById,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/archives/550e8400-e29b-41d4-a716-446655440000']}>
        <Routes>
          <Route path="/archives/:id" element={<ArchiveDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for async loading and error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Archive')).toBeInTheDocument();
    });

    expect(screen.getByText('Error Loading Archive')).toBeInTheDocument();
    expect(screen.getByText(/Archive not found/i)).toBeInTheDocument();
  });

  it('should show corrupted error for invalid archive', async () => {
    const mockGetArchiveById = vi.fn().mockReturnValue(null);

    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: {
        type: 'Corrupted',
        message: 'This archive is corrupted and cannot be viewed',
      },
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: mockGetArchiveById,
      clearError: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/archives/550e8400-e29b-41d4-a716-446655440000']}>
        <Routes>
          <Route path="/archives/:id" element={<ArchiveDetailView />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for async loading and error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Archive')).toBeInTheDocument();
    });

    expect(screen.getByText('Error Loading Archive')).toBeInTheDocument();
    expect(screen.getByText(/corrupted/i)).toBeInTheDocument();
  });

  describe('Backward Compatibility Test', () => {
    it('should render legacy archive with sourceVersion 0.9.0', async () => {
      // Create legacy archive with older version
      const legacyArchive: Archive = {
        ...mockArchive,
        sourceVersion: '0.9.0', // Old version (current is 1.0.0)
      };

      const mockGetArchiveById = vi.fn().mockReturnValue(legacyArchive);

      vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
        archives: [],
        isLoading: false,
        error: null,
        createArchive: vi.fn(),
        listArchives: vi.fn(),
        getArchiveById: mockGetArchiveById,
        clearError: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/archives/550e8400-e29b-41d4-a716-446655440000']}>
          <Routes>
            <Route path="/archives/:id" element={<ArchiveDetailView />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for async loading
      await waitFor(() => {
        expect(screen.getByText('October 2025')).toBeInTheDocument();
      });

      // Verify legacy archive renders without error
      expect(screen.getByText('October 2025')).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

      // Verify content displays correctly
      expect(screen.getByText('Klarna')).toBeInTheDocument();
      expect(screen.getByText('Affirm')).toBeInTheDocument();

      // This validates graceful handling of older archive versions
    });
  });
});
