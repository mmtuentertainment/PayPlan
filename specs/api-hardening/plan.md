# Implementation Plan: API Hardening (v0.1.1)

**Branch**: `003-api-hardening` | **Date**: 2025-09-30 | **Spec**: [feature-spec.md](feature-spec.md)
**Version**: v0.1.1 (patch release)
**Input**: Feature specification from `/specs/api-hardening/feature-spec.md`

---

## Summary

Harden the `/api/plan` endpoint with RFC 9457 Problem Details for errors, per-IP rate limiting (60 req/hour sliding window), and Idempotency-Key support for safe retries. Uses Upstash Redis for stateless serverless environment compatibility.

---

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 20
**Primary Dependencies**:
- @upstash/redis (^1.28.0) - Serverless Redis client
- @upstash/ratelimit (^1.0.0) - Sliding window rate limiter
- crypto (Node.js built-in) - SHA-256 hashing

**Storage**: Upstash Redis (serverless-compatible, free tier)
**Testing**: Jest + Supertest for integration tests
**Target Platform**: Vercel Serverless Functions (Node 20)
**Performance Goals**:
- Rate limit check: <50ms overhead
- Idempotency lookup: <100ms overhead
- Problem Details serialization: <10ms

**Constraints**:
- Stateless serverless functions (no in-memory persistence)
- Backward compatible (200 OK format unchanged)
- No breaking changes for existing clients

---

## Constitution Check

**Principles Applied:**
1. ✅ **Stateless**: Redis for cross-invocation state, but functions remain stateless
2. ✅ **Standards Compliant**: RFC 9457 for error responses
3. ✅ **Serverless-Ready**: Upstash designed for edge/serverless
4. ✅ **Backward Compatible**: Only error responses change format
5. ✅ **Fail Open**: Rate limit/idempotency failures don't block requests

**No violations** - API hardening follows serverless best practices and RFC standards.

---

## Project Structure

### Documentation (this feature)
```
specs/api-hardening/
├── plan.md              # This file
├── feature-spec.md      # Feature specification (complete)
├── data-model.md        # Data model (TBD)
└── tasks.md             # Task breakdown (TBD)
```

### Backend (API utilities)
```
frontend/api/
├── plan.ts              # Update with middleware pipeline
└── _utils/
    ├── problem.ts       # RFC 9457 problem+json helpers
    ├── ip.ts            # Extract client IP from x-forwarded-for
    ├── redis.ts         # Upstash Redis client singleton
    ├── ratelimit.ts     # Rate limit middleware
    └── idempotency.ts   # Idempotency cache logic
```

### Frontend (error handling)
```
frontend/src/lib/
└── api.ts               # Update to parse problem+json errors
```

### Documentation Pages
```
frontend/public/problems/
├── validation-error.md
├── method-not-allowed.md
├── rate-limit-exceeded.md
├── idempotency-key-conflict.md
└── internal-error.md
```

### Tests
```
tests/integration/
├── problem-details.test.ts
├── rate-limit.test.ts
├── idempotency.test.ts
└── problems-docs.test.ts
```

---

## Phase 0: Research & Dependencies ✅

**Research Tasks:**

1. ✅ **RFC 9457 Problem Details**
   - Standard fields: type, title, status, detail, instance
   - Content-Type: application/problem+json
   - Type URIs must be absolute and dereferenceable

2. ✅ **Upstash Redis Setup**
   - Free tier: 10,000 commands/day
   - REST API compatible with serverless
   - Automatic connection pooling
   - Environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

3. ✅ **@upstash/ratelimit Sliding Window**
   - Algorithm: sliding window (fairer than fixed)
   - Returns: success, limit, remaining, reset timestamp
   - Automatically handles Redis storage

4. ✅ **Idempotency Pattern (Stripe-style)**
   - SHA-256 hash of canonical JSON body
   - Store: {bodyHash, response, timestamp}
   - 60-second TTL
   - Conflict detection: same key + different hash → 409

