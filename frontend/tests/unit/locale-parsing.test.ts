import { describe, test, expect } from 'vitest';
import { parseDate } from '../../src/lib/date-parser';

describe('parseDate with locale', () => {
  const timezone = 'America/New_York';

  test('US mode: 01/02/2026 → 2026-01-02', () => {
    expect(parseDate('01/02/2026', timezone, { dateLocale: 'US' }))
      .toBe('2026-01-02');
  });

  test('EU mode: 01/02/2026 → 2026-02-01', () => {
    expect(parseDate('01/02/2026', timezone, { dateLocale: 'EU' }))
      .toBe('2026-02-01');
  });

  test('US mode: 12/31/2025 → 2025-12-31', () => {
    expect(parseDate('12/31/2025', timezone, { dateLocale: 'US' }))
      .toBe('2025-12-31');
  });

  test('EU mode: 31/12/2025 → 2025-12-31', () => {
    expect(parseDate('31/12/2025', timezone, { dateLocale: 'EU' }))
      .toBe('2025-12-31');
  });

  test('US mode: invalid 13/01/2026 throws', () => {
    expect(() => parseDate('13/01/2026', timezone, { dateLocale: 'US' }))
      .toThrow('Unable to parse date');
  });

  test('EU mode: invalid 32/01/2026 throws', () => {
    expect(() => parseDate('32/01/2026', timezone, { dateLocale: 'EU' }))
      .toThrow('Unable to parse date');
  });

  test('defaults to US mode when no locale specified', () => {
    expect(parseDate('01/02/2026', timezone))
      .toBe('2026-01-02'); // Jan 2, not Feb 1
  });
});
