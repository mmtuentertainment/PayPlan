# Data Model: Telemetry Banner Auto-Dismiss

**Feature**: 011-009-008-0020
**Date**: 2025-10-10

## Overview

This feature enhances the existing TelemetryConsentBanner component with auto-dismiss functionality. The data model focuses on timer state management and cross-tab synchronization.

---

## Entities

### 1. ConsentState (Existing - No Changes)

**Type**: `"unset" | "opt_in" | "opt_out"`

**Storage**: `localStorage['telemetry_consent']`

**Description**: User's telemetry preference stored in browser local storage.

**Values**:
- `"unset"` - User has not made a decision (banner shows)
- `"opt_in"` - User allowed analytics
- `"opt_out"` - User declined analytics OR auto-dismiss occurred

**Lifecycle**:
1. Initial: `"unset"` (no localStorage key)
2. User action OR auto-dismiss → `"opt_in"` or `"opt_out"`
3. Page reload → remains persisted
4. **Note**: Auto-dismiss sets to `"opt_out"` (privacy-safe default)

**Cross-Tab Sync**: YES (via storage event)

**Validation**: Must be one of the three literal values

---

### 2. CountdownTimer (New)

**Type**: `number` (seconds remaining, 0-10)

**Storage**: Component state only (not persisted)

**Description**: Remaining seconds before auto-dismiss triggers.

**Initial Value**: `10` (seconds)

**Range**: `[0, 10]` inclusive

**Update Frequency**: Every 1 second (when active)

**Lifecycle**:
1. Banner mounts → Initialize to `10`
2. Every second → Decrement by `1` (if not paused)
3. Reaches `0` → Trigger auto-dismiss
4. User interaction (Allow/Decline/Escape) → Clear timer
5. Banner unmounts → Clear timer

**Pause Conditions** (timer stops decrementing):
- User hovers over banner (`mouseenter` event)
- Any element in banner receives focus (`focus` event)
- Browser tab becomes inactive (`document.hidden === true`)

**Resume Conditions** (timer continues):
- Mouse leaves banner AND no focus (`mouseleave` + no `activeElement`)
- Browser tab becomes active again (`document.hidden === false`)

**State Transitions**:
```
10s → 9s → 8s → 7s → 6s → 5s → 4s → 3s → 2s → 1s → 0s → AUTO_DISMISS
 ↑                                                           ↓
 └─────────── PAUSE (hover/focus/tab-switch) ────────────────┘
```

**Validation**: Always integer between 0 and 10

---

### 3. PauseState (New)

**Type**: `boolean`

**Storage**: Component state only

**Description**: Indicates whether countdown is currently paused.

**Values**:
- `true` - Countdown is paused (user interacting or tab inactive)
- `false` - Countdown is active (decrementing)

**Derived From**:
- `isHovered`: Mouse over banner
- `hasFocus`: Any banner element focused
- `isTabHidden`: `document.hidden === true`

**Calculation**: `isPaused = isHovered || hasFocus || isTabHidden`

**Used For**:
- Visual indicator rendering (pause icon/text)
- Preventing countdown decrement
- NOT announced to screen readers (per FR-016.4)

**State Transitions**:
```
false (active) ←→ true (paused)
       ↓                ↓
  Timer runs     Timer stops
```

---

### 4. FocusContext (New)

**Type**: `HTMLElement | null`

