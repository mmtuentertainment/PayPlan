# Feature Specification: BNPL Email Parser

**Feature Branch**: `020-short-name-bnpl`
**Created**: 2025-10-27
**Status**: Draft
**Tier**: 1 (Medium complexity, 3-7 days)
**Phase**: Phase 1 (Pre-MVP, manual testing only)
**Input**: Build an email parser that extracts payment schedules from BNPL (Buy Now, Pay Later) provider emails. This is the CORE differentiator for PayPlan - no other budgeting app has this.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parse Klarna Email and Create Payment Schedule (Priority: P1)

A user receives a Klarna purchase confirmation email for a $200 order at Target, split into 4 payments of $50 every 2 weeks. They copy the email content, paste it into PayPlan's BNPL parser interface, and click "Parse Email". Within 3 seconds, they see a payment schedule showing: merchant name (Target), total amount ($200), 4 installments of $50 each, and due dates for each payment. The schedule is automatically saved to localStorage and visible in their dashboard.

**Why this priority**: This is the core value proposition and primary differentiator for PayPlan. Without this, the app is just another budgeting tool. This feature alone validates the product-market fit with BNPL-heavy users.

**Independent Test**: Can be fully tested by pasting a sample Klarna email, clicking parse, and verifying the extracted payment schedule displays correctly and persists after page refresh. Delivers immediate value as a "BNPL payment tracker" even without other features.

**Acceptance Scenarios**:

1. **Given** a user has copied a Klarna purchase confirmation email, **When** they paste it into the BNPL parser and click "Parse Email", **Then** the system extracts merchant name, total amount, installment count, installment amounts, and due dates, and displays them in a readable payment schedule
2. **Given** the email contains HTML formatting, **When** the parser processes it, **Then** it correctly strips HTML tags and extracts text content
3. **Given** a valid email is parsed, **When** the user refreshes the page, **Then** the payment schedule persists in localStorage and displays on the dashboard
4. **Given** a user parses multiple emails, **When** each email is processed, **Then** each creates a separate payment schedule entry without overwriting previous ones

---

### User Story 2 - Parse Emails from Multiple BNPL Providers (Priority: P1)

A user has active loans with Klarna ($200), Affirm ($500), Afterpay ($150), Sezzle ($100), Zip ($75), and PayPal Credit ($300). They paste each confirmation email into PayPlan, and all six are successfully parsed. Each payment schedule displays correctly with provider-specific details (e.g., Affirm's monthly payments vs. Klarna's bi-weekly payments).

**Why this priority**: Users rarely have loans from just one provider. Supporting all 6 major BNPL providers is essential to cover 95%+ of user needs. This is table-stakes for the feature to be useful.

**Independent Test**: Can be tested by pasting sample emails from each of the 6 providers and verifying correct extraction for each format. Delivers value by consolidating all BNPL obligations in one place.

**Acceptance Scenarios**:

1. **Given** a user pastes a Klarna email, **When** parsed, **Then** it extracts 4 bi-weekly payments correctly
2. **Given** a user pastes an Affirm email, **When** parsed, **Then** it extracts monthly payments with interest rate (if included)
3. **Given** a user pastes an Afterpay email, **When** parsed, **Then** it extracts 4 bi-weekly payments (similar to Klarna but different email format)
4. **Given** a user pastes a Sezzle email, **When** parsed, **Then** it extracts 4 bi-weekly payments
5. **Given** a user pastes a Zip email, **When** parsed, **Then** it extracts weekly or bi-weekly payments based on plan type
6. **Given** a user pastes a PayPal Credit email, **When** parsed, **Then** it extracts monthly payments with minimum payment amounts

---

### User Story 3 - Handle Unparseable Emails with Clear Error Messages (Priority: P2)

A user accidentally pastes a promotional email from Klarna instead of a purchase confirmation. When they click "Parse Email", the system displays an error message: "We couldn't find payment details in this email. Please make sure you've pasted a purchase confirmation email, not a promotional or shipping notification." The user can try again with the correct email.

**Why this priority**: Prevents user frustration and confusion when parsing fails. Clear error messages guide users to success rather than leaving them stuck.

**Independent Test**: Can be tested by pasting non-confirmation emails (promotions, shipping updates, account notifications) and verifying appropriate error messages appear. Delivers value by improving user experience and reducing support requests.

**Acceptance Scenarios**:

