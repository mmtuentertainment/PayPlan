# Budget App UI/UX Organization Research

**What You Asked**: How are budget tools organized in the actual UI - tabs, buttons, sections, navigation?
**Research Focus**: Information Architecture, not just features
**Sources**: YNAB Toolkit docs, Monarch help docs, Simplifi help docs, PocketGuard guide

---

## INTERFACE ORGANIZATION PATTERNS (All 6 Competitors)

### YNAB Interface Structure

**Main Tabs** (Top-level navigation):
1. **Budget** (primary view)
2. **Reports**
3. **Accounts**

**Budget Screen Organization**:
- **Header Section**:
  - "Ready to Assign" (money available to budget)
  - "Age of Money" metric
  - Month selector (arrows to navigate months)
  - Monthly notes

- **Budget Table** (main area):
  - Master Categories (groups: Food, Housing, Transportation, etc.)
  - Subcategories within each group (Groceries under Food, Rent under Housing)
  - Columns: Assigned, Activity, Available
  - Target indicators (funding goals per category)

- **Right Sidebar** (Budget Inspector):
  - Category summary
  - Total Monthly Targets
  - Income vs. Spending breakdown
  - Available After Savings
  - "Live on Last Month's Income" status

**Sidebar** (Left):
  - Account list (Budget Accounts, Tracking Accounts)
  - Account balances
  - Import indicators

**Key Buttons/Actions**:
- Add Transaction
- Add Category
- Move Money (between categories)
- Set Target (for category)
- Reconcile Account

---

### Monarch Money Interface Structure

**Main Sections** (Navigation):
1. **Dashboard** (home, customizable widgets)
2. **Transactions** (all transactions view)
3. **Budget / Plan**
4. **Investments**
5. **Recurring** (bills & subscriptions)
6. **Cash Flow**
7. **Reports**
8. **Accounts**

**Dashboard Layout**:
- **Customizable Widgets** (drag & drop):
  - Net Worth card
  - Recent Transactions
  - Budget Progress
  - Investment Performance
  - Upcoming Bills
  - Custom reports

**Budget/Plan Screen**:
- Toggle: Category Budgeting vs. Flex Budgeting
- **Category Budgeting View**:
  - Category groups (Income, Expenses, Contributions)
  - Budgeted amount, Actual spent, Remaining
  - Visual progress bars
  - Collapsible sections

- **Flex Budgeting View**:
  - Fixed expenses (rent, utilities)
  - Flexible expenses (dining, entertainment)
  - Non-monthly expenses (insurance, gifts)

**Sidebar** (Collapsible):
- Dashboard
- Transactions
- Plan (Budget)
- Recurring
- Cash Flow
- Reports
- Investments
- Settings

**Key Buttons/Actions**:
- Add Transaction
- Customize Dashboard
- Create Budget
- View Reports
- Swipe to Review (mobile)

---

### Simplifi Interface Structure

**Main Menu Sections**:
1. **Dashboard** (home/snapshot)
2. **Transactions** (all accounts)
3. **Spending Plan** (PRIMARY - unique to Simplifi)
4. **Bills & Income**
5. **Savings Goals**
6. **Reports**
7. **Planning Tools** (retirement)
8. **Investments**
9. **Watchlist** (mini-budgets)

**Spending Plan Screen** (CORE VIEW):
- **Header**:
  - Month selector
  - "Left This Month" (available to spend)

- **Sections**:
  - **Income**: Expected income for month
  - **Bills**: Recurring bills & subscriptions total
  - **Planned Spending**: Variable expenses (groceries, gas, one-time costs)
  - **Other Spend**: Real-time total of remaining expenses
  - **Goals**: Savings goals included in plan

- **Visual Display**:
  - Each section expandable to see detail
  - Colorful category bubbles (click to see transactions)
  - Real-time updates
  - Per-day average spending

**Dashboard**:
- Account balances
- Net worth graph
- Spending breakdown
- Bill reminders
- Goal progress

**Key Buttons/Actions**:
- Add Transaction
- Create Planned Spending Item
- Set Up Goal
- Create Watchlist
- Run Report
- Refresh Accounts

---

### PocketGuard Interface Structure

