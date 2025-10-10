# Implementation Plan: CSV Import Privacy-Safe Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Version:** 1.0
**Created:** 2025-10-09
**Status:** Ready for Implementation

---

## Overview

This document defines the **phased implementation strategy** for adding opt-in, privacy-safe telemetry to the CSV Import feature. The plan prioritizes **test-driven development (TDD)**, **Constitution compliance**, and **full reversibility** with a single revert.

---

## Goals & Constraints Recap

### Primary Goals
1. **Observability:** Track CSV error types and usage patterns without PII
2. **Privacy-First:** Opt-in only, DNT respect, zero network calls without consent
3. **Accessibility:** WCAG 2.1 AA compliant consent UI
4. **Minimal Impact:** ≤140 LOC (target ≤90), ≤4 files, 0 runtime dependencies

### Non-Goals (Out of Scope)
- Third-party analytics SDK integration (future PR, behind feature flag)
- Server-side telemetry infrastructure or endpoints
- Real-time event streaming (MVP uses in-memory queue only)
- Persistent event storage across page refreshes

---

## Implementation Phases

### Phase A: Test-Driven Foundation (Days 1-2)
**Objective:** Write comprehensive failing tests before any implementation code

#### Tasks
- **T001:** Test zero-network guarantee (consent off by default)
- **T002:** Test consent enable/disable flow (localStorage + UI state)
- **T003:** Test DNT detection and override behavior
- **T004:** Test CSV error event payload redaction and schema validation
- **T005:** Test csv_usage event sampling (≤10%, deterministic)

**Acceptance Criteria:**
- All tests fail initially (no implementation exists)
- Tests cover happy path + edge cases (DNT + consent interactions)
- Test suite runs in <5 seconds

**Deliverables:**
- `frontend/tests/unit/telemetry.test.ts` (or .tsx if UI involved)
- ~60-80 LOC of test code
- CI pipeline includes telemetry tests

**Budget:**
- Time: 4-6 hours
- LOC: 60-80 (tests only, not counted toward 140 impl limit)

---

### Phase B: Minimal Implementation (Days 2-3)
**Objective:** Build smallest possible module to pass all tests

#### Task T006: Core Telemetry Module
**File:** `frontend/src/lib/telemetry.ts`

**Responsibilities:**
1. Consent state management (read/write localStorage)
2. DNT detection (`isDNTActive()`)
3. Event schema validation (`validateEventSchema()`)
4. Event queue (in-memory, max 20 events, FIFO)
5. Sampling logic (deterministic, 10% for usage events)
6. Debug hooks (`window.__telemetryDebug`, `window.__telemetryQueue()`)

**API Surface:**
```typescript
// Public API
export function isConsentGranted(): boolean;
export function setConsent(granted: boolean, reason: ConsentChangeReason): void;
export function trackCSVError(code: CSVErrorCode, rowCount: number, delimiter: string): void;
export function trackCSVUsage(rowCount: number, hadErrors: boolean, icsDownloaded: boolean): void;

// Internal (not exported)
function enqueueEvent(event: TelemetryEvent): void;
function shouldSampleUsageEvent(): boolean;
function validateEventSchema(event: unknown): boolean;
```

**Acceptance Criteria:**
- ✅ All Phase A tests pass
- ✅ No external dependencies (pure TypeScript/JavaScript)
- ✅ Zero console errors/warnings
- ✅ Passes `npm run lint` (ESLint + Prettier)

**Budget:**
- Time: 6-8 hours
- LOC: 80-100 (target: 70-80)

---

#### Task T007: Consent UI Component
**File:** `frontend/src/components/TelemetryConsentBanner.tsx` (or integrate into `Import.tsx`)

**Responsibilities:**
1. Render banner on first visit (check localStorage)
2. Two buttons: "Enable telemetry" | "Not now"
3. "Learn more" link (inline modal with event schema)
4. ARIA dialog pattern: role, focus trap, keyboard nav
5. Hook to `setConsent()` from telemetry module

**Visual Design (Minimal):**
```
┌────────────────────────────────────────────────────────────┐
│ Help improve this tool?                                    │
│ Share anonymous usage data to help us fix bugs faster.    │
│ [Learn what we collect]  [Enable] [Not now]               │
└────────────────────────────────────────────────────────────┘
```

