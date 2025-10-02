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
  });

  describe('extractAmount', () => {
    it('extracts amount with dollar sign', () => {
      const patterns = PROVIDER_PATTERNS.klarna.amountPatterns;
      expect(extractAmount('Payment: $45.00', patterns)).toBe(45);
    });

    it('extracts amount with commas', () => {
      const patterns = PROVIDER_PATTERNS.klarna.amountPatterns;
      expect(extractAmount('Amount: $1,234.56', patterns)).toBe(1234.56);
    });
  });

  describe('extractInstallmentNumber', () => {
    it('extracts from "Payment X of Y" format', () => {
      const patterns = PROVIDER_PATTERNS.klarna.installmentPatterns;
      expect(extractInstallmentNumber('Payment 2 of 4', patterns)).toBe(2);
    });

    it('extracts from "X/Y" format', () => {
      const patterns = PROVIDER_PATTERNS.affirm.installmentPatterns;
      expect(extractInstallmentNumber('Installment 3/6', patterns)).toBe(3);
    });

    it('defaults to 1 when not found', () => {
      const patterns = PROVIDER_PATTERNS.klarna.installmentPatterns;
      expect(extractInstallmentNumber('No installment info', patterns)).toBe(1);
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
  });
});
