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
  });

  describe('startTimer', () => {
    it('creates timer that can be ended later', () => {
      const timer = startTimer('timerOp', 100);

      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
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
