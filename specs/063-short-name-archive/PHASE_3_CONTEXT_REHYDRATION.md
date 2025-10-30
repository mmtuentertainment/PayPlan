# Phase 3 Context Rehydration Prompt for Claude Code

**Feature**: Archive BNPL Code (Feature 063)
**Current Status**: Phase 2 COMPLETE, Phase 3 READY
**Date**: 2025-10-30
**Session**: New session continuation

---

## Session Handoff Summary

You are Claude Code, continuing work on the **3-phase product pivot from BNPL-focused to budget-first app**.

### What We've Completed

**Phase 1** ✅ (PR #45, merged): Changed default route from BNPL to Dashboard
- Created Dashboard placeholder page
- Updated navigation to show budget-focused menu
- Kept BNPL accessible at `/bnpl` route

**Phase 2** ✅ (PR #55, merged 2025-10-30): Archived BNPL code with comprehensive quality fixes
- **Archived 60 BNPL files** to `frontend/src/archive/bnpl/`
- **Created 3 Architecture Decision Records** (1,016 lines):
  - ADR 001: Interface-First Type Strategy (why interfaces, not z.infer)
  - ADR 002: Canonical Zod Schema Locations (single source of truth for schemas)
  - ADR 003: Date Arithmetic - setMonth() Boundary Handling (two strategies documented)
- **Fixed major code quality issues**:
  - Date.setMonth() boundary bug in Affirm parser (Jan 31 → Feb 28/29, not Mar 2/3)
  - Type duplication (removed 7 z.infer exports, enforced interface-first)
  - Schema duplication (4 schemas consolidated to canonical locations)
  - Magic numbers extracted (DEFAULT_RECENT_TRANSACTIONS_LIMIT = 5)
  - Duplicate code eliminated (UNCATEGORIZED_CATEGORY constant)
  - Markdown formatting fixed (6 files)
- **31 total commits** (22 original + 9 bot review compliance)
- **100% CodeRabbit compliance** (ALL issues fixed, nitpicks triaged)
- **TypeScript compilation**: 0 errors
- **Zero regressions**: All routes (/bnpl, /demo, /import) work identically
- **Git history preserved**: Used `git mv` for all relocations
- **Merged to main**: Commit `06a3e65`

### What's Next: Phase 3 - Dependency Cleanup

**Objective**: Remove BNPL-specific npm dependencies that are no longer needed by active budget app code.

**Scope** (from BNPL-ANALYSIS.md):
1. Remove BNPL-specific dependencies from `package.json`
2. Update README to focus on Budget app
3. Update CLAUDE.md to reflect Budget-first architecture (already done)
4. Archive BNPL references in documentation

**Estimated Time**: 1-2 hours (low complexity, low risk)

---

## Critical Context for Phase 3

### Dependencies Analysis

**BNPL-Specific Dependencies** (candidates for removal):
- `ics@3.8.1` - Calendar generation (used ONLY in archived `lib/ics-generator.js`)
- **KEEP**: `luxon@3.7.2` - Date/time library (used by Budget app for date formatting)
- **KEEP**: `papaparse` - CSV parsing (potentially reusable for transaction import)
- **KEEP**: `recharts` - Charts (used by Dashboard Feature 062)

### Key Constraints from Constitution

1. **Phase 1 Requirement**: Manual testing only, no automated tests required
2. **YAGNI Principle**: Remove dependencies ONLY if clearly unused
3. **Zero User-Facing Changes**: BNPL features remain free and accessible at `/bnpl`
4. **Simplicity**: Small, incremental changes (<2 week scope)

### Verification Commands

```bash
# Check dependency usage before removal
npm ls ics           # Verify no active code uses it
grep -r "import.*ics" frontend/src --exclude-dir=archive  # Should return empty

# After removal
npm install          # Verify clean install
npm run build        # Verify 0 TypeScript errors
npm run dev          # Manual test: /bnpl, /dashboard, /categories routes
```

---

## Your Task

You are starting a new session to specify and implement **Phase 3: Dependency Cleanup**.

### Immediate Actions

1. **Read this context** to understand what Phase 1 and Phase 2 accomplished
2. **Review the plan** at `specs/063-short-name-archive/plan.md`
3. **Verify current state**:
   - Check that Phase 2 is marked complete in plan.md
   - Verify ADRs exist in `docs/architecture/decisions/`
   - Verify BNPL code is in `frontend/src/archive/bnpl/`
4. **Analyze dependencies**:
   - Check which dependencies are ONLY used by archived code
   - Verify which dependencies are shared with budget app
   - Document findings with `grep` evidence

### Phase 3 Specification Requirements

When creating the Phase 3 specification, ensure it includes:

**User Stories**:
- US1: Developer dependency cleanup (remove unused deps without breaking active code)
- US2: Documentation update (README, architecture docs reflect budget-first)
- US3: Validation (all routes work, build succeeds, no regressions)

**Functional Requirements**:
1. Analyze dependency usage (grep, npm ls)
2. Remove BNPL-specific deps (`ics`)
3. Keep shared deps (luxon, papaparse, recharts)
4. Update package.json
5. Verify build succeeds
6. Manual testing of all routes

**Out of Scope** (CRITICAL - from Phase 2):
- Removing BNPL features (they stay free and accessible)
- Removing archived code (it stays in archive/)
- Automated test creation (Phase 1 allows manual testing only)
- Performance optimization (defer to Phase 4)

**Success Criteria**:
- `npm install` completes with no errors
- `npm run build` exits with code 0
- All routes (/bnpl, /dashboard, /categories, /budgets, /transactions) load successfully
- No console errors or broken imports
- README accurately reflects budget-first architecture

---

## File Locations (Quick Reference)

### Spec Files
- `specs/063-short-name-archive/spec.md` - Original specification
- `specs/063-short-name-archive/plan.md` - Implementation plan (Phase 2 marked complete)
- `specs/063-short-name-archive/tasks.md` - Task breakdown
- `BNPL-ANALYSIS.md` - 3-phase pivot analysis

### Architecture Docs
- `docs/architecture/decisions/001-interface-first-type-strategy.md`
- `docs/architecture/decisions/002-canonical-zod-schema-locations.md`
- `docs/architecture/decisions/003-date-arithmetic-setmonth-boundary-handling.md`
- `docs/architecture/decisions/README.md`

### Code
- `frontend/src/archive/bnpl/` - Archived BNPL code (60 files)
- `frontend/src/pages/Dashboard.tsx` - Budget app landing page
- `frontend/package.json` - Dependency list

### Constitution
- `memory/constitution_v1.1_TEMP.md` - Project constitution (READ FIRST)
- `CLAUDE.md` - Development guide (includes ADR process)

---

## Best Practices for Phase 3

### Research Phase (30 min)
1. **Dependency Usage Analysis**:
   ```bash
   # For each BNPL-specific dep, check if used in active code
   grep -r "import.*from 'ics'" frontend/src --exclude-dir=archive
   grep -r "import.*from 'luxon'" frontend/src --exclude-dir=archive
   npm ls ics --all  # Check transitive dependencies
   ```

2. **Documentation Review**:
   - Read current README (note BNPL-focused sections)
   - Review CLAUDE.md (already updated with ADR process)
   - Check for outdated references in docs/

3. **Risk Assessment**:
   - What happens if we remove `ics`? (Calendar export breaks - OK, it's archived)
   - What happens if we remove `luxon`? (Date formatting breaks - NOT OK, budget app uses it)
   - Document findings in research.md

### Specification Phase (30 min)
1. **User Stories**: Focus on developer experience and system health
2. **Functional Requirements**: Be specific (which deps to remove, which to keep, why)
3. **Validation Steps**: Manual testing checklist for each route
4. **Rollback Plan**: How to restore deps if issues found

### Implementation Phase (30 min)
1. **Incremental Changes**: Remove one dependency at a time
2. **Verify After Each Step**: npm install, npm run build, manual test
3. **Git History**: Small, descriptive commits
4. **PR Creation**: Clear description of what changed and why

---

## Expected Output

After running `/speckit.specify` for Phase 3, you should produce:

**specs/064-phase3-dependency-cleanup/spec.md** containing:

1. **User Stories** (3-4 stories):
   - Developer dependency cleanup
   - Documentation update
   - System validation
   - (Optional) Analytics cleanup if applicable

2. **Functional Requirements** (8-10 core requirements):
   - Analyze dependency usage with grep/npm ls
   - Remove `ics` dependency
   - Verify `luxon`, `papaparse`, `recharts` still needed
   - Update package.json
   - Update README.md
   - Verify build succeeds
   - Manual test all routes
   - Git commit with clear message

3. **Success Criteria**:
   - Quantitative: 0 build errors, 0 console errors, X dependencies removed
   - Qualitative: README reflects budget-first, documentation accurate

4. **Out of Scope**:
   - Removing BNPL features
   - Removing archived code
   - Automated test creation
   - Performance optimization

5. **Dependencies**:
   - Phase 2 complete (archived BNPL code)
   - Clean working directory

---

## Phase 3 Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidentally remove shared dep | HIGH | Use `grep --exclude-dir=archive` to verify usage |
| Break Budget app date formatting | HIGH | Keep `luxon`, verify imports in active code |
| Outdated README confuses users | MEDIUM | Update README to focus on Budget app |
| Transitive dependency issues | LOW | Run `npm ls <dep>` before removal |

---

## Validation Checklist (Post-Implementation)

- [ ] `npm install` completes with no errors
- [ ] `npm run build` exits with code 0 (0 TypeScript errors)
- [ ] `/dashboard` loads successfully
- [ ] `/categories` loads successfully
- [ ] `/budgets` loads successfully
- [ ] `/transactions` loads successfully
- [ ] `/bnpl` loads successfully (archived code still works)
- [ ] `/demo` loads successfully
- [ ] `/import` loads successfully
- [ ] No console errors in browser
- [ ] README.md reflects budget-first architecture
- [ ] CLAUDE.md accurate (already updated in Phase 2)
- [ ] Git commit created with descriptive message
- [ ] PR created with clear description

---

## Key Takeaways from Phase 2

**What Went Well**:
- Comprehensive ADR documentation (permanent architectural record)
- 100% CodeRabbit compliance (all issues addressed systematically)
- Type system consolidation (interface-first strategy enforced)
- Schema consistency (canonical locations established)
- Date arithmetic fixes (bug fixed, strategies documented)

**What to Maintain in Phase 3**:
- Same thoroughness in dependency analysis
- Clear documentation of decisions (why remove X, why keep Y)
- Incremental commits with descriptive messages
- Manual testing after each change
- Constitutional compliance (YAGNI, simplicity, Phase 1 requirements)

**What to Avoid**:
- Removing dependencies without verifying usage first
- Breaking active budget app code
- Over-engineering (keep it simple)
- Creating automated tests (defer to Phase 2 of Development Quality phases)

---

## Ready for `/speckit.specify`

You now have complete context for Phase 3. When you run `/speckit.specify`, create a comprehensive specification that:

1. **Builds on Phase 2**: References ADRs, archived code structure, git history
2. **Focuses on cleanup**: Remove unused deps, update docs, verify system health
3. **Maintains quality**: Same thoroughness as Phase 2, but simpler scope
4. **Follows constitution**: YAGNI, simplicity, Phase 1 requirements
5. **Includes validation**: Clear checklist for post-implementation verification

**Estimated Phase 3 Duration**: 1-2 hours (low complexity, low risk)

**Next Command**: `/speckit.specify` with Phase 3 feature description

---

**End of Context Rehydration**
