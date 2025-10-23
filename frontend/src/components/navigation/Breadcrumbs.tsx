/**
 * Breadcrumbs Component
 * Feature: 017-navigation-system
 *
 * Displays hierarchical navigation trail showing current page location.
 * Automatically generates breadcrumb trail based on current route.
 * WCAG 2.1 AA compliant with proper ARIA attributes.
 *
 * @security NO sensitive financial data in breadcrumb labels
 * @privacy Truncates labels to prevent PII exposure
 */

import { memo, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { BreadcrumbsProps, BreadcrumbItem } from '../../types/navigation';
import { ROUTES } from '../../routes';

/**
 * Truncates a label to a maximum length with ellipsis
 *
 * @param label - The label to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated label with ellipsis if needed
 */
function truncateLabel(label: string, maxLength: number): string {
  if (maxLength < 4) {
    return '...';
  }
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 3)}...`;
}

/**
 * Generates breadcrumb trail based on current pathname
 *
 * @param pathname - Current location pathname
 * @param maxLabelLength - Maximum length for labels before truncation
 * @returns Array of breadcrumb items
 */
function generateBreadcrumbs(
  pathname: string,
  maxLabelLength: number
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      path: ROUTES.HOME,
      isCurrent: pathname === ROUTES.HOME,
    },
  ];

  // Don't add more breadcrumbs if we're on home
  if (pathname === ROUTES.HOME) {
    return breadcrumbs;
  }

  // Archives list page
  if (pathname === ROUTES.ARCHIVES) {
    breadcrumbs.push({
      label: 'Archives',
      path: ROUTES.ARCHIVES,
      isCurrent: true,
    });
    return breadcrumbs;
  }

  // Archive detail page (e.g., /archives/:id)
  if (pathname.startsWith('/archives/')) {
    const archiveId = pathname.split('/')[2];

    breadcrumbs.push({
      label: 'Archives',
      path: ROUTES.ARCHIVES,
      isCurrent: false,
    });

    // Truncate archive ID to prevent sensitive data exposure
    const truncatedId = truncateLabel(archiveId || 'Unknown', maxLabelLength);

    breadcrumbs.push({
      label: `Archive ${truncatedId}`,
      path: pathname,
      isCurrent: true,
    });
    return breadcrumbs;
  }

  // Settings page
  if (pathname === ROUTES.SETTINGS) {
    breadcrumbs.push({
      label: 'Settings',
      path: ROUTES.SETTINGS,
      isCurrent: true,
    });
    return breadcrumbs;
  }

  // Other pages (Docs, Privacy, Demo, Import)
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    const label = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);

    breadcrumbs.push({
      label: truncateLabel(label, maxLabelLength),
      path: pathname,
      isCurrent: true,
    });
  }

  return breadcrumbs;
}

/**
 * Breadcrumbs - Navigation breadcrumb trail component
 *
 * Displays hierarchical location within the application.
 * Automatically updates based on current route.
 *
 * Accessibility:
 * - Uses <nav> with aria-label="Breadcrumb"
 * - Current page marked with aria-current="page"
 * - Visual separator (/) hidden from screen readers
 * - All links have proper contrast ratios
 *
 * @param props - Component props
 * @returns Rendered breadcrumb navigation
 */
export const Breadcrumbs = memo<BreadcrumbsProps>(function Breadcrumbs({
  className = '',
  maxLabelLength = 50,
}) {
  const location = useLocation();

  // Generate breadcrumbs based on current location
  const breadcrumbs = useMemo(
    () => generateBreadcrumbs(location.pathname, maxLabelLength),
    [location.pathname, maxLabelLength]
  );

  // Don't render if only home breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`bg-gray-50 border-b border-gray-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 py-3 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {/* Breadcrumb link or current page */}
                {isLast ? (
                  <span
                    aria-current="page"
                    className="text-gray-900 font-medium"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-blue-600 hover:text-blue-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                  >
                    {crumb.label}
                  </Link>
                )}

                {/* Separator (hidden from screen readers) */}
                {!isLast && (
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
});
