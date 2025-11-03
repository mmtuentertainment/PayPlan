# Competitor Onboarding & Workflow Research

**Research Date**: 2025-11-01
**Apps Analyzed**: YNAB, Simplifi by Quicken, Monarch Money, PocketGuard
**Purpose**: Compare onboarding flows and core workflows to inform PayPlan's UX design

---

## 1. YNAB (You Need A Budget)

### Onboarding Sequence

**Estimated Time**: 20-30 minutes

**Initial Welcome**:
- After registration, users see a cordial welcome dialog
- Progress bar animates throughout onboarding to encourage completion
- Users can choose: jump into app immediately OR follow 6-step onboarding workflow

**Step-by-Step Flow**:

1. **Chapter 1: Build Your YNAB Template** (Personalization)
   - Customize pre-built categories (mortgage, groceries, home maintenance, vacation)
   - Add non-monthly expenses (holidays, car repairs, insurance)
   - Set category targets (amount + due date, e.g., "$2,400 for mortgage by the 1st")
   - Personalize with daily pleasures and major life goals

2. **Chapter 2: Collect Your Cash** (Account Setup)
   - Add checking account (especially most-used account)
   - Add savings account
   - Add credit cards used regularly
   - Option to link bank accounts automatically OR enter balances manually
   - **Skip for now**: loans, retirement accounts, HSAs, investments, anticipated paychecks

3. **Chapter 3: Give Every Dollar a Job** (Budget Assignment)
   - Apply YNAB Method by answering 5 questions for every dollar:
     1. **Reality**: What's needed before next paycheck?
     2. **Stability**: What larger expenses need preparation?
     3. **Resilience**: What can you save for next month?
     4. **Creation**: What goals matter to you?
     5. **Flexibility**: What adjustments are needed?
   - Bring "To Be Budgeted" box down to zero
   - Assign all available money to categories

4. **Chapter 4: Welcome to Spendfulness** (Ongoing Usage)
   - Begin recording transactions
   - Reassign budgets as needed
   - Repeat 5-question process with each paycheck

**Materials to Gather Before Starting**:
- Bank statements
- Credit card statements
- Login credentials (if linking accounts)
- Recent bills for monthly/non-monthly expenses
- Estimates of miscellaneous expenses
- A beverage of choice (YNAB adds personality!)

**Onboarding Philosophy**:
- **Education-first approach**: YNAB knows the biggest barrier isn't learning software, it's shifting mindset and creating budgeting habits
- **Friendly UX copywriting**: Cheerful, good-humored tone throughout
- **Progressive onboarding**: Daily emails for 1 week with getting started resources (video + text)
- **Guided discovery**: Users discover functionalities step-by-step rather than all at once

**Empty State Handling**:
- Pre-built categories shown on first login (not truly empty)
- Banner checklist appears on top to help get started
- New month shows all assigned amounts as empty (encourages re-budgeting)
- Main screen layout: accounts (left), budget categories (middle), To Be Budgeted (top), totals (right)

**Tutorial/Help During Onboarding**:
- Welcome dialog with clear next steps
- Progress bar showing completion status
- Option to skip onboarding and explore independently
- Daily email sequence (1 week) with resources
- Getting started videos and text guides
- Optional: Join 1-week getting started challenge

---

### Core Workflows

#### 1. Add Transaction

**Two Methods**:

**A. Manual Entry** (Recommended by YNAB):
- Enter transaction immediately after purchase
- Fields: amount, payee, category, account
- YNAB matches manual entry with bank import later

**B. Automatic Import**:
- Link bank account to YNAB
- Balances and transactions auto-sync
- Review and categorize imported transactions

**Frequency**: Check app every 2-3 days to review and categorize transactions (takes just a few minutes)

#### 2. Create Budget

**Process**:
1. Add accounts (linked or manual balances)
2. Create categories for expenses
3. Set spending/savings target for every category
4. Handle "To Be Budgeted" pot of money
5. Assign every dollar to a category (zero-based budgeting)

**Category Targets**:
- **Weekly goals**: YNAB multiplies by weeks in month for monthly total
- **Monthly goals**: Set fixed amount per month
- **Yearly goals**: Set annual amount (YNAB calculates monthly portion)
- **Custom goals**: Set by date or dollar amount
- **Debt payoff**: Pay off balance over time (by amount or date)

**Philosophy**: Zero-based budgeting = every dollar has a job (including savings)

#### 3. Track Goal

**Goal Types**:
- **Weekly**: Set weekly amount, auto-calculates monthly
- **Monthly**: Fixed amount each month
- **Yearly**: Annual target broken into monthly portions
- **Custom**: By dollar amount or specific date
- **Debt payoff**: Pay balance over time

