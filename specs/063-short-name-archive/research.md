# Research: Archive BNPL Code

**Feature**: Archive BNPL Code (Feature 063)
**Branch**: `063-short-name-archive`
**Date**: 2025-10-30
**Status**: Complete

## Overview

This document contains research findings for Feature 063 (Archive BNPL Code), including best practices for code archival, git history preservation, import path management, and documentation patterns. All research questions from the specification phase have been resolved.

---

## Research Question 1: Manual Test Directory Structure

**Question**: Does the manual-tests/ directory exist? Should it be created or should test archival be skipped?

### Investigation

**Method**: Codebase inspection + constitution analysis

**Findings**:
1. ✅ **Directory exists**: `manual-tests/` found at project root
2. ✅ **Contains BNPL test**: `020-bnpl-parser-test-results.md` (15KB, created Oct 28 2025)
3. ✅ **Constitution mandates**: Phase 1 (line 219) requires "Manual accessibility testing"
4. ✅ **Organizational pattern**: specs/archived/ → manual-tests/archived/ is logical parallel

### Decision: Create archived/ subdirectory and move BNPL test file

**Rationale**:
- BNPL test documentation should archive alongside BNPL specs
- Preserves test history while signaling archived status
- Follows organizational consistency (specs/archived/, manual-tests/archived/)

**Implementation**:
- Create `manual-tests/archived/` directory
- Move `manual-tests/020-bnpl-parser-test-results.md` → `manual-tests/archived/`
- Add `manual-tests/archived/README.md` explaining archived test results

**Evidence Source**: Direct codebase inspection, Constitution Phase 1 (line 219)

---

## Research Question 2: Shared Utilities Extraction Strategy

**Question**: If circular dependencies are discovered, how should they be resolved?

### Investigation

**Method**: Architecture pattern analysis + constitution review

**Findings**:
1. ✅ **No lib/shared/ exists**: Glob search confirmed none currently
2. ✅ **Existing patterns**: lib/ organized by concern (lib/archive/, lib/security/)
3. ✅ **BNPL may share UI**: 3 React components may use Radix primitives from budget code
4. ✅ **TypeScript strict mode**: Requires clean imports, no circular dependencies
5. ✅ **Constitution Principle VII**: "Simplicity + Clear Purpose—avoid over-engineering, but solve real problems"

### Decision: Extract to lib/shared/ IF circular dependencies discovered

**Rationale**:
- Follows existing architectural pattern (lib/ subdirectories by concern)
- Avoids technical debt from code duplication
- Only create what's necessary (YAGNI principle)
- TypeScript strict mode enforces clean imports

**Implementation** (if needed):
1. Create `frontend/src/lib/shared/` with clear organization:
   - `shared/ui-primitives.ts` (if BNPL shares Radix components)
   - `shared/validation-utils.ts` (if validation logic overlaps)
   - `shared/types.ts` (if TypeScript interfaces are reused)
2. Extract ONLY what's necessary to resolve circular dependencies
3. Update imports in both active and archived code
4. Document in `frontend/src/archive/bnpl/README.md` which shared utilities are used

**Evidence Source**: Architecture reference (line 47-49), Constitution Principle VII (line 266-270)

---

## Research Question 3: Archived Specs Indexing

**Question**: Should specs/archived/ include an INDEX.md file listing all archived specs?

### Investigation

**Method**: Existing documentation pattern analysis + constitution review

**Findings**:
1. ✅ **README pattern exists**: Found 393-line README in specs/062-short-name-dashboard/implementation-prompts/
2. ❌ **No INDEX.md pattern**: No INDEX.md files found in current specs directory
3. ✅ **Numbered prefixes**: Specs use self-documenting prefixes (001-, 020-, 061-)
4. ✅ **Constitution Phase 1**: "Ship fast, focus on velocity over infrastructure" (line 214)
5. ✅ **Constitution Principle VII**: "YAGNI—Start simple, add complexity only when necessary" (line 309)

### Decision: Use simple README.md only (no INDEX.md)

**Rationale**:
- YAGNI principle: Add complexity only when necessary
- Numbered prefixes act as natural index (self-documenting)
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

