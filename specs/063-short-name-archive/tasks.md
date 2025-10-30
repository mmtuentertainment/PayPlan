# Implementation Tasks: Archive BNPL Code

**Feature**: Archive BNPL Code (Feature 063)
**Branch**: `063-short-name-archive`
**Date**: 2025-10-30
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

This document breaks down the implementation of Feature 063 (Archive BNPL Code) into atomic, executable tasks organized by user story. This is a structural refactor with **zero user-facing changes** - all routes (/bnpl, /demo, /import) must work identically before and after archival.

**Key Principles**:
- Tasks organized by user story for independent implementation
- Each user story is independently testable
- No automated tests required (Phase 1 manual testing only)
- Git history preserved using `git mv` + separate commits
- TypeScript strict mode validates all import changes

---

## Task Summary

| Phase | User Story | Task Count | Parallelizable | Duration Estimate |
|-------|-----------|------------|----------------|-------------------|
| Phase 1 | Setup | 3 tasks | 0 parallel | 30 min |
| Phase 2 | Foundational | 7 tasks | 0 parallel | 1-2 hours |
| Phase 3 | US1 (BNPL Accessibility) | 8 tasks | 3 parallel | 2-3 hours |
| Phase 4 | US2 (Demo/Import Preservation) | 3 tasks | 0 parallel | 30 min |
| Phase 5 | US3 (Developer Navigation) | 5 tasks | 2 parallel | 1-2 hours |
| Phase 6 | US4 (Rollback Documentation) | 2 tasks | 1 parallel | 30 min |
| Phase 7 | Polish & Validation | 6 tasks | 2 parallel | 1-2 hours |
| **Total** | **4 User Stories** | **34 tasks** | **8 parallel** | **2-4 days** |

---

## Dependencies & Execution Order

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: Move all files)
    ↓
    ├→ Phase 3 (US1: BNPL route testing)         [P0 - CRITICAL]
    ├→ Phase 4 (US2: Demo/Import testing)        [P0 - CRITICAL]
    ├→ Phase 5 (US3: Developer documentation)    [P1 - Can parallelize with US1/US2]
    └→ Phase 6 (US4: Rollback documentation)     [P1 - Can parallelize with US1/US2]
        ↓
    Phase 7 (Polish & final validation)
