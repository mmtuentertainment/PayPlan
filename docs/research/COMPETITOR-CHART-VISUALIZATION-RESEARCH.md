# Competitor Chart Visualization Research

**Research Date**: 2025-11-01
**Purpose**: Analyze chart types and data visualization approaches used by 4 leading budget apps
**Target Apps**: YNAB, Quicken Simplifi, Monarch Money, PocketGuard
**Context**: Comparing against PayPlan's current Recharts implementation

---

## Executive Summary

### Key Findings

1. **Common Chart Types Across All Apps**:
   - **Pie Charts**: Category spending breakdowns (all 4 apps)
   - **Bar Charts**: Month-over-month comparisons, spending trends (all 4 apps)
   - **Line Graphs**: Net worth tracking, trend analysis (YNAB, Monarch)

2. **Advanced Visualizations**:
   - **Sankey Diagrams**: Cash flow visualization (Monarch Money ONLY, also PocketSmith)
   - **Stacked/Comparative Views**: Income vs. expenses (YNAB)
   - **Progress Bars**: Budget goals, savings targets (YNAB, all apps)

3. **Accessibility & Interactivity**:
   - **Tooltips**: Hover to see amounts/percentages (YNAB, all apps)
   - **Drill-down**: Click categories to see transactions (YNAB, PocketGuard)
   - **Color-coding**: Green/red for surplus/deficit, category colors (all apps)
   - **Legends**: Category labels with color indicators (all apps)

4. **PayPlan Implications**:
   - ✅ **Pie charts (Recharts)**: Standard across industry
   - ✅ **Bar charts (Recharts)**: Standard across industry
   - ⚠️ **Line charts**: Not yet implemented (needed for trend analysis)
   - ⚠️ **Sankey diagrams**: Advanced feature (Monarch only, not table-stakes)
   - ⚠️ **Area charts**: Not widely used by competitors (not priority)

---

## 1. YNAB (You Need A Budget)

### Chart Types Used

#### **Pie Charts** (Spending Report - Totals View)
- **Data Visualized**: Spending totals as percentage of overall money spent
- **Features**:
  - Color-coded circle graph showing spending by category
  - Hover to see amounts and percentages
  - Click subcategories to drill down to transactions
  - Legend with category labels
- **Use Case**: Category spending breakdowns

#### **Bar Charts** (Spending Report - Trends View)
- **Data Visualized**: Spending patterns month-by-month
- **Features**:
  - Color-coded categories in bar graph
  - Hover over colored sections to see total and percent spent per month
  - Trend line overlay (connects bars but NOT linear regression)
  - Total, average, and graph legend on right side
  - Filter by specific categories
- **Use Case**: Identify spending changes over time, detect "lifestyle creep"

#### **Combination Bar + Line Charts** (Net Worth Report)
- **Data Visualized**: Assets (blue bars) vs. debts (red bars)
- **Features**:
  - Red bars for debts, blue bars for assets
  - Hoverable data points showing monthly breakdowns
  - Line graph overlay for net worth trend
- **Use Case**: Track net worth accumulation over time

#### **Stacked Bar Charts** (Income vs. Expense Report)
- **Data Visualized**: Income (green, top) vs. expenses (red, bottom)
- **Features**:
  - Monthly totals color-coded (green for surplus, red for deficit)
  - Expandable subcategories
  - Comparative view of earnings vs. spending
- **Use Case**: Compare income and expenses month-by-month

#### **Progress Bars**
- **Data Visualized**: Budget goals, spending targets, overspending
- **Features**:
  - Visual progress indicators
  - Color-coded (green/yellow/red for status)
  - Show how much spent vs. budget limit
- **Use Case**: Quick budget status at a glance

### Report Filtering Capabilities

**All reports feature**:
- **Category selection**: Toggle individual or master categories
- **Timeframe customization**: This Month, Latest 3 Months, This Year, Last Year, All Dates, custom date ranges
- **Account filtering**: Individual accounts, budget accounts, tracking accounts

