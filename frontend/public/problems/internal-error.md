# Internal Server Error

**HTTP Status:** 500
**Problem Type:** `/problems/internal-error`

## What This Means

An unexpected error occurred on the server while processing your request. This is not caused by invalid input - it's a server-side issue.

## Common Causes

- Unexpected exception in plan generation logic
- Timezone calculation error with invalid IANA identifier
- ICS generation failure
- Redis connection issues (transient)
- Out of memory (very rare)

## How to Fix

1. **Retry the request** after a short delay (may be transient)
2. **Verify your data:**
   - Check all dates are valid
   - Ensure timezone is a valid IANA identifier (e.g., "America/New_York")
   - Validate all numeric fields
3. **Simplify:** Try with minimal data (1 installment) to isolate the issue
4. **Report:** If error persists, open a GitHub issue with sanitized request details

## What We Log

Server errors are logged with stack traces for debugging. We never log your payment data for privacy reasons.

## Example Response

```json
{
  "type": "https://your-domain.vercel.app/problems/internal-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Unexpected error occurred",
  "instance": "/api/plan"
}
```

## If Problem Persists

1. Wait a few minutes and retry
2. Try with sample/minimal data
3. Check if production is operational
4. Report via GitHub issues (include request format, not actual payment data)

## Related

- [API Documentation](/docs)
- [Back to all problems](/problems)