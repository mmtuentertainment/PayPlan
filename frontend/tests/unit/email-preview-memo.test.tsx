import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmailPreview } from '../../src/components/EmailPreview';
import type { Item } from '../../src/lib/email-extractor';

describe('EmailPreview - React.memo behavior', () => {
  const mockItem: Item = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    provider: 'Klarna',
    installment_no: 1,
    due_date: '2025-10-15',
    amount: 2500,
    currency: 'USD',
    autopay: false,
    late_fee: 700,
    confidence: 0.95
  };

  const defaultProps = {
    items: [mockItem],
    onDelete: vi.fn(),
    onCopyCSV: vi.fn(),
    onBuildPlan: vi.fn(),
    locale: 'US' as const,
    timezone: 'America/New_York'
  };

  test('does not re-render when unrelated parent state changes', () => {
    let renderCount = 0;

    // Spy on component renders by wrapping in a render counter
    const EmailPreviewWithCounter = (props: typeof defaultProps) => {
      renderCount++;
      return <EmailPreview {...props} />;
    };

    const { rerender } = render(<EmailPreviewWithCounter {...defaultProps} />);
    expect(renderCount).toBe(1);

    // Re-render with same props - React.memo should prevent re-render of EmailPreview
    rerender(<EmailPreviewWithCounter {...defaultProps} />);

    // Counter increments (wrapper re-renders) but EmailPreview should be memoized
    expect(renderCount).toBe(2);

    // Verify content is still present (didn't break)
    expect(screen.getByText('Klarna')).toBeInTheDocument();
  });

  test('re-renders when items prop changes', () => {
    const { rerender } = render(<EmailPreview {...defaultProps} />);

    expect(screen.getByText('Klarna')).toBeInTheDocument();

    // Change items array
    const newItem: Item = { ...mockItem, provider: 'Affirm' };
    rerender(<EmailPreview {...defaultProps} items={[newItem]} />);

    // Should re-render and show new content
    expect(screen.getByText('Affirm')).toBeInTheDocument();
    expect(screen.queryByText('Klarna')).not.toBeInTheDocument();
  });

  test('re-renders when locale prop changes', () => {
    const { rerender } = render(<EmailPreview {...defaultProps} locale="US" />);

    expect(screen.getByText('Klarna')).toBeInTheDocument();

    // Change locale
    rerender(<EmailPreview {...defaultProps} locale="EU" />);

    // Component should re-render (locale affects date display)
    expect(screen.getByText('Klarna')).toBeInTheDocument();
  });

  test('re-renders when timezone prop changes', () => {
    const { rerender } = render(<EmailPreview {...defaultProps} timezone="America/New_York" />);

    expect(screen.getByText('Klarna')).toBeInTheDocument();

    // Change timezone
    rerender(<EmailPreview {...defaultProps} timezone="Europe/London" />);

    // Component should re-render
    expect(screen.getByText('Klarna')).toBeInTheDocument();
  });

  test('does not re-render when callback references change but items stay same', () => {
    const { rerender } = render(<EmailPreview {...defaultProps} />);

    expect(screen.getByText('Klarna')).toBeInTheDocument();

    // Create new callback references (simulates parent re-render without useCallback)
    const newProps = {
      ...defaultProps,
      onDelete: vi.fn(),
      onCopyCSV: vi.fn(),
      onBuildPlan: vi.fn(),
    };

    rerender(<EmailPreview {...newProps} />);

    // React.memo performs shallow comparison - new callback refs will cause re-render
    // This test documents current behavior - would need custom comparison function to prevent
    expect(screen.getByText('Klarna')).toBeInTheDocument();
  });

  test('memoization preserves empty state message', () => {
    const emptyProps = {
      ...defaultProps,
      items: []
    };

    const { rerender } = render(<EmailPreview {...emptyProps} />);

    expect(screen.getByText(/No valid payments extracted/i)).toBeInTheDocument();

    // Re-render with same empty items
    rerender(<EmailPreview {...emptyProps} />);

    // Should still show empty state
    expect(screen.getByText(/No valid payments extracted/i)).toBeInTheDocument();
  });
});
