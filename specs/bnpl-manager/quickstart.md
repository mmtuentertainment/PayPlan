# QuickStart: BNPL Payment Manager v0.1

**Feature**: 001-bnpl-payment-manager
**Version**: v0.1.0
**Status**: Production Ready

---

## Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start server
npm start
# or for development with auto-reload:
npm run dev
```

---

## API Usage

### Endpoint
```
POST /plan
```

### Request Format

**Option A: Explicit Payday Dates**
```json
{
  "items": [
    {
      "provider": "Klarna",
      "installment_no": 1,
      "due_date": "2025-10-02",
      "amount": 45.00,
      "currency": "USD",
      "autopay": true,
      "late_fee": 7.00
    }
  ],
  "paycheckDates": ["2025-10-05", "2025-10-19", "2025-11-02"],
  "minBuffer": 200.00,
  "timeZone": "America/New_York"
}
```

**Option B: Payday Cadence**
```json
{
  "items": [ /* same as above */ ],
  "payCadence": "biweekly",
  "nextPayday": "2025-10-05",
  "minBuffer": 200.00,
  "timeZone": "America/New_York"
}
```

### Response Format

```json
{
  "summary": "You have 3 BNPL payments totaling $165.50 due this week...",
  "actionsThisWeek": [
    "Wednesday Oct 2: Pay Affirm $58.00 (highest late fee $15)",
    "Wednesday Oct 2: Pay Klarna $45.00 (late fee $7)",
    "Saturday Oct 5: Pay Afterpay $32.50 - verify autopay processes on weekends"
  ],
  "riskFlags": [
    "⚠️ COLLISION: 2 payments due on Oct 2 (Wednesday)",
    "💰 CASH_CRUNCH: 3 payments totaling $250.00 due near payday on 2025-10-05",
    "🔔 WEEKEND_AUTOPAY: Afterpay payment due on Saturday 2025-10-05 - potential processing delay"
  ],
  "ics": "QkVHSU46VkNBTEVOREFSClZFUlNJT046Mi4wCi4uLg==",
  "normalized": [
    {"provider": "Affirm", "dueDate": "2025-10-02", "amount": 58.00},
    {"provider": "Klarna", "dueDate": "2025-10-02", "amount": 45.00},
    {"provider": "Afterpay", "dueDate": "2025-10-05", "amount": 32.50}
  ]
}
```

---

## Quick Test with curl

```bash
# Start server
npm start

# In another terminal, send a test request
curl -X POST http://localhost:3000/plan \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/mixed-providers-with-risks.json
```

---

## Risk Types Explained

### 🔴 COLLISION (Medium/High)
**What:** Multiple payments due on the same date
**Detection:** ≥2 installments share the same `due_date`
**Severity:** Medium (2 payments) | High (3+ payments)
**Example:** "⚠️ COLLISION: 2 payments due on Oct 2 (Wednesday)"

### 💰 CASH_CRUNCH (Medium/High)
**What:** Heavy payment load near payday
**Detection:** Sum of payments within 3 days of payday exceeds `minBuffer`
**Severity:** Medium (overage < $250) | High (overage ≥ $250)
**Example:** "💰 CASH_CRUNCH: 3 payments totaling $250.00 due near payday on 2025-10-05"

### 🔔 WEEKEND_AUTOPAY (Low)
**What:** Autopay payment due on weekend
**Detection:** `autopay === true` AND `due_date` is Saturday/Sunday
**Severity:** Low
**Example:** "🔔 WEEKEND_AUTOPAY: Afterpay payment due on Saturday - potential processing delay"

---

## Prioritization Logic

Actions are prioritized using this algorithm:
1. **Sort by `late_fee` DESC** - Highest late fee first
2. **Then sort by `amount` ASC** - Smallest amount first (to free cash)

**Example:**
- Affirm: $58, late fee $15 → Priority 1 (highest late fee)
- Klarna: $45, late fee $7 → Priority 2 (second highest late fee)
- Afterpay: $32.50, late fee $8 → Priority 3 (higher late fee than Klarna, but comes after due to smaller late fee than Affirm)

---

## Calendar Export (.ics)

The `ics` field contains a Base64-encoded ICS file. To save it:

```javascript
// Decode and save
const fs = require('fs');
const icsBase64 = response.ics;
const icsContent = Buffer.from(icsBase64, 'base64').toString('utf-8');
fs.writeFileSync('payments.ics', icsContent);
```

**Calendar Properties:**
- Event time: 09:00 local time on due date
- Duration: 30 minutes
- Reminder: 24 hours before at 09:00
- Timezone: User's specified IANA timezone

---

## Supported BNPL Providers

- Klarna
- Affirm
- Afterpay
- PayPal (Pay in 4)
- Zip
- Sezzle

---

## Payday Cadence Options

| Cadence | Description | Example |
|---------|-------------|---------|
| `weekly` | Every 7 days | Every Friday |
| `biweekly` | Every 14 days | Every other Friday |
| `semimonthly` | Twice per month | 1st and 15th |
| `monthly` | Once per month | Same day each month |

**Default:** If `payCadence` not specified with `nextPayday`, defaults to `biweekly`

---

## Common Timezones

| Region | IANA Timezone |
|--------|---------------|
| Eastern US | `America/New_York` |
| Central US | `America/Chicago` |
| Mountain US | `America/Denver` |
| Pacific US | `America/Los_Angeles` |
| UK | `Europe/London` |
| Central Europe | `Europe/Paris` |
| India | `Asia/Kolkata` |
| Japan | `Asia/Tokyo` |
| Australia (Sydney) | `Australia/Sydney` |

Full list: [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

## Validation Rules

### Request Validation
- `items`: Required, 1-100 installments
- `paycheckDates` OR `nextPayday`: One required
- `paycheckDates`: Min 3 dates if provided
- `minBuffer`: Required, >= 0
- `timeZone`: Required, valid IANA identifier

### Installment Validation
- `provider`: Required string
- `installment_no`: Required, >= 1
- `due_date`: Required, ISO 8601 (yyyy-mm-dd)
- `amount`: Required, > 0
- `currency`: Required, ISO 4217 code
- `autopay`: Required boolean
- `late_fee`: Required, >= 0

---

## Performance

**Target:** Process 50 installments in <5 seconds
**Actual:** ~730ms for 50 installments (measured in tests)

---

## Error Handling

### 400 Validation Error
```json
{
  "error": "Validation Error",
  "message": "items array is required and must contain at least 1 installment"
}
```

### 500 Processing Error
```json
{
  "error": "Processing Error",
  "message": "Failed to generate payment plan",
  "details": "Invalid date format in installment 3"
}
```

---

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/payday-calculator.test.js
npm test -- tests/unit/risk-detector.test.js
npm test -- tests/integration/plan-endpoint.test.js

# Run with coverage
npm test -- --coverage
```

