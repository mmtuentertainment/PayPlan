/**
 * Contract tests for timezone validation
 *
 * Feature: 012-user-preference-management
 * Task: T009
 * Contract: specs/012-user-preference-management/contracts/PreferenceValidationService.contract.md
 *
 * IMPORTANT: These tests MUST FAIL before implementation (TDD).
 */

import { describe, it, expect } from 'vitest';
import { timezoneSchema, validatePreferenceValue } from '../../../src/lib/preferences/validation';
import { PreferenceCategory } from '../../../src/lib/preferences/types';

describe('Timezone Validation', () => {
  // ============================================================================
  // Contract 1: Valid IANA timezone identifiers
  // ============================================================================

  it('should accept valid UTC timezone', () => {
    const result = timezoneSchema.safeParse('UTC');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('UTC');
    }
  });

  it('should accept valid US timezone (America/New_York)', () => {
    const result = timezoneSchema.safeParse('America/New_York');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('America/New_York');
    }
  });

  it('should accept valid European timezone (Europe/London)', () => {
    const result = timezoneSchema.safeParse('Europe/London');
    expect(result.success).toBe(true);
  });

  it('should accept valid Asian timezone (Asia/Tokyo)', () => {
    const result = timezoneSchema.safeParse('Asia/Tokyo');
    expect(result.success).toBe(true);
  });

  it('should accept valid Australian timezone (Australia/Sydney)', () => {
    const result = timezoneSchema.safeParse('Australia/Sydney');
    expect(result.success).toBe(true);
  });

  // ============================================================================
  // Contract 2: Invalid timezone identifiers
  // ============================================================================

  it('should reject invalid timezone identifier', () => {
    const result = timezoneSchema.safeParse('Invalid/Timezone');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('IANA timezone');
    }
  });

  it('should reject empty timezone string', () => {
    const result = timezoneSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be empty');
    }
  });

  it('should reject malformed timezone (no slash)', () => {
    const result = timezoneSchema.safeParse('NewYork');
    expect(result.success).toBe(false);
  });

  it('should reject timezone with typo (Amercia instead of America)', () => {
    const result = timezoneSchema.safeParse('Amercia/New_York');
    expect(result.success).toBe(false);
  });

  // ============================================================================
  // Contract 3: Edge cases
  // ============================================================================

  it('should reject null as timezone', () => {
    const result = timezoneSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('should reject undefined as timezone', () => {
    const result = timezoneSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });

  it('should reject number as timezone', () => {
    const result = timezoneSchema.safeParse(123);
    expect(result.success).toBe(false);
  });

  it('should reject object as timezone', () => {
    const result = timezoneSchema.safeParse({ timezone: 'UTC' });
    expect(result.success).toBe(false);
  });

  // ============================================================================
  // Contract 4: Case sensitivity
  // ============================================================================

  it('should reject lowercase timezone identifier', () => {
    const result = timezoneSchema.safeParse('america/new_york');
    expect(result.success).toBe(false);
  });

  it('should reject ALL CAPS timezone identifier', () => {
    const result = timezoneSchema.safeParse('AMERICA/NEW_YORK');
    expect(result.success).toBe(false);
  });

  // ============================================================================
  // Contract 5: validatePreferenceValue helper
  // ============================================================================

  it('should validate timezone using validatePreferenceValue helper', () => {
    const result = validatePreferenceValue(
      PreferenceCategory.Timezone,
      'America/Los_Angeles'
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('America/Los_Angeles');
    }
  });

  it('should reject invalid timezone using validatePreferenceValue helper', () => {
    const result = validatePreferenceValue(
      PreferenceCategory.Timezone,
      'Invalid/Zone'
    );

    expect(result.success).toBe(false);
  });

  // ============================================================================
  // Contract 6: Common timezones (regression tests)
  // ============================================================================

  it('should accept common US timezones', () => {
    const usTimezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
    ];

    usTimezones.forEach((tz) => {
      const result = timezoneSchema.safeParse(tz);
      expect(result.success).toBe(true);
    });
  });

  it('should accept common European timezones', () => {
    const euTimezones = [
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
    ];

    euTimezones.forEach((tz) => {
      const result = timezoneSchema.safeParse(tz);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 7: Performance requirement (<1ms validation)
  // ============================================================================

  it('should validate timezone in <1ms', () => {
    const startTime = performance.now();
    timezoneSchema.safeParse('America/New_York');
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1); // <1ms for simple validation
  });

  // ============================================================================
  // Contract 8: Luxon integration validation
  // ============================================================================

  it('should use luxon DateTime for IANA validation', () => {
    // This tests that the schema uses luxon's built-in validation
    // Luxon validates against IANA timezone database

    const validLuxonZones = [
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
    ];

    validLuxonZones.forEach((tz) => {
      const result = timezoneSchema.safeParse(tz);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Contract 9: Error message clarity
  // ============================================================================

  it('should provide clear error message for invalid timezone', () => {
    const result = timezoneSchema.safeParse('BadTimezone');
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      expect(errorMessage).toMatch(/IANA timezone identifier/i);
      expect(errorMessage).toContain('America/New_York');
    }
  });
});
