# Task Breakdown: Dependency Cleanup (Phase 3 - Revised)

**Feature**: 064-short-name-dependency
**Branch**: `064-short-name-dependency`
**Status**: Ready for Implementation
**Estimated Duration**: 1-2 hours

---

## ⚠️ SCOPE REVISION (Post-Research)

**Original Plan**: Remove `ics@3.8.1` dependency (used only by archived code)

**Research Finding**: `ics` is **actively used** by Demo.tsx (line 5) and Import.tsx (line 4) for calendar download functionality

**Revised Scope**:
- ✅ Update README.md to budget-first architecture
- ✅ Validate all dependencies are correctly used (no removal)
- ✅ Manual testing of all 11 routes (including Demo/Import `.ics` functionality)
- ✅ Mark Phase 3 complete

**See**: [research.md](research.md) for detailed findings

---

## Implementation Strategy

**Approach**: Documentation update + comprehensive validation (no code changes)

**MVP Scope**: User Story 2 (Documentation Update) - Can be completed independently in 30-45 minutes

**Dependencies**:
- Phase 2 complete (PR #55 merged)
- Clean working directory
- Build succeeds (`npm run build` exits with code 0)

**Parallel Opportunities**:
- All phases are sequential (documentation update → validation)
- Individual route testing can be parallelized within User Story 3

---

## Phase 1: Setup & Prerequisites

**Goal**: Verify environment is ready for Phase 3 implementation

**Duration**: 5-10 minutes

### Tasks

- [X] T001 Verify Phase 2 complete by checking PR #55 merged status
- [X] T002 Verify clean working directory by running `git status`
- [X] T003 Verify current branch is `064-short-name-dependency`
- [X] T004 Verify build succeeds by running `npm run build` from `frontend/`
- [X] T005 Verify research findings by reading `specs/064-short-name-dependency/research.md`

**Validation**: All tasks complete with no errors

---

## Phase 2: Foundational Analysis (COMPLETE)

**Goal**: Analyze dependency usage to determine removal candidates

**Status**: ✅ **COMPLETE** (see research.md)

### Key Findings

✅ **Research Complete** (documented in research.md):
- `ics@3.8.1` used by Demo.tsx, Import.tsx (active code) + lib/ics-generator.js (archived)
- `luxon@3.7.2` used by Demo.tsx, Import.tsx, email-extractor.ts, preferences (active code)
- `papaparse@5.5.3` used by Import.tsx (active code)
- `recharts@3.3.0` used by Dashboard.tsx (active code)
- **Decision**: KEEP all dependencies (all actively used)

**No tasks required** - Research phase already complete

---

## Phase 3: User Story 2 - Documentation Update (P2)

**Goal**: Update README.md to reflect budget-first architecture

**User Story**: As a new developer joining the PayPlan project, I want the README.md to accurately reflect the product's current direction (budget-first) so that I understand what the app does, what features to prioritize, and how BNPL fits into the overall architecture.

**Independent Test**: Read the updated README.md and verify it clearly states PayPlan is a budget-first app with BNPL as a secondary feature.

**Duration**: 30-45 minutes

### Tasks

- [X] T006 [US2] Read current README.md to identify sections needing updates
- [X] T007 [US2] Update README.md product description to "Privacy-First Budgeting App" in first paragraph
- [X] T008 [US2] Reorder README.md feature list with budget features first, BNPL as differentiator
- [X] T009 [US2] Update README.md architecture section to reference `frontend/src/` (active) and `frontend/src/archive/bnpl/` (archived)
- [X] T010 [US2] Verify README.md markdown syntax is valid with no broken links
- [X] T011 [US2] Verify README.md has no PII in documentation

**Acceptance Criteria** (User Story 2):
- ✅ README clearly states PayPlan is a "privacy-first budgeting app"
- ✅ Budget features mentioned first, BNPL as secondary/differentiator
- ✅ Architecture section reflects active vs. archived code structure
- ✅ New developers can understand product direction from README alone

---

## Phase 4: User Story 1 - Dependency Validation (P1 - Revised)

**Goal**: Verify all dependencies are correctly used and none can be removed

**User Story** (REVISED): As a developer, I want to verify all npm dependencies are actively used so that the dependency tree is clean and the project is easy to maintain.

**Independent Test**: Run dependency analysis commands and verify all 4 dependencies (ics, luxon, papaparse, recharts) are actively used.

**Duration**: 10-15 minutes

### Tasks

- [X] T012 [P] [US1] Verify `ics@3.8.1` usage by running `grep -n "from 'ics'" frontend/src/pages/Demo.tsx frontend/src/pages/Import.tsx`
- [X] T013 [P] [US1] Verify `luxon@3.7.2` usage by running `grep -r "from 'luxon'" frontend/src --exclude-dir=archive | head -5`
- [X] T014 [P] [US1] Verify `papaparse@5.5.3` usage by running `grep -r "papaparse" frontend/src --exclude-dir=archive`
- [X] T015 [P] [US1] Verify `recharts@3.3.0` usage by running `grep -r "recharts" frontend/src --exclude-dir=archive`
- [X] T016 [US1] Document findings: All 4 dependencies are actively used, no removal possible

**Acceptance Criteria** (User Story 1 - Revised):
- ✅ `ics` verified as used by Demo.tsx (line 5) and Import.tsx (line 4)
- ✅ `luxon` verified as used by multiple active files
- ✅ `papaparse` verified as used by Import.tsx
- ✅ `recharts` verified as used by Dashboard.tsx
- ✅ No dependencies identified for removal

---

## Phase 5: User Story 3 - System Health Validation (P1)

**Goal**: Verify the system's health after documentation update

**User Story**: As a project maintainer, I want to verify the system's health after documentation update so that I'm confident no regressions were introduced and all routes work correctly.

**Independent Test**: Run validation checklist (npm install, npm run build, manual testing of all 11 routes, browser console check).

**Duration**: 30-40 minutes

### Tasks (Build Validation)

- [X] T017 [US3] Verify `npm install` completes successfully with no errors
- [X] T018 [US3] Verify `npm run build` exits with code 0 and reports 0 TypeScript errors

### Tasks (Route Testing - Can be parallelized)

**Budget App Routes** (6 routes):
- [X] T019 [P] [US3] Manual test `/` route: Dashboard loads, no console errors
- [X] T020 [P] [US3] Manual test `/categories` route: Categories loads, no console errors
- [X] T021 [P] [US3] Manual test `/budgets` route: Budgets loads, no console errors
- [X] T022 [P] [US3] Manual test `/transactions` route: Transactions loads, no console errors
- [X] T023 [P] [US3] Manual test `/archives` route: Archive list loads, no console errors
- [X] T024 [P] [US3] Manual test `/archives/:id` route: Archive detail loads (or 404 if no data)

**Demo/Import Routes** (2 routes - CRITICAL: Test `.ics` functionality):
- [X] T025 [US3] Manual test `/demo` route: Demo loads, click "Run Demo", click "Download .ics Calendar", verify `.ics` file downloads and opens in calendar app
- [X] T026 [US3] Manual test `/import` route: Import loads, upload CSV, click "Download .ics", verify `.ics` file downloads and opens in calendar app

**BNPL Routes** (2 routes - Archived):
- [X] T027 [P] [US3] Manual test `/bnpl-home` route: BNPL home loads, no console errors
- [X] T028 [P] [US3] Manual test `/bnpl` route: BNPL parser loads, no console errors

**System Route** (1 route):
- [X] T029 [P] [US3] Manual test `/settings` route: Settings loads, no console errors

### Tasks (Console Validation)

- [X] T030 [US3] Open browser DevTools (F12) and verify 0 JavaScript errors across all 11 routes
- [X] T031 [US3] Verify 0 network errors (404, 500, etc.) in browser DevTools Network tab

**Acceptance Criteria** (User Story 3):
- ✅ `npm install` completes with no errors
- ✅ `npm run build` exits with code 0, 0 TypeScript errors
- ✅ All 11 routes load successfully (100% route availability)
- ✅ Demo/Import `.ics` download functionality works correctly
- ✅ Browser console shows 0 JavaScript errors
- ✅ No network errors in DevTools

---

## Phase 6: User Story 4 - Preserve BNPL Features (P3)

**Goal**: Ensure BNPL features remain accessible and functional

**User Story**: As a user who relies on BNPL tracking features, I want the BNPL functionality to continue working at `/bnpl` after Phase 3 so that my workflow is not disrupted.

**Independent Test**: Manually test the `/bnpl` route and verify all BNPL parser functionality works as before.

**Duration**: 10-15 minutes

### Tasks

- [X] T032 [US4] Navigate to `/bnpl` route and verify BNPL parser interface loads successfully
- [X] T033 [US4] Test keyboard navigation (Tab, Enter) on `/bnpl` route to verify accessibility
- [X] T034 [US4] Verify localStorage keys for BNPL data are still accessible (check DevTools Application tab)
- [X] T035 [US4] Upload a test CSV file to BNPL parser and verify it processes correctly

**Acceptance Criteria** (User Story 4):
- ✅ `/bnpl` route loads successfully
- ✅ BNPL parser processes CSV files correctly (no regressions)
- ✅ localStorage data remains accessible
- ✅ Keyboard navigation works (no accessibility regressions)

---

## Phase 7: Git Commit & Completion

**Goal**: Create git commit and mark Phase 3 complete

**Duration**: 10-15 minutes

### Tasks

- [ ] T036 Stage changes: `git add README.md specs/063-short-name-archive/plan.md`
- [ ] T037 Create git commit with Conventional Commits format and GitHub signatures in `README.md`
- [ ] T038 Verify commit message follows format: `docs(readme): update to budget-first architecture (Feature 064)`
- [ ] T039 Update `specs/063-short-name-archive/plan.md` to mark Phase 3 complete
- [ ] T040 Verify git commit created successfully with `git log -1`

**Commit Message Template**:
```
docs(readme): update to budget-first architecture (Feature 064)

Phase 3 of product pivot: Update documentation to reflect budget-first
positioning with BNPL tracking as a secondary feature/differentiator.

Changes:
- Update product description to "Privacy-First Budgeting App"
- Reorder feature list (budget features first, BNPL as differentiator)
- Update architecture section to reflect archived code structure
- Mark Phase 3 complete in specs/063-short-name-archive/plan.md

Research Findings:
- ics@3.8.1 dependency is actively used by Demo and Import pages
- All 4 dependencies (ics, luxon, papaparse, recharts) are actively used
- No dependencies removed (all are needed for budget app functionality)

Validation:
- All 11 routes tested: 100% availability
- Demo/Import .ics download functionality verified
- Browser console: 0 errors
- npm run build: 0 TypeScript errors
- README.md accurately reflects budget-first architecture

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Validation**: Git commit created with proper format and signatures

---

## Phase 8: Polish & Cross-Cutting Concerns

**Goal**: Final validation and cleanup

**Duration**: 5-10 minutes

### Tasks

- [ ] T041 Run final build check: `npm run build` exits with code 0
- [ ] T042 Verify all validation steps from spec.md completed (13 steps)
- [ ] T043 Cross-reference README.md with CLAUDE.md and constitution for consistency
- [ ] T044 Verify no uncommitted changes remain: `git status` is clean
- [ ] T045 Review all success criteria from spec.md and confirm 100% completion

**Success Criteria Checklist**:
- ✅ SC-002: `npm run build` exits with code 0, 0 TypeScript errors
- ✅ SC-003: All 11 routes load successfully (100% availability)
- ✅ SC-004: README.md clearly states PayPlan is "budget-first app"
- ✅ SC-006: All dependencies (`ics`, `luxon`, `papaparse`, `recharts`) remain in package.json
- ✅ SC-007: Phase 3 completed within 1-2 hours
- ✅ SC-008: Git commit created with Conventional Commits format
- ✅ SC-009: Zero user-facing changes (BNPL features remain accessible at `/bnpl`)

**Validation**: All success criteria met, Phase 3 complete

---

## Task Summary

**Total Tasks**: 45 tasks
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 0 tasks (research already complete)
- Phase 3 (US2 - Documentation): 6 tasks
- Phase 4 (US1 - Dependency Validation): 5 tasks
- Phase 5 (US3 - System Health): 15 tasks (11 route tests + 4 validation tasks)
- Phase 6 (US4 - BNPL Preservation): 4 tasks
- Phase 7 (Git Commit): 5 tasks
- Phase 8 (Polish): 5 tasks

**Parallelizable Tasks**: 15 tasks marked [P]
- Dependency verification (T012-T015)
- Route testing (T019-T024, T027-T029)

**User Story Mapping**:
- US1 (Dependency Validation): 5 tasks (T012-T016)
- US2 (Documentation Update): 6 tasks (T006-T011)
- US3 (System Health): 15 tasks (T017-T031)
- US4 (BNPL Preservation): 4 tasks (T032-T035)

**Suggested MVP**: User Story 2 (Documentation Update) - 6 tasks, 30-45 minutes

---

## Dependencies & Execution Order

**User Story Dependencies**:
```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational - COMPLETE)
    ↓
