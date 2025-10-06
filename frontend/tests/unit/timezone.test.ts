import { describe, it, expect } from 'vitest';
import {
  validateTimezone,
  toTimezoneAwareISO,
  isValidDate,
  getTimezoneOffset,
  isInDST
} from '../../src/lib/extraction/helpers/timezone';

describe('validateTimezone', () => {
  it('accepts valid IANA timezone strings', () => {
    expect(validateTimezone('America/New_York')).toBe('America/New_York');
    expect(validateTimezone('Europe/London')).toBe('Europe/London');
    expect(validateTimezone('Asia/Tokyo')).toBe('Asia/Tokyo');
    expect(validateTimezone('UTC')).toBe('UTC');
    expect(validateTimezone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('rejects invalid timezone strings', () => {
    expect(() => validateTimezone('EST')).toThrow('Invalid timezone');
    expect(() => validateTimezone('PST')).toThrow('Invalid timezone');
    expect(() => validateTimezone('GMT+5')).toThrow('Invalid timezone');
    expect(() => validateTimezone('Invalid/Zone')).toThrow('Invalid timezone');
  });

  it('rejects empty or non-string input', () => {
    expect(() => validateTimezone('')).toThrow('must be a non-empty string');
    expect(() => validateTimezone(null as any)).toThrow('must be a non-empty string');
    expect(() => validateTimezone(undefined as any)).toThrow('must be a non-empty string');
  });
});

describe('toTimezoneAwareISO', () => {
  it('converts ISO date to timezone-aware format', () => {
    const result = toTimezoneAwareISO('2025-10-06', 'America/New_York');
    expect(result).toMatch(/^2025-10-06T00:00:00\.000[-+]\d{2}:\d{2}$/);
    expect(result).toContain('2025-10-06');
  });

  it('converts US slash-separated dates (MM/DD/YYYY)', () => {
    const result = toTimezoneAwareISO('10/06/2025', 'America/New_York', 'US');
    expect(result).toContain('2025-10-06');
  });

  it('converts EU slash-separated dates (DD/MM/YYYY)', () => {
    const result = toTimezoneAwareISO('06/10/2025', 'Europe/London', 'EU');
    expect(result).toContain('2025-10-06');
  });

  it('differentiates US vs EU date formats correctly', () => {
    // US: 01/02/2025 → January 2, 2025
    const usDate = toTimezoneAwareISO('01/02/2025', 'America/New_York', 'US');
    expect(usDate).toContain('2025-01-02');

    // EU: 01/02/2025 → February 1, 2025
    const euDate = toTimezoneAwareISO('01/02/2025', 'Europe/London', 'EU');
    expect(euDate).toContain('2025-02-01');
  });

  it('handles different timezones correctly', () => {
    const nyDate = toTimezoneAwareISO('2025-10-06', 'America/New_York');
    const tokyoDate = toTimezoneAwareISO('2025-10-06', 'Asia/Tokyo');

    // New York should have negative offset (west of UTC)
    expect(nyDate).toMatch(/-\d{2}:\d{2}$/);

    // Tokyo should have positive offset (east of UTC)
    expect(tokyoDate).toMatch(/\+\d{2}:\d{2}$/);
  });

  it('throws on invalid date format', () => {
    expect(() => toTimezoneAwareISO('invalid', 'America/New_York')).toThrow('Unsupported date format');
    expect(() => toTimezoneAwareISO('2025/10/06', 'America/New_York')).toThrow('Unsupported date format');
    expect(() => toTimezoneAwareISO('Oct 6 2025', 'America/New_York')).toThrow('Unsupported date format');
  });

  it('throws on invalid date values', () => {
    expect(() => toTimezoneAwareISO('2025-02-30', 'America/New_York')).toThrow('Invalid date');
    expect(() => toTimezoneAwareISO('2025-13-01', 'America/New_York')).toThrow('Invalid date');
    expect(() => toTimezoneAwareISO('13/32/2025', 'America/New_York', 'US')).toThrow('Invalid date');
  });

  it('throws on invalid timezone', () => {
    expect(() => toTimezoneAwareISO('2025-10-06', 'EST')).toThrow('Invalid timezone');
  });

  it('defaults to US locale when not specified', () => {
    const result = toTimezoneAwareISO('01/02/2025', 'America/New_York');
    expect(result).toContain('2025-01-02'); // January 2 (US format)
  });
});

describe('isValidDate', () => {
  it('returns true for valid dates', () => {
    expect(isValidDate(2025, 10, 6)).toBe(true);
    expect(isValidDate(2025, 1, 1)).toBe(true);
    expect(isValidDate(2025, 12, 31)).toBe(true);
  });

  it('returns false for February 30', () => {
    expect(isValidDate(2025, 2, 30)).toBe(false);
    expect(isValidDate(2025, 2, 31)).toBe(false);
  });

  it('returns false for invalid months', () => {
    expect(isValidDate(2025, 0, 1)).toBe(false);
    expect(isValidDate(2025, 13, 1)).toBe(false);
  });

  it('returns false for invalid days', () => {
    expect(isValidDate(2025, 4, 31)).toBe(false); // April has 30 days
    expect(isValidDate(2025, 6, 31)).toBe(false); // June has 30 days
    expect(isValidDate(2025, 1, 0)).toBe(false);
    expect(isValidDate(2025, 1, 32)).toBe(false);
  });

  it('handles leap years correctly', () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);  // 2024 is leap year
    expect(isValidDate(2025, 2, 29)).toBe(false); // 2025 is not leap year
    expect(isValidDate(2000, 2, 29)).toBe(true);  // 2000 is leap year
    expect(isValidDate(1900, 2, 29)).toBe(false); // 1900 is not leap year (century rule)
  });
});

describe('getTimezoneOffset', () => {
  it('returns offset for New York in winter (EST)', () => {
    const offset = getTimezoneOffset('2025-01-15', 'America/New_York');
    expect(offset).toBe('UTC-5'); // EST is UTC-5
  });

  it('returns offset for New York in summer (EDT)', () => {
    const offset = getTimezoneOffset('2025-07-15', 'America/New_York');
    expect(offset).toBe('UTC-4'); // EDT is UTC-4
  });

  it('returns offset for Tokyo (no DST)', () => {
    const winterOffset = getTimezoneOffset('2025-01-15', 'Asia/Tokyo');
    const summerOffset = getTimezoneOffset('2025-07-15', 'Asia/Tokyo');
    expect(winterOffset).toBe('UTC+9');
    expect(summerOffset).toBe('UTC+9'); // Japan doesn't use DST
  });

  it('returns offset for London in winter (GMT)', () => {
    const offset = getTimezoneOffset('2025-01-15', 'Europe/London');
    expect(offset).toBe('UTC+0'); // GMT is UTC+0
  });

  it('returns offset for London in summer (BST)', () => {
    const offset = getTimezoneOffset('2025-07-15', 'Europe/London');
    expect(offset).toBe('UTC+1'); // BST is UTC+1
  });

  it('throws on invalid date', () => {
    expect(() => getTimezoneOffset('invalid', 'America/New_York')).toThrow('Invalid date');
  });
});

describe('isInDST', () => {
  it('returns true for New York in summer', () => {
    expect(isInDST('2025-07-01', 'America/New_York')).toBe(true);
    expect(isInDST('2025-08-15', 'America/New_York')).toBe(true);
  });

  it('returns false for New York in winter', () => {
    expect(isInDST('2025-01-01', 'America/New_York')).toBe(false);
    expect(isInDST('2025-12-25', 'America/New_York')).toBe(false);
  });

  it('returns false for Tokyo (no DST)', () => {
    expect(isInDST('2025-07-01', 'Asia/Tokyo')).toBe(false);
    expect(isInDST('2025-01-01', 'Asia/Tokyo')).toBe(false);
  });

  it('throws on invalid date', () => {
    expect(() => isInDST('invalid', 'America/New_York')).toThrow('Invalid date');
  });
});

describe('Timezone edge cases', () => {
  it('handles midnight boundary correctly', () => {
    const midnight = toTimezoneAwareISO('2025-10-06', 'America/New_York');
    expect(midnight).toContain('T00:00:00.000');
  });

  it('handles DST transition date (spring forward)', () => {
    // March 9, 2025: DST starts in US (2am → 3am)
    const beforeDST = getTimezoneOffset('2025-03-08', 'America/New_York');
    const afterDST = getTimezoneOffset('2025-03-10', 'America/New_York');
    expect(beforeDST).toBe('UTC-5'); // EST
    expect(afterDST).toBe('UTC-4');  // EDT
  });

  it('handles DST transition date (fall back)', () => {
    // November 2, 2025: DST ends in US (2am → 1am)
    const duringDST = getTimezoneOffset('2025-11-01', 'America/New_York');
    const afterDST = getTimezoneOffset('2025-11-03', 'America/New_York');
    expect(duringDST).toBe('UTC-4'); // EDT
    expect(afterDST).toBe('UTC-5');  // EST
  });

  it('handles dates far in the future', () => {
    const future = toTimezoneAwareISO('2050-12-31', 'America/New_York');
    expect(future).toContain('2050-12-31');
  });

  it('handles dates in the past', () => {
    const past = toTimezoneAwareISO('2020-01-01', 'America/New_York');
    expect(past).toContain('2020-01-01');
  });
});
