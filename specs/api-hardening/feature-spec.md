# Feature Specification: API Hardening (v0.1.1)

**Feature Branch**: `003-api-hardening`
**Created**: 2025-09-30
**Status**: Clarified - Ready for Planning
**Version**: v0.1.1 (patch release)
**Input**: "Ship PayPlan v0.1.1 (API Hardening) with three changes only: A) RFC 9457 Problem Details, B) Rate Limit (serverless-friendly), C) Idempotency-Key support"

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story: API Consumer
A developer integrates PayPlan's `/api/plan` endpoint into their application. When errors occur (invalid input, rate limits), they receive standardized RFC 9457 Problem Details responses with machine-readable error types and human-readable descriptions. When they retry requests, they can use Idempotency-Key headers to safely retry without creating duplicate work. When they exceed rate limits, they receive clear 429 responses with Retry-After headers telling them exactly when to retry.

### Acceptance Scenarios

1. **Given** a developer sends an invalid request (missing required field), **When** the API responds, **Then** they receive:
   - HTTP 400 status
   - Content-Type: application/problem+json
   - Response body with: type (URI), title, status (400), detail (specific error), instance (request ID)
   - Linkable type URI (e.g., /problems/validation-error) with human-readable explanation

2. **Given** a developer exceeds the rate limit (60 req/hour), **When** they send request #61, **Then** they receive:
   - HTTP 429 status
   - Content-Type: application/problem+json
   - Retry-After header (seconds until reset)
   - X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
   - Problem Details body explaining rate limit exceeded

3. **Given** a developer sends a request with an Idempotency-Key header, **When** they retry the exact same request within 60 seconds, **Then** they receive:
   - HTTP 200 with the cached response (not reprocessed)
   - X-Idempotent-Replayed: true header
   - Same plan data as original request

4. **Given** a developer sends a request with an Idempotency-Key that was used with different body data, **When** the API processes it, **Then** they receive:
   - HTTP 409 status
   - Content-Type: application/problem+json
   - Problem Details explaining idempotency key conflict
   - Suggestion to use a new key or wait for TTL expiration

5. **Given** a successful request, **When** the API responds with 200 OK, **Then** the response:
   - Keeps existing JSON format (backward compatible)
   - Includes X-RateLimit-* headers showing remaining quota
   - Does NOT use problem+json (only for errors)

### Edge Cases
- What happens when rate limit resets mid-second?
- How are idempotency keys cleaned up after 60s TTL?
- What if two requests arrive simultaneously with same Idempotency-Key?
- How is rate limiting handled across Vercel's distributed edge network?
- What happens if idempotency storage fails?
- How are problem type URIs versioned?

---

## Requirements

### Functional Requirements

**A) RFC 9457 Problem Details (Error Responses)**

- **FR-001**: All 4xx and 5xx error responses MUST use Content-Type `application/problem+json`
- **FR-002**: Problem Details responses MUST include required fields:
  - `type` (string, URI): Link to human-readable problem explanation
  - `title` (string): Short, human-readable summary
  - `status` (number): HTTP status code
  - `detail` (string): Specific explanation for this occurrence
  - `instance` (string, optional): URI reference to specific occurrence
- **FR-003**: System MUST define problem types for:
  - `validation-error` (400): Invalid request body or missing required fields
  - `method-not-allowed` (405): Non-POST request to /api/plan
  - `unsupported-media-type` (415): Non-JSON content-type
  - `unprocessable-entity` (422): Valid JSON but semantic errors
  - `rate-limit-exceeded` (429): Too many requests from IP
  - `idempotency-key-conflict` (409): Same key, different body
  - `internal-error` (500): Server processing failure
- **FR-004**: Each problem type MUST have a corresponding documentation page at `/problems/{type-name}`
- **FR-005**: Problem type URIs MUST be absolute (e.g., `https://frontend-[...].vercel.app/problems/validation-error`)
- **FR-006**: System MUST maintain backward compatibility for 200 OK responses (existing JSON format)
- **FR-007**: Problem Details MUST be machine-readable (parseable JSON with consistent schema)

**B) Rate Limiting (Serverless-Friendly)**

- **FR-008**: System MUST enforce rate limit of 60 requests per hour per IP address for POST /api/plan
- **FR-009**: Rate limit counter MUST be configurable via environment variable `RATE_LIMIT_PER_HOUR` (default: 60)
- **FR-010**: System MUST return HTTP 429 when rate limit exceeded
- **FR-011**: 429 responses MUST include `Retry-After` header (seconds until limit resets)
- **FR-012**: All responses (success and error) MUST include rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets
- **FR-013**: Rate limit implementation MUST work in Vercel's serverless/edge environment (no persistent state between function invocations)
- **FR-014**: System MUST use IP address from `x-forwarded-for` or `x-real-ip` headers (Vercel proxy)
- **FR-015**: Rate limit storage MUST have minimal overhead (<50ms lookup/update)

