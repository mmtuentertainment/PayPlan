/**
 * Contract tests for business day settings validation
 *
 * Feature: 012-user-preference-management
 * Task: T011
 * Contract: specs/012-user-preference-management/contracts/PreferenceValidationService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect } from 'vitest';
import {
  businessDaySettingsSchema,
  validatePreferenceValue,
} from '../../../src/lib/preferences/validation';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

describe('Business Day Settings Validation', () => {
  // ============================================================================
  // Contract 1: Valid Business Day Settings
  // ============================================================================

  describe('Valid Business Day Settings', () => {
    it('should accept standard Monday-Friday working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workingDays).toEqual([1, 2, 3, 4, 5]);
        expect(result.data.holidays).toEqual([]);
      }
    });

    it('should accept Monday-Saturday working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5, 6],
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept all 7 days as working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept single working day', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1], // Monday only
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept non-consecutive working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 3, 5], // Monday, Wednesday, Friday
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept working days with holidays', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-12-25', '2025-01-01'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.holidays).toEqual(['2025-12-25', '2025-01-01']);
      }
    });
  });

  // ============================================================================
  // Contract 2: Invalid Working Days
  // ============================================================================

  describe('Invalid Working Days', () => {
    it('should reject empty working days array', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [],
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one');
      }
    });

    it('should reject invalid day of week (7)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 7],
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative day of week (-1)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [-1, 1, 2, 3, 4],
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject duplicate working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 3, 4],
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unique');
      }
    });

    it('should reject more than 7 working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [0, 1, 2, 3, 4, 5, 6, 7], // 8 days
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('7');
      }
    });

    it('should reject non-integer working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1.5, 2, 3, 4, 5],
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject string working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: ['1', '2', '3', '4', '5'],
        holidays: [],
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 3: Valid Holiday Dates
  // ============================================================================

  describe('Valid Holiday Dates', () => {
    it('should accept ISO 8601 date format (YYYY-MM-DD)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-12-25'],
      });

      expect(result.success).toBe(true);
    });

    it('should accept multiple holidays', () => {
      const holidays = [
        '2025-01-01', // New Year
        '2025-07-04', // Independence Day
        '2025-11-28', // Thanksgiving
        '2025-12-25', // Christmas
      ];

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.holidays).toEqual(holidays);
      }
    });

    it('should accept leap year date (2024-02-29)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2024-02-29'],
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty holidays array', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept holidays at max limit (50)', () => {
      const maxHolidays = Array.from(
        { length: 50 },
        (_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
      );

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: maxHolidays,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 4: Invalid Holiday Dates
  // ============================================================================

  describe('Invalid Holiday Dates', () => {
    it('should reject invalid ISO date format (MM/DD/YYYY)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['12/25/2025'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO date format');
      }
    });

    it('should reject invalid ISO date format (DD-MM-YYYY)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['25-12-2025'],
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid date (2025-02-30)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-02-30'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid date');
      }
    });

    it('should reject invalid month (2025-13-01)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-13-01'],
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-leap year Feb 29 (2025-02-29)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-02-29'],
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty date string', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: [''],
      });

      expect(result.success).toBe(false);
    });

    it('should reject too many holidays (>50)', () => {
      const tooManyHolidays = Array.from(
        { length: 51 },
        (_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
      );

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: tooManyHolidays,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('50');
      }
    });
  });

  // ============================================================================
  // Contract 5: Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should reject null working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: null,
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject undefined working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: undefined,
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing workingDays field', () => {
      const result = businessDaySettingsSchema.safeParse({
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing holidays field', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
      });

      expect(result.success).toBe(false);
    });

    it('should reject null holidays', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: null,
      });

      expect(result.success).toBe(false);
    });

    it('should reject object as working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: { days: [1, 2, 3, 4, 5] },
        holidays: [],
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-array holidays', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: '2025-12-25',
      });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 6: validatePreferenceValue Helper
  // ============================================================================

  describe('validatePreferenceValue Helper', () => {
    it('should validate business day settings using helper', () => {
      const result = validatePreferenceValue(
        PreferenceCategory.BusinessDaySettings,
        {
          workingDays: [1, 2, 3, 4, 5],
          holidays: ['2025-12-25'],
        }
      );

      expect(result.success).toBe(true);
    });

    it('should reject invalid business day settings using helper', () => {
      const result = validatePreferenceValue(
        PreferenceCategory.BusinessDaySettings,
        {
          workingDays: [1, 2, 3, 4, 7], // Invalid day 7
          holidays: [],
        }
      );

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Contract 7: Real-World Business Patterns
  // ============================================================================

  describe('Real-World Business Patterns', () => {
    it('should accept standard US business week (Monday-Friday)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: [
          '2025-01-01', // New Year
          '2025-07-04', // Independence Day
          '2025-12-25', // Christmas
        ],
      });

      expect(result.success).toBe(true);
    });

    it('should accept 6-day work week (Monday-Saturday)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5, 6],
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept Middle Eastern work week (Sunday-Thursday)', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [0, 1, 2, 3, 4],
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept 4-day work week', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4], // Monday-Thursday
        holidays: [],
      });

      expect(result.success).toBe(true);
    });

    it('should accept standard US federal holidays', () => {
      const usFederalHolidays = [
        '2025-01-01', // New Year's Day
        '2025-01-20', // Martin Luther King Jr. Day
        '2025-02-17', // Presidents' Day
        '2025-05-26', // Memorial Day
        '2025-06-19', // Juneteenth
        '2025-07-04', // Independence Day
        '2025-09-01', // Labor Day
        '2025-10-13', // Columbus Day
        '2025-11-11', // Veterans Day
        '2025-11-27', // Thanksgiving
        '2025-12-25', // Christmas
      ];

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: usFederalHolidays,
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 8: Performance Requirement (<1ms validation)
  // ============================================================================

  describe('Performance', () => {
    it('should validate business day settings in <2ms (median of 10 runs)', () => {
      const settings = {
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['2025-12-25', '2025-01-01'],
      };

      // Warmup runs to eliminate JIT compilation overhead
      for (let i = 0; i < 3; i++) {
        businessDaySettingsSchema.safeParse(settings);
      }

      // Measured runs
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        businessDaySettingsSchema.safeParse(settings);
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

    it('should validate large holiday list in <5ms (median of 10 runs)', () => {
      const largeHolidayList = Array.from(
        { length: 50 },
        (_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
      );

      const settings = {
        workingDays: [1, 2, 3, 4, 5],
        holidays: largeHolidayList,
      };

      // Warmup runs to eliminate JIT compilation overhead
      for (let i = 0; i < 3; i++) {
        businessDaySettingsSchema.safeParse(settings);
      }

      // Measured runs
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        businessDaySettingsSchema.safeParse(settings);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Calculate median (more robust than average against outliers)
      times.sort((a, b) => a - b);
      const median = times.length % 2 === 0
        ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
        : times[Math.floor(times.length / 2)];

      expect(median).toBeLessThan(5);
    });
  });

  // ============================================================================
  // Contract 9: Error Message Clarity
  // ============================================================================

  describe('Error Messages', () => {
    it('should provide clear error for empty working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [],
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/at least one working day/i);
      }
    });

    it('should provide clear error for invalid day of week', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 7],
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('0-6');
      }
    });

    it('should provide clear error for duplicate working days', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 3, 4],
        holidays: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/unique/i);
      }
    });

    it('should provide clear error for invalid holiday date format', () => {
      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: ['12/25/2025'],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toMatch(/ISO date format/i);
        expect(errorMessage).toContain('YYYY-MM-DD');
      }
    });

    it('should provide clear error for too many holidays', () => {
      const tooManyHolidays = Array.from(
        { length: 51 },
        (_, i) => `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
      );

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: tooManyHolidays,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(errorMessage).toContain('50');
      }
    });
  });

  // ============================================================================
  // Contract 10: Luxon Integration (Date Validation)
  // ============================================================================

  describe('Luxon Integration', () => {
    it('should use luxon DateTime for holiday date validation', () => {
      // Valid dates that luxon recognizes
      const validHolidays = [
        '2025-01-01',
        '2025-06-15',
        '2025-12-31',
        '2024-02-29', // Leap year
      ];

      const result = businessDaySettingsSchema.safeParse({
        workingDays: [1, 2, 3, 4, 5],
        holidays: validHolidays,
      });

      expect(result.success).toBe(true);
    });

    it('should reject dates that luxon marks as invalid', () => {
      const invalidHolidays = [
        '2025-02-30', // Invalid day
        '2025-13-01', // Invalid month
        '2025-02-29', // Non-leap year
      ];

      invalidHolidays.forEach((invalidDate) => {
        const result = businessDaySettingsSchema.safeParse({
          workingDays: [1, 2, 3, 4, 5],
          holidays: [invalidDate],
        });

        expect(result.success).toBe(false);
      });
    });
  });
});
