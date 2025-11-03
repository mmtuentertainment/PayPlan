// Amount test utilities for financial calculations
// Feature #063: Business Logic Test Coverage

/**
 * Convert dollars to cents (financial calculations use integers)
 * @param dollars - Dollar amount (e.g., 10.50)
 * @returns Cents (e.g., 1050)
 */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param cents - Cent amount (e.g., 1050)
 * @returns Dollars (e.g., 10.50)
 */
export function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Round amount to cents precision (banker's rounding)
 * Banker's rounding: round half to even (0.5 → 0, 1.5 → 2)
 * @param amount - Amount in cents
 * @returns Rounded amount
 */
export function roundToCents(amount: number): number {
  // Banker's rounding: Math.round rounds 0.5 up, so we need custom logic
  const rounded = Math.round(amount);
  const fraction = amount - Math.floor(amount);

  // If exactly 0.5, round to nearest even number
  if (fraction === 0.5) {
    return Math.floor(amount) % 2 === 0 ? Math.floor(amount) : Math.ceil(amount);
  }

  return rounded;
}

/**
 * Check if amount is valid (positive integer in safe range)
 * @param amount - Amount to validate
 * @returns True if valid
 */
export function isValidAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= 0 &&
    Number.isSafeInteger(amount)
  );
}

/**
 * Check if number is safe integer (no precision loss)
 * @param value - Number to check
 * @returns True if safe integer
 */
export function isSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value);
}

/**
 * Generate random amount within range (for property-based testing)
 * @param min - Minimum cents
 * @param max - Maximum cents
 * @returns Random amount in cents
 */
export function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get list of invalid amounts for negative testing
 * @returns Array of invalid amounts (NaN, Infinity, negative, etc.)
 */
export function getInvalidAmounts(): number[] {
  return [
    NaN,
    Infinity,
    -Infinity,
    -1,
    -100,
    -0.01,
    Number.MAX_SAFE_INTEGER + 1, // Beyond safe integer range
    1.5, // Fractional cents (should be integers)
  ];
}
