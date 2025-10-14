/**
 * Accessibility tests for Feature 012 UI Components
 * Tests WCAG 2.1 AA compliance using axe-core
 *
 * Feature: 012-user-preference-management
 * Task: T035
 * Contract: specs/012-user-preference-management/contracts/PreferenceUIComponents.contract.md
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { PreferenceToggle } from '../../src/components/preferences/PreferenceToggle';
import { ToastNotification } from '../../src/components/preferences/ToastNotification';
import { InlineStatusIndicator } from '../../src/components/preferences/InlineStatusIndicator';
import { PreferenceSettings } from '../../src/components/preferences/PreferenceSettings';
import { PreferenceCategory } from '../../src/lib/preferences/types';
import type { PreferenceCollection } from '../../src/lib/preferences/types';

describe('Accessibility: PreferenceToggle', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <PreferenceToggle
        category={PreferenceCategory.Timezone}
        optInStatus={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no violations in disabled state', async () => {
    const { container } = render(
      <PreferenceToggle
        category={PreferenceCategory.Timezone}
        optInStatus={true}
        onChange={() => {}}
        disabled={true}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('Accessibility: ToastNotification', () => {
  it('should have no violations for success toast', async () => {
    const { container } = render(
      <ToastNotification
        message="Preference saved successfully"
        type="success"
        onDismiss={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no violations for error toast', async () => {
    const { container } = render(
      <ToastNotification
        message="Failed to save preference"
        type="error"
        onDismiss={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('Accessibility: InlineStatusIndicator', () => {
  it('should have no violations when visible', async () => {
    const { container } = render(
      <InlineStatusIndicator
        category={PreferenceCategory.Timezone}
        restored={true}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no violations when not restored (null render)', async () => {
    const { container } = render(
      <InlineStatusIndicator
        category={PreferenceCategory.Timezone}
        restored={false}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('Accessibility: PreferenceSettings', () => {
  it('should have no violations with empty preferences', async () => {
    const mockPreferences: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map(),
      totalSize: 0,
      lastModified: new Date().toISOString(),
    };

    const { container } = render(
      <PreferenceSettings
        preferences={mockPreferences}
        onSave={() => {}}
        onResetAll={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should have no violations with all preferences populated', async () => {
    const mockPreferences: PreferenceCollection = {
      version: '1.0.0',
      preferences: new Map([
        [
          PreferenceCategory.Timezone,
          {
            category: PreferenceCategory.Timezone,
            value: 'America/New_York',
            optInStatus: true,
            timestamp: new Date().toISOString(),
          },
        ],
        [
          PreferenceCategory.PaydayDates,
          {
            category: PreferenceCategory.PaydayDates,
            value: { dayOfMonth: 15, frequency: 'biweekly' },
            optInStatus: true,
            timestamp: new Date().toISOString(),
          },
        ],
        [
          PreferenceCategory.BusinessDaySettings,
          {
            category: PreferenceCategory.BusinessDaySettings,
            value: { workingDays: [1, 2, 3, 4, 5], holidays: [] },
            optInStatus: true,
            timestamp: new Date().toISOString(),
          },
        ],
        [
          PreferenceCategory.CurrencyFormat,
          {
            category: PreferenceCategory.CurrencyFormat,
            value: { code: 'USD', symbol: '$', position: 'before' },
            optInStatus: true,
            timestamp: new Date().toISOString(),
          },
        ],
        [
          PreferenceCategory.Locale,
          {
            category: PreferenceCategory.Locale,
            value: 'US',
            optInStatus: true,
            timestamp: new Date().toISOString(),
          },
        ],
      ]),
      totalSize: 1024,
      lastModified: new Date().toISOString(),
    };

    const { container } = render(
      <PreferenceSettings
        preferences={mockPreferences}
        onSave={() => {}}
        onResetAll={() => {}}
      />
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
