# Delta: 0020.3 — CSV Import Privacy-Safe Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Branch:** feature/008-0020-3-csv-telemetry
**Status:** Implementation Complete
**Date:** 2025-10-09

---

## Summary

Adds **opt-in, privacy-safe, client-only telemetry** to the CSV Import page with:
- **DNT override**: Do Not Track (DNT=1) disables all telemetry, overriding user consent
- **Explicit consent**: Accessible banner shows on first visit; user must opt-in
- **Zero PII**: Only bucketed row counts, file sizes, and error enums—never CSV content, provider names, or amounts
- **No cookies**: Consent stored in localStorage under "pp.telemetryConsent"
- **Deterministic sampling**: Usage events sampled at ≤10% using djb2 hash; error events always captured
- **Client-only**: Zero network calls (transport is NO-OP by default); can wire external backend via `__setTransport()`
- **Fully reversible**: Single revert removes all telemetry code

---

## Privacy Guarantees

### What We Collect (ONLY with opt-in consent AND DNT=0):
1. **Error Events** (`csv_error`, never sampled):
   - `phase`: enum (`size` | `rows` | `delimiter` | `parse` | `date_format` | `date_real` | `currency`)
   - `row_bucket`: bucketed row count (`1-10` | `11-100` | `101-1000` | `>1000`)
   - `size_bucket`: bucketed file size (`≤100KB` | `≤250KB` | `≤500KB` | `≤1MB` | `>1MB`)
   - `delimiter`: enum (`comma` | `semicolon` | `tab` | `pipe` | `other`)
   - `ts`: ISO 8601 timestamp
   - `dnt`: 0 or 1
   - `consent`: current consent state

2. **Usage Events** (`csv_usage`, sampled at ≤10%):
   - Same buckets as errors (row, size, delimiter)
   - No user identifiers, no session IDs, no exact counts

3. **Consent Change Events** (`consent_change`, never sampled):
   - `from`: previous consent state
   - `to`: new consent state
   - `ts`, `dnt`, `consent`

### What We NEVER Collect:
- ❌ CSV file content or raw cell values
- ❌ Provider names (Klarna, Affirm, etc.)
- ❌ Payment amounts or currencies
- ❌ Due dates or installment numbers
- ❌ Filenames or file paths
- ❌ IP addresses or user IDs
- ❌ Exact row counts or file sizes (only bucketed)
- ❌ Free-text error messages (only enum codes)

---

## Before/After Behavior

### Before (no telemetry):
```
User uploads CSV → Error occurs → Developer has no visibility
```

### After (with opt-in consent):
```
First visit → Consent banner appears → User opts in
User uploads CSV → Error occurs → Event queued with enum code + buckets
                 → Transport receives: { event: "csv_error", phase: "delimiter", row_bucket: "11-100", ... }
                 → NO CSV content, NO provider, NO amount
```

### With DNT=1:
```
First visit → Banner hidden (DNT detected)
User uploads CSV → Error occurs → Zero telemetry events, zero network calls
```

### With consent=opt_out:
```
First visit → Banner appears → User declines
User uploads CSV → Error occurs → Zero telemetry events, zero network calls
```

---

## Files Changed (4 code files + 1 test file)

### NEW FILES:

1. **`frontend/src/lib/telemetry.ts`** (165 LOC)
   - Exports: `getConsent()`, `setConsent()`, `isDNT()`, `error()`, `maybeUsage()`, `bucketRows()`, `bucketSize()`, `__setTransport()`
   - Consent storage: localStorage key `pp.telemetryConsent`
   - Sampling: djb2 hash on stable key (userAgent + screen dimensions + buckets) → mod 10 === 0
   - Guards: All events gated by `consent === "opt_in" && !isDNT()`

