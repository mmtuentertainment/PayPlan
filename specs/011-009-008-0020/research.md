# Research: Telemetry Banner Auto-Dismiss Implementation

**Feature**: 011-009-008-0020 - Telemetry Banner Auto-Dismiss on Inactivity
**Date**: 2025-10-10
**Status**: Complete

## Research Questions & Decisions

### 1. React Timer Management Pattern (2025)

**Question**: What's the best practice for implementing countdown timers in React 19 with TypeScript?

**Decision**: Use `useEffect` with `setInterval` and functional state updates

**Rationale**:
- **Functional updates** (`setTimeLeft((t) => t - 1)`) avoid stale closure issues
- **Cleanup functions** (`clearInterval`) prevent memory leaks
- **Minimal dependencies** (empty `[]`) avoid unnecessary re-runs
- **TypeScript typing** ensures type safety for timer IDs and state

**Implementation Pattern**:
```typescript
useEffect(() => {
  const intervalId = setInterval(() => {
    setTimeLeft((t) => t - 1);
  }, 1000);

  return () => clearInterval(intervalId);
}, []); // Empty dependency array - interval runs once
```

**Alternatives Considered**:
- ❌ `setTimeout` recursion - More complex, harder to pause/resume
- ❌ `requestAnimationFrame` - Designed for visual animations, not timers
- ❌ External timer libraries - Unnecessary dependency for simple countdown

**Sources**: React.dev official docs, Stack Overflow React hooks patterns (2025)

---

### 2. Page Visibility API Integration

**Question**: How to pause countdown when browser tab becomes inactive?

**Decision**: Use Page Visibility API with `visibilitychange` event listener

**Rationale**:
- **Browser standard** - Native API supported in all modern browsers
- **WCAG 2.2.1 compliance** - Prevents unfair auto-dismiss while user is away
- **Performance** - Aligns with browser timer throttling behavior
- **Simple integration** - One event listener handles pause/resume

