# Migration: Archive BNPL Code

**Date**: 2025-10-30
**Feature**: 063-short-name-archive
**Branch**: `063-short-name-archive`
**Phase**: Phase 2 of 3-phase product pivot

---

## Summary

This migration relocates all BNPL-specific code from `frontend/src/` to `frontend/src/archive/bnpl/` to reflect PayPlan's evolution from BNPL-focused to budget-first app. This is a **structural refactor only** - all BNPL features remain fully functional and accessible at `/bnpl` route.

**Key Principle**: Zero user-facing changes. This is purely an internal code organization improvement.

---

## What Changed

### Code Files Moved (14 files)

| Original Path | Archived Path | Description |
|--------------|---------------|-------------|
| `frontend/src/pages/BNPLParser.tsx` | `frontend/src/archive/bnpl/pages/BNPLParser.tsx` | Main BNPL parser page |
| `frontend/src/components/bnpl/BNPLEmailInput.tsx` | `frontend/src/archive/bnpl/components/bnpl/BNPLEmailInput.tsx` | Email input component |
| `frontend/src/components/bnpl/PaymentSchedulePreview.tsx` | `frontend/src/archive/bnpl/components/bnpl/PaymentSchedulePreview.tsx` | Schedule preview component |
| `frontend/src/components/bnpl/ProviderBadge.tsx` | `frontend/src/archive/bnpl/components/bnpl/ProviderBadge.tsx` | Provider badge component |
| `frontend/src/lib/bnpl-parser.ts` | `frontend/src/archive/bnpl/lib/bnpl-parser.ts` | Core parsing logic |
| `frontend/src/lib/parsers/affirm.ts` | `frontend/src/archive/bnpl/lib/parsers/affirm.ts` | Affirm provider parser |
| `frontend/src/lib/parsers/afterpay.ts` | `frontend/src/archive/bnpl/lib/parsers/afterpay.ts` | Afterpay provider parser |
| `frontend/src/lib/parsers/klarna.ts` | `frontend/src/archive/bnpl/lib/parsers/klarna.ts` | Klarna provider parser |
| `frontend/src/lib/parsers/paypal-credit.ts` | `frontend/src/archive/bnpl/lib/parsers/paypal-credit.ts` | PayPal Credit parser |
| `frontend/src/lib/parsers/sezzle.ts` | `frontend/src/archive/bnpl/lib/parsers/sezzle.ts` | Sezzle provider parser |
| `frontend/src/lib/parsers/zip.ts` | `frontend/src/archive/bnpl/lib/parsers/zip.ts` | Zip provider parser |
| `frontend/src/lib/parsers/index.ts` | `frontend/src/archive/bnpl/lib/parsers/index.ts` | Parser registry |
| `frontend/src/lib/storage/bnpl-storage.ts` | `frontend/src/archive/bnpl/lib/storage/bnpl-storage.ts` | BNPL localStorage utilities |
| `frontend/src/types/bnpl.ts` | `frontend/src/archive/bnpl/types/bnpl.ts` | BNPL TypeScript types |

### Specification Files Moved

- `specs/020-short-name-bnpl/` → `specs/archived/020-short-name-bnpl/`
- `manual-tests/020-bnpl-parser-test-results.md` → `manual-tests/archived/020-bnpl-parser-test-results.md`

### Documentation Files Created

- `frontend/src/archive/bnpl/README.md` - Archive directory documentation
- `specs/archived/README.md` - Archived specs index
- `manual-tests/archived/README.md` - Archived test results index
- `docs/migrations/archive-bnpl-code.md` - This file (migration guide)

### Import Path Changes

**Example transformations**:

```typescript
// BEFORE archival
import BNPLParser from './pages/BNPLParser';
import { parseBNPLEmail } from './lib/bnpl-parser';
import type { BNPLProvider } from './types/bnpl';

// AFTER archival
import BNPLParser from './archive/bnpl/pages/BNPLParser';
import { parseBNPLEmail } from './archive/bnpl/lib/bnpl-parser';
import type { BNPLProvider } from './archive/bnpl/types/bnpl';
```

