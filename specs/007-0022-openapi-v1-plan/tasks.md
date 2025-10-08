# Implementation Tasks: OpenAPI v1 for POST /api/plan

**Feature Branch**: `007-0022-openapi-v1-plan`
**Date**: 2025-10-08
**Input**: [plan.md](plan.md), [data-model.md](data-model.md), [research.md](research.md)

## Constitution Constraints (Enforce All Tasks)

- **Files**: ONLY `api/openapi.yaml` + `ops/deltas/0022_openapi_v1_plan.md` (≤2 files)
- **LOC**: ≤180 (target ≤120) for openapi.yaml
- **Reversibility**: Single `git revert <commit>` rollback
- **Docs-only**: Zero runtime/server changes
- **Risks**: COLLISION | WEEKEND_AUTOPAY only (no CASH_CRUNCH)
- **Errors**: 400, 429, 500 only (no 405, 409)
- **Confidence**: Per-item in PlanItem schema (no top-level in PlanResponse)
- **affectedInstallments**: Array of `{ index: integer }` (camelCase field)
- **Headers**: Idempotency-Key (request, 60s TTL), X-RateLimit-* + X-Idempotent-Replayed (200), Retry-After (429)
- **Privacy**: Synthetic examples only (no PII)

---

## Task Summary

19 tasks in sequential order (no parallelism; single file):

- **T001**: Create openapi.yaml skeleton [X]
- **T002**: Define PlanItem schema [X]
- **T003**: Define PlanRequest schema [X]
- **T004**: Define RiskFlag schema [X]
- **T005**: Define MovedDate schema [X]
- **T006**: Define ICSMetadata schema [X]
- **T007**: Define PlanResponse schema [X]
- **T008**: Define Problem schema [X]
- **T009**: Add POST operation description (rate limit + server URL note) [X]
- **T010**: Add Idempotency-Key header parameter [X]
- **T011**: Add request body with example [X]
- **T012**: Add 200 response with headers [X]
- **T013**: Add 400 response [X]
- **T014**: Add 429 response with Retry-After [X]
- **T015**: Add 500 response [X]
- **T016**: Consistency pass (field names, enums, references) [X]
- **T017**: Spectral lint validation (0 errors) [X]
- **T018**: Create delta doc [X]
- **T019**: LOC gate verification (≤180) [X]

---

## T001: Create OpenAPI Skeleton

**Path**: `api/openapi.yaml`

**Objective**: Initialize OpenAPI 3.1.0 file with info, servers placeholder, paths stub, and components/schemas stub.

**Acceptance Criteria**:
- File created at `api/openapi.yaml`
- `openapi: "3.1.0"` version declaration
- `info` section with title "PayPlan API v1", version "1.0.0", description stub
- `servers` section omitted OR placeholder `https://api.example.com` with comment "# Informational only"
- `paths` section with `/api/plan` key (empty object)
- `components/schemas` section (empty object)

**LOC Target**: ~15 lines

**Constitution Check**:
- ✅ Docs-only (no runtime changes)
- ✅ Single file created

**Verification**:
```bash
cat api/openapi.yaml
# Should show valid YAML with openapi: "3.1.0"
```

---

## T002: Define PlanItem Schema

**Path**: `api/openapi.yaml` → `components/schemas/PlanItem`

**Objective**: Define PlanItem schema with 8 fields including per-item confidence.

**Acceptance Criteria**:
- Schema added under `components/schemas/PlanItem`
- Type: `object`
- Required fields: `provider`, `due_date`, `amount`, `currency`, `autopay`, `late_fee`, `confidence`
- Optional fields: `installment_no`
- Fields:
  - `provider` (string): BNPL provider name
  - `installment_no` (integer): Installment number
  - `due_date` (string, format: date): ISO 8601 date (YYYY-MM-DD)
  - `amount` (number): Payment amount
  - `currency` (string, pattern: ^[A-Z]{3}$): 3-letter currency code
  - `autopay` (boolean): Autopay enabled
  - `late_fee` (number, minimum: 0): Late fee amount
  - `confidence` (number, minimum: 0.0, maximum: 1.0): Extraction confidence score

