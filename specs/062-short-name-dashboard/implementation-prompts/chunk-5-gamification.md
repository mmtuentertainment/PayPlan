# Chunk 5: Gamification Widget

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**Branch**: `062-dashboard-chunk5-gamification`
**Base Branch**: `062-short-name-dashboard`
**Tasks**: T041-T046 (6 tasks)
**Estimated Time**: 1-2 hours
**Dependencies**: Chunk 1 complete (T009-T015)

---

## Context Rehydration

### What You're Building

**Goal**: Implement the **Gamification widget** (User Story 6, P2) with streak tracking, personalized insights, and recent wins.

**Key Files**:
- `frontend/src/components/dashboard/GamificationWidget.tsx` - Widget component
- `frontend/src/lib/dashboard/gamification.ts` - Gamification logic (streak, insights, wins)
- `frontend/src/lib/dashboard/storage.ts` (update) - Add gamification persistence

**What's Already Done**:
- ✅ Types: `GamificationData`, `StreakData`, `RecentWin`, `PersonalizedInsight` interfaces
- ✅ Zod schema: `GamificationDataSchema`

**Why This Chunk**:
User Story 6 is **P2** (lower priority). Gamification increases engagement by 2x per constitution research. Streaks, insights, and wins provide positive reinforcement.

---

### Spec Excerpt

**From spec.md - User Story 6**:
> As a user, I want to see my budget review streak, personalized insights, and recent wins so I feel motivated and engaged with my financial progress.

**Acceptance Scenarios**:
1. Given I have reviewed my budget for consecutive days, When I view the dashboard, Then I see my current streak count with a fire emoji
2. Given I have spending patterns detected, When I view the dashboard, Then I see 1-2 personalized insights based on my data
3. Given I am under budget, When I view the dashboard, Then I see a "recent win" message celebrating my progress

---

## Git Workflow

```bash
git checkout 062-short-name-dashboard
git pull origin 062-short-name-dashboard
git checkout -b 062-dashboard-chunk5-gamification

# After implementation
git add .
git commit -m "feat(dashboard): implement gamification widget with streaks and insights (T041-T046)"
git push origin 062-dashboard-chunk5-gamification

# Create PR
gh pr create --base 062-short-name-dashboard --title "feat(dashboard): Chunk 5 - Gamification Widget (T041-T046)"
```

---

## TypeScript Patterns (From Chunks 1-3)

**IMPORTANT**: Follow these patterns to avoid compilation errors:

### React.memo for Performance
Use React.memo for the widget component:
```typescript
export const GamificationWidget = React.memo<GamificationWidgetProps>(({ data }) => {
  // ... component code
});

GamificationWidget.displayName = 'GamificationWidget';
```

### Type-Only Imports
```typescript
import type { GamificationData, StreakData } from '../../types/gamification';
```

---

## Tasks Checklist

### T041: Create GamificationWidget component [PARALLELIZABLE]

**File**: `frontend/src/components/dashboard/GamificationWidget.tsx`

**Success Criteria**:
- ✅ Displays current streak with fire emoji
- ✅ Shows 1-2 personalized insights
- ✅ Shows 1-3 recent wins
- ✅ Hidden when no streak or insights exist (not empty state)

**Implementation**:
```typescript
import React from 'react';
import type { GamificationData } from '../../types/gamification';

interface GamificationWidgetProps {
  data: GamificationData | null;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ data }) => {
  // Hide widget if no gamification data
  if (!data || data.streak.currentStreak === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>

      {/* Streak Section */}
      <div className="mb-6">
        <p className="text-3xl font-bold text-orange-600">
          🔥 {data.streak.currentStreak}-day streak!
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Longest streak: {data.streak.longestStreak} days
        </p>
      </div>

      {/* Insights Section */}
      {data.insights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights</h3>
          <ul className="space-y-2">
            {data.insights.map((insight) => (
              <li key={insight.id} className="flex items-start gap-2">
                <span className="text-xl">💡</span>
                <p className="text-gray-700">{insight.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Wins Section */}
      {data.recentWins.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Wins</h3>
          <ul className="space-y-2">
            {data.recentWins.map((win) => (
              <li key={win.id} className="flex items-start gap-2">
                <span className="text-xl">{win.icon}</span>
                <p className="text-gray-700">{win.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

### T042: Implement streak tracking logic

**File**: `frontend/src/lib/dashboard/gamification.ts` (new file)

**Success Criteria**:
- ✅ Tracks consecutive days of dashboard views
- ✅ Updates streak on page view
- ✅ Resets streak if user skips a day
- ✅ Persists to localStorage

**Implementation**:
```typescript
import type { StreakData, GamificationData } from '../../types/gamification';
import { v4 as uuid } from 'uuid';

