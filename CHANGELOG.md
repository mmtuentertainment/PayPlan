# Changelog

All notable changes to PayPlan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
