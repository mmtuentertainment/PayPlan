# QuickStart: PR Hygiene + OpenAPI Lint Guard

**Feature**: 004-pr-hygiene-openapi-lint
**Last Updated**: 2025-10-07

---

## Overview

This feature adds a PR template and non-blocking OpenAPI lint to improve PR quality with zero runtime impact.

**What You Get**:
- ✅ Structured PR descriptions (8 sections including security checklist)
- ✅ Automatic OpenAPI spec linting in CI (Spectral)
- ✅ RFC9457-style Problem Details in GitHub Actions Summary
- ✅ Local helper script to check which spec will be linted

---

## Quick Start (5 minutes)

### 1. Check for OpenAPI Spec (Local)

```bash
npm run spec:path
```

**Expected Output**:
- If spec exists: `OpenAPI spec: openapi.yaml`
- If no spec: `No OpenAPI spec found; skipping`

### 2. Create a Pull Request

1. Push your branch to GitHub
2. Click "New Pull Request"
3. **Template auto-loads** with 8 sections
4. Fill out the sections (replace placeholders)
5. Submit PR

### 3. Check CI Job Summary

1. Wait for CI to run
2. Go to Actions → PR Hygiene (Delta 0015) job
3. Click on job → View Summary

**Possible Outcomes**:
- No spec: `> Skipped (no OpenAPI spec found).`
- Spec valid: `✅ No Spectral issues detected.`
- Spec invalid: `Found **N** issue(s).` + JSON excerpt

---

## PR Template Sections

### Required Sections

1. **Title**: Concise PR title
2. **Summary**: What & why (2-4 lines) + links to specs/deltas
3. **Risk**: Check one (None/Low/Medium/High)
4. **Rollback**: How to revert (default: "single revert")
5. **Verification**: Bash commands to test locally
6. **LOC Budget**: Table with files changed + total LOC
7. **Security**: 6-item checklist (if endpoints changed)
8. **Notes**: Additional reviewer context

### Security Checklist (if endpoints changed)

- [ ] Idempotency-Key on writes
- [ ] RFC9457 Problem Details
- [ ] RBAC + audit on denials
- [ ] 429 with Retry-After
- [ ] Tenant RLS via BFF
- [ ] OpenAPI is source of truth (updated)

---

## OpenAPI Lint Behavior

### Spec Detection (4 Paths Checked)

CI checks these paths in order (first match wins):
1. `openapi.yaml` (root)
2. `openapi.yml` (root)
3. `api/openapi.yaml`
4. `api/openapi.yml`

### Lint Rules (Spectral Default)

Spectral validates against OpenAPI 3.x spec:
- Required fields (paths, info, servers)
- Schema compliance
- Best practices (operation IDs, descriptions, etc.)
- Custom rules (if `.spectral.yaml` config exists)

### Non-Blocking Strategy

**Current**: Lint failures don't block PRs (`continue-on-error: true`)
**Future**: Remove `continue-on-error` to make blocking

---

## Making Lint Blocking

**When to do this**: After fixing existing spec issues

**How**:
1. Edit `.github/workflows/pr-hygiene.yml`
2. Find the "Lint OpenAPI with Spectral" step
3. Remove line: `continue-on-error: true`
4. Commit and push

**Before**:
```yaml
- name: Lint OpenAPI with Spectral (non-blocking)
  continue-on-error: true  # <-- Remove this line
  run: npx -y @stoplight/spectral-cli lint ...
```

**After**:
```yaml
- name: Lint OpenAPI with Spectral
  run: npx -y @stoplight/spectral-cli lint ...
```

---

## Troubleshooting

### "No spec found" but I have `openapi.yaml`

**Check**:
1. File is at repo root (not in subdirectory)
2. Filename is exactly `openapi.yaml` (case-sensitive)
3. File is committed (not just in working directory)

### Lint shows issues I don't understand

**Spectral Rule Docs**: https://meta.stoplight.io/docs/spectral/ZG9jOjYyMDc0Mw-open-api-rules

**Common Issues**:
- `oas3-api-servers`: Missing or empty `servers` array
- `operation-description`: Missing operation descriptions
- `info-contact`: Missing contact info in `info` section

**Suppressing Rules**: Create `.spectral.yaml` with `except` clause

### CI job doesn't run

**Check**:
1. Workflow file exists at `.github/workflows/pr-hygiene.yml`
2. PR is targeting a branch (workflow triggers on `pull_request`)
3. GitHub Actions are enabled for the repository

---

## Examples

### Example PR Description (Filled Out)

```markdown
# Add user authentication endpoint

## Summary
Implements JWT-based authentication for `/api/auth/login` endpoint. Returns access token + refresh token. See: [specs/auth/spec.md](../specs/auth/spec.md)

## Risk
- [x] Low

## Rollback
Single revert of this commit. No data migrations.

## Verification
```bash
npm run spec:path  # Should show: OpenAPI spec: openapi.yaml
curl -X POST localhost:3000/api/auth/login -d '{"email":"test@example.com","password":"pass"}' | jq
```

## LOC Budget
| Component | + | - |
|-----------|---|---|
| API routes | 45 | 0 |
| Tests | 120 | 0 |
| OpenAPI spec | 30 | 0 |
| Total LOC | 195 | 0 |

## Security (if endpoints changed)
- [x] Idempotency-Key on writes
- [x] RFC9457 Problem Details
- [x] RBAC + audit on denials
- [x] 429 with Retry-After
- [x] Tenant RLS via BFF
- [x] OpenAPI is source of truth (updated)

## Notes
New endpoint requires rate limiting (implemented with Redis). Tokens expire in 15min (access) / 7 days (refresh).
```

### Example CI Summary (Issues Found)

```markdown
## Delta 0015 — OpenAPI Lint
Found **3** issue(s).

### Problem Details (excerpt)
```json
[
  {
    "code": "oas3-api-servers",
    "message": "OpenAPI `servers` must be present and non-empty array.",
    "path": [],
    "severity": 1
  },
  {
    "code": "operation-description",
    "message": "Operation should have a description.",
    "path": ["paths", "/api/auth/login", "post"],
    "severity": 1
  },
  {
    "code": "info-contact",
    "message": "Info object must have a contact object.",
    "path": ["info"],
    "severity": 1
  }
]
```

_Note:_ Non-blocking for now. Make blocking later by removing `continue-on-error: true`.
```

---

## Additional Resources

- **Spectral Docs**: https://github.com/stoplightio/spectral
- **OpenAPI 3.x Spec**: https://spec.openapis.org/oas/v3.1.0
- **RFC9457 Problem Details**: https://www.rfc-editor.org/rfc/rfc9457.html
- **GitHub PR Templates**: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests

---

**Status**: ✅ Ready for use | **Next**: Implementation (T001-T006)