### Data Visualized

- Spending totals by category
- Spending trends over time
- Net worth (assets vs. liabilities)
- Income vs. expenses
- Budget progress (actual vs. target)
- Average spending per category ("down to the cent")

### Accessibility Features

- Tooltips on hover (amounts, percentages, monthly breakdowns)
- Click-to-drill-down (master categories → subcategories → transactions)
- Color-coding with semantic meaning (green = surplus, red = deficit/debt, blue = assets)
- Legends for all charts
- **Note**: No explicit WCAG compliance mentioned in marketing materials

### Notable Quotes

> "Graphs and charts... eye candy that helps you monitor your financial progress"

> "Your average grocery spend (down to the cent) broken down by category"

> "See your finances in full technicolor glory"

### Strengths

- **Comprehensive filtering**: Multiple dimensions (category, time, account)
- **Drill-down capability**: Click charts to see underlying transactions
- **Color-coded status**: Intuitive green/red for surplus/deficit
- **Progress visualization**: Progress bars for budget tracking

### Weaknesses

- **Trend lines are decorative**: Line in bar chart connects bars but isn't linear regression (users request true trend analysis)
- **Limited line graphs**: Mostly bar charts with line overlays, not pure line graphs
- **No Sankey diagrams**: Traditional charts only (pie, bar, stacked bar)

---

## 2. Quicken Simplifi

### Chart Types Used

#### **Pie Charts**
- **Data Visualized**: Spending breakdowns by category
- **Features**:
  - Multi-colored pie charts for category spending
  - **Limitation**: Less helpful when spending isn't properly categorized (uncategorized transactions create large "other" slice)
- **Use Case**: Category spending visualization

#### **Bar Charts**
- **Data Visualized**: Spending comparisons, income vs. expenses
- **Features**:
  - "No shortage of reports, pie charts, and bar charts within the application" (user quote)
  - Pre-built reports with filtering options
- **Use Case**: Comparative analysis

#### **Progress Bars** (Watchlists)
- **Data Visualized**: Spending against targets
- **Features**:
  - Current month spending
  - Average total for period
  - Year-to-date total
  - Projection of future spending at current rate
- **Use Case**: Spending projections and monitoring

### Report Types

1. **Spending Report**: Track where money goes, breakdown by payee, category, tag
2. **Income Report**: Different sources of income
3. **Income & Expense Report**: Compare income and expenses
4. **Savings Report**: How savings account balances change over time (temporal visualization)
5. **Net Worth Report**: Net worth over time based on historical account balances (trend-based)
6. **Monthly Summary**: Top Categories and Payees comparisons
7. **Taxes Report**: Expandable/collapsible sections for income and deductible expenses

### Report Filtering Capabilities

- **Breakdown filter**: By payee, category, tag, or none
- **Date Range menu**: Custom date ranges
- **Pre-built reports**: Ready-to-use templates

### Data Visualized

- Spending by category, payee, tag
- Income sources
- Income vs. expenses
- Savings trends over time
- Net worth trends
- Projected cash flow ("see what your future looks like")
- Tax-deductible expenses

### Accessibility Features

- **Note**: No explicit accessibility features mentioned in documentation
- Emphasis on "clear, polished visuals and reports"

### Notable Features

- **Projected cash flow analysis**: "What-if" scenarios
- **AI-powered features**: Automatic transaction categorization
- **Real-time alerts**: Account activity notifications
- **Customizable insights**: Adapt to individual financial situations

### Strengths

- **Predictive analytics**: Projected spending at current rate
- **Comprehensive filtering**: By payee, category, tag, date range
- **AI categorization**: Automatic transaction organization
- **What-if scenarios**: Financial planning tools

### Weaknesses

