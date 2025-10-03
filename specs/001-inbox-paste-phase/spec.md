# Feature Specification: PayPlan v0.1.4  Inbox Paste Phase B (Providers + Confidence + Coverage)

**Feature Branch**: `001-inbox-paste-phase`
**Created**: 2025-10-02
**Status**: Draft
**Input**: User description: "Create the feature spec for PayPlan v0.1.4  **Inbox Paste, Phase B (Providers + Confidence + Coverage)**. This is a minimal, reversible slice that expands provider support and tightens quality without changing the API."

## Execution Flow (main)
```
1. Parse user description from Input
   ’ Feature description provided: Inbox Paste Phase B expansion
2. Extract key concepts from description
   ’ Actors: PayPlan users pasting BNPL emails
   ’ Actions: Paste, extract, validate, preview, build plan
   ’ Data: BNPL payment emails (4 new providers), confidence scores
   ’ Constraints: Client-only, no API changes, backward compatible
3. For each unclear aspect:
   ’ All aspects clearly specified in user input
4. Fill User Scenarios & Testing section
   ’ Clear user flow: paste ’ preview with confidence ’ build plan
5. Generate Functional Requirements
   ’ FR-126 through FR-145 provided and testable
6. Identify Key Entities (if data involved)
   ’ Payment items, confidence scores, provider signatures
7. Run Review Checklist
   ’ No implementation details in spec
   ’ All requirements testable
8. Return: SUCCESS (spec ready for planning)
```

---

## ¡ Quick Guidelines
-  Focus on WHAT users need and WHY
- L Avoid HOW to implement (no tech stack, APIs, code structure)
- =e Written for business stakeholders, not developers

---

## Why This Feature

Increase real-world paste success by covering 4 additional US BNPL providers and surfacing extraction confidence so users can trust/edit before building a plan.

---

## User Scenarios & Testing

### Primary User Story

A user receives payment reminder emails from multiple BNPL providers (Afterpay, PayPal Pay in 4, Zip, Sezzle). They paste these emails into PayPlan's "Inbox Paste" feature, which extracts payment details, assigns a confidence score to each extracted row, and displays the results in a preview table with visual confidence indicators. Low-confidence rows are flagged with specific hints about missing or unclear data. The user can review, edit if needed, and proceed to build a payment plan.

### Acceptance Scenarios

1. **Given** a user has emails from 6 different BNPL providers (including Afterpay, PayPal Pay in 4, Zip, Sezzle), **When** they paste all emails into the Inbox Paste text area, **Then** the system extracts at least 5 valid payment rows with confidence scores displayed as pills (High e0.8, Medium 0.6-0.79, Low <0.6)

2. **Given** the system has extracted payment rows with varying confidence levels, **When** any row has confidence <0.6, **Then** that row appears in the Issues section with specific field-level hints (e.g., "missing date", "unclear amount", "unknown provider")

3. **Given** a user has successfully extracted payment data with confidence scores, **When** they click "Copy as CSV", **Then** the clipboard contains valid CSV data including a confidence column as the last field

4. **Given** a user has reviewed the extracted data in the preview table, **When** they click "Build Plan", **Then** the system sends the data to POST /api/plan and returns a complete payment plan within 60 seconds of initial paste

5. **Given** a user pastes emails containing sensitive information (email addresses, account numbers, names), **When** any extraction errors or issues occur, **Then** all error messages and snippets have PII redacted (emails ’ [EMAIL], amounts ’ [AMOUNT], account numbers ’ [ACCOUNT], names ’ [NAME])

6. **Given** the system is parsing 50 emails, **When** extraction begins, **Then** the UI remains responsive and completes parsing in under 2 seconds on a mid-tier laptop

### Edge Cases

- What happens when a pasted email contains an unknown provider?
  ’ System flags it in Issues as "unknown provider" with the email snippet (PII-redacted)

- What happens when an email has multiple payment amounts mentioned?
  ’ System uses pattern matching to identify the primary payment amount; if ambiguous, confidence score is lowered