1. **Given** a user pastes an email without payment information, **When** parsing is attempted, **Then** a clear error message explains what went wrong and what type of email is needed
2. **Given** a user pastes plain text that isn't an email, **When** parsing is attempted, **Then** an error message indicates the content doesn't match any supported email format
3. **Given** a parsing error occurs, **When** the error message is displayed, **Then** the previously entered text remains in the input field so the user can edit and retry
4. **Given** a user receives an error, **When** they paste a valid email and retry, **Then** the error message clears and parsing succeeds

---

### User Story 4 - Support Both HTML and Plain Text Email Formats (Priority: P2)

A user copies an email from Gmail (HTML format) and successfully parses a Klarna purchase. Later, they copy an email from their text-based email client (plain text format) and it also parses correctly. The system handles both formats transparently.

**Why this priority**: Email clients vary widely in how they present content. Supporting both HTML and plain text ensures compatibility across Gmail, Outlook, Apple Mail, Yahoo, and text-based clients.

**Independent Test**: Can be tested by parsing the same BNPL purchase email in both HTML and plain text formats and verifying both extract the same data. Delivers value by working regardless of user's email client.

**Acceptance Scenarios**:

1. **Given** a user pastes an HTML-formatted email, **When** parsed, **Then** the system strips HTML tags and extracts payment data correctly
2. **Given** a user pastes a plain text email, **When** parsed, **Then** the system extracts payment data correctly without expecting HTML
3. **Given** an email contains both HTML and plain text parts, **When** parsed, **Then** the system uses whichever format is more parseable
4. **Given** an HTML email has complex nested tables, **When** parsed, **Then** the system extracts data from table cells correctly

---

### User Story 5 - Detect and Prevent Duplicate Email Parsing (Priority: P3)

A user accidentally pastes the same Klarna email twice. When they click "Parse Email" the second time, the system displays a warning: "This email has already been parsed. Do you want to create a duplicate payment schedule?" The user can cancel or proceed if it's intentional (e.g., they made two separate purchases with the same details).

**Why this priority**: Prevents cluttering the dashboard with duplicate schedules from accidental re-parsing. Improves data quality and user experience.

**Independent Test**: Can be tested by parsing the same email twice and verifying the duplicate detection warning appears. Delivers value by preventing user errors while allowing intentional duplicates.

**Acceptance Scenarios**:

1. **Given** a user has previously parsed an email, **When** they paste the exact same email again, **Then** the system detects the duplicate and displays a warning
2. **Given** a duplicate warning is shown, **When** the user clicks "Cancel", **Then** no new payment schedule is created
3. **Given** a duplicate warning is shown, **When** the user clicks "Create Anyway", **Then** a new payment schedule is created (allowing legitimate duplicates)
4. **Given** two emails have the same merchant and amount but different dates, **When** both are parsed, **Then** they are treated as separate purchases (not duplicates)

---

### User Story 6 - Display Parsed Data Before Saving (Priority: P3)

A user pastes an Affirm email and clicks "Parse Email". Before saving to localStorage, the system displays a preview: "We found: Merchant: Best Buy, Total: $500, 6 monthly payments of $83.33, First payment: Nov 1, 2025". The user can review this, edit any incorrect details, and click "Save Payment Schedule" to confirm.

**Why this priority**: Gives users confidence the parser extracted correct data and allows manual corrections if parsing was imperfect. Improves data accuracy.

**Independent Test**: Can be tested by parsing an email, reviewing the preview, making edits, and verifying the edited data (not the original parsed data) is saved. Delivers value by preventing bad data from entering the system.

**Acceptance Scenarios**:

1. **Given** an email is successfully parsed, **When** the data is extracted, **Then** a preview displays all extracted fields (merchant, total, installments, dates, amounts) before saving
2. **Given** a preview is displayed, **When** the user edits a field (e.g., corrects merchant name), **Then** the edited value is used when saving
3. **Given** a preview is displayed, **When** the user clicks "Cancel", **Then** no payment schedule is saved and the parser resets
4. **Given** a preview is displayed, **When** the user clicks "Save Payment Schedule", **Then** the data is saved to localStorage and added to the dashboard

---

### Edge Cases