**Storage**: `useRef` (not state, doesn't trigger re-renders)

**Description**: Reference to the element that had focus BEFORE banner appeared.

**Lifecycle**:
1. Banner mounts → Capture `document.activeElement`
2. Auto-dismiss triggers → Restore focus to saved element
3. Banner unmounts (any reason) → Clear reference

**Purpose**: Accessibility - maintain keyboard navigation context per FR-014.3

**Validation**: Must be focusable HTML element or null

**Edge Cases**:
- If saved element no longer exists → Focus `<body>` (default)
- If saved element is `<body>` → Keep as is (natural tab order resumes)

---

### 5. AnnouncementText (Existing - Enhanced)

**Type**: `string`

**Storage**: Component state (triggers aria-live region)

**Description**: Text announced to screen readers.

**New Values** (in addition to existing):
- `"Analytics banner auto-dismissed"` - When countdown reaches 0
- `"Auto-dismissing in 10 seconds"` - At 10s milestone
- `"Auto-dismissing in 5 seconds"` - At 5s milestone
- `"Auto-dismissing in 0 seconds"` - At 0s (immediately before dismiss)

**Announcement Timing**:
- Set text → Wait for aria-live region pickup (~100ms)
- Keep text for 1500ms → Clear (prevents stale announcements)

**Announcement Rules** (FR-016.2, FR-016.4):
- ✅ Countdown milestones: 10s, 5s, 0s
- ✅ Auto-dismiss event
- ❌ Every second countdown
- ❌ Pause/resume events
- ❌ Hover/focus changes

---

## Component State Shape

```typescript
interface TelemetryConsentBannerState {
  // Existing state
  visible: boolean;                    // Banner visibility
  announcementText: string;            // Aria-live announcements

  // New state for auto-dismiss
  countdown: number;                   // 0-10 seconds
  isPaused: boolean;                   // Pause state
  isHovered: boolean;                  // Mouse over banner
  hasFocus: boolean;                   // Element focused in banner
  isTabHidden: boolean;                // Tab inactive
}

interface TelemetryConsentBannerRefs {
  // Existing refs
  dialogRef: RefObject<HTMLDivElement>;
  firstButtonRef: RefObject<HTMLButtonElement>;

  // New refs for auto-dismiss
  previousFocusRef: RefObject<HTMLElement>;  // Focus restoration
  intervalIdRef: RefObject<number>;          // setInterval cleanup
}
```

---

## Browser Storage Schema

### localStorage

**Key**: `telemetry_consent`

**Value**: `"unset" | "opt_in" | "opt_out"`

**Sync**: Cross-tab via `storage` event

**Example**:
```json
{
  "telemetry_consent": "opt_out"
}
```

**No New Keys**: Per FR-017.3, auto-dismiss does NOT create additional storage keys

---

## State Management Patterns

### 1. Timer Management

```typescript
// Start countdown on mount
useEffect(() => {
  if (!visible) return;

  const intervalId = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 0) {
        handleAutoDismiss();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(intervalId);
}, [visible]);
```

### 2. Pause Logic

```typescript
// Pause when hover/focus/tab-hidden
useEffect(() => {
  if (isHovered || hasFocus || isTabHidden) {
    setPaused(true);
  } else {
    setPaused(false);
  }
}, [isHovered, hasFocus, isTabHidden]);

// Stop timer when paused
useEffect(() => {
  if (isPaused) {
    // Clear interval (handled in timer effect)
  }
}, [isPaused]);
```

### 3. Cross-Tab Sync

```typescript
// useSyncExternalStore pattern
const consentStore = {
  getSnapshot: () => getConsent(),
  subscribe: (listener: () => void) => {
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
};

const consent = useSyncExternalStore(
  consentStore.subscribe,
  consentStore.getSnapshot
);

// Auto-hide banner when consent changes in another tab
useEffect(() => {
  if (consent !== 'unset') {
    setVisible(false);
  }
}, [consent]);
```

### 4. Visibility API Integration

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    setTabHidden(document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## Validation Rules

### Countdown

- **Type**: Must be integer
- **Range**: `0 <= countdown <= 10`
- **Behavior**: Decrements only when `!isPaused`

### ConsentState

- **Type**: Must be literal `"unset" | "opt_in" | "opt_out"`
- **Sync**: Must propagate across tabs within 100ms
- **Persistence**: Must survive page reload

### PauseState

- **Type**: Must be boolean
- **Derived**: `isPaused = isHovered || hasFocus || isTabHidden`
- **Visual**: Must show indicator when `true`

### FocusContext

- **Type**: Must be valid HTMLElement or null
- **Validation**: Check `element.focus` method exists before calling
- **Fallback**: `document.body` if saved element unavailable

---

## Performance Constraints

**Timer Updates**: Max 10 state updates over 10 seconds
**Storage Events**: Max 1 cross-tab sync per user action
**Memory**: Total state ~200 bytes (negligible)
**Rendering**: Max 10 re-renders for countdown + pause state changes

---

## Accessibility Data

**ARIA Attributes** (existing, maintained):
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="telemetry-title"`
- `aria-describedby="telemetry-desc"`

**ARIA Live Region** (existing, enhanced):
- `role="status"`
- `aria-live="polite"`
- `aria-atomic="true"`
- New announcements: Auto-dismiss milestones

**Focus Management**:
- Capture: `document.activeElement` on mount
- Restore: Saved element on auto-dismiss
- Trap: Tab/Shift+Tab within dialog (existing)

---

## Edge Case Handling

### 1. Multiple Tabs with Banner

**Scenario**: User has 3 tabs open, all showing banner with different countdowns

**Behavior**:
- Tab 1 countdown at 5s → User clicks "Allow"
- Tab 2 & 3 → Banners immediately disappear
- Tab 2 & 3 countdowns → Irrelevant (banner hidden)

**Implementation**: `storage` event triggers `setVisible(false)` in all tabs

### 2. Rapid Focus Changes

**Scenario**: User tabs through buttons quickly

**Behavior**:
- Each focus event → Pause
- Each blur event → Resume (if not hovered)
- Countdown pauses while ANY element focused

**Implementation**: `hasFocus` tracks any focusable element in banner

### 3. Tab Switch During Countdown

**Scenario**: Countdown at 3s, user switches tab for 10 minutes

**Behavior**:
- Countdown pauses at 3s
- User returns → Countdown resumes from 3s
- Takes 3 more seconds to auto-dismiss

**Implementation**: `document.hidden` triggers pause

### 4. Page Unmount Before Timeout

**Scenario**: User closes tab while countdown at 7s

**Behavior**:
- Timers cleared (useEffect cleanup)
- No consent change recorded
- On next visit → Banner shows again at 10s

**Implementation**: Cleanup functions in all useEffect hooks

---

## State Machine Diagram

```
[BANNER_HIDDEN]
       ↓
  visible=true
       ↓
[COUNTDOWN_ACTIVE: 10s]
       ↓
   isPaused=false
       ↓
   ┌───────────┐
   │ Timer     │
   │ Running   │ ←──┐
   └─────┬─────┘    │
         │          │
    Hover/Focus     │ Resume
    Tab-Switch      │
         │          │
         ↓          │
   ┌───────────┐    │
   │ Timer     │    │
   │ Paused    │ ───┘
   └─────┬─────┘
         │
    countdown=0
         ↓
   [AUTO_DISMISS]
         ↓
   setConsent("opt_out")
         ↓
   [BANNER_HIDDEN]
```

---

## Testing Assertions

### Unit Tests
- ✅ Countdown decrements from 10 to 0 when unpaused
- ✅ Countdown pauses on hover
- ✅ Countdown pauses on focus
- ✅ Countdown pauses on tab hidden
- ✅ Countdown resumes when conditions clear
- ✅ Auto-dismiss sets consent to "opt_out"
- ✅ Focus restored after auto-dismiss

### Integration Tests
- ✅ Cross-tab sync: Consent in tab A → Banner hides in tab B
- ✅ Screen reader announcements at 10s, 5s, 0s
- ✅ No announcements for pause/resume
- ✅ Visual pause indicator appears/disappears
- ✅ Animation duration 200-250ms
- ✅ prefers-reduced-motion disables animation

---

**Data Model Status**: ✅ COMPLETE
**Ready for Contract Generation**: YES
