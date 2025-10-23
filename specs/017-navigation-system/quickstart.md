# Quickstart: Navigation & Discovery System Testing

**Feature**: 017-navigation-system
**Date**: 2025-10-22
**Purpose**: Manual test scenarios for QA and acceptance testing

---

## Prerequisites

- PayPlan application running locally (`npm run dev`)
- Browser: Chrome, Firefox, or Safari (latest version)
- Mobile device or browser DevTools device emulation
- Screen reader (optional): NVDA (Windows) or VoiceOver (Mac)
- Keyboard-only navigation capability

---

## Test Scenario 1: Desktop Navigation - Basic Functionality

**Priority**: P1 (Critical)
**Estimated Time**: 3 minutes

### Setup
1. Open PayPlan in desktop browser (width >= 768px)
2. Navigate to home page (`http://localhost:5173`)

### Test Steps

**Step 1.1 - Navigation Header Visible**
1. Look at the top of the page
2. **Expected**: Navigation header with "Home", "Archives", "Settings" links visible

**Step 1.2 - Navigate to Archives**
1. Click "Archives" link in navigation
2. **Expected**:
   - URL changes to `/archives`
   - Archives list page displays
   - "Archives" link in navigation is highlighted/bold
   - Navigation header still visible at top

**Step 1.3 - Navigate to Settings**
1. Click "Settings" link in navigation
2. **Expected**:
   - URL changes to `/settings/preferences`
   - Settings page displays
   - "Settings" link in navigation is highlighted
   - Navigation header still visible

**Step 1.4 - Return Home**
1. Click "Home" link in navigation
2. **Expected**:
   - URL changes to `/`
   - Home page displays
   - "Home" link in navigation is highlighted

