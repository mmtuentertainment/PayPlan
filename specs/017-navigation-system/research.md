# Research: Navigation & Discovery System

**Feature**: 017-navigation-system
**Date**: 2025-10-22
**Research Phase**: Phase 0

This document consolidates research findings for implementing persistent navigation, mobile menus, breadcrumbs, and accessibility compliance using React Router 7.9.3.

---

## 1. NavLink vs Link - Active State Indication

### Decision
**Use `NavLink` for navigation menu items; use `Link` for content links and breadcrumbs.**

### Rationale
- NavLink provides automatic `aria-current="page"` on active links (WCAG 2.1 AA requirement)
- Built-in `isActive` and `isPending` state for visual styling
- No manual location tracking needed
- Link is simpler for non-navigation contexts

### Alternatives Considered
- Manual `useLocation()` tracking with Link: More code, no `aria-current` automatic
- CSS-only active states: Fails accessibility requirements
- Custom wrapper: Unnecessary when NavLink exists

### Implementation Pattern
```tsx
<NavLink
  to="/archives"
  className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
>
  Archives
</NavLink>
```

---

## 2. Layout Component Patterns

### Decision
**Wrap Routes in App.tsx with NavigationHeader component above React Router outlet.**

### Rationale
- NavigationHeader remains mounted during route changes (performance)
- Simpler migration than moving to framework routes.ts
- Leverages existing App.tsx structure in PayPlan
- Clean separation: layout vs page content

### Alternatives Considered
- React Router 7 layout routes with framework mode: More future-proof but requires migration
- Per-page navigation: Code duplication, poor performance
- Context-based navigation: Overly complex

### Implementation Pattern
```tsx
function App() {
  return (
    <BrowserRouter>
      <NavigationHeader />
      <Breadcrumbs />
      <main id="main-content">
        <Routes>
          {/* Routes here */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}
```

---

## 3. Mobile Navigation - Hamburger Menu

### Decision
**Implement hamburger menu with slide-out drawer: focus trap, ESC key, backdrop click, auto-close on navigation.**

### Rationale
- Industry standard pattern (recognized by users)
- Meets WCAG 2.1 AA requirements for keyboard navigation
- Space efficient on small screens (≥320px requirement)
- Expected behaviors: ESC closes, backdrop closes, navigation closes menu

### Alternatives Considered
- Bottom navigation bar: Limited to 2-5 items, doesn't scale
- Collapsible accordion: Doesn't save vertical space
- Always-visible horizontal scroll: Poor UX on mobile

### Implementation Pattern
```tsx
// Focus trap with ESC handler, backdrop, auto-close
<FocusTrap active={isOpen}>
  <nav role="dialog" aria-modal="true" aria-label="Navigation menu">
    <button onClick={onClose} aria-label="Close menu">×</button>
    <NavLink to="/" onClick={onClose}>Home</NavLink>
    <NavLink to="/archives" onClick={onClose}>Archives</NavLink>
  </nav>
</FocusTrap>
```

**Library**: Use `react-focus-lock` or `focus-trap-react` for focus management

---

## 4. Breadcrumb Navigation

### Decision
**Use `useLocation()` with manual path matching for breadcrumb generation (simpler alternative to useMatches since not in framework mode).**

### Rationale
- PayPlan not using React Router framework mode yet
- Manual path matching is straightforward for 1-3 breadcrumb levels
- Can enhance with route metadata later if migrating to framework mode
- Dynamic archive names from route params/context

### Alternatives Considered
- `useMatches()` with route handles: Requires framework mode migration
- Static breadcrumbs per page: Code duplication
- `use-react-router-breadcrumbs` package: Adds dependency

### Implementation Pattern
```tsx
function Breadcrumbs() {
  const location = useLocation();
  const { id } = useParams();

  // Manual path matching
  if (location.pathname === '/') return null;

  const crumbs = [{ label: 'Home', path: '/' }];

  if (location.pathname.startsWith('/archives')) {
    crumbs.push({ label: 'Archives', path: '/archives' });

    if (id) {
      // Get archive name from context or loader
      crumbs.push({ label: archiveName, path: `/archives/${id}` });
    }
  }

  return <nav aria-label="Breadcrumb">...</nav>;
}
```

---

## 5. Performance Optimization

### Decision
**Wrap NavigationHeader with `React.memo()`, define nav items outside component, avoid re-renders during route changes.**

### Rationale
- Target: <200ms route changes (SC-007)
- React.memo prevents re-renders when parent state changes (toasts, preferences)
- NavLink doesn't cause re-renders like `useNavigate()` hook would
- Reference-stable nav items array

