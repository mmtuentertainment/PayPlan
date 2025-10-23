# QuickStart: OpenAPI v1 for POST /api/plan

**Date**: 2025-10-08
**Audience**: Client developers, QA engineers, API consumers

## Overview

This guide walks through validating the OpenAPI specification, testing the POST /api/plan endpoint with synthetic data, and rolling back if needed.

---

## Prerequisites

- Node.js 18+ (for Spectral CLI)
- curl (for API testing)
- git (for rollback)

---

## Step 1: Validate the OpenAPI Spec

Run Spectral linting to verify zero errors.

```bash
# Install Spectral CLI (or use npx)
npx -y @stoplight/spectral-cli lint api/openapi.yaml
```

**Expected Output**:
```
No results with a severity of 'error' found!
```

Warnings are allowed (non-blocking CI). If you see errors, fix them before proceeding.

---

## Step 2: Verify LOC Budget

Check that the OpenAPI spec is ≤180 lines (target ≤120).

```bash
wc -l api/openapi.yaml
```

**Expected Output**:
```
120 api/openapi.yaml
```

If LOC exceeds 180, refactor to reduce duplication (use `$ref` for schemas).

---

## Step 3: Test with Synthetic Data

Send a POST request with synthetic data (no PII).

### Request Example

```bash
curl -X POST https://api.example.com/api/plan \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-12345" \
  -d '{
  "items": [
    {
      "provider": "Klarna",
      "installment_no": 1,
      "due_date": "2025-10-15",
      "amount": 25.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 7.00,
      "confidence": 0.95
    },
    {
      "provider": "Affirm",
      "installment_no": 2,
      "due_date": "2025-10-15",
      "amount": 50.00,
      "currency": "USD",
      "autopay": false,
      "late_fee": 0.00,
      "confidence": 0.88
    },
    {
      "provider": "Afterpay",
      "installment_no": 1,
      "due_date": "2025-10-19",
      "amount": 30.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 0.00,
      "confidence": 0.92
    }
  ],
  "timezone": "America/New_York",
  "dateLocale": "en-US"
}'
```

### Expected 200 Response

```json
{
  "normalized": [
    {
      "provider": "Klarna",
      "installment_no": 1,
      "due_date": "2025-10-15",
      "amount": 25.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 7.00,
      "confidence": 0.95
    },
    {
      "provider": "Affirm",
      "installment_no": 2,
      "due_date": "2025-10-15",
      "amount": 50.00,
      "currency": "USD",
      "autopay": false,
      "late_fee": 0.00,
      "confidence": 0.88
    },
    {
      "provider": "Afterpay",
      "installment_no": 1,
      "due_date": "2025-10-19",
      "amount": 30.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 0.00,
      "confidence": 0.92
    }
  ],
  "riskFlags": [
    {
      "type": "COLLISION",
      "date": "2025-10-15",
      "message": "2 payments due on 2025-10-15 (Tuesday)",
      "affectedInstallments": [
        { "index": 0 },
        { "index": 1 }
      ]
    },
    {
      "type": "WEEKEND_AUTOPAY",
      "date": "2025-10-19",
      "message": "Autopay payment due on Saturday 2025-10-19 - potential processing delay",
      "affectedInstallments": [
        { "index": 2 }
      ]
    }
  ],
  "movedDates": [],
  "icsMetadata": {
    "filename": "payplan-2025-10-08.ics",
    "calendarName": "PayPlan Installments",
    "note": "1 collision risk, 1 weekend autopay warning"
  }
}
```

**Response Headers** (usually present on success):
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1696780800
X-Idempotent-Replayed: false
```

---

## Step 4: Test Error Scenarios

### 4a. Validation Error (400)

Send request with missing `timezone` field.

```bash
curl -X POST https://api.example.com/api/plan \
  -H "Content-Type: application/json" \
  -d '{
  "items": [
    {
      "provider": "Klarna",
      "due_date": "2025-10-15",
      "amount": 25.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 7.00,
      "confidence": 0.95
    }
  ]
}'
```

**Expected 400 Response**:
```json
{
  "type": "/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "timezone is required",
  "instance": "/api/plan"
}
```

### 4b. Rate Limit Error (429)

Exceed 60 requests/hour from same IP.

**Expected 429 Response**:
```json
{
  "type": "/problems/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests from this IP. Retry after 3600 seconds.",
  "instance": "/api/plan"
}
```

**Response Headers**:
```
Retry-After: 3600
```

---

## Step 5: Verify Idempotency

Send the same request twice with the same `Idempotency-Key` within 60 seconds.

```bash
# First request
curl -X POST https://api.example.com/api/plan \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-67890" \
  -d '{ ... }'

# Second request (within 60s)
curl -X POST https://api.example.com/api/plan \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-67890" \
  -d '{ ... }'
```

**Expected Behavior**:
- First request: Returns fresh response, `X-Idempotent-Replayed: false`
- Second request: Returns cached response, `X-Idempotent-Replayed: true`

---

## Step 6: Rollback (If Needed)

If the spec needs to be reverted, use `git revert` for single-commit rollback.

```bash
# Find the commit hash for the OpenAPI spec addition
git log --oneline api/openapi.yaml

# Revert the commit
git revert <commit-hash>

# Push the revert
git push origin main
```

**Verification**:
```bash
# Confirm api/openapi.yaml is removed
ls api/openapi.yaml
# Should return: No such file or directory
```

---

## Acceptance Checklist

Use this checklist to verify the OpenAPI spec meets all requirements:

- [ ] **Spectral Lint**: `npx -y @stoplight/spectral-cli lint api/openapi.yaml` exits with 0 errors
- [ ] **LOC Budget**: `wc -l api/openapi.yaml` shows ≤180 lines (target ≤120)
- [ ] **Request Schema**: PlanRequest includes items[], timezone, dateLocale? (no paycheck/minBuffer)
- [ ] **Response Schema**: PlanResponse includes normalized[] (with per-item confidence), riskFlags[], movedDates[], icsMetadata
- [ ] **Risk Types**: RiskFlag enum includes only COLLISION and WEEKEND_AUTOPAY (no CASH_CRUNCH)
- [ ] **Error Codes**: Problem schema documented for 400, 429, 500 (no 405, 409)
- [ ] **Headers**: X-RateLimit-* documented as "usually present on success"; Retry-After on 429
- [ ] **Idempotency**: Idempotency-Key documented as operation parameter with 60s TTL; X-Idempotent-Replayed on 200 response
- [ ] **Examples**: Synthetic data only (no PII), 3-5 items per example
- [ ] **affectedInstallments**: Uses `{ index: integer }` format
- [ ] **Rollback**: Single `git revert` removes spec cleanly

---

## Support

For questions or issues:
- Review [spec.md](spec.md) for requirements
- Review [data-model.md](data-model.md) for schema details
- Review [research.md](research.md) for design decisions
- Check PR template "OpenAPI is SoT" checklist

---

## Next Steps

After validation:
1. Create PR with `api/openapi.yaml` + `ops/deltas/0022_openapi_v1_plan.md`
2. Verify CI Spectral workflow passes (non-blocking)
3. Request review using PR template checklist
4. Merge to establish OpenAPI as source of truth baseline
