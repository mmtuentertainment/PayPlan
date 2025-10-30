# Phase 3 `/speckit.specify` Prompt (COPY AND PASTE THIS)

```
/speckit.specify Clean up BNPL-specific dependencies and update documentation to reflect budget-first architecture (Phase 3 of product pivot). This is a low-risk cleanup task following Phase 2 (Archive BNPL Code, PR #55 merged).

CONTEXT: PayPlan pivoted from BNPL-focused to budget-first app in 3 phases. Phase 1 changed default route to Dashboard. Phase 2 archived 60 BNPL files to frontend/src/archive/bnpl/ and created 3 comprehensive ADRs. Phase 3 removes npm dependencies that are ONLY used by archived code.

OBJECTIVE: Remove BNPL-specific npm dependencies (ics) that are no longer needed by active budget app code, while keeping shared dependencies (luxon, papaparse, recharts). Update README.md to reflect budget-first architecture. Verify system health with manual testing.

SCOPE:
1. Analyze dependency usage with grep/npm ls (distinguish archived vs active code usage)
2. Remove `ics@3.8.1` (calendar generation, used ONLY in archived lib/ics-generator.js)
3. Keep `luxon@3.7.2` (date/time library, used by Budget app)
4. Keep `papaparse` (CSV parsing, potentially reusable for transaction import)
5. Keep `recharts` (charts, used by Dashboard Feature 062)
6. Update package.json (remove ics dependency)
7. Update README.md (reflect budget-first architecture, mention BNPL as secondary feature)
8. Verify build succeeds (npm install, npm run build exits with code 0)
9. Manual test all routes (/dashboard, /categories, /budgets, /transactions, /bnpl, /demo, /import)
10. Git commit with clear message

OUT OF SCOPE (CRITICAL):
- Removing BNPL features (they stay free and accessible at /bnpl per Constitution)
- Removing archived code (it stays in frontend/src/archive/bnpl/)
- Automated test creation (Phase 1 Definition of Done requires manual testing only)
- Performance optimization (defer to Phase 4)
- Removing shared dependencies used by budget app (luxon, papaparse, recharts)
- Analytics/telemetry changes (defer to future phase if analytics added)
- Code style refactoring of archived code (preserve as-is)

SUCCESS CRITERIA:
- npm install completes with no errors
- npm run build exits with code 0 (0 TypeScript errors)
- All routes load successfully (/dashboard, /categories, /budgets, /transactions, /bnpl, /demo, /import)
- No console errors or broken imports
- README.md accurately reflects budget-first architecture
- ics dependency removed from package.json
- Shared dependencies preserved (luxon, papaparse, recharts)
- Git commit created with descriptive message

CONSTRAINTS:
- Follow Phase 1 Definition of Done (manual testing only, no automated tests)
- Follow YAGNI principle (remove dependencies ONLY if clearly unused)
- Zero user-facing changes (BNPL features remain free and accessible)
- Simplicity (<2 week scope, this should be 1-2 hours)
- Constitutional compliance (Privacy-First, Accessibility-First, Free Core)

DEPENDENCIES:
- Phase 2 complete (PR #55 merged, BNPL code archived)
- Clean working directory (no uncommitted changes)
- TypeScript compilation succeeds (npm run build exits with code 0)

RISKS:
- HIGH: Accidentally removing shared dependency (luxon, papaparse, recharts) breaks budget app
  - Mitigation: Use grep --exclude-dir=archive to verify usage in active code
- MEDIUM: Outdated README confuses new developers
  - Mitigation: Update README to clearly state budget-first, BNPL secondary
- LOW: Transitive dependency issues
  - Mitigation: Run npm ls <dep> before removal to check dependency tree

VALIDATION STEPS (Post-Implementation):
1. npm install (should complete with no errors)
2. npm run build (should exit with code 0, 0 TypeScript errors)
3. Manual test /dashboard (should load, show 6 widget placeholders)
4. Manual test /categories (should load, show category list)
5. Manual test /budgets (should load, show budget list)
6. Manual test /transactions (should load, show transaction list)
7. Manual test /bnpl (should load, show BNPL parser - archived code works)
8. Manual test /demo (should load, show demo data)
9. Manual test /import (should load, show import interface)
10. Check browser console (should have 0 errors)
11. Verify README.md reflects budget-first architecture
12. Verify package.json does NOT include ics dependency
13. Verify package.json DOES include luxon, papaparse, recharts

REFERENCE DOCUMENTS:
- specs/063-short-name-archive/plan.md (Phase 2 marked complete)
- BNPL-ANALYSIS.md (3-phase pivot strategy, Phase 3 details lines 431-446)
- docs/architecture/decisions/README.md (ADR system established in Phase 2)
- memory/constitution_v1.1_TEMP.md (Project constitution, Phase 1 requirements)
- CLAUDE.md (Development guide, ADR process documented)

USER STORIES (Expected):
1. As a developer, I want to remove unused npm dependencies so that the project has a clean dependency tree and faster install times
2. As a new developer, I want README.md to reflect the current product direction (budget-first) so that I understand what PayPlan is and what features to focus on
3. As a project maintainer, I want to verify system health after dependency removal so that I'm confident no regressions were introduced
4. (Optional) As a user, I want BNPL features to continue working at /bnpl so that my existing workflow is not disrupted

ACCEPTANCE CRITERIA (Expected):
- ics dependency removed from package.json
- All shared dependencies preserved (luxon, papaparse, recharts)
- npm install, npm run build succeed
- All 9 routes load successfully with no console errors
- README.md updated to reflect budget-first architecture
- Git commit created with clear message
- Phase 3 marked complete in plan.md
```

