# ChatGPT Agent Mode Testing Prompt

Copy and paste this entire prompt into ChatGPT o1 (or GPT-4 with agent/browser mode):

---

**TASK**: Manual QA Testing for PayPlan Dashboard Chunk 2

You are a QA engineer testing a React dashboard feature. Use browser automation to verify the SpendingChartWidget works correctly.

## Context
- **Project**: PayPlan (budget app)
- **Feature**: Dashboard Chunk 2 - Spending Chart Widget
- **PR**: #57
- **Test URL**: https://frontend-git-062-dashboar-11bdf8-matthew-utts-projects-89452c41.vercel.app
- **Goal**: Verify the pivot from BNPL to budget-first is working + chart renders correctly

## Your Tools
You have access to:
- Browser automation (Selenium/Puppeteer-like capabilities)
- localStorage manipulation
- Screenshot capture
- Console log inspection
- DOM inspection

## Test Scenarios

### Test 1: Default Route Verification
1. Navigate to <https://frontend-git-062-dashboar-11bdf8-matthew-utts-projects-89452c41.vercel.app>
2. Take screenshot
3. Verify page shows:
   - Heading: "Dashboard"
   - Subheading: "Your financial overview at a glance"
   - 6 widgets visible (1 real chart + 5 placeholders)
4. **Expected**: Dashboard loads (NOT BNPL Home page)

### Test 2: Empty State Test
1. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Refresh page
3. Take screenshot of Spending Chart widget (top-left)
4. Verify:
   - Shows "No spending data yet"
   - 📊 emoji visible
   - "Add Transaction" button visible

### Test 3: Navigation Test
1. Click "Add Transaction" button
2. Verify URL changes to `/transactions`
3. Take screenshot
4. **Expected**: Transactions page loads, no console errors

### Test 4: Chart Rendering with Data
1. Execute this JavaScript in browser console:
```javascript
// Create categories
localStorage.setItem('payplan_categories_v1', JSON.stringify([
  {id: '1', name: 'Groceries', type: 'expense', color: '#10b981', budget: 500, isCustom: false, createdAt: new Date().toISOString()},
  {id: '2', name: 'Rent', type: 'expense', color: '#3b82f6', budget: 1200, isCustom: false, createdAt: new Date().toISOString()},
  {id: '3', name: 'Transportation', type: 'expense', color: '#f59e0b', budget: 200, isCustom: false, createdAt: new Date().toISOString()}
]));

// Create transactions
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
localStorage.setItem('payplan_transactions_v1', JSON.stringify([
  {id: 't1', amount: 150, categoryId: '1', date: startOfMonth, description: 'Whole Foods', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't2', amount: 1200, categoryId: '2', date: startOfMonth, description: 'Rent payment', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't3', amount: 85, categoryId: '3', date: startOfMonth, description: 'Gas', type: 'expense', createdAt: new Date().toISOString()},
  {id: 't4', amount: 200, categoryId: '1', date: startOfMonth, description: 'Costco', type: 'expense', createdAt: new Date().toISOString()}
]));
```

2. Refresh page
3. Take screenshot of Spending Chart
4. Verify:
   - Pie chart visible with 3 colored segments
   - Groceries: ~$350 (green)
   - Rent: ~$1200 (blue)
   - Transportation: ~$85 (orange)
   - Percentages shown on segments
   - Legend shows category names

### Test 5: Accessibility Verification
1. Inspect DOM for `.sr-only` element
2. Verify hidden table exists with:
   - Caption: "Spending breakdown by category for current month"
   - Headers: Category, Amount, Percentage
   - 3 data rows matching chart
3. Take screenshot of DOM inspector showing table

### Test 6: Console Errors Check
1. Open browser console
2. Navigate through all tests above
3. Report any errors or warnings
4. **Expected**: No red errors, no React warnings

### Test 7: BNPL Routes Verification

1. Navigate to the Vercel URL + `/bnpl-home`
2. Take screenshot
3. Verify BNPL Home page loads (confirms "Free Core" principle)
4. Navigate to the Vercel URL + `/bnpl`
5. Verify BNPL Parser page loads

## Output Format

Provide results in this format:

```markdown
# PayPlan Dashboard Chunk 2 - Test Results

**Tested By**: ChatGPT Agent Mode
**Date**: [current date]
**Browser**: [your browser]

## Test Results

### Test 1: Default Route ✅/❌
- Dashboard loads: ✅/❌
- Screenshot: [attach]
- Notes:

### Test 2: Empty State ✅/❌
- Empty state displays: ✅/❌
- Screenshot: [attach]
- Notes:

### Test 3: Navigation ✅/❌
- CTA button works: ✅/❌
- URL changes correctly: ✅/❌
- Screenshot: [attach]
- Notes:

### Test 4: Chart Rendering ✅/❌
- Pie chart visible: ✅/❌
- 3 segments correct: ✅/❌
- Percentages shown: ✅/❌
- Legend correct: ✅/❌
- Screenshot: [attach]
- Notes:

### Test 5: Accessibility ✅/❌
- Hidden table exists: ✅/❌
- Table structure correct: ✅/❌
- Screenshot: [attach]
- Notes:

### Test 6: Console Errors ✅/❌
- No errors: ✅/❌
- Errors found: [list any]

### Test 7: BNPL Routes ✅/❌
- /bnpl-home works: ✅/❌
- /bnpl works: ✅/❌
- Screenshot: [attach]

## Summary
- **Overall Result**: ✅ PASS / ❌ FAIL
- **Critical Issues**: [list any]
- **Recommendation**: APPROVE PR / REQUEST CHANGES

## Screenshots
[Attach all screenshots here]
```

## Important Notes

- Use the Vercel preview URL provided above
- Take screenshots for EVERY test
- Report ALL console errors (even warnings)
- Verify chart has correct colors (green, blue, orange)
- Confirm percentages add up to ~100%

## Success Criteria

All tests must pass with:
- ✅ Dashboard shows at default route
- ✅ Empty state works
- ✅ Chart renders with correct data
- ✅ Accessibility table exists
- ✅ No console errors
- ✅ BNPL routes still accessible

Begin testing now. Report results with screenshots.
