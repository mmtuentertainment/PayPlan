# PayPlan - BNPL Payment Manager

**Live Demo:** https://frontend-8m27q4sx2-matthew-utts-projects-89452c41.vercel.app

Manage multiple Buy Now Pay Later (BNPL) loans across providers with unified payment timeline, risk detection, and calendar export.

## 🚀 Quick Start (Public Demo)

1. Visit https://frontend-8m27q4sx2-matthew-utts-projects-89452c41.vercel.app
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
curl -X POST https://frontend-8m27q4sx2-matthew-utts-projects-89452c41.vercel.app/api/plan \
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

## 📦 Version

v0.1.0 - Initial Public Release

## 📄 License

ISC