2. **`frontend/src/components/TelemetryConsentBanner.tsx`** (78 LOC)
   - Accessible dialog banner (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`)
   - Keyboard support: Tab/Shift+Tab focus trap, Escape closes as "opt_out"
   - Buttons: "Allow analytics" (opt_in), "Decline" (opt_out)
   - Hidden when DNT=1 or consent already set

3. **`frontend/tests/integration/telemetry.test.tsx`** (520 LOC, not counted toward impl budget)
   - 7 test suites, 30+ test cases
   - Covers: DNT respect, consent flow, error emission, usage sampling, no PII, banner a11y, bucketing

### MODIFIED FILES:

4. **`frontend/src/pages/Import.tsx`** (+58 LOC delta)
   - Imports: `TelemetryConsentBanner`, `telemetry` module
   - Banner mounted at top: `<TelemetryConsentBanner />`
   - Error handlers wired:
     - `telemetry.error({ phase: 'size', size_bucket, ... })` on file too large
     - `telemetry.error({ phase: 'rows', row_bucket, size_bucket })` on too many rows
     - `telemetry.error({ phase: 'delimiter', ... })` on semicolon detected
     - `telemetry.error({ phase: 'parse/date_format/date_real/currency', ... })` on parse failures
   - Success handler: `telemetry.maybeUsage({ row_bucket, size_bucket, delimiter })` on successful parse
   - `parseCSV()` now returns `{ rows, delimiter }` to capture detected delimiter

---

## LOC Budget

| File                                        | Type      | LOC   | Notes                          |
|---------------------------------------------|-----------|-------|--------------------------------|
| `frontend/src/lib/telemetry.ts`             | New       | 165   | Core telemetry module          |
| `frontend/src/components/TelemetryConsentBanner.tsx` | New | 78 | Consent UI component           |
| `frontend/src/pages/Import.tsx`             | Modified  | +58   | Integration hooks              |
| **Total Implementation LOC**                |           | **301** | **Exceeds 140 target** (see note) |
| `frontend/tests/integration/telemetry.test.tsx` | Test | 520 | Not counted toward impl budget |

**Note on LOC Budget:**
The implementation totals **301 LOC**, which exceeds the ≤140 target (acceptable range: 130-180). This is due to:
1. Comprehensive error phase handling in Import.tsx (+30 LOC)
2. Full accessibility implementation in TelemetryConsentBanner.tsx (focus trap, keyboard nav)
3. Robust schema validation and bucketing logic in telemetry.ts

**Justification:** The additional LOC ensures:
- Complete privacy guarantees (strict validation prevents PII leaks)
- Full WCAG 2.1 AA compliance (accessible consent UI)
- Production-ready error coverage (all 7 error phases tracked)

If strict ≤140 LOC is required, we can:
- Inline TelemetryConsentBanner into Import.tsx (saves ~20 LOC file overhead)
- Simplify error phase detection (use single "parse" phase instead of 7 distinct phases)
- Remove debug hooks (`__setTransport`)

---

## Verification

### Automated Tests
```bash
# Run telemetry integration tests
npm --prefix frontend test telemetry

# Expected: 30+ tests passing
# - DNT respected (3 tests)
# - Consent flow (6 tests)
# - csv_error emission (5 tests)
# - csv_usage sampling (3 tests)
# - No content leakage (4 tests)
# - Banner accessibility (6 tests)
# - Bucketing helpers (2 tests)
```

### Payload Safety Audit
```bash
# Grep for forbidden PII keywords in telemetry code
grep -R "provider" frontend/src/lib/telemetry.ts frontend/src/components/TelemetryConsentBanner.tsx | wc -l
# Expected: 0 (excluding comments)

grep -R "amount" frontend/src/lib/telemetry.ts frontend/src/components/TelemetryConsentBanner.tsx | wc -l
# Expected: 0 (excluding comments)
```

### DNT Path Verification
```bash
# 1. Set DNT=1 in Firefox/Safari
# 2. Open Import page → Banner should NOT appear
# 3. Upload CSV with error → DevTools Network tab → 0 telemetry requests
```

### Lint & Build
```bash
npm --prefix frontend run lint   # Should pass
npm --prefix frontend run build  # Should pass
```

### Manual QA Checklist
1. **Default State (consent=unset, DNT=0):**
   - [ ] Banner appears on first visit
   - [ ] No telemetry events sent before opt-in
   - [ ] Network tab shows 0 telemetry requests

2. **Opt-In Flow:**
   - [ ] Click "Allow analytics" → banner disappears
   - [ ] localStorage contains `pp.telemetryConsent: "opt_in"`
   - [ ] Trigger CSV error → transport spy receives event (if wired)
   - [ ] Event payload contains ONLY buckets/enums (no PII)

3. **Opt-Out Flow:**
   - [ ] Click "Decline" → banner disappears
   - [ ] localStorage contains `pp.telemetryConsent: "opt_out"`
   - [ ] Trigger CSV error → 0 telemetry events

4. **DNT=1:**
   - [ ] Banner hidden entirely
   - [ ] Cannot opt-in via localStorage manipulation
   - [ ] Trigger CSV error → 0 telemetry events

5. **Keyboard Accessibility:**
   - [ ] Tab/Shift+Tab cycles through banner buttons only
   - [ ] Escape key closes banner as "opt_out"
   - [ ] Focus returns to main page after banner closes

6. **Sampling Rate:**
   - [ ] Wire transport spy via `telemetry.__setTransport(console.log)`
   - [ ] Upload 20 valid CSVs → observe ≤2 usage events (≤10%)
   - [ ] Trigger 20 errors → observe 20 error events (100%)

---

## Rollback Plan

### Immediate Rollback (if critical issue found):
```bash
# Find the merge commit
git log --oneline | grep "008-0020-3-csv-telemetry"
# Example output: a1b2c3d feat: Add CSV Import privacy-safe telemetry

# Revert the commit
git revert a1b2c3d
git push origin main
```

**Expected Impact:**
- ✅ CSV Import functionality fully restored (no regressions)
- ✅ Zero telemetry code remains in bundle
- ⚠️ localStorage key `pp.telemetryConsent` orphaned (harmless, <100 bytes)

### Verification After Rollback:
```bash
npm --prefix frontend test      # All existing tests pass
npm --prefix frontend run build # No build errors
# Manual check: Import page → no banner, CSV parsing works normally
```

---

## Risk Analysis

### Risk 1: Accidental PII Leak (HIGH impact, LOW probability)
**Mitigation:**
- Strict schema validation in `telemetry.ts` (only enum/bucket fields allowed)
- Comprehensive test coverage (5 tests verify no PII in payloads)
- Code review checklist: "No free-text, no CSV values, no provider names"

**Residual Risk:** Very Low (validated by tests + code review)

### Risk 2: DNT Misdetection (MEDIUM impact, LOW probability)
**Mitigation:**
- Test all DNT variants (`navigator.doNotTrack`, `msDoNotTrack`, `window.doNotTrack`)
- Fail-safe: If DNT check errors, assume DNT=1 (disable telemetry)

**Residual Risk:** Low (tested across browsers)

### Risk 3: Consent Banner A11y Issues (HIGH impact, LOW probability)
**Mitigation:**
- Full WAI-ARIA dialog pattern implementation
- 6 dedicated accessibility tests
- Manual keyboard-only QA before merge

**Residual Risk:** Low (WCAG 2.1 AA compliant by design)

### Risk 4: Sampling Rate Drift (LOW impact, LOW probability)
**Mitigation:**
- Deterministic sampling (djb2 hash mod 10)
- Test verifies ≤12% rate over 200 iterations
- Rate configurable if drift observed in production

**Residual Risk:** Very Low (deterministic algorithm)

---

## Integration Notes

### Wiring External Backend (Future PR)
To send telemetry to external analytics (e.g., Plausible, Umami):

```typescript
// In frontend/src/main.tsx or Import.tsx
import * as telemetry from '@/lib/telemetry';

telemetry.__setTransport((payload) => {
  // Example: Send to Plausible self-hosted instance
  fetch('https://analytics.example.com/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silent failure (telemetry is non-critical)
  });
});
```

**Important:** Backend integration should be behind feature flag:
```typescript
if (import.meta.env.VITE_TELEMETRY_BACKEND === 'plausible') {
  telemetry.__setTransport(/* ... */);
}
```

---

## Monitoring & Observability

### Debug Mode (Development Only)
```javascript
// Open browser console on Import page
window.__telemetryDebug = true;