**LOC Target**: ~18 lines

**Constitution Check**:
- ✅ Per-item confidence field present
- ✅ Field names use snake_case (due_date, installment_no, late_fee)

**Verification**:
```bash
yq '.components.schemas.PlanItem.properties | keys' api/openapi.yaml
# Should list: amount, autopay, confidence, currency, due_date, installment_no, late_fee, provider
```

---

## T003: Define PlanRequest Schema

**Path**: `api/openapi.yaml` → `components/schemas/PlanRequest`

**Objective**: Define PlanRequest schema with items[], timezone, optional dateLocale (no paycheck/minBuffer).

**Acceptance Criteria**:
- Schema added under `components/schemas/PlanRequest`
- Type: `object`
- Required fields: `items`, `timezone`
- Optional fields: `dateLocale`
- Fields:
  - `items` (array, minItems: 1): Array of `$ref: '#/components/schemas/PlanItem'`
  - `timezone` (string): IANA timezone (e.g., "America/New_York")
  - `dateLocale` (string): Locale for date formatting (e.g., "en-US")

**LOC Target**: ~12 lines

**Constitution Check**:
- ✅ No paycheck/minBuffer fields (items-only v1)

**Verification**:
```bash
yq '.components.schemas.PlanRequest.required' api/openapi.yaml
# Should list: [items, timezone]
```

---

## T004: Define RiskFlag Schema

**Path**: `api/openapi.yaml` → `components/schemas/RiskFlag`

**Objective**: Define RiskFlag schema with type enum (COLLISION | WEEKEND_AUTOPAY), NO severity.

**Acceptance Criteria**:
- Schema added under `components/schemas/RiskFlag`
- Type: `object`
- Required fields: `type`, `date`, `message`, `affectedInstallments`
- Fields:
  - `type` (string, enum: [COLLISION, WEEKEND_AUTOPAY]): Risk type
  - `date` (string, format: date): ISO 8601 date when risk occurs
  - `message` (string): Human-readable description
  - `affectedInstallments` (array): Array of objects with `index` (integer) property
- **NO severity field**

**LOC Target**: ~14 lines

**Constitution Check**:
- ✅ Risk enum: COLLISION | WEEKEND_AUTOPAY only (no CASH_CRUNCH)
- ✅ No severity field
- ✅ affectedInstallments uses camelCase (documented exception)

**Verification**:
```bash
yq '.components.schemas.RiskFlag.properties.type.enum' api/openapi.yaml
# Should list: [COLLISION, WEEKEND_AUTOPAY]
yq '.components.schemas.RiskFlag.properties | has("severity")' api/openapi.yaml
# Should return: false
```

---

## T005: Define MovedDate Schema

**Path**: `api/openapi.yaml` → `components/schemas/MovedDate`

**Objective**: Define MovedDate schema for business-day shifts with reason enum.

**Acceptance Criteria**:
- Schema added under `components/schemas/MovedDate`
- Type: `object`
- Required fields: `from`, `to`, `reason`
- Fields:
  - `from` (string, format: date): Original due date
  - `to` (string, format: date): Shifted due date
  - `reason` (string, enum: [WEEKEND, US_FEDERAL_HOLIDAY]): Shift reason

**LOC Target**: ~10 lines

**Constitution Check**:
- ✅ Reason enum matches business-day logic

**Verification**:
```bash
yq '.components.schemas.MovedDate.properties.reason.enum' api/openapi.yaml
# Should list: [WEEKEND, US_FEDERAL_HOLIDAY]
```

---

## T006: Define ICSMetadata Schema

**Path**: `api/openapi.yaml` → `components/schemas/ICSMetadata`

**Objective**: Define ICSMetadata schema with filename, calendarName, note (no ICS bytes).

**Acceptance Criteria**:
- Schema added under `components/schemas/ICSMetadata`
- Type: `object`
- Required fields: `filename`, `calendarName`, `note`
- Fields:
  - `filename` (string): Suggested filename (e.g., "payplan-2025-10-08.ics")
  - `calendarName` (string): Calendar name (e.g., "PayPlan Installments")
  - `note` (string): Risk annotations summary

