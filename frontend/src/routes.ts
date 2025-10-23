/**
 * Application Routes Constants
 *
 * Features:
 * - 016-build-a-payment-archive (Archives routes)
 * - 017-navigation-system (Settings route)
 *
 * Centralized route constants to prevent string duplication
 * and enable easier refactoring.
 */

/**
 * Application route paths
 */
export const ROUTES = {
  /** Home page */
  HOME: '/',

  /** Payment archives list page */
  ARCHIVES: '/archives',

  /**
   * Archive detail page (parameterized)
   * @param archiveId - Archive UUID
   * @returns Route path with archiveId
   */
  ARCHIVE_DETAIL: (archiveId: string) => `/archives/${archiveId}`,

  /** Archive detail route pattern (for React Router path prop) */
  ARCHIVE_DETAIL_PATTERN: '/archives/:id',

  /** User preferences settings page (Feature 017) */
  SETTINGS: '/settings/preferences',
} as const;