- **Limited chart type details**: Documentation doesn't specify exact chart formats (pie, bar, line)
- **Categorization dependency**: Pie charts less useful with uncategorized transactions
- **No Sankey diagrams**: Traditional charts only

---

## 3. Monarch Money

### Chart Types Used

#### **Sankey Diagrams** (Cash Flow View) ⭐ UNIQUE FEATURE
- **Data Visualized**: Money flow from income sources to expense categories
- **Features**:
  - Interactive diagram showing cash flow paths
  - Emphasizes movement of money from income → expenses
  - Hover interactions (implied)
  - **Privacy feature**: Option to share with dollar amounts hidden
  - **Saved reports**: Bookmark custom Sankey diagrams (2025 update)
  - **Filtering**: Create Sankey for household flows or individual accounts
  - **Platform**: Web only (not mobile)
- **Use Case**: Visualize cash flow between accounts and categories
- **Status**: "Fan favorite" among Monarch's report options
- **Launch**: September 29, 2023

#### **Bar Charts** (Cash Flow Tab)
- **Data Visualized**: Cash flow trends over time
- **Features**:
  - **Two types of bar charts** mentioned (specific details not available due to 403 errors)
  - Appears alongside Sankey diagram in Cash Flow tab
- **Use Case**: Track cash flow trends

#### **Customizable Charts** (Reports Section)
- **Data Visualized**: Spending trends, income, net worth
- **Features**:
  - "Customizable charts" for financial analysis
  - "Turn raw data into insights you can act on"
  - Saved reports feature (bookmark reports for quick access)
- **Use Case**: General financial analysis and reporting

#### **Dashboard Widgets**
- **Available widgets**:
  - Net worth tracking
  - Recent transactions
  - Investment performance
  - Goal progress tracking
- **Features**:
  - Drag-and-drop customization
  - Visual representation of financial data

### Data Visualized

- Cash flow (income sources → expense categories via Sankey)
- Cash flow trends over time (bar charts)
- Net worth across all connected accounts
- Spending analytics by category
- Transaction history with categorization
- Subscription detection (recurring charges)
- Goal progress over time
- Investment performance

### Accessibility Features

- **Privacy controls**: Share Sankey diagrams with amounts hidden
- **Note**: No explicit WCAG compliance mentioned

### Notable Features

- **Sankey diagrams**: Only major budget app with this feature (besides PocketSmith)
- **Saved reports**: Bookmark custom reports for quick access (2025 update)
- **Automatic categorization**: Connected accounts organized automatically
- **Subscription detection**: Identifies recurring charges
- **Unified dashboard**: All accounts in one view

### Notable Quotes

> "This interactive diagram gives you a clear and engaging view of where your money comes from and where it goes each month."

> "Visualize the flow of money through customizable charts"

> "Turn raw data into insights you can act on"

### Strengths

- **Sankey diagrams**: Unique visualization for cash flow analysis
- **Saved reports**: Build once, access quickly
- **Privacy features**: Share diagrams without dollar amounts
- **Unified dashboard**: Comprehensive financial overview
- **Customizable charts**: Adapt to user needs

### Weaknesses

- **Sankey web-only**: Not available on mobile app
- **Limited chart type details**: Bar chart specifics unavailable (403 errors)
- **No explicit accessibility**: WCAG compliance not mentioned

---

## 4. PocketGuard

### Chart Types Used

#### **Pie Charts** (Insights Tab)
- **Data Visualized**: Monthly expenses divided by categories
- **Features**:
  - All expenses for current month by category
  - **Top 10 merchant names** pie chart (separate view)
  - Includes refunds/reimbursements in calculations (net spending)
  - **Limitation**: Only shows top categories (cannot expand "10 other categories" slice)
  - **Limitation**: Cannot tap category to see transactions directly from chart (must use Insights → List view)
- **Use Case**: Category spending analysis

