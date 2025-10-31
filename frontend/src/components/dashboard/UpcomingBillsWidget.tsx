/**
 * Upcoming Bills Widget
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * User Story: US4 - Upcoming Bills Widget
 * Tasks: T031-T035
 *
 * Displays bills due in the next 7 days with urgency indicators.
 * Follows patterns established in Chunks 1-3 (React.memo, type-only imports, ARIA labels).
 */

import React from 'react';
import { format } from 'date-fns';
import type { UpcomingBill } from '../../types/bill';
import { EmptyState } from './EmptyState';

export interface UpcomingBillsWidgetProps {
  bills: UpcomingBill[];
}

/**
 * Upcoming Bills Widget
 * Shows bills due in next 7 days with urgency badges
 *
 * @param bills - Array of upcoming bills (expects sorted by due date)
 */
export const UpcomingBillsWidget = React.memo<UpcomingBillsWidgetProps>(({ bills }) => {
  /**
   * Returns urgency badge based on days until due
   * - Due today: Red badge
   * - Due in 1-3 days: Yellow badge
   * - Due in 4-7 days: No badge
   */
  const getUrgencyBadge = (daysUntilDue: number): JSX.Element | null => {
    if (daysUntilDue === 0) {
      return (
        <span
          className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded"
          aria-label="Urgent: Bill due today"
        >
          Due Today
        </span>
      );
    }
    if (daysUntilDue <= 3 && daysUntilDue > 0) {
      return (
        <span
          className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded"
          aria-label={`Warning: Bill due in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`}
        >
          Due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Bills</h2>
      {bills.length === 0 ? (
        <EmptyState message="No bills due in the next 7 days" icon="📅" />
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <li
              key={bill.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {bill.categoryIcon || '💳'}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{bill.name}</p>
                  <p className="text-sm text-gray-500">
                    {bill.isOverdue
                      ? 'Overdue'
                      : `Due ${format(new Date(bill.dueDate), 'MMM d')}`}
                  </p>
                  {bill.isOverdue ? (
                    <span
                      className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded"
                      aria-label="Overdue: Bill payment is late"
                    >
                      Overdue
                    </span>
                  ) : (
                    getUrgencyBadge(bill.daysUntilDue)
                  )}
                </div>
              </div>
              <p className="font-semibold text-gray-900">${(bill.amount / 100).toFixed(2)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

UpcomingBillsWidget.displayName = 'UpcomingBillsWidget';
