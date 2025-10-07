/**
 * CI Performance Gate Test
 * Ensures 50-email extraction stays under 250ms budget (median of 3 runs)
 * Delta 0017: Added warmup run and dynamic median calculation
 */
import { describe, test, expect } from 'vitest';
import { extractFromEmail } from '@/lib/email-extractor';
import { KLARNA_SMALL, KLARNA_MEDIUM_BASE } from '../fixtures/email-samples';

// Generate 50 varied emails for benchmarking
const emails50 = [
  ...Array(25).fill(KLARNA_SMALL),
  ...Array(25).fill(KLARNA_MEDIUM_BASE),
];

/**
 * Calculate median of a numeric array
 * @param arr - Array of numbers
 * @returns Median value (average of middle two if even length)
 */
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

describe('CI Performance Gate', () => {
  test('50 emails extracted in <250ms (median of 3 runs)', async () => {
    // Warmup: discard first run to eliminate cold-start variance
    for (const email of emails50) {
      await extractFromEmail(email);
    }

    const runs: number[] = [];

    // Execute 3 measured runs
    for (let i = 0; i < 3; i++) {
      const start = performance.now();

      for (const email of emails50) {
        await extractFromEmail(email);
      }

      const duration = performance.now() - start;
      runs.push(duration);
    }

    // Calculate median using dynamic function
    const medianMs = median(runs);

    // Output for CI parsing
    console.log(`PERF_METRIC:extraction_time_ms=${Math.round(medianMs)}`);
    console.log('PERF_THRESHOLD:250');

    // Assert threshold
    expect(medianMs).toBeLessThan(250);
  });
});

describe('median function', () => {
  test('returns value for single element', () => {
    expect(median([5])).toBe(5);
  });

  test('returns middle value for odd length', () => {
    expect(median([1, 3, 2])).toBe(2);
  });

  test('returns average of middle two for even length', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  test('handles unsorted arrays correctly', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([10, 1, 5, 3])).toBe(4);
  });
});