### Alternatives Considered
- No optimization: Navigation re-renders on every parent update
- useCallback for all handlers: Only needed if passing to memoized children
- Context splitting: Overly complex

### Implementation Pattern
```tsx
// Define outside component for reference stability
const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/archives', label: 'Archives' },
  { to: '/settings/preferences', label: 'Settings' },
];

function NavigationHeaderComponent() {
  return <nav>...</nav>;
}

export const NavigationHeader = memo(NavigationHeaderComponent);
```

---

## 6. Accessibility - WCAG 2.1 AA Compliance

### Decision
**Implement full WCAG 2.1 AA: skip links, landmark roles, aria-current, keyboard navigation, focus management, 4.5:1 contrast.**

### Rationale
- PayPlan requirement: Feature 016 already meets WCAG 2.1 AA
- Legal compliance standard for public websites
- Better UX for keyboard users, screen readers, low-vision users
- SEO benefits from semantic HTML

### Alternatives Considered
- WCAG 2.0 AA: Outdated, missing mobile requirements
- WCAG 2.2 AAA: Exceeds requirements
- Minimal accessibility: Legal risk, excludes users

### Requirements Checklist
- ✅ Skip link (first focusable element, visible on focus)
- ✅ `<nav role="navigation" aria-label="Main navigation">`
- ✅ `aria-current="page"` on active links (automatic with NavLink)
- ✅ Minimum 44x44px touch targets (WCAG 2.5.5)
- ✅ Keyboard navigation: Tab, Enter, ESC
- ✅ Focus trap in mobile menu
- ✅ Focus returns to trigger when menu closes
- ✅ 4.5:1 contrast ratio for text (WCAG 1.4.3)
- ✅ Visible focus indicators

### Implementation Pattern
```tsx
<>
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>

  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <NavLink to="/" /* aria-current automatically added when active */>
        Home
      </NavLink>
    </nav>
  </header>

  <main id="main-content">
    {/* Page content */}
  </main>
</>
```

**Testing**: Use axe DevTools, keyboard-only navigation, NVDA/JAWS screen readers

---

## Technology Stack Confirmation

**Frontend**:
- React 19.1.1 ✅ (already in PayPlan)
- React Router DOM 7.9.3 ✅ (already installed)
- TypeScript 5.8.3 ✅
- Tailwind CSS 4.1.13 ✅ (for styling)
- Radix UI components ✅ (for dialogs if needed)

**Testing**:
- Vitest 3.2.4 ✅
- Testing Library React 16.3.0 ✅
- vitest-axe 0.1.0 ✅ (accessibility testing)

**New Dependencies Needed**:
- `react-focus-lock` or `focus-trap-react` (focus management for mobile menu)
- No other new dependencies required

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Route navigation | <200ms | Click to new page render (SC-007) |
| Menu animations | <300ms | Open/close transitions (SC-008) |
| Mobile menu open | <300ms | Hamburger click to drawer visible |
| NavigationHeader render | <50ms | Component update time |

**Monitoring**: Use React DevTools Profiler, Performance API marks

---

## Implementation Phases

### Phase 1: Desktop Navigation (P1)
- NavigationHeader component with NavLink items
- Skip link and landmark roles
- Active state styling (4.5:1 contrast)
- Keyboard accessibility (Tab, Enter)

### Phase 2: Mobile Navigation (P1)
- Responsive hamburger button (<768px breakpoint)
- Slide-out drawer with animations
- Focus trap, ESC key, backdrop click
- Auto-close on navigation

### Phase 3: Archive Integration (P2)
- Wire CreateArchiveDialog into payment results
- Add "Create Archive" button to ResultsThisWeek
- Test archive creation flow

### Phase 4: Breadcrumbs (P3)
- Breadcrumb component with useLocation()
- Display on archive detail pages
- Handle long names (ellipsis + hover)

### Phase 5: Polish & Optimization
- React.memo() optimization
- Performance logging
- Accessibility audit (axe DevTools)
- Cross-browser testing

---

## Key Resources

**Official Documentation**:
- React Router 7: https://reactrouter.com/
- WCAG 2.1 Quick Reference: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Navigation Role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Navigation_Role

**Libraries**:
- react-focus-lock: https://github.com/theKashey/react-focus-lock
- focus-trap-react: https://github.com/focus-trap/focus-trap-react

**Testing Tools**:
- axe DevTools (Chrome extension)
- React DevTools Profiler
- Lighthouse accessibility audit

---

**Research Status**: ✅ Complete
**Ready for**: Phase 1 Design (data-model.md, contracts/)
**Last Updated**: 2025-10-22
