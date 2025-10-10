# Feature Specification: CSV Import — Privacy-Safe Client Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Title:** CSV Import — Privacy-Safe Client Telemetry (Opt-in Observability)
**Status:** Draft
**Created:** 2025-10-09
**Branch:** feature/008-0020-3-csv-telemetry

---

## Executive Summary

Add an **explicitly opt-in**, **privacy-safe**, **client-only** telemetry layer to observe CSV Import errors and usage patterns without collecting personally identifiable information (PII). This feature enables product teams to understand real-world CSV import challenges while maintaining the project's constitutional constraints around privacy, accessibility, and minimal dependencies.

---

## Business Problem

### Current State
The CSV Import feature (v1.1) processes user-provided CSV files containing BNPL installment data. When parsing fails or users encounter errors, the development team has no visibility into:

- Which error types occur most frequently in production
- What CSV formats/delimiters users attempt to import
- Whether users successfully complete the import-to-ICS workflow
- How often users encounter specific validation errors

### Pain Points
1. **Blind Development**: Error prioritization relies on GitHub issues rather than production data
2. **Unknown Adoption**: No metric for successful vs. failed imports
3. **Format Discovery**: Unclear which CSV dialects (delimiters, date formats) users prefer
4. **Quality Feedback Loop**: Cannot measure impact of UX improvements (e.g., Clear button, currency regex)

### Business Impact
- **Inefficient Engineering**: Features may not address real user pain points
- **Reactive Support**: Cannot proactively fix common issues
- **Lost Opportunities**: Cannot identify high-value UX improvements

---

## Solution Overview

### What We're Building
A **minimal, client-side telemetry module** that:

1. **Defaults to OFF**: No telemetry until explicit user consent
2. **Honors Privacy Signals**: Respects browser Do Not Track (DNT)
3. **Collects Zero PII**: Only aggregated, bucketed, anonymized event data
4. **Works Offline-First**: Events queue locally; no network calls without consent
5. **Accessible Consent UI**: ARIA-compliant banner/dialog for opt-in/opt-out
6. **Fully Reversible**: Single-commit removal leaves CSV Import unchanged

### What We're NOT Building
- ❌ Third-party analytics SDK integration (future, behind feature flag)
- ❌ Server-side telemetry endpoints or authentication
- ❌ Any collection of CSV content, filenames, or provider names
- ❌ Tracking individual users across sessions

---

## User-Facing Features

### 1. Consent Banner (First Visit)
**When:** User first loads the Import page
**What:** Small, dismissible banner with clear language:
- "Help improve this tool by sharing anonymous usage data?"
- Two buttons: "Enable" | "Not now"
- Link to privacy policy/data dictionary (inline modal)

**Accessibility:**
- Keyboard navigable (Tab/Shift+Tab/Enter/Esc)
- ARIA role="dialog" or role="alert" with proper labeling
- Focus management (trap within banner, restore on dismiss)

### 2. Consent Management (Settings)
**Location:** Small "Telemetry" section in Import page footer or gear icon
**Controls:**
- Current status indicator (Enabled/Disabled/DNT Active)
- Toggle to enable/disable
- "Learn what we collect" link

### 3. Do Not Track Respect
**When:** Browser sends `DNT: 1` header
**Behavior:**
- Telemetry permanently disabled (overrides local consent)
- UI shows "Telemetry unavailable (DNT active)"
- Zero network calls, ever

---

## Data Collection Taxonomy

### Event Types

#### 1. `csv_error` (Sampled: 100%)
**Trigger:** CSV parsing or validation fails
**Fields:**
- `code`: Enum of error types (see below)
- `rowCountBucket`: `0 | 1-100 | 101-500 | 501-1000 | 1000+`
- `delimiter`: `comma | semicolon | other`
- `dnt`: `0 | 1`
- `consent`: `true | false`
- `appVersion`: Short git hash (e.g., `a1b2c3d`)

**Error Code Enum:**
- `CSV_TOO_LARGE` (file size exceeded)
- `TOO_MANY_ROWS` (>1000 rows)
- `WRONG_DELIMITER` (semicolon detected, comma expected)
- `INVALID_DATE_FORMAT` (unparseable date)
- `INVALID_REAL_DATE` (date fails regex)
- `INVALID_CURRENCY_FORMAT` (amount fails regex)

