# Feature Specification: Spending Categories & Budget Creation

**Feature Branch**: `061-spending-categories-budgets`  
**Created**: 2025-10-28  
**Status**: Draft  
**Linear Issue**: [MMT-61](https://linear.app/mmtu-entertainment/issue/MMT-61/p0-spending-categories-budget-creation)  
**Epic**: [MMT-69 - Budgeting App MVP](https://linear.app/mmtu-entertainment/issue/MMT-69/epic-budgeting-app-mvp)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Categories (Priority: P0)

As a user, I want to create and manage spending categories so I can organize my transactions and track where my money goes.

**Why this priority**: Categories are the foundation of budgeting. Without categories, users cannot create budgets or track spending patterns. This is the most critical feature for a budgeting app.

**Independent Test**: User can create a custom category (e.g., "Coffee Shops"), assign it an icon and color, and see it appear in the category list. This delivers immediate value by allowing users to start organizing their financial life.

**Acceptance Scenarios**:

1. **Given** I am on the Categories page, **When** I click "Add Category", **Then** I see a form with fields for name, icon, and color
2. **Given** I have filled in category details, **When** I click "Save", **Then** the category appears in my category list
3. **Given** I have created a category, **When** I click "Edit" on that category, **Then** I can modify its name, icon, or color
4. **Given** I have a category with no transactions, **When** I click "Delete", **Then** the category is removed from my list
5. **Given** I have a category with assigned transactions, **When** I click "Delete", **Then** I see a warning and must confirm before deletion

---

### User Story 2 - Set Monthly Budgets (Priority: P0)

As a user, I want to set monthly spending limits for each category so I can control my spending and avoid overspending.

**Why this priority**: Budget creation is the core value proposition. Users need to set limits to track progress. Without this, PayPlan is just a category manager, not a budgeting app.

**Independent Test**: User can set a $500 monthly budget for "Groceries" category and see it saved. This delivers immediate value by allowing users to start controlling their spending.

**Acceptance Scenarios**:

1. **Given** I have created a category, **When** I click "Set Budget", **Then** I see a form to enter monthly limit
2. **Given** I enter a budget amount, **When** I click "Save", **Then** the budget is saved and I see a progress bar showing $0 of $X spent
3. **Given** I have set a budget, **When** I click "Edit Budget", **Then** I can modify the monthly limit
4. **Given** I have set a budget, **When** I click "Delete Budget", **Then** the budget is removed but the category remains

---

### User Story 3 - Track Budget Progress (Priority: P0)

As a user, I want to see visual progress bars showing how much of my budget I've spent so I can stay on track and avoid overspending.

**Why this priority**: Visual feedback is essential for behavior change. Progress bars make budgets actionable and help users make spending decisions in real-time.

**Independent Test**: User with a $500 Groceries budget and $300 spent sees a progress bar showing "60% spent - $200 left". This delivers immediate value by providing clear, actionable feedback.

**Acceptance Scenarios**:

1. **Given** I have a budget with no spending, **When** I view the budget, **Then** I see a progress bar at 0% with "$0 of $X spent"
2. **Given** I have spent money in a category, **When** I view the budget, **Then** I see an updated progress bar with current spending
3. **Given** I have spent 80% of my budget, **When** I view the budget, **Then** I see a warning color (yellow) on the progress bar
4. **Given** I have spent 100% of my budget, **When** I view the budget, **Then** I see an alert color (red) on the progress bar
5. **Given** I have exceeded my budget, **When** I view the budget, **Then** I see "$X over budget" message

---

### User Story 4 - Assign Transactions to Categories (Priority: P1)

As a user, I want to assign transactions to categories so my budget progress bars update automatically.

**Why this priority**: This connects budgets to actual spending. Without this, budgets are static and don't reflect real behavior. This is required for budget tracking to work.

**Independent Test**: User assigns a $50 transaction to "Groceries" category and sees the Groceries budget progress bar update from $0 to $50. This delivers immediate value by automating budget tracking.

**Acceptance Scenarios**:

1. **Given** I have a transaction, **When** I click "Categorize", **Then** I see a dropdown of available categories
2. **Given** I select a category, **When** I click "Save", **Then** the transaction is assigned to that category
3. **Given** I have categorized a transaction, **When** I view the category budget, **Then** I see the budget progress updated to include that transaction
4. **Given** I have categorized a transaction, **When** I change its category, **Then** both the old and new category budgets update accordingly

---

### User Story 5 - Use Pre-defined Categories (Priority: P2)

As a user, I want to use pre-defined categories (Groceries, Dining, etc.) so I can start budgeting immediately without setup overhead.

**Why this priority**: Reduces onboarding friction. Most users have similar spending patterns, so pre-defined categories provide a quick start. This is a nice-to-have that improves UX but isn't blocking.

**Independent Test**: User opens Categories page and sees 9 pre-defined categories (Groceries, Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Debt, Savings) ready to use. This delivers immediate value by eliminating setup time.

**Acceptance Scenarios**:

1. **Given** I am a new user, **When** I open the Categories page, **Then** I see 9 pre-defined categories
2. **Given** I see a pre-defined category, **When** I click "Set Budget", **Then** I can immediately create a budget without creating the category first
3. **Given** I have pre-defined categories, **When** I create a custom category, **Then** both pre-defined and custom categories appear in the list

---

### Edge Cases

- **What happens when a user deletes a category that has transactions assigned?**  
  → Show warning: "This category has X transactions. Deleting it will uncategorize those transactions. Continue?"
  
- **What happens when a user sets a budget of $0?**  
  → Validation error: "Budget must be greater than $0"
  
- **What happens when a user has multiple transactions in the same category on the same day?**  
  → All transactions count toward the budget total
  
- **What happens when a user changes a transaction's category?**  
  → Old category budget decreases, new category budget increases
  
- **What happens when a user exceeds their budget?**  
  → Progress bar turns red, shows "$X over budget" message, but does NOT block spending (informational only)
  
- **What happens when localStorage is full?**  
  → Show error: "Storage limit reached. Please archive old transactions or export data."

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create custom categories with name, icon, and color
- **FR-002**: System MUST provide 9 pre-defined categories (Groceries, Dining, Transportation, Housing, Utilities, Entertainment, Healthcare, Debt, Savings)
- **FR-003**: System MUST allow users to edit category name, icon, and color
- **FR-004**: System MUST allow users to delete categories with confirmation
- **FR-005**: System MUST prevent deletion of categories with assigned transactions without explicit confirmation
- **FR-006**: System MUST allow users to set monthly budget limits per category
- **FR-007**: System MUST allow users to edit and delete budgets
- **FR-008**: System MUST display visual progress bars showing budget vs. actual spending
- **FR-009**: System MUST calculate budget progress as (spent / budgeted) * 100
- **FR-010**: System MUST show warning colors when budget reaches 80% (yellow) and 100% (red)
- **FR-011**: System MUST allow users to assign transactions to categories
- **FR-012**: System MUST update budget progress automatically when transactions are categorized
- **FR-013**: System MUST persist categories and budgets to localStorage
- **FR-014**: System MUST validate budget amounts (must be > $0)
- **FR-015**: System MUST support keyboard navigation for all category and budget operations

### Key Entities *(include if feature involves data)*

- **Category**: Represents a spending category (e.g., "Groceries")
  - Attributes: id (UUID), name (string), icon (string), color (string), isPredefined (boolean), createdAt (timestamp)
  - Relationships: Has many Transactions, has one Budget (optional)

- **Budget**: Represents a monthly spending limit for a category
  - Attributes: id (UUID), categoryId (UUID), monthlyLimit (number), period (string, default "monthly"), rollover (boolean, default false), createdAt (timestamp)
  - Relationships: Belongs to one Category

- **Transaction**: Represents a financial transaction (already exists in system)
  - New attribute: categoryId (UUID, optional)
  - Relationships: Belongs to one Category (optional)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a custom category in under 30 seconds
- **SC-002**: Users can set a monthly budget in under 15 seconds
- **SC-003**: Users can assign a transaction to a category in under 10 seconds
- **SC-004**: Budget progress bars update in real-time (<500ms) when transactions are categorized
- **SC-005**: System handles 100+ categories without performance degradation
- **SC-006**: System handles 1000+ transactions across categories without performance degradation
- **SC-007**: All category and budget operations are accessible via keyboard navigation (WCAG 2.1 AA)
- **SC-008**: All progress bars have 3:1 contrast ratio and work without color alone (WCAG 2.1 AA)
- **SC-009**: 90% of users successfully create their first budget on first attempt (measured via user testing)
- **SC-010**: Budget data persists across browser sessions (localStorage)

---

## Technical Constraints

### Performance
- Category list must render in <500ms (even with 100+ categories)
- Budget progress bars must update in <500ms after transaction categorization
- localStorage writes must be debounced to 500ms to avoid excessive I/O

### Accessibility
- All forms must have proper labels and ARIA attributes
- Progress bars must have ARIA role="progressbar" with aria-valuenow, aria-valuemin, aria-valuemax
- Progress bars must use icons + text (not color alone) to indicate status
- Keyboard navigation: Tab (next field), Shift+Tab (previous field), Enter (submit), Escape (cancel)
- Screen reader support: All interactive elements must have descriptive labels

### Data Storage
- Categories stored in localStorage under key `categories`
- Budgets stored in localStorage under key `budgets`
- Transactions updated to include `categoryId` field
- Maximum localStorage usage: 5 MB (warn at 80%, block at 95%)

### Browser Compatibility
- Must work in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Must work on mobile (iOS Safari, Android Chrome)

---

## Out of Scope (Phase 1)

The following features are explicitly OUT OF SCOPE for this initial implementation:

- **Budget templates** (50/30/20 rule, zero-based budgeting) - Defer to Phase 2
- **Rollover support** (carry unused balance to next month) - Defer to Phase 2
- **Category groups** (e.g., "Food" contains Groceries + Dining) - Defer to Phase 2
- **Weekly budgets** (only monthly budgets in Phase 1) - Defer to Phase 2
- **Budget vs. actual reporting** (charts, trends) - Defer to MMT-66 (Analytics)
- **Alerts/notifications** when approaching limits - Defer to MMT-65 (Recurring Bills)
- **Automated tests** - Manual testing only in Phase 1 (per constitution)

---

## Dependencies

### External Dependencies
- **Recharts** (2.15.0) - For potential future chart integration (not used in Phase 1)
- **Zod** (4.1.11) - For category and budget validation
- **uuid** (13.0.0) - For generating category and budget IDs
- **Radix UI** - For accessible form components

### Internal Dependencies
- **localStorage** - Must be available and have sufficient space
- **Transaction system** - Must support adding `categoryId` field
- **Navigation system** - Must support new "Categories" and "Budgets" routes

### Constitution Requirements
- **Privacy-First** (lines 68-120): All data stored in localStorage, no server required
- **Accessibility** (lines 68-120): WCAG 2.1 AA compliance for all UI components
- **UX Principles** (lines 208-253): <30s category creation, <15s budget creation
- **Performance** (lines 275-332): <500ms rendering, debounced localStorage writes
- **Data Architecture** (lines 800-1000+): localStorage JSON schema, validation

---

## References

- **Constitution**: `memory/constitution_v1.1_TEMP.md`
- **Linear Issue**: [MMT-61](https://linear.app/mmtu-entertainment/issue/MMT-61/p0-spending-categories-budget-creation)
- **Epic**: [MMT-69 - Budgeting App MVP](https://linear.app/mmtu-entertainment/issue/MMT-69/epic-budgeting-app-mvp)
- **Roadmap**: `PAYPLAN_REALISTIC_ROADMAP.md`
- **Research**: `PHASE1_RESEARCH_FINDINGS.md`

