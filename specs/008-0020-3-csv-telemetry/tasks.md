# Tasks: CSV Import Privacy-Safe Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Version:** 1.0
**Created:** 2025-10-09
**Status:** Ready for Assignment

---

## Task Overview

This document breaks down the telemetry feature into **8 discrete, testable tasks** with clear acceptance criteria, LOC budgets, and verification commands. All tasks follow the **Constitution constraints** (≤140 LOC, ≤4 files, 0 deps, fully reversible).

---

## Phase A: Test-Driven Foundation (T001-T005)

---

### **T001: Test Zero-Network Guarantee (Consent Off by Default)**

**Objective:** Verify that when telemetry consent is not granted, absolutely zero network calls occur, even when CSV errors are triggered.

**Files:**
- `frontend/tests/unit/telemetry.test.ts` (new)

**Test Cases:**
1. **Default State:** On first page load, `isConsentGranted()` returns `false`
2. **No Network Activity:** Call `trackCSVError()` 10 times → verify zero events queued
3. **LocalStorage Empty:** `localStorage.getItem("telemetryConsentV1")` returns `null`
4. **Network Spy:** Mock `fetch` → assert it was never called

**Acceptance Criteria:**
- [ ] Test fails initially (functions not yet implemented)
- [ ] Test uses Jest or Vitest (whatever project uses)
- [ ] Network spy asserts `fetch` call count === 0
- [ ] Test runs in <1 second
- [ ] No console errors during test run

**Constitution Gate:**
- Telemetry defaults to OFF (verified)
- Zero network calls without consent (verified)

**LOC Target:** 15-20 (test code, not counted toward 140)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts
# Expected: FAIL (functions not implemented)
```

---

### **T002: Test Consent Enable/Disable Flow**

**Objective:** Verify that enabling/disabling consent persists to localStorage and updates in-memory state correctly.

**Files:**
- `frontend/tests/unit/telemetry.test.ts` (append)

**Test Cases:**
1. **Enable Consent:** Call `setConsent(true, "user_click")` → verify:
   - `isConsentGranted()` returns `true`
   - `localStorage.telemetryConsentV1.granted === true`
   - `consent_change` event queued with `to: "enabled"`
2. **Disable Consent:** Call `setConsent(false, "user_click")` → verify:
   - `isConsentGranted()` returns `false`
   - `localStorage.telemetryConsentV1.granted === false`
   - New `consent_change` event queued with `to: "disabled"`
3. **Persist Across Reload:** Set consent → reload (mock) → verify state persists

**Acceptance Criteria:**
- [ ] Test fails initially
- [ ] Covers enable, disable, and reload scenarios
- [ ] Verifies both in-memory state and localStorage
- [ ] Event payload includes `reason: "user_click"`
- [ ] No race conditions (synchronous localStorage writes)

**Constitution Gate:**
- Consent persists locally (verified)
- State management is simple (no complex state machine)

**LOC Target:** 20-25 (test code)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts
# Expected: FAIL (setConsent not implemented)
```

---

### **T003: Test DNT Detection and Override**

**Objective:** Verify that Do Not Track (DNT) overrides user consent and disables telemetry completely.

**Files:**
- `frontend/tests/unit/telemetry.test.ts` (append)

**Test Cases:**
1. **DNT Active:** Mock `navigator.doNotTrack = "1"` → verify:
   - `isDNTActive()` returns `true`
   - `setConsent(true, "user_click")` → `isConsentGranted()` still returns `false`
   - `trackCSVError()` → zero events queued
2. **DNT Inactive:** Mock `navigator.doNotTrack = "0"` → verify:
   - `isDNTActive()` returns `false`
   - Consent can be granted normally
3. **Vendor DNT:** Test `navigator.msDoNotTrack` and `window.doNotTrack` fallbacks

**Acceptance Criteria:**
- [ ] Test fails initially
- [ ] Covers all DNT variants (navigator, ms, window)
- [ ] DNT overrides consent (verified)
- [ ] Test uses mock to control DNT value
- [ ] No telemetry fires when DNT=1 (network spy)

