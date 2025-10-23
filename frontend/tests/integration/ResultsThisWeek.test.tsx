import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsThisWeek from '@/components/ResultsThisWeek';
import type { PaymentRecord } from '@/types/csvExport';
import { paymentRecordSchema } from '@/types/csvExport';
import * as csvExportService from '@/services/csvExportService';
import { BrowserRouter } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

describe('ResultsThisWeek - CSV Export', () => {
  const mockPayments: PaymentRecord[] = [
    {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true,
      risk_type: 'COLLISION',
      risk_severity: 'HIGH',
      risk_message: 'Multiple payments'
    },
    {
      provider: 'Affirm',
      amount: 32.50,
      currency: 'USD',
      dueISO: '2025-10-21',
      autopay: false
    }
  ];

  it('should render CSV button when payments exist', () => {
    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    expect(csvButton).toBeInTheDocument();
    expect(csvButton).not.toBeDisabled();
  });

  it('should disable CSV button when no payments', () => {
    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={[]}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    expect(csvButton).toBeDisabled();
  });

  it('should disable CSV button when normalizedPayments prop is undefined', () => {
    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    expect(csvButton).toBeDisabled();
  });

  it('should trigger download when CSV button is clicked', async () => {
    const user = userEvent.setup();

    // Mock the export and download functions
    const mockExportData = {
      rows: [],
      metadata: {
        filename: 'payplan-export-2025-10-14-143052.csv',
        timestamp: '2025-10-14T14:30:52.000Z',
        recordCount: 2,
        shouldWarn: false,
        generatedAt: new Date()
      },
      csvContent: '"provider","amount"\r\n"Klarna","45.00"'
    };

    const exportSpy = vi.spyOn(csvExportService, 'exportPaymentsToCSV').mockReturnValue(mockExportData);
    const downloadSpy = vi.spyOn(csvExportService, 'downloadCSV').mockImplementation(() => {});

    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    await user.click(csvButton);

    expect(exportSpy).toHaveBeenCalledWith(mockPayments);
    expect(downloadSpy).toHaveBeenCalledWith(mockExportData.csvContent, mockExportData.metadata.filename);

    exportSpy.mockRestore();
    downloadSpy.mockRestore();
  });

  it('should be accessible via keyboard (Tab + Enter)', async () => {
    const user = userEvent.setup();

    const downloadSpy = vi.spyOn(csvExportService, 'downloadCSV').mockImplementation(() => {});
    const exportSpy = vi.spyOn(csvExportService, 'exportPaymentsToCSV').mockReturnValue({
      rows: [],
      metadata: {
        filename: 'test.csv',
        timestamp: '2025-10-14T14:30:52.000Z',
        recordCount: 2,
        shouldWarn: false,
        generatedAt: new Date()
      },
      csvContent: 'test'
    });

    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });

    // Tab to button and press Enter
    csvButton.focus();
    expect(csvButton).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(exportSpy).toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();

    exportSpy.mockRestore();
    downloadSpy.mockRestore();
  });

  it('should be accessible via keyboard (Tab + Space)', async () => {
    const user = userEvent.setup();

    const downloadSpy = vi.spyOn(csvExportService, 'downloadCSV').mockImplementation(() => {});
    const exportSpy = vi.spyOn(csvExportService, 'exportPaymentsToCSV').mockReturnValue({
      rows: [],
      metadata: {
        filename: 'test.csv',
        timestamp: '2025-10-14T14:30:52.000Z',
        recordCount: 2,
        shouldWarn: false,
        generatedAt: new Date()
      },
      csvContent: 'test'
    });

    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    csvButton.focus();

    await user.keyboard(' '); // Space key

    expect(exportSpy).toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalled();

    exportSpy.mockRestore();
    downloadSpy.mockRestore();
  });

  it('should handle export errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock export to throw error
    vi.spyOn(csvExportService, 'exportPaymentsToCSV').mockImplementation(() => {
      throw new Error('Export failed');
    });

    render(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const csvButton = screen.getByRole('button', { name: /download csv/i });
    await user.click(csvButton);

    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith('CSV export failed:', expect.any(Error));

    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

/**
 * T026: User Story 2 - Create Archive from Results
 * Tests for "Create Archive" button visibility and dialog interaction
 */
describe('ResultsThisWeek - Create Archive (User Story 2)', () => {
  // Generate proper UUID v4 IDs for test payments
  const payment1Id = uuidv4();
  const payment2Id = uuidv4();

  const mockPayments: PaymentRecord[] = [
    {
      id: payment1Id,
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true,
      paid_status: 'pending'
    },
    {
      id: payment2Id,
      provider: 'Affirm',
      amount: 32.50,
      currency: 'USD',
      dueISO: '2025-10-21',
      autopay: false,
      paid_status: 'paid'
    }
  ];

  // Spies for localStorage operations
  let getItemSpy: ReturnType<typeof vi.spyOn>;
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  // Wrap component in BrowserRouter for navigation context
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Set up spies on localStorage
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Pre-populate localStorage with test payment status data (using proper UUIDs)
    const paymentStatusKey = 'payment_status_storage_v1';
    const statusData = {
      [payment1Id]: 'pending',
      [payment2Id]: 'paid'
    };
    localStorage.setItem(paymentStatusKey, JSON.stringify(statusData));
  });

  afterEach(() => {
    localStorage.clear();
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('should render "Create Archive" button when payments exist', () => {
    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /create archive/i });
    expect(archiveButton).toBeInTheDocument();
    expect(archiveButton).not.toBeDisabled();
  });

  it('should disable "Create Archive" button when no payments', () => {
    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={[]}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /create archive/i });
    expect(archiveButton).toBeDisabled();
  });

  it('should open CreateArchiveDialog when button is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });
    await user.click(archiveButton);

    // Dialog should be visible - check for archive name input field
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/enter a name for this payment archive/i);
      expect(nameInput).toBeInTheDocument();
    });
  });

  it('should close dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    // Open dialog
    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });
    await user.click(archiveButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/enter a name for this payment archive/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel archive creation/i });
    await user.click(cancelButton);

    // Dialog should be closed - input should not be in document
    await waitFor(() => {
      expect(screen.queryByLabelText(/enter a name for this payment archive/i)).not.toBeInTheDocument();
    });
  });

  it('should allow entering archive name in dialog', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    // Open dialog
    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });
    await user.click(archiveButton);

    // Wait for dialog to open and find input
    const nameInput = await screen.findByLabelText(/enter a name for this payment archive/i, {}, { timeout: 2000 });
    expect(nameInput).toBeInTheDocument();

    // Enter archive name
    await user.type(nameInput, 'October 2025');

    // Verify input has the value
    await waitFor(() => {
      expect(nameInput).toHaveValue('October 2025');
    });
  });

  it('should display payment summary in archive dialog', async () => {
    const user = userEvent.setup();

    // Compute expected values dynamically from mockPayments
    const totalPayments = mockPayments.length;
    const paidCount = mockPayments.filter(p => p.paid_status === 'paid').length;
    const pendingCount = totalPayments - paidCount;

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    // Verify initial payment statuses are visible
    expect(screen.getByText('Klarna')).toBeInTheDocument();
    expect(screen.getByText('Affirm')).toBeInTheDocument();

    // Open dialog
    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });
    await user.click(archiveButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByLabelText(/enter a name for this payment archive/i)).toBeInTheDocument();
    });

    // Verify dialog shows tracking summary with dynamic assertions
    expect(screen.getByText(new RegExp(`${totalPayments} total payments`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${paidCount} marked as paid`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${pendingCount} pending`, 'i'))).toBeInTheDocument();

    // Verify payments are still visible in background (snapshot behavior)
    expect(screen.getByText('Klarna')).toBeInTheDocument();
    expect(screen.getByText('Affirm')).toBeInTheDocument();
  });

  it('should be accessible via keyboard (Tab + Enter)', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });

    // Focus button and press Enter
    archiveButton.focus();
    expect(archiveButton).toHaveFocus();

    await user.keyboard('{Enter}');

    // Dialog should open - verify by checking for input field
    await waitFor(() => {
      expect(screen.getByLabelText(/enter a name for this payment archive/i)).toBeInTheDocument();
    });
  });

  it('should meet 44x44px touch target requirement (WCAG 2.1 AA)', () => {
    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /create archive from current payment results/i });

    // In jsdom, getBoundingClientRect returns 0, so we check the CSS classes
    // that enforce minimum dimensions. The min-h-[44px] and min-w-[44px] classes
    // are applied inline and ensure WCAG 2.1 AA compliance in real browsers.
    const classNames = archiveButton.className;

    // Verify the Tailwind classes that enforce 44px minimum dimensions
    expect(classNames).toContain('min-h-[44px]');
    expect(classNames).toContain('min-w-[44px]');

    // Additionally verify the inline styles if applied via DOM
    const styles = window.getComputedStyle(archiveButton);
    const minHeight = styles.minHeight;
    const minWidth = styles.minWidth;

    // If computed styles are available (some jsdom versions support this), verify them
    if (minHeight && minHeight !== 'auto' && minHeight !== '0px') {
      const heightPx = parseInt(minHeight, 10);
      expect(heightPx).toBeGreaterThanOrEqual(44);
    }

    if (minWidth && minWidth !== 'auto' && minWidth !== '0px') {
      const widthPx = parseInt(minWidth, 10);
      expect(widthPx).toBeGreaterThanOrEqual(44);
    }
  });

  /**
   * CRITICAL SECURITY TEST: Verify no sensitive payment data in localStorage
   * CodeRabbit recommendation: Ensure payment amounts, providers not stored in payment_status keys
   */
  it('should not store raw payment amounts or provider names in payment status storage', async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <ResultsThisWeek
        actions={['Action 1']}
        icsBase64={null}
        onCopy={() => {}}
        normalizedPayments={mockPayments}
      />
    );

    // Interact with payment checkboxes to trigger status storage
    const firstCheckbox = screen.getAllByLabelText(/mark payment as paid/i)[0];
    await user.click(firstCheckbox);

    // Get payment status storage
    const paymentStatusKey = 'payment_status_storage_v1';
    const statusStorage = localStorage.getItem(paymentStatusKey);

    expect(statusStorage).toBeTruthy();

    // Parse and verify ONLY IDs and statuses are stored, not sensitive data
    const parsed = JSON.parse(statusStorage!);

    // Verify the storage contains payment IDs (UUIDs)
    const storedKeys = Object.keys(parsed.statuses || parsed);
    expect(storedKeys.length).toBeGreaterThan(0);

    // CRITICAL: Verify sensitive data is NOT in storage
    expect(statusStorage).not.toContain('Klarna');
    expect(statusStorage).not.toContain('Affirm');
    expect(statusStorage).not.toContain('45.00');
    expect(statusStorage).not.toContain('32.50');
    expect(statusStorage).not.toContain('2025-10-14');
    expect(statusStorage).not.toContain('2025-10-21');

    // Verify only allowed data: payment IDs (UUIDs) and status values
    expect(statusStorage).toMatch(/pending|paid/); // Status values are OK
  });

  /**
   * NOTE: Full end-to-end archive creation with localStorage verification
   * would require extensive mocking of ArchiveService, ArchiveStorage, and
   * PaymentStatusStorage. The critical business logic (snapshot behavior,
   * archive persistence) is tested at the service level (Feature 016 tests).
   *
   * This integration test verifies the UI integration layer only.
   *
   * SECURITY NOTE: Payment amounts, providers, and dates ARE stored in archive
   * storage (payment_archive_*), but that's intentional for the archive feature.
   * This test ensures payment_status_storage does NOT contain sensitive data.
   */
});

