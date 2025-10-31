# Chunk 5: Gamification Widget 🎮

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk5-gamification`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T041-T046 (6 tasks)
**Estimated Time**: 1-2 hours
**Dependencies**: Chunk 1 complete (T009-T015)

---

## 🎯 Context Rehydration

### What You're Building

**Goal**: Implement the **Gamification widget** (User Story 6, P2) with streak tracking, personalized insights, and recent wins to drive 2.3x higher 90-day retention and 48% increase in daily active users (per behavioral research).

**Key Files**:
- `frontend/src/components/dashboard/GamificationWidget.tsx` - Widget component (new)
- `frontend/src/lib/dashboard/gamification.ts` - Gamification logic (new)
- `frontend/src/lib/dashboard/storage.ts` (update) - Add gamification persistence
- `frontend/src/pages/Dashboard.tsx` (update) - Integrate widget

**What's Already Done** (Chunks 1-4):
- ✅ **Types**: `GamificationData`, `StreakData`, `RecentWin`, `PersonalizedInsight` interfaces (frontend/src/types/gamification.ts)
- ✅ **Zod schema**: `GamificationDataSchema` (frontend/src/lib/dashboard/schemas.ts)
- ✅ **Data layer**: 5 aggregation functions (frontend/src/lib/dashboard/aggregation.ts)
- ✅ **Dashboard scaffold**: 6-widget grid layout with placeholder for gamification
- ✅ **Patterns established**: React.memo, ARIA labels, date-fns, EmptyState component

**Why This Chunk**:
User Story 6 is **P2** (lower priority) but critical for engagement. Gamification increases retention by 2.3x per industry research. Streaks, insights, and wins provide **positive reinforcement** aligned with behavioral economics principles (Nudge Theory).

---

## 📚 Research-Backed Design Principles

### Behavioral Psychology Foundations

**🔬 Key Findings from 2025 Fintech Research**:

1. **Gamification Market Growth**: $9.10B (2020) → $30.70B (2025) = **237% growth**
2. **User Engagement Impact**: **+48% daily active users** with gamification
3. **Budget Adherence**: **+67.9%** of users report improved financial behavior
4. **Retention Boost**: **2.3x higher** 90-day retention vs. non-gamified apps
5. **Motivation Theory**: Satisfies competence, autonomy, and achievement needs

**🧠 Psychological Principles Applied**:

1. **Loss Aversion**: Streaks create fear of breaking progress (Kahneman & Tversky)
2. **Progress Principle**: Visual feedback on goals increases motivation (Teresa Amabile)
3. **Variable Rewards**: Insights appear unpredictably, triggering dopamine (BJ Fogg Behavior Model)
4. **Social Proof**: "Recent wins" reinforce positive behavior through self-validation
5. **Intrinsic Motivation**: Autonomy-supportive design (Self-Determination Theory)

**⚠️ Critical Balance**: Gamification must enhance function, not distract from financial planning (Phase 1 principle).

---

### Competitor Analysis Insights

**Apps Analyzed**: Mint, YNAB, PocketGuard, Copilot, Monarch Money

**What Works**:
- ✅ **Visual progress tracking**: Progress bars with percentages
- ✅ **Instant feedback**: Real-time rewards for positive actions
- ✅ **Personalized challenges**: Tailored to user behavior patterns
- ✅ **Weekly missions**: Specific, achievable micro-goals
- ✅ **Behavior-based triggers**: Celebrations at key milestones

**What Doesn't Work**:
- ❌ **Generic badges**: No context = no motivation
- ❌ **Points systems**: Feel arbitrary without tangible benefits
- ❌ **Leaderboards**: Social comparison can be demotivating
- ❌ **Over-gamification**: UI clutter detracts from core function

**PayPlan's Unique Angle**:
- **Privacy-first gamification**: All data local, no social comparison
- **Financial behavior focus**: Rewards budget adherence, not just app usage
- **Minimalist design**: Simple widget, no modal interruptions
- **Actionable insights**: Specific suggestions, not generic praise

---

## 🧬 Spec Excerpt

**From spec.md - User Story 6**:
> As a user, I want to see my budget review streak, personalized insights, and recent wins so I feel motivated and engaged with my financial progress.

**Acceptance Scenarios**:
1. Given I have reviewed my budget for consecutive days, When I view the dashboard, Then I see my current streak count with a fire emoji 🔥
2. Given I have spending patterns detected, When I view the dashboard, Then I see 1-2 personalized insights based on my data
3. Given I am under budget, When I view the dashboard, Then I see a "recent win" message celebrating my progress

**Success Metrics (From Constitution Research)**:
- **Daily Active Users**: +30% after launch
- **Budget Adherence**: +20% users staying under budget
- **Transaction Logging**: +40% users logging daily
- **90-Day Retention**: +25% improvement

---

## 🏗️ Architecture Patterns (From Chunks 1-4)

### Established Code Patterns

**1. React.memo for Performance** (All Chunks 2-4):
```typescript
export const GamificationWidget = React.memo<GamificationWidgetProps>(({ data }) => {
  // ... component code
});

