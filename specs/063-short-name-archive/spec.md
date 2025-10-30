# Feature Specification: Archive BNPL Code

**Feature Branch**: `063-short-name-archive`
**Created**: 2025-10-30
**Status**: Draft
**Linear Issue**: [TBD]
**Epic**: MMT-60 - Budgeting App MVP

## User Scenarios & Testing *(mandatory)*

### User Story 1 - BNPL Feature Accessibility (Priority: P0)

As a current BNPL user, I want to continue accessing BNPL payment parsing features at /bnpl so that my existing workflow is not disrupted by the product pivot.

**Why this priority**: P0 - This is a critical user retention requirement. Breaking existing BNPL functionality would alienate current users and violate the "no user-facing changes" constraint. The archival is an internal refactor and must be invisible to end users.

**Independent Test**: Navigate to /bnpl route, paste a Klarna payment reminder email, verify payment schedule displays correctly with due date, amount, and installment number extracted.

**Acceptance Scenarios**:

1. **Given** I am a current user who relies on BNPL parsing, **When** I navigate to /bnpl after the code archival, **Then** the page loads successfully and shows the email input interface
2. **Given** I have pasted a payment reminder email from any of the 6 supported providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit), **When** the parser processes it, **Then** the payment schedule displays correctly with all extracted fields (provider, due date, amount, installment number, autopay status)
3. **Given** I paste multiple emails separated by delimiters (---), **When** the parser processes them, **Then** all payment schedules are extracted and displayed as separate items

---

### User Story 2 - Demo/Import Feature Preservation (Priority: P0)

As a new user trying the demo or importing data, I want the Demo (/demo) and Import (/import) pages to continue working so that I can evaluate the app without disruption.

**Why this priority**: P0 - The Demo and Import features use a different email extraction system (email-extractor.ts) that is separate from the BNPL parser. Breaking these would prevent new user acquisition and violate the "no user-facing changes" constraint.

**Independent Test**: Navigate to /demo route, verify the demo loads and displays sample transactions. Navigate to /import route, verify the import interface loads and can process sample email text.

**Acceptance Scenarios**:

1. **Given** I am a new user exploring the app, **When** I navigate to /demo, **Then** the demo page loads successfully and displays sample financial data
2. **Given** I am on the Import page, **When** I paste email text containing transaction data, **Then** the extraction processes correctly using the email-extractor.ts system (not the BNPL parser)
3. **Given** the email-extractor.ts uses the NEW extraction format with confidence scoring, **When** I import data, **Then** the extraction results include confidence scores and proper error handling

---

### User Story 3 - Developer Code Navigation (Priority: P1)

As a developer joining the project, I want to understand the codebase structure from directory organization so that I can identify which features are actively developed vs maintained-but-not-actively-developed.

**Why this priority**: P1 - This is a developer experience improvement that supports the long-term maintainability of the codebase. Clear separation between active (budget) and archived (BNPL) code reduces confusion and prevents accidental modifications to legacy code.

**Independent Test**: Open the codebase in an IDE, navigate the directory structure, observe that BNPL code is organized under frontend/src/archive/bnpl/ while budget code remains in the main source tree. Read the migration documentation to understand the rationale and rollback procedure.

**Acceptance Scenarios**:

1. **Given** I am a new developer reviewing the codebase, **When** I browse the frontend/src directory, **Then** I see active budget features in the main tree and BNPL code in frontend/src/archive/bnpl/
2. **Given** I want to understand the archival decision, **When** I read docs/migrations/[migration-doc].md, **Then** I find clear documentation explaining what changed, why it was archived, and how to roll back if needed
3. **Given** I am searching for BNPL-related code, **When** I check the specs/ directory, **Then** I find BNPL feature specs moved to specs/archived/ with a README explaining their archived status

---

### User Story 4 - Rollback Procedure Documentation (Priority: P1)

As a project maintainer, I want documented rollback instructions so that I can revert the archival if business requirements change or issues are discovered.

**Why this priority**: P1 - Rollback documentation is a safety net for a structural refactor. While the archival should be low-risk (no functional changes), having a documented escape hatch is a best practice for any codebase reorganization.

