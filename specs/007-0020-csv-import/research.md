# Research: CSV Import MVP

**Feature**: 007-0020-csv-import
**Date**: 2025-10-08
**Status**: Complete

## Overview

All technical decisions for this feature were provided in the user requirements. This document consolidates those decisions with rationale for future reference.

## Research Questions & Answers

### 1. CSV Parsing Strategy

**Question**: Should we use a CSV parsing library or implement simple string splitting?

**Answer**: Simple string splitting (no library)

**Research Findings**:
- **User Constraint**: "CSV MVP format: comma-delimited; no quotes/commas-in-fields"
- **LOC Budget**: ≤180 LOC total; library would consume 0 LOC but parser would still need 10-15 LOC for validation
- **Complexity**: Full RFC 4180 support (quotes, escapes, embedded commas) adds ~50-80 LOC
- **Popular libraries**:
  - `papaparse`: 45KB minified, full RFC 4180 support (over-engineered for MVP)
  - `csv-parse/browser/esm`: 12KB, still adds bundle overhead
  - Native `split()`: 0KB, 15-20 LOC for simple format

**Decision**: Manual parsing with `split('\n')` and `split(',')` plus header validation

**Implementation approach**:
```typescript
// ~15 LOC total
function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  // Validate headers match: provider,amount,currency,dueISO,autopay
  return lines.slice(1).map(line => {
    const values = line.split(',');
    // Map values to object by header position
  });
}
```

**Alternatives Rejected**:
- `papaparse`: Rejected due to bundle size and over-engineering
- `csv-parse`: Rejected due to unnecessary complexity for simple format
- Full RFC 4180 implementation: Rejected as out of scope for MVP

### 2. Data Flow Architecture

**Question**: Convert CSV directly to normalized items or create synthetic emails?

**Answer**: Direct conversion to normalized items (if orchestrator supports), otherwise minimal synthetic emails

**Research Findings**:
- **Existing orchestrator**: `extractItemsFromEmails(emails: string[])` currently accepts email strings
- **Type checking**: Need to verify if orchestrator can accept `NormalizedItem[]` directly
- **LOC impact**:
  - Direct conversion: ~10 LOC (simple object mapping)
  - Synthetic email generation: ~25 LOC (string templates per row)

**Decision**:
1. First, check if orchestrator has alternative signature accepting normalized items
2. If yes, use direct conversion
3. If no, create minimal synthetic email strings (just payment details, no prose)

**Implementation approach** (synthetic email fallback):
```typescript
function csvRowToEmail(row: CSVRow): string {
  return `Payment from ${row.provider}: ${row.currency} ${row.amount} due ${row.dueISO}, autopay: ${row.autopay}`;
}
```

**Alternatives Rejected**:
- Full email template generation: Rejected as unnecessary (adds ~40 LOC for no benefit)
- Custom orchestrator variant: Rejected to avoid modifying extraction logic (out of scope)

### 3. Risk Detection Scope

**Question**: Which risks should be detected for CSV imports?

**Answer**: COLLISION and WEEKEND_AUTOPAY only (no CASH_CRUNCH)

**Research Findings**:
- **User constraint**: "Risks: COLLISION, WEEKEND_AUTOPAY only (no CASH_CRUNCH)"
- **Existing risk detectors**: All three risk types already implemented in demo flow
- **CSV context**: No paycheck data in CSV format, so CASH_CRUNCH impossible to calculate

**Decision**: Reuse existing COLLISION and WEEKEND_AUTOPAY detection; exclude CASH_CRUNCH

**Rationale**:
- COLLISION: Detectable from CSV (multiple payments same date)
- WEEKEND_AUTOPAY: Detectable from CSV (autopay=true + weekend due date)
- CASH_CRUNCH: Requires paycheck dates (not in CSV schema)

**Implementation**: Zero new code - orchestrator already handles risk detection

**Alternatives Rejected**: None - decision is mandatory per requirements

### 4. ICS Calendar Generation

**Question**: How should ICS files be generated for CSV imports?

**Answer**: Reuse 0019 ICS logic, no VALARM/reminder in MVP

**Research Findings**:
- **User constraint**: "ICS: generate without TZID header (match 0019); no VALARM/reminder in MVP"
- **Existing code**: `Demo.tsx` already has ICS generation using `ics` library
- **Reminder impact**: VALARM adds ~15-20 LOC and complexity

**Decision**: Copy ICS generation pattern from Demo.tsx, ensure no VALARM component