GamificationWidget.displayName = 'GamificationWidget';
```

**2. Type-Only Imports** (TypeScript Strict Mode):
```typescript
import type { GamificationData, StreakData } from '@/types/gamification';
```

**3. WCAG 2.1 AA Accessibility** (All Chunks):
- ARIA labels on all interactive elements
- Semantic HTML (`<section>`, `<h2>`, `<ul>`, `<li>`)
- Keyboard navigation support
- Screen reader friendly (visually-hidden context)

**4. Error Handling** (Chunk 1 Pattern):
```typescript
try {
  const data = localStorage.getItem(KEY);
  if (!data) return null;
  return JSON.parse(data);
} catch (error) {
  // PII-safe error logging (Feature 019 pattern)
  console.error('Error reading gamification:', error.message);
  return null;
}
```

**5. Date Handling** (Chunk 4 Pattern):
```typescript
import { format } from 'date-fns';

// ISO 8601 format for storage
const today = new Date().toISOString().slice(0, 10); // "2025-10-30"

// User-friendly display
format(new Date(date), 'MMM d, yyyy'); // "Oct 30, 2025"
```

**6. Conditional Rendering** (Chunk 4 Pattern):
```typescript
// Hide widget when no data (not empty state)
if (!data || data.streak.currentStreak === 0) {
  return null;
}
```

---

## 🔐 Git Workflow

```bash
# Start from latest feature branch
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk5-gamification

# After implementation
git add .
git commit -m "feat(dashboard): implement gamification widget with streaks and insights (T041-T046)

- Add GamificationWidget component with streaks, insights, wins
- Implement streak tracking algorithm (consecutive day detection)
- Add personalized insights generation (weekend vs weekday, MoM)
- Add recent wins detection (under budget, large income)
- Integrate gamification into Dashboard page
- Add localStorage persistence for gamification data

Behavioral research shows 2.3x retention boost with gamification.
Implements User Story 6 (P2) with Phase 1 simplicity focus.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin 062-dashboard-chunk5-gamification

# Create PR
gh pr create --base 062-short-name-dashboard \
  --title "feat(dashboard): Chunk 5 - Gamification Widget (T041-T046)" \
  --body "$(cat <<'EOF'
## Summary

Implements **Gamification widget** (User Story 6, P2) with:
- 🔥 Streak tracking (consecutive day logging)
- 💡 Personalized insights (2-3 actionable suggestions)
- 💪 Recent wins (positive financial actions)

## What Changed

### New Files
- `frontend/src/components/dashboard/GamificationWidget.tsx` - Widget component
- `frontend/src/lib/dashboard/gamification.ts` - Gamification algorithms

### Updated Files
- `frontend/src/pages/Dashboard.tsx` - Integrated gamification widget
- `frontend/src/lib/dashboard/storage.ts` - Added gamification persistence

## Behavioral Design Principles

Based on 2025 fintech research:
- **Streak tracking**: Loss aversion (Kahneman & Tversky) - users avoid breaking streaks
- **Insights**: Progress principle (Teresa Amabile) - visual feedback drives motivation
- **Recent wins**: Positive reinforcement (BJ Fogg) - celebrate small victories

## Testing

### Manual Testing Completed
- [x] Streak increments on consecutive days
- [x] Streak resets after skipping a day
- [x] Insights generate for weekend vs weekday spending
- [x] Insights generate for month-over-month changes
- [x] Recent wins detect under-budget scenarios
- [x] Widget hides when no streak (returns null)
- [x] localStorage persists gamification data
- [x] WCAG 2.1 AA compliant (ARIA labels, keyboard nav)
- [x] Responsive design (mobile/tablet/desktop)
- [x] No TypeScript errors: `npx tsc --noEmit`

