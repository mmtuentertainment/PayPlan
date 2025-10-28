/**
 * Payment Schedule Preview Component
 *
 * Displays parsed BNPL payment schedule before saving.
 * Allows user to:
 * - Review extracted data
 * - Edit fields if needed
 * - Save or cancel
 *
 * WCAG 2.1 AA compliant with keyboard navigation and screen reader support.
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { BNPLPaymentSchedule } from '../../types/bnpl';
import { ProviderBadge } from './ProviderBadge';

interface PaymentSchedulePreviewProps {
  schedule: BNPLPaymentSchedule;
  onSave: (schedule: BNPLPaymentSchedule) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function PaymentSchedulePreview({
  schedule,
  onSave,
  onCancel,
  isSaving,
}: PaymentSchedulePreviewProps) {
  // Editable fields
  const [merchant, setMerchant] = useState(schedule.merchant);
  const [totalAmount, setTotalAmount] = useState(schedule.totalAmount.toString());

  const handleSave = () => {
    // Update schedule with edited values
    const updatedSchedule: BNPLPaymentSchedule = {
      ...schedule,
      merchant: merchant.trim(),
      totalAmount: parseFloat(totalAmount) || schedule.totalAmount,
    };
    onSave(updatedSchedule);
  };

  // Format date for display (YYYY-MM-DD → Month Day, Year)
  const formatDate = (isoDate: string): string => {
    // Parse date in local timezone to avoid timezone shift
    // new Date("2025-11-01") treats as UTC, which shifts to previous day in local timezone
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Success Message */}
      <div className="animate-fade-in bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-800 font-medium">
            Payment schedule extracted successfully!
          </p>
        </div>
      </div>

      {/* Modern Header Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Review Payment Schedule
          </h2>
          <ProviderBadge provider={schedule.provider} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          We extracted the following payment schedule. Please review and edit if
          needed, then click "Save Payment Schedule" to add it to your dashboard.
        </p>
      </div>

      {/* Editable Fields - Modern Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 hover:shadow-md transition-shadow duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Purchase Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="merchant-input" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Merchant Name
            </label>
            <Input
              id="merchant-input"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g., Target, Best Buy"
              aria-label="Merchant name (editable)"
              disabled={isSaving}
              className="text-base font-semibold text-gray-900 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="total-amount-input" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xl">
                $
              </span>
              <Input
                id="total-amount-input"
                type="number"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                aria-label="Total purchase amount (editable)"
                disabled={isSaving}
                className="pl-8 text-2xl font-bold text-gray-900 tabular-nums rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule - Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-gray-200 bg-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Schedule
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({schedule.installmentCount} payments)
            </span>
          </h3>
        </div>

        {/* Desktop Table View (hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.installments.map((installment, index) => (
                <tr
                  key={installment.installmentNumber}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-blue-50
                    transition-colors duration-150
                    border-b border-gray-100
                  `}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {installment.installmentNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold tabular-nums">
                    ${installment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(installment.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (shown only on mobile) */}
        <div className="block sm:hidden p-4 space-y-3">
          {schedule.installments.map((installment, index) => (
            <div
              key={installment.installmentNumber}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Payment {installment.installmentNumber}
                </span>
                <span className="text-lg font-bold text-gray-900 tabular-nums">
                  ${installment.amount.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Due: {formatDate(installment.dueDate)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* APR Warning (if applicable) */}
      {schedule.apr !== undefined && (
        <div className="rounded-xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="Warning">
              ⚠️
            </span>
            <div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                Interest Charges Apply
              </p>
              <p className="text-sm text-yellow-800">
                <strong>APR:</strong> {schedule.apr}%
                {schedule.apr > 0 &&
                  ' — This loan includes interest charges. Total repayment may exceed purchase amount.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Total Purchase:</span>
            <span className="text-2xl font-bold text-blue-900 tabular-nums">
              ${schedule.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Number of Payments:</span>
            <span className="text-base font-semibold text-blue-900">
              {schedule.installmentCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Payment Amount:</span>
            <span className="text-base font-semibold text-blue-900 tabular-nums">
              ${(schedule.totalAmount / schedule.installmentCount).toFixed(2)} each
            </span>
          </div>
        </div>
      </div>

      {/* Modern Action Buttons */}
      <div className="flex gap-4 pt-2">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
          className="flex-1 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold py-6 text-base"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !merchant.trim() || parseFloat(totalAmount) <= 0}
          className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg font-semibold py-6 text-base"
          aria-busy={isSaving}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Saving...
            </span>
          ) : (
            '💾 Save Payment Schedule'
          )}
        </Button>
      </div>

      {isSaving && (
        <span className="sr-only" aria-live="polite">
          Saving payment schedule...
        </span>
      )}
    </div>
  );
}
