# Implementation Plan: OpenAPI v1 for POST /api/plan

**Branch**: `009-openapi-v1-plan` | **Date**: 2025-10-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/home/matt/PROJECTS/PayPlan/specs/009-openapi-v1-plan/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Complete: Spec loaded with clarifications resolved
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Complete: All clarifications resolved via user input
   → Project Type: Single (documentation-only, no source changes)
   → Structure Decision: Specs directory only
3. Fill the Constitution Check section
   → ✅ Complete: Constitution constraints applied
4. Evaluate Constitution Check section
   → ✅ PASS: Docs-only, ≤2 files, ≤180 LOC, reversible
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → IN PROGRESS
6. Execute Phase 1 → data-model.md, quickstart.md
   → PENDING
7. Re-evaluate Constitution Check section
   → PENDING
8. Plan Phase 2 → Describe task generation approach
   → PENDING
9. STOP - Ready for /tasks command
   → PENDING
```

## Summary

Create an authoritative OpenAPI 3.1 specification (`api/openapi.yaml`) documenting the existing POST /api/plan endpoint with zero runtime changes. This establishes "OpenAPI is source of truth" for the PayPlan API, enabling client type generation and drift detection. The spec documents normalized items input (items array, timezone, optional dateLocale), response schema with normalized installments (each with confidence), movedDates, riskFlags (COLLISION | WEEKEND_AUTOPAY), and ICS metadata. RFC9457 Problem Details for errors (400, 429, 500). Rate-limiting headers and idempotency semantics documented. Synthetic examples, privacy-first. Target: ≤120 LOC, passing Spectral lint, non-blocking CI.

## Technical Context

**Resolved Clarifications** (from user input):
1. **Request shape**: Items-only (items[], timezone, dateLocale?). No paycheck/minBuffer/cadence in v1.
2. **Risk enum**: COLLISION | WEEKEND_AUTOPAY (exclude CASH_CRUNCH)
3. **Headers emitted**: X-RateLimit-* usually present on success; 429 includes Retry-After; Idempotency-Key honored with 60s TTL
4. **ICS exposure**: Metadata only (filename, calendarName, note)

**Language/Version**: OpenAPI 3.1 (YAML format)
**Primary Dependencies**: Spectral CLI (linting), none at runtime (docs-only)
**Storage**: N/A (documentation artifact)
**Testing**: Spectral lint validation (`npx -y @stoplight/spectral-cli lint api/openapi.yaml`)
**Target Platform**: API documentation consumers (client developers, type generators)
**Project Type**: Single (documentation-only)
**Performance Goals**: Lint execution <5s; spec comprehension within 10 minutes for new developers
**Constraints**: ≤180 LOC (target ≤120); zero OpenAPI syntax errors; zero Spectral errors (warnings allowed)
**Scale/Scope**: Single endpoint (POST /api/plan); 6-8 schema components; 3 error examples

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Budgets & Simplicity**:
- ≤2 files: api/openapi.yaml + ops/deltas/0022_openapi_v1_plan.md ✅
- ≤180 LOC (target ≤120): OpenAPI spec estimated 110-130 LOC ✅
- Single-revert rollback: `git revert <commit-hash>` ✅
- Docs-only: Zero runtime/server code changes ✅

✅ **Security Posture**:
- RFC9457 Problem Details: Documented in Problem schema ✅
- Idempotency-Key: Request header with 60s TTL documented ✅
- Rate limiting: X-RateLimit-* headers + Upstash 60/hr note ✅
- 429 + Retry-After: Documented per RFC 9110 ✅
- Privacy-first: All examples use synthetic data (no PII) ✅

✅ **Time Rules**:
- ISO week (Mon–Sun): Documented in description/examples ✅
- America/New_York timezone: Referenced in schema descriptions ✅

✅ **Risk Semantics**:
- Risk enum constrained: COLLISION | WEEKEND_AUTOPAY only ✅
- CASH_CRUNCH excluded per Constitution ✅

✅ **CI & Quality**:
- Spectral lint non-blocking: Results posted to GH Actions Summary ✅
- No secrets in CI: Public linting only ✅
- Zero syntax errors: Spectral enforcement ✅

**Deviations**: None

## Project Structure

### Documentation (this feature)
```
specs/009-openapi-v1-plan/
├── spec.md              # Feature specification (existing)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (OpenAPI 3.1 best practices)
├── data-model.md        # Phase 1 output (schema definitions)
├── quickstart.md        # Phase 1 output (validation & usage guide)
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
api/
└── openapi.yaml         # NEW: OpenAPI 3.1 spec for POST /api/plan (single file)