**C) Idempotency-Key Support**

- **FR-016**: System MUST accept optional `Idempotency-Key` header on POST /api/plan
- **FR-017**: Idempotency-Key MUST be a string (recommended: UUID v4, min 16 chars, max 255 chars)
- **FR-018**: When Idempotency-Key is provided, system MUST:
  - Hash the request body (deterministic)
  - Check cache for existing response with same key
  - If found with same body hash: return cached response with `X-Idempotent-Replayed: true`
  - If found with different body hash: return 409 problem+json
  - If not found: process request, cache response for 60 seconds
- **FR-019**: Idempotency cache TTL MUST be 60 seconds (configurable via `IDEMPOTENCY_TTL_SECONDS`)
- **FR-020**: System MUST handle concurrent requests with same Idempotency-Key (first wins, others wait or get cached response)
- **FR-021**: Idempotency implementation MUST work in Vercel's stateless environment
- **FR-022**: System MUST NOT require external databases for idempotency (use Vercel KV, memory, or similar)

**Error Documentation Pages**

- **FR-023**: System MUST serve static documentation pages at `/problems/*` for each problem type
- **FR-024**: Each problem page MUST include:
  - Problem type name and HTTP status code
  - Description of when this error occurs
  - Common causes
  - How to fix it
  - Example problem+json response
- **FR-025**: Problem pages MUST be accessible without authentication
- **FR-026**: Problem pages MUST link back to main API documentation

**Backward Compatibility**

- **FR-027**: System MUST NOT change the 200 OK response format (existing JSON structure)
- **FR-028**: System MUST NOT break existing API consumers who don't send Idempotency-Key
- **FR-029**: Frontend application MUST continue to work without changes (errors already handled)
- **FR-030**: Rate limits MUST be generous enough for normal usage (60/hour allows 1 request per minute)

### Non-Functional Requirements

**Performance**
- **NFR-001**: Rate limit check MUST add <50ms to request latency
- **NFR-002**: Idempotency lookup MUST add <100ms to request latency
- **NFR-003**: Problem Details serialization MUST add <10ms to error responses

**Reliability**
- **NFR-004**: Rate limit failures MUST NOT block requests (fail open)
- **NFR-005**: Idempotency cache failures MUST NOT block requests (process normally)

**Observability**
- **NFR-006**: Rate limit hits MUST be logged with IP, timestamp, remaining quota
- **NFR-007**: Idempotency cache hits MUST be logged with key, replayed status

---

## Success Criteria

**Primary Success Metric**: A developer can send invalid requests and receive standardized RFC 9457 Problem Details responses with helpful error messages and linkable documentation.

**Additional Success Indicators**:
- curl test with invalid body returns `application/problem+json` with type URI
- curl test exceeding 60 req/hour returns 429 with Retry-After header
- curl test with Idempotency-Key returns cached response on retry (X-Idempotent-Replayed: true)
- curl test with same key but different body returns 409 conflict
- All problem type URIs (`/problems/*`) are accessible and human-readable
- Existing frontend application works without modification
- Rate limit headers present on all responses

**Out of Scope for v0.1.1**:
- Authentication or API keys
- Per-user rate limits (IP-based only)
- Persistent storage or databases
- Distributed rate limiting across regions
- Advanced caching strategies (Redis, etc.)
- Analytics or metrics dashboards
- Custom rate limit tiers
- Webhook notifications
- IP whitelist/blacklist

---

## Key Entities

### Problem Details Response
RFC 9457 compliant error response format.

**Fields:**
- `type` (string, URI): Identifies the problem type (e.g., "/problems/validation-error")
- `title` (string): Short, human-readable summary (e.g., "Validation Error")
- `status` (number): HTTP status code (e.g., 400)
- `detail` (string): Specific explanation for this instance (e.g., "Field 'items' is required")
- `instance` (string, optional): URI identifying this specific occurrence (e.g., request ID)

**Example:**
```json
{
  "type": "https://frontend-ku48gid48.vercel.app/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "items array is required and must contain at least 1 installment",
  "instance": "/api/plan/request-abc123"
}
```

### Rate Limit State
Tracks request counts per IP address.

**Properties:**
- IP address (key)
- Request count (number)
- Window start time (Unix timestamp)
- Window duration (3600 seconds = 1 hour)
- Reset time (Unix timestamp)

**Headers (outbound):**
- `X-RateLimit-Limit`: 60
- `X-RateLimit-Remaining`: 45
- `X-RateLimit-Reset`: 1727720400

### Idempotency Cache Entry
Stores request/response pairs for deduplication.

