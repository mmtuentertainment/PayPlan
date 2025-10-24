# Tasks: Telemetry Banner Auto-Dismiss on Inactivity

**Feature**: 011-009-008-0020
**Input**: Design documents from `/home/matt/PROJECTS/PayPlan/specs/011-009-008-0020/`
**Prerequisites**: ✅ plan.md, ✅ research.md, ✅ data-model.md, ✅ contracts/, ✅ quickstart.md

---

## Execution Flow (main)

```text
1. Load plan.md from feature directory
   → ✅ Tech stack: TypeScript 5.6+, React 18.3+, Vitest
   → ✅ Structure: frontend/src/components/
2. Load optional design documents:
   → ✅ data-model.md: 5 entities (CountdownTimer, PauseState, etc.)
   → ✅ contracts/: TelemetryConsentBanner.contract.md
   → ✅ research.md: 6 technical decisions
3. Generate tasks by category:
   → Setup: Test file structure
   → Tests: 12 contract tests (TDD - MUST FAIL FIRST)
   → Core: Component implementation (countdown, pause, sync)
   → Integration: Cross-tab, accessibility validation
   → Polish: Performance tests, quickstart validation
4. Apply task rules:
   → Different test assertions = [P] parallel
   → Same component file = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T020)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contract assertions have tests
   → ✅ All entities have state management
   → ✅ All scenarios in quickstart covered
9. Return: SUCCESS (20 atomic tasks ready)
```

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different test files, independent assertions)
- All tasks include exact file paths
- Each task is atomic (5-15 min completion time)

---

## Path Conventions

**Project Structure**: Web app with `frontend/` and `api/`
**Modified Files**:
- Component: `frontend/src/components/TelemetryConsentBanner.tsx`
- Tests: `frontend/tests/integration/telemetry.test.tsx`

---

## Phase 3.1: Setup & Test Structure (5 min)

### T001: ✅ Verify existing test infrastructure
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Goal**: Confirm Vitest + @testing-library/react available, existing tests pass
**Actions**:
```bash
cd frontend
npm test telemetry
```
**Success**: Existing tests pass (Allow/Decline button tests)
**Dependencies**: None
**Estimated Time**: 2 min
**Status**: ✅ COMPLETE

---

## Phase 3.2: Tests First (TDD) ⚠️ CRITICAL

**RULE**: Write ALL tests in this phase BEFORE any implementation
**VERIFICATION**: Run `npm test` after Phase 3.2 → ALL new tests MUST FAIL

### Countdown Behavior Tests

#### T002: ✅ ✅ [P] Test countdown starts at 10 seconds
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown starts at 10 seconds on banner mount"`
**Assertion**: Countdown text shows "Auto-dismissing in 10s..."
**Why Atomic**: Single assertion, independent test
**Estimated Time**: 5 min

```typescript
it('countdown starts at 10 seconds on banner mount', () => {
  render(<TelemetryConsentBanner />);
  expect(screen.getByText(/Auto-dismissing in 10s/)).toBeInTheDocument();
});
```

#### T003: ✅ ✅ [P] Test countdown decrements every second
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown decrements by 1 every second"`
**Assertion**: After 1s → "9s", after 2s → "8s", after 3s → "7s"
**Tools**: `vi.useFakeTimers()`, `vi.advanceTimersByTime(1000)`
**Why Atomic**: Single behavior, uses fake timers
**Estimated Time**: 8 min

```typescript
it('countdown decrements by 1 every second', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(1000);
  expect(screen.getByText(/9s/)).toBeInTheDocument();

  vi.advanceTimersByTime(1000);
  expect(screen.getByText(/8s/)).toBeInTheDocument();

  vi.useRealTimers();
});
```

#### T004: ✅ ✅ [P] Test auto-dismiss at countdown=0
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"banner dismisses and sets opt_out when countdown reaches 0"`
**Assertion**: After 10s → banner hidden, localStorage = "opt_out"
**Why Atomic**: Single complete flow, uses fake timers
**Estimated Time**: 10 min

```typescript
it('banner dismisses and sets opt_out when countdown reaches 0', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(10000);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(localStorage.getItem('telemetry_consent')).toBe('opt_out');

  vi.useRealTimers();
});
```

### Pause Behavior Tests

#### T005: ✅ ✅ [P] Test countdown pauses on hover
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown pauses when user hovers over banner"`
**Assertion**: Hover at 7s → wait 3s → still shows 7s
**Tools**: `fireEvent.mouseEnter()`, `fireEvent.mouseLeave()`
**Why Atomic**: Single pause condition test
**Estimated Time**: 8 min

