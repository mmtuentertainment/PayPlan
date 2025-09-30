# Feature Specification: BNPL Payment Manager

**Feature Branch**: `001-bnpl-payment-manager`
**Created**: 2025-09-30
**Status**: Clarified - Ready for Planning
**Input**: User description: "Build PayPlan for consumers juggling multiple BNPL loans. Users paste BNPL emails/receipts or a simple CSV; the app normalizes installments across providers (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle), shows a single cross-provider timeline, detects risk (same-day collisions, paycheck-adjacent cash-crunch, weekend/autopay risk), and outputs a one-page 'This Week' pay order plus a unified .ics calendar. Scope v0.1: no logins, no bank/BNPL integrations, browser-only processing, one endpoint POST /plan returning {summary, actionsThisWeek, riskFlags, ics, normalized}. Success: a new user pastes ≥5 items and gets a clear weekly action list in <60 seconds. Non-goals: budgets, credit pulls, ads, or anything beyond export."

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A consumer juggling multiple Buy Now Pay Later (BNPL) loans across different providers receives payment reminders via email, text, or account dashboards. They need a unified view of all upcoming payments to avoid missed payments, overdrafts, or multiple charges hitting their account on the same day. The user collects their payment information (from emails, receipts, or exports), pastes it into PayPlan, and receives a consolidated weekly action plan showing when and how much to pay each provider, along with warnings about potential cash flow issues.

### Acceptance Scenarios

1. **Given** a user has 5+ BNPL payment obligations across 3+ providers, **When** they paste email text or CSV data containing payment details, **Then** the system normalizes all installments into a unified format showing provider, amount, due date, and remaining balance.

2. **Given** normalized payment data has been processed, **When** the system analyzes the payment timeline, **Then** it detects and flags risk scenarios including:
   - Same-day payment collisions (multiple payments due same day)
   - Paycheck-adjacent cash crunches (heavy payment load near typical payday)
   - Weekend/autopay risks (payments due on weekends or when autopay may execute)

3. **Given** payment data with detected risks, **When** the user requests their action plan, **Then** the system outputs a one-page "This Week" summary showing:
   - Prioritized payment order
   - Total amount due this week
   - Specific risk flags with explanations
   - Clear next actions

4. **Given** a completed analysis, **When** the user requests calendar export, **Then** the system generates a .ics file containing all payment due dates as calendar events.

5. **Given** a new user with minimal BNPL experience, **When** they paste their first set of payment data, **Then** they receive their weekly action list in under 60 seconds with clear, non-technical language.

### Edge Cases
- What happens when pasted data contains incomplete payment information (missing amounts or dates)?
- How does the system handle duplicate entries (same payment pasted twice)?
- What if a user pastes data from unsupported BNPL providers?
- How are past-due payments displayed versus upcoming payments?
- What happens with variable payment amounts (e.g., interest charges)?
- How does the system handle different date formats across provider emails?
- What if CSV structure doesn't match expected format?
- How are payments due "today" prioritized in the weekly view?

---

## Requirements

### Functional Requirements

**Input Processing**
- **FR-001**: System MUST accept payment data via CSV file upload as the primary input method
- **FR-001a**: System MUST support CSV format with required headers (lowercase): `provider`, `installment_no`, `due_date` (yyyy-mm-dd), `amount`, `currency` (ISO 4217), `autopay` (true|false), `late_fee` (number representing per-loan late fee policy)
- **FR-001b**: System MAY support pasted email/receipt text as best-effort beta feature using regex patterns to detect provider, due date, and amount, then display an editable confirmation table for user validation
- **FR-001c**: System MUST provide downloadable CSV template for users who need to manually format their data
- **FR-002**: System MUST normalize payment data from at least 6 BNPL providers: Klarna, Affirm, Afterpay, PayPal Pay Later, Zip, and Sezzle
- **FR-003**: System MUST extract key payment attributes from CSV: provider name, installment number, due date, amount, currency, autopay status, and late fee policy
- **FR-004**: System MUST handle incomplete CSV data by flagging missing required fields and continuing with available information
- **FR-005**: System MUST detect and deduplicate identical payment entries based on provider, due date, and amount
- **FR-005a**: System MUST accept user-provided timezone selection via IANA timezone dropdown (default: runtime detected timezone)
- **FR-005b**: System MUST perform all date/time calculations using the user-selected timezone

**Timeline & Visualization**
- **FR-006**: System MUST display a unified cross-provider payment timeline showing all upcoming payments in chronological order
- **FR-007**: System MUST distinguish between upcoming payments, payments due today, and past-due payments
- **FR-008**: System MUST generate a "This Week" view showing payments due within the next 7 days

**Risk Detection**
- **FR-009**: System MUST detect same-day payment collisions when 2+ payments are due on the same date
- **FR-010**: System MUST flag paycheck-adjacent cash-crunch risks based on user-provided payday information
- **FR-010a**: System MUST accept EITHER (a) the next 3 paycheck dates in ISO yyyy-mm-dd format OR (b) a cadence selector (weekly|biweekly|semimonthly|monthly) plus next payday date
- **FR-010b**: System MUST default to biweekly cadence if user selects cadence option but leaves the cadence field blank
- **FR-010c**: System MUST NOT integrate with bank accounts or attempt to detect payday automatically
- **FR-011**: System MUST identify weekend/autopay risks when payments fall on Saturday or Sunday
- **FR-012**: System MUST provide human-readable explanations for each risk flag

**Output Generation**
- **FR-013**: System MUST generate a one-page "This Week" summary containing:
  - Recommended payment order
  - Total amount due this week
  - Active risk flags with explanations
  - Clear action items
