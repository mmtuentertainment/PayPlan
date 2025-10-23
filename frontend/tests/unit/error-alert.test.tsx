import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorAlert, ErrorList } from '../../src/components/ErrorAlert';

describe('ErrorAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('displays error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('has correct ARIA role', () => {
    render(<ErrorAlert message="Error message" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('shows error icon', () => {
    const { container } = render(<ErrorAlert message="Error" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('dismisses on X button click', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Error message" onDismiss={onDismiss} autoDismissMs={0} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss error/i });
    await userEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    vi.useFakeTimers(); // Restore fake timers for other tests
  });

  test('auto-dismisses after specified milliseconds', async () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Error message" onDismiss={onDismiss} autoDismissMs={5000} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Fast-forward time by 5 seconds using act()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // onDismiss callback should have been called
    expect(onDismiss).toHaveBeenCalledTimes(1);

    // Component should have removed itself from DOM
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });

  test('does not auto-dismiss if autoDismissMs is 0', () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Error message" onDismiss={onDismiss} autoDismissMs={0} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Fast-forward time by 10 seconds
    vi.advanceTimersByTime(10000);

    // Should still be visible
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('uses default 5000ms auto-dismiss when not specified', async () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Error message" onDismiss={onDismiss} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Fast-forward by 4999ms - should still be visible
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Fast-forward by 1ms more (total 5000ms) - should dismiss
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('clears timeout on unmount', () => {
    const onDismiss = vi.fn();
    const { unmount } = render(<ErrorAlert message="Error" onDismiss={onDismiss} autoDismissMs={5000} />);

    unmount();

    // Fast-forward time after unmount
    vi.advanceTimersByTime(5000);

    // onDismiss should not be called
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('ErrorList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('renders nothing when errors array is empty', () => {
    const { container } = render(<ErrorList errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders multiple error alerts', () => {
    const errors = ['Error 1', 'Error 2', 'Error 3'];
    render(<ErrorList errors={errors} />);

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.getByText('Error 3')).toBeInTheDocument();
  });

  test('calls onDismiss with correct index', async () => {
    vi.useRealTimers(); // Use real timers for userEvent
    const onDismiss = vi.fn();
    const errors = ['Error 1', 'Error 2'];
    render(<ErrorList errors={errors} onDismiss={onDismiss} autoDismissMs={0} />);

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss error/i });

    // Dismiss the second error (index 1)
    await userEvent.click(dismissButtons[1]);

    expect(onDismiss).toHaveBeenCalledWith(1);
    vi.useFakeTimers(); // Restore fake timers
  });

  test('passes autoDismissMs to ErrorAlert components', async () => {
    const onDismiss = vi.fn();
    const errors = ['Error 1', 'Error 2'];
    render(<ErrorList errors={errors} onDismiss={onDismiss} autoDismissMs={3000} />);

    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();

    // Fast-forward by 3000ms using act()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // Both should be dismissed
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(onDismiss).toHaveBeenCalledWith(0);
    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  test('renders with spacing between errors', () => {
    const errors = ['Error 1', 'Error 2'];
    const { container } = render(<ErrorList errors={errors} />);

    const wrapper = container.querySelector('.space-y-2');
    expect(wrapper).toBeInTheDocument();
  });
});
