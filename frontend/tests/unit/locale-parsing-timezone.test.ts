import { describe, test, expect } from 'vitest';
import { parseDate } from '../../src/lib/date-parser';

describe('Locale parsing with timezone & DST boundaries', () => {
  const timezone = 'America/New_York';

  describe('DST boundaries (spring forward & fall back)', () => {
    test('ISO date remains stable across locale for spring forward (Mar 8, 2026)', () => {
      const isoDate = '2026-03-08'; // Future DST boundary

      // ISO dates should parse identically regardless of locale
      expect(parseDate(isoDate, timezone, { dateLocale: 'US' })).toBe('2026-03-08');
      expect(parseDate(isoDate, timezone, { dateLocale: 'EU' })).toBe('2026-03-08');
    });

    test('ISO date remains stable across locale for fall back (Nov 1, 2026)', () => {
      const isoDate = '2026-11-01'; // Future fall back date

      // ISO dates should parse identically regardless of locale
      expect(parseDate(isoDate, timezone, { dateLocale: 'US' })).toBe('2026-11-01');
      expect(parseDate(isoDate, timezone, { dateLocale: 'EU' })).toBe('2026-11-01');
    });

    test('ambiguous date "03/08/2026" differs by locale even during DST', () => {
      // US: March 8 (spring forward date)
      expect(parseDate('03/08/2026', timezone, { dateLocale: 'US' })).toBe('2026-03-08');

      // EU: August 3 (different date)
      expect(parseDate('03/08/2026', timezone, { dateLocale: 'EU' })).toBe('2026-08-03');
    });

    test('ambiguous date "11/01/2026" differs by locale even during fall back', () => {
      // US: November 1 (fall back date)
      expect(parseDate('11/01/2026', timezone, { dateLocale: 'US' })).toBe('2026-11-01');

      // EU: January 11
      expect(parseDate('11/01/2026', timezone, { dateLocale: 'EU' })).toBe('2026-01-11');
    });
  });

  describe('Financial integrity: amounts unaffected by locale', () => {
    test('locale change does not affect date parsing of unambiguous formats', () => {
      const longDate = 'March 8, 2026';

      // Long-form dates are unambiguous and should parse the same
      expect(parseDate(longDate, timezone, { dateLocale: 'US' })).toBe('2026-03-08');
      expect(parseDate(longDate, timezone, { dateLocale: 'EU' })).toBe('2026-03-08');
    });

    test('ISO dates are locale-independent', () => {
      const dates = ['2026-01-15', '2026-06-30', '2026-12-25'];

      dates.forEach(date => {
        const usResult = parseDate(date, timezone, { dateLocale: 'US' });
        const euResult = parseDate(date, timezone, { dateLocale: 'EU' });

        expect(usResult).toBe(euResult);
        expect(usResult).toBe(date); // Should return the same ISO date
      });
    });
  });

  describe('Cross-timezone consistency', () => {
    test('same ambiguous date across different timezones', () => {
      const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC'];
      const ambiguousDate = '06/07/2026';

      timezones.forEach(tz => {
        // US: June 7
        expect(parseDate(ambiguousDate, tz, { dateLocale: 'US' })).toBe('2026-06-07');

        // EU: July 6
        expect(parseDate(ambiguousDate, tz, { dateLocale: 'EU' })).toBe('2026-07-06');
      });
    });
  });
});
