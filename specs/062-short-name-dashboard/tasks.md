# Implementation Tasks: Dashboard with Charts

**Feature**: Dashboard with Charts (062-short-name-dashboard)  
**Created**: 2025-10-29  
**Branch**: `062-short-name-dashboard`  
**Linear Issue**: [MMT-85](https://linear.app/mmtu-entertainment/issue/MMT-85/dashboard-with-charts)

---

## Overview

This document provides a granular, dependency-ordered task breakdown for implementing the Dashboard with Charts feature. Tasks are organized by user story (US1-US6) to enable independent implementation and testing of each widget.

**Implementation Strategy**: MVP-first (US1+US2), then incremental delivery (US3-US6).

**Total Estimated Duration**: 3-5 days

---

## Task Summary

| Phase | User Story | Tasks | Est. Time |
|-------|------------|-------|-----------|
| Phase 1 | Setup | 8 tasks | 0.5 days |
| Phase 2 | Foundational | 7 tasks | 0.5 days |
| Phase 3 | US1 (Spending Chart) | 6 tasks | 0.5 days |
| Phase 4 | US2 (Income vs. Expenses) | 5 tasks | 0.5 days |
| Phase 5 | US3 (Recent Transactions) | 4 tasks | 0.25 days |
| Phase 6 | US4 (Upcoming Bills) | 5 tasks | 0.5 days |
| Phase 7 | US5 (Goal Progress) | 5 tasks | 0.5 days |
| Phase 8 | US6 (Gamification) | 6 tasks | 0.5 days |
| Phase 9 | Polish & Integration | 6 tasks | 0.5 days |
| **Total** | **6 user stories** | **52 tasks** | **3-5 days** |

---

## Phase 1: Setup (0.5 days)

**Goal**: Initialize project structure and dependencies

**Prerequisites**: None (foundational tasks)

### Tasks

- [ ] T001 Create TypeScript types for dashboard widgets in frontend/src/types/dashboard.ts
- [ ] T002 [P] Create TypeScript types for chart data in frontend/src/types/chart-data.ts
- [ ] T003 [P] Create TypeScript types for gamification in frontend/src/types/gamification.ts
- [ ] T004 [P] Create TypeScript types for goal progress in frontend/src/types/goal.ts
- [ ] T005 Create Zod schemas for chart data validation in frontend/src/lib/dashboard/schemas.ts
- [ ] T006 [P] Create localStorage utilities for dashboard in frontend/src/lib/dashboard/storage.ts
- [ ] T007 Create empty state component in frontend/src/components/dashboard/EmptyState.tsx
- [ ] T008 Verify all dependencies installed (recharts 2.15.0, zod 4.1.11, lucide-react) by running npm list

**Completion Criteria**:
- All TypeScript types compile without errors
- Zod schemas validate sample data correctly
- Empty state component renders basic message
- All dependencies present in package.json

---

## Phase 2: Foundational (0.5 days)

**Goal**: Implement shared data aggregation layer and custom hook

**Prerequisites**: Phase 1 complete

**Dependencies**: MUST complete before any user stories

### Tasks

- [ ] T009 Implement aggregateSpendingByCategory() function in frontend/src/lib/dashboard/aggregation.ts
- [ ] T010 [P] Implement aggregateIncomeExpenses() function in frontend/src/lib/dashboard/aggregation.ts
- [ ] T011 [P] Implement getRecentTransactions() function in frontend/src/lib/dashboard/aggregation.ts
- [ ] T012 [P] Implement getUpcomingBills() function in frontend/src/lib/dashboard/aggregation.ts
- [ ] T013 [P] Implement getGoalProgress() function in frontend/src/lib/dashboard/aggregation.ts
- [ ] T014 Create useDashboardData() custom hook with useMemo optimization in frontend/src/hooks/useDashboardData.ts
- [ ] T015 Create Dashboard page route in frontend/src/pages/Dashboard.tsx

**Completion Criteria**:
- All aggregation functions correctly transform localStorage data
- useDashboardData hook returns memoized data
- Dashboard page renders without errors (empty widgets OK)
- Performance: Aggregation completes in <500ms for 1,000 transactions

---

## Phase 3: User Story 1 - Spending Breakdown Chart (P0, 0.5 days)

**Goal**: Implement pie chart showing spending by category

**Why P0**: Core value proposition - visualizes spending patterns at a glance

**Independent Test**: User with $500 Groceries, $300 Dining, $200 Transportation sees pie chart with 50%, 30%, 20% breakdown

**Prerequisites**: Phase 2 complete

### Tasks

- [ ] T016 [US1] Create SpendingChart component with Recharts PieChart in frontend/src/components/dashboard/SpendingChart.tsx
- [ ] T017 [US1] Add ARIA labels and hidden table alternative for accessibility in SpendingChart.tsx
- [ ] T018 [US1] Implement tooltip with category details (name, amount, percentage) in SpendingChart.tsx
- [ ] T019 [US1] Add empty state handling ("No spending data yet" message) in SpendingChart.tsx
- [ ] T020 [US1] Wrap SpendingChart in React.memo for performance in SpendingChart.tsx
- [ ] T021 [US1] Integrate SpendingChart into Dashboard page with responsive grid in Dashboard.tsx

**Completion Criteria** (US1):
- ✅ Pie chart displays correct spending percentages for test data
- ✅ Hovering over segments shows category name, amount, and percentage
- ✅ Screen reader reads "Spending by category: Groceries $500 (50%), Dining $300 (30%), Transportation $200 (20%)"
- ✅ Empty state shows when no transactions exist
- ✅ Chart renders in <500ms
- ✅ Mobile (320px), tablet (768px), desktop (1920px) layouts work

**Manual Testing**:
1. Add 3 transactions in different categories
2. Verify pie chart shows correct percentages (sum = 100%)
3. Hover over each segment and verify tooltip shows correct data
4. Test keyboard navigation (Tab to focus, Arrow keys to navigate segments)
5. Test screen reader (NVDA/VoiceOver) reads chart data from hidden table
6. Clear all transactions and verify empty state displays

---

## Phase 4: User Story 2 - Income vs. Expenses Chart (P0, 0.5 days)

**Goal**: Implement bar chart comparing income and expenses

**Why P0**: Fundamental metric for financial health - shows surplus or deficit

**Independent Test**: User with $3,000 income and $2,500 expenses sees bar chart with +$500 surplus indicator

**Prerequisites**: Phase 2 complete (independent of US1)

### Tasks

- [ ] T022 [P] [US2] Create IncomeExpensesChart component with Recharts BarChart in frontend/src/components/dashboard/IncomeExpensesChart.tsx
- [ ] T023 [US2] Add ARIA labels and hidden table alternative for accessibility in IncomeExpensesChart.tsx
- [ ] T024 [US2] Implement color-coded bars (green income, red expenses) with 3:1 contrast in IncomeExpensesChart.tsx
- [ ] T025 [US2] Add surplus/deficit indicator text above chart in IncomeExpensesChart.tsx
- [ ] T026 [US2] Integrate IncomeExpensesChart into Dashboard page in Dashboard.tsx

**Completion Criteria** (US2):
- ✅ Bar chart displays last 6 months of income vs. expenses
- ✅ Surplus ($500) displays in green text above chart
- ✅ Deficit displays in red text (if expenses > income)
- ✅ Screen reader reads "Monthly income vs expenses: Income $3,000, Expenses $2,500, Surplus $500"
- ✅ Empty state shows when no income/expense data exists
- ✅ Chart renders in <500ms
- ✅ Responsive layout works on all breakpoints

**Manual Testing**:
1. Add income transaction ($3,000) and expense transactions ($2,500)
2. Verify bar chart shows both values side-by-side
3. Verify surplus indicator shows +$500 in green
4. Add more expenses to exceed income and verify deficit shows in red
5. Test keyboard navigation and screen reader
6. Clear all transactions and verify empty state

---

## Phase 5: User Story 3 - Recent Transactions Widget (P1, 0.25 days)

**Goal**: Display 5 most recent transactions

**Why P1**: Provides context for charts - users verify data accuracy

**Independent Test**: User with 10 transactions sees the 5 most recent (by date) with date, merchant, amount, category

**Prerequisites**: Phase 2 complete (independent of US1, US2)

### Tasks

- [ ] T027 [P] [US3] Create RecentTransactionsWidget component in frontend/src/components/dashboard/RecentTransactionsWidget.tsx
- [ ] T028 [US3] Implement transaction list with date, description, amount, category icon in RecentTransactionsWidget.tsx
- [ ] T029 [US3] Add click handler to navigate to transaction details page in RecentTransactionsWidget.tsx
- [ ] T030 [US3] Integrate RecentTransactionsWidget into Dashboard page in Dashboard.tsx

**Completion Criteria** (US3):
- ✅ Widget displays 5 most recent transactions ordered by date (newest first)
- ✅ Each transaction shows date, description, amount (formatted as currency), category icon
- ✅ Clicking a transaction navigates to transaction details page
- ✅ Keyboard navigation works (Tab to focus, Enter to activate)
- ✅ Empty state shows "No transactions yet" with "Add Transaction" CTA
- ✅ Widget loads in <300ms

**Manual Testing**:
1. Add 10 transactions with different dates
2. Verify widget shows only the 5 most recent
3. Click on a transaction and verify navigation works
4. Test keyboard navigation (Tab through transactions, Enter to open)
5. Clear all transactions and verify empty state

---

## Phase 6: User Story 4 - Upcoming Bills Widget (P1, 0.5 days)

**Goal**: Display bills due in next 7 days

**Why P1**: Prevents late fees and cash crunches - critical for BNPL users

**Independent Test**: User with $200 BNPL payment (due in 3 days) and $50 subscription (due in 5 days) sees both listed with due dates highlighted

**Prerequisites**: Phase 2 complete (independent of US1, US2, US3)

### Tasks

- [ ] T031 [P] [US4] Create UpcomingBillsWidget component in frontend/src/components/dashboard/UpcomingBillsWidget.tsx
- [ ] T032 [US4] Implement recurring transaction detection logic in frontend/src/lib/dashboard/aggregation.ts
- [ ] T033 [US4] Add urgency badges ("Due Today" red, "Due in 1-3 days" yellow) in UpcomingBillsWidget.tsx
- [ ] T034 [US4] Add screen reader announcements for bill urgency in UpcomingBillsWidget.tsx
- [ ] T035 [US4] Integrate UpcomingBillsWidget into Dashboard page in Dashboard.tsx

**Completion Criteria** (US4):
- ✅ Widget displays bills due within next 7 days, ordered by due date (soonest first)
- ✅ "Due Today" badge displays in red for bills due today
- ✅ "Due in 1-3 days" badge displays in yellow for near-term bills
- ✅ Screen reader announces "Urgent: Bill due today" for overdue bills
- ✅ Empty state shows "No bills due in the next 7 days"
- ✅ Widget loads in <300ms

**Manual Testing**:
1. Add recurring transactions (same description + amount in last 30 days)
2. Verify widget shows upcoming occurrences within next 7 days
3. Verify urgency badges display correctly (red for today, yellow for 1-3 days)
4. Test screen reader announces urgency levels
5. Test empty state when no bills are upcoming

---

## Phase 7: User Story 5 - Goal Progress Widget (P1, 0.5 days)

**Goal**: Display progress bars for up to 3 active savings goals

**Why P1**: Motivates behavior change - progress visibility increases goal completion by 22%

**Independent Test**: User with Emergency Fund goal ($1,000 target, $400 saved) sees progress bar at 40% with "$600 to go" text

**Prerequisites**: Phase 2 complete (independent of US1-US4)

### Tasks

- [ ] T036 [P] [US5] Create GoalProgressWidget component in frontend/src/components/dashboard/GoalProgressWidget.tsx
- [ ] T037 [US5] Implement progress bars with percentage and remaining amount in GoalProgressWidget.tsx
- [ ] T038 [US5] Add status indicators (on-track green, at-risk yellow, completed green with celebration) in GoalProgressWidget.tsx
- [ ] T039 [US5] Add conditional rendering (hide widget if goals feature not implemented) in GoalProgressWidget.tsx
- [ ] T040 [US5] Integrate GoalProgressWidget into Dashboard page in Dashboard.tsx

**Completion Criteria** (US5):
- ✅ Widget displays up to 3 goals with progress bars showing percentage complete
- ✅ Progress bar shows "$600 to go" text for $400 saved of $1,000 target
- ✅ Completed goals show celebration badge and "Goal Complete!" message
- ✅ Screen reader reads "Emergency Fund: $400 of $1,000 saved, 40% complete, $600 remaining"
- ✅ Widget is hidden if goals feature (payplan_goals_v1) does not exist
- ✅ Empty state shows "Create your first savings goal" CTA

**Manual Testing**:
1. Create 3 goals with different progress levels (25%, 50%, 100%)
2. Verify progress bars show correct percentages
3. Verify completed goal shows celebration badge
4. Test screen reader reads goal details
5. Remove goals feature (delete payplan_goals_v1) and verify widget is hidden
6. Test empty state when no goals exist

---

## Phase 8: User Story 6 - Gamification Widget (P2, 0.5 days)

**Goal**: Display streak, insights, and recent wins

**Why P2**: Increases engagement by 2x - makes budgeting fun and motivating

**Independent Test**: User with 14-day streak sees "14-day budget review streak! 🔥", "You spend 40% more on weekends" insight, and "You're $200 under budget!" win

**Prerequisites**: Phase 2 complete (independent of US1-US5)

### Tasks

- [ ] T041 [P] [US6] Create GamificationWidget component in frontend/src/components/dashboard/GamificationWidget.tsx
- [ ] T042 [US6] Implement streak tracking logic (update on dashboard view) in frontend/src/lib/dashboard/gamification.ts
- [ ] T043 [US6] Implement personalized insights algorithm (spending patterns) in frontend/src/lib/dashboard/gamification.ts
- [ ] T044 [US6] Implement recent wins detection (under budget, debt payments) in frontend/src/lib/dashboard/gamification.ts
- [ ] T045 [US6] Add localStorage persistence for streak data (payplan_gamification_v1) in frontend/src/lib/dashboard/storage.ts
- [ ] T046 [US6] Integrate GamificationWidget into Dashboard page in Dashboard.tsx

**Completion Criteria** (US6):
- ✅ Widget displays current streak count with fire emoji (e.g., "🔥 14-day streak!")
- ✅ Widget shows 1-2 personalized insights based on spending patterns
- ✅ Widget shows 1-3 recent wins (under budget, debt payments, etc.)
- ✅ Streak increments when user views dashboard on consecutive days
- ✅ Screen reader reads "Streak: 14 days" for gamification elements
- ✅ Widget is hidden when no streak or insights exist (not shown as empty)
- ✅ Streak data persists in localStorage (payplan_gamification_v1)

**Manual Testing**:
1. View dashboard for 3 consecutive days and verify streak increments to 3
2. Add transactions with spending patterns (e.g., more on weekends) and verify insight displays
3. Stay under budget for a category and verify "recent win" displays
4. Test screen reader reads streak and insights
5. Skip a day and verify streak resets to 1
6. Clear gamification data and verify widget is hidden (not empty state)

---

## Phase 9: Polish & Integration (0.5 days)

**Goal**: Final integration, accessibility testing, performance optimization

**Prerequisites**: All user stories (US1-US6) complete

### Tasks

- [ ] T047 Implement responsive grid layout for dashboard widgets in Dashboard.tsx
- [ ] T048 Add loading skeletons for all widgets while data loads in Dashboard.tsx
- [ ] T049 Verify WCAG 2.1 AA compliance (keyboard nav, screen reader, color contrast) across all widgets
- [ ] T050 Optimize localStorage reads with debouncing in useDashboardData.ts
- [ ] T051 Add error boundary for dashboard page to handle localStorage failures in Dashboard.tsx
- [ ] T052 Set Dashboard as default route in App.tsx routing configuration

**Completion Criteria** (Integration):
- ✅ Dashboard displays all 6 widgets in responsive grid (mobile: stacked, tablet: 2-col, desktop: 3-col)
- ✅ Loading skeletons display while data aggregates
- ✅ Dashboard loads in <1 second on 3G connection
- ✅ All widgets render in <500ms after data load
- ✅ Keyboard navigation works across all widgets (Tab, Shift+Tab, Enter, Arrow keys)
- ✅ Screen reader announces all widget content correctly
- ✅ Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI elements)
- ✅ Error boundary catches localStorage failures and shows user-friendly error

