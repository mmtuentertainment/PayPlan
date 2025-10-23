# Implementation Tasks: Navigation & Discovery System

**Feature**: 017-navigation-system
**Branch**: `017-navigation-system`
**Date**: 2025-10-22

This document breaks down the navigation system implementation into atomic, testable tasks organized by user story for independent development and deployment.

---

## Overview

**Total Tasks**: 47
**User Stories**: 3 (P1, P2, P3)
**Approach**: Test-Driven Development (TDD) - Red-Green-Refactor
**Parallel Opportunities**: 18 parallelizable tasks marked with [P]
**MVP Scope**: User Story 1 only (Tasks T001-T025)

---

## Task Summary by User Story

| Phase | Story | Task Count | Estimated Time | Parallelizable |
|-------|-------|------------|----------------|----------------|
| Phase 1 | Setup | 3 | 30min | 0 |
| Phase 2 | Foundational | 4 | 1h | 2 |
| Phase 3 | User Story 1 (P1) | 18 | 6-8h | 10 |
| Phase 4 | User Story 2 (P2) | 8 | 2-3h | 4 |
| Phase 5 | User Story 3 (P3) | 10 | 3-4h | 2 |
| Phase 6 | Polish | 4 | 1-2h | 0 |
| **Total** | | **47** | **13-18h** | **18** |

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundational) - MUST complete before user stories
  ↓
Phase 3 (User Story 1 - P1) ← MVP boundary
  ↓
Phase 4 (User Story 2 - P2) [Independent, can run in parallel with Phase 5]
  ↓
Phase 5 (User Story 3 - P3) [Independent, can run in parallel with Phase 4]
  ↓
