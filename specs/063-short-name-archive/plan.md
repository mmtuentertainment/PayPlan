# Implementation Plan: Archive BNPL Code

**Branch**: `063-short-name-archive` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/063-short-name-archive/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This is a **structural refactor** (Phase 2 of 3-phase product pivot) that relocates 60 BNPL-specific files from frontend/src/ to frontend/src/archive/bnpl/ to reflect PayPlan's evolution from BNPL-focused to budget-first app. The archival preserves all BNPL functionality (100% feature parity), maintains git history, and creates comprehensive documentation for rollback procedures. This is a **zero user-facing changes** refactor—all routes (/bnpl, /demo, /import) continue working identically. Technical approach: `git mv` for history preservation, systematic import path updates, documentation creation (migration guide, archive README), and comprehensive manual testing of all affected routes.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (strict mode), React 19.1.1
**Primary Dependencies**: React Router 7.0.2 (routing), Vite 6.1.9 (build tool), Zod 4.1.11 (validation)
**Storage**: localStorage (privacy-first, no server required)
**Testing**: Manual testing only (Phase 1 requirement—no automated tests required)
**Target Platform**: Web (Vercel deployment, modern browsers)
**Project Type**: Web application (frontend/src/ structure with pages/, components/, lib/)
**Performance Goals**: Zero performance regression (maintain existing load times)
**Constraints**: Zero user-facing changes (100% feature parity), git history preservation, TypeScript compilation success (0 errors)
**Scale/Scope**: 60 files relocated, 10 core requirements + 5 edge cases, 3 routes affected (/bnpl, /demo, /import)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Privacy-First Architecture ✅ **PASS**

**Requirement**: localStorage-first, no PII leaks, explicit consent for server features

**Compliance**:
- ✅ **No privacy impact**: This is an internal code refactor with zero changes to data storage, PII handling, or user privacy
- ✅ **localStorage unchanged**: BNPL code continues using same localStorage keys (no schema changes)
- ✅ **No new tracking**: No analytics, telemetry, or server communication added
- ✅ **PII sanitization preserved**: Existing PII sanitization patterns in bnpl-parser.ts remain functional

**Rationale**: Code relocation does not affect privacy architecture. All privacy guarantees remain unchanged.

---

### II. Accessibility-First Development ✅ **PASS**

**Requirement**: WCAG 2.1 AA compliance, screen reader compatible, keyboard navigation

**Compliance**:
- ✅ **Zero UI changes**: No changes to React components, ARIA labels, or keyboard navigation
- ✅ **Route preservation**: /bnpl route continues working with identical accessibility
- ✅ **Manual testing required**: Phase 1 Definition of Done mandates screen reader + keyboard nav testing (will verify post-archival)
- ✅ **No accessibility regressions**: Import path changes do not affect ARIA labels or focus management

**Rationale**: Code organization refactors cannot introduce accessibility issues. Manual accessibility testing will verify zero regression.

---

### III. Free Core, Premium Optional ✅ **PASS**

**Requirement**: BNPL features must remain free forever (constitutional mandate)

**Compliance**:
- ✅ **BNPL remains free**: All BNPL features (email parser, risk detection, CSV) remain accessible at /bnpl route
- ✅ **Zero functional changes**: Archival preserves 100% feature parity (no paywalling, no deprecation)
- ✅ **Constitution alignment**: Feature 020 (BNPL Parser) listed in "Always Free" (Constitution line 101: "BNPL email parser (all 6 providers)")

**Rationale**: Code archival does not change pricing model. BNPL features remain free per constitutional mandate.

---

### IV. Visual-First Insights ✅ **PASS (N/A)**

**Requirement**: Every financial concept must have visual representation

**Compliance**:
- ✅ **No visual changes**: BNPL parser UI (payment schedule visualization) remains unchanged
- ✅ **Charts preserved**: Existing payment schedule tables/charts continue rendering
- ✅ **N/A for refactor**: This is a code organization change, not a visual feature

