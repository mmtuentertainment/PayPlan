import { useState } from 'react';
import { Button } from './ui/button';
import { DateQuickFix } from './DateQuickFix';
import type { Item } from '../lib/email-extractor';
import type { DateLocale } from '../lib/date-parser';
import { formatCurrency } from '../lib/extraction/helpers/currency';

interface EmailPreviewProps {
  items: Item[];
  onDelete: (index: number) => void;
  onCopyCSV: () => void;
  onBuildPlan: () => void;
  onApplyFix?: (rowId: string, patch: { due_date: string }) => void;
  onUndoFix?: (rowId: string) => void;
  locale?: DateLocale;
  timezone?: string;
}

/**
 * Returns confidence level and styling based on score.
 * High: ≥0.8, Med: 0.6-0.79, Low: <0.6
 */
function getConfidenceLevel(score: number): { level: string; classes: string } {
  if (score >= 0.8) {
    return { level: 'High', classes: 'bg-green-100 text-green-800' };
  } else if (score >= 0.6) {
    return { level: 'Med', classes: 'bg-yellow-100 text-yellow-800' };
  } else {
    return { level: 'Low', classes: 'bg-red-100 text-red-800' };
  }
}

export function EmailPreview({ items, onDelete, onCopyCSV, onBuildPlan, onApplyFix, onUndoFix, locale = 'US', timezone = 'America/New_York' }: EmailPreviewProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No valid payments extracted. Check Issues below.
      </div>
    );
  }

  const handleCopyCSV = async () => {
    setIsCopying(true);
    setCopyFeedback(null);

    try {
      await onCopyCSV();
      setCopyFeedback('✓ Copied to clipboard');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('✗ Copy failed');
      setTimeout(() => setCopyFeedback(null), 3000);
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopyCSV();
    }
  };

  const handleBuildPlan = async () => {
    // Validation: ensure all required data is present
    const hasInvalidData = items.some(
      item => !item.provider || !item.due_date || item.amount === undefined
    );

    if (hasInvalidData) {
      alert('Some payment data is incomplete. Please check the extracted items.');
      return;
    }

    setIsBuilding(true);
    try {
      await onBuildPlan();
    } catch (err) {
      alert(`Failed to build plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          Extracted Payments ({items.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCSV}
            onKeyDown={handleCopyKeyDown}
            disabled={isCopying}
            aria-label="Copy payment data as CSV format to clipboard"
          >
            {isCopying ? 'Copying...' : 'Copy as CSV'}
          </Button>
          {copyFeedback && (
            <span className="text-sm" role="status" aria-live="polite">
              {copyFeedback}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Extracted payment information</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="text-left p-2">Provider</th>
              <th scope="col" className="text-left p-2">#</th>
              <th scope="col" className="text-left p-2">Due Date</th>
              <th scope="col" className="text-left p-2">Amount</th>
              <th scope="col" className="text-left p-2">Autopay</th>
              <th scope="col" className="text-left p-2">Late Fee</th>
              <th scope="col" className="text-left p-2">Confidence</th>
              <th scope="col" className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const { level, classes } = getConfidenceLevel(item.confidence);
              // Use UUID for stable row identifier (prevents React key instability)
              const rowId = item.id;
              const showQuickFix = item.confidence < 0.6 && onApplyFix && onUndoFix;

              return (
                <>
                  <tr key={rowId} className="border-b">
                    <td className="p-2">{item.provider}</td>
                    <td className="p-2">{item.installment_no}</td>
                    <td className="p-2">{item.due_date}</td>
                    <td className="p-2">{formatCurrency(item.amount, item.currency)}</td>
                    <td className="p-2">{item.autopay ? '✓' : '✗'}</td>
                    <td className="p-2">{formatCurrency(item.late_fee, item.currency)}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${classes}`}
                        aria-label={`Extraction confidence: ${level} (${item.confidence.toFixed(2)})`}
                      >
                        {level}
                      </span>
                    </td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(idx)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                  {showQuickFix && (
                    <tr key={`${rowId}-fix`}>
                      <td colSpan={8} className="p-2">
                        <DateQuickFix
                          rowId={rowId}
                          isoDate={item.due_date}
                          rawDueDate={item.raw_due_date}
                          timezone={timezone}
                          onFix={(dateISO) => onApplyFix(rowId, { due_date: dateISO })}
                          onUndo={() => onUndoFix(rowId)}
                          locale={locale}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button
        onClick={handleBuildPlan}
        className="w-full"
        disabled={isBuilding || items.length === 0}
        aria-label={`Build payment plan for ${items.length} payment${items.length !== 1 ? 's' : ''}`}
      >
        {isBuilding ? 'Building Plan...' : `Build Plan (${items.length})`}
      </Button>
    </div>
  );
}
