# Research: Demo Mode End-to-End

**Feature**: 006-0019-demo-mode | **Date**: 2025-10-07
**Status**: Complete

## Overview

This document consolidates research findings for the Demo Mode feature. Since the user provided comprehensive implementation guidance, most technical decisions are pre-determined. This research validates those decisions against existing codebase patterns.

## Research Questions & Findings

### 1. Email Extraction Orchestrator

**Question**: How does the existing email extractor work? What are the confidence thresholds?

**Findings**:
- **File**: `frontend/src/lib/email-extractor.ts`
- **Entry Point**: `extractItemsFromEmails(emailText, timezone, options)`
- **Returns**: `ExtractionResult { items, issues, duplicatesRemoved, dateLocale }`
- **Confidence Calculation**: Weighted sum in `calculateConfidence()`:
  - Provider: 0.35
  - Date: 0.25
  - Amount: 0.20
  - Installment: 0.15
  - Autopay: 0.05
- **Minimum Confidence**: 0.35 (provider must be detected or item is rejected)
- **Thresholds** (not explicitly defined, inferred from weights):
  - High: ≥0.80 (most signals present)
  - Medium: 0.50-0.79 (some signals missing)
  - Low: 0.35-0.49 (provider only or few signals)

**Decision**: Use existing `extractItemsFromEmails` directly. Map confidence scores to pill colors:
- High (≥0.80): Green
- Medium (0.50-0.79): Yellow
- Low (0.35-0.49): Orange

**Rationale**: Reusing existing code keeps LOC budget low and ensures consistency with main app behavior.

---

### 2. Risk Detection

**Question**: Does the codebase have existing risk detection logic?

**Findings**:
- **Files Checked**:
  - `frontend/src/lib/email-extractor.ts` - No risk detection
  - `frontend/src/components/RiskFlags.tsx` - Exists! Shows risk pills
  - Backend likely has risk detection (referenced in Home.tsx via `res.riskFlags`)

**API Response Structure** (inferred from Home.tsx):
```typescript
interface PlanResponse {
  actionsThisWeek: string[];
  riskFlags: RiskFlag[];  // Array of risk objects
  summary: string[];
  normalized: NormalizedItem[];
}
```

**Decision**: For demo page, implement **minimal client-side risk detection**:
1. **COLLISION**: Check if any two items have same `due_date`
2. **WEEKEND_AUTOPAY**: Check if any autopay item has `due_date` on Sat/Sun
3. **CASH_CRUNCH**: Skip (requires payday data, not available in demo)

**Rationale**: Full risk detection requires server-side logic (payday calculations, buffer analysis). Demo only needs to showcase the concept with simple date-based rules.

---

### 3. ICS Calendar Generation

**Question**: How to generate ICS files client-side with timezone support?

**Findings**:
- **Dependency**: `ics` v3.8.1 already in package.json
- **Timezone Handling**: `luxon` v3.7.2 available for IANA timezone conversion
- **Browser Download**: Use `Blob` + `URL.createObjectURL` + `<a>` download attribute

**Implementation Pattern**:
```typescript
import { createEvents, EventAttributes } from 'ics';
import { DateTime } from 'luxon';

function generateIcs(items: Item[], timezone: string): Blob {
  const now = DateTime.now().setZone(timezone);
  const weekStart = now.startOf('week');
  const weekEnd = now.endOf('week');

  const thisWeek = items.filter(item => {
    const due = DateTime.fromISO(item.due_date, { zone: timezone });
    return due >= weekStart && due <= weekEnd;
  });

  const events: EventAttributes[] = thisWeek.map(item => {
    const due = DateTime.fromISO(item.due_date, { zone: timezone });
    return {
      title: `${item.provider} Payment - $${item.amount}`,
      start: [due.year, due.month, due.day],
      duration: { hours: 1 },
      description: `Installment ${item.installment_no}\n${detectRisks(item)}`,
      // ... other fields
    };
  });

  const { value } = createEvents(events);
  return new Blob([value], { type: 'text/calendar' });
}
```

**Decision**: Create `frontend/src/lib/demo/ics-client.ts` with `generateIcs()` function.

**Rationale**: Matches spec requirement for "client-only generation (no server change)" and "TZ-aware" handling.

---

### 4. Fixture Data Format

**Question**: What format should synthetic email fixtures use?

**Findings**:
- **Existing Test Fixtures**: Checked `frontend/tests/` - no email fixtures found (tests likely use inline strings)
- **Extractor Input**: Accepts plain text (handles HTML via DOMParser)
- **Provider Detection**: Uses regex patterns from `frontend/src/lib/extraction/providers.ts`