- What happens when date format is ambiguous (e.g., "01/02/2025")?
  ’ System assumes US format (M/d/yyyy) per existing Phase A behavior; this is documented as a known limitation for Phase B

- What happens when autopay status is unclear or contradictory?
  ’ System defaults to false (safer assumption) and may lower confidence score

- What happens when an email is malformed HTML or plain text?
  ’ System attempts to parse both formats; HTML is converted to text using DOMParser

- What happens when deduplication removes legitimate duplicate purchases?
  ’ System uses provider+installment+date+amount as the key, so identical amounts on the same date from the same provider for the same installment are deduplicated, but different amounts are preserved

---

## Requirements

### Functional Requirements

#### Provider Detection & Parsing

- **FR-126**: System MUST detect Afterpay payment emails using domain signatures and keyword patterns, tolerating both HTML and plain text formats
- **FR-127**: System MUST detect PayPal Pay in 4 payment emails using paypal.com domain and "Pay in 4" phrase patterns
- **FR-128**: System MUST detect Zip (formerly Quadpay) payment emails using provider signatures and payment phrasing
- **FR-129**: System MUST detect Sezzle payment emails using provider signatures and installment phrasing
- **FR-130**: System MUST parse amount formats including: $1,234.56, $0.01, 1,234.56 USD, $999 (assuming USD when currency not specified)
- **FR-131**: System MUST parse date formats including: yyyy-MM-dd, M/d/yyyy, MM/dd/yyyy, "Oct 6, 2025", "October 6, 2025", and MUST strip ordinal suffixes (1st, 2nd, 3rd, 4th)
- **FR-132**: System MUST parse installment number patterns including: "1 of 4", "Payment 3/4", "Final payment"
- **FR-133**: System MUST parse autopay state where phrases like "AutoPay is OFF" or "AutoPay disabled" result in autopay=false
- **FR-134**: System MUST parse late fee when explicitly present in email; default to 0 when absent

#### Data Quality & Deduplication

- **FR-135**: System MUST deduplicate extracted items using a composite key of provider+installment+date+amount, preserving items with distinct amounts
- **FR-136**: System MUST calculate a confidence score (0-1) for each extracted row based on weighted sum of matched signals (provider signature, date pattern, amount pattern, installment phrase, autopay phrase)
- **FR-137**: System MUST display a confidence pill in the preview table for each row with visual indicators: High (e0.8), Medium (0.6-0.79), Low (<0.6)
- **FR-138**: System MUST flag rows with confidence <0.6 in the Issues section with field-level hints indicating missing or unclear data (date, amount, provider, installment number)

#### Privacy & Security

- **FR-139**: System MUST redact all personally identifiable information (PII) from user-visible error snippets and issue messages using a redaction function that converts: emails ’ [EMAIL], amounts ’ [AMOUNT], account numbers ’ [ACCOUNT], names ’ [NAME]

#### Export & Integration

- **FR-140**: System MUST include the confidence score as the last column when user clicks "Copy as CSV"
- **FR-141**: System MUST parse 50 emails in under 2 seconds on a mid-tier laptop with non-blocking UI rendering

#### Accessibility

- **FR-142**: System MUST provide text alternatives for confidence pills and MUST use aria-live="polite" for the Issues section to announce updates to screen readers

#### Technical Constraints

- **FR-143**: System MUST NOT introduce new npm dependencies beyond existing ones; MUST reuse Luxon for date parsing; MUST use browser's native DOMParser for HTML-to-text conversion
- **FR-144**: System MUST maintain JSDoc coverage of e80% on all new and changed exported functions to satisfy continuous integration requirements
- **FR-145**: System MUST remain backward compatible with existing CSV tab and Phase A providers (Klarna, Affirm) with no breaking changes

### Key Entities

- **Payment Item**: Represents a single BNPL installment payment extracted from email, including provider name, installment number, due date, amount, currency, autopay status, late fee, and confidence score

- **Confidence Score**: A numerical value (0-1) indicating the system's confidence in the accuracy of an extracted payment item, calculated from weighted signals (provider signature: 0.35, date: 0.25, amount: 0.2, installment: 0.15, autopay: 0.05)

