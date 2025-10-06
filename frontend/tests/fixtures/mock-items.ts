/**
 * Mock payment items and extraction results for testing.
 *
 * Provides factory functions and pre-built constants to eliminate
 * duplication of test data across unit and integration tests.
 *
 * @module tests/fixtures/mock-items
 */

import type { Item, ExtractionResult, Issue } from '../../src/lib/extraction/core/types';

/**
 * Default timezone used across tests
 */
export const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Creates a mock payment item with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @param overrides - Partial item to override defaults
 * @returns Complete mock Item object
 *
 * @example
 * ```typescript
 * // Minimal Klarna item with defaults
 * const item = createMockItem();
 *
 * // Custom Affirm item
 * const affirm = createMockItem({
 *   provider: 'Affirm',
 *   amount: 5000,
 *   late_fee: 1500
 * });
 * ```
 */
export function createMockItem(overrides?: Partial<Item>): Item {
  return {
    id: 'test-item-1',
    provider: 'Klarna',
    installment_no: 1,
    due_date: '2025-10-15',
    amount: 2500, // $25.00
    currency: 'USD',
    autopay: false,
    late_fee: 700, // $7.00
    confidence: 1.0,
    ...overrides
  };
}

/**
 * Creates a mock extraction result with sensible defaults.
 * All fields can be overridden via the overrides parameter.
 *
 * @param overrides - Partial result to override defaults
 * @returns Complete mock ExtractionResult object
 *
 * @example
 * ```typescript
 * // Single Klarna item, no issues
 * const result = createMockResult();
 *
 * // Multiple items with issues
 * const complex = createMockResult({
 *   items: [createMockItem(), createMockItem({ provider: 'Affirm' })],
 *   issues: [{ id: 'err-1', snippet: 'Bad email', reason: 'Invalid format' }]
 * });
 * ```
 */
export function createMockResult(overrides?: Partial<ExtractionResult>): ExtractionResult {
  return {
    items: [createMockItem()],
    issues: [],
    duplicatesRemoved: 0,
    dateLocale: 'US',
    ...overrides
  };
}

/**
 * Creates a mock issue object for testing error cases.
 *
 * @param overrides - Partial issue to override defaults
 * @returns Complete mock Issue object
 *
 * @example
 * ```typescript
 * const issue = createMockIssue({ reason: 'Amount not found' });
 * ```
 */
export function createMockIssue(overrides?: Partial<Issue>): Issue {
  return {
    id: `issue-${Date.now()}`,
    snippet: 'Email snippet...',
    reason: 'Extraction failed',
    ...overrides
  };
}

/**
 * Pre-built Klarna payment item (standard defaults)
 * Use for: Quick tests that need a valid Klarna item
 */
export const KLARNA_ITEM: Item = createMockItem();

/**
 * Pre-built Affirm payment item
 * Use for: Tests involving Affirm provider
 */
export const AFFIRM_ITEM: Item = createMockItem({
  id: 'affirm-1',
  provider: 'Affirm',
  installment_no: 2,
  due_date: '2025-10-20',
  amount: 12599, // $125.99
  late_fee: 1500, // $15.00
  autopay: true
});

/**
 * Pre-built Afterpay payment item
 * Use for: Tests involving Afterpay provider
 */
export const AFTERPAY_ITEM: Item = createMockItem({
  id: 'afterpay-1',
  provider: 'Afterpay',
  installment_no: 3,
  due_date: '2025-11-01',
  amount: 3750, // $37.50
  late_fee: 0, // No late fee
  autopay: false
});

/**
 * Pre-built PayPal Pay in 4 payment item
 * Use for: Tests involving PayPal Pay in 4 provider
 */
export const PAYPAL_ITEM: Item = createMockItem({
  id: 'paypal-1',
  provider: 'PayPalPayIn4',
  installment_no: 1,
  due_date: '2025-10-10',
  amount: 5000, // $50.00
  late_fee: 0, // No late fee
  autopay: true
});

/**
 * Pre-built low-confidence item (missing signals)
 * Use for: Tests validating low-confidence detection
 */
export const LOW_CONFIDENCE_ITEM: Item = createMockItem({
  id: 'low-conf-1',
  provider: 'Unknown',
  amount: 0,
  installment_no: 0,
  confidence: 0.25 // Only date signal present
});

/**
 * Pre-built high-confidence item (all signals)
 * Use for: Tests validating high-confidence detection
 */
export const HIGH_CONFIDENCE_ITEM: Item = createMockItem({
  confidence: 1.0 // All signals present (default)
});
