/**
 * Recent Transactions Widget
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * User Story: US3 - Recent Transactions Widget
 * Tasks: T027-T030
 *
 * Displays the 5 most recent transactions with date, description, amount, and type.
 * Follows patterns established in Chunks 1-3 (React.memo, type-only imports, useNavigate).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Transaction } from '../../types/transaction';
import { EmptyState } from './EmptyState';

export interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
}

/**
 * Recent Transactions Widget
 * Shows last 5 transactions with visual type indicators
 *
 * @param transactions - Array of transactions (expects already sorted, last 5)
 */
export const RecentTransactionsWidget = React.memo<RecentTransactionsWidgetProps>(
  ({ transactions }) => {
    const navigate = useNavigate();

    const handleTransactionClick = (id: string): void => {
      navigate(`/transactions/${id}`);
    };

    const handleAddClick = (): void => {
      navigate('/transactions');
    };

    // Determine transaction type and display amount
    const getTransactionDisplay = (transaction: Transaction): { type: 'income' | 'expense'; displayAmount: string; icon: string } => {
      const isIncome = transaction.amount < 0;
      const absAmount = Math.abs(transaction.amount) / 100; // Convert cents to dollars

      return {
        type: isIncome ? 'income' : 'expense',
        displayAmount: isIncome ? `+$${absAmount.toFixed(2)}` : `$${absAmount.toFixed(2)}`,
        icon: isIncome ? '💰' : '💳',
      };
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <EmptyState
            message="No transactions yet"
            action={{
              label: 'Add Transaction',
              onClick: handleAddClick,
            }}
            icon="💸"
          />
        ) : (
          <ul className="space-y-3">
            {transactions.map((transaction) => {
              const display = getTransactionDisplay(transaction);
              return (
                <li
                  key={transaction.id}
                  onClick={() => handleTransactionClick(transaction.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTransactionClick(transaction.id);
                    }
                  }}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${transaction.description}, ${display.displayAmount} on ${format(new Date(transaction.date), 'MMM d, yyyy')}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {display.icon}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      display.type === 'income' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {display.displayAmount}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
);

RecentTransactionsWidget.displayName = 'RecentTransactionsWidget';