**Key files updated**:
- `frontend/src/App.tsx` - Updated BNPL route import
- Internal BNPL components - Updated to use active UI components from `../../../../components/ui/`

---

## Why

### Business Context
PayPlan pivoted from BNPL-focused to budget-first app (October 2025) due to:
1. **Market reality**: Direct BNPL API integration impossible (providers don't offer public APIs)
2. **User research**: Users need full budgeting tools, not just BNPL tracking
3. **Competitive positioning**: Budget apps have larger TAM (30M+ users vs BNPL's niche market)

### Strategic Direction
- **Was**: BNPL debt management app (BNPL tracking as primary feature)
- **Now**: Budgeting app with BNPL tracking (budgeting as primary feature, BNPL as differentiator)

### Code Organization Rationale
Archiving BNPL code signals product direction while:
- ✅ Preserving 100% functionality (users can still access `/bnpl`)
- ✅ Improving developer clarity (active vs archived code clearly separated)
- ✅ Maintaining git history (all moves done with `git mv`)
- ✅ Enabling future decisions (easy to promote back if strategy changes)

---

## Impact

### User-Facing
**ZERO** impact. All routes work identically:
- `/bnpl` - BNPL parser (fully functional)
- `/demo` - Demo page (uses separate email-extractor.ts, unaffected)
- `/import` - Import page (uses separate email-extractor.ts, unaffected)

### Developer-Facing
**Improved** code organization:
- Clear separation between active (budget) and archived (BNPL) features
- Directory structure reflects product strategy
- New developers can quickly identify focus areas

### Technical
- **TypeScript**: 0 errors (all import paths updated)
- **Git history**: Preserved (100% rename detection on all 14 files)
- **localStorage**: No changes (BNPL data schema unchanged)
- **Bundle size**: Unchanged (code not removed, only relocated)

---

## Rollback Procedure

If issues are discovered or business strategy changes, follow these steps to revert the archival:

### Quick Rollback (Revert All Commits)

```bash
# Navigate to project root
cd /home/matt/PROJECTS/PayPlan

# Find the first archival commit
git log --oneline | grep "create archive directory structure"
# Note commit SHA (e.g., abc123)

# Option 1: Revert commits (preserves history)
git revert abc123..HEAD

# Option 2: Hard reset (DESTRUCTIVE, use with caution)
git reset --hard origin/main
```

### Detailed Rollback (Manual)

**Step 1: Move files back**

```bash
# Move pages
git mv frontend/src/archive/bnpl/pages/BNPLParser.tsx frontend/src/pages/

# Move components
git mv frontend/src/archive/bnpl/components/bnpl/*.tsx frontend/src/components/bnpl/

# Move core logic
git mv frontend/src/archive/bnpl/lib/bnpl-parser.ts frontend/src/lib/

# Move parsers
git mv frontend/src/archive/bnpl/lib/parsers/* frontend/src/lib/parsers/

# Move storage
git mv frontend/src/archive/bnpl/lib/storage/bnpl-storage.ts frontend/src/lib/storage/

# Move types
git mv frontend/src/archive/bnpl/types/bnpl.ts frontend/src/types/

# Remove empty archive directory
git rm -r frontend/src/archive/bnpl
```

**Step 2: Restore import paths**

Update `frontend/src/App.tsx`:

```typescript
// Change FROM:
const BNPLParser = lazy(() => import('./archive/bnpl/pages/BNPLParser').then(m => ({ default: m.BNPLParser })));

// Change TO:
const BNPLParser = lazy(() => import('./pages/BNPLParser').then(m => ({ default: m.BNPLParser })));
```

Update BNPL component UI imports:

```typescript
// In BNPLEmailInput.tsx and PaymentSchedulePreview.tsx
// Change FROM:
import { Button } from '../../../../components/ui/button';

// Change TO:
import { Button } from '../ui/button';
```

**Step 3: Move specs and tests back**

```bash
git mv specs/archived/020-short-name-bnpl specs/
git mv manual-tests/archived/020-bnpl-parser-test-results.md manual-tests/
```

**Step 4: Remove documentation**

```bash
git rm frontend/src/archive/bnpl/README.md
git rm specs/archived/README.md
git rm manual-tests/archived/README.md
git rm docs/migrations/archive-bnpl-code.md
```

**Step 5: Commit and validate**

```bash
git add -A
git commit -m "revert(archive): restore BNPL code to active codebase"

# Validate TypeScript compilation
cd frontend && npm run build

# Validate routes
npm run dev
# Test /bnpl, /demo, /import routes
```

---

## Validation Checklist

After migration (or rollback), verify:

### TypeScript Compilation
```bash
cd frontend && npm run build
# Expected: Exit code 0 (no errors)
```

### Route Functionality
- [ ] Navigate to `/bnpl` → Parser loads and parses emails
- [ ] Navigate to `/demo` → Demo loads (uses email-extractor.ts)
- [ ] Navigate to `/import` → Import loads (uses email-extractor.ts)
- [ ] No console errors (check browser DevTools)

### Git History Preservation
```bash
# Verify git tracks file moves
git log --follow frontend/src/archive/bnpl/pages/BNPLParser.tsx

# Expected: Full commit history (including pre-archival commits)

# Verify git blame works
git blame frontend/src/archive/bnpl/lib/bnpl-parser.ts

# Expected: Author names and dates from original file
```

### localStorage Compatibility
```javascript
// In browser console
Object.keys(localStorage).filter(key => key.includes('bnpl'))

// Expected: ['bnpl_schedules', 'bnpl_settings', 'bnpl_last_sync']
// (or empty array if no BNPL data stored)
```

### Accessibility
- [ ] Screen reader announces BNPL parser correctly (NVDA/VoiceOver)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators visible

---

## Technical Notes

### Git Rename Detection

Git does NOT store rename operations in commits. Instead, `git log --follow` uses content similarity heuristics to detect renames. This is why we:
1. Used `git mv` (convenience command, auto-stages)
2. Committed moves separately WITHOUT modifying content
3. Updated imports in separate commits

This gives Git's rename detection algorithm clean data to work with, ensuring `--follow` shows full history.

### UI Component Dependencies

Archived BNPL components depend on active UI components from `frontend/src/components/ui/`:
- `Button.tsx`
- `Input.tsx`
- `Textarea.tsx`

These are NOT archived because they're shared across both active and archived code. This is intentional and correct - archived code can depend on active infrastructure.

### Email Extraction Systems

PayPlan has TWO email extraction systems:
1. **bnpl-parser.ts** (OLD format, archived) - Used by `/bnpl` route
2. **email-extractor.ts** (NEW format, active) - Used by `/demo` and `/import` routes

These are independent. The archival only affected bnpl-parser.ts.

---

## References

- **Feature Specification**: [specs/063-short-name-archive/spec.md](../../specs/063-short-name-archive/spec.md)
- **Implementation Plan**: [specs/063-short-name-archive/plan.md](../../specs/063-short-name-archive/plan.md)
- **Task Breakdown**: [specs/063-short-name-archive/tasks.md](../../specs/063-short-name-archive/tasks.md)
- **Archive README**: [frontend/src/archive/bnpl/README.md](../../frontend/src/archive/bnpl/README.md)
- **Original BNPL Spec**: [specs/archived/020-short-name-bnpl/spec.md](../../specs/archived/020-short-name-bnpl/spec.md)

---

**Migration completed**: 2025-10-30
**Status**: Active (BNPL features remain accessible at `/bnpl`)
