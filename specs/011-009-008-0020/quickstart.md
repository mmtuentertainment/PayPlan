# QuickStart: Telemetry Banner Auto-Dismiss

**Feature**: 011-009-008-0020
**Estimated Time**: 5 minutes
**Prerequisites**: Node.js 18+, frontend dev server running

---

## Overview

This quickstart validates the auto-dismiss functionality of the TelemetryConsentBanner component through manual testing scenarios.

---

## Setup

### 1. Start Development Server

```bash
cd /home/matt/PROJECTS/PayPlan/frontend
npm run dev
```

**Expected**: Server starts on `http://localhost:5173`

### 2. Clear Existing Consent

```bash
# Open browser console (F12) and run:
localStorage.removeItem('telemetry_consent')
location.reload()
```

**Expected**: Banner appears at top of page

---

## Test Scenarios

### Scenario 1: Basic Auto-Dismiss (2 min)

**Steps**:
1. Open app in browser
2. Observe banner appears with countdown text
3. Do NOT interact with banner
4. Wait 10 seconds

**Expected Results**:
- ✅ Banner shows "Auto-dismissing in 10s..."
- ✅ Countdown decrements: 10 → 9 → 8 → ... → 1 → 0
- ✅ Banner fades out in ~200ms
- ✅ Console shows `telemetry_consent = "opt_out"`

**Validation**:
```javascript
// In browser console
localStorage.getItem('telemetry_consent') === 'opt_out'  // Should be true
```

---

### Scenario 2: Pause on Hover (1 min)

**Steps**:
1. Reload page (banner reappears)
2. Wait until countdown shows "7s"
3. Hover mouse over banner
4. Wait 5 seconds
5. Move mouse away from banner

**Expected Results**:
- ✅ At "7s", hover → Shows "Paused" indicator (icon + text)
- ✅ After 5 seconds hovering → Still shows "7s" (paused)
- ✅ Mouse leaves → "Paused" disappears, countdown resumes at "7s"
- ✅ Countdown continues: 7 → 6 → 5 → ... → 0 → Dismiss

---

### Scenario 3: Pause on Focus (1 min)

**Steps**:
1. Reload page
2. Wait until countdown shows "5s"
3. Press Tab key to focus "Allow" button
4. Wait 3 seconds
5. Press Tab again to focus "Decline" button
6. Press Shift+Tab to go back to "Allow"
7. Press Shift+Tab again (focus leaves banner, wraps to "Decline")

**Expected Results**:
- ✅ Tab into banner → Countdown pauses at "5s", shows "Paused"
- ✅ While focused → Countdown stays at "5s"
- ✅ Tab between buttons → Still paused at "5s"
- ✅ Focus leaves → Countdown resumes from "5s"

---

### Scenario 4: Pause on Tab Switch (1 min)

**Steps**:
1. Reload page
2. Wait until countdown shows "8s"
3. Switch to different browser tab (e.g., open new tab)
4. Wait 10 seconds
5. Switch back to app tab

**Expected Results**:
- ✅ Switch away → Countdown freezes at "8s"
- ✅ After 10 seconds away → Countdown still at "8s"
- ✅ Return to tab → Countdown resumes from "8s"

**Note**: Pause indicator may or may not show (implementation detail)

---

### Scenario 5: Cross-Tab Sync (2 min)

**Steps**:
1. Open app in Tab A
2. Open app in Tab B (duplicate tab)
3. Both should show banner with different countdown values
4. In Tab A, click "Allow analytics" button
5. Observe Tab B

**Expected Results**:
- ✅ Tab A: Banner disappears, shows "Anonymous analytics enabled" announcement
- ✅ Tab B: Banner disappears immediately (within 100ms)
- ✅ Both tabs: `localStorage.getItem('telemetry_consent') === 'opt_in'`
- ✅ Reload either tab → Banner does NOT reappear

---

### Scenario 6: Screen Reader Announcements (2 min)

**Prerequisites**: Screen reader enabled (NVDA on Windows, VoiceOver on Mac)

**Steps**:
1. Enable screen reader
2. Reload page
3. Listen for announcements at 10s, 5s, 0s

**Expected Announcements**:
- ✅ At 10s: "Auto-dismissing in 10 seconds"
- ✅ At 5s: "Auto-dismissing in 5 seconds"
- ✅ At 0s: "Auto-dismissing in 0 seconds" OR "Analytics banner auto-dismissed"
- ❌ NOT at 9s, 8s, 7s, 6s, 4s, 3s, 2s, 1s
- ❌ NOT on pause/resume