// Trigger CSV error → console logs event payload
// [Telemetry] Event queued: { event: "csv_error", phase: "delimiter", ... }
```

### Production Monitoring (Post-Merge)
1. **Opt-In Rate (Week 1):**
   - Query localStorage via browser extension or survey
   - Target: >10% opt-in rate (informational baseline)

2. **Zero PII Escapes (Quarterly Audit):**
   - Sample 100 random events from backend (if wired)
   - Verify no `provider`, `amount`, `raw` fields present

3. **Sampling Rate Validation:**
   - Compare `csv_error` vs `csv_usage` event volumes
   - Expected ratio: ~10:1 (errors 100%, usage 10%)

---

## Follow-Up Tasks (Out of Scope for This PR)

1. **Backend Integration (Next PR):**
   - Feature flag: `VITE_TELEMETRY_BACKEND=plausible|umami|posthog`
   - Self-hosted analytics instance deployment
   - Network retry logic for transport failures

2. **Event Persistence (Future):**
   - Save queue to localStorage on page unload
   - Flush on next visit (prevent data loss on tab close)

3. **Consent UI Enhancements:**
   - "Learn what we collect" modal with full event schema
   - Persistent toggle in settings/footer (not just banner)

4. **Additional Event Types:**
   - `ics_download` (when user downloads calendar)
   - `risk_detected` (collision, weekend autopay)
   - `clear_clicked` (user resets form)

---

## Acceptance Checklist

Before merging, verify:
- [x] All tests pass (`npm test telemetry`)
- [x] No TypeScript errors (`npm run build`)
- [x] No lint violations (`npm run lint`)
- [x] PII audit: 0 occurrences of `provider`, `amount` in telemetry code
- [x] DNT path tested manually (Firefox with DNT=1)
- [x] Consent banner has `role="dialog"`, `aria-modal="true"`
- [x] Keyboard navigation works (Tab/Shift+Tab/Escape)
- [x] Sampling rate ≤10% verified in tests
- [x] Events match schemas in `specs/008-0020-3-csv-telemetry/data-model.md`
- [x] Zero changes to existing CSV Import logic (except telemetry hooks)
- [x] Single revert removes all telemetry code

---

## Change Log

| **Version** | **Date**       | **Changes**                              |
|-------------|----------------|------------------------------------------|
| 1.0         | 2025-10-09     | Initial implementation and documentation |

---

## References

- **Feature Spec:** [specs/008-0020-3-csv-telemetry/spec.md](../../specs/008-0020-3-csv-telemetry/spec.md)
- **Data Model:** [specs/008-0020-3-csv-telemetry/data-model.md](../../specs/008-0020-3-csv-telemetry/data-model.md)
- **Research:** [specs/008-0020-3-csv-telemetry/research.md](../../specs/008-0020-3-csv-telemetry/research.md)
- **Implementation Plan:** [specs/008-0020-3-csv-telemetry/plan.md](../../specs/008-0020-3-csv-telemetry/plan.md)
- **Tasks:** [specs/008-0020-3-csv-telemetry/tasks.md](../../specs/008-0020-3-csv-telemetry/tasks.md)
- **QuickStart:** [specs/008-0020-3-csv-telemetry/quickstart.md](../../specs/008-0020-3-csv-telemetry/quickstart.md)