```typescript
it('countdown pauses when user hovers over banner', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(3000); // Now at 7s
  const banner = screen.getByRole('dialog');
  fireEvent.mouseEnter(banner);

  vi.advanceTimersByTime(3000);
  expect(screen.getByText(/7s/)).toBeInTheDocument(); // Still 7s

  vi.useRealTimers();
});
```

#### T006: ✅ ✅ [P] Test countdown resumes after hover leaves
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown resumes when hover ends"`
**Assertion**: Hover → mouseLeave → countdown continues from paused value
**Why Atomic**: Tests pause/resume cycle
**Estimated Time**: 10 min

```typescript
it('countdown resumes when hover ends', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(5000); // 5s elapsed, shows 5s
  const banner = screen.getByRole('dialog');
  fireEvent.mouseEnter(banner);
  vi.advanceTimersByTime(2000); // Paused, still 5s

  fireEvent.mouseLeave(banner);
  vi.advanceTimersByTime(1000);
  expect(screen.getByText(/4s/)).toBeInTheDocument(); // Resumed

  vi.useRealTimers();
});
```

#### T007: ✅ ✅ [P] Test countdown pauses on focus
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown pauses when element receives focus"`
**Assertion**: Tab to button → countdown stops
**Tools**: `fireEvent.focus()`
**Why Atomic**: Single focus pause test
**Estimated Time**: 8 min

```typescript
it('countdown pauses when element receives focus', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(4000); // 6s remaining
  const allowButton = screen.getByRole('button', { name: /Allow/ });
  fireEvent.focus(allowButton);

  vi.advanceTimersByTime(2000);
  expect(screen.getByText(/6s/)).toBeInTheDocument(); // Still 6s

  vi.useRealTimers();
});
```

#### T008: ✅ ✅ [P] Test pause on tab visibility change
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"countdown pauses when tab becomes hidden"`
**Assertion**: Simulate `document.hidden = true` → countdown stops
**Tools**: `Object.defineProperty(document, 'hidden', ...)`, `fireEvent(document, new Event('visibilitychange'))`
**Why Atomic**: Single visibility API test
**Estimated Time**: 12 min

```typescript
it('countdown pauses when tab becomes hidden', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(2000); // 8s remaining

  Object.defineProperty(document, 'hidden', { value: true, writable: true });
  fireEvent(document, new Event('visibilitychange'));

  vi.advanceTimersByTime(5000);
  expect(screen.getByText(/8s/)).toBeInTheDocument(); // Still 8s

  Object.defineProperty(document, 'hidden', { value: false, writable: true });
  vi.useRealTimers();
});
```

### Visual Indicator Tests

#### T009: ✅ ✅ [P] Test pause indicator appears
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"shows pause indicator when countdown is paused"`
**Assertion**: Hover → "Paused" text visible
**Why Atomic**: Single visual element test
**Estimated Time**: 6 min

```typescript
it('shows pause indicator when countdown is paused', () => {
  render(<TelemetryConsentBanner />);
  const banner = screen.getByRole('dialog');

  fireEvent.mouseEnter(banner);
  expect(screen.getByText(/Paused/)).toBeInTheDocument();
});
```

### Accessibility Tests

#### T010: ✅ ✅ [P] Test screen reader announcements at milestones
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"announces countdown at 10s, 5s, 0s only"`
**Assertion**: aria-live region updates at 10s, 5s, 0s (not 9s, 8s, 7s...)
**Why Atomic**: Single accessibility requirement
**Estimated Time**: 12 min

```typescript
it('announces countdown at 10s, 5s, 0s only', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  const liveRegion = screen.getByRole('status');

  // At 10s
  expect(liveRegion).toHaveTextContent(/10 seconds/);

  // At 9s - should NOT announce
  vi.advanceTimersByTime(1000);
  expect(liveRegion).toHaveTextContent(/10 seconds/); // Still old text

  // At 5s - SHOULD announce
  vi.advanceTimersByTime(4000);
  expect(liveRegion).toHaveTextContent(/5 seconds/);

  vi.useRealTimers();
});
```

#### T011: ✅ ✅ [P] Test auto-dismiss announcement
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"announces 'Analytics banner auto-dismissed' on timeout"`
**Assertion**: At countdown=0 → aria-live shows dismissal message
**Why Atomic**: Single announcement test
**Estimated Time**: 8 min

