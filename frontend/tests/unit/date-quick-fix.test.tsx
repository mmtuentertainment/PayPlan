import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateQuickFix } from '../../src/components/DateQuickFix';

describe('DateQuickFix', () => {
  const mockOnFix = vi.fn();
  const mockOnUndo = vi.fn();
  const defaultProps = {
    rowId: 'Klarna-1-2026-01-02-0',
    isoDate: '2026-01-02',
    onFix: mockOnFix,
    onUndo: mockOnUndo,
    locale: 'US' as const
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component rendering', () => {
    test('renders all interactive elements', () => {
      render(<DateQuickFix {...defaultProps} />);

      expect(screen.getByText('Quick Fix:')).toBeInTheDocument();
      expect(screen.getByLabelText('Re-parse as US date format')).toBeInTheDocument();
      expect(screen.getByLabelText('Re-parse as EU date format')).toBeInTheDocument();
      expect(screen.getByLabelText('Manual date entry')).toBeInTheDocument();
      expect(screen.getByLabelText('Apply manual date')).toBeInTheDocument();
    });

    test('has correct ARIA attributes', () => {
      render(<DateQuickFix {...defaultProps} />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'date-fix-label-Klarna-1-2026-01-02-0');

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Re-parse functionality', () => {
    test('Re-parse US calls onFix with current ISO date', () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      expect(mockOnFix).toHaveBeenCalledWith('2026-01-02');
    });

    test('Re-parse EU calls onFix with current ISO date', () => {
      render(<DateQuickFix {...defaultProps} />);

      const euButton = screen.getByLabelText('Re-parse as EU date format');
      fireEvent.click(euButton);

      expect(mockOnFix).toHaveBeenCalledWith('2026-01-02');
    });

    test('Re-parse shows status message and undo button', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      await waitFor(() => {
        expect(screen.getByText('Re-parsed as US')).toBeInTheDocument();
        expect(screen.getByLabelText('Undo last fix')).toBeInTheDocument();
      });
    });
  });

  describe('Manual date entry', () => {
    test('accepts valid ISO date and calls onFix', () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry') as HTMLInputElement;
      const applyButton = screen.getByLabelText('Apply manual date');

      fireEvent.change(input, { target: { value: '2026-03-15' } });
      fireEvent.click(applyButton);

      expect(mockOnFix).toHaveBeenCalledWith('2026-03-15');
      expect(input.value).toBe(''); // Clears after apply
    });

    test('rejects date before 2020-01-01', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry');
      const applyButton = screen.getByLabelText('Apply manual date');

      fireEvent.change(input, { target: { value: '2019-12-31' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Date must be between 2020-01-01 and 2032-12-31')).toBeInTheDocument();
      });
      expect(mockOnFix).not.toHaveBeenCalled();
    });

    test('rejects date after 2032-12-31', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry');
      const applyButton = screen.getByLabelText('Apply manual date');

      fireEvent.change(input, { target: { value: '2033-01-01' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Date must be between 2020-01-01 and 2032-12-31')).toBeInTheDocument();
      });
      expect(mockOnFix).not.toHaveBeenCalled();
    });

    test('HTML5 date input prevents invalid formats', () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry') as HTMLInputElement;

      // HTML5 date inputs prevent invalid formats from being entered
      // This test verifies the input type is set correctly
      expect(input.type).toBe('date');
      expect(input).toHaveAttribute('min', '2020-01-01');
      expect(input).toHaveAttribute('max', '2032-12-31');
    });

    test('Apply button is disabled when input is empty', () => {
      render(<DateQuickFix {...defaultProps} />);

      const applyButton = screen.getByLabelText('Apply manual date');
      expect(applyButton).toBeDisabled();
    });

    test('shows "Date updated" message after successful manual fix', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry');
      const applyButton = screen.getByLabelText('Apply manual date');

      fireEvent.change(input, { target: { value: '2026-04-20' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Date updated')).toBeInTheDocument();
      });
    });
  });

  describe('Undo functionality', () => {
    test('Undo button appears after fix', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Undo last fix')).toBeInTheDocument();
      });
    });

    test('Undo button calls onUndo and disappears', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Undo last fix')).toBeInTheDocument();
      });

      const undoButton = screen.getByLabelText('Undo last fix');
      fireEvent.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.queryByLabelText('Undo last fix')).not.toBeInTheDocument();
      });
    });

    test('shows "Undo applied" message after undo', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      await waitFor(() => {
        const undoButton = screen.getByLabelText('Undo last fix');
        fireEvent.click(undoButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Undo applied')).toBeInTheDocument();
      });
    });
  });

  describe('Status message auto-clear', () => {
    test('status message disappears after 3 seconds', async () => {
      render(<DateQuickFix {...defaultProps} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      expect(screen.getByText('Re-parsed as US')).toBeInTheDocument();

      // Wait for message to auto-clear (3 seconds + buffer)
      await waitFor(
        () => {
          expect(screen.queryByText('Re-parsed as US')).not.toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });
  });

  describe('Edge cases', () => {
    test('handles missing isoDate gracefully', () => {
      const props = { ...defaultProps, isoDate: undefined };
      render(<DateQuickFix {...props} />);

      const usButton = screen.getByLabelText('Re-parse as US date format');
      fireEvent.click(usButton);

      // Should not call onFix if isoDate is missing
      expect(mockOnFix).not.toHaveBeenCalled();
    });

    test('accepts boundary dates (2020-01-01 and 2032-12-31)', () => {
      render(<DateQuickFix {...defaultProps} />);

      const input = screen.getByLabelText('Manual date entry');
      const applyButton = screen.getByLabelText('Apply manual date');

      // Test min boundary
      fireEvent.change(input, { target: { value: '2020-01-01' } });
      fireEvent.click(applyButton);
      expect(mockOnFix).toHaveBeenCalledWith('2020-01-01');

      mockOnFix.mockClear();

      // Test max boundary
      fireEvent.change(input, { target: { value: '2032-12-31' } });
      fireEvent.click(applyButton);
      expect(mockOnFix).toHaveBeenCalledWith('2032-12-31');
    });
  });
});
