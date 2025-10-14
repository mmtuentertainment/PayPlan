# Tasks: User Preference Management System

**Input**: Design documents from `/specs/012-user-preference-management/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md (all exist)
**Feature**: 012-user-preference-management
**Branch**: `012-user-preference-management`

---

## Execution Flow (main)

```text
1. Load plan.md from feature directory
   ✓ Tech stack: TypeScript 5.8.3, React 19.1.1, Zod 4.1, luxon 3.7
   ✓ Structure: frontend/src/ (web app, frontend-only feature)
2. Load optional design documents:
   ✓ data-model.md: 5 entities + 4 payday patterns extracted
   ✓ contracts/: 3 contract files → 3 contract test suites
   ✓ research.md: 5 decisions (localStorage, useSyncExternalStore, ARIA, patterns, debouncing)
   ✓ quickstart.md: 8 manual test scenarios
3. Generate tasks by category:
   ✓ Setup: 3 tasks (types, constants, Zod schemas)
   ✓ Tests: 15 contract tests + 8 integration tests (TDD)
   ✓ Core: 8 implementation tasks (storage, validation, hooks, components)
   ✓ Integration: 5 tasks (cross-tab, performance, accessibility)
   ✓ Polish: 3 tasks (cleanup, docs, quickstart validation)
4. Apply task rules:
   ✓ Different files = [P] parallel
   ✓ Same file = sequential
   ✓ Tests before implementation (TDD)
5. Number tasks sequentially (T001-T037)
6. Generate dependency graph (below)
7. Create parallel execution examples (below)
8. Validate task completeness:
   ✓ All 3 contracts have test suites
   ✓ All 5 entities have model/validation tasks
   ✓ All 4 UI components have test + impl tasks
