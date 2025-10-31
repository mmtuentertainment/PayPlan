# Accessibility Testing: Dashboard with Charts

**Feature**: Dashboard with Charts (062-short-name-dashboard)
**WCAG Level**: 2.1 Level AA
**Test Date**: _____________
**Tester**: _____________

---

## Overview

This checklist verifies WCAG 2.1 Level AA compliance for the PayPlan Dashboard. All items MUST pass before marking feature as production-ready.

**Tools Required**:
- Screen reader: NVDA (Windows) or VoiceOver (Mac)
- Browser: Latest Chrome or Firefox
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Keyboard only (no mouse)

---

## 1. Keyboard Navigation (WCAG 2.1.1, 2.1.3)

### 1.1 Tab Order
- [ ] Tab through all 6 widgets (focus visible on each)
- [ ] Focus order is logical: top-to-bottom, left-to-right (reading order)
- [ ] Shift+Tab navigates backward correctly
- [ ] No keyboard traps (can Tab out of all elements)

### 1.2 Interactive Elements
- [ ] Spending chart: Arrow keys navigate chart segments (if interactive)
- [ ] Income chart: Arrow keys navigate bars (if interactive)
- [ ] Recent transactions: Enter/Space activates transaction links
- [ ] Upcoming bills: Enter/Space activates bill links
- [ ] Goal progress: Enter/Space activates goal links
- [ ] Gamification: CTA button activates with Enter/Space

### 1.3 Focus Indicators
- [ ] All interactive elements have visible focus indicator (2px outline minimum)
- [ ] Focus indicator has 3:1 contrast ratio with background
- [ ] Focus indicator visible on all widgets
- [ ] Focus indicator not obscured by other elements

### 1.4 Skip Links
- [ ] "Skip to main content" link available at top of page
- [ ] Skip link becomes visible on focus
- [ ] Skip link jumps to main dashboard content

---

## 2. Screen Reader Compatibility (WCAG 1.1.1, 1.3.1, 4.1.2)

### 2.1 Spending Chart Widget
- [ ] Widget heading announced: "Spending by Category"
- [ ] Chart data accessible via hidden data table
- [ ] Screen reader reads category names and amounts
- [ ] Chart segments have descriptive labels
- [ ] Empty state announced: "No spending data yet"

### 2.2 Income vs Expenses Chart Widget
- [ ] Widget heading announced: "Income vs. Expenses"
- [ ] Chart data accessible via hidden data table
- [ ] Screen reader reads month names and values
- [ ] Bar values announced correctly
- [ ] Empty state announced: "No income/expense data yet"

### 2.3 Recent Transactions Widget
- [ ] Widget heading announced: "Recent Transactions"
- [ ] Transaction details read in logical order: date, description, amount
- [ ] Screen reader announces transaction count: "5 transactions"
- [ ] Empty state announced: "No recent transactions"

### 2.4 Upcoming Bills Widget
- [ ] Widget heading announced: "Upcoming Bills"
- [ ] Bill details read in logical order: name, due date, amount
- [ ] Urgency level announced: "Due in 2 days - urgent"
- [ ] Screen reader announces bill count
- [ ] Empty state announced: "No upcoming bills"

### 2.5 Goal Progress Widget
- [ ] Widget heading announced: "Goal Progress"
- [ ] Goal details read: name, progress percentage, target
- [ ] Progress bar has aria-valuenow, aria-valuemin, aria-valuemax
- [ ] Screen reader announces percentage: "50% complete"
- [ ] Empty state announced: "No goals yet"

### 2.6 Gamification Widget
- [ ] Widget heading announced: "Your Progress" or "Start Your Journey"
- [ ] Streak count announced: "3-day streak"
- [ ] Insights read in order with emoji descriptions
- [ ] Wins read in order with emoji descriptions
- [ ] Empty state CTA announced: "Add Your First Transaction button"

### 2.7 Dynamic Content (ARIA Live Regions)
- [ ] Gamification streak updates announced when changed
- [ ] Insights section announces new insights (`aria-live="polite" aria-atomic="true"`)
- [ ] Wins section announces new wins (`aria-live="polite" aria-atomic="true"`)
- [ ] Loading skeletons announce: "Loading [widget name]"

---

## 3. Visual Design (WCAG 1.4.3, 1.4.11)

### 3.1 Color Contrast - Text
- [ ] Dashboard heading: >= 4.5:1 contrast (text-gray-900 on bg-gray-50)
- [ ] Widget headings: >= 4.5:1 contrast
- [ ] Body text: >= 4.5:1 contrast
- [ ] Transaction amounts: >= 4.5:1 contrast
- [ ] Bill names: >= 4.5:1 contrast
- [ ] Goal names: >= 4.5:1 contrast
- [ ] Gamification insights: >= 4.5:1 contrast

### 3.2 Color Contrast - UI Components
- [ ] Widget borders: >= 3:1 contrast (shadow-md visible)
- [ ] Chart segments: >= 3:1 contrast between adjacent colors
- [ ] Progress bars: >= 3:1 contrast (border + fill)
- [ ] Urgency badges: >= 3:1 contrast
- [ ] Focus indicators: >= 3:1 contrast

