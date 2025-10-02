# Feature Specification: Business-Day Awareness (v0.1.2)

**Feature Branch**: `004-business-day-awareness`
**Created**: 2025-09-30
**Status**: Draft
**Version**: v0.1.2 (minor release)

---

## Why This Feature

Reduce false WEEKEND_AUTOPAY flags and incorrect calendar dates by shifting weekend/holiday-due installments to the next business day, offline, without external integrations.

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A PayPlan user inputs payment data with some installments due on weekends or US Federal holidays. With Business-Day Mode enabled (default), the system automatically shifts these dates to the next business day, eliminating false weekend autopay warnings and ensuring calendar reminders align with when banks actually process payments. The user sees clear annotations showing which dates were shifted and why, helping them plan accurately without manual date adjustments.

### Acceptance Scenarios

1. **Given** an installment due on Saturday (2025-10-04), **When** Business-Day Mode is enabled (default), **Then**:
   - Due date shifts to Monday (2025-10-06)
   - ICS event created for Monday, not Saturday
   - WEEKEND_AUTOPAY risk NOT raised
   - SHIFTED_NEXT_BUSINESS_DAY informational flag added
   - movedDates[] includes record showing shift
   - normalized[] shows wasShifted: true, originalDueDate, shiftedDueDate

2. **Given** an installment due on Thanksgiving (US Federal holiday, Thursday 2025-11-27), **When** country="US" and Business-Day Mode enabled, **Then**:
   - Due date shifts to next business day (**Fri 2025-11-28**)
   - Shift reason: "HOLIDAY"
   - Calendar event created on **Fri 2025-11-28**
   - movedDates shows holiday shift

3. **Given** user provides customSkipDates: ["2025-10-15"] (company closure), **When** an installment is due on 2025-10-15, **Then**:
   - Date shifts to 2025-10-16 (next business day)
   - Shift reason: "CUSTOM"
   - movedDates includes this shift

4. **Given** installment due on Friday before a 3-day weekend (holiday Monday), **When** due date is Friday, **Then**:
   - Date NOT shifted (Friday is a business day)
   - No shift annotation

5. **Given** Business-Day Mode is disabled (businessDayMode: false), **When** processing installments, **Then**:
   - NO date shifting occurs
   - Original v0.1.1 behavior (WEEKEND_AUTOPAY flags as before)
   - movedDates[] is empty

6. **Given** country="None", **When** processing dates, **Then**:
   - Only weekends (Sat/Sun) are considered non-business days
   - US Federal holidays are treated as business days
   - Shifts occur only for weekend dates

### Edge Cases
- Multiple consecutive non-business days (Fri→Sat→Sun→Mon holiday)
- Year boundary (Dec 31 weekend + Jan 1 holiday)
- Leap year Feb 29
- Invalid customSkipDates format
- customSkipDates with past dates
- Timezone affects day-of-week (weekend in one TZ, weekday in another)
- All installments due on weekends (large shift count)

---

## Requirements

### Functional Requirements

**Input Extensions**

- **FR-050**: POST /api/plan MUST accept optional `businessDayMode` boolean field (default: true)
- **FR-051**: POST /api/plan MUST accept optional `country` enum field: "US" | "None" (default: "US")
- **FR-052**: POST /api/plan MUST accept optional `customSkipDates` array of YYYY-MM-DD strings
- **FR-053**: System MUST validate customSkipDates are valid ISO dates
- **FR-054**: System MUST remain backward compatible (requests without new fields use defaults)

**Business-Day Calculation**

- **FR-055**: System MUST treat Saturdays and Sundays as non-business days (all countries)
- **FR-056**: When country="US", system MUST treat US Federal holidays as non-business days
- **FR-057**: System MUST use an offline US Federal holiday table for current year and next year
- **FR-058**: customSkipDates MUST be combined (union) with weekend/holiday set
- **FR-059**: System MUST shift any due_date falling on non-business day to the **next** business day (forward-only)
- **FR-060**: System MUST handle multiple consecutive non-business days (keep advancing until business day found)
- **FR-061**: All business-day calculations MUST operate in the user's selected timezone

