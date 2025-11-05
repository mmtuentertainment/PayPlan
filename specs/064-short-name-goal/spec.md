# Feature Specification: Goal Tracking Dashboard

**Feature Branch**: `064-short-name-goal`
**Created**: 2025-11-05
**Status**: Draft
**Input**: User description: "Goal Tracking Dashboard for PayPlan budgeting app with research-validated UX including progress bars (Goal Gradient Effect psychology), traffic light colors (green/yellow/red status), Shadcn UI metric cards, quick-add contribution buttons, and WCAG 2.2 AA accessibility"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Goal Dashboard Overview (Priority: P1) 🎯 MVP

As a **low-income earner with multiple savings goals**, I need **to see an at-a-glance dashboard of all my goals with key metrics** so that **I can quickly understand my overall progress without navigating through individual goals**.

**Why this priority**: The dashboard overview is the entry point for the entire feature. Users need immediate visual feedback on their financial progress. Research shows that visual dashboards increase user engagement by 2x and help users understand their finances in under 30 seconds (per constitution research). This is the foundational value proposition.

**Independent Test**: User with 3 active goals sees dashboard with 4 metric cards showing "3 Total Goals", "$750 Total Saved", "2 Goals On Track", "58% Average Progress", plus list of all goals with progress bars. This delivers immediate value by providing a complete financial snapshot.

**Acceptance Scenarios**:

1. **Given** I have 3 active goals (Emergency: $400/$1000, Vacation: $250/$500, Debt: $100/$2500), **When** I navigate to goals dashboard, **Then** I see 4 metric cards displaying: "3 Total Goals", "$750 Total Saved", "2 On Track" (Emergency + Vacation >25%), "25% Avg Progress"
2. **Given** I have no goals, **When** I view the dashboard, **Then** I see an empty state with message "Create your first savings goal to get started" and a "Create Goal" button
3. **Given** I am using a screen reader, **When** I navigate to the dashboard, **Then** I hear "Goals Dashboard. 3 total goals. $750 total saved. 2 goals on track. Average progress 25%"
4. **Given** I view the dashboard on mobile (375px width), **When** the page loads, **Then** metric cards stack vertically with hero metrics (Total Saved) at top
5. **Given** I have 1 completed goal, **When** I view metrics, **Then** the "Goals On Track" card shows "2 on track, 1 complete" with green badge

---

### User Story 2 - Create and Edit Goals (Priority: P1) 🎯 MVP

As a **user planning for financial milestones**, I want **to create and customize savings goals** so that **I can track progress toward specific targets like an emergency fund or vacation**.

**Why this priority**: Goal creation is the foundation - without it, no other functionality works. This is table-stakes for goal tracking and directly addresses users' need to define what they're saving for.

**Independent Test**: User clicks "Create Goal", enters "Emergency Fund" name, $1,000 target, optional target date "2026-06-01", and $50 monthly contribution, then sees the new goal appear in the dashboard list with 0% progress. This delivers immediate value by letting users define their savings targets.

**Acceptance Scenarios**:

1. **Given** I click "Create Goal" button, **When** I fill form with name "Emergency Fund", target $1,000, target date "2026-06-01", monthly $50, **Then** goal is created and appears in dashboard with "Just Started" gray badge and 0% progress bar
2. **Given** I try to create a goal, **When** I leave name field empty, **Then** I see inline error "Goal name is required" and submit button is disabled
3. **Given** I try to create a goal, **When** I enter target amount $0 or negative, **Then** I see error "Target must be greater than $0"
4. **Given** I have an existing goal, **When** I click "Edit" and change target from $1,000 to $1,500, **Then** progress percentage recalculates (from 40% to 26.7% if current is $400)
5. **Given** I am using keyboard navigation, **When** I press Tab through create form, **Then** focus moves logically through Name → Target Amount → Target Date → Monthly Contribution → Create button

---

### User Story 3 - Track Visual Progress with Status Indicators (Priority: P1) 🎯 MVP