**Accessibility Requirements:**
- `role="dialog"` or `role="banner"` (non-modal)
- `aria-labelledby` points to title
- Tab order: Learn more → Enable → Not now
- Escape key = "Not now"
- Focus returns to Import page on close

**Acceptance Criteria:**
- ✅ Banner shows only once per user (localStorage check)
- ✅ Clicking "Enable" calls `setConsent(true, "user_click")`
- ✅ Clicking "Not now" dismisses banner (no consent stored)
- ✅ Keyboard-only navigation works (Tab/Shift+Tab/Escape)
- ✅ Screen reader announces dialog title and description

**Budget:**
- Time: 4-6 hours
- LOC: 40-60 (target: 30-40)

---

#### Integration with CSV Import Flow
**File:** `frontend/src/pages/Import.tsx` (light edits)

**Changes:**
1. Import telemetry functions: `trackCSVError`, `trackCSVUsage`
2. Wrap existing error handlers:
   ```typescript
   catch (err) {
     if (err.code === "TOO_MANY_ROWS") {
       trackCSVError("TOO_MANY_ROWS", csvRows.length, detectedDelimiter);
     }
     // ... existing error display logic
   }
   ```
3. Track ICS download:
   ```typescript
   function handleDownloadICS() {
     downloadICS(calendar); // existing function
     trackCSVUsage(csvRows.length, hadErrors, true);
   }
   ```
4. Render `<TelemetryConsentBanner />` at top of Import page

**Acceptance Criteria:**
- ✅ CSV Import functionality unchanged (all existing tests pass)
- ✅ Telemetry calls wrapped in consent check (no network without consent)
- ✅ No new prop drilling or state complexity

**Budget:**
- Time: 2-3 hours
- LOC: 10-20 (minimal integration hooks)

---

### Phase C: Documentation & QA (Day 4)
**Objective:** Finalize documentation, run manual QA, prepare for merge

#### Task T008: Documentation Updates
**Files:**
- `specs/008-0020-3-csv-telemetry/quickstart.md` (create)
- `CHANGELOG.md` (add entry stub)
- `README.md` (optional: mention telemetry toggle)

**Content:**
1. **Quickstart:** One-command verification + manual QA checklist
2. **Delta Doc:** Summary of changes, risk analysis, rollback plan
3. **Monitoring Notes:** How to enable debug mode (`window.__telemetryDebug=true`)

**Acceptance Criteria:**
- ✅ Quickstart includes exact commands to run tests + build
- ✅ Manual QA checklist covers DNT, consent, keyboard nav
- ✅ CHANGELOG entry follows existing format (see v1.1 entry)

**Budget:**
- Time: 2-3 hours
- LOC: N/A (docs only)

---

#### Manual QA Checklist (Task T008)
Run through this before merging:

1. **Default State (No Consent)**
   - [ ] Open Import page in incognito → banner appears
   - [ ] Open DevTools Network tab → zero telemetry requests
   - [ ] Trigger CSV error → no network calls

2. **Enable Consent Flow**
   - [ ] Click "Enable telemetry" → banner dismisses
   - [ ] Check localStorage → `telemetryConsentV1.granted === true`
   - [ ] Trigger CSV error → inspect console (if debug mode on)
   - [ ] Verify payload: only enum codes, bucketed row counts (no PII)

3. **Disable Consent Flow**
   - [ ] Find telemetry toggle (footer or settings icon)
   - [ ] Click "Disable" → localStorage updates
   - [ ] Trigger CSV error → no network calls

4. **Do Not Track (DNT)**
   - [ ] Enable DNT in Firefox (Privacy Settings → Send DNT signal)
   - [ ] Open Import page → banner shows "DNT Active" or hidden
   - [ ] Attempt to enable telemetry → UI prevents or shows warning
   - [ ] Trigger CSV error → no network calls (confirmed in DevTools)