5. ✅ **IP Extraction from Vercel**
   - Header: x-forwarded-for (comma-separated if multiple proxies)
   - Extract first value (original client IP)
   - Fallback to x-real-ip or connection IP

**Dependencies to Add:**

```json
{
  "dependencies": {
    "@upstash/redis": "^1.28.0",
    "@upstash/ratelimit": "^1.0.0"
  }
}
```

---

## Phase 1: Design & Contracts ✅

### Data Model

**Problem Details Response (RFC 9457):**
```typescript
interface ProblemDetails {
  type: string;          // Absolute URI: https://<domain>/problems/{type-name}
  title: string;         // Human-readable summary (e.g., "Validation Error")
  status: number;        // HTTP status code (400, 429, etc.)
  detail: string;        // Specific error explanation
  instance?: string;     // Request path (e.g., /api/plan)
}
```

**Problem Types:**
```typescript
const PROBLEMS = {
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
};
```

**Rate Limit State:**
```typescript
interface RateLimitResult {
  success: boolean;          // false if limit exceeded
  limit: number;             // Max requests per window (60)
  remaining: number;         // Requests left
  reset: number;             // Unix timestamp when resets
  pending?: Promise<void>;   // For async update
}
```

**Idempotency Cache Entry:**
```typescript
interface IdempotencyCacheEntry {
  bodyHash: string;          // SHA-256 of canonical JSON
  response: any;             // Cached response object
  timestamp: number;         // Created time
}
```

### API Request Flow

```
Incoming POST /api/plan
    ↓
1. Extract Client IP (x-forwarded-for)
    ↓
2. Rate Limit Check (Upstash Redis)
    ├─ Exceeded? → 429 problem+json + Retry-After
    └─ OK → Continue
    ↓
3. Idempotency Check (if Idempotency-Key header present)
    ├─ Cache hit + same bodyHash? → 200 replay + X-Idempotent-Replayed: true
    ├─ Cache hit + different bodyHash? → 409 problem+json
    └─ No cache → Continue
    ↓
4. Validate Request Body
    ├─ Invalid? → 400 problem+json
    └─ Valid → Continue
    ↓
5. Process Plan Generation
    ├─ Error? → 500 problem+json
    └─ Success → Continue
    ↓
6. Cache Response (if Idempotency-Key provided)
    ↓
7. Add Headers
    ├─ X-RateLimit-*
    └─ X-Idempotent-Replayed (if replayed)
    ↓
8. Return 200 OK (existing format)
```

### Problem Documentation Pages

