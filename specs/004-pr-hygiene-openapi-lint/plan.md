# Implementation Plan: PR Hygiene + OpenAPI Lint Guard

**Branch**: `004-pr-hygiene-openapi-lint` | **Date**: 2025-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/matt/PROJECTS/PayPlan/specs/004-pr-hygiene-openapi-lint/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Spec loaded: 12 functional requirements, 5 scenarios, clear constraints
2. Fill Technical Context ✅
   → Project Type: web (frontend + backend)
   → No NEEDS CLARIFICATION - user provided explicit implementation details
3. Fill Constitution Check section ✅
   → No constitution defined; proceeding with best practices
4. Evaluate Constitution Check ✅
   → No violations (docs/CI only, zero runtime impact)
   → Update Progress Tracking: Initial Constitution Check ✅
5. Execute Phase 0 → research.md ✅
   → Technical decisions documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md ✅
   → All artifacts generated
7. Re-evaluate Constitution Check ✅
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check ✅
8. Plan Phase 2 → Task generation approach ✅
   → 6 sequential tasks (T001-T006)
9. STOP - Ready for /tasks command ✅
```

**IMPORTANT**: The /plan command STOPS at step 8. Phase 2 is executed by /tasks command.

---

## Summary

Add PR template and non-blocking OpenAPI lint to improve PR quality and enforce "OpenAPI as source of truth" with zero runtime impact. Template provides structured sections (Summary/Risk/Rollback/Verification/LOC/Security checklist). CI workflow auto-detects OpenAPI specs, lints with Spectral, and posts RFC9457-style Problem Details to GitHub Actions Summary. Non-blocking initially (`continue-on-error: true`); can be made blocking with one-line change.

**Key Features**:
- PR template with 6-item security checklist (Idempotency-Key, RFC9457, RBAC+audit, 429+Retry-After, Tenant RLS via BFF, OpenAPI SoT)
- CI workflow detects 4 possible OpenAPI spec paths (root or `api/`, `.yaml` or `.yml`)
- Spectral lint via `npx` (no new dependencies)
- Local helper script `npm run spec:path` for quick spec detection
- Delta doc for traceability

---

## Technical Context

**Language/Version**: Node.js 20 (GitHub Actions), Bash (CI scripts), Markdown (template)
**Primary Dependencies**: None added (Spectral via `npx -y`, jq for JSON parsing in CI)
**Storage**: N/A (docs/CI only)
**Testing**: Manual verification (`npm run spec:path`, PR creation, CI job execution)
**Target Platform**: GitHub Actions (ubuntu-latest)
**Project Type**: web (frontend + backend)
**Performance Goals**: N/A (docs/CI tooling)
**Constraints**: ≤180 LOC, ≤8 files, zero runtime changes, non-blocking lint
**Scale/Scope**: Single PR template, single CI workflow, single helper script, single delta doc

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASSED (Initial) | ✅ PASSED (Post-Design)

**No constitution defined for this repository.** Proceeding with software engineering best practices:

### Best Practice Alignment
- ✅ **Docs-First**: PR template and delta doc provide clear documentation
- ✅ **Zero Runtime Impact**: No code changes, only docs/CI additions
- ✅ **Testability**: Manual verification steps defined, CI workflow is self-contained
- ✅ **Reversibility**: Single-commit revert restores pre-change state
- ✅ **Incremental**: Non-blocking first, can be made blocking later
- ✅ **Observability**: GitHub Actions Summary provides clear feedback

### Complexity Justification
- **PR Template**: Adds structure without enforcement (human process)
- **CI Workflow**: 3 steps (detect, lint, summarize) - minimal complexity
- **Helper Script**: One-liner Node.js script - no external deps
- **Delta Doc**: Standard documentation pattern from Delta 0013/0014

**No violations detected.**

---

## Project Structure

### Documentation (this feature)
```
specs/004-pr-hygiene-openapi-lint/
├── spec.md             # Feature specification (✅ exists)
├── plan.md             # This file (/plan command output)
├── research.md         # Phase 0 output (/plan command)
├── data-model.md       # Phase 1 output (/plan command)
├── quickstart.md       # Phase 1 output (/plan command)
├── contracts/          # Phase 1 output (/plan command)
│   ├── pr-template.md
│   ├── ci-workflow.md
│   └── delta-doc.md
└── tasks.md            # Phase 2 output (/tasks command - NOT created by /plan)
```

### Deliverables (repository root)
```
.github/
├── PULL_REQUEST_TEMPLATE.md   # PR template (new)
└── workflows/
    └── pr-hygiene.yml          # CI workflow (new)

package.json                    # Updated with "spec:path" script

