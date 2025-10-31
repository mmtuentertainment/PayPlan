/**
 * Loading Skeleton Component
 *
 * Displays placeholder UI while dashboard data aggregates.
 * Improves perceived performance by showing visual feedback during 100-500ms load time.
 *
 * ACCESSIBILITY (WCAG 2.1 AA):
 * - role="status" indicates loading state
 * - aria-busy="true" signals dynamic content
 * - aria-label describes what's loading
 *
 * TYPES:
 * - chart: Pie/bar chart placeholders (height matches SpendingChart/IncomeChart)
 * - list: Transaction/bill list placeholders (5 items)
 * - progress: Goal progress bar placeholders (3 items)
 * - gamification: Streak + insights placeholders (unique shape)
 *
 * @component
 * @example
 * <LoadingSkeleton type="chart" ariaLabel="Loading spending chart" />
 */

import React from 'react';

export type SkeletonType = 'chart' | 'list' | 'progress' | 'gamification';

interface LoadingSkeletonProps {
  type: SkeletonType;
  ariaLabel?: string;
}

export const LoadingSkeleton = React.memo<LoadingSkeletonProps>(({ type, ariaLabel }) => {
  // Default ARIA label based on type (accessible by default)
  const defaultLabel = `Loading ${type}`;
  const label = ariaLabel || defaultLabel;

  // Chart skeleton: Large rectangle (matches pie/bar chart dimensions)
  if (type === 'chart') {
    return (
      <div
        className="animate-pulse"
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {/* Title placeholder */}
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        {/* Chart placeholder (256px = h-64) */}
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  // List skeleton: 5 rows (matches transaction/bill lists)
  if (type === 'list') {
    return (
      <div
        className="animate-pulse space-y-3"
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {/* Title placeholder */}
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        {/* 5 list items (matches "Last 5 transactions") */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            {/* List item placeholder (48px = h-12) */}
            <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
          </div>
        ))}
      </div>
    );
  }

  // Progress skeleton: 3 progress bars (matches goal widget)
  if (type === 'progress') {
    return (
      <div
        className="animate-pulse space-y-4"
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {/* Title placeholder */}
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        {/* 3 goal progress placeholders */}
        {[1, 2, 3].map((i) => (
          <div key={i}>
            {/* Goal name placeholder */}
            <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
            {/* Progress bar placeholder */}
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Gamification skeleton: Streak + insights (unique shape)
  if (type === 'gamification') {
    return (
      <div
        className="animate-pulse space-y-4"
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        {/* Title placeholder */}
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>

        {/* Streak section placeholder */}
        <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
          {/* Fire emoji placeholder (64px = h-16 w-16) */}
          <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            {/* Streak count placeholder */}
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
            {/* Longest streak placeholder */}
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Insights placeholder (2 items) */}
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Fallback (should never happen)
  return null;
});

LoadingSkeleton.displayName = 'LoadingSkeleton';
