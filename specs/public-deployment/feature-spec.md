# Feature Specification: PayPlan v0.1 Public Deployment

**Feature Branch**: `002-public-deployment`
**Created**: 2025-09-30
**Status**: Clarified - Ready for Planning
**Input**: User description: "Ship PayPlan v0.1 publicly: deploy POST /plan as a Vercel serverless function and add a one-page landing with a live pastebox calling /plan (sample CSV prefilled), 'Download .ics' demo, privacy page, and README/openapi links. Non-goals: auth, billing. Success: public URL live; a new user pastes ≥5 items and downloads an .ics in <60s."

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A consumer with multiple BNPL payment obligations discovers PayPlan through a link shared on social media, Reddit, or a personal finance blog. They land on the homepage, see a clear value proposition, and immediately notice a pre-filled sample showing how the tool works. They clear the sample, paste their own payment data (from a CSV they prepared or by following the format), click a button to generate their plan, and within seconds receive a personalized weekly action plan with risk warnings. They download the .ics calendar file, import it to Google Calendar or Apple Calendar, and now have automatic reminders for all their BNPL payments. The entire process takes less than 60 seconds.

### Acceptance Scenarios

1. **Given** a new user visits the PayPlan homepage for the first time, **When** the page loads, **Then** they see:
   - Clear headline explaining what PayPlan does
   - Pre-filled sample CSV data in the input area
   - Large "Generate Plan" button
   - Links to privacy policy and documentation

2. **Given** a user has the sample data loaded, **When** they click "Generate Plan", **Then** the system:
   - Calls POST /plan with the sample data
   - Displays loading indicator
   - Shows results within 5 seconds
   - Displays weekly action plan, risk flags, and summary

3. **Given** a plan has been generated, **When** the user clicks "Download Calendar (.ics)", **Then** they:
   - Receive an .ics file download
   - Can import it to any calendar application
   - See payment reminders with 24-hour advance notifications

4. **Given** a user wants to use their own data, **When** they clear the sample and paste ≥5 CSV rows, **Then** they:
   - See their data in the textarea
   - Can adjust timezone and payday settings
   - Generate a personalized plan
   - Download their custom .ics file
   - Complete the entire flow in <60 seconds

5. **Given** a privacy-conscious user, **When** they click "Privacy Policy", **Then** they see:
   - Clear statement that no data is stored
   - Explanation that processing happens in-memory only
   - Confirmation that data is discarded after response
   - No tracking, no cookies, no analytics (beyond basic hosting metrics)

6. **Given** a developer or power user, **When** they click "API Documentation", **Then** they:
   - Access the OpenAPI specification
   - See example curl commands
   - Can integrate the API into their own tools

### Edge Cases
- What happens when user pastes invalid CSV format?
- How does the system handle mobile users (small screens)?
- What if the Vercel function times out?
- How are errors displayed to users?
- What happens if user pastes 0 rows or only 1-2 rows?
- How does the page handle slow internet connections?
- What if user's browser blocks file downloads?
- How are different timezones handled in the UI?

---

## Requirements

### Functional Requirements

**Serverless Deployment**
- **FR-001**: System MUST deploy POST /plan endpoint as a Vercel serverless function
- **FR-002**: Function MUST respond within 10 seconds (Vercel free tier timeout)
- **FR-003**: Function MUST handle CORS for browser requests from the landing page domain
- **FR-004**: Function MUST return appropriate error responses (400, 500) with user-friendly messages
- **FR-005**: Function MUST NOT persist any user data to disk or database

**Landing Page - Core Interface**
- **FR-006**: Page MUST display a clear headline explaining PayPlan's purpose ("Manage your BNPL payments, avoid late fees")
- **FR-007**: Page MUST include a large textarea pre-filled with sample CSV data (5+ rows, multiple providers)
- **FR-008**: Sample data MUST demonstrate collision risk, cash crunch, and weekend autopay scenarios
- **FR-009**: Page MUST include input fields for:
  - Timezone selector (dropdown with common timezones)
  - Payday option selector (explicit dates OR cadence + next payday)
  - Min buffer amount (number input)
- **FR-010**: Page MUST include a prominent "Generate Plan" button
- **FR-011**: Page MUST display loading indicator while API call is in progress
- **FR-012**: Page MUST show "Clear Sample" button to help users replace the prefilled data

