/**
 * Regex profiler for identifying slow patterns
 */

export interface RegexProfile {
  pattern: string;
  testCount: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  slowTests: number; // Count of tests >10ms
}

class RegexProfiler {
  private profiles: Map<string, RegexProfile> = new Map();
  private enabled: boolean = false;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  clear() {
    this.profiles.clear();
  }

  /**
   * Profile a regex test operation
   */
  profileTest(pattern: RegExp, _text: string, operation: () => any): any {
    if (!this.enabled) {
      return operation();
    }

    const patternKey = pattern.source;
    const start = performance.now();
    const result = operation();
    const elapsed = performance.now() - start;

    // Update profile
    const existing = this.profiles.get(patternKey);
    if (existing) {
      existing.testCount++;
      existing.totalTime += elapsed;
      existing.avgTime = existing.totalTime / existing.testCount;
      existing.maxTime = Math.max(existing.maxTime, elapsed);
      if (elapsed > 10) {
        existing.slowTests++;
      }
    } else {
      this.profiles.set(patternKey, {
        pattern: patternKey,
        testCount: 1,
        totalTime: elapsed,
        avgTime: elapsed,
        maxTime: elapsed,
        slowTests: elapsed > 10 ? 1 : 0
      });
    }

    return result;
  }

  /**
   * Get all profiles sorted by total time (descending)
   */
  getProfiles(): RegexProfile[] {
    return Array.from(this.profiles.values()).sort(
      (a, b) => b.totalTime - a.totalTime
    );
  }

  /**
   * Get slow patterns (avg time > 10ms)
   */
  getSlowPatterns(): RegexProfile[] {
    return this.getProfiles().filter(p => p.avgTime > 10);
  }

  /**
   * Generate profiling report
   */
  generateReport(): string {
    const profiles = this.getProfiles();
    const slowPatterns = this.getSlowPatterns();

    let report = '# Regex Profiling Report\n\n';
    report += `Total Patterns: ${profiles.length}\n`;
    report += `Slow Patterns (>10ms avg): ${slowPatterns.length}\n\n`;

    if (slowPatterns.length > 0) {
      report += '## Slow Patterns\n\n';
      slowPatterns.forEach((p, i) => {
        report += `### ${i + 1}. Pattern: \`${p.pattern}\`\n`;
        report += `- Tests: ${p.testCount}\n`;
        report += `- Avg Time: ${p.avgTime.toFixed(3)}ms\n`;
        report += `- Max Time: ${p.maxTime.toFixed(3)}ms\n`;
        report += `- Total Time: ${p.totalTime.toFixed(3)}ms\n`;
        report += `- Slow Tests (>10ms): ${p.slowTests}\n\n`;
      });
    }

    report += '## All Patterns (by total time)\n\n';
    report += '| Pattern | Tests | Avg (ms) | Max (ms) | Total (ms) | Slow Tests |\n';
    report += '|---------|-------|----------|----------|------------|------------|\n';

    profiles.slice(0, 20).forEach(p => {
      const patternShort = p.pattern.length > 50
        ? p.pattern.substring(0, 47) + '...'
        : p.pattern;
      report += `| \`${patternShort}\` | ${p.testCount} | ${p.avgTime.toFixed(3)} | ${p.maxTime.toFixed(3)} | ${p.totalTime.toFixed(3)} | ${p.slowTests} |\n`;
    });

    return report;
  }
}

// Global profiler instance
export const regexProfiler = new RegexProfiler();

/**
 * Wrapper for regex.test() with profiling
 */
export function profiledTest(pattern: RegExp, text: string): boolean {
  return regexProfiler.profileTest(pattern, text, () => pattern.test(text));
}

/**
 * Wrapper for regex.exec() with profiling
 */
export function profiledExec(pattern: RegExp, text: string): RegExpExecArray | null {
  return regexProfiler.profileTest(pattern, text, () => pattern.exec(text));
}

/**
 * Wrapper for string.match() with profiling
 */
export function profiledMatch(pattern: RegExp, text: string): RegExpMatchArray | null {
  return regexProfiler.profileTest(pattern, text, () => text.match(pattern));
}
