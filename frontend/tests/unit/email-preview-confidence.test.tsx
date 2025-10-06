import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailPreview } from '../../src/components/EmailPreview';
import type { Item } from '../../src/lib/email-extractor';

describe('EmailPreview - Confidence Pills', () => {
  const mockOnDelete = vi.fn();
  const mockOnCopyCSV = vi.fn();
  const mockOnBuildPlan = vi.fn();

  test('renders High confidence pill for score >= 0.8', () => {
    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($2500 ÷ 100)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($700 ÷ 100)
      confidence: 1.0
    }];

    render(
      <EmailPreview
        items={items}
        onDelete={mockOnDelete}
        onCopyCSV={mockOnCopyCSV}
        onBuildPlan={mockOnBuildPlan}
      />
    );

    const pill = screen.getByText('High');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass('bg-green-100', 'text-green-800');
    expect(pill).toHaveAttribute('aria-label', 'Extraction confidence: High (1.00)');
  });

  test('renders Med confidence pill for score 0.6-0.79', () => {
    const items: Item[] = [{
      provider: 'Affirm',
      installment_no: 2,
      due_date: '2025-10-15',
      amount: 5000,  // Integer cents ($50.00)
      currency: 'USD',
      autopay: true,
      late_fee: 0,  // Integer cents ($0.00)
      confidence: 0.75
    }];

    render(
      <EmailPreview
        items={items}
        onDelete={mockOnDelete}
        onCopyCSV={mockOnCopyCSV}
        onBuildPlan={mockOnBuildPlan}
      />
    );

    const pill = screen.getByText('Med');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass('bg-yellow-100', 'text-yellow-800');
    expect(pill).toHaveAttribute('aria-label', 'Extraction confidence: Med (0.75)');
  });

  test('renders Low confidence pill for score < 0.6', () => {
    const items: Item[] = [{
      provider: 'Afterpay',
      installment_no: 1,
      due_date: '2025-10-20',
      amount: 3000,  // Integer cents ($3000 ÷ 100)
      currency: 'USD',
      autopay: false,
      late_fee: 500,  // Integer cents ($500 ÷ 100)
      confidence: 0.35
    }];

    render(
      <EmailPreview
        items={items}
        onDelete={mockOnDelete}
        onCopyCSV={mockOnCopyCSV}
        onBuildPlan={mockOnBuildPlan}
      />
    );

    const pill = screen.getByText('Low');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass('bg-red-100', 'text-red-800');
    expect(pill).toHaveAttribute('aria-label', 'Extraction confidence: Low (0.35)');
  });

  test('renders confidence column header', () => {
    const items: Item[] = [{
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-06',
      amount: 2500,  // Integer cents ($2500 ÷ 100)
      currency: 'USD',
      autopay: false,
      late_fee: 700,  // Integer cents ($700 ÷ 100)
      confidence: 1.0
    }];

    render(
      <EmailPreview
        items={items}
        onDelete={mockOnDelete}
        onCopyCSV={mockOnCopyCSV}
        onBuildPlan={mockOnBuildPlan}
      />
    );

    expect(screen.getByText('Confidence')).toBeInTheDocument();
  });

  test('renders empty state when no items', () => {
    render(
      <EmailPreview
        items={[]}
        onDelete={mockOnDelete}
        onCopyCSV={mockOnCopyCSV}
        onBuildPlan={mockOnBuildPlan}
      />
    );

    expect(screen.getByText('No valid payments extracted. Check Issues below.')).toBeInTheDocument();
  });
});
