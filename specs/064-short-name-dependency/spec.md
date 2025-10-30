# Feature Specification: Dependency Cleanup (Phase 3 of Product Pivot)

**Feature Branch**: `064-short-name-dependency`
**Created**: 2025-10-30
**Status**: Draft
**Input**: User description: "Clean up BNPL-specific dependencies and update documentation to reflect budget-first architecture (Phase 3 of product pivot). This is a low-risk cleanup task following Phase 2 (Archive BNPL Code, PR #55 merged)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Dependency Cleanup (Priority: P1)

As a developer, I want to remove unused npm dependencies from the project so that the dependency tree is clean, install times are faster, and the project is easier to maintain.

**Why this priority**: This is the core objective of Phase 3. Unused dependencies create technical debt, increase bundle size, and slow down installation. Removing `ics@3.8.1` (used only by archived BNPL code) directly achieves the pivot goal.

**Independent Test**: Can be fully tested by running `npm install` and `npm ls ics` to verify the dependency is removed, followed by `npm run build` to confirm no regressions.

**Acceptance Scenarios**:

1. **Given** the project has `ics@3.8.1` in package.json, **When** the dependency is removed, **Then** `npm install` completes successfully with no errors
2. **Given** the `ics` dependency has been removed, **When** running `npm ls ics`, **Then** the command shows "ics@3.8.1 extraneous" or no match found
3. **Given** the `ics` dependency has been removed, **When** running `npm run build`, **Then** the build exits with code 0 (0 TypeScript errors)
4. **Given** the project has shared dependencies (luxon, papaparse, recharts), **When** verifying their presence, **Then** all three dependencies remain in package.json
5. **Given** the archived BNPL code uses `ics-generator.js`, **When** accessing the `/bnpl` route, **Then** the BNPL parser still loads (archived code not broken)

---

### User Story 2 - Documentation Update for New Developers (Priority: P2)

As a new developer joining the PayPlan project, I want the README.md to accurately reflect the product's current direction (budget-first) so that I understand what the app does, what features to prioritize, and how BNPL fits into the overall architecture.

**Why this priority**: Documentation is critical for onboarding and project clarity. An outdated README that focuses on BNPL will confuse new contributors and misrepresent the product's current direction.

**Independent Test**: Can be fully tested by reading the updated README.md and verifying it clearly states PayPlan is a budget-first app with BNPL as a secondary feature.

**Acceptance Scenarios**:

1. **Given** the README.md currently describes PayPlan as BNPL-focused, **When** the documentation is updated, **Then** the README clearly states PayPlan is a "privacy-first budgeting app" with BNPL tracking as a differentiator
2. **Given** a new developer reads the README, **When** looking for the product description, **Then** they see budget features (categories, budgets, transactions, dashboard) mentioned first, followed by BNPL features
3. **Given** the README has been updated, **When** checking feature lists, **Then** BNPL features are listed under a section like "BNPL Differentiator" or "Secondary Features"
4. **Given** the architecture section in README exists, **When** reviewing it, **Then** it reflects the new structure with active code in `frontend/src/` and archived BNPL code in `frontend/src/archive/bnpl/`

---

### User Story 3 - System Health Validation (Priority: P1)

As a project maintainer, I want to verify the system's health after dependency removal so that I'm confident no regressions were introduced, all routes work correctly, and the build process remains stable.

**Why this priority**: This is a critical validation step to ensure the cleanup didn't break anything. Without thorough testing, we risk deploying a broken build.

**Independent Test**: Can be fully tested by running the validation checklist (npm install, npm run build, manual testing of all 9 routes, browser console check).

**Acceptance Scenarios**:

1. **Given** dependencies have been removed, **When** running `npm install`, **Then** the installation completes with no errors or warnings
2. **Given** the project is built, **When** running `npm run build`, **Then** the build exits with code 0 and reports 0 TypeScript errors
3. **Given** the dev server is running, **When** navigating to `/dashboard`, **Then** the Dashboard page loads successfully with no console errors
4. **Given** the dev server is running, **When** navigating to `/categories`, **Then** the Categories page loads successfully
5. **Given** the dev server is running, **When** navigating to `/budgets`, **Then** the Budgets page loads successfully
6. **Given** the dev server is running, **When** navigating to `/transactions`, **Then** the Transactions page loads successfully
7. **Given** the dev server is running, **When** navigating to `/bnpl`, **Then** the BNPL parser loads successfully (archived code still functional)
8. **Given** the dev server is running, **When** navigating to `/demo`, **Then** the demo page loads successfully
9. **Given** the dev server is running, **When** navigating to `/import`, **Then** the import interface loads successfully
10. **Given** all routes have been tested, **When** checking the browser console, **Then** there are 0 JavaScript errors