**Risk Detection Updates**

- **FR-062**: System MUST NOT raise WEEKEND_AUTOPAY flag when date is shifted to business day
- **FR-063**: System MUST add SHIFTED_NEXT_BUSINESS_DAY informational flag when shift occurs
- **FR-064**: System MUST include shift reason: "WEEKEND", "HOLIDAY", or "CUSTOM"
- **FR-065**: Existing risk rules (COLLISION, CASH_CRUNCH) MUST use shifted dates for calculations
- **FR-066**: If original date was weekend/holiday with autopay=true, add WEEKEND_OR_HOLIDAY_AUTOPAY informational flag

**ICS Calendar Export**

- **FR-067**: ICS events MUST use shifted due dates (not original dates)
- **FR-068**: Event titles MUST include "(shifted)" annotation when date was moved
- **FR-069**: Event descriptions MUST note original due date if shifted
- **FR-070**: 24-hour prior reminders MUST be relative to shifted date
- **FR-071**: TZID handling unchanged (uses user-selected timezone)

**Response Additions**

- **FR-072**: Response MUST include new `movedDates` array with:
  - provider (string)
  - installment_no (number)
  - originalDueDate (string, YYYY-MM-DD)
  - shiftedDueDate (string, YYYY-MM-DD)
  - reason ("WEEKEND" | "HOLIDAY" | "CUSTOM")
- **FR-073**: normalized[] items MUST include new optional fields:
  - originalDueDate (string, if shifted)
  - shiftedDueDate (string, if shifted)
  - wasShifted (boolean)
  - shiftReason ("WEEKEND" | "HOLIDAY" | "CUSTOM")
- **FR-074**: If businessDayMode=false, movedDates MUST be empty array

**Frontend UI**

- **FR-075**: InputCard MUST include "Business Day Mode" toggle (default: ON)
- **FR-076**: InputCard MUST include Country select (US | None)
- **FR-077**: InputCard MUST include optional "Custom skip dates" textarea (comma-separated YYYY-MM-DD)
- **FR-078**: ScheduleTable MUST show "Shifted" badge on rows where wasShifted=true
- **FR-079**: ScheduleTable MUST show tooltip with originalDueDate and shift reason
- **FR-080**: Risk flags MUST display SHIFTED_NEXT_BUSINESS_DAY as informational (blue/secondary badge)

**Performance & Compatibility**

- **FR-081**: Business-day calculations MUST complete in <50ms for 2,000 installments
- **FR-082**: System MUST NOT make external API calls for holiday data
- **FR-083**: Backward compatibility: v0.1.1 clients (no new fields) get shifted behavior with defaults
- **FR-084**: System MUST maintain deterministic output (same inputs → same output)

**Data Management**

- **FR-085**: US Federal holiday list MUST include current year (2025) and next year (2026)
- **FR-086**: Holiday list MUST be embedded in codebase (no runtime lookups)
- **FR-087**: Holiday list MUST include: New Year's Day, MLK Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas
- **FR-088**: System MUST handle observed holidays (e.g., if July 4 falls on Saturday, Friday is observed)

### Non-Functional Requirements

**Performance**
- **NFR-001**: Business-day shift calculation: <50ms for 2,000 dates
- **NFR-002**: Total request latency increase: <100ms vs v0.1.1

**Reliability**
- **NFR-003**: Invalid customSkipDates MUST return 400 problem+json (not crash)
- **NFR-004**: Missing timezone MUST fail before business-day logic

**Observability**
- **NFR-005**: Log when shifts occur (count, reasons) for monitoring

---

## Success Criteria

**Primary:** A user with payment data containing at least one weekend and one US Federal holiday due date receives a plan with zero false WEEKEND_AUTOPAY flags, correct shifted calendar dates, and visible shift annotations - all in <60 seconds.