Phase 3 (US2 - Documentation Update) ← Can start immediately
    ↓
Phase 4 (US1 - Dependency Validation) ← Parallel with US2
    ↓
Phase 5 (US3 - System Health) ← Requires US2 complete
    ↓
Phase 6 (US4 - BNPL Preservation) ← Parallel with US3
    ↓
Phase 7 (Git Commit)
    ↓
Phase 8 (Polish)
```

**Independent Stories**:
- US2 (Documentation) and US1 (Dependency Validation) can run in parallel after Setup
- US3 (System Health) and US4 (BNPL Preservation) can run in parallel

**Blocking Dependencies**:
- US3 requires US2 complete (to test updated README)
- Phase 7 requires all user stories complete

---

## Parallel Execution Examples

### Example 1: Documentation + Validation in Parallel

**Developer 1**:
- T006-T011: Update README.md (30-45 min)

**Developer 2** (simultaneous):
- T012-T016: Verify dependency usage (10-15 min)

### Example 2: Route Testing in Parallel

**Developer 1**:
- T019-T024: Test budget app routes (15 min)

**Developer 2** (simultaneous):
- T027-T029: Test BNPL + system routes (10 min)

**Developer 3** (simultaneous):
- T025-T026: Test Demo/Import `.ics` functionality (10 min)

**Total Time**: 15 minutes (vs. 35 minutes sequential)

---

## Rollback Plan

If issues are discovered after implementation:

### Option 1: Revert README.md Changes
```bash
git checkout HEAD~1 -- README.md
git checkout HEAD~1 -- specs/063-short-name-archive/plan.md
cd frontend && npm run build
```

### Option 2: Full Commit Revert
```bash
git revert HEAD
cd frontend && npm run build
```

---

## Next Steps

After completing all tasks:

1. **Create Pull Request**: Create PR with changes, wait for bot reviews
2. **Bot Review Loop**: Respond to CodeRabbit and Claude Code Bot feedback
3. **HIL Approval**: Wait for human approval
4. **Merge**: Manus merges PR after approval
5. **Mark Complete**: Update project tracking (Linear, docs, etc.)

---

**Task Generation Status**: ✅ Complete
**Ready for Implementation**: ✅ Yes
**Estimated Total Duration**: 1-2 hours (aligns with success criterion SC-007)
