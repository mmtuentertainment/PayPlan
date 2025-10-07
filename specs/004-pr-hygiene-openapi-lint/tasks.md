# Tasks: PR Hygiene + OpenAPI Lint Guard

**Input**: Design documents from `/home/matt/PROJECTS/PayPlan/specs/004-pr-hygiene-openapi-lint/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Node.js 20, Bash, Markdown, YAML
   → Structure: Docs/CI only (no runtime code)
2. Load optional design documents ✅
   → data-model.md: 8 entities (PR Template, Spec Detection, Lint Results, etc.)
   → contracts/: 3 files (pr-template.md, ci-workflow.md, delta-doc.md)
   → research.md: 7 technical decisions documented
3. Generate tasks by category ✅
   → Setup: N/A (no dependencies)
   → Tests: Manual verification (no automated tests)
   → Core: PR template, CI workflow, helper script, delta doc
   → Integration: N/A (docs/CI only)
   → Polish: PR preparation, local verification
4. Apply task rules ✅
   → T001-T004 = different files = mark [P]
   → T005 depends on T001-T004 = sequential
   → T006 depends on T003 = sequential
5. Number tasks sequentially (T001-T006) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness ✅
   → All contracts have implementation tasks: YES
   → All entities have corresponding tasks: YES
   → All verification steps included: YES
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Repository root for docs: `.github/`, `ops/deltas/`, `package.json`
- No `src/` or runtime code (docs/CI only)

---

## Phase 3.1: Core Implementation

### T001 [P] Create PR Template ✅
**File**: `.github/PULL_REQUEST_TEMPLATE.md`
**LOC**: ~35 lines
**Contract**: [contracts/pr-template.md](./contracts/pr-template.md)

**Description**: Create GitHub pull request template with 8 required sections.

**Implementation**:
1. Create `.github/` directory if not exists
2. Create `PULL_REQUEST_TEMPLATE.md` with sections:
   - Title (level 1 heading)
   - Summary (with placeholder for spec links)
   - Risk (4 checkboxes: None/Low/Medium/High)
   - Rollback (default: "Single revert of this commit...")
   - Verification (bash code block with `npm run spec:path`)
   - LOC Budget (markdown table)
   - Security checklist (6 items: Idempotency-Key, RFC9457, RBAC, 429, Tenant RLS, OpenAPI SoT)
   - Notes (placeholder)
3. Use exact template content from contract (lines 61-102)

**Acceptance Criteria**:
- File exists at `.github/PULL_REQUEST_TEMPLATE.md`
- All 8 sections present with correct heading levels
- Security checklist has exactly 6 items
- Verification section includes `npm run spec:path` command
- LOC budget table has right-aligned numeric columns
- No typos or formatting errors

**Verification**:
```bash
# Check file exists
test -f .github/PULL_REQUEST_TEMPLATE.md && echo "✅ Template exists"

# Count sections (should be 8 main headings)
grep -c "^## " .github/PULL_REQUEST_TEMPLATE.md  # Expected: 7 (Summary through Notes)
grep -c "^# " .github/PULL_REQUEST_TEMPLATE.md   # Expected: 1 (Title)

# Verify security checklist items
grep -c "^\* \[ \]" .github/PULL_REQUEST_TEMPLATE.md  # Expected: 10 (4 risk + 6 security)
```

---

### T002 [P] Create CI Workflow ✅
**File**: `.github/workflows/pr-hygiene.yml`
**LOC**: ~50 lines
**Contract**: [contracts/ci-workflow.md](./contracts/ci-workflow.md)

**Description**: Create GitHub Actions workflow to detect OpenAPI specs, lint with Spectral, and post summary.

**Implementation**:
1. Create `.github/workflows/` directory if not exists
2. Create `pr-hygiene.yml` with:
   - Name: "PR Hygiene (Delta 0015)"
   - Trigger: `pull_request` event
   - Runner: ubuntu-latest
   - Permissions: `contents: read`
   - Steps:
     - Checkout (actions/checkout@v4)
     - Setup Node 20 (actions/setup-node@v4, cache: npm)
     - Detect OpenAPI spec (bash, 4 paths, set `path` output)
     - Lint with Spectral (if spec found, continue-on-error: true, save to spectral.json)
     - Summarize (always run, parse JSON, write to $GITHUB_STEP_SUMMARY)

**Detect Step Logic**:
```bash
for p in "openapi.yaml" "openapi.yml" "api/openapi.yaml" "api/openapi.yml"; do
  if [[ -f "$p" ]]; then
    echo "path=$p" >> "$GITHUB_OUTPUT"
    exit 0
  fi
