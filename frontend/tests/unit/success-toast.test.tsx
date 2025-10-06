import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuccessToast } from '../../src/components/SuccessToast';

describe('SuccessToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('renders success message', () => {
    render(<SuccessToast message="Payment saved successfully" />);
    expect(screen.getByText('Payment saved successfully')).toBeInTheDocument();
  });

  test('has correct ARIA role', () => {
    render(<SuccessToast message="Success" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('has correct aria-live attribute', () => {
    const { container } = render(<SuccessToast message="Success" />);
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });

  test('shows success icon', () => {
    const { container } = render(<SuccessToast message="Success" />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  test('dismisses on X button click', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    const onDismiss = vi.fn();
    render(<SuccessToast message="Success message" onDismiss={onDismiss} autoDismissMs={0} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss success message/i });
    await userEvent.click(dismissButton);

    // Wait for exit animation (300ms)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useFakeTimers(); // Restore fake timers
  });

  test('auto-dismisses after 3 seconds (default)', async () => {
    const onDismiss = vi.fn();
    render(<SuccessToast message="Success message" onDismiss={onDismiss} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward time by 3 seconds + animation time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after specified milliseconds', async () => {
    const onDismiss = vi.fn();
    render(<SuccessToast message="Success message" onDismiss={onDismiss} autoDismissMs={5000} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward time by 5 seconds + animation time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5300);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not auto-dismiss if autoDismissMs is 0', async () => {
    const onDismiss = vi.fn();
    render(<SuccessToast message="Success message" onDismiss={onDismiss} autoDismissMs={0} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Fast-forward time by 10 seconds
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Should still be visible
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('clears timeout on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<SuccessToast message="Success" onDismiss={onDismiss} autoDismissMs={3000} />);

    unmount();

    // Fast-forward time after unmount
    vi.advanceTimersByTime(3300);

    // onDismiss should not be called
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('has slide-in animation classes', () => {
    const { container } = render(<SuccessToast message="Success" />);
    const toast = container.querySelector('[data-testid="success-toast"]');
    expect(toast).toHaveClass('translate-x-0', 'opacity-100');
  });

  test('applies exit animation classes when dismissing', async () => {
    vi.useRealTimers();
    const { container } = render(<SuccessToast message="Success" autoDismissMs={0} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss success message/i });
    await userEvent.click(dismissButton);

    const toast = container.querySelector('[data-testid="success-toast"]');
    expect(toast).toHaveClass('translate-x-full', 'opacity-0');
    vi.useFakeTimers();
  });

  test('is positioned fixed at bottom-right', () => {
    const { container } = render(<SuccessToast message="Success" />);
    const toast = container.querySelector('[data-testid="success-toast"]');
    expect(toast).toHaveClass('fixed', 'bottom-4', 'right-4', 'z-50');
  });
});
