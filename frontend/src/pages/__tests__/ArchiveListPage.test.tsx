/**
 * ArchiveListPage Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 4 (User Story 2 - View Archived Payment History)
 * Task: T059
 *
 * Tests for archive list page component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ArchiveListPage } from '../ArchiveListPage';
import * as usePaymentArchivesModule from '@/hooks/usePaymentArchives';

// Mock the hook
vi.mock('@/hooks/usePaymentArchives');

describe('ArchiveListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T059: should show empty state when no archives exist', () => {
    // Mock empty archives
    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: null,
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ArchiveListPage />
      </BrowserRouter>
    );

    // Check for empty state message
    expect(screen.getByText('No archives yet')).toBeInTheDocument();
    expect(screen.getByText(/Create your first archive/i)).toBeInTheDocument();
    expect(screen.getByText('Go to Payments')).toBeInTheDocument();
  });

  it('should render archive list when archives exist', () => {
    // Mock archives
    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'October 2025',
          createdAt: '2025-10-17T14:30:00.000Z',
          paymentCount: 10,
          paidCount: 7,
          pendingCount: 3,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'September 2025',
          createdAt: '2025-09-15T14:30:00.000Z',
          paymentCount: 8,
          paidCount: 8,
          pendingCount: 0,
        },
      ],
      isLoading: false,
      error: null,
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ArchiveListPage />
      </BrowserRouter>
    );

    // Check for archive names
    expect(screen.getByText('October 2025')).toBeInTheDocument();
    expect(screen.getByText('September 2025')).toBeInTheDocument();

    // Check for counts
    expect(screen.getByText('2 archives saved')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: true,
      error: null,
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ArchiveListPage />
      </BrowserRouter>
    );

    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show error state', () => {
    vi.spyOn(usePaymentArchivesModule, 'usePaymentArchives').mockReturnValue({
      archives: [],
      isLoading: false,
      error: {
        type: 'Security',
        message: 'localStorage is disabled',
      },
      createArchive: vi.fn(),
      listArchives: vi.fn(),
      getArchiveById: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ArchiveListPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Error Loading Archives')).toBeInTheDocument();
    // Fix #1: User-friendly error message (no raw error.message exposure)
    expect(screen.getByText('Unable to load archives. Please try again later.')).toBeInTheDocument();
  });
});