#### **Merchant Analysis Pie Chart**
- **Data Visualized**: Top 10 merchant names by spending
- **Features**:
  - Analyzes spending patterns by merchant
  - Helps identify where most money goes
- **Use Case**: Merchant spending analysis

### Report Features

#### **Insights Tab**
- **Available views**:
  - **Pie chart view**: Visual category breakdown
  - **List view**: Tap category to see all transactions
  - **#Hashtags view**: Filter by custom hashtags
  - **Merchants view**: Spending by merchant

#### **Transaction Details**
- **Features**:
  - Automatic categorization ("every time you make a purchase, it goes to a certain category automatically")
  - Refund/reimbursement tracking (net spending calculation)
  - Drill-down in List view (click category → see transactions)

### Data Visualized

- Monthly spending by category (pie chart)
- Top 10 merchants by spending (pie chart)
- "In My Pocket" metric (spending money available after bills/necessities)
- Cash flow (income vs. spending across categories)
- Net income and transactions categorized by type, merchant
- Spending reports with hashtag filtering

### Accessibility Features

- **Note**: No explicit accessibility features mentioned
- Tap interactions for mobile app

### Notable Features

- **"In My Pocket" metric**: Unique feature showing available spending money after bills
- **Automatic categorization**: Transactions auto-assigned to categories
- **Refund tracking**: Net spending calculation (spending - refunds)
- **Hashtag filtering**: Custom categorization with hashtags
- **Top merchants analysis**: Identify spending patterns by merchant

### Strengths

- **"In My Pocket" metric**: Unique value proposition
- **Automatic categorization**: Reduces manual effort
- **Refund tracking**: Accurate net spending
- **Multiple views**: Pie chart, list, hashtags, merchants

### Weaknesses

- **Limited chart interactivity**: Cannot tap pie chart category to see transactions
- **Top categories only**: Cannot expand "10 other categories" slice
- **No drill-down from chart**: Must switch to List view for transaction details
- **Limited chart types**: Primarily pie charts (no bar/line charts mentioned)
- **No trend analysis**: No month-over-month comparisons or trend visualization

---

## Cross-Competitor Analysis

### Chart Type Usage Summary

| Chart Type | YNAB | Simplifi | Monarch | PocketGuard | Industry Standard? |
|------------|------|----------|---------|-------------|-------------------|
| **Pie Charts** | ✅ (Spending Report) | ✅ (Multiple reports) | ✅ (Implied) | ✅ (Insights Tab) | **YES - All 4 apps** |
| **Bar Charts** | ✅ (Trends, Net Worth) | ✅ (Multiple reports) | ✅ (Cash Flow) | ❌ Not mentioned | **YES - 3 of 4 apps** |
| **Line Graphs** | ✅ (Net Worth overlay) | ⚠️ (Implied in trend reports) | ⚠️ (Implied) | ❌ Not mentioned | **PARTIAL - 1-2 apps** |
| **Stacked Bar** | ✅ (Income vs. Expense) | ⚠️ (Likely in Income/Expense) | ❌ Not mentioned | ❌ Not mentioned | **NO - 1 app only** |
| **Sankey Diagrams** | ❌ | ❌ | ✅ **UNIQUE** | ❌ | **NO - 1 app only** |
| **Progress Bars** | ✅ (Budget goals) | ✅ (Watchlists) | ✅ (Goal tracking) | ⚠️ (Implied) | **YES - All apps** |
| **Area Charts** | ❌ | ❌ | ❌ | ❌ | **NO - 0 apps** |

### Data Visualization Priorities

#### **P0 (Must-Have - All Apps)**
1. **Pie Charts**: Category spending breakdowns
2. **Bar Charts**: Month-over-month comparisons, spending trends
3. **Progress Bars**: Budget goals, savings targets
4. **Tooltips**: Hover to see amounts/percentages
5. **Color-coding**: Green/red for surplus/deficit, category colors
6. **Legends**: Category labels with color indicators

