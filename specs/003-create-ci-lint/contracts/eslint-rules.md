# Contract: ESLint Path Restriction Rules

**Feature**: 003-create-ci-lint
**Date**: 2025-10-07
**Purpose**: Define ESLint rule configuration contract for legacy path blocking

---

## Rule Configuration Schema

### no-restricted-imports Rule

**Rule Name**: `no-restricted-imports`
**Severity**: `error` (build-blocking)
**Documentation**: https://eslint.org/docs/latest/rules/no-restricted-imports

### Configuration Structure

```typescript
interface RestrictedImportsConfig {
  paths: LegacyPath[];
  patterns: LegacyPattern[];
}

interface LegacyPath {
  name: string;           // Exact module name to block
  message: string;        // Error message with guidance
}

interface LegacyPattern {
  group: string[];        // Glob patterns to block
  message: string;        // Error message with guidance
}
```

---

## Legacy Paths (Exact Matches)

### Path 1: provider-detectors.ts

```json
{
  "name": "frontend/src/lib/provider-detectors",
  "message": "❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see ops/deltas/0013_realignment.md)"
}
```

**Blocks**:
- `import { detectProvider } from 'frontend/src/lib/provider-detectors';`
- `import * as detectors from 'frontend/src/lib/provider-detectors';`

**Allows**:
- `import { detectProvider } from 'frontend/src/lib/extraction/providers/detector';`

### Path 2: date-parser.ts

```json
{
  "name": "frontend/src/lib/date-parser",
  "message": "❌ Legacy path. Use: frontend/src/lib/extraction/extractors/date (see ops/deltas/0013_realignment.md)"
}
```

**Blocks**:
- `import { parseDate } from 'frontend/src/lib/date-parser';`
- `const { parseDate } = await import('frontend/src/lib/date-parser');`

**Allows**:
- `import { parseDate } from 'frontend/src/lib/extraction/extractors/date';`

### Path 3: redact.ts

```json
{
  "name": "frontend/src/lib/redact",
  "message": "❌ Legacy path. Use: frontend/src/lib/extraction/helpers/redaction (see ops/deltas/0013_realignment.md)"
}
```

**Blocks**:
- `import { redactPII } from 'frontend/src/lib/redact';`
- `import redact from 'frontend/src/lib/redact';`

**Allows**:
- `import { redactPII } from 'frontend/src/lib/extraction/helpers/redaction';`

---

## Legacy Patterns (Glob Matches)

### Pattern 1: **/*provider-detectors*

```json
{
  "group": ["**/provider-detectors*"],
  "message": "❌ Legacy module. Use: frontend/src/lib/extraction/providers/detector (see Delta 0013)"
}
```

**Blocks**:
- `import x from '../lib/provider-detectors';`
- `import x from './provider-detectors.ts';`
- `import x from '@/lib/provider-detectors';`

### Pattern 2: **/*date-parser*

```json
{
  "group": ["**/date-parser*"],
  "message": "❌ Legacy module. Use: frontend/src/lib/extraction/extractors/date (see Delta 0013)"
}
```

**Blocks**:
- `import x from '../date-parser';`
- `import x from '@/lib/date-parser';`

### Pattern 3: **/lib/redact*

```json
{
  "group": ["**/lib/redact*"],
  "message": "❌ Legacy module. Use: frontend/src/lib/extraction/helpers/redaction (see Delta 0013)"
}
```

**Blocks**:
- `import x from '@/lib/redact';`
- `import x from '../../lib/redact';`

---

## Error Message Format

### Required Elements

1. **Visual Indicator**: ❌ emoji for immediate recognition
2. **Context**: "Legacy path" or "Legacy module"
3. **Correct Path**: "Use: {correct-path}"
4. **Reference**: "(see Delta 0013)" or link to ops/deltas/0013_realignment.md

### Example Error Output

```
error  'frontend/src/lib/provider-detectors' is restricted from being used. ❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see ops/deltas/0013_realignment.md)  no-restricted-imports

  src/components/EmailInput.tsx
  12:8  error  'frontend/src/lib/provider-detectors' is restricted from being used. ❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (see ops/deltas/0013_realignment.md)  no-restricted-imports

✖ 1 problem (1 error, 0 warnings)
```

