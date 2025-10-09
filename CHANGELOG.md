# Changelog

All notable changes to PayPlan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.6-a.2] - 2025-10-09

### Added
- **CSV Import v1.1 — Currency Regex + Clear Button**: Enhanced validation and UX improvements
  - Strict currency validation: `^[A-Z]{3}$` regex after `.trim().toUpperCase()` normalization
    - Accepts: USD, EUR, GBP, lowercase variants (e.g., `usd` → `USD`), whitespace variants (e.g., ` USD ` → `USD`)
    - Rejects: 2-letter codes (`US`), 4-letter codes (`USDX`), special characters (`U$D`), numbers
  - New **Clear** button after **Process CSV** (keyboard accessible: Enter/Space)
    - Resets file, error, results, and DOM input value
    - Button type: `type="button"` (prevents form submission)
    - DOM order: Process CSV → Clear → Download .ics
  - Improved error messaging: `"Invalid currency code in row X: <value> (expected 3-letter ISO 4217 code)"`
    - Includes original invalid value for easier debugging

### Testing
- 19 integration tests passing (7 currency validation, 8 Clear button, 4 accessibility)
- Coverage includes: CRLF line endings, case normalization, whitespace handling, keyboard navigation
- Network isolation enforced via test spies with proper cleanup

### Quality & Accessibility
- WCAG 2.2 baseline maintained (label association, alert region, table caption)
- Keyboard accessibility: Enter and Space key activation for Clear button
- Zero new dependencies, zero network calls
- Pattern-only currency validation (intentional design to avoid client-side ISO 4217 list drift)

### Technical Details
- Files touched: 3 (frontend/src/pages/Import.tsx, tests, delta doc)
- LOC delta: +14 code, +425 tests (target ≤140 code, cap ≤140)
- Single revert capability: `git revert 576d9e9`
- Constitution compliant: ≤4 files, ≤140 LOC, reversible, zero network
- Test-to-code ratio: 30:1

### Observability Notes
Console filter for currency validation errors: `"Invalid currency code in row"`

Expected user flow:
- Valid CSV (USD/EUR/GBP) → schedule table with risk detection → Download .ics
- Invalid currency (US/USDX/U$D) → error message shows original input
- Clear button → all state resets, file input cleared

### Code Review
- CodeRabbit: Approved (1 fix applied for global mock cleanup)
- Claude Code: ⭐⭐⭐⭐⭐ "Excellent" rating
- All CI checks passing (8/8)

### Related
- PR #23: https://github.com/mmtuentertainment/PayPlan/pull/23
- Linear MMT-13: CSV Import v1.1 (shipped)
- Linear MMT-14: Code review follow-ups (low-priority backlog):
  - Use React ref for file input (React best practice)
  - Add explicit special character currency tests (U$D, €UR, etc.)
  - Review blob URL revocation on Clear (micro-optimization)
- Release: v0.1.6-a.2
- Monitoring guide: `ops/post-merge-monitoring-v1.1.md`

## [v0.1.6-a.1] - 2025-10-09

### Added
- **CSV Import Safety & Accessibility Hardening**: Production-ready safeguards for `/import` page
  - File size limit: 1MB maximum
  - Row count limit: 1000 non-empty rows
  - Delimiter detection: Comma-only (rejects semicolons)
  - Real calendar date validation using Luxon DateTime (catches invalid dates like 2025-02-30)
  - WCAG 2.2 Level A/AA compliance:
    - Label association (`<label for="csv-file-input">`)
    - Error announcements (`role="alert" aria-live="polite"`)
    - Table caption for screen readers
  - CRLF-friendly line splitting for Windows CSV exports
  - UTF-8 BOM handling
  - Per-field whitespace trimming
  - Stale results cleared on errors

### Security
- XSS/formula injection protection: CSV formulas (=, +, -, @) rendered as plain text via React 18+ auto-escaping
- Zero network calls during CSV processing (privacy-first)

### Testing
- 21 integration tests covering all hardening scenarios
- Manual QA verified in production

### Error Messages (Locked Copy)
- E-001: "CSV too large (max 1MB)"
- E-002: "Too many rows (max 1000)"
- E-003: "Parse failure: expected comma-delimited CSV"
- E-004: "Invalid CSV headers. Expected: provider,amount,currency,dueISO,autopay"
- E-007: "Invalid date in row X: YYYY-MM-DD"

### Technical Details
- Files touched: 2 (frontend/src/pages/Import.tsx, tests)
- LOC delta: +31 (target ≤90, cap ≤140)
- No new dependencies (uses existing Luxon)
- Single revert capability: `git revert f670d03`
- Constitution compliant: ≤4 files, ≤140 LOC, reversible, zero network

### Observability Notes
Watch for locked error copy occurrences in console/monitoring to confirm users receive clear feedback:
- "CSV too large (max 1MB)" → file size guard
- "Too many rows (max 1000)" → row count guard
- "Parse failure: expected comma-delimited CSV" → delimiter detection
- "Invalid date in row X: YYYY-MM-DD" → real calendar validation

