# Manual Test Plan - Dashboard Chunk 2 (Spending Chart Widget)

**PR**: #57
**Feature**: 062-dashboard-chunk2-spending
**Date**: 2025-10-30
**Test URL**: http://localhost:5173

---

## Test 1: Verify Default Route Shows Dashboard ✅

**Purpose**: Confirm the pivot fix - Dashboard should show at `/` instead of BNPL Home

**Steps**:
1. Open http://localhost:5173 in browser
2. Observe what page loads

**Expected Result**:
- ✅ Dashboard page loads (title: "Dashboard")
- ✅ Heading shows "Your financial overview at a glance"
- ✅ 6 widget placeholders visible (Spending Chart + 5 placeholders)
- ❌ BNPL Home should NOT load

**Actual Result**:
- [ ] Dashboard loads correctly at `/`
- [ ] BNPL Home does NOT load at `/`

---

## Test 2: SpendingChartWidget - Empty State

**Purpose**: Verify empty state when no transactions exist

**Steps**:
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage → http://localhost:5173
3. Delete all `payplan_*` keys (clear localStorage)
4. Refresh page
5. Observe Spending Chart widget (top-left)

**Expected Result**:
- ✅ Widget shows "No spending data yet" message
- ✅ 📊 emoji icon visible
- ✅ "Add Transaction" button visible
- ✅ Widget has white background, shadow, rounded corners

**Actual Result**:
- [ ] Empty state displays correctly
- [ ] Button is visible and clickable

---

## Test 3: Navigation - EmptyState CTA

**Purpose**: Verify "Add Transaction" button navigates to Transactions page

**Steps**:
1. With empty state showing, click "Add Transaction" button
2. Observe URL change

**Expected Result**:
- ✅ URL changes to `/transactions`
- ✅ Transactions page loads
- ✅ No console errors

**Actual Result**:
- [ ] Navigation works correctly
- [ ] URL is `/transactions`
- [ ] No errors in console

---

## Test 4: SpendingChartWidget - With Sample Data

**Purpose**: Verify pie chart renders with real data

**Steps**:
1. Open browser DevTools (F12) → Console
2. Paste and run this code to create sample data:

```javascript
// Create categories
localStorage.setItem('payplan_categories_v1', JSON.stringify([
  {id: '1', name: 'Groceries', type: 'expense', color: '#10b981', budget: 500, isCustom: false, createdAt: new Date().toISOString()},
  {id: '2', name: 'Rent', type: 'expense', color: '#3b82f6', budget: 1200, isCustom: false, createdAt: new Date().toISOString()},
  {id: '3', name: 'Transportation', type: 'expense', color: '#f59e0b', budget: 200, isCustom: false, createdAt: new Date().toISOString()}
]));

// Create transactions for current month
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
localStorage.setItem('payplan_transactions_v1', JSON.stringify([
  {id: 't1', amount: 150, categoryId: '1', date: startOfMonth, description: 'Whole Foods', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't2', amount: 1200, categoryId: '2', date: startOfMonth, description: 'Rent payment', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't3', amount: 85, categoryId: '3', date: startOfMonth, description: 'Gas', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't4', amount: 200, categoryId: '1', date: startOfMonth, description: 'Costco', type: 'expense', createdAt: new Date().toISOString()}
]));

console.log('✅ Sample data created! Refresh the page.');
```

3. Refresh the page
4. Observe Spending Chart widget

**Expected Result**:
- ✅ Pie chart visible with 3 colored segments
- ✅ Groceries: $350 (24.4%) - Green segment
- ✅ Rent: $1200 (83.7%) - Blue segment
- ✅ Transportation: $85 (5.9%) - Orange segment
- ✅ Percentages shown on each segment
- ✅ Legend shows category names with colors
- ✅ Chart is responsive (fits container)

**Actual Result**:
- [ ] Pie chart renders correctly
- [ ] 3 segments visible with correct colors
- [ ] Percentages displayed on segments
- [ ] Legend shows all 3 categories
- [ ] Chart fills container width

---

## Test 5: Tooltip Interaction

**Purpose**: Verify custom tooltip shows on hover

**Steps**:
1. With sample data loaded, hover mouse over each pie segment
2. Observe tooltip

