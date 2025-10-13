# Feature Specification: Telemetry Banner Auto-Dismiss on Inactivity

**Feature Branch**: `011-009-008-0020`
**Created**: 2025-10-10
**Status**: Draft
**Input**: User description: "Feature 009-008-0020-4: Telemetry Banner Auto-Dismiss on Inactivity"

## Execution Flow (main)

```text
1. Parse user description from Input
   → Feature involves auto-dismiss behavior for consent banner
2. Extract key concepts from description
   → Actors: users with screen readers, keyboard users, mouse users
   → Actions: view banner, interact with banner, wait for timeout
   → Data: consent state ("opt_out")
   → Constraints: privacy-safe default, accessibility requirements
3. For each unclear aspect:
   → All aspects specified in input
4. Fill User Scenarios & Testing section
   → Multiple user flows identified
5. Generate Functional Requirements
   → 14 testable requirements extracted
6. Identify Key Entities (if data involved)
   → Consent state entity
7. Run Review Checklist
   → No implementation details in spec
   → All requirements testable
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-10

- Q: When the countdown timer is paused (user hovering/focused), should the pause state be visually indicated to the user? → A: Yes - Show visual indicator (e.g., pause icon, text change to "Paused") (WCAG 2.2.2 best practice: visual + text feedback reduces cognitive load, color+icon prevents accessibility issues)
- Q: If a user opens multiple tabs/windows of the application, should the consent decision from one tab affect the banner in other open tabs? → A: Yes - Consent syncs across tabs immediately via storage event (industry best practice for privacy compliance)
- Q: When the banner auto-dismisses (fade-out animation), what should be the duration of the dismissal animation? → A: 200-250ms (industry standard for exit animations, with prefers-reduced-motion support)
- Q: Should the countdown continue when the user switches to a different browser tab (PayPlan tab loses focus but stays open)? → A: No - Countdown pauses when tab loses focus, resumes when tab regains focus (WCAG 2.2.1 compliance, aligns with Page Visibility API best practice)
- Q: Should screen readers announce when the countdown is paused (due to hover/focus/tab switch)? → A: No - Only announce countdown milestones at 10s, 5s, 0s (ARIA timer role best practice: prevent announcement fatigue, implicit aria-live="off")

---

## User Scenarios & Testing

### Primary User Story

As a user viewing the PayPlan application for the first time, I see a telemetry consent banner that automatically dismisses after 10 seconds if I don't interact with it. The banner shows a countdown so I know when it will disappear. If I'm reading the banner (hovering with mouse or navigating with keyboard), the countdown pauses to give me time. When it dismisses, my preference is recorded as declining analytics, and I can change this later if I want.

### Acceptance Scenarios

1. **Given** banner is displayed with no user interaction, **When** 10 seconds elapse, **Then** banner disappears and consent is set to "opt_out"
2. **Given** banner is displayed showing countdown, **When** user hovers mouse over banner, **Then** countdown pauses, visual pause indicator appears, and countdown resumes when mouse leaves
3. **Given** banner is displayed showing countdown, **When** user focuses on banner with keyboard, **Then** countdown pauses and resumes when focus leaves
4. **Given** banner has auto-dismissed setting consent to "opt_out", **When** user reloads page, **Then** banner appears again (consent state reset to "unset")
5. **Given** banner countdown reaches zero, **When** banner dismisses, **Then** screen reader announces "Analytics banner auto-dismissed"
6. **Given** banner is displayed with countdown at 10 seconds, **When** 1 second elapses, **Then** countdown text updates to "9 seconds" (and continues updating each second)
7. **Given** banner countdown is at 10, 5, or 0 seconds, **When** countdown updates, **Then** screen reader announces the time remaining (but not for intermediate seconds)
8. **Given** banner auto-dismisses, **When** focus returns to page, **Then** focus is restored to the element that had focus before banner appeared
9. **Given** banner is displayed, **When** user clicks Allow or Decline button before timeout, **Then** countdown stops and normal consent flow proceeds

### Edge Cases

- What happens when user hovers briefly (< 1 second) then leaves? Countdown resumes from where it paused.
- How does system handle rapid focus/blur events? Each pause/resume event is handled independently.
- What if page unmounts before timeout? Timer is cleared, no consent change recorded.
- What if user tabs through banner buttons without stopping? Countdown pauses while any element in banner has focus.
- What if countdown is at 1 second and user hovers? Countdown pauses at 1 second until hover ends.
- What if user makes consent decision in one tab while banner is visible in another tab? Banner in other tabs immediately dismisses and honors the consent decision from the first tab.
- What if user switches to a different browser tab while countdown is at 5 seconds? Countdown pauses at 5 seconds and resumes when user returns to the tab.

## Requirements

### Functional Requirements

**Auto-Dismiss Behavior:**

- **FR-014.1**: Banner MUST automatically dismiss after 10 seconds of continuous inactivity
- **FR-014.2**: System MUST set consent to "opt_out" when banner auto-dismisses
- **FR-014.3**: System MUST restore keyboard focus to previously focused element after auto-dismiss
- **FR-014.4**: Banner dismissal animation MUST complete within 200-250ms
- **FR-014.5**: System MUST respect user's prefers-reduced-motion setting by disabling or simplifying animations

**Countdown Display:**

- **FR-015.1**: Banner MUST display countdown text showing remaining seconds (format: "Auto-dismissing in Xs...")
- **FR-015.2**: Countdown text MUST update every second
- **FR-015.3**: Countdown MUST pause when user hovers mouse pointer over banner
- **FR-015.4**: Countdown MUST pause when any element within banner receives keyboard focus
- **FR-015.5**: Countdown MUST resume when mouse leaves banner and no element has focus
- **FR-015.6**: Banner MUST show visual indicator when countdown is paused (e.g., pause icon or text change to "Paused")
- **FR-015.7**: Countdown MUST pause when browser tab becomes inactive/hidden and resume when tab becomes active/visible again

**Accessibility Announcements:**

- **FR-016.1**: System MUST announce "Analytics banner auto-dismissed" to screen readers when timeout occurs
- **FR-016.2**: Screen reader MUST receive countdown announcements at 10, 5, and 0 seconds only (not every second)
- **FR-016.3**: Countdown text shown visually MUST update every second while screen reader version updates only at 10s, 5s, 0s
- **FR-016.4**: System MUST NOT announce pause/resume events to screen readers (prevents announcement fatigue, countdown text remains accessible for manual checking)

**Reversibility and State:**

- **FR-017.1**: Banner MUST reappear on subsequent page loads after auto-dismiss
- **FR-017.2**: System MUST store "opt_out" consent state (not a separate "dismissed" state)
- **FR-017.3**: System MUST NOT create additional storage keys for auto-dismiss tracking
- **FR-017.4**: System MUST synchronize consent state across all open tabs/windows immediately when consent changes in any tab

**Interaction Priority:**

- **FR-018.1**: User explicit action (Allow/Decline/Escape) MUST cancel countdown and take precedence over auto-dismiss
- **FR-018.2**: System MUST clear all timers when banner is unmounted for any reason

### Key Entities

- **Consent State**: Represents user's telemetry preference with values "unset", "opt_in", or "opt_out". Auto-dismiss sets to "opt_out" (privacy-safe default). State resets to "unset" on page reload.

- **Countdown Timer**: Represents remaining time before auto-dismiss, ranging from 10 seconds to 0. Affected by user interactions (hover/focus) which pause the timer.

- **Focus Context**: Represents the previously focused element before banner appeared, used to restore keyboard navigation after auto-dismiss.

---

## Review & Acceptance Checklist

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Dependencies and Assumptions

**Dependencies:**

- Feature 009-008-0020-3: ARIA live announcements (reuses existing aria-live region)
- Feature 008-0020-3: Base telemetry consent banner

**Assumptions:**

- 10-second timeout is sufficient for users to read banner content
- "opt_out" is appropriate privacy-safe default for auto-dismiss
- Banner reappearing on page reload is acceptable UX (user can make explicit choice later)
- Hover and focus are sufficient indicators of "user is reading"

**Constraints:**

- Budget: Maximum 2 files modified, 60 lines of code implementation
- Accessibility: Must meet WCAG 2.1 AA standards for Timing Adjustable (SC 2.2.1) and Status Messages (SC 4.1.3)
- Privacy: Must never auto-opt-in to analytics
- No new dependencies: Use standard browser APIs and existing libraries

**Out of Scope:**

- Configurable timeout duration
- Explicit "Snooze" button
- Persistent dismissal across sessions
- Telemetry tracking of dismissal reason