**Independent Test**: Read the migration documentation (docs/migrations/[migration-doc].md), verify it includes step-by-step rollback instructions with git commands and import path restoration guidance.

**Acceptance Scenarios**:

1. **Given** I need to revert the archival, **When** I follow the rollback instructions, **Then** all import paths are restored to their original locations and the app functions identically to pre-archival state
2. **Given** I am reviewing the rollback procedure, **When** I check the migration doc, **Then** I find git revert commands, import path changes, and validation steps to confirm successful rollback
3. **Given** the rollback is completed, **When** I run the app, **Then** all routes (/bnpl, /demo, /import) work correctly and no user-facing behavior has changed

---

## Functional Requirements *(mandatory)*

### Core Requirements

1. **Code Relocation**: Move all BNPL-specific code from frontend/src/ to frontend/src/archive/bnpl/ while preserving directory structure (pages/, components/bnpl/, lib/parsers/, lib/bnpl-parser.ts, lib/storage/bnpl-storage.ts, types/bnpl.ts)

2. **Import Path Updates**: Update all import statements referencing moved BNPL files to use the new archive/bnpl/ prefix (e.g., `import BNPLParser from './pages/BNPLParser'` → `import BNPLParser from './archive/bnpl/pages/BNPLParser'`)

3. **Route Preservation**: Ensure the /bnpl route in App.tsx continues to load the BNPLParser page from its new location (frontend/src/archive/bnpl/pages/BNPLParser.tsx)

4. **Email Extraction Separation**: Verify that Demo (/demo) and Import (/import) routes use email-extractor.ts (NEW format) and are not affected by BNPL parser relocation (OLD format in archive/bnpl/lib/bnpl-parser.ts)

5. **Spec Archival**: Move all BNPL feature specifications from specs/ to specs/archived/ with a README.md explaining the archived status and linking to the migration documentation

6. **Test Archival**: Move all BNPL manual test results from manual-tests/ to manual-tests/archived/ (if manual test directory exists; create if needed)

7. **Migration Documentation**: Create docs/migrations/archive-bnpl-code.md explaining:
   - What changed (60 files moved to archive/bnpl/)
   - Why (product pivot to budget-first app)
   - Impact (none user-facing, internal refactor only)
   - Rollback procedure (git revert + import path restoration)
   - Validation steps (verify /bnpl, /demo, /import routes work)

8. **Archive README**: Create frontend/src/archive/bnpl/README.md documenting:
   - Purpose of archive directory (maintained-but-not-actively-developed)
   - Supported BNPL providers (6 providers: Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit)
   - Route location (/bnpl)
   - Last active development date
   - Link to migration documentation

9. **Build Verification**: Ensure TypeScript compilation succeeds with no errors after import path updates (npm run build must pass)

10. **Routing Verification**: Manually test all affected routes post-archival:
    - /bnpl loads and parses emails correctly
    - /demo loads and displays sample data
    - /import loads and processes email text
    - No console errors or broken imports

### Edge Cases

1. **Circular Dependencies**: If moving BNPL files creates circular import dependencies (e.g., archive/bnpl imports from active code that imports from archive), resolve by extracting shared utilities to a neutral location (frontend/src/lib/shared/)

2. **Shared Component Dependencies**: If BNPL components depend on shared UI components (e.g., Radix primitives, layout components), ensure imports continue working from archive location (relative imports may need adjustment)

3. **Git History Preservation**: Use `git mv` instead of manual file moves to preserve git blame history for relocated files (important for debugging and understanding code evolution)

4. **localStorage Data Compatibility**: Verify that archived BNPL code continues reading/writing localStorage keys used by existing users (no data schema changes, no key renames)

5. **Legacy Route Aliases**: If Phase 1 created any route aliases (e.g., /bnpl-home redirecting to /bnpl), ensure aliases continue working after archival

---

## Success Criteria *(mandatory)*

### Quantitative Metrics

1. **Zero User-Facing Changes**: All existing users can access /bnpl, /demo, /import routes with identical functionality pre and post-archival (100% feature parity)

2. **Zero Build Errors**: TypeScript compilation completes with 0 errors after import path updates (npm run build exits with code 0)

3. **File Organization**: 100% of BNPL code (60 files) relocated to frontend/src/archive/bnpl/ with directory structure preserved

