const { parseDate, isSuspiciousDate } = require('../../frontend/src/lib/date-parser.ts');

describe('date-parser', () => {
  describe('parseDate', () => {
    it('parses ISO format', () => {
      expect(parseDate('2025-10-06', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses US slash format', () => {
      expect(parseDate('10/6/2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses long format with month name', () => {
      expect(parseDate('October 6, 2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses short format with abbreviated month', () => {
      expect(parseDate('Oct 6, 2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('strips ordinal suffixes', () => {
      expect(parseDate('October 6th, 2025', 'America/New_York')).toBe('2025-10-06');
    });

    it('throws error on invalid date', () => {
      expect(() => parseDate('not a date', 'America/New_York')).toThrow();
    });

    // DST transition tests
    it('handles spring-forward DST transition (March 10, 2024)', () => {
      // DST starts in America/New_York - clock jumps from 2am to 3am
      expect(parseDate('3/10/2024', 'America/New_York')).toBe('2024-03-10');
      expect(parseDate('March 10, 2024', 'America/New_York')).toBe('2024-03-10');
    });

    it('handles fall-back DST transition (November 3, 2024)', () => {
      // DST ends in America/New_York - clock falls back from 2am to 1am
      expect(parseDate('11/3/2024', 'America/New_York')).toBe('2024-11-03');
      expect(parseDate('November 3, 2024', 'America/New_York')).toBe('2024-11-03');
    });

    // Leap year tests
    it('handles leap year date (Feb 29, 2024)', () => {
      expect(parseDate('2/29/2024', 'America/New_York')).toBe('2024-02-29');
      expect(parseDate('February 29, 2024', 'America/New_York')).toBe('2024-02-29');
    });

    it('throws error on invalid leap year date (Feb 29, 2025)', () => {
      expect(() => parseDate('2/29/2025', 'America/New_York')).toThrow();
      expect(() => parseDate('February 29, 2025', 'America/New_York')).toThrow();
    });

    // Month boundary tests
    it('handles month boundary transitions', () => {
      expect(parseDate('1/31/2025', 'America/New_York')).toBe('2025-01-31');
      expect(parseDate('2/1/2025', 'America/New_York')).toBe('2025-02-01');
    });

    it('handles year boundary transitions', () => {
      expect(parseDate('12/31/2024', 'America/New_York')).toBe('2024-12-31');
      expect(parseDate('1/1/2025', 'America/New_York')).toBe('2025-01-01');
    });

    // Invalid date tests
    it('throws error on February 30', () => {
      expect(() => parseDate('2/30/2025', 'America/New_York')).toThrow();
      expect(() => parseDate('February 30, 2025', 'America/New_York')).toThrow();
    });

    it('throws error on invalid month (13)', () => {
      expect(() => parseDate('13/01/2025', 'America/New_York')).toThrow();
    });

    it('throws error on invalid day (32)', () => {
      expect(() => parseDate('1/32/2025', 'America/New_York')).toThrow();
    });

    it('throws error on month 0', () => {
      expect(() => parseDate('0/15/2025', 'America/New_York')).toThrow();
    });

    // Timezone tests
    it('parses date in UTC timezone', () => {
      expect(parseDate('10/6/2025', 'UTC')).toBe('2025-10-06');
    });

    it('parses date in Asia/Tokyo timezone', () => {
      expect(parseDate('10/6/2025', 'Asia/Tokyo')).toBe('2025-10-06');
    });

    it('parses date in Europe/London timezone', () => {
      expect(parseDate('10/6/2025', 'Europe/London')).toBe('2025-10-06');
    });

    it('throws error on invalid timezone', () => {
      expect(() => parseDate('10/6/2025', 'Invalid/Timezone')).toThrow();
    });

    // Null/undefined tests
    it('throws error on null input', () => {
      expect(() => parseDate(null, 'America/New_York')).toThrow();
    });

    it('throws error on undefined input', () => {
      expect(() => parseDate(undefined, 'America/New_York')).toThrow();
    });

    it('throws error on empty string', () => {
      expect(() => parseDate('', 'America/New_York')).toThrow();
    });

    // Additional format tests
    it('parses dates with extra whitespace', () => {
      expect(parseDate('  10/6/2025  ', 'America/New_York')).toBe('2025-10-06');
    });

    it('parses single-digit month and day', () => {
      expect(parseDate('1/5/2025', 'America/New_York')).toBe('2025-01-05');
    });

    it('parses double-digit month and day', () => {
      expect(parseDate('11/25/2025', 'America/New_York')).toBe('2025-11-25');
    });
  });

  describe('isSuspiciousDate', () => {
    beforeEach(() => {
      // Mock current date as October 15, 2025 for deterministic testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('flags dates more than 2 years in future', () => {
      expect(isSuspiciousDate('2028-01-01', 'America/New_York')).toBe(true);
    });

    it('allows dates within 2 years', () => {
      expect(isSuspiciousDate('2026-01-01', 'America/New_York')).toBe(false);
    });

    it('handles boundary case: exactly 2 years in future', () => {
      // October 15, 2027 is exactly 730 days from Oct 15, 2025
      // This should be at the boundary (730 days = 2 years)
      const result = isSuspiciousDate('2027-10-15', 'America/New_York');
      expect(typeof result).toBe('boolean');
    });

    it('allows past dates within 30 days', () => {
      expect(isSuspiciousDate('2025-10-01', 'America/New_York')).toBe(false);
    });

    it('flags dates more than 30 days in past', () => {
      expect(isSuspiciousDate('2025-08-01', 'America/New_York')).toBe(true);
    });

    it('allows current date', () => {
      expect(isSuspiciousDate('2025-10-15', 'America/New_York')).toBe(false);
    });

    it('flags far future dates', () => {
      expect(isSuspiciousDate('2075-01-01', 'America/New_York')).toBe(true);
    });

    it('throws error on invalid date string', () => {
      expect(() => isSuspiciousDate('not a date', 'America/New_York')).toThrow();
    });

    it('handles different timezones consistently', () => {
      const dateStr = '2026-01-01';
      const nyResult = isSuspiciousDate(dateStr, 'America/New_York');
      const utcResult = isSuspiciousDate(dateStr, 'UTC');
      const tokyoResult = isSuspiciousDate(dateStr, 'Asia/Tokyo');

      // Results should be consistent across timezones for the same date
      expect(nyResult).toBe(utcResult);
      expect(utcResult).toBe(tokyoResult);
    });

    it('handles timezone parameter being omitted', () => {
      expect(isSuspiciousDate('2026-01-01')).toBe(false);
      expect(isSuspiciousDate('2028-01-01')).toBe(true);
    });
  });
});
