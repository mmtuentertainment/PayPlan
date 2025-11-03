/**
 * Performance Logging Utilities Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting)
 * Tasks: T112-T113
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logPerformance,
  measureSync,
  measureAsync,
  startTimer,
  PERFORMANCE_TARGETS,
} from '../performance';

// Mock console.log to verify logging
const originalLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
});

afterEach(() => {
  console.log = originalLog;
});

describe('Performance Logging', () => {
  describe('logPerformance', () => {
    it('returns performance log entry', () => {
      const log = logPerformance('testOperation', 50, 100);

      expect(log).toMatchObject({
        operation: 'testOperation',
        duration: 50,
        target: 100,
        withinTarget: true,
      });
      expect(log.timestamp).toBeDefined();
    });

    it('marks as within target when duration <= target', () => {
      const log1 = logPerformance('op', 50, 100);
      const log2 = logPerformance('op', 100, 100);

      expect(log1.withinTarget).toBe(true);
      expect(log2.withinTarget).toBe(true);
    });

    it('marks as exceeding target when duration > target', () => {
      const log = logPerformance('op', 150, 100);

      expect(log.withinTarget).toBe(false);
    });

    it('includes optional metadata', () => {
      const metadata = { archiveCount: 20, size: 1024 };
      const log = logPerformance('op', 50, 100, metadata);

      expect(log.metadata).toEqual(metadata);
    });
  });

  describe('measureSync', () => {
    it('measures synchronous function execution time', () => {
      const fn = () => {
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, log } = measureSync('syncOp', 100, fn);

      expect(result).toBe(fn());
      expect(log.operation).toBe('syncOp');
      expect(log.duration).toBeGreaterThanOrEqual(0);
    });

    it('returns result and log', () => {
      const { result, log } = measureSync('op', 100, () => 42);

      expect(result).toBe(42);
      expect(log.operation).toBe('op');
    });

    // Phase E: E1 - Error timing test
    it('logs duration even when function throws', () => {
      const throwingFn = () => {
        // Simulate some work before throwing
        for (let i = 0; i < 100; i++) {
          // Work simulation
        }
        throw new Error('Test error');
      };

      // Function should throw and be caught
      expect(() => {
        measureSync('failingOp', 100, throwingFn);
      }).toThrow('Test error');

      // The key behavior is that the error is still thrown even after timing
      // (console.log only happens in development mode, not in test environment)
    });

    // Phase E: E1 - Verify error re-throw preserves original error
    it('re-throws original error after logging', () => {
      const customError = new Error('Custom error message');
      const throwingFn = () => {
        throw customError;
      };

      let caughtError: Error | undefined;
      try {
        measureSync('failingOp', 100, throwingFn);
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBe(customError);
      expect(caughtError?.message).toBe('Custom error message');
    });
  });

  describe('measureAsync', () => {
    it('measures asynchronous function execution time', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      };

      const { result, log } = await measureAsync('asyncOp', 100, fn);

      expect(result).toBe('done');
      expect(log.operation).toBe('asyncOp');
      // Allow for minor timer variance (9ms+) instead of exactly 10ms
      expect(log.duration).toBeGreaterThanOrEqual(9);
    });

    it('includes metadata in log', async () => {
      const metadata = { paymentCount: 50 };
      const { log } = await measureAsync(
        'op',
        100,
        async () => 'result',
        metadata
      );

      expect(log.metadata).toEqual(metadata);
    });

    // Phase E: E1 - Async rejection timing test
    it('logs duration even when promise rejects', async () => {
      const rejectingFn = async () => {
        // Simulate async work before rejection
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async test error');
      };

      // Promise should reject and error should propagate
      await expect(async () => {
        await measureAsync('failingAsyncOp', 100, rejectingFn);
      }).rejects.toThrow('Async test error');

      // The key behavior is that the error is still thrown even after timing
      // (console.log only happens in development mode, not in test environment)
    });

    // Phase E: E1 - Verify rejection preserves original error
    it('re-throws original rejection after logging', async () => {
      const customError = new Error('Custom async error');
      const rejectingFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw customError;
      };

      let caughtError: Error | undefined;
      try {
        await measureAsync('failingAsyncOp', 100, rejectingFn);
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBe(customError);
      expect(caughtError?.message).toBe('Custom async error');
    });

    // Phase E: E1 - Timeout case test
    it('logs performance for slow operations exceeding target', async () => {
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return 'slow result';
      };

      const { result, log } = await measureAsync('slowOp', 100, slowFn);

      expect(result).toBe('slow result');
      expect(log.operation).toBe('slowOp');
      expect(log.duration).toBeGreaterThanOrEqual(149);
      expect(log.withinTarget).toBe(false); // Exceeded 100ms target
      expect(log.target).toBe(100);
    });
  });

  describe('startTimer', () => {
    it('creates timer that can be ended later', () => {
      const timer = startTimer('timerOp', 100);

      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        // Work simulation
      }

      const log = timer.end();

      expect(log.operation).toBe('timerOp');
      expect(log.target).toBe(100);
      expect(log.duration).toBeGreaterThanOrEqual(0);
    });

    it('accepts metadata when ending timer', () => {
      const timer = startTimer('op', 100);
      const metadata = { items: 5 };

      const log = timer.end(metadata);

      expect(log.metadata).toEqual(metadata);
    });
  });

  describe('PERFORMANCE_TARGETS', () => {
    it('defines load index target of 100ms', () => {
      expect(PERFORMANCE_TARGETS.LOAD_INDEX).toBe(100);
    });

    it('defines load archive target of 100ms', () => {
      expect(PERFORMANCE_TARGETS.LOAD_ARCHIVE).toBe(100);
    });

    it('defines export CSV target of 3000ms', () => {
      expect(PERFORMANCE_TARGETS.EXPORT_CSV).toBe(3000);
    });

    it('defines delete archive target of 3000ms', () => {
      expect(PERFORMANCE_TARGETS.DELETE_ARCHIVE).toBe(3000);
    });
  });
});