---

### User Story 4 - Preserve BNPL Features for Existing Users (Priority: P3)

As a user who relies on BNPL tracking features, I want the BNPL functionality to continue working at `/bnpl` after the dependency cleanup so that my workflow is not disrupted.

**Why this priority**: While the product has pivoted to budget-first, the Constitution mandates that BNPL features remain "free and accessible." This user story ensures we don't break existing functionality.

**Independent Test**: Can be fully tested by manually testing the `/bnpl` route and verifying all BNPL parser functionality works as before.

**Acceptance Scenarios**:

1. **Given** the `/bnpl` route exists, **When** a user navigates to it, **Then** the BNPL parser interface loads successfully
2. **Given** the BNPL parser is loaded, **When** a user uploads a CSV file, **Then** the parser processes the file correctly (no regressions)
3. **Given** archived BNPL code uses localStorage, **When** checking localStorage keys, **Then** all existing BNPL data remains accessible
4. **Given** archived BNPL components render, **When** testing keyboard navigation, **Then** all interactive elements remain accessible (no accessibility regressions)

---

### Edge Cases

- **What happens if a user has a stale `node_modules` folder?**
  - System must handle this gracefully: `npm install` should clean up the `ics` dependency from `node_modules` after removal from `package.json`

- **What happens if the `ics` dependency is a transitive dependency of another package?**
  - Mitigation: Run `npm ls ics --all` before removal to check if any other package depends on it

- **What happens if the README update conflicts with other documentation?**
  - Ensure consistency across README.md, CLAUDE.md, and constitution files (cross-reference during review)

- **What happens if TypeScript types from `ics` are still imported in archived code?**
  - Since archived code is not compiled (not in the active build path), this is a non-issue. Verify with `grep -r "import.*from 'ics'" frontend/src --exclude-dir=archive` to confirm no active code imports it.

- **What happens if browser cache causes stale routes to load?**
  - Manual testing should include hard refresh (Ctrl+Shift+R) or incognito mode to avoid cached assets

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST analyze current dependency usage to distinguish between dependencies used only by archived code vs. dependencies used by active budget app code
- **FR-002**: System MUST remove `ics@3.8.1` dependency from `package.json` (used only by archived `lib/ics-generator.js`)
- **FR-003**: System MUST preserve shared dependencies (`luxon@3.7.2`, `papaparse`, `recharts`) that are used by active budget app code
- **FR-004**: System MUST verify no transitive dependencies on `ics` exist before removal
- **FR-005**: System MUST successfully complete `npm install` after dependency removal with no errors
- **FR-006**: System MUST successfully complete `npm run build` after dependency removal with exit code 0 and 0 TypeScript errors
- **FR-007**: README.md MUST be updated to reflect budget-first architecture as the primary product direction
- **FR-008**: README.md MUST mention BNPL tracking as a secondary feature or differentiator (not the primary focus)
- **FR-009**: README.md MUST accurately describe the current code structure (active code in `frontend/src/`, archived BNPL in `frontend/src/archive/bnpl/`)
- **FR-010**: System MUST manually test all 9 routes to verify no regressions (/dashboard, /categories, /budgets, /transactions, /bnpl, /demo, /import, and any others)
- **FR-011**: System MUST verify browser console shows 0 JavaScript errors after dependency cleanup
- **FR-012**: Git commit MUST be created with a clear, descriptive message following Conventional Commits format (e.g., `chore(deps): remove ics dependency used only by archived BNPL code`)
- **FR-013**: Phase 3 MUST be marked complete in `specs/063-short-name-archive/plan.md` after successful implementation
- **FR-014**: System MUST follow Phase 1 Definition of Done (manual testing only, no automated test creation required)
- **FR-015**: System MUST follow YAGNI principle (remove dependencies ONLY if clearly unused by active code)

### Key Entities

This feature does not introduce new data entities. It operates on existing entities:

