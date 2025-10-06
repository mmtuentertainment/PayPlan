import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailIssues } from '../../src/components/EmailIssues';
import type { Item, Issue } from '../../src/lib/email-extractor';
import { createMockItem, LOW_CONFIDENCE_ITEM, HIGH_CONFIDENCE_ITEM, AFTERPAY_ITEM } from '../fixtures/mock-items';

describe('EmailIssues - Low Confidence Detection', () => {
  test('shows low-confidence item in Issues when confidence < 0.6', () => {
    const items: Item[] = [createMockItem({
      id: "test-uuid-1",
      provider: 'Afterpay',
      amount: 3000,
      late_fee: 500,
      confidence: 0.35
    })];

    render(<EmailIssues issues={[]} items={items} />);

    expect(screen.getByText(/Low confidence \(0.35\)/)).toBeInTheDocument();
  });

  test('does not show high-confidence items in Issues', () => {
    const items: Item[] = [HIGH_CONFIDENCE_ITEM];

    render(<EmailIssues issues={[]} items={items} />);

    // Component should render nothing (null)
    expect(screen.queryByText(/Issues/)).not.toBeInTheDocument();
  });

  test('redacts PII in low-confidence snippets', () => {
    const items: Item[] = [createMockItem({
      id: "test-uuid-3",
      provider: 'Afterpay',
      amount: 3000,
      late_fee: 500,
      confidence: 0.35
    })];

    render(<EmailIssues issues={[]} items={items} />);

    // Check that snippet exists and contains redacted amount
    const snippet = screen.getByText(/Afterpay #1/);
    expect(snippet).toBeInTheDocument();
    // Amount should be redacted to [AMOUNT] by redactPII
    expect(snippet.textContent).toContain('[AMOUNT]');
  });

  test('combines original issues with low-confidence items', () => {
    const issues: Issue[] = [{
      id: 'issue-1',
      reason: 'Provider not recognized',
      snippet: 'Some email snippet'
    }];

    const items: Item[] = [createMockItem({
      id: "test-uuid-4",
      confidence: 0.5  // Low confidence
    })];

    render(<EmailIssues issues={issues} items={items} />);

    // Should show both the original issue and the low-confidence warning
    expect(screen.getByText('Extraction Issues (2)')).toBeInTheDocument();
    expect(screen.getByText(/Provider not recognized/)).toBeInTheDocument();
    expect(screen.getByText(/Low confidence \(0.50\)/)).toBeInTheDocument();
  });

  test('shows field hints for low-confidence items', () => {
    const items: Item[] = [createMockItem({
      id: "test-uuid-5",
      provider: 'Afterpay',
      due_date: '',  // Missing date
      amount: 0,     // Missing amount
      late_fee: 500,
      confidence: 0.35
    })];

    render(<EmailIssues issues={[]} items={items} />);

    const issueText = screen.getByText(/Low confidence/);
    expect(issueText.textContent).toContain('Due date not found');
    expect(issueText.textContent).toContain('Amount not found');
  });

  test('displays errors with proper ARIA attributes', () => {
    const items: Item[] = [createMockItem({
      id: "test-uuid-6",
      confidence: 0.4
    })];

    render(<EmailIssues issues={[]} items={items} />);

    // ErrorAlert components have role="alert"
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  test('returns null when no issues and all items high confidence', () => {
    const items: Item[] = [createMockItem({
      id: "test-uuid-7",
      confidence: 0.95
    })];

    const { container } = render(<EmailIssues issues={[]} items={items} />);

    expect(container.firstChild).toBeNull();
  });
});
