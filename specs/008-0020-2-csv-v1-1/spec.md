# Feature Specification: CSV Import v1.1 — Currency Regex + Clear Button

**Feature Branch**: `008-0020-2-csv-v1-1`
**Created**: 2025-10-09
**Status**: Draft
**Input**: "Add strict currency code validation and an explicit Clear button to the CSV Import page. Patch-grade, client-only, reversible. Keep budgets and privacy constraints."

## Execution Flow (main)

```plaintext
1. Parse user description from Input
   → Feature: Add strict currency regex validation and Clear button to CSV Import
2. Extract key concepts from description
   → Actors: Users uploading CSV files with installment data
   → Actions: Validate currency format, reset state via Clear button
   → Data: CSV rows with currency codes (must match ISO 4217 pattern)
   → Constraints: Client-only, ≤4 files, ≤140 LOC (target ≤90), reversible
3. For each unclear aspect:
   → Currency validation: Pattern-only regex ^[A-Z]{3}$ (no server lookups)
   → Clear button label: "Clear"
   → Clear button placement: Adjacent to upload controls (after Upload, before Download ICS)
4. Fill User Scenarios & Testing section
   → 6 acceptance scenarios defined
5. Generate Functional Requirements
   → 7 functional requirements (FR-001 through FR-007)
6. Identify Key Entities
   → CSV Row (with currency field extension)
7. Run Review Checklist
   → All clarifications resolved with defaults
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

A user visits the CSV Import page to upload a CSV file containing their BNPL installment data. The system validates that currency codes match a strict three-letter uppercase pattern (ISO 4217 format), providing a clear error message if validation fails. When the user wants to try a new file, they can use a dedicated Clear button to reset the file input, clear all results, and remove any error messages—all without page reloads or network calls.

### Acceptance Scenarios

1. **Valid CSV + valid currencies**
   **Given** a CSV with currency values that match a three-letter ISO 4217 code pattern (e.g., USD, EUR, GBP),
   **When** user uploads the file,
   **Then** the schedule renders, risks are displayed, ICS download is available, and no network calls occur.

2. **Invalid currency code**
   **Given** a CSV where any currency field is not three uppercase letters (e.g., "usd", "US", "US1", "USDX"),
   **When** user uploads the file,
   **Then** the system displays a single-line error:
   `"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`
   …and the page remains usable with no partial results shown and no network calls made.

3. **Explicit Clear button resets state**
   **Given** parsed results are displayed on screen (or an error message is visible),
   **When** user presses the Clear button,
   **Then** the file chooser value resets, the results table disappears, any error banner is cleared, and the ICS download button is disabled until a new valid upload is processed.

4. **A11y interactions**
   **Given** a screen reader user navigates the page,
   **When** a currency error appears,
   **Then** it is announced via an alert region, the Clear button is keyboard reachable, and all action buttons have `type="button"` to avoid accidental form submission.

5. **No network calls**
   **Given** DevTools Network tab is open,
   **When** user uploads a file or presses Clear,
   **Then** no XHR/fetch requests occur (only initial page assets are loaded).

6. **CRLF-friendly + existing guards still hold**
   **Given** a CSV file with Windows line endings (CRLF) and prior validation constraints (≤1MB; ≤1000 non-empty rows; comma-only delimiter),
   **When** user uploads the file,
   **Then** all existing validations continue to work as before, currency validation integrates seamlessly, and error messages remain unchanged for non-currency failures.

### Edge Cases

- What happens when a user uploads a CSV with lowercase currency codes (e.g., "usd")?
  → System displays: `"Invalid currency code in row 1: usd (expected 3-letter ISO 4217 code)"`

- What happens when a user uploads a CSV with two-letter currency codes (e.g., "US")?
  → System displays: `"Invalid currency code in row 1: US (expected 3-letter ISO 4217 code)"`

- What happens when a user presses Clear before uploading any file?
  → Clear button has no visible effect if no file/results/errors are present; page state is already clean.

- What happens when a user presses Clear after a successful upload with results displayed?
  → File input resets, results table disappears, ICS download button is disabled, and the page returns to initial state.

- What happens when currency validation fails and the user then uploads a valid file?
  → Previous error is cleared, new file is validated, and results render if validation passes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Currency format)**: System MUST validate currency codes using strict regex `^[A-Z]{3}$` at ingestion time. Failures MUST produce the exact error message: `"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`. Pattern-only validation; no server lookups or allowlist checks.

- **FR-002 (Error copy & behavior)**: Currency validation errors MUST be single-line and non-stacking. The page MUST remain usable after an error. No partial schedule rendering is allowed when currency validation fails.

