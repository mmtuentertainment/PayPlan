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

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SpendingChartWidget } from '@/components/dashboard/SpendingChartWidget';
import { IncomeExpensesChartWidget } from '@/components/dashboard/IncomeExpensesChartWidget';
import { RecentTransactionsWidget } from '@/components/dashboard/RecentTransactionsWidget';
import { UpcomingBillsWidget } from '@/components/dashboard/UpcomingBillsWidget';
import { GoalProgressWidget } from '@/components/dashboard/GoalProgressWidget';
import { GamificationWidget } from '@/components/dashboard/GamificationWidget';
import {
  updateStreakData,
  getGamificationData,
  generateInsights,
  detectRecentWins,
  saveGamificationData,
} from '@/lib/dashboard/gamification';
import { readTransactions, readBudgets } from '@/lib/dashboard/storage';
import { ROUTES } from '@/routes';

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
  const navigate = useNavigate();
  const {
    spendingChartData,
    incomeExpensesData,
    recentTransactions,
    upcomingBills,
    goalProgress,
  } = useDashboardData();

  // Update streak on page load (Loss Aversion principle)
  useEffect(() => {
    updateStreakData();
  }, []);

  // Generate gamification data (memoized for performance)
  const gamificationData = useMemo(() => {
    const transactions = readTransactions();
    const budgets = readBudgets();
    const baseData = getGamificationData();

    // Generate fresh insights and wins from current data
    const insights = generateInsights(transactions);
    const wins = detectRecentWins(transactions, budgets);

    const updatedData = {
      ...baseData,
      insights,
      recentWins: wins,
    };

    // Persist updated data
    saveGamificationData(updatedData);

    return updatedData;
  }, []); // Empty deps - only calculate once per page load

  const handleAddTransaction = () => {
    navigate(ROUTES.TRANSACTIONS);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Your financial overview at a glance</p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget 1: Spending Chart (P0) - Implemented in Chunk 2 */}
          <SpendingChartWidget data={spendingChartData} onAddTransaction={handleAddTransaction} />

          {/* Widget 2: Income vs Expenses (P0) - Implemented in Chunk 3 */}
          <IncomeExpensesChartWidget data={incomeExpensesData} />

          {/* Widget 3: Recent Transactions (P1) - Implemented in Chunk 4 */}
          <RecentTransactionsWidget transactions={recentTransactions} />

          {/* Widget 4: Upcoming Bills (P1) - Implemented in Chunk 4 */}
          <UpcomingBillsWidget bills={upcomingBills} />

          {/* Widget 5: Goal Progress (P1) - Implemented in Chunk 4 */}
          <GoalProgressWidget goals={goalProgress} />

          {/* Widget 6: Gamification (P2) - Implemented in Chunk 5 */}
          <GamificationWidget data={gamificationData} />
        </div>
      </main>
    </div>
  );
};
