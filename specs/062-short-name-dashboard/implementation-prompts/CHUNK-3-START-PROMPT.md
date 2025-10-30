# START CHUNK 3: Income vs Expenses Chart Widget

## 🎯 Quick Start Instructions for Claude Code

**You are Claude Code, starting a fresh session to implement Chunk 3 of Feature 062.**

### Step 1: Read Implementation Prompt (REQUIRED)

```bash
# Read the full implementation prompt
Read /home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md
```

### Step 2: Verify Prerequisites

```bash
# Check you're on the correct branch
cd /home/matt/PROJECTS/PayPlan
git branch --show-current  # Should be 062-short-name-dashboard

# Verify Chunk 1 & 2 are complete
ls -la frontend/src/components/dashboard/
# Should see: EmptyState.tsx, SpendingChart.tsx, SpendingChartWidget.tsx

# Verify data layer exists
ls -la frontend/src/lib/dashboard/
# Should see: aggregation.ts, storage.ts, schemas.ts

# Verify hook exists
ls -la frontend/src/hooks/useDashboardData.ts
```

### Step 3: Create Chunk 3 Branch

```bash
git checkout -b 062-dashboard-chunk3-income
```

### Step 4: Implement Tasks (From chunk-3-income.md)

**Tasks to complete:**
- [ ] T022: Create IncomeExpensesChart component with Recharts BarChart
- [ ] T023: Add ARIA labels and hidden table for accessibility
- [ ] T024: Implement tooltip with monthly breakdown
- [ ] T025: Add empty state handling in IncomeExpensesChartWidget
- [ ] T026: Integrate IncomeExpensesChartWidget into Dashboard page

**Use TodoWrite tool to track progress through implementation.**

### Step 5: Validation

```bash
# TypeScript compilation
cd frontend && npx tsc --noEmit

# Start dev server for manual testing
npm run dev

# Manual testing checklist:
# 1. Dashboard loads without errors
# 2. Income vs Expenses widget shows bar chart (if data exists)
# 3. Empty state shows if no transactions
# 4. Tooltip displays on bar hover
# 5. Screen reader reads hidden table
# 6. Keyboard navigation works
```

### Step 6: Create PR

```bash
# Commit all changes
git add .
git commit -m "feat(dashboard): Chunk 3 - Income vs Expenses Chart Widget

Implements T022-T026 from Feature 062 specification.

Components:
- IncomeExpensesChart: Recharts BarChart with monthly data
- IncomeExpensesChartWidget: Wrapper with empty state
- Tooltip with income/expenses/net breakdown
- ARIA labels and hidden table for accessibility
- React.memo optimization

Dashboard updated:
- Widget 2 now shows IncomeExpensesChartWidget
- Connects to incomeExpensesData from useDashboardData hook

Testing:
- Manual testing completed
- TypeScript compilation clean
- Accessibility verified (screen reader + keyboard)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin 062-dashboard-chunk3-income

# Create PR using GitHub CLI
gh pr create --title "feat(dashboard): Chunk 3 - Income vs Expenses Chart Widget (T022-T026)" \
  --body "$(cat <<'EOF'
## Summary

Implements **Chunk 3** of Feature 062 (Dashboard with Charts) - the **Income vs Expenses bar chart widget**.

This is the **second highest priority widget** (P0) that visualizes monthly income/expenses comparison using Recharts.

## Changes

### New Files
- `frontend/src/components/dashboard/IncomeExpensesChart.tsx` - Core bar chart component
- `frontend/src/components/dashboard/IncomeExpensesChartWidget.tsx` - Widget wrapper with empty state

### Modified Files
- `frontend/src/pages/Dashboard.tsx` - Replaced Widget 2 placeholder with IncomeExpensesChartWidget

## Tasks Completed (5/5)

- ✅ **T022**: Create IncomeExpensesChart component with Recharts BarChart
- ✅ **T023**: Add ARIA labels and hidden table for accessibility
- ✅ **T024**: Implement tooltip with monthly breakdown
- ✅ **T025**: Add empty state handling in IncomeExpensesChartWidget
- ✅ **T026**: Integrate IncomeExpensesChartWidget into Dashboard page

## Features

### Recharts BarChart
- Displays monthly income (green) vs expenses (red)
- Net income calculation (income - expenses)
- Responsive container (100% width, 300px height)
- Last 6 months of data

### Custom Tooltip
- Shows month, income, expenses, net income
- Color-coded values (green for positive, red for negative)
- Formatted currency ($X,XXX.XX)

### Accessibility (WCAG 2.1 AA)
- Hidden HTML table for screen readers (`.sr-only` class)
- Table caption: "Income vs expenses for last 6 months"
- ARIA label: "Income vs expenses data table"
- Screen reader reads month, income, expenses, net

### Empty State
- Displays "No income/expense data yet" when no transactions
- CTA button: "Add Transaction" (navigates to /transactions)
- Icon: 💰

### Performance
- `React.memo` wrapper prevents unnecessary re-renders
- Only re-renders when `data` prop changes

## Testing

### Manual Testing Performed
- ✅ TypeScript compilation: 0 errors
- ✅ Build successful: No compilation errors
- ✅ Empty state displays when no data

### Manual Testing Required (HIL)
- [ ] Verify bar chart displays correctly with 3+ months data
- [ ] Verify income bars are green, expense bars are red
- [ ] Hover over bars → tooltip shows correct data
- [ ] Screen reader test (NVDA/VoiceOver) → hidden table is read
- [ ] Resize browser → chart reflows responsively
- [ ] Click "Add Transaction" → navigates to /transactions

## Dependencies

- ✅ **Chunk 1 complete**: Data aggregation layer exists
- ✅ **Chunk 2 complete**: Empty state component exists
- ✅ `useDashboardData()` hook provides `incomeExpensesData`
- ✅ `IncomeExpensesChartData` interface defined
- ✅ Recharts installed and configured

## Constitutional Compliance

- ✅ **Privacy-First**: Read-only localStorage access, no data sent to server
- ✅ **Accessibility**: WCAG 2.1 AA compliant (hidden table for screen readers)
- ✅ **Performance**: React.memo optimization, <500ms render target
- ✅ **Phase 1**: Manual testing only (no automated tests required)

## Next Steps

1. **Bot Review Loop**: Respond to Claude Code Bot + CodeRabbit AI feedback
2. **Fix CRITICAL/HIGH**: Address blocking issues immediately
3. **Defer MEDIUM/LOW**: Create Linear tasks for non-blocking suggestions
4. **HIL Approval**: Manual testing and final review
5. **Merge to Feature Branch**: Merge back to `062-short-name-dashboard`
6. **Proceed to Chunk 4**: Recent Transactions, Upcoming Bills, Goal Progress widgets

## Related

- **Spec**: `specs/062-short-name-dashboard/spec.md` (User Story 1)
- **Implementation Prompt**: `specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md`
- **Feature Branch**: `062-short-name-dashboard`
- **Previous Chunk**: Chunk 2 (Spending Chart) - COMPLETED

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" \
  --base 062-short-name-dashboard
```

