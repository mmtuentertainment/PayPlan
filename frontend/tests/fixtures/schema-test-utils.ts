// Shared schema test patterns
// Feature #063: Business Logic Test Coverage - US3
// Reduces duplication across schema test files

import { expect } from 'vitest';
import type { z } from 'zod';
import { expectZodSuccess, expectZodError } from './assertion-utils';

/**
 * Test suite for ID validation edge cases
 * Tests that IDs reject spaces, special chars, and uppercase
 */
export function testIdValidation<T>(
  schema: z.ZodSchema<T>,
  createFixture: (overrides: Partial<T>) => T | Partial<T>,
  idField: keyof T,
  prefix: string
): void {
  const it = (global as typeof globalThis & { it: typeof import('vitest').it }).it;

  it(`should reject ${String(idField)} with spaces`, () => {
    const invalid = createFixture({ [idField]: `${prefix}_with spaces` } as Partial<T>);
    const result = schema.safeParse(invalid);
    expectZodError(result, String(idField));
  });

  it(`should reject ${String(idField)} with special characters`, () => {
    const invalid = createFixture({ [idField]: `${prefix}_with@special!` } as Partial<T>);
    const result = schema.safeParse(invalid);
    expectZodError(result, String(idField));
  });

  it(`should reject ${String(idField)} with uppercase letters`, () => {
    const invalid = createFixture({ [idField]: `${prefix}_WithUpperCase` } as Partial<T>);
    const result = schema.safeParse(invalid);
    expectZodError(result, String(idField));
  });
}

/**
 * Test suite for timestamp validation
 * Tests that ISO 8601 datetime format is enforced
 */
export function testTimestampValidation<T>(
  schema: z.ZodSchema<T>,
  createFixture: (overrides: Partial<T>) => T | Partial<T>,
  timestampField: keyof T
): void {
  const it = (global as typeof globalThis & { it: typeof import('vitest').it }).it;

  it(`should reject ${String(timestampField)} with date-only format`, () => {
    const invalid = createFixture({ [timestampField]: '2025-11-03' } as Partial<T>);
    const result = schema.safeParse(invalid);
    expectZodError(result, String(timestampField));
  });

  it(`should reject ${String(timestampField)} with invalid format`, () => {
    const invalid = createFixture({ [timestampField]: 'not-a-date' } as Partial<T>);
    const result = schema.safeParse(invalid);
    expectZodError(result, String(timestampField));
  });
}

/**
 * Test suite for storage schema structure
 * Tests common storage schema fields (version, totalSize, lastModified)
 */
export function testStorageSchema<T>(
  schema: z.ZodSchema<T>,
  createValidStorage: () => T | Partial<T>
): void {
  const it = (global as typeof globalThis & { it: typeof import('vitest').it }).it;

  it('should reject storage with invalid version format', () => {
    const invalid = { ...createValidStorage(), version: '1.0' }; // Not semver
    const result = schema.safeParse(invalid);
    expectZodError(result, 'version');
  });

  it('should reject storage with negative totalSize', () => {
    const invalid = { ...createValidStorage(), totalSize: -1 };
    const result = schema.safeParse(invalid);
    expectZodError(result, 'totalSize');
  });

  it('should reject storage with non-integer totalSize', () => {
    const invalid = { ...createValidStorage(), totalSize: 1.5 };
    const result = schema.safeParse(invalid);
    expectZodError(result, 'totalSize');
  });

  it('should reject storage with invalid lastModified', () => {
    const invalid = { ...createValidStorage(), lastModified: '2025-11-03' }; // Date only
    const result = schema.safeParse(invalid);
    expectZodError(result, 'lastModified');
  });
}

/**
 * Test suite for validation function wrappers
 * Tests validateX() helper functions return correct SafeParseResult
 */
export function testValidationFunction<T>(
  validateFn: (data: unknown) => z.SafeParseReturnType<unknown, T>,
  validData: T | Partial<T>,
  invalidData: T | Partial<T>
): void {
  const it = (global as typeof globalThis & { it: typeof import('vitest').it }).it;

  it('should return success for valid data', () => {
    const result = validateFn(validData);
    expectZodSuccess(result);
  });

  it('should return error for invalid data', () => {
    const result = validateFn(invalidData);
    expectZodError(result);
  });
}