**Black-Box Acceptance:**

**Test 1: Weekend Shift**
```json
Input: due_date = "2025-10-04" (Saturday), autopay = true, businessDayMode = true
Output:
- shiftedDueDate = "2025-10-06" (Monday)
- wasShifted = true, shiftReason = "WEEKEND"
- No WEEKEND_AUTOPAY flag
- SHIFTED_NEXT_BUSINESS_DAY present
- ICS event on 2025-10-06
- movedDates includes shift record
```

**Test 2: Holiday Shift**
```json
Input: due_date = "2025-11-27" (Thanksgiving), country = "US"
Output:
- shiftedDueDate = "2025-11-28" (Friday, next business day)
- shiftReason = "HOLIDAY"
- ICS event on 2025-11-28
```

**Test 3: Custom Skip Date**
```json
Input: due_date = "2025-10-15", customSkipDates = ["2025-10-15"]
Output:
- shiftedDueDate = "2025-10-16"
- shiftReason = "CUSTOM"
```

**Test 4: Business-Day Mode OFF**
```json
Input: due_date = "2025-10-04" (Saturday), businessDayMode = false
Output:
- shiftedDueDate = "2025-10-04" (unchanged)
- wasShifted = false
- WEEKEND_AUTOPAY flag raised (v0.1.1 behavior)
```

**Test 5: No Shift Needed**
```json
Input: due_date = "2025-10-03" (Friday)
Output:
- shiftedDueDate = "2025-10-03" (unchanged)
- wasShifted = false
```

---

## Key Entities

### Business-Day Calculator
Determines if a date is a business day and finds the next business day if not.

**Properties:**
- country: "US" | "None"
- customSkipDates: string[]
- timezone: IANA timezone

**Functions:**
- isBusinessDay(date): boolean
- nextBusinessDay(date): string (YYYY-MM-DD)

### US Federal Holiday Calendar
Static data embedded in codebase.

**Format:**
```json
{
  "2025": [
    {"date": "2025-01-01", "name": "New Year's Day"},
    {"date": "2025-01-20", "name": "MLK Day"},
    {"date": "2025-02-17", "name": "Presidents' Day"},
    {"date": "2025-05-26", "name": "Memorial Day"},
    {"date": "2025-06-19", "name": "Juneteenth"},
    {"date": "2025-07-04", "name": "Independence Day"},
    {"date": "2025-09-01", "name": "Labor Day"},
    {"date": "2025-10-13", "name": "Columbus Day"},
    {"date": "2025-11-11", "name": "Veterans Day"},
    {"date": "2025-11-27", "name": "Thanksgiving"},
    {"date": "2025-12-25", "name": "Christmas"}
  ],
  "2026": [...]
}
```

### Moved Date Record
Tracks when and why a date was shifted.

**Fields:**
- provider: string
- installment_no: number
- originalDueDate: string (YYYY-MM-DD)
- shiftedDueDate: string (YYYY-MM-DD)
- reason: "WEEKEND" | "HOLIDAY" | "CUSTOM"

### Risk Flag Updates

**New:**
- **SHIFTED_NEXT_BUSINESS_DAY** (informational): "Payment due date shifted from {original} to {shifted} due to {reason}"
- **WEEKEND_OR_HOLIDAY_AUTOPAY** (informational): "Autopay originally scheduled for non-business day"

**Modified:**
- **WEEKEND_AUTOPAY**: Only raised when businessDayMode=false (v0.1.1 behavior)

---

## Out of Scope for v0.1.2