**Goal Features**:
- Visual progress bars
- Target amounts and dates
- Auto-calculation of monthly contributions
- Longer-term goals can be set by date or amount

#### 4. Reconcile Account

**Process**:
1. Check that Cleared/Uncleared transactions are correct
2. Click circle in far right column to mark transactions cleared
3. Log into bank and check current balance
4. In YNAB, tap More menu → Reconcile
5. Enter current balance from bank
6. YNAB calculates what balance should be
7. If numbers match: success! If not: find discrepancy or create adjustment transaction

**Best Practice**: Reconcile every 2-3 days when reviewing transactions

---

### Time to First Value

**Absolute Minimum**: User can assign their first dollar to a category within 5 minutes of signing up (if skipping most onboarding)

**Recommended Path**: 20-30 minutes to complete full onboarding and create meaningful budget

**Ongoing Maintenance**: 2-3 minutes every 2-3 days to review transactions

---

## 2. Simplifi by Quicken

### Onboarding Sequence

**Estimated Time**: ~10 minutes (stated in official docs)

**Initial Questions**: During first sign-in, Simplifi asks a few questions about current finances

**Step-by-Step Flow**:

1. **Step 1: Basic Information**
   - Enter name
   - Enter ZIP code
   - Creates foundation for personalized dashboard

2. **Step 2: Add Accounts** (MANDATORY)
   - Connect financial accounts for consolidated view
   - Choose: linked accounts OR manual accounts
   - Uses bank-level encryption through Intuit
   - If multiple accounts at same bank, Simplifi usually finds all after one login
   - **Important**: Must add at least one account to proceed (cannot skip)
   - Can add missed accounts later

3. **Step 3: Review and Rename Accounts**
   - See all discovered accounts
   - Customize account names for daily use
   - Make names more meaningful/recognizable

4. **Step 4: Verify Recurring Income**
   - Simplifi shows detected recurring deposits from transaction history
   - **Critical step**: Review carefully
   - System uses sophisticated algorithm but isn't perfect
   - Can deselect suggestions or add additional transactions

5. **Step 5: Confirm Recurring Bills**
   - Review detected recurring expenses
   - Simplifi creates Recurring Transactions from this data
   - Bills and paychecks are "at the heart of every budget"
   - Used to build monthly Spending Plan and Projected Cash Flow

6. **Step 6: Complete Setup**
   - Simplifi takes user to Dashboard
   - Dashboard becomes home page for every future sign-in
   - Provides quick snapshot of finances

**Post-Setup**: Can add/edit Recurring Transactions anytime through Settings menu

**Important Limitation**: Transaction imports available elsewhere in Simplifi, but NOT during initial setup

---

### Empty State Handling

**Initial Experience**:
- New users may feel overwhelmed seeing empty dashboard before adding accounts
- After adding first accounts (checking, savings, credit cards), "financial life comes into focus"
- Adding accounts is foundation of Simplifi experience

**Post-Setup Dashboard**:
- Dashboard serves as home page (shown every sign-in)
- Quick snapshot of finances
- Widgets for Spending Plan, transactions, goals, etc.

---

### Tutorial/Help During Onboarding

**Guided Setup**:
- Step-by-step wizard (cannot skip account addition)
- Clear explanations of what each step accomplishes
- Emphasis on importance of recurring bills/income detection

**Learning Resources**:
- Blog with best practices and new features
- YouTube channel with how-to videos
- Simplifi Community for additional support
- Help Center articles for all features

---

### Core Workflows

#### 1. Add Transaction (Manual)

**Process**:
1. Hover over left panel → select **Transactions**
2. Click blue **+** button (upper right)
3. Select account for transaction
4. Select date (if not today)
5. Set status: **Pending** (connected accounts) OR **Cleared** (manual accounts)
6. Enter payee, amount, category
7. **Optional**: Add splits, tags, notes, attachments, flags
8. Click **Create**

**Important Limitation**: Manually entered transactions limited to 1 year in future

**Additional Features**:
- **Split transactions**: Assign multiple categories/tags to one transaction
- **Attach receipts**: Upload images/files (remain indefinitely)
- **Bulk editing**: Select multiple transactions, edit fields together
- **Bulk deletion**: Delete multiple transactions at once

**Split Transaction Workflow**:
1. Open transaction for editing
2. Click **Split**
3. Click **+ Add Split** for each portion
4. Enter category/tag and amount for each
5. Use "Divide among Splits" for equal distribution
6. Click **Save Splits** → **Update**

#### 2. Create/Manage Spending Plan

**Access**: Hover over left panel → click **Spending Plan**

**Six-Part Budget Structure**:

1. **Income**
   - Shows expected recurring income
   - Can customize amounts
   - Can include non-recurring deposits (add from "Excluded This Month")

