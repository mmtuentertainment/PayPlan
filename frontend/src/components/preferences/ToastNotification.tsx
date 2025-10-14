/**
 * ToastNotification - Accessible toast notification component
 *
 * Feature: 012-user-preference-management
 * Task: T027
 * Contract: PreferenceUIComponents.contract.md (L66-L114)
 *
 * Purpose: Provide transient feedback for preference save/reset actions.
 * Auto-dismisses after configurable duration (default: 3 seconds).
 *
 * Accessibility: WCAG 2.1 AA compliant
 * - ARIA live regions (polite for success, assertive for errors)
 * - Keyboard dismissal (Escape key)
 * - Screen reader announcements without focus changes
 *
 * @see spec.md FR-005 (user feedback requirements)
 * @see spec.md Clarification Q4 (toast + inline indicators)
 * @see research.md Section 3 (WCAG 2.1 AA accessibility)
 */

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { TOAST_DURATION_MS } from '../../lib/preferences/constants';

export interface ToastNotificationProps {
  /** Message to display */
  message: string;
  /** Toast type (affects ARIA attributes and styling) */
  type: 'success' | 'error';
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss duration in milliseconds (default: 3000ms) */
  duration?: number;
}

/**
 * Toast notification with auto-dismiss and ARIA live region support.
 *
 * @example
 * ```tsx
 * <ToastNotification
 *   message="Preferences saved successfully"
 *   type="success"
 *   onDismiss={() => setToast(null)}
 *   duration={3000}
 * />
 * ```
 */
export function ToastNotification({
  message,
  type,
  onDismiss,
  duration = TOAST_DURATION_MS,
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Memoized dismiss handler to prevent stale closures
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Match animation duration
  }, [onDismiss]);

  // Slide-in animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration <= 0) return; // Skip auto-dismiss if duration is 0

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleDismiss]);

  if (!isVisible) {
    return null;
  }

  // ARIA attributes based on type
  const role = type === 'success' ? 'status' : 'alert';
  const ariaLive = type === 'success' ? 'polite' : 'assertive';

  // Styling based on type
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';
  const buttonHoverColor =
    type === 'success'
      ? 'text-green-400 hover:text-green-600 focus:ring-green-500'
      : 'text-red-400 hover:text-red-600 focus:ring-red-500';

  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      data-testid="toast-notification"
    >
      <div
        className={`${bgColor} border ${borderColor} rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-[500px]`}
      >
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} aria-hidden="true" />
        <p className={`text-sm ${textColor} flex-1`}>{message}</p>
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${buttonHoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 rounded`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
