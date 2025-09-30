# Data Model: BNPL Payment Manager

**Feature**: 001-bnpl-payment-manager
**Created**: 2025-09-30
**Version**: v0.1

---

## Core Entities

### Installment
Represents a single scheduled payment obligation to a BNPL provider.

**Fields:**
- `provider` (string, required): BNPL provider name (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- `installment_no` (number, required): Installment sequence number
- `due_date` (string, required): ISO 8601 date (yyyy-mm-dd)
- `amount` (number, required): Payment amount (decimal)
- `currency` (string, required): ISO 4217 currency code (USD, EUR, etc.)
- `autopay` (boolean, required): Whether autopay is enabled
- `late_fee` (number, required): Late fee amount for this installment

**Validation Rules:**
- amount > 0
- installment_no > 0
- due_date must be valid ISO 8601
- currency must be valid ISO 4217 code

**Example:**
```json
{
  "provider": "Klarna",
  "installment_no": 1,
  "due_date": "2025-10-02",
  "amount": 45.00,
  "currency": "USD",
  "autopay": true,
  "late_fee": 7.00
}
```

---

### PaydaySchedule
User-provided information about income timing for cash-crunch risk detection.

**Option A - Explicit Dates:**
- `paycheckDates` (string[], optional): Next 3+ paycheck dates in ISO yyyy-mm-dd format

**Option B - Cadence Pattern:**
- `payCadence` (enum, optional): 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
- `nextPayday` (string, required with payCadence): Next payday in ISO yyyy-mm-dd format

**Validation Rules:**
- Must provide EITHER paycheckDates OR (payCadence + nextPayday)
- If paycheckDates provided, must have at least 3 dates
- All dates must be future dates
- payCadence must be one of the allowed values
- Default cadence: biweekly if not specified

**Computed Fields:**
- `derivedPaydays` (string[]): Calculated 3-4 future paydays based on input

**Example A (Explicit):**
```json
{
  "paycheckDates": ["2025-10-05", "2025-10-19", "2025-11-02"]
}
```

**Example B (Cadence):**
```json
{
  "payCadence": "biweekly",
  "nextPayday": "2025-10-05"
}
```

---

### RiskFlag
Represents a detected financial risk scenario.

**Fields:**
- `type` (enum, required): 'COLLISION' | 'CASH_CRUNCH' | 'WEEKEND_AUTOPAY'
- `severity` (enum, required): 'high' | 'medium' | 'low'
- `date` (string, required): Affected date in ISO format
- `message` (string, required): Human-readable explanation
- `affectedInstallments` (Installment[], required): Installments involved in this risk
- `amount` (number, optional): Total amount involved

**Risk Types:**

#### COLLISION
- Triggered when: ≥2 installments share the same due_date
- Severity: medium (2 payments) | high (3+ payments)
- Message format: "{count} payments due on {date} ({day_of_week})"

#### CASH_CRUNCH
- Triggered when: sum(installments due within 3 days of a payday) > minBuffer
- Severity: medium (overage < $250) | high (overage ≥ $250)
- Message format: "{count} payments totaling ${amount} due near payday on {payday_date}"

#### WEEKEND_AUTOPAY
- Triggered when: autopay === true AND due_date falls on Saturday or Sunday
- Severity: low
- Message format: "Autopay payment due on {day_of_week} {date} - potential processing delay"

**Example:**
```json
{
  "type": "COLLISION",
  "severity": "high",
  "date": "2025-10-15",
  "message": "3 payments due on 2025-10-15 (Wednesday)",
  "affectedInstallments": [
    { "provider": "Klarna", "amount": 45.00 },
    { "provider": "Affirm", "amount": 58.00 },
    { "provider": "Afterpay", "amount": 32.50 }
  ],
  "amount": 135.50
}
```

---

### ActionItem
Represents a recommended action for the upcoming week.

**Fields:**
- `date` (string, required): Due date in ISO format
- `provider` (string, required): BNPL provider name
- `amount` (number, required): Payment amount
- `currency` (string, required): Currency code
- `priority` (number, required): Sort priority (1 = highest)
- `reason` (string, required): Why this action is prioritized
- `late_fee` (number, required): Late fee if missed

**Prioritization Rules:**
1. Sort by late_fee DESC (highest late fee first)
2. Then sort by amount ASC (smallest amount first to free cash)

**Example:**
```json
{
  "date": "2025-10-02",
  "provider": "Affirm",
  "amount": 58.00,
  "currency": "USD",
  "priority": 1,
  "reason": "Highest late fee ($15.00) - pay first to avoid penalty",
  "late_fee": 15.00
}
```

---

### WeeklySummary
Plain-English summary of the week's payment situation.

**Fields:**
- `totalDue` (number, required): Total amount due this week
- `installmentCount` (number, required): Number of payments due
- `riskCount` (number, required): Number of risk flags
- `bulletPoints` (string[], required): 6-8 plain-English summary points
- `recommendation` (string, required): Overall recommendation

**Bullet Point Guidelines:**
- Start with total and count
- Highlight highest risk
- Note any collisions
- Mention cash crunch if present
- Provide actionable guidance
- End with encouragement

**Example:**
```json
{
  "totalDue": 165.50,
  "installmentCount": 3,
  "riskCount": 2,
  "bulletPoints": [
    "You have 3 BNPL payments totaling $165.50 due this week",
    "⚠️ High Risk: 3 payments collide on Wednesday Oct 15",
    "💰 Cash crunch detected near your Oct 5 payday",
    "🔴 Priority: Pay Affirm ($58, $15 late fee) first",
    "🟡 Then pay Klarna ($45, $7 late fee)",
    "🟢 Finally pay Afterpay ($32.50, $8 late fee)",
    "Consider contacting Afterpay to defer if cash is tight",
    "You've got this! Stay on top of these 3 payments this week."
  ],
  "recommendation": "Focus on Wednesday's triple payment - consider deferring the lowest late fee payment if needed"
}
```

---

### CalendarEvent
Represents a payment reminder in ICS format.

**Fields:**
- `uid` (string, required): Unique event identifier
- `title` (string, required): Event title
- `start` (DateTime, required): Event start time (09:00 local time on due_date)
- `duration` (object, required): Event duration (30 minutes)
- `description` (string, required): Event description with payment details
- `alarms` (array, required): Reminder alarms
  - 1-day-prior at 09:00 local time

**ICS Properties:**
- `TZID`: User's selected IANA timezone
- `DTSTART`: 09:00 local time on due_date
- `VALARM`: -P1D (24 hours before)
- `TRIGGER`: At 09:00 on alarm day

**Example (ICS format):**
```
BEGIN:VEVENT
UID:klarna-1-2025-10-02@payplan.app
DTSTART;TZID=America/New_York:20251002T090000
DTEND;TZID=America/New_York:20251002T093000
SUMMARY:BNPL Payment: Klarna $45.00
DESCRIPTION:Payment due to Klarna\nAmount: $45.00\nInstallment: 1\nLate fee if missed: $7.00
BEGIN:VALARM
TRIGGER:-P1DT0H0M0S
ACTION:DISPLAY
DESCRIPTION:Reminder: Klarna payment of $45.00 due tomorrow
END:VALARM
END:VEVENT
```

---

## Request/Response Models

### PlanRequest
**Endpoint:** POST /plan

```json
{
  "items": [Installment],
  "paycheckDates": ["2025-10-05", "2025-10-19", "2025-11-02"],
  "minBuffer": 200.00,
  "timeZone": "America/New_York"
}
```

**OR**

```json
{
  "items": [Installment],
  "payCadence": "biweekly",
  "nextPayday": "2025-10-05",
  "minBuffer": 200.00,
  "timeZone": "America/New_York"
}
```

### PlanResponse
```json
{
  "summary": "You have 5 BNPL payments totaling $235.50 due this week...",
  "actionsThisWeek": [
    "Wednesday Oct 2: Pay Affirm $58.00 (highest late fee $15)",
    "Friday Oct 4: Pay Klarna $45.00 (late fee $7)",
    "Saturday Oct 5: Pay Afterpay $32.50 (weekend - verify autopay)",
    ...
  ],
  "riskFlags": [
    "⚠️ COLLISION: 2 payments due on Oct 2 (Wednesday)",
    "💰 CASH_CRUNCH: $135.50 due within 3 days of Oct 5 payday",
    "🔔 WEEKEND_AUTOPAY: Afterpay payment due Saturday (autopay enabled)"
  ],
  "ics": "QkVHSU46VkNBTEVOREFSCl...",  // Base64-encoded ICS file
  "normalized": [
    {"provider": "Affirm", "dueDate": "2025-10-02", "amount": 58.00},
    {"provider": "Klarna", "dueDate": "2025-10-02", "amount": 45.00},
    {"provider": "Afterpay", "dueDate": "2025-10-05", "amount": 32.50}
  ]
}
```

---

## Data Flow

```
1. Request Validation
   ├─> Validate items array schema
   ├─> Validate payday inputs
   ├─> Validate timezone
   └─> Validate minBuffer

2. Normalization
   ├─> Parse installments
   ├─> Sort by due_date
   └─> Deduplicate if needed

3. Payday Calculation
   ├─> If paycheckDates: use directly
   └─> If payCadence: derive next 3-4 paydays

4. Risk Detection
   ├─> COLLISION detection
   ├─> CASH_CRUNCH detection (payday proximity)
   └─> WEEKEND_AUTOPAY detection

5. Action Planning
   ├─> Filter next 7 days
   ├─> Sort by late_fee DESC, amount ASC
   └─> Generate action strings

6. Summary Generation
   ├─> Calculate totals
   ├─> Generate 6-8 bullet points
   └─> Create recommendation

7. ICS Generation
   ├─> Create VEVENT per installment
   ├─> Add TZID from timeZone
   ├─> Add VALARM 24h prior at 09:00
   └─> Base64 encode

8. Response Assembly
   └─> Return complete PlanResponse
```

---

## Validation Rules Summary

### Installment Validation
- All fields required
- amount > 0
- installment_no > 0
- Valid ISO 8601 date
- Valid ISO 4217 currency
- Valid provider name

### Request Validation
- items array: min 1, max 100
- Either paycheckDates OR (payCadence + nextPayday)
- paycheckDates: min 3 dates
- minBuffer >= 0
- timeZone: valid IANA identifier
- All dates must be ISO 8601 format

### Response Guarantees
- summary: 6-8 bullet points
- actionsThisWeek: ordered by priority
- riskFlags: ordered by severity then date
- ics: valid ICS format with TZID
- normalized: matches items count