- **npm Dependency**: A package listed in `package.json` with a specific version (e.g., `ics@3.8.1`)
- **Documentation File**: Markdown files like README.md that describe the project
- **Git Commit**: A version control record of changes with a descriptive message

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm install` completes successfully in under 60 seconds with no errors or warnings
- **SC-002**: `npm run build` exits with code 0 and reports 0 TypeScript errors
- **SC-003**: All 9 application routes load successfully with no console errors (100% route availability)
- **SC-004**: README.md clearly states PayPlan is a "budget-first app" in the first paragraph
- **SC-005**: `ics` dependency is completely removed from `package.json` (verified by `grep "ics" frontend/package.json` returning no matches)
- **SC-006**: Shared dependencies (`luxon`, `papaparse`, `recharts`) remain in `package.json` (verified by `npm ls luxon papaparse recharts`)
- **SC-007**: Phase 3 tasks are completed within 1-2 hours (low complexity, low risk)
- **SC-008**: Git commit is created with a clear message following Conventional Commits format
- **SC-009**: Zero user-facing changes (BNPL features remain accessible and functional at `/bnpl`)
- **SC-010**: Project install time reduces by 5-10% due to removal of unused dependency

### Assumptions

- **Assumption 1**: The only BNPL-specific dependency is `ics@3.8.1`; all other dependencies are either shared with budget app or remain necessary
- **Assumption 2**: No other npm packages have transitive dependencies on `ics` (verified with `npm ls ics --all`)
- **Assumption 3**: README.md is the primary documentation file for new developers; other docs (CLAUDE.md, constitution) are secondary
- **Assumption 4**: Manual testing of all 9 routes is sufficient to verify system health (automated tests deferred to Phase 2 of Quality phases)
- **Assumption 5**: The development environment has `npm` version 8+ and `node` version 18+ (standard PayPlan setup)

### Out of Scope (CRITICAL)

The following are **explicitly excluded** from Phase 3:

- **Removing BNPL features**: BNPL features remain free and accessible at `/bnpl` per Constitutional Principle III (Free Core)
- **Removing archived code**: Code in `frontend/src/archive/bnpl/` stays in place (60 files archived in Phase 2)
- **Automated test creation**: Phase 1 Definition of Done requires manual testing only; test automation deferred to Phase 2 (100-1,000 users)
- **Performance optimization**: Phase 1 has no performance targets; optimization deferred to Phase 4
- **Removing shared dependencies**: `luxon`, `papaparse`, and `recharts` are used by active budget app code and must be preserved
- **Analytics/telemetry changes**: Defer to future phase if analytics are added
- **Code style refactoring**: Archived BNPL code is preserved as-is; no style changes
- **Breaking changes to BNPL functionality**: Zero user-facing changes to BNPL features

### Dependencies

- **Phase 2 Complete**: PR #55 merged, BNPL code archived to `frontend/src/archive/bnpl/`, 3 ADRs created
- **Clean Working Directory**: No uncommitted changes (verify with `git status`)
- **TypeScript Compilation Succeeds**: `npm run build` exits with code 0 before starting Phase 3
- **Node.js Environment**: npm 8+ and Node 18+ installed

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidentally removing shared dependency (luxon, papaparse, recharts) breaks budget app | HIGH | Use `grep -r "import.*from 'luxon'" frontend/src --exclude-dir=archive` to verify usage in active code before removing any dependency |
| Outdated README confuses new developers | MEDIUM | Update README to clearly state budget-first architecture in the first paragraph, with BNPL as secondary feature |
| Transitive dependency issues (another package depends on `ics`) | LOW | Run `npm ls ics --all` before removal to check entire dependency tree |
| TypeScript errors appear after `ics` removal | LOW | Run `npm run build` immediately after removal to catch errors early |
| Browser cache causes stale routes to load during testing | LOW | Use hard refresh (Ctrl+Shift+R) or incognito mode for manual testing |

### Validation Steps (Post-Implementation)

1. **npm install**: Run `npm install` and verify it completes with no errors
2. **npm run build**: Run `npm run build` and verify exit code 0, 0 TypeScript errors
3. **Manual test /dashboard**: Navigate to `/dashboard` and verify page loads with 6 widget placeholders
4. **Manual test /categories**: Navigate to `/categories` and verify category list loads
5. **Manual test /budgets**: Navigate to `/budgets` and verify budget list loads
6. **Manual test /transactions**: Navigate to `/transactions` and verify transaction list loads
7. **Manual test /bnpl**: Navigate to `/bnpl` and verify BNPL parser loads (archived code works)
8. **Manual test /demo**: Navigate to `/demo` and verify demo data loads
9. **Manual test /import**: Navigate to `/import` and verify import interface loads
10. **Check browser console**: Verify 0 JavaScript errors across all routes
11. **Verify README.md**: Confirm README reflects budget-first architecture
12. **Verify package.json**: Confirm `ics` dependency is removed (`grep "ics" frontend/package.json` returns no matches)
13. **Verify shared deps**: Confirm `luxon`, `papaparse`, `recharts` remain (`npm ls luxon papaparse recharts` shows all three)

### Reference Documents

- **specs/063-short-name-archive/plan.md**: Phase 2 implementation plan (should be marked complete)
- **BNPL-ANALYSIS.md**: 3-phase pivot strategy, Phase 3 details (lines 431-446)
- **docs/architecture/decisions/README.md**: ADR system established in Phase 2
- **memory/constitution_v1.1_TEMP.md**: Project constitution, Phase 1 requirements
- **CLAUDE.md**: Development guide, ADR process documentation