## [0.1.3-a] - 2025-10-02

### Added
- **📧 Inbox Paste (Email Parser) - Phase A**: Client-side email parser for Klarna & Affirm
  - New "Emails" tab alongside CSV input
  - Paste payment reminder emails directly (no CSV needed)
  - Auto-extract: provider, installment_no, due_date, amount, currency, autopay, late_fee
  - Support for multiple date formats (ISO, US slash, long format with month names)
  - Preview table with extracted payments
  - Inline edit/delete functionality
  - "Copy as CSV" export button
  - Issues list showing validation errors with reasons
  - Keyboard shortcut: Cmd/Ctrl+Enter to extract
- **New Frontend Modules**:
  - `frontend/src/lib/email-extractor.ts` - Core extraction pipeline
  - `frontend/src/lib/provider-detectors.ts` - Klarna & Affirm regex patterns
  - `frontend/src/lib/date-parser.ts` - Luxon date normalization with suspicious date detection
  - `frontend/src/lib/sample-emails.ts` - Demo email data (5 samples)
  - `frontend/src/hooks/useEmailExtractor.ts` - React state management for extraction
  - `frontend/src/components/EmailInput.tsx` - Email textarea with controls
  - `frontend/src/components/EmailPreview.tsx` - Preview table component
  - `frontend/src/components/EmailIssues.tsx` - Validation errors display
- **Test Fixtures**: 6 email samples in `tests/fixtures/emails/`
- **Dependencies**: Added `@types/luxon` for TypeScript support

### Privacy & Security
- ✅ Client-side only extraction (zero network calls until "Build Plan")
- ✅ No localStorage/sessionStorage writes
- ✅ HTML sanitization via DOMParser
- ✅ Input length limits (16k characters)
- ✅ Pasted text never sent to server during extraction

### Limitations (Phase A)
- **Providers**: Klarna & Affirm only (Afterpay, PayPal, Zip, Sezzle in Phase B)
- **Geography**: US market only
- **Format**: Plain text emails (HTML stripped via DOMParser)
- **Installments**: One per email

### Technical Details
- Total LOC: ~400 (frontend-only, no backend changes)
- No new npm dependencies (uses existing Luxon)
- Performance: 50 emails extracted in <2s
- Accessibility: ARIA labels, aria-live regions, keyboard shortcuts

## [0.1.2] - 2025-10-02

### Added
- **Business-Day Awareness**: Automatic shifting of weekend and holiday payment dates to next business day
- **Holiday Calendar Support**: Built-in US Federal holidays for 2025-2026 (11 holidays × 2 years)
- **Custom Skip Dates**: Allow users to specify company closures or personal unavailable dates
- **Shift Tracking UI**: "Shifted" badges in results table with tooltips showing original date and reason
- **New API Fields**:
  - `businessDayMode` (boolean, default: true) - Enable/disable business-day shifting
  - `country` (enum: "US" | "None", default: "US") - Holiday calendar to use
  - `customSkipDates` (array of ISO dates) - Additional dates to skip
- **New Response Fields**:
  - `wasShifted`, `originalDueDate`, `shiftedDueDate`, `shiftReason` in normalized items
  - `movedDates` array with metadata about all shifted payments
- **Informational Risk Flags**: `SHIFTED_NEXT_BUSINESS_DAY` (severity: info) for transparency

### Changed
- Risk detector no longer flags `WEEKEND_AUTOPAY` when `businessDayMode=true`
- ICS calendar events now annotate shifted payments with "(shifted)" in summary
- Action prioritizer includes shift information in descriptions when dates were moved

### Fixed
- Eliminated false WEEKEND_AUTOPAY warnings by shifting weekend dates forward
- Payment processing delays from weekend/holiday due dates

## [0.1.1] - 2025-09-28

### Added
- **RFC 9457 Problem Details**: Standardized error responses with `application/problem+json`
- **Rate Limiting**: 60 requests/hour per IP with sliding window algorithm
- **Idempotency**: Safe request retries via `Idempotency-Key` header (60s cache)
- **Response Headers**: `X-RateLimit-*` headers on all responses
- **Problem Documentation**: `/problems/*` endpoints for error type descriptions

### Changed
- All error responses now use RFC 9457 format
- Frontend client parses `application/problem+json` responses

## [0.1.0] - 2025-09-15

### Added
- Initial public release
- CSV input (paste or upload)
- Multi-provider BNPL support (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- Risk detection: COLLISION, CASH_CRUNCH, WEEKEND_AUTOPAY
- Smart action prioritization (late fees DESC, amount ASC)
- ICS calendar export with 24-hour reminders
- Timezone-aware date handling via Luxon
- Privacy-first architecture (no data storage)
- React + TypeScript frontend with shadcn/ui
- Vercel serverless backend
