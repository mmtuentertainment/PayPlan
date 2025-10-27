/**
 * BNPL Email Parser Page
 *
 * Main page for the BNPL email parser feature.
 * Allows users to:
 * 1. Paste BNPL purchase confirmation emails
 * 2. Parse emails to extract payment schedules
 * 3. Preview and edit extracted data
 * 4. Save payment schedules to localStorage
 * 5. View all saved schedules
 *
 * This is the CORE differentiator for PayPlan - no other budgeting app has this.
 */

import { useState } from 'react';
import { BNPLEmailInput } from '../components/bnpl/BNPLEmailInput';
import { PaymentSchedulePreview } from '../components/bnpl/PaymentSchedulePreview';
import type { BNPLPaymentSchedule } from '../types/bnpl';
import { parseBNPLEmail } from '../lib/bnpl-parser';
import '../lib/parsers'; // Import to register all parsers
import {
  savePaymentSchedule,
  getAllPaymentSchedules,
  deletePaymentSchedule,
} from '../lib/storage/bnpl-storage';

export function BNPLParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedSchedule, setParsedSchedule] = useState<BNPLPaymentSchedule | null>(
    null
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState<BNPLPaymentSchedule[]>(
    () => getAllPaymentSchedules()
  );

  const handleParse = async (emailContent: string) => {
    setIsParsing(true);
    setParseError(null);
    setParsedSchedule(null);

    // Simulate async parsing (could be async if we add server-side parsing later)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = parseBNPLEmail(emailContent);

    setIsParsing(false);

    if (result.success && result.schedule) {
      setParsedSchedule(result.schedule);
    } else {
      setParseError(result.error || 'Failed to parse email');
    }
  };

  const handleSave = async (schedule: BNPLPaymentSchedule) => {
    setIsSaving(true);

    // Simulate async save
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = savePaymentSchedule(schedule);

    setIsSaving(false);

    if (result.success) {
      // Refresh saved schedules list
      setSavedSchedules(getAllPaymentSchedules());
      // Clear preview
      setParsedSchedule(null);
      setParseError(null);
    } else {
      setParseError(result.error || 'Failed to save payment schedule');
    }
  };

  const handleCancel = () => {
    setParsedSchedule(null);
    setParseError(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment schedule?')) {
      deletePaymentSchedule(id);
      setSavedSchedules(getAllPaymentSchedules());
    }
  };

  // Format date for display
  const formatDate = (isoDate: string): string => {
    // Parse date in local timezone to avoid timezone shift
    // new Date("2025-11-01") treats as UTC, which shifts to previous day in local timezone
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format provider name
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">BNPL Email Parser</h1>
          <p className="mt-2 text-gray-600">
            Paste BNPL purchase confirmation emails to automatically extract payment
            schedules. Supports Klarna, Affirm, Afterpay, Sezzle, Zip, and PayPal
            Credit.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Email Input */}
          <div className="bg-white rounded-lg shadow p-6">
            <BNPLEmailInput
              onParse={handleParse}
              isParsing={isParsing}
              hasParsedData={!!parsedSchedule}
            />
          </div>

          {/* Parse Error */}
          {parseError && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
              aria-live="assertive"
            >
              <h3 className="text-red-800 font-medium mb-2">Parsing Failed</h3>
              <p className="text-red-700 text-sm">{parseError}</p>
              <button
                onClick={() => setParseError(null)}
                className="mt-3 text-sm text-red-600 underline hover:text-red-800"
                aria-label="Dismiss error message"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Payment Schedule Preview */}
          {parsedSchedule && (
            <div className="bg-white rounded-lg shadow p-6">
              <PaymentSchedulePreview
                schedule={parsedSchedule}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* Saved Schedules List */}
          {savedSchedules.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Saved Payment Schedules ({savedSchedules.length})
              </h2>

              <div className="space-y-4">
                {savedSchedules.map((schedule) => {
                  const nextPayment = schedule.installments.find(
                    (inst) => new Date(inst.dueDate) >= new Date()
                  );

                  return (
                    <div
                      key={schedule.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {schedule.merchant}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {formatProvider(schedule.provider)}
                            </span>
                            <span className="text-sm text-gray-600">
                              ${schedule.totalAmount.toFixed(2)} total
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          aria-label={`Delete ${schedule.merchant} payment schedule`}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Payments:</span>
                          <span className="ml-2 font-medium">
                            {schedule.installmentCount} × $
                            {(schedule.totalAmount / schedule.installmentCount).toFixed(
                              2
                            )}
                          </span>
                        </div>
                        {nextPayment && (
                          <div>
                            <span className="text-gray-600">Next Payment:</span>
                            <span className="ml-2 font-medium">
                              ${nextPayment.amount.toFixed(2)} on{' '}
                              {formatDate(nextPayment.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {schedule.apr !== undefined && schedule.apr > 0 && (
                        <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                          APR: {schedule.apr}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {savedSchedules.length === 0 && !parsedSchedule && !parseError && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Payment Schedules Yet
              </h3>
              <p className="text-gray-600">
                Paste a BNPL purchase confirmation email above to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
