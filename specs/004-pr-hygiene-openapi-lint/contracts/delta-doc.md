# Contract: Delta Documentation

**Feature**: 004-pr-hygiene-openapi-lint
**File**: `ops/deltas/0015_pr_hygiene_openapi.md`
**Purpose**: Document Delta 0015 changes for traceability

---

## Structure

### Header
- Title: `# Delta 0015 — PR Template + OpenAPI Lint (non-blocking)`
- Metadata: Type, Runtime impact, Rollback

### Changes Section
- List of files created/modified
- Brief description of each change

### Verification Section
- Local commands (`npm run spec:path`)
- CI verification (PR creation, job summary check)

### Notes Section
- Non-blocking strategy explanation
- How to make blocking (remove `continue-on-error`)

---

## Template Content

```markdown
# Delta 0015 — PR Template + OpenAPI Lint (non-blocking)

**Type:** Tooling-only (docs/CI). **Runtime impact:** None. **Rollback:** single revert.

## Changes
- **PR Template:** `.github/PULL_REQUEST_TEMPLATE.md` (Summary/Risk/Rollback/Verification/LOC + security checklist).
- **CI Job:** `.github/workflows/pr-hygiene.yml` auto-detects `openapi.(yml|yaml)` and lints with Spectral via `npx`.
- **Local Helper:** `npm run spec:path` prints detected spec or "skipping".

## Verification
```bash
npm run spec:path
# Open a PR → See "PR Hygiene (Delta 0015)" Summary with either 'Skipped' or lint results (JSON excerpt).
```

## Notes
* CI lint is **non-blocking** initially; toggle to blocking by removing `continue-on-error: true`.
```

---

## LOC Budget

**File**: `ops/deltas/0015_pr_hygiene_openapi.md`
**Estimated LOC**: ~30 lines

---

## Acceptance Criteria

- [ ] File exists at `ops/deltas/0015_pr_hygiene_openapi.md`
- [ ] Header includes type and runtime impact
- [ ] Changes section lists all 4 files
- [ ] Verification section has commands
- [ ] Notes explain non-blocking strategy

---

**Status**: ✅ Contract defined
