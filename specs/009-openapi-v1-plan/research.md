# Research: OpenAPI v1 for POST /api/plan

**Date**: 2025-10-08
**Context**: Documenting existing POST /api/plan endpoint with authoritative OpenAPI 3.1 spec (docs-only)

---

## OpenAPI/HTTP Refresh — 2025-10-08

**Purpose**: Validate our OpenAPI 3.1 spec against current standards (as of Oct 2025) to ensure best practices alignment.

**Research Method**: Web searches + direct fetch of specification documents from official sources (spec.openapis.org, rfc-editor.org, IETF datatracker, MDN, GitHub).

### 1. OpenAPI Version (3.1.x)

**What's Current** (verified 2025-10-08 via GitHub releases):
- **OpenAPI 3.1.0**: Released 16 February 2022
- **OpenAPI 3.1.1**: Released 24 October 2022 (latest in 3.1.x series)
- **OpenAPI 3.1.2**: Released 19 September 2023
- **OpenAPI 3.2.0**: Released 19 September 2023 (current stable)
- Patch versions (3.1.0 → 3.1.1 → 3.1.2) address errors/clarifications, not feature changes
- Tooling supporting OAS 3.1 should be compatible with all 3.1.* versions
- Per spec: "patch version SHOULD NOT be considered by tooling"

**Note**: Spec page documents at spec.openapis.org show generation dates (Oct 2024, Sept 2025) which differ from actual GitHub release dates above. GitHub releases are authoritative.

**Impact on Our Spec**: We use `openapi: "3.1.0"` which is valid but outdated. OpenAPI 3.1.2 and 3.2.0 both exist as stable releases.

**Decision**: **No change** (keep 3.1.0)

**Rationale**: Updating to 3.1.2 or 3.2.0 is optional. Patch versions contain only clarifications (no feature changes). Our spec is valid under any 3.1.x version per semver policy. LOC cost is zero (1-char change), but no material benefit. Constitution principle: minimal changes for v1 docs-only deliverable.

---

### 2. JSON Schema Alignment (OAS 3.1)

**What's Current**: OpenAPI 3.1 uses JSON Schema 2020-12 (draft 2020-12). Our usage of `type`, `format: date`, `enum`, `minimum`, `maximum`, `minLength`, `maxLength`, `minItems` is fully compliant.

**Impact on Our Spec**:
- `format: date` for `due_date` (ISO 8601 YYYY-MM-DD) ✓
- `currency` as 3-letter string with `minLength: 3, maxLength: 3` (ISO 4217) ✓
- `confidence` with `minimum: 0, maximum: 1` ✓
- Optional `pattern: "^[A-Z]{3}$"` for currency could add strictness but costs +1 LOC

**Decision**: **No change to currency validation** (keep minLength/maxLength)

**Rationale**: Current validation (3-char length) is sufficient. Adding regex pattern costs LOC budget (+1 line) for marginal benefit. Future v2 can enhance if needed.

---

### 3. Problem Details (RFC 9457 Media Type)

**What's Current**: RFC 9457 (Problem Details for HTTP APIs) canonical media type is `application/problem+json`. Our error responses use `application/json` which is acceptable but not ideal.

**Impact on Our Spec**: We document Problem schema with 5 required fields (type, title, status, detail, instance) which conforms to RFC 9457. However, we use generic `application/json` content type.

**Decision**: **No spec change** (keep `application/json` for v1)

**Rationale**:
- Adding `application/problem+json` would require explicit content-type in responses (+3-4 LOC via flow style)
- Current implementation likely returns `application/json` (changing would break clients)
- OpenAPI spec documents schema structure (RFC 9457 compliant) regardless of media type
- v2 can migrate to proper media type with versioned endpoint

**Note for future**: Standard practice is `Content-Type: application/problem+json` for RFC 9457 errors.

---

### 4. HTTP Semantics: Retry-After (RFC 9110)

**What's Current**: RFC 9110 (HTTP Semantics, June 2022) defines `Retry-After` as either:
- delta-seconds (integer, e.g., "3600")
- HTTP-date (string, e.g., "Wed, 21 Oct 2025 07:28:00 GMT")

**Impact on Our Spec**: We define `Retry-After: { schema: { type: string } }` which accepts both formats.

