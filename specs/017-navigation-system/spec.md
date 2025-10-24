# Feature Specification: Navigation & Discovery System

**Feature Branch**: `017-navigation-system`
**Created**: October 22, 2025
**Status**: Draft
**Input**: User description: "Build a navigation and discovery system for PayPlan that adds a persistent navigation header to all pages with links to Home, Archives, and Settings. Wire the CreateArchiveDialog component into the payment results view so users can create archives. Add breadcrumb navigation to nested pages like archive details. This solves the critical blocker where 75% of features are inaccessible because users have no way to discover or navigate to them."

## Clarifications

### Session 2025-10-22

- Q: How does navigation integrate with the existing routing system? → A: Navigation uses existing routes from React Router configuration; only wire up navigation links to existing route definitions
- Q: Where in the component tree should NavigationHeader be placed to persist across route changes? → A: Place NavigationHeader in root App/Layout component above route outlet
- Q: Should archive creation reset payment statuses to pending or only save a snapshot? → A: Archive creation does NOT reset payment statuses; it only saves a snapshot. Users manually clear/reset if desired.
- Q: What is the mobile navigation interaction pattern (open/close behavior)? → A: Hamburger menu toggles slide-out drawer; closes on route navigation, backdrop click, or ESC key
- Q: What are the performance targets for navigation responsiveness? → A: Route changes <200ms, menu animations <300ms

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Features (Priority: P1)

A new user lands on PayPlan and imports their BNPL payment data. After seeing their payment schedule, they want to explore other features like viewing their archive history or accessing settings. Currently, they see no navigation options and don't know these features exist. With navigation, they can see a clear menu showing "Home", "Archives", "Settings" and easily move between features.

**Why this priority**: Without navigation, 75% of features are completely inaccessible. Users can't discover or use the archive system, preferences, or other pages. This is the #1 blocker preventing feature adoption.

**Independent Test**: Load the app, verify navigation menu appears, click each link, confirm page changes. No other features needed.

**Acceptance Scenarios**:

1. **Given** a user on any page, **When** they look at the top of the screen, **Then** they see a navigation header with clear menu options
2. **Given** a user clicks "Archives" in navigation, **When** the page loads, **Then** they see the archives list page at /archives route
3. **Given** a user is on the Archives page, **When** they look at navigation, **Then** the "Archives" link is highlighted as active
4. **Given** a user on mobile device, **When** they tap menu icon, **Then** navigation menu slides out or drops down
5. **Given** a user using keyboard only, **When** they press Tab, **Then** they can navigate through all menu items

---

### User Story 2 - Create Archive from Results (Priority: P2)

A user has been tracking their BNPL payments for a month and marked several as paid. They want to save this month's progress before starting fresh for the next month. They see their current payment results and notice a "Create Archive" button. Clicking it opens a dialog to name and save their payment history.

**Why this priority**: The archive system (Feature 016) is fully built but completely disconnected from the user flow. Users have no way to create archives even though the functionality exists.

**Independent Test**: Import payments, see results, click "Create Archive", save archive, verify it appears in archives list.

**Acceptance Scenarios**:

1. **Given** a user viewing payment results, **When** they see the ResultsThisWeek component, **Then** a "Create Archive" button is visible
2. **Given** a user clicks "Create Archive", **When** the dialog opens, **Then** they can enter an archive name and see current date
3. **Given** a user saves an archive, **When** the save completes, **Then** they see success feedback and payment data is saved as a snapshot (payment statuses remain unchanged in active view)
4. **Given** a user creates an archive, **When** they navigate to Archives page, **Then** they see their new archive in the list

---

### User Story 3 - Discover Features Through Breadcrumbs (Priority: P3)

A user is viewing a specific archive detail page and wants to go back to the archives list or return home. They see breadcrumb navigation showing "Home > Archives > October 2025" and can click any level to navigate back.

**Why this priority**: Improves navigation context and provides multiple ways to move through the app, reducing user frustration when deep in the navigation hierarchy.

**Independent Test**: Navigate to archive detail page, verify breadcrumbs appear, click each breadcrumb level, confirm navigation works.

**Acceptance Scenarios**:

1. **Given** a user on archive detail page, **When** they look below the main nav, **Then** they see breadcrumbs showing their location
2. **Given** breadcrumbs showing "Home > Archives > October", **When** user clicks "Archives", **Then** they return to archives list
3. **Given** a user on any nested page, **When** they click "Home" in breadcrumbs, **Then** they return to home page

---

### Edge Cases

- What happens when navigation menu has too many items? Prioritize core features, hide others under "More" menu
- How does navigation work on very small screens? Use hamburger menu with slide-out drawer that closes automatically on route navigation, backdrop click, or ESC key press
- What if JavaScript fails to load? Progressive enhancement with `<noscript>` fallback message directing users to enable JavaScript (Note: PayPlan is a client-side SPA without server-side rendering)
- How does breadcrumb navigation handle very long archive names? Truncate with ellipsis (...) and show full name in Radix UI Tooltip on hover (with smooth animations, arrow pointer, and proper positioning)
- What if user opens mobile menu and navigates to new page? Menu automatically closes to reveal new page content

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display persistent navigation header on all pages
- **FR-002**: Navigation MUST include links to: Home, Archives, Settings
- **FR-003**: Users MUST be able to identify current page through visual indication (active state)
- **FR-004**: System MUST provide "Create Archive" button on payment results view that saves a snapshot of current payment data without modifying active payment statuses
- **FR-005**: Navigation MUST be keyboard accessible (Tab, Enter, Escape keys); ESC key closes mobile drawer menu
- **FR-006**: System MUST show breadcrumbs on nested pages (archive details, settings sub-pages)
- **FR-007**: Mobile navigation MUST be touch-friendly with appropriately sized tap targets (minimum 44x44px)
- **FR-008**: Navigation MUST integrate with existing React Router 7.0.2 route configuration without creating new routing system

### Key Entities

- **NavigationHeader**: Persistent top navigation component with menu items and active state tracking. Placed in root App/Layout component above React Router outlet to persist across all route changes.
- **Breadcrumbs**: Hierarchical navigation showing current location in the application structure
- **CreateArchiveButton**: Call-to-action that triggers CreateArchiveDialog component from payment results

## Post-Implementation Improvements *(from code review)*

### CodeRabbit Findings (2025-10-23)
**Source**: Code review of lint fix commit (80aa6a6)

#### Technical Refinements
- **TR-001**: MobileMenu.tsx:191 - Remove redundant `backgroundColor: '#ffffff'` inline style; already covered by Tailwind `bg-white` class (P3 Nitpick)
  - **Context**: User Story 1 implementation
  - **Impact**: Minor - reduces duplicate styling
  - **Action**: Update MobileMenu component to rely solely on Tailwind classes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of application pages are accessible via navigation (currently 25%)
- **SC-002**: Archive creation rate increases from 0% to >30% of users with payment data
- **SC-003**: Average pages visited per session increases from 1.5 to 3+
- **SC-004**: User feedback changes from "can't find features" to "easy to navigate"
- **SC-005**: Time to discover archive feature reduces from never to <2 minutes

**Note**: SC-002 through SC-005 are post-launch analytics metrics requiring user behavior tracking and A/B testing. These metrics will be measured after deployment using analytics tools. No implementation tasks required in this feature.

- **SC-006**: Mobile navigation usable on screens ≥320px width
- **SC-007**: Route navigation completes in <200ms (measured from click to new page render using Performance API with performance.mark/performance.measure)
- **SC-008**: Mobile menu animations complete in <300ms (open/close transitions)
