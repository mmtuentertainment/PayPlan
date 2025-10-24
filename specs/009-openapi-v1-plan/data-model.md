# Data Model: OpenAPI v1 for POST /api/plan

**Date**: 2025-10-08
**Context**: Schema definitions for PayPlan API v1 (COLLISION | WEEKEND_AUTOPAY risks only)

## Schema Overview

This document defines 6 core schemas for the POST /api/plan endpoint:

1. **PlanItem**: Single installment entry with per-item confidence
2. **PlanRequest**: Input payload (items-only, no paycheck/minBuffer)
3. **RiskFlag**: Detected risk (COLLISION | WEEKEND_AUTOPAY)
4. **MovedDate**: Business-day shift metadata
5. **ICSMetadata**: Calendar export information
6. **PlanResponse**: Successful response payload
7. **Problem**: RFC9457 error response

---

## 1. PlanItem

Represents a single BNPL installment with confidence score.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | Yes | BNPL provider name (e.g., "Klarna", "Affirm", "Afterpay") |
| `installment_no` | integer | No | Installment number (e.g., 1, 2, 3) |
| `due_date` | string | Yes | ISO 8601 date (YYYY-MM-DD, e.g., "2025-10-15") |
| `amount` | number | Yes | Payment amount (e.g., 25.00) |
| `currency` | string | Yes | 3-letter currency code (e.g., "USD") |
| `autopay` | boolean | Yes | Whether autopay is enabled |
| `late_fee` | number | Yes | Late fee amount (e.g., 7.00) |
| `confidence` | number | Yes | Extraction confidence score (0.0-1.0, e.g., 0.95) |

### Example

```json
{
  "provider": "Klarna",
  "installment_no": 1,
  "due_date": "2025-10-15",
  "amount": 25.00,
  "currency": "USD",
  "autopay": true,
  "late_fee": 7.00,
  "confidence": 0.95
}
```

---

## 2. PlanRequest

Input payload for POST /api/plan (items-only, no paycheck/minBuffer in v1).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array[PlanItem] | Yes | Array of installments (3-5 items typical, tested up to 50) |
| `timezone` | string | Yes | IANA timezone (e.g., "America/New_York") |
| `dateLocale` | string | No | Locale for date formatting (e.g., "en-US") |

### Example

```json
{
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
      "due_date": "2025-10-22",
      "amount": 50.00,
      "currency": "USD",
      "autopay": false,
      "late_fee": 0.00,
      "confidence": 0.88
    }
  ],
  "timezone": "America/New_York",
  "dateLocale": "en-US"
}
```

---

## 3. RiskFlag

Detected payment risk (COLLISION | WEEKEND_AUTOPAY only; no severity field).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | Yes | Risk type: `COLLISION` or `WEEKEND_AUTOPAY` |
| `date` | string | Yes | ISO 8601 date when risk occurs (YYYY-MM-DD) |
| `message` | string | Yes | Human-readable description (e.g., "2 payments due on 2025-10-15 (Tuesday)") |
| `affectedInstallments` | array[object] | Yes | Array of `{ index: integer }` referencing normalized array |

### Type Enum

- `COLLISION`: Multiple payments due on same date
- `WEEKEND_AUTOPAY`: Autopay payment due on Saturday/Sunday

### Example

```json
{
  "type": "COLLISION",
  "date": "2025-10-15",
  "message": "2 payments due on 2025-10-15 (Tuesday)",
  "affectedInstallments": [
    { "index": 0 },
    { "index": 1 }
  ]
}
```

---

## 4. MovedDate

Business-day shift metadata (when due dates moved from weekend/holiday).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | Yes | Original due date (ISO 8601, YYYY-MM-DD) |
| `to` | string | Yes | Shifted due date (ISO 8601, YYYY-MM-DD) |
| `reason` | enum | Yes | Shift reason: `WEEKEND` or `US_FEDERAL_HOLIDAY` |

### Reason Enum

- `WEEKEND`: Shifted from Saturday/Sunday to next business day
- `US_FEDERAL_HOLIDAY`: Shifted from federal holiday to next business day

