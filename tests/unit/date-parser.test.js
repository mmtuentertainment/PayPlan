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
  });

  describe('isSuspiciousDate', () => {
    it('flags dates more than 2 years in future', () => {
      expect(isSuspiciousDate('2028-01-01')).toBe(true);
    });

    it('allows dates within 2 years', () => {
      expect(isSuspiciousDate('2026-01-01')).toBe(false);
    });
  });
});
