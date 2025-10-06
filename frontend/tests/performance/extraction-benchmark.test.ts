import { describe, test, expect } from 'vitest';
import { extractItemsFromEmails } from '../../src/lib/email-extractor';
import { runBenchmark, formatBenchmarkResults } from '../helpers/performance';

// Sample emails for benchmarking
const SMALL_EMAIL = `
Klarna payment reminder
Payment 1 of 4
Amount: $25.00
Due: 10/15/2025
`;

const MEDIUM_EMAIL = `
From: reminders@klarna.com
Subject: Payment Reminder

Hello,

This is a reminder that your Klarna payment is due soon.

Payment Details:
- Installment: 1 of 4
- Amount: $37.50
- Due Date: October 15, 2025
- Order: #12345

Please ensure you have sufficient funds in your account.
Autopay is enabled for this payment.

Late payment fee: $7.00

Thank you for using Klarna!

Best regards,
The Klarna Team

---
This email was sent to user@example.com
If you have questions, visit our FAQ at klarna.com/faq
`.repeat(2); // ~1KB

const LARGE_EMAIL = `
From: payment-reminders@affirm.com
Subject: Your Affirm Payment is Due Soon

Dear Customer,

We hope this email finds you well. This is an automated reminder regarding your upcoming Affirm payment.

PAYMENT DETAILS
================
Order Number: #AFF-2025-987654
Installment: 2 of 12
Amount Due: $125.99
Currency: USD
Due Date: October 20, 2025
Payment Method: Bank Account ending in 1234

AUTOPAY STATUS
===============
Autopay: Enabled
Your payment will be automatically processed on the due date.

LATE FEE INFORMATION
=====================
If payment is not received by the due date, a late fee of $15.00 will be applied.

PAYMENT HISTORY
================
Payment 1: $125.99 - Paid on 09/20/2025
Payment 2: $125.99 - Due on 10/20/2025
Payment 3: $125.99 - Scheduled for 11/20/2025

CUSTOMER SUPPORT
=================
Need help? Contact us:
- Phone: 1-855-423-3729
- Email: support@affirm.com
- Hours: Mon-Fri 6am-6pm PST

IMPORTANT NOTICES
==================
- Keep your payment information up to date
- Review your payment schedule regularly
- Contact us if you're experiencing financial difficulty

Thank you for choosing Affirm.

Best regards,
The Affirm Team

---
This is an automated message. Please do not reply to this email.
For assistance, visit affirm.com/help

Affirm, Inc.
650 California Street
San Francisco, CA 94108

Privacy Policy: affirm.com/privacy
Terms of Service: affirm.com/terms
`.repeat(10); // ~10KB

describe('Extraction Performance Benchmarks', () => {
  const timezone = 'America/New_York';

  test('baseline: small email extraction (100 chars)', () => {
    const results = runBenchmark(
      'Small Email',
      () => extractItemsFromEmails(SMALL_EMAIL, timezone),
      50
    );

    console.log(formatBenchmarkResults(results));

    // Performance assertions - baseline (will adjust after optimization)
    expect(results.avg).toBeLessThan(100); // Should take less than 100ms
    expect(results.avg).toBeGreaterThan(0); // Sanity check
  });

  test('baseline: medium email extraction (~1KB)', () => {
    const results = runBenchmark(
      'Medium Email',
      () => extractItemsFromEmails(MEDIUM_EMAIL, timezone),
      50
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(150); // Should take less than 150ms
  });

  test('baseline: large email extraction (~10KB)', () => {
    const results = runBenchmark(
      'Large Email',
      () => extractItemsFromEmails(LARGE_EMAIL, timezone),
      30
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(300); // Should take less than 300ms
  });

  test('baseline: rapid extractions (10 consecutive)', () => {
    const rapidExtractions = () => {
      for (let i = 0; i < 10; i++) {
        extractItemsFromEmails(SMALL_EMAIL, timezone);
      }
    };

    const results = runBenchmark(
      '10 Rapid Extractions',
      rapidExtractions,
      10
    );

    console.log(formatBenchmarkResults(results));

    expect(results.avg).toBeLessThan(1000); // 10 extractions < 1 second
  });

  test('baseline: extraction accuracy maintained', () => {
    // Ensure benchmarks don't compromise accuracy
    const result = extractItemsFromEmails(SMALL_EMAIL, timezone);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].provider).toBe('Klarna');
    expect(result.items[0].amount).toBe(2500); // $25.00 in cents
    expect(result.items[0].installment_no).toBe(1);
  });
});