- ❌ Provider-specific charging calendars (some providers may charge on weekends)
- ❌ Country packs beyond US (UK, CA, EU holidays)
- ❌ Bank-specific holiday calendars
- ❌ Email/receipt parsing to detect original dates
- ❌ Historical data corrections (past dates)
- ❌ Persistence or user preferences storage
- ❌ Observed holiday logic complexity (simplified: use actual date)
- ❌ Business hours or time-of-day shifting
- ❌ Backward shifting (always forward to next business day)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Holiday accuracy | Wrong shifts if data outdated | Ship offline list for 2025-2026; document yearly refresh needed |
| UX confusion | Users don't understand why date changed | Clear "Shifted" badges with tooltips; movedDates[] API field |
| Timezone bugs | Wrong day-of-week in different TZ | All calculations use user's selected timezone |
| Performance | Slow with many dates | Optimize with Set lookups; target <50ms for 2k dates |
| Backward compat | Breaks v0.1.1 clients | Default businessDayMode=true maintains expected behavior |

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Requirements generated (FR-050 through FR-088)
- [x] Entities identified
- [x] Success criteria defined
- [x] Risks documented

**Status**: ✅ **READY FOR PLANNING PHASE**

---

## Functional Requirements

**Input Extensions**

- **FR-050**: POST /api/plan MUST accept optional `businessDayMode` boolean field (default: true)
- **FR-051**: POST /api/plan MUST accept optional `country` enum field: "US" | "None" (default: "US")
- **FR-052**: POST /api/plan MUST accept optional `customSkipDates` array of YYYY-MM-DD strings
- **FR-053**: System MUST validate customSkipDates contain valid ISO 8601 dates
- **FR-054**: System MUST remain backward compatible (requests without new fields use defaults: businessDayMode=true, country="US")

**Business-Day Calculation**

- **FR-055**: System MUST treat Saturdays (weekday=6) and Sundays (weekday=7) as non-business days
- **FR-056**: When country="US", system MUST treat US Federal holidays as non-business days
- **FR-057**: System MUST use an offline US Federal holiday table covering 2025 and 2026
- **FR-058**: customSkipDates MUST be combined (union) with weekend and holiday dates
- **FR-059**: System MUST shift any due_date falling on non-business day to the next business day (forward-only)
- **FR-060**: System MUST handle multiple consecutive non-business days (iteratively advance until business day found)
- **FR-061**: All business-day calculations MUST operate in the user's selected timezone
- **FR-062**: When country="None", system MUST only consider weekends (no holidays)

**Risk Detection Updates**

- **FR-063**: System MUST NOT raise WEEKEND_AUTOPAY flag when businessDayMode=true and date is shifted
- **FR-064**: System MUST add SHIFTED_NEXT_BUSINESS_DAY informational flag when shift occurs
- **FR-065**: SHIFTED_NEXT_BUSINESS_DAY MUST include: original date, shifted date, and reason
- **FR-066**: Existing risk rules (COLLISION, CASH_CRUNCH) MUST use shifted dates for calculations
- **FR-067**: When businessDayMode=false, WEEKEND_AUTOPAY behavior unchanged (v0.1.1)
- **FR-068**: Shift reasons MUST be: "WEEKEND", "HOLIDAY", or "CUSTOM"

**ICS Calendar Export**

- **FR-069**: ICS VEVENT DTSTART MUST use shifted due date (not original)
- **FR-070**: Event SUMMARY MUST include "(shifted)" annotation when date was moved
- **FR-071**: Event DESCRIPTION MUST note original due date if shifted: "Originally due: YYYY-MM-DD"
- **FR-072**: 24-hour prior VALARM MUST be relative to shifted date
- **FR-073**: TZID handling unchanged (uses user-selected timezone)

**Response Additions**

- **FR-074**: Response MUST include new `movedDates` array
- **FR-075**: movedDates[] MUST contain records with: provider, installment_no, originalDueDate, shiftedDueDate, reason
- **FR-076**: normalized[] items MUST include new optional fields:
  - originalDueDate (string, present if shifted)
  - shiftedDueDate (string, present if shifted)
  - wasShifted (boolean)
  - shiftReason ("WEEKEND" | "HOLIDAY" | "CUSTOM")
- **FR-077**: When businessDayMode=false, movedDates MUST be empty array
- **FR-078**: movedDates[] MUST be sorted by shiftedDueDate ascending

