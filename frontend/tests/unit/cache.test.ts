import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ExtractionCache } from '../../src/lib/extraction/helpers/cache';
import type { ExtractionResult } from '../../src/lib/email-extractor';
import { createMockResult, KLARNA_ITEM } from '../fixtures/mock-items';
import { KLARNA_SIMPLE } from '../fixtures/email-samples';

describe('ExtractionCache', () => {
  let cache: ExtractionCache;

  const mockResult: ExtractionResult = createMockResult();

  beforeEach(() => {
    cache = new ExtractionCache(3, 1000); // size=3, ttl=1000ms
  });

  test('stores and retrieves results', () => {
    const email = KLARNA_SIMPLE;
    const timezone = 'America/New_York';

    cache.set(email, timezone, mockResult);
    const retrieved = cache.get(email, timezone);

    expect(retrieved).toEqual(mockResult);
  });

  test('returns null for cache miss', () => {
    const result = cache.get('non-existent email', 'America/New_York');
    expect(result).toBeNull();
  });

  test('LRU eviction works correctly', () => {
    cache.set('email1', 'TZ', { ...mockResult, items: [] });
    cache.set('email2', 'TZ', { ...mockResult, items: [] });
    cache.set('email3', 'TZ', { ...mockResult, items: [] });

    // Cache is now full (size=3)
    expect(cache.size()).toBe(3);

    // Add 4th item - should evict oldest (email1)
    cache.set('email4', 'TZ', { ...mockResult, items: [] });

    expect(cache.size()).toBe(3);
    expect(cache.get('email1', 'TZ')).toBeNull(); // Evicted
    expect(cache.get('email2', 'TZ')).not.toBeNull(); // Still there
    expect(cache.get('email3', 'TZ')).not.toBeNull(); // Still there
    expect(cache.get('email4', 'TZ')).not.toBeNull(); // Newly added
  });

  test('expiry works correctly', () => {
    vi.useFakeTimers();

    const email = 'test email';
    cache.set(email, 'TZ', mockResult);

    // Immediately available
    expect(cache.get(email, 'TZ')).toEqual(mockResult);

    // Fast-forward 999ms - still valid
    vi.advanceTimersByTime(999);
    expect(cache.get(email, 'TZ')).toEqual(mockResult);

    // Fast-forward 2ms more (total 1001ms) - expired
    vi.advanceTimersByTime(2);
    expect(cache.get(email, 'TZ')).toBeNull();

    vi.useRealTimers();
  });

  test('clear() empties cache', () => {
    cache.set('email1', 'TZ', mockResult);
    cache.set('email2', 'TZ', mockResult);

    expect(cache.size()).toBe(2);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('email1', 'TZ')).toBeNull();
  });

  test('tracks cache hits and misses', () => {
    const email = 'test email';

    // Miss
    cache.get(email, 'TZ');

    // Set
    cache.set(email, 'TZ', mockResult);

    // Hit
    cache.get(email, 'TZ');

    // Hit
    cache.get(email, 'TZ');

    // Miss
    cache.get('other email', 'TZ');

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.total).toBe(4);
    expect(stats.hitRateRaw).toBe(50);
  });

  test('different timezones create different cache keys', () => {
    const email = 'same email';

    cache.set(email, 'America/New_York', { ...mockResult, dateLocale: 'US' });
    cache.set(email, 'Europe/London', { ...mockResult, dateLocale: 'EU' });

    const resultNY = cache.get(email, 'America/New_York');
    const resultLondon = cache.get(email, 'Europe/London');

    expect(resultNY?.dateLocale).toBe('US');
    expect(resultLondon?.dateLocale).toBe('EU');
  });

  test('different options create different cache keys', () => {
    const email = 'same email';
    const timezone = 'America/New_York';

    cache.set(email, timezone, { ...mockResult, dateLocale: 'US' }, { dateLocale: 'US' });
    cache.set(email, timezone, { ...mockResult, dateLocale: 'EU' }, { dateLocale: 'EU' });

    const resultUS = cache.get(email, timezone, { dateLocale: 'US' });
    const resultEU = cache.get(email, timezone, { dateLocale: 'EU' });

    expect(resultUS?.dateLocale).toBe('US');
    expect(resultEU?.dateLocale).toBe('EU');
  });

  test('hash handles collision gracefully', () => {
    // Two different emails that might hash similarly
    const email1 = 'a'.repeat(100);
    const email2 = 'b'.repeat(100);

    cache.set(email1, 'TZ', { ...mockResult, duplicatesRemoved: 1 });
    cache.set(email2, 'TZ', { ...mockResult, duplicatesRemoved: 2 });

    const result1 = cache.get(email1, 'TZ');
    const result2 = cache.get(email2, 'TZ');

    // They should be different (no collision)
    expect(result1?.duplicatesRemoved).toBe(1);
    expect(result2?.duplicatesRemoved).toBe(2);
  });

  test('LRU updates on get', () => {
    cache.set('email1', 'TZ', { ...mockResult, duplicatesRemoved: 1 });
    cache.set('email2', 'TZ', { ...mockResult, duplicatesRemoved: 2 });
    cache.set('email3', 'TZ', { ...mockResult, duplicatesRemoved: 3 });

    // Access email1 (moves it to end - most recently used)
    cache.get('email1', 'TZ');

    // Add email4 - should evict email2 (oldest), not email1
    cache.set('email4', 'TZ', { ...mockResult, duplicatesRemoved: 4 });

    expect(cache.get('email1', 'TZ')).not.toBeNull(); // Still there (was accessed)
    expect(cache.get('email2', 'TZ')).toBeNull(); // Evicted (oldest)
    expect(cache.get('email3', 'TZ')).not.toBeNull(); // Still there
    expect(cache.get('email4', 'TZ')).not.toBeNull(); // Newly added
  });

  test('getStats() returns correct statistics', () => {
    cache.clear();

    const stats1 = cache.getStats();
    expect(stats1.size).toBe(0);
    expect(stats1.hits).toBe(0);
    expect(stats1.misses).toBe(0);
    expect(stats1.total).toBe(0);

    cache.set('email', 'TZ', mockResult);
    cache.get('email', 'TZ'); // hit
    cache.get('other', 'TZ'); // miss

    const stats2 = cache.getStats();
    expect(stats2.size).toBe(1);
    expect(stats2.hits).toBe(1);
    expect(stats2.misses).toBe(1);
    expect(stats2.total).toBe(2);
    expect(stats2.hitRate).toBe('50.00%');
  });
});
