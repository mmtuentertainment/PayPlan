# Contract: Spec Path Audit Script

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Define CLI interface and output format for spec path audit script

---

## Script Interface

### Invocation

**File**: `scripts/audit-spec-paths.mjs`
**Shebang**: `#!/usr/bin/env node`
**Execution**:
```bash
# Direct
node scripts/audit-spec-paths.mjs

# Via npm script
npm run audit:specs
```

### Arguments

**None required** - Script uses hardcoded configuration:
- Glob pattern: `specs/**/*.md`
- Ignore: `node_modules/**`

### Environment

- **Node.js**: 20.x or higher (uses built-in `glob`)
- **Working Directory**: Repository root
- **Dependencies**: None (uses Node.js built-ins: `fs`, `path`, `glob`)

---

## Output Format

### Success Case

**Stdout**:
```
✅ Spec Path Audit Passed — All references valid
```

**Exit Code**: `0`

### Failure Case

**Stderr**:
```
❌ Spec Path Audit Failed

specs/inbox-paste/tasks.md:42: ❌ frontend/src/lib/provider-detectors.ts — Use: extraction/providers/detector.ts (Delta 0013)
specs/inbox-paste/plan.md:18: ⚠️  tests/unit/cache.test.ts — Missing frontend/ prefix. Use: frontend/tests/unit/ (Delta 0013)
specs/001-inbox-paste-phase/data-model.md:67: ❌ frontend/src/lib/redact.ts — Use: extraction/helpers/redaction.ts (Delta 0013)

Found 3 invalid path references.
See ops/deltas/0013_realignment.md for correct paths.
```

**Exit Code**: `1`

### Error Format (Each Line)

**Pattern**: `{file}:{line}: {icon} {path} — {message}`

**Components**:
- `{file}`: Relative path from repo root (e.g., `specs/inbox-paste/tasks.md`)
- `{line}`: Line number (1-indexed)
- `{icon}`: `❌` for legacy paths, `⚠️` for format issues
- `{path}`: Extracted file path that failed validation
- `{message}`: Actionable guidance (e.g., "Use: extraction/providers/detector.ts (Delta 0013)")

**Clickable Format**: Compatible with VSCode/IDE file:line navigation

---

## Path Validation Rules

### Allowed Patterns (Pass Validation)

```javascript
const ALLOWED_PATTERNS = [
  /frontend\/src\/lib\/extraction\/(providers|extractors|helpers)\//,  // Modular extraction
  /frontend\/tests\/(unit|integration|performance|fixtures)\//,       // Test suites
  /\.github\/workflows\//,                                             // CI configs
  /package\.json$/,                                                    // Dependency refs
  /ops\/deltas\//,                                                     // Delta docs
];
```

**Examples**:
- ✅ `frontend/src/lib/extraction/providers/detector.ts`
- ✅ `frontend/src/lib/extraction/extractors/date.ts`
- ✅ `frontend/tests/unit/cache.test.ts`
- ✅ `.github/workflows/ci.yml`

### Legacy Patterns (Fail Validation)

```javascript
const LEGACY_PATTERNS = [
  {
    pattern: /frontend\/src\/lib\/provider-detectors\.ts/,
    message: 'Use: extraction/providers/detector.ts (Delta 0013)'
  },
  {
    pattern: /frontend\/src\/lib\/date-parser\.ts/,
    message: 'Use: extraction/extractors/date.ts (Delta 0013)'
  },
  {
    pattern: /frontend\/src\/lib\/redact\.ts/,
    message: 'Use: extraction/helpers/redaction.ts (Delta 0013)'
  },
  {
    pattern: /^tests\//,
    message: 'Missing frontend/ prefix. Use: frontend/tests/ (Delta 0013)'
  },
];
```

**Examples**:
- ❌ `frontend/src/lib/provider-detectors.ts`
- ❌ `frontend/src/lib/date-parser.ts`
- ❌ `tests/unit/cache.test.ts` (should be `frontend/tests/unit/cache.test.ts`)

### Path Extraction Logic

**Regex**: `(?:\`|^|\s)([a-zA-Z0-9_\-\.\/]+\.(ts|tsx|js|jsx|mjs|md|json|yml|yaml))(?:\`|$|\s|\))`

**Matches**:
- Inline code: `` `frontend/src/lib/extraction/date.ts` ``
- Prose: `See frontend/tests/unit/cache.test.ts for examples`
- Markdown links: `[Date Parser](frontend/src/lib/extraction/extractors/date.ts)`