- **FR-003 (Clear control)**: System MUST provide a dedicated Clear button that resets: file input value, in-memory parse results, error state, ICS download enablement, and visible results table. The button MUST have `type="button"` to prevent accidental form submission.

- **FR-004 (A11y affordances)**: The file input MUST have an associated `<label>` element. The error region MUST be announced via an alert live region (`role="alert"`). The results table MUST provide a programmatically associated `<caption>` element for screen reader users.

- **FR-005 (No network)**: All operations (upload, parse, validate, clear, ICS download) MUST be client-only with zero network requests beyond initial page load assets.

- **FR-006 (Compatibility)**: Existing validation guards (file size ≤1MB, row count ≤1000, comma-only delimiter, date validity checks, XSS-safe rendering) MUST remain unchanged in both error message copy and behavior.

- **FR-007 (Tests)**: System MUST include test coverage for: valid/invalid currency codes, Clear button behavior (reset all state), accessibility affordances (label, alert region, caption), and zero-network verification during all operations.

### Non-Goals (v1.1 Scope Control)

- No ISO 4217 allowlist or server-side currency code lookups (pattern-only to avoid code drift and maintain client-only architecture)
- No analytics or instrumentation in this slice (tracked separately in MMT-12)
- No design restyle or layout changes beyond adding the Clear button
- No changes to ICS calendar generation or timezone handling

### Constraints

- Client-only changes (no backend/API modifications)
- Patch-level budget: ≤4 files touched, ≤140 LOC (target ≤90)
- Reversible via single git revert
- **No new dependencies**
- Respect ESLint path guards (imports only from frontend/src/lib/extraction/** and email-extractor.ts)
- Keep existing tests green; add focused tests only for new guarantees
- Maintain WCAG 2.2 Level A/AA accessibility practices

### Key Entities *(include if feature involves data)*

- **CSV Row (extended)**: Represents a single installment payment with attributes:
  - provider (string, non-empty)
  - amount (number, positive)
  - **currency (string, MUST match ^[A-Z]{3}$)** ← NEW VALIDATION
  - dueISO (string, YYYY-MM-DD format, real calendar date)
  - autopay (boolean)

- **UI State**: Represents the current page state:
  - file selection (File object or null)
  - parse results (items array, risks array, or null)
  - error message (string or null)
  - ICS download enabled (boolean)

---

## MUST Clarifications (defaults provided; change only if needed)

The following defaults are pre-confirmed and ready for implementation unless explicitly changed:

1. **Clear button label & placement**:
   - Label: "Clear" (standard, concise)
   - Placement: Adjacent to upload controls, positioned after the "Process CSV" button and before the "Download .ics" button in the logical flow

2. **Error message format**:
   - Currency error text: `"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`
   - No emojis, no prefix styling beyond existing error container
   - Single-line, non-stacking (replaces previous error if present)

3. **Live region behavior**:
   - Keep existing `role="alert" aria-live="polite"` pattern
   - Per ARIA spec, `role="alert"` is implicitly assertive; we will not alter current behavior

4. **Success path copy**:
   - No new success messages or toasts
   - Only the currency error line is added; existing success path rendering is unchanged

---

## Research Notes (2025-10-09)

### Currency Codes (ISO 4217)
ISO 4217 defines three-letter uppercase currency codes (e.g., USD, EUR, GBP). Pattern `^[A-Z]{3}$` is consistent with the standard format. We avoid embedding a live code allowlist to prevent drift in a client-only feature where updates would require code changes.
*Source: [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)*

### CSV Injection Awareness
Formula-injection vectors like `=`, `+`, `-`, `@` are documented by OWASP as potential CSV injection risks. Existing implementation continues rendering all values as plain text (no formula execution).
*Source: [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)*

### WCAG 2.2 Accessibility
"Labels or Instructions" (WCAG 2.2 SC 3.3.2) and associated form guidance remain current for control labeling and error communication. Existing implementation already provides proper labeling.
*Source: [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)*

### ARIA Live Regions
`role="alert"` is an assertive live region with implicit `aria-live="assertive"` and `aria-atomic="true"`. Current implementation uses `aria-live="polite"` explicitly; we maintain existing behavior without changes in this patch.
*Source: [W3C ARIA Alert Role](https://www.w3.org/TR/wai-aria-1.2/#alert)*

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
- [x] Scope is clearly bounded (≤4 files, ≤140 LOC target ≤90, reversible, client-only, no network)
- [x] Dependencies and assumptions identified (existing CSV Import page, currency field validation)

---

## Execution Status

*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (clarifications resolved with defaults: "Clear" button, pattern-only regex)
- [x] User scenarios defined (6 acceptance scenarios)
- [x] Requirements generated (7 functional requirements)
- [x] Entities identified (CSV Row extension, UI State)
- [x] Review checklist passed

---
