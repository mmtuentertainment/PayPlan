/**
 * NavigationHeader Component
 * Feature: 017-navigation-system
 *
 * Persistent navigation header with desktop (horizontal) and mobile (hamburger menu) layouts.
 * Provides links to Home, Archives, and Settings with WCAG 2.1 AA compliance.
 */

import { memo, useRef, useId } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavigationItem, NavigationHeaderProps } from '../../types/navigation';
import { ROUTES } from '../../routes';
import { useNavigationState } from '../../hooks/useNavigationState';
import { MobileMenu } from './MobileMenu';

/**
 * Default navigation items for the application
 * Updated for Budget App pivot (2025-10-29)
 */
const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: ROUTES.HOME,
    ariaLabel: 'View budget dashboard',
  },
  {
    id: 'categories',
    label: 'Categories',
    to: ROUTES.CATEGORIES,
    ariaLabel: 'Manage spending categories',
  },
  {
    id: 'budgets',
    label: 'Budgets',
    to: ROUTES.BUDGETS,
    ariaLabel: 'View and manage budgets',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    to: ROUTES.TRANSACTIONS,
    ariaLabel: 'View and add transactions',
  },
  {
    id: 'archives',
    label: 'Archives',
    to: ROUTES.ARCHIVES,
    ariaLabel: 'View archived budgets',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: ROUTES.SETTINGS,
    ariaLabel: 'Manage app settings',
  },
];

/**
 * NavigationHeader - Persistent navigation header component
 *
 * Desktop view (>= 768px): Horizontal navigation bar with all items visible
 * Mobile view (< 768px): Hamburger button that opens slide-out menu
 *
 * @param props - Component props
 * @returns Rendered navigation header
 */
export const NavigationHeader = memo<NavigationHeaderProps>(function NavigationHeader({
  className = '',
  navItems = DEFAULT_NAV_ITEMS,
}) {
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } =
    useNavigationState();

  /**
   * Base link styles for navigation items
   * - px-4 py-2: Adequate padding for touch targets (44x44px minimum)
   * - text-gray-700: Base text color (4.5:1 contrast ratio on white)
   * - hover:bg-gray-100: Subtle hover background
   * - hover:text-gray-900: Darker text on hover
   * - rounded-md: Smooth border radius
   * - transition-colors: Smooth color transitions
   * - focus-visible:outline-2: Visible focus indicator
   */
  const baseLinkClasses =
    'px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  /**
   * Active link additional styles
   * - bg-blue-50: Light blue background for active state
   * - text-blue-700: Blue text for active link (4.5:1 contrast)
   * - font-semibold: Bolder font weight
   */
  const activeLinkClasses = 'bg-blue-50 text-blue-700 font-semibold';

  /**
   * Handles hamburger button click
   */
  const handleHamburgerClick = () => {
    if (hamburgerRef.current) {
      openMobileMenu(hamburgerRef.current);
    }
  };

  /**
   * Renders a navigation item
   * - Uses NavLink for internal links (automatic aria-current)
   * - Uses anchor tag for external links
   */
  const renderNavItem = (item: NavigationItem) => {
    const { id, label, to, isExternal, ariaLabel } = item;

    // External links
    if (isExternal) {
      return (
        <a
          key={id}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel || label}
          className={baseLinkClasses}
        >
          {label}
        </a>
      );
    }

    // Internal links with NavLink
    return (
      <NavLink
        key={id}
        to={to}
        {...(to === ROUTES.HOME ? { end: true } : {})}
        {...(ariaLabel && { 'aria-label': ariaLabel })}
        className={({ isActive }) =>
          `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`
        }
      >
        {label}
      </NavLink>
    );
  };

  return (
    <>
      <header
        className={`bg-white border-b border-gray-200 shadow-sm ${className}`}
      >
        <nav
          aria-label="Main navigation"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center justify-between h-16">
            {/* Desktop navigation - visible on md+ screens */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(renderNavItem)}
            </div>

            {/* Mobile hamburger button - visible on screens < md (768px) */}
            <button
              ref={hamburgerRef}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls={drawerId}
              onClick={handleHamburgerClick}
              className="md:hidden p-2.5 min-w-[44px] min-h-[44px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {/* Hamburger icon (three horizontal lines) */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        navItems={navItems}
        drawerId={drawerId}
      />
    </>
  );
});
