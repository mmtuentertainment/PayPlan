# Feature Specification: CSV Import Safety & Accessibility Hardening

**Feature Branch**: `008-0020-1-csv`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "0020.1-csv-hardening — Patch-grade CSV Import safety & a11y (docs+frontend, reversible)"

## Execution Flow (main)

```plaintext
1. Parse user description from Input
   → Feature: Harden CSV Import page with safety checks and accessibility improvements
2. Extract key concepts from description
   → Actors: Users uploading CSV files
   → Actions: Parse CSV, validate dates, enforce limits, display errors, download ICS
   → Data: CSV rows (provider, amount, currency, dueISO, autopay)
   → Constraints: Client-only, ≤4 files, ≤140 LOC (target ≤90), reversible
3. For each unclear aspect:
   → Max file size: 1MB (1,048,576 bytes)
   → Max rows: 1000
4. Fill User Scenarios & Testing section
   → 6 acceptance scenarios defined
5. Generate Functional Requirements
   → 7 functional requirements (FR-001 through FR-007)
6. Identify Key Entities
   → CSV Row, Parse Result
7. Run Review Checklist
   → All clarifications resolved
   → No implementation details (WHAT only, no HOW)
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

A user visits the CSV Import page to upload a CSV file containing their BNPL installment data. The system validates the file for size and row limits, checks that all dates are valid calendar dates, and provides clear, actionable error messages if validation fails. When validation succeeds, the system parses the CSV, displays a payment schedule with risk analysis, and allows the user to download an ICS calendar file — all without requiring authentication or making network calls.

### Acceptance Scenarios

1. **Given** a valid CSV file with real calendar dates, **When** user uploads the file, **Then** the system parses all rows, displays the payment schedule, shows risk analysis (COLLISION, WEEKEND_AUTOPAY), enables ICS download, and makes no network calls.

2. **Given** a CSV file with an invalid date value (e.g., 2025-13-45), **When** user uploads the file, **Then** the system displays a single-line error message "Invalid date in row X: 2025-13-45", keeps the page usable, and makes no network calls.

3. **Given** a CSV file larger than 1MB or with more than 1000 rows, **When** user uploads the file, **Then** the system displays an error message ("CSV too large" or "Too many rows"), does not crash, and makes no network calls.

4. **Given** the CSV Import page is loaded, **When** a screen reader user navigates the page, **Then** the file input has an associated `<label>`, the error region has `role="alert" aria-live="polite"`, and the results table has a screen-reader-accessible `<caption>`.

5. **Given** the CSV Import page with parsed results, **When** user interacts with buttons (upload, clear, download ICS), **Then** all buttons have `type="button"` to prevent accidental form submission.

6. **Given** a CSV file with invalid delimiters (e.g., semicolons instead of commas), **When** user uploads the file, **Then** the system displays a single-line "parse failure" error, keeps the page usable, and makes no network calls.

### Edge Cases

- What happens when a CSV file is uploaded with valid format but empty rows?
  → System parses only non-empty rows; empty rows are ignored silently.

- What happens when a user uploads a CSV with exactly 1000 rows versus 1001 rows?
  → 1000 rows: success. 1001 rows: error "Too many rows (max 1000)".

- What happens when a CSV file is exactly 1,048,576 bytes versus 1,048,577 bytes?
  → 1,048,576 bytes: success. 1,048,577 bytes: error "CSV too large (max 1MB)".

- What happens when CSV input contains spreadsheet formula characters (=, +, -, @)?
  → System treats these inputs as plain text in the UI; no formula execution occurs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST validate all date values in the CSV for both ISO-8601 format conformance and real calendar validity (reject invalid dates like 2025-13-45 or 2025-02-30).

- **FR-002**: System MUST enforce file size limit of 1MB (1,048,576 bytes) and row count limit of 1000 non-empty rows, displaying single-line error messages ("CSV too large (max 1MB)" or "Too many rows (max 1000)") when limits are exceeded.

- **FR-003**: System MUST provide accessibility affordances: file input MUST have an associated `<label>`, error display region MUST use `role="alert" aria-live="polite"`, and results table MUST have a screen-reader-accessible `<caption>`.

- **FR-004**: System MUST parse CSV files using simple comma-delimited format (no support for quoted fields containing commas) and MUST display single-line clear error messages when parse failures occur. Inputs beginning with spreadsheet formula characters (=, +, -, @) or containing HTML-like tags (e.g., `<script>`) MUST be treated and rendered as plain text (no formula execution, no XSS).

- **FR-005**: System MUST perform all operations client-side without making network calls, collecting PII, or requiring authentication. Zero PII: do not collect, store, or transmit any personal data.

- **FR-006**: System MUST preserve existing ICS calendar generation behavior (no VALARM reminders); timezone handling unchanged.

- **FR-007**: System MUST include test coverage for: invalid date values, oversize files, over-row-count files, presence of accessibility roles/labels (`<label>`, `role="alert"`, `<caption>`), buttons render with `type="button"`, formula-prefix inputs (=, +, -, @) and HTML-like tags rendered as plain text, and verification that no network calls occur during upload/parse (e.g., spy on fetch).

### Constraints

- Client-only changes (no backend/API modifications)
- Patch-level budget: ≤4 files touched, ≤140 LOC (target ≤90)
- Reversible via single revert
- **No new dependencies**
- Respect ESLint path guards (imports only from frontend/src/lib/extraction/** and email-extractor.ts)
- Keep existing tests green; add focused tests only for new guarantees

### Key Entities *(include if feature involves data)*

- **CSV Row**: Represents a single installment payment with attributes: provider (string), amount (numeric), currency (3-letter code), dueISO (ISO-8601 date string), autopay (boolean). Must pass date validation and be included in row count limit.

- **Parse Result**: Represents the outcome of CSV parsing with two components: `rows[]` (array of valid CSV Row entities) and `errors[]` (array of validation error messages). Errors are displayed as single-line messages to the user; valid rows proceed to schedule rendering and risk analysis.

---

## Review & Acceptance Checklist

*GATE: Automated checks run during main() execution*

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded (≤4 files, ≤140 LOC, reversible, client-only, no network)
- [x] Dependencies and assumptions identified (existing CSV Import page, ICS generation)

---

## Execution Status

*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (clarifications resolved: 1MB = 1,048,576 bytes; 1000 rows)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