**Decision**: Create 10 plain text `.txt` files with realistic email content:
- **Klarna**: 3 fixtures (most common BNPL)
- **Affirm**: 2 fixtures
- **Afterpay**: 2 fixtures
- **PayPal Pay-in-4**: 1 fixture
- **Zip**: 1 fixture
- **Sezzle**: 1 fixture

**Fixture Template**:
```text
From: noreply@klarna.com
Subject: Payment Reminder - Due Soon

Hi there,

Your payment of $25.00 USD is due on October 15, 2025.

This is installment 2 of 4.

Autopay is enabled for this payment.

Thank you for using Klarna!
```

**Rationale**: Plain text format is simplest, matches extractor input, and avoids HTML complexity.

---

### 5. Routing & Page Structure

**Question**: How to add `/demo` route in the existing React Router setup?

**Findings**:
- **Router**: React Router v7.9.3 (using `BrowserRouter`, `Routes`, `Route`)
- **App.tsx Pattern**:
  ```tsx
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  </BrowserRouter>
  ```

**Decision**: Add `<Route path="/demo" element={<Demo />} />` to `App.tsx`.

**Rationale**: Follows existing pattern, minimal change (1 line + 1 import).

---

### 6. Component Reuse

**Question**: Can we reuse existing UI components for pills and tables?

**Findings**:
- **Existing Components**:
  - `RiskFlags.tsx` - Renders risk pills (likely reusable)
  - `ScheduleTable.tsx` - Renders normalized schedule (likely reusable)
  - `ResultsThisWeek.tsx` - Shows actions + ICS download (likely reusable)

**Decision**:
- **Option A** (preferred): Create **self-contained** Demo page with inline pill components
- **Option B**: Reuse existing components

**Rationale**: Option A keeps demo isolated and reversible (single file deletion). LOC budget (≤200) allows for simple inline components.

---

### 7. Testing Strategy

**Question**: What testing approach keeps tests simple and fast?

**Findings**:
- **Test Framework**: Vitest (already configured)
- **React Testing**: `@testing-library/react` available
- **Existing Tests**: Unit tests in `frontend/tests/unit/`, integration tests in `frontend/tests/integration/`

**Decision**:
- **Unit Tests** (2 files):
  1. `load-fixtures.test.ts`: Verify fixture loader returns 10 items, no PII
  2. `ics-client.test.ts`: Verify ICS generation, "This Week" filter
- **Integration Test** (1 file):
  1. `demo-page.test.ts`: Render page, click "Run Demo", verify results, click download

**Rationale**: Minimal test coverage (3 files) keeps LOC budget low while ensuring key functionality works.

---

## Technology Stack Summary

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | 19.1.1 | UI framework | Existing |
| TypeScript | 5.x | Type safety | Existing |
| React Router | 7.9.3 | Routing (`/demo`) | Existing |
| `ics` | 3.8.1 | ICS calendar generation | Existing |
| `luxon` | 3.7.2 | Timezone handling | Existing |
| Vitest | Latest | Testing framework | Existing |
| `email-extractor.ts` | N/A | BNPL extraction orchestrator | Existing (reused) |

**No new dependencies required** ✓

---

## Alternatives Considered

### Alternative 1: Server-Side ICS Generation
**Rejected** because spec explicitly requires "no server change" and "client-only generation".

### Alternative 2: Dynamic Fixture Loading (fetch)
**Rejected** because spec requires "offline-only (no network)". Static imports are safer.

### Alternative 3: Full Risk Detection (Payday Analysis)
**Rejected** because it would require server integration and exceed LOC budget. Simple date-based rules are sufficient for demo.

### Alternative 4: Reuse Home.tsx Layout
**Rejected** because demo should be self-contained for easy rollback. Creating a standalone page is cleaner.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LOC budget exceeded (>200) | Use inline components; avoid abstractions; reuse existing extractor |
| CI guards fail (ESLint) | Follow existing import path rules (`lib/extraction/**`) |
| Performance test fails | Demo page is separate; main app perf unaffected |
| Fixtures contain PII | Manual review + unit test assertion checking for emails/names |

---

## Next Steps

Phase 1 (Design):
1. Create [data-model.md](data-model.md) with demo-specific types
2. Create [quickstart.md](quickstart.md) with manual verification steps
3. Update agent context (optional for small feature)

Phase 2 (Task Generation):
- Execute `/tasks` command to generate tasks.md from plan

---

**Research Status**: ✅ Complete | **All NEEDS CLARIFICATION resolved**