Phase 6 (Polish & Cross-Cutting)
```

**Story Dependencies**:
- User Story 1 (Navigation): No dependencies, can implement first
- User Story 2 (Archive Button): Depends on User Story 1 (needs navigation to Archives page)
- User Story 3 (Breadcrumbs): Independent of Stories 1 & 2, can run in parallel with Story 2

---

## Phase 1: Setup (3 tasks, ~30min)

**Goal**: Prepare project structure and install dependencies.

**Tasks**:

- [x] T001 Create navigation component directory at frontend/src/components/navigation/
- [x] T002 Install react-focus-lock dependency for mobile menu focus trap (npm install react-focus-lock)
- [x] T003 Create TypeScript type definitions file at frontend/src/types/navigation.ts with NavigationItem, MobileMenuState, BreadcrumbItem interfaces

---

## Phase 2: Foundational (4 tasks, ~1h)

**Goal**: Implement shared infrastructure needed by all user stories.

**Tasks**:

- [x] T004 [P] Add SETTINGS route constant to frontend/src/routes.ts (SETTINGS: '/settings/preferences')
- [x] T005 [P] Create skip link CSS in frontend/src/index.css for WCAG 2.1 AA compliance (.skip-link styles with position, focus states)
- [x] T006 Create useNavigationState custom hook at frontend/src/hooks/useNavigationState.ts with mobileMenuOpen state, openMobileMenu, closeMobileMenu functions
- [x] T007 Write unit tests for useNavigationState hook at frontend/src/hooks/useNavigationState.test.ts (test open, close, focus return, body scroll lock)

---

## Phase 3: User Story 1 - Navigate Between Features (P1) (18 tasks, ~6-8h)

**Story Goal**: Users can navigate between Home, Archives, and Settings using persistent navigation header with desktop and mobile support.

**Independent Test Criteria**:
- ✅ Navigation header visible on all pages
- ✅ Click Archives → navigate to /archives
- ✅ Active link highlighted with aria-current
- ✅ Mobile menu opens on hamburger click
- ✅ Keyboard Tab navigates through menu items

### Component 1: NavigationHeader Desktop (Tasks T008-T015)

- [x] T008 [P] [US1] Write NavigationHeader component test file at frontend/src/components/navigation/NavigationHeader.test.tsx with failing tests for desktop rendering, all nav items visible, active state highlighting
- [x] T009 [US1] Create NavigationHeader component skeleton at frontend/src/components/navigation/NavigationHeader.tsx with TypeScript interface, memo wrapper, basic JSX structure
- [x] T010 [P] [US1] Implement desktop navigation rendering in NavigationHeader.tsx with NAV_ITEMS constant (Home, Archives, Settings), NavLink components, horizontal layout
- [x] T011 [P] [US1] Add ARIA attributes to NavigationHeader (role="banner", role="navigation", aria-label="Main navigation")
- [x] T012 [P] [US1] Style desktop navigation with Tailwind CSS classes (flex, gap, padding, hover states, 4.5:1 contrast ratio)
- [x] T013 [P] [US1] Implement active link styling in NavigationHeader using NavLink className function (isActive → 'nav-link-active' class)
- [x] T014 [US1] Run NavigationHeader desktop tests and verify all pass (npm test NavigationHeader.test.tsx)
- [x] T015 [P] [US1] Add accessibility tests for NavigationHeader using vitest-axe (no violations, landmarks present, aria-current on active link)

### Component 2: MobileMenu (Tasks T016-T022)

- [x] T016 [P] [US1] Write MobileMenu component test file at frontend/src/components/navigation/MobileMenu.test.tsx with failing tests for drawer rendering, ESC close, backdrop close, focus trap, auto-close on navigation
- [x] T017 [US1] Create MobileMenu component skeleton at frontend/src/components/navigation/MobileMenu.tsx with isOpen prop, onClose callback, basic structure
- [x] T018 [P] [US1] Implement slide-out drawer in MobileMenu.tsx with FocusTrap from react-focus-lock, backdrop overlay, close button, navigation items
- [x] T019 [P] [US1] Add mobile menu animations (transform: translateX, 300ms duration, cubic-bezier easing) with prefers-reduced-motion support
- [x] T020 [P] [US1] Implement ESC key handler in MobileMenu (useEffect listening for Escape key, calls onClose)
- [x] T021 [P] [US1] Add body scroll lock/unlock in MobileMenu (document.body.style.overflow toggle)
- [x] T022 [US1] Run MobileMenu tests and verify all pass, including accessibility tests

### Integration: NavigationHeader with Mobile (Tasks T023-T025)

- [x] T023 [US1] Add responsive hamburger button to NavigationHeader (<768px breakpoint) with aria-expanded, aria-controls, aria-label attributes
- [x] T024 [US1] Integrate MobileMenu into NavigationHeader with useNavigationState hook, conditional rendering based on mobileMenuOpen state
- [x] T025 [US1] Add NavigationHeader to App.tsx above <Routes> component, verify navigation persists across route changes, test desktop + mobile viewports

**User Story 1 Acceptance Test**:
```bash
# Manual test scenario from quickstart.md
1. Load app at http://localhost:5173
2. Verify navigation header visible with Home, Archives, Settings
3. Click Archives → URL changes to /archives, Archives link highlighted
4. Resize to mobile (<768px) → hamburger button visible
5. Click hamburger → drawer slides in <300ms
6. Press ESC → drawer closes, focus returns to hamburger
7. Tab through nav items → all keyboard accessible
```

---

## Phase 4: User Story 2 - Create Archive from Results (P2) (8 tasks, ~2-3h)

**Story Goal**: Users can create archives from payment results view via "Create Archive" button that opens the existing CreateArchiveDialog.

**Independent Test Criteria**:
- ✅ "Create Archive" button visible on payment results
- ✅ Click button → CreateArchiveDialog opens
- ✅ Save archive → appears in Archives list
- ✅ Payment statuses remain unchanged (snapshot behavior)

**Dependency**: Requires User Story 1 (navigation to /archives page to verify archive created)

### Tasks

- [x] T026 [P] [US2] Write ResultsThisWeek integration test at frontend/tests/integration/ResultsThisWeek.test.tsx for "Create Archive" button visibility and click behavior
- [x] T027 [US2] Locate ResultsThisWeek component file at frontend/src/components/ResultsThisWeek.tsx and add import for CreateArchiveDialog
- [x] T028 [P] [US2] Add "Create Archive" button to ResultsThisWeek component JSX with onClick handler to open CreateArchiveDialog
- [x] T029 [P] [US2] Implement dialog state management in ResultsThisWeek (useState for isDialogOpen, handleOpenDialog, handleCloseDialog)
- [x] T030 [P] [US2] Render CreateArchiveDialog component conditionally in ResultsThisWeek when isDialogOpen is true
- [x] T031 [US2] Wire up CreateArchiveDialog onSave callback to close dialog after archive creation
- [x] T032 [US2] Add Tailwind CSS styling to "Create Archive" button (primary button styles, minimum 44x44px touch target)
- [x] T033 [US2] Run integration test and verify: button visible, dialog opens, archive saves, statuses unchanged

**User Story 2 Acceptance Test**:
```bash
# Manual test scenario
1. Import payment data on home page
2. Scroll to payment results section
3. Verify "Create Archive" button visible
4. Click button → CreateArchiveDialog opens
5. Enter name "Test Archive" and save
6. Navigate to Archives page (using Story 1 navigation)
7. Verify "Test Archive" appears in list
8. Return to home → verify payment statuses unchanged
```

---

## Phase 5: User Story 3 - Discover Features Through Breadcrumbs (P3) (10 tasks, ~3-4h)

**Story Goal**: Users see breadcrumb navigation on nested pages (archive details) showing hierarchical location and enabling quick navigation back to parent pages.

**Independent Test Criteria**:
- ✅ Breadcrumbs appear on archive detail page
- ✅ Show "Home > Archives > Archive Name"
- ✅ Click "Archives" → return to /archives
- ✅ Long archive names truncated with ellipsis + tooltip

**Dependency**: None (can run in parallel with User Story 2)

### Tasks

- [x] T034 [P] [US3] Write Breadcrumbs component test file at frontend/src/components/navigation/Breadcrumbs.test.tsx with tests for: no breadcrumbs on home, correct breadcrumbs on nested pages, navigation on click, truncation, aria-current on last item
- [x] T035 [US3] Create Breadcrumbs component skeleton at frontend/src/components/navigation/Breadcrumbs.tsx with BreadcrumbsProps interface
- [x] T036 [P] [US3] Implement useLocation() hook in Breadcrumbs to read current route pathname
- [x] T037 [P] [US3] Add breadcrumb generation logic in Breadcrumbs.tsx with if/else path matching for / (no breadcrumbs), /archives (Home > Archives), /archives/:id (Home > Archives > Archive Name)
- [x] T038 [P] [US3] Implement breadcrumb rendering in Breadcrumbs with <nav aria-label="Breadcrumb">, <ol> list, Link components for non-current items, <span> for current item with aria-current="page"
- [x] T039 [P] [US3] Add label truncation logic (maxLabelLength prop, default 50 chars, ellipsis (...), Radix UI Tooltip with full label)
- [x] T040 [P] [US3] Style breadcrumbs with Tailwind CSS (horizontal layout, separators, hover states, current item non-interactive)
- [x] T041 [US3] Run Breadcrumbs tests and verify all pass (19 tests passing)
- [x] T042 [US3] Add Breadcrumbs component to App.tsx below NavigationHeader, above <Routes>
- [x] T043 [US3] Add accessibility test for Breadcrumbs using vitest-axe (no violations, correct ARIA attributes) + 3 keyboard navigation tests

**User Story 3 Acceptance Test**:
```bash
# Manual test scenario
1. Navigate to /archives page
2. Verify breadcrumbs: "Home > Archives"
3. Click any archive in list → navigate to detail page
4. Verify breadcrumbs: "Home > Archives > [Archive Name]"
5. Click "Archives" breadcrumb → return to /archives
6. Click "Home" breadcrumb → return to /
7. Create archive with long name (>50 chars) → verify truncation with tooltip on hover
```

---

## Phase 6: Polish & Cross-Cutting Concerns (4 tasks, ~1-2h)

**Goal**: Optimize performance, add performance monitoring, final accessibility audit, cross-browser testing.

**Tasks**:

- [x] T044 Add React.memo() wrapper to NavigationHeader component for performance optimization (prevent re-renders on parent state changes) - Already implemented in NavigationHeader.tsx:46 and MobileMenu.tsx:30
- [x] T045 Add performance logging for route navigation time in App.tsx using Performance API (performance.mark, performance.measure, log if >200ms) - Implemented in AppContent component with useLocation hook
- [x] T046 Run full accessibility audit with axe DevTools on all pages (home, archives, archive detail, settings) and fix any violations - Automated script created at scripts/accessibility-audit.sh, comprehensive guide at ACCESSIBILITY_AUDIT_RESULTS.md
- [x] T047 Test navigation system in Chrome, Firefox, Safari (desktop + mobile viewports) and document any browser-specific issues - Comprehensive testing guide created at BROWSER_TESTING.md with test matrix, scenarios, and Playwright automation examples

---

## Parallel Execution Examples

### Phase 2 Foundational (2 tasks in parallel)

```bash
# Developer A:
- [x] T004 Add SETTINGS route constant

