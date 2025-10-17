/**
 * DeleteArchiveDialog Component Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 7 (User Story 5 - Delete Old Archives)
 * Tasks: T095-T096
 *
 * Tests for delete confirmation dialog.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteArchiveDialog } from '../DeleteArchiveDialog';

describe('DeleteArchiveDialog', () => {
  it('should render with archive name', () => {
    render(
      <DeleteArchiveDialog
        archiveName="October 2025"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/October 2025/)).toBeInTheDocument();
    expect(screen.getByText(/Delete Archive/)).toBeInTheDocument();
  });

  it('should display warning message', () => {
    render(
      <DeleteArchiveDialog
        archiveName="Test Archive"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteArchiveDialog
        archiveName="Test Archive"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel deletion/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when Delete button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteArchiveDialog
        archiveName="Test Archive"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /Confirm deletion/i });
    await user.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when backdrop clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { container } = render(
      <DeleteArchiveDialog
        archiveName="Test Archive"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Click the backdrop (parent div)
    const backdrop = container.querySelector('[role="dialog"]');

    // CodeRabbit Fix: Assert backdrop exists before clicking (test fails if missing)
    expect(backdrop).not.toBeNull();
    expect(backdrop).toBeInTheDocument();

    await user.click(backdrop!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should have proper ARIA attributes', () => {
    render(
      <DeleteArchiveDialog
        archiveName="Test Archive"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');
  });
});