### Example

```json
{
  "from": "2025-10-18",
  "to": "2025-10-20",
  "reason": "WEEKEND"
}
```

---

## 5. ICSMetadata

Calendar export metadata (no ICS bytes in response).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | string | Yes | Suggested filename (e.g., "payplan-2025-10-08.ics") |
| `calendarName` | string | Yes | Calendar name (e.g., "PayPlan Installments") |
| `note` | string | Yes | Risk annotations summary (e.g., "Includes 2 collision risks") |

### Example

```json
{
  "filename": "payplan-2025-10-08.ics",
  "calendarName": "PayPlan Installments",
  "note": "Includes 2 collision risks; 1 weekend shift"
}
```

---

## 6. PlanResponse

Successful response payload (200 OK).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `normalized` | array[PlanItem] | Yes | Normalized installments (sorted by due_date, each with confidence) |
| `riskFlags` | array[RiskFlag] | Yes | Detected risks (COLLISION, WEEKEND_AUTOPAY) |
| `movedDates` | array[MovedDate] | Yes | Business-day shifts (empty if none) |
| `icsMetadata` | ICSMetadata | Yes | Calendar export information |

### Example

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
      "due_date": "2025-10-22",
      "amount": 50.00,
      "currency": "USD",
      "autopay": false,
      "late_fee": 0.00,
      "confidence": 0.88
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
    }
  ],
  "movedDates": [],
  "icsMetadata": {
    "filename": "payplan-2025-10-08.ics",
    "calendarName": "PayPlan Installments",
    "note": "1 collision risk detected"
  }
}
```

---

## 7. Problem

RFC9457 error response (400, 429, 500).

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string (URI) | Yes | Error category URI (e.g., "/problems/rate-limit-exceeded") |
| `title` | string | Yes | Short human-readable summary (e.g., "Rate Limit Exceeded") |
| `status` | integer | Yes | HTTP status code (e.g., 429) |
| `detail` | string | Yes | Detailed explanation (e.g., "Too many requests from this IP. Retry after 3600 seconds.") |
| `instance` | string (URI) | Yes | Request URI (e.g., "/api/plan") |

### Type URI Patterns

- `/problems/validation-error`: 400 (invalid input)
- `/problems/rate-limit-exceeded`: 429 (quota exhausted)
- `/problems/internal-error`: 500 (server failure)

### Example (429)

```json
{
  "type": "/problems/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Too many requests from this IP. Retry after 3600 seconds.",
  "instance": "/api/plan"
}
```

---

## Schema Relationships

```
PlanRequest
├── items: array[PlanItem]          (with confidence per item)
└── timezone: string (IANA)

PlanResponse
├── normalized: array[PlanItem]     (sorted, with confidence)
├── riskFlags: array[RiskFlag]      (COLLISION | WEEKEND_AUTOPAY)
│   └── affectedInstallments: array[{ index }]  (references normalized)
├── movedDates: array[MovedDate]    (business-day shifts)
└── icsMetadata: ICSMetadata        (no bytes)

Problem
└── (standalone error schema)
```

---

## Validation Rules

### PlanRequest
- `items`: Must contain at least 1 item
- `timezone`: Must be valid IANA timezone (e.g., "America/New_York")
- `dateLocale`: Optional, if provided must be valid locale (e.g., "en-US")

### PlanItem
- `due_date`: Must be ISO 8601 date (YYYY-MM-DD)
- `amount`: Must be positive number
- `currency`: Must be 3-letter code (e.g., "USD")
- `late_fee`: Must be non-negative
- `confidence`: Must be 0.0-1.0

### RiskFlag
- `type`: Must be `COLLISION` or `WEEKEND_AUTOPAY`
- `affectedInstallments[].index`: Must reference valid normalized array index

### MovedDate
- `reason`: Must be `WEEKEND` or `US_FEDERAL_HOLIDAY`
- `from` must be before `to`

---

## Next Steps

Use these schemas to generate OpenAPI 3.1 `components/schemas` section in tasks.md.
