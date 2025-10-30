# BNPL Synthetic Test Emails

## Purpose
Realistic test emails for all 6 BNPL providers based on official documentation and inferred formats.

## Usage
Copy-paste each email into the BNPL Email Parser at http://localhost:5173/bnpl

---

## Test Email #1: Klarna (Pay in 4)
**Status**: ✅ Already tested - parser works!

```
Subject: Your purchase at Target

Your purchase at Target for $200.00 in 4 payments

Thank you for your order! Here's your payment schedule:

Payment 1: $50.00 due November 1, 2025
Payment 2: $50.00 due November 15, 2025
Payment 3: $50.00 due November 29, 2025
Payment 4: $50.00 due December 13, 2025

Total: $200.00

Questions? Visit klarna.com/support
```

**Expected Parser Output:**
- Provider: Klarna
- Merchant: Target
- Total: $200.00
- Payments: 4 × $50.00
- Dates: Nov 1, Nov 15, Nov 29, Dec 13

---

## Test Email #2: Affirm (Monthly with APR)
**Status**: 🔨 Ready to test

```
Subject: Your Affirm loan confirmation

Hi there,

Your loan for $600.00 at Best Buy has been confirmed.

Here's your payment schedule:

Payment 1: $52.50 due December 1, 2025
Payment 2: $52.50 due January 1, 2026
Payment 3: $52.50 due February 1, 2026
Payment 4: $52.50 due March 1, 2026
Payment 5: $52.50 due April 1, 2026
Payment 6: $52.50 due May 1, 2026
Payment 7: $52.50 due June 1, 2026
Payment 8: $52.50 due July 1, 2026
Payment 9: $52.50 due August 1, 2026
Payment 10: $52.50 due September 1, 2026
Payment 11: $52.50 due October 1, 2026
Payment 12: $52.50 due November 1, 2026

Total amount: $630.00
APR: 10%
Total interest: $30.00

Manage your loan at affirm.com or in the Affirm app.

Questions? Visit affirm.com/help
```

**Expected Parser Output:**
- Provider: Affirm
- Merchant: Best Buy
- Total: $600.00 (or $630.00 with interest)
- Payments: 12 × $52.50
- APR: 10%
- Dates: Monthly (Dec 1, Jan 1, Feb 1, etc.)

---

## Test Email #3: Afterpay (Pay in 4)
**Status**: 🔨 Ready to test

```
Subject: Your Afterpay payment confirmation

Hi there,

Your purchase at Nike for $160.00

Payment schedule:

Payment 1: $40.00 (paid at checkout on October 28, 2025)
Payment 2: $40.00 due November 11, 2025
Payment 3: $40.00 due November 25, 2025
Payment 4: $40.00 due December 9, 2025

Total: $160.00

Log in to your Afterpay account at afterpay.com to manage your payments.

Questions? Visit help.afterpay.com
```

**Expected Parser Output:**
- Provider: Afterpay
- Merchant: Nike
- Total: $160.00
- Payments: 4 × $40.00
- Dates: Oct 28, Nov 11, Nov 25, Dec 9

---

## Test Email #4: Sezzle (Pay in 4)
**Status**: 🔨 Ready to test

```
Subject: Your Sezzle order confirmation

Your order at Urban Outfitters for $120.00

Payment schedule:

Payment 1: $30.00 due October 28, 2025 (paid today)
Payment 2: $30.00 due November 11, 2025
Payment 3: $30.00 due November 25, 2025
Payment 4: $30.00 due December 9, 2025

Total: $120.00
Interest: $0.00

Manage your payments at sezzle.com or in the Sezzle app.

Questions? Contact support at sezzle.com/help
```

**Expected Parser Output:**
- Provider: Sezzle
- Merchant: Urban Outfitters
- Total: $120.00
- Payments: 4 × $30.00
- Dates: Oct 28, Nov 11, Nov 25, Dec 9

---

## Test Email #5: Zip (Pay in 4)
**Status**: 🔨 Ready to test

```
Subject: Your Zip purchase confirmation

Your purchase at Sephora for $240.00

Payment schedule:

Payment 1: $60.00 due October 28, 2025 (paid today)
Payment 2: $60.00 due November 11, 2025
Payment 3: $60.00 due November 25, 2025
Payment 4: $60.00 due December 9, 2025

Total: $240.00

Manage your account at zip.co or in the Zip app.

Need help? Visit help.zip.co
```

