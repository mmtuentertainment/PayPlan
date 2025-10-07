# Feature Specification: CI & Lint Guards for Modular Extraction

**Feature Branch**: `003-create-ci-lint`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "Create CI & Lint Guards for Modular Extraction (docs+tooling, zero runtime changes)"

## Execution Flow (main)
```
1. Parse user description from Input
   ’ Feature: Add automated guards to enforce modular extraction architecture
2. Extract key concepts from description
   ’ Actors: Developers, CI systems, documentation maintainers
   ’ Actions: Lint imports, benchmark performance, audit spec paths
   ’ Data: Import paths, performance metrics, spec file references
   ’ Constraints: No runtime changes, d200 LOC, single PR, reversible
3. For each unclear aspect:
   ’ All aspects clearly defined in user description
4. Fill User Scenarios & Testing section
   ’ Primary scenario: Developer prevented from importing legacy paths
5. Generate Functional Requirements
   ’ ESLint rules, performance budgets, documentation audits
6. Identify Key Entities (if data involved)
   ’ Lint rules, performance benchmarks, spec path references
7. Run Review Checklist
   ’ No implementation details - only guard behaviors
8. Return: SUCCESS (spec ready for planning)
```

---

## ¡ Quick Guidelines
-  Focus on WHAT guards prevent and WHY
- L Avoid HOW to implement (no ESLint plugin details, no script internals)
- =e Written for developers and maintainers as stakeholders

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer working on the PayPlan extraction system, I need automated guardrails that prevent me from accidentally importing from legacy file paths, introducing performance regressions, or adding incorrect file references to documentation, so that the modular architecture stays clean and maintainable.

### Acceptance Scenarios

#### ESLint & TypeScript Path Guards
1. **Given** a developer imports from old path `frontend/src/lib/provider-detectors.ts`, **When** linting runs, **Then** build fails with clear error message pointing to correct path `frontend/src/lib/extraction/providers/detector.ts`

2. **Given** a developer imports from new modular path `frontend/src/lib/extraction/extractors/date.ts`, **When** linting runs, **Then** build passes without errors

3. **Given** a developer imports from legacy `frontend/src/lib/redact.ts`, **When** linting runs, **Then** build fails directing to `frontend/src/lib/extraction/helpers/redaction.ts`

#### Performance Budget Guards
4. **Given** extraction performance is 150ms for 50 emails on CI hardware, **When** CI runs performance tests, **Then** build passes with performance metrics in summary

5. **Given** extraction performance degrades to 300ms for 50 emails, **When** CI runs performance tests, **Then** build fails with regression delta (e.g., "+50ms over budget, +120% regression")

6. **Given** performance improves to 100ms for 50 emails, **When** CI runs performance tests, **Then** build passes with improvement delta shown in summary

#### Documentation Path Audit Guards
7. **Given** a spec file references `frontend/src/lib/extraction/extractors/date.ts`, **When** spec path audit runs, **Then** audit passes (valid extraction path)

8. **Given** a spec file references `frontend/src/lib/provider-detectors.ts` (legacy path), **When** spec path audit runs, **Then** audit fails with list of invalid references

9. **Given** a spec file references `frontend/tests/unit/cache.test.ts`, **When** spec path audit runs, **Then** audit passes (valid test path)

10. **Given** a spec file references `tests/unit/cache.test.ts` (missing frontend/ prefix), **When** spec path audit runs, **Then** audit fails indicating incorrect test path

### Edge Cases

#### ESLint Edge Cases
- What happens when developer imports from `email-extractor.ts` (still valid as orchestrator)? ’ Passes (not a legacy path)
- How does system handle dynamic imports? ’ ESLint rules apply to both static and dynamic imports
- What if developer needs to reference legacy path in comments or documentation? ’ Lint rules only check actual imports, not comments

#### Performance Edge Cases
- What happens when CI hardware is slower than expected? ’ Budget threshold (250ms) accounts for CI variability with headroom
- How does system handle performance test flakiness? ’ Tests run 3 times, use median value to reduce noise
- What if cache is disabled during test? ’ Test explicitly enables cache (tests real-world scenario)

#### Documentation Audit Edge Cases
- What happens when spec references a file outside frontend/? ’ Fails unless explicitly allowed (e.g., `.github/workflows/`)
- How does system handle markdown code blocks with example paths? ’ Audit only checks prose references, not code examples (configurable)
- What if spec references external URLs? ’ External URLs ignored (only local file paths checked)

---

## Requirements *(mandatory)*

### Functional Requirements

#### ESLint & TypeScript Path Guards

- **FR-001**: System MUST prevent imports from legacy path `frontend/src/lib/provider-detectors.ts` and direct developers to `frontend/src/lib/extraction/providers/detector.ts`

