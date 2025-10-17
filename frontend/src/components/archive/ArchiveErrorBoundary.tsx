/**
 * ArchiveErrorBoundary Component
 *
 * Feature: 016-build-a-payment-archive
 * Phase: 8 (Polish & Cross-Cutting)
 * Tasks: T110
 *
 * Specialized error boundary for archive-specific errors.
 * Handles corrupted archive data and provides recovery options.
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  archiveName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary for archive components
 *
 * Catches and handles:
 * - Corrupted archive data (JSON parsing errors)
 * - Schema validation errors
 * - Render errors in archive components
 *
 * Provides user-friendly recovery options:
 * - Return to archive list
 * - Report issue (future feature)
 * - Retry loading
 *
 * @example
 * ```tsx
 * <ArchiveErrorBoundary archiveName="October 2025">
 *   <ArchiveDetailView />
 * </ArchiveErrorBoundary>
 * ```
 */
export class ArchiveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ArchiveErrorBoundary caught an error:', {
      error,
      errorInfo,
      archiveName: this.props.archiveName,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset error state to try rendering again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { archiveName } = this.props;
      const { error } = this.state;

      // Determine error type for better messaging
      const isCorruptedData = error?.message?.includes('JSON') ||
                              error?.message?.includes('parse') ||
                              error?.message?.includes('validation');

      const errorTitle = isCorruptedData
        ? 'Archive Data Error'
        : 'Archive Loading Error';

      const errorMessage = isCorruptedData
        ? 'This archive appears to be corrupted or contains invalid data. The archive may need to be deleted and recreated.'
        : 'An unexpected error occurred while loading this archive.';

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="max-w-4xl mx-auto p-6"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            {/* Error icon and title */}
            <div className="flex items-start mb-4">
              <svg
                className="w-8 h-8 text-red-500 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-800 mb-2">
                  {errorTitle}
                </h2>
                {archiveName && (
                  <p className="text-sm text-red-700 mb-2">
                    Archive: <strong>{archiveName}</strong>
                  </p>
                )}
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-4 p-4 bg-white rounded border border-red-200">
                <summary className="cursor-pointer font-semibold text-red-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                  {error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <Link
                to="/archives"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Archives
              </Link>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>

            {/* Help text */}
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-red-700">
                <strong>Suggestion:</strong> If this error persists, you may need to delete this
                archive from the archive list. Your other archives and current payment
                data are not affected.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