**Expected Result**:
- ✅ Tooltip appears on hover
- ✅ Shows: Category name, Amount ($X.XX), Percentage (XX.X%)
- ✅ Tooltip has white background, border, shadow
- ✅ Tooltip follows cursor

**Actual Result**:
- [ ] Tooltip displays on hover
- [ ] Tooltip shows all 3 data points
- [ ] Tooltip styling looks good

---

## Test 6: Accessibility - Screen Reader Alternative

**Purpose**: Verify hidden HTML table exists for screen readers

**Steps**:
1. With sample data loaded, open DevTools → Elements tab
2. Find the Spending Chart widget container
3. Look for `.sr-only` div with table inside

**Expected Result**:
- ✅ Table exists with class `sr-only` (screen-reader-only)
- ✅ Table has `<caption>`: "Spending breakdown by category for current month"
- ✅ Table has headers: Category, Amount, Percentage
- ✅ Table rows match pie chart data (3 rows)
- ✅ Table is visually hidden but accessible to screen readers

**Actual Result**:
- [ ] Hidden table exists
- [ ] Table structure is correct
- [ ] Data matches chart

---

## Test 7: Responsive Design

**Purpose**: Verify chart resizes properly

**Steps**:
1. With sample data loaded, open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different viewport sizes:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x667

**Expected Result**:
- ✅ Chart resizes smoothly
- ✅ Chart maintains aspect ratio
- ✅ Legend stays readable
- ✅ No horizontal scroll
- ✅ Widget stacks vertically on mobile

**Actual Result**:
- [ ] Desktop (1920x1080): ___________
- [ ] Tablet (768x1024): ___________
- [ ] Mobile (375x667): ___________

---

## Test 8: Console Errors Check

**Purpose**: Verify no errors in production build

**Steps**:
1. Open DevTools → Console
2. Navigate through all test scenarios above
3. Observe console for errors/warnings

**Expected Result**:
- ✅ No red errors
- ✅ No TypeScript warnings
- ✅ No React warnings
- ✅ No Recharts errors

**Actual Result**:
- [ ] Console is clean (no errors)
- [ ] Any warnings noted: ___________

---

## Test 9: Performance Check

**Purpose**: Verify chart renders quickly

**Steps**:
1. Open DevTools → Performance tab
2. Click Record
3. Refresh page
4. Stop recording after page loads
5. Look for "Render Dashboard" timing

**Expected Result**:
- ✅ Initial render <500ms (Phase 1 target)
- ✅ Chart renders without lag
- ✅ No performance warnings

**Actual Result**:
- [ ] Render time: ___________ ms
- [ ] Feels fast/responsive: Yes / No

---

## Test 10: BNPL Route Still Accessible

**Purpose**: Verify BNPL features weren't broken by pivot

**Steps**:
1. Navigate to http://localhost:5173/bnpl-home
2. Navigate to http://localhost:5173/bnpl

**Expected Result**:
- ✅ `/bnpl-home`: BNPL Home page loads
- ✅ `/bnpl`: BNPL Parser page loads
- ✅ No 404 errors
- ✅ Confirms "Free Core" principle (BNPL still free & accessible)

**Actual Result**:
- [ ] BNPL Home loads at `/bnpl-home`
- [ ] BNPL Parser loads at `/bnpl`

---

## Summary Checklist

After completing all tests above, verify:

- [ ] ✅ All 10 tests passed
- [ ] ✅ No CRITICAL or HIGH issues found
- [ ] ✅ Dashboard is default route (pivot complete)
- [ ] ✅ SpendingChartWidget works with empty + data states
- [ ] ✅ Navigation CTA works correctly
- [ ] ✅ Accessibility table exists
- [ ] ✅ No console errors
- [ ] ✅ BNPL routes still accessible

---

## Test Results

**Tested By**: ___________
**Date**: ___________
**Browser**: Chrome 142.0.7444.59
**OS**: Linux (WSL2)

**Overall Result**: ✅ PASS / ❌ FAIL

**Notes**:
-
-

---

**Next Steps After Manual Testing**:
1. If all tests pass → Approve PR #57
2. If issues found → Document in Linear, decide if blocking
3. Merge to `062-short-name-dashboard` feature branch
4. Proceed to Chunk 3 (Income vs Expenses chart)