/**
 * Zod Schema Validation Tests
 * CodeRabbit recommendation: Test PaymentRecord schema validation
 */
describe('PaymentRecord Schema Validation', () => {
  it('should validate correct payment data', () => {
    const validPayment = {
      id: uuidv4(),
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(validPayment)).not.toThrow();
    const parsed = paymentRecordSchema.parse(validPayment);
    expect(parsed).toEqual(validPayment);
  });

  it('should reject payment with missing required fields', () => {
    const invalidPayment = {
      amount: 45.00,
      currency: 'USD',
      // Missing provider, dueISO, autopay
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow();
  });

  it('should reject payment with amount > 2 decimal places', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 45.123, // Too many decimal places
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow(/decimal places/);
  });

  it('should reject payment with invalid currency code', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USDD', // 4 characters
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow();
  });

  it('should reject payment with lowercase currency', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'usd', // Lowercase
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow(/uppercase/);
  });

  it('should reject payment with invalid paid_status', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true,
      paid_status: 'invalid' // Not 'paid' or 'pending'
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow();
  });

  it('should reject payment with invalid date format', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '10/14/2025', // Wrong format
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow(/YYYY-MM-DD/);
  });

  it('should accept negative amounts for refunds within range', () => {
    const refundPayment = {
      provider: 'Klarna',
      amount: -45.00, // Negative for refund
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true
    };

    // Negative amounts are now allowed (for refunds) within the -1M to 1M range
    expect(() => paymentRecordSchema.parse(refundPayment)).not.toThrow();
    const parsed = paymentRecordSchema.parse(refundPayment);
    expect(parsed.amount).toBe(-45.00);
  });

  it('should reject payment with amount exceeding maximum', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: 2000000, // Exceeds 1M limit
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow(/less than 1,000,000/);
  });

  it('should reject payment with amount below minimum', () => {
    const invalidPayment = {
      provider: 'Klarna',
      amount: -2000000, // Below -1M limit
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true
    };

    expect(() => paymentRecordSchema.parse(invalidPayment)).toThrow(/greater than -1,000,000/);
  });

  it('should accept payment with optional fields', () => {
    const validPayment = {
      provider: 'Klarna',
      amount: 45.00,
      currency: 'USD',
      dueISO: '2025-10-14',
      autopay: true,
      risk_type: 'COLLISION',
      risk_severity: 'HIGH',
      risk_message: 'Multiple payments',
      paid_status: 'pending' as const,
      paid_timestamp: '2025-10-14T10:00:00Z'
    };

    expect(() => paymentRecordSchema.parse(validPayment)).not.toThrow();
  });
});
