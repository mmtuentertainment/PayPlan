import { describe, it, expect } from 'vitest';
import {
  transformPaymentToCSVRow,
  generateExportMetadata,
  generateCSV,
  downloadCSV
} from '@/services/csvExportService';
import type { PaymentRecord, CSVRow } from '@/types/csvExport';

describe('csvExportService', () => {
  describe('transformPaymentToCSVRow', () => {
    it('should transform a basic payment record with all fields populated', () => {
      const payment: PaymentRecord = {
        provider: 'Klarna',
        amount: 45,
        currency: 'USD',
        dueISO: '2025-10-14',
        autopay: true,
        risk_type: 'COLLISION',
        risk_severity: 'HIGH',
        risk_message: 'Multiple payments due same day'
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result).toEqual({
        provider: 'Klarna',
        amount: '45.00',
        currency: 'USD',
        dueISO: '2025-10-14',
        autopay: 'true',
        risk_type: 'COLLISION',
        risk_severity: 'HIGH',
        risk_message: 'Multiple payments due same day'
      });
    });

    it('should convert undefined risk fields to empty strings', () => {
      const payment: PaymentRecord = {
        provider: 'Affirm',
        amount: 32.50,
        currency: 'USD',
        dueISO: '2025-10-21',
        autopay: false
        // risk fields undefined
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.risk_type).toBe('');
      expect(result.risk_severity).toBe('');
      expect(result.risk_message).toBe('');
    });

    it('should format amount with exactly 2 decimal places (45 → "45.00")', () => {
      const payment: PaymentRecord = {
        provider: 'Afterpay',
        amount: 45,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('45.00');
      expect(result.amount).toMatch(/^\d+\.\d{2}$/);
    });

    it('should format amount with exactly 2 decimal places (45.5 → "45.50")', () => {
      const payment: PaymentRecord = {
        provider: 'PayPal',
        amount: 45.5,
        currency: 'USD',
        dueISO: '2025-10-16',
        autopay: false
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('45.50');
    });

    it('should convert boolean true to string "true"', () => {
      const payment: PaymentRecord = {
        provider: 'Zip',
        amount: 20,
        currency: 'USD',
        dueISO: '2025-10-17',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.autopay).toBe('true');
      expect(typeof result.autopay).toBe('string');
    });

    it('should convert boolean false to string "false"', () => {
      const payment: PaymentRecord = {
        provider: 'Sezzle',
        amount: 25,
        currency: 'USD',
        dueISO: '2025-10-18',
        autopay: false
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.autopay).toBe('false');
      expect(typeof result.autopay).toBe('string');
    });

    it('should preserve provider name exactly', () => {
      const payment: PaymentRecord = {
        provider: 'Klarna, Inc.',  // Special char (comma) preserved
        amount: 30,
        currency: 'EUR',
        dueISO: '2025-10-19',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.provider).toBe('Klarna, Inc.');
    });

    it('should preserve currency code exactly', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: 100,
        currency: 'GBP',
        dueISO: '2025-10-20',
        autopay: false
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.currency).toBe('GBP');
    });

    it('should preserve ISO date format exactly', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: 50,
        currency: 'USD',
        dueISO: '2025-12-25',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.dueISO).toBe('2025-12-25');
      expect(result.dueISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // Edge case tests for financial accuracy
    it('should format zero amount correctly', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: 0,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('0.00');
    });

    it('should handle negative amounts for refunds', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: -45.50,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('-45.50');
    });

    it('should handle large amounts without scientific notation', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: 999999.99,
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('999999.99');
      expect(result.amount).not.toContain('e');
    });

    it('should handle floating-point precision correctly', () => {
      const payment: PaymentRecord = {
        provider: 'Test',
        amount: 0.1 + 0.2, // Common floating-point issue (0.30000000000000004)
        currency: 'USD',
        dueISO: '2025-10-15',
        autopay: true
      };

      const result = transformPaymentToCSVRow(payment);

      expect(result.amount).toBe('0.30');
    });
  });

  describe('generateExportMetadata', () => {
    it('should generate filename with correct timestamp format', () => {
      const result = generateExportMetadata(10);

      expect(result.filename).toMatch(/^payplan-export-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
      expect(result.filename).toContain('payplan-export-');
      expect(result.filename).toContain('.csv');
    });

    it('should set recordCount correctly', () => {
      const result = generateExportMetadata(42);

      expect(result.recordCount).toBe(42);
    });

    it('should set shouldWarn to false for 500 records (at threshold)', () => {
      const result = generateExportMetadata(500);

      expect(result.shouldWarn).toBe(false);
    });

    it('should set shouldWarn to false for records below threshold', () => {
      const result = generateExportMetadata(50);

      expect(result.shouldWarn).toBe(false);
    });

    it('should set shouldWarn to true for 501 records (above threshold)', () => {
      const result = generateExportMetadata(501);

      expect(result.shouldWarn).toBe(true);
    });

    it('should set shouldWarn to true for 1000 records', () => {
      const result = generateExportMetadata(1000);

      expect(result.shouldWarn).toBe(true);
    });

    it('should generate valid ISO 8601 timestamp', () => {
      const result = generateExportMetadata(10);

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should generate Date object for generatedAt', () => {
      const result = generateExportMetadata(10);

      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate consistent timestamp across fields', () => {
      const result = generateExportMetadata(10);
      const parsedTimestamp = new Date(result.timestamp);

      // Timestamps should match within 1 second
      expect(Math.abs(result.generatedAt.getTime() - parsedTimestamp.getTime())).toBeLessThan(1000);
    });
  });

  describe('generateCSV', () => {
    it.todo('should be implemented in T007');
  });

  describe('downloadCSV', () => {
    it.todo('should be implemented in T009');
  });
});
