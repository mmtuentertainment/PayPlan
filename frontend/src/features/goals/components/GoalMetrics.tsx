/**
 * Goal Metrics Component for Goal Tracking Dashboard (Feature 064)
 * Displays 4 metric cards at top of dashboard
 * US1: View Dashboard - Acceptance Criterion AC1
 */

import { Card, CardContent } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/lib/utils';
import type { DashboardMetrics } from '../lib/dashboard-metrics';

interface GoalMetricsProps {
  metrics: DashboardMetrics;
}

/**
 * Individual metric card component
 */
function MetricCard({
  label,
  value,
  hero = false,
}: {
  label: string;
  value: string | number;
  hero?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p
            className={`${
              hero ? 'text-4xl' : 'text-3xl'
            } font-bold text-gray-900`}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard metrics display
 * Shows 4 cards: Total Goals, Total Saved, Goals On Track, Average Progress
 *
 * Responsive layout:
 * - Mobile (375px): 1 column stack
 * - Tablet (768px): 2 columns
 * - Desktop (1920px): 4 columns
 *
 * @param metrics - Computed dashboard metrics
 */
export function GoalMetrics({ metrics }: GoalMetricsProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      role="region"
      aria-label="Goal metrics summary"
    >
      <MetricCard label="Total Goals" value={metrics.totalGoals} />
      <MetricCard
        label="Total Saved"
        value={formatCurrency(metrics.totalSaved)}
        hero
      />
      <MetricCard label="Goals On Track" value={metrics.goalsOnTrack} />
      <MetricCard
        label="Average Progress"
        value={`${metrics.averageProgress}%`}
      />
    </div>
  );
}
