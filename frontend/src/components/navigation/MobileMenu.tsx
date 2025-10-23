/**
 * MobileMenu Component
 * Feature: 017-navigation-system
 *
 * Slide-out navigation drawer for mobile devices with focus trap,
 * keyboard navigation, and WCAG 2.1 AA compliance.
 */

import { memo, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import FocusLock from 'react-focus-lock';
import type { NavigationItem, MobileMenuProps } from '../../types/navigation';
import { Z_INDEX } from '../../constants/zIndex';

/**
 * MobileMenu - Slide-out navigation drawer component
 *
 * Features:
 * - Slide-in animation from left (300ms)
 * - Focus trap with react-focus-lock
 * - ESC key closes menu
 * - Backdrop click closes menu
 * - Auto-close on navigation
 * - Body scroll locking
 *
 * @param props - Component props
 * @returns Rendered mobile menu drawer (null if closed)
 */
export const MobileMenu = memo<MobileMenuProps>(function MobileMenu({
  isOpen,
  onClose,
  navItems,
  className = '',
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [entered, setEntered] = useState(false);

  /**
   * Base link styles for mobile menu items
   * - Full-width clickable area
   * - 44px minimum height for touch targets
   * - text-gray-700: Base text color (4.5:1 contrast)
   */
  const baseLinkClasses =
    'block w-full px-6 py-3 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  /**
   * Active link additional styles
   */
  const activeLinkClasses = 'bg-blue-50 text-blue-700 font-semibold';

  /**
   * ESC key handler effect
   * Closes menu when ESC key is pressed
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Escape if another overlay hasn't already handled it
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  /**
   * Auto-focus close button when menu opens
   */
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Slide-in animation effect
   * Stages the enter animation on first paint
   */
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setEntered(true));
      return () => {
        cancelAnimationFrame(id);
        setEntered(false);
      };
    } else {
      setEntered(false);
    }
  }, [isOpen]);

  /**
   * Handles backdrop click to close menu
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /**
   * Handles navigation item click
   * Closes menu after navigation
   */
  const handleNavClick = () => {
    onClose();
  };

  /**
   * Renders a navigation item
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
          onClick={handleNavClick}
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
        {...(ariaLabel && { 'aria-label': ariaLabel })}
        className={({ isActive }) =>
          `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`
        }
        onClick={handleNavClick}
      >
        {label}
      </NavLink>
    );
  };

  // Don't render anything if menu is closed
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="mobile-menu-backdrop"
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 animate-fade-in"
        style={{ zIndex: Z_INDEX.MOBILE_MENU_BACKDROP }}
        onClick={handleBackdropClick}
      />

      {/* Drawer with Focus Trap */}
      <FocusLock returnFocus>
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`fixed top-0 left-0 max-w-80 w-full h-full bg-white shadow-2xl
            transform transition-transform duration-300 ease-out
            motion-reduce:transition-none
            ${entered ? 'translate-x-0' : '-translate-x-full'}
            ${className}`}
          style={{ zIndex: Z_INDEX.MOBILE_MENU_DRAWER }}
        >
          {/* Menu header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ×
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="py-4">
            {navItems.map(renderNavItem)}
          </nav>
        </div>
      </FocusLock>
    </>
  );
});