**Rationale**: Not applicable—this refactor does not affect visualization or user-facing design.

---

### V. Mobile-First, Responsive Design ✅ **PASS (N/A)**

**Requirement**: Mobile-first CSS, touch-friendly UI, PWA support

**Compliance**:
- ✅ **Zero responsive changes**: No CSS modifications, no layout changes
- ✅ **Routes preserved**: /bnpl route works identically on mobile/tablet/desktop
- ✅ **N/A for refactor**: Code relocation does not affect responsive design

**Rationale**: Not applicable—this refactor does not affect CSS or responsive layout.

---

### VI. Quality-First Development (PHASED) ✅ **PASS**

**Requirement**: Phase 1: Manual testing only, no automated tests required

**Compliance**:
- ✅ **Phase 1 compliant**: No automated tests created (per Phase 1 definition of done)
- ✅ **Manual testing plan**: Comprehensive manual testing of /bnpl, /demo, /import routes (spec requirement #10)
- ✅ **TypeScript strict mode**: Compilation success guarantees no broken imports (zero tolerance for errors)
- ✅ **User-facing features > Infrastructure**: This refactor improves developer experience (codebase clarity) without adding infrastructure bloat

**Rationale**: Phase 1 allows refactors with manual testing. TypeScript compilation + manual route testing sufficient for this scope.

---

### VII. Simplicity and YAGNI ✅ **PASS**

**Requirement**: Start simple, avoid over-engineering, <2 week features

**Compliance**:
- ✅ **Simple approach**: Use `git mv` (standard tool), systematic import updates (no fancy scripts)
- ✅ **YAGNI-aligned decisions**:
  - README.md only (no INDEX.md) per clarification #3
  - lib/shared/ only if circular deps found per clarification #2
  - No generic archive tooling (YAGNI per out-of-scope #6)
- ✅ **<2 week scope**: Estimated 2-4 days for 60 files + documentation + testing
- ✅ **Clear purpose**: Reflects product direction (budget-first), improves developer onboarding

**Rationale**: This refactor follows YAGNI principle—solves real problem (developer confusion) without over-engineering.

---

### Spec-Kit Tier Assessment

**Feature Tier**: **Tier 1 (Medium Complexity)**

**Rationale**:
- **Estimated Duration**: 2-4 days (within Tier 1 range: 3-7 days)
- **Complexity**: Moderate—60 files, import path updates, documentation, but zero functional changes
- **Workflow**: Spec + Plan (this document) + manual testing (skip automated tests per Phase 1)
- **Constitution Alignment**: Full Spec-Kit justified—structural refactor affecting 60 files warrants planning documentation

**Phase 1 Definition of Done**:
1. ✅ **Functional**: /bnpl, /demo, /import routes work identically pre/post-archival
2. ✅ **Manual Testing**: Test all 3 routes + verify BNPL parsing works
3. ✅ **Accessibility**: Verify screen reader + keyboard nav unchanged
4. ✅ **Privacy**: No PII leaks (none expected—code relocation only)
5. ✅ **Error Handling**: Verify error messages unchanged
6. ✅ **Responsive**: Test routes on mobile/tablet/desktop
7. ✅ **Documented**: Migration doc (docs/migrations/archive-bnpl-code.md), archive README, specs README

---

## Constitution Check Result: ✅ **ALL GATES PASS**

**Summary**: This feature aligns with all constitutional principles. As an internal refactor with zero user-facing changes, it:
- Maintains privacy (no data changes)
- Preserves accessibility (no UI changes)
- Keeps BNPL features free (100% feature parity)
- Follows YAGNI (simple approach, no over-engineering)
- Complies with Phase 1 (manual testing only)

### Violations

None

### Proceed to Phase 0 (Research)

---

## Phase 0: Research ✅ **COMPLETE**

**Status**: Research complete with all questions resolved and implementation strategies defined.

**Artifacts Created**:
- ✅ `research.md` (7 research topics, evidence-based decisions)

**Key Findings**:
1. Manual test directory structure resolved (create archived/ subdirectory)
2. Shared utilities extraction strategy defined (lib/shared/ if needed)
3. Archived specs indexing approach decided (README.md only, YAGNI)
4. Git history preservation best practices documented (use git mv)
5. Import path update patterns defined (systematic grep + TypeScript validation)
6. Migration documentation templates created
7. Email extractor independence verified

**Proceed to Phase 1 (Design)**

---

## Phase 1: Design & Contracts ✅ **COMPLETE**

**Status**: All design artifacts generated, contracts not applicable (structural refactor).

**Artifacts Created**:
- ✅ `data-model.md` - Complete file relocation mapping (60 files), import transformations, validation checklist
- ✅ `quickstart.md` - Step-by-step implementation guide with 8 phases, git commands, validation procedures

### Contracts

Not applicable (no API changes, structural refactor only)

### Proceed to Phase 2 (Tasks)

---

## Phase 2: Implementation ✅ **COMPLETE**

**Status**: Feature 063 implemented, merged to main, deployed.

**PR**: #55 - Archive BNPL Code
**Branch**: `063-short-name-archive`
**Commits**: 31 total (22 original + 9 bot review compliance)
**Merged**: 2025-10-30 (commit `06a3e65`)

**Implementation Summary**:
- ✅ Archived 60 BNPL files to `frontend/src/archive/bnpl/`
- ✅ Fixed Date.setMonth() boundary bug (Affirm parser)
- ✅ Eliminated type duplication (ADR 001: Interface-First Type Strategy)
- ✅ Fixed schema duplication (ADR 002: Canonical Zod Schema Locations)
- ✅ Created 3 comprehensive ADRs (1,016 lines documentation)
- ✅ Fixed code quality issues (magic numbers, duplicate code, markdown formatting)
- ✅ Updated CLAUDE.md with ADR process
- ✅ TypeScript compilation: 0 errors
- ✅ All CodeRabbit issues: FIXED
- ✅ HIL approved and merged to main

**Key Achievements**:
1. **Code Organization**: All BNPL code moved to archive/ with preserved git history
2. **Architecture Documentation**: 3 ADRs documenting major refactoring decisions
3. **Code Quality**: Comprehensive bot review compliance (100% issues addressed)
4. **Zero Regressions**: All routes (/bnpl, /demo, /import) work identically
5. **Constitutional Compliance**: Privacy, accessibility, Phase 1 requirements met

### Proceed to Phase 3 (Dependency Cleanup)

---

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Structure Pattern**: Web application (frontend-only React app)

#### Current Structure (BEFORE archival)

```text
frontend/src/
├── pages/
│   └── BNPLParser.tsx                # Main BNPL page component
├── components/
│   └── bnpl/                         # BNPL-specific components
│       ├── BNPLEmailInput.tsx
│       ├── PaymentSchedulePreview.tsx
│       └── ProviderBadge.tsx
├── lib/
│   ├── bnpl-parser.ts                # Core BNPL parsing logic
│   ├── parsers/                      # Provider-specific parsers
│   │   ├── affirm.ts
│   │   ├── afterpay.ts
│   │   ├── klarna.ts
│   │   ├── paypal-credit.ts
│   │   ├── sezzle.ts
│   │   ├── zip.ts
│   │   └── index.ts
│   └── storage/
│       └── bnpl-storage.ts           # BNPL localStorage utilities
└── types/
    └── bnpl.ts                       # BNPL TypeScript types

App.tsx                                # Route definitions (includes /bnpl)
```

#### Target Structure (AFTER archival)

```text
frontend/src/
├── archive/
│   └── bnpl/                         # 🆕 ARCHIVED BNPL CODE
│       ├── README.md                 # 🆕 Archive documentation
│       ├── pages/
│       │   └── BNPLParser.tsx        # ← MOVED
│       ├── components/
│       │   └── bnpl/                 # ← MOVED
│       │       ├── BNPLEmailInput.tsx
│       │       ├── PaymentSchedulePreview.tsx
│       │       └── ProviderBadge.tsx
│       ├── lib/
│       │   ├── bnpl-parser.ts        # ← MOVED
│       │   ├── parsers/              # ← MOVED
│       │   │   ├── affirm.ts
│       │   │   ├── afterpay.ts
│       │   │   ├── klarna.ts
│       │   │   ├── paypal-credit.ts
│       │   │   ├── sezzle.ts
│       │   │   ├── zip.ts
│       │   │   └── index.ts
│       │   └── storage/
│       │       └── bnpl-storage.ts   # ← MOVED
│       └── types/
│           └── bnpl.ts               # ← MOVED
└── [other active code]

App.tsx                                # Updated imports (archive/bnpl/* paths)
```

#### Documentation Structure (AFTER archival)

```text
specs/
├── archived/                          # 🆕 ARCHIVED SPECS
│   ├── README.md                      # 🆕 Archival documentation
│   └── 020-bnpl-parser/               # ← MOVED
│       ├── spec.md
│       ├── plan.md
│       └── [other spec files]
└── [active specs]

manual-tests/
├── archived/                          # 🆕 ARCHIVED TEST RESULTS
│   ├── README.md                      # 🆕 Archival documentation
│   └── 020-bnpl-parser-test-results.md  # ← MOVED
└── [active test results]

docs/
└── migrations/
    └── archive-bnpl-code.md           # 🆕 Migration documentation
```

**Structure Decision**:

This refactor uses the **web application pattern** (Option 2 from template) with frontend-only structure. The archival creates a new `frontend/src/archive/bnpl/` directory that mirrors the original structure (pages/, components/, lib/, types/) to preserve organizational clarity. This approach:

- **Preserves git history**: Using `git mv` maintains file lineage
- **Maintains organization**: Archive mirrors original structure
- **Simplifies rollback**: Clear before/after structure for reversing changes
- **Signals intent**: archive/ directory name clearly indicates archived status

**File Count**: 60 files total (14 BNPL code files + spec files + test files + migration documentation)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ **NO VIOLATIONS** - No complexity tracking required

This refactor aligns with all constitutional principles (see Constitution Check Result above). No violations to justify.

---

## Planning Phase Summary

**Status**: ✅ **PLANNING COMPLETE** - Ready for `/speckit.tasks`

**Deliverables**:

1. ✅ **plan.md** (this file) - Complete implementation plan with:
   - Summary and technical context
   - Constitution check (all 7 principles PASSED)
   - Project structure (before/after diagrams)
   - Phase 0 research complete
   - Phase 1 design artifacts complete

2. ✅ **research.md** - Comprehensive research with 7 topics:
   - Manual test directory structure (RESOLVED)
   - Shared utilities extraction (RESOLVED)
   - Archived specs indexing (RESOLVED)
   - Git history preservation best practices
   - Import path update patterns
   - Migration documentation templates
   - Email extractor independence verification

3. ✅ **data-model.md** - Complete file relocation mapping:
   - 14 BNPL code files mapped (pages, components, lib, types)
   - Import path transformation rules
   - Directory structure before/after diagrams
   - Validation commands (git, TypeScript, grep)
   - Edge case detection strategies

4. ✅ **quickstart.md** - Step-by-step implementation guide:
   - 8-phase implementation workflow
   - Git commands for file relocation
   - Import path update procedures
   - Validation checklist at each checkpoint
   - Documentation creation templates
   - PR creation and bot review loop

**Next Phase**: Run `/speckit.tasks` to generate atomic task breakdown with acceptance criteria

**Branch**: `063-short-name-archive`
**Estimated Duration**: 2-4 days (Tier 1 complexity)
**Ready for Implementation**: ✅ YES
