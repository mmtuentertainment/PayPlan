import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsThisWeek from '@/components/ResultsThisWeek';
import type { PaymentRecord } from '@/types/csvExport';
import * as csvExportService from '@/services/csvExportService';

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