**LOC Target**: ~8 lines

**Constitution Check**:
- ✅ Metadata only (no base64 ICS bytes)

**Verification**:
```bash
yq '.components.schemas.ICSMetadata.properties | keys' api/openapi.yaml
# Should list: calendarName, filename, note
```

---

## T007: Define PlanResponse Schema

**Path**: `api/openapi.yaml` → `components/schemas/PlanResponse`

**Objective**: Define PlanResponse schema with 4 fields (NO top-level confidence).

**Acceptance Criteria**:
- Schema added under `components/schemas/PlanResponse`
- Type: `object`
- Required fields: `normalized`, `riskFlags`, `movedDates`, `icsMetadata`
- Fields:
  - `normalized` (array): `$ref: '#/components/schemas/PlanItem'` (each item has confidence)
  - `riskFlags` (array): `$ref: '#/components/schemas/RiskFlag'`
  - `movedDates` (array): `$ref: '#/components/schemas/MovedDate'`
  - `icsMetadata` (object): `$ref: '#/components/schemas/ICSMetadata'`
- **NO top-level confidence field**

**LOC Target**: ~11 lines

**Constitution Check**:
- ✅ No top-level confidence (per-item only)

**Verification**:
```bash
yq '.components.schemas.PlanResponse.properties | has("confidence")' api/openapi.yaml
# Should return: false
yq '.components.schemas.PlanResponse.required | length' api/openapi.yaml
# Should return: 4
```

---

## T008: Define Problem Schema

**Path**: `api/openapi.yaml` → `components/schemas/Problem`

**Objective**: Define RFC9457 Problem schema with 5 required fields.

**Acceptance Criteria**:
- Schema added under `components/schemas/Problem`
- Type: `object`
- Required fields: `type`, `title`, `status`, `detail`, `instance`
- Fields:
  - `type` (string, format: uri): Error category URI (e.g., "/problems/rate-limit-exceeded")
  - `title` (string): Short human-readable summary
  - `status` (integer): HTTP status code
  - `detail` (string): Detailed explanation
  - `instance` (string, format: uri): Request URI

**LOC Target**: ~12 lines

**Constitution Check**:
- ✅ RFC9457 compliant

**Verification**:
```bash
yq '.components.schemas.Problem.required | length' api/openapi.yaml
# Should return: 5
```

---

## T009: Add POST Operation Description

**Path**: `api/openapi.yaml` → `paths./api/plan.post.description`

**Objective**: Add operation description with Upstash 60/hr rate limit and server URL note.

**Acceptance Criteria**:
- `paths./api/plan.post` section created
- `description` field contains:
  - "Generate BNPL payment plan with risk detection."
  - "Rate limit: 60 requests/hour per IP (Upstash)."
  - "Server URL is illustrative; /api/plan is served from Vercel edge/serverless (client code typically calls relative path)."

**LOC Target**: ~3 lines

**Constitution Check**:
- ✅ Upstash 60/hr noted
- ✅ Server URL clarity provided

**Verification**:
```bash
yq '.paths."/api/plan".post.description' api/openapi.yaml | grep -i "upstash"
# Should match rate limit note
```

---

## T010: Add Idempotency-Key Parameter

**Path**: `api/openapi.yaml` → `paths./api/plan.post.parameters`

**Objective**: Document Idempotency-Key request header with 60s TTL semantic.

**Acceptance Criteria**:
- `parameters` array added under `paths./api/plan.post`
- Parameter object:
  - `name`: "Idempotency-Key"
  - `in`: "header"
  - `required`: false
  - `schema`: `{ type: string }`
  - `description`: "Optional idempotency key with 60-second TTL. Repeated requests with same key+body return cached response."

**LOC Target**: ~6 lines

**Constitution Check**:
- ✅ Idempotency-Key documented with 60s TTL

**Verification**:
```bash
yq '.paths."/api/plan".post.parameters[0].name' api/openapi.yaml
# Should return: Idempotency-Key
```

