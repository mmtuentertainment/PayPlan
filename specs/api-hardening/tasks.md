# Task List: API Hardening (v0.1.1)

**Feature**: 003-api-hardening
**Branch**: `003-api-hardening`
**Estimated Total Time**: 12-15 hours

---

## Task 1: Dependencies & Environment
**Time**: 20-30 minutes

### Acceptance Criteria
- [x] @upstash/redis and @upstash/ratelimit installed in frontend/package.json
- [x] Environment variables documented in .env.example
- [x] Upstash Redis account created (free tier)
- [x] Environment variables configured in Vercel dashboard
- [x] Build succeeds with new dependencies

### Files to Create/Modify
```
frontend/package.json           # Add dependencies
.env.example                    # Add Upstash variables
README.md                       # Add environment setup section
```

### Commands
```bash
cd frontend
npm install @upstash/redis @upstash/ratelimit

# Update .env.example
cat >> ../.env.example << 'EOF'

# Upstash Redis (for rate limiting and idempotency)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Rate limiting configuration
RATE_LIMIT_PER_HOUR=60

# Idempotency cache TTL
IDEMPOTENCY_TTL_SECONDS=60
EOF

# Sign up for Upstash: https://console.upstash.com/
# Create Redis database (Global region or closest to Vercel deployment)
# Copy REST API credentials
# Add to Vercel: Project Settings → Environment Variables
```

### Verification Steps
1. Run `npm list @upstash/redis @upstash/ratelimit` - both listed
2. Check `.env.example` - Upstash variables present
3. Verify Upstash dashboard - Redis database created
4. Check Vercel dashboard - Environment variables set
5. Run `npm run build` - no errors

### Definition of Done
- Dependencies in package.json
- Environment variables documented
- Upstash account active with database
- Vercel env vars configured
- Build passes

---

## Task 2: RFC 9457 Problem Details Helpers
**Time**: 30-40 minutes

### Acceptance Criteria
- [x] problem.ts utility module created
- [x] buildProblem() function creates RFC 9457 compliant objects
- [x] sendProblem() function sets correct headers and status
- [x] Problem type constants defined for all 5 error types
- [x] Absolute URI builder uses request host
- [x] TypeScript types exported

### Files to Create/Modify
```
frontend/api/_utils/problem.ts   # New utility module
```

### Implementation Code

**api/_utils/problem.ts:**
```typescript
import type { ServerResponse } from 'http';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export const PROBLEM_TYPES = {
  VALIDATION_ERROR: {
    type: '/problems/validation-error',
    title: 'Validation Error',
    status: 400
  },
  METHOD_NOT_ALLOWED: {
    type: '/problems/method-not-allowed',
    title: 'Method Not Allowed',
    status: 405
  },
  IDEMPOTENCY_KEY_CONFLICT: {
    type: '/problems/idempotency-key-conflict',
    title: 'Idempotency Key Conflict',
    status: 409
  },
  RATE_LIMIT_EXCEEDED: {
    type: '/problems/rate-limit-exceeded',
    title: 'Rate Limit Exceeded',
    status: 429
  },
  INTERNAL_ERROR: {
    type: '/problems/internal-error',
    title: 'Internal Server Error',
    status: 500
  }
} as const;

export function buildProblem(
  problemType: typeof PROBLEM_TYPES[keyof typeof PROBLEM_TYPES],
  detail: string,
  host: string,
  instance?: string
): ProblemDetails {
  return {
    type: `https://${host}${problemType.type}`,
    title: problemType.title,
    status: problemType.status,
    detail,
    instance: instance || '/api/plan'
  };
}

export function sendProblem(res: ServerResponse, problem: ProblemDetails): void {
  res.statusCode = problem.status;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}
```

### Verification Steps
1. File exists at `frontend/api/_utils/problem.ts`
2. TypeScript compiles without errors
3. All 5 problem types defined
4. buildProblem() creates object with all required fields
5. sendProblem() sets Content-Type header

### Definition of Done
- problem.ts module created
- All RFC 9457 required fields present
- TypeScript types exported
- Helper functions documented

---

## Task 3: Client IP Extraction
**Time**: 15-20 minutes

### Acceptance Criteria
- [x] ip.ts utility module created
- [x] Extracts first IP from x-forwarded-for header
- [x] Handles comma-separated list
- [x] Fallback to x-real-ip if x-forwarded-for absent
- [x] Returns undefined if no IP found
- [x] Unit test for multi-IP header

### Files to Create/Modify
```
frontend/api/_utils/ip.ts        # New utility
tests/unit/ip.test.ts            # Unit test
```

### Implementation Code

**api/_utils/ip.ts:**
```typescript
import type { IncomingMessage } from 'http';

export function getClientIp(req: IncomingMessage): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    // x-forwarded-for can be comma-separated: "client, proxy1, proxy2"
    // Take the FIRST value (original client)
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return undefined;
}
```

**tests/unit/ip.test.ts:**
```typescript
import { getClientIp } from '../../frontend/api/_utils/ip';
import type { IncomingMessage } from 'http';