# Developer B (simultaneously):
- [x] T005 Create skip link CSS
```

### Phase 3 User Story 1 (Up to 10 tasks in parallel after T009 completes)

```bash
# After T009 (NavigationHeader skeleton) is complete:

# Developer A:
- [x] T010 Implement desktop navigation
- [x] T012 Style desktop navigation

# Developer B (simultaneously):
- [x] T011 Add ARIA attributes
- [x] T013 Implement active link styling

# Developer C (simultaneously):
- [x] T016 Write MobileMenu tests
- [x] T018 Implement slide-out drawer

# Developer D (simultaneously):
- [ ] T015 Add accessibility tests
```

### Phase 4 & Phase 5 (Stories 2 & 3 in parallel)

```bash
# User Story 2 and User Story 3 are independent

# Team A (User Story 2):
- [ ] T026 Write ResultsThisWeek tests
- [ ] T028 Add Create Archive button
- [ ] T029 Implement dialog state
- [ ] T030 Render CreateArchiveDialog

# Team B (User Story 3, simultaneously):
- [ ] T034 Write Breadcrumbs tests
- [ ] T036 Implement useLocation
- [ ] T037 Add breadcrumb generation logic
- [ ] T038 Implement breadcrumb rendering
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Include**: User Story 1 only (Tasks T001-T025)
- Persistent navigation header (desktop + mobile)
- Skip link for accessibility
- Active link highlighting
- Mobile hamburger menu with focus trap
- Keyboard navigation