### 3.3 Color Independence
- [ ] Spending chart: Categories distinguishable without color (patterns/labels)
- [ ] Income chart: Bars labeled, not relying on color alone
- [ ] Urgency badges: Icons + text, not color only
- [ ] Progress bars: Percentage text visible
- [ ] Gamification: Emoji + text, not color only

### 3.4 Responsive Text
- [ ] Text remains readable at 200% zoom
- [ ] No horizontal scrolling at 320px width
- [ ] Widget content reflows on mobile (1 column)

---

## 4. Semantic HTML (WCAG 1.3.1)

### 4.1 Heading Hierarchy
- [ ] Page has one h1: "Dashboard"
- [ ] Widget headings use h2
- [ ] Widget subsections use h3
- [ ] No heading levels skipped

### 4.2 Landmark Regions
- [ ] Dashboard uses `<main>` element
- [ ] Widget sections use `<section>` with aria-labelledby
- [ ] Header uses `<header>` element

### 4.3 Lists
- [ ] Insights use `<ul role="list">`
- [ ] Wins use `<ul role="list">`
- [ ] Transactions use semantic list markup
- [ ] Bills use semantic list markup

---

## 5. Forms & Inputs (if applicable)

### 5.1 Labels
- [ ] All form inputs have associated `<label>` or aria-label
- [ ] Labels are descriptive and unique

### 5.2 Error Messages
- [ ] Error messages associated with inputs (aria-describedby)
- [ ] Error messages visible and clear

---

## 6. Images & Icons (WCAG 1.1.1)

### 6.1 Decorative Emojis
- [ ] All emojis have `role="img"` and descriptive aria-label
- [ ] Fire emoji: aria-label="Fire emoji indicating streak"
- [ ] Lightbulb emoji: aria-label="Lightbulb emoji indicating insight"
- [ ] Trophy emoji: aria-label="Trophy emoji celebrating win"
- [ ] Rocket emoji: aria-label="Rocket emoji"

### 6.2 Chart Icons
- [ ] Chart icons have alt text or aria-label
- [ ] Icons supplemented with text labels

---

## 7. Loading States (WCAG 4.1.3)

### 7.1 Loading Skeletons
- [ ] Skeletons have `role="status"`
- [ ] Skeletons have `aria-busy="true"`
- [ ] Skeletons have descriptive aria-label
- [ ] Screen reader announces loading state

### 7.2 Transitions
- [ ] No flashing or rapid transitions (> 3 flashes/second)
- [ ] Smooth fade-in when loading completes

---

## 8. Error Handling (WCAG 3.3.1, 3.3.3)

### 8.1 Error Boundary
- [ ] ErrorBoundary catches localStorage failures
- [ ] Error message is clear and actionable
- [ ] Error message suggests recovery steps
- [ ] Error message sanitizes PII (no emails/names)

### 8.2 Empty States
- [ ] Empty states provide clear guidance
- [ ] Empty states suggest next actions (CTAs)

---

## 9. Responsive Design (WCAG 1.4.10)

### 9.1 Mobile (320px - 767px)
- [ ] All 6 widgets stack vertically (1 column)
- [ ] No horizontal scrolling
- [ ] Touch targets >= 44x44px
- [ ] Text remains readable at smallest width

### 9.2 Tablet (768px - 1023px)
- [ ] Widgets display in 2-column grid
- [ ] No horizontal scrolling
- [ ] Content reflows correctly

### 9.3 Desktop (>= 1024px)
- [ ] Widgets display in 3-column grid
- [ ] No horizontal scrolling
- [ ] Content not excessively wide

---

## 10. Performance (WCAG 2.2.2)

### 10.1 Loading Time
- [ ] Dashboard loads in < 5 seconds (Phase 1 target)
- [ ] No blocking scripts
- [ ] Images optimized (if any)

### 10.2 Responsiveness
- [ ] Widgets respond to interactions within 100ms
- [ ] No janky scrolling
- [ ] Smooth animations (if any)

---

## 11. Reduced Motion (WCAG 2.3.3)

### 11.1 Animation Preferences
- [ ] Respects prefers-reduced-motion CSS media query
- [ ] Loading skeleton animation can be disabled
- [ ] Chart transitions respect motion preferences

---

## Test Results Summary

**Total Checks**: 100+
**Passed**: ______
**Failed**: ______
**Pass Rate**: ______%

**Critical Issues** (must fix before launch):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Minor Issues** (can defer to Phase 2):
1. _______________________________________________
2. _______________________________________________

---

## Sign-Off

**Tester Signature**: _______________________________________________
**Date**: _______________________________________________

**HIL Approval**: _______________________________________________
**Date**: _______________________________________________

---

**References**:
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- NVDA Screen Reader: https://www.nvaccess.org/download/
- VoiceOver Guide: https://www.apple.com/accessibility/voiceover/
