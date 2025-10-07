/**
 * CI Performance Gate Test
 * Ensures 50-email extraction stays under 250ms budget (median of 3 runs)
 */
import { describe, test, expect } from 'vitest';
import { extractFromEmail } from '@/lib/email-extractor';
import { KLARNA_SMALL, KLARNA_MEDIUM_BASE } from '../fixtures/email-samples';

// Generate 50 varied emails for benchmarking
const emails50 = [
  ...Array(25).fill(KLARNA_SMALL),
  ...Array(25).fill(KLARNA_MEDIUM_BASE),
];

describe('CI Performance Gate', () => {
  test('50 emails extracted in <250ms (median of 3 runs)', async () => {
    const runs: number[] = [];

    // Execute 3 runs
    for (let i = 0; i < 3; i++) {
      const start = performance.now();

      for (const email of emails50) {
        await extractFromEmail(email);
      }

      const duration = performance.now() - start;
      runs.push(duration);
    }

    // Calculate median (middle value after sorting)
    const median = runs.sort((a, b) => a - b)[1];

    // Output for CI parsing
    console.log(`PERF_METRIC:extraction_time_ms=${Math.round(median)}`);
    console.log('PERF_THRESHOLD:250');

    // Assert threshold
    expect(median).toBeLessThan(250);
  });
});