**Landing Page - Results Display**
- **FR-013**: After successful API call, page MUST display:
  - Plain-English summary (6-8 bullet points)
  - Weekly actions list (prioritized)
  - Risk flags with emoji indicators
  - "Download Calendar (.ics)" button
- **FR-014**: Results section MUST be visually distinct from input section
- **FR-015**: Page MUST allow users to edit inputs and regenerate plan without page reload
- **FR-016**: "Download Calendar (.ics)" button MUST trigger immediate .ics file download
- **FR-017**: Downloaded .ics filename MUST be descriptive (e.g., "payplan-2025-09-30.ics")

**Landing Page - Error Handling**
- **FR-018**: Page MUST display user-friendly error messages for:
  - Invalid CSV format (missing columns, wrong format)
  - Network errors (API unreachable)
  - Timeout errors (API took too long)
  - Validation errors (invalid timezone, missing required fields)
- **FR-019**: Error messages MUST include suggestions for fixing the issue
- **FR-020**: Page MUST NOT crash or freeze on errors

**Landing Page - User Experience**
- **FR-021**: Page MUST be responsive (works on mobile, tablet, desktop)
- **FR-022**: Page MUST load within 3 seconds on standard broadband
- **FR-023**: Page MUST include a "CSV Format Help" section explaining required columns
- **FR-024**: Page MUST show an example row with annotations
- **FR-025**: Page MUST work without JavaScript for basic content (progressive enhancement)

**Privacy Page**
- **FR-026**: System MUST provide a dedicated privacy policy page at /privacy
- **FR-027**: Privacy page MUST clearly state:
  - "We do not store your payment data"
  - "All processing happens in-memory on our servers"
  - "Your data is discarded immediately after generating your plan"
  - "We do not use cookies or tracking scripts"
  - "We do not collect personal information"
- **FR-028**: Privacy page MUST be linked from the landing page footer
- **FR-029**: Privacy page MUST be accessible via direct URL

**Documentation Links**
- **FR-030**: Landing page footer MUST include links to:
  - README (GitHub or hosted version)
  - OpenAPI specification (hosted or raw GitHub)
  - Privacy Policy
  - Source code (GitHub repository)
- **FR-031**: All external links MUST open in new tab/window

**Success Criteria**
- **FR-032**: Complete user flow (land → paste data → generate → download .ics) MUST complete in <60 seconds for typical user
- **FR-033**: System MUST successfully process ≥5 installments from CSV input
- **FR-034**: Generated .ics file MUST be importable to Google Calendar, Apple Calendar, and Outlook

### Non-Functional Requirements

**Performance**
- **NFR-001**: Landing page initial load: <3 seconds
- **NFR-002**: API response time: <5 seconds for typical requests (5-20 installments)
- **NFR-003**: Page MUST remain responsive during API calls (no blocking)