---

## T011: Add Request Body with Example

**Path**: `api/openapi.yaml` → `paths./api/plan.post.requestBody`

**Objective**: Define request body with PlanRequest schema and synthetic example (3-5 items).

**Acceptance Criteria**:
- `requestBody` section added under `paths./api/plan.post`
- `required`: true
- `content.application/json.schema`: `$ref: '#/components/schemas/PlanRequest'`
- `content.application/json.example`: Synthetic example with 3 items (Klarna, Affirm, Afterpay)
  - All fields populated (provider, due_date, amount, currency, autopay, late_fee, confidence)
  - timezone: "America/New_York"
  - dateLocale: "en-US"
  - **No PII** (synthetic data only)

**LOC Target**: ~20 lines (includes example)

**Constitution Check**:
- ✅ Privacy-first (synthetic data)
- ✅ Items-only (no paycheck/minBuffer)

**Verification**:
```bash
yq '.paths."/api/plan".post.requestBody.content."application/json".example.items | length' api/openapi.yaml
# Should return: 3
```

---

## T012: Add 200 Response with Headers

**Path**: `api/openapi.yaml` → `paths./api/plan.post.responses.200`

**Objective**: Define 200 success response with PlanResponse schema, complete example, and rate-limit headers.

**Acceptance Criteria**:
- `responses.200` section added
- `description`: "Payment plan generated successfully"
- `content.application/json.schema`: `$ref: '#/components/schemas/PlanResponse'`
- `content.application/json.example`: Complete synthetic example with:
  - normalized: 3 items (sorted by due_date, each with confidence)
  - riskFlags: 1 COLLISION risk with affectedInstallments: [{ index: 0 }, { index: 1 }]
  - movedDates: 1 WEEKEND shift
  - icsMetadata: { filename, calendarName, note }
- `headers`:
  - `X-RateLimit-Limit` (integer): "Usually present on success"
  - `X-RateLimit-Remaining` (integer): "Usually present on success"
  - `X-RateLimit-Reset` (integer): "Usually present on success (Unix epoch)"
  - `X-Idempotent-Replayed` (boolean): "true if cached response returned"

**LOC Target**: ~35 lines (includes example + headers)

**Constitution Check**:
- ✅ Per-item confidence in normalized array
- ✅ affectedInstallments uses { index } format
- ✅ X-RateLimit-* headers documented
- ✅ X-Idempotent-Replayed header documented

