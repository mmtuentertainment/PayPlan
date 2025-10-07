# Feature Specification: PR Hygiene + OpenAPI Lint Guard

**Feature Branch**: `004-pr-hygiene-openapi-lint`
**Created**: 2025-10-07
**Status**: Draft
**Input**: User description: "raise PR quality + keep 'OpenAPI is source of truth' without touching runtime. Smallest reversible slice: add a PR template + a non-blocking OpenAPI lint in CI that only runs if an OpenAPI file exists. Constraints: ≤8 files, ≤180 LOC, 2 domains (PR hygiene, API spec lint). Why this now: immediate reviewer signal, zero blast radius, complements 0013/0014 guards."

## Execution Flow (main)
```
1. Parse user description from Input ✅
   → Goal: Improve PR quality + enforce OpenAPI as source of truth
   → Constraints: ≤8 files, ≤180 LOC, docs/CI only (zero runtime impact)
2. Extract key concepts from description ✅
   → Actors: PR reviewers, PR authors, CI system
   → Actions: template rendering, spec detection, linting, summary generation
   → Data: PR metadata, OpenAPI spec files, lint results
   → Constraints: non-blocking, reversible, minimal LOC
3. For each unclear aspect: ✅
   → All aspects clearly defined in user description
4. Fill User Scenarios & Testing section ✅
   → Scenario 1: PR opened without spec (template renders, lint skips)
   → Scenario 2: PR opened with valid spec (template renders, lint passes)
   → Scenario 3: PR opened with invalid spec (template renders, lint fails with helpful summary)
5. Generate Functional Requirements ✅
   → 12 functional requirements covering template, detection, linting, reporting
6. Identify Key Entities ✅
   → PR Template, OpenAPI Spec, Lint Results, CI Job Summary
7. Run Review Checklist ✅
   → No implementation details in spec
   → All requirements testable
   → Success criteria measurable
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
As a **PR reviewer**, I want **structured PR descriptions with security checklists and automatic OpenAPI validation** so that I can **quickly assess risk, verify API changes match the spec, and ensure consistent PR quality across the team**.

As a **PR author**, I want **a clear template and immediate feedback on OpenAPI spec issues** so that I can **submit well-documented PRs with valid API specs without manual validation**.

### Acceptance Scenarios

1. **Given** a developer opens a new PR in a repository without an OpenAPI spec, **When** the PR is created, **Then** the PR description is pre-filled with a template (Summary, Risk, Rollback, Verification, LOC table, Security checklist) and the CI job reports "Skipped (no openapi.yaml found)"

2. **Given** a developer opens a PR in a repository with a valid OpenAPI spec at `openapi.yaml`, **When** the PR is created, **Then** the PR template renders AND the CI job detects the spec, runs Spectral lint, and reports "✅ No Spectral issues detected" in the job summary

3. **Given** a developer opens a PR that modifies an OpenAPI spec with validation errors, **When** the PR is created, **Then** the CI job detects the spec, runs Spectral lint, finds issues, and posts an RFC9457-style Problem Details JSON excerpt showing the first 25 issues in the GitHub Actions Summary

4. **Given** a developer wants to check which OpenAPI spec will be linted, **When** they run `npm run spec:path` locally, **Then** the command prints "OpenAPI spec: [path]" or "No OpenAPI spec found; skipping"

5. **Given** a PR author fills out the security checklist in the template, **When** reviewers examine the PR, **Then** they can quickly verify that Idempotency-Key, RFC9457, RBAC, rate limiting, tenant RLS, and OpenAPI updates are addressed (if endpoints changed)

### Edge Cases
- What happens when **multiple OpenAPI spec files exist** (e.g., both `openapi.yaml` and `api/openapi.yaml`)? → CI detects the first match in priority order and lints only that file
- How does the system handle **malformed OpenAPI spec files** that crash the linter? → Spectral outputs errors to JSON, summary shows the error, job continues (non-blocking)
- What if **the spec is valid but uses deprecated features**? → Spectral flags warnings in the summary; job still passes (non-blocking)
- What happens when **developers don't fill out the PR template**? → Template still renders; reviewers can request completion; no automated enforcement (human process)

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a PR template at `.github/PULL_REQUEST_TEMPLATE.md` that automatically populates the PR description field when a PR is created

- **FR-002**: PR template MUST include the following sections: Title, Summary, Risk (checkboxes: None/Low/Medium/High), Rollback, Verification (with code block), LOC Budget table, Security checklist (6 items), and Notes

- **FR-003**: System MUST provide a CI workflow that runs on all pull request events

- **FR-004**: CI workflow MUST detect OpenAPI spec files in the following priority order: `openapi.yaml`, `openapi.yml`, `api/openapi.yaml`, `api/openapi.yml`

- **FR-005**: CI workflow MUST skip OpenAPI linting if no spec file is detected and report "Skipped (no openapi.yaml found)" in the job summary

- **FR-006**: CI workflow MUST lint detected OpenAPI specs using Spectral CLI when a spec file exists

- **FR-007**: CI workflow MUST be non-blocking (use `continue-on-error: true`) so that PRs are not blocked by lint failures

- **FR-008**: CI workflow MUST output lint results in JSON format for programmatic processing

- **FR-009**: CI workflow MUST post an RFC9457-style Problem Details summary to GitHub Actions Summary (`$GITHUB_STEP_SUMMARY`) showing up to 25 lint issues

- **FR-010**: System MUST provide a local helper script `npm run spec:path` that prints the detected OpenAPI spec path or "No OpenAPI spec found; skipping"

- **FR-011**: System MUST document all changes in a delta file at `ops/deltas/0015_pr_hygiene_openapi.md` including scope, verification steps, and rollback instructions

- **FR-012**: System MUST maintain zero runtime code changes (docs/CI only) and stay within ≤180 LOC budget

### Key Entities

- **PR Template**: Structured markdown file that GitHub automatically loads into the PR description field; contains sections for Summary, Risk, Rollback, Verification, LOC Budget table, Security checklist (Idempotency-Key, RFC9457, RBAC+audit, 429+Retry-After, Tenant RLS via BFF, OpenAPI SoT), and Notes

- **OpenAPI Spec**: YAML file describing the API contract; located at one of four possible paths (root or `api/` directory, `.yaml` or `.yml` extension); serves as the source of truth for API endpoints

- **Lint Results**: JSON output from Spectral CLI containing issues found in the OpenAPI spec; includes rule IDs, severity, messages, and line numbers; limited to first 25 issues in the summary

- **CI Job Summary**: GitHub Actions feature (`$GITHUB_STEP_SUMMARY`) that displays formatted output in the job's summary view; shows RFC9457-style Problem Details with detected issues or success/skip messages

- **Delta Document**: Markdown file documenting the change (Delta 0015); includes type (tooling-only), runtime impact (none), rollback (single revert), changes made, and verification steps

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs) - spec focuses on behavior
- [x] Focused on user value and business needs - improves PR quality and API governance
- [x] Written for non-technical stakeholders - uses plain language
- [x] All mandatory sections completed - scenarios, requirements, entities present

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - all aspects well-defined
- [x] Requirements are testable and unambiguous - each FR is verifiable
- [x] Success criteria are measurable - LOC budget, file count, zero runtime changes
- [x] Scope is clearly bounded - 2 domains (PR hygiene, API spec lint), ≤8 files, ≤180 LOC
- [x] Dependencies and assumptions identified - builds on Delta 0013/0014 guards

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted (PR quality, OpenAPI SoT, CI linting, templates)
- [x] Ambiguities marked (none - description is complete)
- [x] User scenarios defined (5 scenarios + 4 edge cases)
- [x] Requirements generated (12 functional requirements)
- [x] Entities identified (5 key entities)
- [x] Review checklist passed

---

## Additional Context

### Relationship to Existing Deltas
- **Delta 0013**: Docs-only realignment (provides context for maintaining spec accuracy)
- **Delta 0014**: CI guards (ESLint, performance, spec audit) - this adds another complementary guard

### Success Metrics
- PR template adoption: 100% (automatic)
- OpenAPI spec detection accuracy: 100% (if spec exists in defined locations)
- CI job non-blocking: 100% (continues on error)
- LOC budget adherence: ≤180 LOC
- File count: ≤8 files
- Runtime impact: 0 changes

### Future Enhancements (Out of Scope)
- Make OpenAPI lint blocking after spec stabilizes (change `continue-on-error` to `false`)
- Add custom Spectral rulesets for project-specific API standards
- Integrate with PR comment bot to post lint results inline
- Support additional spec formats (Swagger 2.0, AsyncAPI)
