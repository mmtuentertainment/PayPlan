# Data Model: PR Hygiene + OpenAPI Lint Guard

**Feature**: 004-pr-hygiene-openapi-lint
**Date**: 2025-10-07
**Phase**: 1 (Design & Contracts)

---

## Overview

This feature has no runtime data models (docs/CI only). The "data" consists of static templates, CI outputs, and file paths.

---

## Entities

### 1. PR Template

**Purpose**: Structured markdown template for GitHub pull request descriptions

**Structure**:
```markdown
# Title
<PR Title>

## Summary
<What & why in 2–4 lines. Link relevant specs/deltas.>

## Risk
- [ ] None (docs/tooling only)
- [ ] Low
- [ ] Medium
- [ ] High

## Rollback
Single revert of this commit. No data migrations.

## Verification
```bash
<commands>
```

## LOC Budget
| Component | + | - |
|-----------|---|---|
| ...       |   |   |

## Security (if endpoints changed)
- [ ] Idempotency-Key on writes
- [ ] RFC9457 Problem Details
- [ ] RBAC + audit on denials
- [ ] 429 with Retry-After
- [ ] Tenant RLS via BFF
- [ ] OpenAPI is source of truth (updated)

## Notes
<Additional context>
```

**Sections** (8 total):
1. **Title**: PR title placeholder
2. **Summary**: What/why with links
3. **Risk**: 4-level checklist
4. **Rollback**: Revert instructions
5. **Verification**: Bash commands
6. **LOC Budget**: Change size table
7. **Security**: 6-item checklist (if API changes)
8. **Notes**: Reviewer context

**Storage**: `.github/PULL_REQUEST_TEMPLATE.md`
**Lifecycle**: Static file, loaded by GitHub on PR creation

---

### 2. OpenAPI Spec Detection

**Purpose**: Identify OpenAPI spec file location in repository

**Detection Logic**:
```
Priority order (first match wins):
1. openapi.yaml (root, YAML extension)
2. openapi.yml (root, YML extension)
3. api/openapi.yaml (api/ subdirectory, YAML)
4. api/openapi.yml (api/ subdirectory, YML)
```

**States**:
- **Found**: Path stored in `$GITHUB_OUTPUT` as `path=<file>`
- **Not Found**: Empty value stored as `path=`

**Attributes**:
- `path`: String (relative path from repo root) or empty
- `exists`: Boolean (true if file found at path)

**CI Implementation**:
```bash
for p in "openapi.yaml" "openapi.yml" "api/openapi.yaml" "api/openapi.yml"; do
  if [[ -f "$p" ]]; then
    echo "path=$p" >> "$GITHUB_OUTPUT"
    exit 0
  fi
done
echo "path=" >> "$GITHUB_OUTPUT"
```

---

### 3. Lint Results

**Purpose**: Spectral CLI output containing OpenAPI spec validation issues

**Format**: JSON array of issue objects

**Issue Object Schema**:
```typescript
interface LintIssue {
  code: string;           // Spectral rule ID (e.g., "oas3-api-servers")
  message: string;        // Human-readable description
  path: string[];         // JSONPath to problematic location
  severity: number;       // 0=error, 1=warn, 2=info, 3=hint
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  source: string;         // File path
}
```

**Example**:
```json
[
  {
    "code": "oas3-api-servers",
    "message": "OpenAPI `servers` must be present and non-empty array.",
    "path": [],
    "severity": 1,
    "range": {
      "start": { "line": 1, "character": 0 },
      "end": { "line": 1, "character": 10 }
    },
    "source": "/openapi.yaml"
  }
]
```

**Storage**: `spectral.json` (temporary file in CI workspace)
**Lifecycle**: Created during CI run, deleted after job completes

---

### 4. CI Job Summary

**Purpose**: GitHub Actions Summary displaying lint results in RFC9457-style format

**Format**: Markdown written to `$GITHUB_STEP_SUMMARY`

**Structure**:
```markdown
## Delta 0015 — OpenAPI Lint

[STATUS_MESSAGE]

[DETAILS_SECTION]

[NOTE_SECTION]
```

**Status Messages**:
- **No Spec**: `> Skipped (no OpenAPI spec found).`
- **No Issues**: `✅ No Spectral issues detected.`
- **Issues Found**: `Found **N** issue(s).`
- **Spec Malformed**: `ℹ️ Spectral did not run (no spec or earlier step skipped).`

**Details Section** (if issues found):
```markdown
### Problem Details (excerpt)
```json
[<first 25 issues>]
```
```

**Note Section** (if issues found):
```markdown
_Note:_ Non-blocking for now. Make blocking later by removing `continue-on-error: true`.
```

**Lifecycle**: Persists in GitHub Actions job summary UI