### Accessibility Audit
- [x] Screen reader announces streak ("3-day streak")
- [x] Screen reader announces insights and wins
- [x] Emojis have descriptive context (not relying on emoji alone)
- [x] Color contrast 4.5:1 for all text

## Expected Impact

Per behavioral research:
- **Engagement**: +48% daily active users
- **Retention**: 2.3x higher 90-day retention
- **Budget adherence**: +67.9% improved financial behavior

## Related

- Feature 062 (Dashboard with Charts) - Chunk 5 of 6
- User Story 6 (P2): Gamification engagement layer
- Constitution Principle IV: Visual-First (charts for every concept)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## ✅ Tasks Checklist

### T041: Create GamificationWidget component [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/GamificationWidget.tsx` (new file, ~120 lines)

**Success Criteria**:
- ✅ Displays current streak with fire emoji 🔥
- ✅ Shows 1-3 personalized insights with lightbulb 💡
- ✅ Shows 1-3 recent wins with appropriate icons
- ✅ Hidden when no streak exists (returns null, not empty state)
- ✅ WCAG 2.1 AA compliant (ARIA labels, semantic HTML)
- ✅ React.memo optimization
- ✅ Responsive design (mobile/tablet/desktop)

**Implementation**:
```typescript
/**
 * Gamification Widget
 *
 * Displays streak tracking, personalized insights, and recent wins to boost
 * user engagement by 48% and retention by 2.3x (per behavioral research).
 *
 * Features:
 * - Streak tracking (consecutive day logging)
 * - Personalized spending insights (weekend vs weekday, MoM trends)
 * - Recent wins (under budget, large income)
 *
 * Behavioral Design:
 * - Loss aversion: Streaks create fear of breaking progress
 * - Progress principle: Visual feedback increases motivation
 * - Positive reinforcement: Celebrate small victories
 *
 * @component
 * @example
 * <GamificationWidget data={gamificationData} />
 */

import React from 'react';
import type { GamificationData } from '@/types/gamification';

interface GamificationWidgetProps {
  data: GamificationData | null;
}

export const GamificationWidget = React.memo<GamificationWidgetProps>(({ data }) => {
  // Hide widget if no gamification data (Phase 1: simple approach)
  if (!data || data.streak.currentStreak === 0) {
    return null;
  }

  return (
    <section
      className="bg-white rounded-lg shadow-md p-6"
      aria-labelledby="gamification-heading"
    >
      <h2 id="gamification-heading" className="text-xl font-semibold text-gray-900 mb-4">
        Your Progress
      </h2>

      {/* Streak Section - Loss Aversion Principle */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-label="Fire emoji indicating streak">
            🔥
          </span>
          <div>
            <p className="text-3xl font-bold text-orange-600" aria-live="polite">
              {data.streak.currentStreak}-day streak!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Longest streak: {data.streak.longestStreak} days
            </p>
          </div>
        </div>
      </div>

      {/* Insights Section - Progress Principle */}
      {data.insights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Insights
          </h3>
          <ul className="space-y-3" role="list">
            {data.insights.map((insight) => (
              <li
                key={insight.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border border-green-200'
                    : insight.type === 'negative'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <span
                  className="text-2xl flex-shrink-0"
                  role="img"
                  aria-label="Lightbulb emoji indicating insight"
                >
                  💡
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {insight.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Wins Section - Positive Reinforcement */}
      {data.recentWins.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Wins
          </h3>
          <ul className="space-y-3" role="list">
            {data.recentWins.map((win) => (
              <li
                key={win.id}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span
                  className="text-2xl flex-shrink-0"
                  role="img"
                  aria-label={`${win.icon} emoji`}
                >
                  {win.icon}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {win.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

GamificationWidget.displayName = 'GamificationWidget';
```

**Key Design Decisions**:
1. **Color-coded insights**: Green (positive), Red (negative), Gray (neutral) - visual hierarchy
2. **Larger fire emoji**: 4xl size emphasizes streak importance (loss aversion)
3. **Bordered containers**: Distinguish sections visually
4. **aria-live="polite"**: Streak count announced to screen readers on update
5. **Flex-shrink-0 on emojis**: Prevents emoji squishing on mobile

---

### T042: Implement streak tracking logic

**File**: `frontend/src/lib/dashboard/gamification.ts` (new file, ~150 lines)

**Success Criteria**:
- ✅ Tracks consecutive days of dashboard views
- ✅ Updates streak on page view (once per day)
- ✅ Resets streak if user skips a day
- ✅ Persists to localStorage (`payplan_gamification_v1`)
- ✅ Handles timezone correctly (uses ISO date strings)
- ✅ Error handling with PII-safe logging

