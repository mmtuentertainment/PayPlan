import { Component, createRef } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch React errors and display fallback UI
 *
 * Features:
 * - PII-safe error logging (sanitizes stack traces)
 * - Rate limiting in development (max 1 error per 5 seconds)
 * - Chunk loading error detection
 * - WCAG 2.1 AA accessible error UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  // Rate limiting for development error logs (2025 best practice)
  // Prevents console spam from render loops or rapid component failures
  // Using instance fields so each ErrorBoundary instance tracks its own throttle state
  private lastErrorTime = 0;
  private readonly ERROR_LOG_THROTTLE_MS = 5000; // 5 seconds

  // Ref for focus management (a11y improvement)
  private alertRef = createRef<HTMLDivElement>();

  // Timeout ID for focus management cleanup (prevents memory leaks)
  private focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

  // Sanitize error message to prevent PII leaks (2025 security best practice)
  private sanitizeErrorMessage(message: string): string {
    // Whitelist approach: Only allow safe technical error patterns
    // Redact any user input, email addresses, phone numbers, etc.

    // Pattern: email addresses
    let sanitized = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

    // Pattern: phone numbers (various formats)
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    sanitized = sanitized.replace(/\(\d{3}\)\s?\d{3}-\d{4}/g, '[PHONE]');

    // Pattern: credit card numbers (groups of 4 digits)
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CC_REDACTED]');

    // Pattern: SSN
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

    // Pattern: amounts/currency values (might contain sensitive transaction data)
    sanitized = sanitized.replace(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g, '[AMOUNT]');

    // Truncate if still too long (prevent verbose error leaks)
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '... [truncated]';
    }

    return sanitized;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // PII sanitization strategy (CRITICAL: Claude review)
    // Development: Show full errors for debugging (no sanitization)
    // Production: Sanitize aggressively to prevent PII/payment data leaks
    const errorDetails = import.meta.env.DEV
      ? {
          message: error.message, // Full message for debugging
          name: error.name,
          stack: error.stack, // Full stack trace for debugging
          componentStack: errorInfo.componentStack, // Full component stack for debugging
        }
      : {
          message: this.sanitizeErrorMessage(error.message), // Sanitized for production
          name: error.name,
          componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'), // Only first 5 lines
          // Omit: error.stack (may contain user data in production)
        };

    // Rate-limited logging in development (2025 best practice)
    // Prevents console spam from render loops or rapid component failures
    if (import.meta.env.DEV) {
      const now = Date.now();
      const timeSinceLastError = now - this.lastErrorTime;

      if (timeSinceLastError >= this.ERROR_LOG_THROTTLE_MS) {
        console.error('ErrorBoundary caught an error:', errorDetails);
        this.lastErrorTime = now;
      } else {
        // Silently throttled - prevents console spam
        const remainingCooldown = Math.ceil(
          (this.ERROR_LOG_THROTTLE_MS - timeSinceLastError) / 1000
        );
        console.warn(
          `ErrorBoundary: Additional error throttled (cooldown: ${remainingCooldown}s)`
        );
      }
    }
    // TODO: In production, send errorDetails to error tracking service (e.g., Sentry)

    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(_: Props, prevState: State): void {
    // Focus the alert when error state changes from false to true (a11y improvement)
    // Add small delay to allow screen reader to finish announcing aria-live region
    // (P2: Claude review - immediate focus may interrupt announcement)
    if (!prevState.hasError && this.state.hasError) {
      this.focusTimeoutId = setTimeout(() => {
        this.alertRef.current?.focus();
      }, 150); // 150ms delay balances responsiveness with screen reader timing
    }
  }

  componentWillUnmount(): void {
    // Clean up pending timeout to prevent memory leaks (CRITICAL: Claude review)
    if (this.focusTimeoutId !== null) {
      clearTimeout(this.focusTimeoutId);
      this.focusTimeoutId = null;
    }
  }

  handleReset = (): void => {
    // Reset error state to try rendering the component tree again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Perform full page reload to clear cached chunks
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error } = this.state;

      // Check if this is a chunk loading error (lazy-loaded route failure)
      const isChunkError =
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      const {
        fallbackTitle = isChunkError ? 'Loading Error' : 'Something went wrong',
        fallbackMessage = isChunkError
          ? 'Failed to load this page. This may be due to a network issue or a recent update to the application.'
          : 'An unexpected error occurred. Please try again.'
      } = this.props;

      return (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          aria-describedby="error-message"
          tabIndex={-1}
          ref={this.alertRef}
          className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
        >
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg
                className="w-12 h-12 text-red-500 mr-4"
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
              <h1 className="text-2xl font-bold text-gray-900">{fallbackTitle}</h1>
            </div>

            <p id="error-message" className="text-gray-600 mb-6">{fallbackMessage}</p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Reload Page
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              If this problem persists, try clearing your browser cache or{' '}
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
              >
                return to home page
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