done
echo "path=" >> "$GITHUB_OUTPUT"
```

**Lint Step**:
```bash
npx -y @stoplight/spectral-cli lint "${{ steps.detect.outputs.path }}" --quiet --format json > spectral.json || true
```

**Summarize Step**:
```bash
if [[ -z "${{ steps.detect.outputs.path }}" ]]; then
  echo "## Delta 0015 — OpenAPI Lint" >> "$GITHUB_STEP_SUMMARY"
  echo "> Skipped (no OpenAPI spec found)." >> "$GITHUB_STEP_SUMMARY"
elif [[ ! -f spectral.json ]] || ! jq empty spectral.json 2>/dev/null; then
  echo "## Delta 0015 — OpenAPI Lint" >> "$GITHUB_STEP_SUMMARY"
  echo "ℹ️ Spectral did not run (no spec or earlier step skipped)." >> "$GITHUB_STEP_SUMMARY"
else
  COUNT=$(jq 'length' spectral.json)
  echo "## Delta 0015 — OpenAPI Lint" >> "$GITHUB_STEP_SUMMARY"
  if [[ "$COUNT" -eq 0 ]]; then
    echo "✅ No Spectral issues detected." >> "$GITHUB_STEP_SUMMARY"
  else
    echo "Found **$COUNT** issue(s)." >> "$GITHUB_STEP_SUMMARY"
    echo "" >> "$GITHUB_STEP_SUMMARY"
    echo "### Problem Details (excerpt)" >> "$GITHUB_STEP_SUMMARY"
    echo '```json' >> "$GITHUB_STEP_SUMMARY"
    jq '.[0:25]' spectral.json >> "$GITHUB_STEP_SUMMARY"
    echo '```' >> "$GITHUB_STEP_SUMMARY"
    echo "" >> "$GITHUB_STEP_SUMMARY"
    echo "_Note:_ Non-blocking for now. Make blocking later by removing \`continue-on-error: true\`." >> "$GITHUB_STEP_SUMMARY"
  fi
fi
```

**Acceptance Criteria**:
- Workflow triggers on `pull_request` events
- Detects 4 OpenAPI spec paths in correct priority order
- Skips gracefully if no spec found
- Runs Spectral lint when spec exists
- Posts summary to `$GITHUB_STEP_SUMMARY` (always runs)
- Non-blocking with `continue-on-error: true`
- Limits summary to first 25 issues
- Uses RFC9457-style Problem Details format

**Verification**:
```bash
# Check file exists
test -f .github/workflows/pr-hygiene.yml && echo "✅ Workflow exists"

# Validate YAML syntax
yamllint .github/workflows/pr-hygiene.yml || echo "⚠️ YAML linting (install yamllint if needed)"

# Check for continue-on-error (non-blocking)
grep -q "continue-on-error: true" .github/workflows/pr-hygiene.yml && echo "✅ Non-blocking enabled"

# Check for 4 spec paths
grep -c "openapi\\.ya\\?ml" .github/workflows/pr-hygiene.yml  # Expected: ≥4
```

---

### T003 [P] Add Helper Script to package.json ✅
**File**: `package.json` (root)
**LOC**: ~1 line (script entry)
**Contract**: [data-model.md](./data-model.md#8-packagejson-script-entry)

**Description**: Add `spec:path` npm script for local OpenAPI spec detection.

**Implementation**:
1. Open `package.json` at repository root
2. Add to `scripts` section:
   ```json
   "spec:path": "node -e \"const fs=require('fs');const c=['openapi.yaml','openapi.yml','api/openapi.yaml','api/openapi.yml'].find(p=>fs.existsSync(p));console.log(c?('OpenAPI spec: '+c):'No OpenAPI spec found; skipping')\""
   ```
3. Place after existing scripts (maintain alphabetical order if applicable)

**Acceptance Criteria**:
- `package.json` has `spec:path` script
- Script checks 4 paths in correct priority order
- Output format matches contract:
  - Found: `OpenAPI spec: <path>`
  - Not found: `No OpenAPI spec found; skipping`
- Script always exits with code 0 (non-failing)
- No external dependencies (uses built-in `fs`)

**Verification**:
```bash
# Check script exists
npm run spec:path --silent  # Should print "No OpenAPI spec found; skipping" or "OpenAPI spec: <path>"