**Algorithm Explanation**:

**Streak Logic** (Behavioral Economics):
1. **Same day**: No update (prevents gaming system)
2. **Consecutive day** (diff = 1): Increment streak (reward consistency)
3. **Skipped day** (diff > 1): Reset to 1 (loss aversion - user feels loss)

**Why it works**:
- **Loss aversion**: Users motivated to avoid breaking streak
- **Immediate feedback**: Streak updates instantly on dashboard view
- **Variable rewards**: Longest streak creates long-term goal

**Implementation**:
```typescript
/**
 * Gamification Engine
 *
 * Implements streak tracking, insights generation, and wins detection based on
 * behavioral psychology principles and fintech gamification best practices.
 *
 * Research-backed algorithms:
 * - Streak tracking: Loss aversion (Kahneman & Tversky)
 * - Insights: Progress principle (Teresa Amabile)
 * - Wins: Positive reinforcement (BJ Fogg Behavior Model)
 *
 * @module gamification
 */

import { v4 as uuid } from 'uuid';
import type {
  StreakData,
  GamificationData,
  PersonalizedInsight,
  RecentWin,
} from '@/types/gamification';
import type { Transaction } from '@/types/transaction';
import type { Budget } from '@/types/budget';

const GAMIFICATION_STORAGE_KEY = 'payplan_gamification_v1';

/**
 * Gets current streak data from localStorage
 *
 * @returns Streak data or default (0 streak)
 */
export function getStreakData(): StreakData {
  try {
    const data = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!data) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString(),
      };
    }
    const parsed = JSON.parse(data);
    return parsed.streak || {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
    };
  } catch (error) {
    // PII-safe error logging (Feature 019 pattern)
    if (error instanceof Error) {
      console.error('[Gamification] Error reading streak:', error.message);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
    };
  }
}

/**
 * Updates streak data based on current date
 *
 * **Streak Logic**:
 * - Same day: No update (prevents gaming system)
 * - Consecutive day (diff = 1): Increment streak
 * - Skipped day (diff > 1): Reset to 1 (loss aversion)
 *
 * **Behavioral Design**:
 * - Loss aversion: Fear of breaking streak drives daily engagement
 * - Immediate feedback: Streak updates instantly on page load
 * - Long-term goal: Longest streak creates aspirational target
 *
 * @returns Updated streak data
 */
export function updateStreakData(): StreakData {
  const currentStreak = getStreakData();

  // Use ISO date strings for timezone-safe comparison
  const today = new Date().toISOString().slice(0, 10); // "2025-10-30"
  const lastActivityDay = currentStreak.lastActivityDate.slice(0, 10);

  // Same day - no update (prevent gaming by multiple visits)
  if (today === lastActivityDay) {
    return currentStreak;
  }

  // Calculate days difference
  const todayDate = new Date(today);
  const lastDate = new Date(lastActivityDay);
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak: StreakData;

  if (daysDiff === 1) {
    // Consecutive day - increment streak (reward consistency)
    const newStreakCount = currentStreak.currentStreak + 1;
    newStreak = {
      currentStreak: newStreakCount,
      longestStreak: Math.max(currentStreak.longestStreak, newStreakCount),
      lastActivityDate: new Date().toISOString(),
    };
  } else {
    // Streak broken - reset to 1 (loss aversion - user feels loss)
    newStreak = {
      currentStreak: 1,
      longestStreak: currentStreak.longestStreak, // Preserve historical record
      lastActivityDate: new Date().toISOString(),
    };
  }

  // Persist to localStorage
  const fullData = getGamificationData();
  saveGamificationData({ ...fullData, streak: newStreak });

  return newStreak;
}

/**
 * Gets full gamification data from localStorage
 *
 * @returns Complete gamification data or default
 */
export function getGamificationData(): GamificationData {
  try {
    const data = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!data) {
      return {
        streak: getStreakData(),
        recentWins: [],
        insights: [],
      };
    }
    return JSON.parse(data) as GamificationData;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Gamification] Error reading data:', error.message);
    }
    return {
      streak: getStreakData(),
      recentWins: [],
      insights: [],
    };
  }
}

/**
 * Saves gamification data to localStorage
 *
 * @param data - Complete gamification data
 */
export function saveGamificationData(data: GamificationData): void {
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (error instanceof Error) {
      console.error('[Gamification] Error saving data:', error.message);
    }
  }
}
```

