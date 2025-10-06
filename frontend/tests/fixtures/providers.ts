/**
 * Provider name constants for consistent test assertions.
 *
 * Prevents typos and provides autocomplete for provider names
 * across all test files.
 *
 * @module tests/fixtures/providers
 */

/**
 * Official provider names matching extraction patterns
 */
export const PROVIDERS = {
  KLARNA: 'Klarna',
  AFFIRM: 'Affirm',
  AFTERPAY: 'Afterpay',
  PAYPAL_PAY_IN_4: 'PayPalPayIn4',
  ZIP: 'Zip',
  SEZZLE: 'Sezzle',
  UNKNOWN: 'Unknown'
} as const;

/**
 * Type-safe provider name type
 */
export type ProviderName = typeof PROVIDERS[keyof typeof PROVIDERS];