# Test with no spec (current state)
npm run spec:path 2>&1 | grep -q "No OpenAPI spec found" && echo "✅ Handles missing spec"

# Test exit code (should be 0)
npm run spec:path && echo "✅ Exit code 0"
```

---

### T004 [P] Create Delta Documentation ✅
**File**: `ops/deltas/0015_pr_hygiene_openapi.md`
**LOC**: ~30 lines
**Contract**: [contracts/delta-doc.md](./contracts/delta-doc.md)

**Description**: Create delta document tracking this change (Delta 0015).

**Implementation**:
1. Create `ops/deltas/` directory if not exists
2. Create `0015_pr_hygiene_openapi.md` with:
   - Header: Delta number, title, type tags (Tooling-only, docs/CI, zero runtime impact)
   - Changes section: List all 4 files created
   - Verification section: Commands to test locally and in CI
   - Notes section: Non-blocking strategy, how to make blocking

**Content**:
```markdown
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
```

**Acceptance Criteria**:
- File exists at `ops/deltas/0015_pr_hygiene_openapi.md`
- Header includes delta number, title, type tags
- Changes section lists all 4 files with LOC counts
- Verification section has local commands and CI instructions
- Notes section explains non-blocking strategy and how to make blocking
- References complements (Delta 0013) and quickstart guide

**Verification**:
```bash
# Check file exists
test -f ops/deltas/0015_pr_hygiene_openapi.md && echo "✅ Delta doc exists"

# Count sections
grep -c "^## " ops/deltas/0015_pr_hygiene_openapi.md  # Expected: 3 (Changes, Verification, Notes)

# Check LOC total mentioned
grep -q "~116 lines" ops/deltas/0015_pr_hygiene_openapi.md && echo "✅ LOC total documented"
```

---

## Phase 3.2: Validation & Preparation

### T005 Prepare PR Body ✅
**File**: None (prepared text, not committed)
**LOC**: 0 (documentation only)
**Dependencies**: T001-T004 (all files created)

**Description**: Prepare drop-in PR description using the new PR template format.

**Implementation**:
1. Copy PR template structure from `.github/PULL_REQUEST_TEMPLATE.md`
2. Fill in all sections with specific content for this feature:

**PR Body Content**:
```markdown
# 0015: PR Template + OpenAPI Lint (non-blocking)

## Summary
Add PR template and non-blocking OpenAPI lint to improve PR quality with zero runtime impact. PR template provides 8 structured sections (Summary/Risk/Rollback/Verification/LOC/Security checklist). CI workflow auto-detects OpenAPI specs (4 paths), lints with Spectral, posts RFC9457-style Problem Details to GitHub Actions Summary. Non-blocking initially (`continue-on-error: true`). See: [ops/deltas/0015_pr_hygiene_openapi.md](../ops/deltas/0015_pr_hygiene_openapi.md) | [specs/004-pr-hygiene-openapi-lint/quickstart.md](../specs/004-pr-hygiene-openapi-lint/quickstart.md)

## Risk
- [x] None (docs/tooling only)

## Rollback
Single revert of this commit. No data migrations.

## Verification
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

# CI will run and post summary (expected: "Skipped (no OpenAPI spec found)")
```

## LOC Budget

| Component                           |  + |  - |
| ----------------------------------- | -: | -: |
| `.github/PULL_REQUEST_TEMPLATE.md`  | 35 |  0 |
| `.github/workflows/pr-hygiene.yml`  | 50 |  0 |
| `package.json` (spec:path script)   |  1 |  0 |
| `ops/deltas/0015_pr_hygiene_openapi.md` | 30 |  0 |
| **Total LOC**                       | **116** |  **0** |

## Security (if endpoints changed)
N/A — No endpoint changes (docs/CI only).

## Notes
- Non-blocking strategy allows gradual adoption (fix existing spec issues before enforcing)
- Complements Delta 0013 (Specs Realignment)
- Future: Remove `continue-on-error: true` to make lint blocking
- Spectral via `npx -y` (no new dependencies)
- Security checklist enforces: Idempotency-Key, RFC9457, RBAC, 429, Tenant RLS, OpenAPI SoT
```