**Manual Testing (Full Dashboard)**:
1. Clear all data and verify all empty states display
2. Add sample data (10 transactions, 3 categories, 2 goals)
3. Verify dashboard loads in <1 second
4. Test keyboard navigation through all widgets
5. Test screen reader reads all widget content
6. Test responsive layout on mobile (320px), tablet (768px), desktop (1920px)
7. Simulate localStorage failure (quota exceeded) and verify error boundary catches it
8. Measure performance with React DevTools Profiler (should be <500ms per widget)

---

## Dependencies Graph

### User Story Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKING for all user stories
    ↓
    ├→ Phase 3 (US1: Spending Chart) [P0]
    ├→ Phase 4 (US2: Income vs. Expenses) [P0]
    ├→ Phase 5 (US3: Recent Transactions) [P1]
    ├→ Phase 6 (US4: Upcoming Bills) [P1]
    ├→ Phase 7 (US5: Goal Progress) [P1]
    └→ Phase 8 (US6: Gamification) [P2]
    ↓
Phase 9 (Polish & Integration) ← Requires all user stories
```

**Key Insight**: User stories US1-US6 are **independent** and can be implemented in parallel after Phase 2 is complete.

---

## Parallel Execution Opportunities

### After Phase 1 Complete

**Parallelizable**:
- T009, T010, T011, T012, T013 (all aggregation functions, different files)

### After Phase 2 Complete

**Parallelizable** (all user stories are independent):
- T016-T021 (US1: Spending Chart)
- T022-T026 (US2: Income vs. Expenses)
- T027-T030 (US3: Recent Transactions)
- T031-T035 (US4: Upcoming Bills)
- T036-T040 (US5: Goal Progress)
- T041-T046 (US6: Gamification)

**Example Parallel Workflow**:
1. Complete Phase 1 + Phase 2 (foundational)
2. Split into 3 parallel tracks:
   - Track A: Implement US1 (Spending Chart)
   - Track B: Implement US2 (Income vs. Expenses)
   - Track C: Implement US3 (Recent Transactions)
3. After Track A/B/C complete, split again:
   - Track D: Implement US4 (Upcoming Bills)
   - Track E: Implement US5 (Goal Progress)
   - Track F: Implement US6 (Gamification)
4. Merge all tracks for Phase 9 (Polish & Integration)

---

## MVP Scope Recommendation

**Minimum Viable Dashboard** (1-2 days):
- ✅ Phase 1: Setup
- ✅ Phase 2: Foundational
- ✅ Phase 3: US1 (Spending Chart) [P0]
- ✅ Phase 4: US2 (Income vs. Expenses) [P0]
- ✅ Phase 9: Polish & Integration

**Rationale**: US1 and US2 are P0 widgets that provide core value (spending insights + financial health). This delivers a functional dashboard quickly. US3-US6 can be added incrementally in follow-up PRs.

**Incremental Delivery** (after MVP):
- **PR 1** (MVP): US1 + US2 (P0 widgets)
- **PR 2**: US3 (Recent Transactions)
- **PR 3**: US4 (Upcoming Bills) + US5 (Goal Progress)
- **PR 4**: US6 (Gamification)

---

## Implementation Notes

### Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Dashboard load | <1s | Chrome DevTools Network tab (3G throttling) |
| Chart rendering | <500ms | React DevTools Profiler |
| Data aggregation | <500ms | console.time() in aggregation functions |
| Widget updates | <300ms | React DevTools Profiler |

### Accessibility Checklist

For each widget, verify:
- [ ] ARIA labels on all interactive elements
- [ ] Hidden `<table>` alternative for charts
- [ ] Keyboard navigation (Tab, Shift+Tab, Enter, Arrow keys)
- [ ] Screen reader announces all content (test with NVDA/VoiceOver)
- [ ] Color contrast (4.5:1 text, 3:1 UI elements)
- [ ] Focus indicators visible (2px outline)
- [ ] No reliance on color alone (use icons + text)

### Error Handling

For each widget, handle:
- **Empty state**: Show helpful message + CTA
- **localStorage failure**: Error boundary catches and shows user-friendly error
- **Invalid data**: Zod schema validation catches and logs error
- **Missing dependencies**: Conditional rendering (hide widget if feature not implemented)

---

## Testing Strategy (Phase 1: Manual)

**Per constitution, NO automated tests required in Phase 1.** Focus on manual testing with real data scenarios.

### Test Data Sets

Create 3 test scenarios:

1. **Empty User** (new user):
   - 0 transactions, 0 categories, 0 goals
   - Expected: All empty states display with CTAs

2. **Typical User**:
   - 50 transactions across 5 categories (current month)
   - 3 goals (1 completed, 1 on-track, 1 at-risk)
   - 2 recurring bills (next 7 days)
   - Expected: All widgets display with real data

3. **Power User**:
   - 10,000 transactions across 20 categories (12 months)
   - 10 goals (various states)
   - 5 recurring bills
   - Expected: Dashboard loads in <1s, no performance degradation

### Manual Test Scenarios

**Scenario 1: First-Time User Experience**
1. Clear all localStorage data
2. Navigate to dashboard
3. ✅ Verify all widgets show empty states
4. ✅ Verify CTAs ("Add Transaction", "Create Goal") are visible
5. Click "Add Transaction" CTA
6. ✅ Verify navigation to transaction entry page

**Scenario 2: Data Visualization Accuracy**
1. Add 5 transactions: $500 Groceries, $300 Dining, $200 Transportation, $100 Entertainment, $50 Utilities
2. Navigate to dashboard
3. ✅ Verify Spending Chart shows 5 segments with correct percentages (42%, 25%, 17%, 8%, 4%)
4. ✅ Verify Income vs. Expenses chart shows correct values
5. ✅ Verify Recent Transactions widget shows all 5 transactions

**Scenario 3: Accessibility Testing**
1. Navigate to dashboard with keyboard only (no mouse)
2. ✅ Tab through all widgets (focus visible on each)
3. ✅ Arrow keys navigate chart segments
4. ✅ Enter key activates widget items (transactions, goals)
5. Test with screen reader (NVDA on Windows, VoiceOver on Mac)
6. ✅ Screen reader announces all chart data from hidden tables
7. ✅ Screen reader announces widget headings and content

**Scenario 4: Performance Testing**
1. Add 10,000 transactions (via script)
2. Navigate to dashboard
3. ✅ Measure load time with Chrome DevTools (should be <1s)
4. ✅ Measure chart rendering time with React Profiler (should be <500ms)
5. ✅ Verify no visible lag or janky animations

**Scenario 5: Responsive Layout Testing**
1. Test on mobile (320px width):
   - ✅ Widgets stack vertically
   - ✅ Touch targets are 44x44px minimum
   - ✅ No horizontal scrolling
2. Test on tablet (768px width):
   - ✅ Widgets display in 2-column grid
3. Test on desktop (1920px width):
   - ✅ Widgets display in 3-column grid

---

## Definition of Done

**A user story is DONE when:**

1. ✅ All tasks for that story are completed
2. ✅ Widget displays correctly with test data
3. ✅ Empty state displays when no data exists
4. ✅ Keyboard navigation works (Tab, Shift+Tab, Enter, Arrow keys)
5. ✅ Screen reader announces widget content correctly
6. ✅ Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
7. ✅ Widget renders in <500ms
8. ✅ No console errors or warnings
9. ✅ Code follows TypeScript strict mode (no `any` types)
10. ✅ Manual testing confirms all acceptance scenarios pass

**The ENTIRE FEATURE is DONE when:**

1. ✅ All 6 user stories are DONE
2. ✅ Dashboard loads in <1 second on 3G connection
3. ✅ All 52 tasks are completed
4. ✅ Responsive layout works on mobile (320px), tablet (768px), desktop (1920px)
5. ✅ Error boundary handles localStorage failures gracefully
6. ✅ Dashboard is set as default route in App.tsx
7. ✅ PR created and linked to Linear MMT-85
8. ✅ Bot reviews completed (Claude Code Bot + CodeRabbit AI)
9. ✅ HIL approval received
10. ✅ Feature merged to main branch

---

## File Paths Reference

### Types (frontend/src/types/)
- `dashboard.ts` - DashboardWidget, SpendingChartWidget, IncomeExpensesChartWidget, etc.
- `chart-data.ts` - SpendingChartData, IncomeExpensesChartData, MonthData
- `gamification.ts` - GamificationData, StreakData, RecentWin, PersonalizedInsight
- `goal.ts` - GoalProgress

### Logic (frontend/src/lib/dashboard/)
- `schemas.ts` - Zod validation schemas
- `aggregation.ts` - Data aggregation functions (aggregateSpendingByCategory, aggregateIncomeExpenses, etc.)
- `storage.ts` - localStorage read/write utilities
- `gamification.ts` - Gamification logic (streak tracking, insights, wins detection)

### Hooks (frontend/src/hooks/)
- `useDashboardData.ts` - Custom hook with useMemo optimization

### Components (frontend/src/components/dashboard/)
- `DashboardPage.tsx` - Main dashboard layout
- `SpendingChart.tsx` - Pie chart widget (US1)
- `IncomeExpensesChart.tsx` - Bar chart widget (US2)
- `RecentTransactionsWidget.tsx` - Transaction list widget (US3)
- `UpcomingBillsWidget.tsx` - Bills widget (US4)
- `GoalProgressWidget.tsx` - Goals widget (US5)
- `GamificationWidget.tsx` - Gamification widget (US6)
- `EmptyState.tsx` - Shared empty state component

### Pages (frontend/src/pages/)
- `Dashboard.tsx` - Dashboard route page

---

## Next Steps After Implementation

1. **Create PR**:
   - Title: "feat(dashboard): Add Dashboard with Charts (MMT-85)"
   - Description: Link to spec, list all 6 user stories implemented
   - Link to Linear MMT-85

2. **Bot Review Loop**:
   - Wait for Claude Code Bot + CodeRabbit AI reviews
   - Fix CRITICAL and HIGH issues immediately
   - Defer MEDIUM/LOW issues to Linear
   - Iterate until both bots are green

3. **HIL Approval**:
   - Notify HIL (Human-in-the-Loop) for final review
   - Address any HIL feedback
   - Wait for approval

4. **Merge**:
   - After HIL approval, merge PR to main
   - Delete feature branch `062-short-name-dashboard`
   - Mark Linear MMT-85 as "Done"

5. **Post-Launch**:
   - Monitor for user-reported issues
   - Gather feedback on dashboard usability
   - Plan Phase 2 features (custom date ranges, drill-down filters)

---

**Tasks Status**: ✓ Complete (52 tasks generated)  
**Ready for**: Implementation (`/speckit.implement` or manual execution)

