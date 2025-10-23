# Cross-Browser Testing Guide - Feature 017

**Feature**: Navigation & Discovery System
**Task**: T047
**Last Updated**: 2025-10-23
**Standard**: Feature 017 requirements (FR-001 through FR-008, SC-006 through SC-008)

---

## Testing Matrix

Test navigation system across all major browsers to ensure consistent behavior and identify browser-specific issues.

### Required Test Environments

| Browser | Desktop Version | Mobile/Responsive | Priority |
|---------|----------------|-------------------|----------|
| Google Chrome | Latest stable | DevTools responsive mode + Android | **P0** (Primary target) |
| Mozilla Firefox | Latest stable | DevTools responsive mode | **P1** |
| Safari | Latest stable (macOS) | iOS Safari (real device recommended) | **P1** |
| Microsoft Edge | Latest stable | DevTools responsive mode | **P2** |

### Viewport Sizes to Test

| Device Class | Width | Height | Notes |
|--------------|-------|--------|-------|
| Mobile Small | 320px | 568px | SC-006 minimum (iPhone SE) |
| Mobile Medium | 375px | 667px | iPhone 8/SE 2020 |
| Mobile Large | 414px | 896px | iPhone 11 Pro Max |
| Tablet | 768px | 1024px | Breakpoint boundary |
| Desktop Small | 1024px | 768px | Minimum desktop |
| Desktop Large | 1920px | 1080px | Standard HD |

---

## Test Scenarios

### Scenario 1: Desktop Navigation (≥768px)

**Test on**: Chrome, Firefox, Safari, Edge @ 1024px+ width

**Steps**:
1. Load http://localhost:5173
2. Verify navigation header visible at top
3. Verify all 3 links visible (Home, Archives, Settings)
4. Click "Archives" → verify navigation to /archives
5. Verify "Archives" link has active state styling
6. Click "Home" → verify return to /
7. Press Tab → verify focus moves through skip link, then nav links
8. Verify focus indicators visible on all links
9. Press Enter on focused link → verify navigation

**Expected Results**:
- ✅ Navigation header visible and properly styled
- ✅ All links accessible and clickable
- ✅ Active state clearly indicated
- ✅ Keyboard navigation works (Tab, Enter)
- ✅ No hamburger menu icon visible

**Document Issues**:
- [ ] Chrome:
- [ ] Firefox:
- [ ] Safari:
- [ ] Edge:

---

### Scenario 2: Mobile Navigation (<768px)

**Test on**: All browsers @ 375px width (mobile viewport)

**Steps**:
1. Resize browser to 375px x 667px (or use DevTools responsive mode)
2. Verify hamburger menu icon visible (☰)
3. Verify navigation links hidden
4. Click hamburger icon → verify drawer slides in from left
5. Verify animation smooth and <300ms (SC-008)
6. Verify drawer has backdrop overlay
7. Click backdrop → verify menu closes
8. Re-open menu, press ESC key → verify menu closes
9. Re-open menu, click a link → verify menu auto-closes
10. Verify body scroll locked when menu open

**Expected Results**:
- ✅ Hamburger icon ≥44x44px touch target
- ✅ Drawer slides smoothly from left
- ✅ Animation completes in <300ms
- ✅ ESC key closes menu
- ✅ Backdrop click closes menu
- ✅ Auto-closes on navigation
- ✅ Focus trap works (Tab stays within menu)

**Document Issues**:
- [ ] Chrome (mobile):
- [ ] Firefox (mobile):
- [ ] Safari iOS (if available):
- [ ] Edge (mobile):

---

### Scenario 3: Breadcrumb Navigation

**Test on**: All browsers @ desktop and mobile viewports

**Steps**:
1. Navigate to /archives
2. Verify breadcrumbs: "Home > Archives"
3. Click any archive in list → navigate to detail page
4. Verify breadcrumbs: "Home > Archives > [Archive Name]"
5. Click "Archives" breadcrumb → verify return to /archives
6. Click "Home" breadcrumb → verify return to /
7. Test with long archive name (>50 chars) → verify truncation with "..."
8. Hover over truncated name → verify Radix UI Tooltip appears
9. Verify tooltip has smooth animation and arrow pointer

**Expected Results**:
- ✅ Breadcrumbs render correctly on all pages
- ✅ Links navigate to correct routes
- ✅ Current page not clickable (aria-current="page")
- ✅ Truncation works for long names
- ✅ Tooltip displays full name on hover
- ✅ Tooltip has proper styling and positioning

**Document Issues**:
- [ ] Chrome:
- [ ] Firefox:
- [ ] Safari:
- [ ] Edge:

---

### Scenario 4: Create Archive Button (User Story 2)

**Test on**: All browsers @ desktop and mobile viewports

**Steps**:
1. Import payment data on home page
2. Scroll to payment results section
3. Verify "Create Archive" button visible
4. Verify button ≥44x44px on mobile
5. Click button → verify CreateArchiveDialog opens
6. Verify dialog properly centered and styled
7. Enter archive name "Test Archive"
8. Click "Save" → verify success feedback
9. Navigate to /archives → verify "Test Archive" in list
10. Return to home → verify payment statuses unchanged

