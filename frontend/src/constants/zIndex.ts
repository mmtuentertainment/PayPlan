/**
 * Z-Index Constants
 * Feature: 017-navigation-system
 *
 * Centralized z-index values to prevent conflicts and maintain proper stacking order.
 *
 * Stack order (bottom to top):
 * - Base content: auto/0
 * - Sticky header: 100
 * - Dropdowns/Popovers: 200
 * - Mobile menu backdrop: 1000
 * - Mobile menu drawer: 1050
 * - Modals: 1100 (must be above mobile menu for dialogs to work)
 * - Toasts: 1200 (highest priority for notifications)
 */

export const Z_INDEX = {
  /** Base content and normal flow */
  BASE: 0,

  /** Sticky headers and navigation */
  STICKY_HEADER: 100,

  /** Dropdown menus and popovers */
  DROPDOWN: 200,

  /** Mobile navigation backdrop overlay */
  MOBILE_MENU_BACKDROP: 1000,

  /** Mobile navigation drawer */
  MOBILE_MENU_DRAWER: 1050,

  /** Modal dialogs (must be above mobile menu) */
  MODAL: 1100,

  /** Toast notifications (highest priority) */
  TOAST: 1200,
} as const;

export type ZIndexValue = (typeof Z_INDEX)[keyof typeof Z_INDEX];