9. Return: SUCCESS (37 atomic tasks ready)
```

---

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root
- Each task is atomic (15-45 minutes max)

---

## Path Conventions

**Structure**: Web app (frontend-only feature)
- Frontend source: `frontend/src/`
- Frontend tests: `frontend/tests/`
- Preference files: `frontend/src/lib/preferences/`, `frontend/src/hooks/`, `frontend/src/components/preferences/`

---

## Phase 3.1: Setup & Foundation

### T001 [P] Create TypeScript types and constants

**File**: `frontend/src/lib/preferences/types.ts`

**Description**: Define all TypeScript types from data-model.md:
- `PreferenceCategory` enum (5 values)
- `UserPreference<T>` interface
- `PreferenceCollection` interface
- `CategoryValue` discriminated union (5 types)
- `PaydayPattern` discriminated union (4 pattern types)
- `StorageError` type with 5 error variants
- `ValidationError` type

**Research Reference**: research.md Section 2 (React 19 patterns)

**Success Criteria**:
- All types match data-model.md specifications
- No TypeScript compilation errors
- Exports all types for use in other files

**Dependencies**: None (can start immediately)

---

### T002 [P] Create preference constants and defaults

**File**: `frontend/src/lib/preferences/constants.ts`

**Description**: Define constants from data-model.md and research.md:
- `STORAGE_KEY = 'payplan_preferences_v1'` (research.md Section 1)
- `STORAGE_LIMIT_BYTES = 5120` (5KB from FR-014)
- `DEBOUNCE_DELAY_MS = 300` (research.md Section 5)
- `TOAST_DURATION_MS = 3000` (clarification Q4)
- `RESTORATION_TARGET_MS = 100` (NFR-001, clarification Q3)
- `DEFAULT_PREFERENCES` object with all 5 category defaults (data-model.md Application Defaults section)

**Success Criteria**:
- All constants typed correctly
- Default preferences match data-model.md specification
- Exported for use across preference modules

**Dependencies**: T001 (types)

---

### T003 [P] Create Zod validation schemas

**File**: `frontend/src/lib/preferences/validation.ts`

**Description**: Implement all Zod schemas from data-model.md Validation Schemas section:
- `timezoneSchema` with luxon validation
- `paydayPatternSchema` (4 pattern variants with discriminated union)
- `businessDaySettingsSchema`
- `currencyFormatSchema` with separator validation
- `localeSchema` (BCP 47 regex)
- `userPreferenceSchema`
- `preferenceCollectionSchema` with 5KB size validation

**Research Reference**: research.md Section 4 (payday patterns), Section 1 (storage limits)

**Success Criteria**:
- All schemas compile without errors
- Each schema exported individually
- Schemas match exact validation rules from data-model.md

**Dependencies**: T001 (types), T002 (constants for STORAGE_LIMIT_BYTES)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation in Phase 3.3**

### PreferenceStorageService Contract Tests

#### T004 [P] Contract test: savePreference happy path

**File**: `frontend/tests/unit/preferences/storage-save.test.ts`

**Description**: Write contract tests for `savePreference()` from PreferenceStorageService.contract.md:
- Test 1: Save preference with optInStatus=true → verify localStorage updated
- Test 2: Save preference with optInStatus=false → verify NOT persisted
- Test 3: Update existing preference → verify no duplication
- Test 4: Verify timestamp updated on save

**Contract Reference**: PreferenceStorageService.contract.md lines 50-90

**Success Criteria**:
- 4 test cases written
- Tests use vitest + @testing-library
- All tests FAIL (no implementation exists yet)
- Tests validate localStorage state after each operation

**Dependencies**: T001-T003 (types, constants, schemas)

---

#### T005 [P] Contract test: savePreference error handling

**File**: `frontend/tests/unit/preferences/storage-errors.test.ts`

**Description**: Write error handling tests for `savePreference()`:
- Test 1: Preference exceeding 5KB → QuotaExceededError
- Test 2: localStorage SecurityError (mock blocked storage) → SecurityError
- Test 3: Invalid JSON serialization → SerializationError

**Contract Reference**: PreferenceStorageService.contract.md lines 50-90

**Research Reference**: research.md Section 1 (localStorage error handling)

**Success Criteria**:
- 3 error test cases
- Mock localStorage.setItem to throw errors
- Tests verify error types and messages
- All tests FAIL initially

**Dependencies**: T001-T003

---

#### T006 [P] Contract test: loadPreferences

**File**: `frontend/tests/unit/preferences/storage-load.test.ts`

**Description**: Write contract tests for `loadPreferences()`:
- Test 1: No preferences saved → return null
- Test 2: Valid preferences → deserialize and return PreferenceCollection
- Test 3: Corrupted JSON → DeserializationError
- Test 4: Invalid preference (bad timezone) → remove invalid, keep valid preferences
- Test 5: Verify Map deserialization from object

**Contract Reference**: PreferenceStorageService.contract.md lines 120-180

**Success Criteria**:
- 5 test cases
- Tests validate partial recovery for invalid data
- All tests FAIL initially

**Dependencies**: T001-T003

---

#### T007 [P] Contract test: resetAllPreferences and getStorageSize

**File**: `frontend/tests/unit/preferences/storage-util.test.ts`

**Description**: Write contract tests for utility methods:
- `resetAllPreferences()`: Test 1: Removes localStorage key, Test 2: Succeeds when no data exists
- `getStorageSize()`: Test 1: Returns 0 when empty, Test 2: Calculates accurate byte size
- `subscribeToChanges()`: Test 1: Calls callback on storage event, Test 2: Filters other keys, Test 3: Unsubscribe stops callbacks

**Contract Reference**: PreferenceStorageService.contract.md lines 200-330

**Research Reference**: research.md Section 2 (useSyncExternalStore for cross-tab sync)

**Success Criteria**:
- 7 test cases total
- Tests mock StorageEvent for cross-tab simulation
- All tests FAIL initially

**Dependencies**: T001-T003

---

### PreferenceValidationService Contract Tests

#### T008 [P] Contract test: validatePreferenceValue

**File**: `frontend/tests/unit/preferences/validation.test.ts`

**Description**: Write contract tests for validation:
- Test 1: Valid timezone ("America/New_York") → success
- Test 2: Invalid timezone ("InvalidTZ") → ValidationError
- Test 3: Valid biweekly payday pattern → success
- Test 4: Biweekly pattern with mismatched dayOfWeek → ValidationError
- Test 5: Valid specific dates [1, 15] → success
- Test 6: Invalid date [32] → ValidationError
- Test 7: Valid currency format → success
- Test 8: Same decimal/thousands separator → ValidationError

**Contract Reference**: PreferenceValidationService.contract.md lines 20-60

**Success Criteria**:
- 8 test cases covering all 5 preference categories
- Tests use Zod schemas from T003
- All tests FAIL initially

**Dependencies**: T001-T003 (schemas must exist to test against)

---

#### T009 [P] Contract test: validateStorageSize and validatePaydayPattern

**File**: `frontend/tests/unit/preferences/validation-quota.test.ts`

**Description**: Write quota and pattern-specific validation tests:
- `validateStorageSize()`: Test 1: 500 bytes → pass, Test 2: 6KB → QuotaError
- `validatePaydayPattern()`: Test 1: All 4 pattern types valid, Test 2: Invalid days, Test 3: February 31st handling

**Contract Reference**: PreferenceValidationService.contract.md lines 70-110

**Research Reference**: research.md Section 4 (payroll patterns), Section 1 (5KB limit)

**Success Criteria**:
- 6 test cases
- Tests calculate Blob size for storage validation
- All tests FAIL initially

**Dependencies**: T001-T003

---

### UI Component Contract Tests

#### T010 [P] Contract test: PreferenceToggle component

**File**: `frontend/tests/unit/preferences/PreferenceToggle.test.tsx`

**Description**: Write component tests for `<PreferenceToggle />`:
- Test 1: Renders checkbox with aria-label containing category name
- Test 2: onChange called with true when toggled on
- Test 3: onChange called with false when toggled off
- Test 4: Keyboard accessible (Space key toggles)
- Test 5: Disabled prop prevents interaction

**Contract Reference**: PreferenceUIComponents.contract.md lines 20-60

**Research Reference**: research.md Section 3 (WCAG 2.1 AA keyboard accessibility)

**Success Criteria**:
- 5 test cases
- Uses @testing-library/react and @testing-library/user-event
- Tests verify ARIA attributes
- All tests FAIL initially

**Dependencies**: T001-T003

---

#### T011 [P] Contract test: ToastNotification component

**File**: `frontend/tests/unit/preferences/ToastNotification.test.tsx`

**Description**: Write component tests for `<ToastNotification />`:
- Test 1: Renders with role="status" and aria-live="polite" for success
- Test 2: Renders with role="alert" and aria-live="assertive" for error
- Test 3: aria-atomic="true" present
- Test 4: Auto-dismisses after duration (mock timers)
- Test 5: Dismisses on Escape key
- Test 6: Dismiss button has aria-label

**Contract Reference**: PreferenceUIComponents.contract.md lines 65-120

**Research Reference**: research.md Section 3 (ARIA live regions)

**Success Criteria**:
- 6 test cases
- Tests verify WCAG 2.1 AA compliance
- All tests FAIL initially

**Dependencies**: T001-T003

---

#### T012 [P] Contract test: PreferenceSettings component

**File**: `frontend/tests/unit/preferences/PreferenceSettings.test.tsx`

**Description**: Write component tests for `<PreferenceSettings />`:
- Test 1: Renders all 5 preference categories
- Test 2: Reset All button present and clickable
- Test 3: Confirmation dialog appears on reset
- Test 4: Proper heading hierarchy (h2, h3) for accessibility
- Test 5: Form labels associated with inputs

**Contract Reference**: PreferenceUIComponents.contract.md lines 125-165

**Success Criteria**:
- 5 test cases
- Tests verify accessibility (headings, labels)
- All tests FAIL initially

**Dependencies**: T001-T003

---

#### T013 [P] Contract test: InlineStatusIndicator component

**File**: `frontend/tests/unit/preferences/InlineStatusIndicator.test.tsx`

**Description**: Write component tests for `<InlineStatusIndicator />`:
- Test 1: Shows indicator with aria-label when restored=true
- Test 2: Does not render when restored=false
- Test 3: aria-label includes category name

**Contract Reference**: PreferenceUIComponents.contract.md lines 170-195

**Success Criteria**:
- 3 test cases
- Tests verify conditional rendering
- All tests FAIL initially

**Dependencies**: T001-T003

---

### Integration Tests from Quickstart Scenarios

#### T014 [P] Integration test: Save and restore timezone (Scenario 1)

**File**: `frontend/tests/integration/preferences/save-restore.test.ts`

**Description**: Implement quickstart.md Scenario 1 as automated test:
- Step 1: Configure timezone to "America/New_York" with opt-in enabled
- Step 2: Verify localStorage contains preference
- Step 3: Clear React state (simulate new session)
- Step 4: Reload preferences → verify timezone restored
- Step 5: Verify restoration completes in <100ms (performance assertion)

**Quickstart Reference**: quickstart.md Scenario 1

**Research Reference**: research.md Section 5 (performance targets)

**Success Criteria**:
- Full user flow automated
- Performance assertion for NFR-001
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T015 [P] Integration test: Reset all preferences (Scenario 2)

**File**: `frontend/tests/integration/preferences/reset-all.test.ts`

**Description**: Implement quickstart.md Scenario 2:
- Setup: Save timezone + payday dates with opt-in
- Action: Click "Reset All" button
- Verify: localStorage key removed, UI shows defaults, no restore indicators

**Quickstart Reference**: quickstart.md Scenario 2

**Success Criteria**:
- Test full reset workflow
- Verify UI state after reset
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T016 [P] Integration test: Selective opt-out (Scenario 3)

**File**: `frontend/tests/integration/preferences/opt-out.test.ts`

**Description**: Implement quickstart.md Scenario 3:
- Setup: Save timezone + currency with opt-in
- Action: Disable timezone opt-in toggle
- Verify: Only currency persists in localStorage
- Action: Reload
- Verify: Currency restored, timezone uses default

**Quickstart Reference**: quickstart.md Scenario 3

**Success Criteria**:
- Test selective persistence
- Verify independent category management
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T017 [P] Integration test: Storage quota exceeded (Scenario 5)

**File**: `frontend/tests/integration/preferences/quota-exceeded.test.ts`

**Description**: Implement quickstart.md Scenario 5:
- Attempt to save preference data totaling >5KB
- Verify: QuotaExceededError thrown
- Verify: Error toast displays "5KB limit exceeded"
- Verify: Preferences revert to defaults (fallback behavior)

**Quickstart Reference**: quickstart.md Scenario 5

**Success Criteria**:
- Test 5KB limit enforcement (FR-014)
- Verify error UX
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T018 [P] Integration test: Corrupted data recovery (Scenario 6)

**File**: `frontend/tests/integration/preferences/corrupted-data.test.ts`

**Description**: Implement quickstart.md Scenario 6:
- Setup: Inject corrupted JSON into localStorage
- Action: Reload application
- Verify: App doesn't crash
- Verify: Error toast displays "Preferences could not be loaded"
- Verify: Defaults restored

**Quickstart Reference**: quickstart.md Scenario 6

**Research Reference**: research.md Section 1 (error handling)

**Success Criteria**:
- Test graceful degradation (FR-009)
- Verify no application crash
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T019 [P] Integration test: Cross-tab synchronization

**File**: `frontend/tests/integration/preferences/cross-tab-sync.test.ts`

**Description**: Test storage event synchronization:
- Open two simulated "tabs" (two component instances)
- Change preference in tab 1
- Verify: Tab 2 receives storage event and updates state
- Verify: Both tabs show same preference value

**Research Reference**: research.md Section 2 (useSyncExternalStore, storage events)

**Success Criteria**:
- Test cross-tab sync mechanism
- Mock storage events
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T020 [P] Integration test: Performance - <100ms restoration

**File**: `frontend/tests/integration/preferences/performance.test.ts`

**Description**: Implement quickstart.md Scenario 8:
- Save all 5 preference categories
- Use performance.mark() to measure restoration time
- Verify: Time from localStorage.getItem to UI render <100ms

**Quickstart Reference**: quickstart.md Scenario 8

**Research Reference**: research.md Section 5 (RAIL model, <100ms target)

**Success Criteria**:
- Automated performance test for NFR-001
- Assertion fails if >100ms
- Test FAILS initially

**Dependencies**: T001-T003

---

#### T021 [P] Integration test: Accessibility - keyboard navigation

**File**: `frontend/tests/integration/preferences/accessibility-keyboard.test.ts`

**Description**: Implement quickstart.md Scenario 7 (keyboard part):
- Tab through all preference controls
- Verify: All controls focusable
- Press Space on opt-in toggle → verify state change
- Press Escape on toast → verify dismissal
- Verify: No keyboard traps

**Quickstart Reference**: quickstart.md Scenario 7

**Research Reference**: research.md Section 3 (WCAG 2.1 keyboard accessibility)

**Success Criteria**:
- Test full keyboard workflow
- Verify WCAG 2.1 AA compliance (NFR-003)
- Test FAILS initially

**Dependencies**: T001-T003

---

## Phase 3.3: Core Implementation (ONLY after all tests are failing)

**Prerequisites**: ALL tests in T004-T021 must be written and failing

### Storage Layer Implementation

#### T022 Implement localStorage storage service

**File**: `frontend/src/lib/preferences/storage.ts`

**Description**: Implement all 5 methods from PreferenceStorageService contract:
- `savePreference()`: With debouncing (300ms from research.md Section 5), optInStatus check, size validation
- `loadPreferences()`: With Map deserialization, validation, partial recovery for invalid data
- `resetAllPreferences()`: Clear localStorage key
- `getStorageSize()`: Calculate Blob size
- `subscribeToChanges()`: Setup storage event listener for cross-tab sync

**Contract Reference**: PreferenceStorageService.contract.md (all sections)

**Research Reference**:
- Section 1: localStorage patterns, error handling
- Section 2: useSyncExternalStore for cross-tab sync
- Section 5: Debouncing patterns

**Success Criteria**:
- All contract tests (T004-T007) PASS
- Error handling for SecurityError, QuotaExceededError
- Debounced writes with flush on beforeunload

**Dependencies**: T001-T007 (tests must fail first)

---

#### T023 Implement preference validation service

**File**: `frontend/src/lib/preferences/validation.ts` (extend existing Zod schemas)

**Description**: Implement validation functions from PreferenceValidationService contract:
- `validatePreferenceValue()`: Category-specific validation using Zod schemas
- `validateStorageSize()`: Check <5KB limit with Blob calculation
- `validatePaydayPattern()`: Deep validation with luxon for date checks

**Contract Reference**: PreferenceValidationService.contract.md

**Research Reference**:
- Section 1: Storage limits
- Section 4: Payday pattern validation rules

**Success Criteria**:
- All validation tests (T008-T009) PASS
- Integration with existing Zod schemas from T003
- Luxon validation for dates

**Dependencies**: T003 (Zod schemas), T008-T009 (tests must fail first)

---

### React Hooks Implementation

#### T024 Implement useLocalStorage hook

**File**: `frontend/src/hooks/useLocalStorage.ts`

**Description**: Create custom hook using useSyncExternalStore pattern from research.md Section 2:
- Use `useSyncExternalStore` for external store management
- Subscribe to `storage` events for cross-tab sync
- Lazy initialization with useState
- Return [state, setState, error] tuple

**Research Reference**: research.md Section 2 (exact pattern provided)

**Success Criteria**:
- Hook uses useSyncExternalStore (React 19 recommended pattern)
- Cross-tab synchronization works
- Integration tests T019 PASS

**Dependencies**: T022 (storage service), T019 (cross-tab test must fail first)

---

#### T025 Implement usePreferences hook

**File**: `frontend/src/hooks/usePreferences.ts`

**Description**: Create main preference management hook:
- Use useLocalStorage for persistence
- Expose `savePreference`, `resetAll`, `getPreference`, `preferences` state
- Debounce save operations (300ms from research.md)
- Memoize with useCallback and useMemo
- Track opt-in status per category

**Research Reference**: research.md Section 2 (hooks patterns), Section 5 (debouncing)

**Success Criteria**:
- Integration tests T014-T016 PASS
- Performance test T020 PASS (<100ms restoration)
- Proper React 19 patterns

**Dependencies**: T024 (useLocalStorage), T014-T016, T020 (tests must fail first)

---

### UI Components Implementation

#### T026 Implement PreferenceToggle component

**File**: `frontend/src/components/preferences/PreferenceToggle.tsx`

**Description**: Implement inline opt-in/opt-out checkbox:
- Render checkbox with category-specific aria-label
- Call onChange on toggle
- Keyboard accessible (Space/Enter)
- Use @radix-ui/react-checkbox for base component
- Disabled state support

**Contract Reference**: PreferenceUIComponents.contract.md lines 20-60

**Research Reference**: research.md Section 3 (WCAG keyboard accessibility)

**Success Criteria**:
- Component tests T010 PASS
- WCAG 2.1 AA compliant
- Works with existing PayPlan UI components

**Dependencies**: T010 (tests must fail first)

---

#### T027 Implement ToastNotification component

**File**: `frontend/src/components/preferences/ToastNotification.tsx`

**Description**: Implement toast with ARIA live regions:
- role="status" (success) or role="alert" (error)
- aria-live="polite" or "assertive" based on type
- aria-atomic="true"
- Auto-dismiss after 3 seconds (from constants)
- Dismiss button with aria-label
- Escape key handler
- Use lucide-react icons

**Contract Reference**: PreferenceUIComponents.contract.md lines 65-120

**Research Reference**: research.md Section 3 (ARIA live region patterns)

**Success Criteria**:
- Component tests T011 PASS
- WCAG 2.1 AA compliant
- Accessibility test T021 PASS (Escape key)

**Dependencies**: T011 (tests must fail first)

---

#### T028 Implement InlineStatusIndicator component

**File**: `frontend/src/components/preferences/InlineStatusIndicator.tsx`

**Description**: Implement persistent restoration indicator:
- Conditional rendering based on `restored` prop
- aria-label with category-specific text
- Icon + text for visual/semantic meaning
- Use lucide-react for icon
- Small, unobtrusive design

**Contract Reference**: PreferenceUIComponents.contract.md lines 170-195

**Success Criteria**:
- Component tests T013 PASS
- Integration tests T014-T016 PASS (indicator appears/disappears correctly)

**Dependencies**: T013 (tests must fail first)

---

#### T029 Implement PreferenceSettings screen

**File**: `frontend/src/components/preferences/PreferenceSettings.tsx`

**Description**: Implement centralized settings screen:
- List all 5 preference categories with labels
- Inline PreferenceToggle for each category
- Input controls for each preference value
- "Reset All" button with confirmation dialog
- Proper heading hierarchy (h2 for screen, h3 for categories)
- Form labels associated with inputs
- Use @radix-ui/react-alert-dialog for confirmation

**Contract Reference**: PreferenceUIComponents.contract.md lines 125-165

**Research Reference**: research.md Section 3 (heading hierarchy for accessibility)

**Success Criteria**:
- Component tests T012 PASS
- Integration tests T015 (reset), T016 (opt-out) PASS
- Accessibility test T021 PASS (Tab navigation)

**Dependencies**: T012 (tests must fail first), T026-T028 (child components)

---

## Phase 3.4: Integration & Polish

#### T030 Integrate usePreferences into App initialization

**File**: `frontend/src/App.tsx` (modify existing)

**Description**: Add preference restoration to app initialization:
- Call usePreferences() at App level
- Restore preferences before first render (NFR-002: no flash of defaults)
- Measure restoration time with performance.mark
- Log performance metrics in development

**Research Reference**: research.md Section 5 (performance measurement)

**Success Criteria**:
- Performance test T020 PASS (<100ms)
- No visible flash of default values
- Integration tests T014-T018 PASS in full app context

**Dependencies**: T025 (usePreferences hook), T020 (performance test)

---

#### T031 Add preference controls to existing pages

**File**: `frontend/src/pages/[relevant-page].tsx` (identify page with timezone/currency/locale controls)

**Description**: Integrate PreferenceToggle next to existing controls:
- Add inline toggle next to timezone selector
- Add inline toggle next to currency format selector
- Add inline toggle next to locale selector
- Wire up to usePreferences hook
- Show InlineStatusIndicator when restored

**Success Criteria**:
- Integration tests T014, T016 PASS
- User can see and interact with toggles in context
- Inline indicators appear after restoration

**Dependencies**: T026 (PreferenceToggle), T028 (InlineStatusIndicator), T030 (App integration)

---

#### T032 Add toast notification system

**File**: `frontend/src/App.tsx` or `frontend/src/components/layout/ToastContainer.tsx` (create if needed)

**Description**: Setup toast notification container:
- Add ToastNotification rendering system
- Connect to preference save/reset events
- Display toasts for: save success, reset confirmation, errors
- Ensure one toast at a time (queue if needed)

**Success Criteria**:
- Integration tests T014-T018 PASS (toasts appear)
- Accessibility test T021 PASS (Escape dismissal)
- Component test T011 PASS

**Dependencies**: T027 (ToastNotification component)

---

#### T033 Add PreferenceSettings to navigation

**File**: `frontend/src/App.tsx` or router configuration

**Description**: Add route and navigation link for PreferenceSettings:
- Create route `/settings/preferences`
- Add menu item or settings icon in navigation
- Ensure settings screen accessible via keyboard

**Success Criteria**:
- Integration test T015 PASS (can access and reset)
- User can navigate to settings screen
- Accessibility test T021 PASS (keyboard navigation)

**Dependencies**: T029 (PreferenceSettings component)

---

#### T034 Performance optimization and monitoring

**File**: `frontend/src/lib/preferences/storage.ts` (modify)

**Description**: Add performance monitoring:
- Instrument restoration with performance.mark/measure
- Log times >100ms as warnings
- Add debounce flush on beforeunload event
- Optimize JSON parsing (consider worker for large data, though 5KB makes this unlikely)

**Research Reference**: research.md Section 5 (performance targets, debouncing)

**Success Criteria**:
- Performance test T020 consistently PASS
- Console warnings if restoration slow
- Debounced saves flush before page unload

**Dependencies**: T022 (storage service), T020 (performance test)

---

#### T035 Accessibility audit and fixes

**File**: All preference components

**Description**: Run accessibility audit using quickstart.md Scenario 7:
- Test with NVDA or VoiceOver screen reader
- Verify all ARIA attributes correct
- Test keyboard navigation through entire flow
- Fix any identified issues
- Run axe-core automated checks

**Quickstart Reference**: quickstart.md Scenario 7

**Research Reference**: research.md Section 3 (WCAG 2.1 AA standards)

**Success Criteria**:
- Accessibility test T021 PASS
- No axe-core violations
- Manual screen reader test successful (document in quickstart)
- WCAG 2.1 AA compliance (NFR-003)

**Dependencies**: T026-T029 (all components), T021 (accessibility test)

---

## Phase 3.5: Final Polish

#### T036 Code cleanup and documentation

**Files**: All preference files

**Description**: Final code review and cleanup:
- Remove console.logs (except intentional debug features)
- Add JSDoc comments to public functions
- Ensure all exports are used
- Remove unused imports
- Run linter and fix all warnings
- Add inline comments for complex logic (e.g., payday pattern validation)

**Success Criteria**:
- No linter warnings
- All functions documented
- Code passes team review

**Dependencies**: T022-T035 (all implementation complete)

---

#### T037 Execute manual quickstart validation

**File**: Quickstart manual testing

**Description**: Execute all 8 quickstart scenarios manually:
- Scenario 1: Save/restore timezone
- Scenario 2: Reset all
- Scenario 3: Selective opt-out
- Scenario 4: Centralized settings
- Scenario 5: Quota exceeded
- Scenario 6: Corrupted data recovery
- Scenario 7: Accessibility (already done in T035)
- Scenario 8: Performance (already automated in T020)

**Quickstart Reference**: quickstart.md all scenarios

**Success Criteria**:
- All scenarios pass manual testing
- Document any issues found
- All automated tests (T004-T021) still PASS

**Dependencies**: T022-T036 (all implementation and cleanup complete)

---

## Dependencies Graph

```text
Setup Phase:
T001 (types) → T002 (constants), T003 (schemas)
T002, T003 → All test tasks (T004-T021)

