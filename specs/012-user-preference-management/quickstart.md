# Quickstart: User Preference Management System

**Feature**: 012-user-preference-management
**Created**: 2025-10-13
**Purpose**: Manual test scenarios for validating user stories from spec.md

---

## Overview

This quickstart provides step-by-step manual testing scenarios extracted from the acceptance scenarios in [spec.md](./spec.md) (lines 77-98). Each scenario validates a functional requirement and can be executed manually before automated tests.

---

## Prerequisites

1. Open PayPlan in browser (http://localhost:5173 for dev)
2. Open browser DevTools → Application → Local Storage
3. Clear localStorage: `localStorage.clear()`
4. Refresh page to start clean

---

## Scenario 1: Save and Restore Timezone Preference

**Source**: spec.md Acceptance Scenario 1 (lines 77-78)
**Validates**: FR-001, FR-002, FR-006, NFR-001

**Steps**:

1. **Configure timezone preference**
   - Navigate to timezone selector (location: main settings or inline control)
   - Select "America/New_York" from dropdown
   - Verify inline opt-in toggle appears next to selector
   - Enable opt-in toggle (check the checkbox)
   - **Expected**: Toast notification appears with "Timezone preference saved" message (2-3 seconds)
   - **Expected**: Toast has `role="status"` and `aria-live="polite"` (check in DevTools)

2. **Verify localStorage persistence**
   - Open DevTools → Application → Local Storage
   - Find key `payplan_preferences_v1`
   - **Expected**: JSON value contains:
     ```json
     {
       "preferences": {
         "timezone": {
           "category": "timezone",
           "value": "America/New_York",
           "optInStatus": true,
           "timestamp": "[recent ISO datetime]"
         }
       }
     }
     ```

3. **Simulate new browser session**
   - Close browser tab
   - Reopen PayPlan URL
   - **Expected**: Timezone automatically restored to "America/New_York"
   - **Expected**: Inline status indicator appears showing "Timezone preference restored"
   - **Expected**: Restoration completes in <100ms (check Network/Performance tab)

**Pass Criteria**:
- ✓ Timezone persists across sessions
- ✓ Toast notification displays with correct ARIA attributes
- ✓ Inline indicator shows restored status
- ✓ Restoration time <100ms (NFR-001)

---

## Scenario 2: Reset All Preferences

**Source**: spec.md Acceptance Scenario 2 (lines 80-81)
**Validates**: FR-004, FR-007

**Steps**:

1. **Setup: Save multiple preferences**
   - Configure timezone: "America/Los_Angeles"
   - Configure payday dates: 5th and 20th (specific dates pattern)
   - Enable opt-in for both
   - Verify both saved in localStorage

2. **Reset all preferences**
   - Navigate to Preference Settings screen
   - Locate "Reset All Preferences" button
   - Click button
   - **Expected**: Confirmation dialog appears asking "Reset all preferences to defaults?"
   - Confirm reset

3. **Verify reset**
   - **Expected**: Toast notification appears with "All preferences reset to defaults" message
   - **Expected**: Toast has `role="status"` and `aria-live="polite"`
   - Check localStorage
   - **Expected**: `payplan_preferences_v1` key is removed (null)
   - Check UI
   - **Expected**: Timezone reverts to browser-detected timezone
   - **Expected**: Payday dates field is empty
   - **Expected**: All inline status indicators disappear

**Pass Criteria**:
- ✓ All preferences cleared from localStorage
- ✓ UI reverts to application defaults
- ✓ Toast confirmation displays
- ✓ No inline "restored" indicators remain

---

## Scenario 3: Opt-Out of Specific Category

**Source**: spec.md Acceptance Scenario 3 (lines 83-84)
**Validates**: FR-003, selective persistence

**Steps**:

1. **Setup: Configure two preferences**
   - Set timezone: "America/Chicago"
   - Enable opt-in for timezone (check checkbox)
   - Set currency format: USD with comma separators
   - Enable opt-in for currency format
   - Verify both saved in localStorage

2. **Opt out of timezone**
   - Locate timezone inline toggle checkbox
   - Disable the checkbox (uncheck)
   - **Expected**: Toast notification "Timezone preference will not be saved"

3. **Verify selective persistence**
   - Check localStorage
   - **Expected**: `timezone` preference removed from JSON
   - **Expected**: `currency_format` preference still present

4. **Test restoration**
   - Refresh page (simulate new session)
   - **Expected**: Currency format restored (inline indicator shows "Currency preference restored")
   - **Expected**: Timezone reverts to default (no restore, no indicator)

**Pass Criteria**:
- ✓ Timezone not persisted after opt-out
- ✓ Currency format persists independently
- ✓ Selective restoration works correctly

---

## Scenario 4: Centralized Settings Screen

**Source**: spec.md Acceptance Scenario 7 (lines 97-99)
**Validates**: FR-003 (dual UI pattern), Clarification Q1

**Steps**:

1. **Access centralized settings**
   - Navigate to Settings page or Preferences screen
   - **Expected**: See list of all 5 preference categories:
     - Timezone
     - Payday Dates
     - Business Day Settings
     - Currency Format
     - Locale

2. **Review opt-in status**
   - Each category should have:
     - Current value display
     - Inline opt-in toggle checkbox
     - Link to "Manage" or inline editor
   - **Expected**: All toggles reflect current opt-in status from localStorage

3. **Bulk management**
   - Toggle multiple preferences on/off
   - **Expected**: Changes persist immediately (debounced 300ms)
   - **Expected**: Toast notification for each change
   - Click "Reset All" button
   - **Expected**: All preferences clear at once

**Pass Criteria**:
- ✓ All 5 categories displayed
- ✓ Inline toggles present for each
- ✓ Centralized reset button works
- ✓ UI updates reflect localStorage state

---

## Scenario 5: Edge Case - Storage Quota Exceeded

**Source**: spec.md Edge Case (lines 111-112)
**Validates**: FR-014 (5KB limit)

**Steps**:

1. **Attempt to save oversized preference**
   - Open browser console
   - Execute:
     ```javascript
     localStorage.setItem('payplan_preferences_v1', 'x'.repeat(6 * 1024)); // 6KB
     ```
   - Refresh page
   - **Expected**: Error toast appears "Preference storage limit exceeded (5KB)"
   - **Expected**: Preferences revert to defaults

2. **Verify enforcement in UI**
   - Try to save extremely long payday dates list (e.g., 100 specific dates)
   - **Expected**: Validation error appears before localStorage write
   - **Expected**: Error message: "Preference data exceeds 5KB limit. Please simplify configuration."

**Pass Criteria**:
- ✓ 5KB limit enforced
- ✓ Clear error messaging
- ✓ Graceful fallback to defaults

---

## Scenario 6: Edge Case - Corrupted localStorage Data

**Source**: spec.md Edge Case (lines 96-97)
**Validates**: FR-009 (validation and fallback)

**Steps**:

1. **Corrupt localStorage data**
   - Open browser console
   - Execute:
     ```javascript
     localStorage.setItem('payplan_preferences_v1', 'invalid{json}garbage');
     ```

2. **Test error recovery**
   - Refresh page
   - **Expected**: Application loads successfully (no crash)
   - **Expected**: Toast notification "Preferences could not be loaded. Using defaults."
   - **Expected**: All preferences revert to application defaults
   - Check localStorage
   - **Expected**: Corrupted key removed or overwritten with empty collection

**Pass Criteria**:
- ✓ Application doesn't crash
- ✓ User-friendly error message
- ✓ Defaults restored
- ✓ Corrupted data cleared

---

## Scenario 7: Accessibility - Screen Reader Testing

**Source**: NFR-003 (WCAG 2.1 AA), Clarification Q4
**Validates**: ARIA live regions, keyboard navigation

**Steps** (using NVDA on Windows or VoiceOver on macOS):

1. **Toast notification announcement**
   - Save a preference
   - **Expected (NVDA)**: Hears "Timezone preference saved" without focus change
   - **Expected (VoiceOver)**: Announces "Timezone preference saved, status"

2. **Inline toggle keyboard navigation**
   - Press Tab to navigate to timezone control
   - Press Tab again to reach opt-in toggle
   - **Expected**: Screen reader announces "Save timezone preference automatically, checkbox, not checked"
   - Press Space to toggle
   - **Expected**: "checked"

3. **Settings screen navigation**
   - Navigate to Preference Settings
   - Press H key (heading navigation in NVDA)
   - **Expected**: Navigate through headings:
     - "Preference Settings" (H2)
     - "Timezone" (H3)
     - "Payday Dates" (H3)
     - etc.

**Pass Criteria**:
- ✓ Toast announcements work without focus
- ✓ All controls keyboard accessible
- ✓ Proper heading hierarchy
- ✓ ARIA labels present and descriptive

---

## Scenario 8: Performance - <100ms Restoration

**Source**: NFR-001, Clarification Q3
**Validates**: <100ms preference restoration target

**Steps**:

1. **Setup: Save preferences**
   - Save all 5 preference categories
   - Close browser

2. **Measure restoration time**
   - Open Chrome DevTools → Performance tab
   - Click "Record" (Ctrl+E)
   - Navigate to PayPlan URL
   - Wait for page load
   - Stop recording

3. **Analyze timeline**
   - Find "localStorage.getItem" call in timeline
   - Measure time from getItem start to preferences applied in UI
   - **Expected**: <100ms total time
   - Look for "User Timing" marks (if instrumented): `performance.mark('preferences-restored')`

4. **Alternative: Console timing**
   - Open console before page load
   - Add to app initialization:
     ```javascript
     console.time('preference-restore');
     // ... load preferences ...
     console.timeEnd('preference-restore');
     ```
   - **Expected**: Console shows "preference-restore: [X]ms" where X < 100

**Pass Criteria**:
- ✓ Restoration completes in <100ms
- ✓ No visible "flash" of default values
- ✓ UI renders with saved preferences immediately

---

## Test Completion Checklist

**Core Scenarios**:
- [ ] Scenario 1: Save/restore timezone (basic happy path)
- [ ] Scenario 2: Reset all preferences
- [ ] Scenario 3: Selective opt-out
- [ ] Scenario 4: Centralized settings UI

**Edge Cases**:
- [ ] Scenario 5: Storage quota exceeded
- [ ] Scenario 6: Corrupted data recovery

**Non-Functional**:
- [ ] Scenario 7: Accessibility (screen reader, keyboard)
- [ ] Scenario 8: Performance (<100ms restoration)

**All scenarios must pass** before feature is considered ready for production.

---

## Next Steps After Quickstart

1. Automate these scenarios as integration tests (in `frontend/tests/integration/preferences/`)
2. Add performance monitoring to track NFR-001 compliance in production
3. Conduct user acceptance testing with diverse browser configurations
4. Verify cross-tab synchronization manually (open two tabs, change in one, verify in other)

---

**Quickstart Complete** | **Next Phase**: /tasks command to generate tasks.md