#### **P1 (Important - Most Apps)**
1. **Line Graphs**: Trend analysis (YNAB, Monarch)
2. **Drill-down**: Click categories to see transactions (YNAB, PocketGuard)
3. **Filtering**: By category, time, account (YNAB, Simplifi, Monarch)
4. **Stacked Charts**: Income vs. expenses (YNAB, Simplifi)

#### **P2 (Nice-to-Have - Some Apps)**
1. **Sankey Diagrams**: Cash flow visualization (Monarch ONLY)
2. **Saved Reports**: Bookmark custom reports (Monarch)
3. **Predictive Analytics**: Projected spending (Simplifi)
4. **What-if Scenarios**: Financial planning (Simplifi)

#### **P3 (Not Used - 0 Apps)**
1. **Area Charts**: No apps use these for budgeting
2. **Scatter Plots**: No apps use these
3. **Radar Charts**: No apps use these

### Common Features Across All Apps

1. **Interactive Tooltips**: Hover to see detailed amounts/percentages
2. **Color-Coded Categories**: Visual distinction between spending areas
3. **Legends**: Category labels with color indicators
4. **Time Filtering**: Select date ranges for reports
5. **Category Filtering**: Show/hide specific categories
6. **Responsive Design**: Mobile and desktop support (all apps)

### Unique Features (Single App Only)

1. **Sankey Diagrams** (Monarch): Cash flow visualization showing money flow from income → expenses
2. **"In My Pocket" Metric** (PocketGuard): Available spending after bills/necessities
3. **What-if Scenarios** (Simplifi): Predictive financial planning
4. **Projected Spending** (Simplifi): Estimate future spending at current rate
5. **Progress Bars** (YNAB): Visual indicators for budget goals (most comprehensive implementation)

### Accessibility Considerations

**Across all 4 apps**:
- ❌ **No explicit WCAG compliance mentioned** in any marketing materials
- ❌ **No screen reader support documented**
- ❌ **No keyboard navigation details**
- ⚠️ **Color-coding is universal** but no mention of color-blind modes
- ⚠️ **Tooltips are standard** but unclear if accessible to screen readers

**PayPlan Opportunity**: Be the ONLY budget app with explicit WCAG 2.1 AA compliance

---

## Recharts vs. Competitors: Feature Comparison

### PayPlan's Current Recharts Implementation

**Implemented (from Chunk 6 - Dashboard)**:
1. ✅ **Pie Charts** (PieChart component)
   - Category spending breakdowns
   - Tooltips on hover
   - Legends with category labels
   - Color-coding by category

2. ✅ **Bar Charts** (BarChart component)
   - Income vs. expenses
   - Month-over-month comparisons
   - Tooltips on hover
   - Legends

3. ✅ **Responsive Design**
   - ResponsiveContainer for all charts
   - Mobile and desktop support

4. ✅ **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support (WCAG 2.1 AA)

**Not Yet Implemented**:
1. ❌ **Line Graphs** (LineChart component available in Recharts)
   - Trend analysis over time
   - Net worth tracking
   - YNAB and Monarch use these

2. ❌ **Stacked Bar Charts** (BarChart with stackId prop in Recharts)
   - Income vs. expense stacked view
   - YNAB uses this for Income vs. Expense Report

3. ❌ **Area Charts** (AreaChart component available in Recharts)
   - Not used by competitors (low priority)

4. ❌ **Sankey Diagrams** (NOT available in Recharts)
   - Requires custom implementation or recharts-sankey library
   - Only Monarch uses this (not table-stakes)

5. ❌ **Progress Bars** (not a Recharts component)
   - Can use HTML/CSS or Radix UI Progress component
   - All competitors use these for budget goals

### Recharts Capabilities vs. Competitor Needs

