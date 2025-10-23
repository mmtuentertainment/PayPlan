# Component Contract: NavigationHeader

**Component**: `NavigationHeader`
**Type**: Presentation Component (UI)
**Feature**: 017-navigation-system
**Date**: 2025-10-22

---

## Purpose

Persistent navigation header that displays on all pages, providing links to Home, Archives, and Settings. Adapts to desktop (horizontal nav) and mobile (hamburger menu) layouts.

---

## Props Interface

```typescript
interface NavigationHeaderProps {
  className?: string;
  navItems?: NavigationItem[];
}
```

---

## Behavior Specification

### Desktop View (>= 768px)

**GIVEN** viewport width >= 768px
**WHEN** NavigationHeader renders
**THEN** it displays:
- Horizontal navigation bar
- All navigation items visible as NavLink components
- Active link highlighted
- No hamburger button

### Mobile View (< 768px)

**GIVEN** viewport width < 768px
**WHEN** user clicks hamburger button
**THEN**:
- Mobile menu drawer slides in
- Focus moves to first nav item
- Body scroll disabled
- Backdrop overlay appears

**GIVEN** mobile menu is open
**WHEN** user clicks nav item
**THEN**:
- Navigation occurs
- Menu automatically closes
- Focus returns to hamburger button

---

## Accessibility Requirements

```html
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>
```

### Keyboard Navigation

- **Tab**: Navigate through nav items
- **Enter/Space**: Activate focused link
- **ESC**: Close mobile menu (if open)

### ARIA Attributes

- `role="banner"` on header
- `role="navigation"` on nav
- `aria-label="Main navigation"`
- `aria-current="page"` on active link (automatic with NavLink)
- `aria-expanded` on hamburger button

### Focus Management

- Skip link before navigation
- Visible focus indicators
- Focus trap in mobile menu
- Focus return to trigger when menu closes

---

## Performance Requirements

- Component wrapped with `React.memo()`
- Navigation items array defined outside component
- Route change: <200ms (SC-007)

---

## Test Assertions

```typescript
describe('NavigationHeader', () => {
  it('renders all navigation items', () => {
    render(<NavigationHeader />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('highlights active link with aria-current', () => {
    render(<NavigationHeader />, { wrapper: RouterWrapper('/archives') });
    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('aria-current', 'page');
  });

  it('opens mobile menu when hamburger clicked', async () => {
    global.innerWidth = 375;
    const user = userEvent.setup();
    render(<NavigationHeader />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    const mobileMenu = screen.getByRole('dialog', { name: /navigation menu/i });
    expect(mobileMenu).toBeInTheDocument();
  });

  it('closes mobile menu on ESC key', async () => {
    global.innerWidth = 375;
    const user = userEvent.setup();
    render(<NavigationHeader />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to hamburger after closing menu', async () => {
    global.innerWidth = 375;
    const user = userEvent.setup();
    render(<NavigationHeader />);

    const hamburgerButton = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburgerButton);
    await user.keyboard('{Escape}');

    expect(hamburgerButton).toHaveFocus();
  });
});
```

---

## Success Criteria

- ✅ All functional requirements (FR-001, FR-002, FR-003, FR-005, FR-007, FR-008) met
- ✅ WCAG 2.1 AA compliant
- ✅ Performance: <200ms route changes, <300ms animations
- ✅ Mobile-friendly: Works on 320px+ screens, 44x44px touch targets
- ✅ All test assertions pass

---

**Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-22
