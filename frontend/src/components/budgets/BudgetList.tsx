/**
 * BudgetList Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US2 - Set Monthly Budgets
 * User Story: US3 - Track Budget Progress
 *
 * Displays budgets grouped by period in a responsive grid.
 * Shows progress for each budget with accessible progress bars.
 *
 * Accessibility: WCAG 2.1 AA
 * - Semantic HTML (section, list markup)
 * - Keyboard navigation
 * - Empty state messaging
 * - Screen reader support
 */

import { type Budget, type BudgetProgress } from '@/types/budget';
import { type Category } from '@/types/category';
import { BudgetCard } from './BudgetCard';

export interface BudgetListProps {
  budgets: Budget[];
  progressData: BudgetProgress[];
  categories: Category[];
  onEdit?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
  className?: string;
}

/**
 * BudgetList displays budgets grouped by period (month/year).
 * Each period shows its budgets in a responsive grid.
 *
 * @param budgets - Array of budgets to display
 * @param progressData - Budget progress data for each budget
 * @param categories - Array of categories (for lookup)
 * @param onEdit - Callback when edit button clicked
 * @param onDelete - Callback when delete button clicked
 * @param className - Additional CSS classes
 *
 * @example
 * <BudgetList
 *   budgets={budgets}
 *   progressData={progressData}
 *   categories={categories}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export function BudgetList({
  budgets,
  progressData,
  categories,
  onEdit,
  onDelete,
  className,
}: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-muted-foreground">No budgets yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first budget to start tracking your spending.
        </p>
      </div>
    );
  }

  // Group budgets by period
  const budgetsByPeriod = budgets.reduce((acc, budget) => {
    if (!acc[budget.period]) {
      acc[budget.period] = [];
    }
    acc[budget.period].push(budget);
    return acc;
  }, {} as Record<string, Budget[]>);

  // Sort periods in descending order (most recent first)
  const sortedPeriods = Object.keys(budgetsByPeriod).sort((a, b) => b.localeCompare(a));

  return (
    <div className={className || ''}>
      {sortedPeriods.map((period) => {
        const periodBudgets = budgetsByPeriod[period];

        // Format period for display
        const [year, month] = period.split('-');
        const periodDate = new Date(parseInt(year), parseInt(month) - 1);
        const formattedPeriod = periodDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });

        return (
          <section key={period} className="mb-8">
            {/* Period Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{formattedPeriod}</h2>
              <span className="text-sm text-muted-foreground">
                {periodBudgets.length} {periodBudgets.length === 1 ? 'budget' : 'budgets'}
              </span>
            </div>

            {/* Budget Grid */}
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label={`Budgets for ${formattedPeriod}`}
            >
              {periodBudgets.map((budget) => {
                const progress = progressData.find((p) => p.budgetId === budget.id);
                const category = categories.find((c) => c.id === budget.categoryId);

                if (!progress) return null;

                return (
                  <div key={budget.id} role="listitem">
                    <BudgetCard
                      budget={budget}
                      progress={progress}
                      category={category}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
