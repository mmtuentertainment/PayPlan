/**
 * Navigation State Management Hook
 * Feature: 017-navigation-system
 *
 * Custom hook for managing mobile menu open/closed state with focus management.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface NavigationState {
  /** Whether mobile menu is currently open */
  mobileMenuOpen: boolean;

  /** Element that triggered the menu opening (for focus return) */
  triggerElement: HTMLElement | null;

  /** Open the mobile menu */
  openMobileMenu: (trigger: HTMLElement) => void;

  /** Close the mobile menu */
  closeMobileMenu: () => void;
}

/**
 * Manages mobile navigation menu state
 *
 * Features:
 * - Open/close state management
 * - Body scroll locking when menu open
 * - Focus return to trigger element when menu closes
 *
 * @returns Navigation state and control functions
 */
export function useNavigationState(): NavigationState {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  /**
   * Opens the mobile menu
   * - Sets menu state to open
   * - Stores trigger element for focus return
   * - Disables body scroll
   */
  const openMobileMenu = useCallback((trigger: HTMLElement) => {
    setMobileMenuOpen(true);
    setTriggerElement(trigger);
    triggerRef.current = trigger;
    document.body.style.overflow = 'hidden';
  }, []);

  /**
   * Closes the mobile menu
   * - Sets menu state to closed
   * - Re-enables body scroll
   * - Returns focus to trigger element (safely)
   */
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';

    // Safely return focus to the element that opened the menu
    if (triggerRef.current) {
      try {
        triggerRef.current.focus();
      } catch (error) {
        // Element may have been removed from DOM - fail gracefully
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Could not return focus to trigger element:', error);
        }
      }
      triggerRef.current = null;
      setTriggerElement(null);
    }
  }, []);

  // Cleanup: ensure body scroll is restored on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return {
    mobileMenuOpen,
    triggerElement,
    openMobileMenu,
    closeMobileMenu,
  };
}