2. **Bills**
   - Shows recurring payments (mortgage, utilities, subscriptions)
   - Credit card payments/transfers initially excluded (can add via menu)
   - Can set custom amounts for specific bills

3. **Planned Spend**
   - Variable expenses (groceries, gas)
   - One-time costs
   - **Rule**: Top-level category can only be used ONCE (prevents double-counting)
   - Can release unused funds at month-end
   - **Auto-release option**: Automatically return unused funds (except rollover categories)

4. **Other Spend**
   - Real-time remaining expenses by category
   - Drag category bubbles to reorganize
   - Expand bubbles to view individual transactions

5. **Goals**
   - Shows included Savings Goals
   - Tracks contribution amounts

6. **Left This Month**
   - Available funds remaining
   - Shows per-day average breakdown

**Editing Options**:
- Three-dot menus next to items: set custom amounts, edit recurring series, manage transactions
- Edit recurring series: View Series → Options → Edit Series
- Release unspent funds: Select from menu
- Exclude transactions or entire accounts from calculations

**Flexibility Features**:
- Customize transaction activity columns (web only)
- View projected spending up to 12 months ahead
- Use historical average spending OR custom amounts for projections

**Key Limitations**:
- Deleting recurring items removes them entirely from Simplifi
- Spending Plan begins same month as subscription start (non-retroactive)
- Transactions linked to Recurring Reminders appear in Bills/Income (not Planned Spend) to avoid double-counting

#### 3. Track Savings Goals

**Access**: Settings → Savings Goals

**Setup Process**:
1. Create goal with name and target amount
2. Set target date
3. Choose account to track against (optional)
4. Include in Spending Plan (optional)
5. System calculates monthly contribution needed

**Goal Features**:
- Visual progress tracking
- Monthly contribution calculations
- Integration with Spending Plan
- Account-based tracking (balance monitoring)

#### 4. Review Transactions