4. **Documentation Coverage**: Migration documentation covers 100% of required topics (what changed, why, impact, rollback, validation)

### Qualitative Measures

1. **Developer Clarity**: A new developer can distinguish active (budget) vs archived (BNPL) code by directory structure without needing to ask questions

2. **Rollback Confidence**: A maintainer can successfully revert the archival using documented instructions without trial-and-error or guesswork

3. **User Trust**: Existing BNPL users experience no disruption or downtime when accessing /bnpl route after archival deployment

4. **Architectural Intent**: The codebase structure accurately reflects product direction (budget-first with BNPL as secondary feature)

---

## Key Entities *(if applicable)*

1. **BNPL Code Archive**:
   - Location: frontend/src/archive/bnpl/
   - Components: 3 React components (BNPLEmailInput, PaymentSchedulePreview, ProviderBadge)
   - Parsers: 7 provider parsers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit, index)
   - Core Logic: bnpl-parser.ts (OLD extraction format)
   - Storage: bnpl-storage.ts (localStorage interface)
   - Types: bnpl.ts (TypeScript interfaces)
   - Pages: BNPLParser.tsx (main route component)
   - Attributes: Last active development date, supported providers list, route location
   - Relationships: Imported by App.tsx for /bnpl route, isolated from email-extractor.ts (NEW format)

2. **Migration Documentation**:
   - Location: docs/migrations/archive-bnpl-code.md
   - Purpose: Explain archival rationale, impact, and rollback procedure
   - Attributes: Change summary, business context, rollback steps, validation checklist
   - Relationships: Referenced by archive README, linked from main project README

3. **Archived Specifications**:
   - Location: specs/archived/
   - Content: All BNPL feature specs (Feature 020 and earlier BNPL-related features)
   - Attributes: Original feature numbers, archived date, link to migration doc
   - Relationships: Mirrors structure of active specs/ directory, includes README explaining archived status

---

## Assumptions *(mandatory)*

1. **Phase 1 Completion**: PR #45 has been merged to main, meaning the default route is already /dashboard and navigation shows budget-focused menu items (Phase 1 complete)

2. **No Pending BNPL Work**: There are no open PRs or uncommitted changes to BNPL code that would conflict with the archival (assumes clean main branch state)

3. **Git History Preservation**: Using `git mv` will preserve blame history for relocated files (standard git behavior)

4. **Email Extractor Independence**: The email-extractor.ts (NEW format) used by Demo/Import is fully independent of bnpl-parser.ts (OLD format) and requires no import path updates

5. **localStorage Schema Stability**: BNPL features use stable localStorage keys that will not change during archival (no data migration required)

6. **Manual Testing Sufficient**: Phase 1 definition of done allows manual testing only (no automated tests required for this refactor)

7. **No Active BNPL Users During Deployment**: Deployment can occur without downtime concerns (or deployment strategy handles brief unavailability)

8. **TypeScript Strict Mode**: Codebase uses TypeScript 5.8.3 strict mode, so compilation success guarantees no broken imports or type errors

9. **Single Developer Workflow**: No concurrent development on BNPL features during archival (avoids merge conflicts)

10. **Vercel Deployment**: The app is deployed on Vercel, which handles build and routing automatically (no manual server configuration required for route preservation)

---

## Out of Scope *(mandatory)*

1. **Functional Changes**: This is a code organization refactor only. No changes to BNPL parsing logic, UI, or user-facing behavior.

2. **Performance Optimization**: No performance improvements or optimizations to archived BNPL code (maintain as-is).

3. **Dependency Cleanup**: No removal of BNPL-related npm dependencies (e.g., parser libraries) even if only used by archived code (defer to Phase 3).

4. **Automated Test Suite**: No creation of automated tests for BNPL features (Phase 1 definition of done requires manual testing only).

5. **BNPL Feature Deprecation**: The archival does NOT deprecate or remove BNPL features. Users can still access /bnpl route indefinitely.

6. **New Archive Infrastructure**: No creation of generic archive tooling or frameworks beyond this single archival (YAGNI principle).

7. **Code Style Refactoring**: No reformatting or linting fixes to archived code unless required for compilation (preserve as-is).

8. **Documentation Website Updates**: No updates to public-facing documentation or marketing materials (internal refactor only).

