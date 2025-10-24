# Feature Specification: OpenAPI v1 for POST /api/plan

**Feature Branch**: `009-openapi-v1-plan`
**Created**: 2025-10-08
**Status**: Draft - Pending MUST Clarifications
**Input**: User description: "Author a docs-only, authoritative OpenAPI 3.1 spec for POST /api/plan that reflects the API we currently ship. Zero runtime changes. This operationalizes 'OpenAPI is source of truth' and aligns CI Spectral lint + our guardrails."

## Execution Flow (main)

```text
1. Parse user description from Input
   → Complete: Documentation-only OpenAPI 3.1 spec for POST /api/plan
2. Extract key concepts from description
   → Actors: Client developers implementing /api/plan integration
   → Actions: Read spec, implement request/response handling, validate inputs
   → Data: Request schemas, response schemas, error formats (RFC9457)
   → Constraints: ≤8 files, ≤180 LOC (target ≤120), docs-only, single-revert
3. For each unclear aspect:
   → 4 MUST clarifications below (blocking /plan phase)
4. Fill User Scenarios & Testing section
   → Complete: Implementation and validation scenarios defined
5. Generate Functional Requirements
   → Complete: All testable requirements with Constitution constraints
6. Identify Key Entities (if data involved)
   → Complete: Schemas defined pending clarifications
7. Run Review Checklist
   → Blocked on MUST clarifications
8. Return: Awaiting clarifications before /plan
```

---

## Quick Guidelines

- Focus on WHAT the API contract provides (request/response/errors)
- Avoid HOW backend implements logic (internal processing is private)
- Written for client developers integrating with /api/plan

---

## User Scenarios & Testing

### Primary User Story

A client developer needs to implement a BNPL payment planning feature in their application. They read the OpenAPI specification for POST /api/plan to understand the exact request format, response structure, error handling, and rate-limiting behavior. Using only the spec and synthetic examples, they generate client types, construct valid requests, parse responses correctly, and handle all documented error cases including 429 rate limits with Retry-After semantics.

### Acceptance Scenarios

1. **Given** a client developer reviews `api/openapi.yaml`, **When** they examine the request schema, **Then** they can construct valid requests using documented fields and examples without consulting source code or tests
2. **Given** a CI workflow runs Spectral linting, **When** `npx -y @stoplight/spectral-cli lint api/openapi.yaml` executes, **Then** the command exits with 0 errors (warnings allowed) and posts summary to GitHub Actions
3. **Given** a PR reviewer checks the template, **When** reviewing changes to /api/plan behavior, **Then** they verify the "OpenAPI is SoT" checkbox by confirming spec matches implementation
4. **Given** a client application receives an error response (400, 429, 500), **When** parsing the error, **Then** they extract RFC9457 Problem Details fields (type, title, status, detail, instance) and for 429, respect the Retry-After header value
5. **Given** a client needs to understand rate limits, **When** they read the spec, **Then** they see documented X-RateLimit-* headers and the 60/hour Upstash limit note

### Edge Cases

- What happens when request schema doesn't match actual API behavior?
  → Spec drift is detected by future CI checks (not in scope for initial spec; establishes baseline)
- What happens when client sends undocumented fields?
  → API behavior is undefined; spec documents only supported fields
- What happens when spec has OpenAPI syntax errors?
  → Spectral linting fails CI with clear error messages before merge
- What happens when new risk types are added?
  → Spec enum must be updated to reflect new values (enforced by PR template checklist)

## Requirements

### Functional Requirements (Constitution-aware)