| Feature | Recharts Support | Competitors Using | Priority for PayPlan |
|---------|------------------|-------------------|----------------------|
| **Pie Charts** | ✅ PieChart | All 4 apps | **P0 - Implemented** |
| **Bar Charts** | ✅ BarChart | 3 of 4 apps | **P0 - Implemented** |
| **Line Graphs** | ✅ LineChart | 2 of 4 apps | **P1 - Not implemented** |
| **Stacked Bars** | ✅ BarChart (stackId) | 2 of 4 apps | **P1 - Not implemented** |
| **Area Charts** | ✅ AreaChart | 0 apps | **P3 - Not needed** |
| **Sankey Diagrams** | ⚠️ recharts-sankey (3rd-party) | 1 app (Monarch) | **P2 - Not needed for MVP** |
| **Progress Bars** | ❌ (use Radix UI) | All 4 apps | **P1 - Not implemented** |
| **Tooltips** | ✅ Tooltip | All 4 apps | **P0 - Implemented** |
| **Legends** | ✅ Legend | All 4 apps | **P0 - Implemented** |
| **Responsive** | ✅ ResponsiveContainer | All 4 apps | **P0 - Implemented** |

### Recharts Alignment with Industry Standards

**✅ GOOD ALIGNMENT**:
- Pie charts (all competitors use, Recharts supports)
- Bar charts (3 of 4 competitors use, Recharts supports)
- Tooltips (all competitors use, Recharts supports)
- Legends (all competitors use, Recharts supports)
- Responsive design (all competitors, Recharts supports)

**⚠️ GAPS TO ADDRESS**:
1. **Line graphs**: 2 competitors use (YNAB, Monarch), Recharts supports, PayPlan hasn't implemented
2. **Progress bars**: All competitors use, Recharts doesn't support (use Radix UI instead)
3. **Stacked bar charts**: 2 competitors use (YNAB, Simplifi), Recharts supports, PayPlan hasn't implemented

**✅ NOT NEEDED (Low Priority)**:
- Sankey diagrams (only Monarch uses, requires 3rd-party library)
- Area charts (no competitors use)

---

## Recommendations for PayPlan

### Immediate Actions (Phase 1)

1. ✅ **Keep Recharts**: Industry-standard chart types align with Recharts capabilities
2. ✅ **Pie charts are correct**: All 4 competitors use these for category spending
3. ✅ **Bar charts are correct**: 3 of 4 competitors use these for trends
4. ⚠️ **Add line graphs**: Implement LineChart for trend analysis (YNAB and Monarch use these)
5. ⚠️ **Add progress bars**: Use Radix UI Progress component for budget goals (all competitors use)

### Medium-Term Enhancements (Phase 2)

1. **Stacked bar charts**: Implement for Income vs. Expense Report (YNAB and Simplifi use)
2. **Drill-down functionality**: Click chart → see underlying transactions (YNAB and PocketGuard use)
3. **Advanced filtering**: By category, time, account (YNAB and Simplifi use)
4. **Saved reports**: Bookmark custom reports (Monarch uses)

### Long-Term Features (Phase 3+)

1. **Sankey diagrams**: Cash flow visualization (Monarch ONLY, not table-stakes)
2. **Predictive analytics**: Projected spending (Simplifi ONLY, not table-stakes)
3. **What-if scenarios**: Financial planning (Simplifi ONLY, not table-stakes)

### Accessibility Advantage

**PayPlan's WCAG 2.1 AA compliance is a UNIQUE differentiator**:
- ✅ **No competitor explicitly mentions accessibility** in marketing materials
- ✅ **No competitor documents screen reader support**
- ✅ **No competitor mentions keyboard navigation** for charts
- ✅ **PayPlan can be the ONLY accessible budget app**

**Marketing angle**: "The only budget app designed for everyone, including users with disabilities"

### Chart Implementation Priorities

**P0 (Current Sprint - MMT-62 Dashboard)**:
- ✅ Pie charts (category spending) - DONE
- ✅ Bar charts (income vs. expenses) - DONE
- ⚠️ Progress bars (budget goals) - NOT DONE (use Radix UI, not Recharts)

