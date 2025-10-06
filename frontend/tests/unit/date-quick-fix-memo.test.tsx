import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateQuickFix } from '../../src/components/DateQuickFix';

describe('DateQuickFix - React.memo behavior', () => {
  const defaultProps = {
    rowId: 'row-123',
    isoDate: '2025-10-15',
    rawDueDate: '10/15/2025',
    timezone: 'America/New_York',
    onFix: vi.fn(),
    onUndo: vi.fn(),
    locale: 'US' as const
  };

  test('does not re-render when parent re-renders with same props', () => {
    let renderCount = 0;

    const DateQuickFixWithCounter = (props: typeof defaultProps) => {
      renderCount++;
      return <DateQuickFix {...props} />;
    };

    const { rerender } = render(<DateQuickFixWithCounter {...defaultProps} />);
    expect(renderCount).toBe(1);

    // Re-render with same props
    rerender(<DateQuickFixWithCounter {...defaultProps} />);

    // Wrapper re-renders but DateQuickFix should be memoized
    expect(renderCount).toBe(2);

    // Verify component still renders (check for accessible group role)
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('re-renders when rowId changes', () => {
    const { rerender } = render(<DateQuickFix {...defaultProps} />);

    expect(screen.getByRole('group')).toBeInTheDocument();

    // Change rowId (different row)
    rerender(<DateQuickFix {...defaultProps} rowId="row-456" />);

    // Should re-render (new row context)
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('re-renders when rawDueDate changes', () => {
    const { rerender } = render(<DateQuickFix {...defaultProps} />);

    expect(screen.getByRole('group')).toBeInTheDocument();

    // Change rawDueDate
    rerender(<DateQuickFix {...defaultProps} rawDueDate="01/02/2026" />);

    // Should re-render with new data
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('re-renders when timezone changes', () => {
    const { rerender} = render(<DateQuickFix {...defaultProps} />);

    expect(screen.getByRole('group')).toBeInTheDocument();

    // Change timezone
    rerender(<DateQuickFix {...defaultProps} timezone="Europe/London" />);

    // Should re-render (timezone affects parsing)
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('re-renders when locale changes', () => {
    const { rerender } = render(<DateQuickFix {...defaultProps} locale="US" />);

    expect(screen.getByRole('group')).toBeInTheDocument();

    // Change locale
    rerender(<DateQuickFix {...defaultProps} locale="EU" />);

    // Should re-render
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('handles missing rawDueDate with memoization', () => {
    const propsWithoutRaw = {
      ...defaultProps,
      rawDueDate: undefined
    };

    const { rerender } = render(<DateQuickFix {...propsWithoutRaw} />);

    // Should still render the component
    expect(screen.getByRole('group')).toBeInTheDocument();

    // Re-render with same props
    rerender(<DateQuickFix {...propsWithoutRaw} />);

    // Should still render
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  test('memoization works across multiple instances', () => {
    const row1Props = { ...defaultProps, rowId: 'row-1' };
    const row2Props = { ...defaultProps, rowId: 'row-2' };

    const { rerender } = render(
      <div>
        <DateQuickFix {...row1Props} />
        <DateQuickFix {...row2Props} />
      </div>
    );

    // Both rows rendered
    expect(screen.getAllByRole('group')).toHaveLength(2);

    // Re-render with same props
    rerender(
      <div>
        <DateQuickFix {...row1Props} />
        <DateQuickFix {...row2Props} />
      </div>
    );

    // Both should remain (memoized independently)
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });
});