ops/deltas/
└── 0022_openapi_v1_plan.md  # NEW: Delta doc (scope, verify, rollback)
```

**Structure Decision**: Documentation-only change; no src/ modifications; exactly 2 files created

## Phase 0: Outline & Research

**Objective**: Resolve OpenAPI 3.1 best practices and schema design patterns for the PayPlan API contract.

### Research Tasks

1. **OpenAPI 3.1 Specification Standards**:
   - Decision needed: YAML vs JSON format (favor YAML for readability)
   - Best practices: Component reuse, $ref usage, example placement
   - Rationale: Ensure spec is idiomatic and tool-compatible

2. **RFC9457 Problem Details Schema**:
   - Decision needed: Full schema or simplified subset
   - Best practices: type URI structure, instance vs detail usage
   - Rationale: Match existing PayPlan error format patterns

3. **Spectral Ruleset Configuration**:
   - Decision needed: Custom rules or default OAS ruleset
   - Best practices: Non-blocking warnings vs blocking errors
   - Rationale: Align with CI workflow expectations (FR-015)

4. **Idempotency Header Documentation**:
   - Decision needed: How to document optional headers with semantic meaning
   - Best practices: Parameter object vs header in security scheme
   - Rationale: Communicate 60s TTL and replay semantics

5. **Rate-Limit Header Documentation**:
   - Decision needed: Standard vs custom header naming
   - Best practices: Document IETF draft headers (X-RateLimit-*)
   - Rationale: Clarify "usually present on success; 429 includes Retry-After"

6. **Schema Naming Conventions**:
   - Decision needed: PascalCase vs snake_case for schema names
   - Best practices: Consistency with TypeScript/JSON conventions
   - Rationale: Enable clean client type generation

**Output**: [research.md](research.md) with all decisions documented

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### Artifacts to Generate

1. **data-model.md**: Schema component definitions
   - **PlanItem** (8 fields):
     - provider (string)
     - installment_no (integer, optional)
     - due_date (ISO 8601 date string)
     - amount (number)
     - currency (string, 3-letter code)
     - autopay (boolean)
     - late_fee (number)
     - confidence (number, NEW: per-item confidence score)

   - **PlanRequest** (3 fields):
     - items (array of PlanItem, required)
     - timezone (IANA string, required, e.g. "America/New_York")
     - dateLocale (string, optional, e.g. "en-US")

   - **RiskFlag** (4 fields, NO severity):
     - type (enum: COLLISION | WEEKEND_AUTOPAY)
     - date (ISO 8601 date string)
     - message (string)
     - affectedInstallments (array of objects with index: integer, referencing normalized array)

   - **MovedDate** (3 fields):
     - from (ISO 8601 date string)
     - to (ISO 8601 date string)
     - reason (enum: WEEKEND | US_FEDERAL_HOLIDAY)

   - **ICSMetadata** (3 fields):
     - filename (string)
     - calendarName (string)
     - note (string, risk annotations summary)

   - **PlanResponse** (4 fields, NO top-level confidence):
     - normalized (array of PlanItem, each has confidence field)
     - riskFlags (array of RiskFlag)
     - movedDates (array of MovedDate)
     - icsMetadata (ICSMetadata object)

   - **Problem** (5 fields, RFC9457):
     - type (URI string)
     - title (string)
     - status (integer HTTP code)
     - detail (string)
     - instance (URI string)

2. **api/openapi.yaml structure** (embedded in tasks, not separate file):
   - OpenAPI 3.1.0
   - info: title, version, description
   - servers: omit or use placeholder (https://api.example.com with "informational" note)
   - paths:
     - /api/plan:
       - POST:
         - description: "Generate BNPL payment plan with risk detection. Rate limit: 60 requests/hour per IP (Upstash). Server URL is illustrative; /api/plan is served from Vercel edge/serverless (client code typically calls relative path)."
         - parameters:
           - Idempotency-Key (in: header, optional, 60s TTL in description)
         - requestBody: PlanRequest schema, synthetic example (3-5 items)
         - responses:
           - 200:
             - content: PlanResponse schema, complete example
             - headers:
               - X-RateLimit-Limit (usually present on success)
               - X-RateLimit-Remaining (usually present on success)
               - X-RateLimit-Reset (usually present on success)
               - X-Idempotent-Replayed (true if cached response)
           - 400:
             - content: Problem schema, validation error example
           - 429:
             - content: Problem schema, rate limit example
             - headers:
               - Retry-After (delta-seconds)
           - 500:
             - content: Problem schema, internal error example
   - components/schemas: All 6 schemas above

3. **quickstart.md**: Validation and usage guide
   - Step 1: Install Spectral CLI
   - Step 2: Lint spec: `npx -y @stoplight/spectral-cli lint api/openapi.yaml`
   - Step 3: Verify zero errors, review warnings
   - Step 4: Example client usage (curl request/response with synthetic data)
   - Step 5: Rollback instructions: `git revert <commit-hash>`

**Output**: data-model.md, quickstart.md (NO separate contracts file)

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate tasks for single-file OpenAPI spec creation:
  1. Create api/openapi.yaml skeleton (openapi: 3.1.0, info, servers placeholder)
  2. Define PlanItem schema in components/schemas (8 fields including confidence)
  3. Define PlanRequest schema (items[], timezone, dateLocale?)
  4. Define RiskFlag schema (type enum COLLISION|WEEKEND_AUTOPAY, date, message, affectedInstallments[] with index)
  5. Define MovedDate schema (from, to, reason enum)
  6. Define ICSMetadata schema (filename, calendarName, note)
  7. Define PlanResponse schema (normalized[], riskFlags[], movedDates[], icsMetadata)
  8. Define Problem schema (RFC9457: type, title, status, detail, instance)
  9. Create POST /api/plan path with Idempotency-Key parameter (in: header, 60s TTL description)
  10. Add POST operation description: "Generate BNPL payment plan with risk detection. Rate limit: 60 requests/hour per IP (Upstash). Server URL is illustrative; /api/plan is served from Vercel edge/serverless (client code typically calls relative path)."
  11. Add requestBody (PlanRequest + example with 3-5 items)
  12. Add 200 response (PlanResponse + synthetic example, headers: X-RateLimit-*, X-Idempotent-Replayed)
  13. Add 400 response (Problem + validation error example)
  14. Add 429 response (Problem + rate limit example, headers: Retry-After)
  15. Add 500 response (Problem + internal error example)
  16. Create ops/deltas/0022_openapi_v1_plan.md (scope, verify, rollback)
  17. Run Spectral lint: `npx -y @stoplight/spectral-cli lint api/openapi.yaml`
  18. Fix any Spectral errors (iterate until zero errors)
  19. Verify LOC ≤180 (target ≤120)
  20. Final review: Completeness checklist (all FRs satisfied)

**Ordering Strategy**:
- Sequential: Schemas → paths → parameters → responses → headers → examples
- No parallelism (single file)
- Incremental validation: Lint after major sections

**Estimated Output**: 19 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (write api/openapi.yaml + delta doc following tasks.md)
**Phase 5**: Validation (Spectral lint passes, LOC check ≤180, rollback test, PR template checklist)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) → [research.md](research.md)
- [x] Phase 1: Design complete (/plan command) → [data-model.md](data-model.md), [quickstart.md](quickstart.md)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (≤2 files, ≤180 LOC, docs-only, reversible)
- [x] All NEEDS CLARIFICATION resolved (via user input)
- [x] Complexity deviations documented (none)

---
*Based on Constitution constraints: ≤2 files, ≤180 LOC, docs-only, reversible, privacy-first, COLLISION|WEEKEND_AUTOPAY only*
