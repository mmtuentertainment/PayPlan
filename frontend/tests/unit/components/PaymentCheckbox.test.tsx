/**
 * Unit Test: PaymentCheckbox Component
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T036
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentCheckbox } from '../../../src/components/payment-status/PaymentCheckbox';

describe('PaymentCheckbox', () => {
  const paymentId = '550e8400-e29b-41d4-a716-446655440000';

  it('should render checked when status is paid', () => {
    const onToggle = vi.fn();
    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="paid"
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should render unchecked when status is pending', () => {
    const onToggle = vi.fn();
    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should call onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith(paymentId);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible (Space key)', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await user.keyboard(' '); // Space key

    expect(onToggle).toHaveBeenCalledWith(paymentId);
  });

  it('should have proper aria-label', () => {
    const onToggle = vi.fn();
    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Mark payment as paid');
  });

  it('should be disabled when disabled prop is true', () => {
    const onToggle = vi.fn();
    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
        disabled
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not call onToggle when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PaymentCheckbox
        paymentId={paymentId}
        status="pending"
        onToggle={onToggle}
        disabled
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onToggle).not.toHaveBeenCalled();
  });
});
