import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import { exportPaymentsToCSV } from '@/services/csvExportService';
import type { PaymentRecord } from '@/types/csvExport';

describe('CSV Export Integration', () => {
  describe('exportPaymentsToCSV', () => {
    it('should transform 10 payment records and generate valid CSV', () => {
      const payments: PaymentRecord[] = Array.from({ length: 10 }, (_, i) => ({
        provider: `Provider ${i + 1}`,
        amount: 45.00 + i,
        currency: 'USD',
        dueISO: `2025-10-${String(14 + i).padStart(2, '0')}`,
        autopay: i % 2 === 0,
        risk_type: i % 3 === 0 ? 'COLLISION' : undefined,
        risk_severity: i % 3 === 0 ? 'HIGH' : undefined,
        risk_message: i % 3 === 0 ? 'Multiple payments' : undefined
      }));

      const result = exportPaymentsToCSV(payments);

      expect(result.rows.length).toBe(10);
      expect(result.metadata.recordCount).toBe(10);
      expect(result.metadata.shouldWarn).toBe(false); // <500 records
      expect(result.csvContent).toBeTruthy();
      expect(result.csvContent.length).toBeGreaterThan(0);
    });

    it('should generate CSV content matching expected format', () => {
      const payments: PaymentRecord[] = [{
        provider: 'Klarna',
        amount: 45.00,
        currency: 'USD',
        dueISO: '2025-10-14',
        autopay: true,
        risk_type: 'COLLISION',
        risk_severity: 'HIGH',
        risk_message: 'Multiple payments due'
      }];

      const result = exportPaymentsToCSV(payments);

      // Verify header exists
      expect(result.csvContent).toContain('provider');
      expect(result.csvContent).toContain('amount');
      expect(result.csvContent).toContain('risk_type');

      // Verify data row exists
      expect(result.csvContent).toContain('Klarna');
      expect(result.csvContent).toContain('45.00');
      expect(result.csvContent).toContain('COLLISION');
    });

    it('should support round-trip: export → re-parse → compare', () => {
      const payments: PaymentRecord[] = [
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
          autopay: false,
          risk_type: '',
          risk_severity: '',
          risk_message: ''
        }
      ];

      const exported = exportPaymentsToCSV(payments);

      // Re-parse the generated CSV
      const parsed = Papa.parse(exported.csvContent, { header: true, skipEmptyLines: true });

      expect(parsed.errors.length).toBe(0);
      expect(parsed.data.length).toBe(2);

      // Verify first row
      const row1 = parsed.data[0] as Record<string, string>;
      expect(row1.provider).toBe('Klarna');
      expect(row1.amount).toBe('45.00');
      expect(row1.currency).toBe('USD');
      expect(row1.dueISO).toBe('2025-10-14');
      expect(row1.autopay).toBe('true');
      expect(row1.risk_type).toBe('COLLISION');

      // Verify second row
      const row2 = parsed.data[1] as Record<string, string>;
      expect(row2.provider).toBe('Affirm');
      expect(row2.amount).toBe('32.50');
      expect(row2.autopay).toBe('false');
      expect(row2.risk_type).toBe(''); // Empty string preserved
    });

    it('should handle large dataset (600 records) with warning flag', () => {
      const payments: PaymentRecord[] = Array.from({ length: 600 }, (_, i) => ({
        provider: `Provider ${i}`,
        amount: 50.00,
        currency: 'USD',
        dueISO: '2025-10-14',
        autopay: true
      }));

      const result = exportPaymentsToCSV(payments);

      expect(result.metadata.recordCount).toBe(600);
      expect(result.metadata.shouldWarn).toBe(true); // >500 records
      expect(result.rows.length).toBe(600);
      expect(result.csvContent.split('\r\n').length).toBeGreaterThan(600); // Header + 600 rows
    });

    it('should preserve special characters in round-trip', () => {
      const payments: PaymentRecord[] = [{
        provider: 'Klarna, Inc. "Best" Provider',
        amount: 45.00,
        currency: 'USD',
        dueISO: '2025-10-14',
        autopay: true
      }];

      const exported = exportPaymentsToCSV(payments);
      const parsed = Papa.parse(exported.csvContent, { header: true, skipEmptyLines: true });

      const row = parsed.data[0] as Record<string, string>;
      expect(row.provider).toBe('Klarna, Inc. "Best" Provider');
    });

    it('should preserve unicode characters in round-trip', () => {
      const payments: PaymentRecord[] = [{
        provider: 'Café Münchën 東京',
        amount: 45.00,
        currency: 'EUR',
        dueISO: '2025-10-14',
        autopay: true
      }];

      const exported = exportPaymentsToCSV(payments);
      const parsed = Papa.parse(exported.csvContent, { header: true, skipEmptyLines: true });

      const row = parsed.data[0] as Record<string, string>;
      expect(row.provider).toBe('Café Münchën 東京');
    });
  });
});
