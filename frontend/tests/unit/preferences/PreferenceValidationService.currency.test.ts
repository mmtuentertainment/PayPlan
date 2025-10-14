/**
 * Contract tests for currency format validation
 *
 * Feature: 012-user-preference-management
 * Task: T012
 * Contract: specs/012-user-preference-management/contracts/PreferenceValidationService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect } from 'vitest';
import {
  currencyFormatSchema,
  validatePreferenceValue,
} from '../../../src/lib/preferences/validation';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

describe('Currency Format Validation', () => {
  // ============================================================================
  // Contract 1: Valid Currency Formats
  // ============================================================================

  describe('Valid Currency Formats', () => {
    it('should accept valid USD format', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currencyCode).toBe('USD');
        expect(result.data.decimalSeparator).toBe('.');
        expect(result.data.thousandsSeparator).toBe(',');
        expect(result.data.symbolPosition).toBe('before');
      }
    });

    it('should accept valid EUR format (European style)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'EUR',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        symbolPosition: 'after',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid GBP format', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'GBP',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid JPY format (no decimal separator)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'JPY',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept format with space as thousands separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'EUR',
        decimalSeparator: ',',
        thousandsSeparator: ' ',
        symbolPosition: 'after',
      });

      expect(result.success).toBe(true);
    });

    it('should accept format with no thousands separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: '',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 2: Invalid Currency Codes (ISO 4217)
  // ============================================================================

  describe('Invalid Currency Codes', () => {
    it('should reject currency code shorter than 3 characters', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'US',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 characters');
      }
    });

    it('should reject currency code longer than 3 characters', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USDD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 characters');
      }
    });

    it('should reject lowercase currency code', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'usd',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase');
      }
    });

    it('should reject mixed case currency code', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'UsD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject currency code with numbers', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'US1',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letters');
      }
    });

    it('should reject currency code with special characters', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'US$',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty currency code', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: '',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 3: Invalid Decimal Separators
  // ============================================================================

  describe('Invalid Decimal Separators', () => {
    it('should reject invalid decimal separator (semicolon)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: ';',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/"\." or ","/);
      }
    });

    it('should reject empty decimal separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject multi-character decimal separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '..',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null decimal separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: null,
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 4: Invalid Thousands Separators
  // ============================================================================

  describe('Invalid Thousands Separators', () => {
    it('should reject invalid thousands separator (semicolon)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ';',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/",", "\.", " ", or empty/);
      }
    });

    it('should reject multi-character thousands separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',,',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null thousands separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: null,
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 5: Invalid Symbol Positions
  // ============================================================================

  describe('Invalid Symbol Positions', () => {
    it('should reject invalid symbol position (left)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'left',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/"before" or "after"/);
      }
    });

    it('should reject invalid symbol position (right)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'right',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty symbol position', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null symbol position', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: null,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 6: Missing Required Fields
  // ============================================================================

  describe('Missing Required Fields', () => {
    it('should reject missing currencyCode', () => {
      const result = currencyFormatSchema.safeParse({
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing decimalSeparator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing thousandsSeparator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing symbolPosition', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 7: validatePreferenceValue Helper
  // ============================================================================

  describe('validatePreferenceValue Helper', () => {
    it('should validate currency format using helper', () => {
      const result = validatePreferenceValue(PreferenceCategory.CurrencyFormat, {
        currencyCode: 'EUR',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        symbolPosition: 'after',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid currency format using helper', () => {
      const result = validatePreferenceValue(PreferenceCategory.CurrencyFormat, {
        currencyCode: 'usd', // Lowercase
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 8: Real-World Currency Formats
  // ============================================================================

  describe('Real-World Currency Formats', () => {
    it('should accept US Dollar format ($1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Euro format (1.234,56 €)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'EUR',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        symbolPosition: 'after',
      });

      expect(result.success).toBe(true);
    });

    it('should accept British Pound format (£1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'GBP',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Japanese Yen format (¥1,234)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'JPY',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it("should accept Swiss Franc format (CHF 1'234.56)", () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'CHF',
        decimalSeparator: '.',
        thousandsSeparator: ' ',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Indian Rupee format (₹1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'INR',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Australian Dollar format ($1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'AUD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Canadian Dollar format ($1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'CAD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Mexican Peso format ($1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'MXN',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });

    it('should accept Chinese Yuan format (¥1,234.56)', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'CNY',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 9: ISO 4217 Currency Codes
  // ============================================================================

  describe('ISO 4217 Currency Codes', () => {
    it('should accept all major ISO 4217 currency codes', () => {
      const majorCurrencies = [
        'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD',
        'CNY', 'HKD', 'NZD', 'SEK', 'KRW', 'SGD', 'NOK',
        'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
      ];

      majorCurrencies.forEach((currency) => {
        const result = currencyFormatSchema.safeParse({
          currencyCode: currency,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          symbolPosition: 'before',
        });

        expect(result.success).toBe(true);
      });
    });

    it('should accept cryptocurrency-like codes (not officially ISO 4217 but 3-letter)', () => {
      const cryptoCodes = ['BTC', 'ETH', 'XRP']; // Note: Not actual ISO codes

      cryptoCodes.forEach((code) => {
        const result = currencyFormatSchema.safeParse({
          currencyCode: code,
          decimalSeparator: '.',
          thousandsSeparator: ',',
          symbolPosition: 'before',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Contract 10: Performance Requirement (<1ms validation)
  // ============================================================================

  describe('Performance', () => {
    it('should validate currency format in <2ms (median of 10 runs)', () => {
      const format = {
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      };

      // Warmup runs to eliminate JIT compilation overhead
      for (let i = 0; i < 3; i++) {
        currencyFormatSchema.safeParse(format);
      }

      // Measured runs
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        currencyFormatSchema.safeParse(format);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Calculate median (more robust than average against outliers)
      times.sort((a, b) => a - b);
      const median = times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];

      expect(median).toBeLessThan(2);
    });
  });

  // ============================================================================
  // Contract 11: Error Message Clarity
  // ============================================================================

  describe('Error Messages', () => {
    it('should provide clear error for invalid currency code length', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'US',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('3 characters');
        expect(errorMessage).toMatch(/ISO 4217/i);
      }
    });

    it('should provide clear error for lowercase currency code', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'usd',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/uppercase/i);
        expect(errorMessage).toContain('USD');
      }
    });

    it('should provide clear error for invalid decimal separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: ';',
        thousandsSeparator: ',',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('"."');
        expect(errorMessage).toContain('","');
      }
    });

    it('should provide clear error for invalid thousands separator', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ';',
        symbolPosition: 'before',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/",", "\.", " ", or empty/i);
      }
    });

    it('should provide clear error for invalid symbol position', () => {
      const result = currencyFormatSchema.safeParse({
        currencyCode: 'USD',
        decimalSeparator: '.',
        thousandsSeparator: ',',
        symbolPosition: 'left',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('"before"');
        expect(errorMessage).toContain('"after"');
      }
    });
  });

  // ============================================================================
  // Contract 12: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should reject null currency format', () => {
      const result = currencyFormatSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined currency format', () => {
      const result = currencyFormatSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject empty object', () => {
      const result = currencyFormatSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject string as currency format', () => {
      const result = currencyFormatSchema.safeParse('USD');
      expect(result.success).toBe(false);
    });

    it('should reject number as currency format', () => {
      const result = currencyFormatSchema.safeParse(123);
      expect(result.success).toBe(false);
    });
  });
});
