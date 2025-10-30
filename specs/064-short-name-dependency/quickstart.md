# Quick Start: Dependency Cleanup (Phase 3 - Revised)

**Feature**: 064-short-name-dependency
**Branch**: `064-short-name-dependency`
**Estimated Time**: 1-2 hours
**Status**: Documentation update only (no dependency removal)

---

## ⚠️ IMPORTANT: Revised Scope

**Original Plan**: Remove `ics@3.8.1` dependency (used only by archived code)

**Actual Finding** (from research.md): `ics` is **actively used** by Demo.tsx and Import.tsx for calendar download functionality

**Revised Plan**: Update README.md to budget-first architecture + validate all 13 routes

---

## Prerequisites

Before starting Phase 3 implementation:

1. ✅ **Phase 2 Complete**: PR #55 merged (BNPL code archived to `frontend/src/archive/bnpl/`)
2. ✅ **Clean Working Directory**: Run `git status` to verify no uncommitted changes
3. ✅ **TypeScript Compilation Succeeds**: Run `npm run build` from `frontend/` (must exit with code 0)
4. ✅ **Research Complete**: `specs/064-short-name-dependency/research.md` exists (Phase 0 findings)

**Verify Prerequisites**:
```bash
# Check git status (should be clean)
git status

# Check current branch
git branch --show-current
# Expected: 064-short-name-dependency

# Verify build succeeds
cd frontend && npm run build
# Expected: exit code 0, 0 TypeScript errors

# Verify research.md exists
ls specs/064-short-name-dependency/research.md
# Expected: file exists
```

---

## Step-by-Step Implementation

### Step 1: Analyze Current README.md

**Goal**: Identify sections that need updating to reflect budget-first architecture

**Commands**:
```bash
# View current README.md
cat README.md | head -50

# Identify BNPL-focused sections
grep -i "bnpl\|buy now pay later" README.md
```

**Expected Findings**:
- Product description likely says "BNPL" or "Buy Now, Pay Later"
- Feature list likely has BNPL features first
- Architecture section may not mention archived code

**Action Items** (to be determined during implementation):
- [ ] Update product description to "Privacy-First Budgeting App"
- [ ] Reorder feature list (budget features first, BNPL as differentiator)
- [ ] Update architecture section (active code vs. archived code)
- [ ] Update getting started section (budget workflow first)

---

### Step 2: Update README.md to Budget-First

**Goal**: Revise README.md to position PayPlan as a budget-first app with BNPL tracking as a differentiator

**Recommended Sections to Update**:

#### 2.1: Product Description (First Paragraph)

**Before** (hypothetical):
```markdown
# PayPlan - BNPL Debt Management App

Track your Buy Now, Pay Later purchases and avoid missing payments.
```

**After** (budget-first):
```markdown
# PayPlan - Privacy-First Budgeting App

Track your spending, budgets, and goals with zero tracking and local-only storage. With BNPL payment tracking as a unique differentiator.
```

#### 2.2: Feature List

**Before** (hypothetical):
```markdown
## Features

- BNPL email parser
- Payment tracking
- Risk detection
- Categories and budgets
```

**After** (budget-first):
```markdown
## Features

### Budget Management (Core Features)
- Spending categories and budgets
- Transaction tracking
- Dashboard with charts
- Goal tracking

### BNPL Differentiator
- BNPL email parser (6 providers: Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle)
- Risk detection (payment collisions, weekend autopay)
- CSV import/export
```

#### 2.3: Architecture Section

**Before** (hypothetical):
```markdown
## Architecture

React app with localStorage storage.
```

**After** (with archived code context):
```markdown
## Architecture

React 19.1.1 + TypeScript 5.8.3 web application with privacy-first localStorage storage.

**Code Organization**:
- `frontend/src/` - Active budget app features (categories, budgets, transactions, dashboard)
- `frontend/src/archive/bnpl/` - Archived BNPL code (still accessible at `/bnpl` route)
```

---

### Step 3: Verify No Dependency Changes Needed

**Goal**: Confirm research findings that all dependencies are actively used

**Commands**:
```bash
# Verify ics is used by Demo.tsx and Import.tsx
grep -n "from 'ics'" frontend/src/pages/Demo.tsx frontend/src/pages/Import.tsx

# Expected output:
# frontend/src/pages/Demo.tsx:5:import { createEvents, type EventAttributes } from 'ics';
# frontend/src/pages/Import.tsx:4:import { createEvents, type EventAttributes } from 'ics';

# Verify no changes to package.json
git diff frontend/package.json

# Expected: no changes (empty output)
```

**Validation**:
- ✅ `ics` used by Demo.tsx (line 5, 68-95)
- ✅ `ics` used by Import.tsx (line 4, 211-244)
- ✅ No changes to package.json required