**Verification**:
```bash
yq '.paths."/api/plan".post.responses."200".content."application/json".example.normalized[0] | has("confidence")' api/openapi.yaml
# Should return: true
yq '.paths."/api/plan".post.responses."200".headers | keys' api/openapi.yaml
# Should include: X-Idempotent-Replayed, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

---

## T013: Add 400 Response

**Path**: `api/openapi.yaml` → `paths./api/plan.post.responses.400`

**Objective**: Define 400 validation error response with Problem schema and example.

**Acceptance Criteria**:
- `responses.400` section added
- `description`: "Validation error"
- `content.application/json.schema`: `$ref: '#/components/schemas/Problem'`
- `content.application/json.example`:
  - `type`: "/problems/validation-error"
  - `title`: "Validation Error"
  - `status`: 400
  - `detail`: "timezone is required"
  - `instance`: "/api/plan"

**LOC Target**: ~9 lines

**Constitution Check**:
- ✅ Error code 400 (validation)
- ✅ RFC9457 format

**Verification**:
```bash
yq '.paths."/api/plan".post.responses."400".content."application/json".example.status' api/openapi.yaml
# Should return: 400
```

---

## T014: Add 429 Response with Retry-After

**Path**: `api/openapi.yaml` → `paths./api/plan.post.responses.429`

**Objective**: Define 429 rate limit response with Retry-After header.

**Acceptance Criteria**:
- `responses.429` section added
- `description`: "Rate limit exceeded"
- `content.application/json.schema`: `$ref: '#/components/schemas/Problem'`
- `content.application/json.example`:
  - `type`: "/problems/rate-limit-exceeded"
  - `title`: "Rate Limit Exceeded"
  - `status`: 429
  - `detail`: "Too many requests from this IP. Retry after 3600 seconds."
  - `instance`: "/api/plan"
- `headers.Retry-After`:
  - `schema`: `{ type: integer }`
  - `description`: "Seconds until rate limit resets (delta-seconds per RFC 9110)"

**LOC Target**: ~12 lines

**Constitution Check**:
- ✅ Error code 429 (rate limit)
- ✅ Retry-After header documented

**Verification**:
```bash
yq '.paths."/api/plan".post.responses."429".headers."Retry-After"' api/openapi.yaml
# Should exist with schema.type: integer
```

---

## T015: Add 500 Response

**Path**: `api/openapi.yaml` → `paths./api/plan.post.responses.500`

**Objective**: Define 500 internal error response with Problem schema and example.

**Acceptance Criteria**:
- `responses.500` section added
- `description`: "Internal server error"
- `content.application/json.schema`: `$ref: '#/components/schemas/Problem'`
- `content.application/json.example`:
  - `type`: "/problems/internal-error"
  - `title`: "Internal Server Error"
  - `status`: 500
  - `detail`: "Unexpected error occurred"
  - `instance`: "/api/plan"

**LOC Target**: ~9 lines

**Constitution Check**:
- ✅ Error code 500 (internal error)
- ✅ RFC9457 format

**Verification**:
```bash
yq '.paths."/api/plan".post.responses."500".content."application/json".example.status' api/openapi.yaml
# Should return: 500
```

---

## T016: Consistency Pass

**Path**: `api/openapi.yaml` (entire file)

**Objective**: Verify schema references, field names, enums, and required arrays are consistent.

**Acceptance Criteria**:
- All `$ref` paths valid (e.g., `#/components/schemas/PlanItem`)
- Field naming: snake_case except `affectedInstallments` (camelCase)
- RiskFlag.type enum: exactly [COLLISION, WEEKEND_AUTOPAY]
- MovedDate.reason enum: exactly [WEEKEND, US_FEDERAL_HOLIDAY]
- PlanItem has 8 properties including `confidence`
- PlanResponse has 4 required fields (NO `confidence`)
- Problem schema has 5 required fields
- All examples use synthetic data (no PII)

**LOC Target**: No new lines (edit only)

**Constitution Check**:
- ✅ All Constitution constraints verified

**Verification**:
```bash
# Check all $ref paths resolve
yq '.. | select(has("$ref")) | ."$ref"' api/openapi.yaml | sort -u
# Should list only valid schema paths

# Check risk enum
yq '.components.schemas.RiskFlag.properties.type.enum | length' api/openapi.yaml
# Should return: 2

# Check PlanResponse fields
yq '.components.schemas.PlanResponse.properties | keys | length' api/openapi.yaml
# Should return: 4
```

---

## T017: Spectral Lint Validation

**Path**: `api/openapi.yaml`

**Objective**: Run Spectral lint and fix all errors (warnings allowed).

**Acceptance Criteria**:
- Run: `npx -y @stoplight/spectral-cli lint api/openapi.yaml`
- Exit code: 0 (zero errors)
- Warnings allowed (non-blocking)
- If errors found:
  - Fix missing descriptions
  - Fix invalid $ref paths
  - Fix schema validation errors
  - Re-run until zero errors

**LOC Target**: Variable (fix errors only)

**Constitution Check**:
- ✅ CI Spectral lint compliance

**Verification**:
```bash
npx -y @stoplight/spectral-cli lint api/openapi.yaml
# Should exit with code 0 and message: "No results with a severity of 'error' found!"
```

---

## T018: Create Delta Doc

**Path**: `ops/deltas/0022_openapi_v1_plan.md`

**Objective**: Document scope, verification, and rollback for this change.

