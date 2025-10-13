import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getConsent, setConsent, isDNT, CONSENT_KEY } from "@/lib/telemetry";

// Timing constants for auto-dismiss feature (FR-011 through FR-034)
const COUNTDOWN_SECONDS = 10;      // Initial countdown duration
const ANNOUNCE_DELAY_MS = 1500;    // Screen reader announcement delay (NVDA/VoiceOver)
const ANIMATION_MS = 250;          // Exit animation duration (FR-014.4)

/**
 * Accessible consent banner for telemetry opt-in/opt-out
 *
 * Shown only when:
 * - DNT is not active
 * - Consent state is "unset"
 *
 * Accessibility:
 * - role="dialog" with aria-labelledby and aria-describedby
 * - Focus trap (Tab/Shift+Tab stays inside)
 * - Escape key closes as "opt_out"
 * - Keyboard-accessible buttons
 * - Auto-dismiss after 10 seconds (pauses on hover/focus/tab-switch)
 */
export function TelemetryConsentBanner() {
  // Determine initial visibility immediately (not in useEffect)
  const shouldShow = !isDNT() && getConsent() === "unset";
  const [visible, setVisible] = useState(shouldShow);
  const [announcementText, setAnnouncementText] = useState<string>("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss state (Feature 011-009-008-0020)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isTabHidden, setTabHidden] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // Track dismissal animation
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hasUserInteractedRef = useRef(false); // Track if user has manually interacted
  const isDismissingRef = useRef(false); // Prevent race condition with concurrent dismissals

  const isPaused = isHovered || (hasFocus && hasUserInteractedRef.current) || isTabHidden;

  // Shared dismiss helper - ensures focus restoration for all dismissal paths (WCAG)
  const dismissBanner = useCallback(() => {
    if (isDismissingRef.current) return; // Guard against concurrent dismissals
    isDismissingRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      // Restore focus to previous element (FR-029 to FR-031)
      previousFocusRef.current?.focus();
    }, ANNOUNCE_DELAY_MS);
  }, []);

  const handleAutoDismiss = useCallback(() => {
    setAnnouncementText("Analytics banner auto-dismissed");
    setConsent("opt_out");
    dismissBanner();
  }, [dismissBanner]);

  const handleAllow = useCallback(() => {
    setAnnouncementText("Anonymous analytics enabled");
    setConsent("opt_in");
    dismissBanner();
  }, [dismissBanner]);

  const handleDecline = useCallback(() => {
    setAnnouncementText("Analytics disabled");
    setConsent("opt_out");
    dismissBanner();
  }, [dismissBanner]);

  // Capture previous focus on mount for restoration
  useEffect(() => {
    if (visible) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [visible]);

  // Countdown timer (T014) - only runs when not paused
  useEffect(() => {
    if (!visible || isPaused) return;

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [visible, isPaused]);

  // Auto-dismiss trigger (T015) - when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && visible) {
      handleAutoDismiss();
    }
  }, [countdown, visible, handleAutoDismiss]);

  // Screen reader milestone announcements (T019) - 10s, 5s only (not 0, handled by auto-dismiss)
  useEffect(() => {
    if ([10, 5].includes(countdown) && visible) {
      setAnnouncementText(`Auto-dismissing in ${countdown} seconds`);
    }
  }, [countdown, visible]);

  // Page Visibility API (T016) - pause on tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track focus within dialog (T016) - pause countdown when user interacts
  useEffect(() => {
    if (!visible) return;

    const handleFocusIn = (e: FocusEvent) => {
      if (dialogRef.current?.contains(e.target as Node)) {
        setHasFocus(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!dialogRef.current) return;
      const next = e.relatedTarget as Node | null;
      if (!next || !dialogRef.current.contains(next)) {
        setHasFocus(false);
      }
    };

    // Track user keyboard/mouse interaction (set flag once, then remove listener)
    const handleUserInteraction = () => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        // Remove listeners after first interaction
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('mousedown', handleUserInteraction);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('mousedown', handleUserInteraction);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('mousedown', handleUserInteraction);
    };
  }, [visible]);

  // Cross-tab consent synchronization (FR-017.4)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue) {
        // Another tab changed consent - dismiss with focus restoration
        if (e.newValue === 'opt_in' || e.newValue === 'opt_out') {
          dismissBanner();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dismissBanner]);

  useEffect(() => {
    if (visible && firstButtonRef.current) {
      // Focus first button when banner appears
      const id = setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(id);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes as "opt_out"
      if (e.key === "Escape") {
        handleDecline();
        return;
      }

      // Tab key focus trap
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if at first element, wrap to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if at last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, handleDecline]);

  if (!visible) return null;

  // FR-014.4 & FR-014.5: Exit animation with prefers-reduced-motion support
  const prefersReducedMotion = (() => {
    try {
      return typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false; // Default to animations enabled
    }
  })();

  const animationStyle: CSSProperties = {
    opacity: isExiting ? 0 : 1,
    // Only animate transform if user hasn't requested reduced motion
    transform: isExiting && !prefersReducedMotion ? 'translateY(-100%)' : 'translateY(0)',
    transition: prefersReducedMotion
      ? `opacity ${ANIMATION_MS}ms ease-out` // Reduced motion: only fade
      : `opacity ${ANIMATION_MS}ms ease-out, transform ${ANIMATION_MS}ms ease-out`, // Full animation
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="telemetry-title"
      aria-describedby="telemetry-desc"
      className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 shadow-md"
      style={animationStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1">
          <h2 id="telemetry-title" className="text-sm font-semibold text-blue-900 mb-1">
            Help improve this tool
          </h2>
          <p id="telemetry-desc" className="text-sm text-blue-800">
            Share anonymous usage data to help us fix bugs faster. We never collect CSV content,
            provider names, or amounts. Only error types and usage patterns.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            {isPaused ? (
              <span>Paused</span>
            ) : (
              <span>Auto-dismissing in {countdown}s...</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            ref={firstButtonRef}
            type="button"
            onClick={handleAllow}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Allow anonymous analytics"
          >
            Allow analytics
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Decline analytics"
          >
            Decline
          </button>
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcementText}
      </div>
    </div>
  );
}
