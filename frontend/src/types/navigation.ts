/**
 * Navigation System Type Definitions
 * Feature: 017-navigation-system
 *
 * Type definitions for navigation components, state management, and accessibility.
 * Includes Zod schemas for runtime validation of security and privacy constraints.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';

/**
 * Navigation menu item configuration
 *
 * @security External links MUST use rel="noopener noreferrer" to prevent tab-nabbing
 * @privacy DO NOT include PII, account numbers, balances, or sensitive financial data in label or to fields
 */
export interface NavigationItem {
  /** Unique identifier for the nav item */
  id: string;

  /**
   * Display label shown to users
   * @privacy MUST NOT contain PII, account numbers, or sensitive data
   */
  label: string;

  /**
   * Route path (React Router path or external URL)
   * @privacy MUST NOT contain PII, account numbers, transaction IDs, or sensitive data
   */
  to: string;

  /** Optional icon component */
  icon?: ReactNode;

  /**
   * Optional external link indicator
   * @security When true, implementations MUST use rel="noopener noreferrer" and target="_blank"
   */
  isExternal?: boolean;

  /** Optional aria-label override for accessibility */
  ariaLabel?: string;
}

/**
 * Zod schema for runtime validation of NavigationItem
 *
 * Enforces security and privacy constraints at runtime:
 * - Prevents PII in labels and URLs
 * - Validates external link security attributes
 * - Ensures no sensitive financial data leaks
 */
export const navigationItemSchema = z.object({
  id: z.string().min(1, 'Navigation item ID cannot be empty'),
  label: z
    .string()
    .min(1, 'Navigation label cannot be empty')
    .refine(
      (val) => !/(account|balance|\$\d+|card.*\d{4})/i.test(val),
      'Label must not contain PII, account numbers, or financial data'
    ),
  to: z
    .string()
    .min(1, 'Navigation path cannot be empty')
    .refine(
      (val) => !/(account_id|user_id|transaction_id)=/i.test(val),
      'URL must not contain sensitive identifiers in query params'
    ),
  icon: z.any().optional(),
  isExternal: z.boolean().optional(),
  ariaLabel: z.string().optional(),
});

/**
 * Mobile menu state management
 */
export interface MobileMenuState {
  /** Whether mobile menu is currently open */
  isOpen: boolean;

  /** Timestamp when menu was opened (for animation timing) */
  openedAt: number | null;

  /** Element that triggered menu open (for focus return) */
  triggerElement: HTMLElement | null;
}

/**
 * Breadcrumb trail item
 *
 * @privacy DO NOT include sensitive BNPL data (account numbers, balances, transaction IDs, PII)
 */
export interface BreadcrumbItem {
  /**
   * Display label for this breadcrumb
   * @privacy MUST NOT contain account numbers, balances, transaction IDs, or PII
   */
  label: string;

  /**
   * Route path to navigate to
   * @privacy MUST NOT contain account numbers, balances, transaction IDs, or PII
   */
  path: string;

  /** Whether this is the current page (last breadcrumb) */
  isCurrent: boolean;
}

/**
 * Navigation header component props
 */
export interface NavigationHeaderProps {
  /** Optional className for styling customization */
  className?: string;

  /** Navigation items (defaults to built-in config if not provided) */
  navItems?: NavigationItem[];
}

/**
 * Mobile menu component props
 */
export interface MobileMenuProps {
  /** Whether the mobile menu is currently open */
  isOpen: boolean;

  /** Callback fired when menu should close */
  onClose: () => void;

  /** Navigation items to display in menu */
  navItems: NavigationItem[];

  /** Optional className for drawer customization */
  className?: string;
}

/**
 * Breadcrumbs component props
 */
export interface BreadcrumbsProps {
  /** Optional className for styling customization */
  className?: string;

  /** Maximum length for breadcrumb labels before truncation (default: 50) */
  maxLabelLength?: number;
}

/**
 * Hamburger button component props
 */
export interface HamburgerButtonProps {
  /** Whether menu is currently open */
  isOpen: boolean;

  /** Click handler */
  onClick: (trigger: HTMLElement) => void;

  /** Optional aria-label override */
  ariaLabel?: string;
}
