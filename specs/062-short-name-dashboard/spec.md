# Feature Specification: Dashboard with Charts

**Feature Branch**: `062-short-name-dashboard`
**Created**: 2025-10-29
**Status**: Draft
**Linear Issue**: [MMT-85](https://linear.app/mmtu-entertainment/issue/MMT-85/dashboard-with-charts)
**Epic**: [MMT-69 - Budgeting App MVP](https://linear.app/mmtu-entertainment/issue/MMT-69/epic-budgeting-app-mvp)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Spending Breakdown by Category (Priority: P0)

As a user, I want to see a visual breakdown of my spending by category so I can quickly understand where my money goes.

**Why this priority**: Visual spending insights are the core value proposition of the dashboard. Without this, users cannot make informed financial decisions. This is the most critical dashboard widget for behavior change.

**Independent Test**: User with $500 in Groceries, $300 in Dining, and $200 in Transportation sees a pie chart showing the breakdown with percentages (50%, 30%, 20%). This delivers immediate value by making spending patterns visible at a glance.

**Acceptance Scenarios**:

1. **Given** I have transactions in multiple categories, **When** I view the dashboard, **Then** I see a pie chart showing spending breakdown by category
2. **Given** I have no transactions, **When** I view the dashboard, **Then** I see a message "No spending data yet" with a call-to-action to add transactions
3. **Given** I have spending data, **When** I hover over a pie chart segment, **Then** I see the category name, amount, and percentage
4. **Given** I am using a screen reader, **When** I navigate to the pie chart, **Then** I hear "Spending by category: Groceries $500 (50%), Dining $300 (30%), Transportation $200 (20%)"
5. **Given** I view the chart on mobile, **When** I tap a segment, **Then** I see the category details in a tooltip

---

### User Story 2 - Compare Monthly Income vs. Expenses (Priority: P0)

As a user, I want to see my monthly income compared to my expenses so I can track whether I'm living within my means.

**Why this priority**: Income vs. expenses is the fundamental metric for financial health. Users need this comparison to understand cash flow and avoid overspending. This is table-stakes for any budgeting app.

**Independent Test**: User with $3,000 income and $2,500 expenses sees a bar chart showing both values side-by-side with a +$500 surplus indicator. This delivers immediate value by showing whether the user is in surplus or deficit.

**Acceptance Scenarios**:

1. **Given** I have income and expense transactions, **When** I view the dashboard, **Then** I see a bar chart comparing income vs. expenses for the current month
2. **Given** I have more expenses than income, **When** I view the chart, **Then** I see expenses in red with a deficit amount displayed
3. **Given** I have more income than expenses, **When** I view the chart, **Then** I see income in green with a surplus amount displayed
4. **Given** I have no income or expenses, **When** I view the dashboard, **Then** I see a message "No income/expense data yet"
5. **Given** I am using a screen reader, **When** I navigate to the bar chart, **Then** I hear "Monthly income vs expenses: Income $3,000, Expenses $2,500, Surplus $500"

---

### User Story 3 - Review Recent Transactions (Priority: P1)

As a user, I want to see my 5 most recent transactions on the dashboard so I can quickly review my latest spending without navigating away.

**Why this priority**: Recent transactions provide context for the charts. Users need to verify that the data feeding the visualizations is accurate. This supports trust in the dashboard data.

**Independent Test**: User with 10 transactions sees the 5 most recent (by date) displayed in a widget with date, merchant, amount, and category. This delivers immediate value by providing quick access to recent activity.

**Acceptance Scenarios**:

1. **Given** I have 10+ transactions, **When** I view the dashboard, **Then** I see the 5 most recent transactions ordered by date (newest first)
2. **Given** I have fewer than 5 transactions, **When** I view the dashboard, **Then** I see all transactions up to 5
3. **Given** I have no transactions, **When** I view the dashboard, **Then** I see a message "No transactions yet" with a call-to-action to add transactions
4. **Given** I see a transaction in the widget, **When** I click on it, **Then** I navigate to the full transaction details page
5. **Given** I am using keyboard navigation, **When** I tab through the transactions, **Then** each transaction is focusable and activatable with Enter

---

### User Story 4 - See Upcoming Bills (Priority: P1)

As a user, I want to see my upcoming bills for the next 7 days so I can plan my cash flow and avoid missed payments.

**Why this priority**: Upcoming bills help users avoid late fees and cash crunches. This is particularly critical for BNPL users (PayPlan's target audience) who juggle multiple payment schedules. Proactive visibility reduces stress.

**Independent Test**: User with a $200 BNPL payment due in 3 days and a $50 subscription due in 5 days sees both listed in the upcoming bills widget with due dates highlighted. This delivers immediate value by preventing late payments.

**Acceptance Scenarios**:

1. **Given** I have bills due in the next 7 days, **When** I view the dashboard, **Then** I see a list of upcoming bills ordered by due date (soonest first)
2. **Given** I have a bill due today, **When** I view the dashboard, **Then** I see it highlighted with "Due Today" badge in red
3. **Given** I have a bill due in 1-3 days, **When** I view the dashboard, **Then** I see it with a warning badge in yellow
4. **Given** I have no upcoming bills, **When** I view the dashboard, **Then** I see a message "No bills due in the next 7 days"
5. **Given** I am using a screen reader, **When** I navigate to upcoming bills, **Then** I hear each bill with due date and urgency level

---

### User Story 5 - Track Goal Progress (Priority: P1)

As a user, I want to see progress toward my savings goals on the dashboard so I stay motivated and track my progress without navigating to a separate page.

**Why this priority**: Goal visibility drives behavior change. Research shows progress bars increase goal completion by 22%. Displaying goals on the dashboard keeps them top-of-mind and reinforces positive financial habits.

**Independent Test**: User with an Emergency Fund goal ($1,000 target, $400 saved) sees a progress bar showing 40% completion with "$600 to go" displayed. This delivers immediate value by visualizing progress and motivating continued saving.

**Acceptance Scenarios**:

1. **Given** I have active savings goals, **When** I view the dashboard, **Then** I see up to 3 goals with progress bars showing percentage complete
2. **Given** I have completed a goal, **When** I view the dashboard, **Then** I see a celebration badge and "Goal Complete!" message
3. **Given** I have no goals, **When** I view the dashboard, **Then** I see a call-to-action to "Create your first savings goal"
4. **Given** I have more than 3 goals, **When** I view the dashboard, **Then** I see the 3 most recently updated goals with a "View all goals" link
5. **Given** I am using a screen reader, **When** I navigate to goal progress, **Then** I hear "Emergency Fund: $400 of $1,000 saved, 40% complete, $600 remaining"

---

### User Story 6 - See Gamification Elements (Priority: P2)

As a user, I want to see my budget review streak, personalized insights, and recent wins so I feel motivated and engaged with my financial progress.

**Why this priority**: Gamification increases engagement by 2x (per constitution research). Streaks, insights, and wins provide positive reinforcement and make budgeting feel less like a chore. This is a differentiator from competitors like YNAB.

**Independent Test**: User who has reviewed their budget for 14 consecutive days sees "14-day budget review streak! 🔥" at the top of the dashboard. Below, they see "You spend 40% more on weekends" insight and "You're $200 under budget this month!" win. This delivers immediate value by celebrating progress and providing actionable insights.

**Acceptance Scenarios**:

1. **Given** I have reviewed my budget for consecutive days, **When** I view the dashboard, **Then** I see my current streak count with a fire emoji
2. **Given** I have spending patterns detected, **When** I view the dashboard, **Then** I see 1-2 personalized insights based on my data
3. **Given** I am under budget, **When** I view the dashboard, **Then** I see a "recent win" message celebrating my progress
4. **Given** I have no streak or insights yet, **When** I view the dashboard, **Then** these sections are hidden (not shown as empty)
5. **Given** I am using a screen reader, **When** I navigate to gamification elements, **Then** I hear each element with appropriate context (e.g., "Streak: 14 days")

---

### Edge Cases

- **What happens when a user has no data (new user)?**
  → Show empty state for each widget with call-to-action messages (e.g., "Add your first transaction to see spending breakdown")

- **What happens when a user has only income or only expenses (no comparison)?**
  → Show single bar in income vs. expenses chart with message "Add [income/expenses] to see comparison"

- **What happens when a user has 100+ categories?**
  → Pie chart shows top 10 categories by spending, with "Other" category aggregating the rest

- **What happens when the dashboard takes >1 second to load?**
  → Show loading skeleton for each widget to indicate data is being fetched

- **What happens when a user resizes the browser window?**
  → Charts reflow responsively (mobile: stacked, tablet: 2-column, desktop: 3-column grid)

- **What happens when a user has a goal that's overdue?**
  → Goal progress bar turns red with "Goal date passed" message

- **What happens when localStorage is full?**
  → Show error banner: "Storage limit reached. Archive old transactions or export data."

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dashboard page as the default landing page after login/app launch
- **FR-002**: System MUST show a spending breakdown by category as a pie chart
- **FR-003**: System MUST show monthly income vs. expenses as a bar chart
- **FR-004**: System MUST show the 5 most recent transactions in a widget
- **FR-005**: System MUST show upcoming bills due within the next 7 days in a widget
- **FR-006**: System MUST show up to 3 active savings goals with progress bars in a widget
- **FR-007**: System MUST display budget review streak count when user has consecutive days of activity
- **FR-008**: System MUST display personalized insights based on spending patterns (e.g., "You spend 40% more on weekends")
- **FR-009**: System MUST display recent wins (e.g., "You're $200 under budget this month!")
- **FR-010**: System MUST aggregate data from localStorage (categories, budgets, transactions, goals)
- **FR-011**: System MUST load the complete dashboard in under 1 second
- **FR-012**: System MUST render all charts in under 500 milliseconds
- **FR-013**: System MUST be fully responsive (mobile, tablet, desktop layouts)
- **FR-014**: System MUST meet WCAG 2.1 AA accessibility standards (keyboard navigation, screen reader support, color contrast)
- **FR-015**: System MUST show appropriate empty states when user has no data
- **FR-016**: System MUST handle localStorage read errors gracefully with user-friendly error messages
- **FR-017**: System MUST allow users to click on chart segments to drill down into details
- **FR-018**: System MUST allow users to click on widget items (transactions, bills, goals) to view full details
- **FR-019**: System MUST show loading skeletons while data is being fetched
- **FR-020**: System MUST refresh dashboard data when user navigates back from other pages

### Key Entities *(include if feature involves data)*

- **DashboardWidget**: Represents a single widget on the dashboard
  - Attributes: id (string), type (enum: chart, list, metric, gamification), title (string), data (unknown), configuration (object), order (number)
  - Relationships: Belongs to Dashboard

- **ChartData**: Represents aggregated data for chart visualization
  - Attributes: chartType (enum: pie, bar, line), labels (string[]), datasets (object[]), colors (string[]), totals (number[])
  - Relationships: Used by DashboardWidget

- **SpendingCategory** (existing): Used for pie chart breakdown
  - Attributes: id, name, iconName, color, isDefault, createdAt, updatedAt
  - Relationships: Has many Transactions

- **Transaction** (existing): Used for recent transactions widget
  - Attributes: id, amount, description, date, categoryId, createdAt
  - Relationships: Belongs to Category

- **Budget** (existing): Used for income vs. expenses calculation
  - Attributes: id, categoryId, amount, period, createdAt, updatedAt
  - Relationships: Belongs to Category

- **Goal** (not yet implemented): Used for goal progress widget
  - Attributes: id, name, targetAmount, currentAmount, targetDate, status, createdAt, updatedAt
  - Relationships: None (standalone entity)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the dashboard in under 1 second from app launch
- **SC-002**: Users can understand their spending patterns in under 30 seconds (measured via user testing)
- **SC-003**: Dashboard displays accurately for users with 0 transactions, 100 transactions, and 1,000+ transactions
- **SC-004**: Dashboard works on mobile (320px width), tablet (768px width), and desktop (1920px width) without horizontal scrolling
- **SC-005**: All charts render in under 500 milliseconds (measured via performance profiling)
- **SC-006**: Dashboard passes WCAG 2.1 AA accessibility audit (keyboard navigation, screen reader, color contrast)
- **SC-007**: 90% of users successfully navigate from dashboard to transaction details on first attempt (measured via user testing)
- **SC-008**: Dashboard load time remains under 1 second even with 10,000+ transactions in localStorage
- **SC-009**: Empty states clearly guide users to add data (measured via user feedback)
- **SC-010**: Dashboard data refreshes automatically when user adds/edits transactions, categories, or budgets

---

## Technical Constraints

### Performance
- Dashboard must load in <1 second on 3G connection
- Charts must render in <500ms after data load
- Data aggregation must be memoized to avoid unnecessary recalculations
- localStorage reads must be debounced to 500ms to avoid excessive I/O

### Accessibility
- All charts must have ARIA labels and roles
- Keyboard navigation: Tab (next widget), Shift+Tab (previous widget), Enter (drill down), Arrow keys (navigate chart segments)
- Screen reader support: Descriptive labels for all widgets and chart data points
- Color contrast: 4.5:1 for text, 3:1 for chart segments
- Charts must not rely on color alone (use patterns, labels, and icons)
- Focus indicators must be visible (2px outline)

### Data Storage
- Dashboard reads from existing localStorage keys: `payplan_categories_v1`, `payplan_budgets_v1`, `payplan_transactions_v1`
- No new localStorage keys required (dashboard aggregates existing data)
- Maximum localStorage usage: 5 MB (warn at 80%, block at 95%)

### Browser Compatibility
- Must work in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Must work on mobile (iOS Safari, Android Chrome)
- Must degrade gracefully in older browsers (show message if charts unsupported)

---

## Out of Scope (Phase 1)

The following features are explicitly OUT OF SCOPE for this initial implementation:

- **Custom date ranges** (only "current month" and "last 30 days" in Phase 1) - Defer to Phase 2
- **Net worth graph** (requires account tracking not yet implemented) - Defer to Phase 2
- **Export dashboard to PDF** - Defer to Phase 2
- **Real-time cross-tab sync** (dashboard updates when data changes in another tab) - Defer to Phase 2
- **Customizable widget layout** (drag-and-drop reordering) - Defer to Phase 3
- **Historical trend analysis** (3, 6, 12 months) - Defer to MMT-66 (Analytics)
- **Automated tests** - Manual testing only in Phase 1 (per constitution)
- **Drill-down filters** (click category to filter transactions) - Defer to Phase 2

---

## Dependencies

### External Dependencies
- **Recharts** (2.15.0) - For accessible, responsive chart components (pie, bar, line)
- **Zod** (4.1.11) - For data validation (if needed for dashboard configuration)
- **Radix UI** - For accessible widget components (tooltips, popovers)
- **React** (19.1.1) - For dashboard page and widget components
- **Tailwind CSS** (4.1.13) - For responsive layout and styling

### Internal Dependencies
- **Categories** (Feature 061) - Must be implemented for spending breakdown chart
- **Budgets** (Feature 061) - Must be implemented for income vs. expenses chart
- **Transactions** (Feature 061) - Must be implemented for recent transactions widget and all calculations
- **Goals** (Feature MMT-64) - Should be implemented for goal progress widget (gracefully degrade if not available)
- **localStorage** - Must be available and have sufficient space
- **Navigation system** (Feature 017) - Must support Dashboard as default route

### Constitution Requirements
- **Privacy-First** (Principle I): All data read from localStorage, no server required
- **Accessibility-First** (Principle II): WCAG 2.1 AA compliance for all charts and widgets
- **Visual-First** (Principle IV): Dashboard is the primary view, charts make data understandable at a glance
- **Mobile-First** (Principle V): Responsive design, touch-friendly widgets (44x44px minimum)
- **Quality-First** (Principle VI, Phase 1): Manual testing only, ship fast (<2 weeks)
- **Performance** (Phase 1): <1s load time, <500ms chart rendering (per constitution)

---

## Assumptions

1. **Chart library**: Recharts is the default choice (React-friendly, accessible, responsive)
2. **Data retention**: Dashboard shows current month and last 30 days by default
3. **Widget priority**: Spending breakdown and income vs. expenses are most critical (P0), others are P1-P2
4. **Empty state behavior**: Widgets show helpful messages and call-to-actions when no data exists
5. **Error handling**: localStorage read failures show user-friendly error messages with recovery options
6. **Performance**: Standard web app expectations (no users have complained about speed issues yet)
7. **Gamification scope**: Basic streak tracking and insights in Phase 1, advanced gamification in Phase 2
8. **Goal tracking**: If goals feature (MMT-64) is not implemented, goal progress widget is hidden
9. **Mobile layout**: Widgets stack vertically on mobile (<768px), 2-column on tablet, 3-column on desktop
10. **Color scheme**: Follow existing PayPlan brand colors (defined in Tailwind config)

---

## References

- **Constitution**: `memory/constitution.md` (Tier 0 Feature #3, Visual-First principle)
- **Linear Issue**: [MMT-85](https://linear.app/mmtu-entertainment/issue/MMT-85/dashboard-with-charts)
- **Epic**: [MMT-69 - Budgeting App MVP](https://linear.app/mmtu-entertainment/issue/MMT-69/epic-budgeting-app-mvp)
- **Feature 061**: `specs/061-spending-categories-budgets/spec.md` (Categories, Budgets, Transactions)
- **Recharts Documentation**: https://recharts.org/ (for chart implementation reference)
- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aa (accessibility compliance)