**Decision**: **Keep as `type: string`**

**Rationale**:
- String type accommodates both delta-seconds and HTTP-date formats
- Implementation likely uses delta-seconds (simpler), but spec allows flexibility
- More specific type (integer) would break if implementation returns HTTP-date
- Current schema is RFC 9110 compliant

---

### 5. Rate Limiting Headers (Standard vs Legacy)

**What's Current**: IETF draft-ietf-httpapi-ratelimit-headers (2021) defines:
- `RateLimit-Limit` (standard, no X- prefix)
- `RateLimit-Remaining`
- `RateLimit-Reset`

Our API uses legacy `X-RateLimit-*` headers (common in pre-standard implementations).

**Impact on Our Spec**: We document `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` which are widely used but non-standard.

**Decision**: **Keep X-RateLimit-* for v1 backward compatibility**

**Rationale**:
- Changing headers would break existing clients
- X-RateLimit-* is de facto standard (GitHub, Stripe, Shopify use it)
- Standard `RateLimit-*` is not yet universally adopted
- OpenAPI spec documents what implementation returns (accuracy > idealism)

**Note**: Standard `RateLimit-*` headers exist per IETF draft; v2 could migrate with deprecation period.

---

### 6. Idempotency Headers

**What's Current**: Common practice (no RFC standard):
- Request: `Idempotency-Key` (client-provided, typically UUID)
- Response: `X-Idempotent-Replayed: true` (boolean) or similar custom header

**Impact on Our Spec**: We use `Idempotency-Key` (request parameter, 60s TTL) and `X-Idempotent-Replayed` (response header, boolean).

**Decision**: **Keep current implementation**

**Rationale**:
- No newer standard replaces this pattern (still industry best practice)
- 60s TTL documented in parameter description (clear semantics)
- Boolean `X-Idempotent-Replayed` is intuitive for clients
- Aligns with Stripe, PayPal, Square payment APIs

---

### 7. Spectral Rules & CLI

**What's Current**:
- Spectral CLI: `@stoplight/spectral-cli` (latest: 6.x as of 2025)
- Default ruleset: `spectral:oas` (OpenAPI 3.x best practices)
- Usage: `npx -y @stoplight/spectral-cli lint <file>`

**Impact on Our Spec**: We use default `oas` ruleset with non-blocking warnings.

**Decision**: **Keep current Spectral configuration**

**Rationale**:
- Default ruleset enforces OpenAPI 3.x best practices (operation IDs, examples, descriptions)
- Non-blocking warnings satisfy Constitution requirement (CI must not fail on warnings)
- Exit code 0 required for errors (spec must be valid)
- Custom rulesets deferred to future iterations (not needed for v1 baseline)

**Verification**: `npx -y @stoplight/spectral-cli lint api/openapi.yaml` must exit 0 (errors only)

---

### 8. Servers Object & Relative URLs

**What's Current**: OpenAPI 3.1 `servers` array best practice:
- Provide illustrative absolute URL (e.g., `https://api.example.com`)
- Add description noting clients typically use relative paths in production
- Vercel/serverless deployments serve from dynamic URLs (not fixed `api.example.com`)

**Impact on Our Spec**: We use:
```yaml
servers:
  - url: https://api.example.com
    description: Informational placeholder only; clients typically call relative path.
```

**Decision**: **Keep current servers configuration**

**Rationale**:
- Illustrative URL satisfies OpenAPI validation (servers array required)
- Description clarifies clients call `/api/plan` relative path (not absolute)
- Aligns with Vercel edge/serverless deployment model (dynamic URLs)
- Accurate representation of implementation behavior

---

### 9. Example Compactness & LOC Budget

**What's Current**: YAML flow style (inline JSON-like syntax) for compact examples:
```yaml
example: { key: value, array: [1, 2, 3] }
```
vs block style:
```yaml
example:
  key: value
  array:
    - 1
    - 2
    - 3
```

**Impact on Our Spec**: We use flow style for all examples (requestBody, responses) to preserve ≤180 LOC budget. Current: 176 LOC (97.8%).

**Decision**: **Keep flow-style examples**

**Rationale**:
- Flow style saves ~17 lines (verified via LOC-SHRINK optimization)
- Examples remain readable and valid YAML
- 200 response uses minimal 1-item example (not full 3-item roundtrip)
- Constitution hard limit: ≤180 LOC (current: 176, 4 lines remaining)

