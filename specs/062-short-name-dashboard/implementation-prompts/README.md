# Implementation Prompts: Dashboard with Charts (Feature 062)

**Feature**: Dashboard with Charts
**Spec Location**: `specs/062-short-name-dashboard/`
**Feature Branch**: `062-short-name-dashboard`
**Created**: 2025-10-29
**Total Tasks**: 52 (broken into 6 chunks)

---

## Overview

This folder contains **6 implementation prompt documents** designed to be read and executed by Claude Code independently. Each prompt is a self-contained instruction set for implementing a chunk of Feature 062.

**Why chunked?**
- Prevents context overflow (52 tasks = ~80K tokens)
- Enables proper PR review process (6 PRs vs 1 mega-PR)
- Allows iterative feedback and fixes
- Maintains git history granularity

---

## Workflow

### High-Level Process

```
Feature Branch: 062-short-name-dashboard (base)
   ↓
Chunk 1 → 062-dashboard-chunk1-foundation → PR #1 → Merge back
   ↓
Chunk 2 → 062-dashboard-chunk2-spending → PR #2 → Merge back
   ↓
Chunk 3 → 062-dashboard-chunk3-income → PR #3 → Merge back
   ↓
Chunk 4 → 062-dashboard-chunk4-widgets → PR #4 → Merge back
   ↓
Chunk 5 → 062-dashboard-chunk5-gamification → PR #5 → Merge back
   ↓
Chunk 6 → 062-dashboard-chunk6-polish → PR #6 → Merge back
   ↓
Final PR: 062-short-name-dashboard → main → Merge (after HIL approval)
```

### Step-by-Step Execution

**For each chunk:**

1. **Start Fresh Claude Code Session**
   - Open new Claude Code conversation
   - Read the chunk prompt document (e.g., `chunk-1-foundation.md`)

2. **Context Rehydration**
   - Claude reads the prompt, which includes:
     - Full feature context
     - Relevant spec sections
     - Code patterns from Phase 1
     - Git workflow instructions

3. **Execute Tasks**
   - Claude creates the sub-branch
   - Implements all tasks in the chunk
   - Runs validation checks
   - Commits changes with proper messages

4. **Create PR**
   - Push branch to GitHub
   - Create PR with provided template
   - Trigger bot reviews (Claude Code Bot + CodeRabbit AI)

5. **Bot Review Loop**
   - Respond to bot feedback
   - Fix CRITICAL/HIGH issues immediately
   - Defer MEDIUM/LOW to Linear
   - Iterate until both bots are green

6. **Merge Back**
   - Get HIL approval for chunk PR
   - Merge chunk branch back to `062-short-name-dashboard`
   - Delete chunk branch
   - Proceed to next chunk

**After all 6 chunks complete:**

7. **Final PR to Main**
   - Create PR: `062-short-name-dashboard` → `main`
   - Full feature review by HIL
   - Merge to main after approval

---

## Chunk Breakdown

