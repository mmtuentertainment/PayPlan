import type { Item } from '../core/types';

/**
 * Calculates confidence score for an extracted payment item.
 *
 * Confidence is based on presence of key signals:
 * - Provider: 0.35 (35%)
 * - Date: 0.25 (25%)
 * - Amount: 0.20 (20%)
 * - Installment: 0.15 (15%)
 * - Autopay: 0.05 (5%)
 *
 * @param item - Partial or complete payment item
 * @returns Confidence score between 0 and 1
 *
 * @example
 * ```typescript
 * const score = calculateItemConfidence({
 *   provider: 'Klarna',
 *   due_date: '2025-10-15',
 *   amount: 2500,
 *   installment_no: 1,
 *   autopay: true
 * });
 * console.log(score); // 1.0 (all signals present)
 * ```
 */
export function calculateItemConfidence(item: Partial<Item>): number {
  const signals = {
    provider: item.provider !== undefined && item.provider !== 'Unknown',
    date: item.due_date !== undefined && item.due_date.length > 0,
    amount: item.amount !== undefined && item.amount > 0,
    installment: item.installment_no !== undefined && item.installment_no > 0,
    autopay: typeof item.autopay === 'boolean'
  };

  return (
    (signals.provider ? 0.35 : 0) +
    (signals.date ? 0.25 : 0) +
    (signals.amount ? 0.20 : 0) +
    (signals.installment ? 0.15 : 0) +
    (signals.autopay ? 0.05 : 0)
  );
}