**Constitution Gate:**
- Privacy signals (DNT) are honored (verified)
- No network calls when DNT=1 (verified)

**LOC Target:** 15-20 (test code)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts
# Expected: FAIL (isDNTActive not implemented)
```

---

### **T004: Test CSV Error Payload Redaction**

**Objective:** Verify that `csv_error` events contain only enum error codes and bucketed row counts (no PII).

**Files:**
- `frontend/tests/unit/telemetry.test.ts` (append)

**Test Cases:**
1. **Valid Error Event:** Call `trackCSVError("TOO_MANY_ROWS", 1500, "comma")` → verify:
   - Event queued with `code: "TOO_MANY_ROWS"`
   - `rowCountBucket: "1000+"` (not exact count)
   - `delimiter: "comma"`
   - No fields outside schema (e.g., `fileName`, `csvContent`)
2. **Schema Validation:** Pass invalid event to `validateEventSchema()` → verify:
   - Returns `false` for free-text error messages
   - Returns `false` for non-enum codes
   - Returns `false` for exact row counts (not bucketed)
3. **Enum Exhaustiveness:** Test all CSVErrorCode values are accepted

**Acceptance Criteria:**
- [ ] Test fails initially
- [ ] Covers all 6 error codes (CSV_TOO_LARGE, TOO_MANY_ROWS, etc.)
- [ ] Verifies row count bucketing (1-100, 101-500, etc.)
- [ ] Rejects invalid schemas (no PII leaks)
- [ ] Event payload matches TypeScript types in data-model.md

**Constitution Gate:**
- No PII in events (verified)
- Schema validation prevents leaks (verified)

**LOC Target:** 25-30 (test code)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts
# Expected: FAIL (trackCSVError not implemented)
```

---

### **T005: Test csv_usage Sampling (≤10%)**

**Objective:** Verify that `csv_usage` events are sampled at ≤10% rate using deterministic sampling.

**Files:**
- `frontend/tests/unit/telemetry.test.ts` (append)

**Test Cases:**
1. **Sampling Rate:** Mock 100 sessions with different seeds → verify:
   - ~10 sessions produce usage events (±2% tolerance)
   - Same seed = same sampling decision (deterministic)
2. **Error Events Not Sampled:** Call `trackCSVError()` 100 times → verify:
   - All 100 events queued (no sampling)
3. **Usage Event Fields:** Call `trackCSVUsage(250, false, true)` → verify:
   - `rowsBucket: "101-500"`
   - `hadErrors: false`
   - `icsDownloaded: true`

**Acceptance Criteria:**
- [ ] Test fails initially
- [ ] Sampling is deterministic (reproducible with same seed)
- [ ] Error events always captured (100%)
- [ ] Usage events sampled at 10% (±2%)
- [ ] Test runs in <2 seconds (100 iterations)

**Constitution Gate:**
- Sampling reduces data volume (verified)
- Deterministic = fair representation (verified)

**LOC Target:** 20-25 (test code)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts
# Expected: FAIL (trackCSVUsage not implemented)
```

---

## Phase B: Minimal Implementation (T006-T007)

---

### **T006: Implement Core Telemetry Module**

**Objective:** Build the minimal telemetry module to pass all Phase A tests (T001-T005).

**Files:**
- `frontend/src/lib/telemetry.ts` (new)

**Responsibilities:**
1. **Consent Management:**
   - `isConsentGranted()` → reads from localStorage
   - `setConsent(granted, reason)` → writes to localStorage + queues event
2. **DNT Detection:**
   - `isDNTActive()` → checks `navigator.doNotTrack`, `msDoNotTrack`, `window.doNotTrack`
3. **Event Tracking:**
   - `trackCSVError(code, rowCount, delimiter)` → validates + enqueues event
   - `trackCSVUsage(rowCount, hadErrors, icsDownloaded)` → samples + enqueues event
4. **Queue Management:**
   - `enqueueEvent(event)` → validates schema, adds to queue (max 20, FIFO)
5. **Schema Validation:**
   - `validateEventSchema(event)` → checks all fields against enums/buckets
6. **Utilities:**
   - `bucketRowCount(count)` → maps exact count to bucket
   - `shouldSampleUsageEvent(seed)` → deterministic 10% sampling

**API Surface:**
```typescript
// Public (exported)
export function isConsentGranted(): boolean;
export function setConsent(granted: boolean, reason: ConsentChangeReason): void;
export function trackCSVError(code: CSVErrorCode, rowCount: number, delimiter: string): void;
export function trackCSVUsage(rowCount: number, hadErrors: boolean, icsDownloaded: boolean): void;