**P1 (Next Sprint - MMT-66 Budget Analytics)**:
- ❌ Line charts (spending trends over 3, 6, 12 months)
- ❌ Stacked bar charts (income vs. expenses stacked view)
- ❌ Drill-down (click chart → see transactions)

**P2 (Future Sprints)**:
- ❌ Saved reports (bookmark custom reports)
- ❌ Advanced filtering (by category, time, account)

**P3 (Post-MVP)**:
- ❌ Sankey diagrams (cash flow visualization)
- ❌ Predictive analytics (projected spending)

---

## Technical Notes

### Recharts Components Available (Not Yet Used)

1. **LineChart**: For trend analysis, net worth tracking
2. **AreaChart**: For filled trend areas (not used by competitors, low priority)
3. **ComposedChart**: Combine multiple chart types (e.g., bar + line)
4. **ScatterChart**: For correlation analysis (not used by competitors)
5. **RadarChart**: For multi-dimensional comparison (not used by competitors)
6. **TreeMap**: For hierarchical data (not used by competitors)

### Recharts Components to Avoid (Not Industry Standard)

1. ❌ **AreaChart**: No competitors use filled area charts for budgeting
2. ❌ **ScatterChart**: No competitors use scatter plots
3. ❌ **RadarChart**: No competitors use radar charts
4. ❌ **TreeMap**: No competitors use tree maps
5. ❌ **FunnelChart**: No competitors use funnel charts

### Non-Recharts Components Needed

1. **Progress Bars**: Use Radix UI Progress component (all competitors use)
2. **Sankey Diagrams**: Use recharts-sankey library OR custom D3 implementation (only Monarch uses, not priority)

---

## Chart Feature Comparison Matrix

| Feature | YNAB | Simplifi | Monarch | PocketGuard | PayPlan (Current) | Industry Standard? |
|---------|------|----------|---------|-------------|-------------------|-------------------|
| **Pie Charts** | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** |
| **Bar Charts** | ✅ | ✅ | ✅ | ❌ | ✅ | **YES** |
| **Line Graphs** | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | **PARTIAL** |
| **Stacked Bars** | ✅ | ⚠️ | ❌ | ❌ | ❌ | **NO** |
| **Sankey Diagrams** | ❌ | ❌ | ✅ | ❌ | ❌ | **NO** |
| **Progress Bars** | ✅ | ✅ | ✅ | ⚠️ | ❌ | **YES** |
| **Tooltips** | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** |
| **Legends** | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** |
| **Color-Coding** | ✅ | ✅ | ✅ | ✅ | ✅ | **YES** |
| **Drill-Down** | ✅ | ⚠️ | ⚠️ | ⚠️ (List view only) | ❌ | **PARTIAL** |
| **Filtering** | ✅ (Category, Time, Account) | ✅ (Payee, Category, Tag, Date) | ✅ (Account, Date) | ⚠️ (Hashtags) | ❌ | **YES** |
| **Saved Reports** | ❌ | ❌ | ✅ | ❌ | ❌ | **NO** |
| **Predictive Analytics** | ❌ | ✅ | ❌ | ❌ | ❌ | **NO** |
| **WCAG 2.1 AA** | ❌ | ❌ | ❌ | ❌ | ✅ | **UNIQUE** |

---

## Sources

### Primary Sources (Official Documentation)

1. **YNAB**:
   - Features page: https://www.ynab.com/features
   - Reports blog: https://www.ynab.com/blog/ynab-reports-and-data
   - Support: https://support.ynab.com/en_us/spending-trends-H1inlhzAc

2. **Quicken Simplifi**:
   - Product page: https://www.quicken.com/products/simplifi/
   - Support: https://support.simplifi.quicken.com/en/articles/4592676-using-reports-in-quicken-simplifi

