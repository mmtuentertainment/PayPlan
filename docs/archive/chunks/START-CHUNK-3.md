# Implement Dashboard Chunk 3: Income vs Expenses Chart Widget

Hey Claude Code! You're starting a fresh session to implement **Chunk 3** of Feature 062 (Dashboard with Charts).

## 🎯 Your Mission

Implement the **Income vs Expenses bar chart widget** - the second P0 widget showing monthly income/expense comparison with Recharts.

## 📖 Step 1: Read the Implementation Prompt

**FIRST ACTION - Read this file completely:**
```
/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md
```

This file contains:
- Full feature context
- All 5 tasks (T022-T026)
- Code patterns from Chunks 1 & 2
- Validation checklist
- PR template

## 🔧 Step 2: Setup

**Working directory:**
```bash
cd /home/matt/PROJECTS/PayPlan
```

**Verify prerequisites (Chunks 1 & 2 complete):**
- ✅ `frontend/src/lib/dashboard/aggregation.ts` exists (data layer)
- ✅ `frontend/src/hooks/useDashboardData.ts` exists (React hook)
- ✅ `frontend/src/components/dashboard/EmptyState.tsx` exists (reusable)
- ✅ `frontend/src/components/dashboard/SpendingChart.tsx` exists (reference)

**Create branch:**
```bash
git checkout -b 062-dashboard-chunk3-income
```

## ✅ Step 3: Implement (Use TodoWrite to Track!)

**Tasks from chunk-3-income.md:**
1. **T022**: Create IncomeExpensesChart component (Recharts BarChart)
2. **T023**: Add ARIA labels + hidden table for screen readers
3. **T024**: Implement tooltip with income/expenses/net breakdown
4. **T025**: Create IncomeExpensesChartWidget wrapper with empty state
5. **T026**: Integrate widget into Dashboard.tsx (replace Widget 2 placeholder)

**Use TodoWrite tool at start to track all 5 tasks.**

## 🧪 Step 4: Test

**TypeScript compilation:**
```bash
cd frontend && npx tsc --noEmit
```

**Manual testing (use MCP browser automation):**
```bash
npm run dev  # Start dev server
# Then use mcp__puppeteer__* or mcp__chrome-devtools__* tools to:
# 1. Navigate to http://localhost:5173
# 2. Take screenshot of Dashboard
# 3. Verify Income vs Expenses widget renders
# 4. Check console for errors
```

**Accessibility check:**
- Screen reader reads hidden table
- Keyboard navigation works
- Tooltip accessible

## 📝 Step 5: Create PR

**Commit all changes:**
```bash
git add .
git commit -m "feat(dashboard): Chunk 3 - Income vs Expenses Chart Widget

Implements T022-T026: IncomeExpensesChart with Recharts BarChart,
accessibility, tooltip, empty state, Dashboard integration.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin 062-dashboard-chunk3-income
```

**Create PR using gh CLI:**
```bash
gh pr create --title "feat(dashboard): Chunk 3 - Income vs Expenses Chart (T022-T026)" \
  --body "[See PR template in chunk-3-income.md]" \
  --base 062-short-name-dashboard
```

## 🤖 Step 6: Bot Review Loop

**Wait for bots to review** (Claude Code Bot + CodeRabbit AI)

**Categorize feedback:**
- **CRITICAL/HIGH** → Fix immediately, commit, push
- **MEDIUM/LOW** → Create Linear issue, defer

**Use Linear MCP:**
```bash
mcp__linear__create_issue
# title: "[Bot Suggestion] [description]"
# team: "PayPlan"
# labels: ["bot-suggestion", "chunk-3"]
```

**Iterate until both bots are GREEN ✅**

## ✅ Step 7: After HIL Approval

**Merge back to feature branch:**
```bash
git checkout 062-short-name-dashboard
git merge 062-dashboard-chunk3-income -m "feat(dashboard): merge Chunk 3"
git push origin 062-short-name-dashboard
```

**Update docs:**
1. Edit `specs/062-short-name-dashboard/implementation-prompts/README.md`
2. Mark Chunk 3 as ✅ COMPLETED
3. Remove `chunk-3-income.md`
4. Commit and push

## 📚 Key Files

**Your implementation prompt (READ FIRST):**
- `/home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md`

**Reference (Chunk 2 patterns):**
- `/home/matt/PROJECTS/PayPlan/frontend/src/components/dashboard/SpendingChart.tsx`
- `/home/matt/PROJECTS/PayPlan/frontend/src/components/dashboard/SpendingChartWidget.tsx`

**Data layer:**
- `/home/matt/PROJECTS/PayPlan/frontend/src/lib/dashboard/aggregation.ts`
- `/home/matt/PROJECTS/PayPlan/frontend/src/hooks/useDashboardData.ts`

**Project guidelines:**
- `/home/matt/PROJECTS/PayPlan/CLAUDE.md`

## 🛠️ Claude Code Tools You'll Use

- **Read** - chunk-3-income.md, reference files
- **Write** - IncomeExpensesChart.tsx, IncomeExpensesChartWidget.tsx
- **Edit** - Dashboard.tsx (integrate widget)
- **TodoWrite** - Track all 5 tasks
- **Bash** - Git commands, npm scripts, TypeScript compilation
- **mcp__puppeteer__*** - Browser testing
- **mcp__linear__*** - Create issues for deferred bot feedback

## ✅ Success Criteria

**Chunk 3 is complete when:**
- ✅ All 5 tasks implemented
- ✅ TypeScript compiles (0 errors)
- ✅ Bar chart renders correctly
- ✅ Empty state displays when no data
- ✅ Tooltip works on hover
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ Manual testing passed
- ✅ Both bots GREEN
- ✅ HIL approved
- ✅ Merged to feature branch

---

## 🚀 START HERE

**Your first command (copy/paste this):**

```
Read /home/matt/PROJECTS/PayPlan/specs/062-short-name-dashboard/implementation-prompts/chunk-3-income.md
```

**Then immediately:**

```bash
cd /home/matt/PROJECTS/PayPlan && git checkout -b 062-dashboard-chunk3-income
```

**Then use TodoWrite to create your task list from the implementation prompt.**

---

**Good luck! This is similar to Chunk 2 - you've got this! 🚀**
