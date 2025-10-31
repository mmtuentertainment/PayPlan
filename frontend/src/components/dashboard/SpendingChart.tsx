/**
 * Spending Chart Component
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Displays spending breakdown by category using Recharts PieChart
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SpendingChartData } from '../../types/chart-data';

interface SpendingChartProps {
  data: SpendingChartData[];
}

/**
 * Custom Tooltip for PieChart
 * Displays category name, amount, and percentage
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SpendingChartData;
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">{data.categoryName}</p>
        <p className="text-gray-700">${data.amount.toFixed(2)}</p>
        <p className="text-gray-600 text-sm">{data.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

/**
 * SpendingChart - Pie chart showing spending breakdown by category
 *
 * @param data - Array of spending data by category
 * @returns Pie chart visualization or null if no data
 *
 * Performance: Wrapped in React.memo to prevent re-renders when data unchanged
 */
export const SpendingChart = React.memo<SpendingChartProps>(({ data }) => {
  if (data.length === 0) {
    return null; // Let parent component handle empty state
  }

  return (
    <>
      {/* Screen reader alternative - hidden table */}
      <div className="sr-only" aria-label="Spending by category data table">
        <table>
          <caption>Spending breakdown by category for current month</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.categoryId}>
                <td>{item.categoryName}</td>
                <td>${item.amount.toFixed(2)}</td>
                <td>{item.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data as any}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry: any) => {
              const spending = entry as SpendingChartData;
              return `${spending.percentage.toFixed(1)}%`;
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.categoryColor} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
});

SpendingChart.displayName = 'SpendingChart';