**Ignores**:
- Code blocks (`` ``` ``) - Not validated (examples allowed)
- External URLs (http://, https://)
- Non-file paths (no extension)

---

## Testing Contract

### Test Case 1: Valid Paths

**Input**: Markdown file with:
```markdown
See `frontend/src/lib/extraction/providers/detector.ts` for implementation.
Tests in `frontend/tests/unit/provider-detector.test.ts`.
```

**Expected Output**:
```
✅ Spec Path Audit Passed — All references valid
```

**Exit Code**: 0

### Test Case 2: Legacy Path

**Input**: Markdown file (line 42):
```markdown
Create `frontend/src/lib/provider-detectors.ts` with detection logic.
```

**Expected Output**:
```
❌ Spec Path Audit Failed

test-spec.md:42: ❌ frontend/src/lib/provider-detectors.ts — Use: extraction/providers/detector.ts (Delta 0013)

Found 1 invalid path references.
```

**Exit Code**: 1

### Test Case 3: Missing frontend/ Prefix

**Input**: Markdown file (line 18):
```markdown
Run tests with `npm test tests/unit/cache.test.ts`
```

**Expected Output**:
```
❌ Spec Path Audit Failed

test-spec.md:18: ⚠️  tests/unit/cache.test.ts — Missing frontend/ prefix. Use: frontend/tests/unit/ (Delta 0013)

Found 1 invalid path references.
```

**Exit Code**: 1

### Test Case 4: Code Block (Ignored)

**Input**: Markdown file with:
````markdown
Example import:
```typescript
import { detectProvider } from 'frontend/src/lib/provider-detectors';
```
````

**Expected Output**:
```
✅ Spec Path Audit Passed — All references valid
```

**Exit Code**: 0
**Rationale**: Code blocks are examples, not active references

---

## CI Integration

### Workflow Step

```yaml
- name: Spec Path Audit
  run: |
    node scripts/audit-spec-paths.mjs
  # Fails CI build if exit code != 0
```

### Alternative (npm script)

```json
{
  "scripts": {
    "audit:specs": "node scripts/audit-spec-paths.mjs"
  }
}
```

```yaml
- name: Spec Path Audit
  run: npm run audit:specs
```

---

## Performance Characteristics

**Expected Performance**:
- ~30 spec files @ ~500 lines each
- Regex scanning: O(n) where n = total lines
- **Estimated Runtime**: <500ms

**Memory**: <50MB (streaming file reads)

---

## Error Handling

### File System Errors

**Scenario**: Spec file deleted during scan

**Behavior**:
```javascript
try {
  const content = fs.readFileSync(file, 'utf8');
} catch (err) {
  console.error(`⚠️  Could not read ${file}: ${err.message}`);
  continue;  // Skip file, continue scan
}
```

**Exit Code**: 0 (unless other errors found)

### Invalid Regex

**Scenario**: Pattern compilation fails

**Behavior**:
```javascript
try {
  const matches = pathRegex.exec(line);
} catch (err) {
  console.error(`❌ Regex error in ${file}:${lineNum}: ${err.message}`);
  process.exit(1);
}
```

**Exit Code**: 1 (fatal error)

---

## Rollback Plan

### Temporary Disable

Comment out CI workflow step:

```yaml
# - name: Spec Path Audit
#   run: node scripts/audit-spec-paths.mjs
```

### Adjust Patterns (False Positives)

Add exception to `ALLOWED_PATTERNS`:

```javascript
const ALLOWED_PATTERNS = [
  // ... existing patterns
  /docs\/legacy\//,  // Temporary: Allow legacy docs during migration
];
```

### Permanent Revert

```bash
git revert <commit-sha>  # Removes script and CI integration
```

---

## Maintenance

### Adding New Allowed Pattern

1. Add regex to `ALLOWED_PATTERNS` array
2. Document rationale in code comment
3. Test with fixture markdown
4. Update this contract

### Adding New Legacy Pattern

1. Add to `LEGACY_PATTERNS` array with clear message
2. Reference Delta 0013 or relevant migration doc
3. Test with fixture markdown
4. Update this contract

### Updating Error Messages

1. Modify `message` field in pattern object
2. Ensure Delta 0013 reference remains
3. Verify CI output formatting
4. Update contract examples

---

## Future Enhancements

### Potential Additions (Post-MVP)

1. **Configuration File**: `specs/audit-config.json` for patterns (avoid hardcoding)
2. **Auto-fix Mode**: `--fix` flag to update paths automatically
3. **Incremental Scan**: `--changed` to scan only modified specs (faster CI)
4. **Report Formats**: `--format=json` for machine parsing

---

**Contract Status**: ✅ Complete - Ready for implementation