**Availability**
- **NFR-004**: System SHOULD have 99% uptime (Vercel's SLA)
- **NFR-005**: System MUST gracefully handle Vercel cold starts (first request may be slower)

**Security & Privacy**
- **NFR-006**: No user data MUST be logged or stored
- **NFR-007**: HTTPS MUST be enforced for all connections
- **NFR-008**: CORS MUST be properly configured to prevent unauthorized domains

**Accessibility**
- **NFR-009**: Landing page MUST meet WCAG 2.1 AA standards
- **NFR-010**: All interactive elements MUST be keyboard accessible
- **NFR-011**: Color contrast MUST meet accessibility guidelines

**Browser Support**
- **NFR-012**: Page MUST work in Chrome, Firefox, Safari, Edge (last 2 versions)
- **NFR-013**: Page SHOULD degrade gracefully in older browsers

### Key Entities

- **Landing Page**: Single-page web application that serves as the user interface for PayPlan. Contains:
  - Input section (textarea, timezone, payday options)
  - Generate button
  - Results display area
  - Download button
  - Help/documentation links
  - Footer with privacy policy

- **Vercel Serverless Function**: Deployed POST /plan endpoint. Properties:
  - Stateless execution
  - 10-second timeout (free tier)
  - CORS-enabled
  - Returns JSON response

- **Sample Data**: Pre-filled CSV example showing:
  - 5-6 installments
  - Mixed providers (Klarna, Affirm, Afterpay)
  - At least one collision
  - Cash crunch scenario
  - Weekend autopay payment

- **Privacy Policy Page**: Static page explaining data handling. Contains:
  - No data storage statement
  - In-memory processing explanation
  - No tracking/cookies statement
  - Contact information (if applicable)

- **ICS Download**: Generated calendar file delivered to user. Properties:
  - .ics file format
  - Descriptive filename
  - TZID matching user's timezone
  - 24-hour advance reminders
  - Importable to major calendar apps

---

## Success Criteria

**Primary Success Metric**: A new user lands on the PayPlan homepage, pastes ≥5 BNPL payment rows (or uses the sample), generates a plan, and downloads an .ics calendar file in under 60 seconds.

**Additional Success Indicators**:
- Public URL is live and accessible (e.g., payplan.vercel.app)
- Sample data demonstrates all risk types
- Generated .ics file imports successfully to Google/Apple/Outlook calendars
- Privacy page clearly communicates no data storage
- Documentation links work and provide useful information
- Mobile users can complete the full flow
- Page loads quickly (<3 seconds)
- Error messages are helpful, not cryptic

**Out of Scope for v0.1**:
- User authentication or accounts
- Payment processing or billing
- Data persistence or history
- Email notifications
- Mobile native apps
- Backend admin panel
- Analytics dashboard
- Rate limiting or API quotas
- Custom domain (using Vercel subdomain is fine)
- SEO optimization or marketing site
- Blog or content pages
- Customer support chat
- Integration with BNPL provider APIs

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Clarifications needed (see below)

---

## Clarifications Resolved

### Session 1: 2025-09-30

**Q1: CSV Input Format** - Should the landing page accept CSV as a file upload, or only as pasted text in a textarea?

**A1:** Support BOTH textarea paste AND .csv file upload. Accept text/csv only; max 2,000 lines; validate headers: `provider,installment_no,due_date,amount,currency,autopay,late_fee`. If both provided, prefer file upload and mirror parsed rows into the textarea preview.
→ **Integrated into:** FR-007, FR-012, New FR-035

**Q2: Timezone Selection** - How should users select their timezone?

**A2:** Auto-detect browser IANA TZ on load; show "Detected: <TZ>" chip. Provide an override Select with common TZs + search. All calculations and ICS use the chosen TZ.
→ **Integrated into:** FR-009, New FR-036

**Q3: Payday Input UI** - How should users input their payday schedule on the landing page?

**A3:** RadioGroup switch with two exclusive panels:
- A) "Explicit dates" → single-line Input for comma-separated ISO dates (YYYY-MM-DD), with helper text and validation.
- B) "Cadence" → Select {weekly|biweekly|semimonthly|monthly} + Date Input for "Next payday".
Only one mode is active at a time.
→ **Integrated into:** FR-009, New FR-037

**Q4: Sample Data Realism** - Should the sample data use real provider names (Klarna, Affirm) or fictional ones?

**A4:** Use real provider names (Klarna, Affirm, Afterpay, PayPal Pay in 4, Zip, Sezzle) for realism. Include a single-click "Use Sample CSV" button that fills the textarea.
→ **Integrated into:** FR-008, New FR-038

**Q5: OpenAPI Documentation Hosting** - Where should the OpenAPI spec be hosted?

**A5:** Serve /openapi.yaml as a static file. Provide /docs route with Swagger UI pointing at /openapi.yaml.
→ **Integrated into:** FR-030, New FR-039

**Q6: Vercel Function Route** - What should the API endpoint path be on Vercel?

**A6:** Vercel convention: deploy the function at /api/plan. Frontend calls POST /api/plan with JSON body.
→ **Integrated into:** FR-001, FR-006

**Q7: Error Display** - How should errors be shown to users?

**A7:** Inline Alert (destructive) below the input area with ARIA live region. Field-level errors under controls; disable CTA until required errors are resolved.
→ **Integrated into:** FR-018, FR-019, New FR-040

**Q8: "Clear Sample" vs "Use My Data"** - How should users transition from sample to their own data?

**A8:** When the user types in the textarea or uploads a file, automatically replace the sample and mark "Edited" in a subtle Badge.
→ **Integrated into:** FR-012, New FR-041

---

## Additional Requirements from Clarifications