**Template for each /problems/*.md:**
```markdown
# {Problem Title}

**HTTP Status:** {status}
**Problem Type:** `{type-uri}`

## When This Occurs

{explanation of when this error happens}

## Common Causes

- {cause 1}
- {cause 2}

## How to Fix

{steps to resolve}

## Example Response

```json
{
  "type": "{type-uri}",
  "title": "{title}",
  "status": {status},
  "detail": "{specific error message}",
  "instance": "/api/plan"
}
```

## Related

- [API Documentation](/docs)
- [All Problem Types](/problems)
```

---

## Phase 2: Implementation Tasks

### Setup & Dependencies (1-2)

1. **Add Upstash dependencies**
   - Install @upstash/redis, @upstash/ratelimit
   - Create .env.example with Upstash variables
   - Document Upstash setup in README

2. **Create utility structure**
   - Create frontend/api/_utils directory
   - Set up TypeScript exports

### Core Utilities (3-7)

3. **Build problem.ts** [P]
   - Problem Details builder function
   - sendProblem() helper (sets Content-Type + status)
   - Problem type constants
   - Absolute URI builder (uses request host)

4. **Build ip.ts** [P]
   - Extract IP from x-forwarded-for (first value)
   - Fallback to x-real-ip
   - Handle localhost/dev scenarios

5. **Build redis.ts** [P]
   - Lazy Upstash Redis client singleton
   - Environment variable validation
   - Connection error handling

6. **Build ratelimit.ts** [P]
   - Sliding window limiter wrapper
   - IP-based key generation
   - Header builder (X-RateLimit-*)
   - Retry-After calculator

7. **Build idempotency.ts** [P]
   - Canonical JSON serializer (stable key order)
   - SHA-256 body hash function
   - Cache get/set with TTL
   - Conflict detection

### API Integration (8)

8. **Update api/plan.ts**
   - Add middleware pipeline:
     1. Rate limit check
     2. Idempotency check
     3. Existing validation/processing
     4. Idempotency cache (on success)
     5. Add headers
   - Convert all error responses to problem+json
   - Wrap in try/catch for 500 handling

### Documentation Pages (9-13)

9. **Create /problems/*.md pages** [P]
   - validation-error.md
   - method-not-allowed.md
   - rate-limit-exceeded.md
   - idempotency-key-conflict.md
   - internal-error.md

### Frontend Updates (14)

14. **Update frontend/src/lib/api.ts**
    - Check Content-Type for application/problem+json
    - Parse problem.title and problem.detail
    - Throw error with formatted message
    - Fallback to existing error handling

### Testing (15-18)

15. **Integration test: problem-details.test.ts** [P]
    - Test 400 validation-error format
    - Test 405 method-not-allowed
    - Verify all required fields present
    - Verify absolute type URIs

16. **Integration test: rate-limit.test.ts** [P]
    - Send 61 requests in sequence
    - Verify 429 on #61
    - Verify Retry-After header
    - Verify X-RateLimit-* headers on all responses

17. **Integration test: idempotency.test.ts** [P]
    - Test replay (same key + same body)
    - Test conflict (same key + different body)
    - Verify X-Idempotent-Replayed header
    - Verify cache expiration after 60s

18. **Integration test: problems-docs.test.ts** [P]
    - Verify all /problems/* pages return 200
    - Verify markdown content present
    - Verify links to docs work

### Documentation & Deployment (19-21)

19. **Update README**
    - Add Problem Details section
    - Add Rate Limiting section (headers, limits)
    - Add Idempotency section (header usage)
    - Add curl examples for each scenario

20. **Create ops/deltas/0004_api_hardening.md**
    - Document changes
    - Verification results
    - Migration notes for API consumers

21. **Create verification script**
    - 5 curl tests (validation, rate limit, idempotency x2, headers)
    - Save as scripts/verify-api-hardening.sh

---

## Phase 3: Task Planning Approach

**Task Generation Strategy:**
- Setup tasks first (dependencies, utils structure)
- Core utilities (all parallelizable)
- API integration (middleware pipeline)
- Documentation pages (all parallelizable)
- Frontend error handling
- Testing (all parallelizable)
- Documentation and verification

**Ordering Strategy:**
- Foundation → Utilities → Integration → Docs → Frontend → Tests → Deploy
- Mark [P] for parallel execution

**Estimated Output**: 21 tasks total, ~12-15 hours

---

## Complexity Tracking

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Upstash Redis | Serverless-compatible, free tier, low latency | Vercel KV (paid), in-memory (loses state), CloudFlare KV (different platform) |
| Sliding Window | Fairer than fixed window, standard algorithm | Fixed window (simpler but less fair), Token bucket (more complex) |
| RFC 9457 | Standard format, machine-readable, good DX | Custom error format (non-standard), Keep plain JSON (not structured) |
| Idempotency-Key | Industry standard (Stripe, Twilio use it) | Custom retry mechanism (non-standard), No idempotency (risk of duplicates) |

No constitutional violations - all choices align with stateless, standards-based, serverless principles.

---

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [ ] Phase 2: Implementation (21 tasks)
- [ ] Phase 3: Testing
- [ ] Phase 4: Deployment
- [ ] Phase 5: Verification

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] No NEEDS CLARIFICATION remaining
- [x] Complexity deviations documented

---

## Success Criteria

**Test 1: Problem Details (400)**
```bash
curl -X POST https://<prod>/api/plan \
  -H "Content-Type: application/json" \
  -d '{}'
# Expect: 400, Content-Type: application/problem+json
# Verify: type (absolute URL), title, status, detail, instance fields present
```

**Test 2: Rate Limit (429)**
```bash
for i in {1..61}; do
  curl -X POST https://<prod>/api/plan \
    -H "Content-Type: application/json" \
    -d @tests/fixtures/klarna-pay-in-4.json
done
# Request #61: 429, Retry-After: <seconds>, X-RateLimit-Remaining: 0
```

**Test 3: Idempotency Replay**
```bash
# Request 1
curl -i -X POST https://<prod>/api/plan \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/klarna-pay-in-4.json

# Request 2 (same key, same body)
curl -i -X POST https://<prod>/api/plan \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/klarna-pay-in-4.json
# Expect: 200, X-Idempotent-Replayed: true, identical response
```

**Test 4: Idempotency Conflict (409)**
```bash
curl -X POST https://<prod>/api/plan \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/mixed-providers-with-risks.json
# Expect: 409, problem+json with type=/problems/idempotency-key-conflict
```

**Test 5: Rate Limit Headers**
```bash
curl -i -X POST https://<prod>/api/plan \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/klarna-pay-in-4.json | grep X-RateLimit
# Expect: X-RateLimit-Limit: 60, X-RateLimit-Remaining: 59, X-RateLimit-Reset: <timestamp>
```

---

## Deliverables Summary

**Code:**
- 5 utility modules (problem, ip, redis, ratelimit, idempotency)
- Updated api/plan.ts with middleware pipeline
- Frontend error handling for problem+json
- 4 integration test suites

**Documentation:**
- 5 problem type markdown pages
- Updated README (Problem Details, Rate Limits, Idempotency)
- Implementation plan (this file)
- Delta document (ops/deltas/0004_api_hardening.md)
- Verification script (5 curl tests)

**Environment:**
- Upstash Redis account setup
- Environment variables configured in Vercel

---

## Migration Notes for API Consumers

**Backward Compatibility:**
- ✅ 200 OK responses unchanged
- ✅ Existing error handling still works
- ⚠️ Error responses now use different Content-Type (application/problem+json)
- ⚠️ Error response structure changed (type, title, status, detail vs old format)

**New Features:**
- ✅ Can send Idempotency-Key header for safe retries
- ✅ Rate limit information in X-RateLimit-* headers
- ✅ Structured error responses with documentation links

**Breaking Changes:**
- None (all changes are additive or affect only error paths)

---

## Rollback Plan

**Feature Flags:**
```bash
# Disable rate limiting
unset UPSTASH_REDIS_REST_URL
unset UPSTASH_REDIS_REST_TOKEN

# Function falls back to no rate limiting (logs warning)
```

**Git Rollback:**
```bash
git revert {commit-hash}
vercel rollback
```

**Upstash Cleanup:**
```bash
# All keys have TTL, auto-expire
# Rate limit: resets hourly
# Idempotency: 60s TTL
# No manual cleanup needed
```

---

## Environment Variables

**Required for Production:**
```bash
UPSTASH_REDIS_REST_URL=https://[region].upstash.io
UPSTASH_REDIS_REST_TOKEN=AYaxAA...
```

**Optional Configuration:**
```bash
RATE_LIMIT_PER_HOUR=60               # Default: 60
IDEMPOTENCY_TTL_SECONDS=60           # Default: 60
NODE_ENV=production                   # For Redis namespace
```

**Upstash Setup:**
1. Create free account at https://upstash.com
2. Create Redis database (choose region close to Vercel deployment)
3. Copy REST API credentials
4. Add to Vercel environment variables

---

## Performance Impact

**Added Latency:**
- Rate limit check: ~30-50ms (single Redis GET + INCR)
- Idempotency lookup: ~50-100ms (Redis GET + optional SET)
- Problem Details serialization: ~5-10ms

**Total overhead:** ~80-160ms worst case (both checks)
**Acceptable:** Original target was <5s, overhead is <3% of budget

---

**Status**: ✅ **READY FOR /tasks**

*Plan created on 2025-09-30*