# Feature Specification: Complete BNPL Removal

**Feature Branch**: `063-short-name-complete`
**Created**: 2025-10-30
**Status**: Draft
**Linear Issue**: TBD
**Epic**: Product Pivot - Budget-First Focus

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simplified Budget-Only Experience (Priority: P0)

As a **budget-conscious user** (18-35, low-income earner), I want to **use a pure budgeting app without BNPL complexity** so that **I can focus solely on managing my spending, savings, and goals without unnecessary features**.

**Why this priority**: P0 - This is a strategic product pivot that fundamentally changes the product positioning from "BNPL-focused with budgeting" to "pure budgeting app competing with YNAB/Monarch/PocketGuard". Without this change, the product cannot effectively compete in the budgeting app market.

**Independent Test**: Navigate to the app and verify:
1. Only budget-related routes are accessible (/, /categories, /budgets, /transactions, /archives)
2. No BNPL routes exist (/bnpl, /demo, /import, /bnpl-home return 404)
3. No BNPL references in navigation menu or documentation

**Acceptance Scenarios**:

1. **Given** a user visits the app homepage (`/`), **When** they view the navigation menu, **Then** they see only budget features (Dashboard, Categories, Budgets, Transactions, Archives, Settings) with no BNPL options
2. **Given** a user tries to access `/bnpl`, **When** they navigate to that URL, **Then** they receive a 404 error with helpful message directing them to budget features
3. **Given** a user reads the README.md, **When** they review the product description, **Then** they see "Privacy-First Budgeting App" with NO mention of BNPL tracking as a feature
4. **Given** a developer reviews CLAUDE.md, **When** they read the product overview, **Then** they see instructions for building a pure budgeting app with NO BNPL references

---

### User Story 2 - Clean Installation Without BNPL Dependencies (Priority: P0)

As a **developer installing PayPlan**, I want to **install only budget-related dependencies** so that **the application is lightweight and focused without unnecessary BNPL libraries**.

**Why this priority**: P0 - Removing unused dependencies reduces bundle size, improves performance, and eliminates security vulnerabilities from unused code. The `ics` library is BNPL-specific and serves no purpose in a pure budgeting app.

**Independent Test**: Run `npm install && npm ls --depth=0` and verify `ics` is not listed in dependencies.

**Acceptance Scenarios**:

1. **Given** a developer runs `npm install`, **When** installation completes, **Then** the `ics` package is NOT installed
2. **Given** a developer runs `npm run build`, **When** the build completes, **Then** there are 0 TypeScript errors and no references to BNPL-related imports
3. **Given** a developer examines `package.json`, **When** they review dependencies, **Then** `ics` is not listed in `dependencies` or `devDependencies`

---

### User Story 3 - Archived BNPL Code Removal (Priority: P1)

As a **project maintainer**, I want to **permanently delete archived BNPL code** so that **the codebase contains only relevant budget features and is easier to maintain**.

**Why this priority**: P1 - While Phase 2 archived BNPL code to `frontend/src/archive/bnpl/`, permanently deleting it reduces codebase size, eliminates confusion, and prevents accidental reintroduction of BNPL features. This is lower priority than route/dependency removal but important for long-term maintainability.

**Independent Test**: Search the codebase for `frontend/src/archive/bnpl/` and verify the directory does not exist.

**Acceptance Scenarios**:

1. **Given** a developer searches for `frontend/src/archive/bnpl/`, **When** they check the file system, **Then** the directory does not exist
2. **Given** a developer runs `git log`, **When** they review commit history, **Then** they see a commit documenting the permanent deletion of archived BNPL code with rationale

---

## Functional Requirements *(mandatory)*

### Core Requirements

1. **Route Removal**: Remove all BNPL-related routes from the application:
   - Delete `/bnpl` route and associated component
   - Delete `/demo` route and associated component
   - Delete `/import` route and associated component
   - Delete `/bnpl-home` route and associated component
   - Update App.tsx to remove route definitions for these paths
   - Add 404 handling for legacy BNPL URLs with helpful redirect message

2. **Dependency Removal**: Remove BNPL-specific dependencies from package.json:
   - Remove `ics` package (used for BNPL calendar export)
   - Run `npm uninstall ics`
   - Verify no imports of `ics` remain in codebase

3. **Code Deletion**: Permanently delete all BNPL-related code:
   - Delete `frontend/src/archive/bnpl/` directory and all contents (60 files)
   - Delete `frontend/src/lib/ics-generator.js` (BNPL calendar generation)
   - Delete `frontend/api/plan.ts` (BNPL payment planning API)
   - Delete all BNPL parser files in archive
   - Delete BNPL-related test files

4. **Documentation Update**: Update all project documentation to reflect pure budgeting focus:
   - Update README.md to remove ALL BNPL references (Product Positioning, Features, Quick Start)
   - Update CLAUDE.md to remove BNPL references from product description
   - Update constitution (`memory/constitution.md`) to remove Principle III (Free Core - BNPL features)
   - Update any ADRs that reference BNPL features
   - Update package.json description to say "Privacy-first budgeting app"

