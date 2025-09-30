# Validation Error

**HTTP Status:** 400
**Problem Type:** `/problems/validation-error`

## What This Means

The request body failed validation. This typically means required fields are missing, have invalid values, or don't match the expected format.

## Common Causes

- Missing `items[]` array
- Empty `items[]` (must have at least 1 installment)
- Bad date format (must be YYYY-MM-DD)
- Negative amounts or late fees
- Missing required fields: provider, installment_no, due_date, amount, currency, autopay, late_fee
- Missing timeZone (required)
- Missing payday information (need paycheckDates OR payCadence+nextPayday)

## How to Fix

1. Check the `detail` field in the error response for the specific issue
2. Verify all required fields are present
3. Ensure dates are in ISO format (YYYY-MM-DD)
4. Validate all numbers are positive
5. Provide at least 3 paycheckDates OR (payCadence + nextPayday)

## Example Response

```json
{
  "type": "https://your-domain.vercel.app/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "items array is required and must contain at least 1 installment",
  "instance": "/api/plan"
}
```

## Related

- [API Documentation](/docs)
- [Back to all problems](/problems)