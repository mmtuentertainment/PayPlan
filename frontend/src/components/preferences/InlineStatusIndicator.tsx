/**
 * InlineStatusIndicator - Persistent restoration indicator
 *
 * Feature: 012-user-preference-management
 * Task: T028
 * Contract: PreferenceUIComponents.contract.md (L158-L190)
 *
 * Purpose: Show users that their preference was restored from previous session.
 * Provides visual confirmation that preference persistence is working.
 *
 * Accessibility: WCAG 2.1 AA compliant
 * - aria-label for screen readers
 * - Icon + text for dual modality
 * - Conditional rendering (only when restored=true)
 *
 * @see spec.md FR-006 (visibility requirements)
 * @see spec.md Clarification Q4 (toast + inline indicators)
 */

import { CheckCircle2 } from 'lucide-react';
import type { PreferenceCategoryType } from '../../lib/preferences/types';

export interface InlineStatusIndicatorProps {
  /** Preference category being indicated */
  category: PreferenceCategoryType;
  /** Whether this preference was restored from storage */
  restored: boolean;
}

/**
 * Format category name for display (e.g., "timezone" → "Timezone")
 */
function formatCategoryName(category: PreferenceCategoryType): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Small, unobtrusive indicator that shows when a preference was restored.
 *
 * @example
 * ```tsx
 * <InlineStatusIndicator
 *   category="timezone"
 *   restored={true}
 * />
 * ```
 */
export function InlineStatusIndicator({
  category,
  restored,
}: InlineStatusIndicatorProps) {
  // Only render when restored
  if (!restored) {
    return null;
  }

  const categoryDisplay = formatCategoryName(category);
  const ariaLabel = `${categoryDisplay} preference restored from previous session`;

  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1"
      aria-label={ariaLabel}
      role="status"
    >
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="font-medium">Restored</span>
    </div>
  );
}