### Step 7: Bot Review Loop

**After PR creation, bots will review your code.**

1. **Wait for reviews** (Claude Code Bot + CodeRabbit AI)
2. **Categorize feedback**:
   - **CRITICAL**: Security, privacy violations → Fix immediately
   - **HIGH**: Accessibility, error handling → Fix immediately
   - **MEDIUM**: Code quality, refactoring → Defer to Linear
   - **LOW**: Style, minor improvements → Defer to Linear

3. **Respond to feedback**:
```bash
# For CRITICAL/HIGH issues:
# Fix the code, commit, and push
git add .
git commit -m "fix(dashboard): address bot feedback - [issue description]"
git push origin 062-dashboard-chunk3-income

# For MEDIUM/LOW issues:
# Create Linear issue using MCP
Use mcp__linear__create_issue tool:
- title: "[Bot Suggestion] [description]"
- team: "PayPlan"
- labels: ["bot-suggestion", "chunk-3"]
- project: Link to Feature 062
- description: Quote bot feedback + link to PR
```

4. **Iterate until both bots are GREEN** ✅

### Step 8: Merge Back to Feature Branch

**After HIL approves:**

```bash
# Switch to feature branch
git checkout 062-short-name-dashboard

# Merge chunk branch
git merge 062-dashboard-chunk3-income -m "feat(dashboard): merge Chunk 3 - Income vs Expenses Chart

Merges Chunk 3 implementation into main feature branch.

Completed:
- IncomeExpensesChart component with Recharts BarChart
- IncomeExpensesChartWidget wrapper with empty state
- Tooltip with monthly income/expenses/net breakdown
- ARIA labels and hidden table for accessibility
- Integration into Dashboard page

All tests passing. Ready for Chunk 4."

# Push to remote
git push origin 062-short-name-dashboard

# Delete chunk branch (optional)
git branch -d 062-dashboard-chunk3-income
git push origin --delete 062-dashboard-chunk3-income
```

### Step 9: Update Documentation

```bash
# Update README to mark Chunk 3 complete
Edit specs/062-short-name-dashboard/implementation-prompts/README.md
# Change Chunk 3 section to:
### ✅ Chunk 3: Income vs Expenses Chart (COMPLETED)
**File**: ~~chunk-3-income.md~~ (removed - implementation complete)
**Branch**: `062-dashboard-chunk3-income` (merged to feature branch)
**PR**: #XX - MERGED 2025-MM-DD
**Status**: ✅ COMPLETE

# Remove implementation doc
git rm specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md

# Commit and push
git commit -am "docs(dashboard): mark Chunk 3 complete"
git push origin 062-short-name-dashboard
```

