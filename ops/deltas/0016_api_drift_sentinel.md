# Delta 0016 — API Drift Sentinel

**Type**: Tooling-only (CI)
**Runtime impact**: None
**Rollback**: Single revert of this commit

## Changes

1. Created `scripts/check-api-drift.mjs` (98 LOC)
   - Detects API edits without OpenAPI spec updates
   - Prints RFC9457-style Problem Details JSON on drift
   - Checks patterns: `api/**`, `frontend/src/pages/api/**`, `vercel.json`, `serverless.yml`, shifter files, ICS files
   - Compares against 4 spec paths: `openapi.yaml`, `openapi.yml`, `api/openapi.yaml`, `api/openapi.yml`

2. Updated `package.json` (1 LOC)
   - Added `lint:api-drift` script for local verification

3. Created `.github/workflows/api-drift.yml` (48 LOC)
   - Runs on `pull_request` events
   - Executes drift check (non-blocking with `continue-on-error: true`)
   - Posts RFC9457-style summary to GitHub Actions

4. Created `ops/deltas/0016_api_drift_sentinel.md` (this file, 45 LOC)

**Total LOC**: ~192 lines (docs/CI only, zero runtime impact)

## Verification

### Local Testing
```bash
# Test drift detection locally (simulates comparing against previous commit)
API_DRIFT_BASE=$(git rev-parse HEAD~1) npm run lint:api-drift

# Or use the direct script
node scripts/check-api-drift.mjs

# Expected outputs:
# - "No API changes detected; skipping" (if no API files changed)
# - JSON with "spec_touched": true (if both API and spec changed)
# - JSON with "API drift detected" (if API changed without spec)
```

### CI Testing
1. Create a PR with API file changes (e.g., edit `frontend/src/pages/api/plan.ts`)
2. Do NOT touch `openapi.yaml`
3. CI runs "API Drift Sentinel" job
4. Check Actions → Job Summary:
   - Should show: **❌ Drift detected** with Problem Details JSON excerpt
   - Note: Job continues (non-blocking) but signals the issue

### Test with Spec Update
1. Create a PR that edits both API file AND `openapi.yaml`
2. CI runs "API Drift Sentinel" job
3. Check Actions → Job Summary:
   - Should show: **✅ API changes with spec update**

## Making Drift Check Blocking

To make the drift check **block PRs**:

1. Edit `.github/workflows/api-drift.yml`
2. Remove line: `continue-on-error: true` from "Run drift check" step
3. Commit and push

After this change, PRs with API drift (API changes without spec updates) will **fail** the CI check.

## Intentional API Changes Without Spec

If a PR intentionally changes API implementation without affecting the contract:

1. Add label `api-no-spec` to the PR
2. Add justification in PR description (e.g., "Internal refactor, no contract change")
3. Reviewer verifies the justification

## Patterns Detected

### API Files (triggers drift check)
- `api/**` - Backend API directory
- `frontend/src/pages/api/**` - Next.js API routes (if applicable)
- `vercel.json` - Serverless config
- `serverless.yml` - Serverless config
- `frontend/src/lib/*shifter*.ts` - Request shifter modules
- `frontend/src/lib/*ics*.ts` - ICS generation (if imports from API)

### Spec Files (clears drift check)
- `openapi.yaml` (root)
- `openapi.yml` (root)
- `api/openapi.yaml` (api/ subdirectory)
- `api/openapi.yml` (api/ subdirectory)

## Example Output

### Drift Detected
```json
{
  "type": "about:blank",
  "title": "API drift detected (spec not updated)",
  "detail": "API files changed without an OpenAPI spec change.",
  "instance": "a3f2e1b",
  "api_changes": [
    "frontend/src/pages/api/plan.ts",
    "vercel.json"
  ],
  "spec_touched": false,
  "remediation": "Update openapi.(yml|yaml) or justify with label 'api-no-spec'."
}
```

### Spec Updated
```json
{
  "title": "API changes with spec touch detected",
  "instance": "b4c3d2e",
  "api_changes": [
    "frontend/src/pages/api/plan.ts"
  ],
  "spec_touched": true
}
```

### No Changes
```
No API changes detected; skipping.
```

## Notes

**Enforcement Strategy**: Non-blocking initially allows teams to:
1. See drift signals on existing PRs
2. Update specs retroactively if needed
3. Build habit of updating specs with API changes
4. Make blocking once baseline is clean

**Complements**: Delta 0015 (PR Template + OpenAPI Lint) - together they enforce "OpenAPI is source of truth"

**Related**: Delta 0013 (Specs Realignment)

**See Also**: [specs/004-pr-hygiene-openapi-lint/quickstart.md](../../specs/004-pr-hygiene-openapi-lint/quickstart.md)
