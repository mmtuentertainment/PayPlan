/**
 * Measures the execution time of a function in milliseconds
 */
export function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

/**
 * Runs a benchmark multiple times and returns statistics
 */
export function runBenchmark(
  name: string,
  fn: () => void,
  iterations: number = 100
): {
  name: string;
  iterations: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  total: number;
} {
  const times: number[] = [];

  // Warm-up run
  fn();

  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const time = measureTime(fn);
    times.push(time);
  }

  times.sort((a, b) => a - b);

  const total = times.reduce((sum, t) => sum + t, 0);
  const avg = total / iterations;
  const min = times[0];
  const max = times[times.length - 1];
  const median = times[Math.floor(iterations / 2)];

  return {
    name,
    iterations,
    avg,
    min,
    max,
    median,
    total
  };
}

/**
 * Formats benchmark results as a readable string
 */
export function formatBenchmarkResults(results: ReturnType<typeof runBenchmark>): string {
  return `
Benchmark: ${results.name}
Iterations: ${results.iterations}
Average: ${results.avg.toFixed(3)}ms
Median: ${results.median.toFixed(3)}ms
Min: ${results.min.toFixed(3)}ms
Max: ${results.max.toFixed(3)}ms
Total: ${results.total.toFixed(3)}ms
`.trim();
}