**Expected Results**:
- ✅ Button visible and properly styled
- ✅ Dialog opens and closes correctly
- ✅ Archive creation works
- ✅ Payment statuses preserved (snapshot behavior)

**Document Issues**:
- [ ] Chrome:
- [ ] Firefox:
- [ ] Safari:
- [ ] Edge:

---

### Scenario 5: Performance Testing (SC-007, SC-008)

**Test on**: Chrome DevTools Performance tab (all browsers if time permits)

**Steps**:
1. Open DevTools → Performance tab
2. Start recording
3. Click navigation link (e.g., Home → Archives)
4. Stop recording
5. Check route navigation time (should be <200ms)
6. Repeat for mobile menu:
   - Record hamburger click → drawer open
   - Measure animation time (should be <300ms)

**Expected Results**:
- ✅ Route navigation <200ms (SC-007)
- ✅ Menu animations <300ms (SC-008)
- ✅ Console logs in dev mode show timings

**Performance Measurements**:
- [ ] Chrome - Route navigation: ___ms | Menu animation: ___ms
- [ ] Firefox - Route navigation: ___ms | Menu animation: ___ms
- [ ] Safari - Route navigation: ___ms | Menu animation: ___ms

---

## Known Issues & Browser-Specific Workarounds

### Chrome
- **Issue**: None known
- **Workaround**: N/A

### Firefox
- **Issue**: None known
- **Workaround**: N/A

### Safari
- **Potential Issue**: Focus trap may behave differently with react-focus-lock
- **Test Carefully**: ESC key handler, focus return after menu close
- **Workaround**: If issues found, consider native focus management

### Edge
- **Issue**: None known (Chromium-based, should match Chrome)
- **Workaround**: N/A

---

## Automated Cross-Browser Test Script (Optional)

If Playwright is available, use this script to automate basic smoke tests:

\`\`\`bash
#!/bin/bash
# scripts/cross-browser-test.sh

# Run Playwright tests across browsers
npx playwright test --project=chromium --project=firefox --project=webkit

# Or use Playwright codegen to generate tests
npx playwright codegen http://localhost:5173
\`\`\`

**Playwright Test Example**:
\`\`\`typescript
// tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation - Cross Browser', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify navigation header
    await expect(page.locator('header nav')).toBeVisible();

    // Click Archives link
    await page.click('text=Archives');
    await expect(page).toHaveURL('/archives');

    // Verify active state
    const activeLink = page.locator('[aria-current="page"]');
    await expect(activeLink).toHaveText('Archives');
  });

  test('should open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');

    // Click hamburger
    const hamburger = page.locator('[aria-label*="menu"]');
    await hamburger.click();

    // Verify drawer visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
\`\`\`

---

## Test Results Template

### Date: [FILL IN]
### Tester: [FILL IN]

| Browser | Version | Desktop Pass? | Mobile Pass? | Issues Found | Severity |
|---------|---------|---------------|--------------|--------------|----------|
| Chrome | | [ ] Yes [ ] No | [ ] Yes [ ] No | | |
| Firefox | | [ ] Yes [ ] No | [ ] Yes [ ] No | | |
| Safari | | [ ] Yes [ ] No | [ ] Yes [ ] No | | |
| Edge | | [ ] Yes [ ] No | [ ] Yes [ ] No | | |

**Overall Pass Rate**: ___/4 browsers

**Critical Issues**: [NONE / List]

**Recommended Actions**: [NONE / List fixes needed]

---

## Acceptance Criteria

All scenarios must pass in:
- ✅ Chrome (desktop + mobile responsive mode)
- ✅ Firefox (desktop + mobile responsive mode)
- ✅ Safari (desktop + iOS if available)
- ⚠️ Edge (desktop + mobile responsive mode) - Nice to have

**Minimum for Production**: Chrome + Firefox passing with 0 critical issues

---

## Appendix: Browser Testing Tools

### DevTools Responsive Mode

**Chrome/Edge**:
- Press F12 → Click device icon (⌘+Shift+M on Mac)
- Select device: iPhone SE, iPhone 12 Pro, iPad, etc.
- Test touch events with mouse

**Firefox**:
- Press F12 → Click responsive design mode icon (⌘+Option+M on Mac)
- Select viewport size
- Toggle touch simulation

**Safari**:
- Develop menu → Enter Responsive Design Mode
- Requires enabling Develop menu in Preferences

### Real Device Testing

**iOS**:
- Connect iPhone/iPad to Mac
- Safari → Develop → [Device Name] → localhost:5173
- Test actual touch interactions

**Android**:
- Enable USB debugging
- Chrome → chrome://inspect → Inspect device
- Test on real hardware

---

## Notes

- **Automated tests catch regressions** - Use vitest tests in CI/CD
- **Manual browser testing validates real UX** - Do before major releases
- **Focus on critical flows** - Navigation, mobile menu, breadcrumbs
- **Document browser-specific CSS fixes** - If workarounds needed, add them to this guide

**T047 Status**: Guide complete, manual testing required

**Next Steps**: Execute test scenarios and fill in results template