// Internal (not exported)
function isDNTActive(): boolean;
function enqueueEvent(event: TelemetryEvent): void;
function validateEventSchema(event: unknown): event is TelemetryEvent;
function bucketRowCount(count: number): RowCountBucket;
function shouldSampleUsageEvent(seed: string): boolean;
```

**Acceptance Criteria:**
- [ ] All Phase A tests (T001-T005) pass
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint violations (`npm run lint`)
- [ ] Zero external dependencies (pure TS/JS)
- [ ] Debug hooks implemented:
  - `window.__telemetryDebug = true` enables console logging
  - `window.__telemetryQueue()` returns current queue
  - `window.__telemetryConsent()` returns consent state
- [ ] Code comments explain non-obvious logic (sampling, bucketing)

**Constitution Gate:**
- ≤100 LOC (target: 70-80)
- No runtime dependencies (verified)
- Fully reversible (single file to delete)

**LOC Target:** 80-100 (implementation)

**Verification:**
```bash
npm --prefix frontend test telemetry.test.ts  # All tests pass
npm --prefix frontend run build               # No TS errors
npm --prefix frontend run lint                # No lint violations
```

---

### **T007: Implement Accessible Consent UI**

**Objective:** Build an ARIA-compliant consent banner/dialog that integrates with the telemetry module.

**Files:**
- `frontend/src/components/TelemetryConsentBanner.tsx` (new)
  **OR** inline into `frontend/src/pages/Import.tsx` (if LOC budget tight)

**UI Requirements:**
1. **Banner Appearance:**
   - Shows on first page load (check localStorage for `telemetryConsentBannerDismissed`)
   - Non-modal (top of page, doesn't block interaction)
   - Compact (1-2 lines + buttons)
2. **Content:**
   - Title: "Help improve this tool?"
   - Body: "Share anonymous usage data to help us fix bugs faster."
   - Link: "Learn what we collect" → opens inline modal with event schema
3. **Buttons:**
   - "Enable telemetry" → calls `setConsent(true, "user_click")`
   - "Not now" → dismisses banner (sets `telemetryConsentBannerDismissed=true`)
4. **ARIA Attributes:**
   - `role="dialog"` (if modal) or `role="banner"` (if non-modal)
   - `aria-labelledby` → points to title ID
   - `aria-describedby` → points to body ID
   - Focus trap (Tab/Shift+Tab cycles within banner)
5. **Keyboard Support:**
   - Tab: Navigate Learn more → Enable → Not now → wraps
   - Escape: Dismisses banner (same as "Not now")
   - Enter/Space: Activates focused button

**DNT Handling:**
- If `isDNTActive() === true`, hide banner entirely (or show "DNT active" message)

**Acceptance Criteria:**
- [ ] Banner shows only once per user (localStorage check)
- [ ] Clicking "Enable" updates consent + dismisses banner
- [ ] Clicking "Not now" dismisses without granting consent
- [ ] "Learn what we collect" opens modal with event schema (copy-paste from data-model.md)
- [ ] Keyboard navigation works (Tab/Shift+Tab/Escape)
- [ ] Screen reader announces role and labels (manual test)
- [ ] No hydration errors (if using SSR/SSG)
- [ ] Passes `npm run lint`

**Constitution Gate:**
- WCAG 2.1 AA compliant (verified via manual keyboard test)
- ≤60 LOC (target: 30-40)
- Single-component implementation

**LOC Target:** 40-60 (implementation)

**Verification:**
```bash
# Unit test (if applicable)
npm --prefix frontend test TelemetryConsentBanner.test.tsx