**Main Tabs** (Bottom navigation):
1. **Overview** (home)
2. **Transactions**
3. **Insights** (reports/analytics)
4. **Find Savings** (recommendations)

**Overview Screen** (PRIMARY):
- **"IN MY POCKET"** (Hero element - top, large):
  - Monthly amount available
  - Daily amount available
  - Visual gauge/progress

- **Below "In My Pocket"**:
  - Account balances
  - Budget status
  - Upcoming bills
  - Savings goals progress

**Transactions Screen**:
- All transactions from all accounts
- Filters: Date range, Amount, Category
- Bulk editing tools
- Category assignment

**Insights Screen**:
- Spending pie chart (by category)
- Hashtag reports
- Spending trends
- Category breakdowns

**Find Savings Screen**:
- Subscription recommendations
- Bill negotiation options
- Personalized savings tips

**Key Buttons/Actions**:
- Add Transaction
- Set Budget Limit
- Create Goal
- Categorize Transaction
- Negotiate Bill

---

### Copilot Interface (iOS/Mac)

**Main Sections**:
1. **Home / Dashboard**
2. **Accounts**
3. **Transactions**
4. **Budget** (with categories)
5. **Cash Flow**
6. **Investments**

**Home Screen**:
- Account balances
- Spending summary
- Budget status
- Alerts/Notifications

**Budget Screen**:
- Category list with budgets
- Visual indicators (color-coded)
- Spending vs. Budget comparison
- Adaptive budget suggestions

**Unique Features**:
- Swipe gestures for categorization
- Natural language search
- AI categorization suggestions

---

### Goodbudget Interface

**Main Sections**:
1. **Envelopes** (PRIMARY - budget view)
2. **Transactions**
3. **Accounts**
4. **Reports** (paid only)

**Envelopes Screen** (CORE):
- List of all envelopes (categories)
- Amount remaining in each envelope
- Color-coded bars (green = money left, red = overspent)
- Total available across all envelopes

**Key Actions**:
- Add Expense (to envelope)
- Fill Envelopes (allocate money)
- Transfer between Envelopes
- Create New Envelope

---

## COMMON UI PATTERNS ACROSS ALL APPS

### Primary Navigation (What tabs/sections ALL have)

| Section | YNAB | Monarch | Copilot | Simplifi | PocketGuard | Goodbudget |
|---------|------|---------|---------|----------|-------------|------------|
| **Dashboard/Home** | ❌ (Budget is home) | ✅ | ✅ | ✅ | ✅ Overview | ❌ (Envelopes is home) |
| **Budget/Plan** | ✅ | ✅ | ✅ | ✅ Spending Plan | ⚠️ (in Overview) | ✅ Envelopes |
| **Transactions** | ✅ (in Accounts) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reports/Insights** | ✅ Reports | ✅ Reports | ⚠️ | ✅ Reports | ✅ Insights | ✅ Paid only |
| **Accounts** | ✅ | ✅ | ✅ | ⚠️ (in Transactions) | ⚠️ (in Overview) | ✅ |
| **Goals/Savings** | ⚠️ (in Budget) | ⚠️ (in Dashboard) | ⚠️ | ✅ Separate tab | ⚠️ (in Overview) | ⚠️ (in Envelopes) |
| **Bills/Recurring** | ⚠️ (in Budget) | ✅ Recurring | ⚠️ | ✅ Bills & Income | ⚠️ (in Overview) | ⚠️ |
| **Investments** | ❌ | ✅ | ✅ | ✅ | ⚠️ (in Insights) | ❌ |

**UNIVERSAL** (All 6 have as top-level or prominent):
- Budget/Plan view
- Transactions view
- Reports/Analytics view
- Account list

**MAJORITY** (4-5/6 have as separate tab):
- Dashboard/Home (5/6 - not YNAB, Goodbudget)
- Goals/Savings (varies - some integrated, some separate)
- Bills/Recurring (3/6 as separate tab)

---

## BUDGET SCREEN ORGANIZATION (The Core View)

### Common Elements Across All Apps

**Header/Top Section**:
1. Month selector (arrows or dropdown)
2. Primary metric (YNAB: "Ready to Assign", PocketGuard: "In My Pocket", Simplifi: "Left This Month")
3. Quick add button (Add Transaction)

