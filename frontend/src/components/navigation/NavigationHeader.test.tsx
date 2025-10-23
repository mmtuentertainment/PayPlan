/**
 * NavigationHeader Component Tests
 * Feature: 017-navigation-system
 *
 * Tests desktop navigation, mobile menu, accessibility, and focus management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { NavigationHeader } from './NavigationHeader';
import type { NavigationItem } from '../../types/navigation';

// Test navigation items
const testNavItems: NavigationItem[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'archives', label: 'Archives', to: '/archives' },
  { id: 'settings', label: 'Settings', to: '/settings/preferences' },
];

// Helper to render with router at specific route
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

describe('NavigationHeader - Desktop View', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    // Desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders all navigation items', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('uses NavLink components for navigation items', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('href', '/archives');

    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(settingsLink).toHaveAttribute('href', '/settings/preferences');
  });

  it('highlights active link with aria-current="page"', () => {
    renderWithRouter(
      <NavigationHeader navItems={testNavItems} />,
      '/archives'
    );

    const archivesLink = screen.getByRole('link', { name: 'Archives' });
    expect(archivesLink).toHaveAttribute('aria-current', 'page');

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).not.toHaveAttribute('aria-current');
  });

  it('hides hamburger button on desktop with md:hidden class', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const hamburger = screen.getByRole('button', { name: /menu/i });
    expect(hamburger).toBeInTheDocument();
    expect(hamburger).toHaveClass('md:hidden');
  });

  it('has proper semantic structure with banner and navigation roles', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();

    const navigation = within(banner).getByRole('navigation', {
      name: 'Main navigation',
    });
    expect(navigation).toBeInTheDocument();
  });
});

describe('NavigationHeader - Mobile View', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    // Mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders hamburger button on mobile', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('hamburger button has aria-expanded=false when menu closed', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const hamburger = screen.getByRole('button', { name: /menu/i });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens mobile menu when hamburger clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);

    const mobileMenu = screen.getByRole('dialog', {
      name: /navigation menu/i,
    });
    expect(mobileMenu).toBeInTheDocument();
  });

  it('updates aria-expanded when menu opens', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);

    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });

  it('displays all navigation items in mobile menu', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    const mobileMenu = screen.getByRole('dialog');
    const links = within(mobileMenu).getAllByRole('link');

    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent('Home');
    expect(links[1]).toHaveTextContent('Archives');
    expect(links[2]).toHaveTextContent('Settings');
  });

  it('closes mobile menu on ESC key', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu when clicking backdrop', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    const backdrop = screen.getByTestId('mobile-menu-backdrop');
    await user.click(backdrop);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu when navigation item clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    const mobileMenu = screen.getByRole('dialog');
    const archivesLink = within(mobileMenu).getByRole('link', {
      name: 'Archives',
    });

    await user.click(archivesLink);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to hamburger button when menu closes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const hamburger = screen.getByRole('button', { name: /menu/i });
    await user.click(hamburger);
    await user.keyboard('{Escape}');

    expect(hamburger).toHaveFocus();
  });

  it('locks body scroll when menu opens', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unlocks body scroll when menu closes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    await user.click(screen.getByRole('button', { name: /menu/i }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });
});

describe('NavigationHeader - Accessibility', () => {
  it('has correct ARIA roles and labels', () => {
    renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('uses NavLink for automatic aria-current on active links', () => {
    renderWithRouter(
      <NavigationHeader navItems={testNavItems} />,
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

    renderWithRouter(<NavigationHeader navItems={itemsWithAriaLabel} />);

    const settingsLink = screen.getByRole('link', {
      name: 'Open user preferences settings',
    });
    expect(settingsLink).toBeInTheDocument();
  });

  it('accepts custom className prop', () => {
    const { container } = renderWithRouter(
      <NavigationHeader navItems={testNavItems} className="custom-class" />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('custom-class');
  });
});

describe('NavigationHeader - Default Behavior & Edge Cases', () => {
  it('uses default navigation items when none provided', () => {
    renderWithRouter(<NavigationHeader />);

    // Should render all default items (Home, Archives, Settings)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Archives' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('handles empty navigation items array', () => {
    renderWithRouter(<NavigationHeader navItems={[]} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('cleans up body scroll on component unmount', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithRouter(<NavigationHeader navItems={testNavItems} />);

    // Open menu (sets overflow to 'hidden')
    await user.click(screen.getByRole('button', { name: /menu/i }));
    expect(document.body.style.overflow).toBe('hidden');

    // Unmount component
    unmount();

    // Body scroll should be restored
    expect(document.body.style.overflow).toBe('');
  });
});

describe('NavigationHeader - External Links', () => {
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

    renderWithRouter(<NavigationHeader navItems={itemsWithExternal} />);

    const docsLink = screen.getByRole('link', { name: 'Documentation' });
    expect(docsLink).toHaveAttribute('href', 'https://example.com/docs');
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles external links in mobile menu', async () => {
    const user = userEvent.setup();
    const itemsWithExternal: NavigationItem[] = [
      { id: 'home', label: 'Home', to: '/' },
      {
        id: 'docs',
        label: 'Documentation',
        to: 'https://example.com/docs',
        isExternal: true,
      },
    ];

    renderWithRouter(<NavigationHeader navItems={itemsWithExternal} />);

    // Open mobile menu
    await user.click(screen.getByRole('button', { name: /menu/i }));

    // Find link inside mobile dialog
    const dialog = screen.getByRole('dialog');
    const docsLink = within(dialog).getByRole('link', { name: 'Documentation' });

    expect(docsLink).toHaveAttribute('href', 'https://example.com/docs');
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