# Manual QA
# 1. Open Import page in incognito → banner appears
# 2. Tab key → focus enters banner
# 3. Escape key → banner dismisses
# 4. Reopen → banner does not reappear (dismissed state persisted)

# Accessibility audit
npm run lint  # Should include a11y linter if configured
```

---

**Integration Hook (Import.tsx):**

**File:** `frontend/src/pages/Import.tsx`

**Changes:**
```typescript
import { trackCSVError, trackCSVUsage } from '@/lib/telemetry';
import TelemetryConsentBanner from '@/components/TelemetryConsentBanner';

// ... existing code ...

// Wrap error handler
catch (err) {
  if (err.code === "TOO_MANY_ROWS") {
    trackCSVError("TOO_MANY_ROWS", csvRows.length, detectedDelimiter);
  }
  // ... existing error display ...
}

// Wrap ICS download
function handleDownloadICS() {
  downloadICS(calendar);
  trackCSVUsage(csvRows.length, hadErrors, true);
}

// Render banner
return (
  <>
    <TelemetryConsentBanner />
    {/* ... existing Import UI ... */}
  </>
);
```

**Acceptance Criteria:**
- [ ] CSV Import functionality unchanged (all existing tests pass)
- [ ] Telemetry integration does not introduce new errors
- [ ] No performance regression (page load <100ms slower)

**LOC Target:** 10-20 (integration hooks)

**Verification:**
```bash
npm --prefix frontend test  # All existing tests pass
npm --prefix frontend run build
npm --prefix frontend run dev  # Manual smoke test
```

---

## Phase C: Documentation & QA (T008)

---

### **T008: Documentation & Delta Doc**

**Objective:** Finalize all documentation, update CHANGELOG, and prepare quickstart guide.

**Files:**
- `specs/008-0020-3-csv-telemetry/quickstart.md` (new)
- `CHANGELOG.md` (append entry)
- `README.md` (optional: add "Privacy" section)

**Quickstart.md Content:**
1. **One-Command Verification:**
   ```bash
   npm --prefix frontend test && npm --prefix frontend run build && npm --prefix frontend run lint
   ```
2. **Manual QA Checklist:**
   - Copy Phase C checklist from plan.md (6 scenarios: default, enable, disable, DNT, keyboard, screen reader)
3. **Debug Mode:**
   ```javascript
   // Open browser console
   window.__telemetryDebug = true;
   // Trigger CSV error → inspect console output
   ```
4. **Rollback Instructions:**
   ```bash
   git revert <commit-sha>
   ```

**CHANGELOG.md Entry:**
```markdown
## [Unreleased]

