# Component Contract: TelemetryConsentBanner

**Component**: `TelemetryConsentBanner`
**Type**: React Functional Component
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Version**: v2.0.0 (adds auto-dismiss)

---

## Public API

### Component Signature

```typescript
export function TelemetryConsentBanner(): JSX.Element | null
```

**Props**: None (component is self-contained)

**Returns**:
- `JSX.Element` when banner should be visible
- `null` when banner should be hidden

---

## Behavioral Contract

### 1. Visibility Rules

**MUST show banner when ALL conditions met**:
- ✅ `isDNT() === false` (Do Not Track disabled)
- ✅ `getConsent() === "unset"` (no previous decision)

**MUST hide banner when ANY condition met**:
- ✅ `isDNT() === true`
- ✅ `getConsent() === "opt_in"` OR `"opt_out"`
- ✅ User clicked Allow/Decline button
- ✅ User pressed Escape key
- ✅ Auto-dismiss countdown reached 0
- ✅ Consent changed in another tab (storage event)

---

### 2. Auto-Dismiss Behavior

**Initial State**:
- Countdown starts at `10` seconds
- Timer begins immediately on mount

**Countdown Rules**:
- MUST decrement by 1 every second when active
- MUST pause when `isHovered === true`
- MUST pause when `hasFocus === true` (any element in banner)
- MUST pause when `document.hidden === true` (tab inactive)
- MUST resume when all pause conditions clear

**Auto-Dismiss Trigger**:
- When `countdown === 0`:
  1. Set `announcementText = "Analytics banner auto-dismissed"`
  2. Call `setConsent("opt_out")`
  3. Wait 1500ms (screen reader announcement)
  4. Set `visible = false`

**Animation**:
- MUST complete fade-out in 200-250ms
- MUST respect `prefers-reduced-motion` (instant hide if enabled)

**Focus Restoration**:
- MUST restore focus to previously focused element
- Fallback to `document.body` if element unavailable

---

### 3. User Interaction Contract

**Allow Button**:
- Click → `setConsent("opt_in")`
- Click → Clear countdown timer
- Click → Set `announcementText = "Anonymous analytics enabled"`
- Click → Wait 1500ms → Hide banner

**Decline Button**:
- Click → `setConsent("opt_out")`
- Click → Clear countdown timer
- Click → Set `announcementText = "Analytics disabled"`
- Click → Wait 1500ms → Hide banner

**Escape Key**:
- Press → Same behavior as Decline button
- MUST work regardless of which element has focus

**Tab Key**:
- MUST trap focus within banner (existing behavior)
- MUST pause countdown while any element focused

**Hover**:
- Mouse enter → Pause countdown, show pause indicator
- Mouse leave → Resume countdown (if no focus, tab visible)

---

### 4. Cross-Tab Synchronization

**Storage Event Listener**:
- MUST listen to `window.storage` event
- MUST react to changes in `telemetry_consent` key
- MUST hide banner if consent becomes `"opt_in"` or `"opt_out"`

**Same-Tab Updates**:
- MUST manually dispatch `StorageEvent` for same-tab sync
- MUST use `window.dispatchEvent(new StorageEvent('storage', {...}))`

**Timing**:
- Cross-tab updates MUST propagate within 100ms
- All open tabs MUST respond identically

---

### 5. Accessibility Contract

**ARIA Structure** (existing, maintained):
```html
<div role="dialog" aria-modal="true"
     aria-labelledby="telemetry-title"
     aria-describedby="telemetry-desc">
  <!-- Banner content -->
</div>

<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  {announcementText}
</div>
```

**Screen Reader Announcements**:
- MUST announce at countdown `10s`: "Auto-dismissing in 10 seconds"
- MUST announce at countdown `5s`: "Auto-dismissing in 5 seconds"
- MUST announce at countdown `0s`: "Auto-dismissing in 0 seconds"
- MUST announce on auto-dismiss: "Analytics banner auto-dismissed"
- MUST announce on Allow: "Anonymous analytics enabled"
- MUST announce on Decline: "Analytics disabled"

**NOT announced**:
- ❌ Every second countdown update
- ❌ Pause/resume events
- ❌ Hover state changes
- ❌ Focus state changes

**Focus Management**:
- MUST focus first button on mount (after 100ms delay)
- MUST trap Tab/Shift+Tab within banner
- MUST restore previous focus on dismiss

**Keyboard Navigation**:
- MUST support Tab, Shift+Tab, Escape, Enter, Space
- MUST show visible focus indicators (ring)

---

### 6. Visual Contract

**Pause Indicator**:
- MUST show when `isPaused === true`
- SHOULD use pause icon + "Paused" text
- MUST be visible to sighted users
- MUST NOT be announced to screen readers

**Countdown Display**:
- Format: "Auto-dismissing in {X}s..."
- Updates every second (visual only)
- Replaces with "Paused" when paused

**Animation**:
- Fade-out duration: 200-250ms
- Easing: `ease-out`
- Respects `@media (prefers-reduced-motion: reduce)`

**Styling** (Tailwind classes):
```typescript
className="
  fixed top-0 left-0 right-0 z-50
  bg-blue-50 border-b border-blue-200 shadow-md
  transition-opacity duration-200 ease-out
"
```

---

## State Contract

### Internal State Shape

```typescript
interface State {
  visible: boolean;           // Banner visibility
  announcementText: string;   // Aria-live content
  countdown: number;          // 0-10 seconds
  isPaused: boolean;          // Pause state
  isHovered: boolean;         // Mouse over banner
  hasFocus: boolean;          // Element focused
  isTabHidden: boolean;       // Tab inactive
}
```