**Implementation Pattern**:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause countdown logic
    } else {
      // Resume countdown logic
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

**Key Behavior**:
- `document.hidden` returns `true` when tab is inactive
- `visibilitychange` event fires on tab switch
- Works across all modern browsers (Chrome, Firefox, Safari, Edge)

**Alternatives Considered**:
- ❌ Ignore tab visibility - Violates WCAG 2.2.1, poor UX
- ❌ Custom activity detection - Reinventing browser API, more complex
- ❌ Web Workers for background timers - Overcomplicated, fights browser throttling

**Sources**: MDN Web Docs Page Visibility API, Chrome for Developers Page Lifecycle API

---

### 3. Cross-Tab Consent Synchronization

**Question**: How to sync consent decisions across multiple browser tabs in real-time?

**Decision**: Use `useSyncExternalStore` (React 18+) with `storage` event and manual dispatch

**Rationale**:
- **React 18+ official pattern** - Designed specifically for external store sync
- **Privacy compliance** - Industry standard for GDPR/CCPA consent management
- **Automatic updates** - `storage` event handles cross-tab communication
- **Type safety** - Full TypeScript support for consent states

**Implementation Pattern**:
```typescript
// Store definition
const consentStore = {
  getSnapshot: () => localStorage.getItem('telemetry_consent') as ConsentState,
  subscribe: (listener: () => void) => {
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
};

// Setter with same-tab sync
function setConsent(newValue: ConsentState) {
  localStorage.setItem('telemetry_consent', newValue);
  // Manually dispatch for same-tab updates
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'telemetry_consent',
      newValue
    })
  );
}

// Hook usage
const consent = useSyncExternalStore(
  consentStore.subscribe,
  consentStore.getSnapshot
);
```

**Key Behavior**:
- `storage` event fires automatically in OTHER tabs when localStorage changes
- Manual `dispatchEvent` needed for SAME tab updates
- All tabs receive updates within milliseconds

**Alternatives Considered**:
- ❌ `useState` + `useEffect` polling - Inefficient, delayed updates
- ❌ BroadcastChannel API - Extra complexity, limited browser support pre-2020
- ❌ Shared Web Workers - Overkill for simple state sync

**Sources**: React 18 useSyncExternalStore docs, Medium articles on cross-tab sync patterns (2025)

---

### 4. Animation Duration Standards

**Question**: What's the optimal duration for banner dismissal animations?

**Decision**: 200-250ms fade-out with `prefers-reduced-motion` support

**Rationale**:
- **Industry research**: NN/g studies show 200-500ms is optimal UI animation range
- **Exit animations**: Should be shorter than entry animations (200-250ms vs 300-400ms)
- **User perception**: Below 200ms feels too fast, above 300ms feels sluggish
- **Accessibility**: Must respect `prefers-reduced-motion` media query (WCAG)

**Implementation Pattern**:
```typescript
// Tailwind classes (already available)
className="transition-opacity duration-200 ease-out"

// CSS alternative
@media (prefers-reduced-motion: reduce) {
  .banner-exit {
    transition: none;
  }
}
```

**Alternatives Considered**:
- ❌ 100ms - Too fast, feels abrupt
- ❌ 500ms - Too slow, users perceive as lag
- ❌ Fixed duration only - Violates WCAG 2.3.3 (motion sensitivity)

**Sources**: NN/g animation duration research, CSS-Tricks accessible animations guide

---

### 5. ARIA Live Region Management

**Question**: How to announce countdown changes without overwhelming screen readers?

**Decision**: Selective announcements at 10s, 5s, 0s only (not every second)

**Rationale**:
- **ARIA timer role** has implicit `aria-live="off"` to prevent spam
- **Best practice**: Announce at strategic intervals only (decreasing frequency)
- **User control**: Screen reader users can manually check countdown text anytime
- **Prevents fatigue**: Constant announcements are disruptive and annoying

**Implementation Pattern**:
```typescript
// Announce only at milestones
useEffect(() => {
  if ([10, 5, 0].includes(countdown)) {
    setAnnouncementText(`Auto-dismissing in ${countdown} seconds`);
  }
}, [countdown]);
```

**Do NOT announce**:
- ❌ Every second countdown update (1, 2, 3... 10)
- ❌ Pause/resume events (visual indicator sufficient)
- ❌ Hover/focus state changes (not essential information)

**Alternatives Considered**:
- ❌ Announce every second - Overwhelming, violates ARIA best practices
- ❌ No announcements - Poor accessibility, users unaware of timeout
- ❌ Only announce at 0s - Not enough warning time

**Sources**: MDN ARIA timer role docs, W3C WCAG 2.1 Understanding SC 4.1.3

---

### 6. Visual Pause Indicators

**Question**: How to visually indicate when countdown is paused?

**Decision**: Show pause icon + text change ("Paused") when hover/focus detected

**Rationale**:
- **WCAG 2.2.2 compliance**: Visual + text feedback reduces cognitive load
- **Color alone insufficient**: Must pair with icon/text for accessibility
- **Industry pattern**: Matches media player pause UX (universal understanding)
- **Cognitive load**: Makes state immediately visible without thinking

**Implementation Pattern**:
```typescript
// Conditional rendering
{isPaused ? (
  <>
    <PauseIcon className="w-4 h-4" />
    <span>Paused</span>
  </>
) : (
  <span>Auto-dismissing in {countdown}s</span>
)}
```

**Alternatives Considered**:
- ❌ Color change only - Violates WCAG (color alone insufficient)
- ❌ No indicator - Poor UX, state unclear
- ❌ Animation only - Not perceivable by screen reader users

**Sources**: WCAG 2.2.2 Pause, Stop, Hide, UX Stack Exchange pause button patterns

---

## Technology Stack Validation

**Existing Stack** (from frontend/package.json):
- ✅ React 18.3+ (useSyncExternalStore available)
- ✅ TypeScript 5.6+
- ✅ Vite (build tool)
- ✅ Vitest (testing)
- ✅ Tailwind CSS (styling + transitions)

**New Dependencies Required**: NONE ✅

**Browser APIs Used**:
- ✅ Page Visibility API (document.hidden, visibilitychange)
- ✅ Storage API (localStorage, storage event)
- ✅ CSS Transitions (prefers-reduced-motion query)

**Compatibility**: All APIs supported in Chrome 88+, Firefox 100+, Safari 15+ (2021+)

---

## Performance Considerations

**Timer Precision**:
- `setInterval` accuracy: ±10-50ms (acceptable for 1-second intervals)
- Browser throttling in background tabs: ~1 second minimum (handled by visibility API)

**Memory**:
- Single interval ID: ~8 bytes
- Countdown state: ~4 bytes
- Total overhead: < 100 bytes (negligible)

**Rendering**:
- Visual updates: 10 renders max (10s countdown)
- Screen reader announcements: 3 announcements (10s, 5s, 0s)
- No performance impact

---

## Accessibility Compliance Matrix

| WCAG Criterion | Requirement | Implementation |
|----------------|-------------|----------------|
| 2.2.1 Timing Adjustable | Pause on interaction | Hover/focus/tab-switch pauses countdown |
| 2.2.2 Pause, Stop, Hide | Control over auto-update | Visual pause indicator, manual controls |
| 2.3.3 Animation from Interactions | Reduce motion support | prefers-reduced-motion disables animation |
| 4.1.3 Status Messages | Screen reader announcements | aria-live region with selective updates |

---

## Risk Assessment

**Low Risk**:
- ✅ No new dependencies
- ✅ All browser APIs widely supported (5+ years)
- ✅ Existing test infrastructure (Vitest)
- ✅ Builds on existing TelemetryConsentBanner component

**Medium Risk**:
- ⚠️ Cross-tab sync testing - Requires multi-tab test scenarios
- ⚠️ Timer precision in throttled tabs - Mitigated by visibility API pause

**Mitigation**:
- Integration tests for cross-tab behavior
- Manual testing with screen readers (NVDA, VoiceOver)
- Performance tests for timer accuracy

---

## Implementation Constraints

**Budget**: ≤60 LOC (excluding tests) ✅
**Files Modified**: ≤2 (TelemetryConsentBanner.tsx + tests) ✅
**No Breaking Changes**: Enhances existing banner, maintains API ✅

---

## Open Questions

✅ All questions resolved during clarification phase (see spec.md Clarifications section)

---

**Research Status**: ✅ COMPLETE
**Ready for Phase 1**: YES
**Blockers**: NONE
