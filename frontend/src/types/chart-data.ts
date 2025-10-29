/**
 * Chart Data Types
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

/**
 * Data for spending breakdown pie chart
 */
export interface SpendingChartData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number; // Total spending in this category (positive number)
  percentage: number; // Percentage of total spending (0-100)
}

/**
 * Data for income vs. expenses bar chart
 */
export interface IncomeExpensesChartData {
  months: MonthData[];
  maxValue: number; // Max value for Y-axis scaling
}

/**
 * Monthly data for income vs. expenses chart
 */
export interface MonthData {
  month: string; // Format: "Jan", "Feb", "Mar", etc.
  income: number; // Total income for the month
  expenses: number; // Total expenses for the month (positive number)
  net: number; // income - expenses (can be negative)
}
