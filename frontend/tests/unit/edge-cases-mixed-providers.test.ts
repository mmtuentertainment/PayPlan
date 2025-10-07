import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { DEFAULT_TIMEZONE } from '../fixtures/mock-items';

describe('Edge Cases: Mixed Provider Handling', () => {
  const timezone = DEFAULT_TIMEZONE;

  test('handles multiple providers in single paste', () => {
    const email = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder

Your next Klarna payment is coming up.

Payment 2 of 4: $45.00
Due date: October 15, 2025
AutoPay is ON

---

From: Affirm <notifications@affirm.com>
Subject: Upcoming payment

Your Affirm payment is due soon.

Installment 1 of 3: $58.00
Due: October 20, 2025
AutoPay is enabled`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(2);
    expect(result.items[0].provider).toBe('Klarna');
    expect(result.items[0].amount).toBe(4500);
    expect(result.items[1].provider).toBe('Affirm');
    expect(result.items[1].amount).toBe(5800);
  });

  test('handles Zip and Sezzle providers', () => {
    const email = `From: noreply@zip.co
Subject: Zip payment reminder

Your Zip payment 1 of 4 is due on 10/16/2025.

Payment details:
- Amount due: $25.00 USD
- Due date: 10/16/2025
- AutoPay is ON

---

From: hello@sezzle.com
Subject: Sezzle payment reminder

Your Sezzle installment 2 of 4 is coming up.

Payment details:
- Payment amount: $30.00 USD
- Due by: October 20, 2025
- Automatic payment is off`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(2);
    expect(result.items[0].provider).toBe('Zip');
    expect(result.items[0].amount).toBe(2500);
    expect(result.items[1].provider).toBe('Sezzle');
    expect(result.items[1].amount).toBe(3000);
  });

  test('handles PayPal Pay in 4 provider detection', () => {
    const email = `From: service@paypal.com
Subject: Pay in 4 payment reminder

Your Pay in 4 payment 1 of 4 is due on 10/18/2025.

Payment details:
- Amount due: $37.50
- Due date: 10/18/2025
- Payment method: AutoPay is ON`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items.length).toBe(1);
    expect(result.items[0].provider).toBe('PayPalPayIn4');
    expect(result.items[0].amount).toBe(3750);
  });

  test('handles provider detection via keywords in body', () => {
    // Test that provider is detected from "Klarna" keyword in body
    const email = `From: no-reply@example.com
Subject: Payment reminder

Your Klarna payment is coming up.

Payment 1 of 4: $25.00
Due date: October 15, 2025
AutoPay is OFF`;

    const result = extractItemsFromEmails(email, timezone);

    expect(result.items[0].provider).toBe('Klarna');
  });
});