```typescript
it('announces auto-dismissed on timeout', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(10000);
  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toHaveTextContent(/auto-dismissed/i);

  vi.useRealTimers();
});
```

#### T012: ✅ ✅ [P] Test focus restoration after auto-dismiss
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"restores focus to previous element after auto-dismiss"`
**Assertion**: Focus input → banner appears → auto-dismiss → input focused again
**Why Atomic**: Single focus management test
**Estimated Time**: 10 min

```typescript
it('restores focus to previous element after auto-dismiss', () => {
  vi.useFakeTimers();
  const { container } = render(
    <div>
      <input data-testid="test-input" />
      <TelemetryConsentBanner />
    </div>
  );

  const input = screen.getByTestId('test-input');
  input.focus();
  expect(document.activeElement).toBe(input);

  vi.advanceTimersByTime(10000); // Auto-dismiss
  expect(document.activeElement).toBe(input); // Focus restored

  vi.useRealTimers();
});
```

### User Interaction Tests

#### T013: ✅ ✅ [P] Test user action cancels countdown
**File**: `frontend/tests/integration/telemetry.test.tsx`
**Test Name**: `"clicking Decline cancels countdown and dismisses banner"`
**Assertion**: At 7s → click Decline → banner hides immediately
**Why Atomic**: Single interaction test
**Estimated Time**: 8 min

```typescript
it('clicking Decline cancels countdown and dismisses banner', () => {
  vi.useFakeTimers();
  render(<TelemetryConsentBanner />);

  vi.advanceTimersByTime(3000); // At 7s
  const declineButton = screen.getByRole('button', { name: /Decline/ });
  fireEvent.click(declineButton);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(localStorage.getItem('telemetry_consent')).toBe('opt_out');

  vi.useRealTimers();
});
```

---

## **CHECKPOINT**: Verify All Tests Fail ⚠️

**STOP HERE** before proceeding to Phase 3.3

**Run**:
```bash
cd frontend
npm test telemetry
```

**Expected**: 12 new tests FAIL (T002-T013) with errors like:
- "Unable to find element with text: /Auto-dismissing in 10s/"
- "countdown" is not defined
- "Paused" text not found

**If any test passes**: Do NOT proceed - investigate why test is passing without implementation

---

## Phase 3.3: Core Implementation (60 min)

**Dependencies**: ALL Phase 3.2 tests must be written and failing

### T014: ✅ Add countdown state and timer logic
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Implement basic countdown (10 → 0) with setInterval
**Changes**:
- Add `const [countdown, setCountdown] = useState(10)`
- Add `useEffect` with `setInterval` to decrement countdown every 1s
- Add cleanup (`clearInterval`)
**Tests Fixed**: T002 (countdown starts), T003 (decrements)
**Estimated Time**: 10 min

**Implementation Guide**:
```typescript
const [countdown, setCountdown] = useState(10);

useEffect(() => {
  if (!visible) return;

  const intervalId = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 0) return 0;
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(intervalId);
}, [visible]);
```

### T015: ✅ Add auto-dismiss trigger at countdown=0
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Call handleDecline() when countdown reaches 0
**Changes**:
- Add `useEffect` that watches countdown
- When `countdown === 0`, call existing `handleDecline()`
**Tests Fixed**: T004 (auto-dismiss)
**Dependencies**: T014 (countdown state exists)
**Estimated Time**: 8 min

```typescript
useEffect(() => {
  if (countdown === 0 && visible) {
    handleDecline();
  }
}, [countdown, visible, handleDecline]);
```

### T016: ✅ Add pause state logic (hover, focus, tab)
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Track hover, focus, tab visibility → compute isPaused
**Changes**:
- Add `const [isHovered, setIsHovered] = useState(false)`
- Add `const [hasFocus, setHasFocus] = useState(false)`
- Add `const [isTabHidden, setTabHidden] = useState(false)`
- Add `const isPaused = isHovered || hasFocus || isTabHidden`
- Add `onMouseEnter={() => setIsHovered(true)}`
- Add `onMouseLeave={() => setIsHovered(false)}`
- Add `onFocus` handler for banner
- Add `visibilitychange` listener
**Tests Fixed**: T005 (pause on hover), T007 (pause on focus), T008 (pause on tab)
**Dependencies**: T014 (countdown exists)
**Estimated Time**: 15 min

**Implementation Guide**:
```typescript
const [isHovered, setIsHovered] = useState(false);
const [hasFocus, setHasFocus] = useState(false);
const [isTabHidden, setTabHidden] = useState(false);
const isPaused = isHovered || hasFocus || isTabHidden;

