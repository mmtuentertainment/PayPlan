import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailIssues } from '../../src/components/EmailIssues';
import type { Item, Issue } from '../../src/lib/email-extractor';

describe('EmailIssues - Low Confidence Detection', () => {
  test('shows low-confidence item in Issues when confidence < 0.6', () => {
    const items: Item[] = [{
      provider: 'Afterpay',
      installment_no: 1,
      due_date: '2025-10-20',
      amount: 3000,  // Integer cents ($30.00)
      currency: 'USD',
      autopay: false,
      late_fee: 500,  // Integer cents ($5.00)
      confidence: 0.35  // Low confidence
    }];

    render(<EmailIssues issues={[]} items={items} />);

    expect(screen.getByText(/Low confidence \(0.35\)/)).toBeInTheDocument();
  });

  test('does not show high-confidence items in Issues', () => {
    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($25.00)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($7.00)
      confidence: 1.0  // High confidence
    }];

    render(<EmailIssues issues={[]} items={items} />);

    // Component should render nothing (null)
    expect(screen.queryByText(/Issues/)).not.toBeInTheDocument();
  });

  test('redacts PII in low-confidence snippets', () => {
    const items: Item[] = [{
      provider: 'Afterpay',
      installment_no: 1,
      due_date: '2025-10-20',
      amount: 3000,  // Integer cents ($30.00)
      currency: 'USD',
      autopay: false,
      late_fee: 500,  // Integer cents ($5.00)
      confidence: 0.35
    }];

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

    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($25.00)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($7.00)
      confidence: 0.5  // Low confidence
    }];

    render(<EmailIssues issues={issues} items={items} />);

    // Should show both the original issue and the low-confidence warning
    expect(screen.getByText('Issues (2)')).toBeInTheDocument();
    expect(screen.getByText(/Provider not recognized/)).toBeInTheDocument();
    expect(screen.getByText(/Low confidence \(0.50\)/)).toBeInTheDocument();
  });

  test('shows field hints for low-confidence items', () => {
    const items: Item[] = [{
      provider: 'Afterpay',
      installment_no: 1,
      due_date: '',  // Missing date
      amount: 0,     // Missing amount
      currency: 'USD',
      autopay: false,
      late_fee: 500,  // Integer cents ($5.00)
      confidence: 0.35
    }];

    render(<EmailIssues issues={[]} items={items} />);

    const issueText = screen.getByText(/Low confidence/);
    expect(issueText.textContent).toContain('Due date not found');
    expect(issueText.textContent).toContain('Amount not found');
  });

  test('respects aria-live="polite" for accessibility', () => {
    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($25.00)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($7.00)
      confidence: 0.4
    }];

    const { container } = render(<EmailIssues issues={[]} items={items} />);

    const issuesContainer = container.querySelector('[aria-live="polite"]');
    expect(issuesContainer).toBeInTheDocument();
  });

  test('returns null when no issues and all items high confidence', () => {
    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($25.00)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($7.00)
      confidence: 0.95
    }];

    const { container } = render(<EmailIssues issues={[]} items={items} />);

    expect(container.firstChild).toBeNull();
  });
});