const GAMIFICATION_STORAGE_KEY = 'payplan_gamification_v1';

/**
 * Gets current streak data from localStorage
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
    console.error('Error reading streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date().toISOString(),
    };
  }
}

/**
 * Updates streak data based on current date
 */
export function updateStreakData(): StreakData {
  const currentStreak = getStreakData();
  const today = new Date().toISOString().slice(0, 10); // "2025-10-29"
  const lastActivityDay = currentStreak.lastActivityDate.slice(0, 10);

  // Same day - no update
  if (today === lastActivityDay) {
    return currentStreak;
  }

  // Calculate days difference
  const todayDate = new Date(today);
  const lastDate = new Date(lastActivityDay);
  const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak: StreakData;

  if (daysDiff === 1) {
    // Consecutive day - increment streak
    newStreak = {
      currentStreak: currentStreak.currentStreak + 1,
      longestStreak: Math.max(currentStreak.longestStreak, currentStreak.currentStreak + 1),
      lastActivityDate: new Date().toISOString(),
    };
  } else {
    // Streak broken - reset to 1
    newStreak = {
      currentStreak: 1,
      longestStreak: currentStreak.longestStreak,
      lastActivityDate: new Date().toISOString(),
    };
  }

  // Save to localStorage
  saveGamificationData({ ...getGamificationData(), streak: newStreak });

  return newStreak;
}

/**
 * Gets full gamification data
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
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading gamification data:', error);
    return {
      streak: getStreakData(),
      recentWins: [],
      insights: [],
    };
  }
}

/**
 * Saves gamification data to localStorage
 */
export function saveGamificationData(data: GamificationData): void {
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving gamification data:', error);
  }
}
```

---

### T043: Implement personalized insights algorithm

**File**: `frontend/src/lib/dashboard/gamification.ts` (update)

**Success Criteria**:
- ✅ Detects spending patterns (e.g., "You spend 40% more on weekends")
- ✅ Returns max 3 insights
- ✅ Insights are actionable

**Implementation**:
```typescript
import type { PersonalizedInsight } from '../../types/gamification';
import type { Transaction, Category } from '../../types';

/**
 * Generates personalized insights based on spending patterns
 */