**Transaction Management**:
- Search and filter by account, category, date range
- Edit single transactions: Click transaction → Edit → Update
- Edit multiple transactions: Check boxes → Pencil icon → Apply changes
- Delete transactions: Edit → Delete (warning: won't re-download from bank)
- Categorize: Assign to spending categories
- Exclude: Remove from Spending Plan and/or Reports

**Workflow**: Regularly review imported transactions, categorize, and adjust Spending Plan as needed

---

### Time to First Value

**Minimum Time**: ~10 minutes to complete onboarding and see first Spending Plan

**Path to Value**:
1. Add accounts (2-5 minutes with bank login)
2. Confirm recurring bills/income (2-3 minutes)
3. View Spending Plan dashboard (immediate)

**First Actionable Insight**: "Left This Month" amount shown immediately after setup (shows available spending money)

---

## 3. Monarch Money

### Onboarding Sequence

**Estimated Time**: Not explicitly stated (estimated 10-15 minutes based on flow)

**Free Trial**: 7-day free trial to explore features before committing

**Initial Experience**:

**Sign-Up Screen**:
- Carousel with 5 value propositions:
  - "See all your money in one place"
  - "Giving you a complete picture of your finances"
  - [3 more value props]
- Email verification required

**Onboarding Flow**:
- Standard "get-to-know-me" questionnaire
- Visual aids guide account setup
- Easy onboarding with step-by-step process

**Step-by-Step Flow**:

1. **Connect Accounts** (First Priority)
   - Prompted to connect account immediately after email verification
   - Supports 13,000+ financial institutions via data providers
   - **Recommendation**: Connect as many accounts as possible before categorizing transactions
   - For many accounts: Start with most-used banking and credit card accounts
   - Option: Manually add accounts if preferred

2. **Categorize Transactions** (Second Priority)
   - Ensure transactions are accurately categorized
   - **Critical for income**: Correctly categorize as paychecks, interest, bonuses, business income, etc.
   - Clean transactions ensure everything else is accurate
   - Monarch brings all transactions into "one clean, searchable list"

3. **Set Up Budget** (Third Priority)
   - Can only set up budget AFTER accounts connected and transactions categorized
   - Choose budgeting type: **Category** or **Flex**
   - First visit to Plan Budget page: Uses 6-month average to set initial amounts
   - Can change estimates manually

4. **Review and Mark Transactions**
   - Mark transactions as "reviewed" to stay on top of spending
   - Quickly spot unexpected charges
   - Ongoing maintenance task

**Special Features**:
- **Mint Migration**: If former Mint user, Monarch prompts to import data and provides migration instructions
- **Triggered Emails**: Based on in-app behavior (e.g., if you haven't connected account, reminded to do so)
- **Key Actions Mapped**: Platform identifies critical trial actions (connect account, update categories, etc.)

---

### Empty State Handling

**Before Account Connection**:
- Empty dashboard with prompt to connect accounts
- Value propositions emphasize "complete picture of finances"

**After Account Connection**:
- Transactions populate automatically
- Dashboard shows net worth, cash flow, budget status
- Visual emphasis on consolidated view across all accounts

---

### Tutorial/Help During Onboarding

**Visual Aids**: Guides enhance onboarding, making it easy for newcomers

**Behavioral Triggers**:
- Platform maps key trial actions
- Sends triggered emails based on what user has/hasn't done
- Example: If no account connected, reminder email sent

**User-Friendly System**:
- Straightforward setup process
- Clear priority order (accounts → transactions → budget)

**Improved Partner Experience**: Recent updates to member invitation and partner onboarding

---

### Core Workflows

#### 1. Connect/Add Accounts

**Process**:
1. Navigate to account addition screen
2. Search 13,000+ supported institutions
3. Enter bank credentials (secure connection via data providers)
4. Review discovered accounts
5. Confirm accounts to add

**Manual Accounts**:
- Option to manually add accounts
- Navigate to desired account
- Create transactions manually
- Can adjust account balances when needed

#### 2. Manage Transactions

**Transaction Workflow**:
1. Review imported transactions (shown in clean, searchable list)
2. Verify categories are correct
3. Mark transactions as "reviewed" (helps spot unexpected charges)
4. Adjust categories as needed
5. Add tags, notes, or splits if necessary

**Key Principle**: "Transactions are the backbone of Monarch" — keeping them clean ensures everything else is accurate

#### 3. Create Budget

**Two Budgeting Types**:

**Category Budgeting**:
- Assign every expense category a budget
- Track spending at category level
- Monitor each category individually

**Flex Budgeting**:
- Focus on tracking flexible spending
- High-level bucket containing variable/less predictable expenses
- Categories with varying costs (entertainment, dining, discretionary)

**Setup Process**:
1. Ensure all accounts connected
2. Ensure transactions accurately categorized
3. Navigate to Budget section
4. Choose Category or Flex budgeting
5. First visit: System uses 6-month average for initial amounts
6. Manually adjust any estimates
7. Monitor spending throughout month

**Budget Editing**:
- Click into fields to update amounts manually
- Move money between categories (Flex budgeting: use pill icon)
- Indicate which categories to move money to/from

#### 4. Create Custom Categories

**Process**:
1. Navigate to **Settings** → **Categories**
2. Decide: Income or Expenses custom group
3. Select **Create group**
4. Give group a name
5. Add custom category with:
   - Name
   - Emoji
   - Type (Income/Expense)
   - Group assignment
6. Optional toggles:
   - Make monthly rollover
   - Exclude from budget

**Category Features**:
- Custom names and emojis
- Group organization
- Rollover support
- Budget exclusion option

#### 5. Track Progress

**Net Worth Tracking**:
- Automatic calculation across all accounts
- Historical trends
- Asset vs. liability breakdown

**Cash Flow Monitoring**:
- Income vs. expenses over time
- Monthly/yearly views
- Category breakdowns

**Budget Progress**:
- Real-time spending vs. budget
- Category-level tracking
- Alerts for approaching/exceeding limits

---

### Time to First Value

**Minimum Time**: ~5-10 minutes (connect one account, see net worth and recent transactions)

**Recommended Path**: 15-20 minutes (connect all accounts, categorize transactions, view budget)

**First Actionable Insight**: Net worth and recent transactions visible immediately after connecting first account

---

## 4. PocketGuard

### Onboarding Sequence

**Estimated Time**: Not explicitly stated (estimated 10-15 minutes based on 6-step flow)

**Step-by-Step Flow**: "To get started right, you just have to complete the journey of 6 simple steps"

**Account Creation**:
1. Download app
2. Click "Start Now"
3. Enter email address and password
4. Create 4-digit PIN for additional protection
5. Optional: Allow Face ID
6. Optional: Enable push notifications (alerts for bills and overspending)

**Initial Questions**:
- PocketGuard asks about financial goals
- Helps app give personalized advice

**6-Step Onboarding Journey**:

1. **Step 1: Connect Your Accounts** (CRITICAL)
   - Connect checking, credit, and savings accounts
   - Makes budgeting "smarter"
   - Choose from 18,000+ financial institutions
   - Real-time data sync
   - **Alternative**: Manual tracking with cash accounts (no bank connection required)
   - More accounts linked = smarter budgeting

2. **Step 2: Verify Recurring Bills and Income**
   - Double-check detected Recurring Bills
   - Verify detected Income
   - System uses "sophisticated algorithm" for auto-detection
   - **CRITICAL STEP**: Bills and paychecks are "at the heart of every budget"
   - Manual review ensures accuracy

3. **Step 3: Review Your "Leftover"**
   - **The jewel of PocketGuard**
   - Unique algorithm calculates: Income - Bills - Savings Goals - Ongoing Expenses = Leftover
   - Shows how much money is left for everyday spending
   - Core value proposition of app

4. **Step 4: Review and Categorize Transactions**
   - Transactions automatically divided into categories by merchant
   - Check if merchants and categories correctly identified
   - To change category: Open transaction details → Tap category → Choose new one

5. **Step 5: Set Savings Goals**
   - Use SMART framework (Specific, Measurable, Achievable, Relevant, Timely)
   - Name goal and choose emoji
   - Set target amount and due date
   - Algorithm calculates monthly contributions
   - System informs if amount fits monthly budget
   - **Two goal types**:
     - **External goal**: Linked to bank account (tracks via balance)
     - **Manual goal**: Track based on planned transactions

6. **Step 6: Start Using PocketGuard**
   - Monitor "Leftover" amount
   - Track spending by category
   - Adjust budget as needed
   - Receive alerts for upcoming bills and overspending

**Special Feature**: Can use PocketGuard WITHOUT connecting bank accounts (manual tracking with cash accounts)

---

### Empty State Handling

**Before Account Connection**:
- Likely prompts to connect accounts immediately
- Emphasizes value of "complete picture of finances"

**After Account Connection**:
- Dashboard shows "Leftover" amount
- Displays upcoming bills
- Shows spending by category
- Recent transactions visible

**Manual Mode Empty State**:
- For users not connecting accounts
- Prompts to add cash accounts
- Guides manual transaction entry

---

### Tutorial/Help During Onboarding

**Official Newbie's Guide**:
- Step-by-step walkthrough
- Explains why each step matters
- Links to deeper feature explanations

**In-App Guidance**:
- 6-step journey with clear progression
- Each step builds on previous
- Explains "why" behind each action

**Push Notifications**:
- Optional alerts for upcoming bills
- Overspending warnings
- Helps users stay on track

**Personalized Advice**:
- Initial questions about financial goals
- Tailored recommendations based on answers

---

### Core Workflows

#### 1. Review "Leftover" (Core Feature)

**What It Is**:
- Unique PocketGuard algorithm
- Formula: Income - Bills - Savings Goals - Ongoing Expenses = Leftover
- Shows safe-to-spend amount for everyday purchases

**How to Use**:
1. Check "Leftover" amount on dashboard
2. Use as guide for discretionary spending
3. Monitor throughout month
4. Adjust spending to stay within Leftover

**Why It Matters**: "The jewel of PocketGuard" — simplifies budgeting by showing one key number

#### 2. Add Transaction (Manual)

**Process** (inferred from categorization workflow):
1. Open PocketGuard app
2. Navigate to transaction entry
3. Enter amount, merchant, date
4. Choose account (if using cash accounts)
5. Select category (or let algorithm auto-categorize)
6. Save transaction

**Auto-Categorization**:
- Transactions automatically divided by merchant
- Can change category: Open details → Tap category → Choose new one

#### 3. Set Savings Goals

**SMART Framework Process**:
1. **Name goal** (Specific)
2. **Choose emoji** (visual identifier)
3. **Set target amount** (Measurable)
4. **Set due date** (Timely)
5. **Choose goal type**:
   - External: Link to bank account (tracks balance)
   - Manual: Track based on planned transactions
6. **Review monthly contribution**:
   - Algorithm calculates suggested amount
   - Informs if it fits monthly budget
   - Can increase to reach goal faster
   - Can start next month if budget too tight
7. **Monitor progress**:
   - Track via account balance (external goals)
   - Track via planned transactions (manual goals)

**Goal Features**:
- Algorithm suggests achievable monthly contributions
- Budget fit analysis
- Flexibility to adjust timing and amounts
- Integration with "Leftover" calculation

#### 4. Manage Bills and Subscriptions

**Bill Management**:
1. Verify auto-detected recurring bills (during onboarding)
2. Add any missed bills manually
3. Monitor upcoming bills on dashboard
4. Receive alerts for due dates
5. Bills automatically factored into "Leftover" calculation

**Subscription Tracking**:
- Recurring charges detected automatically
- Can review all subscriptions in one place
- Monitor for unwanted or forgotten subscriptions
- Cancel directly through insights

#### 5. Review Categories and Spending

**Category Review**:
1. View spending breakdown by category
2. Identify overspending areas
3. Adjust future spending in problem categories
4. Recategorize transactions if needed

**Spending Insights**:
- See where money is going
- Compare to previous months
- Identify spending trends
- Receive overspending alerts

---

### Time to First Value

**Minimum Time**: ~5 minutes (connect one account, see "Leftover" amount)

**Recommended Path**: 10-15 minutes (complete all 6 steps, understand full financial picture)

**First Actionable Insight**: "Leftover" amount shown immediately after connecting accounts and confirming bills/income

**Key Differentiator**: Fastest path to actionable insight via simple "Leftover" metric (vs. complex budget spreadsheets)

---

## Cross-App Comparison Summary

### Onboarding Time Estimates

| App | Stated Time | Estimated Time | Complexity |
|-----|-------------|----------------|------------|
| **YNAB** | 20-30 min | 20-30 min (if thorough) | HIGH - Education-focused, 4 chapters |
| **Simplifi** | ~10 min | 10 min | MEDIUM - Streamlined, account-focused |
| **Monarch** | Not stated | 10-15 min | MEDIUM - Connect accounts, categorize |
| **PocketGuard** | Not stated | 10-15 min | LOW - 6 simple steps |

---

### Onboarding Philosophy

| App | Philosophy | Approach |
|-----|------------|----------|
| **YNAB** | Education-first | Teach budgeting mindset, not just software |
| **Simplifi** | Efficiency-first | Get to dashboard quickly, learn features later |
| **Monarch** | Data-first | Connect accounts immediately for complete picture |
| **PocketGuard** | Simplicity-first | One key metric ("Leftover") to understand finances |

---

### Mandatory vs. Optional Steps

| App | Mandatory | Optional | Can Skip Onboarding? |
|-----|-----------|----------|---------------------|
| **YNAB** | None (can skip entire flow) | All 6 steps | YES - Can jump into app |
| **Simplifi** | Add at least 1 account | Everything else | NO - Must add account |
| **Monarch** | Connect account (to use features) | None | PARTIAL - Can skip, but features limited |
| **PocketGuard** | Connect accounts OR manual setup | Push notifications, Face ID | PARTIAL - Can use manual mode |

---

### Account Connection Requirements

| App | Bank Connection Required? | Manual Mode Available? | Minimum Accounts |
|-----|--------------------------|------------------------|------------------|
| **YNAB** | NO | YES (manual entry) | 0 (can start with $0) |
| **Simplifi** | YES | PARTIAL (manual accounts) | 1 account required |
| **Monarch** | EFFECTIVELY YES | YES (manual accounts) | 1+ for full features |
| **PocketGuard** | NO | YES (cash accounts) | 0 with manual mode |

---

### Core Workflows: Add Transaction

| App | Method | Speed | Auto-Import |
|-----|--------|-------|-------------|
| **YNAB** | Manual entry (recommended), then auto-match | Fast (encouraged immediately after purchase) | YES (matches with manual) |
| **Simplifi** | Auto-import primary, manual secondary | Medium (review imported) | YES (primary method) |
| **Monarch** | Auto-import primary | Medium (review & categorize) | YES (primary method) |
| **PocketGuard** | Auto-categorization | Fast (auto-categorized) | YES (auto-categorizes) |

---

### Core Workflows: Budgeting Approach

| App | Budgeting Type | Philosophy | Complexity |
|-----|----------------|------------|------------|
| **YNAB** | Zero-based (every dollar assigned) | Intentional spending, plan for every dollar | HIGH |
| **Simplifi** | Spending Plan (bills + planned + other) | Track spending against plan | MEDIUM |
| **Monarch** | Category OR Flex budgeting | Choose granularity level | MEDIUM |
| **PocketGuard** | Automatic "Leftover" calculation | Simplify to one key number | LOW |

---

### Time to First Value

| App | Absolute Minimum | Recommended | First Actionable Insight |
|-----|------------------|-------------|--------------------------|
| **YNAB** | 5 min (assign first dollar) | 20-30 min (full setup) | Budget category assigned |
| **Simplifi** | 10 min (see Spending Plan) | 10 min (same) | "Left This Month" amount |
| **Monarch** | 5-10 min (see net worth) | 15-20 min (budget ready) | Net worth & transactions |
| **PocketGuard** | 5 min (see "Leftover") | 10-15 min (full setup) | "Leftover" safe-to-spend |

---

### Empty State Strategies

| App | Empty State Approach | Pre-populated Data? | Guidance Provided? |
|-----|---------------------|--------------------|--------------------|
| **YNAB** | Pre-built category templates | YES (mortgage, groceries, etc.) | YES (banner checklist, welcome dialog) |
| **Simplifi** | Empty dashboard before accounts | NO | YES (prompts to add accounts) |
| **Monarch** | Empty dashboard before accounts | NO | YES (prompts to connect accounts) |
| **PocketGuard** | Empty dashboard before accounts | NO | YES (6-step journey prompts) |

---

### Tutorial & Help Mechanisms

| App | In-App Tutorials | Email Onboarding | Video Guides | Community |
|-----|------------------|------------------|--------------|-----------|
| **YNAB** | Welcome dialog, progress bar | Daily emails (1 week) | YES (extensive) | YES (active community) |
| **Simplifi** | Step wizard, tooltips | Unknown | YES (YouTube channel) | YES (Simplifi Community) |
| **Monarch** | Visual aids, triggered emails | Behavioral triggers | Unknown | Unknown |
| **PocketGuard** | 6-step journey, Newbie's Guide | Unknown | Unknown | Unknown |

---

### Progressive Disclosure

| App | Progressive Disclosure Strategy | Complexity Management |
|-----|--------------------------------|----------------------|
| **YNAB** | 4 chapters, daily email sequence, skip option | HIGH - Gradual education over time |
| **Simplifi** | 6 steps, must complete account setup | MEDIUM - Essential setup first, features later |
| **Monarch** | Connect → Categorize → Budget sequence | MEDIUM - Logical dependency chain |
| **PocketGuard** | 6 simple steps, each builds on previous | LOW - Linear progression |

---

## Key Insights for PayPlan

### 1. Onboarding Time Sweet Spot
- **10-15 minutes** is the industry standard for "quick" onboarding
- YNAB's 20-30 minutes is acceptable ONLY because of educational value
- PayPlan should target **5-10 minutes** to onboard (privacy-first = no bank connection delay)

### 2. Bank Connection vs. Privacy-First
- All competitors PUSH bank connection heavily (except YNAB which allows skip)
- PocketGuard's manual mode is secondary, not primary
- **PayPlan opportunity**: Embrace privacy-first as FEATURE, not limitation
- Make manual entry feel fast and empowering, not like fallback option

### 3. Time to First Value
- **Winning metric**: Show actionable insight in <5 minutes
- PocketGuard's "Leftover" = instant value (one number to understand)
- Simplifi's "Left This Month" = similar instant value
- **PayPlan should**: Show budget progress or spending insight IMMEDIATELY after first account/transaction

### 4. Mandatory vs. Optional Steps
- YNAB's "skip entire onboarding" = empowering for power users
- Simplifi's "must add account" = frustrating but ensures quality experience
- **PayPlan sweet spot**: Recommend flow but allow skip with clear consequences

### 5. Empty State Design
- YNAB pre-populates categories (reduces intimidation)
- Others show empty dashboards with strong prompts to add accounts
- **PayPlan should**: Pre-populate common budget categories, allow customization

### 6. Tutorial Mechanisms
- Email onboarding (YNAB's daily emails) = effective but requires ongoing commitment
- In-app wizards (Simplifi, PocketGuard) = guided but can feel restrictive
- **PayPlan hybrid**: In-app wizard for first-timers, skip option for experienced users, optional email series

### 7. Budgeting Complexity Spectrum
- **Simplest**: PocketGuard ("Leftover" single number)
- **Medium**: Simplifi (Spending Plan with 6 parts)
- **Medium-High**: Monarch (Category or Flex choice)
- **Highest**: YNAB (Zero-based, assign every dollar)
- **PayPlan positioning**: MEDIUM (like Simplifi) - Spending Plan approach with visual dashboard

### 8. Progressive Disclosure
- All apps use some form (YNAB = most sophisticated with 4 chapters + emails)
- Best practice: Don't show all features at once
- **PayPlan should**: Introduce features as user progresses (dashboard widgets unlock as user adds data)

### 9. First Transaction Entry
- YNAB: Encourages manual entry immediately
- Simplifi/Monarch: Import-first, review later
- **PayPlan**: Manual entry should be FAST (<15 seconds per transaction, per requirement)

### 10. Goal Tracking
- All apps integrate goals into budget (not separate feature)
- PocketGuard: Goals reduce "Leftover"
- YNAB: Goals are budget categories
- **PayPlan**: Goals should be first-class citizens (widget on dashboard)

---

## Recommendations for PayPlan Onboarding

### 1. Target 5-Minute Onboarding (Aggressive but Achievable)
**Why**: Privacy-first = no bank connection delay = faster onboarding
**How**:
- Step 1: Name + currency (10 sec)
- Step 2: Choose 3-5 spending categories from template (30 sec)
- Step 3: Set monthly income (15 sec)
- Step 4: Add first transaction (optional, 15 sec)
- Step 5: See dashboard with first budget insight (immediate)

### 2. Pre-populate Common Budget Categories
**Why**: YNAB's approach reduces intimidation, speeds setup
**How**:
- Show 10-15 common categories (Groceries, Rent, Transportation, etc.)
- Let user select 3-5 to start
- Add more categories later (progressive disclosure)

### 3. Make Manual Transaction Entry Feel Empowering
**Why**: Competitors treat manual entry as fallback; PayPlan makes it primary
**How**:
- Quick-add button prominent on every screen
- <15 second entry time (per spec)
- Celebrate first transaction added ("Your budget is coming to life!")

### 4. Show Actionable Insight in <5 Minutes
**Why**: Time to first value is critical for retention
**How**:
- After adding income + first category: Show "You have $X budgeted this month"
- After adding first transaction: Show "You've spent $Y of $Z in [category]"
- After 3 transactions: Show simple pie chart of spending

### 5. Use Progressive Disclosure for Dashboard Widgets
**Why**: Empty dashboards are intimidating; cluttered dashboards overwhelm
**How**:
- Start: Show only "Add Transaction" + "Budget Progress" widgets
- After 5 transactions: Unlock "Spending by Category" chart
- After 1 goal created: Unlock "Goal Progress" widget
- After 7 days: Unlock "Gamification" widget (streaks)

### 6. Optional 6-Step Guided Tour (Can Skip)
**Why**: YNAB's skip option empowers users; Simplifi's mandatory flow frustrates
**How**:
- Welcome screen: "Take 5-minute tour" OR "Skip and explore"
- If skip: Show tooltips on first interaction with each feature
- If tour: Linear 6-step flow with progress bar

### 7. Celebrate Milestones Immediately
**Why**: Gamification increases engagement (per PayPlan spec)
**How**:
- First transaction added: "Great start! 🎉"
- First budget category created: "You're building your budget! 💪"
- First goal set: "Now you're planning ahead! 🎯"
- 7-day streak: "You're on fire! 🔥"

### 8. Email Onboarding Series (Optional Opt-In)
**Why**: YNAB's daily emails effective but requires commitment
**How**:
- During onboarding: "Want daily tips for 7 days? (Optional)"
- If yes: Send 7 short emails with quick wins
- Day 1: "How to add your first transaction"
- Day 3: "Understanding your spending chart"
- Day 5: "Setting your first savings goal"
- Day 7: "You're a budgeting pro! Here's what's next"

### 9. Empty State Design: Aspirational, Not Intimidating
**Why**: Empty dashboards discourage; pre-populated data overwhelms
**How**:
- Show empty chart WITH example data (greyed out, labeled "Example")
- Text: "Your spending will appear here once you add transactions"
- CTA: "Add Your First Transaction" (prominent button)

### 10. Onboarding Success Metrics to Track
**Why**: Measure what matters for retention
**How**:
- **Time to first transaction**: Target <5 min
- **Completion rate**: Target >80% complete onboarding
- **7-day retention**: Target >60% return after 7 days
- **First goal created**: Target >40% create goal in first session
- **Onboarding skip rate**: Track how many skip tour (optimize if >50%)

---

## Competitive Advantages PayPlan Can Leverage

### 1. Privacy-First = Fastest Onboarding
- No bank connection delay
- No waiting for transaction imports
- Immediate control and clarity

### 2. Visual-First = Instant Gratification
- Competitors show tables/lists
- PayPlan shows charts/graphs immediately
- Even 1 transaction creates visual progress

### 3. Gamification = Emotional Engagement
- Competitors focus on analytics
- PayPlan celebrates wins and builds streaks
- Makes budgeting feel like progress, not punishment

### 4. Free Core = No Trial Pressure
- YNAB: 34-day trial, then $109/year (pressure to learn fast)
- Monarch: 7-day trial (very short window)
- PayPlan: Free forever (learn at your own pace)

### 5. Accessibility-First = Inclusive Onboarding
- Screen reader support from day one
- Keyboard navigation throughout onboarding
- High contrast for visual clarity

---

## Conclusion

The competitive analysis reveals clear patterns:

1. **Onboarding time**: 10-15 minutes is standard; YNAB's 20-30 is acceptable for education value
2. **Bank connection**: All competitors push it heavily (except YNAB which allows manual)
3. **Time to first value**: <5 minutes is critical for retention
4. **Empty states**: Pre-populated data (YNAB) reduces intimidation vs. empty dashboards (others)
5. **Progressive disclosure**: All use it; YNAB most sophisticated with 4 chapters + email series
6. **Budgeting complexity**: Ranges from PocketGuard's single "Leftover" number to YNAB's zero-based approach

**PayPlan's opportunity**: Combine the best of all competitors:
- YNAB's education-first approach (via gamification, not lectures)
- Simplifi's speed (10-minute onboarding)
- PocketGuard's simplicity (actionable insights, not complexity)
- Monarch's visual-first design (beautiful charts from day one)

**Key differentiator**: Privacy-first manual entry is FEATURE, not limitation. Make it fast (<15 sec/transaction), celebrate progress immediately, show visual insights from first transaction, and let users learn at their own pace with free-forever core features.

---

**Next Steps**:
1. Design PayPlan's 5-minute onboarding flow
2. Create empty state designs with pre-populated category templates
3. Define progressive disclosure strategy for dashboard widgets
4. Build quick-add transaction flow (<15 sec target)
5. Design first-time user celebrations and gamification triggers

