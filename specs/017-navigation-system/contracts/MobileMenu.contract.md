# Component Contract: MobileMenu

**Component**: `MobileMenu`
**Type**: Presentation Component (UI)
**Feature**: 017-navigation-system
**Date**: 2025-10-22

---

## Purpose

Slide-out navigation drawer for mobile devices (<768px). Provides accessible, touch-friendly navigation with focus management, keyboard support, and automatic close behaviors.

---

## Props Interface

```typescript
interface MobileMenuProps {
  /** Whether the mobile menu is currently open */
  isOpen: boolean;

  /** Callback fired when menu should close */
  onClose: () => void;

  /** Navigation items to display in menu */
  navItems: NavigationItem[];

  /** Optional className for drawer customization */
  className?: string;
}
```

---

## Behavior Specification

### Opening Behavior

**GIVEN** `isOpen` prop changes from `false` to `true`
**WHEN** MobileMenu renders
**THEN** it:
- Slides in from left side (300ms animation)
- Displays backdrop overlay
- Moves focus to first focusable element (close button)
- Disables body scroll (`document.body.style.overflow = 'hidden'`)
- Traps focus within menu

### Closing Behavior - User Actions

**GIVEN** menu is open
**WHEN** user clicks close button (×)
**THEN** menu closes and `onClose()` called

**GIVEN** menu is open
**WHEN** user clicks backdrop overlay
**THEN** menu closes and `onClose()` called

**GIVEN** menu is open
**WHEN** user presses ESC key
**THEN** menu closes and `onClose()` called

**GIVEN** menu is open
**WHEN** user clicks any navigation link
**THEN** menu closes automatically and `onClose()` called

### Closing Behavior - Post-Close

**GIVEN** `isOpen` prop changes from `true` to `false`
**WHEN** MobileMenu unmounts/hides
**THEN** it:
- Slides out with 300ms animation
- Removes backdrop overlay
- Re-enables body scroll (`document.body.style.overflow = ''`)
- Returns focus to hamburger button (trigger element)

### Focus Management

**GIVEN** menu is open
**WHEN** user tabs through focusable elements
**THEN** focus cycles:
1. Close button
2. First nav item
3. Second nav item
4. Third nav item
5. Back to close button (focus trapped)

**GIVEN** menu is open and user on last focusable element
**WHEN** user presses Tab
**THEN** focus wraps to first element (close button)

**GIVEN** menu is open and user on first focusable element
**WHEN** user presses Shift+Tab
**THEN** focus wraps to last element (last nav item)

---

## Accessibility Requirements

### Semantic HTML & ARIA

```html
<!-- Backdrop -->
<div class="mobile-menu-backdrop" aria-hidden="true"></div>

<!-- Drawer -->
<div
  class="mobile-menu-drawer"
  role="dialog"
  aria-modal="true"
  aria-label="Navigation menu"
>
  <div class="mobile-menu-header">
    <h2 id="mobile-menu-title">Menu</h2>
    <button aria-label="Close menu" class="mobile-menu-close">
      <span aria-hidden="true">×</span>
    </button>
  </div>

  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/archives">Archives</a></li>
      <li><a href="/settings/preferences">Settings</a></li>
    </ul>
  </nav>
</div>
```

### ARIA Attributes

- `role="dialog"` on drawer container
- `aria-modal="true"` on drawer (indicates modal behavior)
- `aria-label="Navigation menu"` on drawer
- `aria-label="Close menu"` on close button
- `aria-hidden="true"` on backdrop (decorative)
- `aria-hidden="true"` on close button icon (×)

### Keyboard Navigation

- **Tab**: Move forward through focusable elements (trapped)
- **Shift+Tab**: Move backward through focusable elements (trapped)
- **Enter/Space**: Activate focused link or button
- **ESC**: Close menu

### Screen Reader Announcements

**GIVEN** menu opens
**WHEN** focus moves to menu
**THEN** screen reader announces:
- "Navigation menu, dialog"
- Focus on close button: "Close menu, button"

---

## Visual Requirements

### Layout

- **Drawer width**: 280px (mobile), 320px (tablet)
- **Drawer height**: 100vh (full viewport height)
- **Drawer position**: Fixed, left: 0, top: 0
- **Z-index**: 1000 (drawer), 999 (backdrop)

### Animation

- **Slide-in**: `transform: translateX(-100%)` → `translateX(0)` over 300ms
- **Slide-out**: `transform: translateX(0)` → `translateX(-100%)` over 300ms
- **Easing**: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard)
- **Backdrop fade**: `opacity: 0` → `opacity: 0.5` over 300ms

**Reduced Motion**: Use `prefers-reduced-motion: reduce` media query
```css
@media (prefers-reduced-motion: reduce) {
  .mobile-menu-drawer {
    transition: none; /* No animation */
  }
}
```

### Touch Targets

- **Close button**: 44x44px minimum
- **Nav links**: 44px minimum height, full-width clickable area
- **Link spacing**: 8px vertical spacing between links

### Colors

- **Backdrop**: `rgba(0, 0, 0, 0.5)` (50% black overlay)
- **Drawer background**: `#ffffff` (light theme) or `#1a1a1a` (dark theme)
- **Link text**: 4.5:1 contrast ratio minimum (WCAG 2.1 AA)
- **Active link**: Bold or highlighted background

