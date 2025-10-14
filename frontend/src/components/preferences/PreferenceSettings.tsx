/**
 * PreferenceSettings - Centralized settings screen
 *
 * Feature: 012-user-preference-management
 * Task: T029
 * Contract: PreferenceUIComponents.contract.md (L118-L154)
 *
 * Purpose: Provide a centralized UI for managing all preference categories.
 * Allows users to view, edit, and reset all preferences in one place.
 *
 * Accessibility: WCAG 2.1 AA compliant
 * - Proper heading hierarchy (h2 → h3)
 * - Form labels associated with inputs
 * - Confirmation dialog for destructive actions
 * - Keyboard navigation support
 *
 * @see spec.md FR-008 (centralized UI)
 * @see spec.md Clarification Q1 (inline toggles + centralized settings)
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { PreferenceToggle } from './PreferenceToggle';
import { PreferenceCategory, type PreferenceCategoryType, type PreferenceCollection } from '../../lib/preferences/types';
import { RotateCcw } from 'lucide-react';
import {
  paydayDatesValueSchema,
  businessDaySettingsValueSchema,
  currencyFormatValueSchema,
} from '../../lib/preferences/schemas';

export interface PreferenceSettingsProps {
  /** Current preference collection (null if not loaded) */
  preferences: PreferenceCollection | null;
  /** Callback to save a single preference */
  onSave: (category: PreferenceCategoryType, value: unknown, optIn: boolean) => void;
  /** Callback to reset all preferences */
  onResetAll: () => void;
}

/**
 * Centralized preference management screen.
 *
 * @example
 * ```tsx
 * <PreferenceSettings
 *   preferences={preferenceCollection}
 *   onSave={(cat, val, optIn) => updatePreference(cat, val, optIn)}
 *   onResetAll={() => resetPreferences()}
 * />
 * ```
 */
