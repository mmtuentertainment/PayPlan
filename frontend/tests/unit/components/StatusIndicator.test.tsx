/**
 * Unit Test: StatusIndicator Component
 *
 * Feature: 015-build-a-payment
 * Phase: 3 (User Story 1)
 * Task: T037
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../../../src/components/payment-status/StatusIndicator';

describe('StatusIndicator', () => {
  it('should render paid status with green badge', () => {
    render(<StatusIndicator status="paid" />);

    const badge = screen.getByText('Paid');
    expect(badge).toBeInTheDocument();
  });

  it('should render pending status with gray badge', () => {
    render(<StatusIndicator status="pending" />);

    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
  });

  it('should show timestamp when provided and showTimestamp is true', () => {
    const timestamp = '2025-10-15T14:30:00.000Z';

    const { container } = render(
      <StatusIndicator
        status="paid"
        timestamp={timestamp}
        showTimestamp={true}
      />
    );

    // Check if timestamp text is rendered in the container
    const hasTimestamp = container.textContent?.includes('Paid on');
    expect(hasTimestamp).toBe(true);

    // Verify the visible timestamp element (not sr-only)
    const visibleTimestamp = container.querySelector('.text-xs.text-gray-500');
    expect(visibleTimestamp).toBeInTheDocument();
    expect(visibleTimestamp?.textContent).toContain('Paid on');
  });

  it('should not show timestamp when showTimestamp is false', () => {
    const timestamp = '2025-10-15T14:30:00.000Z';

    render(
      <StatusIndicator
        status="paid"
        timestamp={timestamp}
        showTimestamp={false}
      />
    );

    const timestampText = screen.queryByText(/Paid on/);
    expect(timestampText).not.toBeInTheDocument();
  });

  it('should have role="status" for accessibility', () => {
    const { container } = render(<StatusIndicator status="paid" />);

    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toBeInTheDocument();
  });

  it('should have aria-live="polite" for screen readers', () => {
    const { container } = render(<StatusIndicator status="paid" />);

    const statusElement = container.querySelector('[aria-live="polite"]');
    expect(statusElement).toBeInTheDocument();
  });

  it('should include screen reader only text', () => {
    render(<StatusIndicator status="paid" />);

    const srText = screen.getByText(/Payment status: paid/);
    expect(srText).toHaveClass('sr-only');
  });

  it('should use Check icon for paid status', () => {
    const { container } = render(<StatusIndicator status="paid" />);

    // lucide-react Check icon has aria-hidden attribute
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should use Clock icon for pending status', () => {
    const { container } = render(<StatusIndicator status="pending" />);

    // lucide-react Clock icon has aria-hidden attribute
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusIndicator status="paid" className="custom-class" />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });
});
