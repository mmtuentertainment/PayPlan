# Implementation Plan: BNPL Payment Manager

**Branch**: `001-bnpl-payment-manager` | **Date**: 2025-09-30 | **Spec**: [feature-spec.md](feature-spec.md)
**Input**: Feature specification from `/specs/bnpl-manager/feature-spec.md`

---

## Summary

Implement deterministic POST /plan endpoint for BNPL payment planning with timezone-aware risk detection and calendar export. Refactored existing codebase to implement structured input schema with 6-step deterministic algorithm.

---

## Technical Context

**Language/Version**: Node.js 18+ / JavaScript ES6+
**Primary Dependencies**: Express (4.18.2), Luxon (3.4.4), ICS (3.7.2)
**Storage**: N/A (stateless, in-memory only)
**Testing**: Jest (29.6.4), Supertest (6.3.3)
**Target Platform**: Serverless (Vercel/Cloudflare Worker compatible)
**Project Type**: Single project (API only)
**Performance Goals**: <5 seconds for 50 installments (achieved: <1s)
**Constraints**: No persistence, no external APIs, timezone-safe
**Scale/Scope**: Up to 100 installments per request

---

## Constitution Check

**Principles Applied:**
1. ✅ **Deterministic Processing**: Same input = same output (no external calls)
2. ✅ **Stateless**: No database, no sessions, no persistence
3. ✅ **Testable**: TDD mandatory, 100% coverage for risk logic
4. ✅ **Serverless-Ready**: No filesystem writes, in-memory only
5. ✅ **Performance**: <60 seconds for 50 installments (target: <5s)

**No violations** - Implementation follows serverless best practices.

---

## Project Structure

### Documentation (this feature)
```
specs/bnpl-manager/
├── plan.md              # This file (/plan command output)
├── feature-spec.md      # Feature specification with clarifications
├── data-model.md        # Data model and schemas
├── quickstart.md        # QuickStart guide
└── contracts/
    └── post-plan.yaml   # OpenAPI contract
```

### Source Code (repository root)
```
src/
├── lib/
│   ├── payday-calculator.js      # Calculate paydays from cadence
│   ├── risk-detector.js          # Detect 3 risk types
│   ├── action-prioritizer.js     # Generate actions & summary
│   └── ics-generator.js          # Generate ICS calendar
├── routes/
│   └── plan.js                   # POST /plan endpoint
└── middleware/
    └── validate-plan-request.js  # Input validation

tests/
├── unit/
│   ├── payday-calculator.test.js
│   └── risk-detector.test.js
├── integration/
│   └── plan-endpoint.test.js
└── fixtures/
    ├── klarna-pay-in-4.json
    └── mixed-providers-with-risks.json
```

---

## Phase 0: Research & Dependencies ✅

**Dependencies Added:**
- `luxon` (v3.4.4) - IANA timezone handling and date calculations
- `ics` (v3.7.2) - ICS calendar generation with TZID/VALARM
- `supertest` (v6.3.3) - Integration testing

**Research Completed:**
1. ✅ ICS generation with timezone support (TZID, VALARM 24h prior at 09:00)
2. ✅ Payday calculation patterns (weekly/biweekly/semimonthly/monthly cadences)
3. ✅ Serverless deployment patterns (Vercel/Cloudflare Worker compatibility)
4. ✅ Base64 encoding for ICS data

---

## Phase 1: Design & Contracts ✅

**Artifacts Generated:**

1. **Data Model** (`data-model.md`):
   - Input schema: Installment, PaydaySchedule
   - Risk types: COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY
   - Output models: ActionItem, WeeklySummary, CalendarEvent
   - Validation rules

2. **API Contract** (`contracts/post-plan.yaml`):
   - OpenAPI 3.0 specification
   - Request/response schemas
   - Error responses (400, 500)
   - Example requests/responses

3. **Test Strategy**:
   - Unit tests: Payday calculator (14 tests)
   - Unit tests: Risk detector (15 tests)
   - Integration tests: Full workflow (13 tests)
   - Fixtures: Klarna Pay-in-4, Mixed providers with risks

4. **QuickStart Guide** (`quickstart.md`):
   - Installation instructions
   - API usage examples
   - Risk type explanations
   - Deployment guide

---

## Phase 2: Implementation ✅

### Core Libraries

