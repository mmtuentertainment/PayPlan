/**
 * BudgetCard Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 * User Story: US3 - Track Budget Progress
 *
 * Displays a budget with progress bar using React Aria for accessibility.
 * Triple encoding: Color + Icon + Text (don't rely on color alone).
 *
 * Accessibility: WCAG 2.1 AA
 * - React Aria useProgressBar for ARIA attributes
 * - Keyboard navigation (Tab, Enter, Space)
 * - 3:1 contrast ratio for progress bars
 * - Triple encoding (color + icon + percentage text)
 * - Screen reader announcements
 */

import { type Budget, type BudgetProgress } from '@/types/budget';
import { type Category } from '@/types/category';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProgressBar } from 'react-aria';
import { Pencil, Trash2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/budgets/calculations';
import * as Icons from 'lucide-react';

export interface BudgetCardProps {
  budget: Budget;
  progress: BudgetProgress;
  category?: Category;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  className?: string;
}

/**
 * BudgetCard displays a budget with accessible progress bar.
 * Uses triple encoding: color + icon + text for status.
 *
 * @param budget - Budget to display
 * @param progress - Budget progress data
 * @param category - Associated category (optional)
 * @param onEdit - Callback when edit button clicked
 * @param onDelete - Callback when delete button clicked
 * @param className - Additional CSS classes
 *
 * @example
 * <BudgetCard
 *   budget={budget}
 *   progress={progress}
 *   category={category}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export function BudgetCard({
  budget,
  progress,
  category,
  onEdit,
  onDelete,
  className,
}: BudgetCardProps) {
  // React Aria progress bar hook
  const progressBarRef = { current: null };
  const { progressBarProps, labelProps } = useProgressBar({
    value: progress.percentageSpent,
    minValue: 0,
    maxValue: 100,
    label: `Budget progress: ${progress.percentageSpent.toFixed(1)}% spent`,
  });

  // Status configuration (triple encoding: color + icon + text)
  const statusConfig = {
    under: {
      color: '#22c55e', // green-500
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: CheckCircle2,
      label: 'On Track',
    },
    warning: {
      color: '#f59e0b', // amber-500
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      icon: AlertTriangle,
      label: 'Warning',
    },
    over: {
      color: '#ef4444', // red-500
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: AlertCircle,
      label: 'Over Budget',
    },
  };

  const config = statusConfig[progress.status];
  const StatusIcon = config.icon;

  // Get category icon
  let CategoryIcon = Icons.HelpCircle;
  if (category) {
    const iconName = category.iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    CategoryIcon =
      (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] ||
      Icons.HelpCircle;
  }

  // Format period (YYYY-MM -> "November 2025")
  const [year, month] = budget.period.split('-');
  const periodDate = new Date(parseInt(year), parseInt(month) - 1);
  const formattedPeriod = periodDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <Card className={cn('transition-shadow hover:shadow-lg', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Category Icon (if available) */}
            {category && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category.color}20` }}
                aria-hidden="true"
              >
                <CategoryIcon className="h-5 w-5" style={{ color: category.color }} />
              </div>
            )}

            {/* Budget Info */}
            <div>
              <h3 className="text-lg font-semibold leading-none">
                {category ? category.name : 'Unknown Category'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{formattedPeriod}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(budget)}
                aria-label={`Edit budget for ${category?.name || 'category'}`}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(budget)}
                aria-label={`Delete budget for ${category?.name || 'category'}`}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget Amounts */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold">{formatCurrency(progress.spentAmount)}</div>
            <div className="text-sm text-muted-foreground">
              of {formatCurrency(progress.budgetAmount)}
            </div>
          </div>

          {/* Status Badge (Triple Encoding: Icon + Text + Color) */}
          <div
            className={cn('flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium', config.bgColor, config.textColor)}
          >
            <StatusIcon className="h-4 w-4" aria-hidden="true" />
            <span>{config.label}</span>
          </div>
        </div>

        {/* Progress Bar (React Aria + Triple Encoding) */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span {...labelProps} className="font-medium">
              {progress.percentageSpent.toFixed(1)}% spent
            </span>
            <span className="text-muted-foreground">
              {formatCurrency(progress.remainingAmount)} remaining
            </span>
          </div>

          {/* Progress Bar Container */}
          <div
            {...progressBarProps}
            ref={progressBarRef}
            className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(progress.percentageSpent, 100)}
            aria-valuetext={`${progress.percentageSpent.toFixed(1)}% of budget spent`}
          >
            {/* Progress Fill (with color based on status) */}
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(progress.percentageSpent, 100)}%`,
                backgroundColor: config.color,
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <div>Budget ID: {budget.id.substring(0, 12)}...</div>
      </CardFooter>
    </Card>
  );
}