5. **Navigation Update**: Update navigation components to remove BNPL menu items:
   - Remove BNPL-related links from NavigationHeader.tsx
   - Ensure navigation shows only: Dashboard, Categories, Budgets, Transactions, Archives, Settings
   - Update ARIA labels to reflect budget-only focus

6. **Specification Cleanup**: Update or archive BNPL-related specifications:
   - Archive specs/007-0020-csv-import/ (BNPL CSV import)
   - Archive specs/008-0020-*-csv/ (BNPL CSV variants)
   - Archive specs/016-payment-archive/ (BNPL payment archive)
   - Update specs/063-short-name-archive/spec.md to reflect BNPL is now permanently deleted (not just archived)

### Edge Cases

1. **Legacy URLs**: Users with bookmarks to `/bnpl`, `/demo`, `/import` should see helpful 404 page suggesting budget features instead of generic error
2. **TypeScript Compilation**: After removing BNPL code, ensure `npm run build` completes with 0 errors
3. **Test Suite**: After removing BNPL code, ensure remaining tests pass (BNPL tests will be deleted)
4. **Bundle Size**: Verify bundle size decreases after removing `ics` dependency and BNPL code
5. **Git History**: BNPL code remains in git history for recovery if needed (use `git log --follow` to trace deleted files)

---

## Success Criteria *(mandatory)*

### Quantitative Metrics

1. **Bundle Size Reduction**: Production build size decreases by at least 10% after removing BNPL code and dependencies
2. **Route Count**: Application has exactly 6 routes (/, /categories, /budgets, /transactions, /archives, /settings) - down from 10 routes
3. **Dependency Count**: `npm ls --depth=0 | wc -l` shows at least 1 fewer dependency after removing `ics`
4. **Build Time**: `npm run build` completes with 0 TypeScript errors
5. **Code Volume**: Codebase has at least 5,000 fewer lines of code after deleting `frontend/src/archive/bnpl/` (60 files)

### Qualitative Measures

1. **Product Positioning Clarity**: New users visiting README.md understand immediately that PayPlan is a budgeting app (no confusion about BNPL)
2. **Developer Onboarding**: New developers reading CLAUDE.md understand they are building a pure budgeting app competing with YNAB
3. **Navigation Simplicity**: Users can navigate the app without encountering confusing BNPL-related options
4. **Documentation Consistency**: All documentation (README, CLAUDE.md, constitution, specs) consistently describes a pure budgeting app

---

## Key Entities *(if applicable)*

No new entities - this is a removal/cleanup feature. Existing budget entities (Category, Budget, Transaction, Goal) remain unchanged.

---

## Assumptions *(mandatory)*

1. **No User Data Loss**: Users have no critical data in BNPL features (feature was pre-MVP, minimal usage)
2. **Git History Preservation**: Deleted BNPL code can be recovered from git history if needed for reference
3. **Constitution Amendment**: HIL approves removing Principle III (Free Core - BNPL features) from constitution
4. **Phase 3 Completion**: PR #59 (Phase 3 documentation updates) will be merged or abandoned before this feature begins
5. **No Rollback Need**: Strategic decision to remove BNPL is final - no plan to reintroduce BNPL features
6. **Competitor Research Complete**: Decision to compete as pure budgeting app is based on sufficient market research
7. **Target Market Validated**: Low-income earners (18-35) prefer simple budgeting WITHOUT BNPL complexity (validated through user research or strategic decision)

---

## Out of Scope *(mandatory)*

1. **New Budget Features**: This feature ONLY removes BNPL code - no new budgeting features will be added
2. **UI Redesign**: Navigation and layout changes are limited to removing BNPL options - no broader redesign
3. **Performance Optimization**: While bundle size will decrease, no active optimization work beyond dependency removal
4. **Marketing Material**: Website, social media, and marketing materials are updated separately (not in this feature)
5. **User Migration**: No data migration needed (BNPL features were pre-MVP, minimal user data)
6. **Competitor Feature Parity**: This feature makes PayPlan a pure budgeting app but does NOT implement all YNAB/Monarch features
7. **Analytics/Telemetry**: No changes to analytics tracking (still localStorage-first, privacy-preserving)

---

## Dependencies *(if applicable)*

1. **Phase 3 Resolution**: Decision needed on PR #59 (Phase 3 documentation updates) - merge, close, or incorporate into this feature
2. **Constitutional Amendment**: HIL must approve removing Principle III from constitution before implementation
3. **Strategic Validation**: Confirm this pivot is final (removing BNPL code is irreversible without git history recovery)
4. **Competitor Analysis**: Validate that pure budgeting positioning is viable against YNAB, Monarch, PocketGuard

---

## Open Questions *(if applicable)*

1. [NEEDS CLARIFICATION: Constitutional amendment approval] - Does HIL approve removing Constitutional Principle III ("All BNPL management features free forever") from `memory/constitution.md`? This is an IMMUTABLE principle that currently mandates BNPL features must remain.

2. [NEEDS CLARIFICATION: Phase 3 PR resolution] - What should happen to PR #59 (Phase 3 documentation updates that still reference BNPL as differentiator)?

3. [NEEDS CLARIFICATION: Git history handling] - How should deleted BNPL code be documented for future reference?