**Evidence Source**: Specs/062 README pattern, Constitution Phase 1 (line 214), Principle VII (line 309)

---

## Research Topic: Git History Preservation Best Practices

**Question**: How to preserve git blame history when relocating 60 files?

### Investigation

**Method**: Git documentation research + industry best practices

**Findings**:

1. **Git mv vs manual file moves**:
   - ✅ `git mv` is a convenience command (automatically stages the move)
   - ✅ Git tracks renames using **content similarity heuristics** (default 50% threshold)
   - ✅ `git log --follow <file>` detects renames retroactively when viewing history
   - ⚠️ **Key insight**: Git does NOT persist rename operations in commits - it detects them heuristically when you run `git log --follow`
   - ❌ Manual moves (rm + add) work identically if committed separately

2. **How Git rename detection works**:
   - ✅ Git analyzes content similarity between commits to infer renames
   - ✅ **Critical**: Commit moves separately WITHOUT modifying file content
   - ✅ If files are modified during the move, Git's heuristics may fail to detect the rename
   - ✅ `git blame` continues working after moves (uses similarity detection)
   - ✅ `-C` flag detects copies, `-M` flag detects moves

3. **Large-scale refactor patterns**:
   - ✅ **Best practice**: One commit per logical group (e.g., all pages/, all components/)
   - ✅ **Rationale**: Easier to revert if issues discovered
   - ✅ **Key rule**: Never modify content in the same commit as the move
   - ❌ **Anti-pattern**: Single massive commit (hard to debug, hard to revert)

### Decision: Use `git mv` for all file relocations

**Why `git mv`**: Convenience (auto-stages changes) and established convention. The history preservation comes from Git's heuristics when you use `git log --follow`, not from the move command itself.

**Implementation Strategy**:
1. Create target directory structure:
   ```bash
   mkdir -p frontend/src/archive/bnpl/{pages,components/bnpl,lib/parsers,types}
   ```

2. Move files using git mv (grouped by directory):
   ```bash
   # Move pages
   git mv frontend/src/pages/BNPLParser.tsx frontend/src/archive/bnpl/pages/

   # Move components
   git mv frontend/src/components/bnpl/* frontend/src/archive/bnpl/components/bnpl/

   # Move parsers
   git mv frontend/src/lib/parsers/* frontend/src/archive/bnpl/lib/parsers/

   # Move core logic
   git mv frontend/src/lib/bnpl-parser.ts frontend/src/archive/bnpl/lib/
   git mv frontend/src/lib/storage/bnpl-storage.ts frontend/src/archive/bnpl/lib/storage/

   # Move types
   git mv frontend/src/types/bnpl.ts frontend/src/archive/bnpl/types/
   ```

3. Commit after each logical group:
   ```bash
   git commit -m "refactor(archive): move BNPL pages to archive/bnpl/pages"
   git commit -m "refactor(archive): move BNPL components to archive/bnpl/components"
   git commit -m "refactor(archive): move BNPL parsers to archive/bnpl/lib/parsers"
   git commit -m "refactor(archive): move BNPL core logic to archive/bnpl/lib"
   git commit -m "refactor(archive): move BNPL types to archive/bnpl/types"
   ```

**Evidence Source**: Git documentation, PayPlan Edge Case #3 (spec line 119-120)

---

## Research Topic: Import Path Update Patterns

**Question**: What's the systematic approach to updating import paths after code relocation?

### Investigation

**Method**: TypeScript/React best practices + PayPlan codebase analysis

**Findings**:

1. **Import path types in React/TypeScript projects**:
   - **Relative imports**: `import Foo from './Foo'` or `import Bar from '../Bar'`
   - **Absolute imports**: `import Baz from 'components/Baz'` (if tsconfig paths configured)
   - **Node module imports**: `import React from 'react'` (unchanged)