**Never Collected:** Raw CSV values, provider names, amounts, filenames

#### 2. `csv_usage` (Sampled: ≤10%)
**Trigger:** Successful CSV parse or ICS download
**Fields:**
- `rowsBucket`: Same as above
- `hadErrors`: `boolean` (any errors during session)
- `icsDownloaded`: `boolean` (user clicked Download ICS)
- `dnt`, `consent`, `appVersion`

**Sampling:** Deterministic client-side (e.g., hash session ID mod 10 === 0)

#### 3. `consent_change` (Sampled: 100%)
**Trigger:** User enables/disables telemetry, or DNT forces disable
**Fields:**
- `to`: `enabled | disabled`
- `reason`: `user_click | dnt_forced | reset`
- `appVersion`

---

## Privacy Guarantees

### GDPR/ePrivacy Compliance
1. **Lawful Basis:** Explicit consent (Article 6(1)(a))
2. **No Cookies:** LocalStorage only, exempt as "strictly necessary" for user choice
3. **Right to Withdraw:** Instant via toggle, consent removed from localStorage
4. **Data Minimization:** No identifiers, no free-text, bucketed aggregates only

### PII Redaction Rules
| **Data Type**           | **Status**       | **Justification**                     |
|-------------------------|------------------|---------------------------------------|
| Raw CSV rows            | ❌ Never sent    | Contains amounts, dates, providers    |
| Filenames               | ❌ Never sent    | May contain user identifiers          |
| Provider names (Klarna) | ❌ Never sent    | Indirectly reveals spending habits    |
| Error messages (full)   | ❌ Never sent    | May contain file paths or snippets    |
| Error codes (enum)      | ✅ Safe          | No PII, bucketed categories           |
| Row counts (bucketed)   | ✅ Safe          | Aggregated, cannot identify user      |
| IP addresses            | ❌ Never sent    | Client-side only, no server component |

### DNT Implementation
```
IF (navigator.doNotTrack === "1"
    OR navigator.msDoNotTrack === "1"
    OR window.doNotTrack === "1")
THEN
  telemetry.enabled = false
  UI shows "DNT Active"
  Zero network calls
END IF
```

---

## Success Metrics (Post-Launch)

### Adoption Metrics (Internal Analytics)
- % of users who opt-in to telemetry (target: >20%)
- % of DNT users (informational baseline)

### Data Quality Metrics
- Event schema validation pass rate: 100%
- Zero PII escapes (manual quarterly audit)
- Network call guard test: 100% pass rate

### Product Insights (After 30 Days)
- Top 3 CSV error types by frequency
- Median row count bucket for successful imports
- ICS download conversion rate (imports → downloads)

---

## User Stories

### US-1: First-Time Visitor
**As** a new user importing my first CSV
**I want** to be asked once about telemetry
**So that** I can make an informed choice without interruption

**Acceptance:**
- Banner appears on first page load only
- Dismissing = "not now" (can change later)
- Banner does not block CSV import functionality

### US-2: Privacy-Conscious User
**As** a user with DNT enabled
**I want** telemetry to be automatically disabled
**So that** I don't have to manually opt out

**Acceptance:**
- DNT overrides all consent settings
- UI shows "DNT Active" status
- Zero network activity occurs

### US-3: Data-Sharing User
**As** a user who wants to help improve the tool
**I want** to enable telemetry with confidence
**So that** I know exactly what data is shared

**Acceptance:**
- Privacy policy link shows full event schema
- Can disable anytime with one click
- Confirmation message on enable/disable

### US-4: Accessibility User
**As** a keyboard-only user
**I want** to manage consent without a mouse
**So that** I can use the feature independently

**Acceptance:**
- Tab/Shift+Tab navigates consent UI
- Enter/Space activates buttons
- Esc dismisses banner (= "not now")
- Screen reader announces consent state changes

---

## Non-Functional Requirements

### Performance
- **Consent Check:** <5ms overhead per Import page load
- **Event Queue:** Max 20 events buffered (FIFO eviction)
- **Bundle Size:** ≤2KB gzipped for telemetry module

### Reliability
- **Failure Mode:** Silent no-op if telemetry module crashes
- **Network Resilience:** Queue persists across page refresh (future enhancement)