**Properties:**
- Idempotency-Key (string, provided by client)
- Request body hash (SHA-256)
- Cached response (full JSON)
- Created timestamp
- TTL: 60 seconds

**Headers (outbound):**
- `X-Idempotent-Replayed`: true (when returning cached response)

### Problem Documentation Page
Static page explaining each error type.

**Content:**
- HTTP status code and problem type name
- When this error occurs
- Common causes
- How to fix it
- Example problem+json response
- Link to API documentation

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Requirements generated
- [x] Entities identified
- [ ] Clarifications needed (see below)

---

## Clarifications Needed

### Session 1: 2025-09-30

**Q1: Rate Limit Storage** - How should rate limit state be stored in Vercel's serverless environment?

**Options:**
- A) Vercel KV (requires paid plan, persistent)
- B) Upstash Redis (free tier, works with Vercel)
- C) In-memory Map with periodic cleanup (works only within single function instance)
- D) Accept stateless limitation (each cold start resets counters)

**Recommendation:** B (Upstash Redis free tier) or D (stateless, simpler for v0.1.1)

**Q2: Idempotency Storage** - Same question for idempotency cache?

**Options:**
- A) Vercel KV
- B) Upstash Redis with 60s TTL
- C) In-memory Map (limited to single instance)
- D) Skip idempotency for v0.1.1, add in v0.2

**Recommendation:** B (Upstash Redis) or D (defer to v0.2)

**Q3: Problem Type URI Domain** - Should problem type URIs use the production domain or a stable generic domain?

**Options:**
- A) Use production Vercel URL (e.g., `https://frontend-ku48gid48.vercel.app/problems/...`)
- B) Use relative URIs (`/problems/validation-error`)
- C) Use generic placeholder (`https://payplan.example.com/problems/...`)

**Recommendation:** B (relative URIs) for flexibility across deployments

**Q4: Rate Limit Window** - Should the 60 req/hour be a sliding window or fixed window?

**Options:**
- A) Fixed window (resets every hour on the hour)
- B) Sliding window (rolling 60-minute period)
- C) Token bucket (smoother distribution)

**Recommendation:** A (fixed window) for simplicity in serverless

**Q5: Existing Frontend** - Should the frontend be updated to display Problem Details, or keep current error handling?

**Options:**
- A) Update frontend to parse and display problem+json fields
- B) Keep current error handling (works with both formats)
- C) Add optional enhanced display if problem+json detected

**Recommendation:** B (no changes needed, backward compatible)

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain (5 clarifications needed)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (problem+json on errors, 429 on limit, 409 on conflict)
- [x] Scope is clearly bounded (no auth, no persistent storage)
- [x] Dependencies identified (RFC 9457, rate limit storage, idempotency cache)

---

**Status**: ⏸️ **WAITING FOR CLARIFICATIONS**

Ready to resolve clarifications and proceed to planning phase.
---

## Clarifications Resolved

### Session 1: 2025-09-30

**Q1: Rate Limit Storage** - How should rate limit state be stored in Vercel's serverless environment?

**A1:** Use Upstash Redis with @upstash/ratelimit library (sliding window algorithm). Namespace: `PAYPLAN:{env}`. Key pattern: `rl:{ip}`. Emit X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers on ALL responses (success and error).
→ **Integrated into:** FR-008, FR-012, FR-013, New FR-031

**Q2: Idempotency Storage** - How should idempotency cache be stored?

**A2:** Use same Upstash Redis instance. Key pattern: `idem:{method}:{path}:{Idempotency-Key}`. Store bodyHash (SHA-256 of canonical JSON with stable key order) and full response. TTL = 60 seconds.
- Same key + same bodyHash → 200 replay with `X-Idempotent-Replayed: true`
- Same key + different bodyHash → 409 problem+json (type=/problems/idempotency-key-conflict)
→ **Integrated into:** FR-018, FR-021, FR-022, New FR-032

**Q3: Problem Type URIs** - Should problem type URIs use production domain or relative paths?

**A3:** Use absolute type URIs hosted on production domain:
- `https://<prod-domain>/problems/validation-error`
- `https://<prod-domain>/problems/method-not-allowed`
- `https://<prod-domain>/problems/rate-limit-exceeded`
- `https://<prod-domain>/problems/idempotency-key-conflict`
- `https://<prod-domain>/problems/internal-error`

All 4xx/5xx return `application/problem+json` with {type, title, status, detail, instance}. Set instance to request path or request ID if available.
→ **Integrated into:** FR-002, FR-005, New FR-033

**Q4: Rate Limit Window** - Fixed or sliding window?