2. **Import update strategy**:
   - ✅ **Find all files importing from moved locations**:
     ```bash
     grep -r "from.*BNPLParser" frontend/src/
     grep -r "from.*bnpl-parser" frontend/src/
     grep -r "from.*bnpl-storage" frontend/src/
     ```

   - ✅ **Update to new archive paths**:
     ```typescript
     // Before archival
     import BNPLParser from './pages/BNPLParser';

     // After archival
     import BNPLParser from './archive/bnpl/pages/BNPLParser';
     ```

   - ✅ **TypeScript compiler will catch all broken imports** (strict mode enforces this)

3. **Validation approach**:
   - ✅ **Compile-time check**: `npm run build` must exit with code 0
   - ✅ **Runtime check**: Manual testing of /bnpl, /demo, /import routes
   - ✅ **Zero tolerance**: Any import errors block deployment

### Decision: Systematic grep + manual updates + TypeScript validation

**Implementation Strategy**:

1. **Before moving files**: Document all import locations
   ```bash
   # Find all imports of BNPL files
   grep -rn "from.*pages/BNPLParser" frontend/src/ > /tmp/imports-bnpl-parser.txt
   grep -rn "from.*components/bnpl" frontend/src/ >> /tmp/imports-bnpl-components.txt
   grep -rn "from.*lib/bnpl-parser" frontend/src/ >> /tmp/imports-bnpl-lib.txt
   grep -rn "from.*lib/storage/bnpl-storage" frontend/src/ >> /tmp/imports-bnpl-storage.txt
   grep -rn "from.*types/bnpl" frontend/src/ >> /tmp/imports-bnpl-types.txt
   ```

2. **After moving files**: Update all imports systematically
   - Open each file from grep output
   - Update import path to include `archive/bnpl/` prefix
   - Preserve rest of path structure

3. **Validation**:
   ```bash
   # TypeScript compilation must pass
   npm run build
   # Exit code 0 = success, non-zero = broken imports
   ```

4. **Commit import updates** (separate from file moves):
   ```bash
   git commit -m "refactor(archive): update import paths for archived BNPL code"
   ```

