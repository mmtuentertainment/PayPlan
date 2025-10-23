import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { z } from 'zod';
import { ROUTES } from '@/routes';
import { usePaymentArchives } from '@/hooks/usePaymentArchives';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  maxLabelLength?: number;
}

/**
 * Truncate label if exceeds maxLength
 * CodeRabbit: Handle edge cases for very small maxLength values
 */
function truncateLabel(label: string, maxLength: number): string {
  if (maxLength <= 0) return '';
  if (maxLength <= 3) return '.'.repeat(maxLength);
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
}

/**
 * Breadcrumbs Component
 *
 * Feature: 017-navigation-system
 * User Story 3: Discover Features Through Breadcrumbs
 * Tasks: T034-T043
 *
 * Hierarchical navigation showing current location in the application.
 * Displays breadcrumbs on nested pages (archive details, settings sub-pages).
 */
// Archive ID validation schema (CodeRabbit: enforce UUID format for financial IDs)
const archiveIdSchema = z.string().uuid();

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ maxLabelLength = 50 }) => {
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  // Validate params.id before using it
  const validatedId = params.id ? archiveIdSchema.safeParse(params.id) : null;
  const isArchiveDetailPage =
    location.pathname.startsWith('/archives/') &&
    validatedId?.success === true;

  // Note: usePaymentArchives is called unconditionally (React hooks requirement),
  // but it's optimized with useMemo/useEffect and only loads data once.
  // We only use getArchiveById on archive detail pages.
  const { getArchiveById, isLoading, error } = usePaymentArchives();

  // Generate breadcrumbs based on current route
  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const path = location.pathname;

    // Home page - no breadcrumbs
    if (path === ROUTES.HOME) {
      return [];
    }

    // Archives list page
    if (path === ROUTES.ARCHIVES) {
      return [
        { label: 'Home', path: ROUTES.HOME, isCurrent: false },
        { label: 'Archives', path: ROUTES.ARCHIVES, isCurrent: true },
      ];
    }

    // Archive detail page
    if (isArchiveDetailPage && validatedId?.success) {
      // Handle loading and error states
      let archiveName = 'Archive';
      if (isLoading) {
        archiveName = 'Loading...';
      } else if (error) {
        archiveName = 'Archive';
      } else {
        // Get archive name using validated ID
        // Validation already handled by ArchiveStorage.loadArchive()
        // which uses Zod validation at the storage boundary (see ArchiveStorage.ts:441)
        const archive = getArchiveById(validatedId.data);
        archiveName = archive?.name || 'Archive';
      }

      return [
        { label: 'Home', path: ROUTES.HOME, isCurrent: false },
        { label: 'Archives', path: ROUTES.ARCHIVES, isCurrent: false },
        { label: archiveName, path: path, isCurrent: true },
      ];
    }

    // Settings page
    if (path === ROUTES.SETTINGS || path.startsWith('/settings/')) {
      return [
        { label: 'Home', path: ROUTES.HOME, isCurrent: false },
        { label: 'Settings', path: path, isCurrent: true },
      ];
    }

    // Default: no breadcrumbs
    return [];
  }, [location.pathname, validatedId, getArchiveById, isLoading, error]);

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Tooltip.Provider>
      <nav aria-label="Breadcrumb" className="mb-4 px-4 py-2">
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const truncatedLabel = truncateLabel(breadcrumb.label, maxLabelLength);
            const isTruncated = truncatedLabel !== breadcrumb.label;

            return (
              <li key={breadcrumb.path} className="flex items-center gap-2">
                {!isLast && (
                  <>
                    {isTruncated ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            to={breadcrumb.path}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {truncatedLabel}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Content
                          className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg max-w-xs"
                          sideOffset={5}
                        >
                          {breadcrumb.label}
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Root>
                    ) : (
                      <Link
                        to={breadcrumb.path}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {truncatedLabel}
                      </Link>
                    )}
                    <span className="text-gray-400" aria-hidden="true">
                      &gt;
                    </span>
                  </>
                )}
                {isLast && (
                  isTruncated ? (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <span
                          className="text-gray-700 font-medium"
                          aria-current="page"
                          tabIndex={0}
                        >
                          {truncatedLabel}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Content
                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg max-w-xs"
                        sideOffset={5}
                      >
                        {breadcrumb.label}
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Root>
                  ) : (
                    <span
                      className="text-gray-700 font-medium"
                      aria-current="page"
                    >
                      {truncatedLabel}
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </Tooltip.Provider>
  );
};

export default Breadcrumbs;