---

### Step 4: Manual Testing (All 13 Routes)

**Goal**: Verify all routes load successfully with no console errors

**Critical Routes** (test `.ics` functionality):
1. **`/demo`** - Test "Download .ics Calendar" button
2. **`/import`** - Test "Download .ics" button after CSV import

**Testing Procedure**:

#### 4.1: Start Dev Server
```bash
cd frontend && npm run dev
```

#### 4.2: Test Budget App Routes (6 routes)
```bash
# Open browser to:
http://localhost:5173/                    # Dashboard
http://localhost:5173/categories          # Categories
http://localhost:5173/budgets             # Budgets
http://localhost:5173/transactions        # Transactions
http://localhost:5173/archives            # Archive list
http://localhost:5173/archives/test-id    # Archive detail (may 404 if no archives)
```

**Validation**:
- [ ] `/` - Dashboard loads, no console errors
- [ ] `/categories` - Categories loads, no console errors
- [ ] `/budgets` - Budgets loads, no console errors
- [ ] `/transactions` - Transactions loads, no console errors
- [ ] `/archives` - Archive list loads, no console errors
- [ ] `/archives/:id` - Archive detail loads (or 404 if no data)

#### 4.3: Test Demo/Import Routes (CRITICAL - uses `ics`)
```bash
# Open browser to:
http://localhost:5173/demo                # Demo with .ics download
http://localhost:5173/import              # CSV import with .ics download
```

**Demo Route Validation**:
- [ ] Demo page loads successfully
- [ ] Click "Run Demo" button - payments display
- [ ] Click "Download .ics Calendar" button
- [ ] Browser downloads `.ics` file (verify file exists)
- [ ] Open `.ics` file in calendar app (events should appear)
- [ ] No console errors

**Import Route Validation**:
- [ ] Import page loads successfully
- [ ] Upload a CSV file - payments display
- [ ] Click "Download .ics" button
- [ ] Browser downloads `.ics` file (verify file exists)
- [ ] Open `.ics` file in calendar app (events should appear)
- [ ] No console errors

#### 4.4: Test BNPL Routes (Archived - 2 routes)
```bash
# Open browser to:
http://localhost:5173/bnpl-home           # BNPL home (archived)
http://localhost:5173/bnpl                # BNPL parser (archived)
```

**Validation**:
- [ ] `/bnpl-home` - BNPL home loads, no console errors
- [ ] `/bnpl` - BNPL parser loads, no console errors

#### 4.5: Test System Routes (3 routes)
```bash
# Open browser to:
http://localhost:5173/docs                # Documentation
http://localhost:5173/privacy             # Privacy policy
http://localhost:5173/settings            # Settings
```

**Validation**:
- [ ] `/docs` - Documentation loads, no console errors
- [ ] `/privacy` - Privacy policy loads, no console errors
- [ ] `/settings` - Settings loads, no console errors

#### 4.6: Browser Console Check
**CRITICAL**: Open browser DevTools console (F12) and verify:
- [ ] 0 JavaScript errors across all routes
- [ ] 0 network errors (404, 500, etc.)
- [ ] No warnings about broken imports or missing dependencies

---

### Step 5: Verify Build Succeeds

**Goal**: Confirm TypeScript compilation succeeds with 0 errors

**Commands**:
```bash
cd frontend && npm run build
```

**Expected Output**:
```
vite v6.1.9 building for production...
✓ built in 3.45s
```

**Validation**:
- ✅ Build exits with code 0
- ✅ 0 TypeScript errors
- ✅ Build time <10 seconds (reasonable for dev machine)

---

### Step 6: Create Git Commit

**Goal**: Commit README.md changes with descriptive message

**Commands**:
```bash
# Stage changes
git add README.md specs/063-short-name-archive/plan.md

# Create commit with Conventional Commits format
git commit -m "$(cat <<'EOF'
docs(readme): update to budget-first architecture (Feature 064)

Phase 3 of product pivot: Update documentation to reflect budget-first
positioning with BNPL tracking as a secondary feature/differentiator.

Changes:
- Update product description to "Privacy-First Budgeting App"
- Reorder feature list (budget features first, BNPL as differentiator)
- Update architecture section to reflect archived code structure
- Mark Phase 3 complete in specs/063-short-name-archive/plan.md

Research Findings:
- ics@3.8.1 dependency is actively used by Demo and Import pages
- All 4 dependencies (ics, luxon, papaparse, recharts) are actively used
- No dependencies removed (all are needed for budget app functionality)

Validation:
- All 13 routes tested: 100% availability
- Demo/Import .ics download functionality verified
- Browser console: 0 errors
- npm run build: 0 TypeScript errors
- README.md accurately reflects budget-first architecture

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Step 7: Mark Phase 3 Complete

**Goal**: Update Phase 2 plan to mark Phase 3 as complete

**File**: `specs/063-short-name-archive/plan.md`

**Edit Section** (find "Phase 3" section and update status):
```markdown
## Phase 3: Dependency Cleanup ✅ COMPLETE (Revised)