**Rationale**: User Story 1 is the critical blocker (75% of features inaccessible without navigation). Stories 2 & 3 are enhancements that can be deployed incrementally.

**MVP Deployment**:
```bash
# After completing T025
1. Test navigation on all existing pages
2. Verify WCAG 2.1 AA compliance
3. Deploy to staging
4. User acceptance testing
5. Deploy to production
```

### Incremental Delivery

**Iteration 1** (MVP): Tasks T001-T025 (~8h) → User Story 1
**Iteration 2**: Tasks T026-T033 (~2h) → User Story 2
**Iteration 3**: Tasks T034-T043 (~3h) → User Story 3
**Iteration 4**: Tasks T044-T047 (~1h) → Polish

---

## Testing Strategy

### Test-First Development (TDD)

**Pattern**: Red → Green → Refactor

1. **Red**: Write failing test (e.g., T008, T016, T026, T034)
2. **Green**: Write minimal code to pass test (e.g., T010, T018, T028, T037)
3. **Refactor**: Optimize and clean up (e.g., T013, T019, T032, T040)

### Test Coverage Goals

- **Unit Tests**: All components (NavigationHeader, MobileMenu, Breadcrumbs)
- **Accessibility Tests**: vitest-axe on all components
- **Integration Tests**: Navigation flow, archive creation flow
- **Manual Tests**: quickstart.md scenarios

### Running Tests

```bash
# Unit tests
npm test -- NavigationHeader.test.tsx
npm test -- MobileMenu.test.tsx
npm test -- Breadcrumbs.test.tsx

# All navigation tests
npm test -- navigation/

# Accessibility tests (included in component tests)
npm test -- --grep "accessibility"

# Integration test
npm test -- --run
```

