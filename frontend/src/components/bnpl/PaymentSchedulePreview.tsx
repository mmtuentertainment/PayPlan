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
    <div className="space-y-6 animate-fade-in">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Purchase Details
        </h3>

        <div>
          <label htmlFor="merchant-input" className="block text-sm font-medium text-gray-700 mb-2">
            Merchant Name
          </label>
          <Input
            id="merchant-input"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g., Target, Best Buy"
            aria-label="Merchant name (editable)"
            disabled={isSaving}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="total-amount-input" className="block text-sm font-medium text-gray-700 mb-2">
            Total Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
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
              className="pl-7 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Payment Schedule - Modern Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Schedule
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({schedule.installmentCount} payments)
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Payment #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {schedule.installments.map((installment, index) => (
                <tr
                  key={installment.installmentNumber}
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {installment.installmentNumber}
                  </td>
                  <td className="px-6 py-4 text-base font-semibold text-gray-900">
                    ${installment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(installment.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-700 font-medium">Total Purchase:</span>
            <span className="text-lg font-bold text-gray-900">
              ${schedule.totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-700 font-medium">Number of Payments:</span>
            <span className="text-base font-semibold text-gray-900">
              {schedule.installmentCount}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-700 font-medium">Payment Amount:</span>
            <span className="text-base font-semibold text-gray-900">
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
