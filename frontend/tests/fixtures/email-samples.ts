/**
 * Shared email fixtures for testing email extraction.
 *
 * Provides consistent test data across unit, integration, and performance tests.
 * All email samples are based on real BNPL provider patterns.
 *
 * @module tests/fixtures/email-samples
 */

/**
 * Simple inline Klarna payment (minimal format)
 * Use for: Quick tests, cache tests, simple extraction validation
 */
export const KLARNA_SIMPLE = 'Klarna payment 1/4: $25.00 due 10/15/2025';

/**
 * Full multi-line Klarna payment reminder
 * Use for: Integration tests, realistic extraction scenarios
 */
export const KLARNA_FULL = `
Your Klarna payment is due soon!
Payment 1 of 4
Due: October 15, 2025
Amount: $25.00
Order #12345
`;

/**
 * Small Klarna email for benchmarks (~100 chars)
 * Use for: Performance baseline tests
 */
export const KLARNA_SMALL = `
Klarna payment reminder
Payment 1 of 4
Amount: $25.00
Due: 10/15/2025
`;

/**
 * Medium Klarna email with full details (~500 chars base)
 * Use for: Medium-size extraction benchmarks
 */
export const KLARNA_MEDIUM_BASE = `
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
`;

/**
 * Large Affirm email with extensive details (~1KB base)
 * Use for: Large-size extraction benchmarks
 */
export const AFFIRM_LARGE_BASE = `
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
`;

/**
 * Scale an email template to specific size for benchmarking.
 *
 * @param template - Base email template to scale
 * @param size - Target size: 'small' (1x), 'medium' (2x), 'large' (10x)
 * @returns Scaled email text
 *
 * @example
 * ```typescript
 * const mediumEmail = scaleEmail(KLARNA_MEDIUM_BASE, 'medium');
 * // Result: ~1KB email (2x repetition)
 * ```
 */
export function scaleEmail(
  template: string,
  size: 'small' | 'medium' | 'large'
): string {
  const multipliers = {
    small: 1,
    medium: 2,
    large: 10
  };

  return template.repeat(multipliers[size]);
}

/**
 * Size multiplier constants for consistent benchmarking
 */
export const EMAIL_SIZES = {
  SMALL: 1,
  MEDIUM: 2,
  LARGE: 10
} as const;
