# QuickStart: CSV Import Privacy-Safe Telemetry

**Feature ID:** 008-0020-3-csv-telemetry
**Version:** 1.0
**Updated:** 2025-10-09

---

## Overview

This guide provides **one-command verification** and **manual QA checklists** for the CSV Import telemetry feature. Use this to confirm the implementation works correctly before merging.

---

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Clean git working directory (no uncommitted changes)

---

## One-Command Verification

Run all automated checks (tests, build, lint):

```bash
npm --prefix frontend test && npm --prefix frontend run build && npm --prefix frontend run lint
```

**Expected Output:**
```
✓ All tests passed (including telemetry.test.ts)
✓ Build successful (no TypeScript errors)
✓ Linting passed (no ESLint/Prettier violations)
```

If any step fails, **do not proceed to manual QA** — fix issues first.

---

## Manual QA Checklist

### Setup
1. **Start Dev Server:**
   ```bash
   npm --prefix frontend run dev
   ```
2. **Open Browser:** Navigate to `http://localhost:5173` (or configured port)
3. **Open DevTools:** Press F12 (Chrome/Firefox) or Cmd+Option+I (Safari)
4. **Network Tab:** Filter to "Fetch/XHR" requests

---

### Test 1: Default State (No Consent)
**Goal:** Verify telemetry is OFF by default and no network calls occur.

**Steps:**
1. Open Import page in **incognito/private mode** (fresh state)
2. Observe: Consent banner appears at top of page
3. Open **Application** tab → **LocalStorage** → `telemetryConsentV1` should be `null` or absent
4. Trigger a CSV error (e.g., upload a file with >1000 rows or invalid format)
5. Check **Network** tab → No telemetry requests (e.g., to `/api/telemetry` or external analytics)

**Expected:**
- ✅ Banner visible
- ✅ No localStorage consent key
- ✅ Zero network calls (only page assets and normal API calls)

**Result:** [ ] Pass / [ ] Fail

---

### Test 2: Enable Consent Flow
**Goal:** Verify enabling telemetry persists consent and events are queued.

**Steps:**
1. Click **"Enable telemetry"** button in banner
2. Banner dismisses
3. Check **Application** → **LocalStorage** → `telemetryConsentV1`:
   ```json
   {
     "granted": true,
     "version": 1,
     "updatedAt": "2025-10-09T14:00:00.000Z"
   }
   ```
4. Open **Console** tab and enable debug mode:
   ```javascript
   window.__telemetryDebug = true;
   ```
5. Trigger a CSV error (e.g., invalid date format)
6. Console should log:
   ```
   [Telemetry] Event queued: { type: "csv_error", code: "INVALID_DATE_FORMAT", ... }
   ```
7. Inspect event payload (via `window.__telemetryQueue()`):
   - `code`: enum value (e.g., `"INVALID_DATE_FORMAT"`)
   - `rowCountBucket`: bucketed (e.g., `"1-100"`, not exact count)
   - `delimiter`: enum (e.g., `"comma"`)
   - **No** fields like `fileName`, `csvContent`, `amount`, `provider`

**Expected:**
- ✅ Consent persisted to localStorage
- ✅ Events logged in console (if debug mode on)
- ✅ Event payload contains only enum codes and bucketed values
- ✅ No PII in payload (verify manually)

**Result:** [ ] Pass / [ ] Fail

---

### Test 3: Disable Consent Flow
**Goal:** Verify disabling telemetry stops event collection.

**Steps:**
1. Find telemetry toggle (e.g., footer link, settings icon, or re-show banner)
2. Click **"Disable telemetry"** or similar
3. Check **LocalStorage** → `telemetryConsentV1.granted === false`
4. Trigger another CSV error
5. Check **Console** → No new telemetry events logged (if debug mode on)
6. Check **Network** → No telemetry requests

**Expected:**
- ✅ Consent revoked in localStorage
- ✅ No new events queued
- ✅ Zero network calls

**Result:** [ ] Pass / [ ] Fail

---

### Test 4: Do Not Track (DNT) Respect
**Goal:** Verify DNT overrides user consent and disables telemetry.

**Steps:**
1. **Firefox:** Open `about:preferences#privacy` → Check "Send websites a 'Do Not Track' signal"
2. **Safari:** Preferences → Privacy → Enable "Ask websites not to track me"
3. **Chrome:** DNT removed (skip this browser, or use extension to force DNT)
4. Reload Import page in incognito
5. Observe: Consent banner shows "DNT Active" message or is hidden entirely
6. Attempt to enable telemetry (if UI allows)
7. Verify: `localStorage.telemetryConsentV1.granted` remains `false` (or absent)
8. Trigger CSV error
9. Check **Network** → Zero telemetry requests

**Expected:**
- ✅ DNT status visible in UI (or banner hidden)
- ✅ Cannot enable telemetry (or UI warns "DNT active")
- ✅ Zero network calls regardless of consent state

**Result:** [ ] Pass / [ ] Fail

**Rollback DNT:**
- Firefox: Uncheck "Send websites a 'Do Not Track' signal"
- Safari: Disable "Ask websites not to track me"

---

### Test 5: Accessibility (Keyboard-Only Navigation)
**Goal:** Verify consent banner is fully accessible without a mouse.

**Steps:**
1. Open Import page in incognito
2. **Do not touch mouse or trackpad**
3. Press **Tab** key repeatedly:
   - Focus should enter consent banner
   - Tab order: "Learn what we collect" → "Enable telemetry" → "Not now" → wraps back
