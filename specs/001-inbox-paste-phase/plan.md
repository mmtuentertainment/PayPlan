# Implementation Plan: PayPlan v0.1.4 — Inbox Paste Phase B

**Branch**: `001-inbox-paste-phase` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/matt/PROJECTS/PayPlan/specs/001-inbox-paste-phase/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   ✓ Loaded from /home/matt/PROJECTS/PayPlan/specs/001-inbox-paste-phase/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ No NEEDS CLARIFICATION markers found in spec
   ✓ Project Type: web (frontend + backend detected)
   ✓ Structure Decision: Option 2 (Web application)
3. Fill the Constitution Check section based on the content of the constitution document.
   ⚠ Constitution is template - using general best practices
4. Evaluate Constitution Check section below
   → Ready to proceed with Phase 0
5. Execute Phase 0 → research.md
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check section
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phase 2 is executed by /tasks command.

## Summary

Expand PayPlan's Inbox Paste feature to support 4 new BNPL providers (Afterpay, PayPal Pay in 4, Zip, Sezzle) and introduce a confidence scoring system to surface extraction quality. This is a frontend-only enhancement that adds row-level confidence indicators (High ≥0.8, Medium 0.6-0.79, Low <0.6) displayed as pills in the preview table, flags low-confidence rows in the Issues section with field-level hints, includes confidence in CSV exports, and enforces PII redaction on all error snippets. The implementation maintains backward compatibility with Phase A providers (Klarna, Affirm) and requires no API changes.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (frontend), Node.js 20.x (backend)
**Primary Dependencies**: React 19.1.1, Vite 7.1.7, Luxon 3.7.2, Zod 4.1.11 (frontend); Express 4.18.2, Luxon 3.4.4 (backend)
**Storage**: Client-side only (no persistence for this feature)
**Testing**: Jest 29.6.4 (backend), Vite test runner (frontend)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge latest 2 versions)
**Project Type**: web (frontend + backend separated)
**Performance Goals**: Parse 50 emails in <2s; UI remains responsive during extraction
**Constraints**: Frontend-only changes; no new npm dependencies; POST /api/plan API unchanged; JSDoc ≥80% on changed exports
**Scale/Scope**: ~6-8 new provider detectors; ~10 atomic tasks; 40+ unit tests; 6+ integration tests

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Since the project constitution is a template and not yet ratified, we apply general software engineering best practices:

✓ **Library-First Thinking**: New provider detectors in `extraction/providers/detector.ts` are pure functions; confidence engine in `email-extractor.ts` is self-contained
✓ **Test-First (TDD)**: Contract tests and unit tests will be written before implementation in Phase 1
✓ **Simplicity**: Confidence scoring uses weighted sum (no ML); PII redaction uses simple regex patterns; no new dependencies
✓ **Backward Compatibility**: Phase A providers (Klarna, Affirm) remain unchanged; existing CSV/preview components extended, not replaced
✓ **Performance**: Parsing budget <2s for 50 emails enforced via integration test; non-blocking UI via async extraction
✓ **Accessibility**: Confidence pills have text alternatives; Issues section uses aria-live="polite"

**No constitutional violations identified.**

## Project Structure