---

## Allowed Imports (Exceptions)

### email-extractor.ts (Orchestrator)

**NOT blocked** - Still valid as orchestrator that imports from extraction/*

```javascript
// ✅ ALLOWED - email-extractor is valid orchestrator
import { extractFromEmail } from 'frontend/src/lib/email-extractor';
```

### Modular Extraction Paths

**All allowed** - Matches current architecture

```javascript
// ✅ ALLOWED - Modular extraction paths
import { detectProvider } from 'frontend/src/lib/extraction/providers/detector';
import { parseDate } from 'frontend/src/lib/extraction/extractors/date';
import { redactPII } from 'frontend/src/lib/extraction/helpers/redaction';
import { calculateConfidence } from 'frontend/src/lib/extraction/helpers/confidence-calculator';
```

---

## Testing Contract

### Test 1: Block Legacy Exact Paths

**Input**: File with `import { detectProvider } from 'frontend/src/lib/provider-detectors';`
**Expected**: ESLint error with message referencing extraction/providers/detector

### Test 2: Block Legacy Patterns

**Input**: File with `import x from '@/lib/date-parser';`
**Expected**: ESLint error with message referencing extraction/extractors/date

### Test 3: Allow Modular Paths

**Input**: File with `import { detectProvider } from 'frontend/src/lib/extraction/providers/detector';`
**Expected**: No ESLint errors

### Test 4: Allow Orchestrator

**Input**: File with `import { extractFromEmail } from 'frontend/src/lib/email-extractor';`
**Expected**: No ESLint errors

---

## Configuration File Location

**File**: `frontend/.eslintrc.cjs`

**Section**: `rules` object

**Example**:

```javascript
module.exports = {
  // ... existing config
  rules: {
    // ... existing rules
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'frontend/src/lib/provider-detectors', message: '❌ Legacy path. Use: frontend/src/lib/extraction/providers/detector (Delta 0013)' },
        { name: 'frontend/src/lib/date-parser', message: '❌ Legacy path. Use: frontend/src/lib/extraction/extractors/date (Delta 0013)' },
        { name: 'frontend/src/lib/redact', message: '❌ Legacy path. Use: frontend/src/lib/extraction/helpers/redaction (Delta 0013)' }
      ],
      patterns: [
        { group: ['**/provider-detectors*'], message: '❌ Legacy module. Use: extraction/providers/detector (Delta 0013)' },
        { group: ['**/date-parser*'], message: '❌ Legacy module. Use: extraction/extractors/date (Delta 0013)' },
        { group: ['**/lib/redact*'], message: '❌ Legacy module. Use: extraction/helpers/redaction (Delta 0013)' }
      ]
    }]
  }
};
```

---

## CI Integration

### Command

```bash
npm run lint  # or: npx eslint frontend/src --ext .ts,.tsx
```

### Exit Code

- **0**: No lint errors (all imports valid)
- **1**: Lint errors found (legacy imports detected)

### CI Workflow Step

```yaml
- name: ESLint Path Guard
  run: |
    cd frontend
    npm run lint
  # Fails CI build if exit code != 0
```

---

## Rollback Plan

### Temporary Disable

Comment out rule in `.eslintrc.cjs`:

```javascript
// 'no-restricted-imports': ['error', {
//   paths: [...],
//   patterns: [...]
// }]
```

### Permanent Revert

```bash
git revert <commit-sha>  # Reverts ESLint config changes
```

---

## Maintenance

### Adding New Legacy Path

1. Add to `paths` array (exact match) or `patterns` array (glob)
2. Include message with ❌, correct path, and Delta 0013 reference
3. Test with fixture import
4. Update this contract document

### Removing Legacy Path (After Migration Complete)

1. Remove from `paths` or `patterns` array
2. Verify no false positives in CI
3. Update contract document

---

**Contract Status**: ✅ Defined - Ready for implementation