---

### 5. Helper Script Output

**Purpose**: Local command to show detected OpenAPI spec path

**Command**: `npm run spec:path`

**Output Format**:
- **Spec Found**: `OpenAPI spec: <path>`
- **Not Found**: `No OpenAPI spec found; skipping`

**Implementation**:
```javascript
const fs = require('fs');
const candidates = ['openapi.yaml', 'openapi.yml', 'api/openapi.yaml', 'api/openapi.yml'];
const found = candidates.find(p => fs.existsSync(p));
console.log(found ? `OpenAPI spec: ${found}` : 'No OpenAPI spec found; skipping');
```

**Exit Code**: Always 0 (non-failing)
**Use Case**: Quick local verification before pushing

---

### 6. Delta Document

**Purpose**: Documentation file tracking the change (Delta 0015)

**Structure**:
```markdown
# Delta 0015 — PR Template + OpenAPI Lint (non-blocking)

**Type**: Tooling-only (docs/CI)
**Runtime impact**: None
**Rollback**: single revert

## Changes
[List of files created/modified]

## Verification
[Commands to verify locally and in CI]

## Notes
[Non-blocking strategy, how to make blocking]
```

**Sections**:
1. **Header**: Delta number, title, type tags
2. **Changes**: What files were touched
3. **Verification**: How to test
4. **Notes**: Additional context

**Storage**: `ops/deltas/0015_pr_hygiene_openapi.md`
**Lifecycle**: Static file, permanent record

---

### 7. Workflow Metadata

**Purpose**: GitHub Actions workflow configuration

**Attributes**:
- `name`: "PR Hygiene (Delta 0015)"
- `trigger`: `pull_request` event
- `runner`: ubuntu-latest
- `permissions`: contents: read
- `steps`: 4 (checkout, setup, detect, lint, summarize)

**Step Outputs**:
- `detect.outputs.path`: String (spec path or empty)
- `spectral.outputs.failed`: Boolean (true if lint found issues)

**Conditionals**:
- Lint step: `if: steps.detect.outputs.path != ''`
- Summary step: `if: always()`

**Storage**: `.github/workflows/pr-hygiene.yml`
**Lifecycle**: Static file, executed on PR events

---

### 8. package.json Script Entry

**Purpose**: npm script for local spec detection

**Entry**:
```json
{
  "scripts": {
    "spec:path": "node -e \"const fs=require('fs');const c=['openapi.yaml','openapi.yml','api/openapi.yaml','api/openapi.yml'].find(p=>fs.existsSync(p));console.log(c?('OpenAPI spec: '+c):'No OpenAPI spec found; skipping')\""
  }
}
```

**Attributes**:
- `name`: "spec:path"
- `command`: Node.js one-liner
- `dependencies`: None (fs is built-in)

**Storage**: `package.json` (root)
**Lifecycle**: Permanent addition

---

## Entity Relationships

```
PR Template
  ↓ (referenced in Verification section)
Helper Script Output
  ↓ (shows detected)
OpenAPI Spec Detection
  ↓ (if found, triggers)
Lint Results
  ↓ (parsed by)
CI Job Summary
  ↓ (documents)
Delta Document
  ↓ (configured by)
Workflow Metadata
```

**Flow**:
1. Developer opens PR → **PR Template** loads
2. CI runs **Workflow Metadata** on `pull_request` event
3. Workflow executes **OpenAPI Spec Detection** (4 paths)
4. If spec found, runs Spectral → generates **Lint Results**
5. Workflow parses results → writes **CI Job Summary**
6. **Delta Document** explains feature
7. Developer runs **Helper Script** locally → sees **Helper Script Output**

---

## Data Invariants

1. **Spec Detection** is deterministic (same paths → same result)
2. **Lint Results** count matches reported count in Summary
3. **CI Job Summary** always displays (even if "Skipped")
4. **Helper Script** matches CI detection logic exactly
5. **PR Template** has all 8 sections (none omitted)
6. **Delta Document** includes verification commands
7. **Workflow** is non-blocking (`continue-on-error: true`)

---

## Validation Rules

| Entity | Rule | Enforcement |
|--------|------|-------------|
| PR Template | Must have 8 sections | Manual (template review) |
| Spec Detection | Check exactly 4 paths in order | CI script logic |
| Lint Results | Valid JSON array | Spectral CLI output format |
| CI Summary | Always write to `$GITHUB_STEP_SUMMARY` | Workflow `if: always()` |
| Helper Script | Exit code 0 (never fail) | Script implementation |
| Delta Doc | Includes verification section | Template structure |
| Workflow | Has `continue-on-error: true` | YAML syntax |

---

**Status**: ✅ COMPLETE | **Next**: Contracts (Phase 1)
