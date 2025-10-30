# Quickstart Guide: Archive BNPL Code

**Feature**: Archive BNPL Code (Feature 063)
**Branch**: `063-short-name-archive`
**Date**: 2025-10-30
**Estimated Time**: 2-4 hours

---

## Overview

This guide provides **step-by-step instructions** for archiving 60 BNPL-related files to `frontend/src/archive/bnpl/` while preserving 100% functionality and git history. Follow these instructions in order.

**Key Principles**:
- ✅ Use `git mv` for all file moves (convenience command, auto-stages changes)
- ✅ Commit moves separately WITHOUT modifying content (enables Git's rename detection)
- ✅ Commit after each logical group (easier rollback)
- ✅ Update imports systematically (TypeScript catches errors)
- ✅ Test manually at each checkpoint (zero user-facing changes)

**Note on Git History**: Git detects renames using content similarity heuristics when you use `git log --follow`. The key is committing moves separately from content changes so Git's algorithm can match files accurately.

---

## Prerequisites

**Before starting, verify**:

1. ✅ On correct branch: `git branch` shows `063-short-name-archive`
2. ✅ Clean working tree: `git status` shows no uncommitted changes
3. ✅ All dependencies installed: `cd frontend && npm install`
4. ✅ TypeScript compiles: `npm run build` exits with code 0

**If any prerequisite fails, STOP and resolve issues before proceeding.**

---

## Phase 1: Create Directory Structure

**Goal**: Create target archive directories

**Commands**:

```bash
# Create archive directory structure
mkdir -p frontend/src/archive/bnpl/pages
mkdir -p frontend/src/archive/bnpl/components/bnpl
mkdir -p frontend/src/archive/bnpl/lib/parsers
mkdir -p frontend/src/archive/bnpl/lib/storage
mkdir -p frontend/src/archive/bnpl/types

# Create documentation directories
mkdir -p specs/archived
mkdir -p manual-tests/archived
mkdir -p docs/migrations

# Verify directories created
ls -R frontend/src/archive/bnpl
```

**Expected Output**:
```
frontend/src/archive/bnpl:
components/ lib/ pages/ types/

frontend/src/archive/bnpl/components:
bnpl/

frontend/src/archive/bnpl/lib:
parsers/ storage/
```

**Checkpoint 1**:
```bash
# Commit directory structure
git add frontend/src/archive/bnpl
git add specs/archived
git add manual-tests/archived
git add docs/migrations
git commit -m "refactor(archive): create archive directory structure for BNPL code"
```

---

## Phase 2: Move BNPL Code Files

**Goal**: Relocate 14 BNPL code files using `git mv`

### Step 2.1: Move Pages (1 file)

```bash
# Move BNPL page component
git mv frontend/src/pages/BNPLParser.tsx frontend/src/archive/bnpl/pages/

# Verify move
ls frontend/src/archive/bnpl/pages/
# Expected: BNPLParser.tsx

# Commit
git commit -m "refactor(archive): move BNPL page to archive/bnpl/pages"
```

---

### Step 2.2: Move Components (3 files)

```bash
# Move BNPL components
git mv frontend/src/components/bnpl/BNPLEmailInput.tsx frontend/src/archive/bnpl/components/bnpl/
git mv frontend/src/components/bnpl/PaymentSchedulePreview.tsx frontend/src/archive/bnpl/components/bnpl/
git mv frontend/src/components/bnpl/ProviderBadge.tsx frontend/src/archive/bnpl/components/bnpl/

# Verify moves
ls frontend/src/archive/bnpl/components/bnpl/
# Expected: BNPLEmailInput.tsx PaymentSchedulePreview.tsx ProviderBadge.tsx

# Remove empty directory
rmdir frontend/src/components/bnpl

# Commit
git commit -m "refactor(archive): move BNPL components to archive/bnpl/components"
```

---

### Step 2.3: Move Core Logic (1 file)

```bash
# Move BNPL parser core logic
git mv frontend/src/lib/bnpl-parser.ts frontend/src/archive/bnpl/lib/

# Verify move
ls frontend/src/archive/bnpl/lib/
# Expected: bnpl-parser.ts parsers/ storage/

# Commit
git commit -m "refactor(archive): move BNPL parser core logic to archive/bnpl/lib"
```

---

### Step 2.4: Move Parsers (7 files)

```bash
# Move all provider-specific parsers
git mv frontend/src/lib/parsers/affirm.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/afterpay.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/klarna.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/paypal-credit.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/sezzle.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/zip.ts frontend/src/archive/bnpl/lib/parsers/
git mv frontend/src/lib/parsers/index.ts frontend/src/archive/bnpl/lib/parsers/

# Verify moves
ls frontend/src/archive/bnpl/lib/parsers/
# Expected: affirm.ts afterpay.ts klarna.ts paypal-credit.ts sezzle.ts zip.ts index.ts

# Remove empty directory
rmdir frontend/src/lib/parsers

# Commit
git commit -m "refactor(archive): move BNPL parsers to archive/bnpl/lib/parsers"
```

---

### Step 2.5: Move Storage (1 file)

```bash
# Move BNPL storage utilities
git mv frontend/src/lib/storage/bnpl-storage.ts frontend/src/archive/bnpl/lib/storage/

# Verify move
ls frontend/src/archive/bnpl/lib/storage/
# Expected: bnpl-storage.ts

# Commit
git commit -m "refactor(archive): move BNPL storage to archive/bnpl/lib/storage"
```

---

### Step 2.6: Move Types (1 file)

```bash
# Move BNPL TypeScript types
git mv frontend/src/types/bnpl.ts frontend/src/archive/bnpl/types/

# Verify move
ls frontend/src/archive/bnpl/types/
# Expected: bnpl.ts

# Commit
git commit -m "refactor(archive): move BNPL types to archive/bnpl/types"
```

---

**Checkpoint 2**:
```bash
# Verify all 14 files moved
find frontend/src/archive/bnpl -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l
# Expected: 14

# Verify original locations empty
ls frontend/src/lib/parsers 2>/dev/null
# Expected: No such file or directory

ls frontend/src/components/bnpl 2>/dev/null
# Expected: No such file or directory
```

---

## Phase 3: Update Import Paths

**Goal**: Systematically update all imports to include `archive/bnpl/` prefix

### Step 3.1: Find All Import Locations

```bash
# Find all files importing BNPL code
cd frontend/src

# Find imports of BNPL page
grep -rn "from.*pages/BNPLParser" . > /tmp/imports-bnpl-parser.txt

# Find imports of BNPL components
grep -rn "from.*components/bnpl" . > /tmp/imports-bnpl-components.txt

# Find imports of BNPL lib
grep -rn "from.*lib/bnpl-parser" . > /tmp/imports-bnpl-lib.txt

# Find imports of BNPL storage
grep -rn "from.*lib/storage/bnpl-storage" . > /tmp/imports-bnpl-storage.txt

# Find imports of BNPL types
grep -rn "from.*types/bnpl" . > /tmp/imports-bnpl-types.txt

# Find imports of parsers
grep -rn "from.*lib/parsers" . > /tmp/imports-parsers.txt

# Review results
cat /tmp/imports-*.txt
```

**Expected Import Locations**:
- `App.tsx` → imports `pages/BNPLParser`
- `archive/bnpl/pages/BNPLParser.tsx` → imports BNPL components
- `archive/bnpl/components/bnpl/*.tsx` → imports BNPL types
- `archive/bnpl/lib/bnpl-parser.ts` → imports parsers

---

### Step 3.2: Update App.tsx (Main Route)

**File**: `frontend/src/App.tsx`

**Change**:
```typescript
// BEFORE
import BNPLParser from './pages/BNPLParser';

// AFTER
import BNPLParser from './archive/bnpl/pages/BNPLParser';
```

**Commands**:
```bash
# Open App.tsx in editor
# Update import path manually
# Save file

# Verify change
grep "from.*BNPLParser" frontend/src/App.tsx
# Expected: import BNPLParser from './archive/bnpl/pages/BNPLParser';
```

---

### Step 3.3: Update BNPLParser.tsx (Page Component)

**File**: `frontend/src/archive/bnpl/pages/BNPLParser.tsx`

**Change**:
```typescript
// BEFORE
import { BNPLEmailInput } from '../../components/bnpl/BNPLEmailInput';
import { PaymentSchedulePreview } from '../../components/bnpl/PaymentSchedulePreview';
import { ProviderBadge } from '../../components/bnpl/ProviderBadge';
import { parseBNPLEmail } from '../../lib/bnpl-parser';
import type { BNPLProvider } from '../../types/bnpl';

// AFTER
import { BNPLEmailInput } from '../components/bnpl/BNPLEmailInput';
import { PaymentSchedulePreview } from '../components/bnpl/PaymentSchedulePreview';
import { ProviderBadge } from '../components/bnpl/ProviderBadge';
import { parseBNPLEmail } from '../lib/bnpl-parser';
import type { BNPLProvider } from '../types/bnpl';
```

**Note**: Paths become SHORTER (now all within archive/bnpl/)

---

### Step 3.4: Update BNPL Components

**Files**:
- `frontend/src/archive/bnpl/components/bnpl/BNPLEmailInput.tsx`
- `frontend/src/archive/bnpl/components/bnpl/PaymentSchedulePreview.tsx`
- `frontend/src/archive/bnpl/components/bnpl/ProviderBadge.tsx`

**Change Pattern**:
```typescript
// BEFORE
import type { BNPLProvider } from '../../../types/bnpl';

// AFTER
import type { BNPLProvider } from '../../types/bnpl';
```

**Note**: Adjust relative paths (typically go up 2 levels instead of 3)

---

### Step 3.5: Update bnpl-parser.ts (Core Logic)

**File**: `frontend/src/archive/bnpl/lib/bnpl-parser.ts`

**Change**:
```typescript
// BEFORE
import { parseAffirm } from './parsers/affirm';
import { parseAfterpay } from './parsers/afterpay';
import { parseKlarna } from './parsers/klarna';
import { parsePayPalCredit } from './parsers/paypal-credit';
import { parseSezzle } from './parsers/sezzle';
import { parseZip } from './parsers/zip';
import type { BNPLProvider, ParsedBNPLEmail } from '../types/bnpl';

// AFTER (paths unchanged - already relative within archive/bnpl/lib/)
import { parseAffirm } from './parsers/affirm';
import { parseAfterpay } from './parsers/afterpay';
import { parseKlarna } from './parsers/klarna';
import { parsePayPalCredit } from './parsers/paypal-credit';
import { parseSezzle } from './parsers/sezzle';
import { parseZip } from './parsers/zip';
import type { BNPLProvider, ParsedBNPLEmail } from '../types/bnpl';
```

**Note**: No changes needed (paths already relative)

---

### Step 3.6: Update Provider Parsers

**Files**: All files in `frontend/src/archive/bnpl/lib/parsers/`

**Change Pattern**:
```typescript
// BEFORE
import type { BNPLProvider, ParsedBNPLEmail } from '../../types/bnpl';

// AFTER (paths unchanged - already relative within archive/bnpl/lib/)
import type { BNPLProvider, ParsedBNPLEmail } from '../../types/bnpl';
```

**Note**: No changes needed (paths already relative)

---

**Checkpoint 3**:
```bash
# Commit all import path updates
git add -A
git commit -m "refactor(archive): update import paths for archived BNPL code"

# Verify TypeScript compilation succeeds
cd frontend && npm run build
# Expected: Exit code 0 (no errors)

# If errors occur, review error messages and fix import paths
```

---

## Phase 4: Move Specification Files

**Goal**: Archive BNPL specification documents

### Step 4.1: Move BNPL Spec Directory

```bash
# Move entire spec directory at once
git mv specs/020-bnpl-parser specs/archived/

# Verify move
ls specs/archived/020-bnpl-parser/
# Expected: spec.md plan.md [other spec files]

# Commit
git commit -m "docs(archive): move BNPL spec to specs/archived"
```

---

### Step 4.2: Move Manual Test Results

```bash
# Move BNPL test results
git mv manual-tests/020-bnpl-parser-test-results.md manual-tests/archived/

# Verify move
ls manual-tests/archived/
# Expected: 020-bnpl-parser-test-results.md

# Commit
git commit -m "docs(archive): move BNPL test results to manual-tests/archived"
```

---

**Checkpoint 4**:
```bash
# Verify spec and test files moved
ls specs/archived/020-bnpl-parser/spec.md
ls manual-tests/archived/020-bnpl-parser-test-results.md
# Expected: Both files exist
```

---

## Phase 5: Create Documentation

**Goal**: Create comprehensive documentation for archived code

### Step 5.1: Create Archive README

**File**: `frontend/src/archive/bnpl/README.md`

**Content**:
```markdown
# Archived: BNPL Code

## Status
**Maintained-but-not-actively-developed**

## Purpose
This directory contains BNPL payment parsing features (Feature 020) archived during the product pivot from BNPL-focused to budget-first app (Phase 2, October 2025).

## Functionality
- **Route**: `/bnpl`
- **Providers**: 6 BNPL providers (Klarna, Affirm, Afterpay, Sezzle, Zip, PayPal Credit)
- **Features**: Email parser, payment schedule extraction, risk detection

## Directory Structure
- `pages/` - BNPLParser.tsx (main route component)
- `components/bnpl/` - BNPL-specific React components
- `lib/` - Core parsing logic, provider-specific parsers, storage utilities
- `types/` - TypeScript type definitions

## Last Active Development
2025-10-28 (Feature 020 completed)

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](../../../docs/migrations/archive-bnpl-code.md) for archival details and rollback procedure.

## Accessing BNPL Features
BNPL features remain fully functional at `/bnpl` route. This code is archived (not deleted) to reflect product direction while preserving functionality.
```

**Commands**:
```bash
# Create file (use your editor or cat)
cat > frontend/src/archive/bnpl/README.md << 'EOF'
[paste content above]
EOF

# Verify file created
cat frontend/src/archive/bnpl/README.md
```

---

### Step 5.2: Create Archived Specs README

**File**: `specs/archived/README.md`

**Content**:
```markdown
# Archived Specifications

## Purpose
This directory contains archived feature specifications for features that have been deprioritized or archived during product pivots.

## Status
**Maintained-but-not-actively-developed**

Archived specs represent completed features that remain functional but are no longer actively developed. Code for these features has been relocated to `frontend/src/archive/`.

## Archival Date
2025-10-30 (Phase 2 of product pivot)

## Archived Features

### 020-bnpl-parser (BNPL Email Parser)
- **Status**: Archived
- **Reason**: Product pivot from BNPL-focused to budget-first app
- **Code Location**: `frontend/src/archive/bnpl/`
- **Route**: `/bnpl` (still accessible)
- **Last Active Development**: 2025-10-28

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](../../docs/migrations/archive-bnpl-code.md) for complete archival details and rollback procedures.

## Discovery
Use `ls specs/archived/` or glob patterns to discover archived specs. Each spec directory contains complete specification, plan, and task documentation.
```

**Commands**:
```bash
# Create file
cat > specs/archived/README.md << 'EOF'
[paste content above]
EOF

# Verify file created
cat specs/archived/README.md
```

---

### Step 5.3: Create Archived Manual Tests README

**File**: `manual-tests/archived/README.md`

**Content**:
```markdown
# Archived Manual Test Results

## Purpose
This directory contains manual test results for archived features. These tests document the last validation state before archival.

## Status
**Historical Documentation**

Test results in this directory are for historical reference only. Archived features remain functional but are not actively tested.

## Archival Date
2025-10-30 (Phase 2 of product pivot)

## Archived Test Results

### 020-bnpl-parser-test-results.md (BNPL Email Parser)
- **Feature**: BNPL Email Parser (Feature 020)
- **Test Date**: 2025-10-28
- **Test Results**: All acceptance criteria passed (100% success rate)
- **Code Location**: `frontend/src/archive/bnpl/`
- **Route**: `/bnpl` (still accessible)

## Discovery
Use `ls manual-tests/archived/` to discover archived test results. Each file documents manual testing procedures and results.
```

**Commands**:
```bash
# Create file
cat > manual-tests/archived/README.md << 'EOF'
[paste content above]
EOF

# Verify file created
cat manual-tests/archived/README.md
```

---

### Step 5.4: Create Migration Documentation

**File**: `docs/migrations/archive-bnpl-code.md`

**Content**: (See research.md Template 1, lines 291-316 for full content)

**Key Sections**:
1. Summary (what changed, why)
2. Files Moved (60 files with before/after paths)
3. Import Path Updates (transformation rules)
4. Rollback Procedure (step-by-step git commands)
5. Validation Checklist (post-archival verification)

**Commands**:
```bash
# Create file with comprehensive migration guide
# (Full content available in research.md lines 291-316)
```

---

**Checkpoint 5**:
```bash
# Commit all documentation
git add frontend/src/archive/bnpl/README.md
git add specs/archived/README.md
git add manual-tests/archived/README.md
git add docs/migrations/archive-bnpl-code.md
git commit -m "docs(archive): add comprehensive documentation for archived BNPL code"
```

---

## Phase 6: Validation & Testing

**Goal**: Verify zero user-facing changes and no regressions

### Step 6.1: TypeScript Compilation Validation

```bash
# Build must succeed with 0 errors
cd frontend && npm run build

# Expected output (last line):
# ✓ built in [time]ms
# Exit code: 0
```

**If errors occur**:
1. Review error messages for broken imports
2. Check grep output from Phase 3.1 for missed imports
3. Fix import paths
4. Re-run `npm run build`

---

### Step 6.2: Route Functionality Testing

**Manual Testing**:

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test BNPL Route** (`/bnpl`):
   - Navigate to `http://localhost:5173/bnpl`
   - ✅ Page loads without errors
   - ✅ Paste sample BNPL email (from manual-tests/archived/020-bnpl-parser-test-results.md)
   - ✅ Email parses correctly
   - ✅ Payment schedule displays
   - ✅ Provider badge shows correct provider

3. **Test Demo Route** (`/demo`):
   - Navigate to `http://localhost:5173/demo`
   - ✅ Page loads without errors
   - ✅ Demo functionality works (uses email-extractor.ts, NOT archived bnpl-parser.ts)

4. **Test Import Route** (`/import`):
   - Navigate to `http://localhost:5173/import`
   - ✅ Page loads without errors
   - ✅ Import functionality works (uses email-extractor.ts, NOT archived bnpl-parser.ts)

5. **Check Browser Console**:
   - Open DevTools (F12)
   - ✅ No import errors
   - ✅ No 404 errors for missing files
   - ✅ No TypeScript errors

---

### Step 6.3: Accessibility Testing

**Screen Reader Testing**:
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate to `/bnpl` route
3. ✅ Screen reader announces page correctly
4. ✅ ARIA labels unchanged
5. ✅ Focus management works

**Keyboard Navigation Testing**:
1. Navigate to `/bnpl` route
2. Use Tab key to navigate
3. ✅ All interactive elements accessible
4. ✅ Focus order logical
5. ✅ Enter/Space activates buttons

---

### Step 6.4: Git History Validation

```bash
# Verify git tracks file moves using content similarity detection
git log --follow frontend/src/archive/bnpl/pages/BNPLParser.tsx | head -20

# Expected: Full commit history including pre-archival commits
# Note: --follow tells Git to detect renames using content similarity heuristics

# Verify git blame works
git blame frontend/src/archive/bnpl/lib/bnpl-parser.ts | head -10

# Expected: Author names and dates from original file
```

**How Git Rename Detection Works**:

Git does NOT store rename operations in commits. Instead, when you run `git log --follow`, Git analyzes content similarity between commits to infer that a file was renamed. This is why committing moves separately (without content changes) is critical - it gives Git's heuristics clean data to work with.

**Key Points**:
- `git mv` is a convenience command (auto-stages the change)
- History "preservation" comes from Git's similarity detection, not the move command
- The `--follow` flag triggers Git's rename detection algorithm
- Works because we committed moves separately without modifying file content

---

### Step 6.5: localStorage Validation

**Browser Console Validation**:

```javascript
// Open browser console (F12)
// Check localStorage keys unchanged
Object.keys(localStorage).filter(key => key.includes('bnpl'))

// Expected: ['bnpl_schedules', 'bnpl_settings', 'bnpl_last_sync']
// (or empty array if no BNPL data stored)

// Verify BNPL data structure unchanged
JSON.parse(localStorage.getItem('bnpl_schedules') || '[]')

// Expected: Array of BNPLSchedule objects (or empty array)
```

---

**Checkpoint 6**:
```bash
# All validation checks must pass
echo "✅ TypeScript compilation: PASS"
echo "✅ Route functionality: PASS"
echo "✅ Accessibility: PASS"
echo "✅ Git history: PASS"
echo "✅ localStorage: PASS"
```

**If any check fails, STOP and resolve issues before proceeding.**

---

## Phase 7: Final Commit & Push

**Goal**: Create final commit and push to remote

### Step 7.1: Review All Changes

```bash
# Review commit history
git log --oneline | head -10

# Expected commits:
# - Create archive directory structure
# - Move BNPL pages to archive
# - Move BNPL components to archive
# - Move BNPL parsers to archive
# - Move BNPL core logic to archive
# - Move BNPL types to archive
# - Update import paths
# - Move BNPL spec to archived
# - Move BNPL test results to archived
# - Add comprehensive documentation

# Review changed files
git diff main...HEAD --stat

# Expected: ~60 files changed (14 code files + specs + tests + docs)
```

---

### Step 7.2: Push to Remote

```bash
# Push branch to remote
git push origin 063-short-name-archive

# Expected output:
# To github.com:mmtuentertainment/PayPlan.git
#  * [new branch]      063-short-name-archive -> 063-short-name-archive
```

---

## Phase 8: Create Pull Request

**Goal**: Create PR for HIL review

### Step 8.1: Create PR via GitHub CLI

```bash
# Create PR with template
gh pr create --title "refactor(archive): Archive BNPL code to frontend/src/archive/bnpl (Phase 2)" --body "$(cat <<'EOF'
## Summary
Relocates 60 BNPL-specific files from frontend/src/ to frontend/src/archive/bnpl/ to reflect PayPlan's evolution from BNPL-focused to budget-first app (Phase 2 of 3-phase product pivot).

## Changes
### Code Files (14 files)
- ✅ Moved pages/BNPLParser.tsx → archive/bnpl/pages/
- ✅ Moved components/bnpl/* → archive/bnpl/components/bnpl/
- ✅ Moved lib/bnpl-parser.ts → archive/bnpl/lib/
- ✅ Moved lib/parsers/* → archive/bnpl/lib/parsers/
- ✅ Moved lib/storage/bnpl-storage.ts → archive/bnpl/lib/storage/
- ✅ Moved types/bnpl.ts → archive/bnpl/types/

### Documentation Files
- ✅ Moved specs/020-bnpl-parser → specs/archived/
- ✅ Moved manual-tests/020-bnpl-parser-test-results.md → manual-tests/archived/
- ✅ Created frontend/src/archive/bnpl/README.md
- ✅ Created specs/archived/README.md
- ✅ Created manual-tests/archived/README.md
- ✅ Created docs/migrations/archive-bnpl-code.md

### Import Path Updates
- ✅ Updated App.tsx (route import)
- ✅ Updated all internal BNPL imports (archive/bnpl/* paths)

## Testing
### Build & Compile ✅
- [x] `npm run build` → 0 TypeScript errors
- [x] `npm run dev` → Dev server starts successfully

### Route Functionality ✅
- [x] `/bnpl` → BNPL parser loads and parses emails correctly
- [x] `/demo` → Demo loads (uses email-extractor.ts, NOT archived bnpl-parser.ts)
- [x] `/import` → Import loads (uses email-extractor.ts, NOT archived bnpl-parser.ts)

### Accessibility ✅
- [x] Screen reader announces labels correctly
- [x] Keyboard navigation works (Tab, Enter)
- [x] Focus indicators visible

### Git History ✅
- [x] `git log --follow` → Full commit history preserved
- [x] `git blame` → Author names and dates preserved

### localStorage ✅
- [x] localStorage keys unchanged (bnpl_schedules, bnpl_settings, bnpl_last_sync)
- [x] Data structure unchanged

## Impact
- ✅ **User-facing**: ZERO (100% feature parity, routes unchanged)
- ✅ **Developer-facing**: Codebase structure reflects product direction (budget-first)

## Migration Documentation
See [docs/migrations/archive-bnpl-code.md](docs/migrations/archive-bnpl-code.md) for complete archival details and rollback procedure.

## Related
- Feature 063 (Archive BNPL Code) - Phase 2 of product pivot
- Feature 020 (BNPL Parser) - Archived but still accessible
- Phase 1 (PR #45) - Changed default route from /bnpl-home to /dashboard

## Rollback Procedure
See migration doc for step-by-step rollback instructions.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Step 8.2: Wait for Bot Reviews

**Bot Review Loop**:

1. **Claude Code Bot** reviews PR
2. **CodeRabbit AI** reviews PR
3. **Categorize feedback**:
   - CRITICAL → Fix immediately
   - HIGH → Fix immediately
   - MEDIUM → Defer to Linear issue
   - LOW → Defer to Linear issue
4. **Fix CRITICAL + HIGH issues**
5. **Commit fixes** → Bots re-review
6. **Repeat until both bots GREEN**
7. **Notify HIL** for final approval

**Expected Bot Feedback**:
- ✅ No constitutional violations (code relocation only)
- ✅ No accessibility issues (no UI changes)
- ✅ No security issues (no PII exposure)
- ✅ Git history preserved
- ✅ TypeScript compilation succeeds

---

## Rollback Procedure

**If issues discovered post-archival**:

See `docs/migrations/archive-bnpl-code.md` for complete rollback procedure.

**Quick Rollback** (revert all commits):

```bash
# Find first commit of archival
git log --oneline | grep "create archive directory structure"
# Note commit SHA (e.g., abc123)

# Revert all archival commits
git revert abc123..HEAD

# Or reset branch (DESTRUCTIVE)
git reset --hard main
git push origin 063-short-name-archive --force
```

---

## Success Criteria

**Feature 063 complete when**:

1. ✅ All 60 files relocated (14 code + specs + tests + docs)
2. ✅ TypeScript compilation succeeds (0 errors)
3. ✅ All 3 routes work identically (/bnpl, /demo, /import)
4. ✅ Git history preserved (git log --follow works)
5. ✅ Accessibility unchanged (screen reader + keyboard nav)
6. ✅ localStorage schema unchanged
7. ✅ Documentation complete (4 README files + migration guide)
8. ✅ Both bots GREEN (Claude Code Bot + CodeRabbit AI)
9. ✅ HIL approved
10. ✅ PR merged to main

---

## References

- **Specification**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Plan**: [plan.md](./plan.md)
- **Migration Guide**: `docs/migrations/archive-bnpl-code.md` (created during implementation)

---

**Ready to start?** Begin with Phase 1 (Create Directory Structure) and proceed sequentially through all 8 phases. Manual testing at each checkpoint ensures zero user-facing regressions.
