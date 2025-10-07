# Research: PR Hygiene + OpenAPI Lint Guard

**Feature**: 004-pr-hygiene-openapi-lint
**Date**: 2025-10-07
**Phase**: 0 (Research & Dependencies)

---

## Research Questions

### RQ1: What sections should the PR template include?
**Decision**: 8 sections for comprehensive PR documentation

**Sections**:
1. **Title**: Clear, concise PR title
2. **Summary**: 2-4 line description with spec/delta links
3. **Risk**: Checkboxes (None/Low/Medium/High)
4. **Rollback**: Simple revert instructions
5. **Verification**: Bash commands + expected output
6. **LOC Budget**: Table with + /- columns
7. **Security**: 6-item checklist (if endpoints changed)
8. **Notes**: Additional reviewer context

**Rationale**:
- Standardizes PR quality across team
- Security checklist ensures API changes are reviewed for: Idempotency-Key, RFC9457 Problem Details, RBAC+audit, 429+Retry-After, Tenant RLS via BFF, OpenAPI as source of truth
- LOC Budget promotes awareness of change size
- Verification commands enable reviewer self-service

**References**:
- GitHub PR template docs: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
- Existing PayPlan Deltas (0013, 0014) use similar structure

---

### RQ2: How should we detect OpenAPI spec files?
**Decision**: Check 4 paths in priority order

**Paths** (first match wins):
1. `openapi.yaml` (root, YAML)
2. `openapi.yml` (root, YML)
3. `api/openapi.yaml` (api/ directory, YAML)
4. `api/openapi.yml` (api/ directory, YML)

**Detection Logic**:
```bash
for p in "openapi.yaml" "openapi.yml" "api/openapi.yaml" "api/openapi.yml"; do
  if [[ -f "$p" ]]; then
    echo "path=$p" >> "$GITHUB_OUTPUT"
    exit 0
  fi
done
echo "path=" >> "$GITHUB_OUTPUT"  # No spec found
```

**Rationale**:
- Covers common OpenAPI file naming conventions
- Root-level specs take priority over subdirectory
- `.yaml` extension prioritized over `.yml` for consistency
- Gracefully handles "no spec" case

**Alternatives Considered**:
- Glob pattern `**/*.openapi.{yaml,yml}` - rejected (too permissive, could match multiple files)
- JSON specs (`openapi.json`) - deferred (YAML is more common for OpenAPI)

---

### RQ3: How should we integrate Spectral lint?
**Decision**: Use `npx -y @stoplight/spectral-cli` in CI (no package.json dependency)

**Integration**:
```yaml
- name: Lint OpenAPI with Spectral (non-blocking)
  if: steps.detect.outputs.path != ''
  continue-on-error: true
  run: npx -y @stoplight/spectral-cli lint "${{ steps.detect.outputs.path }}" --quiet --format json > spectral.json
```

**Flags**:
- `npx -y`: Auto-approve package installation (no interactive prompt)
- `--quiet`: Suppress non-error output for cleaner logs
- `--format json`: Machine-readable output for parsing

**Rationale**:
- No new `package.json` dependencies (keeps LOC budget low)
- `npx` fetches Spectral on-demand (auto-cached by GitHub Actions)
- JSON output enables structured summary generation
- `continue-on-error: true` makes lint non-blocking

**Spectral Version**: Uses latest version fetched by `npx` (pinning deferred to future iteration if needed)

---

### RQ4: How should we format the CI summary?
**Decision**: RFC9457-style Problem Details with JSON excerpt

**Format**:
```markdown
## Delta 0015 — OpenAPI Lint

Found **23** issue(s).

### Problem Details (excerpt)
```json
[
  {"code":"oas3-api-servers","message":"OpenAPI `servers` must be present and non-empty array.","path":[],"severity":1,"range":{"start":{"line":1,"character":0},"end":{"line":1,"character":10}},"source":"/openapi.yaml"},
  ...
]
```

_Note:_ Non-blocking for now. Make blocking later by removing `continue-on-error: true`.
```