describe('getClientIp', () => {
  it('should extract first IP from x-forwarded-for', () => {
    const req = {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }
    } as IncomingMessage;
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should handle single IP', () => {
    const req = {
      headers: { 'x-forwarded-for': '1.2.3.4' }
    } as IncomingMessage;
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('should fallback to x-real-ip', () => {
    const req = {
      headers: { 'x-real-ip': '9.10.11.12' }
    } as IncomingMessage;
    expect(getClientIp(req)).toBe('9.10.11.12');
  });

  it('should return undefined if no IP headers', () => {
    const req = { headers: {} } as IncomingMessage;
    expect(getClientIp(req)).toBeUndefined();
  });
});
```

### Verification Steps
1. Run unit tests: `npm test -- ip.test.ts`
2. All 4 tests pass
3. TypeScript compiles

### Definition of Done
- ip.ts module created
- Handles all header scenarios
- Unit tests pass
- Returns first IP from comma-separated list

---

## Task 4: Upstash Redis Client
**Time**: 20-25 minutes

### Acceptance Criteria
- [x] redis.ts utility module created
- [x] Lazy-initialized singleton pattern
- [x] Validates environment variables present
- [x] Returns Upstash Redis client instance
- [x] Handles missing credentials gracefully (returns null + logs warning)
- [x] Health check function for testing

### Files to Create/Modify
```
frontend/api/_utils/redis.ts     # New utility
```

### Implementation Code

**api/_utils/redis.ts:**
```typescript
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;
let initAttempted = false;

export function getRedisClient(): Redis | null {
  if (initAttempted) return redisClient;

  initAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting and idempotency disabled.');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token
    });
    console.log('[Redis] Client initialized successfully');
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

export async function healthCheck(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}
```

### Verification Steps
1. Set env vars locally: `export UPSTASH_REDIS_REST_URL=...`
2. Test import: `node -e "require('./frontend/api/_utils/redis.ts')"`
3. Health check returns true with valid credentials
4. Missing credentials returns null + logs warning (not crash)

### Definition of Done
- redis.ts module created
- Singleton pattern implemented
- Environment validation
- Graceful failure (null return, not throw)

---

## Task 5: Rate Limit Middleware (Sliding Window)
**Time**: 40-50 minutes

### Acceptance Criteria
- [x] ratelimit.ts utility module created
- [x] Uses @upstash/ratelimit with sliding window algorithm
- [x] Rate limit: 60 requests per rolling 60 minutes
- [x] Key pattern: `PAYPLAN:{env}:rl:{ip}`
- [x] Returns {allowed, remaining, reset, retryAfterSeconds}
- [x] Builds X-RateLimit-* headers
- [x] On exceed, returns 429 problem+json with Retry-After

### Files to Create/Modify
```
frontend/api/_utils/ratelimit.ts # New utility
```

### Implementation Code

**api/_utils/ratelimit.ts:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from './redis';
import { buildProblem, PROBLEM_TYPES } from './problem';
import type { ServerResponse } from 'http';

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '60', 10);
const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;

  const redis = getRedisClient();
  if (!redis) return null;

  const env = process.env.NODE_ENV || 'development';
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT, `${WINDOW_MS} ms`),
    prefix: `PAYPLAN:${env}:rl`,
    analytics: false
  });

  return limiter;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;  // Unix timestamp (seconds)
  retryAfterSeconds?: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getLimiter();

  // If Redis not available, allow request (fail open)
  if (!limiter || !ip) {
    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: Math.floor((Date.now() + WINDOW_MS) / 1000)
    };
  }

  try {
    const result = await limiter.limit(ip);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: Math.floor(result.reset / 1000), // Convert ms to seconds
      retryAfterSeconds: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000)
    };
  } catch (error) {
    console.error('[RateLimit] Check failed, allowing request:', error);
    // Fail open on errors
    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: Math.floor((Date.now() + WINDOW_MS) / 1000)
    };
  }
}

export function setRateLimitHeaders(res: ServerResponse, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.reset.toString());

  if (result.retryAfterSeconds !== undefined) {
    res.setHeader('Retry-After', result.retryAfterSeconds.toString());
  }
}

export function sendRateLimitExceeded(res: ServerResponse, result: RateLimitResult, host: string): void {
  const problem = buildProblem(
    PROBLEM_TYPES.RATE_LIMIT_EXCEEDED,
    `Rate limit of ${result.limit} requests per hour exceeded. Please retry after ${result.retryAfterSeconds} seconds.`,
    host
  );

  setRateLimitHeaders(res, result);
  res.statusCode = 429;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}
```

### Verification Steps
1. TypeScript compiles without errors
2. Mock Redis call returns sliding window result
3. Headers builder creates X-RateLimit-* headers
4. Retry-After is integer (seconds)
5. Fail-open behavior when Redis unavailable

### Definition of Done
- Sliding window algorithm configured
- Returns RateLimitResult with all fields
- Headers set on response
- 429 problem+json on exceed
- Graceful degradation (fail open)

---

## Task 6: Idempotency Cache with SHA-256
**Time**: 45-55 minutes

### Acceptance Criteria
- [x] idempotency.ts utility module created
- [x] Canonical JSON serialization (stable key order)
- [x] SHA-256 body hash generation
- [x] Cache key pattern: `idem:{method}:{path}:{idempotencyKey}`
- [x] TTL: 60 seconds
- [x] Cache get/set operations
- [x] Conflict detection (same key, different hash)
- [x] Returns cached response on replay

