/**
 * MobileMenu Component Tests
 * Feature: 017-navigation-system
 *
 * Tests slide-out drawer, focus trap, keyboard navigation, and accessibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';
import type { NavigationItem } from '../../types/navigation';

// Test navigation items
const mockNavItems: NavigationItem[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'archives', label: 'Archives', to: '/archives' },
  { id: 'settings', label: 'Settings', to: '/settings/preferences' },
];

// Helper to render with router
const renderWithRouter = (
  component: React.ReactElement,
  initialRoute = '/'
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  );
};

describe('MobileMenu - Rendering', () => {
  it('renders drawer when isOpen is true', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const dialog = screen.getByRole('dialog', { name: /navigation menu/i });
    expect(dialog).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderWithRouter(
      <MobileMenu isOpen={false} onClose={vi.fn()} navItems={mockNavItems} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('handles empty navigation items array gracefully', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={[]} />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Close button should still be present
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });

  it('highlights active link with aria-current', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />,
      '/archives'
    );

    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('aria-current', 'page');
  });

  it('accepts custom className prop', () => {
    const { container } = renderWithRouter(
      <MobileMenu
        isOpen={true}
        onClose={vi.fn()}
        navItems={mockNavItems}
        className="custom-drawer"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-drawer');
  });
});

describe('MobileMenu - Close Behavior', () => {
  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
    );

    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
    );

    const backdrop = screen.getByTestId('mobile-menu-backdrop');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when nav item clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
    );

    await user.click(screen.getByRole('link', { name: 'Archives' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside drawer (not backdrop)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={onClose} navItems={mockNavItems} />
    );

    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('MobileMenu - Focus Management', () => {
  it('focuses close button when opened', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const closeButton = screen.getByRole('button', { name: /close menu/i });
    expect(closeButton).toHaveFocus();
  });

  it('traps focus within menu', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const closeButton = screen.getByRole('button', { name: /close menu/i });
    const firstLink = screen.getByRole('link', { name: 'Home' });
    const lastLink = screen.getByRole('link', { name: 'Settings' });

    expect(closeButton).toHaveFocus();

    // Tab to first link
    await user.tab();
    expect(firstLink).toHaveFocus();

    // Tab through all links
    await user.tab();
    expect(screen.getByRole('link', { name: 'Archives' })).toHaveFocus();

    await user.tab();
    expect(lastLink).toHaveFocus();

    // Tab should wrap back to close button (focus trap)
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('supports reverse focus trap with Shift+Tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const closeButton = screen.getByRole('button', { name: /close menu/i });
    const lastLink = screen.getByRole('link', { name: 'Settings' });

    expect(closeButton).toHaveFocus();

    // Shift+Tab from first element should wrap to last
    await user.tab({ shift: true });
    expect(lastLink).toHaveFocus();

    // Shift+Tab again
    await user.tab({ shift: true });
    expect(screen.getByRole('link', { name: 'Archives' })).toHaveFocus();
  });
});

describe('MobileMenu - Accessibility', () => {
  it('has dialog role with aria-modal', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has accessible name for dialog', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    expect(
      screen.getByRole('dialog', { name: /navigation menu/i })
    ).toBeInTheDocument();
  });

  it('has accessible close button', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const closeButton = screen.getByRole('button', { name: /close menu/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('hides backdrop from accessibility tree', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const backdrop = screen.getByTestId('mobile-menu-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });

  it('has navigation role and label inside drawer', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />
    );

    const dialog = screen.getByRole('dialog');
    const nav = within(dialog).getByRole('navigation', {
      name: /main navigation/i,
    });
    expect(nav).toBeInTheDocument();
  });

  it('uses NavLink for automatic aria-current on active links', () => {
    renderWithRouter(
      <MobileMenu isOpen={true} onClose={vi.fn()} navItems={mockNavItems} />,
      '/settings/preferences'
    );

    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(settingsLink).toHaveAttribute('aria-current', 'page');
  });

  it('supports custom aria-label for navigation items', () => {
    const itemsWithAriaLabel: NavigationItem[] = [
      {
        id: 'settings',
        label: 'Settings',
        to: '/settings/preferences',
        ariaLabel: 'Open user preferences settings',
      },
    ];

    renderWithRouter(
      <MobileMenu
        isOpen={true}
        onClose={vi.fn()}
        navItems={itemsWithAriaLabel}
      />
    );

    const settingsLink = screen.getByRole('link', {
      name: 'Open user preferences settings',
    });
    expect(settingsLink).toBeInTheDocument();
  });
});

describe('MobileMenu - External Links', () => {
  it('handles external links with isExternal flag', () => {
    const itemsWithExternal: NavigationItem[] = [
      { id: 'home', label: 'Home', to: '/' },
      {
        id: 'docs',
        label: 'Documentation',
        to: 'https://example.com/docs',
        isExternal: true,
      },
    ];

    renderWithRouter(
      <MobileMenu
        isOpen={true}
        onClose={vi.fn()}
        navItems={itemsWithExternal}
      />
    );

    const docsLink = screen.getByRole('link', { name: 'Documentation' });
    expect(docsLink).toHaveAttribute('href', 'https://example.com/docs');
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