ops/deltas/
└── 0015_pr_hygiene_openapi.md  # Delta doc (new)
```

**No runtime source code changes.** All changes are docs/CI only.

---

## Phase 0: Research & Dependencies

**Status**: ✅ COMPLETE

See [research.md](./research.md) for detailed technical decisions on:
- PR template structure and sections
- OpenAPI spec detection strategy (4 path candidates)
- Spectral lint integration (`npx -y` to avoid deps)
- RFC9457 Problem Details format for summary output
- Non-blocking strategy (`continue-on-error: true`)

**Dependencies**:
- None added to `package.json`
- `npx -y @stoplight/spectral-cli` - fetched on-demand in CI
- `jq` - pre-installed in GitHub Actions ubuntu-latest

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

### Artifacts Generated

1. **Data Model** ([data-model.md](./data-model.md)):
   - PR Template structure (8 sections)
   - OpenAPI Spec detection (4 path candidates, priority order)
   - Lint Results format (Spectral JSON output)
   - CI Job Summary format (RFC9457-style Problem Details)
   - Delta Doc structure

2. **Contracts** ([contracts/](./contracts/)):
   - [pr-template.md](./contracts/pr-template.md) - Template sections, markdown structure, security checklist items
   - [ci-workflow.md](./contracts/ci-workflow.md) - Workflow triggers, steps, outputs, error handling
   - [delta-doc.md](./contracts/delta-doc.md) - Documentation format, verification commands, rollback instructions

3. **QuickStart Guide** ([quickstart.md](./quickstart.md)):
   - Local verification with `npm run spec:path`
   - PR creation flow
   - CI job execution and summary interpretation
   - Making lint blocking (one-line change)
   - Troubleshooting common issues

---

## Phase 2: Task Generation Plan

**Approach**: Sequential execution (T001-T006) with verification checkpoints.

**Task Categories**:
1. **Template Creation** (T001): Create PR template file
2. **CI Workflow** (T002): Create CI workflow with 3 steps (detect, lint, summarize)
3. **Helper Script** (T003): Update `package.json` with `spec:path` script
4. **Documentation** (T004): Create delta doc
5. **PR Preparation** (T005): Prepare PR body with verification instructions
6. **Verification** (T006): Test locally and validate workflow logic

**Dependencies**:
- T001-T004 can run in parallel (different files)
- T005 depends on T001-T004 (needs all files for PR description)
- T006 depends on T003 (needs `spec:path` script to test)

**LOC Distribution** (target ≤180 total):
- T001: ~35 LOC (PR template)
- T002: ~50 LOC (CI workflow)
- T003: ~1 LOC (package.json script)
- T004: ~30 LOC (delta doc)
- T005: ~0 LOC (PR body text, not committed)
- T006: ~0 LOC (verification only)
- **Total**: ~116 LOC (64 under budget)

---

## Progress Tracking

### Phase 0: Research
- [x] Load feature spec
- [x] Identify technical decisions needed
- [x] Document PR template structure
- [x] Document OpenAPI spec detection strategy
- [x] Document Spectral lint integration
- [x] Document RFC9457 summary format
- [x] research.md created

### Phase 1: Design
- [x] Data model defined (8 entities)
- [x] Contracts created (3 files)
- [x] QuickStart guide created
- [x] All artifacts validated

### Constitution Checks
- [x] Initial check (before Phase 0)
- [x] Post-design check (after Phase 1)
- [x] No violations or complexity issues

### Phase 2: Ready for /tasks
- [x] Task generation approach planned
- [x] LOC budget allocated
- [x] Dependencies identified
- [ ] tasks.md NOT created (awaiting /tasks command)

---

## Complexity Tracking

**Complexity Introduced**: MINIMAL

**Justification**:
1. **PR Template**: Standard GitHub feature, no custom logic
2. **CI Workflow**: 3 simple steps (detect file, run lint, write summary)
3. **Helper Script**: One-line Node.js find operation
4. **Delta Doc**: Standard documentation pattern

**No Complexity Violations**: All changes are declarative (markdown, YAML, shell scripts). No new runtime dependencies or code paths.

---

## Risk Assessment

**Risk Level**: NONE

**Rationale**:
- Docs/CI only (zero runtime code changes)
- Non-blocking (PRs not blocked by lint failures)
- Single-commit revert for rollback
- No new dependencies (`npx -y` fetches Spectral on-demand)
- Complements existing Delta 0013/0014 guards

**Mitigation**: N/A (no risks identified)

---

## Next Steps

1. Run `/tasks` command to generate `tasks.md` with detailed implementation steps
2. Execute tasks T001-T006 sequentially
3. Verify locally with `npm run spec:path`
4. Create PR with prepared body text
5. Verify CI workflow executes and posts summary

**Ready for**: `/tasks` command

---

**Version**: 1.0.0 | **Author**: Claude Code | **Last Updated**: 2025-10-07
