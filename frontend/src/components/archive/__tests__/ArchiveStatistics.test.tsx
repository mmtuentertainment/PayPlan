/**
 * ArchiveStatistics Component Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 5 (User Story 3 - View Archive Statistics)
 * Tasks: T065-T066
 *
 * Tests for statistics panel component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArchiveStatistics } from '../ArchiveStatistics';
import type { ArchiveSummary } from '@/lib/archive/types';

describe('ArchiveStatistics Component', () => {
  it('should render all statistics correctly', () => {
    const summary: ArchiveSummary = {
      totalCount: 10,
      paidCount: 6,
      pendingCount: 4,
      paidPercentage: 60.0,
      pendingPercentage: 40.0,
      dateRange: {
        earliest: '2025-10-01',
        latest: '2025-10-31',
      },
      averageAmount: 125.50,
      currency: 'USD',
    };

    render(<ArchiveStatistics summary={summary} />);

    // Check total count
    expect(screen.getByText('Total Payments')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Check paid count and percentage
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('(60.0%)')).toBeInTheDocument();

    // Check pending count and percentage
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('(40.0%)')).toBeInTheDocument();

    // Check average amount (CodeRabbit: Now uses Intl.NumberFormat with currency symbol)
    expect(screen.getByText('Average Amount')).toBeInTheDocument();
    expect(screen.getByText(/\$125\.50/)).toBeInTheDocument(); // USD format: $125.50

    // Check date range
    expect(screen.getByText(/Date Range:/)).toBeInTheDocument();
  });

  it('should show percentages with 1 decimal place', () => {
    const summary: ArchiveSummary = {
      totalCount: 3,
      paidCount: 2,
      pendingCount: 1,
      paidPercentage: 66.7,
      pendingPercentage: 33.3,
      dateRange: {
        earliest: '2025-10-15',
        latest: '2025-10-25',
      },
    };

    render(<ArchiveStatistics summary={summary} />);

    expect(screen.getByText('(66.7%)')).toBeInTheDocument();
    expect(screen.getByText('(33.3%)')).toBeInTheDocument();
  });

  it('should handle 0% paid (all pending)', () => {
    const summary: ArchiveSummary = {
      totalCount: 5,
      paidCount: 0,
      pendingCount: 5,
      paidPercentage: 0.0,
      pendingPercentage: 100.0,
      dateRange: {
        earliest: '2025-10-15',
        latest: '2025-10-25',
      },
    };

    render(<ArchiveStatistics summary={summary} />);

    expect(screen.getByText('(0.0%)')).toBeInTheDocument();
    expect(screen.getByText('(100.0%)')).toBeInTheDocument();
  });

  it('should handle 100% paid (all paid)', () => {
    const summary: ArchiveSummary = {
      totalCount: 5,
      paidCount: 5,
      pendingCount: 0,
      paidPercentage: 100.0,
      pendingPercentage: 0.0,
      dateRange: {
        earliest: '2025-10-15',
        latest: '2025-10-25',
      },
    };

    render(<ArchiveStatistics summary={summary} />);

    expect(screen.getByText('(100.0%)')).toBeInTheDocument();
    expect(screen.getByText('(0.0%)')).toBeInTheDocument();
  });

  it('should display "Multiple currencies" when average is unavailable', () => {
    const summary: ArchiveSummary = {
      totalCount: 3,
      paidCount: 2,
      pendingCount: 1,
      paidPercentage: 66.7,
      pendingPercentage: 33.3,
      dateRange: {
        earliest: '2025-10-15',
        latest: '2025-10-25',
      },
      // No averageAmount or currency
    };

    render(<ArchiveStatistics summary={summary} />);

    expect(screen.getByText('Average Amount')).toBeInTheDocument();
    expect(screen.getByText('Multiple currencies')).toBeInTheDocument();
  });

  it('should display date range correctly', () => {
    const summary: ArchiveSummary = {
      totalCount: 5,
      paidCount: 3,
      pendingCount: 2,
      paidPercentage: 60.0,
      pendingPercentage: 40.0,
      dateRange: {
        earliest: '2025-10-01',
        latest: '2025-10-31',
      },
    };

    render(<ArchiveStatistics summary={summary} />);

    expect(screen.getByText(/Date Range:/)).toBeInTheDocument();
    // formatDateRange() formats as "Oct 1-31, 2025"
    expect(screen.getByText(/Oct/)).toBeInTheDocument();
  });

  it('should handle missing date range gracefully', () => {
    const summary: ArchiveSummary = {
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      paidPercentage: 0.0,
      pendingPercentage: 0.0,
      dateRange: {
        earliest: null,
        latest: null,
      },
    };

    render(<ArchiveStatistics summary={summary} />);

    // Date range section should not be rendered when no dates
    expect(screen.queryByText(/Date Range:/)).not.toBeInTheDocument();
  });

  it('should format average amount with currency symbol using Intl.NumberFormat', () => {
    const summary: ArchiveSummary = {
      totalCount: 3,
      paidCount: 2,
      pendingCount: 1,
      paidPercentage: 66.7,
      pendingPercentage: 33.3,
      dateRange: {
        earliest: '2025-10-15',
        latest: '2025-10-25',
      },
      averageAmount: 75.0,
      currency: 'USD',
    };

    render(<ArchiveStatistics summary={summary} />);

    // CodeRabbit Fix: Now uses Intl.NumberFormat for proper currency formatting
    // USD format: $75.00 (with currency symbol, not "75.00 USD")
    expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
  });

  it('should render with proper styling classes', () => {
    const summary: ArchiveSummary = {
      totalCount: 10,
      paidCount: 6,
      pendingCount: 4,
      paidPercentage: 60.0,
      pendingPercentage: 40.0,
      dateRange: {
        earliest: '2025-10-01',
        latest: '2025-10-31',
      },
    };

    const { container } = render(<ArchiveStatistics summary={summary} />);

    // Check for card styling
    const card = container.querySelector('.bg-white.rounded-lg.shadow-sm.border');
    expect(card).toBeInTheDocument();

    // Check for grid layout
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