**Rationale**:
- RFC9457 (Problem Details for HTTP APIs) is a standard format for error reporting
- JSON excerpt shows first 25 issues (prevents overwhelming summary)
- Includes rule code, message, path, severity, line numbers
- Clear note that lint is non-blocking (sets expectations)

**Implementation**:
```bash
COUNT=$(jq 'length' spectral.json)
if [[ "$COUNT" -gt 0 ]]; then
  echo "Found **$COUNT** issue(s)." >> "$GITHUB_STEP_SUMMARY"
  jq -c '.[0:25]' spectral.json >> "$GITHUB_STEP_SUMMARY"
fi
```

---

### RQ5: What should the local helper script do?
**Decision**: Echo detected OpenAPI spec path or "skipping" message

**Script**:
```json
{
  "scripts": {
    "spec:path": "node -e \"const fs=require('fs');const c=['openapi.yaml','openapi.yml','api/openapi.yaml','api/openapi.yml'].find(p=>fs.existsSync(p));console.log(c?('OpenAPI spec: '+c):'No OpenAPI spec found; skipping')\""
  }
}
```

**Output Examples**:
- If `openapi.yaml` exists: `OpenAPI spec: openapi.yaml`
- If no spec exists: `No OpenAPI spec found; skipping`

**Rationale**:
- Developers can quickly check which spec will be linted
- Matches CI detection logic exactly (same 4 paths)
- Zero external dependencies (Node.js built-ins only)
- Single-line implementation (minimal LOC)

---

### RQ6: Should the lint be blocking or non-blocking initially?
**Decision**: Non-blocking initially (`continue-on-error: true`)

**Rationale**:
- Allows gradual adoption without breaking existing PR workflows
- Gives teams time to fix existing spec issues
- Can be made blocking later with one-line change:
  ```diff
  - continue-on-error: true  # Remove this line
  ```

**Future Toggle**:
- After spec stabilizes, remove `continue-on-error` to enforce linting
- No other changes needed (workflow, summary logic all remain the same)

---

### RQ7: What dependencies are required?
**Decision**: Zero new `package.json` dependencies

**Tools Used**:
- `npx -y @stoplight/spectral-cli` - fetched on-demand in CI
- `jq` - pre-installed in GitHub Actions ubuntu-latest
- `node` - pre-installed (Node 20 via `actions/setup-node@v4`)

**Rationale**:
- Minimizes LOC budget impact
- No risk of dependency conflicts
- GitHub Actions provides all needed tools
- `npx` auto-caches Spectral between runs

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **PR Template Sections** | 8 sections (Title/Summary/Risk/Rollback/Verification/LOC/Security/Notes) | Comprehensive without being overwhelming |
| **Spec Detection** | 4 paths in priority order (root → api/, .yaml → .yml) | Covers common conventions, first-match logic |
| **Spectral Integration** | `npx -y` (no package.json dep) | Zero LOC impact, on-demand fetching |
| **Summary Format** | RFC9457 Problem Details JSON excerpt | Standard format, machine-readable, limited to 25 items |
| **Local Helper** | `npm run spec:path` (Node one-liner) | Quick detection, matches CI logic |
| **Blocking Strategy** | Non-blocking initially (`continue-on-error: true`) | Gradual adoption, easy toggle later |
| **Dependencies** | None added | Minimal impact, uses CI built-ins |

---

## Open Questions

**None.** All research questions resolved. User provided explicit implementation details in `/plan` arguments.

---

## References

1. **GitHub PR Templates**: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
2. **Spectral CLI**: https://github.com/stoplightio/spectral
3. **RFC9457 Problem Details**: https://www.rfc-editor.org/rfc/rfc9457.html
4. **GitHub Actions Summary**: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary
5. **Existing PayPlan Deltas**: ops/deltas/0013_realignment.md, ops/deltas/0014_ci_lint_perf.md

---

**Status**: ✅ COMPLETE | **Next Phase**: Phase 1 (Design & Contracts)