1. **payday-calculator.js** ✅
   - Calculate paydays from explicit dates OR cadence pattern
   - Support: weekly, biweekly, semimonthly, monthly
   - Handle edge cases (month-end dates, timezone)
   - Default to biweekly if not specified
   - **Tests**: 14 passing

2. **risk-detector.js** ✅
   - COLLISION: ≥2 installments same date
   - CASH_CRUNCH: Payments within 3 days of payday > minBuffer
   - WEEKEND_AUTOPAY: Autopay + Sat/Sun due date
   - Severity levels: high, medium, low
   - **Tests**: 15 passing

3. **action-prioritizer.js** ✅
   - Filter installments in next 7 days
   - Sort by: late_fee DESC, amount ASC
   - Generate plain-English action strings
   - Create 6-8 bullet summary
   - Format risk flags with emojis

4. **ics-generator.js** ✅
   - Generate ICS with TZID support
   - Event at 09:00 local time on due date
   - 24h-prior reminder (VALARM)
   - Base64 encode output

### API Layer

5. **validate-plan-request.js** ✅
   - Validate items array (1-100)
   - Validate payday information
   - Validate timezone (IANA)
   - Validate minBuffer >= 0
   - Return detailed error messages

6. **routes/plan.js** ✅
   - POST /plan handler
   - Execute 6-step algorithm:
     1. Normalize & sort
     2. Calculate paydays
     3. Detect risks
     4. Generate weekly actions
     5. Generate summary
     6. Generate ICS
   - Error handling
   - **Tests**: 13 integration tests passing

7. **index.js** ✅
   - Express server setup
   - Mount /plan router
   - Health check endpoint
   - Export for testing

---

## Phase 3: Testing ✅

**Test Results:**
```
PASS tests/integration/plan-endpoint.test.js (13 tests)
PASS tests/unit/payday-calculator.test.js (14 tests)
PASS tests/unit/risk-detector.test.js (15 tests)

Test Suites: 3 passed, 3 total
Tests:       42 passed, 42 total
Time:        0.731s
```

**Coverage:**
- Payday calculation: All cadences + edge cases
- Risk detection: All 3 types + severity levels
- Integration: Full workflow + validation + edge cases
- Performance: <1s for 50 installments ✅

---

## Phase 4: Documentation ✅

**Documentation Created:**

1. **feature-spec.md** - Complete feature specification with:
   - User scenarios and acceptance criteria
   - 30+ functional requirements
   - Clarifications resolved (5 sessions)
   - Success criteria

2. **data-model.md** - Data model with:
   - Core entities (Installment, RiskFlag, etc.)
   - Validation rules
   - Request/response models
   - Data flow diagram

3. **contracts/post-plan.yaml** - OpenAPI contract with:
   - Complete schema definitions
   - Example requests/responses
   - Error response formats

4. **quickstart.md** - Developer guide with:
   - Installation & usage
   - Risk type explanations
   - Prioritization logic
   - Calendar export details
   - Common timezones
   - Performance benchmarks
   - Production deployment

---

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete
- [x] Phase 1: Design complete
- [x] Phase 2: Implementation complete
- [x] Phase 3: Testing complete
- [x] Phase 4: Documentation complete

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] No complexity deviations

---

## Deliverables Summary

**Code:**
- 6 core modules (payday, risk, actions, ICS, validation, routes)
- 42 tests (100% passing)
- 2 test fixtures

**Documentation:**
- Feature specification
- Data model
- OpenAPI contract
- QuickStart guide

**Performance:**
- ✅ <1s for 50 installments (target: <5s)
- ✅ Deterministic algorithm
- ✅ Timezone-safe
- ✅ Serverless-ready

---

## Git Commit

```
Branch: 001-bnpl-payment-manager
Commit: 883bd61

Implement BNPL Payment Manager v0.1

42 files changed, 11,237 insertions(+)
```

---

## What's Next (Future Phases)

**v0.2 Roadmap:**
1. CSV import endpoint (deterministic parsing)
2. Email/receipt parsing (best-effort beta)
3. Browser-only processing option
4. Multi-currency support
5. Custom risk threshold configuration
6. PDF export of action plan
7. SMS/email reminder integration

---

**Status**: ✅ **COMPLETE - READY FOR PRODUCTION**

*Implementation completed on 2025-09-30*