import { useState, useEffect } from 'react';
import { XCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function ErrorAlert({ message, onDismiss, autoDismissMs = 5000 }: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3"
      data-testid="error-alert"
    >
      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-800">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ErrorListProps {
  errors: string[];
  onDismiss?: (index: number) => void;
  autoDismissMs?: number;
}

export function ErrorList({ errors, onDismiss, autoDismissMs = 5000 }: ErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <ErrorAlert
          key={index}
          message={error}
          onDismiss={() => onDismiss?.(index)}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
}
