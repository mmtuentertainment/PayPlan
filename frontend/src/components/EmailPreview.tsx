import { useState } from 'react';
import { Button } from './ui/button';
import type { Item } from '../lib/email-extractor';

interface EmailPreviewProps {
  items: Item[];
  onDelete: (index: number) => void;
  onCopyCSV: () => void;
  onBuildPlan: () => void;
}

export function EmailPreview({ items, onDelete, onCopyCSV, onBuildPlan }: EmailPreviewProps) {
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
              <th scope="col" className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.provider}-${item.installment_no}-${item.due_date}-${idx}`} className="border-b">
                <td className="p-2">{item.provider}</td>
                <td className="p-2">{item.installment_no}</td>
                <td className="p-2">{item.due_date}</td>
                <td className="p-2">${item.amount.toFixed(2)}</td>
                <td className="p-2">{item.autopay ? '✓' : '✗'}</td>
                <td className="p-2">${item.late_fee.toFixed(2)}</td>
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
            ))}
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
