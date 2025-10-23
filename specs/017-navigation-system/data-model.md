# Data Model: Navigation & Discovery System

**Feature**: 017-navigation-system
**Date**: 2025-10-22
**Phase**: Phase 1 Design

This document defines the data entities, state management, and type definitions for the navigation system.

---

## Overview

The navigation system consists of UI state (transient, not persisted) for managing navigation menu state, mobile drawer visibility, and breadcrumb generation. No data persistence is required—all state is ephemeral and resets on page refresh.

---

## Entity Definitions

### 1. NavigationItem

Represents a single navigation menu item.

**Type Definition**:
```typescript
interface NavigationItem {
  id: string;
  label: string;
  to: string;
  icon?: React.ReactNode;
  isExternal?: boolean;
  ariaLabel?: string;
}
```

**Validation Rules**:
- `id`: Required, unique within navigation items array
- `label`: Required, non-empty string, max 20 characters
- `to`: Required, valid route path (starts with `/`)

**Example**:
```typescript
const navItems: NavigationItem[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'archives', label: 'Archives', to: '/archives' },
  { id: 'settings', label: 'Settings', to: '/settings/preferences' },
];
```

---

### 2. MobileMenuState

Manages the open/closed state of the mobile navigation drawer.

**Type Definition**:
```typescript
interface MobileMenuState {
  isOpen: boolean;
  openedAt: number | null;
  triggerElement: HTMLElement | null;
}
```

**State Transitions**:
- **Closed → Open**: User taps hamburger button
- **Open → Closed**: User taps close button, clicks backdrop, presses ESC, or navigates to new route

**Example**:
```typescript
const initialState: MobileMenuState = {
  isOpen: false,
  openedAt: null,
  triggerElement: null,
};
```

---

### 3. BreadcrumbItem

Represents a single breadcrumb in the navigation trail.

**Type Definition**:
```typescript
interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
}
```

**Example**:
```typescript
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', path: '/', isCurrent: false },
  { label: 'Archives', path: '/archives', isCurrent: false },
  { label: 'October 2025', path: '/archives/abc-123', isCurrent: true },
];
```

---

## State Management

### Approach: Local Component State (useState/useReducer)

**Rationale**:
- Navigation state is UI-only, not business logic
- No persistence required
- Simpler than global state management
- Matches PayPlan's existing patterns

### Implementation Pattern

```typescript
// hooks/useNavigationState.ts
import { useState, useCallback } from 'react';

export function useNavigationState() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const openMobileMenu = useCallback((trigger: HTMLElement) => {
    setMobileMenuOpen(true);
    setTriggerElement(trigger);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
    if (triggerElement) {
      triggerElement.focus();
      setTriggerElement(null);
    }
  }, [triggerElement]);

  return {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
  };
}
```

---

## Type Definitions

```typescript
// types/navigation.ts

export interface NavigationItem {
  id: string;
  label: string;
  to: string;
  icon?: React.ReactNode;
  isExternal?: boolean;
  ariaLabel?: string;
}

export interface MobileMenuState {
  isOpen: boolean;
  openedAt: number | null;
  triggerElement: HTMLElement | null;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
}

export interface NavigationHeaderProps {
  className?: string;
  navItems?: NavigationItem[];
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavigationItem[];
}

export interface BreadcrumbsProps {
  className?: string;
  maxLabelLength?: number;
}
```

---

## Data Flow Diagram

```
App Component
├── NavigationHeader
│   ├── Desktop Nav (NavLink items)
│   ├── Hamburger Button (<768px)
│   └── MobileMenu (slide-out drawer)
├── Breadcrumbs (useLocation → BreadcrumbItem[])
└── Routes (React Router)
```

---

## Validation & Constraints

```typescript
import { z } from 'zod';

export const NavigationItemSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(20),
  to: z.string().regex(/^\//, 'Route must start with /'),
  icon: z.any().optional(),
  isExternal: z.boolean().optional(),
  ariaLabel: z.string().max(100).optional(),
});

export const BreadcrumbItemSchema = z.object({
  label: z.string().min(1).max(50),
  path: z.string().regex(/^\//, 'Path must start with /'),
  isCurrent: z.boolean(),
});
```

---

## Performance Considerations

- **navItems**: Static array, ~300 bytes
- **breadcrumbs**: Dynamic array, ~500 bytes max
- **mobileMenuState**: ~100 bytes
- **Total**: <1 KB of navigation state

---

## Accessibility Data Requirements

```typescript
// Navigation landmark
<nav role="navigation" aria-label="Main navigation">

// Active link (automatic with NavLink)
<a href="/archives" aria-current="page">Archives</a>

// Hamburger button
<button aria-expanded={isOpen} aria-controls="mobile-menu" aria-label="Open navigation menu">

// Mobile menu
<div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">

// Breadcrumbs
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-current="page">Current Page</li>
  </ol>
</nav>
```

---

## Summary

**Entities**: 4 (NavigationItem, MobileMenuState, BreadcrumbItem, NavigationContext)
**State Management**: Local component state with custom hook
**Persistence**: None (all state is ephemeral)
**Validation**: Zod schemas for type safety
**Performance**: <1 KB memory, low update frequency
**Accessibility**: ARIA attributes data-driven from state

**Next Steps**: Generate component contracts in `/contracts/` directory.

---

**Last Updated**: 2025-10-22
**Status**: ✅ Complete
