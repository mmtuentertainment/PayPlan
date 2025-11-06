/**
 * Goal Skeleton Component for Goal Tracking Dashboard (Feature 064)
 * Loading placeholder while goals are being fetched
 * Pattern: Similar to existing LoadingSkeleton patterns in PayPlan
 */

import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

/**
 * Skeleton loading state for goal cards
 * Displays animated placeholders while data loads
 *
 * @param count - Number of skeleton cards to display (default: 3)
 */
export function GoalSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              {/* Goal name placeholder */}
              <div className="h-6 w-32 bg-gray-200 rounded" />
              {/* Status badge placeholder */}
              <div className="h-5 w-20 bg-gray-200 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar placeholder */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-200 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            {/* Amount text placeholder */}
            <div className="h-4 w-40 bg-gray-200 rounded" />
            {/* Action buttons placeholder */}
            <div className="flex gap-2 pt-2">
              <div className="h-9 w-24 bg-gray-200 rounded" />
              <div className="h-9 w-24 bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