---

## 🚀 Ready to Start?

**Execute these commands in order:**

1. `Read /home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md`
2. `cd /home/matt/PROJECTS/PayPlan && git checkout -b 062-dashboard-chunk3-income`
3. Follow the implementation prompt tasks
4. Use TodoWrite to track progress
5. Manual test with browser automation (MCP tools)
6. Create PR with template above
7. Respond to bot reviews
8. Merge after HIL approval

---

## 📚 Key Files to Reference

**Specification:**
- `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/spec.md`
- `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/plan.md`
- `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/data-model.md`

**Implementation Prompt:**
- `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md` ← **START HERE**

**Existing Code (Chunk 1 & 2):**
- `/home/matt/PROJECTS/PayPlan/frontend/src/lib/dashboard/aggregation.ts` (data layer)
- `/home/matt/PROJECTS/PayPlan/frontend/src/hooks/useDashboardData.ts` (React hook)
- `/home/matt/PROJECTS/PayPlan/frontend/src/components/dashboard/EmptyState.tsx` (reusable component)
- `/home/matt/PROJECTS/PayPlan/frontend/src/components/dashboard/SpendingChart.tsx` (reference for chart patterns)

**Project Guidelines:**
- `/home/matt/PROJECTS/PayPlan/CLAUDE.md` (development guide)
- `/home/matt/PROJECTS/PayPlan/memory/constitution_v1.1_TEMP.md` (project constitution)

---

## 🛠️ Claude Code Tools to Use

**File Operations:**
- `Read` - Read implementation prompt and reference files
- `Write` - Create new IncomeExpensesChart.tsx and IncomeExpensesChartWidget.tsx
- `Edit` - Modify Dashboard.tsx to integrate widget
- `Glob` - Find existing chart components for reference patterns

**Git Operations:**
- `Bash` - All git commands (checkout, commit, push, merge)
- Use conventional commit messages

**Task Tracking:**
- `TodoWrite` - Track all 5 tasks as you implement them
- Mark as in_progress → completed as you go

**Testing:**
- `Bash` - Run `npx tsc --noEmit` for TypeScript compilation
- `Bash` - Run `npm run dev` to start dev server
- `mcp__puppeteer__*` - Browser automation for manual testing
- `mcp__chrome-devtools__*` - Take screenshots, check console errors

**PR Creation:**
- `Bash` - Use `gh pr create` with template above
- `mcp__linear__*` - Create Linear issues for deferred bot feedback

**Quality Checks:**
- Verify TypeScript compilation (`npx tsc --noEmit`)
- Verify accessibility (screen reader + keyboard nav)
- Verify no console errors (browser DevTools)

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't skip reading chunk-3-income.md** - It contains full context
2. **Don't create branch from wrong location** - Must be from `062-short-name-dashboard`
3. **Don't forget TodoWrite** - Track all 5 tasks as you implement
4. **Don't skip manual testing** - Must verify chart renders correctly
5. **Don't merge without bot approval** - Both bots must be GREEN
6. **Don't forget to update README** - Mark Chunk 3 complete after merge

---

## 🎯 Success Criteria

**Chunk 3 is complete when:**
- ✅ All 5 tasks (T022-T026) implemented
- ✅ TypeScript compilation clean (0 errors)
- ✅ IncomeExpensesChart renders with bar chart
- ✅ Empty state displays when no data
- ✅ Tooltip shows on bar hover
- ✅ ARIA labels and hidden table for screen readers
- ✅ "Add Transaction" button navigates to /transactions
- ✅ Manual testing confirms all acceptance criteria met
- ✅ Bot reviews GREEN (Claude Code Bot + CodeRabbit AI)
- ✅ HIL approves PR
- ✅ Merged back to feature branch
- ✅ README updated, chunk-3-income.md removed

---

## 📞 Need Help?

**If you get stuck:**
- Review [CLAUDE.md](../../../CLAUDE.md) for project guidelines
- Check Chunk 2 implementation for reference patterns
- Consult [plan.md](../plan.md) for technical approach
- Review [spec.md](../spec.md) for acceptance criteria

**If bot reviews fail:**
- See "Bot Review Loop" section above
- Categorize: CRITICAL → HIGH → MEDIUM → LOW
- Fix CRITICAL + HIGH immediately
- Defer MEDIUM + LOW to Linear

---

## 🚦 Ready to Start!

**Your first command:**
```bash
Read /home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md
```

**Then create the branch:**
```bash
cd /home/matt/PROJECTS/PayPlan && git checkout -b 062-dashboard-chunk3-income
```

**Good luck! Chunk 3 is similar to Chunk 2 - you've got this! 🚀**