- **Provider Signature**: A pattern-matching definition for each BNPL provider (Afterpay, PayPal Pay in 4, Zip, Sezzle, plus existing Klarna/Affirm) including email domain, keyword phrases, and formatting heuristics

- **Extraction Issue**: A user-visible message indicating a problem with extraction, including PII-redacted snippet, reason description, and field-level hints for low-confidence items

---

## Scope & Boundaries

### In Scope (v0.1.4)
- Client-only (frontend) enhancements to existing Inbox Paste flow
- Support for 4 additional US BNPL providers: Afterpay, PayPal Pay in 4, Zip, Sezzle
- Lightweight confidence scoring system based on matched signal count
- Visual confidence indicators (pills) in preview table
- Enhanced issue reporting with field-level hints for low-confidence rows
- PII redaction for all error/issue snippets
- CSV export includes confidence column

### Out of Scope
- No server-side changes; POST /api/plan API unchanged
- No Gmail/IMAP integrations
- No OCR (optical character recognition) support
- No locale auto-detection (continues assuming US formats)
- No server-side email parsing
- No changes to existing provider detectors (Klarna, Affirm) beyond confidence scoring

### Non-Goals
- International provider support (reserved for future phases)
- Machine learning-based extraction
- Real-time email monitoring
- Browser extension or mobile app integration

---

## Testing & Validation

### Unit Testing Requirements
- Minimum 40 unit tests covering:
  - Each new provider (happy path + edge cases): 4 providers × 3 tests = 12 tests
  - Amount parsing edge cases: 6 tests
  - Date parsing edge cases: 6 tests
  - Installment number parsing: 4 tests
  - Autopay detection: 4 tests
  - Confidence score thresholds: 4 tests
  - PII redaction: 4 tests

### Integration Testing Requirements
- Minimum 6 integration tests covering:
  - Multi-provider paste extracting e5 items
  - Low-confidence row flagged in Issues section
  - CSV export includes confidence column
  - End-to-end flow to POST /api/plan works unchanged
  - HTML email parsing via DOMParser
  - Performance: 50 emails < 2s

### Test Fixtures Required
- Afterpay emails: 2 realistic samples (1 autopay, 1 with late fee)
- PayPal Pay in 4 emails: 2 realistic samples (1 first payment, 1 final)
- Zip emails: 2 realistic samples (1 mid-payment, 1 edge amount)
- Sezzle emails: 2 realistic samples (1 standard, 1 low-confidence)
- Malformed/unknown provider samples: 2 files

### Acceptance Testing (Black Box)
1. Paste mixed emails (e6 across the 4 new providers) ’ preview shows e5 valid rows with confidence pills
2. Any row with confidence <0.6 appears in Issues with specific hints
3. "Copy as CSV" produces valid CSV with confidence column
4. "Build Plan" returns a plan; total time from paste to plan <60 seconds
5. No network calls before POST /api/plan
6. JSDoc coverage e80% on changed/new exported functions

---

## Success Criteria

The feature is considered successful when:
- A user can paste 6 emails spanning Afterpay, PayPal Pay in 4, Zip, and Sezzle
- System extracts e5 correct payment rows
- Each row displays a meaningful confidence score
- Low-confidence rows provide actionable hints
- User can build a payment plan from extracted data
- All documentation and tests are in the repository
- Continuous integration passes with green status

---

## Deliverables

1. **specs/001-inbox-paste-phase/spec.md** - This feature specification (completed)
2. **specs/001-inbox-paste-phase/acceptance.md** - Test matrix and fixtures list
3. **ops/deltas/0006_inbox_paste_b.md** - Delta documentation for Phase B changes
4. **README.md** - Updated "Inbox Paste" section documenting supported providers and confidence legend

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
- [x] Ambiguities marked (none found - description was comprehensive)
- [x] User scenarios defined
- [x] Requirements generated (FR-126 through FR-145)
- [x] Entities identified (Payment Item, Confidence Score, Provider Signature, Extraction Issue)
- [x] Review checklist passed
