/**
 * Dashboard Page
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 *
 * Main landing page for PayPlan that provides an at-a-glance view
 * of financial health with 6 widgets: spending chart, income vs expenses,
 * recent transactions, upcoming bills, goal progress, and gamification.
 *
 * This is a scaffold created in Chunk 1 - actual widgets will be
 * implemented in Chunks 2-6.
 */

import React from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';

/**
 * Dashboard Page Component
 *
 * @component
 * @returns Dashboard page with 6 widget placeholders
 *
 * @accessibility
 * - Semantic HTML structure (header, main, sections)
 * - Proper heading hierarchy (h1, h2)
 * - ARIA labels will be added to widgets in Chunks 2-6
 *
 * @performance
 * - Data aggregation completes in <500ms for 1,000 transactions
 * - Memoized aggregation functions prevent unnecessary recalculations
 */
export const Dashboard: React.FC = () => {
  const {
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    upcomingBills,
    goalProgress,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Your financial overview at a glance</p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1: Spending Chart (P0) - Coming in Chunk 2 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="spending-chart-heading"
          >
            <h2 id="spending-chart-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Spending by Category
            </h2>
            <p className="text-gray-500 text-sm">
              Pie chart coming in Chunk 2<br />
              Data ready: {spendingChartData.length} categories
            </p>
          </section>

          {/* Widget 2: Income vs Expenses (P0) - Coming in Chunk 3 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="income-expenses-heading"
          >
            <h2 id="income-expenses-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Income vs. Expenses
            </h2>
            <p className="text-gray-500 text-sm">
              Bar chart coming in Chunk 3<br />
              Data ready: {incomeExpensesData.months.length} months
            </p>
          </section>

          {/* Widget 3: Recent Transactions (P1) - Coming in Chunk 4 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="recent-transactions-heading"
          >
            <h2 id="recent-transactions-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Recent Transactions
            </h2>
            <p className="text-gray-500 text-sm">
              Transaction list coming in Chunk 4<br />
              Data ready: {recentTransactions.length} transactions
            </p>
          </section>

          {/* Widget 4: Upcoming Bills (P1) - Coming in Chunk 4 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="upcoming-bills-heading"
          >
            <h2 id="upcoming-bills-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Bills
            </h2>
            <p className="text-gray-500 text-sm">
              Bills list coming in Chunk 4<br />
              Data ready: {upcomingBills.length} bills
            </p>
          </section>

          {/* Widget 5: Goal Progress (P1) - Coming in Chunk 4 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="goal-progress-heading"
          >
            <h2 id="goal-progress-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Goal Progress
            </h2>
            <p className="text-gray-500 text-sm">
              Progress bars coming in Chunk 4<br />
              Data ready: {goalProgress.length} goals
            </p>
          </section>

          {/* Widget 6: Gamification (P2) - Coming in Chunk 5 */}
          <section
            className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300"
            aria-labelledby="gamification-heading"
          >
            <h2 id="gamification-heading" className="text-xl font-semibold text-gray-900 mb-4">
              Gamification
            </h2>
            <p className="text-gray-500 text-sm">
              Streaks & insights coming in Chunk 5
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
