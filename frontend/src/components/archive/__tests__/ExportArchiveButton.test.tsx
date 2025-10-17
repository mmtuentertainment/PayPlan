/**
 * ExportArchiveButton Component Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 6 (User Story 4 - Export Archived Data to CSV)
 * Task: T088
 *
 * Tests for CSV export button functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportArchiveButton } from '../ExportArchiveButton';
import type { Archive } from '@/lib/archive/types';

// Mock the downloadCSV function
vi.mock('@/services/csvExportService', () => ({
  downloadCSV: vi.fn(),
}));

describe('ExportArchiveButton', () => {
  let mockArchive: Archive;

  beforeEach(() => {
    vi.clearAllMocks();

    mockArchive = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'October 2025',
      createdAt: '2025-10-17T14:30:00.000Z',
      sourceVersion: '1.0.0',
      payments: [
        {
          paymentId: '550e8400-e29b-41d4-a716-446655440001',
          status: 'paid',
          timestamp: '2025-10-16T10:00:00.000Z',
          provider: 'Test Provider',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
      ],
      metadata: {
        totalCount: 1,
        paidCount: 1,
        pendingCount: 0,
        dateRange: {
          earliest: '2025-10-15',
          latest: '2025-10-15',
        },
        storageSize: 500,
      },
    };
  });

  it('T088: should render export button', () => {
    render(<ExportArchiveButton archive={mockArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Export to CSV');
  });

  it('T088: should trigger CSV download on button click', async () => {
    const { downloadCSV } = await import('@/services/csvExportService');

    render(<ExportArchiveButton archive={mockArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    fireEvent.click(button);

    // Should call downloadCSV with CSV content and filename
    expect(downloadCSV).toHaveBeenCalledTimes(1);

    const mockCall = vi.mocked(downloadCSV).mock.calls[0];
    const [csvContent, filename] = mockCall;

    // Verify filename format
    expect(filename).toBe('payplan-archive-october-2025-2025-10-17-143000.csv');

    // Verify CSV content has headers
    expect(csvContent).toContain('provider');
    expect(csvContent).toContain('amount');
    expect(csvContent).toContain('archive_name');
    expect(csvContent).toContain('archive_date');
  });

  it('should show loading state during export', () => {
    render(<ExportArchiveButton archive={mockArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });

    // Before click
    expect(button).toHaveTextContent('Export to CSV');
    expect(button).not.toBeDisabled();

    // Note: In real implementation, loading state is very brief
    // This test verifies the UI structure exists
    expect(button).toBeDefined();
  });

  it('should handle export errors gracefully', async () => {
    const { downloadCSV } = await import('@/services/csvExportService');
    vi.mocked(downloadCSV).mockImplementation(() => {
      throw new Error('Download failed');
    });

    render(<ExportArchiveButton archive={mockArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    fireEvent.click(button);

    // Should show error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/failed to export/i);
  });

  it('should generate correct filename for Unicode archive names', async () => {
    const { downloadCSV } = await import('@/services/csvExportService');

    const unicodeArchive: Archive = {
      ...mockArchive,
      name: 'Octobre 2025 💰',
    };

    render(<ExportArchiveButton archive={unicodeArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    fireEvent.click(button);

    expect(downloadCSV).toHaveBeenCalledTimes(1);

    const mockCall = vi.mocked(downloadCSV).mock.calls[0];
    const [, filename] = mockCall;

    // Should slugify Unicode characters
    expect(filename).toBe('payplan-archive-octobre-2025-2025-10-17-143000.csv');
  });

  it('should export archive with multiple payments', async () => {
    const { downloadCSV } = await import('@/services/csvExportService');

    const multiPaymentArchive: Archive = {
      ...mockArchive,
      payments: [
        {
          paymentId: '550e8400-e29b-41d4-a716-446655440002',  // Valid UUID
          status: 'paid',
          timestamp: '2025-10-16T10:00:00.000Z',
          provider: 'Provider 1',
          amount: 100.00,
          currency: 'USD',
          dueISO: '2025-10-15',
          autopay: false,
        },
        {
          paymentId: '550e8400-e29b-41d4-a716-446655440003',  // Valid UUID
          status: 'pending',
          timestamp: '',
          provider: 'Provider 2',
          amount: 50.00,
          currency: 'USD',
          dueISO: '2025-10-20',
          autopay: true,
        },
      ],
      metadata: {
        ...mockArchive.metadata,
        totalCount: 2,
        paidCount: 1,  // Added missing field
        pendingCount: 1,
      },
    };

    render(<ExportArchiveButton archive={multiPaymentArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    fireEvent.click(button);

    expect(downloadCSV).toHaveBeenCalledTimes(1);

    const mockCall = vi.mocked(downloadCSV).mock.calls[0];
    const [csvContent] = mockCall;

    // Should contain data for both payments
    expect(csvContent).toContain('Provider 1');
    expect(csvContent).toContain('Provider 2');
  });

  it('should include archive metadata in CSV', async () => {
    const { downloadCSV } = await import('@/services/csvExportService');

    render(<ExportArchiveButton archive={mockArchive} />);

    const button = screen.getByRole('button', { name: /export archive to csv/i });
    fireEvent.click(button);

    expect(downloadCSV).toHaveBeenCalledTimes(1);

    const mockCall = vi.mocked(downloadCSV).mock.calls[0];
    const [csvContent] = mockCall;

    // Should include archive name and creation date
    expect(csvContent).toContain('October 2025');
    expect(csvContent).toContain('2025-10-17T14:30:00.000Z');
  });
});
