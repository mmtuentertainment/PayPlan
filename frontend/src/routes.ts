/**
 * Application Routes Constants
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting) - Phase F
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
} as const;