4. Press **Shift+Tab** to reverse focus
5. Navigate to "Not now" button, press **Enter** → banner dismisses
6. Reload page → banner reappears (not yet consented)
7. Navigate to "Enable telemetry", press **Enter** → consent granted, banner dismisses
8. Press **Tab** → focus moves to main Import page (not stuck in banner)
9. Reload page → banner does not reappear (consent persisted)

**Expected:**
- ✅ Tab/Shift+Tab cycles through banner buttons
- ✅ Enter/Space activates focused button
- ✅ Escape key dismisses banner (same as "Not now")
- ✅ Focus returns to Import page after dismiss
- ✅ No focus traps or stuck keyboard navigation

**Result:** [ ] Pass / [ ] Fail

---

### Test 6: Screen Reader Testing (Optional but Recommended)
**Goal:** Verify consent banner is announced correctly by screen readers.

**Setup:**
- **macOS:** Enable VoiceOver (Cmd+F5)
- **Windows:** Enable NVDA or JAWS
- **Linux:** Enable Orca

**Steps:**
1. Open Import page in incognito
2. VoiceOver announces: "Dialog: Help improve this tool? Share anonymous usage data..."
3. Navigate to "Enable telemetry" button → VoiceOver reads button label
4. Navigate to "Not now" button → VoiceOver reads button label
5. Press "Learn what we collect" link → modal opens, VoiceOver reads modal title

**Expected:**
- ✅ Dialog role announced
- ✅ Title and description read aloud
- ✅ Buttons have accessible names (not just "Button")
- ✅ Modal content is navigable and dismissible

**Result:** [ ] Pass / [ ] Fail

---

## Debug Mode Reference

Enable telemetry debugging in the browser console:

```javascript
// Enable debug logging
window.__telemetryDebug = true;

// View current event queue
window.__telemetryQueue();
// Returns: Array<TelemetryEvent>

// View consent state
window.__telemetryConsent();
// Returns: { granted: boolean, version: number, updatedAt: string }

// Disable debug logging
window.__telemetryDebug = false;
```

**Example Debug Output:**
```
[Telemetry] Event queued: {
  type: "csv_error",
  timestamp: "2025-10-09T14:32:15.789Z",
  schemaVersion: 1,
  appVersion: "a1b2c3d",
  dnt: 0,
  consent: true,
  code: "TOO_MANY_ROWS",
  rowCountBucket: "1000+",
  delimiter: "comma"
}
```

---

## Rollback Instructions

If critical issues are discovered after merging, revert the telemetry PR:

```bash
# Find the merge commit SHA
git log --oneline | grep "telemetry"
# Example output: a1b2c3d feat: Add CSV Import telemetry (#123)

# Revert the commit
git revert a1b2c3d

# Push revert to main
git push origin main
```

**Verify Revert:**
```bash
npm --prefix frontend test    # All existing tests pass
npm --prefix frontend run build  # No build errors
# Check Import page → CSV Import works normally, no telemetry banner
```

---

## Common Issues & Troubleshooting

### Issue: Tests Fail with "localStorage is not defined"
**Cause:** Jest/Vitest doesn't mock localStorage by default
**Fix:** Add to test setup:
```typescript
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});
```

### Issue: Consent Banner Appears Twice
**Cause:** LocalStorage key collision or hydration issue
**Fix:** Check `localStorage.telemetryConsentBannerDismissed` logic in component

### Issue: Network Tab Shows Telemetry Requests Despite Consent=False
**Cause:** Future PR (backend integration) leaked into this PR
**Fix:** Remove any `fetch()` calls in telemetry.ts (MVP is client-only queue)

### Issue: Keyboard Navigation Skips Banner
**Cause:** Missing `tabindex` or `role` attributes
**Fix:** Verify `role="dialog"` and all buttons have `tabindex="0"`

---

## Success Criteria Summary

Before merging, all must be ✅:

- [ ] One-command verification passes (tests + build + lint)
- [ ] Manual QA Test 1: Default state (no consent, no network)
- [ ] Manual QA Test 2: Enable consent (localStorage + events queued)
- [ ] Manual QA Test 3: Disable consent (no events after disable)
- [ ] Manual QA Test 4: DNT respected (overrides consent)
- [ ] Manual QA Test 5: Keyboard navigation (Tab/Shift+Tab/Escape)
- [ ] Manual QA Test 6: Screen reader (VoiceOver/NVDA/JAWS)
- [ ] Debug mode works (`window.__telemetryDebug`)
- [ ] No console errors/warnings in production build
- [ ] PII checklist reviewed (no CSV values, filenames, amounts)

---

## Post-Merge Monitoring

After merging to main, monitor for:

1. **Console Errors:** Open browser console on production → no telemetry-related errors
2. **Network Requests:** Confirm no unexpected telemetry endpoints called
3. **GitHub Issues:** Watch for user reports of broken CSV Import or a11y issues
4. **Opt-In Rate (Week 1):** If <5%, consider UX iteration (but not a blocker)

---

## Change Log

| **Version** | **Date**       | **Changes**                          |
|-------------|----------------|--------------------------------------|
| 1.0         | 2025-10-09     | Initial QuickStart guide             |

---

**Questions?** Refer to:
- [spec.md](./spec.md) — Business requirements
- [data-model.md](./data-model.md) — Event schemas
- [tasks.md](./tasks.md) — Task breakdown
- [plan.md](./plan.md) — Implementation phasing