---

## Performance Requirements

### Animation Performance

- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `left`, `width`, or `margin` (causes layout reflow)
- Target 60fps (16.67ms per frame)

### Rendering

- Conditional rendering: `{isOpen && <MobileMenu />}` (unmount when closed)
- Or CSS `display: none` with `aria-hidden="true"` when closed

### Metrics

- Open animation: <300ms (SC-008)
- Close animation: <300ms
- Focus trap activation: <50ms

---

## Test Assertions

### Unit Tests (Vitest)

```typescript
describe('MobileMenu', () => {
  const mockNavItems = [
    { id: 'home', label: 'Home', to: '/' },
    { id: 'archives', label: 'Archives', to: '/archives' },
    { id: 'settings', label: 'Settings', to: '/settings/preferences' },
  ];

  it('renders drawer when isOpen is true', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    expect(dialog).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />);

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />);

    const backdrop = screen.getByTestId('mobile-menu-backdrop');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when nav item clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />);

    await user.click(screen.getByRole('link', { name: 'Archives' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables body scroll when open', () => {
    const { rerender } = render(
      <MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />
    );

    expect(document.body.style.overflow).toBe('');

    rerender(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('focuses close button when opened', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    expect(closeButton).toHaveFocus();
  });

  it('traps focus within menu', async () => {
    const user = userEvent.setup();
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    const firstLink = screen.getByRole('link', { name: 'Home' });
    const lastLink = screen.getByRole('link', { name: 'Settings' });

    expect(closeButton).toHaveFocus();

    // Tab to first link
    await user.tab();
    expect(firstLink).toHaveFocus();

    // Tab to last link
    await user.tab();
    await user.tab();
    expect(lastLink).toHaveFocus();

    // Tab should wrap to close button
    await user.tab();
    expect(closeButton).toHaveFocus();

    // Shift+Tab should wrap to last link
    await user.tab({ shift: true });
    expect(lastLink).toHaveFocus();
  });

  it('renders all navigation items', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('highlights active link', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />, {
      wrapper: RouterWrapper('/archives'),
    });

    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('aria-current', 'page');
  });
});
```

### Accessibility Tests (vitest-axe)

```typescript
import { axe } from 'vitest-axe';

describe('MobileMenu Accessibility', () => {
  it('has no accessibility violations when open', async () => {
    const { container } = render(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has dialog role with aria-modal', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has accessible name for dialog', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    expect(screen.getByRole('dialog', { name: 'Navigation menu' })).toBeInTheDocument();
  });

  it('has accessible close button', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    expect(closeButton).toBeInTheDocument();
  });

  it('hides backdrop from accessibility tree', () => {
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    const backdrop = screen.getByTestId('mobile-menu-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });
});
```

### Integration Tests

```typescript
describe('MobileMenu Integration', () => {
  it('navigates to route when link clicked and closes', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('link', { name: 'Archives' }));

    expect(window.location.pathname).toBe('/archives');
    expect(onClose).toHaveBeenCalled();
  });

  it('returns focus to trigger element after closing', async () => {
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'Open Menu';
    document.body.appendChild(triggerButton);
    triggerButton.focus();

    const { rerender } = render(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    expect(document.activeElement).not.toBe(triggerButton);

    rerender(<MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />);

    expect(document.activeElement).toBe(triggerButton);

    document.body.removeChild(triggerButton);
  });
});
```

### Performance Tests

```typescript
describe('MobileMenu Performance', () => {
  it('opens in <300ms', async () => {
    const start = performance.now();
    render(<MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />);

    // Wait for animation
    await waitFor(() => {
      const drawer = screen.getByRole('dialog');
      expect(getComputedStyle(drawer).transform).toBe('translateX(0)');
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(300);
  });

  it('closes in <300ms', async () => {
    const { rerender } = render(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const start = performance.now();
    rerender(<MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(300);
  });
});
```

---

## Error Handling

### Invalid Props

**GIVEN** `navItems` is empty array
**WHEN** MobileMenu renders
**THEN** it displays menu header but no nav items (graceful degradation)

**GIVEN** `onClose` is undefined
**WHEN** user tries to close menu
**THEN** it logs console warning and fails gracefully (menu stays open)

### Runtime Errors

**GIVEN** trigger element is removed from DOM
**WHEN** menu closes
**THEN** it skips focus return (no error thrown)

---

## Dependencies

- `react` (19.1.1)
- `react-router-dom` (7.9.3) - NavLink for active state
- `react-focus-lock` or `focus-trap-react` - Focus trap implementation
- Tailwind CSS (4.1.13) - Styling

---

## Files

**Component**: `frontend/src/components/navigation/MobileMenu.tsx`
**Tests**: `frontend/src/components/navigation/MobileMenu.test.tsx`
**Styles**: Inline Tailwind classes or CSS module

---

## Success Criteria

- ✅ FR-007 met: Touch-friendly with 44x44px targets
- ✅ FR-005 met: Keyboard accessible (ESC closes menu)
- ✅ WCAG 2.1 AA compliant (focus trap, ARIA attributes, keyboard nav)
- ✅ SC-008 met: Animations <300ms
- ✅ All test assertions pass (unit, accessibility, integration, performance)

---

**Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-22
