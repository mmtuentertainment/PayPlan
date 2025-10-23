/**
 * Z-Index Constants
 * Feature: 017-navigation-system
 *
 * Centralized z-index values to prevent conflicts and maintain proper stacking order.
 *
 * Stack order (bottom to top):
 * - Base content: auto/0
 * - Sticky header: 40
 * - Dropdowns/Popovers: 50
 * - Mobile menu backdrop: 999
 * - Mobile menu drawer: 1000
 * - Modals: 1050
 * - Toasts: 1100
 */

export const Z_INDEX = {
  /** Base content and normal flow */
  BASE: 0,

  /** Sticky headers and navigation */
  STICKY_HEADER: 40,

  /** Dropdown menus and popovers */
  DROPDOWN: 50,

  /** Mobile navigation backdrop overlay */
  MOBILE_MENU_BACKDROP: 999,

  /** Mobile navigation drawer */
  MOBILE_MENU_DRAWER: 1000,

  /** Modal dialogs */
  MODAL: 1050,

  /** Toast notifications */
  TOAST: 1100,
} as const;

export type ZIndexValue = (typeof Z_INDEX)[keyof typeof Z_INDEX];
