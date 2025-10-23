/**
 * Runtime Type Guards for UI Input Validation
 *
 * Implements FR-009: UI components validate input values at runtime
 * Provides defensive type checking for user inputs to prevent invalid data.
 *
 * @module RuntimeTypeGuard
 */

/**
 * Valid primitive types for UI inputs
 */
export type UIInputType = 'string' | 'number' | 'boolean';

/**
 * Validates a UI input value against an expected type
 *
 * @param value - The value to validate
 * @param expectedType - The expected primitive type
 * @returns True if the value matches the expected type
 *
 * @example
 * ```typescript
 * if (validateUIInputValue(userInput, 'number')) {
 *   // Safe to use as number
 * }
 * ```
 */
export function validateUIInputValue(
  value: unknown,
  expectedType: UIInputType
): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const actualType = typeof value;

  if (actualType !== expectedType) {
    return false;
  }

  // Additional validation for numbers
  if (expectedType === 'number') {
    const num = value as number;
    // Reject NaN and Infinity
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a tab value against a set of allowed values
 *
 * @param value - The tab value to validate
 * @param allowedValues - Array of allowed tab values
 * @returns True if the value is in the allowed set
 *
 * @example
 * ```typescript
 * const tabs = ['home', 'settings', 'profile'] as const;
 * if (isValidTabValue(selectedTab, tabs)) {
 *   // Safe to use as tab value
 * }
 * ```
 */
export function isValidTabValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T
): value is T[number] {
  if (typeof value !== 'string') {
    return false;
  }

  return (allowedValues as readonly string[]).includes(value);
}

/**
 * Validates a radio button value against a set of allowed values
 *
 * @param value - The radio value to validate
 * @param allowedValues - Array of allowed radio values
 * @returns True if the value is in the allowed set
 *
 * @example
 * ```typescript
 * const options = ['yes', 'no', 'maybe'] as const;
 * if (isValidRadioValue(selection, options)) {
 *   // Safe to use as radio value
 * }
 * ```
 */
export function isValidRadioValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T
): value is T[number] {
  if (typeof value !== 'string') {
    return false;
  }

  return (allowedValues as readonly string[]).includes(value);
}

/**
 * Validates a numeric input string
 *
 * Ensures the string represents a finite number (not NaN or Infinity)
 *
 * @param value - The string value to validate
 * @returns True if the string is a valid finite number
 *
 * @example
 * ```typescript
 * if (validateNumericInput(inputValue)) {
 *   const num = parseFloat(inputValue);
 *   // Safe to use num in calculations
 * }
 * ```
 */
export function validateNumericInput(value: string): boolean {
  if (value === '' || value === null || value === undefined) {
    return false;
  }

  const trimmed = value.trim();
  const num = parseFloat(trimmed);

  // Check if parsing failed or resulted in NaN/Infinity
  if (isNaN(num) || !isFinite(num)) {
    return false;
  }

  // Verify the string is a valid number format
  // Use Number() instead of parseFloat for strict validation
  const strictNum = Number(trimmed);
  if (isNaN(strictNum)) {
    return false;
  }

  return true;
}

/**
 * Validates a date input string
 *
 * Ensures the string is in ISO 8601 format (YYYY-MM-DD) and represents a valid date
 *
 * @param value - The date string to validate
 * @returns True if the string is a valid ISO date
 *
 * @example
 * ```typescript
 * if (validateDateInput(dateValue)) {
 *   const date = new Date(dateValue);
 *   // Safe to use date
 * }
 * ```
 */
export function validateDateInput(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Check ISO format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(value)) {
    return false;
  }

  // Validate the date is actually valid
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Verify the parsed date matches the input
  // This catches invalid dates like 2025-02-30
  const [year, month, day] = value.split('-').map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for checking if a value is a non-null object
 *
 * @param value - The value to check
 * @returns True if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if a value is an array
 *
 * @param value - The value to check
 * @returns True if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Safely access navigator.doNotTrack with proper TypeScript types
 *
 * Implements FR-010: Browser APIs accessed with proper TypeScript types
 *
 * @returns The Do Not Track value or null if not available
 */
export function getDoNotTrack(): string | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  // navigator.doNotTrack is deprecated but still used
  // Type it properly to avoid TypeScript errors
  const nav = navigator as Navigator & {
    doNotTrack?: string | null;
    msDoNotTrack?: string | null;
  };

  return nav.doNotTrack ?? nav.msDoNotTrack ?? null;
}