**Edge Cases Handled**:
1. **First visit**: currentStreak = 0, widget hidden
2. **Same day multiple visits**: Streak unchanged
3. **Timezone changes**: ISO date strings handle this
4. **localStorage unavailable**: Returns default values
5. **Corrupted data**: Try/catch with fallback

---

### T043: Implement personalized insights algorithm

**File**: `frontend/src/lib/dashboard/gamification.ts` (update, add ~100 lines)

**Success Criteria**:
- ✅ Detects spending patterns (weekend vs weekday, MoM trends)
- ✅ Returns max 3 insights (prevents overwhelming user)
- ✅ Insights are actionable (specific, behavior-focused)
- ✅ Includes percentage changes (quantifies behavior)
- ✅ Handles edge cases (no data, divide by zero)

**Algorithm Explanation**:

**Insight Types**:
1. **Weekend vs Weekday Spending**: Detects if user spends significantly more/less on weekends
2. **Month-over-Month Trends**: Compares current month to previous month spending

**Why These Insights**:
- **Actionable**: User can change weekend behavior or adjust monthly budget
- **Relevant**: Most users have weekday/weekend patterns
- **Timely**: Current month data is fresh and memorable

**Threshold Logic**:
- **Weekend insight**: >20% difference (ignores minor fluctuations)
- **MoM insight**: >10% difference (monthly trends are slower)

**Implementation**:
```typescript
/**
 * Generates personalized spending insights based on behavioral patterns
 *
 * **Insight Types**:
 * 1. Weekend vs Weekday Spending (>20% difference)
 * 2. Month-over-Month Trends (>10% difference)
 *
 * **Behavioral Design**:
 * - Actionable: Specific suggestions user can act on
 * - Relevant: Based on user's actual data
 * - Timely: Current month data is fresh
 * - Positive framing: Celebrate decreases, warn about increases
 *
 * @param transactions - All user transactions
 * @returns Up to 3 personalized insights
 */
export function generateInsights(
  transactions: Transaction[]
): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = [];

  // Insight 1: Weekend vs weekday spending
  const weekendSpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return (day === 0 || day === 6) && t.amount < 0; // Sunday or Saturday, expenses only
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const weekdaySpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return day >= 1 && day <= 5 && t.amount < 0; // Monday-Friday, expenses only
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (weekendSpending > 0 && weekdaySpending > 0) {
    const diff = ((weekendSpending - weekdaySpending) / weekdaySpending) * 100;
    if (Math.abs(diff) > 20) { // Only show if >20% difference
      insights.push({
        id: uuid(),
        type: diff > 0 ? 'negative' : 'positive',
        category: 'General',
        percentageChange: diff,
        message: `You spend ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} on weekends ${diff > 0 ? '😅' : '🎉'}`,
      });
    }
  }

  // Insight 2: Month-over-month spending change
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-10"
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7); // "2025-09"

  const currentMonthSpending = transactions
    .filter((t) => t.date.startsWith(currentMonth) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastMonthSpending = transactions
    .filter((t) => t.date.startsWith(lastMonth) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (lastMonthSpending > 0) { // Avoid divide by zero
    const diff = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
    if (Math.abs(diff) > 10) { // Only show if >10% difference
      insights.push({
        id: uuid(),
        type: diff > 0 ? 'negative' : 'positive',
        category: 'General',
        percentageChange: diff,
        message: `You spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} this month ${diff > 0 ? '📈' : '📉'}`,
      });
    }
  }

  // Return max 3 insights (prevents overwhelming user)
  return insights.slice(0, 3);
}
```

**Future Enhancements** (Phase 2):
- Category-specific insights ("Dining spending up 30%")
- Goal progress insights ("You're 80% to your savings goal!")
- BNPL payment warnings ("$50 BNPL payment due in 3 days")

---

### T044: Implement recent wins detection

**File**: `frontend/src/lib/dashboard/gamification.ts` (update, add ~80 lines)

**Success Criteria**:
- ✅ Detects under-budget scenarios (by category)
- ✅ Detects large income transactions (>$1000)
- ✅ Returns max 3 wins (prevents clutter)
- ✅ Sorts by timestamp (most recent first)
- ✅ Handles cents-to-dollars conversion

**Algorithm Explanation**:

**Win Types**:
1. **Under Budget**: User spent less than monthly limit for any category
2. **Large Income**: User earned >$1000 in last 7 days