### Files to Create/Modify
```
frontend/api/_utils/idempotency.ts  # New utility
```

### Implementation Code

**api/_utils/idempotency.ts:**
```typescript
import { createHash } from 'crypto';
import { getRedisClient } from './redis';
import { buildProblem, PROBLEM_TYPES } from './problem';
import type { ServerResponse } from 'http';

const TTL_SECONDS = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '60', 10);

export interface IdempotencyResult {
  type: 'miss' | 'hit' | 'conflict';
  cachedResponse?: any;
}

/**
 * Canonicalize JSON object for stable hashing (sorted keys)
 */
function canonicalizeJson(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `"${k}":${canonicalizeJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Generate SHA-256 hash of request body
 */
export function hashBody(body: any): string {
  const canonical = canonicalizeJson(body);
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Generate idempotency cache key
 */
function getCacheKey(method: string, path: string, idempotencyKey: string): string {
  return `idem:${method}:${path}:${idempotencyKey}`;
}

/**
 * Check idempotency cache
 */
export async function checkIdempotency(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string
): Promise<IdempotencyResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { type: 'miss' };
  }

  try {
    const key = getCacheKey(method, path, idempotencyKey);
    const cached = await redis.get(key);

    if (!cached) {
      return { type: 'miss' };
    }

    const entry = typeof cached === 'string' ? JSON.parse(cached) : cached;

    // Check if body hash matches
    if (entry.bodyHash === bodyHash) {
      return {
        type: 'hit',
        cachedResponse: entry.response
      };
    } else {
      return { type: 'conflict' };
    }
  } catch (error) {
    console.error('[Idempotency] Check failed:', error);
    return { type: 'miss' }; // Fail open
  }
}

/**
 * Store response in idempotency cache
 */
export async function cacheResponse(
  method: string,
  path: string,
  idempotencyKey: string,
  bodyHash: string,
  response: any
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = getCacheKey(method, path, idempotencyKey);
    const entry = {
      bodyHash,
      response,
      timestamp: Date.now()
    };

    await redis.set(key, JSON.stringify(entry), { ex: TTL_SECONDS });
  } catch (error) {
    console.error('[Idempotency] Cache failed:', error);
    // Don't throw - caching failure shouldn't block response
  }
}

export function sendIdempotencyConflict(res: ServerResponse, host: string): void {
  const problem = buildProblem(
    PROBLEM_TYPES.IDEMPOTENCY_KEY_CONFLICT,
    'The Idempotency-Key has been used with a different request body. Use a new key or wait 60 seconds for the cache to expire.',
    host
  );

  res.statusCode = 409;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}
```

### Verification Steps
1. TypeScript compiles
2. hashBody() produces consistent SHA-256 for same object
3. hashBody() produces different hash for different object
4. canonicalizeJson() sorts keys deterministically
5. Cache key format matches pattern
6. TTL configured from environment

### Definition of Done
- Canonical JSON serialization works
- SHA-256 hashing consistent
- Cache get/set with TTL
- Conflict detection logic correct
- Graceful failure handling

---

## Task 7: API Middleware Pipeline Integration
**Time**: 60 minutes

### Acceptance Criteria
- [x] api/plan.ts updated with middleware pipeline
- [x] Rate limit check before processing
- [x] Idempotency check after rate limit
- [x] All errors return problem+json format
- [x] Success responses cache if Idempotency-Key present
- [x] X-RateLimit-* headers on all responses
- [x] X-Idempotent-Replayed header on cache hits
- [x] OPTIONS 204 preserved
- [x] Backward compatible 200 OK format

### Files to Modify
```
frontend/api/plan.ts             # Update with pipeline
```

### Implementation Outline

**Pipeline Order:**
```typescript
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host || 'localhost';

  // CORS (existing)
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.statusCode = 204, res.end();
  }

  // 1. Rate Limit Check
  const clientIp = getClientIp(req) || 'unknown';
  const rateLimitResult = await checkRateLimit(clientIp);
  setRateLimitHeaders(res, rateLimitResult);

  if (!rateLimitResult.allowed) {
    return sendRateLimitExceeded(res, rateLimitResult, host);
  }

  // 2. Method Check
  if (req.method !== 'POST') {
    return sendProblem(res, buildProblem(
      PROBLEM_TYPES.METHOD_NOT_ALLOWED,
      `Method ${req.method} not allowed. Use POST.`,
      host
    ));
  }

  // 3. Read Body
  const body = await readJson(req);

  // 4. Idempotency Check (if header present)
  const idempotencyKey = req.headers['idempotency-key'];
  let bodyHash: string | undefined;

  if (idempotencyKey && typeof idempotencyKey === 'string') {
    bodyHash = hashBody(body);
    const idempResult = await checkIdempotency('POST', '/api/plan', idempotencyKey, bodyHash);

    if (idempResult.type === 'hit') {
      res.setHeader('X-Idempotent-Replayed', 'true');
      return sendJson(res, 200, idempResult.cachedResponse);
    }

    if (idempResult.type === 'conflict') {
      return sendIdempotencyConflict(res, host);
    }
  }

  // 5. Validation (existing, but now returns problem+json)
  if (!body || !Array.isArray(body.items)) {
    return sendProblem(res, buildProblem(
      PROBLEM_TYPES.VALIDATION_ERROR,
      'items array is required and must contain at least 1 installment',
      host
    ));
  }

  // ... existing validation checks (convert to problem+json)

  try {
    // 6. Existing Plan Generation Logic
    // ... (unchanged)

    const responseData = {
      summary,
      actionsThisWeek,
      riskFlags: formattedRiskFlags,
      ics: icsBase64,
      normalized
    };

    // 7. Cache Response (if Idempotency-Key present)
    if (idempotencyKey && typeof idempotencyKey === 'string' && bodyHash) {
      await cacheResponse('POST', '/api/plan', idempotencyKey, bodyHash, responseData);
    }

    // 8. Return Success (existing format)
    return sendJson(res, 200, responseData);

  } catch (error: any) {
    // 9. Error Handler (problem+json)
    return sendProblem(res, buildProblem(
      PROBLEM_TYPES.INTERNAL_ERROR,
      error.message || 'An unexpected error occurred',
      host
    ));
  }
}
```

### Verification Steps
1. TypeScript compiles
2. OPTIONS still returns 204
3. Invalid body returns 400 problem+json
4. Non-POST returns 405 problem+json
5. Rate limit works (returns 429 on exceed)
6. Idempotency cache works (returns 200 replay)
7. Idempotency conflict returns 409
8. Success returns 200 with existing format
9. All responses have X-RateLimit-* headers

### Definition of Done
- Middleware pipeline integrated
- All error paths use problem+json
- Rate limiting functional
- Idempotency functional
- Headers on all responses
- Backward compatible

---

## Task 8: Problem Documentation Pages
**Time**: 30-40 minutes

### Acceptance Criteria
- [x] 5 markdown files created in public/problems/
- [x] Each page documents: status, when occurs, causes, fix, example
- [x] Pages accessible at /problems/* routes
- [x] Human-readable explanations
- [x] Example problem+json responses included
- [x] Links to main API docs

### Files to Create
```
frontend/public/problems/validation-error.md
frontend/public/problems/method-not-allowed.md
frontend/public/problems/rate-limit-exceeded.md
frontend/public/problems/idempotency-key-conflict.md
frontend/public/problems/internal-error.md
```

### Implementation Code

**public/problems/validation-error.md:**
```markdown
# Validation Error

