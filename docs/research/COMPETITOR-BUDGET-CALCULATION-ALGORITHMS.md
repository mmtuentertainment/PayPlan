# Competitor Budget Calculation Algorithms Research

**Date**: 2025-11-02
**Purpose**: Document business logic, calculation formulas, and algorithms used by leading budget apps
**Apps Analyzed**: YNAB, Simplifi by Quicken, Monarch Money, PocketGuard
**Use Case**: Reference for PayPlan budget calculation implementation and validation

---

## Table of Contents

1. [YNAB (You Need A Budget)](#1-ynab-you-need-a-budget)
2. [Simplifi by Quicken](#2-simplifi-by-quicken)
3. [Monarch Money](#3-monarch-money)
4. [PocketGuard](#4-pocketguard)
5. [Cross-App Analysis](#5-cross-app-analysis)
6. [Implementation Recommendations for PayPlan](#6-implementation-recommendations-for-payplan)

---

## 1. YNAB (You Need A Budget)

### Core Philosophy: Zero-Based Budgeting
Every dollar has a job. Budget all available money down to zero each month.

---

### 1.1 "To Be Budgeted" (Now "Ready to Assign") Calculation

**Formula:**
```
To Be Budgeted = Cash in Budget Accounts - Sum of Budgeted Amounts
```

**Components:**
- **Cash in Budget Accounts**: Sum of checking, savings, cash accounts, plus positive credit card balances
- **Deductions**: Overdrawn checking/savings accounts subtract from total
- **Note**: Outstanding credit card balances do NOT affect "To Be Budgeted"

**Verification Process:**
1. Note "Total Available" (sum of all category Available columns)
2. If "To Be Budgeted" is negative, subtract it from "Total Available" (means you've budgeted money you don't have)

**Edge Cases:**
- Negative "To Be Budgeted" = overassignment
- Overdrawn cash account affects "To Be Budgeted", but credit card balance does not

---

### 1.2 Rollover Calculation

**Positive Balances (Savings):**
```
Next Month Available = Current Month Available + Current Month Budgeted - Current Month Spent
```

- Unspent money automatically rolls over
- Example: $100 budgeted, $50 spent → $50 rolls over to next month

**Overspending:**
- **Cash Overspending (Red)**: Reduces "Ready to Assign" in next month
- **Credit Card Overspending**: Creates new debt, triggers alert in Credit Card Payment category
- Formula: If overspending sits until end of month, YNAB takes it from "Ready to Assign" next month

**Month Boundary Rules:**
- Positive available amounts carry forward
- Negative available amounts (overspending) do NOT carry forward
- Budget structure stays same, target amounts may change based on goals

---

### 1.3 Age of Money Algorithm

**Purpose**: Measures average days between earning money and spending it

**Algorithm:**
```
Age of Money = Average age of last 10 transactions spent from positive balance
```

**Calculation Details:**
- Real-time calculation based on newest-to-oldest transactions
- Weighted average if single transaction spans multiple "money buckets"
- Target: 30 days (recommended by YNAB)

**Formula (simplified):**
```
For each of last 10 transactions:
  Transaction Age = Days between (Money Earned Date) and (Spend Date)

Age of Money = Sum(Transaction Ages) / 10
```

---

### 1.4 Goal/Target Calculations

**Target Cadences:**

#### Weekly Targets
```
Monthly Target Amount = (Weekly Amount) × (Number of that weekday in month)
```
- Example: $50/week on Mondays → $200 (4 Mondays) or $250 (5 Mondays)
- Amount varies by month length

#### Monthly Targets
```
Monthly Target Amount = Fixed amount
Target Due Date = Selected day of month
```
- Date affects auto-assign prioritization

#### Debt Payoff Targets
```
Monthly Payment Required = (Outstanding Balance) / (Months Until Target Date)
```

**Credit Card Payoff Formula:**
```
Required Monthly Assignment = (Credit Card Balance) / (Months Until Payoff Date)
```

**Yearly/Custom Targets:**
```
Monthly Contribution = (Target Amount) / (Months Until Target Date)
```

---

### 1.5 Credit Card Payment Calculation

**For New Purchases:**
```
Credit Card Payment Available = Sum of budgeted spending moved from categories
```
- Automatic: When you categorize credit card transaction, money moves from that category to payment category

**For Existing Debt:**
```
Credit Card Payment Available = Moved Budgeted Money + Direct Budget Assignment
```
- Direct budget assignment comes from "To Be Budgeted"

**Paid-in-Full Cards:**
```
Credit Card Balance = Credit Card Payment Available (always in sync if reconciled)
```

**Red Payment Category Formula:**
```
Payment Available < 0 means you paid more to credit card than was Available
```

---

### 1.6 Reconciliation Algorithm

**Cleared Balance Calculation:**
```
Cleared Balance = Sum of all transactions with "Cleared" status
```

**Transaction Statuses:**
- **Uncleared** (Gray "C"): Pending transactions
- **Cleared** (Green "C"): Posted transactions
- **Locked** (Green lock icon): Reconciled transactions

**Reconciliation Process:**
1. Compare YNAB Cleared Balance to Bank Cleared Balance
2. Mark pending transactions as "Uncleared"
3. Cleared balance should match bank to the penny
4. Adjustment transactions categorized to "To Be Budgeted" by default

**Edge Cases:**
- Pending transactions don't affect cleared balance
- Reconciliation adjustments can cause overspending alerts if not properly categorized
- Uncleared transactions should only be pending bank transactions

---

### 1.7 Edge Cases & Known Issues

**Negative "To Be Budgeted" / "Ready to Assign":**
- Means you've budgeted more than you have
- Must move money from categories or wait for income

**Overspending Handling:**
- Cash overspending: Reduces next month's "Ready to Assign"
- Credit overspending: Creates debt, alerts in payment category
- Overspending does NOT roll over (gets zeroed out, debt moves to "Ready to Assign")

**Month Boundaries:**
- Cannot change month start date (always calendar months: 1st to last day)
- Budgeted amounts may change based on weekly targets
- Spending plan structure stays consistent

**Credit Card Edge Cases:**
- Overpayment → positive balance affects "To Be Budgeted"
- Underpayment → remaining balance shows as red Available
- Rewards/refunds require manual adjustment

---

### 1.8 Date Arithmetic & Rounding

**Month Boundary:**
- Strict calendar months (1st to last day)
- Weekly targets recalculate based on weekday count in month

**Rounding:**
- Not explicitly documented, but likely standard banker's rounding for currency
- Appears to use 2 decimal places (cents precision)

---

## 2. Simplifi by Quicken

### Core Philosophy: Real-Time Spending Plan
Focus on "what's left this month" rather than zero-based budgeting.

---

### 2.1 "Left This Month" Calculation

**Primary Formula:**
```
Left This Month = Income - Bills - Planned Spend - Other Spend - Goals
```

**Component Definitions:**
- **Income**: Recurring income (paychecks) + additional deposits
- **Bills**: Recurring bills and subscriptions
- **Planned Spend**: Variable expenses (gas, groceries, one-time costs)
- **Other Spend**: Real-time total of remaining monthly expenses (updates automatically)
- **Goals**: Savings goals included in spending plan

**Real-Time Updates:**
- Updates automatically with each financial activity
- Available amount shown as total + per-day average

---

### 2.2 Projected Cash Flow Calculation

**Algorithm:**
```
Projected Balance(date) = Current Balance + Expected Income(date) - Expected Expenses(date)
```

**Components:**
- Recurring reminders (income, bills, subscriptions)
- Expected refunds
- Future-dated transactions
- Customizable projection period

**Per-Account Projection:**
- Each account has individual projected balance line
- Color-coded by account
- Day-by-day projection based on recurring patterns

---

### 2.3 Spending Plan Projection

**For Future Months:**

**Option 1: Don't Project**
```
Future Other Spend = 0
```

**Option 2: Custom Amount**
```
Future Other Spend = User-defined amount
```

**Option 3: Historical Average**
```
Future Other Spend = Average(Last X months) × (1 + Optional Buffer %)
Where X = 1 to 12 months
```

---

### 2.4 Recurring Transaction Detection Algorithm

**Automatic Detection Criteria:**
- Payee name matching
- Date pattern matching (weekly, biweekly, monthly, etc.)
- Category consistency
- Amount matching (with variance tolerance)

**Amount Matching Options:**
- **Auto Match**: Predefined logic for linking transactions
- **Variance Allowed**: System matches within certain amount variance

**Machine Learning Component:**
- "Over time, Quicken Simplifi will learn more about your Recurring Transactions"
- Linking transactions increases future match accuracy
- User corrections train the system

**Matching Process:**
1. Download new transactions
2. Search for matches to recurring items
3. Match based on:
   - Payee name
   - Date (with tolerance)
   - Category
   - Amount (with variance)

---

### 2.5 Watchlist Calculations

**Purpose**: Track specific spending areas without affecting spending plan

**Setup:**
- Select payees, categories, subcategories, or tags
- Set monthly "Spending Target"
- Display bar graph of past months

**Calculation:**
```
Watchlist Total = Sum of transactions matching filters for month
Watchlist Status = Watchlist Total vs Spending Target
```

**Note**: Watchlists are informational only, don't affect "Left This Month"

---

### 2.6 Income Estimation (Variable/Irregular Income)

**Methods:**

**1. Custom Income Amount:**
```
Income = User-specified amount (manually updated each month)
```

**2. Estimated Range:**
```
Income = Estimated range based on past earnings (user calculates average)
```

**3. Recurring Series with Updates:**
```
Income = Recurring amount (manually adjusted when actual income changes)
```

**Known Limitation:**
- No automatic averaging for variable income
- Users must set custom estimates or manually adjust recurring amounts

---

### 2.7 Edge Cases & Known Issues

**Bill Detection Issues:**
- May create unwanted recurring series
- May create new series when amounts/dates vary
- Users report difficulty controlling auto-creation

**Pending Transactions:**
- Not explicitly documented how pending affects projections
- Likely excluded from "Left This Month" until cleared

**Month Boundaries:**
- "Left This Month" resets on 1st of each month
- Rollover behavior not documented

**Transfer Handling:**
- System should auto-detect transfers between accounts
- Excludes from calculations to avoid double-counting

---

### 2.8 Date Arithmetic & Rounding

**Recurring Pattern Detection:**
- Weekly, biweekly, monthly, quarterly, yearly patterns
- Date tolerance for matching (variance allowed)

**Rounding:**
- Not explicitly documented
- Likely standard 2-decimal currency precision

---

## 3. Monarch Money

### Core Philosophy: Monthly Cash Flow Budgeting
Income-based budgeting with two approaches: Category or Flex.

---

### 3.1 Budget Calculation Methods

**Overall Formula:**
```
Income = Expenses + Savings (balanced budget goal)
```

**Two Budgeting Approaches:**

#### Category Budgeting
```
Monthly Budget = Sum of all individual category budgets
Budget Balance = Total Income - Sum(Category Actual Spending)
```

#### Flex Budgeting
```
Budget organized into 3 buckets:
  1. Fixed: Predictable recurring expenses
  2. Non-monthly: Irregular expenses (annual, quarterly)
  3. Flex: Variable spending (groceries, gas, entertainment)

Flex Available = Income - Fixed - Non-monthly - Savings
```

---

### 3.2 Initial Budget Calculation (6-Month Average)

**First-Time Budget Setup:**
```
Default Budget Amount = Average(Last 6 months spending) per category
```

**Reset to Average:**
```
Category Budget = Average(Last 6 months) OR Select specific month amount
```

**Alternative:** 3-6 months of historical data used for initial budget

---

### 3.3 Rollover Budget Calculation

**Rollover Formula:**
```
Rollover(next month) = Rollover(last month) + Planned(this month) - Actual(this month)
```

**Example:**
```
Last month rollover: -$25 (over budget)
Planned this month: $100
Actual this month: $50
Remaining rollover = -$25 + $100 - $50 = $25 (rolls to next month)
```

**Non-Monthly Expenses:**
```
Monthly Set-Aside = Total Due Amount / Months Until Due
Rollover Amount = Accumulated set-asides until payment due
```

Example: $600 bill in 6 months → Set aside $100/month

---

### 3.4 Net Worth Calculation

**Formula:**
```
Net Worth = Sum(Assets) - Sum(Liabilities)
```

**Assets:**
- Checking accounts
- Savings accounts
- Investment accounts
- Physical assets (if tracked)

**Liabilities:**
- Credit cards
- Loans
- Mortgages

---

### 3.5 Cash Flow Calculation

**Monthly Cash Flow:**
```
Cash Flow = Income - Expenses
```

**Budget Approach:**
```
Total Monthly Budget = Expected Income for month
Categories = Allocation of income to expenses + savings
```

**Special Categories:**
- "Transfer" and "Credit Card Payment" excluded from budget/cash flow
- Used for tracking money moved between own accounts

---

### 3.6 Edge Cases & Known Issues

**Negative Balances:**
- Account balances should not be negative (except overdrawn checking or overpaid credit cards)
- Loans/credit cards display without "-" before balance
- **Fix**: "Invert account balance" option corrects display issues

**Overspending on Categories:**
```
Example:
  Fitness: -$17 (overspent)
  Education: $59 (available)

Action: Move $17 from Education to Fitness to balance budget
```

**Zero Income:**
- System designed around expectation of income
- Variable income: User determines what number to use
- No explicit handling for zero income documented

**Month Start Date:**
- Cannot change month start (always calendar months)

---

### 3.7 Date Arithmetic & Rounding

**Month Boundaries:**
- Calendar months (1st to last day)
- 6-month average uses completed months

**Non-Monthly Expense Calculation:**
```
Months Until Due = Date arithmetic between now and due date
Monthly Amount = Total / Months Until Due
```

**Rounding:**
- Not explicitly documented
- Likely standard banker's rounding, 2 decimal places

---

## 4. PocketGuard

### Core Philosophy: "In My Pocket" / Safe-to-Spend
Show what's truly available after all obligations.

---

### 4.1 "In My Pocket" / "Leftover" Calculation (CRITICAL UNIQUE FEATURE)

**Primary Formula:**
```
In My Pocket = Estimated Income - Upcoming Bills - Goals - Spending & Budgets
```

**Alternative Phrasing:**
```
Leftover = Income - Bills - Goals - Essentials
```

**Component Breakdown:**
- **Estimated Income**: All actual + estimated income for month
- **Upcoming Bills**: Actual + planned bills/subscriptions
- **Goals**: Savings goal contributions
- **Spending & Budgets**: Ongoing expenses in category budgets

**Key Features:**
- Real-time calculation
- Updates with each transaction
- Resets on 1st of each month
- Shows monthly total + daily average
- Unrelated to account available balance (solely depends on income)

**Smart Features:**
- AI predicts upcoming expenses
- Math combines with AI for leftover calculation
- Auto-detects transfers between accounts (excludes from calculation to avoid double-counting)

---

### 4.2 "Essentials" Definition

**Essentials Calculation:**
```
Essentials = Categories marked as essential (user-defined or auto-detected)
```

**Common Essentials:**
- Rent/mortgage
- Utilities
- Groceries
- Insurance
- Minimum debt payments
- Transportation

**Formula Integration:**
```
In My Pocket = Income - (Bills + Goals + Budget Categories including Essentials)
```

---

### 4.3 Goals Calculation

**Goal Setup:**
```
Goal Components:
  - Target Amount
  - Due Date

Monthly Contribution = Target Amount / Months Until Due Date
```

**Smart Algorithm:**
- Calculates monthly contribution automatically
- Informs if contribution fits monthly budget
- Allows adjustment to reach goal faster or postpone if budget doesn't allow

**Budget Integration:**
```
Available for Spending = Income - Bills - Goals - Categories
```

---

### 4.4 Debt Payoff Algorithms

**Two Strategies Offered:**

#### Snowball Method (Momentum Focus)
```
Algorithm:
  1. Sort debts by balance (smallest to largest)
  2. Pay minimum on all debts
  3. Apply remaining payoff budget to smallest debt
  4. Once debt paid, move to next smallest

Priority = Lowest Balance First
Payment(smallest debt) = Minimum Payment + Payoff Budget Leftover
Payment(other debts) = Minimum Payment Only
```

**Advantages:**
- Faster visible progress (debts eliminated quickly)
- Psychological wins
- Builds momentum

#### Avalanche Method (Cost Optimization)
```
Algorithm:
  1. Sort debts by APR (highest to lowest)
  2. Pay minimum on all debts
  3. Apply remaining payoff budget to highest APR debt
  4. Once debt paid, recalculate and move to next highest APR

Priority = Highest Interest Rate First
Payment(highest APR) = Minimum Payment + Payoff Budget Leftover
Payment(other debts) = Minimum Payment Only
```

**Advantages:**
- Saves more money in interest
- Mathematically optimal
- Faster total payoff (in time and cost)

**Recalculation Trigger:**
```
After each debt paid off:
  Re-sort remaining debts
  Recalculate payments based on strategy
  Update monthly payment schedule
```

---

### 4.5 Bills & Subscriptions Detection

**AI Detection Algorithm:**
- Identifies recurring merchants automatically
- Schedules in calendar
- Defines paychecks, bills, subscriptions

**Detection Criteria:**
- Merchant name pattern matching
- Date pattern recognition
- Amount consistency (with tolerance)

**User Options:**
- Automatic detection (default)
- Manual management (override AI)

---

### 4.6 Budget Management

**Calculation Flow:**
```
1. Calculate Total Monthly Income
2. Subtract Recurring Bills
3. Subtract Savings Goals
4. Subtract Debt Payments
5. Subtract Category Budgets
6. Remainder = "In My Pocket" (safe to spend)
```

**Real-Time Updates:**
- Every transaction updates "In My Pocket"
- Daily average recalculated
- Monthly reset on 1st

---

### 4.7 Edge Cases & Known Issues

**Transfer Handling:**
- Auto-detects transfers between user's own accounts
- Excludes from "In My Pocket" calculation
- Prevents double-counting

**Leftover vs. Account Balance:**
- "In My Pocket" ≠ Account Balance
- "In My Pocket" based solely on income/expense plan
- Account balance includes all money (budgeted and unbudgeted)

**Month Boundaries:**
- "Leftover" resets on 1st
- Monthly budget resets
- Goals continue across months

**Income Variability:**
- Uses "Estimated Income" for irregular income
- Not clear if system averages or requires manual input

---

### 4.8 Date Arithmetic & Rounding

**Goal Calculations:**
```
Months Until Due = DATEDIFF(Due Date, Current Date) in months
Daily Leftover = Monthly Leftover / Days Remaining in Month
```

**Bill Detection:**
- Pattern matching for weekly, biweekly, monthly, quarterly, yearly
- Date tolerance for recurring transaction matching

**Rounding:**
- Not explicitly documented
- Likely standard currency rounding (2 decimals)

---

## 5. Cross-App Analysis

### 5.1 Rollover Handling Comparison

| App | Positive Rollover | Negative Rollover (Overspending) |
|-----|-------------------|----------------------------------|
| **YNAB** | Automatic: Available rolls to next month | Cash: Reduces next month's Ready to Assign<br>Credit: Creates debt, alerts in payment category |
| **Simplifi** | Not explicitly documented | Not explicitly documented |
| **Monarch** | Formula: `Rollover(next) = Rollover(last) + Planned - Actual` | Included in rollover formula (negative values carry forward) |
| **PocketGuard** | Resets monthly (no rollover) | Resets monthly (no rollover) |

**Key Insight:** Only YNAB and Monarch have true rollover budgeting. PocketGuard and Simplifi reset monthly.

---

### 5.2 "What's Left to Spend" Calculation Comparison

| App | Formula | Philosophy |
|-----|---------|------------|
| **YNAB** | `To Be Budgeted = Cash - Sum(Budgeted)` | Zero-based: Budget all money |
| **Simplifi** | `Left This Month = Income - Bills - Planned - Other - Goals` | Real-time: What's actually left |
| **Monarch** | `Income - Expenses - Savings` | Cash flow: Balance income and outflow |
| **PocketGuard** | `In My Pocket = Income - Bills - Goals - Budgets` | Safe-to-spend: True discretionary funds |

**Key Insight:** All apps calculate "leftover" money, but approach differs:
- YNAB: Unallocated money (should be $0)
- Simplifi: Available after obligations
- Monarch: Budget balance
- PocketGuard: Safe discretionary spending

---

### 5.3 Income Handling Comparison

| App | Regular Income | Variable/Irregular Income |
|-----|----------------|---------------------------|
| **YNAB** | Recurring deposits | Budget only money you have (not future income) |
| **Simplifi** | Recurring income series | Custom amount or manual updates to recurring series |
| **Monarch** | Expected monthly income | User determines what number to use |
| **PocketGuard** | Estimated income | Not documented (likely manual estimate) |

**Key Insight:**
- YNAB only budgets actual money (strictest)
- Others allow estimated/expected income
- None auto-average variable income (user must set estimates)

---

### 5.4 Credit Card Handling Comparison

| App | New Purchase Handling | Existing Debt Handling |
|-----|----------------------|------------------------|
| **YNAB** | Auto-moves budgeted money to payment category | Direct budget assignment from Ready to Assign |
| **Simplifi** | Not explicitly documented | Not explicitly documented |
| **Monarch** | Excluded from budget (Transfer category) | Tracked in liabilities for net worth |
| **PocketGuard** | Included in bills or spending | Debt payoff plan (Snowball/Avalanche) |

**Key Insight:**
- YNAB has most sophisticated credit card logic
- Others treat credit cards more like standard expenses/liabilities

---

### 5.5 Goal/Savings Calculation Comparison

| App | Goal Types | Calculation Method |
|-----|------------|-------------------|
| **YNAB** | Weekly, Monthly, Yearly, Debt Payoff, Custom | `Monthly Contribution = Target Amount / Months Until Date` |
| **Simplifi** | Savings goals in spending plan | Deducted from "Left This Month" |
| **Monarch** | Savings categories | Part of income allocation (Income = Expenses + Savings) |
| **PocketGuard** | Savings goals with target + date | `Monthly Contribution = Target / Months`, checks if fits budget |

**Key Insight:**
- All apps use simple division: `Target / Months`
- YNAB most flexible with weekly/custom cadences
- PocketGuard actively warns if goal doesn't fit budget

---

### 5.6 Debt Payoff Strategy Comparison

| App | Strategies Offered | Implementation |
|-----|-------------------|----------------|
| **YNAB** | Debt payoff targets | `Monthly Payment = Balance / Months` (user chooses strategy) |
| **Simplifi** | Not explicitly documented | Likely manual tracking |
| **Monarch** | Not explicitly documented | Net worth tracking (passive) |
| **PocketGuard** | **Snowball & Avalanche** | Smart algorithm calculates optimal payments |

**Key Insight:**
- **PocketGuard is only app with built-in Snowball/Avalanche algorithms**
- YNAB allows targets but user must implement strategy
- Others don't offer strategic debt payoff

---

### 5.7 Recurring Transaction Detection Comparison

| App | Detection Method | Learning Capability |
|-----|------------------|---------------------|
| **YNAB** | Not explicitly documented (manual recurring likely) | Not documented |
| **Simplifi** | Auto-detect based on payee, date, category, amount | Machine learning: learns from user corrections |
| **Monarch** | Not explicitly documented | Not documented |
| **PocketGuard** | AI identifies recurring merchants | AI detection |

**Key Insight:**
- Simplifi and PocketGuard have AI/ML-powered detection
- Simplifi explicitly learns from user corrections
- YNAB and Monarch likely require more manual setup

---

### 5.8 Edge Case Handling Summary

| Edge Case | YNAB | Simplifi | Monarch | PocketGuard |
|-----------|------|----------|---------|-------------|
| **Negative Balance** | Reduces Ready to Assign | Not documented | Can invert if display issue | Not documented |
| **Zero Income** | Just don't budget | Custom amount or $0 | User determines | Not documented |
| **Overspending** | Cash: Next month penalty<br>Credit: Debt alert | Not documented | Rollover formula handles | Resets monthly |
| **Transfer Double-Count** | Manual categorization | Auto-detects transfers | Excluded from budget | Auto-detects transfers |
| **Split Transactions** | Supported | Supported | Supported | Not documented |
| **Pending Transactions** | Uncleared, excluded from reconciliation | Likely excluded | Not documented | Not documented |

**Key Insights:**
- YNAB has most documented edge case handling
- Transfer detection: Simplifi and PocketGuard auto-detect
- Overspending: YNAB strictest, others more lenient
- Most apps support split transactions

---

### 5.9 Date Arithmetic & Rounding Comparison

#### Month Boundary Handling

| App | Month Start | Rollover Behavior |
|-----|-------------|-------------------|
| **YNAB** | Calendar month (1st) | Positive rolls, negative affects next Ready to Assign |
| **Simplifi** | Calendar month (1st) | Resets monthly |
| **Monarch** | Calendar month (1st) | Rollover formula calculates |
| **PocketGuard** | Calendar month (1st) | Resets monthly |

**Common Pattern:** All use calendar months (no custom start dates)

#### Rounding & Precision

**Industry Best Practices (from research):**
- Use `Decimal` type (not float) for currency
- Round only for display, not intermediate calculations
- Banker's rounding (round half to even) for financial apps
- 2 decimal places (cents precision)
- Test edge cases: split amounts, tax calculations

**Observed from Apps:**
- All apps likely use 2-decimal precision
- Specific rounding methods not documented
- Split transaction handling suggests proper precision

**Common Edge Case: Splitting Money**
```
$100 ÷ 3 people = $33.33 each
$33.33 × 3 = $99.99 (1¢ remaining)

Solutions:
1. Give 1¢ to one person: $33.34, $33.33, $33.33
2. Banker's rounding: alternate rounding direction
3. Track remainders separately
```

---

### 5.10 Automation & AI Comparison

| Feature | YNAB | Simplifi | Monarch | PocketGuard |
|---------|------|----------|---------|-------------|
| **Recurring Detection** | Manual | Auto + ML learning | Not documented | AI-powered |
| **Categorization** | Manual | Auto-match | Default from history | AI-powered |
| **Bill Detection** | Manual | Auto-detect | Not documented | AI-powered |
| **Expense Prediction** | No | Projected cash flow | No | AI predicts upcoming |
| **Budget Suggestions** | No | No | 6-month average | Fits-budget warning |

**Key Insights:**
- YNAB least automated (philosophy: hands-on budgeting)
- Simplifi and PocketGuard most automated
- PocketGuard uniquely predicts if goals fit budget
- Monarch simplest (fewer automation features)

---

## 6. Implementation Recommendations for PayPlan

### 6.1 Core Calculation Formulas to Adopt

#### "Available to Spend" Calculation (Hybrid Approach)

**Recommended Formula (inspired by PocketGuard + YNAB):**
```typescript
interface AvailableToSpend {
  totalIncome: number;
  totalBills: number;
  totalGoals: number;
  totalCategoryBudgets: number;
  availableToSpend: number;
  dailyAverage: number;
}

function calculateAvailableToSpend(
  income: number,
  bills: number,
  goals: number,
  categoryBudgets: number,
  daysRemainingInMonth: number
): AvailableToSpend {
  const availableToSpend = income - bills - goals - categoryBudgets;
  const dailyAverage = availableToSpend / daysRemainingInMonth;

  return {
    totalIncome: income,
    totalBills: bills,
    totalGoals: goals,
    totalCategoryBudgets: categoryBudgets,
    availableToSpend,
    dailyAverage
  };
}
```

**Why this approach:**
- Clear, simple calculation (vs. YNAB's complex assignment)
- Real-time updates (like Simplifi)
- Shows daily average (PocketGuard feature)
- Privacy-first (no bank sync required)

---

#### Budget Rollover Calculation (inspired by Monarch)

**Recommended Formula:**
```typescript
interface CategoryRollover {
  categoryId: string;
  lastMonthRollover: number;
  plannedThisMonth: number;
  actualThisMonth: number;
  remainingRollover: number;
}

function calculateCategoryRollover(
  lastMonthRollover: number,
  plannedThisMonth: number,
  actualThisMonth: number
): number {
  return lastMonthRollover + plannedThisMonth - actualThisMonth;
}

// Example:
// Last month: -$25 (overspent)
// Planned: $100
// Actual: $50
// Rollover = -25 + 100 - 50 = $25 (available next month)
```

**Why this approach:**
- Simple, transparent formula
- Handles positive and negative rollovers
- Monarch's proven approach

---

#### Goal Calculation (inspired by YNAB + PocketGuard)

**Recommended Formula:**
```typescript
interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: Date;
  currentAmount: number;
  monthlyContribution: number;
  fitsInBudget: boolean; // PocketGuard feature
}

function calculateGoalContribution(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date,
  availableIncome: number
): { monthlyContribution: number; fitsInBudget: boolean } {
  const remaining = targetAmount - currentAmount;
  const monthsRemaining = Math.max(1,
    differenceInMonths(targetDate, new Date())
  );

  const monthlyContribution = Math.ceil(remaining / monthsRemaining * 100) / 100;
  const fitsInBudget = monthlyContribution <= availableIncome;

  return { monthlyContribution, fitsInBudget };
}
```

**Why this approach:**
- Simple division (YNAB approach)
- Budget fit warning (PocketGuard feature)
- Rounds up to ensure goal met

---

#### Debt Payoff Algorithms (adopt from PocketGuard)

**Snowball Method:**
```typescript
interface Debt {
  id: string;
  name: string;
  balance: number;
  minimumPayment: number;
  apr: number;
}

function calculateSnowballPayments(
  debts: Debt[],
  extraPayoffBudget: number
): Map<string, number> {
  // Sort by balance (smallest first)
  const sorted = [...debts].sort((a, b) => a.balance - b.balance);

  const payments = new Map<string, number>();

  // First debt gets extra budget
  payments.set(sorted[0].id, sorted[0].minimumPayment + extraPayoffBudget);

  // Others get minimum only
  for (let i = 1; i < sorted.length; i++) {
    payments.set(sorted[i].id, sorted[i].minimumPayment);
  }

  return payments;
}
```

**Avalanche Method:**
```typescript
function calculateAvalanchePayments(
  debts: Debt[],
  extraPayoffBudget: number
): Map<string, number> {
  // Sort by APR (highest first)
  const sorted = [...debts].sort((a, b) => b.apr - a.apr);

  const payments = new Map<string, number>();

  // Highest APR debt gets extra budget
  payments.set(sorted[0].id, sorted[0].minimumPayment + extraPayoffBudget);

  // Others get minimum only
  for (let i = 1; i < sorted.length; i++) {
    payments.set(sorted[i].id, sorted[i].minimumPayment);
  }

  return payments;
}
```

**Why adopt both:**
- PocketGuard is only app offering this
- Snowball = psychological wins (PayPlan's target users need motivation)
- Avalanche = cost optimization (offer both, let user choose)
- Simple, proven algorithms

---

### 6.2 Rounding & Precision Standards

**Use Decimal Type (Not Float):**
```typescript
// ❌ BAD: Float precision issues
const budget = 33.33 * 3; // 99.99000000000001

// ✅ GOOD: Use integer cents
const budgetCents = Math.round(33.33 * 100) * 3; // 9999 cents
const budget = budgetCents / 100; // $99.99

// ✅ BETTER: Use library for currency
import { Dinero } from 'dinero.js';
const budget = Dinero({ amount: 3333, currency: 'USD' }).multiply(3);
```

**Recommended Library:**
```bash
npm install dinero.js
```

**Rounding Rules:**
```typescript
// Banker's rounding (round half to even)
function bankersRound(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(value * multiplier) / multiplier;

  // If exactly halfway, round to even
  if (Math.abs(value * multiplier - Math.round(value * multiplier)) === 0.5) {
    const floor = Math.floor(value * multiplier);
    return (floor % 2 === 0 ? floor : floor + 1) / multiplier;
  }

  return rounded;
}

// Round only for display, not calculations
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

**Split Transaction Handling:**
```typescript
function splitTransaction(
  totalCents: number,
  numSplits: number
): number[] {
  const baseAmount = Math.floor(totalCents / numSplits);
  const remainder = totalCents % numSplits;

  const splits = Array(numSplits).fill(baseAmount);

  // Distribute remainder (1¢ each to first N splits)
  for (let i = 0; i < remainder; i++) {
    splits[i] += 1;
  }

  return splits;
}

// Example: $100 / 3
// splitTransaction(10000, 3) → [3334, 3333, 3333] cents
// $33.34 + $33.33 + $33.33 = $100.00 ✓
```

---

### 6.3 Date Arithmetic Standards

**Month Boundary Handling:**
```typescript
import { startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';

function getDaysRemainingInMonth(date: Date = new Date()): number {
  const endOfMonthDate = endOfMonth(date);
  return differenceInDays(endOfMonthDate, date) + 1; // Include today
}

function getNextMonthStart(date: Date = new Date()): Date {
  return startOfMonth(addMonths(date, 1));
}

// Handle month boundaries for goals
function calculateMonthsUntilGoal(targetDate: Date): number {
  const today = new Date();
  const monthsRemaining = differenceInMonths(targetDate, today);

  // If target date is in current month, return 1 (not 0)
  return Math.max(1, monthsRemaining);
}
```

**Weekly Target Calculations:**
```typescript
import { eachWeekOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';

function calculateWeeklyTargetForMonth(
  weeklyAmount: number,
  targetDayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
  month: Date = new Date()
): number {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const weeksInMonth = eachWeekOfInterval(
    { start, end },
    { weekStartsOn: targetDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6 }
  );

  const occurrences = weeksInMonth.filter(
    week => getDay(week) === targetDayOfWeek
  ).length;

  return weeklyAmount * occurrences;
}

// Example: $50/week on Mondays
// 4 Mondays in month → $200
// 5 Mondays in month → $250
```

**CRITICAL: Avoid JavaScript Date.setMonth() Bug**
```typescript
// ❌ BAD: Date.setMonth() has boundary issues
const date = new Date('2025-01-31');
date.setMonth(1); // February
// Result: March 3rd (Feb doesn't have 31 days) ⚠️

// ✅ GOOD: Use date-fns for reliable date math
import { addMonths, setMonth } from 'date-fns';

const date = new Date('2025-01-31');
const nextMonth = addMonths(date, 1);
// Result: February 28th ✓

// OR use safe setMonth wrapper
function safeSetMonth(date: Date, month: number): Date {
  const newDate = new Date(date);
  const dayOfMonth = newDate.getDate();

  newDate.setMonth(month);

  // If day changed (boundary issue), set to last day of month
  if (newDate.getDate() !== dayOfMonth) {
    newDate.setDate(0); // Last day of previous month
  }

  return newDate;
}
```

**Reference:** See [ADR 003: Date Arithmetic - setMonth() Boundary Handling](docs/architecture/decisions/003-date-arithmetic-setmonth-boundary-handling.md)

---

### 6.4 Edge Cases to Handle

**1. Negative "Available to Spend"**
```typescript
function getAvailabilityStatus(available: number): {
  status: 'positive' | 'warning' | 'critical';
  message: string;
} {
  if (available >= 0) {
    return {
      status: 'positive',
      message: `You have $${(available / 100).toFixed(2)} left to spend this month.`
    };
  }

  if (available > -5000) { // Less than $50 over
    return {
      status: 'warning',
      message: `You're $${Math.abs(available / 100).toFixed(2)} over budget. Consider adjusting spending.`
    };
  }

  return {
    status: 'critical',
    message: `You're $${Math.abs(available / 100).toFixed(2)} over budget. Review your budget immediately.`
  };
}
```

**2. Zero Income Handling**
```typescript
function calculateBudgetWithZeroIncome(
  income: number,
  expenses: number
): { isValid: boolean; message?: string } {
  if (income === 0 && expenses > 0) {
    return {
      isValid: false,
      message: 'Add income to create a balanced budget, or set all expenses to $0.'
    };
  }

  if (income === 0 && expenses === 0) {
    return {
      isValid: true,
      message: 'Start by adding your income sources.'
    };
  }

  return { isValid: true };
}
```

**3. Transfer Double-Counting**
```typescript
interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  accountId: string;
  isTransfer?: boolean;
  linkedTransferId?: string; // Link to matching transfer
}

function detectTransfer(
  transaction: Transaction,
  allTransactions: Transaction[]
): boolean {
  // Look for matching opposite transaction within 24 hours
  const matchingTransfer = allTransactions.find(t =>
    t.id !== transaction.id &&
    Math.abs(t.amount) === Math.abs(transaction.amount) &&
    t.amount === -transaction.amount && // Opposite sign
    Math.abs(differenceInHours(t.date, transaction.date)) <= 24 &&
    t.accountId !== transaction.accountId // Different accounts
  );

  return !!matchingTransfer;
}

// Exclude transfers from budget calculations
function sumExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(t => !t.isTransfer && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}
```

**4. Overspending Handling (adopt from YNAB)**
```typescript
interface CategoryOverspend {
  categoryId: string;
  overspentAmount: number;
  handlingMethod: 'rollover' | 'reset' | 'penalize';
}

function handleMonthlyRollover(
  categories: Category[],
  overspendHandling: 'rollover' | 'reset' | 'penalize' = 'rollover'
): Category[] {
  return categories.map(category => {
    const rollover = category.budgeted - category.spent;

    if (overspendHandling === 'reset' && rollover < 0) {
      // PocketGuard approach: reset to $0
      return { ...category, nextMonthRollover: 0 };
    }

    if (overspendHandling === 'penalize' && rollover < 0) {
      // YNAB approach: deduct from "To Be Budgeted"
      // (Handled separately in global calculation)
      return { ...category, nextMonthRollover: 0, penaltyToGlobal: rollover };
    }

    // Monarch approach: rollover positive and negative
    return { ...category, nextMonthRollover: rollover };
  });
}
```

**5. Pending vs. Cleared Transactions (YNAB approach)**
```typescript
enum TransactionStatus {
  UNCLEARED = 'uncleared', // Pending
  CLEARED = 'cleared',     // Posted
  RECONCILED = 'reconciled' // Locked
}

interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  date: Date;
}

function calculateClearedBalance(transactions: Transaction[]): number {
  return transactions
    .filter(t =>
      t.status === TransactionStatus.CLEARED ||
      t.status === TransactionStatus.RECONCILED
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

function calculatePendingBalance(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.status === TransactionStatus.UNCLEARED)
    .reduce((sum, t) => sum + t.amount, 0);
}
```

---

### 6.5 Automation & AI Recommendations

**Phase 1 (Manual Entry - CURRENT):**
- No automation
- User manually categorizes all transactions
- User manually creates recurring transactions

**Phase 2 (Pattern Detection - FUTURE):**
```typescript
// Detect recurring patterns (Simplifi approach)
interface RecurringPattern {
  payee: string;
  category: string;
  averageAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextExpectedDate: Date;
  confidence: number; // 0-1
}

function detectRecurringPattern(
  transactions: Transaction[]
): RecurringPattern | null {
  // Group by payee
  const grouped = groupBy(transactions, 'payee');

  for (const [payee, txns] of Object.entries(grouped)) {
    if (txns.length < 3) continue; // Need at least 3 occurrences

    // Calculate average interval between transactions
    const intervals = [];
    for (let i = 1; i < txns.length; i++) {
      intervals.push(differenceInDays(txns[i].date, txns[i-1].date));
    }

    const avgInterval = mean(intervals);
    const stdDev = standardDeviation(intervals);

    // If interval consistent (low std dev), it's recurring
    if (stdDev < avgInterval * 0.2) { // 20% tolerance
      const frequency = inferFrequency(avgInterval);
      const nextDate = addDays(txns[txns.length - 1].date, avgInterval);

      return {
        payee,
        category: mode(txns.map(t => t.category)),
        averageAmount: mean(txns.map(t => t.amount)),
        frequency,
        nextExpectedDate: nextDate,
        confidence: 1 - (stdDev / avgInterval)
      };
    }
  }

  return null;
}
```

**Phase 3 (AI Categorization - PREMIUM):**
- Use OpenAI API for smart categorization
- Train on user's historical data
- Suggest categories with confidence scores

**Priority:** Phase 1 first (manual), defer automation to Phase 2+

---

### 6.6 Algorithm Complexity Comparison

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| Available to Spend | O(n) | O(1) | Sum all transactions |
| Category Rollover | O(c) | O(c) | Process each category |
| Goal Calculation | O(g) | O(1) | Process each goal |
| Debt Payoff (Snowball) | O(d log d) | O(d) | Sort debts by balance |
| Debt Payoff (Avalanche) | O(d log d) | O(d) | Sort debts by APR |
| Recurring Detection | O(n²) or O(n log n) | O(n) | Group + pattern match |
| Transfer Detection | O(n²) | O(n) | Find matching pairs |

Where:
- n = number of transactions
- c = number of categories
- g = number of goals
- d = number of debts

**Performance Targets:**
- All calculations < 100ms for typical user (1000 transactions, 20 categories)
- Real-time updates on transaction entry
- No noticeable lag on dashboard

**Optimization Strategies:**
- Use indexes for transaction lookups (by date, category, account)
- Cache calculated values (invalidate on transaction changes)
- Use incremental updates (don't recalculate everything on single transaction)

---

### 6.7 Testing Edge Cases Checklist

**Currency & Rounding:**
- [ ] Split $100 3 ways (should total exactly $100)
- [ ] Test negative balances (overspending)
- [ ] Test zero income
- [ ] Test $0.01 transactions
- [ ] Test very large amounts ($1,000,000+)

**Date Arithmetic:**
- [ ] Test month boundaries (Jan 31 → Feb 28/29)
- [ ] Test leap years
- [ ] Test weekly targets in 4-week vs 5-week months
- [ ] Test goals spanning multiple months
- [ ] Test goals due "today" (edge case: 0 months remaining)

**Rollover:**
- [ ] Test positive rollover
- [ ] Test negative rollover (overspending)
- [ ] Test rollover across 3+ months
- [ ] Test rollover with non-monthly expenses

**Transfers:**
- [ ] Test transfer detection (same day, different accounts)
- [ ] Test transfer detection (24-hour window)
- [ ] Test false positive prevention (different amounts)

**Debt Payoff:**
- [ ] Test Snowball with 5 debts
- [ ] Test Avalanche with 5 debts
- [ ] Test payoff after debt elimination (recalculation)
- [ ] Test $0 extra budget (minimums only)

**Pending Transactions:**
- [ ] Test cleared balance calculation
- [ ] Test reconciliation with pending
- [ ] Test pending → cleared status change

---

### 6.8 Data Model Recommendations

**Zod Schema Examples:**

```typescript
import { z } from 'zod';

// Transaction with status
const TransactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  date: z.date(),
  amount: z.number().int(), // Store in cents
  categoryId: z.string().uuid().optional(),
  payee: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  status: z.enum(['uncleared', 'cleared', 'reconciled']),
  isTransfer: z.boolean().default(false),
  linkedTransferId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Category with rollover
const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  budgetedAmount: z.number().int(), // Cents
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  icon: z.string().optional(),
  isEssential: z.boolean().default(false),
  allowRollover: z.boolean().default(true),
  lastMonthRollover: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Savings Goal
const SavingsGoalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  targetAmount: z.number().int().positive(),
  currentAmount: z.number().int().nonnegative().default(0),
  targetDate: z.date(),
  monthlyContribution: z.number().int().nonnegative(),
  includeInSpendingPlan: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Debt with payoff strategy
const DebtSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  balance: z.number().int().positive(),
  minimumPayment: z.number().int().positive(),
  apr: z.number().min(0).max(100), // Percentage
  payoffStrategy: z.enum(['snowball', 'avalanche', 'custom']).optional(),
  accountId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Recurring Transaction Pattern
const RecurringPatternSchema = z.object({
  id: z.string().uuid(),
  payee: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  amount: z.number().int(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.date(),
  isActive: z.boolean().default(true),
  autoCreate: z.boolean().default(false), // Auto-create transactions
  confidence: z.number().min(0).max(1).optional(), // AI confidence score
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

---

### 6.9 UI/UX Recommendations Based on Competitor Analysis

**1. Dashboard "What's Left" Widget (inspired by PocketGuard)**
```
┌─────────────────────────────────┐
│  💰 In Your Pocket              │
│                                 │
│  $1,247.38                      │
│  $41.58 / day                   │
│                                 │
│  Income:        $3,500.00       │
│  Bills:         -$1,200.00      │
│  Goals:         -$500.00        │
│  Budgets:       -$552.62        │
│  ───────────────────────         │
│  Available:     $1,247.38 ✓     │
└─────────────────────────────────┘
```

**2. Budget Rollover Indicator (inspired by Monarch)**
```
Category: Groceries          Budget: $400
Spent: $350
Remaining: $50 → Rolls to next month
```

**3. Goal Progress with Fit Warning (inspired by PocketGuard)**
```
Goal: Emergency Fund
Target: $5,000 by Dec 2025
Current: $1,200
Required: $380/month ⚠️ Over budget (Available: $300/month)
Adjust: [Extend Date] [Reduce Target] [Increase Income]
```

**4. Debt Payoff Strategy Comparison (unique to PocketGuard)**
```
Choose Strategy:
┌──────────────────┬──────────────────┐
│   Snowball       │    Avalanche     │
├──────────────────┼──────────────────┤
│ Payoff: 24 mo    │ Payoff: 22 mo    │
│ Interest: $890   │ Interest: $720   │
│ Motivation: ★★★★★ │ Savings: ★★★★★    │
│ [Select]         │ [Select]         │
└──────────────────┴──────────────────┘
```

**5. Transaction Status Badges (inspired by YNAB)**
```
Transaction List:
○ Pending  | Starbucks    | -$5.47
● Cleared  | Rent         | -$1,200.00
🔒 Locked   | Paycheck     | +$2,500.00
```

---

### 6.10 Priority Implementation Order

**Phase 1 (Current Sprint - Budgets & Categories):**
1. ✅ Category budget calculation (simple sum)
2. ✅ "Available to Spend" calculation (Income - Bills - Budgets - Goals)
3. ✅ Pie chart for spending by category
4. 🔄 Category rollover logic (Monarch formula)

**Phase 2 (Next Sprint - Goals & Insights):**
1. Goal calculation with target dates
2. Goal "fits in budget" warning (PocketGuard)
3. Budget rollover UI indicators

**Phase 3 (Future - Debt Payoff):**
1. Debt tracking
2. Snowball algorithm
3. Avalanche algorithm
4. Strategy comparison UI

**Phase 4 (Future - Automation):**
1. Recurring transaction detection
2. Transfer detection
3. AI categorization (premium)
4. Bill prediction (premium)

---

## 7. Key Takeaways for PayPlan

### What to Adopt

1. **"In My Pocket" Calculation** (PocketGuard)
   - Clearest "what's left" formula
   - Daily average is highly valuable for low-income users
   - Real-time updates align with Phase 1 goals

2. **Rollover Formula** (Monarch)
   - Simple, transparent calculation
   - Handles positive and negative rollovers elegantly
   - Better than YNAB's complex "Ready to Assign" penalty system

3. **Goal Fit Warning** (PocketGuard)
   - Unique feature not found in other apps
   - Critical for low-income users (avoid unrealistic goals)
   - Simple calculation: `monthlyContribution <= availableIncome`

4. **Debt Payoff Algorithms** (PocketGuard)
   - Only app with built-in Snowball/Avalanche
   - Target users need motivation (Snowball) and cost savings (Avalanche)
   - Offer both, let user choose

5. **Transaction Status System** (YNAB)
   - Uncleared → Cleared → Reconciled flow
   - Important for accuracy
   - Prevents reconciliation issues

### What to Avoid

1. **YNAB's Complexity**
   - "To Be Budgeted" vs "Available" confusing
   - Credit card logic overly complex
   - Target audience needs simplicity

2. **Simplifi's Vague Documentation**
   - "Other Spend" not clearly defined
   - Rollover behavior unclear
   - Users need transparency

3. **Monarch's Limited Automation**
   - No recurring detection
   - No bill prediction
   - Competitor weakness = PayPlan opportunity

4. **Zero-Based Budgeting Rigidity** (YNAB)
   - Target users may not always have income
   - Need flexibility for irregular income
   - "In My Pocket" approach more user-friendly

### Competitive Advantages for PayPlan

1. **Combine Best Features:**
   - PocketGuard's "In My Pocket" clarity
   - Monarch's rollover simplicity
   - PocketGuard's goal fit warning
   - PocketGuard's debt payoff algorithms

2. **Privacy-First (Unique):**
   - localStorage-only (all competitors require bank sync)
   - No auth required for core features
   - Full data ownership

3. **Free Core (Unique):**
   - All budgeting features free
   - Competitors charge $50-$109/year

4. **Accessibility-First (Unique):**
   - WCAG 2.1 AA from day one
   - Competitors have accessibility gaps

5. **Visual-First:**
   - Charts for every calculation
   - Gamification (streaks, insights, wins)
   - Competitors focus on spreadsheets (YNAB) or text (others)

---

## 8. References

### Official Documentation

- [YNAB Support: To Be Budgeted](https://docs.youneedabudget.com/article/203-unpacking-to-be-budgeted)
- [YNAB Support: Age of Money](https://support.ynab.com/en_us/age-of-money-H1ZS84W1s)
- [YNAB Support: Targets Guide](https://support.ynab.com/en_us/targets-in-ynab-a-guide-rk5kkI9ks)
- [YNAB Support: Credit Cards](https://support.ynab.com/en_us/handling-credit-cards-overview-ry7cNub1s)
- [YNAB Support: Reconciliation](https://support.ynab.com/en_us/reconciling-accounts-a-guide-BJFE3fHys)
- [Simplifi Support: Spending Plan](https://support.simplifi.quicken.com/en/articles/4212702-understanding-your-spending-plan)
- [Simplifi Support: Projected Cash Flow](https://support.simplifi.quicken.com/en/articles/3357429-using-projected-cash-flow)
- [Simplifi Support: Recurring Transactions](https://support.simplifi.quicken.com/en/articles/3625912-managing-recurring-transactions)
- [Monarch Help: Creating Budget](https://help.monarch.com/hc/en-us/articles/360048883631-Creating-Your-Budget-in-Monarch)
- [Monarch Help: Flex Budgeting](https://help.monarch.com/hc/en-us/articles/32125337244052-Using-Flex-Budgeting)
- [Monarch Help: Rollover Budgets](https://help.monarchmoney.com/hc/en-us/articles/4411119762196-Rollover-Budgets)
- [PocketGuard: In My Pocket](https://help.pocketguard.com/hc/en-us/articles/360002167320-IN-MY-POCKET)
- [PocketGuard: Debt Payoff Calculator](https://pocketguard.com/debt-payoff-calculator/)

### Technical Resources

- [Handling Precision in Financial Calculations](https://medium.com/@stanislavbabenko/handling-precision-in-financial-calculations-in-net-a-deep-dive-into-decimal-and-common-pitfalls-1211cc5edd3b)
- [Currency Calculations in JavaScript](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)
- [Shopify: Hanging Pennies](https://shopify.engineering/eight-tips-for-hanging-pennies)
- [Building ML for Financial Transaction Classification](https://medium.com/nerd-for-tech/how-to-build-a-machine-learning-service-for-classifying-financial-transactions-68bb722ad817)

---

**End of Research Document**

---

## Appendix A: Quick Reference Formulas

### Core Calculations

```
Available to Spend = Income - Bills - Goals - Category Budgets

Category Rollover = Last Month Rollover + Budgeted - Actual

Goal Monthly Contribution = (Target - Current) / Months Remaining

Debt Snowball: Sort by balance, pay smallest first
Debt Avalanche: Sort by APR, pay highest first

Weekly Target (monthly) = Weekly Amount × Weeks in Month
Daily Average = Available / Days Remaining

Cleared Balance = Sum(transactions where status = cleared)
Pending Balance = Sum(transactions where status = uncleared)
```

### Edge Cases

```
If Available < 0: Show warning/critical alert
If Income = 0: Prompt to add income
If Goal Contribution > Available: Show "doesn't fit budget" warning
If Transfer detected: Exclude from expense calculations
If Overspending: Apply rollover penalty (method varies by app)
```

### Rounding Rules

```
- Store all amounts in integer cents
- Round only for display
- Use banker's rounding (round half to even)
- Split amounts: distribute remainder 1¢ at a time
```

### Date Rules

```
- Always use calendar months (1st to last day)
- Weekly targets vary by month (4 or 5 occurrences)
- Goals: Minimum 1 month remaining (avoid division by zero)
- Recurring detection: Allow date variance (±2-3 days)
- Avoid Date.setMonth() for month arithmetic (use date-fns)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-02
**Next Review:** After Phase 1 implementation (MMT-61 completion)