**A4:** Sliding window (60 requests per rolling 60-minute period) using @upstash/ratelimit. Client IP extracted from FIRST value of `x-forwarded-for` header. On rate limit exceed, return 429 problem+json with `Retry-After` header (integer, seconds until reset). Always include X-RateLimit-* headers on all responses.
→ **Integrated into:** FR-009, FR-011, FR-012, FR-014, New FR-034

**Q5: Frontend Handling** - Should frontend be updated to parse problem+json?

**A5:** On non-2xx responses, if `Content-Type: application/problem+json` detected, parse and display Alert with `problem.title + problem.detail`. 200 OK responses remain unchanged (backward compatible, no client schema changes).
→ **Integrated into:** FR-027, FR-029, New FR-035

---

## Additional Requirements from Clarifications

**Rate Limit Implementation**
- **FR-031**: System MUST use Upstash Redis with @upstash/ratelimit library
- **FR-031a**: Rate limit keys MUST use namespace pattern: `PAYPLAN:{env}:rl:{ip}`
- **FR-031b**: System MUST use sliding window algorithm (60 requests per rolling 60 minutes)
- **FR-031c**: Client IP MUST be extracted from first value of `x-forwarded-for` header

**Idempotency Implementation**
- **FR-032**: System MUST use Upstash Redis for idempotency cache
- **FR-032a**: Idempotency keys MUST follow pattern: `idem:{method}:{path}:{Idempotency-Key}`
- **FR-032b**: System MUST store SHA-256 hash of canonical JSON (stable key order) as bodyHash
- **FR-032c**: System MUST cache full response JSON with 60-second TTL
- **FR-032d**: On cache hit with matching bodyHash, return `X-Idempotent-Replayed: true` header
- **FR-032e**: On cache hit with different bodyHash, return 409 problem+json

**Problem Type URIs**
- **FR-033**: Problem type URIs MUST be absolute URLs using production domain
- **FR-033a**: Problem types MUST be accessible at `/problems/{type-name}` routes
- **FR-033b**: Instance field MUST contain request path (e.g., `/api/plan`)

**Rate Limit Headers**
- **FR-034**: Retry-After header MUST be integer (seconds, not HTTP-date format)
- **FR-034a**: X-RateLimit-Reset MUST be Unix timestamp (seconds since epoch)
- **FR-034b**: Headers MUST be present on ALL responses (2xx, 4xx, 5xx)

**Frontend Error Handling**
- **FR-035**: Frontend MUST detect `application/problem+json` Content-Type
- **FR-035a**: Frontend MUST display Alert with `problem.title` and `problem.detail`
- **FR-035b**: Frontend MUST fallback to current error handling if problem+json parsing fails

---

## Updated Success Criteria

**Primary Success Metric**: API consumers receive RFC 9457 compliant error responses with helpful documentation links, and can safely retry requests using Idempotency-Key headers while respecting rate limits.

**Verification Tests:**

**Test 1: Problem Details (400)**
```bash
curl -X POST https://<prod>/api/plan -H "Content-Type: application/json" -d '{}'
# Expect: 400, Content-Type: application/problem+json
# Body includes: type (absolute URL), title, status: 400, detail
```

**Test 2: Rate Limit (429)**
```bash
for i in {1..61}; do curl -X POST https://<prod>/api/plan -H "Content-Type: application/json" -d @valid.json; done
# Request #61 returns: 429, Retry-After header, X-RateLimit-Remaining: 0
```

**Test 3: Idempotency Replay**
```bash
# Request 1
curl -X POST https://<prod>/api/plan -H "Idempotency-Key: test123" -H "Content-Type: application/json" -d @valid.json
# Request 2 (same key, same body, within 60s)
curl -X POST https://<prod>/api/plan -H "Idempotency-Key: test123" -H "Content-Type: application/json" -d @valid.json
# Expect: 200, X-Idempotent-Replayed: true, same response
```

**Test 4: Idempotency Conflict (409)**
```bash
curl -X POST https://<prod>/api/plan -H "Idempotency-Key: test123" -H "Content-Type: application/json" -d @different.json
# Expect: 409, problem+json with type=/problems/idempotency-key-conflict
```

**Test 5: Rate Limit Headers (Success)**
```bash
curl -i -X POST https://<prod>/api/plan -H "Content-Type: application/json" -d @valid.json
# Expect: X-RateLimit-Limit: 60, X-RateLimit-Remaining: 59, X-RateLimit-Reset: <timestamp>
```

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all 5 clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (problem+json format, 429 status, cache replay)
- [x] Scope is clearly bounded (no auth, specific error types, clear storage choice)
- [x] Dependencies identified (Upstash Redis, @upstash/ratelimit, SHA-256)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Requirements generated
- [x] Entities identified
- [x] Clarifications obtained and integrated
- [x] Review checklist passed

**Status**: ✅ **READY FOR PLANNING PHASE**