- **FR-001**: System MUST provide OpenAPI 3.1 file at `api/openapi.yaml` documenting POST /api/plan endpoint with zero runtime changes
- **FR-002**: Spec MUST define request schema reflecting current API input (pending **Clarification #1**: emails vs. items vs. both with `oneOf`)
- **FR-003**: Spec MUST define `PlanResponse` schema with fields currently returned: normalized installments (each with per-item confidence), movedDates (business-day shifts), riskFlags array, ICS metadata (pending **Clarification #4**: metadata only or bytes?)
- **FR-004**: Spec MUST define risk enum constrained to Constitution-approved types (pending **Clarification #2**: COLLISION + WEEKEND_AUTOPAY only, or include CASH_CRUNCH?)
- **FR-005**: Spec MUST define RFC9457 `Problem` schema with fields: type (URI), title (string), status (HTTP code), detail (string), instance (URI)
- **FR-006**: Spec MUST document rate-limit headers (pending **Clarification #3**: confirm X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset are emitted today)
- **FR-007**: Spec MUST document Retry-After header for 429 responses (delta-seconds per RFC 9110)
- **FR-008**: Spec MUST note Idempotency-Key semantics if applicable to this endpoint (pending **Clarification #3**: observed on POST /api/plan today?)
- **FR-009**: Spec MUST include synthetic request example(s) for each accepted input variant (no PII, privacy-first)
- **FR-010**: Spec MUST include successful 200 response example with all documented fields populated
- **FR-011**: Spec MUST include error examples for v1: 400 (validation error), 429 (rate limit with Retry-After), 500 (internal error) — exclude 405/409
- **FR-012**: Spec MUST indicate security scheme: none (public dev API, no authentication required)
- **FR-013**: Spec MUST include informational description noting Upstash 60/hour rate limit
- **FR-014**: Spec MUST pass `npx -y @stoplight/spectral-cli lint api/openapi.yaml` with zero errors
- **FR-015**: CI workflow MUST remain non-blocking; linting results posted to GitHub Actions Summary (no secrets in CI)
- **FR-016**: Total LOC for spec file MUST be ≤180 (target ≤120); reversible via single git revert
- **FR-017**: System MUST create delta doc `ops/deltas/0022_openapi_v1_plan.md` with scope, verification steps, and rollback command
- **FR-018**: Spec MUST use ISO week (Mon–Sun) America/New_York timezone semantics per Constitution time rules

### Key Entities (WHAT only; pending clarifications)

- **PlanRequestEmails** (if applicable): Input schema for email-based requests
  - Array of redacted email structures
  - [Blocked: Clarification #1 needed]

- **PlanRequestItems** (if applicable): Input schema for normalized items
  - Array of PlanItem objects with provider, amount, due_date, autopay, late_fee
  - Payday specification fields
  - minBuffer threshold
  - timeZone (IANA string)
  - [Blocked: Clarification #1 needed for exact fields]

- **PlanItem**: Single installment entry
  - provider (string)
  - installment_no (integer)
  - due_date (ISO 8601 date string)
  - amount (number)
  - currency (3-letter code)
  - autopay (boolean)
  - late_fee (number)

- **PlanResponse**: Successful response output
  - normalized: array of PlanItem objects (each with per-item confidence field)
  - movedDates: array of business-day shift metadata
  - riskFlags: array of RiskFlag objects
  - ICS metadata: [Blocked: Clarification #4 needed - metadata only or base64 bytes?]

- **RiskFlag**: Risk detection result
  - type: enum [Blocked: Clarification #2 - COLLISION | WEEKEND_AUTOPAY only, or include CASH_CRUNCH?]
  - severity: high | medium | low
  - date: ISO 8601 date string
  - message: human-readable description
  - affectedInstallments: array of related items

- **Problem**: RFC9457 error response
  - type: URI identifying error category (e.g., `/problems/rate-limit-exceeded`)
  - title: short human-readable summary
  - status: HTTP status code (400, 429, 500, etc.)
  - detail: detailed explanation
  - instance: request URI

---

## Clarifications (MUST block /plan until answered)

Based on Constitution constraints and current implementation uncertainty:

### MUST Clarifications (blocking)

1. **Request shape today**: Does POST /api/plan accept:
   - A) `PlanRequestEmails` (array of redacted email-like inputs), OR
   - B) `PlanRequestItems` (normalized items with explicit fields), OR
   - C) Both (model as `oneOf` in OpenAPI schema)?

   **Why this matters**: Determines if spec includes one schema or two with discriminator.

2. **Risk enum in API v1**: Constitution mentions "risks default limited to COLLISION & WEEKEND_AUTOPAY". Confirm:
   - A) Document only: `COLLISION | WEEKEND_AUTOPAY` (exclude CASH_CRUNCH), OR
   - B) Include all three if all are emitted today: `COLLISION | WEEKEND_AUTOPAY | CASH_CRUNCH`

   **Why this matters**: Enum accuracy for client type generation and validation.

3. **Headers actually emitted today**:
   - A) Are `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers present in all responses?
   - B) Is `Retry-After` header present on 429 responses?
   - C) Is `Idempotency-Key` request header observed/processed on POST /api/plan, or only on future write endpoints?

   **Why this matters**: Accurate header documentation for client retry logic and idempotency guarantees.

4. **ICS exposure**: Does the response include:
   - A) ICS file bytes (e.g., base64-encoded string), OR
   - B) Only metadata/annotations (URL, filename, no binary content)?

   **Why this matters**: Schema type definition (string vs. object) and example format.

### SHOULD Clarifications (won't block)

5. **Max items per request**: Is there a documented or tested maximum for the items array (e.g., 50 installments)? Include as schema `description` note if known.

6. **Schema naming convention**: Standardize on `PlanRequest`, `PlanResponse`, `RiskFlag`, `Problem` to match future endpoints?

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs (client integration clarity)
- [x] Written for client developers (non-backend stakeholders)
- [x] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain → **BLOCKED: 4 MUST clarifications above**
- [x] Requirements are testable and unambiguous (given clarifications)
- [x] Success criteria are measurable (Spectral lint exit code, LOC count)
- [x] Scope is clearly bounded (docs-only, single endpoint)
- [x] Dependencies and assumptions identified (Constitution constraints)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (4 MUST clarifications)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified (pending clarifications)
- [ ] Review checklist passed → **BLOCKED on clarifications**

---

## Constitution Check

Applied to this spec per user-provided constraints:

- ✅ **Budgets**: ≤8 files (1 openapi.yaml + 1 delta doc ≤ 2 files); ≤180 LOC (target ≤120)
- ✅ **Rollback**: Single-revert capability (git revert commit-hash)
- ✅ **Security posture (docs)**: RFC9457 Problem Details; Idempotency-Key semantics noted; 429 + Retry-After documented; rate limit (Upstash 60/hr) specified
- ✅ **Time rules**: ISO week (Mon–Sun) America/New_York timezone per Constitution
- ✅ **Risk enum constraint**: Clarification #2 ensures compliance with "default limited to COLLISION & WEEKEND_AUTOPAY"
- ✅ **Privacy-first**: All examples will use synthetic data (no PII)
- ✅ **CI non-blocking**: Spectral lint posts summary; no secrets in CI config
- ✅ **Zero runtime changes**: Docs-only delta; no server/API behavior modification

---

## Ready for /plan?

**Not yet.** This spec is **ready for /plan once MUST clarifications (1-4) are answered.**

The four blocking questions are:
1. Request shape: emails | items | both (oneOf)?
2. Risk enum: COLLISION+WEEKEND_AUTOPAY only, or include CASH_CRUNCH?
3. Headers emitted: X-RateLimit-*, Retry-After, Idempotency-Key behavior?
4. ICS exposure: bytes (base64) or metadata only?

Once answered, proceed to `/plan` to generate implementation tasks.