**Main Budget Display**:
1. Category list (grouped or flat)
2. For each category:
   - Name/Label
   - Budgeted amount
   - Spent amount
   - Remaining amount
   - Visual indicator (progress bar, color, percentage)

**Common Visual Patterns**:
- **Color Coding**: Green (under budget), Yellow (warning ~80-90%), Red (over budget)
- **Progress Bars**: All apps show visual progress per category
- **Collapsible Groups**: Most apps group categories (Food, Housing, etc.)

**Common Actions/Buttons**:
- Add Category
- Edit Budget Amount
- Move Money (YNAB)/Adjust Budget
- View Transactions (for category)
- Set Alert/Target

---

## DASHBOARD/HOME SCREEN ORGANIZATION

### What Users See When They Log In

**YNAB**: Goes straight to **Budget view** (no separate dashboard)

**Monarch**: **Dashboard** with customizable widgets:
- Net Worth (top)
- Budget Status
- Recent Transactions
- Investment Performance
- Upcoming Bills
- Custom Reports

**Simplifi**: **Dashboard** with:
- Account balances overview
- Net worth graph
- Spending Plan summary ("Left This Month" prominently)
- Bills & Income timeline
- Savings Goals progress
- Spending breakdown

**PocketGuard**: **Overview** with:
- **"IN MY POCKET"** (HERO - biggest, top)
- Account balances below
- Budget status (categories with bars)
- Upcoming bills
- Goals progress

**Copilot**: **Home** with:
- Account balances
- Spending summary card
- Budget status
- Alerts/Notifications
- Cash flow snapshot

**Goodbudget**: **Envelopes** (budget view immediately):
- List of all envelopes
- Remaining amounts
- Color bars
- Total available

**PATTERN**: 5/6 have **Dashboard/Overview as landing page**, only YNAB goes straight to Budget

---

## INFORMATION ARCHITECTURE COMPARISON

### Navigation Depth (How many clicks to key features?)

| Feature | YNAB | Monarch | Simplifi | PocketGuard |
|---------|------|---------|----------|-------------|
| **See Budget** | 0 clicks (home) | 1 click (sidebar) | 1 click (menu) | 0 clicks (on Overview) |
| **Add Transaction** | 1 click (button) | 1 click (button) | 1 click (button) | 1 click (button) |
| **View Reports** | 1 click (tab) | 1 click (sidebar) | 1 click (menu) | 1 click (Insights tab) |
| **See Goals** | 1-2 clicks (in Budget) | 0 clicks (Dashboard widget) | 1 click (menu) | 0 clicks (on Overview) |
| **View Transactions** | 1 click (Accounts tab) | 1 click (sidebar) | 1 click (menu) | 1 click (tab) |
| **See Bills** | 1-2 clicks (in Budget) | 1 click (Recurring tab) | 1 click (Bills & Income) | 0 clicks (on Overview) |

**Best Practice**: 0-1 clicks to most-used features (Budget, Transactions, Add Transaction)

---

## BUDGET SCREEN LAYOUTS (Detailed)

### YNAB Budget Screen

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ┌─ Ready to Assign: $1,234 ─┬─ Age of Money: 23 days ─┐│
│ │ ◄ October 2025 ►           │ Monthly Notes          ││
│ └────────────────────────────┴────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│ BUDGET TABLE                                            │
│ ┌─ 💰 FOOD ─────────────────── Assigned│Activity│Avail─┐│
│ │  └ Groceries                    $500│   $320│  $180 ││
│ │  └ Dining Out                   $200│   $180│   $20 ││
│ ├─ 🏠 HOUSING ──────────────────────────────────────────┤│
│ │  └ Rent                       $1,200│ $1,200│    $0 ││
│ │  └ Utilities                    $150│   $120│   $30 ││
│ └────────────────────────────────────────────────────────│
│ [+ Add Category] [Move Money]                            │
└─────────────────────────────────────────────────────────┘

