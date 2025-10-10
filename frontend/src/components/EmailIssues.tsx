import { useState } from 'react';
import type { Issue, Item } from '../lib/email-extractor';
import { redactPII } from '../lib/extraction/helpers/redaction';
import { ErrorList } from './ErrorAlert';

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
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

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

  // Format issues as error messages with snippet included
  const errorMessages = allIssues
    .map((issue, idx) => ({
      index: idx,
      message: issue.snippet
        ? `${issue.reason}\n"${issue.snippet}..."`
        : issue.reason
    }))
    .filter(({ index }) => !dismissedIndices.has(index))
    .map(({ message }) => message);

  const handleDismiss = (index: number) => {
    setDismissedIndices(prev => new Set(prev).add(index));
  };

  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6" role="region" aria-labelledby="issues-title">
      <h3 id="issues-title" className="font-medium text-red-700 mb-3">
        Extraction Issues ({errorMessages.length})
      </h3>
      <ErrorList errors={errorMessages} onDismiss={handleDismiss} autoDismissMs={10000} />
    </div>
  );
}