### Documentation (this feature)
```
specs/001-inbox-paste-phase/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Web application structure (frontend + backend)
backend/
├── src/
│   ├── lib/              # Core business logic (payday, risk, action, ics)
│   ├── routes/           # Express route handlers (plan.js)
│   └── middleware/       # Validation, rate limiting
└── tests/
    ├── unit/
    └── integration/

frontend/
├── src/
│   ├── components/       # React components
│   │   ├── EmailInput.tsx          # Existing
│   │   ├── EmailPreview.tsx        # MODIFIED: Add confidence pills, CSV column
│   │   └── EmailIssues.tsx         # MODIFIED: Add low-confidence flags
│   ├── lib/              # Frontend business logic
│   │   ├── extraction/providers/detector.ts   # MODIFIED: Add Afterpay, PayPal Pay in 4, Zip, Sezzle
│   │   ├── email-extractor.ts      # MODIFIED: Add confidence scoring
│   │   ├── extraction/extractors/date.ts          # REUSED: No changes (Phase A)
│   │   └── extraction/helpers/redaction.ts               # NEW: PII redaction utility
│   └── pages/
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Option 2 (Web application with frontend + backend)

## Phase 0: Outline & Research

**Goal**: Resolve any technical unknowns and document provider signature research.

### Research Tasks

1. **Provider Signature Research**:
   - Task: Research email patterns for Afterpay, PayPal Pay in 4, Zip, Sezzle
   - Method: Analyze sample BNPL payment reminder emails (real or simulated)
   - Output: Email domain signatures, keyword patterns, amount/date/installment phrase patterns
   - Rationale: Needed to build robust provider detectors

2. **Confidence Scoring Algorithm**:
   - Task: Define weighted scoring formula based on matched signals
   - Method: Extract from FR-136: provider(0.35) + date(0.25) + amount(0.2) + installment(0.15) + autopay(0.05)
   - Output: Deterministic formula with threshold definitions
   - Rationale: Must be simple, fast, and human-understandable

3. **PII Redaction Patterns**:
   - Task: Define regex patterns for email, amount, account number, name detection
   - Method: Survey existing frontend code for any redaction; research OWASP PII patterns
   - Output: Regex set with test cases
   - Rationale: Privacy requirement (FR-139)

4. **Existing Phase A Architecture Review**:
   - Task: Review extraction/providers/detector.ts, email-extractor.ts, extraction/extractors/date.ts structure
   - Method: Read existing code to understand extension points
   - Output: Extension strategy document
   - Rationale: Ensure backward compatibility (FR-145)

**Deliverable**: `research.md` with provider signatures, confidence formula, PII patterns, and extension strategy

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Data Model (`data-model.md`)

Extract from spec's Key Entities section:
- **Payment Item**: Add `confidence: number` field (0-1) to existing structure
- **Confidence Score**: Document weighted formula and threshold mappings
- **Provider Signature**: Define structure for each new provider (domain, keywords, patterns)
- **Extraction Issue**: Add `fieldHints: string[]` for low-confidence items

### 2. API Contracts (`contracts/`)

**No new API endpoints** (FR-143 constraint: no backend changes).

However, we document the **internal contract** between extraction and preview:

- `contracts/email-extraction-output.schema.json`: JSON schema for extracted payment items including confidence field
- `contracts/confidence-thresholds.yaml`: Threshold definitions (High/Med/Low)

### 3. Contract Tests

Generate failing tests in `frontend/tests/unit/`:
- `provider-detectors.test.ts`: Test each new provider (happy path + edge cases)
- `email-extractor.test.ts`: Test confidence calculation with known inputs
- `redact.test.ts`: Test PII redaction patterns
- `EmailPreview.test.tsx`: Test confidence pill rendering
- `EmailIssues.test.tsx`: Test low-confidence flagging

### 4. QuickStart (`quickstart.md`)

User validation steps:
1. Paste 6 emails (Afterpay, PayPal Pay in 4, Zip, Sezzle, Klarna, Affirm)
2. Verify ≥5 rows extracted with confidence pills visible
3. Verify any row <0.6 appears in Issues with hints
4. Click "Copy as CSV" and verify confidence column present
5. Click "Build Plan" and verify plan builds successfully
6. Total time <60s from paste to plan

### 5. Agent Context File

No agent-specific file update needed (constitution template suggests this, but repo doesn't have `.claude/` or similar).

**Deliverable**: data-model.md, contracts/, failing tests, quickstart.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `templates/tasks-template.md` (if exists) as base
- Generate from user-provided task list in initial request:
  1. Confidence engine scaffold (email-extractor.ts)
  2. Confidence pill UI + CSV column (EmailPreview.tsx)
  3. PII redaction enforcement (extraction/helpers/redaction.ts + EmailIssues.tsx)
  4. Afterpay detector (extraction/providers/detector.ts)
  5. Thresholded Issues (EmailIssues.tsx)
  6. Tests Phase A' (40+ unit total target)
  7. Integration test (emails→preview→CSV→/api/plan)
  8. Docs & JSDoc (README, comments)
  9. Phase b: PayPal Pay in 4 detector + tests
  10. Phase b: Zip + Sezzle detectors + tests

**Ordering Strategy**:
- TDD order: Contract tests → Implementation → Integration tests
- Dependency order: extraction/helpers/redaction.ts → extraction/providers/detector.ts → email-extractor.ts → UI components
- Mark [P] for parallel execution where files are independent

**Estimated Output**: 10 numbered, ordered tasks in tasks.md (as specified in user input)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                |

**No complexity violations identified.**

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) → research.md created
- [x] Phase 1: Design complete (/plan command) → data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command - NOT executed by /plan)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations introduced)
- [x] All NEEDS CLARIFICATION resolved (none found in spec)
- [x] Complexity deviations documented (none)

**Deliverables Created**:
- [x] plan.md (this file)
- [x] research.md (provider signatures, confidence algorithm, PII patterns)
- [x] data-model.md (Item interface with confidence, Provider types, thresholds)
- [x] contracts/email-extraction-output.schema.json (JSON schema)
- [x] contracts/confidence-thresholds.yaml (threshold config)
- [x] contracts/README.md (contract documentation)
- [x] quickstart.md (6-provider validation steps)

---
*Based on PayPlan Project Practices - Constitution template pending ratification*
