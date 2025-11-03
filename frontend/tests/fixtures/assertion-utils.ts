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
 * Assert Zod schema validation succeeds
 * @param schema - Zod schema
 * @param data - Data to validate
 */
export function expectZodSuccess<T>(schema: z.ZodSchema<T>, data: unknown): void {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
}

/**
 * Assert Zod schema validation fails
 * @param schema - Zod schema
 * @param data - Data to validate
 * @param errorMessage - Optional expected error message (partial match)
 */
export function expectZodFailure<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): void {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);

  if (errorMessage && !result.success) {
    const errorString = JSON.stringify(result.error.errors);
    expect(errorString).toContain(errorMessage);
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