**Test Coverage:**
- Unit tests: Payday calculator, Risk detector
- Integration tests: Full POST /plan workflow
- Fixtures: Klarna Pay-in-4, Mixed providers with risks
- Total: 42 tests

---

## Architecture Overview

```
POST /plan Request
    ↓
Validation Middleware (validate-plan-request.js)
    ↓
Plan Route Handler (routes/plan.js)
    ↓
┌─────────────────────────────────────────┐
│ 1. Normalize & Sort Installments       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Calculate Paydays                    │
│    (lib/payday-calculator.js)           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Detect Risks                         │
│    (lib/risk-detector.js)               │
│    - COLLISION                          │
│    - CASH_CRUNCH                        │
│    - WEEKEND_AUTOPAY                    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Generate Weekly Actions              │
│    (lib/action-prioritizer.js)          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. Generate Summary                     │
│    (lib/action-prioritizer.js)          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 6. Generate ICS Calendar                │
│    (lib/ics-generator.js)               │
└─────────────────────────────────────────┘
    ↓
JSON Response
```

---

## Production Deployment

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production          # Environment
```

### Serverless Deployment

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Cloudflare Workers:**
```bash
# Install Wrangler
npm i -g wrangler

# Configure wrangler.toml
# Deploy
wrangler publish
```

**Note:** Current implementation uses Express. For true serverless, consider adapting to:
- Vercel Serverless Functions
- Cloudflare Workers (with Hono.js or similar)
- AWS Lambda (with API Gateway)

---

## Security Notes

✅ **Implemented:**
- Input validation on all fields
- No data persistence (in-memory only)
- No authentication (stateless)
- No external API calls
- Timezone-safe date handling

⚠️ **Not Implemented (v0.1):**
- Rate limiting
- Request logging
- CORS configuration
- Authentication/Authorization

**For Production:** Add rate limiting, logging, and CORS as needed.

---

## What's Next (v0.2 Roadmap)

1. CSV import endpoint (deterministic parsing)
2. Email/receipt parsing (best-effort beta)
3. Browser-only processing option (no server)
4. Multi-currency support
5. Custom risk threshold configuration
6. PDF export of weekly action plan
7. SMS/email reminder integration

---

## Support

- **Documentation:** See `/specs/bnpl-manager/`
- **Tests:** See `/tests/`
- **Issues:** Report via GitHub issues
- **API Contract:** See `/specs/bnpl-manager/contracts/post-plan.yaml`