**Acceptance Criteria**:
- File created at `ops/deltas/0022_openapi_v1_plan.md`
- Sections:
  - **Scope**: "Create OpenAPI 3.1 spec for POST /api/plan (docs-only, ≤180 LOC)"
  - **Files Changed**:
    - `api/openapi.yaml` (NEW)
    - `ops/deltas/0022_openapi_v1_plan.md` (NEW)
  - **Verification**:
    ```bash
    # Lint passes with zero errors
    npx -y @stoplight/spectral-cli lint api/openapi.yaml

    # LOC check (≤180)
    wc -l api/openapi.yaml
    ```
  - **Rollback**:
    ```bash
    git revert <commit-hash>
    git push origin main
    ```
  - **Constitution Check**: "✅ ≤2 files, ≤180 LOC, docs-only, reversible, COLLISION|WEEKEND_AUTOPAY risks, 400/429/500 errors, privacy-first"

**LOC Target**: ~25 lines

**Constitution Check**:
- ✅ Delta doc exists for reversibility tracking

**Verification**:
```bash
cat ops/deltas/0022_openapi_v1_plan.md
# Should contain all sections (Scope, Files Changed, Verification, Rollback)
```

---

## T019: LOC Gate Verification

**Path**: `api/openapi.yaml`

**Objective**: Verify total LOC ≤180 (target ≤120); refactor with $ref if needed.

**Acceptance Criteria**:
- Run: `wc -l api/openapi.yaml`
- LOC count ≤180 (hard limit)
- Target: ≤120 (ideal)
- If >180:
  - Extract repeated patterns to components/schemas
  - Use $ref for all schema references
  - Remove redundant descriptions
  - Simplify examples
  - Re-verify LOC

**LOC Target**: ≤180 (enforce)

**Constitution Check**:
- ✅ LOC budget met

**Verification**:
```bash
wc -l api/openapi.yaml
# Should return: ≤180 lines (ideally ≤120)

# If >180, check for refactor opportunities
grep -c '$ref' api/openapi.yaml
# Should show heavy use of $ref (schemas reused)
```

---

## Task Execution Order

Execute tasks **sequentially** (no parallelism; single file):

1. **T001**: Skeleton
2. **T002-T008**: Schemas (can batch edit, but verify incrementally)
3. **T009-T010**: Operation metadata
4. **T011**: Request body
5. **T012-T015**: Responses (200, 400, 429, 500)
6. **T016**: Consistency pass
7. **T017**: Spectral lint (iterate until 0 errors)
8. **T018**: Delta doc
9. **T019**: LOC gate

---

## Final Acceptance Checklist

After completing all tasks, verify:

- [ ] `api/openapi.yaml` exists and is valid YAML
- [ ] Spectral lint: `npx -y @stoplight/spectral-cli lint api/openapi.yaml` exits 0
- [ ] LOC: `wc -l api/openapi.yaml` shows ≤180 (ideally ≤120)
- [ ] PlanItem has `confidence` field (per-item)
- [ ] PlanResponse has NO top-level `confidence`
- [ ] RiskFlag enum: [COLLISION, WEEKEND_AUTOPAY] only
- [ ] RiskFlag has NO `severity` field
- [ ] Error codes: 400, 429, 500 only (no 405, 409)
- [ ] affectedInstallments: [{ index: integer }] format
- [ ] Idempotency-Key documented (60s TTL)
- [ ] 200 headers: X-RateLimit-*, X-Idempotent-Replayed
- [ ] 429 header: Retry-After
- [ ] Operation description: Upstash 60/hr + server URL note
- [ ] All examples: synthetic data (no PII)
- [ ] `ops/deltas/0022_openapi_v1_plan.md` exists with rollback instructions
- [ ] Constitution: ≤2 files, docs-only, reversible

---

## Notes

- **No runtime changes**: This is docs-only; API behavior unchanged
- **Single file**: All edits to `api/openapi.yaml` (no separate contracts/)
- **Incremental validation**: Run Spectral lint after major sections (T008, T015, T017)
- **LOC management**: Use $ref extensively; keep examples concise
- **Privacy**: All examples use synthetic data (Klarna, Affirm, Afterpay with fake amounts/dates)
- **Constitution**: Every task enforces constraints (risks, errors, confidence, headers)

---

**Ready for implementation**: Execute T001-T019 in order, verify acceptance criteria at each step.