9. **Analytics/Telemetry Changes**: No changes to usage tracking or analytics for archived features (defer to Phase 3 if analytics are added).

10. **Email Extractor Refactoring**: No changes to email-extractor.ts (NEW format) or bnpl-parser.ts (OLD format) logic beyond import path updates.

---

## Dependencies *(if applicable)*

1. **Phase 1 Completion (PR #45)**: This feature depends on Phase 1 being merged to main. The archival is Phase 2 of the 3-phase pivot and assumes the routing/navigation changes are already deployed.

2. **BNPL-ANALYSIS.md (created in Phase 1)**: While the feature description mentions this file, it was not found in the repository. The archival can proceed based on the actual file locations discovered during implementation (60 files identified via manual inspection).

3. **Clean Working Directory**: No uncommitted changes to BNPL files (archival requires clean git state to use `git mv` and preserve history).

4. **TypeScript Compilation Success**: Pre-archival codebase must compile successfully (npm run build exits with code 0) to establish baseline for post-archival verification.

---

## Clarifications & Decisions *(if applicable)*

### 1. Manual Test Directory Structure (RESOLVED)

**Research Finding**: The manual-tests/ directory EXISTS at project root with BNPL test file (`020-bnpl-parser-test-results.md`, 15KB).

**Decision**: Create manual-tests/archived/ subdirectory and move BNPL test file to maintain consistency with spec archival.

**Rationale**:
- Constitution Phase 1 (line 219) requires manual accessibility testing
- BNPL test documentation should archive alongside BNPL specs
- Preserves test history while signaling archived status
- Follows existing organizational pattern (specs/archived/ → manual-tests/archived/)

**Implementation**:
- Create `manual-tests/archived/` directory
- Move `manual-tests/020-bnpl-parser-test-results.md` to `manual-tests/archived/`
- Add `manual-tests/archived/README.md` explaining archived test results

---

### 2. Shared Utilities Extraction Strategy (RESOLVED)

**Research Finding**: No lib/shared/ currently exists. Existing patterns show lib/ organized by concern (lib/archive/, lib/security/). BNPL code may share UI primitives with budget code.

**Decision**: Extract shared utilities to frontend/src/lib/shared/ IF circular dependencies discovered during implementation.

**Rationale**:
- Follows existing architectural pattern (lib/ subdirectories by concern)
- Constitution Principle VII: Simplicity + Clear Purpose (avoid over-engineering, but solve real problems)
- Avoids technical debt from code duplication or circular dependencies
- TypeScript strict mode requires clean imports (no circular deps)
- Only create what's necessary (YAGNI principle)

**Implementation** (if needed):
1. Create `frontend/src/lib/shared/` with clear organization:
   - `shared/ui-primitives.ts` (if BNPL shares Radix components)
   - `shared/validation-utils.ts` (if validation logic overlaps)
   - `shared/types.ts` (if TypeScript interfaces are reused)
2. Extract ONLY what's necessary to resolve circular dependencies
3. Update imports in both active and archived code
4. Document in `frontend/src/archive/bnpl/README.md` which shared utilities are used

---

### 3. Archived Specs Indexing (RESOLVED)

**Research Finding**: Existing README pattern found in specs/062-short-name-dashboard/implementation-prompts/ (393 lines, detailed structure). No INDEX.md pattern exists in current specs directory.

**Decision**: Use simple README.md only (no INDEX.md).

**Rationale**:
- Constitution Phase 1 (line 214): Ship fast, focus on velocity over infrastructure
- Constitution Principle VII: YAGNI - "Start simple, add complexity only when necessary"
- Numbered prefixes (001-, 020-, 061-) act as natural index (self-documenting)
- README provides better context ("why archived") than index list
- Can add INDEX.md later if developers request it (defer to actual need)

**Implementation**:
Create `specs/archived/README.md` with:
- Purpose (product pivot Phase 2)
- Archived date and migration doc link
- Status (maintained-but-not-actively-developed)
- Code location (frontend/src/archive/bnpl/)
- Route availability (/bnpl still accessible)
- Brief feature descriptions (lightweight, not exhaustive)
- Discovery guidance (use `ls`, glob patterns, numbered prefixes)