As a **user working toward savings goals**, I want **to see color-coded progress bars and status badges** so that **I stay motivated and quickly identify which goals need attention**.

**Why this priority**: Visual progress is the core psychological driver for goal completion. Research validates that progress bars increase goal completion by 22% (constitution) through the Goal Gradient Effect (motivation increases as bar fills). The traffic light color system (green/yellow/red) provides instant status recognition without cognitive load.

**Independent Test**: User with Emergency Fund goal at 40% progress ($400/$1,000) sees green progress bar filled 40% with text "$400 of $1,000 (40%)", "$600 remaining", and "On Track" blue badge. Goal at 95% shows yellow bar with "Almost There!" badge. This delivers immediate visual reinforcement.

**Acceptance Scenarios**:

1. **Given** I have a goal at 40% progress, **When** I view dashboard, **Then** I see progress bar filled 40% in green (hex #16a34a) with text "$400 of $1,000 saved (40%)" and "On Track" blue badge
2. **Given** I have a goal at 95% progress, **When** I view it, **Then** progress bar turns yellow (hex #eab308) with "Almost There! $50 to go" and yellow badge
3. **Given** I have a goal with target date in 5 days and only 50% progress, **When** I view it, **Then** I see red warning badge "Behind Schedule" with indicator "May not reach target by deadline"
4. **Given** I reach 100% on a goal, **When** page refreshes, **Then** progress bar is blue (#2563eb) with green "Complete" badge and checkmark icon
5. **Given** I am using a screen reader, **When** I tab to a progress bar, **Then** I hear "Emergency Fund progress: 40%, $400 of $1,000 saved, $600 remaining, status: on track"

---

### User Story 4 - Quick-Add Contributions (Priority: P1) 🎯 MVP

As a **user who frequently saves small amounts**, I want **preset quick-add buttons ($5, $10, $25)** so that **I can log contributions with one click instead of typing amounts each time**.

**Why this priority**: Reducing contribution friction is critical for building savings habits. Research shows contactless spending increased 8-10%, making transactions harder to track (from UX research). Quick-add buttons remove friction and make saving as easy as spending. This differentiates PayPlan from competitors requiring full form entry.

**Independent Test**: User with Emergency Fund goal clicks "$10" quick-add button, contribution is immediately logged, progress bar updates from 40% to 41%, and toast notification shows "Added $10 to Emergency Fund" with 5-second undo button. This delivers frictionless contribution logging.

**Acceptance Scenarios**:

1. **Given** I select Emergency Fund goal, **When** I click "$10" quick-add button, **Then** current amount increases by $10, progress updates instantly, and toast shows "Added $10 to Emergency Fund. Undo"
2. **Given** I click quick-add button, **When** within 5 seconds I click "Undo" in toast, **Then** contribution is reverted, progress returns to previous state
3. **Given** I click "$25" when goal has $15 remaining to target, **When** contribution saves, **Then** goal shows 100%+ progress with "Over-funded by $10" message and green "Complete" badge
4. **Given** I am using keyboard navigation, **When** I Tab to quick-add buttons and press Enter on "$10", **Then** contribution is added
5. **Given** I have no goal selected, **When** quick-add section loads, **Then** I see dropdown "Select a goal" with all active goals listed, and buttons are disabled until selection

---

### User Story 5 - Celebrate Goal Completion (Priority: P2)

As a **user who reaches a savings goal**, I want **to see a celebration with confetti animation and achievement message** so that **I feel a sense of accomplishment and am motivated to set new goals**.

**Why this priority**: Gamification creates dopamine reward cycles that reinforce saving behavior. Celebration moments make goal completion memorable and motivate users to continue. This differentiates PayPlan from spreadsheet-based competitors and builds positive habit loops.

**Independent Test**: User adds final $50 contribution to reach $1,000 Emergency Fund target, sees confetti animation (respecting prefers-reduced-motion), modal with "Goal Complete! 🎉 You saved $1,000 for Emergency Fund" and buttons "Set New Goal" or "Archive Goal". This creates memorable milestone.

**Acceptance Scenarios**:

1. **Given** I add contribution that reaches 100% target, **When** transaction saves, **Then** I see confetti animation (if motion not reduced), celebration modal with "Goal Complete! 🎉" message, total saved, and completion time
2. **Given** I complete a goal, **When** celebration modal appears, **Then** I see statistics: "Completed in 8 months", "Average $125/month contributed", with options "Set New Goal" or "Archive Goal"
3. **Given** I have reduced motion preference enabled, **When** I complete a goal, **Then** I see celebration modal WITHOUT confetti animation, respecting prefers-reduced-motion: reduce
4. **Given** I complete a goal, **When** celebration shows, **Then** main dashboard gamification widget adds "Recent Win: Completed Emergency Fund!" badge (visible for 7 days)
5. **Given** I am using keyboard navigation, **When** celebration modal opens, **Then** focus moves to "Set New Goal" button and I can Tab to "Archive Goal"

---

### User Story 6 - Set Target Dates with Progress Warnings (Priority: P2)

As a **user with deadline-driven goals**, I want **to set target dates and see days remaining plus warnings if behind schedule** so that **I know if I'm on track and can adjust my savings rate**.

**Why this priority**: Deadlines create urgency and help users plan. Date-based calculations (days remaining, required monthly contribution) turn abstract targets into actionable monthly plans. Warnings for behind-schedule goals prevent missed targets.

**Independent Test**: User creates "Vacation Fund" with $2,000 target and date "2026-08-01" (9 months away), system shows "270 days remaining", calculates "$222/month needed", and displays green "On Track" status. This provides automatic planning.

**Acceptance Scenarios**:

1. **Given** I create goal with $2,000 target and date 9 months away, **When** goal saves, **Then** I see "270 days remaining", "$222/month required to reach target by August 2026"
2. **Given** I have goal with target date <30 days away and progress <75%, **When** I view dashboard, **Then** goal shows red "Behind Schedule" badge with warning "You may not reach target by deadline"
3. **Given** I have goal where target date passed and progress <100%, **When** I view it, **Then** status shows red "Past Due" badge but I can still contribute
4. **Given** I edit goal to move target date earlier, **When** I save, **Then** required monthly recalculates and shows "Now need $400/month (increased from $222)"
5. **Given** I am using screen reader, **When** I navigate to goal with target date, **Then** I hear "Vacation Fund, $500 of $2,000, 25% complete, 270 days remaining, on track"

---

### User Story 7 - Add Contributions with Notes (Priority: P2)

As a **user tracking manual savings**, I want **to log contributions with optional notes** so that **I remember the source of each deposit and track progress accurately**.

**Why this priority**: PayPlan is privacy-first (no bank sync), so manual contribution logging is essential. Notes provide context ("Birthday money", "Tax refund") that make contributions memorable and help users understand their saving patterns.

**Independent Test**: User with Emergency Fund at $400 clicks "Add Contribution", enters $50 and note "Birthday money from Grandma", contribution saves, progress updates to $450 (45%), and note appears in contribution history. This enables flexible, contextual tracking.

**Acceptance Scenarios**:

1. **Given** I click "Add Contribution" on Emergency Fund goal, **When** I enter $50 and note "Birthday money", **Then** current amount updates to $450, progress shows 45%, note appears in contribution history
2. **Given** I add contribution without note, **When** I submit, **Then** contribution saves with null note (notes are optional)
3. **Given** I try to add contribution with 201-character note, **When** I submit, **Then** I see error "Note must be 200 characters or less (currently: 201)"
4. **Given** I view contribution history, **When** I see list, **Then** contributions are sorted newest first with amounts, notes (if present), and timestamps
5. **Given** I am using keyboard navigation, **When** contribution dialog opens, **Then** focus moves to amount input field first

---

### User Story 8 - Archive Completed Goals (Priority: P3)

As a **user with completed goals**, I want **to archive goals to declutter my active list** so that **I focus on current goals while preserving achievement history**.

**Why this priority**: Archive keeps dashboard clean and focused. Goal history provides motivation ("I've completed 3 goals!") without cluttering the active view. Lower priority because users can initially manage by ignoring/deleting completed goals.

**Independent Test**: User who completes "Emergency Fund" clicks "Archive Goal", goal moves to "Archived" section (hidden from dashboard), but can view in "View Archived" page with completion date and final amount. This maintains clean UX while preserving records.

**Acceptance Scenarios**:

1. **Given** I have completed goal, **When** I click "Archive Goal" from options menu, **Then** goal removed from dashboard and metric cards recalculate (Total Goals decreases by 1)
2. **Given** I navigate to "View Archived", **When** page loads, **Then** I see all archived goals sorted by completion date (newest first) with final amounts and time to complete
3. **Given** I archive a goal by mistake, **When** I click "Unarchive" in archived view, **Then** goal returns to active list and reappears on dashboard
4. **Given** I have 10+ archived goals, **When** I view archived page, **Then** goals display with pagination (10 per page)
5. **Given** I export data, **When** I download CSV/JSON, **Then** archived goals included in separate section with all contribution history

---

### Edge Cases

- **What happens when user has 20+ active goals?**
  → Dashboard shows all goals in scrollable list (no artificial limit). Metric cards aggregate all goals.

- **What happens when quick-add contribution exceeds remaining amount?**
  → System accepts it, marks goal as "Over-funded" (e.g., 108% progress), shows "Exceeded target by $XX" message, triggers completion celebration.

- **What happens when user deletes a goal with contribution history?**
  → Show confirmation dialog: "Delete Emergency Fund? This will delete 8 contributions totaling $400. This cannot be undone." User must confirm.

- **What happens when localStorage reaches 5MB limit?**
  → Show warning at 80%: "Approaching storage limit. Consider archiving completed goals." Block new goals at 95%.

- **What happens with duplicate goal names?**
  → System allows duplicates but disambiguates in UI with creation date or counter ("Emergency Fund (2)").

- **What happens when target date is in the past?**
  → Validation error on create/edit: "Target date must be in the future" with suggestion to set date at least 1 day from today.

- **How are percentages calculated with floating-point precision?**
  → Store amounts as integer cents ($50.00 = 5000 cents), calculate percentage, round to 1 decimal place (33.3% not 33.333%).

- **What if user manually corrupts localStorage data?**
  → Schema validation on load catches invalid data, resets to empty state, logs error, shows message "Goal data was corrupted and reset. Please re-create goals."

- **How are concurrent edits handled across browser tabs?**
  → Last-write-wins. Storage event listener syncs tabs automatically. If conflict detected (rare), show: "This goal was updated in another tab. Refresh to see latest."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display dashboard overview with 4 metric cards showing total goals, total saved, goals on track, and average progress percentage
- **FR-002**: System MUST show visual progress bars for each goal with percentage complete (0-100%) using color-coded status (green for on-track, yellow for almost there, red for behind/critical)
- **FR-003**: System MUST allow users to create unlimited savings goals with name (required), target amount (required), optional target date, and optional monthly contribution suggestion
- **FR-004**: System MUST allow users to edit goal details (name, target amount, target date, monthly contribution) after creation
- **FR-005**: System MUST allow users to delete goals with confirmation dialog warning about data loss (contributions will be deleted)
- **FR-006**: System MUST provide quick-add contribution buttons with preset amounts ($5, $10, $25) for one-click contribution logging
- **FR-007**: System MUST allow users to manually add custom contribution amounts with optional note (max 200 characters)
- **FR-008**: System MUST display undo notification for 5 seconds after contribution with button to revert
- **FR-009**: System MUST display celebration message and animation when goal reaches 100% completion (respecting prefers-reduced-motion preference)
- **FR-010**: System MUST calculate and display days remaining and required monthly contribution for goals with target dates
- **FR-011**: System MUST show status warnings when goal is behind schedule (target date <30 days away AND progress <75%)
- **FR-012**: System MUST allow users to archive completed goals to remove from active dashboard while preserving history
- **FR-013**: System MUST display status badges using traffic light color system: green (complete/on-track), yellow (almost there/caution), red (behind schedule/past due), blue (neutral/custom), gray (just started/archived)
- **FR-014**: System MUST store all goal data with versioned schema and validate with schema on every read/write
- **FR-015**: System MUST integrate with main dashboard by providing data for Goal Progress Widget (top 3 goals display)
- **FR-016**: System MUST meet WCAG 2.2 AA accessibility standards (ARIA progressbar labels, keyboard navigation, screen reader announcements, color contrast 4.5:1 text / 3:1 UI, 44x44px touch targets)
- **FR-017**: System MUST be fully responsive with mobile-first layout (metric cards stack vertically on <768px, horizontal on desktop, hero metrics at top on mobile)
- **FR-018**: System MUST handle storage errors gracefully with user-friendly messages and fallback to empty state
- **FR-019**: System MUST allow export of all goals and contributions as CSV/JSON

### Key Entities

- **Goal**: Represents a user's savings goal
  - Attributes: unique identifier, name (1-50 chars), target amount (cents), current amount (cents, default 0), optional target date, optional monthly contribution suggestion, status (active/completed/archived), timestamps (created, updated)
  - Relationships: Has many Contributions

- **Contribution**: Represents a deposit toward a goal
  - Attributes: unique identifier, parent goal reference, amount (cents), optional note (max 200 chars), timestamp (created)
  - Relationships: Belongs to Goal

- **DashboardMetrics** (computed): Read-only overview metrics
  - Attributes: total goals count, total saved amount (sum of all current amounts), goals on track count (progress >25%), average progress percentage (mean of all goal percentages)
  - Source: Computed from Goal entities on demand

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can understand their overall goal progress within 5 seconds of viewing dashboard (measured via user testing - "How much have you saved total?")
- **SC-002**: Users can create a new goal in under 60 seconds (measured via user testing with timer)
- **SC-003**: 90% of users successfully add a contribution using quick-add buttons on first attempt without errors (measured via user testing)
- **SC-004**: Goal completion celebrations display within 500ms of reaching 100% (manual testing - must feel instant)
- **SC-005**: Dashboard displays accurately for users with 0 goals, 3 goals, and 20+ goals without performance degradation (manual load testing)
- **SC-006**: All features work on mobile (375px width), tablet (768px width), and desktop (1920px width) without horizontal scrolling or layout breaks (responsive testing on real devices)
- **SC-007**: Dashboard passes WCAG 2.2 AA accessibility audit for keyboard navigation, screen reader support, and color contrast (automated axe-core + manual screen reader testing with NVDA/VoiceOver)
- **SC-008**: Quick-add contribution buttons reduce average contribution time by 50% compared to manual form entry (measured via A/B testing or user behavior analytics)
- **SC-009**: Traffic light color system allows users to identify goal status within 2 seconds without reading text labels (measured via user testing - show dashboard for 2 seconds, ask "Which goals need attention?")
- **SC-010**: Goal data persists correctly across page refreshes, browser restarts, and tab closures (localStorage persistence testing)

### Qualitative Outcomes

- Users report feeling motivated by visual progress bars and metric cards
- Users find quick-add buttons more convenient than manual entry
- Users appreciate color-coded status at-a-glance without needing to read details
- Users feel celebration animations make achievements memorable and rewarding
- Users trust that goal data is private and stored locally (no server sync concerns)

## Assumptions *(decisions made to proceed)*

1. **Dashboard Layout**: 4 metric cards at top (matches Shadcn UI dashboard-01 pattern researched), followed by goal list, quick-add section, and activity feed
2. **Color Coding**: Traffic light system (green on-track >75%, yellow almost-there 75-95%, red behind <75% with deadline, blue complete) based on research showing universal color psychology for financial status
3. **Quick-Add Amounts**: Preset values $5, $10, $25 chosen based on typical small contribution amounts for low-income users (PayPlan target demographic earning $25k-$60k/year)
4. **Progress Bar Style**: Horizontal bars (not circular/donut) for consistency with PayPlan existing budget progress bars (Feature 061/062)
5. **Contribution Tracking**: Manual entry only in Phase 1; automatic detection from transactions deferred to Phase 2
6. **Goal Types**: Simple target-based savings goals in Phase 1; debt payoff and sinking funds deferred to Phase 2
7. **Metric Calculation**: "On Track" defined as progress >25% (user has started meaningfully); goals <25% show "Just Started" status
8. **Dashboard Real-Time Updates**: Progress bars and metrics update immediately on contribution (no page refresh required) using React state management
9. **Empty State Behavior**: Dashboard shows friendly empty state with "Create your first goal" call-to-action when no goals exist
10. **Export Format**: CSV/JSON export uses same format as existing transaction/budget exports for consistency (Feature 061)

## Out of Scope *(explicitly excluded)*

1. **Automatic Contribution Detection** - Linking transactions to goals automatically (defer to Phase 2)
2. **Debt Payoff Goals** - Goals with decreasing targets for debt reduction (defer to Phase 2)
3. **Sinking Fund Goals** - Recurring monthly contribution goals (YNAB-style "Set Aside Each Month") (defer to Phase 2)
4. **Goal Templates** - Pre-defined goal templates with recommended amounts ("Emergency Fund: $1,000", "Vacation: $2,000") (defer to Phase 3)
5. **Goal Sharing** - Collaborative goals with household members (defer to Phase 3, requires Supabase)
6. **Goal Reminders** - Email/push notifications to remind contributions (defer to Phase 3, requires notification system)
7. **Milestone Celebrations** - Celebrating 25%, 50%, 75% progress (defer to Phase 2 gamification)
8. **Account Linking** - Associating goals with specific bank accounts or categories (defer to Phase 3, requires Supabase)
9. **Historical Trend Charts** - Line charts showing contribution history over time (defer to Phase 2 analytics)
10. **Custom Dashboard Layouts** - Drag-and-drop reordering of dashboard cards (defer to Phase 3)

## Dependencies *(prerequisites)*

1. **Main Dashboard Goal Progress Widget** - Feature 062 already has GoalProgressWidget component that will display top 3 goals from this feature
2. **Shadcn UI Components** - PayPlan already has Card, Badge, Button, Dialog, Alert-Dialog; needs Progress and Toast components added
3. **Storage System** - localStorage must be available with sufficient space (<5MB usage across all features)
4. **Validation Library** - Zod schemas must be defined for Goal and Contribution entities
5. **Currency Formatter** - formatCurrency function exists in budgets feature (can import cross-feature)
6. **Routing System** - React Router must support adding /goals route
7. **Date Library** - date-fns for calculating days remaining and months remaining
8. **Animation Library** - canvas-confetti for goal completion celebrations (Trust Score 10.0 per Context7)
9. **Feature Architecture** - Must follow PayPlan's feature-based pattern at frontend/src/features/goals/
10. **Accessibility Testing** - Manual screen reader testing tools (NVDA/VoiceOver) and keyboard navigation testing required before release

## Risks *(potential blockers)*

1. **localStorage Capacity** - Risk that power users with many goals/contributions exceed 5MB limit
   - **Mitigation**: Warn at 80% capacity, offer archive flow, implement contribution pagination

2. **Progress Bar Performance** - Risk that recalculating 20+ progress bars on every contribution feels slow
   - **Mitigation**: Use React useMemo for expensive calculations, only recalculate changed goals

3. **Quick-Add Button UX** - Risk that users accidentally click wrong amount ($25 instead of $5)
   - **Mitigation**: 5-second undo window with toast notification, clear button labels

4. **Color Accessibility** - Risk that traffic light colors fail for colorblind users
   - **Mitigation**: Always pair colors with text labels ("On Track", "Behind"), use icons (✓, ⚠️, ✗), meet WCAG contrast ratios

5. **Celebration Animation Accessibility** - Risk that confetti animation causes motion sickness or distraction
   - **Mitigation**: Check prefers-reduced-motion BEFORE animating, provide static celebration alternative

6. **Dashboard Information Overload** - Risk that too many metrics/cards overwhelm users
   - **Mitigation**: Limit to 4 metric cards (research shows users can hold 5-7 items in working memory), progressive disclosure for details

7. **Cross-Tab Synchronization** - Risk that editing goal in one tab doesn't update in another
   - **Mitigation**: Storage event listener for automatic cross-tab sync, last-write-wins on conflicts

## Notes *(additional context)*

- **UX Research Validation**: Dashboard design based on 2025 UX best practices (visual hierarchy, reduce clutter, progressive disclosure) and behavioral psychology (Goal Gradient Effect increases motivation as progress nears completion, Visual Reinforcement keeps goals top-of-mind)
- **Competitor Analysis**: YNAB uses green progress bars in table format, Monarch uses colorful charts (blue/green/yellow/pink) with donut indicators. PayPlan combines best of both: simple progress bars (YNAB clarity) + colorful status system (Monarch visual appeal)
- **Shadcn UI Integration**: PayPlan already uses Shadcn UI components. Dashboard will use Shadcn's dashboard-01 pattern: 4 metric cards with large numbers + trend indicators, followed by data lists. Need to add Progress and Toast components via CLI.
- **Color Psychology**: Traffic light system (green/yellow/red) is universal financial app standard (from external research). Green indicates positive/on-track, yellow caution/approaching, red critical/immediate attention.
- **Mobile-First Research**: Hero metrics at top validated by mobile dashboard screenshots showing 80% of users scan upper third first. Card stacking prevents horizontal scroll.
- **Quick-Add Psychology**: Research shows contactless spending increased 8-10%, making transaction tracking harder. Quick-add buttons (no typing, one click) reduce contribution friction and match ease of spending.
- **Accessibility First**: WCAG 2.2 AA compliance required per PayPlan constitution. 44x44px touch targets (not just 24px minimum) per Principle II. Traffic light colors PLUS text labels (not color alone) prevent accessibility violations.
- **Phase 1 TDD**: Business logic (calculations, storage service) requires 80%+ test coverage, financial calculations (progress %, days remaining, required monthly) require 90%+ coverage. UI components tested manually.
- **Free Core Commitment**: All goal tracking features free forever (per Constitution Principle III). No premium gates for this feature.
- **Privacy First**: All data stored in localStorage only (no server, no auth required per Constitution Principle I). Optional Supabase sync deferred to Phase 3.

## References

- **PayPlan Constitution**: memory/constitution.md (v3.1 - Privacy-First, Accessibility-First, Free Core, Phased TDD)
- **Feature 062**: specs/062-short-name-dashboard/spec.md (Main Dashboard with Goal Progress Widget integration point)
- **Feature 063**: specs/063-short-name-business/spec.md (TDD patterns, test fixtures, Vitest configuration)
- **Shadcn Components Mapping**: [SHADCN-COMPONENTS-NEEDED.md](SHADCN-COMPONENTS-NEEDED.md) (Complete UI component requirements: 2 MUST add, 5 SHOULD add, 3 future)
- **UX Research**: 2025 Dashboard Design Principles (visual hierarchy, reduce clutter, 5-7 item memory limit, progressive disclosure)
- **Behavioral Psychology**: Goal Gradient Effect (motivation increases near completion), Endowed Progress Effect (seeing progress motivates more saving), Visual Reinforcement (keeps goals top-of-mind)
- **Competitor Research**: YNAB (green progress bars, table lists, yellow targets), Monarch Money (colorful charts, donut progress, line trends, clean cards)
- **Shadcn UI**: ui.shadcn.com/examples/dashboard (dashboard-01 pattern: 4 metric cards + data lists)
- **Color Psychology**: Traffic light system research (green positive, yellow caution, red critical - universal financial app standard)
- **WCAG 2.2 AA**: https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_customize&levels=aa (Accessibility compliance)
- **Context7 Validation**: date-fns (Trust 7.6), canvas-confetti (Trust 10.0), Zod (Trust 9.6)