**Frontend UI**

- **FR-079**: InputCard MUST include "Business Day Mode" toggle switch (default: ON)
- **FR-080**: Toggle MUST have help text: "Shift weekend/holiday dates to next business day"
- **FR-081**: InputCard MUST include Country select dropdown (US | None)
- **FR-082**: InputCard MUST include optional "Custom skip dates" textarea
- **FR-083**: Custom skip dates MUST accept comma-separated YYYY-MM-DD format
- **FR-084**: Custom skip dates MUST validate format and show inline error
- **FR-085**: ScheduleTable MUST show Badge with "Shifted" text on rows where wasShifted=true
- **FR-086**: ScheduleTable Badge MUST have tooltip showing: "Shifted from {original} to {shifted} due to {reason}"
- **FR-087**: Risk flags MUST display SHIFTED_NEXT_BUSINESS_DAY with secondary/blue Badge (informational, not warning)
- **FR-088**: All new UI controls MUST be keyboard-accessible with proper ARIA labels

**Performance**

- **FR-089**: Business-day calculation MUST complete in <50ms for 2,000 installments
- **FR-090**: Total POST /api/plan response time MUST remain <5 seconds for 50 installments
- **FR-091**: Holiday lookup MUST use O(1) Set operations (not array iteration)

**Data Management**

- **FR-092**: US Federal holiday list MUST be stored as JSON in `specs/business-days/data/US-{year}.json`
- **FR-093**: Holiday list MUST include standard US Federal holidays (11 per year)
- **FR-094**: System MUST handle observed holidays (when holiday falls on weekend, observed on Friday or Monday)
- **FR-095**: Holiday data MUST be embedded at build time (no runtime file reads)

**Testing**

- **FR-096**: Unit tests MUST cover: weekend shift, single holiday shift, consecutive non-business days, year boundary
- **FR-097**: Integration tests MUST verify: weekend shift in response, holiday shift in response, customSkipDates work, ICS dates shifted, risk flags updated
- **FR-098**: Test fixtures MUST include: holiday-weekend.json (mix of weekend and holiday dates)

**Documentation**

- **FR-099**: OpenAPI spec MUST document new fields (businessDayMode, country, customSkipDates, movedDates)
- **FR-100**: README MUST include "Business-Day Mode" section explaining behavior
- **FR-101**: README MUST list supported US Federal holidays for transparency

---

## API Contract Extensions

### Request Schema (additions only)

```typescript
{
  // ... existing fields ...
  businessDayMode?: boolean,      // default: true
  country?: "US" | "None",        // default: "US"
  customSkipDates?: string[]      // optional, YYYY-MM-DD format
}
```

### Response Schema (additions only)

```typescript
{
  // ... existing fields ...
  movedDates: [
    {
      provider: string,
      installment_no: number,
      originalDueDate: string,     // YYYY-MM-DD
      shiftedDueDate: string,      // YYYY-MM-DD
      reason: "WEEKEND" | "HOLIDAY" | "CUSTOM"
    }
  ],
  normalized: [
    {
      // ... existing fields ...
      originalDueDate?: string,    // if shifted
      shiftedDueDate?: string,     // if shifted
      wasShifted?: boolean,
      shiftReason?: "WEEKEND" | "HOLIDAY" | "CUSTOM"
    }
  ]
}
```

---

## Deliverables

1. **Feature Specification** (this file)
2. **US Holiday Data**: specs/business-days/data/US-2025-2026.json
3. **OpenAPI Diff**: specs/business-days/openapi-diff.md
4. **Delta Document**: ops/deltas/0005_business_days.md
5. **Test Fixture**: tests/fixtures/holiday-weekend.json
6. **Implementation Plan**: specs/business-days/plan.md (via /plan)
7. **Task List**: specs/business-days/tasks.md (via /tasks)

---

## Version

v0.1.2 - Business-Day Awareness (US Holidays)