- **FR-002**: System MUST prevent imports from legacy path `frontend/src/lib/date-parser.ts` and direct developers to `frontend/src/lib/extraction/extractors/date.ts`

- **FR-003**: System MUST prevent imports from legacy path `frontend/src/lib/redact.ts` and direct developers to `frontend/src/lib/extraction/helpers/redaction.ts`

- **FR-004**: System MUST allow imports from current modular paths under `frontend/src/lib/extraction/**` (providers, extractors, helpers)

- **FR-005**: System MUST allow imports from `frontend/src/lib/email-extractor.ts` (valid orchestrator file)

- **FR-006**: Lint errors MUST include clear messaging with old’new path mapping referencing Delta 0013

- **FR-007**: ESLint configuration changes MUST be reversible via single git revert

#### Performance Budget Guards

- **FR-008**: System MUST run performance tests from `frontend/tests/performance/*.test.ts` on every CI build

- **FR-009**: System MUST fail CI build if 50-email extraction time exceeds 250ms on CI hardware

- **FR-010**: System MUST calculate and display regression delta (e.g., "+50ms, +120% vs baseline") in CI job summary when budget exceeded

- **FR-011**: System MUST display performance improvement (e.g., "-25ms, -15% vs baseline") in CI job summary when performance improves

- **FR-012**: Performance baseline MUST use median of 3 runs to reduce flakiness

- **FR-013**: Performance metrics MUST be surfaced in GitHub Actions job summary (visible without drilling into logs)

- **FR-014**: Performance budget threshold (250ms) MUST account for CI hardware variability with safety margin

#### Documentation Path Audit Guards

- **FR-015**: System MUST scan all files under `specs/**/*.md` for file path references

- **FR-016**: System MUST validate that referenced paths are under `frontend/src/lib/extraction/**` or `frontend/tests/**`

- **FR-017**: System MUST fail CI build if any spec references legacy paths (provider-detectors.ts, date-parser.ts, redact.ts at old locations)

- **FR-018**: System MUST fail CI build if any spec references test paths without `frontend/` prefix (e.g., `tests/unit/` instead of `frontend/tests/unit/`)

- **FR-019**: Audit script MUST output list of invalid references with file locations (file:line format) for easy navigation

- **FR-020**: Audit script MUST be executable as standalone tool (usable locally before pushing)

- **FR-021**: Audit script MUST reference Delta 0013 path mapping tables for allowed paths

#### General Constraints

- **FR-022**: ALL changes MUST introduce zero runtime behavior changes (guards only, no code refactoring)

- **FR-023**: Total net LOC addition MUST be d200 lines (configs + scripts combined)

- **FR-024**: ALL guards MUST be deliverable in single PR

- **FR-025**: ALL changes MUST be reversible via git revert without breaking builds

- **FR-026**: Guards MUST fail fast with clear error messages (no cryptic failures)

### Key Entities *(include if feature involves data)*

- **Legacy Path Pattern**: File path reference to old module locations (provider-detectors.ts, date-parser.ts, redact.ts) that should no longer be imported

- **Modular Path Pattern**: File path reference under `frontend/src/lib/extraction/**` structure (providers/, extractors/, helpers/) that is valid and encouraged

- **Performance Baseline**: Median extraction time from 3 runs of 50-email benchmark, used to calculate regression/improvement deltas

- **Performance Budget**: Maximum allowed extraction time (250ms for 50 emails on CI hardware) that triggers build failure if exceeded

- **Spec Path Reference**: File path mentioned in specification markdown files that should be validated against current architecture

- **Lint Rule Configuration**: ESLint rule definitions that check import statements for legacy vs modular paths

- **Audit Report**: Output from spec path audit script listing invalid references with file:line locations

- **CI Job Summary**: GitHub Actions summary display showing performance metrics and deltas

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders (developers as stakeholders)
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (250ms budget, d200 LOC, specific error messages)
- [x] Scope is clearly bounded (guards only, no runtime changes)
- [x] Dependencies and assumptions identified (Delta 0013, current architecture)

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated (26 functional requirements)
- [x] Entities identified (8 key entities)
- [x] Review checklist passed

---

## Acceptance Criteria

The CI & Lint Guards feature is complete when:

### ESLint & TypeScript Path Guards
1.  ESLint rules forbid imports from `provider-detectors.ts`, `date-parser.ts`, `redact.ts` at old paths
2.  ESLint rules allow imports from `extraction/**` paths
3.  Lint errors include clear old’new path guidance
4.  TypeScript configuration updated (if needed for path validation)
5.  Developers see helpful error messages on import violations

