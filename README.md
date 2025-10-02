# PayPlan - BNPL Payment Manager

**Live Demo:** https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app

Manage multiple Buy Now Pay Later (BNPL) loans across providers with unified payment timeline, risk detection, and calendar export.

## 🚀 Quick Start (Public Demo)

1. Visit https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app
2. Click "Use Sample CSV" to load example data
3. Adjust timezone and payday settings
4. Click "Build Plan"
5. Download your .ics calendar file
6. Import to Google Calendar or Apple Calendar

**Complete flow: <60 seconds**

## ✨ Features

- **CSV Input**: Paste or upload payment data
- **Multi-Provider Support**: Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle
- **Risk Detection**:
  - ⚠️ COLLISION: Multiple payments same day
  - 💰 CASH_CRUNCH: Heavy load near payday
  - 🔔 WEEKEND_AUTOPAY: Weekend autopay delays
- **Smart Prioritization**: Highest late fees first, smallest amounts to free cash
- **Calendar Export**: .ics file with 24-hour reminders
- **Privacy-First**: No data storage, in-memory processing only

## 📋 CSV Format

Required headers (lowercase):
```csv
provider,installment_no,due_date,amount,currency,autopay,late_fee
Klarna,1,2025-10-02,45.00,USD,true,7
Afterpay,2,2025-10-09,32.50,USD,true,8
```

## 🔌 API Endpoint

**POST** `/api/plan`

```bash
curl -X POST https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "paycheckDates": ["2025-10-05", "2025-10-19", "2025-11-02"],
    "minBuffer": 100,
    "timeZone": "America/New_York"
  }'
```

**Response:**
```json
{
  "summary": "You have 3 BNPL payments totaling $165.50 due this week...",
  "actionsThisWeek": ["Wednesday Oct 2: Pay Affirm $58.00..."],
  "riskFlags": ["⚠️ COLLISION: 2 payments due on Oct 2"],
  "ics": "QkVHSU46VkNBTEVOREFS...",
  "normalized": [{"provider": "Klarna", "dueDate": "2025-10-02", "amount": 45.00}]
}
```

## 🔐 Privacy

- ✅ No data storage
- ✅ In-memory processing only
- ✅ No cookies or tracking
- ✅ No authentication required
- ✅ Data discarded after response

## 📚 Documentation

- **API Docs**: Coming soon at `/docs`
- **Feature Spec**: [specs/bnpl-manager/feature-spec.md](specs/bnpl-manager/feature-spec.md)
- **Data Model**: [specs/bnpl-manager/data-model.md](specs/bnpl-manager/data-model.md)
- **OpenAPI Contract**: [specs/bnpl-manager/contracts/post-plan.yaml](specs/bnpl-manager/contracts/post-plan.yaml)

## 🛠️ Local Development

```bash
# Install dependencies
npm install
cd frontend && npm install

# Run API locally
cd /home/matt/PROJECTS/PayPlan
vercel dev

# Run frontend locally
cd frontend
npm run dev
# Visit http://localhost:5173
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Test results:
# ✓ 42 tests passing
# - Payday calculator: 14 tests
# - Risk detector: 15 tests
# - Integration: 13 tests
```

## 🏗️ Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- shadcn/ui (Radix primitives)
- Zod validation
- PapaParse (CSV parsing)

**Backend:**
- Vercel Serverless Functions (Node 20)
- Luxon (timezone handling)
- ICS generation

## 🛡️ API Hardening (v0.1.1)

### RFC 9457 Problem Details

All error responses use [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) format:

```json
{
  "type": "https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "items array is required and must contain at least 1 installment",
  "instance": "/api/plan"
}
```

**Problem Types:** [/problems/validation-error](/problems/validation-error), [/problems/method-not-allowed](/problems/method-not-allowed), [/problems/rate-limit-exceeded](/problems/rate-limit-exceeded), [/problems/idempotency-key-conflict](/problems/idempotency-key-conflict), [/problems/internal-error](/problems/internal-error)

### Rate Limiting

- **Limit:** 60 requests per hour per IP (sliding window)
- **Headers** (on all responses):
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 45`
  - `X-RateLimit-Reset: 1759255504` (Unix timestamp)
- **On exceed:** 429 with `Retry-After: <seconds>` header

### Idempotency

Use `Idempotency-Key` header for safe retries (60-second cache):

```bash
curl -X POST https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app/api/plan \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d @data.json
```

**Behavior:**
- Same key + same body within 60s → Cached response (200) with `X-Idempotent-Replayed: true`
- Same key + different body → 409 conflict
- No key → Process normally

## 🗓️ Business-Day Awareness (v0.1.2)

PayPlan automatically shifts weekend and holiday payment dates to the next business day, eliminating false WEEKEND_AUTOPAY warnings and preventing payment processing delays.

### Features

- **Automatic Shifting**: Payments due on weekends/holidays moved to next business day
- **US Federal Holidays**: Built-in 2025-2026 holiday calendar (New Year's, MLK Day, Presidents Day, Memorial Day, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas)
- **Custom Skip Dates**: Add company closures or personal unavailable dates
- **Shift Tracking**: View original vs. shifted dates in results table with "Shifted" badges
- **Default ON**: businessDayMode=true, weekends-only mode available

### UI Controls

Toggle business-day mode in the frontend UI:

1. **Business Day Mode**: Enable/disable automatic shifting (default: ON)
2. **Holiday Calendar**: Choose "US" (Federal holidays) or "None" (weekends only)
3. **Custom Skip Dates**: Add comma-separated dates in YYYY-MM-DD format (e.g., `2025-12-24, 2025-12-26`)

### API Request

```bash
curl -X POST https://payplan-94kdjppuq-matthew-utts-projects-89452c41.vercel.app/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "paycheckDates": ["2025-10-05", "2025-10-19"],
    "minBuffer": 100,
    "timeZone": "America/New_York",
    "businessDayMode": true,
    "country": "US",
    "customSkipDates": ["2025-12-24", "2025-12-26"]
  }'
```

### API Response (v0.1.2)

```json
{
  "summary": "You have 3 BNPL payments...",
  "actionsThisWeek": ["Monday Oct 6: Pay Affirm $58.00 (shifted from Sat Oct 4)"],
  "riskFlags": ["ℹ️ Payment shifted from 2025-10-04 (weekend) to 2025-10-06 (Monday)"],
  "ics": "QkVHSU46VkNBTEVOREFS...",
  "normalized": [{
    "provider": "Klarna",
    "dueDate": "2025-10-06",
    "amount": 45.00,
    "wasShifted": true,
    "originalDueDate": "2025-10-04",
    "shiftedDueDate": "2025-10-06",
    "shiftReason": "WEEKEND"
  }],
  "movedDates": [{
    "provider": "Klarna",
    "installment_no": 1,
    "originalDueDate": "2025-10-04",
    "shiftedDueDate": "2025-10-06",
    "reason": "WEEKEND"
  }]
}
```

## 📦 Versions

- **v0.1.2** (Current) - Business-Day Awareness: Weekend/holiday shifting
- **v0.1.1** - API Hardening: RFC 9457, rate limiting, idempotency
- **v0.1.0** - Initial Public Release

## 📄 License

ISC