- What happens when an email contains multiple purchases in one message (e.g., Klarna bundle offer)? **Decision**: BNPL providers send one email per purchase (industry standard + regulatory requirement via Truth in Lending Act). Bundle purchases (multiple items in one checkout) are treated as ONE purchase with ONE total and ONE schedule. Parser will extract the first (and typically only) purchase from the email. If multiple purchase blocks somehow exist (non-standard edge case), first purchase is extracted and user can paste email again or manually enter remaining purchases.
- How does the system handle emails with non-USD currencies (e.g., EUR, GBP, CAD)? **Out of scope for Phase 1** - display error message directing user to convert to USD or wait for multi-currency support in later phase.
- What happens if a BNPL provider changes their email template format? Parser may fail with "unable to parse" error. User should contact support or manually enter data. Future updates will include new template patterns.
- How does the system parse Affirm emails with 0% APR vs. those with interest charges? Both formats are supported. APR field is extracted if present but not required for payment schedule creation.
- What happens when an email lists "first payment today" without a specific date? System uses current date as the payment date. Subsequent payments calculated based on installment frequency.
- How does the system handle payment schedules that span multiple years (e.g., Affirm 24-month plan)? Fully supported. Date parsing handles dates in future years. No special handling needed.
- What happens when a user's browser is at localStorage capacity and parsing would exceed the limit? Display error message: "Storage limit reached. Please delete old payment schedules or clear browser data to continue." Provide link to localStorage management settings.
- How does the system handle forwarded emails with "Fwd:" prefixes and extra headers? Parser strips common email prefixes (Fwd:, Re:, etc.) and header blocks before parsing. Should handle forwarded emails transparently.
- What happens when an email contains payment amounts with tax or fees broken out separately? Parser extracts the total amount (including tax/fees) as the purchase total. Individual installment amounts are extracted as shown in the email (already including proportional tax/fees).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support parsing emails from 6 BNPL providers: Klarna, Affirm, Afterpay, Sezzle, Zip, and PayPal Credit
- **FR-002**: System MUST extract the following data from each email: merchant name, total purchase amount, number of installments, installment amount, and due date(s) for each payment
- **FR-003**: System MUST support both HTML-formatted and plain text email content
- **FR-004**: System MUST store parsed payment schedules in browser localStorage with no server communication
- **FR-005**: System MUST display parsed data in under 5 seconds from when user clicks "Parse Email"
- **FR-006**: System MUST display clear, actionable error messages when parsing fails, indicating what type of email is expected
- **FR-007**: System MUST preserve all previously parsed payment schedules when adding new ones (no data loss)
- **FR-008**: System MUST assign a unique identifier to each parsed payment schedule
- **FR-009**: System MUST detect duplicate emails by comparing key fields (merchant, total, date) and warn users before creating duplicates
- **FR-010**: System MUST display a preview of extracted data before saving, allowing users to review and edit fields
- **FR-011**: System MUST validate extracted data using Zod schemas to ensure: amounts are positive numbers, dates are valid ISO 8601 format, installment count is a positive integer
- **FR-012**: System MUST handle HTML email content by stripping tags and extracting text while preserving line breaks and structure
- **FR-013**: System MUST persist payment schedules across browser sessions (page refresh, tab close/reopen, browser restart)
- **FR-014**: System MUST provide a user interface with: text area for pasting email content, "Parse Email" button, preview area for extracted data, "Save Payment Schedule" button
- **FR-015**: System MUST handle parsing errors gracefully without crashing or losing user input
- **FR-016**: System MUST support keyboard navigation for all parser interface elements (WCAG 2.1 AA compliance)
- **FR-017**: System MUST provide ARIA labels and screen reader announcements for parsing status and errors
- **FR-018**: System MUST display extracted payment schedules in the user's dashboard with merchant name, total amount, installment details, and next payment due date prominently

### Key Entities

- **BNPL Email**: The raw email content pasted by the user, containing purchase and payment information from a BNPL provider
- **BNPL Provider**: One of the 6 supported providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit), each with unique email format patterns
- **Payment Schedule**: The structured data extracted from an email, containing merchant, total, installments, and due dates
- **Installment**: A single scheduled payment within a payment schedule, containing amount and due date
- **Parser Rule**: Provider-specific regex patterns and extraction logic for identifying and extracting data from email formats

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully parse a BNPL email and see results in under 5 seconds
- **SC-002**: Parser correctly extracts data from 90% or more of BNPL purchase confirmation emails from supported providers
- **SC-003**: Payment schedules persist across 100% of browser sessions without data loss
- **SC-004**: Users can parse emails from all 6 BNPL providers without errors
- **SC-005**: Error messages are clear and actionable for 95% of unparseable emails
- **SC-006**: Users can successfully complete the parse-preview-save workflow on first attempt 85% of the time
- **SC-007**: Duplicate detection correctly identifies 95% of duplicate emails while allowing 100% of legitimate separate purchases
- **SC-008**: Parser handles both HTML and plain text email formats with 90%+ accuracy for each
- **SC-009**: System maintains parser functionality with 500+ stored payment schedules without performance degradation
- **SC-010**: Users can navigate and use the parser interface entirely via keyboard (100% keyboard accessible)

