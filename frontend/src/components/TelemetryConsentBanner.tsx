import { useCallback, useEffect, useRef, useState } from "react";
import { getConsent, setConsent, isDNT } from "@/lib/telemetry";

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
 */
export function TelemetryConsentBanner() {
  // Determine initial visibility immediately (not in useEffect)
  const shouldShow = !isDNT() && getConsent() === "unset";
  const [visible, setVisible] = useState(shouldShow);
  const [announcementText, setAnnouncementText] = useState<string>("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const handleAllow = useCallback(() => {
    setAnnouncementText("Anonymous analytics enabled");
    setConsent("opt_in");
    // Delay hiding to allow screen reader announcement (1500ms for NVDA/VoiceOver)
    setTimeout(() => setVisible(false), 1500);
  }, []);

  const handleDecline = useCallback(() => {
    setAnnouncementText("Analytics disabled");
    setConsent("opt_out");
    // Delay hiding to allow screen reader announcement (1500ms for NVDA/VoiceOver)
    setTimeout(() => setVisible(false), 1500);
  }, []);

  useEffect(() => {
    if (visible && firstButtonRef.current) {
      // Focus first button when banner appears
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 100);
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

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="telemetry-title"
      aria-describedby="telemetry-desc"
      className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 shadow-md"
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