### Pass Criteria
- ✅ All navigation links visible
- ✅ Active link highlighted on each page
- ✅ Navigation persists across page changes (doesn't re-mount/flicker)
- ✅ Route changes occur in <200ms (feels instant)

---

## Test Scenario 2: Mobile Navigation - Hamburger Menu

**Priority**: P1 (Critical)
**Estimated Time**: 5 minutes

### Setup
1. Open PayPlan in mobile viewport (width < 768px)
   - Chrome DevTools: Toggle device toolbar (Ctrl+Shift+M)
   - Select "iPhone 12 Pro" or "Samsung Galaxy S20"
2. Navigate to home page

### Test Steps

**Step 2.1 - Hamburger Button Visible**
1. Look at top of page
2. **Expected**: Hamburger menu icon (☰) visible in header
3. **Expected**: Desktop navigation links NOT visible

**Step 2.2 - Open Mobile Menu**
1. Tap/click hamburger button
2. **Expected**:
   - Drawer slides in from left within 300ms
   - Navigation items appear: Home, Archives, Settings
   - Backdrop overlay appears (darkens page)
   - Page content no longer scrollable

**Step 2.3 - Navigate via Mobile Menu**
1. Tap "Archives" link in drawer
2. **Expected**:
   - Drawer automatically closes
   - URL changes to `/archives`
   - Archives page displays
   - Menu drawer slides out within 300ms

**Step 2.4 - Close Menu with Close Button**
1. Tap hamburger button to open menu again
2. Tap close button (×) in drawer
3. **Expected**:
   - Drawer closes
   - Backdrop disappears
   - Page content scrollable again

**Step 2.5 - Close Menu with Backdrop**
1. Open menu again
2. Tap/click backdrop area (outside drawer)
3. **Expected**: Drawer closes

**Step 2.6 - Close Menu with ESC Key** (Desktop/tablet with keyboard)
1. Open menu again
2. Press ESC key
3. **Expected**: Drawer closes

### Pass Criteria
- ✅ Hamburger button visible on mobile
- ✅ Drawer opens/closes smoothly (<300ms animation)
- ✅ Auto-closes on navigation
- ✅ Closes via close button, backdrop, and ESC key
- ✅ Body scroll disabled when drawer open

---

## Test Scenario 3: Breadcrumb Navigation

**Priority**: P3 (Nice-to-have)
**Estimated Time**: 3 minutes

### Setup
1. Open PayPlan in any viewport size
2. Navigate to home page

### Test Steps

**Step 3.1 - No Breadcrumbs on Home**
1. Verify you're on home page (`/`)
2. **Expected**: No breadcrumbs displayed

**Step 3.2 - Breadcrumbs on Archives List**
1. Navigate to Archives page (`/archives`)
2. **Expected**: Breadcrumbs display "Home > Archives"
3. "Home" is clickable link
4. "Archives" is NOT clickable (current page)

**Step 3.3 - Breadcrumbs on Archive Detail**
1. Click any archive in the list
2. **Expected**: URL changes to `/archives/:id`
3. **Expected**: Breadcrumbs display "Home > Archives > [Archive Name]"
4. "Home" and "Archives" are clickable links
5. Archive name is NOT clickable (current page)

**Step 3.4 - Navigate via Breadcrumbs**
1. On archive detail page, click "Archives" breadcrumb
2. **Expected**: Returns to `/archives` page
3. Click "Home" breadcrumb
4. **Expected**: Returns to `/` home page

**Step 3.5 - Long Archive Names**
1. Create or view an archive with long name (>50 characters)
2. **Expected**: Breadcrumb label truncated with ellipsis (...)
3. Hover over truncated breadcrumb
4. **Expected**: Tooltip shows full archive name

### Pass Criteria
- ✅ Breadcrumbs appear only on nested pages
- ✅ Current page not clickable in breadcrumbs
- ✅ Breadcrumb navigation works correctly
- ✅ Long names truncated with hover tooltip

---

## Test Scenario 4: Keyboard Accessibility

**Priority**: P1 (Critical - WCAG Requirement)
**Estimated Time**: 4 minutes

### Setup
1. Open PayPlan in desktop browser
2. Navigate to home page
3. **DO NOT use mouse** - keyboard only

### Test Steps

**Step 4.1 - Skip Link**
1. Press Tab key once (first focusable element)
2. **Expected**: "Skip to main content" link visible with focus outline
3. Press Enter
4. **Expected**: Focus jumps to main content area (bypasses navigation)

**Step 4.2 - Tab Through Navigation**
1. Reload page
2. Press Tab twice (skip link, then first nav item)
3. **Expected**: "Home" link focused with visible outline
4. Press Tab again
5. **Expected**: "Archives" link focused
6. Press Tab again
7. **Expected**: "Settings" link focused

**Step 4.3 - Activate Link with Enter**
1. Tab to "Archives" link
2. Press Enter
3. **Expected**: Navigate to `/archives` page

**Step 4.4 - Mobile Menu Keyboard Navigation**
1. Resize viewport to mobile (<768px) or use mobile device with keyboard
2. Tab to hamburger button
3. Press Enter
4. **Expected**: Mobile menu opens, focus moves to close button
5. Press Tab
6. **Expected**: Focus moves to first nav item (Home)
7. Keep pressing Tab
8. **Expected**: Focus cycles through all nav items and wraps back to close button (focus trapped)
9. Press ESC
10. **Expected**: Menu closes, focus returns to hamburger button

### Pass Criteria
- ✅ Skip link functional
- ✅ All navigation items keyboard accessible
- ✅ Visible focus indicators on all elements
- ✅ Enter key activates links
- ✅ Mobile menu focus trapped when open
- ✅ ESC closes mobile menu
- ✅ Focus returns to trigger after menu closes

---

## Test Scenario 5: Screen Reader Accessibility (Optional)

**Priority**: P2 (Important)
**Estimated Time**: 5 minutes
**Tools**: NVDA (Windows) or VoiceOver (Mac)

### Setup
1. Open PayPlan in browser
2. Start screen reader (NVDA: Ctrl+Alt+N, VoiceOver: Cmd+F5)

### Test Steps

**Step 5.1 - Navigation Landmark**
1. Navigate by landmarks (NVDA: D key, VoiceOver: Rotor > Landmarks)
2. **Expected**: Screen reader announces "Main navigation, navigation"

**Step 5.2 - Active Link Indication**
1. Navigate to Archives page
2. Use arrow keys to navigate through nav links
3. **Expected**: When on Archives link, screen reader announces "Archives, link, current page"

**Step 5.3 - Mobile Menu Dialog**
1. Resize to mobile viewport
2. Activate hamburger button
3. **Expected**: Screen reader announces "Navigation menu, dialog"
4. **Expected**: Announces "Close menu, button" (focus on close button)

**Step 5.4 - Breadcrumbs**
1. Navigate to archive detail page
2. Find breadcrumbs (navigate by landmarks)
3. **Expected**: Screen reader announces "Breadcrumb, navigation"
4. Navigate through breadcrumbs
5. **Expected**: Current page announced with "current page" indicator

### Pass Criteria
- ✅ Navigation landmarks announced correctly
- ✅ Active link identified with "current page"
- ✅ Mobile menu dialog semantics correct
- ✅ Breadcrumb navigation accessible
- ✅ No missing or incorrect ARIA labels

---

## Test Scenario 6: Archive Creation Integration

**Priority**: P2 (Important)
**Estimated Time**: 3 minutes

### Setup
1. Open PayPlan
2. Navigate to home page
3. Import payment data (if not already imported)

### Test Steps

**Step 6.1 - Create Archive Button Visible**
1. Scroll to payment results section
2. **Expected**: "Create Archive" button visible near results

**Step 6.2 - Open Archive Dialog**
1. Click "Create Archive" button
2. **Expected**: Dialog opens with archive name input and date

**Step 6.3 - Save Archive**
1. Enter archive name: "Test Archive October 2025"
2. Click "Save" or "Create"
3. **Expected**: Success message appears
4. **Expected**: Dialog closes

**Step 6.4 - Verify in Archives List**
1. Click "Archives" in navigation
2. **Expected**: Navigate to `/archives` page
3. **Expected**: "Test Archive October 2025" appears in archives list
4. **Expected**: Payment statuses in main view remain unchanged (snapshot behavior)

**Step 6.5 - View Archive Detail**
1. Click the created archive
2. **Expected**: Navigate to archive detail page
3. **Expected**: Breadcrumbs display "Home > Archives > Test Archive October 2025"

### Pass Criteria
- ✅ Create Archive button visible on payment results
- ✅ Dialog integration functional
- ✅ Archive appears in list after creation
- ✅ Payment data saved as snapshot (not cleared)
- ✅ Archive detail accessible via Archives page

---

## Test Scenario 7: Responsive Design

**Priority**: P1 (Critical)
**Estimated Time**: 3 minutes

### Setup
1. Open PayPlan in browser with DevTools open

### Test Steps

**Step 7.1 - Test Breakpoints**
1. Set viewport to 1920px width (desktop)
   - **Expected**: Full horizontal navigation visible
2. Set viewport to 768px width (tablet)
   - **Expected**: Navigation still visible OR hamburger appears
3. Set viewport to 375px width (mobile - iPhone)
   - **Expected**: Hamburger menu visible
4. Set viewport to 320px width (small mobile)
   - **Expected**: Layout still functional, no horizontal scroll
   - **Expected**: Touch targets still 44x44px minimum

**Step 7.2 - Orientation Changes**
1. Set mobile viewport (375x667)
2. Rotate to landscape (667x375)
3. **Expected**: Navigation adapts correctly
4. **Expected**: Mobile menu still functional

### Pass Criteria
- ✅ Desktop nav on large screens (>=768px)
- ✅ Mobile nav on small screens (<768px)
- ✅ Minimum width 320px supported
- ✅ Touch targets 44x44px on all viewports
- ✅ No horizontal scroll at any breakpoint

---

## Test Scenario 8: Performance

**Priority**: P2 (Important)
**Estimated Time**: 2 minutes

### Setup
1. Open PayPlan
2. Open browser DevTools > Performance tab

### Test Steps

**Step 8.1 - Route Change Performance**
1. Start performance recording
2. Click "Archives" in navigation
3. Stop recording when page fully loaded
4. **Expected**: Route change completes in <200ms (SC-007)

**Step 8.2 - Mobile Menu Animation Performance**
1. Resize to mobile viewport
2. Start performance recording
3. Open mobile menu (tap hamburger)
4. Close mobile menu (tap backdrop)
5. Stop recording
6. **Expected**: Open animation <300ms (SC-008)
7. **Expected**: Close animation <300ms

**Step 8.3 - Navigation Persistence (No Re-mount)**
1. Open DevTools > React DevTools
2. Navigate between Home, Archives, Settings
3. Watch NavigationHeader component
4. **Expected**: Component NOT re-mounting (no unmount/mount cycle)
5. **Expected**: Only props/state updates

### Pass Criteria
- ✅ Route changes <200ms
- ✅ Menu animations <300ms
- ✅ Navigation header doesn't re-mount
- ✅ Smooth 60fps animations (no jank)

---

## Test Scenario 9: Edge Cases

**Priority**: P3 (Nice-to-have)
**Estimated Time**: 3 minutes

### Test Steps

**Step 9.1 - Direct URL Navigation**
1. Manually type `/archives` in address bar
2. **Expected**: Archives page loads with "Archives" link highlighted in nav

**Step 9.2 - Browser Back/Forward**
1. Navigate Home → Archives → Settings
2. Click browser back button
3. **Expected**: Returns to Archives, nav highlights "Archives"
4. Click browser forward button
5. **Expected**: Returns to Settings, nav highlights "Settings"

**Step 9.3 - Unknown Route**
1. Navigate to `/unknown-route`
2. **Expected**: 404 page displays OR redirects to home
3. **Expected**: Navigation header still visible

**Step 9.4 - Rapid Navigation Clicks**
1. Rapidly click different nav items (Home → Archives → Settings → Home)
2. **Expected**: All route changes occur correctly
3. **Expected**: No console errors
4. **Expected**: Active state updates correctly

**Step 9.5 - Mobile Menu Spam**
1. Mobile viewport: rapidly open/close menu 10 times
2. **Expected**: No visual glitches
3. **Expected**: Focus management still works
4. **Expected**: No console errors

### Pass Criteria
- ✅ Direct URLs work correctly
- ✅ Browser history navigation functional
- ✅ Unknown routes handled gracefully
- ✅ Rapid interactions don't break UI
- ✅ No console errors in any scenario

---

## Acceptance Checklist

Use this checklist to verify all user stories from spec.md are satisfied:

### User Story 1 - Navigate Between Features (P1)

- [ ] **AS-1.1**: Navigation header visible on all pages
- [ ] **AS-1.2**: Clicking "Archives" navigates to `/archives` route
- [ ] **AS-1.3**: Active link highlighted on Archives page
- [ ] **AS-1.4**: Mobile menu slides out on tap
- [ ] **AS-1.5**: Keyboard Tab navigates through all menu items

### User Story 2 - Create Archive from Results (P2)

- [ ] **AS-2.1**: "Create Archive" button visible on payment results
- [ ] **AS-2.2**: Dialog opens with name input and current date
- [ ] **AS-2.3**: Success feedback shown, payment statuses unchanged
- [ ] **AS-2.4**: New archive appears in Archives page list

### User Story 3 - Breadcrumbs (P3)

- [ ] **AS-3.1**: Breadcrumbs visible on archive detail page
- [ ] **AS-3.2**: Clicking "Archives" breadcrumb returns to list
- [ ] **AS-3.3**: Clicking "Home" breadcrumb returns to home

### Functional Requirements

- [ ] **FR-001**: Persistent navigation header on all pages
- [ ] **FR-002**: Links to Home, Archives, Settings visible
- [ ] **FR-003**: Active page visually indicated
- [ ] **FR-004**: Create Archive button on payment results (snapshot only)
- [ ] **FR-005**: Keyboard accessible (Tab, Enter, ESC)
- [ ] **FR-006**: Breadcrumbs on nested pages
- [ ] **FR-007**: 44x44px touch targets on mobile
- [ ] **FR-008**: Uses React Router 7.9.3 existing routes

### Success Criteria

- [ ] **SC-001**: 100% of pages accessible via navigation
- [ ] **SC-006**: Mobile nav works on screens ≥320px
- [ ] **SC-007**: Route navigation <200ms
- [ ] **SC-008**: Menu animations <300ms

### Accessibility (WCAG 2.1 AA)

- [ ] Skip link present and functional
- [ ] Landmark roles on navigation elements
- [ ] `aria-current="page"` on active links
- [ ] Visible focus indicators (4.5:1 contrast)
- [ ] Keyboard navigation fully functional
- [ ] Focus trap in mobile menu
- [ ] ESC key closes mobile menu
- [ ] Focus returns to trigger after menu closes
- [ ] Minimum 44x44px touch targets
- [ ] Screen reader announces navigation correctly

---

## Troubleshooting

### Navigation Not Appearing

**Symptom**: Navigation header not visible on any page

**Checks**:
1. Verify NavigationHeader added to App.tsx above <Routes>
2. Check browser console for errors
3. Verify component imported correctly
4. Check CSS display property not set to `display: none`

### Active State Not Working

**Symptom**: Clicked link not highlighted

**Checks**:
1. Verify using NavLink (not Link) component
2. Check className function receiving `isActive` prop
3. Verify styles applied to `.nav-link-active` class
4. Check React Router location updating correctly

### Mobile Menu Not Closing

**Symptom**: Drawer stays open after clicking link

**Checks**:
1. Verify `onClose` callback prop passed to MobileMenu
2. Check NavLink onClick handler calls onClose
3. Verify state update in useNavigationState hook
4. Check for JavaScript errors in console

### Performance Issues

**Symptom**: Route changes feel slow

**Checks**:
1. Open DevTools Performance tab, record navigation
2. Check for expensive re-renders (React DevTools Profiler)
3. Verify NavigationHeader wrapped with React.memo()
4. Check for blocking network requests

### Focus Not Returning

**Symptom**: Focus lost after closing mobile menu

**Checks**:
1. Verify triggerElement stored in state when menu opens
2. Check focus() called on triggerElement when menu closes
3. Ensure triggerElement not removed from DOM
4. Test with different browsers (focus behavior varies)

---

## Test Results Template

**Tester**: _______________
**Date**: _______________
**Browser**: _______________
**Viewport**: Desktop / Mobile / Tablet

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Desktop Navigation | ☐ Pass ☐ Fail | |
| 2. Mobile Menu | ☐ Pass ☐ Fail | |
| 3. Breadcrumbs | ☐ Pass ☐ Fail | |
| 4. Keyboard Accessibility | ☐ Pass ☐ Fail | |
| 5. Screen Reader | ☐ Pass ☐ Fail ☐ Skipped | |
| 6. Archive Integration | ☐ Pass ☐ Fail | |
| 7. Responsive Design | ☐ Pass ☐ Fail | |
| 8. Performance | ☐ Pass ☐ Fail | |
| 9. Edge Cases | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ Pass ☐ Fail

**Critical Issues**:
- _______________________
- _______________________

**Minor Issues**:
- _______________________
- _______________________

---

**Last Updated**: 2025-10-22
**Status**: ✅ Ready for QA