- **FR-014**: System MUST export a .ics calendar file containing all payment due dates as calendar events
- **FR-014a**: System MUST use TZID in .ics file matching the user-selected timezone
- **FR-014b**: System MUST add a 1-day-prior VALARM reminder at 09:00 local time for each payment event
- **FR-015**: System MUST return a JSON response containing: summary, actionsThisWeek, riskFlags, ics file content, and normalized payment data
- **FR-016**: System MUST process all inputs and generate complete output in under 60 seconds for datasets containing up to 50 payment entries

**Data Handling & Privacy**
- **FR-017**: System MUST implement POST /plan endpoint as a serverless function (Node/Express or Vercel/Cloudflare Worker) with in-memory processing only
- **FR-017a**: System MUST NOT persist any payment data to disk, database, or external storage
- **FR-017b**: System MUST process requests in-memory and discard all data after response is returned
- **FR-018**: System MUST NOT require user authentication, login, or account creation
- **FR-019**: System MUST NOT integrate with bank accounts or BNPL provider APIs
- **FR-020**: System MUST NOT retain user data after request processing completes

### Key Entities

- **Payment Installment**: Represents a single scheduled payment obligation to a BNPL provider. Key attributes include:
  - Provider name (Klarna, Affirm, etc.)
  - Due date
  - Payment amount
  - Loan/order identifier
  - Remaining balance on the loan
  - Payment status (upcoming, due today, past due)

- **Risk Flag**: Represents a detected financial risk scenario. Attributes include:
  - Risk type (collision, cash-crunch, weekend/autopay)
  - Severity level
  - Affected payment dates
  - Human-readable explanation
  - Mitigation suggestion

- **Weekly Action Plan**: Consolidated output showing payment obligations for the upcoming week. Contains:
  - Time period (specific date range)
  - Prioritized list of payments with dates and amounts
  - Total amount due
  - Associated risk flags
  - Recommended actions

- **Calendar Event**: Exportable payment reminder. Attributes include:
  - Event title (provider and amount)
  - Due date/time
  - Description with payment details
  - Calendar format (.ics)

- **Payday Schedule**: User-provided information about income timing for cash-crunch risk detection. Contains either:
  - Explicit: Next 3 paycheck dates in ISO yyyy-mm-dd format
  - Pattern-based: Cadence (weekly, biweekly, semimonthly, monthly) plus next payday date
  - Default cadence: biweekly

---

## Clarifications Resolved

### Session 1: 2025-09-30

**Q1: Payday Detection** [FR-010] - How should the system determine the user's payday schedule for cash-crunch risk detection?

**A1:** User-provided input. System requires EITHER (a) the next 3 paycheck dates in ISO yyyy-mm-dd format OR (b) a cadence selector (weekly|biweekly|semimonthly|monthly) plus next payday date. Default cadence is biweekly if user selects cadence option but leaves field blank. No bank integration or automatic detection.
→ **Integrated into:** FR-010, FR-010a, FR-010b, FR-010c

**Q2: API Endpoint Execution** [FR-017] - Is POST /plan server-side or browser-local?

**A2:** v0.1 uses a serverless endpoint (Node/Express or Vercel/Cloudflare Worker) to centralize logic and testing. No persistence, no authentication, in-memory processing only. Data is discarded after response. v0.2 may add browser-only option.
→ **Integrated into:** FR-017, FR-017a, FR-017b

**Q3: CSV Format** - What CSV structure should the system expect?

**A3:** One row per installment. Required headers (lowercase): `provider`, `installment_no`, `due_date` (yyyy-mm-dd), `amount`, `currency` (ISO 4217), `autopay` (true|false), `late_fee` (number; per-loan policy).
Example:
```csv
provider,installment_no,due_date,amount,currency,autopay,late_fee
Klarna,1,2025-10-02,45.00,USD,true,7
Afterpay,2,2025-10-09,32.50,USD,true,8
Affirm,3,2025-10-15,58.00,USD,true,0
```
→ **Integrated into:** FR-001a, FR-001c

**Q4: Provider Email Parsing** - How to parse varying provider email formats?

**A4:** v0.1 prioritizes CSV as deterministic primary input. Email/receipt pasting is best-effort beta feature using simple regex patterns for Pay-in-4 (14-day cadence) and monthly terms. Extracted data is shown in an editable table for user confirmation. If extraction is uncertain, user must use CSV template.
→ **Integrated into:** FR-001b

**Q5: Time Zone Handling** - How to handle time zones for due dates?

**A5:** User selects IANA timezone from dropdown (default: runtime detected timezone). All calculations use selected timezone. .ics file uses TZID and includes 1-day-prior VALARM at 09:00 local time.
→ **Integrated into:** FR-005a, FR-005b, FR-014a, FR-014b

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all 5 clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (60 seconds, 5+ items, weekly action list)
- [x] Scope is clearly bounded (v0.1 non-goals specified)
- [x] Dependencies and assumptions identified and documented

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Clarifications obtained and integrated
- [x] Review checklist passed

**Status**: ✅ READY FOR PLANNING PHASE

---

## Success Criteria

**Primary Success Metric**: A new user with 5+ BNPL payment obligations receives a clear, actionable weekly payment plan within 60 seconds of pasting their data.

**Additional Success Indicators**:
- User can identify high-risk payment dates at a glance
- User understands what action to take this week
- User can import all payments into their calendar
- No payment data is persisted after request completes (in-memory processing only)
- System handles all 6 supported BNPL providers accurately
- CSV input works deterministically with provided template format

**Out of Scope for v0.1**:
- Budget tracking or financial planning tools
- Credit score checks or credit reporting
- Advertisements or monetization features
- Direct integration with banks or BNPL APIs
- User accounts, profiles, or data persistence
- Payment execution or autopay setup
- Multi-device synchronization
- Mobile native applications