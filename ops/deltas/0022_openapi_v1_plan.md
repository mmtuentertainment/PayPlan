# 0022: OpenAPI v1 for POST /api/plan

**Date:** 2025-10-08
**Branch:** `007-0022-openapi-v1-plan`
**Type:** Documentation-only (OpenAPI 3.1) — zero runtime changes

## Summary
Establishes `api/openapi.yaml` as the authoritative contract for **POST /api/plan**. Documents items-only request model, per-item confidence, risk flags (COLLISION | WEEKEND_AUTOPAY), business-day shifts, ICS metadata (no bytes), idempotency, and rate limiting. Aligns with our Constitution and CI Spectral lint.

## Scope (WHAT changed)
- **Added:** `api/openapi.yaml` (OpenAPI 3.1.0)
- **Added:** `.spectral.yaml` (extends `spectral:oas`)
- **No changes** to server code, handlers, or deployment.

## Contract Highlights
- **Request:** `PlanRequest` (items[], timezone, optional dateLocale)
- **Item:** `PlanItem` (provider, installment_no?, due_date, amount, currency, autopay?, late_fee?, **confidence 0..1**)
- **Response (200):** `PlanResponse` with `normalized[]`, `riskFlags[]`, `movedDates[]`, `icsMetadata`
- **Risks:** enum **[COLLISION, WEEKEND_AUTOPAY]** only
- **MovedDate:** weekend & US federal holidays
- **ICS:** metadata object (filename, calendarName, note) — **no binary**
- **Errors:** 400 / 429 / 500 (RFC 9457 `Problem`)
- **Headers:**
  - Request: `Idempotency-Key` (optional; **60s TTL**)
  - Response (200): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-Idempotent-Replayed`
  - Response (429): `Retry-After`
- **Examples:** privacy-safe (synthetic)
- **Rate limit note:** Upstash **60 req/hour per IP**
- **URIs:** Problem examples use **absolute** URIs per RFC 9457.

## Verification
```bash
# Spectral lint (errors must be 0; warnings allowed)
npx -y @stoplight/spectral-cli lint api/openapi.yaml

# Confirm 200/400/429/500 present
yq '.paths."/api/plan".post.responses | keys' api/openapi.yaml

# Confirm per-item confidence (no top-level)
yq '.components.schemas.PlanItem.properties | keys' api/openapi.yaml | grep confidence
! yq '.components.schemas.PlanResponse.properties | keys' api/openapi.yaml | grep -qx confidence

# Risk enum is exactly two values
yq '.components.schemas.RiskFlag.properties.type.enum' api/openapi.yaml | grep -E '\[COLLISION, WEEKEND_AUTOPAY\]'

# LOC budget for spec (≤180)
wc -l api/openapi.yaml
```

### Current Results (at merge time)

* **Spectral:** 0 errors, 3 warnings (info-contact / operationId / tags — accepted)
* **Spec LOC:** ~176 / 180
* **Files added:** `api/openapi.yaml`, `.spectral.yaml`

## Constitution Checklist

* ≤ **2 files** added for the feature ✅
* **Docs-only**, reversible by single revert ✅
* **Privacy-first** synthetic examples ✅
* **Risks constrained** to COLLISION | WEEKEND_AUTOPAY ✅
* **Errors:** 400/429/500 only ✅
* **Per-item confidence** (no top-level) ✅
* **Idempotency** semantics (60s TTL) ✅
* **ISO week / America/New_York** described where applicable ✅

## Rollback

To revert this delta (docs-only):

```bash
git revert <merge-commit-sha>
# or remove spec file if unmerged:
git rm -f api/openapi.yaml .spectral.yaml
git commit -m "revert: remove OpenAPI v1 spec (0022)"
```

## PR Reviewer Guide

* Verify Spectral **0 errors** output in CI summary
* Confirm request/response shapes match current behavior
* Check headers: `Idempotency-Key`, `X-RateLimit-*`, `X-Idempotent-Replayed`, `Retry-After`
* Ensure examples remain PII-free & absolute URIs in Problems

## Future Notes (non-blocking)

* Consider documenting **RateLimit-*** (standard) alongside `X-RateLimit-*` in a future version
* Optional: add `operationId`/`tags` to reduce Spectral warnings (kept out to hold LOC)
