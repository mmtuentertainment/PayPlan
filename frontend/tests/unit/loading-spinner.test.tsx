import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders spinner with default text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders spinner with custom text', () => {
    render(<LoadingSpinner text="Processing payment..." />);
    expect(screen.getByText('Processing payment...')).toBeInTheDocument();
  });

  test('renders spinner without text when text is empty', () => {
    render(<LoadingSpinner text="" />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('has correct ARIA role', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('has correct aria-live attribute', () => {
    const { container } = render(<LoadingSpinner />);
    const statusElement = container.querySelector('[role="status"]');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });

  test('has correct aria-label', () => {
    render(<LoadingSpinner text="Loading payments" />);
    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-label', 'Loading payments');
  });

  test('renders small size spinner', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');
  });

  test('renders medium size spinner (default)', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-3');
  });

  test('renders large size spinner', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
  });

  test('spinner has animation class', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toHaveClass('animate-spin');
  });

  test('spinner is visually styled correctly', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('[aria-hidden="true"]');
    expect(spinner).toHaveClass('rounded-full', 'border-gray-300', 'border-t-blue-600');
  });
});