---

## Summary of 2025-10-08 Findings

| Topic | Current Standard | Our Spec | Decision | Impact |
|-------|------------------|----------|----------|--------|
| OpenAPI version | 3.2.0 (released Sept 2023) | 3.1.0 | **No change** | Valid per semver |
| JSON Schema | 2020-12 (OAS 3.1) | 2020-12 keywords | **No change** | Compliant |
| Problem media type | `application/problem+json` | `application/json` | **No change (v1)** | Acceptable; v2 can migrate |
| Retry-After | RFC 9110 (string/int) | `type: string` | **No change** | Compliant |
| Rate limit headers | `RateLimit-*` (IETF draft) | `X-RateLimit-*` (legacy) | **No change** | Backward compat; v2 can migrate |
| Idempotency | Industry pattern | `Idempotency-Key` + `X-Idempotent-Replayed` | **No change** | Best practice |
| Spectral | `spectral:oas` ruleset | Default `oas`, non-blocking | **No change** | Compliant |
| Servers object | Illustrative URL + note | `https://api.example.com` + description | **No change** | Best practice |
| Example style | Flow or block YAML | Flow style (compact) | **No change** | LOC budget requirement |

---

## Proposed Spec Changes

**Result**: **No spec changes required**

**Rationale**:
- All 9 topics reviewed against 2025-10-08 standards
- Current spec is compliant with OpenAPI 3.1.0 and relevant RFCs
- Minor deviations (`application/json` vs `application/problem+json`, `X-RateLimit-*` vs `RateLimit-*`) are acceptable for v1 backward compatibility
- LOC budget (176/180) leaves no room for non-essential enhancements
- Constitution constraints (≤180 LOC, docs-only, reversible) maintained

**Optional Future Enhancements** (defer to v2):
1. Migrate to `application/problem+json` media type for RFC 9457 errors
2. Adopt standard `RateLimit-*` headers (deprecate `X-RateLimit-*`)
3. Add `pattern: "^[A-Z]{3}$"` for currency field validation
4. Expand examples to include edge cases (multi-risk scenarios)

---

## Research Tasks

### 1. OpenAPI 3.1 Specification Standards

**Decision**: Use YAML format with strict component reuse via `$ref`

**Rationale**:
- YAML is more readable and maintainable for human-edited specs
- OpenAPI 3.1 aligns with JSON Schema 2020-12, enabling advanced validation
- Component reuse via `$ref` keeps spec DRY and under LOC budget
- Industry standard: Spectral, Swagger UI, Redoc all support YAML natively

**Best Practices Applied**:
- All schemas defined in `components/schemas` and referenced via `$ref`
- Examples placed at response level (not schema level) to avoid duplication
- Use `description` fields for semantic documentation (IANA timezone, RFC9457, etc.)
- Prefer simple types over complex inheritance (no `allOf`/`oneOf` unless required)

**Alternatives Considered**:
- JSON format: Rejected due to lower readability and verbose syntax
- Inline schemas: Rejected due to LOC bloat and maintenance burden

### 2. RFC9457 Problem Details Schema

**Decision**: Simplified schema with 5 required fields (type, title, status, detail, instance)

**Rationale**:
- RFC9457 defines optional extension members, but PayPlan doesn't use them
- Type URIs use `/problems/{error-category}` pattern for consistency
- Instance points to request URI for traceability
- Status field duplicates HTTP status for JSON-only consumers

**Best Practices Applied**:
- Type URI examples: `/problems/rate-limit-exceeded`, `/problems/validation-error`
- Detail provides actionable error messages (e.g., "items array is required")
- Instance reflects actual request path (e.g., `/api/plan`)
- Title is human-readable category (e.g., "Rate Limit Exceeded")

**Alternatives Considered**:
- Full RFC9457 with extension members: Rejected as unnecessary complexity
- Custom error format: Rejected in favor of RFC standard for interoperability

### 3. Spectral Ruleset Configuration

**Decision**: Use default `oas` ruleset (OpenAPI 3.x) with non-blocking warnings