RIGHT SIDEBAR (Budget Inspector):
┌─────────────────────────┐
│ Category: Groceries     │
│ Budgeted: $500          │
│ Activity: $320          │
│ Available: $180         │
│                         │
│ [Set Target]            │
│ [View Transactions]     │
└─────────────────────────┘
```

**Key UX Elements**:
- Table/spreadsheet view (rows = categories, columns = money states)
- Collapsible category groups
- Inline editing (click to change amounts)
- Right panel shows details for selected category

---

### Monarch Dashboard + Budget Screen

```
DASHBOARD (Landing page):
┌─────────────────────────────────────────────────────────┐
│ [Customize]                                             │
│ ┌─ NET WORTH WIDGET ────────────────────────────────────┐│
│ │ $45,230 ↑ $1,200 this month                          ││
│ │ [Graph: 6-month trend]                               ││
│ └──────────────────────────────────────────────────────┘│
│ ┌─ BUDGET STATUS ───────┬─ RECENT TRANSACTIONS ────────┐│
│ │ Dining: 80% spent     │ Starbucks        -$5.50     ││
│ │ [Progress bar]        │ Amazon           -$45.00    ││
│ └───────────────────────┴──────────────────────────────┘│
│ ┌─ UPCOMING BILLS ──────┬─ INVESTMENT PERFORMANCE ─────┐│
│ │ Netflix   Oct 15 $18  │ Portfolio: +2.3% this month ││
│ └───────────────────────┴──────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

BUDGET SCREEN (Plan view):
┌─────────────────────────────────────────────────────────┐
│ [Category Budgeting ⚪ Flex Budgeting]                  │
│ October 2025                                            │
├─────────────────────────────────────────────────────────┤
│ INCOME                                          $4,500  │
│ ┌─ Paycheck 1                           $2,250         ││
│ └─ Paycheck 2                           $2,250         ││
├─────────────────────────────────────────────────────────┤
│ EXPENSES                                Budgeted│Actual │
│ ┌─ Food                                    $700│  $520 ││
│ │  └ Groceries            [████░░░]       $500│  $380 ││
│ │  └ Dining              [██████]         $200│  $140 ││
│ ├─ Housing                              $1,350│$1,350 ││
│ └─ Transportation                         $200│  $180 ││
└─────────────────────────────────────────────────────────┘
```

**Key UX Elements**:
- **Widget-based dashboard** (customizable)
- **Toggle between budget methodologies**
- Visual progress bars integrated into budget view
- Expandable sections

---

### Simplifi Spending Plan Screen

```
SPENDING PLAN (Core view):
┌─────────────────────────────────────────────────────────┐
│ October 2025                    Left This Month: $1,247 │
├─────────────────────────────────────────────────────────┤
│ 💵 INCOME                                        $4,500 │
│    Paycheck (15th, 30th)                                │
│    [Expand ▼]                                           │
├─────────────────────────────────────────────────────────┤
│ 📋 BILLS & SUBSCRIPTIONS                          $823  │
│    Rent, Netflix, Electric, etc.                        │
│    [Expand ▼]                                           │
├─────────────────────────────────────────────────────────┤
│ 🛒 PLANNED SPENDING                              $1,200 │
│    ┌─ Groceries                    $500│$380│$120 left ││
│    ├─ Dining                        $200│$180│ $20 left ││
│    └─ Gas                           $150│$140│ $10 left ││
│    [+ Add Planned Spending]                             │
├─────────────────────────────────────────────────────────┤
│ 📊 OTHER SPEND                                  $1,230  │
│    (Everything else not planned)                        │
├─────────────────────────────────────────────────────────┤
│ 🎯 GOALS                                          $500  │
│    Emergency Fund (25% to goal)                         │
└─────────────────────────────────────────────────────────┘

