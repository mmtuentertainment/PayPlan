import type { Issue, Item } from '../lib/email-extractor';
import { redactPII } from '../lib/redact';

interface EmailIssuesProps {
  issues: Issue[];
  items?: Item[];
}

/**
 * Generates field hints for low-confidence items based on missing signals
 */
function getFieldHints(item: Item): string[] {
  const hints: string[] = [];

  // Approximate which signals are missing based on confidence
  // Provider is always present (min 0.35), so check other fields
  if (!item.due_date || item.due_date === '') hints.push('Due date not found');
  if (!item.amount || item.amount === 0) hints.push('Amount not found');
  if (item.installment_no === 1 && item.confidence < 0.95) hints.push('Installment number unclear');
  if (!item.autopay && item.confidence < 1.0) hints.push('Autopay status unclear');

  return hints.length > 0 ? hints : ['Incomplete extraction'];
}

export function EmailIssues({ issues, items = [] }: EmailIssuesProps) {
  // Detect low-confidence items (confidence < 0.6)
  const lowConfidenceItems = items.filter(item => item.confidence < 0.6);

  // Combine original issues with low-confidence warnings
  const allIssues = [
    ...issues,
    ...lowConfidenceItems.map((item, idx) => {
      const hints = getFieldHints(item);
      const snippet = `${item.provider} #${item.installment_no} - ${item.due_date || 'unknown'} - $${item.amount}`;
      return {
        id: `low-conf-${idx}`,
        reason: `Low confidence (${item.confidence.toFixed(2)}): ${hints.join(', ')}`,
        snippet: redactPII(snippet)
      };
    })
  ];

  if (allIssues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6" role="status" aria-live="polite">
      <h3 className="font-medium text-yellow-700 mb-2">
        Issues ({allIssues.length})
      </h3>
      <div className="space-y-2">
        {allIssues.map((issue) => (
          <div
            key={issue.id}
            role="group"
            aria-label={`Extraction issue: ${issue.reason}`}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ {issue.reason}
            </p>
            {issue.snippet && (
              <p className="text-xs text-gray-600 mt-1 font-mono" aria-describedby={`snippet-${issue.id}`}>
                <span id={`snippet-${issue.id}`}>"{issue.snippet}..."</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