**Evidence Source**: TypeScript strict mode (spec assumption #8), Core Requirement #2 (spec line 81)

---

## Research Topic: Migration Documentation Patterns

**Question**: What should migration documentation include for a code archival?

### Investigation

**Method**: Industry best practices + PayPlan requirements analysis

**Findings**:

1. **Migration doc components** (from spec requirement #7):
   - ✅ **What changed**: File relocation summary (60 files → frontend/src/archive/bnpl/)
   - ✅ **Why**: Business context (product pivot to budget-first app)
   - ✅ **Impact**: User-facing (none) + developer-facing (new import paths)
   - ✅ **Rollback procedure**: Step-by-step instructions with git commands
   - ✅ **Validation steps**: How to verify routes work post-archival

2. **Rollback documentation requirements**:
   - ✅ **Git revert commands**: Specific commit SHAs + revert syntax
   - ✅ **Import path restoration**: Reverse of archival (remove archive/bnpl/ prefix)
   - ✅ **Validation checklist**: Same as post-archival validation
   - ✅ **Decision criteria**: When to rollback vs push forward

3. **Archive README requirements** (from spec requirement #8):
   - ✅ **Purpose**: "Maintained-but-not-actively-developed"
   - ✅ **Providers**: 6 BNPL providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit)
   - ✅ **Route**: /bnpl location
   - ✅ **Last active date**: When archival occurred
   - ✅ **Migration link**: Link to docs/migrations/archive-bnpl-code.md

### Decision: Comprehensive migration doc + archive README

**Implementation Templates**:

**Template 1: docs/migrations/archive-bnpl-code.md**
```markdown
# Migration: Archive BNPL Code (Phase 2)

## Summary
Relocated 60 BNPL files to frontend/src/archive/bnpl/ to reflect product pivot from BNPL-focused to budget-first app.

## What Changed
- **Files Moved**: 60 files (pages/, components/bnpl/, lib/parsers/, lib/bnpl-parser.ts, lib/storage/bnpl-storage.ts, types/bnpl.ts)
- **New Location**: frontend/src/archive/bnpl/
- **Import Paths**: Updated to include archive/bnpl/ prefix
- **Routes**: Unchanged (/bnpl still works)

## Why
Product pivot (Phase 2): PayPlan evolved from BNPL-focused to budget-first app with BNPL as secondary feature.

## Impact
- **User-facing**: ZERO (100% feature parity, routes unchanged)
- **Developer-facing**: Import paths updated, codebase structure reflects product direction

## Rollback Procedure
[Detailed git commands + import path restoration]

## Validation
[Checklist for verifying /bnpl, /demo, /import routes]
```

**Template 2: frontend/src/archive/bnpl/README.md**
```markdown
# Archived: BNPL Code

## Status
**Maintained-but-not-actively-developed**

## Purpose
This directory contains BNPL payment parsing features (Feature 020) archived during the product pivot from BNPL-focused to budget-first app (Phase 2, October 2025).

## Functionality
- **Route**: /bnpl
- **Providers**: 6 BNPL providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit)
- **Features**: Email parser, payment schedule extraction, risk detection

## Last Active Development
2025-10-28 (Feature 020 completed)

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](../../../docs/migrations/archive-bnpl-code.md) for archival details and rollback procedure.
```

**Evidence Source**: Spec Core Requirements #7-8 (lines 91-103)

---

## Research Topic: Email Extractor Independence

**Question**: How to verify Demo/Import routes use separate email extraction system?

### Investigation

**Method**: Codebase inspection + import analysis

**Findings**:

1. **Two email extraction systems identified**:
   - ✅ **OLD format**: `lib/bnpl-parser.ts` (used by /bnpl route)
   - ✅ **NEW format**: `lib/email-extractor.ts` (used by /demo and /import routes)

2. **Email extractor features** (from codebase inspection):
   - Confidence scoring system (0-100%)
   - Multiple provider support (6 BNPL providers)
   - PII sanitization
   - Error handling with user-friendly messages
   - Cache for performance

3. **Independence verification**:
   - ✅ **Separate files**: email-extractor.ts does not import from bnpl-parser.ts
   - ✅ **Separate routes**: /demo and /import use email-extractor.ts
   - ✅ **No circular dependencies**: bnpl-parser.ts does not depend on email-extractor.ts

### Decision: Verify independence during manual testing

**Validation Checklist**:
1. ✅ Navigate to /demo → verify demo loads (uses email-extractor.ts)
2. ✅ Navigate to /import → verify import page loads (uses email-extractor.ts)
3. ✅ Navigate to /bnpl → verify BNPL parser loads (uses bnpl-parser.ts from archive)
4. ✅ Verify no console errors indicating broken imports

**Evidence Source**: Spec Core Requirement #4 (line 85), Spec Assumption #4 (line 186)

---

## Research Summary

All research questions resolved with evidence-based decisions:

| Research Question | Decision | Evidence |
|-------------------|----------|----------|
| **Manual test directory** | Create archived/ subdirectory, move BNPL test file | Directory exists (manual-tests/020-bnpl-parser-test-results.md), Constitution Phase 1 |
| **Shared utilities** | Extract to lib/shared/ IF circular deps found | Architecture patterns (lib/archive/, lib/security/), YAGNI principle |
| **Archived specs indexing** | Simple README.md only (no INDEX.md) | No INDEX pattern found, YAGNI principle, Phase 1 velocity focus |
| **Git history preservation** | Use `git mv` for all relocations, commit separately from content changes | Git uses content similarity heuristics to detect renames when running `git log --follow` |
| **Import path updates** | Systematic grep + manual updates + TypeScript validation | TypeScript strict mode catches broken imports, zero tolerance for errors |
| **Migration documentation** | Comprehensive migration doc + archive README | Industry best practices, rollback safety net |
| **Email extractor independence** | Verified separate files, no circular deps | Codebase inspection, email-extractor.ts ≠ bnpl-parser.ts |

---

## Next Steps

**Ready for Phase 1 (Design)**:
- ✅ All research questions resolved
- ✅ Best practices identified
- ✅ Implementation strategies defined
- ✅ Validation approaches documented

Proceed to:
- data-model.md (Phase 1): File relocation mapping, import path changes
- quickstart.md (Phase 1): Step-by-step archival guide
- tasks.md (Phase 2): Atomic task breakdown with acceptance criteria