**Expected Parser Output:**
- Provider: Zip
- Merchant: Sephora
- Total: $240.00
- Payments: 4 × $60.00
- Dates: Oct 28, Nov 11, Nov 25, Dec 9

---

## Test Email #6: PayPal Credit (Monthly)
**Status**: 🔨 Ready to test

```
Subject: Your PayPal Credit purchase

Your PayPal Credit purchase at Amazon for $500.00

Payment schedule:

Payment 1: $83.33 due November 28, 2025
Payment 2: $83.33 due December 28, 2025
Payment 3: $83.33 due January 28, 2026
Payment 4: $83.33 due February 28, 2026
Payment 5: $83.33 due March 28, 2026
Payment 6: $83.35 due April 28, 2026

Total: $500.00
APR: 0% (promotional rate)
Interest: $0.00

Manage your PayPal Credit at paypal.com/credit

Questions? Visit paypal.com/help
```

**Expected Parser Output:**
- Provider: PayPal Credit
- Merchant: Amazon
- Total: $500.00
- Payments: 6 × ~$83.33
- APR: 0%
- Dates: Monthly (Nov 28, Dec 28, Jan 28, etc.)

---

## Testing Checklist

For each email above:

1. ✅ **Copy email text**
2. ✅ **Paste into BNPL Parser** (http://localhost:5173/bnpl)
3. ✅ **Click "Parse Email"**
4. ✅ **Verify extracted data**:
   - Provider detected correctly
   - Merchant name extracted
   - Total amount extracted
   - Payment schedule extracted
   - Dates are correct (no timezone bug)
   - Number of payments correct
5. ✅ **Click "Save Payment Schedule"**
6. ✅ **Verify schedule appears in saved list**
7. ✅ **Delete schedule** (test delete functionality)

---

## Expected Results

### All 6 Providers Should:
- ✅ Parse successfully
- ✅ Extract merchant name
- ✅ Extract total amount
- ✅ Extract payment schedule
- ✅ Show correct dates (no timezone issues)
- ✅ Save to localStorage
- ✅ Display in saved list
- ✅ Delete successfully

### If Any Fail:
- 🐛 Note which provider failed
- 🐛 Note what data was incorrect
- 🐛 Report to Claude Code for regex refinement

---

## Notes

### Provider Patterns:
- **Klarna**: "Your purchase at [Merchant] for $[Amount] in 4 payments"
- **Affirm**: "Your loan for $[Amount] at [Merchant]" + APR info
- **Afterpay**: "Your purchase at [Merchant] for $[Amount]" + "paid at checkout"
- **Sezzle**: "Your order at [Merchant] for $[Amount]" + "paid today"
- **Zip**: "Your purchase at [Merchant] for $[Amount]" + "paid today"
- **PayPal Credit**: "Your PayPal Credit purchase at [Merchant] for $[Amount]"

### Date Patterns:
- **Bi-weekly**: Every 14 days (Klarna, Afterpay, Sezzle, Zip)
- **Monthly**: Same day each month (Affirm, PayPal Credit)

### Amount Patterns:
- **Equal payments**: Most providers (4 × $50 = $200)
- **Final payment adjustment**: Sometimes last payment is slightly different ($83.35 vs $83.33)
- **Interest**: Affirm and PayPal Credit may have APR/interest

---

## Success Criteria

**Ship-ready if:**
- ✅ 5/6 providers parse correctly (83%+ success rate)
- ✅ Klarna works (already tested)
- ✅ At least 1 APR provider works (Affirm or PayPal Credit)
- ✅ No critical bugs (crashes, data loss)

**Acceptable failures:**
- ⚠️ 1 provider fails (can fix in Phase 2)
- ⚠️ APR parsing issues (edge case)
- ⚠️ Minor date formatting differences

**Blockers (must fix before ship):**
- 🚫 3+ providers fail (parser broken)
- 🚫 Timezone bug returns (dates off by 1 day)
- 🚫 Data doesn't persist (localStorage broken)
- 🚫 App crashes on parse

---

## Ready to Test!

Copy-paste these emails to Claude Code with the testing instructions below.

