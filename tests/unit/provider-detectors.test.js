const { detectProvider, extractAmount, extractInstallmentNumber, detectAutopay, PROVIDER_PATTERNS } = require('../../frontend/src/lib/provider-detectors.ts');

describe('provider-detectors', () => {
  describe('detectProvider', () => {
    it('detects Klarna from email', () => {
      expect(detectProvider('From: Klarna <no-reply@klarna.com>')).toBe('Klarna');
    });

    it('detects Affirm from email', () => {
      expect(detectProvider('From: Affirm <notifications@affirm.com>')).toBe('Affirm');
    });

    it('returns Unknown for unrecognized provider', () => {
      expect(detectProvider('From: GenericFinance')).toBe('Unknown');
    });

    // Edge cases
    it('handles empty string', () => {
      expect(detectProvider('')).toBe('Unknown');
    });

    it('handles null and undefined', () => {
      expect(() => detectProvider(null)).toThrow();
      expect(() => detectProvider(undefined)).toThrow();
    });

    it('detects provider case-insensitively', () => {
      expect(detectProvider('from klarna')).toBe('Klarna');
      expect(detectProvider('FROM KLARNA')).toBe('Klarna');
      expect(detectProvider('AfFiRm')).toBe('Affirm');
    });

    it('handles malformed email headers', () => {
      expect(detectProvider('From: <no-sender-name@klarna.com>')).toBe('Klarna');
      expect(detectProvider('klarna payment reminder')).toBe('Klarna');
    });

    it('handles multiple provider names (first match wins)', () => {
      // If both appear, first pattern in code wins
      const text = 'Klarna and Affirm payment';
      const result = detectProvider(text);
      expect(['Klarna', 'Affirm']).toContain(result);
    });

    it('handles very long strings', () => {
      const longText = 'a'.repeat(10000) + ' klarna ' + 'b'.repeat(10000);
      expect(detectProvider(longText)).toBe('Klarna');
    });

    it('handles special characters and injection attempts', () => {
      expect(detectProvider('<script>alert(1)</script> klarna')).toBe('Klarna');
      expect(detectProvider('klarna\'; DROP TABLE users;--')).toBe('Klarna');
    });
  });

  describe('extractAmount', () => {
    const patterns = PROVIDER_PATTERNS.klarna.amountPatterns;

    it('extracts amount with dollar sign', () => {
      expect(extractAmount('Payment: $45.00', patterns)).toBe(45);
    });

    it('extracts amount with commas', () => {
      expect(extractAmount('Amount: $1,234.56', patterns)).toBe(1234.56);
    });

    // Financial edge cases
    it('extracts zero amount', () => {
      expect(extractAmount('Payment: $0.00', patterns)).toBe(0);
    });

    it('extracts very small amounts', () => {
      expect(extractAmount('Amount: $0.01', patterns)).toBe(0.01);
      expect(extractAmount('Amount: $0.99', patterns)).toBe(0.99);
    });

    it('extracts amounts without decimal', () => {
      expect(extractAmount('Payment: $45', patterns)).toBe(45);
    });

    it('extracts large amounts', () => {
      expect(extractAmount('Amount: $1,000,000.00', patterns)).toBe(1000000);
      expect(extractAmount('Amount: $999,999.99', patterns)).toBe(999999.99);
    });

    it('handles amounts with single decimal place', () => {
      expect(extractAmount('Payment: $45.5', patterns)).toBe(45.5);
    });

    it('throws on invalid formats', () => {
      expect(() => extractAmount('$$45.00', patterns)).toThrow();
      expect(() => extractAmount('No amount here', patterns)).toThrow();
      expect(() => extractAmount('', patterns)).toThrow();
    });

    it('throws on null or undefined', () => {
      expect(() => extractAmount(null, patterns)).toThrow();
      expect(() => extractAmount(undefined, patterns)).toThrow();
    });
  });

  describe('extractInstallmentNumber', () => {
    const patterns = PROVIDER_PATTERNS.klarna.installmentPatterns;

    it('extracts from "Payment X of Y" format', () => {
      expect(extractInstallmentNumber('Payment 2 of 4', patterns)).toBe(2);
    });

    it('extracts from "X/Y" format', () => {
      const affirmPatterns = PROVIDER_PATTERNS.affirm.installmentPatterns;
      expect(extractInstallmentNumber('Installment 3/6', affirmPatterns)).toBe(3);
    });

    it('defaults to 1 when not found', () => {
      expect(extractInstallmentNumber('No installment info', patterns)).toBe(1);
    });

    // Edge cases
    it('handles single installment (1 of 1)', () => {
      expect(extractInstallmentNumber('Payment 1 of 1', patterns)).toBe(1);
    });

    it('handles installment 0 (invalid - returns 1)', () => {
      expect(extractInstallmentNumber('Payment 0 of 4', patterns)).toBe(1);
    });

    it('handles installment exceeding total (invalid - returns 1)', () => {
      expect(extractInstallmentNumber('Payment 5 of 4', patterns)).toBe(1);
    });

    it('handles large installment numbers', () => {
      expect(extractInstallmentNumber('Payment 12 of 12', patterns)).toBe(12);
    });

    it('handles extra whitespace', () => {
      expect(extractInstallmentNumber('  Payment   2   of   4  ', patterns)).toBe(2);
    });

    it('handles non-numeric values', () => {
      expect(extractInstallmentNumber('Payment x of y', patterns)).toBe(1);
    });

    it('handles empty string', () => {
      expect(extractInstallmentNumber('', patterns)).toBe(1);
    });

    it('handles negative numbers (invalid)', () => {
      expect(extractInstallmentNumber('Payment -2 of 4', patterns)).toBe(1);
    });
  });

  describe('detectAutopay', () => {
    it('detects "AutoPay is ON"', () => {
      expect(detectAutopay('AutoPay is ON')).toBe(true);
    });

    it('detects "AutoPay is enabled"', () => {
      expect(detectAutopay('AutoPay is enabled')).toBe(true);
    });

    it('detects "automatically charged"', () => {
      expect(detectAutopay('will be charged automatically')).toBe(true);
    });

    it('returns false when autopay keywords absent', () => {
      expect(detectAutopay('Manual payment required')).toBe(false);
    });

    // Security-critical tests: must return false for "OFF" states
    it('returns false for "AutoPay is OFF"', () => {
      expect(detectAutopay('AutoPay is OFF')).toBe(false);
    });

    it('returns false for "AutoPay is not enabled"', () => {
      expect(detectAutopay('AutoPay is not enabled')).toBe(false);
    });

    it('returns false for "AutoPay disabled"', () => {
      expect(detectAutopay('AutoPay disabled')).toBe(false);
    });

    it('returns false for "AutoPay turned off"', () => {
      expect(detectAutopay('AutoPay turned off')).toBe(false);
    });

    // Case sensitivity tests
    it('detects autopay in different cases', () => {
      expect(detectAutopay('autopay is on')).toBe(true);
      expect(detectAutopay('AUTOPAY IS ENABLED')).toBe(true);
      expect(detectAutopay('AutoPay Enabled')).toBe(true);
    });

    // Edge cases
    it('handles empty string', () => {
      expect(detectAutopay('')).toBe(false);
    });

    it('handles null and undefined', () => {
      expect(detectAutopay(null)).toBe(false);
      expect(detectAutopay(undefined)).toBe(false);
    });

    it('handles extra whitespace', () => {
      expect(detectAutopay('  AutoPay   is ON  ')).toBe(true);
      expect(detectAutopay('  will be charged automatically!!!  ')).toBe(true);
    });

    it('handles special characters', () => {
      expect(detectAutopay('AutoPay is ON!!!')).toBe(true);
      expect(detectAutopay('***AutoPay enabled***')).toBe(true);
    });

    it('does not crash on malicious-looking input', () => {
      const maliciousInput = '<script>alert(1)</script> AutoPay is ON';
      expect(detectAutopay(maliciousInput)).toBe(true);
    });
  });
});