Test Phase (all parallel after T001-T003):
T004-T021 [P] → Must all FAIL before implementation

Implementation Phase:
T004-T007 → T022 (storage service)
T008-T009 → T023 (validation service)
T003 → T023 (validation uses schemas)
T019 → T024 (useLocalStorage for cross-tab)
T022 → T024 (useLocalStorage uses storage)
T024 → T025 (usePreferences uses useLocalStorage)
T014-T016, T020 → T025 (integration tests for hook)
T010 → T026 (PreferenceToggle)
T011 → T027 (ToastNotification)
T013 → T028 (InlineStatusIndicator)
T012, T026-T028 → T029 (PreferenceSettings uses child components)
T025, T020 → T030 (App integration)
T026, T028, T030 → T031 (page integration)
T027 → T032 (toast system)
T029 → T033 (navigation)
T022, T020 → T034 (performance)
T026-T029, T021 → T035 (accessibility audit)
T022-T035 → T036 (cleanup)
T022-T036 → T037 (manual validation)
```

---

## Parallel Execution Examples

### Example 1: Setup Phase (all parallel)

```bash
# Run T001-T003 in parallel (different files, no dependencies)
Task: "Create TypeScript types in frontend/src/lib/preferences/types.ts"
Task: "Create constants in frontend/src/lib/preferences/constants.ts"
Task: "Create Zod schemas in frontend/src/lib/preferences/validation.ts"
```

### Example 2: Contract Tests (all parallel after setup)

```bash
# Run T004-T013 in parallel (all different test files, independent)
Task: "Contract test savePreference happy path in frontend/tests/unit/preferences/storage-save.test.ts"
Task: "Contract test savePreference errors in frontend/tests/unit/preferences/storage-errors.test.ts"
Task: "Contract test loadPreferences in frontend/tests/unit/preferences/storage-load.test.ts"
Task: "Contract test utilities in frontend/tests/unit/preferences/storage-util.test.ts"
Task: "Contract test validatePreferenceValue in frontend/tests/unit/preferences/validation.test.ts"
Task: "Contract test validation quota in frontend/tests/unit/preferences/validation-quota.test.ts"
Task: "Contract test PreferenceToggle in frontend/tests/unit/preferences/PreferenceToggle.test.tsx"
Task: "Contract test ToastNotification in frontend/tests/unit/preferences/ToastNotification.test.tsx"
Task: "Contract test PreferenceSettings in frontend/tests/unit/preferences/PreferenceSettings.test.tsx"
Task: "Contract test InlineStatusIndicator in frontend/tests/unit/preferences/InlineStatusIndicator.test.tsx"
```

### Example 3: Integration Tests (all parallel)

```bash
# Run T014-T021 in parallel (all different test files, independent)
Task: "Integration test save/restore in frontend/tests/integration/preferences/save-restore.test.ts"
Task: "Integration test reset all in frontend/tests/integration/preferences/reset-all.test.ts"
Task: "Integration test opt-out in frontend/tests/integration/preferences/opt-out.test.ts"
Task: "Integration test quota in frontend/tests/integration/preferences/quota-exceeded.test.ts"
Task: "Integration test corrupted data in frontend/tests/integration/preferences/corrupted-data.test.ts"
Task: "Integration test cross-tab sync in frontend/tests/integration/preferences/cross-tab-sync.test.ts"
Task: "Integration test performance in frontend/tests/integration/preferences/performance.test.ts"
Task: "Integration test accessibility in frontend/tests/integration/preferences/accessibility-keyboard.test.ts"
```

### Example 4: Component Implementation (parallel after tests)

```bash
# Run T026-T028 in parallel (different component files, independent)
Task: "Implement PreferenceToggle in frontend/src/components/preferences/PreferenceToggle.tsx"
Task: "Implement ToastNotification in frontend/src/components/preferences/ToastNotification.tsx"
Task: "Implement InlineStatusIndicator in frontend/src/components/preferences/InlineStatusIndicator.tsx"
```

---

## Notes

- **[P] tasks**: Different files, no dependencies, can execute in parallel
- **Sequential tasks**: Same file or dependencies must execute in order
- **TDD Critical**: ALL tests (T004-T021) must be written and failing before implementation (T022+)
- **Atomic tasks**: Each task is 15-45 minutes max
- **Commit strategy**: Commit after each task completion
- **Research integration**: Each task references specific research.md decisions for implementation guidance

---

## Validation Checklist

*GATE: Checked before marking tasks complete*

- [x] All 3 contracts have corresponding test tasks (T004-T013)
- [x] All 5 entities have validation/model tasks (T001-T003, T022-T023)
- [x] All tests come before implementation (T004-T021 before T022+)
- [x] Parallel tasks truly independent (checked [P] markers)
- [x] Each task specifies exact file path (absolute from repo root)
- [x] No task modifies same file as another [P] task (verified)
- [x] All quickstart scenarios covered (T014-T021, T037)
- [x] Research.md decisions integrated (each task references research section)
- [x] Performance targets included (T020, T034 for NFR-001)
- [x] Accessibility requirements included (T021, T035 for NFR-003)

---

## Task Summary

**Total Tasks**: 37
- **Setup**: 3 tasks (T001-T003)
- **Contract Tests**: 10 tasks (T004-T013) [P]
- **Integration Tests**: 8 tasks (T014-T021) [P]
- **Implementation**: 8 tasks (T022-T029)
- **Integration & Polish**: 8 tasks (T030-T037)

**Estimated Time**: 25-35 hours total (based on 15-45 min per atomic task)

**Parallel Opportunities**: 21 tasks marked [P] (can reduce wall-clock time significantly)

---

**Tasks Ready for Execution** | **Next**: Execute T001-T003 setup in parallel, then T004-T021 tests in parallel
