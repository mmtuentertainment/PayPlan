/**
 * Shared Utils Tests
 * Feature: Shared Utilities (utils.ts)
 * Created: 2025-11-08
 *
 * Constitution v3.1 requirement: 90%+ coverage for financial code
 *
 * Tests for formatCurrency (financial utility)
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils';

describe('formatCurrency', () => {
  describe('Standard Cases', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(50000)).toBe('$500.00');
      expect(formatCurrency(10000)).toBe('$100.00');
      expect(formatCurrency(125)).toBe('$1.25');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-50000)).toBe('-$500.00');
      expect(formatCurrency(-10000)).toBe('-$100.00');
      expect(formatCurrency(-125)).toBe('-$1.25');
    });
  });

  describe('Edge Cases', () => {
    it('should format large amounts with commas', () => {
      expect(formatCurrency(100000000)).toBe('$1,000,000.00'); // $1M
      expect(formatCurrency(123456789)).toBe('$1,234,567.89');
    });

    it('should format fractional cents correctly', () => {
      expect(formatCurrency(1)).toBe('$0.01'); // 1 cent
      expect(formatCurrency(99)).toBe('$0.99'); // 99 cents
      expect(formatCurrency(12345)).toBe('$123.45');
    });

    it('should handle JavaScript floating point precision', () => {
      // Edge case: 123.456 cents (fractional cent) - Intl.NumberFormat rounds
      expect(formatCurrency(123.456)).toBe('$1.23'); // Rounds to nearest cent
      expect(formatCurrency(123.5)).toBe('$1.24'); // Rounds up at exactly 0.5
    });

    it('should format very large amounts', () => {
      expect(formatCurrency(999999999999)).toBe('$9,999,999,999.99'); // ~$10B
      expect(formatCurrency(100000000000)).toBe('$1,000,000,000.00'); // $1B
    });

    it('should format very small amounts', () => {
      expect(formatCurrency(1)).toBe('$0.01');
      expect(formatCurrency(-1)).toBe('-$0.01');
    });

    it('should handle boundary values', () => {
      expect(formatCurrency(100)).toBe('$1.00'); // Exactly $1
      expect(formatCurrency(1000)).toBe('$10.00'); // Exactly $10
      expect(formatCurrency(10000)).toBe('$100.00'); // Exactly $100
    });
  });

  describe('Locale Behavior (US)', () => {
    it('should use US dollar symbol', () => {
      const result = formatCurrency(100);
      expect(result).toContain('$');
      expect(result).toBe('$1.00');
    });

    it('should use 2 decimal places (cents)', () => {
      expect(formatCurrency(100)).toBe('$1.00');
      expect(formatCurrency(150)).toBe('$1.50');
      expect(formatCurrency(10000)).toBe('$100.00');
    });

    it('should use commas for thousands separator', () => {
      expect(formatCurrency(100000)).toBe('$1,000.00');
      expect(formatCurrency(1000000)).toBe('$10,000.00');
      expect(formatCurrency(100000000)).toBe('$1,000,000.00');
    });

    it('should handle negative with proper symbol placement', () => {
      // US locale places minus before dollar sign
      expect(formatCurrency(-50000)).toBe('-$500.00');
      expect(formatCurrency(-100)).toBe('-$1.00');
    });
  });

  describe('Input Validation (Type Safety)', () => {
    it('should handle integer inputs', () => {
      expect(formatCurrency(50000)).toBe('$500.00');
    });

    it('should handle float inputs (fractional cents)', () => {
      expect(formatCurrency(50000.5)).toBe('$500.01'); // Rounds 0.5 cents to 1 cent
      expect(formatCurrency(50000.4)).toBe('$500.00'); // Rounds 0.4 cents down
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative zero (JavaScript quirk)', () => {
      // JavaScript has -0 (negative zero) which === 0, but Intl.NumberFormat preserves the sign
      expect(formatCurrency(-0)).toBe('-$0.00'); // Intl.NumberFormat shows "-$0.00"
    });
  });

  describe('Real-World Scenarios', () => {
    it('should format common budget amounts', () => {
      expect(formatCurrency(50000)).toBe('$500.00'); // Groceries budget
      expect(formatCurrency(150000)).toBe('$1,500.00'); // Rent budget
      expect(formatCurrency(30000)).toBe('$300.00'); // Utilities budget
    });

    it('should format common goal amounts', () => {
      expect(formatCurrency(100000000)).toBe('$1,000,000.00'); // $1M goal
      expect(formatCurrency(500000)).toBe('$5,000.00'); // $5K emergency fund
      expect(formatCurrency(2000000)).toBe('$20,000.00'); // $20K car
    });

    it('should format transaction amounts', () => {
      expect(formatCurrency(495)).toBe('$4.95'); // Coffee
      expect(formatCurrency(2599)).toBe('$25.99'); // Restaurant
      expect(formatCurrency(15000)).toBe('$150.00'); // Gas
    });

    it('should format contribution amounts', () => {
      expect(formatCurrency(5000)).toBe('$50.00'); // $50 contribution
      expect(formatCurrency(10000)).toBe('$100.00'); // $100 contribution
      expect(formatCurrency(25000)).toBe('$250.00'); // $250 contribution
    });
  });

  describe('Precision and Rounding', () => {
    it('should round fractional cents (banker\'s rounding)', () => {
      // Intl.NumberFormat uses "round half to even" (banker's rounding)
      expect(formatCurrency(100.5)).toBe('$1.01'); // 0.5 cents rounds to nearest even (up)
      expect(formatCurrency(99.5)).toBe('$1.00'); // 0.5 cents rounds to nearest even (down)
    });

    it('should handle typical division results', () => {
      // Real-world: splitting $10 3 ways = 333.33... cents each
      const splitAmount = Math.floor(1000 / 3); // 333 cents
      expect(formatCurrency(splitAmount)).toBe('$3.33');
    });

    it('should handle percentage calculations', () => {
      // Real-world: 15% tip on $50 = 750 cents
      const tip = Math.floor(5000 * 0.15);
      expect(formatCurrency(tip)).toBe('$7.50');
    });
  });
});