---

## Additional Guidance for Spec-Kit

**Thinking Mode**: Use default thinking mode (this is a simple cleanup task, not complex architecture)

**Spec Tier**: Tier 0 or Tier 1 (simple cleanup, minimal planning needed)
- **Tier 0** if you want quick specification without plan.md
- **Tier 1** if you want full Spec-Kit workflow (spec.md + plan.md + tasks.md)

**Recommended**: Tier 1 (full workflow) to maintain consistency with Phase 2 and document the completion of the 3-phase pivot.

---

## Expected Spec-Kit Workflow

1. **`/speckit.specify`** (this prompt above) → creates `spec.md`
2. **`/speckit.clarify`** (if needed) → resolves ambiguities
3. **`/speckit.plan`** → creates `plan.md`, `research.md`, `data-model.md`, `quickstart.md`
4. **`/speckit.tasks`** → creates `tasks.md`, `checklist.md`
5. **`/speckit.implement`** → executes tasks from `tasks.md`
6. **Create PR** → bot review loop → HIL approval → merge
7. **Mark Phase 3 complete** in `specs/063-short-name-archive/plan.md`

---

## Feature Number

**Recommended**: Create as **Feature 064** (new feature number for Phase 3)
- Phase 1: Pivot to Budget App (PR #45, commit f936eb5)
- Phase 2: Archive BNPL Code (Feature 063, PR #55, commit 06a3e65)
- Phase 3: Dependency Cleanup (Feature 064, new PR)

**Directory Structure**:
```
specs/
├── 062-short-name-dashboard/       # Dashboard foundation
├── 063-short-name-archive/         # Phase 2 (BNPL code archival)
└── 064-short-name-cleanup/         # Phase 3 (dependency cleanup) ← NEW
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    └── ...
```

**Branch Naming**: `064-short-name-cleanup` or `phase3-dependency-cleanup`

---

## Post-Implementation Verification

After implementing Phase 3, verify:

1. **All 3 phases complete**:
   - ✅ Phase 1: Default route changed to Dashboard (merged)
   - ✅ Phase 2: BNPL code archived (merged)
   - ✅ Phase 3: Dependencies cleaned up (in progress)

2. **Product reflects budget-first**:
   - Default route: `/` → Dashboard (Phase 1)
   - Navigation: Budget-focused menu (Phase 1)
   - Code organization: Budget app in src/, BNPL in archive/ (Phase 2)
   - Dependencies: Only budget-related deps in package.json (Phase 3)
   - Documentation: README reflects budget-first (Phase 3)

3. **BNPL features still work**:
   - Route: `/bnpl` accessible
   - Parsing: Email parsing works (6 providers)
   - Storage: localStorage keys unchanged
   - UI: All BNPL components render correctly

4. **No regressions**:
   - TypeScript: 0 compilation errors
   - Routes: All 9 routes load successfully
   - Console: 0 errors
   - Build: npm run build exits with code 0

---

## Ready to Execute

You are now ready to run `/speckit.specify` with the prompt above. This will create a comprehensive Phase 3 specification that:

✅ Builds on Phase 2 work
✅ Follows constitution and best practices
✅ Includes thorough validation steps
✅ Maintains system quality and user trust
✅ Completes the 3-phase product pivot

**Estimated Time**: 1-2 hours (low complexity, low risk)

**Next Step**: Copy the `/speckit.specify` prompt above and run it in Claude Code.

---

**End of Spec-Kit Prompt**