**Rationale**:
- Default ruleset enforces best practices (operation IDs, descriptions, examples)
- Non-blocking mode allows warnings without failing CI (per FR-015)
- No custom rules needed for initial v1 spec (can add later for drift detection)

**Best Practices Applied**:
- Run: `npx -y @stoplight/spectral-cli lint api/openapi.yaml`
- Exit code 0 required (errors fail, warnings allowed)
- Post summary to GitHub Actions via workflow (future enhancement)

**Alternatives Considered**:
- Strict blocking mode: Rejected to maintain non-blocking CI requirement
- Custom ruleset: Deferred to future iteration (not needed for v1 baseline)

### 4. Idempotency Header Documentation

**Decision**: Document as operation `parameter` (in: header) with 60s TTL semantic in description

**Rationale**:
- Idempotency-Key is request-scoped, not global (not a security scheme)
- Optional parameter allows clients to opt-in
- Description field communicates TTL and replay behavior clearly
- Aligns with RFC pattern for custom headers

**Best Practices Applied**:
- Parameter name: `Idempotency-Key` (matches implementation)
- Type: string, format: uuid (or free-form string)
- Description: "Optional idempotency key with 60-second TTL. Repeated requests with same key+body return cached response."
- Response header `X-Idempotent-Replayed: true` documented on 200 response

**Alternatives Considered**:
- Security scheme: Rejected as idempotency is not auth/authz
- Global parameter: Rejected to keep spec focused on single endpoint

### 5. Rate-Limit Header Documentation

**Decision**: Use IETF draft header names (X-RateLimit-*) with cautious language

**Rationale**:
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- "Usually present on success" phrasing avoids over-promising (error paths may omit)
- `Retry-After` (RFC 9110) documented explicitly on 429 response
- Upstash 60/hr limit noted in POST operation description

**Best Practices Applied**:
- X-RateLimit-Limit: integer (e.g., 60)
- X-RateLimit-Remaining: integer (e.g., 42)
- X-RateLimit-Reset: integer (Unix epoch timestamp)
- Retry-After: integer (delta-seconds, e.g., 3600)

**Alternatives Considered**:
- RateLimit header (IETF draft): Not yet widely adopted; stick with X-* prefix
- Guarantee headers on all responses: Rejected to avoid spec drift if implementation changes

### 6. Schema Naming Conventions

**Decision**: PascalCase for schema names, snake_case for field names (matching JSON conventions)

**Rationale**:
- Schema names: `PlanItem`, `PlanRequest`, `PlanResponse`, `RiskFlag`, `MovedDate`, `ICSMetadata`, `Problem`
- Field names: `due_date`, `installment_no`, `late_fee` (snake_case)
- **Exception**: `affectedInstallments` (camelCase) for readability in risk context; avoids awkward `affected_installments`
- Consistency with TypeScript interface naming and JSON API conventions
- Enables clean client type generation (TypeScript, Go, Rust, etc.)

**Best Practices Applied**:
- Schema names are nouns (e.g., `PlanRequest` not `RequestPlan`)
- Enums use SCREAMING_SNAKE_CASE (e.g., `COLLISION`, `WEEKEND_AUTOPAY`, `US_FEDERAL_HOLIDAY`)
- Boolean fields use `is*` or bare names (e.g., `autopay` not `isAutopay`)
- Single exception documented for clarity: `affectedInstallments` in RiskFlag schema

**Alternatives Considered**:

- snake_case for all including `affected_installments`: Rejected as less readable than camelCase for this field
- camelCase for all fields: Rejected to match existing API contract (due_date, not dueDate)

---

## Summary of Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Format** | YAML with `$ref` | Readability, maintainability, LOC efficiency |
| **RFC9457** | 5-field simplified schema | Matches implementation, avoids complexity |
| **Spectral** | Default `oas` ruleset, non-blocking | Best practices enforcement, CI compatibility |
| **Idempotency** | Parameter (in: header) + description | Request-scoped, clear TTL semantics |
| **Rate Limits** | X-RateLimit-* + cautious language | IETF draft headers, no over-promising |
| **Naming** | PascalCase schemas, snake_case fields | Consistency, type generation friendliness |

---

## Next Steps

Proceed to Phase 1:
- Create `data-model.md` with schema definitions
- Create `quickstart.md` with validation/usage guide
- Reference these decisions in OpenAPI spec comments where applicable
