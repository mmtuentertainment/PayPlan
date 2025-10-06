/**
 * Currency utilities for integer cents arithmetic.
 *
 * **Why Integer Cents?**
 * JavaScript's floating-point math has precision errors:
 * - 0.1 + 0.2 = 0.30000000000004 (not 0.3)
 * - 25.12 * 100 = 2511.9999999999995
 *
 * Storing amounts as integer cents eliminates ALL floating-point errors
 * and ensures financial accuracy for payment calculations.
 *
 * @example
 * ```typescript
 * // Converting $25.00 to cents
 * const cents = dollarsToCents(25.00);  // 2500
 *
 * // Formatting for display
 * const display = formatCurrency(2500, 'USD');  // "$25.00"
 *
 * // Converting back
 * const dollars = centsToDollars(2500);  // 25.00
 * ```
 */

/**
 * Maximum dollar amount allowed (1 million USD).
 * Prevents overflow and abuse scenarios.
 */
const MAX_DOLLAR_AMOUNT = 1_000_000;

/**
 * Converts dollar amount to integer cents.
 *
 * **Financial Accuracy:**
 * - Uses Math.round() to handle floating-point precision
 * - Example: 25.125 → 2513 cents (rounds to nearest cent)
 *
 * @param dollars - Dollar amount (float)
 * @returns Integer cents (e.g., 25.00 → 2500)
 * @throws Error if amount is invalid (NaN, negative, or exceeds max)
 *
 * @example
 * ```typescript
 * dollarsToCents(25.00)    // 2500
 * dollarsToCents(0.99)     // 99
 * dollarsToCents(25.125)   // 2513 (rounds)
 * dollarsToCents(-5)       // throws Error
 * ```
 */
export function dollarsToCents(dollars: number): number {
  if (isNaN(dollars)) {
    throw new Error(`Invalid dollar amount: ${dollars}`);
  }
  if (dollars < 0) {
    throw new Error(`Dollar amount cannot be negative: ${dollars}`);
  }
  if (dollars > MAX_DOLLAR_AMOUNT) {
    throw new Error(`Dollar amount exceeds maximum of $${MAX_DOLLAR_AMOUNT.toLocaleString()}: $${dollars.toLocaleString()}`);
  }

  // Math.round handles floating-point precision issues
  // 25.00 * 100 = 2500.0000000001 → Math.round → 2500
  return Math.round(dollars * 100);
}

/**
 * Converts integer cents to dollar amount.
 *
 * @param cents - Integer cents (e.g., 2500)
 * @returns Dollar amount (e.g., 25.00)
 * @throws Error if cents is not an integer
 *
 * @example
 * ```typescript
 * centsToDollars(2500)   // 25.00
 * centsToDollars(99)     // 0.99
 * centsToDollars(0)      // 0.00
 * centsToDollars(25.5)   // throws Error (not an integer)
 * ```
 */
export function centsToDollars(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error(`Cents must be an integer: ${cents}`);
  }
  return cents / 100;
}

/**
 * Formats integer cents as currency string.
 *
 * **Display Format:**
 * - USD: "$25.00" (always 2 decimal places)
 * - Other currencies: Uses Intl.NumberFormat
 *
 * @param cents - Integer cents
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(2500, 'USD')  // "$25.00"
 * formatCurrency(99, 'USD')    // "$0.99"
 * formatCurrency(0, 'USD')     // "$0.00"
 * formatCurrency(2500, 'EUR')  // "€25.00" (locale-dependent)
 * ```
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents);

  // Fast path for USD (most common)
  if (currency === 'USD') {
    return `$${dollars.toFixed(2)}`;
  }

  // Use Intl.NumberFormat for other currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(dollars);
}

/**
 * Parses currency string to integer cents.
 *
 * Handles common formats:
 * - "$25.00" → 2500
 * - "25.00" → 2500
 * - "$25" → 2500
 * - "25.5" → 2550
 *
 * @param currencyString - Currency string with or without symbol
 * @returns Integer cents
 * @throws Error if parsing fails
 *
 * @example
 * ```typescript
 * parseCurrencyToCents("$25.00")   // 2500
 * parseCurrencyToCents("25.00")    // 2500
 * parseCurrencyToCents("$0.99")    // 99
 * parseCurrencyToCents("invalid")  // throws Error
 * ```
 */
export function parseCurrencyToCents(currencyString: string): number {
  // Remove currency symbols and whitespace
  const cleaned = currencyString.replace(/[$€£¥,\s]/g, '');
  const dollars = parseFloat(cleaned);

  if (isNaN(dollars)) {
    throw new Error(`Cannot parse currency string: "${currencyString}"`);
  }

  return dollarsToCents(dollars);
}