**Acceptance Criteria**:
- PR body follows template structure exactly
- All sections filled with specific content (no placeholders)
- LOC budget matches T001-T004 estimates
- Verification commands are copy-pastable
- Risk level is "None" (docs/tooling only)
- Notes explain non-blocking strategy

**Verification**:
```bash
# Save PR body to temporary file for review
cat > /tmp/pr-body-0015.md << 'EOF'
[paste PR body content here]
EOF

# Verify sections present
grep -c "^## " /tmp/pr-body-0015.md  # Expected: 7

# Check LOC total
grep -q "116" /tmp/pr-body-0015.md && echo "✅ LOC total matches"
```

---

### T006 Verify Locally ✅
**File**: None (manual verification)
**LOC**: 0 (testing only)
**Dependencies**: T003 (helper script must exist)

**Description**: Test all changes locally before creating PR.

**Implementation**:
Run all verification commands from T001-T004 to ensure files are correct.

**Verification Commands**:
```bash
echo "=== T001: PR Template ==="
test -f .github/PULL_REQUEST_TEMPLATE.md && echo "✅ Template exists"
grep -c "^## " .github/PULL_REQUEST_TEMPLATE.md  # Expected: 7
grep -c "^# " .github/PULL_REQUEST_TEMPLATE.md   # Expected: 1
grep -c "^\* \[ \]" .github/PULL_REQUEST_TEMPLATE.md  # Expected: 10

echo "=== T002: CI Workflow ==="
test -f .github/workflows/pr-hygiene.yml && echo "✅ Workflow exists"
grep -q "continue-on-error: true" .github/workflows/pr-hygiene.yml && echo "✅ Non-blocking enabled"
grep -c "openapi\\.ya\\?ml" .github/workflows/pr-hygiene.yml  # Expected: ≥4

echo "=== T003: Helper Script ==="
npm run spec:path  # Should print "No OpenAPI spec found; skipping"
npm run spec:path 2>&1 | grep -q "No OpenAPI spec found" && echo "✅ Handles missing spec"

echo "=== T004: Delta Doc ==="
test -f ops/deltas/0015_pr_hygiene_openapi.md && echo "✅ Delta doc exists"
grep -c "^## " ops/deltas/0015_pr_hygiene_openapi.md  # Expected: 3
grep -q "~116 lines" ops/deltas/0015_pr_hygiene_openapi.md && echo "✅ LOC total documented"

echo "=== T005: PR Body ==="
test -f /tmp/pr-body-0015.md && echo "✅ PR body prepared (in /tmp/pr-body-0015.md)"

echo "=== Git Status ==="
git status --short
# Expected output:
# A  .github/PULL_REQUEST_TEMPLATE.md
# A  .github/workflows/pr-hygiene.yml
# M  package.json
# A  ops/deltas/0015_pr_hygiene_openapi.md

echo "=== LOC Count ==="
git diff --cached --stat
# Expected: 4 files changed, ~116 insertions(+)
```

**Acceptance Criteria**:
- All T001-T004 verification commands pass
- Git status shows 4 files changed (3 added, 1 modified)
- LOC count is ~116 lines (within 180 budget)
- No errors or unexpected output
- PR body text saved to `/tmp/pr-body-0015.md`

**Manual Checks**:
1. Open `.github/PULL_REQUEST_TEMPLATE.md` in editor → verify formatting
2. Open `.github/workflows/pr-hygiene.yml` in editor → verify YAML syntax
3. Run `npm run spec:path` → confirm output matches expected format
4. Review `ops/deltas/0015_pr_hygiene_openapi.md` → ensure clarity

---

## Dependencies

```
T001 [P] ─┐
T002 [P] ─┼─→ T005 ─→ T006
T003 [P] ─┤         ↗
T004 [P] ─┘        (T006 also depends on T003 for spec:path)
```

