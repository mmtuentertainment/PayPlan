/**
 * Sample BNPL payment reminder emails for demonstration.
 *
 * Date format note: All dates use full month names (e.g., "October 6, 2025")
 * for clarity and to test the parser's ability to handle various formats.
 * The parser also supports: ISO (2025-10-06), US slash (10/6/2025),
 * abbreviated months (Oct 6, 2025), and ordinals (October 6th, 2025).
 */
export const SAMPLE_EMAILS = `From: Klarna <no-reply@klarna.com>
Subject: Payment reminder - $45.00 due October 6

Hi there,

Your next Klarna payment is coming up.

Payment 2 of 4: $45.00
Due date: October 6, 2025
AutoPay is ON - we'll charge your card automatically

Late payment fee: $7.00

---

From: Affirm <notifications@affirm.com>
Subject: Upcoming payment on October 10

Your Affirm payment is due soon.

Installment 1 of 3: $58.00
Due: October 10, 2025
Payment method: Bank account ending in 0000 (sample data)

---

From: Klarna <no-reply@klarna.com>
Subject: Payment due October 15

Payment 3 of 4: $45.00
Due: October 15, 2025

---

From: Affirm <notifications@affirm.com>
Subject: Payment reminder

Installment 2 of 3: $58.00
Due date: November 6, 2025
AutoPay is enabled

---

From: Klarna <no-reply@klarna.com>
Subject: Final payment reminder

Payment 4 of 4: $45.00
Due: October 24, 2025
Late fee if missed: $7.00
`;
