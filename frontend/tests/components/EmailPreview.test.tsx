import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailPreview } from '../../src/components/EmailPreview';

vi.mock('../../src/components/DateQuickFix', () => ({
  DateQuickFix: ({ rowId, onFix, onUndo }: any) => (
    <div data-testid={`quick-fix-${rowId}`}>
      <button onClick={() => onFix('2025-11-01')}>Apply fix</button>
      <button onClick={() => onUndo()}>Undo fix</button>
    </div>
  )
}));

describe('EmailPreview', () => {
  const baseProps = {
    onDelete: vi.fn(),
    onCopyCSV: vi.fn(),
    onBuildPlan: vi.fn(),
    onApplyFix: vi.fn(),
    onUndoFix: vi.fn(),
    locale: 'US' as const,
    timezone: 'America/New_York'
  };

  const items = [
    {
      id: 'item-1',
      provider: 'Klarna',
      installment_no: 1,
      due_date: '2025-10-05',
      raw_due_date: 'October 5, 2025',
      amount: 120,
      currency: 'USD',
      autopay: true,
      late_fee: 10,
      confidence: 0.82
    },
    {
      id: 'item-low',
      provider: 'Affirm',
      installment_no: 2,
      due_date: '2025-10-06',
      raw_due_date: '2025-10-06',
      amount: 80,
      currency: 'USD',
      autopay: false,
      late_fee: 5,
      confidence: 0.4
    }
  ];

  it('calls onDelete with the correct index', () => {
    const onDelete = vi.fn();
    render(<EmailPreview {...baseProps} onDelete={onDelete} items={items} />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete payment/ });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it('renders quick fix controls for low-confidence items and propagates callbacks', () => {
    const onApplyFix = vi.fn();
    const onUndoFix = vi.fn();

    render(<EmailPreview {...baseProps} onApplyFix={onApplyFix} onUndoFix={onUndoFix} items={items} />);

    const quickFix = screen.getByTestId('quick-fix-item-low');
    expect(quickFix).toBeInTheDocument();

    fireEvent.click(screen.getByText('Apply fix'));
    expect(onApplyFix).toHaveBeenCalledWith('item-low', { due_date: '2025-11-01' });

    fireEvent.click(screen.getByText('Undo fix'));
    expect(onUndoFix).toHaveBeenCalledWith('item-low');
  });
});
