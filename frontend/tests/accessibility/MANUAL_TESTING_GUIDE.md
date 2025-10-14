# Manual Accessibility Testing Guide
## Feature 012 - User Preference Management UI Components

**Task**: T035
**Standard**: WCAG 2.1 AA Compliance
**Date**: 2025-10-14

---

## Automated Testing Results ✅

**Tool**: axe-core via vitest-axe
**Result**: 0 violations found across all 4 components
**Test File**: [tests/accessibility/preferences.a11y.test.tsx](./preferences.a11y.test.tsx)

Components tested:
- ✅ PreferenceToggle (enabled + disabled states)
- ✅ ToastNotification (success + error types)
- ✅ InlineStatusIndicator (visible + hidden states)
- ✅ PreferenceSettings (empty + fully populated)

---

## Manual Screen Reader Testing

### Prerequisites
- **Windows**: NVDA 2024.x or later ([Download](https://www.nvaccess.org/download/))
- **macOS**: VoiceOver (built-in, Cmd+F5 to toggle)
- **Browser**: Chrome or Firefox (latest version)
- **Test Environment**: `npm run dev` running on localhost:5173

### Test Scenarios

#### **Scenario 1: PreferenceToggle Keyboard Navigation**

**URL**: http://localhost:5173/ (Home page with EmailInput)

1. **Tab to Locale Toggle**
   - Press `Tab` until you reach "Remember this locale setting" checkbox
   - **Expected**: Screen reader announces: "Remember this locale setting, checkbox, not checked"
   - **WCAG**: 2.1.1 Keyboard, 2.4.7 Focus Visible

2. **Activate Toggle**
   - Press `Space` to check the checkbox
   - **Expected**: Screen reader announces: "Remember this locale setting, checkbox, checked"
   - **WCAG**: 2.5.3 Label in Name

3. **Change Locale**
   - Tab to "US (MM/DD/YYYY)" radio button
   - Press arrow keys to navigate to "EU (DD/MM/YYYY)"
   - **Expected**: Preference automatically saves if toggle is checked
   - **WCAG**: 3.2.2 On Input (no unexpected context change)

---

#### **Scenario 2: ToastNotification ARIA Live Region**

**URL**: http://localhost:5173/settings/preferences

1. **Navigate to Settings**
   - Open `/settings/preferences` page
   - Tab to any PreferenceToggle and press `Space`
   - **Expected**: Toast appears and screen reader announces: "Timezone preference saved" (or similar)
   - **WCAG**: 4.1.3 Status Messages

2. **Toast Auto-Dismiss**
   - Wait 3 seconds after toast appears
   - **Expected**: Toast disappears automatically, no focus trap
   - **WCAG**: 2.2.1 Timing Adjustable (user can dismiss early with Escape)

3. **Dismiss with Keyboard**
   - When toast appears, press `Escape` key
   - **Expected**: Toast dismisses immediately
   - **WCAG**: 2.1.1 Keyboard

---

#### **Scenario 3: InlineStatusIndicator Announcement**

**URL**: http://localhost:5173/ (Home page)

1. **First Visit (No Saved Preference)**
   - Load page in incognito mode
   - Tab to locale section
   - **Expected**: No "Restored" indicator visible
   - **WCAG**: 1.3.1 Info and Relationships

2. **Opt-In and Refresh**
   - Check "Remember this locale setting"
   - Refresh page (Ctrl+R / Cmd+R)
   - **Expected**:
     - "Restored" pill visible next to toggle
     - Screen reader announces: "Locale preference restored from previous session"
   - **WCAG**: 4.1.2 Name, Role, Value

---

#### **Scenario 4: PreferenceSettings Heading Hierarchy**

**URL**: http://localhost:5173/settings/preferences

1. **Navigate with Heading Keys**
   - Press `H` key repeatedly (NVDA/VoiceOver)
   - **Expected Hierarchy**:
     - H2: "Preference Settings"
     - H3: "Timezone"
     - H3: "Payday Dates"
     - H3: "Business Day Settings"
     - H3: "Currency Format"
     - H3: "Locale"
   - **WCAG**: 1.3.1 Info and Relationships, 2.4.6 Headings and Labels

2. **Reset All Confirmation**
   - Tab to "Reset All" button and press `Enter`
   - **Expected**:
     - AlertDialog opens with focus trapped
     - Screen reader announces: "Change date format? Dialog"
     - First button receives focus
   - **WCAG**: 2.4.3 Focus Order, 3.2.1 On Focus

3. **Escape to Close Dialog**
   - Press `Escape` key
   - **Expected**: Dialog closes, focus returns to "Reset All" button
   - **WCAG**: 2.1.2 No Keyboard Trap

---

#### **Scenario 5: Error Toast Announcement**

**URL**: http://localhost:5173/settings/preferences

1. **Trigger Storage Quota Error** (simulated)
   - Open DevTools Console
   - Run: `localStorage.clear(); localStorage.setItem('payplan_preferences_v1', 'x'.repeat(6000))`
   - Try to save a preference
   - **Expected**:
     - Error toast appears (red background)
     - Screen reader announces: "Storage quota exceeded" with `aria-live="assertive"` (urgent tone)
     - Role is `alert` (not `status`)
   - **WCAG**: 3.3.1 Error Identification, 4.1.3 Status Messages

---

### Color Contrast Verification

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or DevTools:

1. **Success Toast** (green background):
   - Foreground: `#155724` (dark green text)
   - Background: `#d4edda` (light green)
   - **Required Ratio**: 4.5:1 for normal text (WCAG AA)

2. **Error Toast** (red background):
   - Foreground: `#721c24` (dark red text)
   - Background: `#f8d7da` (light red)
   - **Required Ratio**: 4.5:1 for normal text (WCAG AA)

3. **PreferenceToggle Label**:
   - Foreground: `#000` (black text)
   - Background: `#fff` (white)
   - **Required Ratio**: 4.5:1 (easily passes)

---

### Keyboard Navigation Checklist

Test all interactive elements with keyboard only (no mouse):

- [ ] **Tab Order** follows logical reading order (top-to-bottom, left-to-right)
- [ ] **Focus Indicators** are visible on all interactive elements (2px blue outline)
- [ ] **Space/Enter** activates buttons and checkboxes
- [ ] **Arrow Keys** navigate radio groups
- [ ] **Escape** dismisses dialogs and toasts
- [ ] **No Keyboard Traps** - can always Tab away from any element

---

### Test Results Template

**Tester**: [Your Name]
**Date**: [YYYY-MM-DD]
**Screen Reader**: NVDA 2024.x / VoiceOver 14.x
**Browser**: Chrome 131.x / Firefox 133.x

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| 1. PreferenceToggle Keyboard Navigation | ⬜ | |
| 2. ToastNotification ARIA Live Region | ⬜ | |
| 3. InlineStatusIndicator Announcement | ⬜ | |
| 4. PreferenceSettings Heading Hierarchy | ⬜ | |
| 5. Error Toast Announcement | ⬜ | |
| Color Contrast (3 checks) | ⬜ | |
| Keyboard Navigation Checklist (6 items) | ⬜ | |

**Overall Result**: ⬜ PASS / ⬜ FAIL
**Violations Found**: [List any WCAG violations with criterion numbers]
**Recommendations**: [Suggested fixes, if any]

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- Feature 012 Contract: `specs/012-user-preference-management/contracts/PreferenceUIComponents.contract.md`
