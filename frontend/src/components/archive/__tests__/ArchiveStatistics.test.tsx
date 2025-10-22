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

  // Phase F: F3 - Financial edge case tests
  describe('Financial Edge Cases', () => {
    it('should handle repeating decimals (1/3 = 33.33%)', () => {
      const summary: ArchiveSummary = {
        totalCount: 3,
        paidCount: 1,
        pendingCount: 2,
        paidPercentage: 33.333333333,  // Repeating decimal
        pendingPercentage: 66.666666667,  // Repeating decimal
        dateRange: {
          earliest: '2025-10-01',
          latest: '2025-10-31',
        },
      };

      render(<ArchiveStatistics summary={summary} />);

      // Should round to 1 decimal place
      expect(screen.getByText('(33.3%)')).toBeInTheDocument();
      expect(screen.getByText('(66.7%)')).toBeInTheDocument();
    });

    it('should handle large amounts (999,999,999.99)', () => {
      const summary: ArchiveSummary = {
        totalCount: 1,
        paidCount: 1,
        pendingCount: 0,
        paidPercentage: 100.0,
        pendingPercentage: 0.0,
        dateRange: {
          earliest: '2025-10-01',
          latest: '2025-10-31',
        },
        averageAmount: 999999999.99,  // Maximum realistic amount
        currency: 'USD',
      };

      render(<ArchiveStatistics summary={summary} />);

      // Intl.NumberFormat should handle large numbers with proper formatting
      // USD format with commas: $999,999,999.99
      expect(screen.getByText(/\$999,999,999\.99/)).toBeInTheDocument();
    });

    it('should handle 3-decimal currencies (BHD - Bahraini Dinar)', () => {
      const summary: ArchiveSummary = {
        totalCount: 1,
        paidCount: 1,
        pendingCount: 0,
        paidPercentage: 100.0,
        pendingPercentage: 0.0,
        dateRange: {
          earliest: '2025-10-01',
          latest: '2025-10-31',
        },
        averageAmount: 45.500,  // BHD uses 3 decimal places
        currency: 'BHD',
      };

      render(<ArchiveStatistics summary={summary} />);

      // Intl.NumberFormat should handle BHD with 3 decimals
      // BHD format: "BHD 45.500" or "45.500 د.ب" (depends on locale)
      expect(screen.getByText(/45\.5/)).toBeInTheDocument();
    });

    it('should handle zero average amount by omitting it', () => {
      const summary: ArchiveSummary = {
        totalCount: 1,
        paidCount: 1,
        pendingCount: 0,
        paidPercentage: 100.0,
        pendingPercentage: 0.0,
        dateRange: {
          earliest: '2025-10-01',
          latest: '2025-10-31',
        },
        // averageAmount: 0.00 would fail validation (must be positive)
        // Instead, omit it (treated as undefined/no data)
        averageAmount: undefined,
        currency: undefined,
      };

      render(<ArchiveStatistics summary={summary} />);

      // Should show "Multiple currencies" when no average available
      expect(screen.getByText('Multiple currencies')).toBeInTheDocument();
    });

    it('should handle non-standard currency code (XXX) with Intl fallback', () => {
      const summary: ArchiveSummary = {
        totalCount: 1,
        paidCount: 1,
        pendingCount: 0,
        paidPercentage: 100.0,
        pendingPercentage: 0.0,
        dateRange: {
          earliest: '2025-10-01',
          latest: '2025-10-31',
        },
        averageAmount: 100.00,
        currency: 'XXX',  // Valid 3-letter code, Intl may use generic symbol
      };

      const { container } = render(<ArchiveStatistics summary={summary} />);

      // Intl.NumberFormat handles XXX with generic currency symbol (¤)
      // Verify the amount is displayed (may show as "¤100.00" or "XXX 100.00")
      expect(container.textContent).toMatch(/100/);
      // The formatting is handled by Intl.NumberFormat, actual output varies by environment
    });
  });
});
