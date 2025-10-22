/**
 * Performance Logging Utilities
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting)
 * Tasks: T112-T113
 *
 * Performance monitoring and logging for archive operations.
 * Tracks metrics against defined performance targets.
 */

/**
 * Performance targets for archive operations (in milliseconds)
 */
export const PERFORMANCE_TARGETS = {
  /** Archive index loading target: <100ms */
  LOAD_INDEX: 100,
  /** Archive detail loading target: <100ms */
  LOAD_ARCHIVE: 100,
  /** CSV export generation target: <3000ms (3 seconds) */
  EXPORT_CSV: 3000,
  /** Archive deletion target: <3000ms (3 seconds) */
  DELETE_ARCHIVE: 3000,
} as const;

/**
 * Performance log entry
 */
export interface PerformanceLog {
  operation: string;
  duration: number;
  target: number;
  withinTarget: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Sanitize metadata to remove sensitive information before logging
 *
 * Redacts values for keys that may contain PII or sensitive data
 * such as names, emails, payment information, account details, etc.
 *
 * @param metadata - Metadata object to sanitize
 * @returns Sanitized metadata object with sensitive values redacted
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = /name|email|address|card|account|ssn|token|payment|amount|provider/i;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log performance metric with comparison to target
 *
 * Logs to console in development, could be extended to send to
 * analytics service in production.
 *
 * Metadata is sanitized to remove sensitive information before logging.
 *
 * @param operation - Name of the operation
 * @param duration - Duration in milliseconds
 * @param target - Target duration in milliseconds
 * @param metadata - Optional metadata about the operation
 *
 * @example
 * ```typescript
 * const startTime = performance.now();
 * const result = loadArchiveIndex();
 * const duration = performance.now() - startTime;
 * logPerformance('loadArchiveIndex', duration, PERFORMANCE_TARGETS.LOAD_INDEX, {
 *   archiveCount: result.length
 * });
 * ```
 */
export function logPerformance(
  operation: string,
  duration: number,
  target: number,
  metadata?: Record<string, unknown>
): PerformanceLog {
  const withinTarget = duration <= target;
  const log: PerformanceLog = {
    operation,
    duration,
    target,
    withinTarget,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const status = withinTarget ? '✅' : '⚠️';
    const percentage = ((duration / target) * 100).toFixed(1);
    // Sanitize metadata before logging to prevent PII exposure
    const safeMetadata = metadata ? sanitizeMetadata(metadata) : '';
    console.log(
      `${status} [Performance] ${operation}: ${duration.toFixed(2)}ms (${percentage}% of ${target}ms target)`,
      safeMetadata
    );
  }

  // In production, could send to analytics service
  // if (process.env.NODE_ENV === 'production' && !withinTarget) {
  //   sendToAnalytics(log);
  // }

  return log;
}

/**
 * Measure execution time of a synchronous function
 *
 * @param operation - Name of the operation
 * @param target - Target duration in milliseconds
 * @param fn - Function to measure
 * @param metadata - Optional metadata
 * @returns Result of the function and performance log
 *
 * @example
 * ```typescript
 * const { result, log } = measureSync(
 *   'loadArchiveIndex',
 *   PERFORMANCE_TARGETS.LOAD_INDEX,
 *   () => archiveStorage.loadArchiveIndex(),
 *   { archiveCount: 20 }
 * );
 * ```
 */
export function measureSync<T>(
  operation: string,
  target: number,
  fn: () => T,
  metadata?: Record<string, unknown>
): { result: T; log: PerformanceLog } {
  const startTime = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    const log = logPerformance(operation, duration, target, metadata);
    return { result, log };
  } catch (error) {
    // Log duration even when function throws
    const duration = performance.now() - startTime;
    logPerformance(operation, duration, target, metadata);
    throw error; // Re-throw after logging
  }
}

/**
 * Measure execution time of an asynchronous function
 *
 * @param operation - Name of the operation
 * @param target - Target duration in milliseconds
 * @param fn - Async function to measure
 * @param metadata - Optional metadata
 * @returns Promise with result and performance log
 *
 * @example
 * ```typescript
 * const { result, log } = await measureAsync(
 *   'exportArchiveToCSV',
 *   PERFORMANCE_TARGETS.EXPORT_CSV,
 *   () => archiveService.exportArchiveToCSV(archive),
 *   { paymentCount: archive.payments.length }
 * );
 * ```
 */
export async function measureAsync<T>(
  operation: string,
  target: number,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ result: T; log: PerformanceLog }> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    const log = logPerformance(operation, duration, target, metadata);
    return { result, log };
  } catch (error) {
    // Log duration even when promise rejects
    const duration = performance.now() - startTime;
    logPerformance(operation, duration, target, metadata);
    throw error; // Re-throw after logging
  }
}

/**
 * Create a performance timer for manual measurement
 *
 * Useful when you need to measure across multiple async operations
 * or when the start/end points are in different scopes.
 *
 * @param operation - Name of the operation
 * @param target - Target duration in milliseconds
 * @returns Timer object with end() method
 *
 * @example
 * ```typescript
 * const timer = startTimer('exportArchiveToCSV', PERFORMANCE_TARGETS.EXPORT_CSV);
 * // ... async operations ...
 * const log = timer.end({ paymentCount: 50 });
 * ```
 */
export function startTimer(operation: string, target: number) {
  const startTime = performance.now();

  return {
    /**
     * End the timer and log performance
     *
     * @param metadata - Optional metadata
     * @returns Performance log entry
     */
    end: (metadata?: Record<string, unknown>): PerformanceLog => {
      const duration = performance.now() - startTime;
      return logPerformance(operation, duration, target, metadata);
    },
  };
}