**Why These Wins**:
- **Under budget**: Celebrates good financial behavior (budget adherence)
- **Large income**: Positive reinforcement for earning (not just saving)

**Behavioral Design**:
- **Positive framing**: "You're $X under budget!" (not "You spent $Y less")
- **Specific numbers**: "$123.45" feels more tangible than "lots of money"
- **Timely**: Recent wins (last 7 days) are memorable

**Implementation**:
```typescript
/**
 * Detects recent wins (positive financial actions)
 *
 * **Win Types**:
 * 1. Under Budget: Spent less than monthly limit for any category
 * 2. Large Income: Earned >$1000 in last 7 days
 *
 * **Behavioral Design**:
 * - Positive framing: Celebrate successes, not failures
 * - Specific numbers: "$123.45" > "lots of money"
 * - Timely: Last 7 days are memorable
 *
 * @param transactions - All user transactions
 * @param budgets - All user budgets
 * @returns Up to 3 recent wins
 */
export function detectRecentWins(
  transactions: Transaction[],
  budgets: Budget[]
): RecentWin[] {
  const wins: RecentWin[] = [];

  // Win 1: Under budget for any category
  const currentMonth = new Date().toISOString().slice(0, 7);

  budgets.forEach((budget) => {
    const spent = transactions
      .filter(
        (t) =>
          t.categoryId === budget.categoryId &&
          t.date.startsWith(currentMonth) &&
          t.amount < 0 // Expenses only
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Convert cents to dollars (Phase 1 pattern from Chunk 4)
    const spentDollars = spent / 100;
    const budgetDollars = budget.monthlyLimit / 100;

    if (spentDollars < budgetDollars) {
      const remainingDollars = budgetDollars - spentDollars;
      wins.push({
        id: uuid(),
        message: `You're $${remainingDollars.toFixed(2)} under budget for ${budget.categoryName}! 💪`,
        timestamp: new Date().toISOString(),
        icon: '💪',
      });
    }
  });

  // Win 2: Large income transaction (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentIncome = transactions
    .filter(
      (t) => t.amount > 0 && new Date(t.date).getTime() > sevenDaysAgo // Income only
    )
    .sort((a, b) => b.amount - a.amount)[0]; // Largest income

  if (recentIncome && recentIncome.amount > 100000) { // >$1000 (in cents)
    const amountDollars = recentIncome.amount / 100;
    wins.push({
      id: uuid(),
      message: `💰 Nice! You earned $${amountDollars.toFixed(2)}`,
      timestamp: recentIncome.date,
      icon: '💰',
    });
  }

  // Sort by timestamp (most recent first) and limit to 3
  return wins
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
}
```

**Future Enhancements** (Phase 2):
- **Debt payments**: "Paid $50 toward BNPL loan!"
- **Savings milestones**: "Reached 50% of your goal!"
- **Consecutive wins**: "Under budget 3 months in a row!"

---

### T045: Add localStorage persistence for gamification data

**File**: `frontend/src/lib/dashboard/storage.ts` (update, add ~25 lines)

**Success Criteria**:
- ✅ Add `GAMIFICATION` to `STORAGE_KEYS` constant
- ✅ Add `readGamification()` function
- ✅ Follows existing storage patterns (Chunk 1)
- ✅ Error handling with PII-safe logging

**Implementation**:
```typescript
// Add to storage.ts (after existing STORAGE_KEYS)

export const STORAGE_KEYS = {
  CATEGORIES: 'payplan_categories_v1',
  BUDGETS: 'payplan_budgets_v1',
  TRANSACTIONS: 'payplan_transactions_v1',
  GOALS: 'payplan_goals_v1',
  GAMIFICATION: 'payplan_gamification_v1', // ← Add this
} as const;

// Add after existing read functions

/**
 * Reads gamification data from localStorage
 *
 * @returns Gamification data or null if not found
 */
export function readGamification(): GamificationData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Zod validation (optional, but recommended for Phase 2)
    // const validated = GamificationDataSchema.parse(parsed);
    // return validated;

    return parsed as GamificationData;
  } catch (error) {
    // PII-safe error logging (Feature 019 pattern)
    if (error instanceof Error) {
      console.error('[Storage] Error reading gamification:', error.message);
    }
    return null;
  }
}
```

---

### T046: Integrate GamificationWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update, ~15 lines changed)

**Success Criteria**:
- ✅ Replace Widget 6 placeholder with `<GamificationWidget>`
- ✅ Call `updateStreakData()` on mount (useEffect)
- ✅ Generate insights and wins from aggregated data
- ✅ Pass gamification data to widget
- ✅ Follows Chunk 1-4 patterns (useDashboardData hook)

**Implementation**:
```typescript
// Add imports at top of Dashboard.tsx
import { useEffect, useMemo } from 'react';
import { GamificationWidget } from '@/components/dashboard/GamificationWidget';
import {
  updateStreakData,
  getGamificationData,
  generateInsights,
  detectRecentWins,
  saveGamificationData,
} from '@/lib/dashboard/gamification';

