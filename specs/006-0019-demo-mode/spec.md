# Feature Specification: Demo Mode End-to-End

**Feature Branch**: `006-0019-demo-mode`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "0019-demo-mode-e2e - Ship a tiny, customer-visible demo page that runs sandbox BNPL emails through the existing client-side extractor and shows 'This Week' actions with risk/confidence pills, plus a 'Download .ics' button. Zero auth, zero PII, reversible."

## Execution Flow (main)

```text
1. Parse user description from Input
   → Feature description provided: Demo mode e2e with client-side extraction
2. Extract key concepts from description
   → Identified: demo page, BNPL email processing, risk/confidence display, ICS export
3. For each unclear aspect:
   → All aspects clearly defined in feature description
4. Fill User Scenarios & Testing section
   → User flow: Navigate → Run Demo → View Results → Download Calendar
5. Generate Functional Requirements
   → All requirements testable and clearly defined
6. Identify Key Entities (if data involved)
   → Entities: Synthetic emails, Extracted schedules, Risk detections
7. Run Review Checklist
   → No clarifications needed, no implementation details leaked
8. Return: SUCCESS (spec ready for planning)
```

---

## Quick Guidelines

- Focus on WHAT users need and WHY
- Avoid HOW to implement (no tech stack, APIs, code structure)
- Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

A prospective customer or evaluator visits the demo page to understand how the BNPL payment manager works without creating an account or providing any personal information. They can see how the system extracts payment schedules from various BNPL provider emails, identifies potential risks, and generates calendar reminders.

### Acceptance Scenarios

1. **Given** a user navigates to `/demo`, **When** the page loads, **Then** they see 10 synthetic BNPL email snippets from providers like Klarna, Affirm, and Afterpay displayed on screen

2. **Given** the demo page is loaded, **When** the user clicks "Run Demo", **Then** the system processes all email snippets and displays:
   - A normalized payment schedule list showing all extracted installments
   - Confidence pills (High/Medium/Low) indicating extraction confidence for each item
   - Risk pills (COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY) when risk conditions are detected

3. **Given** the demo has been run and results are displayed, **When** the user clicks "Download .ics", **Then** a calendar file containing "This Week" payment events downloads to their browser, with risk annotations included in event descriptions

4. **Given** the demo page is accessed, **When** the user interacts with any feature, **Then** no network requests are made (fully offline-capable) and no authentication is required

5. **Given** the demo page is accessed, **When** viewing email snippets and results, **Then** no personally identifiable information is displayed (all data is synthetic/sandbox)

### Edge Cases

- What happens when no payments fall within "This Week"? System should still generate a valid .ics file with appropriate messaging
- What happens if extraction confidence is Low for all items? System should still display results with appropriate Low confidence pills
- What happens if no risks are detected? System should display the schedule without risk pills
- How does the system handle browser compatibility for .ics download? Should work in all modern browsers using standard download mechanisms

---

## Requirements *(mandatory)*

### Functional Requirements

#### Display Requirements

- **FR-001**: System MUST display a demo page accessible at the `/demo` route
- **FR-002**: System MUST render 10 synthetic BNPL email snippets from multiple providers (Klarna, Affirm, Afterpay, and others)
- **FR-003**: System MUST provide a "Run Demo" button that triggers email processing

#### Extraction & Analysis Requirements

- **FR-004**: System MUST process all displayed email snippets through the client-side email extractor when "Run Demo" is clicked
- **FR-005**: System MUST display a normalized payment schedule list showing all extracted installments with due dates, amounts, and provider information
- **FR-006**: System MUST display confidence indicators (High/Medium/Low pills) for each extracted item based on extraction confidence thresholds
- **FR-007**: System MUST detect and display risk conditions using the following risk types:
  - COLLISION: Multiple payments due on the same day
  - CASH_CRUNCH: Insufficient buffer between payday and payment due date
  - WEEKEND_AUTOPAY: Autopay scheduled for a weekend day
- **FR-008**: System MUST visually distinguish risk levels through color-coded pills or badges

#### Calendar Export Requirements

- **FR-009**: System MUST provide a "Download .ics" button visible after demo results are displayed
- **FR-010**: System MUST generate a valid .ics calendar file containing payment events for "This Week"
- **FR-011**: System MUST include risk annotations in calendar event descriptions when risks are detected
- **FR-012**: System MUST use timezone-aware date handling for calendar generation
- **FR-013**: System MUST trigger a browser download of the .ics file without requiring server interaction

#### Data & Privacy Requirements

- **FR-014**: System MUST use only synthetic, sandbox BNPL email data (no real customer data)
- **FR-015**: System MUST operate entirely offline after initial page load (no network requests during demo execution)
- **FR-016**: System MUST NOT require user authentication or account creation
- **FR-017**: System MUST NOT collect, store, or transmit any personally identifiable information

#### Maintainability Requirements

- **FR-018**: Feature MUST be reversible through a single code revert (no database migrations or persistent changes)
- **FR-019**: System MUST use existing CI quality gates (lint, performance, spec-audit) without modification
- **FR-020**: System MUST respect existing import path rules and modular architecture

### Key Entities *(mandatory)*

- **Synthetic Email Snippet**: A sandbox BNPL provider email containing payment schedule information. Each snippet represents a realistic but fake email from providers like Klarna, Affirm, Afterpay, PayPal Pay-in-4, Zip, or Sezzle. Contains no PII.

- **Extracted Schedule Item**: A normalized payment installment extracted from an email snippet. Contains: provider name, installment number, due date, amount, currency, autopay status, and late fee information.

- **Confidence Level**: An indicator (High/Medium/Low) representing the extraction algorithm's confidence in the accuracy of the extracted data based on pattern matching quality and data completeness.

- **Risk Detection**: An identified financial risk condition in the payment schedule. Types include:
  - COLLISION: Multiple payments scheduled for the same date
  - CASH_CRUNCH: Payment due with insufficient buffer from payday
  - WEEKEND_AUTOPAY: Automatic payment scheduled on a weekend

- **Calendar Event**: An .ics-formatted event representing a "This Week" payment due date with provider, amount, and risk annotations if applicable.

---

## Review & Acceptance Checklist

**GATE: Automated checks run during main() execution**

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (≤8 files, ≤200 LOC, 2 domains)
- [x] Dependencies identified (existing email-extractor.ts, modular extraction paths)

---

## Execution Status

**Updated by main() during processing**

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
