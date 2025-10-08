# Feature Specification: CSV Import MVP

**Feature Branch**: `007-0020-csv-import`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "0020-csv-import-mvp
Goal: Add a tiny, client-only CSV import that runs through the same extractor->schedule->"This Week"+ICS flow as /demo. Zero auth, zero PII, reversible. This gives a second input path (CSV) without touching the API."

## Execution Flow (main)

```text
1. Parse user description from Input
   -> Complete: Client-only CSV import feature
2. Extract key concepts from description
   -> Actors: Users importing BNPL payment data
   -> Actions: Upload CSV, view schedule, download ICS calendar
   -> Data: Payment installments (provider, amount, due date, autopay)
   -> Constraints: <=8 files, <=180 LOC, client-only, no network
3. For each unclear aspect:
   -> None - requirements are explicit
4. Fill User Scenarios & Testing section
   -> Complete: Primary and error scenarios defined
5. Generate Functional Requirements
   -> Complete: All testable requirements specified
6. Identify Key Entities (if data involved)
   -> Complete: CSV data format defined
7. Run Review Checklist
   -> No implementation details in functional requirements
   -> All requirements are testable
8. Return: SUCCESS (spec ready for planning)
```

---

## Quick Guidelines

- Focus on WHAT users need and WHY
- Avoid HOW to implement (no tech stack, APIs, code structure)
- Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story

A user wants to visualize and manage their BNPL payment schedule by importing payment data from a spreadsheet. They prepare a CSV file with their upcoming payments, upload it through a browser interface, review the generated schedule with risk warnings, and download a calendar file to add events to their personal calendar application.

### Acceptance Scenarios

1. **Given** a user visits the import page, **When** they view the interface, **Then** they see upload controls and example CSV format documentation
2. **Given** a user has a valid CSV file with 5-20 payment rows, **When** they upload and process the file, **Then** they see a schedule table showing each payment with confidence level and risk indicators (COLLISION, WEEKEND_AUTOPAY)
3. **Given** a processed schedule is displayed, **When** the user clicks "Download .ics", **Then** they receive a valid ICS calendar file containing only "This Week" events with risk annotations
4. **Given** a user uploads an invalid CSV file, **When** processing fails, **Then** they see a single-line error message and the page remains functional for retry
5. **Given** a user processes a CSV file, **When** network monitoring tools are active, **Then** no network requests are made (offline-only operation)

### Edge Cases

- What happens when CSV has missing required fields (provider, amount, dueISO)?
  -> Display clear error indicating which field is missing
- What happens when CSV has invalid date formats in dueISO column?
  -> Display error indicating date format issue
- What happens when CSV is empty or has no data rows?
  -> Display error indicating no valid data found
- What happens when payment dates don't fall within "This Week"?
  -> Schedule displays all payments, but ICS export only includes current ISO week events
- What happens when multiple payments have the same due date?
  -> Display COLLISION risk indicator for affected payments

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a page accessible at `/import` route with CSV upload functionality
- **FR-002**: System MUST accept simple CSV files with comma delimiter, header row, and no quoted fields
- **FR-003**: System MUST require CSV headers: provider, amount, currency, dueISO, autopay
- **FR-004**: System MUST parse CSV data and convert it to normalized payment items
- **FR-005**: System MUST display parsed payments in a schedule table identical in format to demo page
- **FR-006**: System MUST calculate and display confidence levels for each payment
- **FR-007**: System MUST detect and display COLLISION risks when multiple payments share the same due date
- **FR-008**: System MUST detect and display WEEKEND_AUTOPAY risks for autopay payments falling on weekends
- **FR-009**: System MUST NOT detect CASH_CRUNCH risks (explicitly out of scope)
- **FR-010**: System MUST provide "Download .ics" functionality after successful CSV processing
- **FR-011**: System MUST filter ICS exports to include only payments within the current ISO week (Monday-Sunday, America/New_York timezone)
- **FR-012**: System MUST include risk annotations in ICS event descriptions on separate lines
- **FR-013**: System MUST NOT include event reminders in ICS files (out of scope for MVP)
- **FR-014**: System MUST operate entirely client-side with no network requests
- **FR-015**: System MUST display single-line error messages for invalid CSV without exposing stack traces
- **FR-016**: System MUST maintain page responsiveness after error conditions
- **FR-017**: System MUST support both drag-and-drop and file chooser upload methods
- **FR-018**: System MUST display helper text showing sample CSV format with simple delimiter rules

### Key Entities

- **CSV Row**: Represents a single payment installment
  - Provider: Name of BNPL service (e.g., Klarna, Affirm, Afterpay)
  - Amount: Payment amount as decimal number
  - Currency: Three-letter currency code (e.g., USD)
  - DueISO: Due date in ISO 8601 format (YYYY-MM-DD)
  - Autopay: Boolean value (true/false)
  - Format constraints: Simple comma-separated values, no quoted fields, no commas within field values

- **Schedule Result**: Processed payment data displayed to user
  - All CSV row data
  - Confidence level: Indicator of data quality/extraction reliability
  - Risk indicators: Array of detected risks (COLLISION, WEEKEND_AUTOPAY)
  - Relationships: Grouped by due date for collision detection

- **ICS Calendar Event**: Exported calendar item for current week
  - Event title: Derived from payment provider and amount
  - Event date/time: Derived from dueISO
  - Event description: Includes risk annotations if present
  - Timezone: America/New_York
  - No reminder/alarm component

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