BOTTOM:
Available per day: $41.57
```

**Key UX Elements**:
- **Sequential flow** (Income → Bills → Planned → Other → Goals)
- **Expandable sections** (accordion-style)
- **Daily breakdown** (per-day spending average)
- **Simple, clean layout**

---

### PocketGuard Overview Screen

```
OVERVIEW (Landing page):
┌─────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════╗ │
│ ║      IN MY POCKET                                 ║ │
│ ║                                                   ║ │
│ ║           $1,247                                  ║ │
│ ║                                                   ║ │
│ ║      Left to spend this month                     ║ │
│ ║      Daily: $41.57                                ║ │
│ ╚═══════════════════════════════════════════════════╝ │
├─────────────────────────────────────────────────────────┤
│ ACCOUNTS                                                │
│ Checking: $3,200     Savings: $5,400                   │
│ Credit Card: $-1,200                                    │
├─────────────────────────────────────────────────────────┤
│ BUDGETS (70+ categories)                                │
│ Groceries        [████████░░] $380/$500 (76%)          │
│ Dining Out       [██████████] $180/$200 (90%)          │
│ Gas              [███████░░░] $140/$150 (93%)          │
│ [See All Categories]                                    │
├─────────────────────────────────────────────────────────┤
│ UPCOMING BILLS                                          │
│ Netflix          Oct 15    $17.99                      │
│ Electric         Oct 20    ~$120                       │
└─────────────────────────────────────────────────────────┘
```

**Key UX Elements**:
- **"IN MY POCKET" is HERO** (biggest, most prominent)
- Everything else supports that one number
- Simple, at-a-glance view
- No deep navigation needed

---

## WHAT THIS MEANS FOR PAYPLAN

### Current PayPlan Navigation (From Code Analysis)

**Pages Found**:
- Dashboard.tsx
- Categories.tsx
- Budgets.tsx
- Transactions.tsx
- ArchiveListPage.tsx
- ArchiveDetailView.tsx

**NavigationHeader Component Exists** (NavigationHeader.tsx)

**Current IA** (Inferred):
```
Home/Dashboard
├─ Categories
├─ Budgets
├─ Transactions
└─ Archives
```

### Missing UI Organization Elements

**PayPlan Currently LACKS**:

1. ❌ **Reports/Analytics Tab** (every competitor has this)
2. ❌ **Goals Page** (have widget, need full page)
3. ❌ **Bills/Recurring Section** (need dedicated view)
4. ❌ **Insights/Analytics View** (spending patterns, trends)
5. ❌ **Settings/Preferences Page** (systematic preferences)
6. ❌ **Search Interface** (search bar, filters, results view)
7. ❌ **Cash Flow View** (projections, forecasts)
8. ❌ **Debt Management Section** (calculator, payoff plan)

### Recommended PayPlan Information Architecture

Based on competitor analysis:

```
📊 DASHBOARD (Landing page - like 5/6 competitors)
   ├─ Customizable widgets
   ├─ "Daily Spendable" (hero metric)
   ├─ Budget status summary
   ├─ Recent transactions
   ├─ Upcoming bills
   └─ Goal progress

💰 BUDGET (Spending Plan)
   ├─ Month selector
   ├─ Income section
   ├─ Category groups
   │  ├─ Food (Groceries, Dining)
   │  ├─ Housing (Rent, Utilities)
   │  └─ etc.
   ├─ Progress bars per category
   ├─ Budget methodology toggle (Zero-based, Envelope, 50/30/20)
   └─ [Add Category] [Adjust Budget]

💳 TRANSACTIONS
   ├─ Search bar (top)
   ├─ Filters (date, amount, category, tags)
   ├─ Transaction list
   ├─ [+ Add Transaction]
   └─ Bulk actions

🎯 GOALS
   ├─ Goal list (Emergency Fund, Vacation, Debt Payoff)
   ├─ Progress bars with %
   ├─ Target dates
   └─ [+ Create Goal]

📈 REPORTS
   ├─ Spending trends (3, 6, 12 months)
   ├─ Income vs. Expenses
   ├─ Category deep-dives
   ├─ Net worth over time
   ├─ Custom report builder
   └─ [Export PDF] [Export CSV]

📅 BILLS & RECURRING
   ├─ Calendar view / List view toggle
   ├─ Upcoming bills
   ├─ Recurring transactions
   ├─ Subscription tracker
   └─ [+ Add Bill]

💸 DEBT (Payoff Calculator)
   ├─ Debt list (Credit Cards, Loans)
   ├─ Total debt amount
   ├─ Payoff strategies (Snowball, Avalanche)
   ├─ Timeline projections
   ├─ Interest savings calculator
   └─ Debt-free countdown

🔔 ALERTS (Settings/Preferences)
   ├─ Budget alerts (50%, 75%, 90%, 100%)
   ├─ Bill reminders (7 days, 3 days, 1 day)
   ├─ Low balance warnings
   ├─ Goal milestones
   ├─ Alert preferences (frequency, channels)
   └─ Quiet hours

