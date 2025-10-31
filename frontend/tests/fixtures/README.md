# Gamification Test Fixtures

This directory contains test fixtures for manually testing the Gamification Widget populated state.

## Problem Statement

The Gamification Widget has two states:
1. **Empty State**: "Start Your Journey" (for new users with streak=0)
2. **Populated State**: "Your Progress" (for users with streak>0, insights, and wins)

Manual testing of the populated state is challenging because:
- Streaks are based on consecutive daily visits (requires multi-day testing)
- Insights and wins are generated from transactions/budgets
- The Dashboard component regenerates data on every render, overwriting manual localStorage injection

## Solution

We provide two testing approaches:

### Option 1: Unit Tests with Mock Data (Recommended)

Use the fixtures in `gamification.fixtures.ts` to test the component in isolation:

```typescript
import { render, screen } from '@testing-library/react';
import { GamificationWidget } from '@/components/dashboard/GamificationWidget';
import { mockGamificationData } from '@/tests/fixtures/gamification.fixtures';

test('displays populated state with streak', () => {
  render(<GamificationWidget data={mockGamificationData} />);

  expect(screen.getByText('Your Progress')).toBeInTheDocument();
  expect(screen.getByText(/3-day streak/)).toBeInTheDocument();
  expect(screen.getByText(/Longest streak: 5 days/)).toBeInTheDocument();
});
```

### Option 2: Manual Testing with Test Mode

Enable test mode to bypass data regeneration and manually inject test data.

#### Step 1: Start Dev Server in Test Mode

```bash
cd frontend
cp .env.test .env.local
npm run dev
```

#### Step 2: Inject Test Data via Browser Console

```javascript
// Open http://localhost:5173 in browser
// Open DevTools Console (F12)
// Run this script:

const gamificationData = {
  streak: {
    currentStreak: 3,
    longestStreak: 5,
    lastActivityDate: new Date().toISOString()
  },
  insights: [
    {
      id: crypto.randomUUID(),
      type: 'positive',
      category: 'spending',
      percentageChange: 15,
      message: 'You spent 15% less this month compared to last month. Keep it up!'
    },
    {
      id: crypto.randomUUID(),
      type: 'neutral',
      category: 'weekend',
      percentageChange: 25,
      message: 'You spend 25% more on weekends. Consider meal prepping to save on weekend dining.'
    }
  ],
  recentWins: [
    {
      id: crypto.randomUUID(),
      message: 'You received a large income of $1,500!',
      timestamp: new Date().toISOString(),
      icon: '💰'
    },
    {
      id: crypto.randomUUID(),
      message: 'You stayed under budget in Groceries this month!',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      icon: '🎯'
    }
  ]
};

localStorage.setItem('payplan_gamification_v1', JSON.stringify(gamificationData));
window.location.reload();
```

#### Step 3: Verify Populated State

After reload, the Gamification Widget should display:
- ✅ Heading: "Your Progress"
- ✅ Streak: "🔥 3-day streak! Longest streak: 5 days"
- ✅ Insights: 2 insights with lightbulb emoji and colored backgrounds
- ✅ Recent Wins: 2 wins with emoji icons

#### Step 4: Clean Up

```bash
# Remove test mode after testing
rm .env.local
```

## Available Fixtures

### Mock Data Sets

| Fixture | Description | Use Case |
|---------|-------------|----------|
| `mockGamificationData` | 3-day streak, 2 insights, 2 wins | Standard populated state |
| `mockEmptyGamificationData` | 0-day streak, no data | Empty state testing |
| `mockLongStreakData` | 30-day streak, 3 insights, 3 wins | Highly engaged user |
| `mockStreakOnlyData` | 2-day streak, no insights/wins | Streak-only view |
| `mockAllInsightTypesData` | All insight types (positive/negative/neutral) | Visual testing |

### Individual Components