5. **Accessibility (Keyboard-Only)**
   - [ ] Open Import page, press Tab → focus enters banner
   - [ ] Tab cycles: Learn more → Enable → Not now → wraps
   - [ ] Press Escape → banner dismisses (= "Not now")
   - [ ] Focus returns to Import page content

6. **Screen Reader Testing (Optional but Recommended)**
   - [ ] macOS: Enable VoiceOver (Cmd+F5)
   - [ ] Navigate to banner → VoiceOver reads title + description
   - [ ] Buttons have accessible names ("Enable telemetry", not just "OK")

---

## File Inventory (≤4 Files Touched)

### New Files (3)
1. **`frontend/src/lib/telemetry.ts`** — Core module (80-100 LOC)
2. **`frontend/src/components/TelemetryConsentBanner.tsx`** — UI component (40-60 LOC)
3. **`frontend/tests/unit/telemetry.test.ts`** — Test suite (60-80 LOC, not counted)

### Modified Files (1)
4. **`frontend/src/pages/Import.tsx`** — Integration hooks (10-20 LOC delta)

**Total Implementation LOC:** 130-180 (target: ≤140, stretch: ≤90)
**Strategy to Hit Target:** Inline `TelemetryConsentBanner` into `Import.tsx` if needed (saves one file)

---

## Risk Analysis & Mitigation

### Risk 1: LOC Budget Overrun (>140 LOC)
**Probability:** Medium
**Impact:** Low (soft constraint, quality more important)
**Mitigation:**
- Inline consent UI into `Import.tsx` (save 40-60 LOC by avoiding separate component)
- Simplify queue logic (remove `totalEnqueued`/`totalDropped` counters)
- Cut debug hooks if needed (add in follow-up PR)

### Risk 2: Consent Banner Disrupts UX
**Probability:** Low
**Impact:** Medium (user complaints, low opt-in rate)
**Mitigation:**
- Non-modal banner (top of page, not blocking)
- Dismissible with "Not now" (no forced choice)
- Appears only once per user (localStorage flag)

### Risk 3: Accidental PII Leak in Event Payload
**Probability:** Very Low
**Impact:** High (GDPR violation)
**Mitigation:**
- Strict schema validation (reject any non-enum fields)
- Code review checklist: "No free-text, no CSV values, no filenames"
- Test coverage: T004 validates payload structure

### Risk 4: DNT Detection Fails (Browser Compatibility)
**Probability:** Low
**Impact:** Medium (telemetry activates despite user preference)
**Mitigation:**
- Test across browsers (Firefox, Safari, Chrome)
- Fail-safe: If DNT check errors, assume DNT=1 (disable telemetry)

### Risk 5: A11y Regression (Keyboard Navigation Breaks)
**Probability:** Low
**Impact:** High (WCAG 2.1 AA violation)
**Mitigation:**
- Follow WAI-ARIA APG dialog pattern exactly
- Dedicated keyboard-only QA before merge
- Automated a11y tests (if available in project)

---

## Rollback Plan

### If Critical Issue Discovered Post-Merge
**Definition of Critical:**
- Telemetry fires without consent (privacy violation)
- Consent banner breaks keyboard navigation (a11y violation)
- CSV Import core functionality regressed (existing tests fail)

**Rollback Procedure:**
1. Identify merge commit SHA (e.g., `git log --oneline | grep "telemetry"`)
2. Create revert PR:
   ```bash
   git revert <commit-sha>
   git push origin main
   ```
3. Verify:
   - CSV Import works (all tests pass)
   - No telemetry code remains in bundle
   - localStorage key `telemetryConsentV1` orphaned but harmless

**Expected Impact:**
- Zero disruption to CSV Import (fully decoupled)
- Users who opted in see banner again on next visit (consent state lost)

---

## Success Metrics (Post-Launch)

### Immediate (Day 1)
- [ ] Zero console errors in production
- [ ] All CI tests pass (unit + integration)
- [ ] No GitHub issues filed about consent banner

### Week 1
- [ ] Opt-in rate: >10% (informational baseline)
- [ ] Debug hook usage: Monitor for `window.__telemetryDebug` calls (shows engagement)

### Week 4
- [ ] At least 10 distinct error events collected (validates taxonomy)
- [ ] Zero PII escapes (manual review of 100 random events)

