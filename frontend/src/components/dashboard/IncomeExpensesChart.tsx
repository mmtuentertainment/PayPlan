/**
 * Income vs Expenses Chart Component
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Displays a bar chart comparing monthly income vs expenses
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { IncomeExpensesChartData } from '../../types/chart-data';

interface IncomeExpensesChartProps {
  data: IncomeExpensesChartData;
}

/**
 * Custom tooltip for income/expenses breakdown
 */
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const month = payload[0]?.payload?.month;
  const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
  const expenses = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
  const net = (income as number) - (expenses as number);

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 mb-2">{month}</p>
      <div className="space-y-1 text-sm">
        <p className="text-green-600">
          Income: <span className="font-semibold">${(income as number).toFixed(2)}</span>
        </p>
        <p className="text-red-600">
          Expenses: <span className="font-semibold">${(expenses as number).toFixed(2)}</span>
        </p>
        <p className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
          Net: <span className="font-semibold">${net.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
};

/**
 * Income vs Expenses Chart Component
 * Displays last 6 months of income/expense comparison
 */
export const IncomeExpensesChart: React.FC<IncomeExpensesChartProps> = React.memo(({ data }) => {
  if (data.months.length === 0) {
    return null;
  }

  return (
    <>
      {/* Hidden table for screen readers (WCAG 2.1 AA) */}
      <div className="sr-only" aria-label="Income vs expenses data table">
        <table>
          <caption>Income vs expenses for last 6 months</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((month) => (
              <tr key={month.month}>
                <td>{month.month}</td>
                <td>${month.income.toFixed(2)}</td>
                <td>${month.expenses.toFixed(2)}</td>
                <td>${month.net.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.months}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '14px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '14px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="rect"
          />
          <Bar
            dataKey="income"
            fill="#10b981"
            name="Income"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            fill="#ef4444"
            name="Expenses"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
});

IncomeExpensesChart.displayName = 'IncomeExpensesChart';
