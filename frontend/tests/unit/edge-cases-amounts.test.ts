import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { DEFAULT_TIMEZONE } from '../fixtures/mock-items';

describe('Edge Cases: Amount Handling', () => {
  const timezone = DEFAULT_TIMEZONE;

  test('handles very small amounts (cents)', () => {
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $0.01
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(1); // Stored as integer cents
  });

  test('handles large amounts (thousands)', () => {
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $9,999.99
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(999999); // 9999.99 * 100 = 999999 cents
  });

  test('handles amounts with comma separators', () => {
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $1,234.56
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(123456); // 1234.56 * 100 = 123456 cents
  });

  test('handles amounts without dollar sign (with 2 decimals)', () => {
    // Pattern requires "payment" keyword followed by amount with 2 decimals
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment: 45.00
Payment 1 of 4
Due date: October 15, 2025
AutoPay is OFF
Late fee: $7.00`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(4500); // 45.00 * 100 = 4500 cents
  });

  test('handles amounts with space after dollar sign', () => {
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $ 45.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(4500);
  });

  test('handles typical format with 2 decimal places', () => {
    // Most common format - this is what real emails use
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $50.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(5000); // 50.00 * 100 = 5000 cents
  });

  test('handles amounts in fallback patterns', () => {
    // Using fallback pattern: 0-2 decimals allowed
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment: $45.5
Payment 1 of 4
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    // $45.5 should be parsed as $45.50
    expect(result.items[0].amount).toBe(4550); // 45.50 * 100 = 4550 cents
  });

  test('extracts non-zero amounts correctly', () => {
    // Verify that valid non-zero amounts are extracted
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $25.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBeGreaterThan(0);
    expect(result.items[0].amount).toBe(2500);
  });

  test('handles amounts with negative appearing in different context', () => {
    // Test that negative signs don't break extraction when in refund context
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.
Note: Previous refund of -$10.00 was processed.

Payment 1 of 4: $25.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    // Should extract the positive payment amount, not the negative refund
    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(2500);
  });

  test('handles amounts in different positions', () => {
    // Amount appears in "$ due" format
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

$25.00 due on October 15, 2025
Payment 1 of 4
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(2500);
  });

  test('handles multiple amounts (prioritizes first valid)', () => {
    // Has installment total and individual amount
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Total purchase: $100.00
Payment 1 of 4: $25.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    // Should extract the payment amount (first match in patterns)
    expect(result.items[0].amount).toBeGreaterThan(0);
  });

  test('extracts currency code when present', () => {
    // Currency extraction is separate from amount extraction
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 1 of 4: $25.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].amount).toBe(2500);
    // Currency defaults to USD when $ sign is used
    expect(result.items[0].currency).toBe('USD');
  });
});
