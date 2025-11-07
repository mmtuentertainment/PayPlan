/**
 * Tests for Progress Indicator Helpers (Feature 064)
 * PR79-1: Add tests for getProgressIndicatorClass
 * Target: 100% coverage for UI helper functions
 */

import { describe, it, expect } from 'vitest';
import { getProgressIndicatorClass } from '../progressIndicator';

describe('getProgressIndicatorClass', () => {
  it('should return green class for completed status', () => {
    const result = getProgressIndicatorClass('completed');
    expect(result).toBe('[&>div]:bg-green-600');
  });

  it('should return red class for past-due status', () => {
    const result = getProgressIndicatorClass('past-due');
    expect(result).toBe('[&>div]:bg-red-600');
  });

  it('should return yellow class for at-risk status', () => {
    const result = getProgressIndicatorClass('at-risk');
    expect(result).toBe('[&>div]:bg-yellow-500');
  });

  it('should return blue class for on-track status', () => {
    const result = getProgressIndicatorClass('on-track');
    expect(result).toBe('[&>div]:bg-blue-600');
  });

  it('should return blue class for unknown status (default)', () => {
    // TypeScript would prevent this, but testing default case for runtime safety
    const result = getProgressIndicatorClass('unknown' as any);
    expect(result).toBe('[&>div]:bg-blue-600');
  });
});
