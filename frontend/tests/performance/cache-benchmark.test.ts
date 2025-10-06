import { describe, test, expect, beforeEach } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { extractionCache } from '../../src/lib/extraction/helpers/cache';
import { runBenchmark, formatBenchmarkResults } from '../helpers/performance';

describe('Cache Performance Benchmarks', () => {
  const timezone = 'America/New_York';
  const klarnaEmail = `
    Klarna Payment Due
    Payment 1 of 4
    Due: October 15, 2025
    Amount: $25.00
    Order #ABC123
  `;

  beforeEach(() => {
    extractionCache.clear();
  });

  test('cache miss performance (first extraction)', () => {
    const results = runBenchmark(
      'Cache Miss (Fresh Extraction)',
      () => {
        extractionCache.clear();
        extractItemsFromEmails(klarnaEmail, timezone);
      },
      50
    );

    console.log('\n📊 CACHE MISS PERFORMANCE:');
    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeGreaterThan(0);
    expect(results.avg).toBeLessThan(50); // Should be fast even without cache
  });

  test('cache hit performance (repeated extraction)', () => {
    // Prime the cache
    extractItemsFromEmails(klarnaEmail, timezone);

    // Benchmark cache hits
    const results = runBenchmark(
      'Cache Hit (Cached Result)',
      () => extractItemsFromEmails(klarnaEmail, timezone),
      100
    );

    console.log('\n⚡ CACHE HIT PERFORMANCE:');
    console.log(formatBenchmarkResults(results));

    // Cache hits should be extremely fast (< 0.1ms typical)
    expect(results.avg).toBeGreaterThan(0);
    expect(results.avg).toBeLessThan(1); // Sub-millisecond
  });

  test('cache performance comparison', () => {
    // Measure without cache (bypass)
    const noCacheResults = runBenchmark(
      'Without Cache',
      () => extractItemsFromEmails(klarnaEmail, timezone, { bypassCache: true }),
      30
    );

    // Prime cache
    extractItemsFromEmails(klarnaEmail, timezone);

    // Measure with cache
    const cacheResults = runBenchmark(
      'With Cache',
      () => extractItemsFromEmails(klarnaEmail, timezone),
      30
    );

    console.log('\n📈 CACHE PERFORMANCE COMPARISON:');
    console.log('Without Cache (Fresh Extraction):');
    console.log(formatBenchmarkResults(noCacheResults));
    console.log('\nWith Cache (Cached Result):');
    console.log(formatBenchmarkResults(cacheResults));

    const speedup = noCacheResults.avg / cacheResults.avg;
    console.log(`\n🚀 Cache Speedup: ${speedup.toFixed(1)}x faster`);

    // Cache should provide at least 2x speedup (typically 10-100x)
    expect(cacheResults.avg).toBeLessThan(noCacheResults.avg / 2);
  });

  test('large email cache performance', () => {
    const largeEmail = `
      Klarna Payment Reminder
      Payment 2 of 4
      Due: November 15, 2025
      Amount: $37.50

      ${'Order details: '.repeat(100)}

      Payment History:
      ${'Payment 1: Completed on 10/15/2025\n'.repeat(50)}
    `;

    // Measure without cache
    const noCacheResults = runBenchmark(
      'Large Email Without Cache',
      () => {
        extractionCache.clear();
        extractItemsFromEmails(largeEmail, timezone);
      },
      20
    );

    // Prime cache
    extractionCache.clear();
    extractItemsFromEmails(largeEmail, timezone);

    // Measure with cache
    const cacheResults = runBenchmark(
      'Large Email With Cache',
      () => extractItemsFromEmails(largeEmail, timezone),
      20
    );

    console.log('\n📊 LARGE EMAIL CACHE COMPARISON:');
    console.log('Without Cache:');
    console.log(formatBenchmarkResults(noCacheResults));
    console.log('\nWith Cache:');
    console.log(formatBenchmarkResults(cacheResults));

    const speedup = noCacheResults.avg / cacheResults.avg;
    console.log(`\n🚀 Large Email Cache Speedup: ${speedup.toFixed(1)}x faster`);

    // Larger emails should show more dramatic cache improvement
    expect(cacheResults.avg).toBeLessThan(noCacheResults.avg / 2);
  });

  test('cache hit rate for repeated extractions', () => {
    const email1 = klarnaEmail;
    const email2 = klarnaEmail.replace('Payment 1 of 4', 'Payment 2 of 4');

    extractionCache.clear();

    // Extract 10 times alternating between 2 emails
    for (let i = 0; i < 10; i++) {
      extractItemsFromEmails(i % 2 === 0 ? email1 : email2, timezone);
    }

    const stats = extractionCache.getStats();

    console.log('\n📈 CACHE HIT RATE STATISTICS:');
    console.log(`Total Requests: ${stats.total}`);
    console.log(`Cache Hits: ${stats.hits}`);
    console.log(`Cache Misses: ${stats.misses}`);
    console.log(`Hit Rate: ${stats.hitRate}`);
    console.log(`Cache Size: ${stats.size}/${stats.maxSize}`);

    // With 2 unique emails over 10 requests, expect 8 hits (2 misses for first-time)
    expect(stats.hits).toBe(8);
    expect(stats.misses).toBe(2);
    expect(stats.hitRateRaw).toBe(80);
  });
});
