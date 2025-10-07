# Delta 0015 — PR Template + OpenAPI Lint (non-blocking)

**Type**: Tooling-only (docs/CI)
**Runtime impact**: None
**Rollback**: Single revert of this commit

## Changes

1. Created `.github/PULL_REQUEST_TEMPLATE.md` (35 LOC)
   - 8 sections: Title, Summary, Risk, Rollback, Verification, LOC Budget, Security, Notes
   - Security checklist: 6 items (Idempotency-Key, RFC9457, RBAC, 429, Tenant RLS, OpenAPI SoT)

2. Created `.github/workflows/pr-hygiene.yml` (50 LOC)
   - Detects OpenAPI specs at 4 paths (root or api/, .yaml or .yml)
   - Lints with Spectral CLI (npx -y, no new dependencies)
   - Posts RFC9457-style Problem Details to GitHub Actions Summary
   - Non-blocking (`continue-on-error: true`)

3. Added `spec:path` script to `package.json` (1 LOC)
   - Local helper: `npm run spec:path`
   - Prints detected spec path or "No OpenAPI spec found; skipping"

4. Created `ops/deltas/0015_pr_hygiene_openapi.md` (this file, 30 LOC)

**Total LOC**: ~116 lines (64 under 180 budget)

## Verification

### Local
```bash
# Test helper script
npm run spec:path
# Expected: "No OpenAPI spec found; skipping" (current state)

# Check PR template
test -f .github/PULL_REQUEST_TEMPLATE.md && echo "✅ Template exists"
grep -c "^## " .github/PULL_REQUEST_TEMPLATE.md  # Expected: 7 sections

# Validate workflow
test -f .github/workflows/pr-hygiene.yml && echo "✅ Workflow exists"
grep -q "continue-on-error: true" .github/workflows/pr-hygiene.yml && echo "✅ Non-blocking"
```

### CI
1. Create a PR (this branch → main)
2. PR description auto-loads from template
3. CI runs "PR Hygiene (Delta 0015)" job
4. Check Actions → Job Summary:
   - Should show: `> Skipped (no OpenAPI spec found).`

## Notes

**Non-blocking Strategy**: Lint failures don't block PRs initially. This allows gradual adoption and fixing existing spec issues before enforcing.

**Making Lint Blocking**:
1. Fix any existing OpenAPI spec issues
2. Edit `.github/workflows/pr-hygiene.yml`
3. Remove line: `continue-on-error: true` from "Lint OpenAPI with Spectral" step
4. Commit and push

**Complements**: Delta 0013 (Specs Realignment), Delta 0014 (if exists)

**See Also**: [specs/004-pr-hygiene-openapi-lint/quickstart.md](../../specs/004-pr-hygiene-openapi-lint/quickstart.md)