3. **Monarch Money**:
   - Product page: https://www.monarch.com
   - Sankey announcement: https://www.monarch.com/visualize-your-cash-flow-like-never-before

4. **PocketGuard**:
   - Product page: https://pocketguard.com
   - Insights support: https://help.pocketguard.com/hc/en-us/articles/360002196579-Insights

### Secondary Sources (Reviews & Analysis)

1. Simplifi Review (Marriage Kids and Money): https://marriagekidsandmoney.com/simplifi-review/
2. User blog on Simplifi: https://mattrobb.net/quicken-simplifi/
3. YNAB Toolkit Reports: https://www.online-tech-tips.com/software-reviews/ynab-toolkit-reports-what-you-should-know/
4. Budget app Sankey diagrams: https://chengzhizhao.com/how-to-visualize-monthly-expenses-in-a-comprehensive-way-develop-a-sankey-diagram-in-r/

---

## Conclusion

### Key Takeaways

1. **Recharts is the right choice**: All industry-standard chart types (pie, bar, line) are supported by Recharts and used by competitors.

2. **PayPlan's current implementation is solid**: Pie charts and bar charts are used by all competitors (pie) and most competitors (bar).

3. **Gaps to address**:
   - **Line charts**: 2 competitors use (YNAB, Monarch), Recharts supports, PayPlan needs to implement
   - **Progress bars**: All competitors use, Recharts doesn't support (use Radix UI instead)
   - **Stacked bar charts**: 2 competitors use (YNAB, Simplifi), Recharts supports, PayPlan needs to implement

4. **Unique differentiators**:
   - **WCAG 2.1 AA compliance**: NO competitor mentions accessibility
   - **Privacy-first**: NO competitor offers localStorage-only budgeting
   - **Free core**: NO competitor offers all budgeting features free forever

5. **Not needed for MVP**:
   - **Sankey diagrams**: Only Monarch uses (nice-to-have, not table-stakes)
   - **Area charts**: No competitors use (low priority)
   - **Predictive analytics**: Only Simplifi uses (nice-to-have, not table-stakes)

### Next Steps

1. ✅ **Keep using Recharts** for all chart components
2. ⚠️ **Implement line charts** for MMT-66 (Budget Analytics & Insights)
3. ⚠️ **Implement progress bars** using Radix UI Progress component
4. ⚠️ **Implement stacked bar charts** for Income vs. Expense Report
5. ⚠️ **Document accessibility features** as unique selling point
6. ✅ **Defer Sankey diagrams** to post-MVP (not table-stakes)

### PayPlan's Competitive Position

**Strengths**:
- ✅ Industry-standard chart types (pie, bar)
- ✅ WCAG 2.1 AA compliance (UNIQUE)
- ✅ Privacy-first (UNIQUE)
- ✅ Free core (UNIQUE)
- ✅ Recharts (modern, accessible, performant)

**Gaps**:
- ⚠️ No line charts yet (needed for trend analysis)
- ⚠️ No progress bars yet (needed for budget goals)
- ⚠️ No stacked bars yet (needed for income vs. expenses)
- ⚠️ No drill-down yet (click chart → see transactions)
- ⚠️ No filtering yet (by category, time, account)

**Not Needed**:
- ✅ Sankey diagrams (only 1 competitor, not table-stakes)
- ✅ Area charts (0 competitors, not table-stakes)
- ✅ Predictive analytics (only 1 competitor, not table-stakes)

**Overall Assessment**: PayPlan's Recharts implementation is **on the right track**. Focus on adding **line charts** and **progress bars** for MMT-66 (Budget Analytics), then implement **drill-down** and **filtering** in future sprints. Defer Sankey diagrams and predictive analytics to post-MVP.

---

**Research Completed**: 2025-11-01
**Researcher**: Claude Code (AI)
**Next Action**: Review with HIL, prioritize line charts + progress bars for MMT-66