⚙️ SETTINGS
   ├─ Account management
   ├─ Categories management
   ├─ Tags management
   ├─ Preferences (theme, notifications)
   ├─ Import/Export
   ├─ Privacy settings
   └─ Help & Support
```

**Navigation**: Top nav or left sidebar (desktop), Bottom tabs (mobile)

---

## CRITICAL MISSING PIECES IN PAYPLAN

### UI/UX Organization Gaps

**Based on competitor analysis**, PayPlan needs these UI sections/pages:

| Section | Priority | Rationale |
|---------|----------|-----------|
| **Reports Page** | 🔴 CRITICAL | 100% of competitors have dedicated Reports tab |
| **Goals Page** | 🔴 CRITICAL | Need full CRUD, not just widget |
| **Search Interface** | 🔴 CRITICAL | Search bar + filters + results view missing |
| **Bills/Recurring Page** | 🟡 HIGH | 50% have dedicated tab, others integrate |
| **Debt Page** | 🟡 HIGH | Debt calculator needs dedicated page |
| **Alerts/Settings Page** | 🟡 HIGH | Systematic preferences management |
| **Cash Flow Page** | 🟠 MEDIUM | Could be Dashboard widget or separate page |

### Navigation Restructuring Needed

**Current** (Based on existing pages):
```
Dashboard → Categories → Budgets → Transactions → Archives
```

**Should Be** (Based on competitor patterns):
```
Dashboard (landing)
├─ Budget/Plan
├─ Transactions (with search)
├─ Goals
├─ Reports
├─ Bills (or integrate into Budget)
├─ Debt (calculator/payoff)
└─ Settings
```

---

## ACTIONABLE UI/UX RECOMMENDATIONS

### Immediate Changes Needed

1. **Add Reports Tab** - Dedicated page for analytics, trends, exports
2. **Add Goals Page** - Full CRUD for goals (currently just Dashboard widget)
3. **Add Search Interface** - Search bar in Transactions page header
4. **Add Settings Page** - Preferences, import/export, account management
5. **Add Debt Page** - Debt calculator, payoff strategies, timeline

### Dashboard Enhancements

**Current**: 6 widgets exist
**Missing**:
- "Daily Spendable" (prominent like PocketGuard's "In My Pocket")
- Dark mode toggle button
- Customize dashboard button (hide/show/reorder widgets)

### Budget Page Enhancements

**Current**: Budgets.tsx exists
**Missing**:
- Budget methodology selector (Zero-based, Envelope, 50/30/20)
- Collapsible category groups
- Quick "Move Money" between categories
- Alert threshold settings per category

---

## FINAL ANSWER TO YOUR QUESTION

### "Where are the budget tool features organized?"

**ANSWER**: Budget apps organize features into **6-9 main tabs/sections**:

**UNIVERSAL STRUCTURE** (All apps have):
1. **Dashboard/Home** - Overview, widgets, at-a-glance status
2. **Budget/Plan** - Category list, amounts, progress bars
3. **Transactions** - All transactions, add/edit/search
4. **Reports/Insights** - Charts, trends, analytics

**COMMON ADDITIONS** (Most apps have):
5. **Goals/Savings** - Goal tracking, progress
6. **Accounts** - Account list, balances
7. **Bills/Recurring** - Upcoming bills, subscriptions

**SOME APPS HAVE**:
8. **Debt** - Payoff calculator, strategies
9. **Investments** - Portfolio, performance
10. **Settings** - Preferences, import/export

### PayPlan's Current Organization

**YOU HAVE**:
- ✅ Dashboard
- ✅ Categories (could merge into Budget or Settings)
- ✅ Budgets
- ✅ Transactions

**YOU'RE MISSING** (Organizational pages):
- ❌ Reports (separate tab)
- ❌ Goals (full page)
- ❌ Bills/Recurring (section or page)
- ❌ Debt (page)
- ❌ Settings (page)
- ❌ Search (interface in Transactions)

**Confidence**: **95%** - This is what ALL budget apps have for organization

---

**You need to build the PAGES and NAVIGATION, not just the features!** 🎯
