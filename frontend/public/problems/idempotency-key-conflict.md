# Idempotency Key Conflict

**HTTP Status:** 409
**Problem Type:** `/problems/idempotency-key-conflict`

## What This Means

The Idempotency-Key header you provided was previously used with a different request body within the last 60 seconds. This prevents accidental duplicate processing with different data.

## Common Causes

- Reusing the same key with modified request data
- Copy-paste error using wrong key
- Concurrent requests with same key but different data
- Testing without generating unique keys

## How to Fix

**Option 1 (Recommended):** Generate a new Idempotency-Key
```javascript
// Use UUID v4
const key = crypto.randomUUID();
```

**Option 2:** Wait 60 seconds for the cache to expire, then retry with same key

**Option 3:** Verify your request body matches the original request

## Idempotency Best Practices

- Use UUID v4 for guaranteed uniqueness
- One key per unique logical request
- Safe to retry with same key + same body within 60s
- Store keys client-side to track which requests succeeded

## Example Response

```json
{
  "type": "https://your-domain.vercel.app/problems/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 409,
  "detail": "This Idempotency-Key was used with a different request body. Use a new key or wait 60 seconds.",
  "instance": "/api/plan"
}
```

## How Idempotency Works

1. **First request with key:** Processed normally, response cached for 60s
2. **Retry (same key + same body):** Returns cached response instantly (no reprocessing)
3. **Different body:** Returns 409 conflict to prevent data inconsistency

## Related

- [API Documentation](/docs)
- [Back to all problems](/problems)