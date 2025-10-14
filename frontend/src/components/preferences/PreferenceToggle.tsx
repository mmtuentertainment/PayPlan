/**
 * PreferenceToggle - Inline opt-in/opt-out checkbox component
 *
 * Feature: 012-user-preference-management
 * Task: T026
 * Contract: PreferenceUIComponents.contract.md (L17-L64)
 *
 * Purpose: Allow users to enable/disable automatic saving for each preference category.
 * Appears inline next to preference controls (timezone selector, currency input, etc.).
 *
 * Accessibility: WCAG 2.1 AA compliant
 * - Keyboard accessible (Tab, Space/Enter)
 * - aria-label for screen readers
 * - Visual focus indicators
 *
 * @see spec.md Clarification Q1 (inline toggles + centralized settings)
 * @see spec.md FR-002 (explicit opt-in required)
 */

import { Label } from '../ui/label';
import type { PreferenceCategoryType } from '../../lib/preferences/types';

export interface PreferenceToggleProps {
  /** Preference category being toggled */
  category: PreferenceCategoryType;
  /** Current opt-in status */
  optInStatus: boolean;
  /** Callback when toggle changes */
  onChange: (optIn: boolean) => void;
  /** Disable the toggle (e.g., during save) */
  disabled?: boolean;
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
 * Inline checkbox for toggling preference persistence.
 *
 * @example
 * ```tsx
 * <PreferenceToggle
 *   category="timezone"
 *   optInStatus={true}
 *   onChange={(optIn) => updatePreference('timezone', value, optIn)}
 * />
 * ```
 */
export function PreferenceToggle({
  category,
  optInStatus,
  onChange,
  disabled = false,
}: PreferenceToggleProps) {
  const categoryDisplay = formatCategoryName(category);
  const ariaLabel = `Save ${categoryDisplay} preference automatically`;

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={`preference-toggle-${category}`}
        checked={optInStatus}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      />
      <Label
        htmlFor={`preference-toggle-${category}`}
        className={`text-sm text-gray-700 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        Remember this {categoryDisplay.toLowerCase()} setting
      </Label>
    </div>
  );
}
