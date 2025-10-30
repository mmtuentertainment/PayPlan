/**
 * Income vs Expenses Chart Widget
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Wraps IncomeExpensesChart with empty state and surplus/deficit indicator
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IncomeExpensesChart } from './IncomeExpensesChart';
import { EmptyState } from './EmptyState';
import type { IncomeExpensesChartData } from '../../types/chart-data';

interface IncomeExpensesChartWidgetProps {
  data: IncomeExpensesChartData;
}

/**
 * Income vs Expenses Chart Widget
 * Displays bar chart with surplus/deficit indicator
 */
export const IncomeExpensesChartWidget: React.FC<IncomeExpensesChartWidgetProps> = React.memo(
  ({ data }) => {
    const navigate = useNavigate();

    // Get current month net income for surplus/deficit indicator
    const currentMonth = data.months[data.months.length - 1];
    const netIncome = currentMonth?.net || 0;

    const getNetIncomeColor = (): string => {
      if (netIncome > 0) return 'text-green-600';
      if (netIncome < 0) return 'text-red-600';
      return 'text-gray-600';
    };

    const getNetIncomeText = (): string => {
      if (netIncome > 0) return `+$${netIncome.toFixed(2)} Surplus`;
      if (netIncome < 0) return `-$${Math.abs(netIncome).toFixed(2)} Deficit`;
      return '$0.00 Break Even';
    };

    // Show empty state if no data
    if (data.months.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Income vs. Expenses
          </h2>
          <EmptyState
            message="No income or expense data yet"
            action={{
              label: 'Add Transaction',
              onClick: () => navigate('/transactions'),
            }}
            icon="💰"
          />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Income vs. Expenses</h2>
          <p className={`text-lg font-semibold ${getNetIncomeColor()}`}>
            {getNetIncomeText()}
          </p>
        </div>
        <IncomeExpensesChart data={data} />
      </div>
    );
  }
);

IncomeExpensesChartWidget.displayName = 'IncomeExpensesChartWidget';
