import { describe, test, expect, beforeEach } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { extractionCache } from '../../src/lib/extraction/helpers/cache';
import { KLARNA_FULL, scaleEmail } from '../fixtures/email-samples';
import { DEFAULT_TIMEZONE } from '../fixtures/mock-items';

describe('Cache Integration', () => {
  const timezone = DEFAULT_TIMEZONE;
  const klarnaEmail = KLARNA_FULL;

  beforeEach(() => {
    extractionCache.clear();
  });

  test('cache miss on first extraction', () => {
    const statsBefore = extractionCache.getStats();
    expect(statsBefore.misses).toBe(0);
    expect(statsBefore.hits).toBe(0);

    extractItemsFromEmails(klarnaEmail, timezone);

    const statsAfter = extractionCache.getStats();
    expect(statsAfter.misses).toBe(1); // Cache miss
    expect(statsAfter.hits).toBe(0);
    expect(statsAfter.size).toBe(1); // Result now cached
  });

  test('cache hit on second extraction (same input)', () => {
    // First extraction - cache miss
    const result1 = extractItemsFromEmails(klarnaEmail, timezone);
    expect(result1.items.length).toBe(1);

    const statsAfterFirst = extractionCache.getStats();
    expect(statsAfterFirst.misses).toBe(1);
    expect(statsAfterFirst.hits).toBe(0);

    // Second extraction - cache hit
    const result2 = extractItemsFromEmails(klarnaEmail, timezone);
    expect(result2.items.length).toBe(1);
    expect(result2.items[0].id).toBe(result1.items[0].id); // Same UUID

    const statsAfterSecond = extractionCache.getStats();
    expect(statsAfterSecond.hits).toBe(1); // Cache hit!
    expect(statsAfterSecond.misses).toBe(1);
    expect(statsAfterSecond.hitRateRaw).toBe(50); // 1 hit / 2 total = 50%
  });

  test('different timezone creates cache miss', () => {
    extractItemsFromEmails(klarnaEmail, 'America/New_York');
    expect(extractionCache.getStats().hits).toBe(0);

    extractItemsFromEmails(klarnaEmail, 'Europe/London');
    expect(extractionCache.getStats().hits).toBe(0); // Still no hits (different key)
    expect(extractionCache.getStats().misses).toBe(2);
  });

  test('different locale creates cache miss', () => {
    extractItemsFromEmails(klarnaEmail, timezone, { dateLocale: 'US' });
    expect(extractionCache.getStats().hits).toBe(0);

    extractItemsFromEmails(klarnaEmail, timezone, { dateLocale: 'EU' });
    expect(extractionCache.getStats().hits).toBe(0); // Different locale = different key
    expect(extractionCache.getStats().misses).toBe(2);
  });

  test('bypassCache option skips cache read', () => {
    // First extraction - populates cache
    const result1 = extractItemsFromEmails(klarnaEmail, timezone);
    expect(extractionCache.getStats().size).toBe(1);

    // Second extraction with bypassCache - should not read from cache
    const result2 = extractItemsFromEmails(klarnaEmail, timezone, { bypassCache: true });

    // Should have different UUIDs (fresh extraction)
    expect(result2.items[0].id).not.toBe(result1.items[0].id);

    // Stats should show no new hits (cache was bypassed for read)
    const stats = extractionCache.getStats();
    expect(stats.hits).toBe(0); // No cache hits
    expect(stats.misses).toBe(1); // Only first extraction counted as miss
  });

  test('bypassCache option skips cache write', () => {
    // Extract with bypassCache - should not populate cache
    extractItemsFromEmails(klarnaEmail, timezone, { bypassCache: true });
    expect(extractionCache.getStats().size).toBe(0); // Not cached

    // Second extraction without bypass - should miss cache
    extractItemsFromEmails(klarnaEmail, timezone);
    expect(extractionCache.getStats().misses).toBe(1); // Cache miss
  });

  test('cache stores full result including issues', () => {
    const mixedInput = `
      ${klarnaEmail}
      ---
      Invalid email with no provider or amount
    `;

    const result1 = extractItemsFromEmails(mixedInput, timezone);
    expect(result1.items.length).toBe(1);
    expect(result1.issues.length).toBe(1);

    // Second extraction - should get cached result with issues
    const result2 = extractItemsFromEmails(mixedInput, timezone);
    expect(result2.items.length).toBe(1);
    expect(result2.issues.length).toBe(1);
    expect(result2.issues[0].reason).toBe(result1.issues[0].reason);
  });

  test('performance: cache is significantly faster', () => {
    const largeEmail = scaleEmail(klarnaEmail, 'large'); // 10x larger input

    // First extraction (no cache)
    const start1 = performance.now();
    extractItemsFromEmails(largeEmail, timezone);
    const duration1 = performance.now() - start1;

    // Second extraction (cached)
    const start2 = performance.now();
    extractItemsFromEmails(largeEmail, timezone);
    const duration2 = performance.now() - start2;

    // Cached version should be at least 2x faster
    // (typically 10-100x faster, but conservative check for CI)
    expect(duration2).toBeLessThan(duration1 / 2);
  });
});