### ✅ Chunk 1: Foundation & Data Layer (COMPLETED)
**File**: ~~chunk-1-foundation.md~~ (removed - implementation complete)
**Branch**: `062-dashboard-chunk1-foundation` (merged to feature branch)
**PR**: [#43](https://github.com/mmtuentertainment/PayPlan/pull/43) - MERGED 2025-10-29
**Tasks**: T009-T015 (7 tasks)
**Actual Time**: 2 hours
**Dependencies**: Phase 1 complete (T001-T008)

**What was delivered:**
- ✅ 5 data aggregation functions with error handling
- ✅ localStorage read-only layer (privacy-first)
- ✅ Zod validation schemas for all dashboard data
- ✅ Custom React hook (`useDashboardData`) with memoization
- ✅ Dashboard page scaffold with 6 widget placeholders
- ✅ EmptyState reusable component

**Key Files Created:**
- `frontend/src/lib/dashboard/aggregation.ts` (5 functions, 377 lines)
- `frontend/src/lib/dashboard/storage.ts` (localStorage utilities)
- `frontend/src/lib/dashboard/schemas.ts` (Zod schemas)
- `frontend/src/hooks/useDashboardData.ts` (custom hook)
- `frontend/src/pages/Dashboard.tsx` (page scaffold)
- `frontend/src/components/dashboard/EmptyState.tsx`
- `frontend/src/types/` (5 type definition files)

**Issues Fixed During Review:**
- CRITICAL: Privacy violation (sanitized error logging)
- MEDIUM: Logic bug (isOverdue flag)
- 9 MEDIUM/LOW issues tracked in GitHub issues #46-#54

**Status**: ✅ COMPLETE - All files merged to feature branch

---

### ✅ Chunk 2: Spending Chart Widget (COMPLETED)
**File**: ~~chunk-2-spending.md~~ (removed - implementation complete)
**Branch**: `062-dashboard-chunk2-spending` (merged to feature branch)
**PR**: [#57](https://github.com/mmtuentertainment/PayPlan/pull/57) - MERGED 2025-10-30
**Tasks**: T016-T021 (6 tasks)
**Actual Time**: 3 hours (including bug fixes)
**Dependencies**: Chunk 1 complete

**What was delivered:**
- ✅ SpendingChart component with Recharts PieChart
- ✅ Category breakdown visualization with color-coded segments
- ✅ Custom tooltip with category details
- ✅ SpendingChartWidget wrapper with empty state
- ✅ EmptyState "Add Transaction" button with navigation
- ✅ ARIA labels and hidden table for screen readers
- ✅ React.memo optimization for performance

**Key Files Created:**
- `frontend/src/components/dashboard/SpendingChart.tsx` (104 lines)
- `frontend/src/components/dashboard/SpendingChartWidget.tsx` (42 lines)

**Issues Fixed During Review:**
- CRITICAL: TypeError in useTransactions hook (null safety for storageData)
- MEDIUM: Add Transaction button navigation implemented
- 3 MEDIUM/LOW issues tracked in Linear (MMT-100, MMT-101, MMT-102)

**Status**: ✅ COMPLETE - All files merged to feature branch

---

### Chunk 3: Income vs Expenses Chart (5 tasks, ~10K tokens)
**File**: [chunk-3-income.md](./chunk-3-income.md)
**Branch**: `062-dashboard-chunk3-income`
**Tasks**: T022-T026
**Estimated Time**: 1 hour
**Dependencies**: Chunk 1 complete

**What it does:**
- Builds bar chart component with Recharts
- Implements monthly income/expense comparison
- Adds net income calculation
- Handles empty states

**Key Files Created:**
- `frontend/src/components/dashboard/IncomeExpensesChart.tsx`
- `frontend/src/components/dashboard/IncomeExpensesChartWidget.tsx`

---

### Chunk 4: P1 Widgets (14 tasks, ~20K tokens)
**File**: [chunk-4-widgets.md](./chunk-4-widgets.md)
**Branch**: `062-dashboard-chunk4-widgets`
**Tasks**: T027-T040
**Estimated Time**: 2-3 hours
**Dependencies**: Chunk 1 complete

**What it does:**
- Builds Recent Transactions widget (last 5 transactions)
- Builds Upcoming Bills widget (next 7 days)
- Builds Goal Progress widget (active goals)
- All widgets have empty states and accessibility

**Key Files Created:**
- `frontend/src/components/dashboard/RecentTransactionsWidget.tsx`
- `frontend/src/components/dashboard/UpcomingBillsWidget.tsx`
- `frontend/src/components/dashboard/GoalProgressWidget.tsx`

---

### Chunk 5: Gamification Widget (6 tasks, ~12K tokens)
**File**: [chunk-5-gamification.md](./chunk-5-gamification.md)
**Branch**: `062-dashboard-chunk5-gamification`
**Tasks**: T041-T046
**Estimated Time**: 1-2 hours
**Dependencies**: Chunk 1 complete

**What it does:**
- Builds streak tracking display
- Implements personalized spending insights
- Shows recent wins (positive actions)
- Full gamification engagement layer

**Key Files Created:**
- `frontend/src/components/dashboard/GamificationWidget.tsx`
- `frontend/src/lib/dashboard/gamification-engine.ts`

---

### Chunk 6: Polish & Integration (9 tasks, ~14K tokens)
**File**: [chunk-6-polish.md](./chunk-6-polish.md)
**Branch**: `062-dashboard-chunk6-polish`
**Tasks**: T047-T052
**Estimated Time**: 1-2 hours
**Dependencies**: Chunks 1-5 complete

**What it does:**
- Creates Dashboard page component
- Implements responsive grid layout
- Adds loading states and error handling
- Integrates all 6 widgets
- Adds route to app
- Manual testing and polish

**Key Files Created:**
- `frontend/src/pages/Dashboard.tsx`
- Updated `frontend/src/App.tsx` (add route)

---

## File Format

Each prompt document follows this structure:

```markdown
# [Chunk Title]

## Context Rehydration
- Feature overview
- Spec excerpts
- Constitution alignment
- Phase 1 code patterns

## Git Workflow
- Branch creation command
- Commit message format
- PR template

## Tasks
- [ ] T0XX [P] [USX] Description
  - **File**: path/to/file.ts
  - **Success Criteria**: measurable outcome
  - **Code Pattern**: example from Phase 1

## Validation
- Manual testing steps
- Accessibility checks
- Performance checks

## PR Template
- Title format
- Description with task list
- Bot review expectations
```

---

## Best Practices for Claude Code

### Reading Prompts

1. **Open Fresh Session**: Start new Claude Code conversation for each chunk
2. **Read Full Prompt**: Use Read tool to load entire prompt document
3. **Verify Context**: Confirm feature branch, chunk number, dependencies
4. **Check Prerequisites**: Ensure previous chunks are merged (if applicable)

### Executing Prompts

1. **Follow Git Workflow**: Create branch exactly as specified
2. **Implement Sequentially**: Complete tasks in order (unless marked [P] for parallel)
3. **Commit Granularly**: One commit per task or logical unit
4. **Validate Continuously**: Check TypeScript compilation, accessibility, manual testing

### Handling Issues

**If you encounter errors:**
- Check dependencies (are previous chunks merged?)
- Verify localStorage data exists (may need to create test data)
- Review TypeScript compilation errors
- Check Recharts version (must be 3.3.0)

**If bot reviews fail:**
- Categorize feedback (CRITICAL/HIGH/MEDIUM/LOW)
- Fix CRITICAL + HIGH immediately
- Create Linear tasks for MEDIUM + LOW
- Re-commit and wait for re-review

---

## Quality Gates

**Each chunk PR must pass:**
- ✅ TypeScript compilation (no errors)
- ✅ Manual testing (all features work)
- ✅ Accessibility audit (screen reader + keyboard nav)
- ✅ Claude Code Bot: GREEN
- ✅ CodeRabbit AI: GREEN
- ✅ HIL approval

**Do NOT merge until all gates pass.**

---

## Token Budget

| Chunk | Tasks | Estimated Tokens | Reading + Execution |
|-------|-------|------------------|---------------------|
| 1     | 12    | 18,000           | ~25,000             |
| 2     | 6     | 12,000           | ~18,000             |
| 3     | 5     | 10,000           | ~16,000             |
| 4     | 14    | 20,000           | ~28,000             |
| 5     | 6     | 12,000           | ~18,000             |
| 6     | 9     | 14,000           | ~22,000             |
| **Total** | **52** | **86,000** | **~127,000** |

**Budget per session**: 200,000 tokens (well within limits)

---

## Troubleshooting

### "Cannot find module" errors
**Cause**: Dependencies not installed
**Fix**: Run `npm install` in `frontend/`

### "localStorage is not defined" errors
**Cause**: Running in Node environment (tests)
**Fix**: Mock localStorage for tests (Phase 2 concern)

### "Recharts components not rendering"
**Cause**: Missing width/height or data
**Fix**: Check ResponsiveContainer wraps chart, data array not empty

### "ARIA label missing" bot feedback
**Cause**: Accessibility issue
**Fix**: Add `aria-label`, `aria-describedby`, or visually-hidden text

### "Merge conflict" on chunk branch
**Cause**: Feature branch updated while working on chunk
**Fix**: Rebase chunk branch on latest feature branch

---

## References

**Specification Documents:**
- [spec.md](../spec.md) - User stories and acceptance criteria
- [plan.md](../plan.md) - Technical approach and constitution check
- [data-model.md](../data-model.md) - TypeScript types and Zod schemas
- [research.md](../research.md) - Deep research findings
- [tasks.md](../tasks.md) - Complete 52-task breakdown

**Phase 1 Implementation (Completed):**
- [frontend/src/types/dashboard.ts](../../../frontend/src/types/dashboard.ts)
- [frontend/src/types/chart-data.ts](../../../frontend/src/types/chart-data.ts)
- [frontend/src/types/gamification.ts](../../../frontend/src/types/gamification.ts)
- [frontend/src/lib/dashboard/schemas.ts](../../../frontend/src/lib/dashboard/schemas.ts)
- [frontend/src/lib/dashboard/storage.ts](../../../frontend/src/lib/dashboard/storage.ts)
- [frontend/src/components/dashboard/EmptyState.tsx](../../../frontend/src/components/dashboard/EmptyState.tsx)

**Project Guidelines:**
- [CLAUDE.md](../../../CLAUDE.md) - Development guide for Claude Code
- [memory/constitution_v1.1_TEMP.md](../../../memory/constitution_v1.1_TEMP.md) - Project constitution

---

## Success Criteria

**Feature 062 is complete when:**
- ✅ All 52 tasks implemented (across 6 chunks)
- ✅ All 6 chunk PRs merged back to feature branch
- ✅ Dashboard page loads in <1 second
- ✅ All 6 widgets render correctly with real data
- ✅ Empty states display when no data available
- ✅ WCAG 2.1 AA compliance verified (screen reader + keyboard nav)
- ✅ Responsive layout works on mobile/tablet/desktop
- ✅ Manual testing confirms all acceptance criteria met
- ✅ Final PR merged to main after HIL approval

---

## Contact & Support

**Issues with prompts?**
- Check [tasks.md](../tasks.md) for original task definitions
- Review [plan.md](../plan.md) for technical context
- Consult [CLAUDE.md](../../../CLAUDE.md) for project guidelines

**Bot review questions?**
- See CLAUDE.md "Bot Review Loop" section
- Categorize feedback: CRITICAL → HIGH → MEDIUM → LOW
- Fix CRITICAL + HIGH immediately, defer rest to Linear

**Need HIL input?**
- Tag @HIL in GitHub PR comments
- Provide context: what's blocked, what decision needed
- Continue with other chunks while waiting

---

**Ready to start?** Open [chunk-1-foundation.md](./chunk-1-foundation.md) in a fresh Claude Code session!
