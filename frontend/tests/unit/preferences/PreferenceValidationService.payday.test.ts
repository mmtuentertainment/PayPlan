/**
 * Contract tests for payday pattern validation
 *
 * Feature: 012-user-preference-management
 * Task: T010
 * Contract: specs/012-user-preference-management/contracts/PreferenceValidationService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect } from 'vitest';
import {
  paydayPatternSchema,
  specificDatesPatternSchema,
  weeklyPatternSchema,
  biweeklyPatternSchema,
  monthlyPatternSchema,
  validatePreferenceValue,
} from '../../../src/lib/preferences/validation';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

describe('Payday Pattern Validation', () => {
  // ============================================================================
  // Contract 1: SpecificDatesPattern Validation (Semi-monthly)
  // ============================================================================

  describe('SpecificDatesPattern (semi-monthly)', () => {
    it('should accept valid specific dates (1st and 15th)', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [1, 15],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('specific');
        expect(result.data.dates).toEqual([1, 15]);
      }
    });

    it('should accept single date pattern', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [1],
      });

      expect(result.success).toBe(true);
    });

    it('should accept last day of month (31)', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [31],
      });

      expect(result.success).toBe(true);
    });

    it('should accept multiple dates (up to 31)', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [1, 5, 10, 15, 20, 25],
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty dates array', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one');
      }
    });

    it('should reject invalid day of month (0)', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [0, 15],
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid day of month (32)', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [1, 32],
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative day of month', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [-1, 15],
      });

      expect(result.success).toBe(false);
    });

    it('should reject duplicate dates', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [15, 15],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique');
      }
    });

    it('should reject too many dates (>31)', () => {
      const tooManyDates = Array.from({ length: 32 }, (_, i) => i + 1);
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: tooManyDates,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('31');
      }
    });

    it('should reject non-integer dates', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [1.5, 15],
      });

      expect(result.success).toBe(false);
    });

    it('should reject string dates', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: ['1', '15'],
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 2: WeeklyPattern Validation
  // ============================================================================

  describe('WeeklyPattern', () => {
    it('should accept valid weekly pattern (Friday)', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 5, // Friday
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('weekly');
        expect(result.data.dayOfWeek).toBe(5);
      }
    });

    it('should accept Sunday (0)', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 0,
      });

      expect(result.success).toBe(true);
    });

    it('should accept Saturday (6)', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 6,
      });

      expect(result.success).toBe(true);
    });

    it('should accept all valid days of week (0-6)', () => {
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

      daysOfWeek.forEach((day) => {
        const result = weeklyPatternSchema.safeParse({
          type: 'weekly',
          dayOfWeek: day,
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid day of week (7)', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 7,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('0-6');
      }
    });

    it('should reject negative day of week (-1)', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: -1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('0-6');
      }
    });

    it('should reject non-integer day of week', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 5.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject string day of week', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 'Friday',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing dayOfWeek', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 3: BiweeklyPattern Validation (Most Common - 45.7%)
  // ============================================================================

  describe('BiweeklyPattern', () => {
    it('should accept valid biweekly pattern (default)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 5, // Friday
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('biweekly');
        expect(result.data.startDate).toBe('2025-01-03');
        expect(result.data.dayOfWeek).toBe(5);
      }
    });

    it('should accept all valid days of week with startDate', () => {
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

      daysOfWeek.forEach((day) => {
        const result = biweeklyPatternSchema.safeParse({
          type: 'biweekly',
          startDate: '2025-01-03',
          dayOfWeek: day,
        });

        expect(result.success).toBe(true);
      });
    });

    it('should accept valid ISO date formats', () => {
      const validDates = [
        '2025-01-01',
        '2025-12-31',
        '2024-02-29', // Leap year
        '2025-06-15',
      ];

      validDates.forEach((date) => {
        const result = biweeklyPatternSchema.safeParse({
          type: 'biweekly',
          startDate: date,
          dayOfWeek: 5,
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid ISO date format (MM/DD/YYYY)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '01/03/2025',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO date format');
      }
    });

    it('should reject invalid ISO date format (DD-MM-YYYY)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '03-01-2025',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid date (2025-02-30)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-02-30',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid date');
      }
    });

    it('should reject invalid date (2025-13-01)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-13-01',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-leap year Feb 29 (2025-02-29)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-02-29',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid day of week (7)', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 7,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing startDate', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing dayOfWeek', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-01-03',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty startDate string', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 4: MonthlyPattern Validation
  // ============================================================================

  describe('MonthlyPattern', () => {
    it('should accept valid monthly pattern (1st of month)', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('monthly');
        expect(result.data.dayOfMonth).toBe(1);
      }
    });

    it('should accept last day of month (31)', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 31,
      });

      expect(result.success).toBe(true);
    });

    it('should accept all valid days of month (1-31)', () => {
      const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

      daysOfMonth.forEach((day) => {
        const result = monthlyPatternSchema.safeParse({
          type: 'monthly',
          dayOfMonth: day,
        });

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid day of month (0)', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1-31');
      }
    });

    it('should reject day of month exceeding 31 (32)', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 32,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1-31');
      }
    });

    it('should reject negative day of month', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: -1,
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-integer day of month', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 15.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject string day of month', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: '15',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing dayOfMonth', () => {
      const result = monthlyPatternSchema.safeParse({
        type: 'monthly',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 5: Discriminated Union (All Pattern Types)
  // ============================================================================

  describe('PaydayPattern Discriminated Union', () => {
    it('should accept all valid pattern types', () => {
      const patterns = [
        { type: 'specific', dates: [1, 15] },
        { type: 'weekly', dayOfWeek: 5 },
        { type: 'biweekly', startDate: '2025-01-03', dayOfWeek: 5 },
        { type: 'monthly', dayOfMonth: 1 },
      ];

      patterns.forEach((pattern) => {
        const result = paydayPatternSchema.safeParse(pattern);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid pattern type', () => {
      const result = paydayPatternSchema.safeParse({
        type: 'invalid',
        data: {},
      });

      expect(result.success).toBe(false);
    });

    it('should reject pattern with missing type', () => {
      const result = paydayPatternSchema.safeParse({
        dates: [1, 15],
      });

      expect(result.success).toBe(false);
    });

    it('should reject pattern with wrong fields for type', () => {
      // Using weekly fields with biweekly type
      const result = paydayPatternSchema.safeParse({
        type: 'biweekly',
        dayOfWeek: 5, // Missing startDate
      });

      expect(result.success).toBe(false);
    });

    it('should reject null as pattern', () => {
      const result = paydayPatternSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined as pattern', () => {
      const result = paydayPatternSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 6: validatePreferenceValue Helper
  // ============================================================================

  describe('validatePreferenceValue Helper', () => {
    it('should validate biweekly pattern using helper', () => {
      const result = validatePreferenceValue(PreferenceCategory.PaydayDates, {
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(true);
    });

    it('should validate specific dates pattern using helper', () => {
      const result = validatePreferenceValue(PreferenceCategory.PaydayDates, {
        type: 'specific',
        dates: [1, 15],
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid pattern using helper', () => {
      const result = validatePreferenceValue(PreferenceCategory.PaydayDates, {
        type: 'biweekly',
        startDate: 'invalid-date',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 7: Performance Requirement (<1ms validation)
  // ============================================================================

  describe('Performance', () => {
    it('should validate biweekly pattern in <1ms', () => {
      const pattern = {
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 5,
      };

      const startTime = performance.now();
      paydayPatternSchema.safeParse(pattern);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1);
    });

    it('should validate specific dates pattern in <1ms', () => {
      const pattern = {
        type: 'specific',
        dates: [1, 15],
      };

      const startTime = performance.now();
      paydayPatternSchema.safeParse(pattern);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1);
    });
  });

  // ============================================================================
  // Contract 8: Real-World Payroll Patterns (Research.md Section 4)
  // ============================================================================

  describe('Real-World Payroll Patterns', () => {
    it('should accept biweekly Friday pattern (45.7% of US payrolls)', () => {
      const result = paydayPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '2025-01-03',
        dayOfWeek: 5, // Friday
      });

      expect(result.success).toBe(true);
    });

    it('should accept weekly Friday pattern (31.8% of US payrolls)', () => {
      const result = paydayPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 5, // Friday
      });

      expect(result.success).toBe(true);
    });

    it('should accept semi-monthly 1st and 15th (18% of US payrolls)', () => {
      const result = paydayPatternSchema.safeParse({
        type: 'specific',
        dates: [1, 15],
      });

      expect(result.success).toBe(true);
    });

    it('should accept monthly 1st of month (4.4% of US payrolls)', () => {
      const result = paydayPatternSchema.safeParse({
        type: 'monthly',
        dayOfMonth: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 9: Error Message Clarity
  // ============================================================================

  describe('Error Messages', () => {
    it('should provide clear error for invalid date format', () => {
      const result = biweeklyPatternSchema.safeParse({
        type: 'biweekly',
        startDate: '01/03/2025',
        dayOfWeek: 5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/ISO date format/i);
        expect(errorMessage).toContain('YYYY-MM-DD');
      }
    });

    it('should provide clear error for invalid day of week', () => {
      const result = weeklyPatternSchema.safeParse({
        type: 'weekly',
        dayOfWeek: 7,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('0-6');
        expect(errorMessage).toMatch(/Sunday|Saturday/i);
      }
    });

    it('should provide clear error for duplicate dates', () => {
      const result = specificDatesPatternSchema.safeParse({
        type: 'specific',
        dates: [15, 15],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/unique/i);
      }
    });
  });
});