**CSV Input**
- **FR-035**: System MUST support both textarea paste AND .csv file upload via Tabs component
- **FR-035a**: File upload MUST accept only text/csv files, max 2,000 lines
- **FR-035b**: System MUST validate CSV headers match: `provider,installment_no,due_date,amount,currency,autopay,late_fee`
- **FR-035c**: When file is uploaded, system MUST mirror parsed rows into textarea preview
- **FR-035d**: File upload MUST support drag-and-drop

**Timezone**
- **FR-036**: System MUST auto-detect browser IANA timezone on page load
- **FR-036a**: System MUST display detected timezone in a Chip component: "Detected: America/New_York"
- **FR-036b**: System MUST provide Select with common timezones + search to override

**Payday Input**
- **FR-037**: System MUST provide RadioGroup with two exclusive payday input modes
- **FR-037a**: "Explicit dates" mode: single-line Input accepting comma-separated ISO dates (YYYY-MM-DD)
- **FR-037b**: "Cadence" mode: Select {weekly|biweekly|semimonthly|monthly} + Date Input for "Next payday"
- **FR-037c**: Only one payday input mode is active at a time

**Sample Data**
- **FR-038**: Sample CSV MUST use real provider names: Klarna, Affirm, Afterpay, PayPal Pay in 4, Zip, Sezzle
- **FR-038a**: System MUST include "Use Sample CSV" button that fills textarea with sample data

**Documentation**
- **FR-039**: System MUST serve /openapi.yaml as static file
- **FR-039a**: System MUST provide /docs route with Swagger UI rendering /openapi.yaml

**Error Handling**
- **FR-040**: Errors MUST display as inline Alert component with `variant="destructive"` and `aria-live="polite"`
- **FR-040a**: Field-level validation errors MUST appear below respective controls
- **FR-040b**: "Build Plan" button MUST be disabled until all required field errors are resolved

**Auto-Clear Sample**
- **FR-041**: System MUST automatically replace sample data when user types in textarea or uploads file
- **FR-041a**: System MUST display "Edited" Badge when sample data is modified

---

## UI Blueprint (from Clarifications)

**Landing Page Structure** (shadcn/ui + Tailwind):

- **Header**: Brand "PayPlan", right-aligned links: Docs (/docs), Privacy (/privacy)

- **Hero Card**:
  - Title: "All your BNPL due dates, one plan."
  - Sub: "Paste your payments → get this week's actions + a unified calendar."
  - Buttons: [Use Sample CSV] [Clear]

- **Input & Controls Card**:
  - Tabs: [Paste CSV] [Upload CSV]
    - Paste CSV: Textarea (monospace, 12-16 rows, resizable-y)
    - Upload CSV: Input type="file" accept=".csv" with drag/drop
  - Separator
  - Paydays (RadioGroup):
    - Option 1: Explicit Dates → Input placeholder="2025-10-01, 2025-10-15, 2025-10-29"
    - Option 2: Cadence → Select + Date Input
  - Timezone:
    - Chip: "Detected: America/New_York"
    - Select with search to override
  - Buffer:
    - Input type="number" suffix="USD" default=100
  - Actions:
    - Button "Build Plan" size="lg"
    - Button "Download .ics" variant="secondary" (initially disabled)
  - Errors:
    - Alert variant="destructive" aria-live="polite" (hidden by default)

- **Results** (renders after 200 OK):
  - Left Column Card: "This Week"
    - Ordered list of prioritized actions with chips
    - Button "Copy Plan"
  - Right Column Card: "Risk Flags"
    - Badges for COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY
  - Full-width Card: "Summary"
    - 6-8 bullet points
  - Table Card: "Normalized Schedule"
    - Columns: Provider | Due Date | Amount | Autopay | Late Fee
  - ICS: Enable Download button with "Added alarms 24h prior" hint

**Accessibility**:
- All interactive elements keyboard-focusable with visible focus rings
- Textarea labeled; file input has drop-zone instructions with aria-describedby
- Buttons have disabled states during request; show loading spinner
- Errors and success messages use role="alert"
- Mobile: stack Cards; desktop: two-column grid for Results

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (all 8 clarifications resolved)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (<60 seconds, ≥5 items, .ics download)
- [x] Scope is clearly bounded (no auth, no billing, single page)
- [x] Dependencies identified (Vercel deployment, existing POST /plan API, shadcn/ui)

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Clarifications obtained and integrated
- [x] UI blueprint documented
- [x] Review checklist passed

**Status**: ✅ **READY FOR PLANNING PHASE**