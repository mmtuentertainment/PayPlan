import { describe, it, expect } from 'vitest';
import { FIXTURES } from '@/pages/demo/fixtures';

describe('Demo Fixtures', () => {
  it('returns 10 fixtures', () => {
    expect(FIXTURES).toHaveLength(10);
  });

  it('all fixtures have valid structure', () => {
    FIXTURES.forEach(fixture => {
      expect(fixture).toHaveProperty('id');
      expect(fixture).toHaveProperty('provider');
      expect(fixture).toHaveProperty('emailText');
      expect(typeof fixture.id).toBe('string');
      expect(typeof fixture.provider).toBe('string');
      expect(typeof fixture.emailText).toBe('string');
      expect(fixture.id.length).toBeGreaterThan(0);
      expect(fixture.provider.length).toBeGreaterThan(0);
      expect(fixture.emailText.length).toBeGreaterThan(0);
    });
  });

  it('provider coverage - at least 5 different providers', () => {
    const providers = new Set(FIXTURES.map(f => f.provider));
    expect(providers.size).toBeGreaterThanOrEqual(5);
  });

  it('IDs are unique', () => {
    const ids = FIXTURES.map(f => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('no PII detected', () => {
    const piiPatterns = [
      /@gmail\.com/i,
      /@yahoo\.com/i,
      /@hotmail\.com/i,
      /\d{3}-\d{3}-\d{4}/,
      /\b(John|Jane|Mary|Michael|Sarah|David|Lisa)\b/i
    ];

    FIXTURES.forEach(fixture => {
      piiPatterns.forEach(pattern => {
        expect(fixture.emailText).not.toMatch(pattern);
      });
    });
  });

  it('risk coverage - at least 2 fixtures share a due date', () => {
    const dates = FIXTURES.map(f => {
      const match = f.emailText.match(/due on ([A-Z][a-z]+ \d+, \d{4})/);
      return match ? match[1] : null;
    }).filter(Boolean);

    const dateCounts = new Map<string, number>();
    dates.forEach(date => {
      if (date) {
        dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
      }
    });

    const hasDuplicateDate = Array.from(dateCounts.values()).some(count => count > 1);
    expect(hasDuplicateDate).toBe(true);
  });

  it('weekend autopay coverage - at least 1 fixture has autopay and weekend date', () => {
    const hasWeekendAutopay = FIXTURES.some(f => {
      const hasAutopay = /autopay.*enabled|autopay.*yes|auto-pay.*enabled/i.test(f.emailText);
      const hasDate18 = /october 18/i.test(f.emailText);
      return hasAutopay && hasDate18;
    });

    expect(hasWeekendAutopay).toBe(true);
  });
});
