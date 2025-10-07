# Contract: CI Workflow

**Feature**: 004-pr-hygiene-openapi-lint
**File**: `.github/workflows/pr-hygiene.yml`
**Purpose**: Lint OpenAPI specs and post results to GitHub Actions Summary

---

## Workflow Specification

**Name**: PR Hygiene (Delta 0015)
**Trigger**: `pull_request` event (any branch)
**Runner**: ubuntu-latest
**Permissions**: contents: read

---

## Steps

### 1. Checkout
- Action: `actions/checkout@v4`
- Purpose: Clone repository code

### 2. Setup Node
- Action: `actions/setup-node@v4`
- Version: Node 20
- Cache: npm

### 3. Detect OpenAPI spec path
- ID: `detect`
- Shell: bash
- Logic: Check 4 paths in order, set `path` output
- Paths: `openapi.yaml`, `openapi.yml`, `api/openapi.yaml`, `api/openapi.yml`
- Output: `path=<file>` or `path=` (empty if not found)

### 4. Lint OpenAPI with Spectral
- ID: `spectral`
- Condition: `steps.detect.outputs.path != ''`
- Continue on error: true (non-blocking)
- Command: `npx -y @stoplight/spectral-cli lint "<path>" --quiet --format json > spectral.json`

### 5. Summarize (RFC9457-style)
- Condition: `always()`
- Parse `spectral.json` with `jq`
- Write markdown summary to `$GITHUB_STEP_SUMMARY`

---

## Summary Output Format

### No Spec Found
```markdown
## Delta 0015 — OpenAPI Lint
> Skipped (no OpenAPI spec found).
```

### No Issues
```markdown
## Delta 0015 — OpenAPI Lint
✅ No Spectral issues detected.
```

### Issues Found
```markdown
## Delta 0015 — OpenAPI Lint
Found **N** issue(s).

### Problem Details (excerpt)
```json
[<first 25 issues as JSON array>]
```

_Note:_ Non-blocking for now. Make blocking later by removing `continue-on-error: true`.
```

---

## LOC Budget

**File**: `.github/workflows/pr-hygiene.yml`
**Estimated LOC**: ~50 lines

---

## Acceptance Criteria

- [ ] Workflow triggers on PR events
- [ ] Detects 4 OpenAPI spec paths correctly
- [ ] Skips gracefully if no spec found
- [ ] Runs Spectral lint when spec exists
- [ ] Posts summary to `$GITHUB_STEP_SUMMARY`
- [ ] Non-blocking (`continue-on-error: true`)
- [ ] Limits summary to first 25 issues

---

**Status**: ✅ Contract defined