// Pause timer when isPaused
useEffect(() => {
  if (isPaused || !visible) return;

  const intervalId = setInterval(() => {
    setCountdown((prev) => prev > 0 ? prev - 1 : 0);
  }, 1000);

  return () => clearInterval(intervalId);
}, [isPaused, visible]);

// Visibility API
useEffect(() => {
  const handleVisibilityChange = () => {
    setTabHidden(document.hidden);
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### T017: ✅ Add countdown resume logic
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Ensure countdown resumes when pause conditions clear
**Changes**: Verify timer restarts when `isPaused` becomes false
**Tests Fixed**: T006 (resume after hover)
**Dependencies**: T016 (pause logic exists)
**Estimated Time**: 5 min

**Note**: This should work automatically from T016's `useEffect` dependency on `isPaused`

### T018: ✅ Add visual pause indicator
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Show "Paused" text when isPaused=true
**Changes**: Conditional rendering in countdown display area
**Tests Fixed**: T009 (pause indicator)
**Dependencies**: T016 (isPaused computed)
**Estimated Time**: 8 min

```typescript
{isPaused ? (
  <span className="text-sm text-blue-800">Paused</span>
) : (
  <span className="text-sm text-blue-800">
    Auto-dismissing in {countdown}s...
  </span>
)}
```

### T019: ✅ Add selective screen reader announcements
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Announce at 10s, 5s, 0s only (not every second)
**Changes**:
- Add `useEffect` watching countdown
- When countdown is 10, 5, or 0 → update `announcementText`
- On auto-dismiss → set "Analytics banner auto-dismissed"
**Tests Fixed**: T010 (milestone announcements), T011 (auto-dismiss announcement)
**Dependencies**: T014 (countdown state)
**Estimated Time**: 10 min

```typescript
useEffect(() => {
  if ([10, 5, 0].includes(countdown)) {
    setAnnouncementText(`Auto-dismissing in ${countdown} seconds`);
  }
}, [countdown]);

// In auto-dismiss handler
const handleAutoDismiss = useCallback(() => {
  setAnnouncementText("Analytics banner auto-dismissed");
  setConsent("opt_out");
  setTimeout(() => setVisible(false), 1500);
}, []);
```

### T020: ✅ Add focus restoration on auto-dismiss
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Save previous focus on mount, restore on auto-dismiss
**Changes**:
- Add `const previousFocusRef = useRef<HTMLElement | null>(null)`
- On mount → `previousFocusRef.current = document.activeElement as HTMLElement`
- On auto-dismiss → `previousFocusRef.current?.focus()`
**Tests Fixed**: T012 (focus restoration)
**Dependencies**: T015 (auto-dismiss trigger)
**Estimated Time**: 8 min

```typescript
const previousFocusRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (visible) {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }
}, [visible]);

const handleAutoDismiss = useCallback(() => {
  setAnnouncementText("Analytics banner auto-dismissed");
  setConsent("opt_out");
  setTimeout(() => {
    setVisible(false);
    previousFocusRef.current?.focus();
  }, 1500);
}, []);
```

---

## **CHECKPOINT**: Verify All Tests Pass ✅

**Run**:
```bash
cd frontend
npm test telemetry
```

**Expected**: All 12 new tests (T002-T013) now PASS
**If any fail**: Debug implementation before proceeding

---

## Phase 3.4: Integration & Polish (20 min)

### T021: ✅ [P] Run manual quickstart validation
**File**: `specs/011-009-008-0020/quickstart.md`
**Goal**: Execute all 10 manual test scenarios
**Actions**: Follow quickstart.md step-by-step
**Success**: All scenarios pass (basic auto-dismiss, pause, cross-tab, etc.)
**Dependencies**: T014-T020 (implementation complete)
**Estimated Time**: 15 min

**Scenarios to Validate**:
1. Basic auto-dismiss (10s countdown)
2. Pause on hover
3. Pause on focus
4. Pause on tab switch
5. Cross-tab sync (open 2 tabs, click Allow in one)
6. Screen reader announcements (with NVDA/VoiceOver if available)
7. User override (click Decline early)
8. Escape key
9. Focus restoration
10. Reduced motion (if OS setting available)

### T022: ✅ [P] Verify LOC budget
**File**: `frontend/src/components/TelemetryConsentBanner.tsx`
**Goal**: Confirm ≤60 LOC added (excluding tests)
**Action**: Count net lines added (additions - deletions)
**Success**: LOC <= 60
**Estimated Time**: 2 min

```bash
git diff main frontend/src/components/TelemetryConsentBanner.tsx | grep -E '^\+' | wc -l
# Should be <= 60 (excluding test file)
```

### T023: ✅ [P] Run full test suite with coverage
**File**: All tests
**Goal**: Verify >80% coverage for TelemetryConsentBanner.tsx
**Actions**:
```bash
cd frontend
npm test -- --coverage
```
**Success**: Coverage ≥80%
**Dependencies**: T014-T020 (implementation)
**Estimated Time**: 3 min

---

## Dependencies Graph

```
T001 (setup)
  ↓
T002-T013 (tests - parallel, all must fail)
  ↓
T014 (countdown state) ──→ T015 (auto-dismiss)
  ↓                            ↓
T016 (pause logic) ──→ T017 (resume) ──→ T020 (focus restore)
  ↓                                        ↓
T018 (pause UI)                           T021 (quickstart)
  ↓                                        ↓
T019 (announcements) ────────────────────→ T022 (LOC check)
                                           ↓
                                       T023 (coverage)
```

---

## Parallel Execution Examples

### Phase 3.2: All Tests (Parallel)
```bash
# Write T002-T013 together (different test names, no conflicts)
```

### Phase 3.4: Validation (Parallel)
```bash
# Run T021, T022, T023 together (independent validations)
```

---

## Task Summary

**Total Tasks**: 23
**Setup**: 1 task (T001)
**Tests**: 12 tasks (T002-T013) - All marked [P]
**Implementation**: 7 tasks (T014-T020) - Sequential
**Validation**: 3 tasks (T021-T023) - All marked [P]

**Parallel Tasks**: 15 (T002-T013, T021-T023)
**Sequential Tasks**: 8 (T001, T014-T020)

**Estimated Total Time**: 2.5-3 hours

**Atomic Task Sizes**:
- Smallest: 2 min (T001, T022)
- Largest: 15 min (T016, T021)
- Average: 8 min

---

## Validation Checklist

- [x] All contract assertions have tests (T002-T013)
- [x] All entities have state management (CountdownTimer, PauseState, etc.)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent ([P] = different test names)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (tests use different test names)
- [x] Tasks are atomic (5-15 min each)
- [x] TDD flow enforced (write tests → fail → implement → pass)

---

## Notes

**TDD Critical Path**:
1. Write ALL tests T002-T013 first
2. Verify ALL fail
3. Implement T014-T020 to make tests pass
4. Verify ALL pass
5. Validate with quickstart

**Commit Strategy**:
- After T001: "test: add countdown test structure"
- After T002-T013: "test: add auto-dismiss countdown tests (12 tests, all failing)"
- After T014: "feat: add countdown timer state"
- After T015: "feat: add auto-dismiss trigger"
- After T016-T017: "feat: add pause/resume logic"
- After T018: "feat: add pause indicator UI"
- After T019: "feat: add screen reader milestone announcements"
- After T020: "feat: add focus restoration"
- After T021-T023: "test: validate quickstart scenarios and coverage"

**Avoid**:
- ❌ Implementing before writing tests
- ❌ Vague tasks like "add functionality"
- ❌ Large tasks (>15 min)
- ❌ Modifying same code in parallel tasks

---

**Tasks Status**: ✅ READY FOR EXECUTION
**Last Updated**: 2025-10-10
**Total Estimated Time**: 2.5-3 hours
