import { Button } from './ui/button';
import type { Item } from '../lib/email-extractor';

interface EmailPreviewProps {
  items: Item[];
  onDelete: (index: number) => void;
  onCopyCSV: () => void;
  onBuildPlan: () => void;
}

export function EmailPreview({ items, onDelete, onCopyCSV, onBuildPlan }: EmailPreviewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No valid payments extracted. Check Issues below.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          Extracted Payments ({items.length})
        </h3>
        <Button variant="outline" size="sm" onClick={onCopyCSV}>
          Copy as CSV
        </Button>
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

      <Button onClick={onBuildPlan} className="w-full">
        Build Plan
      </Button>
    </div>
  );
}
