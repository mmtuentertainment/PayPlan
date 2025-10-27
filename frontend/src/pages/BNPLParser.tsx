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
import { ProviderBadge } from '../components/bnpl/ProviderBadge';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Modern Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-5xl" role="img" aria-label="Email icon">
              📧
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              BNPL Email Parser
            </h1>
          </div>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Paste your BNPL purchase confirmation emails to automatically extract payment
            schedules. Supports <span className="font-semibold">6 major providers</span>:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <ProviderBadge provider="klarna" />
            <ProviderBadge provider="affirm" />
            <ProviderBadge provider="afterpay" />
            <ProviderBadge provider="sezzle" />
            <ProviderBadge provider="zip" />
            <ProviderBadge provider="paypal" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Email Input Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <BNPLEmailInput
              onParse={handleParse}
              isParsing={isParsing}
              hasParsedData={!!parsedSchedule}
            />
          </div>

          {/* Error Message - Modern Alert */}
          {parseError && (
            <div
              className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 shadow-md animate-slide-down"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl" role="img" aria-label="Error">
                  ❌
                </span>
                <div className="flex-1">
                  <h3 className="text-red-900 font-bold text-lg mb-2">
                    Parsing Failed
                  </h3>
                  <p className="text-red-800 text-sm leading-relaxed">{parseError}</p>
                  <button
                    onClick={() => setParseError(null)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium text-sm"
                    aria-label="Dismiss error message"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Schedule Preview */}
          {parsedSchedule && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-fade-in">
              <PaymentSchedulePreview
                schedule={parsedSchedule}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* Saved Schedules - Modern Grid */}
          {savedSchedules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    💰 Saved Payment Schedules
                  </h2>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">
                    {savedSchedules.length}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-4">
                {savedSchedules.map((schedule) => {
                  const nextPayment = schedule.installments.find(
                    (inst) => new Date(inst.dueDate) >= new Date()
                  );

                  return (
                    <div
                      key={schedule.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
                    >
                      {/* Header with Merchant and Delete Button */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900">
                              {schedule.merchant}
                            </h3>
                            <ProviderBadge provider={schedule.provider} />
                          </div>
                          <div className="text-2xl font-extrabold text-blue-600">
                            ${schedule.totalAmount.toFixed(2)}
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              total
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors duration-200 font-semibold text-sm border-2 border-red-200 hover:border-red-300"
                          aria-label={`Delete ${schedule.merchant} payment schedule`}
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      {/* Payment Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                            Installments
                          </span>
                          <div className="text-lg font-bold text-gray-900 mt-1">
                            {schedule.installmentCount} × $
                            {(schedule.totalAmount / schedule.installmentCount).toFixed(
                              2
                            )}
                          </div>
                        </div>
                        {nextPayment && (
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                              Next Payment
                            </span>
                            <div className="text-lg font-bold text-gray-900 mt-1">
                              ${nextPayment.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              📅 {formatDate(nextPayment.dueDate)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* APR Warning */}
                      {schedule.apr !== undefined && schedule.apr > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 border border-yellow-300">
                          <span role="img" aria-label="Warning">
                            ⚠️
                          </span>
                          <span className="font-semibold">
                            APR: {schedule.apr}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State - Modern Design */}
          {savedSchedules.length === 0 && !parsedSchedule && !parseError && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center animate-fade-in">
              <div className="mb-6">
                <span className="text-7xl" role="img" aria-label="Empty inbox">
                  📭
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No Payment Schedules Yet
              </h3>
              <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                Paste a BNPL purchase confirmation email above to get started.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>✨</span>
                <span>Supports 6 major BNPL providers</span>
                <span>✨</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
