import { describe, test, expect } from 'vitest';
import { parseDate } from '../../src/lib/extraction/extractors/date';

const timezone = 'America/New_York';

describe('Locale parsing edge cases (financial validation)', () => {
  describe('Month boundary edge cases', () => {
    test('US: 01/31/2026 → Jan 31, 2026', () => {
      expect(parseDate('01/31/2026', timezone, { dateLocale: 'US' }))
        .toBe('2026-01-31');
    });

    test('EU: 31/01/2026 → Jan 31, 2026', () => {
      expect(parseDate('31/01/2026', timezone, { dateLocale: 'EU' }))
        .toBe('2026-01-31');
    });

    test('US: 04/30/2026 → Apr 30, 2026 (last day of April)', () => {
      expect(parseDate('04/30/2026', timezone, { dateLocale: 'US' }))
        .toBe('2026-04-30');
    });

    test('EU: 30/04/2026 → Apr 30, 2026', () => {
      expect(parseDate('30/04/2026', timezone, { dateLocale: 'EU' }))
        .toBe('2026-04-30');
    });

    test('US: 04/31/2026 → throws (April only has 30 days)', () => {
      expect(() => parseDate('04/31/2026', timezone, { dateLocale: 'US' }))
        .toThrow();
    });

    test('EU: 31/04/2026 → throws (April only has 30 days)', () => {
      expect(() => parseDate('31/04/2026', timezone, { dateLocale: 'EU' }))
        .toThrow();
    });
  });

  describe('Cross-locale parsing (THE core feature)', () => {
    test('03/04/2026: US=March 4, EU=April 3 (DIFFERENT dates)', () => {
      const us = parseDate('03/04/2026', timezone, { dateLocale: 'US' });
      const eu = parseDate('03/04/2026', timezone, { dateLocale: 'EU' });
      expect(us).toBe('2026-03-04'); // March 4
      expect(eu).toBe('2026-04-03'); // April 3
      expect(us).not.toBe(eu); // CRITICAL: Must differ!
    });

    test('06/07/2026: US=June 7, EU=July 6 (DIFFERENT dates)', () => {
      const us = parseDate('06/07/2026', timezone, { dateLocale: 'US' });
      const eu = parseDate('06/07/2026', timezone, { dateLocale: 'EU' });
      expect(us).toBe('2026-06-07'); // June 7
      expect(eu).toBe('2026-07-06'); // July 6
      expect(us).not.toBe(eu); // CRITICAL: Must differ!
    });

    test('01/12/2026: US=January 12, EU=December 1 (DIFFERENT dates)', () => {
      const us = parseDate('01/12/2026', timezone, { dateLocale: 'US' });
      const eu = parseDate('01/12/2026', timezone, { dateLocale: 'EU' });
      expect(us).toBe('2026-01-12'); // January 12
      expect(eu).toBe('2026-12-01'); // December 1
      expect(us).not.toBe(eu); // CRITICAL: Must differ!
    });

    test('02/05/2027: US=February 5, EU=May 2 (DIFFERENT dates)', () => {
      const us = parseDate('02/05/2027', timezone, { dateLocale: 'US' });
      const eu = parseDate('02/05/2027', timezone, { dateLocale: 'EU' });
      expect(us).toBe('2027-02-05'); // February 5
      expect(eu).toBe('2027-05-02'); // May 2
      expect(us).not.toBe(eu); // CRITICAL: Must differ!
    });
  });

  describe('Ambiguous date collision (critical financial risk)', () => {
    test('12/12/2026 is same in both locales (Dec 12)', () => {
      const us = parseDate('12/12/2026', timezone, { dateLocale: 'US' });
      const eu = parseDate('12/12/2026', timezone, { dateLocale: 'EU' });
      expect(us).toBe(eu);
      expect(us).toBe('2026-12-12');
    });

    test('11/11/2026 is same in both locales (Nov 11)', () => {
      const us = parseDate('11/11/2026', timezone, { dateLocale: 'US' });
      const eu = parseDate('11/11/2026', timezone, { dateLocale: 'EU' });
      expect(us).toBe(eu);
      expect(us).toBe('2026-11-11');
    });

    test('01/13/2026 is INVALID in EU (no 13th month)', () => {
      expect(() => parseDate('01/13/2026', timezone, { dateLocale: 'EU' }))
        .toThrow();
    });

    test('13/01/2026 is INVALID in US (no 13th month)', () => {
      expect(() => parseDate('13/01/2026', timezone, { dateLocale: 'US' }))
        .toThrow();
    });

    test('US: 01/13/2026 → Jan 13, 2026', () => {
      expect(parseDate('01/13/2026', timezone, { dateLocale: 'US' }))
        .toBe('2026-01-13');
    });

    test('EU: 13/01/2026 → Jan 13, 2026', () => {
      expect(parseDate('13/01/2026', timezone, { dateLocale: 'EU' }))
        .toBe('2026-01-13');
    });
  });

  describe('Year boundary edge cases', () => {
    test('US: 12/31/2025 → Dec 31, 2025', () => {
      expect(parseDate('12/31/2025', timezone, { dateLocale: 'US' }))
        .toBe('2025-12-31');
    });

    test('EU: 31/12/2025 → Dec 31, 2025', () => {
      expect(parseDate('31/12/2025', timezone, { dateLocale: 'EU' }))
        .toBe('2025-12-31');
    });

    test('US: 01/01/2026 → Jan 1, 2026', () => {
      expect(parseDate('01/01/2026', timezone, { dateLocale: 'US' }))
        .toBe('2026-01-01');
    });

    test('EU: 01/01/2026 → Jan 1, 2026', () => {
      expect(parseDate('01/01/2026', timezone, { dateLocale: 'EU' }))
        .toBe('2026-01-01');
    });
  });

  describe('Invalid date formats', () => {
    test('US: 00/15/2026 → throws (no month 0)', () => {
      expect(() => parseDate('00/15/2026', timezone, { dateLocale: 'US' }))
        .toThrow();
    });

    test('EU: 15/00/2026 → throws (no month 0)', () => {
      expect(() => parseDate('15/00/2026', timezone, { dateLocale: 'EU' }))
        .toThrow();
    });

    test('US: 15/00/2026 → throws (no day 0)', () => {
      expect(() => parseDate('15/00/2026', timezone, { dateLocale: 'US' }))
        .toThrow();
    });

    test('EU: 00/15/2026 → throws (no day 0)', () => {
      expect(() => parseDate('00/15/2026', timezone, { dateLocale: 'EU' }))
        .toThrow();
    });
  });
});