### Added
- **CSV Import Telemetry (Opt-in):** Privacy-safe, client-side telemetry for CSV errors and usage patterns. Honors Do Not Track (DNT), defaults to OFF, zero PII collected. See [telemetry spec](specs/008-0020-3-csv-telemetry/spec.md) for details. (#PR_NUMBER)
```

**README.md Update (Optional):**
Add a "Privacy & Telemetry" section:
```markdown
## Privacy & Telemetry

PayPlan respects your privacy. CSV Import includes **opt-in telemetry** to help us improve the tool:

- **Default:** Telemetry is OFF until you enable it
- **No PII:** We collect only bucketed, anonymized error codes (never CSV content, amounts, or filenames)
- **DNT Respected:** If your browser sends Do Not Track, telemetry stays disabled
- **One-Click Disable:** Change your mind anytime via the telemetry toggle

[Learn what data we collect](specs/008-0020-3-csv-telemetry/data-model.md)
```

**Acceptance Criteria:**
- [ ] Quickstart.md includes exact verification command
- [ ] Manual QA checklist matches Phase C plan
- [ ] CHANGELOG entry follows existing format (see v1.1 entry)
- [ ] README update (if included) is concise (<100 words)
- [ ] All docs pass markdown linting (if configured)

**Constitution Gate:**
- Documentation is clear and user-friendly (verified)
- No implementation details leak into user-facing docs

**LOC Target:** N/A (docs only)

**Verification:**
```bash
# Run verification command
npm --prefix frontend test && npm --prefix frontend run build && npm --prefix frontend run lint

# Expected: All pass ✅

# Lint docs (if configured)
npm run lint:docs  # Or markdownlint, etc.
```

---

## Task Summary Table

| **Task** | **Phase** | **Objective**                          | **Files**                          | **LOC** | **Duration** |
|----------|-----------|----------------------------------------|------------------------------------|---------|--------------|
| T001     | A (TDD)   | Test zero-network guarantee            | telemetry.test.ts (new)            | 15-20   | 1-2 hours    |
| T002     | A (TDD)   | Test consent enable/disable            | telemetry.test.ts (append)         | 20-25   | 1-2 hours    |
| T003     | A (TDD)   | Test DNT detection                     | telemetry.test.ts (append)         | 15-20   | 1 hour       |
| T004     | A (TDD)   | Test payload redaction                 | telemetry.test.ts (append)         | 25-30   | 2-3 hours    |
| T005     | A (TDD)   | Test usage sampling                    | telemetry.test.ts (append)         | 20-25   | 1-2 hours    |
| T006     | B (Code)  | Implement telemetry module             | telemetry.ts (new)                 | 80-100  | 6-8 hours    |
| T007     | B (Code)  | Implement consent UI + integration     | TelemetryConsentBanner.tsx + Import.tsx | 50-80   | 6-8 hours    |
| T008     | C (Docs)  | Documentation & QA                     | quickstart.md, CHANGELOG.md        | N/A     | 2-3 hours    |
| **Total** |          |                                        | **≤4 files**                       | **130-180** | **3-5 days** |

**Constitution Compliance:**
- Total LOC: 130-180 (target: ≤140, stretch: ≤90)
- Files touched: 4 (telemetry.ts, TelemetryConsentBanner.tsx, Import.tsx, telemetry.test.ts)
- Runtime deps: 0 ✅
- Reversible: Single revert ✅

---

## Critical Success Factors

### For Each Task:
1. **Test-First:** T001-T005 must fail before T006 implementation begins
2. **Incremental Validation:** Run tests after each function added (not at end)
3. **Code Review Checkpoint:** PII checklist reviewed before merging T006
4. **A11y Verification:** Keyboard-only QA before marking T007 complete

---

## Handoff Checklist (For Developer Picking Up Tasks)

Before starting:
- [ ] Read spec.md (understand business goals)
- [ ] Read data-model.md (understand event schemas)
- [ ] Review plan.md (understand phasing)
- [ ] Check existing CSV Import tests (understand test patterns)

After each task:
- [ ] Run verification commands (listed in task)
- [ ] Update task status in project tracker
- [ ] Commit with descriptive message (e.g., "T001: Add zero-network telemetry test")

Before requesting review:
- [ ] All tasks T001-T008 complete
- [ ] Manual QA checklist (quickstart.md) fully checked
- [ ] No console errors/warnings in dev mode

---

## Change Log

| **Version** | **Date**       | **Changes**                      |
|-------------|----------------|----------------------------------|
| 1.0         | 2025-10-09     | Initial task breakdown           |

---

**Next Steps:**
1. Assign T001-T005 to TDD-focused developer
2. Begin Phase A immediately (no blockers)
3. Schedule code review for T006 (PII checklist focus)
4. Schedule a11y QA for T007 (keyboard + screen reader)
