import { describe, it, expect } from 'vitest';
import {
  dollarsToCents,
  centsToDollars,
  formatCurrency,
  parseCurrencyToCents
} from '../../src/lib/extraction/helpers/currency';

describe('dollarsToCents', () => {
  it('converts whole dollar amounts correctly', () => {
    expect(dollarsToCents(25.00)).toBe(2500);
    expect(dollarsToCents(1.00)).toBe(100);
    expect(dollarsToCents(0.00)).toBe(0);
    expect(dollarsToCents(100.00)).toBe(10000);
  });

  it('converts fractional dollar amounts correctly', () => {
    expect(dollarsToCents(0.99)).toBe(99);
    expect(dollarsToCents(0.01)).toBe(1);
    expect(dollarsToCents(25.50)).toBe(2550);
    expect(dollarsToCents(99.99)).toBe(9999);
  });

  it('handles floating-point precision issues', () => {
    // The infamous JavaScript precision problem
    expect(0.1 + 0.2).not.toBe(0.3); // Demonstrates the problem

    // Our solution: convert to cents first
    const cents1 = dollarsToCents(0.1);  // 10 cents
    const cents2 = dollarsToCents(0.2);  // 20 cents
    const total = cents1 + cents2;       // 30 cents
    expect(total).toBe(30);              // Exact!
    expect(centsToDollars(total)).toBe(0.3); // Perfect
  });

  it('rounds to nearest cent', () => {
    expect(dollarsToCents(25.125)).toBe(2513);  // Rounds up
    expect(dollarsToCents(25.124)).toBe(2512);  // Rounds down
    expect(dollarsToCents(25.999)).toBe(2600);  // Rounds up
  });

  it('handles large amounts', () => {
    expect(dollarsToCents(1000.00)).toBe(100000);
    expect(dollarsToCents(9999.99)).toBe(999999);
    expect(dollarsToCents(500000.00)).toBe(50000000);
  });

  it('throws on invalid amounts', () => {
    expect(() => dollarsToCents(NaN)).toThrow('Invalid dollar amount');
    expect(() => dollarsToCents(Infinity)).toThrow('cannot be Infinity');
    expect(() => dollarsToCents(-Infinity)).toThrow('cannot be Infinity');
    expect(() => dollarsToCents(-5.00)).toThrow('cannot be negative');
    expect(() => dollarsToCents(-0.01)).toThrow('cannot be negative');
  });

  it('throws on amounts exceeding maximum', () => {
    expect(() => dollarsToCents(1_000_001)).toThrow('exceeds maximum');
    expect(() => dollarsToCents(2_000_000)).toThrow('exceeds maximum');
  });

  it('accepts maximum allowed amount', () => {
    expect(dollarsToCents(1_000_000)).toBe(100_000_000); // $1M = 100M cents
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollars correctly', () => {
    expect(centsToDollars(2500)).toBe(25.00);
    expect(centsToDollars(100)).toBe(1.00);
    expect(centsToDollars(0)).toBe(0.00);
    expect(centsToDollars(99)).toBe(0.99);
  });

  it('handles large cent amounts', () => {
    expect(centsToDollars(100000)).toBe(1000.00);
    expect(centsToDollars(999999)).toBe(9999.99);
    expect(centsToDollars(50000000)).toBe(500000.00);
  });

  it('throws on non-integer cents', () => {
    expect(() => centsToDollars(25.5)).toThrow('must be an integer');
    expect(() => centsToDollars(100.1)).toThrow('must be an integer');
  });

  it('handles negative cents (for refunds)', () => {
    // Negative cents may be valid for refunds/credits
    expect(centsToDollars(-2500)).toBe(-25.00);
  });
});

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(2500, 'USD')).toBe('$25.00');
    expect(formatCurrency(99, 'USD')).toBe('$0.99');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
    expect(formatCurrency(100000, 'USD')).toBe('$1000.00');
  });

  it('always shows 2 decimal places for USD', () => {
    expect(formatCurrency(100, 'USD')).toBe('$1.00');
    expect(formatCurrency(1, 'USD')).toBe('$0.01');
    expect(formatCurrency(1000, 'USD')).toBe('$10.00');
  });

  it('defaults to USD when currency not specified', () => {
    expect(formatCurrency(2500)).toBe('$25.00');
  });

  it('formats other currencies using Intl.NumberFormat', () => {
    // These tests may vary by locale, but should work in en-US
    const eurFormatted = formatCurrency(2500, 'EUR');
    expect(eurFormatted).toContain('25');
    expect(eurFormatted).toContain('00');
  });

  it('handles zero amounts', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles large amounts', () => {
    expect(formatCurrency(100000000, 'USD')).toBe('$1000000.00');
  });
});

