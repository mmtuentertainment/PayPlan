/**
 * CreateArchiveDialog Component Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 3 (User Story 1 - Create Archive MVP)
 * Task: T041
 *
 * Tests for archive creation dialog component.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateArchiveDialog } from '../CreateArchiveDialog';
import type { PaymentRecord } from '@/types/csvExport';

describe('CreateArchiveDialog', () => {
  const mockPayments: PaymentRecord[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      provider: 'Test Provider',
      amount: 100.00,
      currency: 'USD',
      dueISO: '2025-10-15',
      autopay: false,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      provider: 'Another Provider',
      amount: 50.00,
      currency: 'USD',
      dueISO: '2025-10-20',
      autopay: true,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('T041: Success message', () => {
    it('should show success message after archive creation', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <CreateArchiveDialog
          payments={mockPayments}
          onSuccess={onSuccess}
        />
      );

      // Find and fill archive name input
      const nameInput = screen.getByLabelText(/archive name/i);
      await user.type(nameInput, 'October 2025');

      // Submit form
      const createButton = screen.getByRole('button', { name: /create archive/i });
      await user.click(createButton);

      // Wait for success message - look for Success title
      await waitFor(() => {
        const successTitle = screen.getByText('Success!');
        expect(successTitle).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should call onSuccess callback after archive creation', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      render(
        <CreateArchiveDialog
          payments={mockPayments}
          onSuccess={onSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/archive name/i);
      await user.type(nameInput, 'Test Archive');

      const createButton = screen.getByRole('button', { name: /create archive/i });
      await user.click(createButton);

      // Wait for success callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(expect.any(String));
      }, { timeout: 3000 });
    });
  });

  it('should display archive name input', () => {
    render(<CreateArchiveDialog payments={mockPayments} />);

    const input = screen.getByLabelText(/archive name/i);
    expect(input).toBeInTheDocument();
  });

  it('should display current tracking summary', () => {
    render(<CreateArchiveDialog payments={mockPayments} />);

    expect(screen.getByText(/current tracking summary/i)).toBeInTheDocument();
    expect(screen.getByText(/2 total payments/i)).toBeInTheDocument();
  });

  it('should display reset warning', () => {
    render(<CreateArchiveDialog payments={mockPayments} />);

    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/reset all current payment statuses/i)).toBeInTheDocument();
  });

  it('should disable create button when name is empty', () => {
    render(<CreateArchiveDialog payments={mockPayments} />);

    const createButton = screen.getByRole('button', { name: /create archive/i });
    expect(createButton).toBeDisabled();
  });

  it('should enable create button when name is entered', async () => {
    const user = userEvent.setup();
    render(<CreateArchiveDialog payments={mockPayments} />);

    const nameInput = screen.getByLabelText(/archive name/i);
    await user.type(nameInput, 'Test');

    const createButton = screen.getByRole('button', { name: /create archive/i });
    expect(createButton).not.toBeDisabled();
  });

  it('should complete archive creation successfully', async () => {
    const user = userEvent.setup();
    render(<CreateArchiveDialog payments={mockPayments} />);

    const nameInput = screen.getByLabelText(/archive name/i);
    await user.type(nameInput, 'Test Archive');

    const createButton = screen.getByRole('button', { name: /create archive/i });
    await user.click(createButton);

    // Should show success state after creation
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <CreateArchiveDialog
        payments={mockPayments}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should show error message when archive creation fails', async () => {
    const user = userEvent.setup();

    // Create archive with empty payments to trigger validation error
    render(<CreateArchiveDialog payments={[]} />);

    const nameInput = screen.getByLabelText(/archive name/i);
    await user.type(nameInput, 'Test Archive');

    const createButton = screen.getByRole('button', { name: /create archive/i });
    await user.click(createButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/no payments/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