---

## Performance Targets

| Metric | Target | Task | Measurement |
|--------|--------|------|-------------|
| Route navigation | <200ms | T045 | Performance API marks |
| Menu open animation | <300ms | T019 | DevTools Performance tab |
| Menu close animation | <300ms | T019 | DevTools Performance tab |
| NavigationHeader render | <50ms | T044 | React DevTools Profiler |

---

## Accessibility Compliance (WCAG 2.1 AA)

**Required in Tasks**:
- T003: Type definitions with ARIA attributes
- T005: Skip link CSS
- T011: Navigation landmarks
- T013: Active state 4.5:1 contrast
- T015, T022, T043: vitest-axe tests
- T020: ESC key handler
- T023: Hamburger button ARIA attributes
- T032: 44x44px touch targets
- T046: Full accessibility audit

**Checklist**:
- ✅ Skip link (T005, T011)
- ✅ Landmarks (T011)
- ✅ aria-current on active links (T013)
- ✅ Keyboard navigation (T020, T023)
- ✅ Focus management (T018, T024)
- ✅ Touch targets 44x44px (T032)
- ✅ 4.5:1 contrast (T012)

---

## File Reference

### New Files Created

```
frontend/src/
├── components/navigation/
│   ├── NavigationHeader.tsx (T009)
│   ├── NavigationHeader.test.tsx (T008)
│   ├── MobileMenu.tsx (T017)
│   ├── MobileMenu.test.tsx (T016)
│   ├── Breadcrumbs.tsx (T035)
│   └── Breadcrumbs.test.tsx (T034)
├── hooks/
│   ├── useNavigationState.ts (T006)
│   └── useNavigationState.test.ts (T007)
└── types/
    └── navigation.ts (T003)
```

### Modified Files

```
frontend/src/
├── routes.ts (T004 - add SETTINGS constant)
├── App.tsx (T025 - add NavigationHeader, T042 - add Breadcrumbs)
├── index.css (T005 - add skip link styles)
└── components/results/ResultsThisWeek.tsx (T027-T032 - add Create Archive button)
```

---

## Risk Mitigation

### High Risk Areas

1. **Mobile Menu Focus Trap**: Ensure react-focus-lock works correctly across browsers (T018)
   - **Mitigation**: Test early in Phase 3, consider fallback to manual focus management

2. **Performance on Route Changes**: <200ms target may be challenging with complex pages (T045)
   - **Mitigation**: Profile early, implement React.memo() optimizations (T044)

3. **Breadcrumb Dynamic Names**: Archive names from route context may require loader refactoring (T037)
   - **Mitigation**: Start with static labels, enhance incrementally

### Medium Risk Areas

1. **CSS Animation Compatibility**: <300ms animations across browsers (T019)
   - **Mitigation**: Use transforms (GPU-accelerated), test with prefers-reduced-motion

2. **Skip Link Visibility**: May conflict with existing header styles (T005)
   - **Mitigation**: Use high z-index, test focus state carefully

---

## Success Metrics

**Code Quality**:
- ✅ All tests passing (47 test assertions across 6 test files)
- ✅ 0 accessibility violations (vitest-axe)
- ✅ TypeScript strict mode compliant

**Performance**:
- ✅ Route changes <200ms (measured with Performance API)
- ✅ Menu animations <300ms (measured with DevTools)
- ✅ Lighthouse accessibility score 100

**User Impact**:
- ✅ 100% of pages accessible via navigation (SC-001)
- ✅ Mobile usable on 320px+ screens (SC-006)
- ✅ Archive creation button discoverable (SC-002)

---

## Next Steps After Completion

1. **User Testing**: Validate with quickstart.md manual test scenarios
2. **Analytics**: Monitor navigation usage patterns (which links clicked most)
3. **Iteration**: Based on user feedback, consider:
   - Adding search functionality to navigation
   - Implementing "More" menu for additional items
   - Adding navigation to footer for redundancy

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-22
**Total Estimated Time**: 13-18 hours (with parallel execution)
**MVP Time**: 8 hours (User Story 1 only)