**Critical Path**:
1. T001-T004 can run in parallel (different files)
2. T005 requires T001-T004 complete (needs all files for PR body)
3. T006 requires T003 complete (needs `spec:path` script to test)
4. T006 requires T005 complete (needs PR body to verify)

**Dependency Notes**:
- T001-T004: Independent (no blocking)
- T005: Blocked by T001-T004 (needs file content)
- T006: Blocked by T003 and T005 (needs script + PR body)

---

## Parallel Execution Example

### Phase 3.1: Launch T001-T004 in parallel
```bash
# All tasks create different files, so they can run concurrently
Task 1: "Create PR template at .github/PULL_REQUEST_TEMPLATE.md"
Task 2: "Create CI workflow at .github/workflows/pr-hygiene.yml"
Task 3: "Add spec:path script to package.json"
Task 4: "Create delta doc at ops/deltas/0015_pr_hygiene_openapi.md"
```

### Phase 3.2: Sequential execution
```bash
# T005 requires T001-T004 complete
Task 5: "Prepare PR body using completed files"

# T006 requires T003 and T005 complete
Task 6: "Verify all changes locally with npm run spec:path"
```

---

## Notes

### Task Characteristics
- **No automated tests**: Manual verification only (docs/CI feature)
- **No runtime code**: All changes are docs/CI artifacts
- **Single commit**: All tasks should be committed together after T006 verification
- **Reversible**: Single `git revert` undoes entire feature

### Execution Strategy
1. **Parallel Phase**: Run T001-T004 simultaneously (different files, no conflicts)
2. **Sequential Phase**: Run T005 after T001-T004 complete
3. **Validation Phase**: Run T006 after T003 and T005 complete
4. **Commit**: Single commit with all 4 files after T006 passes

### LOC Budget Tracking
- T001: 35 LOC (PR template)
- T002: 50 LOC (CI workflow)
- T003: 1 LOC (package.json script)
- T004: 30 LOC (delta doc)
- **Total**: 116 LOC / 180 budget (64 LOC headroom)

### Git Commit Message (after T006)
```
feat(tooling): Add PR template + OpenAPI lint guard (Delta 0015)

Add PR template with 8 structured sections (Summary/Risk/Rollback/
Verification/LOC/Security) and non-blocking OpenAPI lint via Spectral.
CI detects specs at 4 paths, lints, posts RFC9457-style Problem Details
to Actions Summary. Helper script `npm run spec:path` for local verification.

Changes:
- .github/PULL_REQUEST_TEMPLATE.md (35 LOC)
- .github/workflows/pr-hygiene.yml (50 LOC)
- package.json: spec:path script (1 LOC)
- ops/deltas/0015_pr_hygiene_openapi.md (30 LOC)

Total: 116 LOC (docs/CI only, zero runtime impact)
Non-blocking initially (continue-on-error: true)

See: ops/deltas/0015_pr_hygiene_openapi.md
Complements: Delta 0013 (Specs Realignment)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Validation Checklist
*GATE: Must pass before marking tasks complete*

- [x] All contracts have corresponding implementation tasks
  - pr-template.md → T001 ✅
  - ci-workflow.md → T002 ✅
  - delta-doc.md → T004 ✅
- [x] All entities have tasks
  - PR Template → T001 ✅
  - OpenAPI Spec Detection → T002 (part of workflow) ✅
  - Lint Results → T002 (Spectral output) ✅
  - CI Job Summary → T002 (summarize step) ✅
  - Helper Script Output → T003 ✅
  - Delta Document → T004 ✅
  - Workflow Metadata → T002 ✅
  - package.json Script Entry → T003 ✅
- [x] Implementation order follows dependencies
  - Setup before core: N/A (no setup)
  - Tests before implementation: N/A (manual verification only)
  - Core before polish: T001-T004 before T005-T006 ✅
- [x] Parallel tasks truly independent
  - T001-T004 modify different files ✅
  - No shared resources ✅
- [x] Each task specifies exact file path ✅
- [x] No task modifies same file as another [P] task ✅

---

**Status**: ✅ COMPLETE | **Ready for**: Execution (T001-T006)