| Fixture | Type | Description |
|---------|------|-------------|
| `mockPositiveInsight` | PersonalizedInsight | Green background, positive message |
| `mockNegativeInsight` | PersonalizedInsight | Red background, negative message |
| `mockNeutralInsight` | PersonalizedInsight | Gray background, neutral message |
| `mockLargeIncomeWin` | RecentWin | 💰 Large income win |
| `mockUnderBudgetWin` | RecentWin | 🎯 Under budget win |
| `mockSavingsGoalWin` | RecentWin | 🎉 Savings goal win |

## Test Mode Implementation

Test mode is controlled by the `VITE_GAMIFICATION_TEST_MODE` environment variable:

- **Default (production)**: Dashboard regenerates insights/wins from transactions/budgets
- **Test mode (`VITE_GAMIFICATION_TEST_MODE=true`)**: Dashboard uses localStorage data as-is

### Code Location

The test mode logic is in [Dashboard.tsx:67-76](../../../src/pages/Dashboard.tsx#L67-L76):

```typescript
const gamificationData = useMemo(() => {
  const baseData = getGamificationData();

  // Test mode: Return localStorage data without regeneration
  if (import.meta.env.VITE_GAMIFICATION_TEST_MODE === 'true') {
    return baseData;
  }

  // Production mode: Generate fresh insights and wins from current data
  // ...
}, [/* dependencies */]);
```

## Why This Approach?

### The Problem

The Dashboard component's `useMemo` hook:
1. Reads base gamification data from localStorage
2. Generates fresh insights from current transactions
3. Generates fresh wins from current budgets
4. **Saves back to localStorage**, overwriting manual data

This means manually injected insights/wins get overwritten on every render.

### The Solution

Test mode bypasses steps 2-4, allowing manual localStorage injection to persist.

This is safe because:
- ✅ Only enabled via explicit environment variable
- ✅ Never deployed to production (`.env.test` not in `.env.production`)
- ✅ Clearly documented with comments in code
- ✅ Easy to enable/disable for testing

## Accessibility Testing

When testing the populated state, verify:

1. **Streak Section**:
   - `aria-label="Fire emoji indicating streak"` on 🔥 emoji
   - `aria-live="polite"` on streak count
   - Proper heading hierarchy (h2 → h3)

2. **Insights Section**:
   - `aria-live="polite" aria-atomic="true"` on section
   - `aria-label="Lightbulb emoji indicating insight"` on 💡 emoji
   - `role="list"` on ul element
   - Color coding matches type (green=positive, red=negative, gray=neutral)

3. **Wins Section**:
   - `aria-live="polite" aria-atomic="true"` on section
   - `aria-label="${icon} emoji"` on win icons
   - `role="list"` on ul element

4. **Keyboard Navigation**:
   - Tab through all sections
   - Focus indicators visible (2px outline)

## Color Contrast Testing

Verify WCAG 2.1 AA compliance (4.5:1 ratio for text):

| Element | Background | Text | Ratio | Status |
|---------|------------|------|-------|--------|
| Streak | #fff7ed (orange-50) | #ea580c (orange-600) | TBD | ⏳ |
| Positive Insight | #f0fdf4 (green-50) | #16a34a (green-600) | TBD | ⏳ |
| Negative Insight | #fef2f2 (red-50) | #dc2626 (red-600) | TBD | ⏳ |
| Neutral Insight | #f9fafb (gray-50) | #4b5563 (gray-600) | TBD | ⏳ |
| Recent Win | #eff6ff (blue-50) | #2563eb (blue-600) | TBD | ⏳ |

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

## Related Documentation

- **Testing Report**: `/home/matt/PROJECTS/PayPlan/memory/handoffs/pr62-manual-testing-report.md`
- **Component**: `../../src/components/dashboard/GamificationWidget.tsx`
- **Logic**: `../../src/lib/dashboard/gamification.ts`
- **Types**: `../../src/types/gamification.ts`

## Questions?

Contact the development team or refer to the comprehensive testing report for detailed analysis of the gamification system architecture.