**Status**: Complete (Documentation update only)
**Date Completed**: 2025-10-30
**PR**: [Link to PR once created]

**Original Goal**: Remove BNPL-specific dependencies
**Actual Outcome**: Research revealed `ics` is actively used by Demo/Import; all dependencies preserved

**Changes Made**:
- Updated README.md to budget-first architecture
- Validated all 13 routes (including Demo/Import `.ics` functionality)
- Confirmed all dependencies actively used (ics, luxon, papaparse, recharts)

**Research Findings**: See `specs/064-short-name-dependency/research.md`
```

---

## Validation Checklist (Final)

Before marking Phase 3 complete, verify:

### Documentation Updates
- [ ] README.md product description: "Privacy-First Budgeting App" (or similar budget-first language)
- [ ] README.md feature list: Budget features listed first, BNPL as differentiator
- [ ] README.md architecture section: References `frontend/src/` (active) and `frontend/src/archive/bnpl/` (archived)
- [ ] Phase 3 marked complete in `specs/063-short-name-archive/plan.md`

### Dependency Validation
- [ ] `ics@3.8.1` remains in `frontend/package.json` (actively used)
- [ ] `luxon@3.7.2` remains in `frontend/package.json` (actively used)
- [ ] `papaparse` remains in `frontend/package.json` (actively used)
- [ ] `recharts` remains in `frontend/package.json` (actively used)
- [ ] No dependencies removed (all are needed)

### Route Testing (11 routes)
- [ ] `/` - Dashboard loads ✅
- [ ] `/categories` - Categories loads ✅
- [ ] `/budgets` - Budgets loads ✅
- [ ] `/transactions` - Transactions loads ✅
- [ ] `/archives` - Archive list loads ✅
- [ ] `/archives/:id` - Archive detail loads ✅
- [ ] `/demo` - Demo loads + `.ics` download works ✅
- [ ] `/import` - Import loads + `.ics` download works ✅
- [ ] `/bnpl-home` - BNPL home loads ✅
- [ ] `/bnpl` - BNPL parser loads ✅
- [ ] `/settings` - Settings loads ✅

### Build & Console
- [ ] `npm run build` exits with code 0 (0 TypeScript errors)
- [ ] Browser console shows 0 JavaScript errors across all routes
- [ ] No network errors (404, 500) in browser DevTools

### Git Commit
- [ ] Git commit created with Conventional Commits format
- [ ] Commit message includes feature number ("Feature 064")
- [ ] Commit footer includes GitHub signatures
- [ ] Changes staged and committed

---

## Rollback Plan

If issues are discovered after implementation:

### Option 1: Revert README.md Changes
```bash
# Restore README.md from previous commit
git checkout HEAD~1 -- README.md

# Restore Phase 3 status in plan.md
git checkout HEAD~1 -- specs/063-short-name-archive/plan.md

# Verify build still works
cd frontend && npm run build
```

### Option 2: Full Commit Revert
```bash
# Revert the commit (creates new revert commit)
git revert HEAD

# Verify build still works
cd frontend && npm run build
```

---

## Troubleshooting

### Issue: README.md conflicts with other documentation

**Symptom**: README.md says "budget-first" but CLAUDE.md or constitution says something different

**Solution**:
1. Check CLAUDE.md for consistency
2. Check memory/constitution.md for consistency
3. Update all documentation files to align on budget-first messaging

### Issue: .ics download not working after changes

**Symptom**: Demo/Import .ics download buttons don't work

**Solution**:
1. Verify `ics` dependency is still in package.json
2. Run `npm install` to reinstall dependencies
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for errors

### Issue: Routes return 404 or fail to load

**Symptom**: Routes like `/categories` or `/budgets` return 404

**Solution**:
1. Verify dev server is running (`npm run dev`)
2. Check `frontend/src/App.tsx` for route definitions
3. Clear browser cache
4. Try incognito mode to avoid cached routing

---

## Next Steps

After completing Phase 3:

1. **Create Pull Request**: Create PR with changes, wait for bot reviews
2. **Bot Review Loop**: Respond to CodeRabbit and Claude Code Bot feedback
3. **HIL Approval**: Wait for human approval
4. **Merge**: Manus merges PR after approval
5. **Mark Complete**: Update project tracking (Linear, docs, etc.)

---

**Quick Start Status**: ✅ Complete
**Next**: Run `/speckit.tasks` to generate executable task breakdown