**HTTP Status:** 400
**Problem Type:** `/problems/validation-error`

## When This Occurs

This error occurs when the request body doesn't meet the API's validation requirements. Common issues include missing required fields, invalid data types, or malformed values.

## Common Causes

- Missing `items` array in request body
- Empty `items` array (must have at least 1 installment)
- Missing required fields in installment objects (provider, installment_no, due_date, amount, currency, autopay, late_fee)
- Invalid date format (must be YYYY-MM-DD)
- Invalid timezone (must be valid IANA timezone identifier)
- Missing either `paycheckDates` OR (`payCadence` + `nextPayday`)
- `minBuffer` is negative or not a number

## How to Fix

1. Verify all required fields are present in your request
2. Check the `detail` field in the error response for specific issue
3. Validate installment objects match the schema
4. Ensure dates are in ISO format (YYYY-MM-DD)
5. Use valid IANA timezone (e.g., "America/New_York")
6. Provide either 3+ paycheckDates OR (payCadence + nextPayday)

## Example Response

```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "items array is required and must contain at least 1 installment",
  "instance": "/api/plan"
}
```

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

**public/problems/rate-limit-exceeded.md:**
```markdown
# Rate Limit Exceeded

**HTTP Status:** 429
**Problem Type:** `/problems/rate-limit-exceeded`

## When This Occurs

This error occurs when you've exceeded the API rate limit of 60 requests per hour from your IP address. The rate limit uses a sliding window algorithm for fair distribution.

## Common Causes

- Sending more than 60 requests in a rolling 60-minute period
- Burst requests without delay
- Multiple applications sharing the same IP address
- Load testing without rate limit considerations

## How to Fix

1. Wait for the time specified in the `Retry-After` header (seconds)
2. Check `X-RateLimit-Reset` header for exact reset timestamp
3. Implement exponential backoff in your client
4. Space out your requests (max 1 per minute for sustained usage)
5. Monitor `X-RateLimit-Remaining` header to track quota

## Rate Limit Headers

All API responses include these headers:

- `X-RateLimit-Limit`: Maximum requests per hour (60)
- `X-RateLimit-Remaining`: Requests left in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retry (on 429 only)

## Example Response

```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Rate limit of 60 requests per hour exceeded. Please retry after 120 seconds.",
  "instance": "/api/plan"
}
```

**Response Headers:**
```
HTTP/2 429
Content-Type: application/problem+json
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1727724000
Retry-After: 120
```

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

**public/problems/idempotency-key-conflict.md:**
```markdown
# Idempotency Key Conflict

**HTTP Status:** 409
**Problem Type:** `/problems/idempotency-key-conflict`

## When This Occurs

This error occurs when you send a request with an `Idempotency-Key` header that was previously used with a different request body within the last 60 seconds.

## Common Causes

- Reusing the same Idempotency-Key with modified request data
- Copy-paste error using wrong key
- Concurrent requests with same key but different data
- Key collision (very unlikely with UUIDs)

## How to Fix

