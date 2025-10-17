/**
 * ArchiveErrorBoundary Component Tests
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting)
 * Tasks: T110
 *
 * Tests error boundary behavior for corrupted archives.
 */

import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ArchiveErrorBoundary } from '../ArchiveErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>Child component</div>;
}

// Suppress console.error for these tests since we expect errors
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ArchiveErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <div>Test content</div>
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Archive Loading Error/i)).toBeInTheDocument();
  });

  it('displays archive name when provided', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary archiveName="October 2025">
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText(/October 2025/i)).toBeInTheDocument();
  });

  it('detects corrupted data errors with JSON-related messages', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="JSON parse error" />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText(/Archive Data Error/i)).toBeInTheDocument();
    expect(screen.getByText(/corrupted or contains invalid data/i)).toBeInTheDocument();
  });

  it('detects validation errors', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="validation failed for archive schema" />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText(/Archive Data Error/i)).toBeInTheDocument();
    expect(screen.getByText(/corrupted or contains invalid data/i)).toBeInTheDocument();
  });

  it('provides navigation back to archives', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    const backLink = screen.getByText('Back to Archives');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/archives');
  });

  it('provides try again button', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('displays helpful suggestion for persistent errors', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText(/delete this archive from the archive list/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <BrowserRouter>
        <ArchiveErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ArchiveErrorBoundary>
      </BrowserRouter>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
