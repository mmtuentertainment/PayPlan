/**
 * Empty State Component
 * Feature: Dashboard with Charts (062-short-name-dashboard)
 * Created: 2025-10-29
 */

import React from 'react';

export interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string; // Emoji or icon name
}

/**
 * EmptyState component for dashboard widgets
 * Displays helpful message when no data is available
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ message, action, icon = '📊' }) => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="text-4xl mb-4" aria-hidden="true">
        {icon}
      </span>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
