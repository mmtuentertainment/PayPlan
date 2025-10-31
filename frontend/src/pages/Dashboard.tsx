/**
 * Dashboard Page
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 * Updated: 2025-10-31 (Chunk 6: Added loading skeletons)
 *
 * Main landing page for PayPlan that provides an at-a-glance view
 * of financial health with 6 widgets.
 *
 * UPDATED IN CHUNK 6:
 * - Added LoadingSkeleton for all 6 widgets
 * - Loading state shows skeletons while data aggregates (100-500ms)
 * - Improves perceived performance and UX
 */

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton';
import { SpendingChartWidget } from '@/components/dashboard/SpendingChartWidget';
import { IncomeExpensesChartWidget } from '@/components/dashboard/IncomeExpensesChartWidget';
import { RecentTransactionsWidget } from '@/components/dashboard/RecentTransactionsWidget';
import { UpcomingBillsWidget } from '@/components/dashboard/UpcomingBillsWidget';
import { GoalProgressWidget } from '@/components/dashboard/GoalProgressWidget';
import { GamificationWidget } from '@/components/dashboard/GamificationWidget';

/**
 * Dashboard Page Component
 *
 * @component
 * @returns Dashboard page with 6 widgets
 *
 * @accessibility
 * - Semantic HTML structure (header, main, sections)
 * - Proper heading hierarchy (h1, h2)
 * - Loading skeletons announced to screen readers
 * - All widgets WCAG 2.1 AA compliant
 *
 * @performance
 * - Data aggregation completes in <500ms for 1,000 transactions
 * - Memoized aggregation functions prevent unnecessary recalculations
 * - Loading skeletons provide visual feedback during load
 */
export const Dashboard: React.FC = () => {
  const {
    isLoading,
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    upcomingBills,
    goalProgress,
    gamificationData,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Your financial overview at a glance</p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1: Spending Chart (P0) - Chunk 2 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="spending-chart-heading">
              <LoadingSkeleton type="chart" ariaLabel="Loading spending by category chart" />
            </section>
          ) : (
            <SpendingChartWidget data={spendingChartData} />
          )}

          {/* Widget 2: Income vs Expenses (P0) - Chunk 3 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="income-expenses-heading">
              <LoadingSkeleton type="chart" ariaLabel="Loading income vs expenses chart" />
            </section>
          ) : (
            <IncomeExpensesChartWidget data={incomeExpensesData} />
          )}

          {/* Widget 3: Recent Transactions (P1) - Chunk 4 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="recent-transactions-heading">
              <LoadingSkeleton type="list" ariaLabel="Loading recent transactions" />
            </section>
          ) : (
            <RecentTransactionsWidget transactions={recentTransactions} />
          )}

          {/* Widget 4: Upcoming Bills (P1) - Chunk 4 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="upcoming-bills-heading">
              <LoadingSkeleton type="list" ariaLabel="Loading upcoming bills" />
            </section>
          ) : (
            <UpcomingBillsWidget bills={upcomingBills} />
          )}

          {/* Widget 5: Goal Progress (P1) - Chunk 4 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="goal-progress-heading">
              <LoadingSkeleton type="progress" ariaLabel="Loading goal progress" />
            </section>
          ) : (
            <GoalProgressWidget goals={goalProgress} />
          )}

          {/* Widget 6: Gamification (P2) - Chunk 5 */}
          {isLoading ? (
            <section className="bg-white rounded-lg shadow-md p-6" aria-labelledby="gamification-heading">
              <LoadingSkeleton type="gamification" ariaLabel="Loading gamification widget" />
            </section>
          ) : (
            <GamificationWidget data={gamificationData} />
          )}
        </div>
      </main>
    </div>
  );
};
