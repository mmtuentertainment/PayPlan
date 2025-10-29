/**
 * Bill Types
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

/**
 * Upcoming bill (derived from recurring transactions)
 */
export interface UpcomingBill {
  id: string;
  name: string;
  amount: number; // Positive number
  dueDate: string; // ISO 8601 format
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  isPaid: boolean;
  isOverdue: boolean;
  daysUntilDue: number; // Negative if overdue
}