## Assumptions

- Users will paste email content from their email client (Gmail, Outlook, etc.) rather than forwarding emails to PayPlan
- BNPL providers send purchase confirmation emails in a consistent format (templates may vary slightly but core structure remains stable)
- **Each BNPL provider sends ONE email per purchase** (industry standard + Truth in Lending Act requirement). Bundle purchases (multiple items in one checkout) are treated as ONE purchase with ONE payment schedule. If multiple purchase blocks exist in one email (non-standard edge case), parser extracts first purchase only.
- Users understand the difference between "parsing an email" and "manually entering payment data"
- Browser localStorage is available and enabled with at least 1MB free space for payment schedules
- Most users have 3-5 active BNPL loans at any given time, not hundreds
- Emails are in English (non-English emails are out of scope for Phase 1)
- Payment amounts are in USD (multi-currency support deferred to later phases)
- Users will parse emails within a few days of receiving them (not years-old emails with outdated formats)

## Dependencies

- Browser localStorage API support
- Zod library for schema validation (already in tech stack)
- React for UI components (already in tech stack)
- Tailwind CSS for styling (already in tech stack)
- Radix UI for accessible form components (already in tech stack)

## Out of Scope

- **Automatic email fetching**: Users must manually copy/paste emails; no email API integration or inbox access
- **Multi-currency support**: Only USD parsing in Phase 1; EUR, GBP, CAD deferred to later phases
- **Non-English emails**: Only English-language emails supported in Phase 1
- **Email forwarding**: No ability to forward emails to a PayPlan address for automatic parsing
- **OCR/image parsing**: Cannot parse screenshots of emails, only text content
- **Server-side storage**: All parsing and storage happens client-side; no cloud sync
- **Payment verification**: System does not verify with BNPL provider APIs whether data is accurate
- **Automatic updates**: If a BNPL provider changes email format, users must wait for a PayPlan update
- **Custom BNPL providers**: Only the 6 major providers supported; no support for small regional providers
- **Partial payment parsing**: Cannot handle emails that only mention "remaining balance" without full schedule
- **Email authentication**: No verification that email is genuinely from a BNPL provider (user responsibility)
- **Bulk import**: Cannot parse multiple emails at once; must parse one at a time
- **Export parsed data**: Cannot export payment schedules back to email or other formats (covered by separate export feature)

## Technical Notes

- **Parser Architecture**: Modular design with one parser module per provider (`lib/parsers/klarna.ts`, `lib/parsers/affirm.ts`, etc.) and a router that detects provider from email content
- **Regex Patterns**: Use provider-specific regex to extract merchant names, amounts, dates, and installment counts. Patterns should be maintained in separate files for easy updates.
- **HTML Stripping**: Use DOM parser or regex to remove HTML tags while preserving text structure and line breaks
- **Date Parsing**: Support multiple date formats (MM/DD/YYYY, Month Day, Year, etc.) and normalize to ISO 8601 for storage
- **Privacy**: All parsing happens in browser memory and localStorage. No email content sent to server. No PII logging.
- **Error Handling**: Graceful degradation - if one field fails to parse, attempt to parse others and show partial results with warnings
- **Validation**: Use Zod schemas to validate extracted data before saving (e.g., amounts > 0, dates in future, installment count > 0)
- **Storage Schema**: Store each payment schedule as JSON object with unique ID, provider name, merchant, total, installments array, created timestamp

## Example Email Formats (Reference)

### Klarna

```text
Subject: Your purchase at Target

Your purchase at Target for $200.00 in 4 payments

Payment 1: $50.00 due Nov 1, 2025
Payment 2: $50.00 due Nov 15, 2025
Payment 3: $50.00 due Nov 29, 2025
Payment 4: $50.00 due Dec 13, 2025
```

### Affirm

```text
Subject: Your Affirm purchase of $500.00 at Best Buy

Your Affirm purchase of $500.00 at Best Buy

6 monthly payments of $83.33
First payment: Nov 1, 2025
APR: 0%
```

### Afterpay

```text
Subject: Your Afterpay order at Nike for $150.00

Your Afterpay order at Nike for $150.00

4 payments of $37.50 every 2 weeks
Payment 1: Nov 1, 2025
Payment 2: Nov 15, 2025
Payment 3: Nov 29, 2025
Payment 4: Dec 13, 2025
```

(Similar patterns for Sezzle, Zip, PayPal Credit)