### Performance Budget Guards
6.  CI runs `frontend/tests/performance/*.test.ts` on every build
7.  CI fails if 50-email extraction exceeds 250ms
8.  Regression delta displayed in GitHub Actions job summary (e.g., "+50ms, +120%")
9.  Improvement delta displayed when performance improves
10.  Baseline uses median of 3 runs for stability

### Documentation Path Audit Guards
11.  Script `scripts/audit-spec-paths.mjs` scans all `specs/**/*.md` files
12.  Script validates paths against `extraction/**` and `frontend/tests/**` patterns
13.  CI fails if legacy paths found in specs
14.  CI fails if test paths missing `frontend/` prefix
15.  Audit output lists invalid references in `file:line` format
16.  Script executable locally (npm script or direct node invocation)

### Deliverables
17.  Specification: `specs/ci-guards/spec.md`
18.  Plan: `specs/ci-guards/plan.md`
19.  Tasks: `specs/ci-guards/tasks.md` (d8 tasks)
20.  Delta: `ops/deltas/0014_ci_lint_perf.md`
21.  CI workflow: `.github/workflows/ci.yml` amendments
22.  ESLint config: Updated with path restriction rules
23.  TypeScript config: Updated if needed for path validation
24.  Audit script: `scripts/audit-spec-paths.mjs`

### Constraints Verified
25.  Zero runtime code changes (no .ts/.tsx behavior modifications)
26.  Net LOC d200 lines (configs + scripts)
27.  Single PR delivery
28.  Reversible via git revert
29.  References Delta 0013 modular architecture
30.  All guards fail fast with clear error messages

---

## Dependencies & References

### Prerequisites
-  Delta 0013: Modular extraction architecture established
-  Specs realigned (branch `002-realign-payplan-specs`)
-  Current structure: `frontend/src/lib/extraction/{providers,extractors,helpers}/`
-  Performance tests exist: `frontend/tests/performance/*.test.ts`

### References
- **Delta 0013**: `ops/deltas/0013_realignment.md` - Path migration tables
- **Modular Architecture**: `frontend/src/lib/extraction/**` structure
- **Performance Baseline**: ~50-200ms for 50 emails (with cache enabled)
- **CI Environment**: GitHub Actions, ubuntu-latest

---

## Success Metrics

### Guard Effectiveness
- **Import Violations Prevented**: 100% (all legacy imports caught before merge)
- **Performance Regressions Caught**: Any deviation >250ms detected pre-merge
- **Stale Documentation**: Zero new stale references added to specs

### Developer Experience
- **Time to Understand Error**: <30 seconds (clear error messages)
- **False Positive Rate**: <5% (accurate path validation)
- **Build Failure Clarity**: Developers immediately understand what to fix

### Maintainability
- **Guard Maintenance**: Minimal (path patterns from Delta 0013)
- **Reversibility**: Single git revert restores previous state
- **LOC Budget**: d200 lines (enforces simplicity)

---

## Non-Goals (Explicit Out of Scope)

- L **Runtime code refactoring**: Guards only, no extraction logic changes
- L **Backend path validation**: Frontend-focused only
- L **Comprehensive linting overhaul**: Only modular path rules
- L **Performance optimization**: Guards detect regressions but don't optimize
- L **Documentation generation**: Manual specs, not auto-generated
- L **CI infrastructure changes**: Use existing GitHub Actions
- L **Complex bundler plugins**: Stick to ESLint and simple Node scripts
- L **Spec format changes**: Validate existing markdown, don't change format

---

## Rollback Plan

If guards cause issues post-merge:

```bash
# Option 1: Revert the merge commit
git revert -m 1 <merge-commit-sha>

# Option 2: Disable specific guard temporarily
# ESLint: Comment out rule in .eslintrc
# Performance: Skip test via CI env var
# Audit: Comment out workflow step

# Option 3: Adjust thresholds without revert
# Performance budget: Increase 250ms ’ 300ms in CI workflow
# Path patterns: Add exceptions to audit script
```

**Safe Rollback**: Guards are additive (no runtime impact) - reverting only removes enforcement, doesn't break existing code.

---

## Future Enhancements (Post-MVP)

### Potential Follow-ups
1. **Automated path migration tool**: CLI to update imports from legacy to modular paths
2. **Performance trend tracking**: Store metrics in GitHub artifacts, visualize over time
3. **Spec linting**: Broader markdown validation (links, formatting, structure)
4. **Pre-commit hooks**: Run guards locally before push
5. **Bundle size guards**: Prevent bundle size regressions alongside performance
6. **Documentation generation**: Auto-generate module reference docs from code
7. **Custom ESLint plugin**: Package reusable path restriction rules
8. **Multi-project support**: Extend guards to API/backend if modular refactor expands

---

**Specification Status**:  Complete - Ready for planning phase

**Next Phase**: Generate `plan.md` and `tasks.md` for implementation