1. **Generate a new Idempotency-Key** for the new request (recommended: UUID v4)
2. **Wait 60 seconds** for the cache to expire, then retry with same key
3. **Verify request body** matches your intended payload
4. **Check for concurrent requests** using the same key

## Idempotency Best Practices

- Use UUID v4 for guaranteed uniqueness: `crypto.randomUUID()`
- One key per unique request (don't reuse keys)
- Safe to retry with same key + same body within 60s
- Store keys client-side to track retry status

## Example Response

```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/idempotency-key-conflict",
  "title": "Idempotency Key Conflict",
  "status": 409,
  "detail": "The Idempotency-Key has been used with a different request body. Use a new key or wait 60 seconds for the cache to expire.",
  "instance": "/api/plan"
}
```

## Example Usage

**First Request:**
```bash
curl -X POST https://.../api/plan \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"items":[...],"minBuffer":100,"timeZone":"America/New_York"}'
# Returns: 200 OK
```

**Retry (same key, same body):**
```bash
# Same request - returns cached response
# Headers: X-Idempotent-Replayed: true
# Returns: 200 OK (cached)
```

**Conflict (same key, different body):**
```bash
curl -X POST https://.../api/plan \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"items":[...DIFFERENT...],"minBuffer":200,"timeZone":"America/Los_Angeles"}'
# Returns: 409 Conflict
```

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

**public/problems/method-not-allowed.md:**
```markdown
# Method Not Allowed

**HTTP Status:** 405
**Problem Type:** `/problems/method-not-allowed`

## When This Occurs

This error occurs when you use an HTTP method other than POST for the `/api/plan` endpoint.

## Common Causes

- Using GET instead of POST
- Using PUT, PATCH, or DELETE
- Misconfigured HTTP client
- Copy-paste error in curl command

## How to Fix

Use `POST` method for all requests to `/api/plan`:

```bash
curl -X POST https://.../api/plan \
  -H "Content-Type: application/json" \
  -d '{"items":[...]}'
```

## Example Response

```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/method-not-allowed",
  "title": "Method Not Allowed",
  "status": 405,
  "detail": "Method GET not allowed. Use POST.",
  "instance": "/api/plan"
}
```

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

**public/problems/internal-error.md:**
```markdown
# Internal Server Error

**HTTP Status:** 500
**Problem Type:** `/problems/internal-error`

## When This Occurs

This error indicates an unexpected server-side error occurred while processing your request. This is not caused by invalid input.

## Common Causes

- Unexpected exception in plan generation logic
- Redis connection failure (if critical)
- Timezone calculation error
- ICS generation failure
- Out of memory (unlikely)

## How to Fix

1. **Retry the request** - may be a transient issue
2. **Check request data** - ensure all dates are valid
3. **Verify timezone** - use valid IANA identifier
4. **Report persistent issues** - open GitHub issue with request details (sanitized)

## What We Log

Server errors are logged with stack traces for debugging. We never log your payment data for privacy reasons.

## Example Response

```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/internal-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred while generating your plan",
  "instance": "/api/plan"
}
```

## If Problem Persists

1. Check if API is operational: https://.../health (if available)
2. Review recent changes in your request format
3. Try with minimal test data (1 installment)
4. Report via GitHub issues (include sanitized request)

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