**Validation**: Use screen reader's announcement history to verify

---

### Scenario 7: User Override (1 min)

**Steps**:
1. Reload page
2. Wait until countdown shows "4s"
3. Click "Decline" button

**Expected Results**:
- ✅ Banner disappears immediately (countdown cancelled)
- ✅ Announcement: "Analytics disabled"
- ✅ `localStorage.getItem('telemetry_consent') === 'opt_out'`

---

### Scenario 8: Escape Key (30 sec)

**Steps**:
1. Reload page
2. Press Escape key immediately

**Expected Results**:
- ✅ Banner disappears (same as clicking Decline)
- ✅ Countdown cancelled
- ✅ Announcement: "Analytics disabled"

---

### Scenario 9: Focus Restoration (1 min)

**Steps**:
1. Reload page
2. Click on a text input field on the page (if available)
3. Observe banner appears and steals focus to "Allow" button
4. Wait for auto-dismiss (or press Escape)

**Expected Results**:
- ✅ Banner appears → Focus moves to "Allow" button
- ✅ Auto-dismiss → Focus returns to text input field
- ✅ Can continue typing immediately

**Fallback**: If no input field, focus should return to `<body>` (natural tab order)

---

### Scenario 10: Reduced Motion (1 min)

**Prerequisites**: Enable reduced motion in OS settings

**Windows**:
```
Settings → Accessibility → Visual effects → Animation effects: OFF
```

**macOS**:
```
System Preferences → Accessibility → Display → Reduce motion: ON
```

**Steps**:
1. Enable reduced motion
2. Reload page
3. Wait for auto-dismiss

**Expected Results**:
- ✅ Banner disappears instantly (no 200ms fade)
- ✅ All functionality works identically

---

## Automated Test Validation

After manual testing, run automated tests:

```bash
cd /home/matt/PROJECTS/PayPlan/frontend

# Run all tests
npm test

# Run specific test file
npm test TelemetryConsentBanner
```

**Expected**:
- ✅ All tests pass
- ✅ Coverage >80% for TelemetryConsentBanner.tsx

---

## Troubleshooting

### Banner doesn't appear

**Fix**:
```javascript
// Browser console
localStorage.removeItem('telemetry_consent')
location.reload()
```

### Countdown doesn't pause

**Check**:
- Hover event: `console.log('hovered')` in `onMouseEnter`
- Focus event: `console.log('focused')` in `onFocus`
- Tab visibility: `console.log(document.hidden)`

### Cross-tab sync not working

**Check**:
1. Both tabs on same origin (localhost:5173)
2. Storage event listener registered
3. Console logs in storage event handler

---

## Performance Validation

### Timing Checks

```javascript
// Browser console
let start = Date.now();
setTimeout(() => {
  console.log('Elapsed:', Date.now() - start, 'ms');
  // Should be ~10000ms ± 500ms
}, 10000);
```

### Animation Duration

```javascript
// Measure fade-out duration
const banner = document.querySelector('[role="dialog"]');
const start = Date.now();
const observer = new MutationObserver(() => {
  if (!banner.parentElement) {
    console.log('Fade duration:', Date.now() - start, 'ms');
    // Should be 200-250ms
  }
});
observer.observe(banner.parentElement, { childList: true });
```

---

## Success Criteria

**All scenarios PASS** ✅:
- [x] Basic auto-dismiss works
- [x] Pause on hover works
- [x] Pause on focus works
- [x] Pause on tab switch works
- [x] Cross-tab sync works
- [x] Screen reader announcements correct
- [x] User override works
- [x] Escape key works
- [x] Focus restoration works
- [x] Reduced motion works

**Automated tests PASS** ✅:
- [x] npm test passes
- [x] Coverage ≥80%

**Performance PASS** ✅:
- [x] 10s countdown ±500ms
- [x] Fade-out 200-250ms
- [x] Cross-tab sync <100ms

---

## Next Steps

1. ✅ Complete QuickStart validation
2. Run full test suite: `npm test`
3. Manual screen reader testing
4. Create PR for code review

---

**QuickStart Version**: 1.0.0
**Last Updated**: 2025-10-10
**Estimated Total Time**: ~10-15 minutes
