import { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessToastProps {
  message: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function SuccessToast({ message, onDismiss, autoDismissMs = 3000 }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setIsVisible(true);

    // Auto-dismiss timer
    if (autoDismissMs && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        // Inline handleDismiss to avoid dependency issues
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, 300); // Match animation duration
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      data-testid="success-toast"
    >
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-green-800 flex-1">{message}</p>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-green-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
          aria-label="Dismiss success message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
