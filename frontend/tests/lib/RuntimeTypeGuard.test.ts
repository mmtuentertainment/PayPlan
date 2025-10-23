import { describe, it, expect } from 'vitest';
import {
  validateUIInputValue,
  isValidTabValue,
  isValidRadioValue,
  validateNumericInput,
  validateDateInput,
} from '../../src/lib/validation/RuntimeTypeGuard';

describe('RuntimeTypeGuard', () => {
  // T042: Validates UI input values
  describe('validateUIInputValue', () => {
    it('should validate string inputs', () => {
      expect(validateUIInputValue('hello', 'string')).toBe(true);
      expect(validateUIInputValue(123, 'string')).toBe(false);
      expect(validateUIInputValue(null, 'string')).toBe(false);
      expect(validateUIInputValue(undefined, 'string')).toBe(false);
    });

    it('should validate number inputs', () => {
      expect(validateUIInputValue(123, 'number')).toBe(true);
      expect(validateUIInputValue(0, 'number')).toBe(true);
      expect(validateUIInputValue(-50, 'number')).toBe(true);
      expect(validateUIInputValue('123', 'number')).toBe(false);
      expect(validateUIInputValue(NaN, 'number')).toBe(false);
      expect(validateUIInputValue(Infinity, 'number')).toBe(false);
    });

    it('should validate boolean inputs', () => {
      expect(validateUIInputValue(true, 'boolean')).toBe(true);
      expect(validateUIInputValue(false, 'boolean')).toBe(true);
      expect(validateUIInputValue('true', 'boolean')).toBe(false);
      expect(validateUIInputValue(1, 'boolean')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateUIInputValue(null, 'string')).toBe(false);
      expect(validateUIInputValue(undefined, 'number')).toBe(false);
    });
  });

  // T043: Rejects invalid tab/radio values
  describe('isValidTabValue', () => {
    it('should validate tab values against allowed set', () => {
      const allowedTabs = ['home', 'settings', 'profile'] as const;

      expect(isValidTabValue('home', allowedTabs)).toBe(true);
      expect(isValidTabValue('settings', allowedTabs)).toBe(true);
      expect(isValidTabValue('profile', allowedTabs)).toBe(true);
      expect(isValidTabValue('invalid', allowedTabs)).toBe(false);
      expect(isValidTabValue('', allowedTabs)).toBe(false);
    });

    it('should handle case-sensitive validation', () => {
      const allowedTabs = ['Home', 'Settings'] as const;

      expect(isValidTabValue('Home', allowedTabs)).toBe(true);
      expect(isValidTabValue('home', allowedTabs)).toBe(false);
    });

    it('should reject non-string values', () => {
      const allowedTabs = ['tab1', 'tab2'] as const;

      // @ts-expect-error Testing runtime validation
      expect(isValidTabValue(123, allowedTabs)).toBe(false);
      // @ts-expect-error Testing runtime validation
      expect(isValidTabValue(null, allowedTabs)).toBe(false);
      // @ts-expect-error Testing runtime validation
      expect(isValidTabValue(undefined, allowedTabs)).toBe(false);
    });
  });

  describe('isValidRadioValue', () => {
    it('should validate radio values against allowed set', () => {
      const allowedOptions = ['option1', 'option2', 'option3'] as const;

      expect(isValidRadioValue('option1', allowedOptions)).toBe(true);
      expect(isValidRadioValue('option2', allowedOptions)).toBe(true);
      expect(isValidRadioValue('invalid', allowedOptions)).toBe(false);
    });

    it('should reject empty string when not in allowed set', () => {
      const allowedOptions = ['yes', 'no'] as const;

      expect(isValidRadioValue('', allowedOptions)).toBe(false);
    });

    it('should accept empty string if in allowed set', () => {
      const allowedOptions = ['', 'option1', 'option2'] as const;

      expect(isValidRadioValue('', allowedOptions)).toBe(true);
    });
  });

  describe('validateNumericInput', () => {
    it('should validate finite numeric strings', () => {
      expect(validateNumericInput('123')).toBe(true);
      expect(validateNumericInput('123.45')).toBe(true);
      expect(validateNumericInput('-50')).toBe(true);
      expect(validateNumericInput('0')).toBe(true);
    });

    it('should reject NaN and Infinity', () => {
      expect(validateNumericInput('NaN')).toBe(false);
      expect(validateNumericInput('Infinity')).toBe(false);
      expect(validateNumericInput('-Infinity')).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(validateNumericInput('abc')).toBe(false);
      expect(validateNumericInput('12.34.56')).toBe(false);
      expect(validateNumericInput('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateNumericInput('0.0')).toBe(true);
      expect(validateNumericInput('-0')).toBe(true);
      expect(validateNumericInput('1e10')).toBe(true);
      expect(validateNumericInput('1e-10')).toBe(true);
    });
  });

  describe('validateDateInput', () => {
    it('should validate ISO date strings', () => {
      expect(validateDateInput('2025-10-23')).toBe(true);
      expect(validateDateInput('2025-01-01')).toBe(true);
      expect(validateDateInput('2025-12-31')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(validateDateInput('23-10-2025')).toBe(false);
      expect(validateDateInput('10/23/2025')).toBe(false);
      expect(validateDateInput('not-a-date')).toBe(false);
      expect(validateDateInput('')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(validateDateInput('2025-13-01')).toBe(false); // Invalid month
      expect(validateDateInput('2025-02-30')).toBe(false); // Invalid day
      expect(validateDateInput('2025-00-01')).toBe(false); // Invalid month
    });

    it('should validate leap years correctly', () => {
      expect(validateDateInput('2024-02-29')).toBe(true);  // Leap year
      expect(validateDateInput('2025-02-29')).toBe(false); // Not a leap year
    });
  });
});