### Security
- **No XSS Risk:** All event fields validated against enum/bucket schemas
- **No CSRF Risk:** Client-side only, no server endpoints

### Maintainability
- **Zero Dependencies:** No npm packages for MVP (future: Plausible SDK behind flag)
- **Reversible:** Single `git revert` removes all telemetry code

---

## Implementation Constraints (Constitution)

| **Constraint**        | **Limit**       | **Rationale**                          |
|-----------------------|-----------------|----------------------------------------|
| Files Touched         | ≤4              | Minimize blast radius                  |
| Net New LOC (impl)    | ≤140 (≤90 target) | Keep it minimal                      |
| Runtime Dependencies  | 0 (MVP)         | Future SDK via feature flag only       |
| Network Calls (no consent) | 0          | Absolute guarantee                     |
| Reversibility         | Single revert   | Must not entangle with CSV Import core |
| A11y Compliance       | WCAG 2.1 AA     | Consent UI must be fully accessible    |

---

## Risks & Mitigations

### Risk 1: User Distrust
**Impact:** Low opt-in rate, negative feedback
**Mitigation:**
- Clear, honest copy ("anonymous usage data")
- Show exact event schema in UI
- Prominent "Disable anytime" messaging

### Risk 2: Accidental PII Leak
**Impact:** GDPR violation, user privacy breach
**Mitigation:**
- Schema validation on enqueue (reject non-enum fields)
- Comprehensive test coverage (see tasks.md)
- Code review checklist: "No free-text fields"

### Risk 3: DNT Misdetection
**Impact:** Telemetry activates despite user preference
**Mitigation:**
- Test all DNT variants (navigator, ms, window)
- Fail-safe: If DNT detection errors, disable telemetry

### Risk 4: Consent UI Breaks A11y
**Impact:** Keyboard users cannot dismiss banner
**Mitigation:**
- Follow WAI-ARIA APG dialog pattern exactly
- Dedicated a11y test with keyboard-only QA

---

## Rollout Plan

### Phase 1: TDD Foundation (Tasks T001–T005)
- Write failing tests for consent, DNT, redaction, sampling
- Zero implementation code

### Phase 2: Minimal Implementation (Tasks T006–T007)
- Telemetry module: schema guards, queue, sampler
- Consent UI: accessible banner + localStorage wiring

### Phase 3: Documentation & QA (Task T008)
- Delta doc (this spec + quickstart updates)
- Manual QA checklist (keyboard, DNT, network spy)
- CHANGELOG entry

### Phase 4: Merge & Monitor
- Single PR with all tasks
- Post-merge: Monitor for console errors (debug hook)
- No rollback unless critical a11y or privacy issue

---

## Future Enhancements (Out of Scope)

### Short-Term (Next PR)
- **Plausible/Umami Integration:** Behind `VITE_TELEMETRY_BACKEND=plausible` flag
- **Event Persistence:** Save queue to localStorage, flush on next visit

### Long-Term (Separate Features)
- **Server-Side Aggregation:** Self-hosted analytics dashboard
- **User Segmentation:** Bucketed cohorts (e.g., "Power users" = >10 imports/month)
- **Real-Time Alerts:** Spike in specific error codes triggers Slack notification

---

## Appendix: Open Questions

1. **Consent UI Placement:** Banner (top) vs. modal (center) vs. toast (corner)?
   **Decision:** Banner (top), less intrusive, follows GDPR best practice

2. **Default Sampling Rate:** 10% for usage, 100% for errors sufficient?
   **Decision:** Start conservative, adjust based on volume

3. **LocalStorage Key Naming:** `telemetryConsentV1` or `payplan_telemetry_v1`?
   **Decision:** `telemetryConsentV1` (scoped to domain, versioned)

4. **Event Taxonomy Versioning:** Embed schema version in each event?
   **Decision:** Yes, add `schemaVersion: 1` to all events

---

## Sign-Off

**Author:** Claude (Spec Agent)
**Reviewers:** [To be assigned]
**Approval Required:** Product, Engineering, Legal/Privacy (if applicable)

**Next Steps:**
1. Review spec with stakeholders
2. Approve research.md sources (legal/privacy)
3. Proceed to tasks.md and implementation (Phases A–C)
