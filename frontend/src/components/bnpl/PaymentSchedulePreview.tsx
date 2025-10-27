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

  // Format provider name for display
  const formatProvider = (provider: string): string => {
    const providers: Record<string, string> = {
      klarna: 'Klarna',
      affirm: 'Affirm',
      afterpay: 'Afterpay',
      sezzle: 'Sezzle',
      zip: 'Zip',
      'paypal-credit': 'PayPal Credit',
    };
    return providers[provider] || provider;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Review Payment Schedule
        </h2>
        <p className="text-sm text-blue-800">
          We extracted the following payment schedule. Please review and edit if
          needed, then click "Save Payment Schedule" to add it to your dashboard.
        </p>
      </div>

      {/* Provider Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Provider:</span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {formatProvider(schedule.provider)}
        </span>
      </div>

      {/* Editable Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="merchant-input" className="block text-sm font-medium mb-1">
            Merchant Name
          </label>
          <Input
            id="merchant-input"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g., Target, Best Buy"
            aria-label="Merchant name (editable)"
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="total-amount-input" className="block text-sm font-medium mb-1">
            Total Amount
          </label>
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
          />
        </div>
      </div>

      {/* Payment Schedule (Read-Only) */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Payment Schedule ({schedule.installmentCount} payments)
        </h3>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedule.installments.map((installment) => (
                <tr key={installment.installmentNumber}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {installment.installmentNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
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
      </div>

      {/* APR (if applicable) */}
      {schedule.apr !== undefined && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>APR:</strong> {schedule.apr}%
            {schedule.apr > 0 &&
              ' (This loan includes interest charges. Total repayment may exceed purchase amount.)'}
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-medium mb-2">Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Purchase:</span>
            <span className="font-medium">${schedule.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Number of Payments:</span>
            <span className="font-medium">{schedule.installmentCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="font-medium">
              ${(schedule.totalAmount / schedule.installmentCount).toFixed(2)} each
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !merchant.trim() || parseFloat(totalAmount) <= 0}
          className="flex-1"
          aria-busy={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Payment Schedule'}
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
