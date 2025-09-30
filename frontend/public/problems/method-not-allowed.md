# Method Not Allowed

**HTTP Status:** 405
**Problem Type:** `/problems/method-not-allowed`

## What This Means

This endpoint only supports POST requests (and OPTIONS for CORS preflight). You attempted to use a different HTTP method.

## Common Causes

- Using GET instead of POST
- Using PUT, PATCH, DELETE, or other methods
- Misconfigured HTTP client
- Browser navigation attempting to GET the endpoint

## How to Fix

Use POST method:

```bash
curl -X POST https://your-domain.vercel.app/api/plan \
  -H "Content-Type: application/json" \
  -d '{"items":[...],"timeZone":"America/New_York","minBuffer":100,"paycheckDates":[...]}'
```

## Example Response

```json
{
  "type": "https://your-domain.vercel.app/problems/method-not-allowed",
  "title": "Method Not Allowed",
  "status": 405,
  "detail": "Method GET not allowed. Use POST.",
  "instance": "/api/plan"
}
```

## Related

- [API Documentation](/docs)
- [Back to all problems](/problems)