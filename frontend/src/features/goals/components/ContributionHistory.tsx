/**
 * Contribution History Component for Goal Tracking Dashboard (Feature 064)
 * Display list of contributions sorted by date
 * US7: Contribution Notes
 */

import { format } from 'date-fns';
import { formatCurrency } from '@/shared/lib/utils';
import type { Contribution } from '../types/contribution';

interface ContributionHistoryProps {
  contributions: Contribution[]; // From goal.contributions
}

/**
 * Contribution history list
 *
 * Features:
 * - Sorted by createdAt DESC (most recent first)
 * - Each entry: amount, note (if present), formatted timestamp
 * - Empty state for goals with no contributions
 * - Responsive design (stack vertically on mobile)
 *
 * @param contributions - Array of contributions to display
 */
export function ContributionHistory({ contributions }: ContributionHistoryProps) {
  // Sort contributions by createdAt DESC (most recent first)
  const sortedContributions = [...contributions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Empty state
  if (sortedContributions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No contributions yet. Add your first contribution above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedContributions.map((contribution) => (
        <div
          key={contribution.id}
          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex-1">
            {/* Amount */}
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(contribution.amount)}
            </p>

            {/* Note (if present) */}
            {contribution.note && (
              <p className="text-sm text-gray-600 mt-1">{contribution.note}</p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(contribution.createdAt), 'PPp')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