### Refs

```typescript
interface Refs {
  dialogRef: RefObject<HTMLDivElement>;
  firstButtonRef: RefObject<HTMLButtonElement>;
  previousFocusRef: RefObject<HTMLElement>;
  intervalIdRef: RefObject<number>;
}
```

---

## Dependencies Contract

### Required Imports

```typescript
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getConsent, setConsent, isDNT } from "@/lib/telemetry";
```

**External Functions Used**:
- `getConsent(): ConsentState` - Reads localStorage consent
- `setConsent(state: ConsentState): void` - Writes localStorage, dispatches event
- `isDNT(): boolean` - Checks Do Not Track header

### Browser APIs Used

```typescript
// Page Visibility API
document.hidden: boolean
document.addEventListener('visibilitychange', handler)

// Storage API
window.addEventListener('storage', handler)
window.dispatchEvent(new StorageEvent('storage', {...}))

// Focus API
document.activeElement: Element
element.focus()

// Timer API
setInterval(callback, 1000): number
clearInterval(id: number): void
```

---

## Performance Contract

**Rendering**:
- Initial render: ~5ms
- State updates during countdown: ~1-2ms each
- Total re-renders over 10s: ≤15 (countdown + pause states)

**Memory**:
- Component state: ~200 bytes
- Event listeners: 3 (keydown, storage, visibilitychange)
- Cleanup: All listeners/timers MUST be removed on unmount

**Timer Accuracy**:
- Expected: 1000ms ± 50ms per tick
- Acceptable drift: ±500ms over 10 seconds

---

## Error Handling

**Graceful Degradation**:
- If Page Visibility API unsupported → Skip pause-on-tab-switch (degrade gracefully)
- If storage event unsupported → Single-tab operation only
- If previous focus element removed → Focus document.body
- If localStorage disabled → Always show banner, but don't persist

**No Errors Thrown**:
- Component MUST NOT throw errors
- Failed focus restoration → Silent fallback
- Invalid countdown value → Clamp to [0, 10]

---

## Testing Contract

### Unit Test Assertions

```typescript
// Countdown behavior
✅ Initial countdown is 10 seconds
✅ Countdown decrements by 1 every second
✅ Countdown pauses on hover (mouseenter)
✅ Countdown resumes on unhover (mouseleave)
✅ Countdown pauses on focus (any element)
✅ Countdown resumes when focus leaves (no hover)
✅ Countdown pauses when tab becomes hidden
✅ Countdown resumes when tab becomes visible

// Auto-dismiss
✅ At countdown=0, calls setConsent("opt_out")
✅ At countdown=0, shows announcement
✅ At countdown=0, hides banner after 1500ms
✅ At countdown=0, restores previous focus

// Screen reader announcements
✅ Announces at 10s milestone
✅ Announces at 5s milestone
✅ Announces at 0s milestone
✅ Does NOT announce at 9s, 8s, 7s, 6s, 4s, 3s, 2s, 1s
✅ Does NOT announce pause events
✅ Does NOT announce resume events

// Visual indicators
✅ Shows pause indicator when isPaused=true
✅ Hides pause indicator when isPaused=false
✅ Pause indicator includes icon + text

// User interactions
✅ Allow button sets consent to "opt_in"
✅ Decline button sets consent to "opt_out"
✅ Escape key sets consent to "opt_out"
✅ All interactions clear countdown timer
```

### Integration Test Assertions

```typescript
// Cross-tab sync
✅ Tab A sets consent → Tab B banner hides
✅ Same-tab consent change → Banner hides
✅ Storage event from other domain → Ignored

// Focus management
✅ Banner mounts → First button focused
✅ Banner dismisses → Previous element focused
✅ Previous element deleted → Body focused

// Animation
✅ Fade-out completes in 200-250ms
✅ prefers-reduced-motion → No animation
```

---

## Breaking Changes from v1

**Backward Compatible**: ✅ YES

**New Behavior**:
- Banner now auto-dismisses after 10s
- Countdown visible to users
- Pause on hover/focus/tab-switch

**Preserved Behavior**:
- All existing props/API unchanged
- Existing keyboard navigation works
- Existing ARIA structure maintained
- Existing Allow/Decline buttons work identically

**Migration**: None required (drop-in enhancement)

---

## Constraints & Limits

**Code Budget**: ≤60 LOC added (excluding tests)
**Files Modified**: 1 file only (TelemetryConsentBanner.tsx)
**Dependencies**: 0 new npm packages
**Browser Support**: Chrome 88+, Firefox 100+, Safari 15+

---

## Example Usage

```typescript
// App.tsx
import { TelemetryConsentBanner } from '@/components/TelemetryConsentBanner';

function App() {
  return (
    <div>
      <TelemetryConsentBanner />
      {/* Rest of app */}
    </div>
  );
}
```

**Expected Behavior**:
1. User visits app for first time
2. Banner appears with "Auto-dismissing in 10s..." countdown
3. User hovers to read → Countdown pauses, shows "Paused"
4. User moves mouse away → Countdown resumes
5. After 10 total active seconds → Banner fades out
6. Consent set to "opt_out"
7. On page reload → Banner appears again (can still opt-in)

---

**Contract Version**: 2.0.0
**Last Updated**: 2025-10-10
**Status**: ✅ READY FOR IMPLEMENTATION
