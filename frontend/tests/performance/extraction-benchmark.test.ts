import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { runBenchmark, formatBenchmarkResults } from '../helpers/performance';
import {
  KLARNA_SMALL,
  KLARNA_MEDIUM_BASE,
  AFFIRM_LARGE_BASE,
  scaleEmail
} from '../fixtures/email-samples';
import { DEFAULT_TIMEZONE } from '../fixtures/mock-items';
import { PROVIDERS } from '../fixtures/providers';

// Sample emails for benchmarking
const SMALL_EMAIL = KLARNA_SMALL;
const MEDIUM_EMAIL = scaleEmail(KLARNA_MEDIUM_BASE, 'medium'); // ~1KB
const LARGE_EMAIL = scaleEmail(AFFIRM_LARGE_BASE, 'large'); // ~10KB

describe('Extraction Performance Benchmarks', () => {
  const timezone = DEFAULT_TIMEZONE;

  test('baseline: small email extraction (100 chars)', () => {
    const results = runBenchmark(
      'Small Email',
      () => extractItemsFromEmails(SMALL_EMAIL, timezone),
      50
    );

    console.log(formatBenchmarkResults(results));

    // Performance assertions - baseline (will adjust after optimization)
    expect(results.avg).toBeLessThan(100); // Should take less than 100ms
    expect(results.avg).toBeGreaterThan(0); // Sanity check
  });

  test('baseline: medium email extraction (~1KB)', () => {
    const results = runBenchmark(
      'Medium Email',
      () => extractItemsFromEmails(MEDIUM_EMAIL, timezone),
      50
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(150); // Should take less than 150ms
  });

  test('baseline: large email extraction (~10KB)', () => {
    const results = runBenchmark(
      'Large Email',
      () => extractItemsFromEmails(LARGE_EMAIL, timezone),
      30
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(300); // Should take less than 300ms
  });

  test('baseline: rapid extractions (10 consecutive)', () => {
    const rapidExtractions = () => {
      for (let i = 0; i < 10; i++) {
        extractItemsFromEmails(SMALL_EMAIL, timezone);
      }
    };

    const results = runBenchmark(
      '10 Rapid Extractions',
      rapidExtractions,
      10
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(1000); // 10 extractions < 1 second
  });

  test('baseline: extraction accuracy maintained', () => {
    // Ensure benchmarks don't compromise accuracy
    const result = extractItemsFromEmails(SMALL_EMAIL, timezone);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].provider).toBe(PROVIDERS.KLARNA);
    expect(result.items[0].amount).toBe(2500); // $25.00 in cents
    expect(result.items[0].installment_no).toBe(1);
  });
});
