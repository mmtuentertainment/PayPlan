// Custom assertion utilities for common test patterns
// Feature #063: Business Logic Test Coverage

import { expect } from 'vitest';
import type { z } from 'zod';

/**
 * Assert localStorage contains key with optional value check
 * @param key - Expected key
 * @param value - Expected value (optional)
 */
export function expectStorageKey(key: string, value?: string): void {
  const stored = localStorage.getItem(key);
  expect(stored).not.toBeNull();

  if (value !== undefined) {
    expect(stored).toBe(value);
  }
}

/**
 * Assert localStorage is empty
 */
export function expectStorageEmpty(): void {
  expect(localStorage.length).toBe(0);
}

/**
 * Assert localStorage has exact number of keys
 * @param expected - Expected key count
 */
export function expectStorageSize(expected: number): void {
  expect(localStorage.length).toBe(expected);
}

/**
 * Type guard for successful Zod parse result
 */
function isZodSuccess<T>(result: { success: boolean; data?: T; error?: z.ZodError }): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for failed Zod parse result
 */
function isZodError<T>(result: { success: boolean; data?: T; error?: z.ZodError }): result is { success: false; error: z.ZodError } {
  return result.success === false;
}

/**
 * Assert Zod schema validation succeeds
 * @param result - Result from schema.safeParse()
 */
export function expectZodSuccess<T>(result: { success: boolean; data?: T; error?: z.ZodError }): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true);
  if (!isZodSuccess(result)) {
    throw new Error('Expected Zod validation to succeed');
  }
}

/**
 * Assert Zod schema validation fails
 * @param result - Result from schema.safeParse()
 * @param field - Optional field name that should have error
 */
export function expectZodError<T>(result: { success: boolean; data?: T; error?: z.ZodError }, field?: string): asserts result is { success: false; error: z.ZodError } {
  expect(result.success).toBe(false);

  if (!isZodError(result)) {
    throw new Error('Expected Zod validation to fail');
  }

  if (field) {
    const hasFieldError = result.error.issues.some((issue: z.ZodIssue) => {
      const path = issue.path.join('.');
      return path === field || path.includes(field);
    });
    expect(hasFieldError).toBe(true);
  }
}

/**
 * Assert percentage value with tolerance
 * @param actual - Actual percentage
 * @param expected - Expected percentage
 * @param tolerance - Tolerance (default: 0.01 = 0.01%)
 */
export function expectPercentage(
  actual: number,
  expected: number,
  tolerance: number = 0.01
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert cent amounts are equal (handles floating point)
 * @param actual - Actual amount in cents
 * @param expected - Expected amount in cents
 */
export function expectCentsEqual(actual: number, expected: number): void {
  // Cents should be exact integers, no tolerance needed
  expect(actual).toBe(expected);
}