export function PreferenceSettings({
  preferences,
  onSave,
  onResetAll,
}: PreferenceSettingsProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Get preference for category
  const getPreference = (category: PreferenceCategoryType) => {
    return preferences?.preferences.get(category);
  };

  // Format value for display
  const formatValue = (category: PreferenceCategoryType, value: unknown): string => {
    if (!value) return 'Not set';

    switch (category) {
      case PreferenceCategory.Timezone:
        return String(value);

      case PreferenceCategory.PaydayDates: {
        // Validate payday pattern structure
        const validation = paydayDatesValueSchema.safeParse(value);
        if (!validation.success) {
          console.warn('Invalid payday pattern value:', value, validation.error);
          return 'Invalid format';
        }
        const pattern = validation.data;
        if (pattern.type === 'biweekly') {
          return `Biweekly (every 2 weeks)`;
        }
        if (pattern.type === 'weekly') {
          return `Weekly`;
        }
        if (pattern.type === 'monthly') {
          return `Monthly`;
        }
        if (pattern.type === 'specific') {
          return `Specific dates`;
        }
        return JSON.stringify(value);
      }

      case PreferenceCategory.BusinessDaySettings: {
        // Validate business day settings structure
        const validation = businessDaySettingsValueSchema.safeParse(value);
        if (!validation.success) {
          console.warn('Invalid business day settings value:', value, validation.error);
          return 'Invalid format';
        }
        const settings = validation.data;
        const dayCount = Array.isArray(settings.workingDays) ? settings.workingDays.length : 0;
        const holidayCount = Array.isArray(settings.holidays) ? settings.holidays.length : 0;
        return `${dayCount} working days, ${holidayCount} holidays`;
      }

      case PreferenceCategory.CurrencyFormat: {
        // Validate currency format structure
        const validation = currencyFormatValueSchema.safeParse(value);
        if (!validation.success) {
          console.warn('Invalid currency format value:', value, validation.error);
          return 'Invalid format';
        }
        const format = validation.data;
        // Use Intl.NumberFormat for proper currency display if possible
        try {
          const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: format.currencyCode,
          });
          const sample = formatter.format(100);
          return `${format.currencyCode} (${format.symbolPosition} symbol, e.g., ${sample})`;
        } catch {
          // Fallback if Intl doesn't support the currency code
          return `${format.currencyCode} (${format.symbolPosition} symbol)`;
        }
      }

      case PreferenceCategory.Locale:
        return String(value);

      default:
        return JSON.stringify(value);
    }
  };

  const handleResetAll = async () => {
    try {
      await onResetAll();
      setResetDialogOpen(false);
    } catch (err) {
      console.error('Failed to reset preferences:', err);
      // Keep dialog open on error so user can retry
      // TODO: Show error toast/notification
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preference Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your saved preferences and control what data is stored locally.
          </p>
        </div>

        {/* Reset All Button */}
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all preferences?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all saved preferences and restore defaults.
                You will need to reconfigure your settings after this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll}>Reset All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Preference Categories */}
      <div className="space-y-4">
        {/* Timezone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timezone</CardTitle>
            <CardDescription>Your preferred timezone for displaying dates and times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 font-medium">Current Value</div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatValue(PreferenceCategory.Timezone, getPreference(PreferenceCategory.Timezone)?.value)}
              </p>
            </div>
            <PreferenceToggle
              category={PreferenceCategory.Timezone}
              optInStatus={getPreference(PreferenceCategory.Timezone)?.optInStatus || false}
              onChange={(optIn) => {
                const value = getPreference(PreferenceCategory.Timezone)?.value ?? 'America/New_York';
                onSave(PreferenceCategory.Timezone, value, optIn);
              }}
            />
          </CardContent>
        </Card>

        {/* Payday Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payday Dates</CardTitle>
            <CardDescription>Your recurring payday schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 font-medium">Current Value</div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatValue(PreferenceCategory.PaydayDates, getPreference(PreferenceCategory.PaydayDates)?.value)}
              </p>
            </div>
            <PreferenceToggle
              category={PreferenceCategory.PaydayDates}
              optInStatus={getPreference(PreferenceCategory.PaydayDates)?.optInStatus || false}
              onChange={(optIn) => {
                const value = getPreference(PreferenceCategory.PaydayDates)?.value ?? { type: 'biweekly', startDate: new Date().toISOString().split('T')[0], dayOfWeek: 5 };
                onSave(PreferenceCategory.PaydayDates, value, optIn);
              }}
            />
          </CardContent>
        </Card>

        {/* Business Day Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Day Settings</CardTitle>
            <CardDescription>Working days and holidays for payment scheduling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 font-medium">Current Value</div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatValue(PreferenceCategory.BusinessDaySettings, getPreference(PreferenceCategory.BusinessDaySettings)?.value)}
              </p>
            </div>
            <PreferenceToggle
              category={PreferenceCategory.BusinessDaySettings}
              optInStatus={getPreference(PreferenceCategory.BusinessDaySettings)?.optInStatus || false}
              onChange={(optIn) => {
                const value = getPreference(PreferenceCategory.BusinessDaySettings)?.value ?? { workingDays: [1, 2, 3, 4, 5], holidays: [] };
                onSave(PreferenceCategory.BusinessDaySettings, value, optIn);
              }}
            />
          </CardContent>
        </Card>

        {/* Currency Format */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Currency Format</CardTitle>
            <CardDescription>Display formatting for monetary amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 font-medium">Current Value</div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatValue(PreferenceCategory.CurrencyFormat, getPreference(PreferenceCategory.CurrencyFormat)?.value)}
              </p>
            </div>
            <PreferenceToggle
              category={PreferenceCategory.CurrencyFormat}
              optInStatus={getPreference(PreferenceCategory.CurrencyFormat)?.optInStatus || false}
              onChange={(optIn) => {
                const value = getPreference(PreferenceCategory.CurrencyFormat)?.value ?? { currencyCode: 'USD', decimalSeparator: '.', thousandsSeparator: ',', symbolPosition: 'before' };
                onSave(PreferenceCategory.CurrencyFormat, value, optIn);
              }}
            />
          </CardContent>
        </Card>

        {/* Locale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Locale</CardTitle>
            <CardDescription>Language and region settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 font-medium">Current Value</div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatValue(PreferenceCategory.Locale, getPreference(PreferenceCategory.Locale)?.value)}
              </p>
            </div>
            <PreferenceToggle
              category={PreferenceCategory.Locale}
              optInStatus={getPreference(PreferenceCategory.Locale)?.optInStatus || false}
              onChange={(optIn) => {
                const value = getPreference(PreferenceCategory.Locale)?.value ?? 'en-US';
                onSave(PreferenceCategory.Locale, value, optIn);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-md border border-gray-200">
        <p>
          <strong>Privacy Notice:</strong> All preferences are stored locally in your browser.
          No data is sent to our servers. You can reset all preferences at any time.
        </p>
        {preferences && (
          <p className="mt-2">
            Storage used: {preferences.totalSize} bytes / 5120 bytes (5KB limit)
          </p>
        )}
      </div>
    </div>
  );
}
