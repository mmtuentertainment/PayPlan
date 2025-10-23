# Implementation Plan: Navigation & Discovery System

**Branch**: `017-navigation-system` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)

## Summary

Add persistent navigation header, mobile menu, breadcrumbs, and wire CreateArchiveDialog to payment results. Solves critical blocker where 75% of features are inaccessible.

**Technical Approach**: NavigationHeader in root App component above React Router outlet. Use NavLink for active states. Mobile hamburger menu with slide-out drawer. Breadcrumbs read useLocation() for context.

## Technical Context

**Language/Version**: TypeScript 5.8.3, Node.js 20.x
**Primary Dependencies**: React 19.1.1, React Router DOM 7.9.3, react-focus-lock 2.13.6, @radix-ui/react-tooltip, Radix UI, Tailwind CSS 4.1.13
**Storage**: N/A (transient UI state only)
**Testing**: Vitest 3.2.4, Testing Library React 16.3.0, vitest-axe 0.1.0, @testing-library/user-event 14.5.2
**Target Platform**: Web browsers (mobile + desktop), ≥320px width
**Project Type**: Web application (frontend SPA + backend API)
**Performance Goals**: <200ms route changes, <300ms menu animations (SC-007, SC-008)
**Constraints**: WCAG 2.1 AA, keyboard nav (Tab/Enter/ESC), 44x44px touch targets
**Scale/Scope**: 3 nav items, 1-3 breadcrumb levels max

## Constitution Check

✅ Test-First Development required
✅ WCAG 2.1 AA accessibility
✅ Performance monitoring utilities available
✅ React Router 7.9.3 existing routes

**Violations**: None

## Project Structure

```
frontend/src/
├── components/navigation/
│   ├── NavigationHeader.tsx/.test.tsx
│   ├── Breadcrumbs.tsx/.test.tsx
│   └── MobileMenu.tsx/.test.tsx
├── hooks/useNavigationState.ts
├── routes.ts (modify: add SETTINGS)
└── App.tsx (modify: add NavigationHeader)
```

**Phase 0**: research.md ✅
**Phase 1**: data-model.md, contracts/, quickstart.md ✅
**Phase 2**: tasks.md (via /speckit.tasks)
