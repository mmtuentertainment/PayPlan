/**
 * Spending Chart Widget
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Widget wrapper for SpendingChart with empty state handling
 */

import React from 'react';
import { SpendingChart } from './SpendingChart';
import { EmptyState } from './EmptyState';
import type { SpendingChartData } from '../../types/chart-data';

interface SpendingChartWidgetProps {
  data: SpendingChartData[];
}

/**
 * SpendingChartWidget - Widget wrapper for spending breakdown pie chart
 *
 * @param data - Array of spending data by category
 * @returns Widget with chart or empty state
 */
export const SpendingChartWidget: React.FC<SpendingChartWidgetProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Spending by Category</h2>
      {data.length === 0 ? (
        <EmptyState
          message="No spending data yet"
          action={{
            label: 'Add Transaction',
            onClick: () => {
              // TODO: Navigate to transaction entry page (Chunk 6)
              console.log('Navigate to transaction entry');
            },
          }}
          icon="📊"
        />
      ) : (
        <SpendingChart data={data} />
      )}
    </div>
  );
};