describe('parseCurrencyToCents', () => {
  it('parses USD strings correctly', () => {
    expect(parseCurrencyToCents('$25.00')).toBe(2500);
    expect(parseCurrencyToCents('$0.99')).toBe(99);
    expect(parseCurrencyToCents('$100.00')).toBe(10000);
  });

  it('parses strings without currency symbol', () => {
    expect(parseCurrencyToCents('25.00')).toBe(2500);
    expect(parseCurrencyToCents('0.99')).toBe(99);
    expect(parseCurrencyToCents('1')).toBe(100);
  });

  it('removes commas from large amounts', () => {
    expect(parseCurrencyToCents('$1,000.00')).toBe(100000);
    expect(parseCurrencyToCents('$10,000.50')).toBe(1000050);
  });

  it('handles various currency symbols', () => {
    expect(parseCurrencyToCents('€25.00')).toBe(2500);
    expect(parseCurrencyToCents('£25.00')).toBe(2500);
    expect(parseCurrencyToCents('¥2500')).toBe(250000); // ¥2500 = $2500.00
  });

  it('throws on invalid strings', () => {
    expect(() => parseCurrencyToCents('invalid')).toThrow('Invalid currency format');
    expect(() => parseCurrencyToCents('')).toThrow('Cannot parse');
    expect(() => parseCurrencyToCents('abc123')).toThrow('Invalid currency format');
  });
});

describe('Financial accuracy integration tests', () => {
  it('round-trip conversion maintains precision', () => {
    const testAmounts = [0.01, 0.99, 1.00, 25.00, 99.99, 1000.00];

    testAmounts.forEach(dollars => {
      const cents = dollarsToCents(dollars);
      const backToDollars = centsToDollars(cents);
      expect(backToDollars).toBe(dollars);
    });
  });

  it('solves the 0.1 + 0.2 problem with integer arithmetic', () => {
    // The problem
    const floatResult = 0.1 + 0.2;
    expect(floatResult).not.toBe(0.3);
    // Floating point error exists (exact value varies by environment)
    expect(floatResult).toBeCloseTo(0.30000000000000004, 16);

    // The solution
    const cents1 = dollarsToCents(0.1);
    const cents2 = dollarsToCents(0.2);
    const centsTotal = cents1 + cents2;
    const dollarsTotal = centsToDollars(centsTotal);
    expect(dollarsTotal).toBe(0.3); // Perfect!
  });

  it('handles complex multi-payment calculations', () => {
    // Example: 4 payments of $37.50 each (PayPal Pay in 4)
    const payment1 = dollarsToCents(37.50);  // 3750
    const payment2 = dollarsToCents(37.50);  // 3750
    const payment3 = dollarsToCents(37.50);  // 3750
    const payment4 = dollarsToCents(37.50);  // 3750

    const total = payment1 + payment2 + payment3 + payment4;
    expect(total).toBe(15000); // $150.00 total

    const totalDollars = centsToDollars(total);
    expect(totalDollars).toBe(150.00); // Exact!
  });

  it('handles late fees accurately', () => {
    // Example: $45.00 payment + $7.00 late fee
    const payment = dollarsToCents(45.00);   // 4500
    const lateFee = dollarsToCents(7.00);    // 700
    const total = payment + lateFee;          // 5200

    expect(centsToDollars(total)).toBe(52.00); // Exact!
  });
});