export function generateInsights(
  transactions: Transaction[],
  categories: Category[]
): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = [];

  // Insight 1: Weekend vs weekday spending
  const weekendSpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return (day === 0 || day === 6) && t.type === 'expense';
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const weekdaySpending = transactions
    .filter((t) => {
      const day = new Date(t.date).getDay();
      return day >= 1 && day <= 5 && t.type === 'expense';
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (weekendSpending > 0 && weekdaySpending > 0) {
    const diff = ((weekendSpending - weekdaySpending) / weekdaySpending) * 100;
    if (Math.abs(diff) > 20) {
      insights.push({
        id: uuid(),
        type: diff > 0 ? 'negative' : 'positive',
        category: 'General',
        percentageChange: diff,
        message: `You spend ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} on weekends 💰`,
      });
    }
  }

  // Insight 2: Month-over-month spending change
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const currentMonthSpending = transactions
    .filter((t) => t.date.startsWith(currentMonth) && t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastMonthSpending = transactions
    .filter((t) => t.date.startsWith(lastMonth) && t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (lastMonthSpending > 0) {
    const diff = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
    if (Math.abs(diff) > 10) {
      insights.push({
        id: uuid(),
        type: diff > 0 ? 'negative' : 'positive',
        category: 'General',
        percentageChange: diff,
        message: `You spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} this month ${diff > 0 ? '😅' : '🎉'}`,
      });
    }
  }

  return insights.slice(0, 3);
}
```

---

### T044: Implement recent wins detection

**File**: `frontend/src/lib/dashboard/gamification.ts` (update)

**Success Criteria**:
- ✅ Detects under-budget scenarios
- ✅ Detects debt payments
- ✅ Returns max 3 wins

**Implementation**:
```typescript
import type { RecentWin } from '../../types/gamification';
import type { Transaction, Budget } from '../../types';

/**
 * Detects recent wins (positive financial actions)
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
      .filter((t) => t.categoryId === budget.categoryId && t.date.startsWith(currentMonth) && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (spent < budget.monthlyLimit) {
      const remaining = budget.monthlyLimit - spent;
      wins.push({
        id: uuid(),
        message: `You're $${remaining.toFixed(2)} under budget! 💪`,
        timestamp: new Date().toISOString(),
        icon: '💪',
      });
    }
  });

  // Win 2: Large income transaction
  const recentIncome = transactions
    .filter((t) => t.type === 'income' && new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b.amount - a.amount)[0];

  if (recentIncome && recentIncome.amount > 1000) {
    wins.push({
      id: uuid(),
      message: `💰 Nice! You earned $${recentIncome.amount.toFixed(2)}`,
      timestamp: recentIncome.createdAt,
      icon: '💰',
    });
  }

  return wins.slice(0, 3);
}
```

---

### T045: Add localStorage persistence for streak data

**File**: `frontend/src/lib/dashboard/storage.ts` (update)

**Success Criteria**:
- ✅ Add `readGamification()` function
- ✅ Gamification data persisted to `payplan_gamification_v1`

**Implementation**:
```typescript
// Add to storage.ts
export const STORAGE_KEYS = {
  CATEGORIES: 'payplan_categories_v1',
  BUDGETS: 'payplan_budgets_v1',
  TRANSACTIONS: 'payplan_transactions_v1',
  GOALS: 'payplan_goals_v1',
  GAMIFICATION: 'payplan_gamification_v1', // Add this
} as const;

export function readGamification(): GamificationData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading gamification from localStorage:', error);
    return null;
  }
}
```

---

### T046: Integrate GamificationWidget into Dashboard page

**File**: `frontend/src/pages/Dashboard.tsx` (update)

**Success Criteria**:
- ✅ Replace Widget 6 placeholder with `<GamificationWidget>`
- ✅ Call `updateStreakData()` on mount
- ✅ Pass gamification data from hook

**Implementation**:
```typescript
import { useEffect } from 'react';
import { GamificationWidget } from '../components/dashboard/GamificationWidget';
import { updateStreakData, getGamificationData } from '../lib/dashboard/gamification';

// In Dashboard component
useEffect(() => {
  // Update streak on page load
  updateStreakData();
}, []);

const gamificationData = getGamificationData();

// Replace Widget 6 placeholder
<GamificationWidget data={gamificationData} />
```

---

## Validation

### Manual Testing Checklist

#### Functional Testing
- [ ] View dashboard 3 days in a row → verify streak = 3
- [ ] Skip a day, view dashboard → verify streak = 1 (resets correctly)
- [ ] Longest streak updates when current streak exceeds it
- [ ] Insights generate for weekend vs weekday spending patterns
- [ ] Insights generate for month-over-month spending changes
- [ ] Recent wins display when under budget this month
- [ ] Recent wins display for large income transactions (>$1000)
- [ ] Widget hides when streak = 0 (returns null)

#### Accessibility Testing (WCAG 2.1 AA)
- [ ] Screen reader announces streak count ("3-day streak")
- [ ] Screen reader announces each insight message
- [ ] Screen reader announces each recent win message
- [ ] Keyboard navigation: Tab focuses on widget content
- [ ] Color contrast meets 4.5:1 for all text
- [ ] Emojis have descriptive context (not relying on emoji alone)

#### Responsive Design Testing
- [ ] Mobile (375px): Widget renders correctly, text readable
- [ ] Tablet (768px): Widget renders correctly
- [ ] Desktop (1920px): Widget renders correctly

#### Console Testing
- [ ] No TypeScript compilation errors: `cd frontend && npx tsc --noEmit`
- [ ] No console errors or warnings on page load
- [ ] localStorage persists gamification data correctly
- [ ] Streak updates persist across page reloads

#### Data Validation
- [ ] Streak increments only once per day (multiple visits same day = same streak)
- [ ] Date comparison works correctly (handles timezone properly)
- [ ] Insights algorithm generates 1-2 relevant insights (not more)
- [ ] Recent wins limited to 3 most recent (not all wins)

---

## Success Criteria Summary

Chunk 5 is DONE when:
- ✅ All 6 tasks (T041-T046) completed
- ✅ Gamification widget displays streak, insights, wins
- ✅ Streak increments on consecutive days
- ✅ Widget hidden when no gamification data
- ✅ Widget integrated into Dashboard page
- ✅ PR created and bot reviews pass

---

**References**: [tasks.md](../tasks.md) | [spec.md](../spec.md) | [chunk-1-foundation.md](./chunk-1-foundation.md)
