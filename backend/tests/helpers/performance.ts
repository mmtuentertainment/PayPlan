/**
 * Performance Testing Utilities
 * Shared helpers for measuring and validating performance across test suites
 */

import { performance } from 'perf_hooks';

/**
 * Parse and validate environment variable threshold with min/max bounds.
 * Used for configurable performance test thresholds.
 *
 * @param envVar - Environment variable value (e.g., process.env.THRESHOLD_MS)
 * @param defaultValue - Default threshold in milliseconds
 * @param min - Minimum allowed threshold (default: 1ms)
 * @param max - Maximum allowed threshold (default: 10000ms)
 * @returns Validated threshold value
 *
 * @example
 * const threshold = parseThreshold(process.env.MAX_DURATION_MS, 50, 1, 100);
 */
export function parseThreshold(
  envVar: string | undefined,
  defaultValue: number,
  min: number = 1,
  max: number = 10000
): number {
  if (!envVar) return defaultValue;

  const parsed = parseInt(envVar, 10);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max || !Number.isInteger(parsed)) {
    console.warn(
      `[PerformanceUtils] Invalid env threshold "${envVar}" (must be ${min}-${max}ms), using default ${defaultValue}ms`
    );
    return defaultValue;
  }

  return parsed;
}

/**
 * Parse and validate percentile value (1-100).
 * Used for percentile-based performance assertions (e.g., P95, P99).
 *
 * @param envVar - Environment variable value (e.g., process.env.PERCENTILE)
 * @param defaultValue - Default percentile (e.g., 95 for P95)
 * @returns Validated percentile value (1-100)
 *
 * @example
 * const percentile = parsePercentile(process.env.PERCENTILE, 95);
 * const p95 = calculatePercentile(samples, percentile);
 */
export function parsePercentile(envVar: string | undefined, defaultValue: number): number {
  if (!envVar) return defaultValue;

  const parsed = parseInt(envVar, 10);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100 || !Number.isInteger(parsed)) {
    console.warn(`[PerformanceUtils] Invalid percentile "${envVar}", using default P${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Measure performance of a function over multiple iterations.
 * Returns array of individual sample timings for percentile-based analysis.
 *
 * @param fn - Function to measure
 * @param iterations - Number of iterations to run (default: 1000)
 * @returns Array of timing samples in milliseconds
 *
 * @example
 * const samples = measurePerformance(() => sanitizer.sanitize(data), 300);
 * const p95 = calculatePercentile(samples, 95);
 * expect(p95).toBeLessThan(50);
 */
export function measurePerformance(fn: () => void, iterations: number = 1000): number[] {
  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    samples.push(duration);
  }

  return samples;
}

/**
 * Calculate percentile from array of samples using linear interpolation.
 * Does NOT mutate input array (creates sorted copy internally).
 *
 * @param samples - Array of timing samples (will NOT be mutated)
 * @param percentile - Percentile to calculate (1-100, e.g., 95 for P95)
 * @returns Value at the given percentile
 *
 * @example
 * const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * const p95 = calculatePercentile(samples, 95); // Returns ~9.5
 * const p50 = calculatePercentile(samples, 50); // Returns median (5.5)
 */
export function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) {
    return 0;
  }

  // Copy array to avoid mutating caller's data
  const sorted = samples.slice().sort((a, b) => a - b);

  // Calculate index using linear interpolation between closest ranks
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