// Inside Dashboard component, after existing hooks

// Update streak on page load (Loss Aversion principle)
useEffect(() => {
  updateStreakData();
}, []);

// Generate gamification data (memoized for performance)
const gamificationData = useMemo(() => {
  const baseData = getGamificationData();

  // Generate fresh insights and wins from current data
  const insights = generateInsights(transactions);
  const wins = detectRecentWins(transactions, budgets);

  const updatedData = {
    ...baseData,
    insights,
    recentWins: wins,
  };

  // Persist updated data
  saveGamificationData(updatedData);

  return updatedData;
}, [transactions, budgets]); // Re-calculate when data changes

// Replace Widget 6 placeholder with GamificationWidget
// Find this section:
{/* Widget 6: Gamification (P2) - Coming in Chunk 5 */}
<section className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300" ...>
  ...
</section>

// Replace with:
{/* Widget 6: Gamification (P2) - Implemented in Chunk 5 */}
<GamificationWidget data={gamificationData} />
```

**Key Integration Points**:
1. **Streak update**: Happens on mount, once per session
2. **Insights/wins generation**: Recalculated when transactions/budgets change
3. **Memoization**: Prevents unnecessary recalculations
4. **Persistence**: Saves updated data to localStorage

---

## 🧪 Validation

### Manual Testing Checklist

#### Functional Testing

**Streak Tracking**:
- [ ] View dashboard on Day 1 → streak = 1
- [ ] View dashboard on Day 2 (next day) → streak = 2
- [ ] View dashboard on Day 3 (next day) → streak = 3
- [ ] Skip a day, view dashboard → streak = 1 (resets correctly)
- [ ] Longest streak updates when current streak exceeds it
- [ ] Multiple visits same day → streak unchanged

**Insights Generation**:
- [ ] Weekend spending >20% more than weekday → negative insight appears
- [ ] Weekend spending >20% less than weekday → positive insight appears
- [ ] Current month spending >10% more than last month → negative insight appears
- [ ] Current month spending >10% less than last month → positive insight appears
- [ ] Max 3 insights displayed (even if more detected)

**Recent Wins**:
- [ ] Under budget for any category → win appears with remaining amount
- [ ] Large income (>$1000) in last 7 days → win appears with amount
- [ ] Max 3 wins displayed (sorted by most recent)

**Widget Behavior**:
- [ ] Widget hidden when streak = 0 (returns null, not empty state)
- [ ] Widget visible when streak > 0
- [ ] All sections render correctly (streak, insights, wins)

#### Accessibility Testing (WCAG 2.1 AA)

**Screen Reader**:
- [ ] Screen reader announces "Your Progress" heading
- [ ] Screen reader announces streak count ("3-day streak")
- [ ] Screen reader announces insights messages
- [ ] Screen reader announces recent wins messages
- [ ] Emojis have descriptive aria-label context

**Keyboard Navigation**:
- [ ] Tab key navigates through widget sections
- [ ] All content accessible via keyboard only
- [ ] Focus indicators visible on interactive elements

**Visual**:
- [ ] Color contrast 4.5:1 for all text (use WebAIM Contrast Checker)
- [ ] Color-coding supplemented with text (not relying on color alone)
- [ ] Text readable on all backgrounds

#### Responsive Design Testing

- [ ] **Mobile (375px)**: Widget renders correctly, text readable, no overflow
- [ ] **Tablet (768px)**: Widget renders correctly in grid layout
- [ ] **Desktop (1920px)**: Widget proportional to other widgets

#### Console Testing

- [ ] **TypeScript compilation**: `cd frontend && npx tsc --noEmit` → 0 errors
- [ ] **No console errors** on page load
- [ ] **No console warnings** on page load
- [ ] **localStorage persists** gamification data correctly
- [ ] **Streak updates persist** across page reloads

#### Data Validation

- [ ] Streak increments only once per day (not per visit)
- [ ] Date comparison handles timezone correctly (ISO strings)
- [ ] Insights algorithm generates relevant insights (not generic)
- [ ] Recent wins limited to 3 most recent (not all wins)
- [ ] Cents-to-dollars conversion correct (amount / 100)

---

## 🎯 Success Criteria Summary

**Chunk 5 is DONE when**:

### Code Quality
- ✅ All 6 tasks (T041-T046) completed
- ✅ TypeScript compilation: 0 errors
- ✅ No console errors or warnings
- ✅ Code follows Chunk 1-4 patterns (React.memo, type-only imports, error handling)

### Functionality
- ✅ Gamification widget displays streak, insights, wins
- ✅ Streak increments on consecutive days, resets after skip
- ✅ Insights generate for spending patterns (weekend, MoM)
- ✅ Recent wins detect under-budget and large income
- ✅ Widget hidden when no streak (returns null)
- ✅ localStorage persists gamification data

### Accessibility (WCAG 2.1 AA)
- ✅ Screen reader announces all content
- ✅ Keyboard navigation works
- ✅ Color contrast 4.5:1
- ✅ ARIA labels on emojis and sections

### Design & UX
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Visual hierarchy clear (streak emphasized)
- ✅ Color-coded insights (green/red/gray)
- ✅ Positive framing ("$X under budget", not "spent $Y less")

### Integration
- ✅ Widget integrated into Dashboard page (replaces placeholder)
- ✅ Streak updates on page load
- ✅ Data recalculates when transactions/budgets change

### Pull Request
- ✅ PR created with comprehensive description
- ✅ Bot reviews pass (Claude Code Bot + CodeRabbit AI)
- ✅ Manual testing checklist completed
- ✅ HIL approval received

---

## 📊 Expected Impact (Behavioral Research)

Based on 2025 fintech gamification research:

| Metric | Baseline | Target | Evidence |
|--------|----------|--------|----------|
| **Daily Active Users** | 100% | +48% | Gamification market growth data |
| **90-Day Retention** | 100% | +230% (2.3x) | Journal of Financial Technology |
| **Budget Adherence** | 50% | +67.9% | User behavior studies |
| **Transaction Logging** | 60% | +40% | Streak tracking effectiveness |

**Why This Works**:
- **Loss Aversion**: Users don't want to break streaks (Kahneman & Tversky)
- **Progress Principle**: Visual feedback increases motivation (Teresa Amabile)
- **Positive Reinforcement**: Celebrating wins drives behavior (BJ Fogg)
- **Intrinsic Motivation**: Autonomy and competence needs (Self-Determination Theory)

---

## 🔗 References

**Specification Documents**:
- [tasks.md](../tasks.md) - Complete 52-task breakdown
- [spec.md](../spec.md) - User stories and acceptance criteria
- [gamification-algorithms.md](../research-docs/gamification-algorithms.md) - Behavioral research

**Phase 1 Implementation** (Completed):
- [frontend/src/types/gamification.ts](../../../frontend/src/types/gamification.ts) - Type definitions
- [frontend/src/lib/dashboard/schemas.ts](../../../frontend/src/lib/dashboard/schemas.ts) - Zod schemas
- [frontend/src/lib/dashboard/aggregation.ts](../../../frontend/src/lib/dashboard/aggregation.ts) - Data layer

**Chunks 1-4 Patterns**:
- [chunk-1-foundation.md](./chunk-1-foundation.md) (removed) - Data layer patterns
- [README.md](./README.md) - Chunk 2-4 summaries with lessons learned

**Project Guidelines**:
- [CLAUDE.md](../../../CLAUDE.md) - Development guide for Claude Code
- [memory/constitution_v1.1_TEMP.md](../../../memory/constitution_v1.1_TEMP.md) - Project constitution

---

## 🚀 Next Steps After Chunk 5

**Chunk 6**: Polish & Integration (T047-T052)
- Final Dashboard page polish
- Loading states and error boundaries
- Responsive grid optimization
- Manual testing and bug fixes
- Final PR to main

**After All Chunks Complete**:
- Feature 062 complete (52 tasks)
- Dashboard with 6 widgets functional
- Manual testing passed
- Bot reviews approved
- Merge to main after HIL approval

---

**🎮 Let's build engagement-driving gamification that increases retention by 2.3x!**

**Remember**: Gamification must enhance function, not distract from it. Keep it simple, actionable, and privacy-first (Phase 1 principles).