```

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (US1) → Phase 7

**Parallel Opportunities**:
- Phase 5 (US3) and Phase 6 (US4) can run in parallel with Phase 3 (US1) / Phase 4 (US2)
- Within Phase 3: Import updates for different file groups can be done in parallel
- Within Phase 7: README creation can be done in parallel with validation tasks

---

## Phase 1: Setup (Project Initialization)

**Goal**: Create directory structure and validate prerequisites

**Duration**: 30 minutes

**Dependencies**: None (blocking for all other phases)

### Tasks

- [ ] T001 Verify clean git working directory (no uncommitted changes to BNPL files)
- [ ] T002 Verify TypeScript compilation succeeds pre-archival (npm run build exits with code 0)
- [ ] T003 Create target directory structure for archived code (frontend/src/archive/bnpl/{pages,components/bnpl,lib/parsers,lib/storage,types})

**Validation**: All directories created, clean git status, successful build

---

## Phase 2: Foundational (File Relocation)

**Goal**: Move all 14 BNPL code files using `git mv` to preserve history

**Duration**: 1-2 hours

**Dependencies**: Phase 1 complete

**CRITICAL**: Commit each logical group separately WITHOUT modifying content to enable Git's rename detection heuristics

### Tasks

- [ ] T004 Move BNPL page component using git mv (frontend/src/pages/BNPLParser.tsx → frontend/src/archive/bnpl/pages/)
- [ ] T005 Commit page move with message "refactor(archive): move BNPL page to archive/bnpl/pages"
- [ ] T006 Move BNPL components using git mv (frontend/src/components/bnpl/{BNPLEmailInput,PaymentSchedulePreview,ProviderBadge}.tsx → frontend/src/archive/bnpl/components/bnpl/)
- [ ] T007 Commit component moves with message "refactor(archive): move BNPL components to archive/bnpl/components"
- [ ] T008 Move BNPL parser files using git mv (frontend/src/lib/bnpl-parser.ts and parsers/* → frontend/src/archive/bnpl/lib/)
- [ ] T009 Move BNPL storage and types using git mv (frontend/src/lib/storage/bnpl-storage.ts, frontend/src/types/bnpl.ts → frontend/src/archive/bnpl/{lib/storage,types}/)
- [ ] T010 Commit core logic moves with message "refactor(archive): move BNPL core logic, storage, and types to archive"

**Validation**: All 14 files moved, git log --follow shows full history, original directories empty

---

## Phase 3: User Story 1 - BNPL Feature Accessibility (P0)

**User Story**: As a current BNPL user, I want to continue accessing BNPL payment parsing features at /bnpl so that my existing workflow is not disrupted.

**Goal**: Update imports and verify /bnpl route works identically

**Duration**: 2-3 hours

**Dependencies**: Phase 2 complete

**Independent Test**: Navigate to /bnpl, paste Klarna email, verify payment schedule displays correctly

### Tasks

- [ ] T011 [US1] Update App.tsx import for BNPLParser (from './pages/BNPLParser' → './archive/bnpl/pages/BNPLParser')
- [ ] T012 [P] [US1] Update BNPLParser.tsx imports for BNPL components (in frontend/src/archive/bnpl/pages/BNPLParser.tsx)
- [ ] T013 [P] [US1] Update BNPL component imports for types (in frontend/src/archive/bnpl/components/bnpl/*.tsx)
- [ ] T014 [P] [US1] Update bnpl-parser.ts imports for provider parsers (in frontend/src/archive/bnpl/lib/bnpl-parser.ts)
- [ ] T015 [US1] Commit all import path updates with message "refactor(archive): update import paths for archived BNPL code"
- [ ] T016 [US1] Verify TypeScript compilation succeeds (npm run build exits with code 0)
- [ ] T017 [US1] Manual test: Navigate to /bnpl and verify page loads without errors
- [ ] T018 [US1] Manual test: Paste sample BNPL email (Klarna, Affirm, Afterpay) and verify parsing works correctly

**Acceptance Criteria**:
1. ✅ /bnpl route loads and shows email input interface
2. ✅ Payment reminders from all 6 providers parse correctly (provider, due date, amount, installment number)
3. ✅ Multiple emails separated by delimiters display as separate items
4. ✅ No console errors or broken imports

---

## Phase 4: User Story 2 - Demo/Import Feature Preservation (P0)

**User Story**: As a new user, I want the Demo and Import pages to continue working so I can evaluate the app without disruption.

**Goal**: Verify Demo and Import routes use email-extractor.ts and are unaffected by archival

**Duration**: 30 minutes

**Dependencies**: Phase 2 complete (can run in parallel with Phase 3)

**Independent Test**: Navigate to /demo, verify sample data displays. Navigate to /import, verify email processing works.

### Tasks

- [ ] T019 [US2] Verify email-extractor.ts imports are unchanged (should NOT reference archive/bnpl/)
- [ ] T020 [US2] Manual test: Navigate to /demo and verify demo page loads with sample transactions
- [ ] T021 [US2] Manual test: Navigate to /import and verify email extraction works with confidence scoring

**Acceptance Criteria**:
1. ✅ /demo page loads successfully and displays sample financial data
2. ✅ /import page processes email text using email-extractor.ts (NOT archived bnpl-parser.ts)
3. ✅ Extraction results include confidence scores and proper error handling
4. ✅ No console errors

---

## Phase 5: User Story 3 - Developer Code Navigation (P1)

**User Story**: As a developer, I want to understand codebase structure from directory organization so I can identify active vs archived features.

**Goal**: Archive specs and create documentation for developer onboarding

**Duration**: 1-2 hours

**Dependencies**: Phase 2 complete (can run in parallel with Phase 3/4)

**Independent Test**: Open codebase in IDE, verify BNPL code is in frontend/src/archive/bnpl/ and specs are in specs/archived/

### Tasks

- [ ] T022 [P] [US3] Move BNPL spec directory using git mv (specs/020-bnpl-parser → specs/archived/)
- [ ] T023 [US3] Create specs/archived/README.md explaining archived status and linking to migration doc
- [ ] T024 [P] [US3] Create manual-tests/archived/ directory and move BNPL test results (manual-tests/020-bnpl-parser-test-results.md → manual-tests/archived/)
- [ ] T025 [US3] Create manual-tests/archived/README.md explaining archived test results
- [ ] T026 [US3] Commit spec and test archival with message "docs(archive): move BNPL spec and test results to archived/"

**Acceptance Criteria**:
1. ✅ BNPL code organized in frontend/src/archive/bnpl/ with clear structure
2. ✅ BNPL specs moved to specs/archived/ with README explaining archived status
3. ✅ Migration documentation clearly explains what changed, why, and where to find code
4. ✅ Developer can distinguish active (budget) vs archived (BNPL) code without asking

---

## Phase 6: User Story 4 - Rollback Procedure Documentation (P1)

**User Story**: As a project maintainer, I want documented rollback instructions so I can revert the archival if business requirements change.

**Goal**: Create comprehensive migration documentation with rollback procedures

**Duration**: 30 minutes

**Dependencies**: Phase 2 complete (can run in parallel with Phase 3/4/5)

**Independent Test**: Read docs/migrations/archive-bnpl-code.md, verify rollback instructions are complete and actionable

### Tasks

- [ ] T027 [P] [US4] Create docs/migrations/archive-bnpl-code.md with complete migration documentation (what changed, why, impact, rollback, validation)
- [ ] T028 [US4] Commit migration documentation with message "docs(archive): add comprehensive migration documentation with rollback procedure"

**Acceptance Criteria**:
1. ✅ Rollback instructions include git revert commands and import path restoration
2. ✅ Validation steps confirm successful rollback (all routes work correctly)
3. ✅ Documentation covers 100% of required topics (what, why, impact, rollback, validation)
4. ✅ Maintainer can successfully revert archival using documented instructions

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Create archive READMEs, perform final validation, and create PR

**Duration**: 1-2 hours

**Dependencies**: Phases 3, 4, 5, 6 complete

### Tasks

- [ ] T029 [P] [US3] Create frontend/src/archive/bnpl/README.md documenting purpose, supported providers, route location, last active development date
- [ ] T030 [P] [US3] Commit all README files with message "docs(archive): add comprehensive documentation for archived BNPL code"
- [ ] T031 Verify git history preservation using git log --follow on sample archived file (frontend/src/archive/bnpl/pages/BNPLParser.tsx)
- [ ] T032 Run accessibility validation (screen reader + keyboard navigation on /bnpl route)
- [ ] T033 Create PR with title "refactor(archive): Archive BNPL code to frontend/src/archive/bnpl (Phase 2)" and comprehensive description
- [ ] T034 Respond to bot review feedback (Claude Code Bot + CodeRabbit AI) until both are green

**Validation**: All routes work, git history preserved, documentation complete, both bots approve PR

---

## Implementation Strategy

### MVP Scope (Minimum Viable Phase)

**Phase 3 (US1: BNPL Feature Accessibility)** is the MVP. If you can only complete one user story, complete this one:
- Move files (Phase 2)
- Update imports (T011-T015)
- Verify /bnpl route works (T016-T018)

This ensures existing BNPL users are not disrupted (P0 requirement).

### Incremental Delivery

1. **Day 1**: Phase 1 + Phase 2 + Phase 3 (US1)
   - Result: /bnpl route works with archived code

2. **Day 2**: Phase 4 (US2) + Phase 5 (US3) + Phase 6 (US4)
   - Result: All routes work, documentation complete

3. **Day 3-4**: Phase 7 (Polish) + PR creation + bot review loop
   - Result: PR ready for HIL approval

### Parallel Execution Examples

**During Phase 3 (US1)**:
```
Developer A: T012-T014 (update imports in parallel - different files)
Developer B: T022-T025 (archive specs in parallel with US1)
Developer C: T027 (create migration doc in parallel with US1)
```

**During Phase 7**:
```
Developer A: T029-T030 (README creation)
Developer B: T031-T032 (validation tasks)
```

---

## Validation Checklist

After completing all tasks, verify:

### Phase 1 Definition of Done

- [ ] **Functional**: /bnpl, /demo, /import routes work identically pre/post-archival
- [ ] **Manual Testing**: All 3 routes tested + BNPL parsing verified
- [ ] **Accessibility**: Screen reader + keyboard nav unchanged on /bnpl
- [ ] **Privacy**: No PII leaks (localStorage keys unchanged)
- [ ] **Error Handling**: Error messages unchanged
- [ ] **Responsive**: Routes tested on mobile/tablet/desktop
- [ ] **Documented**: Migration doc, archive README, specs README all created

### Success Criteria

- [ ] **Zero User-Facing Changes**: 100% feature parity on all routes
- [ ] **Zero Build Errors**: npm run build exits with code 0
- [ ] **File Organization**: 100% of BNPL code (60 files) in frontend/src/archive/bnpl/
- [ ] **Documentation Coverage**: Migration doc covers all required topics
- [ ] **Developer Clarity**: Directory structure distinguishes active vs archived code
- [ ] **Rollback Confidence**: Rollback instructions are complete and actionable
- [ ] **Git History**: git log --follow shows full commit history for archived files

---

## Rollback Procedure

If issues are discovered during implementation:

### Quick Rollback (Revert All Commits)

```bash
# Find first commit of archival
git log --oneline | grep "create archive directory structure"
# Note commit SHA (e.g., abc123)

# Revert all archival commits
git revert abc123..HEAD

# Or reset branch (DESTRUCTIVE)
git reset --hard main
git push origin 063-short-name-archive --force
```

### Detailed Rollback (See Migration Doc)

Complete rollback procedures documented in `docs/migrations/archive-bnpl-code.md` (created in Phase 6, Task T027).

---

## Notes

**Git Rename Detection**: Git does NOT store rename operations in commits. Instead, when you run `git log --follow`, Git analyzes content similarity between commits to infer renames. This is why committing moves separately (without content changes) is critical - it gives Git's heuristics clean data to work with.

**Phase 1 Compliance**: No automated tests are required for this refactor. Manual testing of all 3 routes (/bnpl, /demo, /import) is sufficient per Phase 1 definition of done.

**Zero User-Facing Changes**: This is a structural refactor only. Any change that affects user-visible behavior is out of scope and should be rejected.

---

**Ready to implement**: All tasks are atomic, independently testable, and organized by user story for incremental delivery. Begin with Phase 1 (Setup) and proceed sequentially through Phase 7.