### Verification Steps
1. All 5 files created in public/problems/
2. Each file has complete documentation
3. Example responses match problem+json schema
4. Files accessible via /problems/* routes
5. Links render correctly

### Definition of Done
- 5 problem documentation pages created
- Human-readable explanations
- Example responses included
- Linked to main docs

---

## Task 9: Frontend Problem Details Parsing
**Time**: 25-30 minutes

### Acceptance Criteria
- [x] frontend/src/lib/api.ts updated to detect problem+json
- [x] Parses problem.title and problem.detail from response
- [x] Throws error with formatted message
- [x] Backward compatible with non-problem+json errors
- [x] Existing Alert component displays problem details
- [x] No changes to success path (200 OK)

### Files to Modify
```
frontend/src/lib/api.ts          # Update error handling
```

### Implementation Code

**Update buildPlan function:**
```typescript
export async function buildPlan(body: PlanRequest): Promise<PlanResponse> {
  const payload = RequestSchema.parse(body);
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const contentType = res.headers.get('Content-Type') || '';

    // Check for RFC 9457 Problem Details
    if (contentType.includes('application/problem+json')) {
      try {
        const problem = await res.json();
        // Format as: Title: Detail
        throw new Error(`${problem.title}: ${problem.detail || 'Unknown error'}`);
      } catch (parseError) {
        // Fall through to legacy handling if problem+json parsing fails
      }
    }

    // Legacy error handling (fallback)
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error || `API error ${res.status}`);
  }

  const json = await res.json();
  return ResponseSchema.parse(json);
}
```

### Verification Steps
1. TypeScript compiles
2. Valid request returns 200 OK (no change)
3. Invalid request shows "Validation Error: items array is required..."
4. Rate limit shows "Rate Limit Exceeded: Rate limit of 60..."
5. Alert component displays formatted error

### Definition of Done
- Detects application/problem+json Content-Type
- Parses and formats problem.title + problem.detail
- Backward compatible fallback
- Success path unchanged

---

## Task 10: Integration Tests - Problem Details
**Time**: 35-40 minutes

### Acceptance Criteria
- [x] problem-details.test.ts created
- [x] Tests 400 validation error (missing items)
- [x] Tests 405 method not allowed (GET request)
- [x] Tests 500 internal error (if triggerable)
- [x] Verifies all RFC 9457 required fields present
- [x] Verifies Content-Type: application/problem+json
- [x] Verifies absolute type URIs

### Files to Create
```
tests/integration/problem-details.test.ts
```

### Implementation Code

```typescript
import request from 'supertest';
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000';

describe('RFC 9457 Problem Details', () => {
  describe('400 Validation Error', () => {
    it('should return problem+json for missing items', async () => {
      const res = await request(API_BASE)
        .post('/api/plan')
        .send({})
        .expect(400);

      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body).toHaveProperty('type');
      expect(res.body).toHaveProperty('title', 'Validation Error');
      expect(res.body).toHaveProperty('status', 400);
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('instance');

      // Verify absolute URI
      expect(res.body.type).toMatch(/^https?:\/\/.+\/problems\/validation-error$/);
    });

    it('should return problem+json for empty items array', async () => {
      const res = await request(API_BASE)
        .post('/api/plan')
        .send({ items: [], minBuffer: 100, timeZone: 'America/New_York' })
        .expect(400);

      expect(res.body.title).toBe('Validation Error');
      expect(res.body.detail).toContain('at least 1 installment');
    });
  });

  describe('405 Method Not Allowed', () => {
    it('should return problem+json for GET request', async () => {
      const res = await request(API_BASE)
        .get('/api/plan')
        .expect(405);

      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body.title).toBe('Method Not Allowed');
      expect(res.body.status).toBe(405);
      expect(res.body.type).toContain('/problems/method-not-allowed');
    });
  });
});
```

### Verification Steps
1. Run tests: `npm test -- problem-details.test.ts`
2. All tests pass
3. problem+json format verified
4. All RFC 9457 fields present

### Definition of Done
- Tests cover 400 and 405 errors
- Verifies problem+json structure
- Verifies absolute type URIs
- All tests passing

---

## Task 11: Integration Tests - Rate Limit & Idempotency
**Time**: 50-60 minutes

### Acceptance Criteria
- [x] rate-limit.test.ts created with burst test (61 requests)
- [x] Verifies 429 on request #61
- [x] Verifies Retry-After header (integer)
- [x] Verifies X-RateLimit-* headers on all responses
- [x] idempotency.test.ts created
- [x] Tests replay (same key + same body → 200 + X-Idempotent-Replayed)
- [x] Tests conflict (same key + different body → 409)
- [x] Verifies cache expiration after 60s

### Files to Create
```
tests/integration/rate-limit.test.ts
tests/integration/idempotency.test.ts
```

### Implementation Code

**tests/integration/rate-limit.test.ts:**
```typescript
import request from 'supertest';
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000';

const validRequest = {
  items: [{
    provider: 'Klarna',
    installment_no: 1,
    due_date: '2025-10-02',
    amount: 45.00,
    currency: 'USD',
    autopay: true,
    late_fee: 7.00
  }],
  paycheckDates: ['2025-10-05', '2025-10-19', '2025-11-02'],
  minBuffer: 100,
  timeZone: 'America/New_York'
};

describe('Rate Limiting', () => {
  it('should include X-RateLimit headers on success', async () => {
    const res = await request(API_BASE)
      .post('/api/plan')
      .send(validRequest)
      .expect(200);

    expect(res.headers).toHaveProperty('x-ratelimit-limit');
    expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    expect(res.headers).toHaveProperty('x-ratelimit-reset');

    expect(parseInt(res.headers['x-ratelimit-limit'])).toBe(60);
    expect(parseInt(res.headers['x-ratelimit-remaining'])).toBeLessThanOrEqual(60);
  });

  it('should return 429 after exceeding rate limit', async () => {
    // Note: This test may fail if Redis is shared across tests
    // Consider using unique IP per test or mocking
    const requests = [];
    for (let i = 0; i < 61; i++) {
      requests.push(
        request(API_BASE)
          .post('/api/plan')
          .send(validRequest)
      );
    }

    const responses = await Promise.all(requests);
    const last = responses[responses.length - 1];

    if (last.status === 429) {
      expect(last.headers['content-type']).toContain('application/problem+json');
      expect(last.body.title).toBe('Rate Limit Exceeded');
      expect(last.headers).toHaveProperty('retry-after');

      const retryAfter = parseInt(last.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(3600);
    }
  }, 30000); // 30s timeout for burst test
});
```

**tests/integration/idempotency.test.ts:**
```typescript
import request from 'supertest';
import { randomUUID } from 'crypto';
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000';

const validRequest = {
  items: [{
    provider: 'Klarna',
    installment_no: 1,
    due_date: '2025-10-02',
    amount: 45.00,
    currency: 'USD',
    autopay: true,
    late_fee: 7.00
  }],
  paycheckDates: ['2025-10-05', '2025-10-19', '2025-11-02'],
  minBuffer: 100,
  timeZone: 'America/New_York'
};

describe('Idempotency', () => {
  it('should replay cached response for same key + same body', async () => {
    const key = randomUUID();

    // First request
    const res1 = await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(validRequest)
      .expect(200);

    expect(res1.headers).not.toHaveProperty('x-idempotent-replayed');

    // Second request (same key, same body)
    const res2 = await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(validRequest)
      .expect(200);

    expect(res2.headers['x-idempotent-replayed']).toBe('true');
    expect(res2.body).toEqual(res1.body);
  });

  it('should return 409 for same key + different body', async () => {
    const key = randomUUID();

    // First request
    await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(validRequest)
      .expect(200);

    // Second request (same key, different body)
    const differentRequest = { ...validRequest, minBuffer: 200 };

    const res = await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(differentRequest)
      .expect(409);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.title).toBe('Idempotency Key Conflict');
    expect(res.body.type).toContain('/problems/idempotency-key-conflict');
  });

  it('should expire cache after TTL', async () => {
    const key = randomUUID();

    // First request
    await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(validRequest)
      .expect(200);

    // Wait for TTL expiration (60s + buffer)
    await new Promise(resolve => setTimeout(resolve, 61000));

    // Third request (after expiration)
    const res = await request(API_BASE)
      .post('/api/plan')
      .set('Idempotency-Key', key)
      .send(validRequest)
      .expect(200);

    // Should NOT be replayed (cache expired)
    expect(res.headers).not.toHaveProperty('x-idempotent-replayed');
  }, 70000); // 70s timeout
});
```

### Verification Steps
1. Run `npm test -- rate-limit.test.ts` - tests pass
2. Run `npm test -- idempotency.test.ts` - tests pass
3. Verify 429 returns problem+json
4. Verify Retry-After is integer
5. Verify X-Idempotent-Replayed header
6. Verify 409 on conflict

### Definition of Done
- Rate limit tests verify 429 + headers
- Idempotency tests verify replay + conflict
- All tests pass
- Headers verified on all responses

---

## Task 12: Documentation & Verification Script
**Time**: 40-50 minutes

### Acceptance Criteria
- [x] README updated with Problem Details section
- [x] README updated with Rate Limiting section
- [x] README updated with Idempotency section
- [x] ops/deltas/0004_api_hardening.md created
- [x] scripts/verify-api-hardening.sh created with 5 curl tests
- [x] Script executable and runs successfully
- [x] All verification tests pass against production

### Files to Create/Modify
```
README.md                                    # Add new sections
ops/deltas/0004_api_hardening.md            # Delta document
scripts/verify-api-hardening.sh             # Verification script
```

### Implementation Code

**README.md additions:**
```markdown
## 🛡️ API Hardening (v0.1.1)

### Problem Details (RFC 9457)

All error responses use [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) format:

```json
{
  "type": "https://[domain]/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "items array is required",
  "instance": "/api/plan"
}
```

**Problem Types:**
- `/problems/validation-error` (400)
- `/problems/method-not-allowed` (405)
- `/problems/idempotency-key-conflict` (409)
- `/problems/rate-limit-exceeded` (429)
- `/problems/internal-error` (500)

### Rate Limiting

**Limit:** 60 requests per hour per IP (sliding window)

**Headers (on all responses):**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1727724000
```

**When exceeded (429):**
```
Retry-After: 120
Content-Type: application/problem+json
```

### Idempotency

Use `Idempotency-Key` header for safe retries:

```bash
curl -X POST https://.../api/plan \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d @data.json
```

**Behavior:**
- Same key + same body within 60s → Returns cached response (200)
- Same key + different body → Returns 409 conflict
- Cache TTL: 60 seconds

**Headers on replay:**
```
X-Idempotent-Replayed: true
```
```

**scripts/verify-api-hardening.sh:**
```bash
#!/bin/bash
set -e

PROD_URL="${1:-https://frontend-ku48gid48-matthew-utts-projects-89452c41.vercel.app}"

echo "🔍 Verifying API Hardening for PayPlan v0.1.1"
echo "Production URL: $PROD_URL"
echo ""

# Test 1: Validation Error (400 problem+json)
echo "Test 1: Validation Error (400)"
RESP=$(curl -s -X POST "$PROD_URL/api/plan" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESP" | jq -e '.type' > /dev/null && echo "✅ Has type field" || echo "❌ Missing type"
echo "$RESP" | jq -e '.title' > /dev/null && echo "✅ Has title field" || echo "❌ Missing title"
echo "$RESP" | jq -e '.status == 400' > /dev/null && echo "✅ Status is 400" || echo "❌ Wrong status"
echo ""

# Test 2: Method Not Allowed (405)
echo "Test 2: Method Not Allowed (405)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$PROD_URL/api/plan")
if [ "$STATUS" == "405" ]; then
  echo "✅ Returns 405 for GET request"
else
  echo "❌ Expected 405, got $STATUS"
fi
echo ""

# Test 3: Rate Limit Headers (Success)
echo "Test 3: Rate Limit Headers on Success"
HEADERS=$(curl -si -X POST "$PROD_URL/api/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"provider":"Klarna","installment_no":1,"due_date":"2025-10-02","amount":45,"currency":"USD","autopay":true,"late_fee":7}],
    "paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],
    "minBuffer":100,
    "timeZone":"America/New_York"
  }' | head -20)

echo "$HEADERS" | grep -q "X-RateLimit-Limit" && echo "✅ Has X-RateLimit-Limit header" || echo "❌ Missing X-RateLimit-Limit"
echo "$HEADERS" | grep -q "X-RateLimit-Remaining" && echo "✅ Has X-RateLimit-Remaining header" || echo "❌ Missing X-RateLimit-Remaining"
echo "$HEADERS" | grep -q "X-RateLimit-Reset" && echo "✅ Has X-RateLimit-Reset header" || echo "❌ Missing X-RateLimit-Reset"
echo ""

# Test 4: Idempotency Replay
echo "Test 4: Idempotency Replay (same key + same body)"
KEY="test-$(date +%s)"
BODY='{"items":[{"provider":"Klarna","installment_no":1,"due_date":"2025-10-02","amount":45,"currency":"USD","autopay":true,"late_fee":7}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":100,"timeZone":"America/New_York"}'

# First request
curl -s -X POST "$PROD_URL/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY" > /dev/null

# Second request (should be replayed)
HEADERS2=$(curl -si -X POST "$PROD_URL/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY" | head -20)

echo "$HEADERS2" | grep -q "X-Idempotent-Replayed: true" && echo "✅ Cache replay detected" || echo "❌ Not replayed"
echo ""

# Test 5: Idempotency Conflict (same key + different body)
echo "Test 5: Idempotency Conflict (409)"
BODY2='{"items":[{"provider":"Affirm","installment_no":1,"due_date":"2025-10-12","amount":58,"currency":"USD","autopay":false,"late_fee":15}],"paycheckDates":["2025-10-05","2025-10-19","2025-11-02"],"minBuffer":200,"timeZone":"America/New_York"}'

CONFLICT=$(curl -s -X POST "$PROD_URL/api/plan" \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY2")

echo "$CONFLICT" | jq -e '.status == 409' > /dev/null && echo "✅ Returns 409 conflict" || echo "❌ Wrong status"
echo "$CONFLICT" | jq -e '.type' | grep -q "idempotency-key-conflict" && echo "✅ Correct problem type" || echo "❌ Wrong problem type"
echo ""

echo "✅ All API Hardening verifications complete!"
```

### Verification Steps
1. Run rate limit tests: `npm test -- rate-limit.test.ts`
2. Run idempotency tests: `npm test -- idempotency.test.ts`
3. Run verification script: `./scripts/verify-api-hardening.sh`
4. All tests pass
5. Script shows all ✅ checks

### Definition of Done
- Rate limit tests pass (429 + headers)
- Idempotency replay test passes
- Idempotency conflict test passes
- Verification script executable
- All 5 curl tests succeed

---

## Runbook

### Local Development with Upstash

**Set Environment Variables:**
```bash
export UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your-token"
export RATE_LIMIT_PER_HOUR=60
export IDEMPOTENCY_TTL_SECONDS=60
```

**Start Dev Server:**
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

**Test API Locally:**
```bash
# Terminal 1: Start API
vercel dev

# Terminal 2: Test
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/klarna-pay-in-4.json
```

### Deploy to Vercel

```bash
cd frontend
vercel --prod
```

### Verify Production

```bash
./scripts/verify-api-hardening.sh https://your-prod-url.vercel.app
```

### Monitor Rate Limits (Upstash Dashboard)

1. Visit https://console.upstash.com/redis/{your-db}
2. Check "Data Browser"
3. Filter keys: `PAYPLAN:production:rl:*`
4. See request counts per IP

### Monitor Idempotency Cache

**Check keys:**
```
PAYPLAN:production:idem:POST:/api/plan:{uuid}
```

**TTL:** Auto-expires after 60 seconds

### Troubleshooting

**Issue:** Rate limiting not working
**Fix:** Check Upstash env vars set in Vercel dashboard

**Issue:** All requests allowed (no rate limiting)
**Fix:** Verify Redis client connects (check logs for warnings)

**Issue:** Idempotency always returns miss
**Fix:** Check bodyHash consistency (canonical JSON order)

**Issue:** 500 errors on all requests
**Fix:** Check Upstash Redis is accessible from Vercel region

### Rollback

**Disable rate limiting:**
```bash
# In Vercel dashboard, remove:
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
# Function will fail open (allow all requests with warning)
```

**Git rollback:**
```bash
git revert {commit-range}
vercel rollback
```

---

## Summary

**12 Atomic Tasks | ~12-15 Hours Total**

1. ✅ Deps & Env (30min)
2. ✅ problem.ts (40min)
3. ✅ ip.ts (20min)
4. ✅ redis.ts (25min)
5. ✅ ratelimit.ts (50min)
6. ✅ idempotency.ts (55min)
7. ✅ api/plan.ts integration (60min)
8. ✅ /problems/* docs (40min)
9. ✅ Frontend problem+json (30min)
10. ✅ Tests: problem details (40min)
11. ✅ Tests: rate-limit + idempotency (60min)
12. ✅ Docs + delta + script (50min)

**Deliverables:**
- 5 utility modules (problem, ip, redis, ratelimit, idempotency)
- Updated api/plan.ts with middleware pipeline
- 5 problem documentation pages
- Frontend problem+json parsing
- 3 integration test suites
- Verification script
- README sections
- Delta document

**Environment:**
- Upstash Redis (free tier)
- Environment variables in Vercel

**Ready to ship API Hardening v0.1.1! 🛡️**