---

## Dependencies & Blockers

### None (MVP is Fully Self-Contained)
- ✅ No external NPM packages required
- ✅ No backend API endpoints needed
- ✅ No feature flags required (code is always present, but inactive without consent)

### Future Dependencies (Out of Scope for This PR)
- **Plausible/Umami SDK:** Behind `VITE_TELEMETRY_BACKEND` feature flag
- **Server Endpoint:** For flushing queued events (if persistence added)

---

## Quality Gates (Must Pass Before Merge)

### Automated Checks
- [ ] All unit tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No lint violations (`npm run lint`)
- [ ] Bundle size increase <5KB (check with `npm run build -- --analyze`)

### Manual QA
- [ ] Manual QA checklist (Phase C) fully completed
- [ ] Keyboard-only navigation tested (Tab/Shift+Tab/Escape)
- [ ] DNT behavior verified in Firefox

### Code Review
- [ ] PII redaction checklist reviewed (no free-text fields)
- [ ] Schema validation logic reviewed (strict enums only)
- [ ] Focus management reviewed (ARIA pattern compliance)

### Documentation
- [ ] Quickstart.md includes one-command verification
- [ ] CHANGELOG entry added (version number TBD)
- [ ] README updated (if telemetry toggle mentioned)

---

## Timeline Estimate

| **Phase** | **Tasks**       | **Duration** | **Owner**       | **Dependencies** |
|-----------|-----------------|--------------|-----------------|------------------|
| A         | T001-T005       | 1-2 days     | Dev Team        | None             |
| B         | T006-T007       | 1-2 days     | Dev Team        | Phase A complete |
| C         | T008            | 0.5-1 day    | Dev + Docs Team | Phase B complete |
| **Total** |                 | **3-5 days** |                 |                  |

**Contingency:** +1 day for unexpected A11y issues or LOC optimization

---

## Phasing Summary

```
Phase A (TDD)        Phase B (Code)       Phase C (Docs)       Merge
    │                    │                    │                  │
    ├─ T001 (tests)      ├─ T006 (module)     ├─ T008 (docs)     ├─ PR Review
    ├─ T002 (tests)      ├─ T007 (UI)         ├─ Manual QA       ├─ CI Passes
    ├─ T003 (tests)      └─ Import.tsx        └─ CHANGELOG       └─ Merge
    ├─ T004 (tests)         (integration)
    └─ T005 (tests)

  All tests fail       All tests pass       QA checklist OK    Ship it! 🚀
```

---

## Open Questions for Product/Stakeholders

1. **Consent Banner Copy:** Approve final wording for "Help improve this tool?" message?
2. **Opt-in Target:** Is 10% opt-in rate acceptable, or aim higher (requires UX iteration)?
3. **Future Backend:** Preference for Plausible vs. Umami vs. PostHog (for next PR)?
4. **Monitoring Budget:** Budget for self-hosted analytics infrastructure (if not using SaaS)?

---

## Appendix: Alternative Approaches Considered

### Approach 1: Cookie-Based Consent (Rejected)
**Pros:** Standard web pattern, CMP libraries available
**Cons:** Requires cookie banner (annoying), ePrivacy compliance burden
**Why Rejected:** LocalStorage simpler, exempt under "strictly necessary"

### Approach 2: Server-Side Telemetry (Deferred)
**Pros:** Centralized analytics, easier aggregation
**Cons:** Requires backend, increases scope, harder to test
**Why Deferred:** MVP focuses on client-only, backend in future PR

### Approach 3: No Telemetry (Rejected)
**Pros:** Zero privacy risk, simplest to implement
**Cons:** No observability, blind to production issues
**Why Rejected:** Business value outweighs minimal risk (with proper safeguards)

---

## Change Log

| **Version** | **Date**       | **Changes**                             |
|-------------|----------------|-----------------------------------------|
| 1.0         | 2025-10-09     | Initial implementation plan             |

---

**Next Steps:**
1. Review plan with team, approve timeline
2. Assign tasks T001-T008 to developers
3. Begin Phase A (TDD) immediately
4. Daily standup check-ins during implementation
