/**
 * Status Configuration for Goal Tracking Dashboard (Feature 064)
 * Consolidated status mapping to avoid DRY violations (PR78-7)
 *
 * This file consolidates three previously separate status mappings:
 * 1. Badge variants (getStatusVariant)
 * 2. Status labels (getStatusLabel)
 * 3. Progress indicator colors (getProgressIndicatorClass)
 *
 * Single source of truth for all status-related UI properties.
 */

import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/shared/components/ui/badge.constants';

/**
 * Goal status type
 */
export type GoalStatus = 'completed' | 'past-due' | 'at-risk' | 'on-track';

/**
 * Status configuration for UI rendering
 */
interface StatusConfig {
  /** Badge variant for Shadcn Badge component */
  badgeVariant: NonNullable<VariantProps<typeof badgeVariants>['variant']>;
  /** Human-readable label with icon */
  label: string;
  /** Hex color code for charts/visualizations */
  color: string;
  /** Tailwind class for progress bar indicator */
  progressClass: string;
}

/**
 * Consolidated status configuration
 * All status-related UI properties in one place
 *
 * Usage:
 * ```tsx
 * const config = STATUS_CONFIG[status];
 * <Badge variant={config.badgeVariant}>{config.label}</Badge>
 * <Progress className={config.progressClass} />
 * ```
 */
export const STATUS_CONFIG: Record<GoalStatus, StatusConfig> = {
  completed: {
    badgeVariant: 'default', // Green badge
    label: '✓ Completed',
    color: '#16a34a', // green-600
    progressClass: '[&>div]:bg-green-600',
  },
  'past-due': {
    badgeVariant: 'destructive', // Red badge
    label: '⚠ Past Due',
    color: '#dc2626', // red-600
    progressClass: '[&>div]:bg-red-600',
  },
  'at-risk': {
    badgeVariant: 'secondary', // Yellow/gray badge
    label: '⚠ At Risk',
    color: '#eab308', // yellow-500
    progressClass: '[&>div]:bg-yellow-500',
  },
  'on-track': {
    badgeVariant: 'outline', // Blue outlined badge
    label: '→ On Track',
    color: '#2563eb', // blue-600
    progressClass: '[&>div]:bg-blue-600',
  },
} as const;

/**
 * Get status configuration for a given status
 * Type-safe accessor with fallback to 'on-track'
 *
 * @param status - Goal status
 * @returns Status configuration object
 */
export function getStatusConfig(status: GoalStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG['on-track'];
}