**Implementation approach**:
```typescript
// Reuse from Demo.tsx, ~20-25 LOC
function generateICS(items: ScheduleResult[]): string {
  const events = items
    .filter(isThisWeek)  // Filter to current ISO week
    .map(item => ({
      start: parseDate(item.due_date),
      title: `${item.provider} ${item.amount}`,
      description: formatRisks(item.risks),
      // NO VALARM/reminder in MVP
    }));
  return createEvents(events).value;
}
```

**Alternatives Rejected**:
- Add VALARM/reminders: Rejected as out of MVP scope (can add in future)
- Different ICS library: Rejected - `ics` already in dependencies

### 5. "This Week" Time Window

**Question**: How should "This Week" be calculated for ICS filtering?

**Answer**: Current ISO week (Mon-Sun) in America/New_York timezone, explicit calculation

**Research Findings**:
- **User constraint**: "ISO Mon–Sun in America/New_York (explicit calc, not startOf('week'))"
- **Rationale**: Avoid locale ambiguity in Luxon's `startOf('week')` (some locales start Sunday)
- **Timezone**: America/New_York for consistency with backend risk detection

**Decision**: Explicit date math for ISO week boundaries

**Implementation approach**:
```typescript
// ~10 LOC
function getISOWeekBounds(now: DateTime): [DateTime, DateTime] {
  const dayOfWeek = now.weekday; // 1=Mon, 7=Sun in ISO
  const weekStart = now.minus({ days: dayOfWeek - 1 }).startOf('day');
  const weekEnd = weekStart.plus({ days: 6 }).endOf('day');
  return [weekStart, weekEnd];
}
```

**Alternatives Rejected**:
- Luxon `startOf('week')`: Rejected due to locale ambiguity
- Calendar week (Sun-Sat): Rejected in favor of ISO standard

### 6. Import Path Constraints

**Question**: Which modules can be imported in Import.tsx?

**Answer**: Only `frontend/src/lib/extraction/**` and `frontend/src/lib/email-extractor.ts`

**Research Findings**:
- **User constraint**: "Respect ESLint import rules (only frontend/src/lib/extraction/** and email-extractor.ts)"
- **Existing ESLint config**: Enforces modular import boundaries
- **Available modules**:
  - `email-extractor.ts` - orchestrator entry point
  - `extraction/**` - provider parsers, risk detectors, normalizers

**Decision**: Import only from allowed paths; reuse demo page UI components via copy-paste if needed

**Verification**: ESLint `pnpm -C frontend lint` must pass

**Alternatives Rejected**: None - constraint is non-negotiable

## Technology Stack Summary

All technologies already in use - no new dependencies:

| Technology | Version | Purpose | Source |
|------------|---------|---------|--------|
| TypeScript | 5.x | Type safety | Existing |
| React | 19.1.1 | UI framework | Existing |
| React Router | 7.9.3 | Routing (`/import` route) | Existing |
| Vite | Latest | Build tool | Existing |
| Vitest | Latest | Testing framework | Existing |
| `ics` | 3.8.1 | ICS calendar generation | Existing (0019) |
| `luxon` | 3.7.2 | Timezone handling | Existing |
| `email-extractor.ts` | N/A | Orchestrator | Existing |
| `extraction/**` | N/A | Risk detection modules | Existing |

**New Dependencies**: None

## Performance Targets

Based on user constraints and existing system performance:

| Operation | Target | Rationale |
|-----------|--------|-----------|
| CSV parsing | <100ms for 20 rows | Simple string operations |
| Extraction | <1s for 20 items | Reuses existing extractor (already tested) |
| ICS generation | <100ms | Lightweight library, 20 events max |
| Total UX | <1.5s upload-to-results | Sum of above |

**Verification**: Manual testing with 20-row CSV fixture

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSV parsing complexity | Low | Medium | Constrain to simple format; reject complex CSVs with error |
| LOC budget overrun | Medium | High | Target 150 LOC (30 LOC buffer); prioritize minimal implementation |
| Import path violations | Low | High | Verify with ESLint before commit; automated CI check |
| Network requests (forbidden) | Low | Medium | Manual DevTools verification; integration test assertion |
| ICS compatibility | Low | Medium | Reuse proven 0019 approach; test with calendar apps |

## Open Questions

None - all technical decisions finalized per user requirements.

## References

- User requirements: `/specs/007-0020-csv-import/spec.md`
- Existing demo mode: `/specs/006-0019-demo-mode/`
- Email extractor: `frontend/src/lib/email-extractor.ts`
- ESLint config: `frontend/.eslintrc.js` or `frontend/eslint.config.js`

---
**Research Complete**: 2025-10-08
**Next Phase**: Phase 1 (Design & Contracts)
