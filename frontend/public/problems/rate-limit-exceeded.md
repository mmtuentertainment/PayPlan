# Rate Limit Exceeded

**HTTP Status:** 429
**Problem Type:** `/problems/rate-limit-exceeded`

## What This Means

Too many requests from your IP address. The API enforces a sliding window rate limit of 60 requests per hour to ensure fair usage and service stability.

## Rate Limit Details

- **Limit:** 60 requests per rolling 60-minute window
- **Algorithm:** Sliding window (fairer than fixed window)
- **Tracking:** Per client IP address (from x-forwarded-for header)

## How to Fix

1. Wait for the time specified in the `Retry-After` header (seconds)
2. Check `X-RateLimit-Reset` header for exact reset time (Unix timestamp)
3. Implement exponential backoff in your client
4. Space out requests (max 1 per minute for sustained usage)
5. Monitor `X-RateLimit-Remaining` to track quota

## Rate Limit Headers (on ALL responses)

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1759255504
Retry-After: 120
```

## Example Response

```json
{
  "type": "https://your-domain.vercel.app/problems/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests from this IP. Retry after 120 seconds.",
  "instance": "/api/plan"
}
```

## Best Practices

- Check `X-RateLimit-Remaining` before sending bursts
- Implement retry logic with exponential backoff
- Cache responses client-side when appropriate
- Use Idempotency-Key for safe retries

## Related

- [API Documentation](/docs)
- [Back to all problems](/problems)